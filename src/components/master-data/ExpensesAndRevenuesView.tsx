/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ExpenseType, RevenueType } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const ExpensesAndRevenuesView: React.FC = () => {
  const {
    expenses,
    revenues,
    addExpense,
    editExpense,
    deleteExpense,
    addRevenue,
    editRevenue,
    deleteRevenue,
    hasPermission,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'revenues'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseType | RevenueType | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission(activeSubTab === 'expenses' ? 'expenses' : 'revenues', 'create');
  const canEdit = hasPermission(activeSubTab === 'expenses' ? 'expenses' : 'revenues', 'edit');
  const canDelete = hasPermission(activeSubTab === 'expenses' ? 'expenses' : 'revenues', 'delete');

  const openAddModal = () => {
    setEditingItem(null);
    const prefix = activeSubTab === 'expenses' ? 'EXP-' : 'REV-';
    const count = activeSubTab === 'expenses' ? expenses.length : revenues.length;
    setCode(prefix + String(count + 1).padStart(2, '0'));
    setName('');
    setOpeningBalance(0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseType | RevenueType) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setOpeningBalance(item.openingBalance);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال الاسم');
      return;
    }

    if (activeSubTab === 'expenses') {
      if (editingItem) {
        editExpense(editingItem.id, { code, name, openingBalance: Number(openingBalance) });
      } else {
        addExpense({ code, name, openingBalance: Number(openingBalance) });
      }
    } else {
      if (editingItem) {
        editRevenue(editingItem.id, { code, name, openingBalance: Number(openingBalance) });
      } else {
        addRevenue({ code, name, openingBalance: Number(openingBalance) });
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      if (activeSubTab === 'expenses') {
        deleteExpense(id);
      } else {
        deleteRevenue(id);
      }
    }
  };

  const currentList = activeSubTab === 'expenses' ? expenses : revenues;
  const filtered = currentList.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      activeSubTab === 'expenses' ? 'أنواع_المصروفات' : 'أنواع_الإيرادات',
      ['الكود', 'الاسم', 'الرصيد الافتتاحي', 'الرصيد التراكمي الحالي'],
      filtered.map((item) => [item.code, item.name, item.openingBalance, item.currentBalance])
    );
  };

  return (
    <div>
      <PageHeader
        title={activeSubTab === 'expenses' ? 'تكويد بنود المصروفات' : 'تكويد بنود الإيرادات الأخرى'}
        subtitle="تعريف وتبويب المصروفات الإدارية والعمومية وإيرادات الأنشطة والخدمات"
        actionLabel={activeSubTab === 'expenses' ? 'إضافة بند مصروف' : 'إضافة بند إيراد'}
        onAction={openAddModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'expenses' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المصروفات ({expenses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('revenues')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'revenues' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الإيرادات ({revenues.length})
          </button>
        </div>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث بالاسم أو الكود..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">الكود</th>
                <th className="py-3 px-4">{activeSubTab === 'expenses' ? 'اسم المصروف' : 'اسم الإيراد'}</th>
                <th className="py-3 px-4 text-left">الرصيد الافتتاحي</th>
                <th className="py-3 px-4 text-left">
                  {activeSubTab === 'expenses' ? 'إجمالي المنصرف الفعلي' : 'إجمالي المحصل الفعلي'}
                </th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    لا توجد بنود مطابقة لبيانات البحث
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {activeSubTab === 'expenses' ? (
                        <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      )}
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-slate-600">
                      {formatCurrency(item.openingBalance)}
                    </td>
                    <td
                      className={`py-3 px-4 text-left font-mono font-bold ${
                        activeSubTab === 'expenses' ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(item.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `تعديل ${activeSubTab === 'expenses' ? 'المصروف' : 'الإيراد'}`
            : `إضافة ${activeSubTab === 'expenses' ? 'مصروف جديد' : 'إيراد جديد'}`
        }
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الكود</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {activeSubTab === 'expenses' ? 'اسم المصروف' : 'اسم الإيراد'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إيجار، كهرباء، صيانة..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (ج.م)</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
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
              حفظ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
