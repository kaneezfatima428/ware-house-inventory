import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import Warehouse from '../models/Warehouse.js';

// Helper to generate unique order number (e.g. ORD-20261118-8472)
const generateOrderNumber = () => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${randomSuffix}`;
};

/**
 * @desc    Create a sales order
 * @route   POST /api/orders
 * @access  Private (Sales Representative, Admin)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { customerName, customerPhone, warehouse: warehouseId, products } = req.body;

    if (!customerName || !customerPhone || !warehouseId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, warehouse ID, and a non-empty products list are required.'
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

    let totalAmount = 0;
    const validatedProducts = [];

    // Verify each product and validate current stock availability
    for (const item of products) {
      const productId = item.product?._id || item.product;
      const requestedQty = Number(item.quantity);

      if (!productId || isNaN(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must contain a valid product and a positive quantity (> 0).'
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID '${productId}' does not exist.`
        });
      }

      // Check stock availability in the designated warehouse
      const stock = await Stock.findOne({
        product: productId,
        warehouse: warehouseId
      });

      const availableQty = stock ? stock.quantity : 0;
      if (availableQty < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Stock validation failed: Insufficient stock for '${product.name}' in '${warehouse.name}'. Available: ${availableQty}, Requested: ${requestedQty}. Order cannot be placed beyond available stock.`
        });
      }

      const itemPrice = item.price !== undefined ? Number(item.price) : product.price;
      const lineTotal = itemPrice * requestedQty;
      totalAmount += lineTotal;

      validatedProducts.push({
        product: product._id,
        quantity: requestedQty,
        price: itemPrice
      });
    }

    let orderNumber = generateOrderNumber();
    // Safety check for unique order number
    while (await Order.findOne({ orderNumber })) {
      orderNumber = generateOrderNumber();
    }

    const order = await Order.create({
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      products: validatedProducts,
      totalAmount,
      warehouse: warehouseId,
      createdBy: req.user._id,
      status: 'Pending'
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('products.product', 'name sku category price imageUrl')
      .populate('warehouse', 'name location')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Order #${order.orderNumber} created successfully in 'Pending' status.`,
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orders (Sales reps see only their own; Admin/Warehouse Managers see relevant)
 * @route   GET /api/orders
 * @access  Private
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, warehouse, orderNumber } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user.role === 'salesRepresentative') {
      // Sales Representatives see only their own orders
      query.createdBy = req.user._id;
    } else if (req.user.role === 'warehouseManager') {
      // Warehouse Managers see orders for their assigned warehouses
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      query.warehouse = { $in: assignedIds };
    }

    if (status) {
      query.status = status;
    }

    if (warehouse) {
      query.warehouse = warehouse;
    }

    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('products.product', 'name sku category price imageUrl')
      .populate('warehouse', 'name location')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name sku category price imageUrl')
      .populate('warehouse', 'name location manager')
      .populate('createdBy', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Role verification
    if (req.user.role === 'salesRepresentative') {
      if (order.createdBy?._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own sales orders.'
        });
      }
    } else if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      if (!assignedIds.includes(order.warehouse?._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view orders for your assigned warehouses.'
        });
      }
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Controlled Pending -> Processing transitions deduct stock)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin, assigned Warehouse Manager)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Role check for warehouse manager
    if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      if (!assignedIds.includes(order.warehouse.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update orders for your assigned warehouses.'
        });
      }
    }

    // Business Rule: Terminal states cannot be altered
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Business Rule: Order #${order.orderNumber} is already '${order.status}' and cannot be modified again.`
      });
    }

    // CRITICAL BUSINESS LOGIC: Pending -> Processing Transition
    if (status === 'Processing') {
      if (order.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot move to 'Processing' from '${order.status}'. Only 'Pending' orders can be processed. Repeated processing is prevented.`
        });
      }

      // 1. Verify that all products have sufficient stock right now
      for (const item of order.products) {
        const stock = await Stock.findOne({
          product: item.product,
          warehouse: order.warehouse
        }).populate('product', 'name');

        const available = stock ? stock.quantity : 0;
        if (available < item.quantity) {
          const prodName = stock?.product?.name || item.product;
          return res.status(400).json({
            success: false,
            message: `Cannot process order #${order.orderNumber}: Insufficient stock for product '${prodName}'. Available: ${available}, Needed: ${item.quantity}.`
          });
        }
      }

      // 2. Atomically deduct stock and create stock-out transactions
      for (const item of order.products) {
        await Stock.findOneAndUpdate(
          { product: item.product, warehouse: order.warehouse },
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );

        await StockTransaction.create({
          product: item.product,
          warehouse: order.warehouse,
          transactionType: 'stock-out',
          quantity: item.quantity,
          note: `Order fulfilled: #${order.orderNumber}`,
          performedBy: req.user._id,
          date: new Date()
        });
      }

      order.status = 'Processing';
      await order.save();

      const updated = await Order.findById(order._id)
        .populate('products.product', 'name sku price')
        .populate('warehouse', 'name location');

      return res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} moved to 'Processing'. Stock deducted and stock-out transactions recorded.`,
        order: updated
      });
    }

    // Processing -> Completed Transition
    if (status === 'Completed') {
      if (order.status !== 'Processing') {
        return res.status(400).json({
          success: false,
          message: `Order must be in 'Processing' status before moving to 'Completed'. Current: '${order.status}'.`
        });
      }
      order.status = 'Completed';
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} successfully completed.`,
        order
      });
    }

    // Transition to Cancelled
    if (status === 'Cancelled') {
      // If order was in Processing, restore the stock that had been deducted
      if (order.status === 'Processing') {
        for (const item of order.products) {
          await Stock.findOneAndUpdate(
            { product: item.product, warehouse: order.warehouse },
            { $inc: { quantity: item.quantity } },
            { upsert: true }
          );

          await StockTransaction.create({
            product: item.product,
            warehouse: order.warehouse,
            transactionType: 'stock-in',
            quantity: item.quantity,
            note: `Stock restored from cancelled processing order #${order.orderNumber}`,
            performedBy: req.user._id,
            date: new Date()
          });
        }
      }

      order.status = 'Cancelled';
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} has been cancelled.`,
        order
      });
    }

    // Fallback for other transitions
    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order (Only allowed if status is Pending)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (Sales Rep owner, Admin, assigned Warehouse Manager)
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Authorization check
    if (req.user.role === 'salesRepresentative') {
      if (order.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only cancel your own orders.'
        });
      }
    } else if (req.user.role === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );
      if (!assignedIds.includes(order.warehouse.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only cancel orders for your assigned warehouses.'
        });
      }
    }

    // Business Rule: Cancel an order ONLY if it has not been processed (i.e. status === 'Pending')
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Business Rule Violation: An order can only be cancelled while in 'Pending' status. This order is already '${order.status}'.`
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} cancelled successfully.`,
      order
    });
  } catch (error) {
    next(error);
  }
};
