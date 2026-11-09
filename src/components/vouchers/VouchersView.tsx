/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ReceiptVoucher,
  PaymentVoucher,
  CashTransfer,
  AccountPartyType,
  TreasuryType,
} from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel, triggerPrint } from '../../utils/exportUtils';
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Printer,
  Trash2,
  Calendar,
  Building,
  CheckCircle,
} from 'lucide-react';

export const VouchersView: React.FC = () => {
  const {
    activeTab,
    receiptVouchers,
    addReceiptVoucher,
    deleteReceiptVoucher,
    paymentVouchers,
    addPaymentVoucher,
    deletePaymentVoucher,
    cashTransfers,
    addCashTransfer,
    deleteCashTransfer,
    treasuries,
    customers,
    suppliers,
    employees,
    partners,
    expenses,
    revenues,
    hasPermission,
  } = useERP();

  // Determine active sub-tab from main activeTab or local switcher
  const [subTab, setSubTab] = useState<'receipt' | 'payment' | 'transfer'>(
    activeTab === 'payment_vouchers'
      ? 'payment'
      : activeTab === 'cash_transfers'
      ? 'transfer'
      : 'receipt'
  );

  const [searchTerm, setSearchTerm] = useState('');

  // Receipt / Payment Voucher Modal
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [accountType, setAccountType] = useState<AccountPartyType>('customer');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<TreasuryType>('cash');
  const [treasuryId, setTreasuryId] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [fromTreasuryId, setFromTreasuryId] = useState('');
  const [toTreasuryId, setToTreasuryId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Printable voucher modal
  const [printableVoucher, setPrintableVoucher] = useState<{
    type: 'receipt' | 'payment';
    data: ReceiptVoucher | PaymentVoucher;
  } | null>(null);

  const canCreate = hasPermission(
    subTab === 'receipt'
      ? 'receipt_vouchers'
      : subTab === 'payment'
      ? 'payment_vouchers'
      : 'cash_transfers',
    'create'
  );

  const canDelete = hasPermission(
    subTab === 'receipt'
      ? 'receipt_vouchers'
      : subTab === 'payment'
      ? 'payment_vouchers'
      : 'cash_transfers',
    'delete'
  );

  // Open modal
  const openNewVoucherModal = (type: 'receipt' | 'payment') => {
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setVoucherAmount(0);
    const defaultAccType = type === 'receipt' ? 'customer' : 'supplier';
    setAccountType(defaultAccType);
    setAccountId(type === 'receipt' ? customers[0]?.id || '' : suppliers[0]?.id || '');
    setPaymentMethod('cash');
    const defaultTreasury = treasuries.find((t) => t.type === 'cash')?.id || treasuries[0]?.id || '';
    setTreasuryId(defaultTreasury);
    setNotes('');
    setReferenceDoc('');
    setErrorMsg(null);
    setIsVoucherModalOpen(true);
  };

  const openNewTransferModal = () => {
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferAmount(0);
    setFromTreasuryId(treasuries[0]?.id || '');
    setToTreasuryId(treasuries[1]?.id || treasuries[0]?.id || '');
    setTransferNotes('');
    setErrorMsg(null);
    setIsTransferModalOpen(true);
  };

  // Get party name by type & id
  const getPartyName = (type: AccountPartyType, id: string): string => {
    if (type === 'customer') return customers.find((c) => c.id === id)?.name || 'عميل';
    if (type === 'supplier') return suppliers.find((s) => s.id === id)?.name || 'مورد';
    if (type === 'employee') return employees.find((e) => e.id === id)?.name || 'موظف';
    if (type === 'partner') return partners.find((p) => p.id === id)?.name || 'شريك';
    if (type === 'expense') return expenses.find((exp) => exp.id === id)?.name || 'مصروف';
    if (type === 'revenue') return revenues.find((r) => r.id === id)?.name || 'إيراد';
    return 'حساب عام';
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherAmount || voucherAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!treasuryId) {
      setErrorMsg('يرجى تحديد الخزينة أو البنك');
      return;
    }

    const trs = treasuries.find((t) => t.id === treasuryId);
    const trsName = trs?.accountName || 'خزينة';
    const accName = getPartyName(accountType, accountId);

    if (subTab === 'receipt') {
      addReceiptVoucher({
        date: voucherDate,
        amount: Number(voucherAmount),
        accountType,
        accountId,
        accountName: accName,
        paymentMethod,
        treasuryId,
        treasuryName: trsName,
        notes,
        referenceDoc,
      });
    } else {
      addPaymentVoucher({
        date: voucherDate,
        amount: Number(voucherAmount),
        accountType,
        accountId,
        accountName: accName,
        paymentMethod,
        treasuryId,
        treasuryName: trsName,
        notes,
        referenceDoc,
      });
    }
    setIsVoucherModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (fromTreasuryId === toTreasuryId) {
      setErrorMsg('لا يمكن التحويل من وإلى نفس الخزينة');
      return;
    }

    const fromT = treasuries.find((t) => t.id === fromTreasuryId);
    const toT = treasuries.find((t) => t.id === toTreasuryId);

    if (!fromT || !toT) {
      setErrorMsg('يرجى اختيار خزينة المصدر وخزينة الوجهة');
      return;
    }

    if (fromT.currentBalance < transferAmount) {
      setErrorMsg(`رصيد الخزينة المصدر (${formatCurrency(fromT.currentBalance)}) لا يكفي لإتمام التحويل`);
      return;
    }

    addCashTransfer({
      date: transferDate,
      amount: Number(transferAmount),
      fromTreasuryId,
      fromTreasuryName: fromT.accountName,
      fromType: fromT.type,
      toTreasuryId,
      toTreasuryName: toT.accountName,
      toType: toT.type,
      notes: transferNotes,
    });
    setIsTransferModalOpen(false);
  };

  // Filtered lists
  const filteredReceipts = receiptVouchers.filter(
    (v) =>
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = paymentVouchers.filter(
    (v) =>
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransfers = cashTransfers.filter(
    (t) =>
      t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromTreasuryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toTreasuryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    if (subTab === 'receipt') {
      exportToExcel(
        'سندات_القبض',
        ['رقم السند', 'التاريخ', 'المبلغ', 'نوع الحساب', 'اسم الحساب', 'طريقة القبض', 'الخزينة / البنك', 'البيان'],
        filteredReceipts.map((v) => [
          v.voucherNumber,
          v.date,
          v.amount,
          v.accountType,
          v.accountName,
          v.paymentMethod,
          v.treasuryName,
          v.notes,
        ])
      );
    } else if (subTab === 'payment') {
      exportToExcel(
        'سندات_الصرف_والدفع',
        ['رقم السند', 'التاريخ', 'المبلغ', 'نوع الحساب', 'اسم الحساب', 'طريقة الدفع', 'الخزينة / البنك', 'البيان'],
        filteredPayments.map((v) => [
          v.voucherNumber,
          v.date,
          v.amount,
          v.accountType,
          v.accountName,
          v.paymentMethod,
          v.treasuryName,
          v.notes,
        ])
      );
    } else {
      exportToExcel(
        'تحويلات_النقدية',
        ['رقم التحويل', 'التاريخ', 'المبلغ', 'من خزينة', 'إلى خزينة', 'البيان'],
        filteredTransfers.map((t) => [
          t.transferNumber,
          t.date,
          t.amount,
          t.fromTreasuryName,
          t.toTreasuryName,
          t.notes,
        ])
      );
    }
  };

  return (
    <div>
      <PageHeader
        title={
          subTab === 'receipt'
            ? 'سندات القبض النقدية والبنكية'
            : subTab === 'payment'
            ? 'سندات الصرف والدفع'
            : 'تحويلات النقدية بين الخزن والبنوك'
        }
        subtitle="تسجيل حركات التحصيل والصرف والتحويل النقدي مع التأثير المباشر على الأرصدة والقيود المحاسبية"
        actionLabel={
          subTab === 'receipt'
            ? 'إنشاء سند قبض جديد'
            : subTab === 'payment'
            ? 'إنشاء سند صرف جديد'
            : 'إنشاء تحويل نقدية جديد'
        }
        onAction={
          subTab === 'transfer'
            ? openNewTransferModal
            : () => openNewVoucherModal(subTab === 'receipt' ? 'receipt' : 'payment')
        }
        canCreate={canCreate}
        onExportExcel={handleExcel}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('receipt')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'receipt' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سندات القبض ({receiptVouchers.length})
          </button>
          <button
            onClick={() => setSubTab('payment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'payment' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سندات الصرف ({paymentVouchers.length})
          </button>
          <button
            onClick={() => setSubTab('transfer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'transfer' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تحويلات الخزن ({cashTransfers.length})
          </button>
        </div>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث برقم السند، اسم الحساب، أو البيان..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {subTab === 'receipt' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">نوع الحساب المقبوض منه</th>
                  <th className="py-3 px-4">اسم الحساب / العميل</th>
                  <th className="py-3 px-4">طريقة القبض / الخزينة</th>
                  <th className="py-3 px-4">البيان / الملاحظات</th>
                  <th className="py-3 px-4 text-left">المبلغ المحصل</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.voucherNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {r.accountType === 'customer'
                          ? 'عميل'
                          : r.accountType === 'supplier'
                          ? 'مورد'
                          : r.accountType === 'revenue'
                          ? 'إيراد'
                          : 'أخرى'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.accountName}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{r.treasuryName}</div>
                      <span className="text-[10px] text-slate-400">
                        ({r.paymentMethod === 'cash' ? 'نقدي' : r.paymentMethod === 'bank' ? 'بنكي' : 'محفظة'})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{r.notes || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintableVoucher({ type: 'receipt', data: r })}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          title="طباعة إيصال السند"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا السند وإلغاء أثره المالي؟')) {
                                deleteReceiptVoucher(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {subTab === 'payment' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">نوع الحساب المدفوع له</th>
                  <th className="py-3 px-4">اسم الحساب / المستفيد</th>
                  <th className="py-3 px-4">طريقة الدفع / الخزينة</th>
                  <th className="py-3 px-4">البيان / الملاحظات</th>
                  <th className="py-3 px-4 text-left">المبلغ المنصرف</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.voucherNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {p.accountType === 'supplier'
                          ? 'مورد'
                          : p.accountType === 'expense'
                          ? 'مصروف'
                          : p.accountType === 'employee'
                          ? 'موظف'
                          : 'أخرى'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.accountName}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{p.treasuryName}</div>
                      <span className="text-[10px] text-slate-400">
                        ({p.paymentMethod === 'cash' ? 'نقدي' : p.paymentMethod === 'bank' ? 'بنكي' : 'محفظة'})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{p.notes || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-rose-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintableVoucher({ type: 'payment', data: p })}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          title="طباعة إيصال السند"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا السند وإلغاء أثره المالي؟')) {
                                deletePaymentVoucher(p.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {subTab === 'transfer' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم التحويل</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">من خزينة / حساب</th>
                  <th className="py-3 px-4">إلى خزينة / حساب</th>
                  <th className="py-3 px-4">البيان</th>
                  <th className="py-3 px-4 text-left">مبلغ التحويل</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{t.date}</td>
                    <td className="py-3 px-4 font-semibold text-rose-700">{t.fromTreasuryName}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{t.toTreasuryName}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{t.notes || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-sky-700">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا التحويل واسترجاع الرصيد؟')) {
                              deleteCashTransfer(t.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Voucher Modal */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title={subTab === 'receipt' ? 'تسجيل سند قبض جديد' : 'تسجيل سند صرف / دفع جديد'}
        maxWidth="2xl"
      >
        <form onSubmit={handleVoucherSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ السند</label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={voucherAmount}
                onChange={(e) => setVoucherAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {subTab === 'receipt' ? 'نوع الحساب المقبوض منه' : 'نوع الحساب المدفوع له'}
              </label>
              <select
                value={accountType}
                onChange={(e) => {
                  const newType = e.target.value as AccountPartyType;
                  setAccountType(newType);
                  if (newType === 'customer') setAccountId(customers[0]?.id || '');
                  else if (newType === 'supplier') setAccountId(suppliers[0]?.id || '');
                  else if (newType === 'employee') setAccountId(employees[0]?.id || '');
                  else if (newType === 'partner') setAccountId(partners[0]?.id || '');
                  else if (newType === 'expense') setAccountId(expenses[0]?.id || '');
                  else if (newType === 'revenue') setAccountId(revenues[0]?.id || '');
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="customer">عملاء</option>
                <option value="supplier">موردين</option>
                <option value="employee">موظفين</option>
                <option value="partner">شركاء</option>
                {subTab === 'receipt' ? (
                  <option value="revenue">إيرادات أخرى</option>
                ) : (
                  <option value="expense">مصروفات عمومية</option>
                )}
                <option value="other">حسابات أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تحديد الحساب المعني</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {accountType === 'customer' &&
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (الرصيد: {formatCurrency(c.currentBalance)})
                    </option>
                  ))}
                {accountType === 'supplier' &&
                  suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (المستحق: {formatCurrency(s.currentBalance)})
                    </option>
                  ))}
                {accountType === 'employee' &&
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                {accountType === 'partner' &&
                  partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                {accountType === 'expense' &&
                  expenses.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.name}
                    </option>
                  ))}
                {accountType === 'revenue' &&
                  revenues.map((rev) => (
                    <option key={rev.id} value={rev.id}>
                      {rev.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">طريقة السداد / القبض</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const m = e.target.value as TreasuryType;
                  setPaymentMethod(m);
                  const matched = treasuries.find((t) => t.type === m);
                  if (matched) setTreasuryId(matched.id);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="cash">نقدي (خزينة)</option>
                <option value="bank">بنك (تحويل أو شيك)</option>
                <option value="e_wallet">محفظة إلكترونية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الخزينة أو الحساب البنكي</label>
              <select
                value={treasuryId}
                onChange={(e) => setTreasuryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {treasuries
                  .filter((t) => t.type === paymentMethod)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.accountName} (المتاح: {formatCurrency(t.currentBalance)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البيان والشرح</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="شرح وتفاصيل العملية وملاحظات السند"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ وترحيل السند
            </button>
          </div>
        </form>
      </Modal>

      {/* Cash Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="تسجيل تحويل نقدية بين الخزائن والبنوك"
        maxWidth="lg"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ التحويل</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">مبلغ التحويل (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-sky-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">من خزينة / بنك (المصدر)</label>
              <select
                value={fromTreasuryId}
                onChange={(e) => setFromTreasuryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.accountName} (المتاح: {formatCurrency(t.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">إلى خزينة / بنك (الوجهة)</label>
              <select
                value={toTreasuryId}
                onChange={(e) => setToTreasuryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البيان وملاحظات التحويل</label>
            <textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={2}
              placeholder="مثال: توريد نقدية من الخزينة لحساب الشركة بالبنك الأهلي"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              تنفيذ التحويل
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Voucher Receipt View */}
      {printableVoucher && (
        <Modal
          isOpen={Boolean(printableVoucher)}
          onClose={() => setPrintableVoucher(null)}
          title={`طباعة ${printableVoucher.type === 'receipt' ? 'سند قبض' : 'سند صرف'} (${printableVoucher.data.voucherNumber})`}
          maxWidth="lg"
        >
          <div className="printable-area p-6 bg-white border border-slate-200 rounded-2xl text-slate-900 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">الرضوان للحسابات والمخازن</h3>
                  <p className="text-xs text-slate-500">نظام إدارة المعاملات المالية والمحاسبية ERP</p>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-xs text-slate-500">رقم السند:</div>
                <div className="text-sm font-bold text-slate-900">{printableVoucher.data.voucherNumber}</div>
                <div className="text-[11px] text-slate-400 mt-1">{printableVoucher.data.date}</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-2 bg-slate-100 rounded-xl">
              <h4 className="text-base font-bold text-slate-800">
                {printableVoucher.type === 'receipt' ? 'إيصال استلام نقدية (سند قبض)' : 'إذن صرف نقدية (سند دفع)'}
              </h4>
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block mb-1">
                  {printableVoucher.type === 'receipt' ? 'استلمنا من السيد / السادة:' : 'صرفنا إلى السيد / السادة:'}
                </span>
                <span className="font-bold text-sm text-slate-900">{printableVoucher.data.accountName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block mb-1">المبلغ المطلوب:</span>
                <span className="font-bold text-base font-mono text-emerald-800">
                  {formatCurrency(printableVoucher.data.amount)}
                </span>
              </div>
            </div>

            <div className="text-xs p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">طريقة السداد / الصندوق:</span>
                <span className="font-bold text-slate-800">{printableVoucher.data.treasuryName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">وذلك عن (البيان):</span>
                <span className="font-medium text-slate-800 text-left max-w-xs">{printableVoucher.data.notes || '-'}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-8 font-medium">المحاسب المستلم</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">التوقيع</div>
              </div>
              <div>
                <span className="text-slate-500 block mb-8 font-medium">أمين الخزينة</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">التوقيع</div>
              </div>
              <div>
                <span className="text-slate-500 block mb-8 font-medium">المدير المالي</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">الاعتماد</div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPrintableVoucher(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={triggerPrint}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة السند الآن
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
