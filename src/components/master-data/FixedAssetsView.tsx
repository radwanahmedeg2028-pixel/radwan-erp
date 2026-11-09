/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { FixedAsset } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Building } from 'lucide-react';

export const FixedAssetsView: React.FC = () => {
  const { assets, addAsset, editAsset, deleteAsset, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('assets', 'create');
  const canEdit = hasPermission('assets', 'edit');
  const canDelete = hasPermission('assets', 'delete');

  const openAddModal = () => {
    setEditingAsset(null);
    setCode('AST-' + String(assets.length + 1).padStart(2, '0'));
    setName('');
    setOpeningBalance(0);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (a: FixedAsset) => {
    setEditingAsset(a);
    setCode(a.code);
    setName(a.name);
    setOpeningBalance(a.openingBalance);
    setPurchaseDate(a.purchaseDate || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الأصل');
      return;
    }
    if (editingAsset) {
      editAsset(editingAsset.id, {
        code,
        name,
        openingBalance: Number(openingBalance),
        purchaseDate,
      });
    } else {
      addAsset({
        code,
        name,
        openingBalance: Number(openingBalance),
        purchaseDate,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      deleteAsset(id);
    }
  };

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'الأصول_الثابتة',
      ['كود الأصل', 'اسم الأصل', 'تاريخ الشراء / الاقتناء', 'الرصيد الافتتاحي (التكلفة التاريخية)', 'القيمة الدفترية الحالية'],
      filtered.map((a) => [a.code, a.name, a.purchaseDate || '', a.openingBalance, a.currentBookValue])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد الأصول الثابتة"
        subtitle="سجل الأصول الرأسمالية والمعدات والسيارات والعقارات التابعة للمنشأة"
        actionLabel="إضافة أصل جديد"
        onAction={openAddModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الأصل أو الكود..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">كود الأصل</th>
                <th className="py-3 px-4">اسم الأصل</th>
                <th className="py-3 px-4">تاريخ الاقتناء</th>
                <th className="py-3 px-4 text-left">الرصيد الافتتاحي (التكلفة)</th>
                <th className="py-3 px-4 text-left">صافي القيمة الدفترية الحالية</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد أصول مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{a.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      {a.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{a.purchaseDate || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-semibold text-slate-700">
                      {formatCurrency(a.openingBalance)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                      {formatCurrency(a.currentBookValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(a.id)}
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
        title={editingAsset ? 'تعديل بيانات الأصل' : 'إضافة أصل جديد'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود الأصل</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الأصل</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: سيارة نقل بضائع، حاسب آلي، أثاث..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (التكلفة)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الاقتناء</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
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
