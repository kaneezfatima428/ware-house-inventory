import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'warehouseManager', 'supplier', 'salesRepresentative'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'salesRepresentative'
    },
    assignedWarehouses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      }
    ],
    image: {
      type: String,
      default: ''
    },
    imageFileId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
// NOTE: In Mongoose 8+ with async pre-save hooks, do NOT call next() —
// returning the promise is enough. Calling next() in async context
// throws "next is not a function" in certain Mongoose versions.
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON serialization
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
