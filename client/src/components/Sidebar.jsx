import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ArrowLeftRight,
  ClipboardList,
  PlusCircle,
  Truck,
  History,
  ShoppingBag,
  Boxes,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Products Catalog', path: '/admin/products', icon: Package },
          { name: 'Warehouses', path: '/admin/warehouses', icon: Warehouse },
          { name: 'Sales Orders', path: '/admin/orders', icon: ShoppingBag },
          { name: 'Supply Requests', path: '/admin/supply-requests', icon: Truck },
          { name: 'Stock Transactions', path: '/admin/transactions', icon: History }
        ];

      case 'warehouseManager':
        return [
          { name: 'Manager Overview', path: '/manager', icon: LayoutDashboard },
          { name: 'Assigned Inventory', path: '/manager/inventory', icon: Boxes },
          { name: 'Stock In / Out', path: '/manager/stock', icon: ArrowLeftRight },
          { name: 'Products Catalog', path: '/manager/products', icon: Package },
          { name: 'Process Orders', path: '/manager/orders', icon: ShoppingBag },
          { name: 'Supply Requests', path: '/manager/supply-requests', icon: Truck },
          { name: 'Transaction History', path: '/manager/transactions', icon: History }
        ];

      case 'supplier':
        return [
          { name: 'Supplier Profile', path: '/supplier', icon: LayoutDashboard },
          { name: 'Supply Requests', path: '/supplier/requests', icon: Truck }
        ];

      case 'salesRepresentative':
        return [
          { name: 'Sales Overview', path: '/sales', icon: LayoutDashboard },
          { name: 'Product Catalog', path: '/sales/catalog', icon: Package },
          { name: 'Create Sales Order', path: '/sales/new-order', icon: PlusCircle },
          { name: 'My Orders', path: '/sales/orders', icon: ClipboardList }
        ];

      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">WareFlow</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="px-4 py-6 space-y-1.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
            Navigation Menu
          </p>

          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/admin' || link.path === '/manager' || link.path === '/supplier' || link.path === '/sales'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">WareFlow v1.0</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Role: {user?.role || 'Guest'}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
