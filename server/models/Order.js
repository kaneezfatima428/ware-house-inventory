import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Order item must specify a product']
    },
    quantity: {
      type: Number,
      required: [true, 'Order item must specify quantity'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Order item must specify price'],
      min: [0, 'Price cannot be negative']
    }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true
    },
    products: {
      type: [OrderItemSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Order must contain at least one product'
      }
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Order must reference a fulfillment warehouse']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must record the creating user']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Processing', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid order status'
      },
      default: 'Pending'
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

OrderSchema.index({ createdBy: 1, createdAt: -1 });
OrderSchema.index({ warehouse: 1, status: 1 });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;
