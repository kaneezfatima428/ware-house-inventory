import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const StockInOut = () => {
  const [mode, setMode] = useState('in'); // 'in' or 'out'
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [formData, setFormData] = useState({
    warehouse: '',
    product: '',
    quantity: '',
    note: ''
  });

  const [currentAvailable, setCurrentAvailable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const loadInitialData = async () => {
    try {
      const [whRes, prodRes, stockRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/products'),
        api.get('/stock')
      ]);

      if (whRes.data.success) {
        // Only assigned warehouses for this manager
        const assigned = whRes.data.warehouses.filter((w) => w.isAssigned);
        setWarehouses(assigned);
        if (assigned.length > 0 && !formData.warehouse) {
          setFormData((prev) => ({ ...prev, warehouse: assigned[0]._id }));
        }
      }

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        if (prodRes.data.products.length > 0 && !formData.product) {
          setFormData((prev) => ({ ...prev, product: prodRes.data.products[0]._id }));
        }
      }

      if (stockRes.data.success) {
        setStocks(stockRes.data.stocks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update current available stock when product or warehouse changes
  useEffect(() => {
    if (formData.warehouse && formData.product) {
      const match = stocks.find(
        (s) =>
          (s.warehouse?._id || s.warehouse) === formData.warehouse &&
          (s.product?._id || s.product) === formData.product
      );
      setCurrentAvailable(match ? match.quantity : 0);
    } else {
      setCurrentAvailable(null);
    }
  }, [formData.warehouse, formData.product, stocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    const qty = Number(formData.quantity);
    if (!qty || qty <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid positive quantity (> 0).' });
      return;
    }

    if (mode === 'out' && currentAvailable !== null && qty > currentAvailable) {
      setAlert({
        type: 'error',
        message: `Validation Failed: Cannot remove ${qty} units. Only ${currentAvailable} units are available in this warehouse.`
      });
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'in' ? '/stock/in' : '/stock/out';
      const res = await api.post(endpoint, {
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: qty,
        note: formData.note
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          message: res.data.message || `Successfully recorded stock-${mode}.`
        });
        setFormData((prev) => ({ ...prev, quantity: '', note: '' }));
        // Refresh stocks list
        const stockRes = await api.get('/stock');
        if (stockRes.data.success) {
          setStocks(stockRes.data.stocks);
        }
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Operation failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record Stock Movement</h1>
        <p className="text-sm text-slate-500">
          Process incoming inventory batches (Stock-In) or record verified outgoing dispatches (Stock-Out).
        </p>
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

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('in');
            setAlert({ type: '', message: '' });
          }}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'in'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          Stock-In (Receive Inventory)
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('out');
            setAlert({ type: '', message: '' });
          }}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'out'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-violet-600" />
          Stock-Out (Remove Inventory)
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warehouse Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Target Warehouse *
            </label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {warehouses.length === 0 && <option value="">No warehouses assigned to you</option>}
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} — {wh.location}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              * Only warehouses assigned to your management profile are selectable.
            </p>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Product SKU *
            </label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  [{p.sku}] {p.name} (${p.price})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Available Stock Preview Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              Current Available in Facility:
            </span>
            <span
              className={`text-sm font-bold ${
                currentAvailable === 0
                  ? 'text-rose-600'
                  : currentAvailable && currentAvailable <= 5
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            >
              {currentAvailable !== null ? `${currentAvailable} units` : 'Select product & warehouse'}
            </span>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Quantity to {mode === 'in' ? 'Add' : 'Remove'} *
            </label>
            <input
              type="number"
              min="1"
              max={mode === 'out' && currentAvailable !== null ? currentAvailable : undefined}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g. 25"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason / Reference Note
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={
                mode === 'in'
                  ? 'e.g. Received shipment from supplier'
                  : 'e.g. Outgoing warehouse dispatch / damage inspection'
              }
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || warehouses.length === 0}
            className={`w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer disabled:opacity-60 ${
              mode === 'in'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
            }`}
          >
            {submitting
              ? 'Processing Movement...'
              : mode === 'in'
              ? 'Confirm Stock-In (+)'
              : 'Confirm Stock-Out (-)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StockInOut;
