import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  User,
  Boxes,
  Eye,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedWarehouseData, setSelectedWarehouseData] = useState(null);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 2000,
    manager: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const [whRes, mgrRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/users?role=warehouseManager')
      ]);

      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses);
      }
      if (mgrRes.data.success) {
        setManagers(mgrRes.data.users);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch warehouses.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openCreateModal = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      location: '',
      capacity: 2000,
      manager: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (wh) => {
    setEditingWarehouse(wh);
    setFormData({
      name: wh.name,
      location: wh.location,
      capacity: wh.capacity || 2000,
      manager: wh.manager?._id || wh.manager || ''
    });
    setIsModalOpen(true);
  };

  const openInventoryModal = async (wh) => {
    try {
      const res = await api.get(`/warehouses/${wh._id}`);
      if (res.data.success) {
        setSelectedWarehouseData(res.data);
        setIsInventoryOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingWarehouse) {
        const res = await api.put(`/warehouses/${editingWarehouse._id}`, formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Warehouse updated successfully.' });
        }
      } else {
        const res = await api.post('/warehouses', formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Warehouse created successfully.' });
        }
      }

      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Action failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete warehouse "${name}"? Associated stock entries will also be removed.`)) {
      return;
    }

    try {
      const res = await api.delete(`/warehouses/${id}`);
      if (res.data.success) {
        setAlert({ type: 'success', message: `Warehouse "${name}" deleted.` });
        fetchWarehouses();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete warehouse.'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Locations</h1>
          <p className="text-sm text-slate-500">
            Configure physical storage centers, maximum capacities, and assigned operational managers.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Warehouse
        </button>
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
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Warehouse Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving warehouses..." />
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No warehouses created yet. Click "Add New Warehouse" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => (
            <div
              key={wh._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{wh.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{wh.location}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Assigned Manager:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {wh.manager?.name || <span className="text-rose-500">Unassigned</span>}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5" /> Capacity Limit:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {wh.capacity?.toLocaleString()} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openInventoryModal(wh)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> View Stock
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(wh)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(wh._id, wh.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Warehouse */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse: ${editingWarehouse.name}` : 'Create New Warehouse'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Warehouse Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. West Coast Distribution Depot"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Physical Location / Address *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 500 Industrial Parkway, Seattle, WA"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Capacity (Max Units)
            </label>
            <input
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Assigned Warehouse Manager
            </label>
            <select
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">None / Unassigned</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
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
              {submitting ? 'Saving...' : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Warehouse Inventory */}
      {selectedWarehouseData && (
        <Modal
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
          title={`Inventory: ${selectedWarehouseData.warehouse?.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Address: <span className="font-semibold text-slate-800">{selectedWarehouseData.warehouse?.location}</span> • Manager:{' '}
              <span className="font-semibold text-slate-800">{selectedWarehouseData.warehouse?.manager?.name || 'Unassigned'}</span>
            </p>

            {selectedWarehouseData.currentInventory?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                This warehouse currently has 0 stock records.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedWarehouseData.currentInventory?.map((item) => {
                      const isLow = item.quantity <= (item.product?.lowStockLimit ?? 5);
                      return (
                        <tr key={item._id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.product?.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.product?.sku}</td>
                          <td className="py-2 px-3">{item.product?.category}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.quantity} units</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={isLow ? 'Low Stock' : 'In Stock'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WarehouseManagement;
