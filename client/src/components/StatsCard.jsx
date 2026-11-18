import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', subtitle }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      ring: 'ring-indigo-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-100'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      ring: 'ring-rose-100'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-100'
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      ring: 'ring-violet-100'
    }
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value !== undefined ? value : '--'}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${selectedColor.bg} ${selectedColor.text} ring-1 ${selectedColor.ring}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
