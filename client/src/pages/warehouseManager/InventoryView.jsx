import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { Boxes, Search, Filter, AlertTriangle } from 'lucide-react';

const InventoryView = () => {
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedWarehouse) params.warehouse = selectedWarehouse;

      const [stockRes, whRes] = await Promise.all([
        api.get('/stock', { params }),
        api.get('/warehouses')
      ]);

      if (stockRes.data.success) {
        setStocks(stockRes.data.stocks);
      }
      if (whRes.data.success) {
        // Warehouse managers only see their assigned warehouses
        const assigned = whRes.data.warehouses.filter((w) => w.isAssigned);
        setWarehouses(assigned);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse]);

  // Client search filter
  const filteredStocks = stocks.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      s.product?.name?.toLowerCase().includes(term) ||
      s.product?.sku?.toLowerCase().includes(term) ||
      s.product?.category?.toLowerCase().includes(term) ||
      s.warehouse?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Warehouse Inventory</h1>
        <p className="text-sm text-slate-500">
          Real-time stock quantities across all warehouses assigned to your management profile.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, SKU, category..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Facility:</label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="">All Assigned Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh._id} value={wh._id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving inventory records..." />
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No stock records found for this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4">Current Units</th>
                  <th className="py-3.5 px-4">Low Stock Trigger</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStocks.map((s) => {
                  const isLow = s.quantity <= (s.product?.lowStockLimit ?? 5);
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {s.product?.imageUrl ? (
                              <img
                                src={s.product.imageUrl}
                                alt={s.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Boxes className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{s.product?.name}</span>
                            <span className="text-[11px] text-slate-400">${s.product?.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{s.product?.sku}</td>
                      <td className="py-3 px-4">{s.product?.category}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{s.warehouse?.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-sm ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {s.quantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        ≤ {s.product?.lowStockLimit ?? 5} units
                      </td>
                      <td className="py-3 px-4 text-right">
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
    </div>
  );
};

export default InventoryView;
