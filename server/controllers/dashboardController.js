import User from '../models/User.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Stock from '../models/Stock.js';
import Order from '../models/Order.js';
import StockTransaction from '../models/StockTransaction.js';
import SupplyRequest from '../models/SupplyRequest.js';

/**
 * @desc    Get dashboard statistics for dashboard cards
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    if (userRole === 'admin') {
      const [
        totalUsers,
        totalProducts,
        totalWarehouses,
        totalSuppliers,
        totalOrders,
        pendingOrders,
        stocks,
        recentOrders,
        recentTransactions,
        pendingSupplyRequests
      ] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Warehouse.countDocuments(),
        User.countDocuments({ role: 'supplier' }),
        Order.countDocuments(),
        Order.countDocuments({ status: 'Pending' }),
        Stock.find().populate('product', 'lowStockLimit'),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('warehouse createdBy'),
        StockTransaction.find().sort({ date: -1 }).limit(5).populate('product warehouse performedBy'),
        SupplyRequest.countDocuments({ status: 'Pending' })
      ]);

      const lowStockCount = stocks.filter(
        (s) => s.product && s.quantity <= (s.product.lowStockLimit ?? 5)
      ).length;

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalProducts,
          totalWarehouses,
          totalSuppliers,
          totalOrders,
          pendingOrders,
          lowStockCount,
          pendingSupplyRequests
        },
        recentOrders,
        recentTransactions
      });
    }

    if (userRole === 'warehouseManager') {
      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );

      const [stocks, recentOrders, recentTransactions, pendingRequests] =
        await Promise.all([
          Stock.find({ warehouse: { $in: assignedIds } }).populate(
            'product',
            'name sku lowStockLimit'
          ),
          Order.find({ warehouse: { $in: assignedIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('warehouse createdBy'),
          StockTransaction.find({ warehouse: { $in: assignedIds } })
            .sort({ date: -1 })
            .limit(5)
            .populate('product warehouse performedBy'),
          SupplyRequest.countDocuments({
            warehouse: { $in: assignedIds },
            status: 'Pending'
          })
        ]);

      const lowStockCount = stocks.filter(
        (s) => s.product && s.quantity <= (s.product.lowStockLimit ?? 5)
      ).length;

      return res.status(200).json({
        success: true,
        stats: {
          assignedWarehousesCount: assignedIds.length,
          totalInventoryItems: stocks.length,
          lowStockCount,
          pendingRequests
        },
        recentOrders,
        recentTransactions
      });
    }

    if (userRole === 'supplier') {
      const [myProductsCount, totalRequests, pendingRequests, approvedRequests] =
        await Promise.all([
          Product.countDocuments({ supplier: req.user._id }),
          SupplyRequest.countDocuments({ supplier: req.user._id }),
          SupplyRequest.countDocuments({ supplier: req.user._id, status: 'Pending' }),
          SupplyRequest.countDocuments({ supplier: req.user._id, status: 'Approved' })
        ]);

      return res.status(200).json({
        success: true,
        stats: {
          myProductsCount,
          totalRequests,
          pendingRequests,
          approvedRequests
        }
      });
    }

    if (userRole === 'salesRepresentative') {
      const [totalOrders, pendingOrders, processingOrders, completedOrders] =
        await Promise.all([
          Order.countDocuments({ createdBy: req.user._id }),
          Order.countDocuments({ createdBy: req.user._id, status: 'Pending' }),
          Order.countDocuments({ createdBy: req.user._id, status: 'Processing' }),
          Order.countDocuments({ createdBy: req.user._id, status: 'Completed' })
        ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalOrders,
          pendingOrders,
          processingOrders,
          completedOrders
        }
      });
    }

    res.status(200).json({ success: true, stats: {} });
  } catch (error) {
    next(error);
  }
};
