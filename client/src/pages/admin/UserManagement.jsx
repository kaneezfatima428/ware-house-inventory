import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Building,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'salesRepresentative',
    assignedWarehouses: []
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const [usersRes, whRes] = await Promise.all([
        api.get('/users', { params }),
        api.get('/warehouses')
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch users.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'salesRepresentative',
      assignedWarehouses: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      assignedWarehouses: (user.assignedWarehouses || []).map((w) => w._id || w)
    });
    setIsModalOpen(true);
  };

  const handleWarehouseCheckbox = (whId) => {
    setFormData((prev) => {
      const exists = prev.assignedWarehouses.includes(whId);
      return {
        ...prev,
        assignedWarehouses: exists
          ? prev.assignedWarehouses.filter((id) => id !== whId)
          : [...prev.assignedWarehouses, whId]
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't overwrite if empty

        const res = await api.put(`/users/${editingUser._id}`, payload);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'User updated successfully.' });
        }
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'User created successfully.' });
        }
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Action failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.data.success) {
        setAlert({ type: 'success', message: `User "${userName}" was removed.` });
        fetchUsers();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete user.'
      });
    }
  };

  const formatRole = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', class: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'warehouseManager':
        return { label: 'Warehouse Manager', class: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'supplier':
        return { label: 'Supplier', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'salesRepresentative':
        return { label: 'Sales Rep', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: role, class: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500">
            Create system accounts, assign RBAC roles, and map warehouse management rights.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New User
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Filter Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="warehouseManager">Warehouse Manager</option>
            <option value="supplier">Supplier</option>
            <option value="salesRepresentative">Sales Representative</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving users..." />
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Warehouses</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  const r = formatRole(u.role);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center shrink-0 overflow-hidden">
                            {u.image ? (
                              <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${r.class}`}
                        >
                          {r.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'warehouseManager' ? (
                          u.assignedWarehouses && u.assignedWarehouses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.assignedWarehouses.map((wh) => (
                                <span
                                  key={wh._id || wh}
                                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                                >
                                  <Building className="w-3 h-3 text-slate-400" />
                                  {wh.name || wh}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium">None assigned</span>
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create New System User'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {editingUser ? 'Password (leave blank to keep existing)' : 'Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
              required={!editingUser}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              User Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="salesRepresentative">Sales Representative</option>
              <option value="warehouseManager">Warehouse Manager</option>
              <option value="supplier">Supplier</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Assigned Warehouses for Warehouse Manager */}
          {formData.role === 'warehouseManager' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-800">
                Assigned Warehouses (Manager Access Scope):
              </label>
              {warehouses.length === 0 ? (
                <p className="text-[11px] text-slate-400">No warehouses created yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {warehouses.map((wh) => (
                    <label
                      key={wh._id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedWarehouses.includes(wh._id)}
                        onChange={() => handleWarehouseCheckbox(wh._id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        {wh.name} <span className="text-slate-400 text-[10px]">({wh.location})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
