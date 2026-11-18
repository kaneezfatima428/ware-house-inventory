import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.route('/')
  .get(getUsers)
  .post(authorizeRoles('admin'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser) // Handles Admin or Self (role checks inside controller)
  .delete(authorizeRoles('admin'), deleteUser);

export default router;
