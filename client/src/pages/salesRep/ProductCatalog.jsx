import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { Search, Package, PlusCircle, Tag, CheckCircle2, Boxes } from 'lucide-react';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const navigate = useNavigate();

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const [prodRes, stockRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/stock')
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
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
    fetchCatalog();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  // Helper to compute total stock across all warehouses for a product
  const getProductTotalStock = (productId) => {
    const matching = stocks.filter(
      (s) => (s.product?._id || s.product) === productId
    );
    return matching.reduce((sum, item) => sum + item.quantity, 0);
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const startOrderWithProduct = (productId) => {
    navigate('/sales/new-order', { state: { preselectedProductId: productId } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog & Availability</h1>
          <p className="text-sm text-slate-500">
            Browse searchable product inventory with real-time stock availability before ordering.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by name, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving products catalog..." />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No matching products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => {
            const totalAvailable = getProductTotalStock(p._id);
            const isOutOfStock = totalAvailable === 0;
            const isLowStock = totalAvailable <= (p.lowStockLimit ?? 5);

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="w-full h-44 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-400" />
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                      <span className="font-extrabold text-indigo-600 text-sm shrink-0">
                        ${p.price?.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-500 font-medium">SKU: {p.sku}</p>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {p.description || 'No additional description.'}
                    </p>

                    {/* Stock indicator badge */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Network Stock:</span>
                      <span
                        className={`font-bold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {totalAvailable} units
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => startOrderWithProduct(p._id)}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Sales Order'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
