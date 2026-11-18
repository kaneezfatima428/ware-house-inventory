import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ImageUpload from '../../components/ImageUpload';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Eye,
  Boxes
} from 'lucide-react';

const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    lowStockLimit: 5,
    supplier: '',
    imageUrl: '',
    imageFileId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const [prodRes, suppRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/users?role=supplier')
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
      }
      if (suppRes.data.success) {
        setSuppliers(suppRes.data.users);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch products.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      description: '',
      price: '',
      lowStockLimit: 5,
      supplier: '',
      imageUrl: '',
      imageFileId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description || '',
      price: product.price,
      lowStockLimit: product.lowStockLimit ?? 5,
      supplier: product.supplier?._id || product.supplier || '',
      imageUrl: product.imageUrl || '',
      imageFileId: product.imageFileId || ''
    });
    setIsModalOpen(true);
  };

  const openDetailModal = async (product) => {
    try {
      const res = await api.get(`/products/${product._id}`);
      if (res.data.success) {
        setSelectedProduct(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUploaded = ({ url, fileId }) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
      imageFileId: fileId
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Product updated successfully.' });
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Product added to catalog.' });
        }
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Operation failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete product "${name}" and all associated warehouse stock records?`)) {
      return;
    }

    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        setAlert({ type: 'success', message: `Product "${name}" was deleted.` });
        fetchProducts();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete product.'
      });
    }
  };

  // Unique categories for filter
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog Management</h1>
          <p className="text-sm text-slate-500">
            Maintain item master data, pricing, ImageKit media, and low-stock threshold triggers.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Product
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, name, category..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving catalog items..." />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No products in catalog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Low-Stock Limit</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {p.description || 'No description'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{p.sku}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">${p.price?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        ≤ {p.lowStockLimit ?? 5} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.supplier?.name || <span className="text-slate-400">Direct / None</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetailModal(p)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Warehouse Stock Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Create or Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product to Catalog'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Name *
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
                SKU (Unique Code) *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. LTP-DELL-01"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Laptops, Accessories"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Low-Stock Limit *
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockLimit}
                onChange={(e) => setFormData({ ...formData, lowStockLimit: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Associated Supplier
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">None / Company Direct</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* ImageKit Upload Component */}
          <div className="pt-2">
            <ImageUpload
              label="Product Image (ImageKit Integration)"
              currentImageUrl={formData.imageUrl}
              currentImageFileId={formData.imageFileId}
              onUploadSuccess={handleImageUploaded}
              folder="/products"
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
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Product Stock Breakdown */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Stock Levels: ${selectedProduct.product?.name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {selectedProduct.product?.imageUrl ? (
                  <img
                    src={selectedProduct.product.imageUrl}
                    alt={selectedProduct.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{selectedProduct.product?.name}</h4>
                <p className="text-xs text-slate-500 font-mono">SKU: {selectedProduct.product?.sku}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Total Inventory: {selectedProduct.stockSummary?.totalQuantity || 0} units
                  </span>
                  {selectedProduct.stockSummary?.isLowStock ? (
                    <StatusBadge status="Low Stock" />
                  ) : (
                    <StatusBadge status="In Stock" />
                  )}
                </div>
              </div>
            </div>

            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Warehouse Breakdown:
            </h5>
            {selectedProduct.stockSummary?.warehouseBreakdown?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No warehouse stock records yet. Stock must be received first.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {selectedProduct.stockSummary?.warehouseBreakdown?.map((whStock) => (
                  <div key={whStock._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{whStock.warehouse?.name}</span>
                      <p className="text-[11px] text-slate-400">{whStock.warehouse?.location}</p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{whStock.quantity} units</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductManagement;
