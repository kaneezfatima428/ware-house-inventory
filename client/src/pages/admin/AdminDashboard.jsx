import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Package,
  Warehouse,
  ShoppingBag,
  AlertTriangle,
  Truck,
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, lowStockRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/stock/low')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setRecentOrders(statsRes.data.recentOrders || []);
        setRecentTransactions(statsRes.data.recentTransactions || []);
      }

      if (lowStockRes.data.success) {
        setLowStockProducts(lowStockRes.data.lowStockItems || []);
      }
    } catch (err) {
      setError('Failed to load dashboard metrics. Ensure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading administrative metrics..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Executive Overview</h1>
          <p className="text-sm text-slate-500">
            System-wide statistics, multi-warehouse stock levels, and critical operational alerts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            + Add Product
          </Link>
          <Link
            to="/admin/warehouses"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
          >
            + New Warehouse
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
          >
            + Manage Users
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="indigo"
          subtitle="All platform roles"
        />
        <StatsCard
          title="Catalog SKUs"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="blue"
          subtitle="Unique products"
        />
        <StatsCard
          title="Warehouses"
          value={stats?.totalWarehouses || 0}
          icon={Warehouse}
          color="violet"
          subtitle="Storage depots"
        />
        <StatsCard
          title="Suppliers"
          value={stats?.totalSuppliers || 0}
          icon={Truck}
          color="emerald"
          subtitle="Active vendors"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingBag}
          color="amber"
          subtitle={`${stats?.pendingOrders || 0} pending`}
        />
        <StatsCard
          title="Low Stock"
          value={stats?.lowStockCount || lowStockProducts.length || 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Needs restock"
        />
      </div>

      {/* Low Stock Alert Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold">Critical Low-Stock Alerts</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-200/80 text-rose-800">
              {lowStockProducts.length} items below limit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-rose-200/60 text-xs text-left">
              <thead>
                <tr className="text-rose-900 font-semibold">
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Warehouse</th>
                  <th className="py-2 px-3">Current Stock</th>
                  <th className="py-2 px-3">Threshold Limit</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/40 text-slate-800">
                {lowStockProducts.map((item) => (
                  <tr key={item._id} className="hover:bg-rose-100/40">
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.product?.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{item.product?.sku}</td>
                    <td className="py-2 px-3">{item.warehouse?.name}</td>
                    <td className="py-2 px-3 font-bold text-rose-600">{item.quantity} units</td>
                    <td className="py-2 px-3">{item.product?.lowStockLimit || 5} units</td>
                    <td className="py-2 px-3">
                      <StatusBadge status="Low Stock" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Recent Orders & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" /> Recent Sales Orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentOrders.map((order) => (
                <div key={order._id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{order.orderNumber}</span>
                    <p className="text-slate-500 mt-0.5">
                      {order.customerName} • {order.warehouse?.name}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-bold text-slate-900">
                      ${order.totalAmount?.toLocaleString()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movement Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" /> Stock Movements
            </h2>
            <Link
              to="/admin/transactions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View log <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{tx.product?.name}</span>
                    <p className="text-slate-500 mt-0.5">
                      {tx.warehouse?.name} • By: {tx.performedBy?.name || 'System'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-bold text-slate-800">
                      {tx.transactionType === 'stock-in' ? '+' : '-'}
                      {tx.quantity} units
                    </span>
                    <StatusBadge status={tx.transactionType} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
