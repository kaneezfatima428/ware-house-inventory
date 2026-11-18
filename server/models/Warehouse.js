import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a warehouse name'],
      trim: true,
      maxlength: [120, 'Warehouse name cannot exceed 120 characters']
    },
    location: {
      type: String,
      required: [true, 'Please provide a warehouse location'],
      trim: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
      default: 1000
    }
  },
  {
    timestamps: true
  }
);

const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);

export default Warehouse;
