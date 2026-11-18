import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  History,
  Building,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assignedWarehouses, setAssignedWarehouses] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, lowRes, txRes, whRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/stock/low'),
        api.get('/stock/transactions'),
        api.get('/warehouses')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (lowRes.data.success) {
        setLowStockItems(lowRes.data.lowStockItems || []);
      }
      if (txRes.data.success) {
        setRecentTransactions(txRes.data.transactions?.slice(0, 5) || []);
      }
      if (whRes.data.success) {
        // Filter only assigned
        const assigned = whRes.data.warehouses.filter((w) => w.isAssigned);
        setAssignedWarehouses(assigned);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading warehouse manager operations..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Operations Center</h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Manage your assigned warehouses and stock movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/manager/stock"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" /> Receive / Remove Stock
          </Link>
          <Link
            to="/manager/inventory"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            View Inventory
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Warehouses"
          value={assignedWarehouses.length}
          icon={Building}
          color="indigo"
          subtitle="Locations under your scope"
        />
        <StatsCard
          title="Tracked Items"
          value={stats?.totalInventoryItems || 0}
          icon={Boxes}
          color="blue"
          subtitle="Inventory records"
        />
        <StatsCard
          title="Low-Stock Alerts"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color="rose"
          subtitle="Requires restocking"
        />
        <StatsCard
          title="Pending Supply Reqs"
          value={stats?.pendingRequests || 0}
          icon={ShoppingBag}
          color="amber"
          subtitle="Supplier submissions"
        />
      </div>

      {/* Assigned Warehouses Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Your Assigned Facility Scope:
        </h2>
        {assignedWarehouses.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
            ⚠️ You currently have no assigned warehouses. Please contact an Administrator to map your account to a warehouse facility.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedWarehouses.map((wh) => (
              <div
                key={wh._id}
                className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{wh.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{wh.location}</p>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Warning Section */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Action Required: Low Stock Items in Your Warehouses
            </h2>
            <Link
              to="/manager/stock"
              className="text-xs font-bold text-rose-700 hover:text-rose-800 underline"
            >
              Stock-In Now
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-rose-200/60 text-xs text-left">
              <thead>
                <tr className="text-rose-900 font-semibold">
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Warehouse</th>
                  <th className="py-2 px-3">Current Quantity</th>
                  <th className="py-2 px-3">Low-Stock Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/40 text-slate-800">
                {lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td className="py-2 px-3 font-semibold">{item.product?.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{item.product?.sku}</td>
                    <td className="py-2 px-3">{item.warehouse?.name}</td>
                    <td className="py-2 px-3 font-bold text-rose-600">{item.quantity} units</td>
                    <td className="py-2 px-3">{item.product?.lowStockLimit || 5} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Movements Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Recent Stock Movements
          </h2>
          <Link
            to="/manager/transactions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            All Transactions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No movements recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{tx.product?.name}</span>
                  <p className="text-slate-500 mt-0.5">
                    {tx.warehouse?.name} • Note: {tx.note || 'None'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-bold text-slate-900">
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
  );
};

export default ManagerDashboard;
