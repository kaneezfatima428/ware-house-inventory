import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorizeRoles('admin', 'warehouseManager', 'supplier'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorizeRoles('admin', 'warehouseManager', 'supplier'), updateProduct)
  .delete(authorizeRoles('admin'), deleteProduct);

export default router;
