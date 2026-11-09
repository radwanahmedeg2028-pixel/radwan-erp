/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  isPositive,
  icon,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        {icon && <div className="text-slate-400 p-1.5 bg-slate-50 rounded-lg">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {trend && (
            <span
              className={`font-semibold ${
                isPositive ? 'text-emerald-600' : isPositive === false ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              {trend}
            </span>
          )}
          {trend && subtitle && <span aria-hidden="true">·</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
