import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const Unauthorized = () => {
  const { user, getRoleDashboardPath, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center animate-fade-in">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">403 - Access Denied</h1>
        <p className="text-sm text-slate-500 mt-2">
          Your current account role (
          <span className="font-semibold text-slate-800">{user?.role || 'Guest'}</span>) does not
          have permission to view this restricted page.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(getRoleDashboardPath())}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Go to My Dashboard
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Sign in as Different User
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
