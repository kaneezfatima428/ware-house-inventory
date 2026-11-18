import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  ShoppingBag,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  Building,
  User,
  Phone,
  ArrowRight
} from 'lucide-react';

const CreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = location.state?.preselectedProductId;

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Multi-product lines
  const [orderItems, setOrderItems] = useState([
    { product: preselectedId || '', quantity: 1 }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [whRes, prodRes, stockRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/products'),
        api.get('/stock')
      ]);

      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses);
        if (whRes.data.warehouses.length > 0) {
          setSelectedWarehouse(whRes.data.warehouses[0]._id);
        }
      }

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        if (!preselectedId && prodRes.data.products.length > 0) {
          setOrderItems([{ product: prodRes.data.products[0]._id, quantity: 1 }]);
        }
      }

      if (stockRes.data.success) {
        setStocks(stockRes.data.stocks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get available stock in current warehouse for a product
  const getAvailableStockInWarehouse = (productId) => {
    if (!selectedWarehouse || !productId) return 0;
    const match = stocks.find(
      (s) =>
        (s.warehouse?._id || s.warehouse) === selectedWarehouse &&
        (s.product?._id || s.product) === productId
    );
    return match ? match.quantity : 0;
  };

  // Helper to get product price
  const getProductPrice = (productId) => {
    const p = products.find((prod) => prod._id === productId);
    return p ? p.price : 0;
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItemRow = () => {
    const firstProdId = products[0]?._id || '';
    setOrderItems((prev) => [...prev, { product: firstProdId, quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total calculation
  const grandTotal = orderItems.reduce((sum, item) => {
    const price = getProductPrice(item.product);
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!customerName || !customerPhone || !selectedWarehouse) {
      setAlert({ type: 'error', message: 'Please provide customer name, phone, and select a warehouse.' });
      return;
    }

    if (orderItems.length === 0) {
      setAlert({ type: 'error', message: 'Please add at least one product to the order.' });
      return;
    }

    // Check stock availability for all items in the chosen warehouse
    for (const item of orderItems) {
      const p = products.find((prod) => prod._id === item.product);
      const available = getAvailableStockInWarehouse(item.product);
      const qty = Number(item.quantity);

      if (qty <= 0) {
        setAlert({ type: 'error', message: `Quantity for '${p?.name}' must be at least 1.` });
        return;
      }

      if (qty > available) {
        setAlert({
          type: 'error',
          message: `Stock Validation Error: '${p?.name}' only has ${available} units available in this warehouse. You requested ${qty}. Cannot order beyond available stock.`
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        customerName,
        customerPhone,
        warehouse: selectedWarehouse,
        products: orderItems.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          price: getProductPrice(item.product)
        }))
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          message: `Order #${res.data.order?.orderNumber} created in Pending status!`
        });
        setTimeout(() => {
          navigate('/sales/orders');
        }, 1200);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to place order.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Sales Order</h1>
        <p className="text-sm text-slate-500">
          Capture multi-item customer orders, validate warehouse stock, and submit for fulfillment.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Fulfillment Warehouse Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Customer & Warehouse Fulfillment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp / Alex Smith"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Customer Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fulfillment Warehouse *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-product Order Items Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Order Line Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Item
            </button>
          </div>

          <div className="space-y-3">
            {orderItems.map((item, index) => {
              const unitPrice = getProductPrice(item.product);
              const available = getAvailableStockInWarehouse(item.product);
              const lineTotal = unitPrice * (Number(item.quantity) || 0);
              const isInsufficient = Number(item.quantity) > available;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    isInsufficient
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Product Selection */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Product Item
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Unit Price & Stock Indicator */}
                    <div className="sm:col-span-2 text-xs">
                      <span className="text-slate-400 block">Unit Price:</span>
                      <span className="font-semibold text-slate-800">${unitPrice?.toFixed(2)}</span>
                      <span
                        className={`block text-[10px] mt-0.5 font-bold ${
                          available === 0
                            ? 'text-rose-600'
                            : isInsufficient
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        Stock: {available} units
                      </span>
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-xs text-right sm:text-left">
                      <span className="text-slate-400 block">Line Total:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ${lineTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Delete item button */}
                    <div className="sm:col-span-1 text-right">
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isInsufficient && (
                    <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Warning: Quantity ({item.quantity}) exceeds available warehouse stock ({available}).
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total Summary Box */}
          <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
              Calculated Order Total:
            </span>
            <span className="text-2xl font-black text-white">
              ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
        >
          {submitting ? 'Placing Order...' : 'Submit Sales Order'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;
