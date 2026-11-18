import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(path.resolve(__dirname, '.env'));
    } catch {
      process.loadEnvFile(path.resolve(__dirname, '../.env'));
    }
  }
} catch {
  // Continue if no .env file
}

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supplyRequestRoutes from './routes/supplyRequestRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { getTransactions } from './controllers/stockController.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for local dev flexibility
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base & Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventory & Warehouse Management System REST API is running',
    version: '1.0.0',
    databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    databaseState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock', stockRoutes);
app.get('/api/transactions', protect, getTransactions); // Dedicated endpoint as in PDF specification
app.use('/api/orders', orderRoutes);
app.use('/api/supply-requests', supplyRequestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Inventory & Warehouse API running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
