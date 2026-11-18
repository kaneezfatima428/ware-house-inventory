import mongoose from 'mongoose';

const StockTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Transaction must reference a product']
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Transaction must reference a warehouse']
    },
    transactionType: {
      type: String,
      enum: {
        values: ['stock-in', 'stock-out'],
        message: '{VALUE} is not a valid transaction type'
      },
      required: [true, 'Transaction type is required (stock-in or stock-out)']
    },
    quantity: {
      type: Number,
      required: [true, 'Transaction quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must record the performing user']
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster history queries
StockTransactionSchema.index({ warehouse: 1, date: -1 });
StockTransactionSchema.index({ product: 1, date: -1 });
StockTransactionSchema.index({ transactionType: 1 });

const StockTransaction =
  mongoose.models.StockTransaction ||
  mongoose.model('StockTransaction', StockTransactionSchema);

export default StockTransaction;
