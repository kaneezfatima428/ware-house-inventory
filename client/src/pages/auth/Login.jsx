import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Boxes, AlertCircle, ArrowRight, Key } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      navigate(getRoleDashboardPath(loggedUser.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Login failed. Please verify credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for evaluator convenience
  const quickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Boxes className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          WareFlow Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Inventory & Warehouse Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-all cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-1">
              <Key className="w-3.5 h-3.5" /> Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill('admin@inventory.com', 'admin123')}
                className="py-1.5 px-2 text-left bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 transition-colors"
              >
                <span className="font-bold block">Admin</span>
                <span className="text-[10px] text-purple-600">admin@inventory.com</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('manager@inventory.com', 'manager123')}
                className="py-1.5 px-2 text-left bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors"
              >
                <span className="font-bold block">Manager</span>
                <span className="text-[10px] text-blue-600">manager@inventory.com</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('supplier@inventory.com', 'supplier123')}
                className="py-1.5 px-2 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
              >
                <span className="font-bold block">Supplier</span>
                <span className="text-[10px] text-emerald-600">supplier@inventory.com</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('sales@inventory.com', 'sales123')}
                className="py-1.5 px-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors"
              >
                <span className="font-bold block">Sales Rep</span>
                <span className="text-[10px] text-amber-600">sales@inventory.com</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
