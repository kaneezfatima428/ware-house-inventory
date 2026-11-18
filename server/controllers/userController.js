import User from '../models/User.js';
import { deleteFile } from '../utils/imagekit.js';

/**
 * @desc    Get users (Admin sees all; other roles can query suppliers/managers for dropdowns)
 * @route   GET /api/users
 * @access  Private
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    // Non-admin users are restricted to querying suppliers or managers for form selectors
    if (req.user.role !== 'admin') {
      if (!role || !['supplier', 'warehouseManager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Full user listing is restricted to Administrators.'
        });
      }
      query.role = role;
    } else if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const selectFields =
      req.user.role === 'admin'
        ? ''
        : '_id name email phone role image imageFileId';

    const users = await User.find(query)
      .select(selectFields)
      .populate('assignedWarehouses')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin or Self)
 */
export const getUserById = async (req, res, next) => {
  try {
    // Only Admin or the user themselves can view full user details
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own user profile.'
      });
    }

    const user = await User.findById(req.params.id).populate('assignedWarehouses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a user (Admin can create any role including Admin)
 * @route   POST /api/users
 * @access  Private/Admin
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, assignedWarehouses, image, imageFileId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: role || 'salesRepresentative',
      assignedWarehouses: assignedWarehouses || [],
      image: image || '',
      imageFileId: imageFileId || ''
    });

    const populatedUser = await User.findById(user._id).populate('assignedWarehouses');

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user (Admin or Self for profile updates)
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateUser = async (req, res, next) => {
  try {
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your own user profile.'
      });
    }

    const { name, email, phone, role, assignedWarehouses, image, imageFileId, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // If an image is being replaced and old imageFileId exists, delete old image from ImageKit
    if (imageFileId && user.imageFileId && user.imageFileId !== imageFileId) {
      try {
        await deleteFile(user.imageFileId);
      } catch (err) {
        console.warn('Failed to delete old user avatar from ImageKit:', err.message);
      }
    }

    if (name) user.name = name;
    if (email && (isAdmin || isSelf)) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (image !== undefined) user.image = image;
    if (imageFileId !== undefined) user.imageFileId = imageFileId;
    if (password) user.password = password; // Pre-save hook will hash it

    // Only Admin can modify role or assignedWarehouses
    if (isAdmin) {
      if (role) user.role = role;
      if (assignedWarehouses !== undefined) user.assignedWarehouses = assignedWarehouses;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate('assignedWarehouses');

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Administrators can delete users.'
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Action rejected: You cannot delete your own admin account.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Clean up ImageKit profile picture if present
    if (user.imageFileId) {
      try {
        await deleteFile(user.imageFileId);
      } catch (err) {
        console.warn('Failed to delete user avatar from ImageKit:', err.message);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
