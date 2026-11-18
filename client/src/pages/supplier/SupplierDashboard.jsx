import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Truck, Package, Clock, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const SupplierDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    image: user?.image || '',
    imageFileId: user?.imageFileId || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ type: '', message: '' });

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/products?mine=true')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const handleLogoUpload = ({ url, fileId }) => {
    setProfileData((prev) => ({
      ...prev,
      image: url,
      imageFileId: fileId
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileAlert({ type: '', message: '' });

    try {
      // Current user can update their own details
      const res = await api.put(`/users/${user._id}`, profileData);
      if (res.data.success) {
        updateUserProfile(res.data.user);
        setProfileAlert({ type: 'success', message: 'Supplier profile and branding updated successfully.' });
      }
    } catch (err) {
      setProfileAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading supplier workspace..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supplier Portal</h1>
        <p className="text-sm text-slate-500">
          Manage your supplier company profile, ImageKit brand logo, and review supplied products.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Associated Products"
          value={stats?.myProductsCount || products.length || 0}
          icon={Package}
          color="indigo"
          subtitle="Catalog SKUs supplied"
        />
        <StatsCard
          title="Total Supply Requests"
          value={stats?.totalRequests || 0}
          icon={Truck}
          color="blue"
          subtitle="All submitted requests"
        />
        <StatsCard
          title="Pending Review"
          value={stats?.pendingRequests || 0}
          icon={Clock}
          color="amber"
          subtitle="Awaiting manager signoff"
        />
        <StatsCard
          title="Approved Requests"
          value={stats?.approvedRequests || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Deposited into inventory"
        />
      </div>

      {/* Grid: Profile settings & Associated Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile / ImageKit Logo Management */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Company Brand Profile</h2>
          <p className="text-xs text-slate-500 mb-4">
            Upload your official company logo using authenticated ImageKit integration.
          </p>

          {profileAlert.message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 ${
                profileAlert.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {profileAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileAlert.message}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Company / Supplier Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+1 (555) 0123"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <ImageUpload
                label="Supplier Logo (ImageKit)"
                currentImageUrl={profileData.image}
                currentImageFileId={profileData.imageFileId}
                onUploadSuccess={handleLogoUpload}
                folder="/suppliers"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving Changes...' : 'Save Profile & Logo'}
            </button>
          </form>
        </div>

        {/* Associated Products Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Associated Catalog Products</h2>
              <p className="text-xs text-slate-500">
                Products mapped to your supplier account in the catalog.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              {products.length} Products
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No products mapped to your account yet. Contact an administrator to link products.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Catalog Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600">{p.sku}</td>
                      <td className="py-2.5 px-3">{p.category}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">${p.price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
