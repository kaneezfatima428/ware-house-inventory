import Warehouse from '../models/Warehouse.js';
import User from '../models/User.js';
import Stock from '../models/Stock.js';

/**
 * @desc    Create a warehouse
 * @route   POST /api/warehouses
 * @access  Private (Admin only)
 */
export const createWarehouse = async (req, res, next) => {
  try {
    const { name, location, manager, capacity } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse name and location are required.'
      });
    }

    const warehouse = await Warehouse.create({
      name,
      location,
      manager: manager || null,
      capacity: capacity ? Number(capacity) : 1000
    });

    // If manager was assigned, update manager's assignedWarehouses array
    if (manager) {
      await User.findByIdAndUpdate(manager, {
        $addToSet: { assignedWarehouses: warehouse._id }
      });
    }

    const populated = await Warehouse.findById(warehouse._id).populate(
      'manager',
      'name email phone role'
    );

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully.',
      warehouse: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all warehouses
 * @route   GET /api/warehouses
 * @access  Private (Authenticated users)
 */
export const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find()
      .populate('manager', 'name email phone role')
      .sort({ createdAt: -1 });

    // If warehouse manager, annotate assigned status
    const formatted = warehouses.map((wh) => {
      const isAssigned =
        req.user.role === 'admin' ||
        (req.user.assignedWarehouses || []).some(
          (id) => (id._id || id).toString() === wh._id.toString()
        );
      return {
        ...wh.toObject(),
        isAssigned
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      warehouses: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single warehouse by ID
 * @route   GET /api/warehouses/:id
 * @access  Private
 */
export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate(
      'manager',
      'name email phone role'
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found.'
      });
    }

    // Include warehouse stock levels
    const stocks = await Stock.find({ warehouse: warehouse._id })
      .populate('product', 'name sku category price lowStockLimit')
      .sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      warehouse,
      currentInventory: stocks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update warehouse
 * @route   PUT /api/warehouses/:id
 * @access  Private (Admin only)
 */
export const updateWarehouse = async (req, res, next) => {
  try {
    const { name, location, manager, capacity } = req.body;

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found.'
      });
    }

    const oldManager = warehouse.manager;

    if (name) warehouse.name = name;
    if (location) warehouse.location = location;
    if (capacity !== undefined) warehouse.capacity = Number(capacity);
    if (manager !== undefined) warehouse.manager = manager || null;

    await warehouse.save();

    // If manager changed, sync assignedWarehouses
    if (manager && (!oldManager || oldManager.toString() !== manager.toString())) {
      if (oldManager) {
        await User.findByIdAndUpdate(oldManager, {
          $pull: { assignedWarehouses: warehouse._id }
        });
      }
      await User.findByIdAndUpdate(manager, {
        $addToSet: { assignedWarehouses: warehouse._id }
      });
    }

    const updated = await Warehouse.findById(warehouse._id).populate(
      'manager',
      'name email phone role'
    );

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully.',
      warehouse: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete warehouse
 * @route   DELETE /api/warehouses/:id
 * @access  Private (Admin only)
 */
export const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found.'
      });
    }

    // Remove from manager's assignedWarehouses
    if (warehouse.manager) {
      await User.findByIdAndUpdate(warehouse.manager, {
        $pull: { assignedWarehouses: warehouse._id }
      });
    }

    // Remove stock records for this warehouse
    await Stock.deleteMany({ warehouse: warehouse._id });
    await Warehouse.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Warehouse and associated stock records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
