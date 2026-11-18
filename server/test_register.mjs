import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.loadEnvFile(path.resolve(__dirname, '.env'));

import mongoose from 'mongoose';

// Minimal connection test
await mongoose.connect(process.env.MONGO_URI);
console.log('DB connected');

// Import User model
const { default: User } = await import('./models/User.js');

// Try creating a user
try {
  const testUser = await User.create({
    name: 'Test Register User',
    email: `test_${Date.now()}@test.com`,
    password: 'testpassword123',
    phone: '1234567890',
    role: 'salesRepresentative',
    assignedWarehouses: [],
    image: '',
    imageFileId: ''
  });
  console.log('✅ User created:', testUser._id, testUser.role);
} catch (err) {
  console.error('❌ Error creating user:', err.message);
  console.error('Stack:', err.stack);
} finally {
  await mongoose.disconnect();
  console.log('Done');
}
