/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Phone, User, MapPin } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, editSupplier, deleteSupplier, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('suppliers', 'create');
  const canEdit = hasPermission('suppliers', 'edit');
  const canDelete = hasPermission('suppliers', 'delete');

  const openAddModal = () => {
    setEditingSupplier(null);
    setCode('SUP-' + String(suppliers.length + 1).padStart(3, '0'));
    setName('');
    setOpeningBalance(0);
    setContactPerson('');
    setPhone('');
    setBillingAddress('');
    setContactDetails('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setCode(s.code);
    setName(s.name);
    setOpeningBalance(s.openingBalance);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setBillingAddress(s.billingAddress);
    setContactDetails(s.contactDetails);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المورد');
      return;
    }
    if (editingSupplier) {
      editSupplier(editingSupplier.id, {
        code,
        name,
        openingBalance: Number(openingBalance),
        contactPerson,
        phone,
        billingAddress,
        contactDetails,
      });
    } else {
      addSupplier({
        code,
        name,
        openingBalance: Number(openingBalance),
        contactPerson,
        phone,
        billingAddress,
        contactDetails,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(id);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'الموردين',
      ['كود المورد', 'اسم المورد', 'الرصيد الافتتاحي', 'المستحق الحالي', 'الشخص المسئول', 'رقم الهاتف', 'عنوان الفوترة', 'بيانات التواصل'],
      filtered.map((s) => [
        s.code,
        s.name,
        s.openingBalance,
        s.currentBalance,
        s.contactPerson,
        s.phone,
        s.billingAddress,
        s.contactDetails,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد الموردين"
        subtitle="إدارة بيانات وحسابات الموردين التجاريين، الأرصدة الافتتاحية والمستحقات"
        actionLabel="إضافة مورد جديد"
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
          placeholder="ابحث باسم المورد، الكود، الهاتف أو الشخص المسئول..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">كود المورد</th>
                <th className="py-3 px-4">اسم المورد</th>
                <th className="py-3 px-4">الشخص المسئول / الهاتف</th>
                <th className="py-3 px-4">عنوان الفوترة</th>
                <th className="py-3 px-4">بيانات التواصل</th>
                <th className="py-3 px-4 text-left">الرصيد الافتتاحي</th>
                <th className="py-3 px-4 text-left">المستحق الحالي للمورد</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    لا يوجد موردون مطابقون لبيانات البحث
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4">
                      <div>{s.contactPerson || '-'}</div>
                      {s.phone && <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{s.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{s.billingAddress || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[150px]">{s.contactDetails || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono text-slate-600">
                      {formatCurrency(s.openingBalance)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-amber-700">
                      {formatCurrency(s.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(s.id)}
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
        title={editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود المورد</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المورد / الشركة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم شركة التوريد أو المورد"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الشخص المسئول</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="اسم مسئول المبيعات لدى المورد"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none text-right"
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان الفوترة والمقر</label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="المنطقة، الشارع، مقر المصنع أو الشركة"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">بيانات التواصل والبريد الإلكتروني</label>
            <textarea
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              rows={2}
              placeholder="البريد الإلكتروني، الحساب البنكي، أو ملاحظات توريد"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
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
              حفظ بيانات المورد
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
