import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Stock must reference a product']
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Stock must reference a warehouse']
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate entries for same product in same warehouse
StockSchema.index({ product: 1, warehouse: 1 }, { unique: true });

const Stock = mongoose.models.Stock || mongoose.model('Stock', StockSchema);

export default Stock;
