import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { History, Filter, Search, Calendar, User, Building, Package } from 'lucide-react';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.transactionType = typeFilter;

      const res = await api.get('/stock/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.product?.name?.toLowerCase().includes(term) ||
      t.product?.sku?.toLowerCase().includes(term) ||
      t.warehouse?.name?.toLowerCase().includes(term) ||
      t.performedBy?.name?.toLowerCase().includes(term) ||
      t.note?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Movement Audit Log</h1>
        <p className="text-sm text-slate-500">
          Permanent transaction history of every incoming deposit and outgoing stock withdrawal.
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
            placeholder="Search product, warehouse, user..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Movement Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="">All Movements</option>
            <option value="stock-in">Stock-In Only (+)</option>
            <option value="stock-out">Stock-Out Only (-)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving transaction records..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No stock transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date / Timestamp</th>
                  <th className="py-3.5 px-4">Movement</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Performed By</th>
                  <th className="py-3.5 px-4">Reference Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(t.date || t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.transactionType} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{t.product?.name}</span>
                      <span className="text-[11px] font-mono text-indigo-600">{t.product?.sku}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{t.warehouse?.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className={t.transactionType === 'stock-in' ? 'text-emerald-600' : 'text-violet-600'}>
                        {t.transactionType === 'stock-in' ? '+' : '-'}
                        {t.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.performedBy?.name || 'System Auto'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {t.note || '—'}
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

export default TransactionHistory;
