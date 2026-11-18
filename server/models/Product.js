import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    sku: {
      type: String,
      required: [true, 'Please provide a unique SKU'],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide a product category'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    lowStockLimit: {
      type: Number,
      default: 5,
      min: [0, 'Low stock limit cannot be negative']
    },
    imageUrl: {
      type: String,
      default: ''
    },
    imageFileId: {
      type: String,
      default: ''
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for text search on name, sku, category
ProductSchema.index({ name: 'text', sku: 'text', category: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
