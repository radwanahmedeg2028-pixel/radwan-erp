/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { NAVIGATION_TABS } from './Sidebar';
import {
  LogOut,
  Download,
  Upload,
  RotateCcw,
  Printer,
  Calendar,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { triggerPrint } from '../../utils/exportUtils';

export const Header: React.FC = () => {
  const { activeTab, currentUser, logout, exportDatabaseJson, importDatabaseJson, resetToDefaultData } = useERP();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find label and parent group
  let currentGroupTitle = '';
  let currentItemLabel = '';

  for (const group of NAVIGATION_TABS) {
    const item = group.children.find((c) => c.id === activeTab);
    if (item) {
      currentGroupTitle = group.title;
      currentItemLabel = item.label;
      break;
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const ok = importDatabaseJson(content);
          if (ok) {
            alert('تم استعادة قاعدة البيانات بنجاح من النسخة الاحتياطية!');
          } else {
            alert('فشل استعادة البيانات. يرجى التأكد من صحة الملف الاحتياطي.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تفريغ كافة البيانات وبدء النظام نظيفاً بالكامل من الصفر؟')) {
      resetToDefaultData();
      alert('تم تفريغ كافة البيانات والبدء بنظام نظيف بنجاح!');
    }
  };

  const todayFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-emerald-600" />
          الرضوان للحسابات
        </span>
        <span className="text-slate-400">/</span>
        <span className="text-slate-500">{currentGroupTitle}</span>
        <span className="text-slate-400">/</span>
        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
          {currentItemLabel}
        </span>
      </div>

      {/* Zone 2: Date and Quick Utility Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Database Utilities */}
        <button
          onClick={exportDatabaseJson}
          title="تحميل نسخة احتياطية من قاعدة البيانات كاملة"
          className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">نسخ احتياطي</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="استعادة قاعدة البيانات من ملف JSON احتياطي"
          className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">استعادة</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleReset}
          title="إعادة تعيين البيانات للوضع الافتراضي"
          className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden md:inline">إعادة ضبط</span>
        </button>

        <button
          onClick={triggerPrint}
          title="طباعة الشاشة الحالية"
          className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">طباعة</span>
        </button>

        {/* User Profile & Logout */}
        <div className="h-5 w-px bg-slate-300 mx-1" />

        <div className="flex items-center gap-2">
          <div className="text-left hidden md:block">
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[140px]">
              {currentUser?.name || 'مستخدم'}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {currentUser?.role === 'admin' ? 'مدير نظام كامل' : 'محاسب عام'}
            </span>
          </div>

          <button
            onClick={logout}
            title="تسجيل الخروج من النظام"
            className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
