/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { JournalEntry, JournalEntryLine, PayrollRecord, AssetOperation, DiscountRecord, AccountPartyType } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import {
  Calculator,
  FileText,
  UserCheck,
  Building,
  Percent,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export const AccountingOpsView: React.FC = () => {
  const {
    activeTab,
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    payrollRecords,
    addPayrollRecord,
    payPayroll,
    deletePayrollRecord,
    assetOperations,
    addAssetOperation,
    deleteAssetOperation,
    discounts,
    addDiscount,
    deleteDiscount,
    chartOfAccounts,
    employees,
    assets,
    treasuries,
    customers,
    suppliers,
    hasPermission,
  } = useERP();

  // Determine subtab
  const [subTab, setSubTab] = useState<'journal' | 'payroll' | 'assets' | 'discount_allowed' | 'discount_received'>(
    activeTab === 'payroll'
      ? 'payroll'
      : activeTab === 'asset_operations'
      ? 'assets'
      : activeTab === 'discount_allowed'
      ? 'discount_allowed'
      : activeTab === 'discount_received'
      ? 'discount_received'
      : 'journal'
  );

  const [searchTerm, setSearchTerm] = useState('');

  // 1. Journal Entry Modal State
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalDesc, setJournalDesc] = useState('');
  const [journalLines, setJournalLines] = useState<JournalEntryLine[]>([
    { id: '1', accountCode: '111', accountName: 'النقدية وما في حكمها (الخزن والبنوك)', debit: 0, credit: 0, notes: '' },
    { id: '2', accountCode: '41', accountName: 'إيرادات النشاط الرئيسي (المبيعات)', debit: 0, credit: 0, notes: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2. Payroll Modal State
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('2026-11');
  const [payrollEmpId, setPayrollEmpId] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [overtimeAmount, setOvertimeAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [payrollNotes, setPayrollNotes] = useState('');

  // Pay Payroll modal
  const [payingRecordId, setPayingRecordId] = useState<string | null>(null);
  const [payTreasuryId, setPayTreasuryId] = useState('');

  // 3. Asset Operation Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetOpDate, setAssetOpDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetId, setAssetId] = useState('');
  const [assetOpType, setAssetOpType] = useState<'purchase' | 'sale'>('purchase');
  const [assetOpAmount, setAssetOpAmount] = useState<number>(0);
  const [assetOpTreasuryId, setAssetOpTreasuryId] = useState('');
  const [assetOpNotes, setAssetOpNotes] = useState('');

  // 4 & 5. Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountDate, setDiscountDate] = useState(new Date().toISOString().split('T')[0]);
  const [discountAccountType, setDiscountAccountType] = useState<AccountPartyType>('customer');
  const [discountAccountId, setDiscountAccountId] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountNotes, setDiscountNotes] = useState('');

  // Check permissions
  const canCreateJournal = hasPermission('journal_entries', 'create');
  const canDeleteJournal = hasPermission('journal_entries', 'delete');
  const canCreatePayroll = hasPermission('payroll', 'create');
  const canDeletePayroll = hasPermission('payroll', 'delete');
  const canCreateAssets = hasPermission('asset_operations', 'create');
  const canDeleteAssets = hasPermission('asset_operations', 'delete');
  const canCreateDiscountAllowed = hasPermission('discount_allowed', 'create');
  const canDeleteDiscountAllowed = hasPermission('discount_allowed', 'delete');
  const canCreateDiscountReceived = hasPermission('discount_received', 'create');
  const canDeleteDiscountReceived = hasPermission('discount_received', 'delete');

  // Handle Journal lines
  const handleAddJournalLine = () => {
    const nextId = String(Date.now() + Math.random());
    setJournalLines([
      ...journalLines,
      { id: nextId, accountCode: '111', accountName: 'النقدية وما في حكمها', debit: 0, credit: 0, notes: '' },
    ]);
  };

  const handleUpdateJournalLine = (id: string, field: keyof JournalEntryLine, val: any) => {
    setJournalLines(
      journalLines.map((l) => {
        if (l.id === id) {
          if (field === 'accountCode') {
            const acc = chartOfAccounts.find((a) => a.code === val);
            return { ...l, accountCode: val, accountName: acc?.name || l.accountName };
          }
          return { ...l, [field]: val };
        }
        return l;
      })
    );
  };

  const handleRemoveJournalLine = (id: string) => {
    if (journalLines.length <= 2) {
      setErrorMsg('يجب أن يحتوي القيد على سطرين محاسبيين على الأقل');
      return;
    }
    setJournalLines(journalLines.filter((l) => l.id !== id));
  };

  const totalDebit = journalLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = journalLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diffBalance = Math.abs(totalDebit - totalCredit);
  const isJournalBalanced = diffBalance < 0.01 && totalDebit > 0;

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalDesc.trim()) {
      setErrorMsg('يرجى كتابة شرح القيد المحاسبي');
      return;
    }
    const res = addJournalEntry({
      date: journalDate,
      description: journalDesc,
      lines: journalLines,
    });
    if (!res.success) {
      setErrorMsg(res.message || 'القيد غير متوازن');
      return;
    }
    setIsJournalModalOpen(false);
  };

  // Payroll Handlers
  const openNewPayrollModal = () => {
    const firstEmp = employees[0];
    setPayrollEmpId(firstEmp?.id || '');
    setBaseSalary(firstEmp?.monthlySalary || 0);
    setOvertimeAmount(0);
    setDeductionAmount(0);
    setPayrollNotes('');
    setErrorMsg(null);
    setIsPayrollModalOpen(true);
  };

  const handleEmpChangeInPayroll = (empId: string) => {
    setPayrollEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setBaseSalary(emp.monthlySalary);
    }
  };

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === payrollEmpId);
    if (!emp) return;

    addPayrollRecord({
      date: new Date().toISOString().split('T')[0],
      month: payrollMonth,
      employeeId: emp.id,
      employeeName: emp.name,
      baseSalary: Number(baseSalary),
      overtimeAmount: Number(overtimeAmount),
      deductionAmount: Number(deductionAmount),
      status: 'draft',
      notes: payrollNotes,
    });
    setIsPayrollModalOpen(false);
  };

  const handleConfirmPayPayroll = () => {
    if (!payingRecordId || !payTreasuryId) return;
    payPayroll(payingRecordId, payTreasuryId);
    setPayingRecordId(null);
  };

  // Asset Ops Handlers
  const openNewAssetOpModal = () => {
    setAssetOpDate(new Date().toISOString().split('T')[0]);
    setAssetId(assets[0]?.id || '');
    setAssetOpType('purchase');
    setAssetOpAmount(0);
    setAssetOpTreasuryId(treasuries[0]?.id || '');
    setAssetOpNotes('');
    setErrorMsg(null);
    setIsAssetModalOpen(true);
  };

  const handleAssetOpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetOpAmount || assetOpAmount <= 0) {
      setErrorMsg('يرجى تحديد مبلغ العملية');
      return;
    }
    const ast = assets.find((a) => a.id === assetId);
    const trs = treasuries.find((t) => t.id === assetOpTreasuryId);

    addAssetOperation({
      date: assetOpDate,
      assetId,
      assetName: ast?.name || 'أصل ثابت',
      operationType: assetOpType,
      amount: Number(assetOpAmount),
      treasuryId: assetOpTreasuryId,
      treasuryName: trs?.accountName || 'خزينة',
      notes: assetOpNotes,
    });
    setIsAssetModalOpen(false);
  };

  // Discount Handlers
  const openNewDiscountModal = (type: 'discount_allowed' | 'discount_received') => {
    setDiscountDate(new Date().toISOString().split('T')[0]);
    const defaultAccType = type === 'discount_allowed' ? 'customer' : 'supplier';
    setDiscountAccountType(defaultAccType);
    setDiscountAccountId(type === 'discount_allowed' ? customers[0]?.id || '' : suppliers[0]?.id || '');
    setDiscountAmount(0);
    setDiscountNotes('');
    setErrorMsg(null);
    setIsDiscountModalOpen(true);
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountAmount || discountAmount <= 0) {
      setErrorMsg('يرجى تحديد قيمة الخصم');
      return;
    }

    const type = subTab === 'discount_allowed' ? 'discount_allowed' : 'discount_received';
    const accName =
      discountAccountType === 'customer'
        ? customers.find((c) => c.id === discountAccountId)?.name || 'عميل'
        : suppliers.find((s) => s.id === discountAccountId)?.name || 'مورد';

    addDiscount({
      date: discountDate,
      type,
      accountType: discountAccountType,
      accountId: discountAccountId,
      accountName: accName,
      amount: Number(discountAmount),
      notes: discountNotes,
    });
    setIsDiscountModalOpen(false);
  };

  const filteredJournal = journalEntries.filter(
    (je) =>
      je.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      je.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.type === subTab &&
      (d.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.accountName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title={
          subTab === 'journal'
            ? 'تسجيل قيود اليومية العامة'
            : subTab === 'payroll'
            ? 'إدارة واحتساب رواتب الموظفين'
            : subTab === 'assets'
            ? 'عمليات الأصول الرأسمالية (شراء / بيع)'
            : subTab === 'discount_allowed'
            ? 'الخصم المسموح به'
            : 'الخصم المكتسب'
        }
        subtitle="إدارة العمليات المحاسبية، الرواتب، إضافي واستقطاعات العمل، وتسويات الخصومات التجارية"
        actionLabel={
          subTab === 'journal'
            ? 'تسجيل قيد يومية جديد'
            : subTab === 'payroll'
            ? 'احتساب راتب جديد'
            : subTab === 'assets'
            ? 'تسجيل عملية أصل'
            : subTab === 'discount_allowed'
            ? 'تسجيل خصم مسموح به'
            : 'تسجيل خصم مكتسب'
        }
        onAction={
          subTab === 'journal'
            ? () => {
                setJournalDate(new Date().toISOString().split('T')[0]);
                setJournalDesc('');
                setIsJournalModalOpen(true);
              }
            : subTab === 'payroll'
            ? openNewPayrollModal
            : subTab === 'assets'
            ? openNewAssetOpModal
            : () => openNewDiscountModal(subTab as any)
        }
        canCreate={
          subTab === 'journal'
            ? canCreateJournal
            : subTab === 'payroll'
            ? canCreatePayroll
            : subTab === 'assets'
            ? canCreateAssets
            : subTab === 'discount_allowed'
            ? canCreateDiscountAllowed
            : canCreateDiscountReceived
        }
      >
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('journal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'journal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قيود اليومية ({journalEntries.length})
          </button>
          <button
            onClick={() => setSubTab('payroll')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'payroll' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الرواتب ({payrollRecords.length})
          </button>
          <button
            onClick={() => setSubTab('assets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'assets' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عمليات الأصول ({assetOperations.length})
          </button>
          <button
            onClick={() => setSubTab('discount_allowed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'discount_allowed' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخصم المسموح به
          </button>
          <button
            onClick={() => setSubTab('discount_received')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'discount_received' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخصم المكتسب
          </button>
        </div>
      </PageHeader>

      {/* Subtab 1: Journal Entries */}
      {subTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم القيد أو الشرح..."
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            {filteredJournal.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {entry.entryNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                    <span className="text-sm font-bold text-slate-900">{entry.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/50">
                      التوازن: {formatCurrency(entry.totalDebit)}
                    </div>
                    {canDeleteJournal && (
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا القيد المحاسبي؟')) {
                            deleteJournalEntry(entry.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف القيد المحاسبي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="py-2 px-3">كود الحساب</th>
                        <th className="py-2 px-3">اسم الحساب المحاسبي</th>
                        <th className="py-2 px-3 text-left">مدين (Debit)</th>
                        <th className="py-2 px-3 text-left">دائن (Credit)</th>
                        <th className="py-2 px-3">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {entry.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{line.accountCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{line.accountName}</td>
                          <td className="py-2 px-3 text-left font-mono font-bold text-emerald-800">
                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                          </td>
                          <td className="py-2 px-3 text-left font-mono font-bold text-sky-800">
                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{line.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Payroll */}
      {subTab === 'payroll' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم المسير</th>
                  <th className="py-3 px-4">شهر الاستحقاق</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4 text-left">الراتب الأساسي</th>
                  <th className="py-3 px-4 text-left">احتساب إضافي</th>
                  <th className="py-3 px-4 text-left">احتساب خصومات</th>
                  <th className="py-3 px-4 text-left">صافي الراتب المستحق</th>
                  <th className="py-3 px-4 text-center">حالة الصرف</th>
                  <th className="py-3 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payrollRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.recordNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.month}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.employeeName}</td>
                    <td className="py-3 px-4 text-left font-mono">{formatCurrency(r.baseSalary)}</td>
                    <td className="py-3 px-4 text-left font-mono text-emerald-700 font-bold">
                      {r.overtimeAmount > 0 ? `+${formatCurrency(r.overtimeAmount)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-rose-700 font-bold">
                      {r.deductionAmount > 0 ? `-${formatCurrency(r.deductionAmount)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-extrabold text-slate-900">
                      {formatCurrency(r.netSalary)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status === 'paid' ? `تم الصرف (${r.paidDate})` : 'مستحق الصرف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.status === 'draft' ? (
                          <button
                            onClick={() => {
                              setPayingRecordId(r.id);
                              setPayTreasuryId(treasuries[0]?.id || '');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            صرف الراتب
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">مسدد من: {r.treasuryName}</span>
                        )}
                        {canDeletePayroll && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف مسير هذا الراتب؟')) {
                                deletePayrollRecord(r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف مسير الراتب"
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
          </div>
        </div>
      )}

      {/* Subtab 3: Assets Operations */}
      {subTab === 'assets' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">نوع العملية</th>
                  <th className="py-3 px-4">الأصل الرأسمالي</th>
                  <th className="py-3 px-4 text-left">قيمة المعاملة</th>
                  <th className="py-3 px-4">الخزينة / الحساب البنكي</th>
                  <th className="py-3 px-4">البيان</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assetOperations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد عمليات مسجلة على الأصول الثابتة
                    </td>
                  </tr>
                ) : (
                  assetOperations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{op.operationNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{op.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            op.operationType === 'purchase' ? 'text-sky-700' : 'text-emerald-700'
                          }`}
                        >
                          {op.operationType === 'purchase' ? 'شراء أصل رأسمالي' : 'بيع أصل واستبعاد'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{op.assetName}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(op.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{op.treasuryName}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{op.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {canDeleteAssets && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذه العملية على الأصل واسترجاع الرصيد وقيمة الأصل؟')) {
                                deleteAssetOperation(op.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف العملية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4 & 5: Discounts */}
      {(subTab === 'discount_allowed' || subTab === 'discount_received') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">نوع الحساب</th>
                  <th className="py-3 px-4">اسم الحساب</th>
                  <th className="py-3 px-4 text-left">مبلغ الخصم</th>
                  <th className="py-3 px-4">البيان والملاحظات</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد سجلات خصم مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.recordNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{d.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {d.accountType === 'customer' ? 'عميل' : d.accountType === 'supplier' ? 'مورد' : 'حساب عام'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.accountName}</td>
                      <td
                        className={`py-3 px-4 text-left font-mono font-bold ${
                          d.type === 'discount_allowed' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{d.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {((d.type === 'discount_allowed' && canDeleteDiscountAllowed) ||
                          (d.type === 'discount_received' && canDeleteDiscountReceived)) && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا الخصم واسترجاع رصيد الحساب؟')) {
                                deleteDiscount(d.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف الخصم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. Journal Entry Creator Modal */}
      <Modal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="تسجيل قيد يومية عام (Manual Journal Entry)"
        maxWidth="4xl"
      >
        <form onSubmit={handleJournalSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ القيد</label>
              <input
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">شرح القيد العام</label>
              <input
                type="text"
                value={journalDesc}
                onChange={(e) => setJournalDesc(e.target.value)}
                placeholder="مثال: إثبات تسوية حساب، مصاريف إدارية نقدية..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">الحساب المحاسبي (من الدليل)</th>
                  <th className="py-2.5 px-3 text-left w-36">مدين (Debit)</th>
                  <th className="py-2.5 px-3 text-left w-36">دائن (Credit)</th>
                  <th className="py-2.5 px-3">البيان الخاص بالسطر</th>
                  <th className="py-2.5 px-3 text-center w-12">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {journalLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <select
                        value={line.accountCode}
                        onChange={(e) => handleUpdateJournalLine(line.id, 'accountCode', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                      >
                        {chartOfAccounts
                          .filter((a) => a.isLeaf)
                          .map((acc) => (
                            <option key={acc.id} value={acc.code}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={line.debit || ''}
                        onChange={(e) => handleUpdateJournalLine(line.id, 'debit', Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-left"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={line.credit || ''}
                        onChange={(e) => handleUpdateJournalLine(line.id, 'credit', Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-left"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={line.notes || ''}
                        onChange={(e) => handleUpdateJournalLine(line.id, 'notes', e.target.value)}
                        placeholder="ملاحظات السطر..."
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveJournalLine(line.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddJournalLine}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة سطر قيد جديد
            </button>

            {/* Verification Balance Indicator */}
            <div className="flex items-center gap-6 text-xs font-mono font-bold">
              <div>
                <span className="text-slate-500 font-sans ml-1">إجمالي المدين:</span>
                <span className="text-emerald-700">{formatCurrency(totalDebit)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans ml-1">إجمالي الدائن:</span>
                <span className="text-sky-700">{formatCurrency(totalCredit)}</span>
              </div>
              <div
                className={`px-3 py-1 rounded-lg ${
                  isJournalBalanced
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isJournalBalanced ? 'القيد متوازن ✓' : `غير متوازن (فارق: ${diffBalance.toFixed(2)})`}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isJournalBalanced}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                isJournalBalanced
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              حفظ وترحيل القيد
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Payroll Modal */}
      <Modal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        title="احتساب راتب موظف (مع الإضافي والخصومات)"
        maxWidth="lg"
      >
        <form onSubmit={handlePayrollSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">شهر الاستحقاق</label>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الموظف</label>
              <select
                value={payrollEmpId}
                onChange={(e) => handleEmpChangeInPayroll(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.jobName || 'موظف'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الراتب الأساسي</label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">احتساب إضافي / مكافأة</label>
              <input
                type="number"
                value={overtimeAmount}
                onChange={(e) => setOvertimeAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">احتساب خصومات / جزاءات</label>
              <input
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-baseline justify-between text-xs">
            <span className="font-bold text-slate-700">صافي الراتب المستحق للصرف:</span>
            <span className="text-base font-extrabold font-mono text-emerald-800">
              {formatCurrency(Number(baseSalary) + Number(overtimeAmount) - Number(deductionAmount))}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات المسير</label>
            <input
              type="text"
              value={payrollNotes}
              onChange={(e) => setPayrollNotes(e.target.value)}
              placeholder="ساعات إضافية، مكافأة أداء..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayrollModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ المسير
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Payroll Modal */}
      {payingRecordId && (
        <Modal
          isOpen={Boolean(payingRecordId)}
          onClose={() => setPayingRecordId(null)}
          title="صرف راتب الموظف وتسويته نقدياً"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              يرجى اختيار الخزينة أو الحساب البنكي الذي سيتم صرف الراتب منه وترحيل القيد المحاسبي تلقائياً:
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الصندوق / البنك المسدد</label>
              <select
                value={payTreasuryId}
                onChange={(e) => setPayTreasuryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.accountName} (المتاح: {formatCurrency(t.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingRecordId(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmPayPayroll}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الصرف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Asset Operation Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="تسجيل عملية أصل رأسمالي (شراء / بيع)"
        maxWidth="lg"
      >
        <form onSubmit={handleAssetOpSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ العملية</label>
              <input
                type="date"
                value={assetOpDate}
                onChange={(e) => setAssetOpDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع العملية</label>
              <select
                value={assetOpType}
                onChange={(e: any) => setAssetOpType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="purchase">شراء أصل رأسمالي جديد</option>
                <option value="sale">بيع أصل رأسمالي واستبعاد</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الأصل المستهدف</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (القيمة الدفترية: {formatCurrency(a.currentBookValue)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">مبلغ العملية (ج.م)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={assetOpAmount}
                onChange={(e) => setAssetOpAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الخزينة / الحساب البنكي</label>
              <select
                value={assetOpTreasuryId}
                onChange={(e) => setAssetOpTreasuryId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">البيان والشرح</label>
            <input
              type="text"
              value={assetOpNotes}
              onChange={(e) => setAssetOpNotes(e.target.value)}
              placeholder="مثال: شراء سيارة توزيع جديدة بموجب فاتورة الوكالة..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ وترحيل العملية
            </button>
          </div>
        </form>
      </Modal>

      {/* 4 & 5. Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title={subTab === 'discount_allowed' ? 'تسجيل خصم مسموح به' : 'تسجيل خصم مكتسب'}
        maxWidth="md"
      >
        <form onSubmit={handleDiscountSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الخصم</label>
            <input
              type="date"
              value={discountDate}
              onChange={(e) => setDiscountDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الحساب</label>
            <select
              value={discountAccountType}
              onChange={(e: any) => {
                setDiscountAccountType(e.target.value);
                setDiscountAccountId(e.target.value === 'customer' ? customers[0]?.id || '' : suppliers[0]?.id || '');
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="customer">عميل</option>
              <option value="supplier">مورد</option>
              <option value="other">حساب آخر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الحساب المستفيد</label>
            <select
              value={discountAccountId}
              onChange={(e) => setDiscountAccountId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            >
              {discountAccountType === 'customer'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (الرصيد: {formatCurrency(c.currentBalance)})
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (المستحق: {formatCurrency(s.currentBalance)})
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">مبلغ الخصم (ج.م)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">السبب والشرح</label>
            <input
              type="text"
              value={discountNotes}
              onChange={(e) => setDiscountNotes(e.target.value)}
              placeholder="مثال: خصم تعجيل دفع، خصم كمية تجاري..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ الخصم
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
