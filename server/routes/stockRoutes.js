import express from 'express';
import {
  stockIn,
  stockOut,
  getStock,
  getLowStock,
  getTransactions,
  transferStock
} from '../controllers/stockController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/in', authorizeRoles('admin', 'warehouseManager'), stockIn);
router.post('/out', authorizeRoles('admin', 'warehouseManager'), stockOut);
router.post('/transfer', authorizeRoles('admin', 'warehouseManager'), transferStock);
router.get('/', getStock);
router.get('/low', getLowStock);
router.get('/transactions', getTransactions);

export default router;
