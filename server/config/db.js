import dns from 'node:dns/promises';
import mongoose from 'mongoose';

// Fix Atlas SRV DNS resolution on certain networks (e.g., Windows local dev)
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (err) {
  console.warn('DNS server configuration warning:', err.message);
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log(`✅ MongoDB Connected to database: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI ||
    'mongodb+srv://hafizakaneezfatima04_db_user:orhan040222@cluster0.irj5xyg.mongodb.net/warehouse_inventory?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.error('💡 Tip: Verify your MongoDB Atlas IP whitelist (allow 0.0.0.0/0) and credentials in .env');
    return null;
  }
};

export default connectDB;
