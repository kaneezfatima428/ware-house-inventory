import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorizeRoles('salesRepresentative', 'admin'), createOrder)
  .get(getOrders);

router.route('/:id')
  .get(getOrderById);

router.put('/:id/status', authorizeRoles('admin', 'warehouseManager'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

export default router;
