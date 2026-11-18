import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
      case 'completed':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
      case 'stock-in':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
      case 'stock-out':
        return 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/10';
      case 'low stock':
      case 'low':
        return 'bg-red-50 text-red-700 border-red-200 ring-red-500/20 font-semibold';
      case 'in stock':
        return 'bg-green-50 text-green-700 border-green-200 ring-green-500/10';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
    }
  };

  const getDotColor = () => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
      case 'approved':
        return 'bg-emerald-500';
      case 'cancelled':
      case 'rejected':
      case 'low stock':
      case 'low':
        return 'bg-rose-500';
      case 'stock-in':
        return 'bg-emerald-500';
      case 'stock-out':
        return 'bg-violet-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ring-1 ring-inset ${getStyles()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
