import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'warehouseManager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'supplier':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'salesRepresentative':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'warehouseManager':
        return 'Warehouse Manager';
      case 'supplier':
        return 'Supplier';
      case 'salesRepresentative':
        return 'Sales Rep';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile Toggle & Brand title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace:
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Inventory & Warehouse Management
            </span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center overflow-hidden text-indigo-600 font-bold text-sm">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
                )}
              </div>

              {/* Name & Role badge */}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded border ${getRoleBadge(
                    user.role
                  )}`}
                >
                  {formatRoleName(user.role)}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
