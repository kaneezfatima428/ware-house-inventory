import express from 'express';
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
} from '../controllers/warehouseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWarehouses)
  .post(authorizeRoles('admin'), createWarehouse);

router.route('/:id')
  .get(getWarehouseById)
  .put(authorizeRoles('admin'), updateWarehouse)
  .delete(authorizeRoles('admin'), deleteWarehouse);

export default router;
