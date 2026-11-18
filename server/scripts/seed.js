import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import Order from '../models/Order.js';
import SupplyRequest from '../models/SupplyRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.resolve(__dirname, '../.env'));
  }
} catch {
  // Continue
}

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      StockTransaction.deleteMany({}),
      Order.deleteMany({}),
      SupplyRequest.deleteMany({})
    ]);

    console.log('Seeding initial users...');

    // 1. Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@inventory.com',
      password: 'admin123',
      phone: '+1-555-0100',
      role: 'admin'
    });

    // 2. Warehouse Manager
    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@inventory.com',
      password: 'manager123',
      phone: '+1-555-0101',
      role: 'warehouseManager'
    });

    // 3. Supplier
    const supplier = await User.create({
      name: 'Global Tech Supplies',
      email: 'supplier@inventory.com',
      password: 'supplier123',
      phone: '+1-555-0102',
      role: 'supplier'
    });

    // 4. Sales Representative
    const salesRep = await User.create({
      name: 'Sarah Sales',
      email: 'sales@inventory.com',
      password: 'sales123',
      phone: '+1-555-0103',
      role: 'salesRepresentative'
    });

    console.log('Seeding warehouses...');

    const centralWarehouse = await Warehouse.create({
      name: 'Central Hub Alpha',
      location: '100 Logistics Blvd, Chicago, IL',
      manager: manager._id,
      capacity: 5000
    });

    const northWarehouse = await Warehouse.create({
      name: 'North Logistics Depot',
      location: '450 North Way, Minneapolis, MN',
      manager: manager._id,
      capacity: 3000
    });

    // Assign warehouse to manager
    manager.assignedWarehouses = [centralWarehouse._id, northWarehouse._id];
    await manager.save();

    console.log('Seeding products...');

    const laptop = await Product.create({
      name: 'ThinkPad Pro 15',
      sku: 'LTP-TP-015',
      category: 'Laptops',
      description: 'High performance enterprise laptop with Intel Core i7 and 32GB RAM.',
      price: 1200,
      lowStockLimit: 5,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      supplier: supplier._id,
      createdBy: admin._id
    });

    const keyboard = await Product.create({
      name: 'Mechanical RGB Keyboard',
      sku: 'ACC-KB-001',
      category: 'Accessories',
      description: 'Tactile mechanical switches with customizable RGB backlighting.',
      price: 85,
      lowStockLimit: 10,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
      supplier: supplier._id,
      createdBy: admin._id
    });

    const mouse = await Product.create({
      name: 'Precision Wireless Mouse',
      sku: 'ACC-MS-002',
      category: 'Accessories',
      description: 'Ergonomic wireless mouse with 4000 DPI sensor.',
      price: 45,
      lowStockLimit: 15,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
      supplier: supplier._id,
      createdBy: admin._id
    });

    const monitor = await Product.create({
      name: 'UltraWide 34-Inch Curved Monitor',
      sku: 'MON-UW-034',
      category: 'Monitors',
      description: 'WQHD 144Hz curved display with USB-C 90W power delivery.',
      price: 499,
      lowStockLimit: 4,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
      supplier: supplier._id,
      createdBy: admin._id
    });

    console.log('Seeding initial stock levels & transactions...');

    // Central warehouse stock
    await Stock.create({ product: laptop._id, warehouse: centralWarehouse._id, quantity: 20 });
    await Stock.create({ product: keyboard._id, warehouse: centralWarehouse._id, quantity: 50 });
    await Stock.create({ product: mouse._id, warehouse: centralWarehouse._id, quantity: 8 }); // Low stock!
    await Stock.create({ product: monitor._id, warehouse: centralWarehouse._id, quantity: 12 });

    // North warehouse stock
    await Stock.create({ product: laptop._id, warehouse: northWarehouse._id, quantity: 10 });
    await Stock.create({ product: keyboard._id, warehouse: northWarehouse._id, quantity: 25 });
    await Stock.create({ product: mouse._id, warehouse: northWarehouse._id, quantity: 3 }); // Low stock!

    // Initial stock-in transactions
    await StockTransaction.create([
      {
        product: laptop._id,
        warehouse: centralWarehouse._id,
        transactionType: 'stock-in',
        quantity: 20,
        note: 'Initial inventory deposit',
        performedBy: admin._id
      },
      {
        product: keyboard._id,
        warehouse: centralWarehouse._id,
        transactionType: 'stock-in',
        quantity: 50,
        note: 'Initial inventory deposit',
        performedBy: manager._id
      },
      {
        product: mouse._id,
        warehouse: centralWarehouse._id,
        transactionType: 'stock-in',
        quantity: 8,
        note: 'Initial stock - low inventory alert test',
        performedBy: manager._id
      }
    ]);

    console.log('Seeding sample orders and supply requests...');

    await Order.create({
      orderNumber: 'ORD-20261118-1001',
      customerName: 'Acme Corporation',
      customerPhone: '+1-555-9090',
      products: [
        { product: laptop._id, quantity: 2, price: 1200 },
        { product: keyboard._id, quantity: 2, price: 85 }
      ],
      totalAmount: 2570,
      warehouse: centralWarehouse._id,
      createdBy: salesRep._id,
      status: 'Pending'
    });

    await SupplyRequest.create({
      supplier: supplier._id,
      product: mouse._id,
      warehouse: centralWarehouse._id,
      quantity: 50,
      status: 'Pending',
      note: 'Replenishment for low-stock wireless mice'
    });

    console.log('✅ Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Default credentials for testing:');
    console.log('Admin:       admin@inventory.com   / admin123');
    console.log('Manager:     manager@inventory.com / manager123');
    console.log('Supplier:    supplier@inventory.com / supplier123');
    console.log('Sales Rep:   sales@inventory.com   / sales123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
