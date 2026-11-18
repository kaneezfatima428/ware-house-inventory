import mongoose from 'mongoose';

const SupplyRequestSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Supply request must reference a supplier']
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Supply request must reference a product']
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Supply request must reference a warehouse']
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity requested'],
      min: [1, 'Quantity must be at least 1']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid supply request status'
      },
      default: 'Pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

SupplyRequestSchema.index({ supplier: 1, createdAt: -1 });
SupplyRequestSchema.index({ warehouse: 1, status: 1 });

const SupplyRequest =
  mongoose.models.SupplyRequest ||
  mongoose.model('SupplyRequest', SupplyRequestSchema);

export default SupplyRequest;
