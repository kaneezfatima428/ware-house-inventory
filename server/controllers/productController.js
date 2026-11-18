import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import { deleteFile } from '../utils/imagekit.js';

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin, Warehouse Manager, Supplier)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      sku,
      category,
      price,
      lowStockLimit,
      imageUrl,
      imageFileId,
      supplier
    } = req.body;

    if (!name || !sku || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, SKU, category, and price are required.'
      });
    }

    // SKU duplicate check
    const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU '${sku.toUpperCase().trim()}' already exists.`
      });
    }

    // If role is supplier, auto-bind themselves as the supplier
    let assignedSupplier = supplier;
    if (req.user.role === 'supplier') {
      assignedSupplier = req.user._id;
    }

    const product = await Product.create({
      name,
      description: description || '',
      sku: sku.toUpperCase().trim(),
      category,
      price,
      lowStockLimit: lowStockLimit !== undefined ? Number(lowStockLimit) : 5,
      imageUrl: imageUrl || '',
      imageFileId: imageFileId || '',
      supplier: assignedSupplier || null,
      createdBy: req.user._id
    });

    const populated = await Product.findById(product._id)
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products with search & category filters
 * @route   GET /api/products
 * @access  Private (or Public for authenticated users)
 */
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, supplier } = req.query;
    const query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (supplier) {
      query.supplier = supplier;
    } else if (req.user && req.user.role === 'supplier' && req.query.mine === 'true') {
      // If supplier explicitly requests their own products
      query.supplier = req.user._id;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    const products = await Product.find(query)
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Retrieve stock levels across all warehouses for this product
    const stocks = await Stock.find({ product: product._id }).populate(
      'warehouse',
      'name location'
    );
    const totalStock = stocks.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      product,
      stockSummary: {
        totalQuantity: totalStock,
        isLowStock: totalStock <= product.lowStockLimit,
        warehouseBreakdown: stocks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Warehouse Manager, Product Supplier)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Suppliers can only update their own products
    if (
      req.user.role === 'supplier' &&
      product.supplier?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own products.'
      });
    }

    const {
      name,
      description,
      sku,
      category,
      price,
      lowStockLimit,
      imageUrl,
      imageFileId,
      supplier
    } = req.body;

    // Check SKU if being updated
    if (sku && sku.toUpperCase().trim() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${sku.toUpperCase().trim()}' already exists.`
        });
      }
      product.sku = sku.toUpperCase().trim();
    }

    // Delete old ImageKit image if being replaced
    if (imageFileId && product.imageFileId && product.imageFileId !== imageFileId) {
      try {
        await deleteFile(product.imageFileId);
      } catch (err) {
        console.warn('Failed to delete old product image from ImageKit:', err.message);
      }
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = price;
    if (lowStockLimit !== undefined) product.lowStockLimit = Number(lowStockLimit);
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (imageFileId !== undefined) product.imageFileId = imageFileId;
    if (supplier && req.user.role === 'admin') product.supplier = supplier;

    await product.save();

    const updated = await Product.findById(product._id)
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Clean up ImageKit image if present
    if (product.imageFileId) {
      try {
        await deleteFile(product.imageFileId);
      } catch (err) {
        console.warn('Failed to delete product image from ImageKit:', err.message);
      }
    }

    // Remove associated stock records
    await Stock.deleteMany({ product: product._id });
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product and associated warehouse stock records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
