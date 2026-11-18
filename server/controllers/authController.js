import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_jwt_token_warehouse_inventory_2026_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (Admin role cannot be self-registered)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, image, imageFileId, assignedWarehouses } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Security Rule: Disallow public registration with admin role
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Creating an admin account via public registration is not allowed. Only existing Admins can assign or create Admin users.'
      });
    }

    // Allowed public roles
    const validRoles = ['warehouseManager', 'supplier', 'salesRepresentative'];
    const assignedRole = validRoles.includes(role) ? role : 'salesRepresentative';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignedRole,
      assignedWarehouses: assignedRole === 'warehouseManager' ? (assignedWarehouses || []) : [],
      image: image || '',
      imageFileId: imageFileId || ''
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedWarehouses: user.assignedWarehouses,
        image: user.image,
        imageFileId: user.imageFileId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('assignedWarehouses');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedWarehouses: user.assignedWarehouses,
        image: user.image,
        imageFileId: user.imageFileId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assignedWarehouses');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
