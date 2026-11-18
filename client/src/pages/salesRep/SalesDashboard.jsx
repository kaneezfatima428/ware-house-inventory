import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  PlusCircle,
  Package,
  ArrowRight
} from 'lucide-react';

const SalesDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/orders')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (ordersRes.data.success) {
        setRecentOrders(ordersRes.data.orders?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading sales rep workspace..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Representative Hub</h1>
          <p className="text-sm text-slate-500">
            Welcome, <span className="font-semibold text-slate-800">{user?.name}</span>. Create and manage customer sales orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/sales/new-order"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create Sales Order
          </Link>
          <Link
            to="/sales/catalog"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || recentOrders.length || 0}
          icon={ShoppingBag}
          color="indigo"
          subtitle="Orders placed by you"
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.pendingOrders || 0}
          icon={Clock}
          color="amber"
          subtitle="Awaiting warehouse processing"
        />
        <StatsCard
          title="Processing Orders"
          value={stats?.processingOrders || 0}
          icon={Package}
          color="blue"
          subtitle="Fulfillment in progress"
        />
        <StatsCard
          title="Completed Orders"
          value={stats?.completedOrders || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Delivered & finalized"
        />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" /> Your Recent Sales Orders
          </h2>
          <Link
            to="/sales/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all my orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            You haven't created any sales orders yet.{' '}
            <Link to="/sales/new-order" className="text-indigo-600 font-semibold underline">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Warehouse</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{o.orderNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {o.customerName}
                      <span className="block text-[11px] text-slate-400 font-normal">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3">{o.warehouse?.name}</td>
                    <td className="py-3 px-3 text-slate-600">{o.products?.length} product(s)</td>
                    <td className="py-3 px-3 font-bold text-slate-900">${o.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
