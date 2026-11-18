import express from 'express';
import {
  createSupplyRequest,
  getSupplyRequests,
  getSupplyRequestById,
  updateSupplyRequestStatus
} from '../controllers/supplyRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorizeRoles('supplier', 'admin'), createSupplyRequest)
  .get(getSupplyRequests);

router.route('/:id')
  .get(getSupplyRequestById);

router.put('/:id/status', authorizeRoles('admin', 'warehouseManager'), updateSupplyRequestStatus);

export default router;
