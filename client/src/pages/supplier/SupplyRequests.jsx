import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Truck,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  Package
} from 'lucide-react';

const SupplyRequests = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'warehouseManager';

  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Create Request Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    warehouse: '',
    quantity: '',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Review (Approve/Reject) Modal state for Managers/Admin
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved'); // 'Approved' | 'Rejected'
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [reqRes, prodRes, whRes] = await Promise.all([
        api.get('/supply-requests', { params }),
        api.get('/products'),
        api.get('/warehouses')
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.supplyRequests);
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        if (prodRes.data.products.length > 0 && !formData.product) {
          setFormData((prev) => ({ ...prev, product: prodRes.data.products[0]._id }));
        }
      }
      if (whRes.data.success) {
        const list = isManagerOrAdmin
          ? whRes.data.warehouses.filter((w) => w.isAssigned || user.role === 'admin')
          : whRes.data.warehouses;
        setWarehouses(list);
        if (list.length > 0 && !formData.warehouse) {
          setFormData((prev) => ({ ...prev, warehouse: list[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await api.post('/supply-requests', {
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: Number(formData.quantity),
        note: formData.note
      });

      if (res.data.success) {
        setAlert({ type: 'success', message: 'Supply request submitted successfully.' });
        setIsModalOpen(false);
        setFormData((prev) => ({ ...prev, quantity: '', note: '' }));
        fetchData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit request.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (reqItem, action) => {
    setSelectedRequest(reqItem);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setReviewing(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await api.put(`/supply-requests/${selectedRequest._id}/status`, {
        status: reviewAction,
        note: reviewNote
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          message: res.data.message || `Supply request has been ${reviewAction.toLowerCase()}.`
        });
        setReviewModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Action failed.'
      });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Supply Requests</h1>
          <p className="text-sm text-slate-500">
            {isManagerOrAdmin
              ? 'Review and sign off on vendor restock shipments into warehouse facilities.'
              : 'Submit shipments and monitor approval status from warehouse managers.'}
          </p>
        </div>

        {/* Suppliers and Admins can create requests */}
        {(user?.role === 'supplier' || user?.role === 'admin') && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Supply Request
          </button>
        )}
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
            <option value="">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Supply Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving supply requests..." />
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No supply requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Product SKU</th>
                  <th className="py-3.5 px-4">Destination Warehouse</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reviewed By</th>
                  {isManagerOrAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((reqItem) => (
                  <tr key={reqItem._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(reqItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {reqItem.supplier?.name || 'Unknown Supplier'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{reqItem.product?.name}</span>
                      <span className="text-[11px] font-mono text-indigo-600">{reqItem.product?.sku}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {reqItem.warehouse?.name}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {reqItem.quantity} units
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={reqItem.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {reqItem.reviewedBy?.name ? (
                        <span>
                          {reqItem.reviewedBy.name}{' '}
                          <span className="text-[10px] text-slate-400">({reqItem.reviewedBy.role})</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Manager / Admin Approval Controls */}
                    {isManagerOrAdmin && (
                      <td className="py-3 px-4 text-right">
                        {reqItem.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openReviewModal(reqItem, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openReviewModal(reqItem, 'Rejected')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] shadow-xs cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Supply Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Stock Supply Request"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Product *
            </label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Warehouse *
            </label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} ({wh.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Quantity to Supply *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g. 100"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Delivery Note / Shipment Reference
            </label>
            <textarea
              rows="2"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g. Batch #4092, expected delivery tomorrow morning"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Approval / Rejection */}
      {selectedRequest && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Review Supply Request #${selectedRequest._id.slice(-6)}`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <p>
                <span className="font-semibold text-slate-700">Product:</span>{' '}
                {selectedRequest.product?.name} ({selectedRequest.product?.sku})
              </p>
              <p>
                <span className="font-semibold text-slate-700">Warehouse:</span>{' '}
                {selectedRequest.warehouse?.name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Quantity:</span>{' '}
                <span className="font-bold text-slate-900">{selectedRequest.quantity} units</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Supplier:</span>{' '}
                {selectedRequest.supplier?.name}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                reviewAction === 'Approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {reviewAction === 'Approved'
                ? '✅ Approving this request will automatically increment warehouse inventory and generate a stock-in transaction.'
                : '❌ Rejecting this request will mark the shipment as cancelled with no stock changes.'}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Review Note (Optional)
              </label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Inspected and verified in dock bay 2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewing}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-60 cursor-pointer ${
                  reviewAction === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewing ? 'Processing...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SupplyRequests;
