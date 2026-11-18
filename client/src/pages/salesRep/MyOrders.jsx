import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ShoppingBag,
  Eye,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const MyOrders = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'warehouseManager';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status Update state for Managers/Admin
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Sales Rep / Admin Cancel Action (strictly only allowed when Pending)
  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderNumber}?`)) {
      return;
    }

    try {
      const res = await api.put(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        setAlert({
          type: 'success',
          message: `Order #${orderNumber} cancelled successfully.`
        });
        if (selectedOrder && selectedOrder._id === orderId) {
          setIsDetailOpen(false);
        }
        fetchOrders();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel order.'
      });
    }
  };

  // Manager / Admin: Update Status (Pending -> Processing -> Completed)
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        setAlert({
          type: 'success',
          message: res.data.message || `Order status updated to '${newStatus}'.`
        });
        setIsDetailOpen(false);
        fetchOrders();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update order status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isManagerOrAdmin ? 'System Sales Orders' : 'My Sales Orders'}
          </h1>
          <p className="text-sm text-slate-500">
            {isManagerOrAdmin
              ? 'Process pending orders, trigger warehouse inventory deduction, and fulfill customer requests.'
              : 'Track order statuses from pending review to final customer fulfillment.'}
          </p>
        </div>
      </div>

      {alert.message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="">All Orders</option>
            <option value="Pending">Pending (Not Processed)</option>
            <option value="Processing">Processing (Stock Deducted)</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving orders..." />
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No sales orders found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4">Line Items</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{o.customerName}</span>
                      <span className="text-[11px] text-slate-400">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {o.warehouse?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {o.products?.length} item(s)
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      ${o.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(o)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel button: Allowed ONLY if status is Pending */}
                        {o.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(o._id, o.orderNumber)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Cancel Order (only possible while Pending)"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View Order Details & Fulfillment Controls */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details: #${selectedOrder.orderNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Customer & Warehouse info card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Customer:</span>
                <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
                <span className="text-slate-500 block">{selectedOrder.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Fulfillment Facility:</span>
                <span className="font-bold text-slate-900">{selectedOrder.warehouse?.name}</span>
                <span className="text-slate-500 block">{selectedOrder.warehouse?.location}</span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-700">Current Order Status:</span>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* Line items table */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wider">
                Products in this Order:
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Quantity</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedOrder.products?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{item.product?.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{item.product?.sku}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3">${item.price?.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan="3" className="py-2.5 px-3 uppercase text-[11px] text-slate-700">
                        Grand Total:
                      </td>
                      <td className="py-2.5 px-3 text-right text-base text-indigo-700 font-black">
                        ${selectedOrder.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Manager / Admin Order Progression Actions */}
            {isManagerOrAdmin && (
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-indigo-900 block">
                  Warehouse Manager Workflow Progression:
                </span>

                {selectedOrder.status === 'Pending' && (
                  <div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Moving to <strong>Processing</strong> will deduct the inventory items from this warehouse and record Stock-Out transactions.
                    </p>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'Processing')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      {updatingStatus ? 'Processing Order...' : 'Approve & Move to Processing (Deduct Stock)'}
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'Processing' && (
                  <div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Fulfillment is ready. Finalize and mark this sales order as complete.
                    </p>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'Completed')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark Order as Completed'}
                    </button>
                  </div>
                )}

                {(selectedOrder.status === 'Completed' || selectedOrder.status === 'Cancelled') && (
                  <p className="text-[11px] text-slate-500 italic">
                    This order is in a terminal state ({selectedOrder.status}) and cannot undergo further status transitions.
                  </p>
                )}
              </div>
            )}

            {/* Cancel Order Action if Pending */}
            {selectedOrder.status === 'Pending' && (
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCancelOrder(selectedOrder._id, selectedOrder.orderNumber)}
                  className="px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel This Order
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyOrders;
