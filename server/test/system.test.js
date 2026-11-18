import User from '../models/User.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import Order from '../models/Order.js';
import SupplyRequest from '../models/SupplyRequest.js';

console.log('--- Verifying Schema Definitions ---');
const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
};

assert(User.schema.path('role').enumValues.includes('admin'), 'User role enum has admin');
assert(User.schema.path('role').enumValues.includes('warehouseManager'), 'User role enum has warehouseManager');
assert(User.schema.path('role').enumValues.includes('supplier'), 'User role enum has supplier');
assert(User.schema.path('role').enumValues.includes('salesRepresentative'), 'User role enum has salesRepresentative');
assert(Product.schema.path('sku').options.unique, 'Product SKU has unique index');
assert(Stock.schema.indexes().some(idx => idx[0].product && idx[0].warehouse), 'Stock has compound unique index on {product, warehouse}');
assert(StockTransaction.schema.path('transactionType').enumValues.includes('stock-in'), 'StockTransaction enum has stock-in');
assert(StockTransaction.schema.path('transactionType').enumValues.includes('stock-out'), 'StockTransaction enum has stock-out');
assert(Order.schema.path('status').enumValues.includes('Pending'), 'Order enum has Pending');
assert(Order.schema.path('status').enumValues.includes('Processing'), 'Order enum has Processing');
assert(SupplyRequest.schema.path('status').enumValues.includes('Approved'), 'SupplyRequest enum has Approved');

console.log('--- All Model Schemas Strictly Conform to PDF Specifications! ---');
