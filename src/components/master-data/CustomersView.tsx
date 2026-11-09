/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Customer } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Phone, User, MapPin, Briefcase } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, editCustomer, deleteCustomer, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(50000);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [salesRepresentative, setSalesRepresentative] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('customers', 'create');
  const canEdit = hasPermission('customers', 'edit');
  const canDelete = hasPermission('customers', 'delete');

  const openAddModal = () => {
    setEditingCustomer(null);
    setCode('CUST-' + String(customers.length + 1).padStart(3, '0'));
    setName('');
    setCreditLimit(50000);
    setOpeningBalance(0);
    setContactPerson('');
    setPhone('');
    setSalesRepresentative('');
    setBillingAddress('');
    setContactDetails('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCode(c.code);
    setName(c.name);
    setCreditLimit(c.creditLimit);
    setOpeningBalance(c.openingBalance);
    setContactPerson(c.contactPerson);
    setPhone(c.phone);
    setSalesRepresentative(c.salesRepresentative);
    setBillingAddress(c.billingAddress);
    setContactDetails(c.contactDetails);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم العميل');
      return;
    }
    if (editingCustomer) {
      editCustomer(editingCustomer.id, {
        code,
        name,
        creditLimit: Number(creditLimit),
        openingBalance: Number(openingBalance),
        contactPerson,
        phone,
        salesRepresentative,
        billingAddress,
        contactDetails,
      });
    } else {
      addCustomer({
        code,
        name,
        creditLimit: Number(creditLimit),
        openingBalance: Number(openingBalance),
        contactPerson,
        phone,
        salesRepresentative,
        billingAddress,
        contactDetails,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteCustomer(id);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'العملاء',
      ['كود العميل', 'اسم العميل', 'حد الائتمان', 'الرصيد الافتتاحي', 'الرصيد الحالي', 'الشخص المسئول', 'رقم الهاتف', 'المندوب', 'عنوان الفوترة', 'بيانات التواصل'],
      filtered.map((c) => [
        c.code,
        c.name,
        c.creditLimit,
        c.openingBalance,
        c.currentBalance,
        c.contactPerson,
        c.phone,
        c.salesRepresentative,
        c.billingAddress,
        c.contactDetails,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد العملاء"
        subtitle="إدارة بيانات وحسابات العملاء، حدود الائتمان، والأرصدة الافتتاحية والمندوبين"
        actionLabel="إضافة عميل جديد"
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
          placeholder="ابحث باسم العميل، الكود، الهاتف، أو الشخص المسئول..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">كود العميل</th>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">الشخص المسئول / الهاتف</th>
                <th className="py-3 px-4">المندوب</th>
                <th className="py-3 px-4">عنوان الفوترة</th>
                <th className="py-3 px-4 text-left">حد الائتمان</th>
                <th className="py-3 px-4 text-left">الرصيد الافتتاحي</th>
                <th className="py-3 px-4 text-left">المديونية الحالية</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    لا يوجد عملاء مطابقون لبيانات البحث
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">
                      <div>{c.contactPerson || '-'}</div>
                      {c.phone && <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{c.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.salesRepresentative || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">{c.billingAddress || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-medium text-slate-600">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-slate-600">
                      {formatCurrency(c.openingBalance)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-rose-700">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
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
        title={editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود العميل</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العميل / الشركة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم العميل أو المؤسسة"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الشخص المسئول</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="اسم مسئول المشتريات أو الاتصال"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المندوب المسئول</label>
              <input
                type="text"
                value={salesRepresentative}
                onChange={(e) => setSalesRepresentative(e.target.value)}
                placeholder="اسم مندوب المبيعات"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حد الائتمان (ج.م)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان الفوترة والشحن</label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="العنوان التفصيلي للفوترة والتوصيل"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">بيانات التواصل والبريد الإلكتروني</label>
            <textarea
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              rows={2}
              placeholder="البريد الإلكتروني أو وسائل تواصل إضافية"
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
              حفظ بيانات العميل
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
