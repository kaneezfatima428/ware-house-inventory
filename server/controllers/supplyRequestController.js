import SupplyRequest from '../models/SupplyRequest.js';
import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';

/**
 * @desc    Submit a supply request
 * @route   POST /api/supply-requests
 * @access  Private (Supplier, Admin)
 */
export const createSupplyRequest = async (req, res, next) => {
  try {
    const { product: productId, warehouse: warehouseId, quantity, note, supplier: supplierId } = req.body;

    const qty = Number(quantity);
    if (!productId || !warehouseId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, warehouse ID, and a valid quantity (> 0) are required.'
      });
    }

    // Role check: supplier submits for themselves; admin can specify supplier
    let assignedSupplier = req.user._id;
    if (req.user.role === 'admin' && supplierId) {
      assignedSupplier = supplierId;
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    }

    const supplyRequest = await SupplyRequest.create({
      supplier: assignedSupplier,
      product: productId,
      warehouse: warehouseId,
      quantity: qty,
      note: note || '',
      status: 'Pending'
    });

    const populated = await SupplyRequest.findById(supplyRequest._id)
      .populate('supplier', 'name email phone')
      .populate('product', 'name sku price imageUrl')
      .populate('warehouse', 'name location');

    res.status(201).json({
      success: true,
      message: 'Stock supply request submitted successfully.',
      supplyRequest: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get supply requests
 * @route   GET /api/supply-requests
 * @access  Private (Suppliers see own; Admin/Warehouse Managers see relevant)
 */
export const getSupplyRequests = async (req, res, next) => {
  try {
    const { status, warehouse } = req.query;
    const query = {};

    if (req.user.role === 'supplier') {
      // Suppliers see only their own supply requests
      query.supplier = req.user._id;
    } else if (req.user.role === 'warehouseManager') {
      // Managers see requests for assigned warehouses
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      query.warehouse = { $in: assignedIds };
    }

    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;

    const requests = await SupplyRequest.find(query)
      .populate('supplier', 'name email phone')
      .populate('product', 'name sku category price imageUrl')
      .populate('warehouse', 'name location')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      supplyRequests: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single supply request by ID
 * @route   GET /api/supply-requests/:id
 * @access  Private
 */
export const getSupplyRequestById = async (req, res, next) => {
  try {
    const supplyRequest = await SupplyRequest.findById(req.params.id)
      .populate('supplier', 'name email phone')
      .populate('product', 'name sku category price imageUrl')
      .populate('warehouse', 'name location')
      .populate('reviewedBy', 'name email role');

    if (!supplyRequest) {
      return res.status(404).json({ success: false, message: 'Supply request not found.' });
    }

    // Role checks
    if (req.user.role === 'supplier' && supplyRequest.supplier._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own supply requests.' });
    }

    res.status(200).json({
      success: true,
      supplyRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or Reject supply request (Approval automatically increments stock & logs transaction)
 * @route   PUT /api/supply-requests/:id/status
 * @access  Private (Admin or assigned Warehouse Manager)
 */
export const updateSupplyRequestStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Approved' or 'Rejected'."
      });
    }

    const supplyRequest = await SupplyRequest.findById(req.params.id);
    if (!supplyRequest) {
      return res.status(404).json({ success: false, message: 'Supply request not found.' });
    }

    // Role check for warehouseManager
    if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      if (!assignedIds.includes(supplyRequest.warehouse.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only review supply requests for your assigned warehouses.'
        });
      }
    }

    // Check if already reviewed
    if (supplyRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Supply request has already been reviewed with status '${supplyRequest.status}'. Cannot change again.`
      });
    }

    if (status === 'Approved') {
      // 1. Increment Stock in the designated warehouse
      await Stock.findOneAndUpdate(
        { product: supplyRequest.product, warehouse: supplyRequest.warehouse },
        { $inc: { quantity: supplyRequest.quantity } },
        { upsert: true, new: true, runValidators: true }
      );

      // 2. Create Stock-In transaction
      await StockTransaction.create({
        product: supplyRequest.product,
        warehouse: supplyRequest.warehouse,
        transactionType: 'stock-in',
        quantity: supplyRequest.quantity,
        note: `Approved supply request #${supplyRequest._id}${note ? ' - ' + note : ''}`,
        performedBy: req.user._id,
        date: new Date()
      });
    }

    supplyRequest.status = status;
    supplyRequest.reviewedBy = req.user._id;
    if (note) supplyRequest.note = note;
    await supplyRequest.save();

    const updated = await SupplyRequest.findById(supplyRequest._id)
      .populate('supplier', 'name email phone')
      .populate('product', 'name sku')
      .populate('warehouse', 'name location')
      .populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Supply request successfully ${status.toLowerCase()}.${status === 'Approved' ? ' Stock quantity incremented and stock-in transaction logged.' : ''}`,
      supplyRequest: updated
    });
  } catch (error) {
    next(error);
  }
};
