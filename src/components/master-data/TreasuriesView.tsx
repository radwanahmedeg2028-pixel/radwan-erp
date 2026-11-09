/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Treasury, TreasuryType } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Wallet, Landmark, Smartphone } from 'lucide-react';

export const TreasuriesView: React.FC = () => {
  const { treasuries, addTreasury, editTreasury, deleteTreasury, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreasury, setEditingTreasury] = useState<Treasury | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<TreasuryType>('cash');
  const [accountName, setAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('treasuries', 'create');
  const canEdit = hasPermission('treasuries', 'edit');
  const canDelete = hasPermission('treasuries', 'delete');

  const openAddModal = () => {
    setEditingTreasury(null);
    setCode('TRS-' + String(treasuries.length + 1).padStart(2, '0'));
    setType('cash');
    setAccountName('');
    setOpeningBalance(0);
    setBankName('');
    setAccountNumber('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Treasury) => {
    setEditingTreasury(t);
    setCode(t.code);
    setType(t.type);
    setAccountName(t.accountName);
    setOpeningBalance(t.openingBalance);
    setBankName(t.bankName || '');
    setAccountNumber(t.accountNumber || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setErrorMsg('يرجى إدخال اسم الحساب / الصندوق');
      return;
    }
    if (editingTreasury) {
      editTreasury(editingTreasury.id, {
        code,
        type,
        accountName,
        openingBalance: Number(openingBalance),
        bankName,
        accountNumber,
      });
    } else {
      addTreasury({
        code,
        type,
        accountName,
        openingBalance: Number(openingBalance),
        bankName,
        accountNumber,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصندوق / الحساب؟')) {
      deleteTreasury(id);
    }
  };

  const filtered = treasuries.filter(
    (t) =>
      t.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'الصناديق_والخزن_والبنوك',
      ['كود الصندوق', 'نوع الحساب', 'اسم الحساب', 'الرصيد الافتتاحي', 'الرصيد الحالي', 'اسم البنك / رقم الحساب'],
      filtered.map((t) => [
        t.code,
        t.type === 'cash' ? 'خزينة نقدية' : t.type === 'bank' ? 'حساب بنكي' : 'محفظة إلكترونية',
        t.accountName,
        t.openingBalance,
        t.currentBalance,
        t.bankName || t.accountNumber || '',
      ])
    );
  };

  const typeIcons: Record<TreasuryType, React.ReactNode> = {
    cash: <Wallet className="w-5 h-5 text-emerald-600" />,
    bank: <Landmark className="w-5 h-5 text-sky-600" />,
    e_wallet: <Smartphone className="w-5 h-5 text-amber-600" />,
  };

  const typeLabels: Record<TreasuryType, string> = {
    cash: 'خزينة نقدية',
    bank: 'حساب بنكي جاري',
    e_wallet: 'محفظة إلكترونية',
  };

  return (
    <div>
      <PageHeader
        title="تكويد الصناديق والخزن والبنوك"
        subtitle="إدارة الخزائن النقدية، الحسابات البنكية، والمحافظ الإلكترونية وأرصدتها الحالية"
        actionLabel="إضافة صندوق / بنك جديد"
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
          placeholder="ابحث باسم الصندوق، الكود، أو البنك..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {t.code}
                </span>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {typeIcons[t.type]}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">{typeLabels[t.type]}</span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{t.accountName}</h3>
                </div>
              </div>

              {(t.bankName || t.accountNumber) && (
                <div className="text-xs text-slate-500 font-mono mb-3 bg-slate-50 p-2 rounded-lg">
                  {t.bankName && <div>البنك: {t.bankName}</div>}
                  {t.accountNumber && <div dir="ltr">الحساب: {t.accountNumber}</div>}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">الرصيد الفعلي الحالي:</span>
              <span className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                {formatCurrency(t.currentBalance)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTreasury ? 'تعديل بيانات الحساب / الصندوق' : 'إضافة صندوق / حساب بنكي جديد'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الصندوق</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الصندوق</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TreasuryType)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="cash">نقدي (خزينة نقدية)</option>
                <option value="bank">بنك (حساب بنكي)</option>
                <option value="e_wallet">محفظة إلكترونية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الحساب / الصندوق</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="مثال: الخزينة الرئيسية، البنك الأهلي..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {type === 'bank' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم البنك</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="مثال: البنك الأهلي المصري"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {(type === 'bank' || type === 'e_wallet') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الحساب / الهاتف</label>
              <input
                type="text"
                dir="ltr"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="رقم الحساب البنكي أو رقم المحفظة"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none text-left"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (ج.م)</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
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
