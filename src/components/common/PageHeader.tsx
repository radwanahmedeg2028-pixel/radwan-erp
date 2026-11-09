/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Printer, FileSpreadsheet } from 'lucide-react';
import { triggerPrint } from '../../utils/exportUtils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  canCreate?: boolean;
  onExportExcel?: () => void;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  canCreate = true,
  onExportExcel,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {children}

        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            تصدير إكسيل
          </button>
        )}

        <button
          onClick={triggerPrint}
          className="no-print flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          طباعة
        </button>

        {actionLabel && onAction && canCreate && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
