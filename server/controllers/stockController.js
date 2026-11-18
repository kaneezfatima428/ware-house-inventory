import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';

/**
 * Helper to ensure a warehouseManager is assigned to the specified warehouse
 */
const verifyWarehouseManagerAssignment = (user, warehouseId) => {
  if (user.role === 'admin') return true;
  if (user.role === 'warehouseManager') {
    const assigned = (user.assignedWarehouses || []).map((w) =>
      (w._id || w).toString()
    );
    return assigned.includes(warehouseId.toString());
  }
  return false;
};

/**
 * @desc    Receive Stock (Stock In)
 * @route   POST /api/stock/in
 * @access  Private (Admin or assigned Warehouse Manager only)
 */
export const stockIn = async (req, res, next) => {
  try {
    const { product: productId, warehouse: warehouseId, quantity, note } = req.body;

    const qty = Number(quantity);
    if (!productId || !warehouseId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, warehouse ID, and a positive quantity (> 0) are required.'
      });
    }

    // Role check: warehouse manager must be assigned to this warehouse
    if (!verifyWarehouseManagerAssignment(req.user, warehouseId)) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied: You are not assigned to manage this warehouse. You can only record stock-in for your assigned warehouses.'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found.'
      });
    }

    // Atomically upsert stock record
    const updatedStock = await Stock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, runValidators: true }
    ).populate('product', 'name sku category price lowStockLimit')
     .populate('warehouse', 'name location');

    // Create stock-in transaction
    const transaction = await StockTransaction.create({
      product: productId,
      warehouse: warehouseId,
      transactionType: 'stock-in',
      quantity: qty,
      note: note || `Stock received: +${qty} units`,
      performedBy: req.user._id,
      date: new Date()
    });

    const populatedTransaction = await StockTransaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('warehouse', 'name location')
      .populate('performedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Successfully received ${qty} units of '${product.name}' into '${warehouse.name}'.`,
      stock: updatedStock,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove Stock (Stock Out)
 * @route   POST /api/stock/out
 * @access  Private (Admin or assigned Warehouse Manager only)
 */
export const stockOut = async (req, res, next) => {
  try {
    const { product: productId, warehouse: warehouseId, quantity, note } = req.body;

    const qty = Number(quantity);
    if (!productId || !warehouseId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, warehouse ID, and a positive quantity (> 0) are required.'
      });
    }

    // Role check: warehouse manager must be assigned to this warehouse
    if (!verifyWarehouseManagerAssignment(req.user, warehouseId)) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied: You are not assigned to manage this warehouse. You can only record stock-out for your assigned warehouses.'
      });
    }

    // Check existing stock
    const existingStock = await Stock.findOne({
      product: productId,
      warehouse: warehouseId
    }).populate('product', 'name sku').populate('warehouse', 'name');

    if (!existingStock || existingStock.quantity < qty) {
      const available = existingStock ? existingStock.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Requested: ${qty}, Available: ${available} units.`
      });
    }

    // Deduct quantity
    existingStock.quantity -= qty;
    await existingStock.save();

    // Create stock-out transaction
    const transaction = await StockTransaction.create({
      product: productId,
      warehouse: warehouseId,
      transactionType: 'stock-out',
      quantity: qty,
      note: note || `Stock removed: -${qty} units`,
      performedBy: req.user._id,
      date: new Date()
    });

    const populatedTransaction = await StockTransaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('warehouse', 'name location')
      .populate('performedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Successfully removed ${qty} units of '${existingStock.product?.name}' from '${existingStock.warehouse?.name}'. Remaining: ${existingStock.quantity}`,
      stock: existingStock,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock inventory (Filterable by warehouse & product)
 * @route   GET /api/stock
 * @access  Private
 */
export const getStock = async (req, res, next) => {
  try {
    const { warehouse, product } = req.query;
    const query = {};

    // If Warehouse Manager, restrict to their assigned warehouses
    if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );

      if (warehouse) {
        if (!assignedIds.includes(warehouse)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Warehouse is not among your assigned warehouses.'
          });
        }
        query.warehouse = warehouse;
      } else {
        query.warehouse = { $in: assignedIds };
      }
    } else if (warehouse) {
      query.warehouse = warehouse;
    }

    if (product) {
      query.product = product;
    }

    const stocks = await Stock.find(query)
      .populate('product', 'name sku category price lowStockLimit imageUrl')
      .populate('warehouse', 'name location capacity')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: stocks.length,
      stocks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get low stock products (quantity <= product.lowStockLimit)
 * @route   GET /api/stock/low
 * @access  Private
 */
export const getLowStock = async (req, res, next) => {
  try {
    const query = {};

    // Warehouse manager restriction
    if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      query.warehouse = { $in: assignedIds };
    }

    const stocks = await Stock.find(query)
      .populate('product', 'name sku category price lowStockLimit imageUrl')
      .populate('warehouse', 'name location');

    // Filter stocks where stock quantity <= product.lowStockLimit
    const lowStockItems = stocks.filter(
      (item) => item.product && item.quantity <= (item.product.lowStockLimit ?? 5)
    );

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock transactions history
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { warehouse, product, transactionType } = req.query;
    const query = {};

    // Warehouse manager restriction
    if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );

      if (warehouse) {
        if (!assignedIds.includes(warehouse)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Warehouse is not among your assigned warehouses.'
          });
        }
        query.warehouse = warehouse;
      } else {
        query.warehouse = { $in: assignedIds };
      }
    } else if (warehouse) {
      query.warehouse = warehouse;
    }

    if (product) {
      query.product = product;
    }

    if (transactionType) {
      query.transactionType = transactionType;
    }

    const transactions = await StockTransaction.find(query)
      .populate('product', 'name sku category price')
      .populate('warehouse', 'name location')
      .populate('performedBy', 'name email role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transfer Stock between warehouses (Bonus Challenge)
 * @route   POST /api/stock/transfer
 * @access  Private (Admin or assigned Warehouse Manager)
 */
export const transferStock = async (req, res, next) => {
  try {
    const { product: productId, sourceWarehouse, targetWarehouse, quantity, note } = req.body;
    const qty = Number(quantity);

    if (!productId || !sourceWarehouse || !targetWarehouse || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, source warehouse, target warehouse, and quantity (> 0) are required.'
      });
    }

    if (sourceWarehouse.toString() === targetWarehouse.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Source and target warehouses must be different.'
      });
    }

    // Role verification for source warehouse
    if (!verifyWarehouseManagerAssignment(req.user, sourceWarehouse)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to manage the source warehouse.'
      });
    }

    // Check available stock in source warehouse
    const srcStock = await Stock.findOne({
      product: productId,
      warehouse: sourceWarehouse
    });

    if (!srcStock || srcStock.quantity < qty) {
      const avail = srcStock ? srcStock.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in source warehouse. Available: ${avail}, Requested: ${qty}`
      });
    }

    // 1. Deduct from source warehouse
    srcStock.quantity -= qty;
    await srcStock.save();

    await StockTransaction.create({
      product: productId,
      warehouse: sourceWarehouse,
      transactionType: 'stock-out',
      quantity: qty,
      note: `Transfer to warehouse #${targetWarehouse}${note ? ' - ' + note : ''}`,
      performedBy: req.user._id,
      date: new Date()
    });

    // 2. Increment in target warehouse
    const tgtStock = await Stock.findOneAndUpdate(
      { product: productId, warehouse: targetWarehouse },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, runValidators: true }
    );

    await StockTransaction.create({
      product: productId,
      warehouse: targetWarehouse,
      transactionType: 'stock-in',
      quantity: qty,
      note: `Transfer received from warehouse #${sourceWarehouse}${note ? ' - ' + note : ''}`,
      performedBy: req.user._id,
      date: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${qty} units between warehouses.`,
      sourceStock: srcStock,
      targetStock: tgtStock
    });
  } catch (error) {
    next(error);
  }
};

