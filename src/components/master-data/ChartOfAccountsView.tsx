/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ChartAccount, AccountCategory } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import {
  Edit2,
  Trash2,
  Search,
  Plus,
  Folder,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ChartOfAccountsView: React.FC = () => {
  const { chartOfAccounts, addChartAccount, editChartAccount, deleteChartAccount, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<ChartAccount | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountCategory>('asset');
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [isLeaf, setIsLeaf] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('chart_of_accounts', 'create');
  const canEdit = hasPermission('chart_of_accounts', 'edit');
  const canDelete = hasPermission('chart_of_accounts', 'delete');

  const openAddModal = (parent?: ChartAccount) => {
    setEditingAcc(null);
    if (parent) {
      setParentCode(parent.code);
      setType(parent.type);
      // Auto-suggest next child code
      const siblings = chartOfAccounts.filter((a) => a.parentCode === parent.code);
      const nextNum = siblings.length + 1;
      setCode(`${parent.code}${nextNum}`);
    } else {
      setParentCode(null);
      setType('asset');
      setCode('13');
    }
    setName('');
    setIsLeaf(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: ChartAccount) => {
    setEditingAcc(acc);
    setCode(acc.code);
    setName(acc.name);
    setType(acc.type);
    setParentCode(acc.parentCode);
    setIsLeaf(acc.isLeaf);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMsg('يرجى كتابة كود واسم الحساب');
      return;
    }

    const level = code.length;
    if (editingAcc) {
      editChartAccount(editingAcc.id, {
        code,
        name,
        type,
        parentCode,
        level,
        isLeaf,
      });
    } else {
      addChartAccount({
        code,
        name,
        type,
        parentCode,
        level,
        isLeaf,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      const res = deleteChartAccount(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const categoryLabels: Record<AccountCategory, string> = {
    asset: '1. الأصول (Assets)',
    liability: '2. الخصوم والالتزامات (Liabilities)',
    equity: '3. حقوق الملكية (Equity)',
    revenue: '4. الإيرادات (Revenues)',
    expense: '5. المصروفات (Expenses)',
  };

  const filtered = chartOfAccounts
    .filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || acc.type === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const handleExcel = () => {
    exportToExcel(
      'دليل_الحسابات_المحاسبي_الدولي_IFRS',
      ['كود الحساب', 'اسم الحساب', 'النوع الرئيسي', 'الحساب الرئيسي التابع له', 'المستوى', 'هل حساب فرعي'],
      filtered.map((a) => [
        a.code,
        a.name,
        categoryLabels[a.type],
        a.parentCode || 'رئيسي عام',
        a.level,
        a.isLeaf ? 'نعم (فرعي يقبل حركات)' : 'لا (تجميعي)',
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="شجرة الحسابات (دليل الحسابات الدولي IFRS)"
        subtitle="شجرة حسابات مالية متكاملة تتوافق مع معايير المحاسبة الدولية وتدعم الإضافة والتعديل للحسابات الفرعية"
        actionLabel="إضافة حساب رئيسي/فرعي"
        onAction={() => openAddModal()}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      />

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم الكود أو اسم الحساب..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 shrink-0">التصنيف:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">كافة الحسابات (1-5)</option>
            <option value="asset">1. الأصول</option>
            <option value="liability">2. الخصوم</option>
            <option value="equity">3. حقوق الملكية</option>
            <option value="revenue">4. الإيرادات</option>
            <option value="expense">5. المصروفات</option>
          </select>
        </div>
      </div>

      {/* Hierarchy Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-32">كود الحساب</th>
                <th className="py-3 px-4">اسم الحساب المحاسبي</th>
                <th className="py-3 px-4">التصنيف المحاسبي</th>
                <th className="py-3 px-4 text-center">المستوى</th>
                <th className="py-3 px-4 text-center">طبيعة الحساب</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد حسابات مطابقة لبحثك
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const indentLevel = Math.max(0, acc.level - 1) * 20;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !acc.isLeaf ? 'bg-slate-50/30 font-semibold text-slate-900' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{acc.code}</td>
                      <td className="py-2.5 px-4">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingRight: `${indentLevel}px` }}
                        >
                          {!acc.isLeaf ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={!acc.isLeaf ? 'font-bold' : ''}>{acc.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-700">{categoryLabels[acc.type]}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-500">{acc.level}</td>
                      <td className="py-2.5 px-4 text-center">
                        {acc.isLeaf ? (
                          <span className="text-emerald-700 font-semibold">حساب فرعي</span>
                        ) : (
                          <span className="text-slate-500 font-semibold">حساب تجميعي</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!acc.isLeaf && canCreate && (
                            <button
                              onClick={() => openAddModal(acc)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="إضافة حساب فرعي تحته"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(acc)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="تعديل الحساب"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && acc.isLeaf && (
                            <button
                              onClick={() => handleDelete(acc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAcc ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة حساب جديد في شجرة الحسابات'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الحساب المحاسبي</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: 1121"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">التصنيف المحاسبي الرئيسي</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountCategory)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="asset">1. الأصول</option>
                <option value="liability">2. الخصوم</option>
                <option value="equity">3. حقوق الملكية</option>
                <option value="revenue">4. الإيرادات</option>
                <option value="expense">5. المصروفات</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الحساب</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عملاء الجملة - فرع القاهرة"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود الحساب الرئيسي التابع له</label>
            <input
              type="text"
              value={parentCode || ''}
              onChange={(e) => setParentCode(e.target.value ? e.target.value : null)}
              placeholder="مثال: 112 (اتركه فارغاً إذا كان أصلاً رئيسياً)"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
            <input
              type="checkbox"
              id="isLeafCheck"
              checked={isLeaf}
              onChange={(e) => setIsLeaf(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isLeafCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
              حساب فرعي نهائي (يقبل تسجيل قيود يومية وحركات مباشرة)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ الحساب
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
