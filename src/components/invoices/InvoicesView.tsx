/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, InvoiceType, InvoiceItem } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatNumber, exportToExcel, triggerPrint } from '../../utils/exportUtils';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Search,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  Building,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const {
    activeTab,
    invoices,
    addInvoice,
    editInvoice,
    deleteInvoice,
    items,
    customers,
    suppliers,
    warehouses,
    treasuries,
    hasPermission,
  } = useERP();

  // Determine invoice type from global navigation or local tab
  const getInitialType = (): InvoiceType => {
    if (activeTab === 'purchase_invoices') return 'purchase';
    if (activeTab === 'purchase_return_invoices') return 'purchase_return';
    if (activeTab === 'sales_return_invoices') return 'sales_return';
    return 'sales';
  };

  const [currentType, setCurrentType] = useState<InvoiceType>(getInitialType());
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice Creation / Editing Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [invItems, setInvItems] = useState<InvoiceItem[]>([]);
  const [calculateVat, setCalculateVat] = useState(true);
  const [vatRate, setVatRate] = useState<number>(14);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [treasuryId, setTreasuryId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line item adder state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [lineQty, setLineQty] = useState<number>(1);
  const [linePrice, setLinePrice] = useState<number>(0);
  const [lineDiscount, setLineDiscount] = useState<number>(0);

  // Official Printable Invoice
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);

  // Invoice Deletion Confirmation State
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const currentModule =
    currentType === 'purchase'
      ? 'purchase_invoices'
      : currentType === 'purchase_return'
      ? 'purchase_return_invoices'
      : currentType === 'sales'
      ? 'sales_invoices'
      : 'sales_return_invoices';

  const canCreate = hasPermission(currentModule, 'create');
  const canEdit = hasPermission(currentModule, 'edit');
  const canDelete = hasPermission(currentModule, 'delete');

  const openNewInvoiceModal = () => {
    setEditingInvoice(null);
    setInvDate(new Date().toISOString().split('T')[0]);
    const isSales = currentType === 'sales' || currentType === 'sales_return';
    setPartyId(isSales ? customers[0]?.id || '' : suppliers[0]?.id || '');
    setWarehouseId(warehouses[0]?.id || '');
    setInvItems([]);
    setCalculateVat(true);
    setVatRate(14);
    setPaymentMethod('cash');
    setPaidAmount(0);
    setTreasuryId(treasuries[0]?.id || '');
    setNotes('');
    setErrorMsg(null);

    // Reset line input
    const firstItem = items[0];
    if (firstItem) {
      setSelectedItemId(firstItem.id);
      setSelectedUnitId(firstItem.baseUnitId);
      setLineQty(1);
      setLinePrice(isSales ? firstItem.sellingPrice : firstItem.costPrice);
      setLineDiscount(0);
    }

    setIsModalOpen(true);
  };

  const openEditInvoiceModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvDate(inv.date);
    setPartyId(inv.partyId);
    setWarehouseId(inv.warehouseId);
    setInvItems([...inv.items]);
    setCalculateVat(inv.calculateVat);
    setVatRate(inv.vatRate);
    setPaymentMethod(inv.paymentMethod);
    setPaidAmount(inv.paidAmount);
    setTreasuryId(inv.treasuryId || treasuries[0]?.id || '');
    setNotes(inv.notes || '');
    setErrorMsg(null);

    const firstItem = items[0];
    if (firstItem) {
      setSelectedItemId(firstItem.id);
      setSelectedUnitId(firstItem.baseUnitId);
      setLineQty(1);
      const isSales = currentType === 'sales' || currentType === 'sales_return';
      setLinePrice(isSales ? firstItem.sellingPrice : firstItem.costPrice);
      setLineDiscount(0);
    }

    setIsModalOpen(true);
  };

  const handleItemSelectChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const itm = items.find((i) => i.id === itemId);
    if (itm) {
      setSelectedUnitId(itm.baseUnitId);
      const isSales = currentType === 'sales' || currentType === 'sales_return';
      setLinePrice(isSales ? itm.sellingPrice : itm.costPrice);
    }
  };

  const handleAddLineItem = () => {
    const itm = items.find((i) => i.id === selectedItemId);
    if (!itm) return;

    const unitObj = itm.units?.find((u) => u.unitId === selectedUnitId);
    const unitName = unitObj?.unitName || 'قطعة';
    const factor = unitObj?.conversionFactor || 1;

    const sub = Number(lineQty) * Number(linePrice) - Number(lineDiscount || 0);
    const vat = calculateVat ? (sub * Number(vatRate)) / 100 : 0;
    const total = sub + vat;

    const newItem: InvoiceItem = {
      id: 'inv-item-' + Date.now(),
      itemId: itm.id,
      itemCode: itm.code,
      itemName: itm.name,
      unitId: selectedUnitId,
      unitName,
      conversionFactor: factor,
      quantity: Number(lineQty),
      unitPrice: Number(linePrice),
      discount: Number(lineDiscount || 0),
      vatAmount: vat,
      subtotal: sub,
      total,
      costPriceAtTime: itm.costPrice,
    };

    setInvItems([...invItems, newItem]);
    setErrorMsg(null);
  };

  const handleRemoveLineItem = (id: string) => {
    setInvItems(invItems.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotal = invItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountTotal = invItems.reduce((sum, i) => sum + i.discount, 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const vatTotal = calculateVat ? (taxableAmount * vatRate) / 100 : 0;
  const grandTotal = taxableAmount + vatTotal;

  const remainingAmount = Math.max(0, grandTotal - (paymentMethod === 'cash' ? grandTotal : paidAmount));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invItems.length === 0) {
      setErrorMsg('يرجى إضافة صنف واحد على الأقل في الفاتورة');
      return;
    }
    if (!partyId) {
      setErrorMsg('يرجى تحديد العميل أو المورد');
      return;
    }
    if (!warehouseId) {
      setErrorMsg('يرجى تحديد المستودع');
      return;
    }

    const isSales = currentType === 'sales' || currentType === 'sales_return';
    const partyName = isSales
      ? customers.find((c) => c.id === partyId)?.name || 'عميل'
      : suppliers.find((s) => s.id === partyId)?.name || 'مورد';

    const wh = warehouses.find((w) => w.id === warehouseId);
    const trs = treasuries.find((t) => t.id === treasuryId);

    const actualPaid = paymentMethod === 'cash' ? grandTotal : paymentMethod === 'credit' ? 0 : paidAmount;

    // Cost of goods sold for sales invoices
    const costOfSales = invItems.reduce(
      (sum, item) => sum + item.quantity * item.conversionFactor * item.costPriceAtTime,
      0
    );

    const invoicePayload = {
      type: currentType,
      date: invDate,
      partyId,
      partyName,
      warehouseId,
      warehouseName: wh?.name || 'المستودع الرئيسي',
      items: invItems,
      subtotal,
      discountTotal,
      calculateVat,
      vatRate,
      vatTotal,
      grandTotal,
      paidAmount: actualPaid,
      remainingAmount,
      paymentMethod,
      treasuryId: actualPaid > 0 ? treasuryId : undefined,
      treasuryName: actualPaid > 0 ? trs?.accountName : undefined,
      notes,
      costOfSalesTotal: costOfSales,
    };

    if (editingInvoice) {
      editInvoice(editingInvoice.id, invoicePayload);
    } else {
      addInvoice(invoicePayload);
    }

    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.type === currentType &&
      (inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getTypeName = (type: InvoiceType): string => {
    switch (type) {
      case 'purchase':
        return 'فاتورة مشتريات';
      case 'purchase_return':
        return 'مردود مشتريات';
      case 'sales':
        return 'فاتورة مبيعات';
      case 'sales_return':
        return 'مردود مبيعات';
    }
  };

  const handleExcel = () => {
    exportToExcel(
      getTypeName(currentType),
      ['رقم الفاتورة', 'التاريخ', 'الطرف (العميل/المورد)', 'المستودع', 'الإجمالي قبل الضريبة', 'الضريبة', 'صافي الفاتورة', 'المدفوع', 'المتبقي', 'طريقة الدفع'],
      filteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.date,
        inv.partyName,
        inv.warehouseName,
        inv.subtotal - inv.discountTotal,
        inv.vatTotal,
        inv.grandTotal,
        inv.paidAmount,
        inv.remainingAmount,
        inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'credit' ? 'آجل' : 'جزئي',
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title={getTypeName(currentType)}
        subtitle="تسجيل وطباعة وتصدير فواتير العمليات مع خيارات احتساب ضريبة القيمة المضافة والتأثير المخزني"
        actionLabel={`إنشاء ${getTypeName(currentType)} جديدة`}
        onAction={openNewInvoiceModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setCurrentType('sales')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentType === 'sales' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المبيعات
          </button>
          <button
            onClick={() => setCurrentType('sales_return')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentType === 'sales_return' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مردود المبيعات
          </button>
          <button
            onClick={() => setCurrentType('purchase')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentType === 'purchase' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المشتريات
          </button>
          <button
            onClick={() => setCurrentType('purchase_return')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              currentType === 'purchase_return' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مردود المشتريات
          </button>
        </div>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث برقم الفاتورة، اسم العميل أو المورد..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">
                  {currentType === 'sales' || currentType === 'sales_return' ? 'العميل' : 'المورد'}
                </th>
                <th className="py-3 px-4">المستودع</th>
                <th className="py-3 px-4 text-left">قيمة البضاعة</th>
                <th className="py-3 px-4 text-left">ضريبة القيمة المضافة</th>
                <th className="py-3 px-4 text-left">إجمالي الفاتورة</th>
                <th className="py-3 px-4 text-left">المدفوع / المسدد</th>
                <th className="py-3 px-4 text-left">المتبقي (الآجل)</th>
                <th className="py-3 px-4 text-center">الإجراءات والطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    لا توجد فواتير مسجلة في هذا القسم
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{inv.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.partyName}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.warehouseName}</td>
                    <td className="py-3 px-4 text-left font-mono font-medium text-slate-700">
                      {formatCurrency(inv.subtotal - inv.discountTotal)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-slate-600">
                      {inv.calculateVat ? formatCurrency(inv.vatTotal) : 'معفى'}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-emerald-700 font-semibold">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-rose-700">
                      {formatCurrency(inv.remainingAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintableInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                          title="عرض الفاتورة الضريبية الرسمية والطباعة / PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>فاتورة / PDF</span>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEditInvoiceModal(inv)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                            title="تعديل الفاتورة وتحديث المخزون والحسابات"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>تعديل</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف الفاتورة"
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

      {/* Create / Edit Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        title={
          editingInvoice
            ? `تعديل ${getTypeName(currentType)} (رقم: ${editingInvoice.invoiceNumber})`
            : `تسجيل ${getTypeName(currentType)} جديدة`
        }
        maxWidth="5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Top Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الفاتورة</label>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {currentType === 'sales' || currentType === 'sales_return' ? 'العميل' : 'المورد'}
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {currentType === 'sales' || currentType === 'sales_return'
                  ? customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  : suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع المنفذ</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">طريقة السداد</label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="cash">نقدي بالكامل</option>
                <option value="credit">آجل بالكامل</option>
                <option value="partial">دفعة نقدية ومتبقي آجل</option>
              </select>
            </div>
          </div>

          {/* Line Item Adder */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-emerald-50/20">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              إضافة صنف إلى الفاتورة
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الصنف</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemSelectChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الوحدة</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {items
                    .find((i) => i.id === selectedItemId)
                    ?.units?.map((u) => (
                      <option key={u.unitId} value={u.unitId}>
                        {u.unitName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={lineQty}
                  onChange={(e) => setLineQty(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-center focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">سعر الوحدة (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={linePrice}
                  onChange={(e) => setLinePrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + إدراج البند
                </button>
              </div>
            </div>
          </div>

          {/* Items Table in Modal */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">كود الصنف</th>
                  <th className="py-2 px-3">اسم الصنف</th>
                  <th className="py-2 px-3">الوحدة</th>
                  <th className="py-2 px-3 text-center">الكمية</th>
                  <th className="py-2 px-3 text-left">سعر الوحدة</th>
                  <th className="py-2 px-3 text-left">الإجمالي</th>
                  <th className="py-2 px-3 text-center">إلغاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      لم يتم إدراج أي أصناف بعد
                    </td>
                  </tr>
                ) : (
                  invItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.itemCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.itemName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.unitName}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-left font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-emerald-800">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary & VAT Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="invVatCheck"
                    checked={calculateVat}
                    onChange={(e) => setCalculateVat(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="invVatCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    احتساب ضريبة القيمة المضافة (VAT)
                  </label>
                </div>
                {calculateVat && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">النسبة:</span>
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono text-center"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>

              {paymentMethod === 'partial' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    المبلغ المدفوع مقدماً (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {paymentMethod !== 'credit' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الخزينة أو الحساب البنكي للتسوية
                  </label>
                  <select
                    value={treasuryId}
                    onChange={(e) => setTreasuryId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    {treasuries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.accountName} (المتاح: {formatCurrency(t.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي الأصناف:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة ({calculateVat ? `%${vatRate}` : 'معفى'}):</span>
                <span className="font-mono">{formatCurrency(vatTotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>صافي الفاتورة الإجمالي:</span>
                <span className="font-mono text-emerald-800">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1">
                <span>المسدد الآن:</span>
                <span className="font-mono text-emerald-700">
                  {formatCurrency(paymentMethod === 'cash' ? grandTotal : paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-dashed border-slate-200">
                <span>المتبقي في ذمة الحساب (الآجل):</span>
                <span className="font-mono">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات الفاتورة</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط التسليم، رقم أمر التوريد، إلخ..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {editingInvoice ? 'حفظ التعديلات وتحديث الأرصدة' : 'حفظ وترحيل الفاتورة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Tax Invoice Print Modal */}
      {printableInvoice && (
        <Modal
          isOpen={Boolean(printableInvoice)}
          onClose={() => setPrintableInvoice(null)}
          title={`عرض وطباعة الفاتورة الضريبية (${printableInvoice.invoiceNumber})`}
          maxWidth="4xl"
        >
          <div className="printable-area p-8 bg-white border border-slate-300 rounded-2xl text-slate-900 space-y-6">
            {/* Invoice Official Header */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">الرضوان للحسابات والمخازن</h1>
                  <p className="text-xs text-slate-600">لتجارة وتوزيع الأجهزة الإلكترونية ومهمات الشبكات</p>
                  <p className="text-[11px] text-slate-500 font-mono">الرقم الضريبي: 492-817-302 | س.ت: 104829</p>
                </div>
              </div>

              <div className="text-left font-mono">
                <div className="text-sm font-bold bg-slate-900 text-white px-3 py-1 rounded-lg inline-block mb-1">
                  {getTypeName(printableInvoice.type)}
                </div>
                <div className="text-xs text-slate-600 font-bold">{printableInvoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500 mt-1">التاريخ: {printableInvoice.date}</div>
              </div>
            </div>

            {/* Customer / Supplier Metadata */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">
                  {printableInvoice.type === 'sales' || printableInvoice.type === 'sales_return'
                    ? 'بيانات العميل:'
                    : 'بيانات المورد:'}
                </span>
                <span className="font-bold text-sm text-slate-900 block">{printableInvoice.partyName}</span>
                <span className="text-slate-600 mt-1 block">المستودع المنفذ: {printableInvoice.warehouseName}</span>
              </div>
              <div className="text-left">
                <span className="text-slate-500 block mb-1">طريقة السداد:</span>
                <span className="font-bold text-slate-800 block">
                  {printableInvoice.paymentMethod === 'cash'
                    ? 'نقدي'
                    : printableInvoice.paymentMethod === 'credit'
                    ? 'آجل'
                    : 'دفعة نقدية ومتبقي آجل'}
                </span>
                {printableInvoice.notes && (
                  <span className="text-slate-500 text-[11px] mt-1 block">ملاحظات: {printableInvoice.notes}</span>
                )}
              </div>
            </div>

            {/* Table of items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">كود الصنف</th>
                    <th className="py-2.5 px-3">اسم الصنف والوصف</th>
                    <th className="py-2.5 px-3">الوحدة</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">ضريبة القيمة المضافة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {printableInvoice.items.map((itm, idx) => (
                    <tr key={itm.id}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold">{itm.itemCode}</td>
                      <td className="py-2 px-3 font-medium">{itm.itemName}</td>
                      <td className="py-2 px-3">{itm.unitName}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{itm.quantity}</td>
                      <td className="py-2 px-3 text-left font-mono">{formatCurrency(itm.unitPrice)}</td>
                      <td className="py-2 px-3 text-left font-mono">{formatCurrency(itm.vatAmount)}</td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(itm.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي البضاعة:</span>
                  <span className="font-mono">{formatCurrency(printableInvoice.subtotal)}</span>
                </div>
                {printableInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">{formatCurrency(printableInvoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>
                    ضريبة القيمة المضافة ({printableInvoice.calculateVat ? `%${printableInvoice.vatRate}` : 'معفى'}):
                  </span>
                  <span className="font-mono">{formatCurrency(printableInvoice.vatTotal)}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>صافي الفاتورة الإجمالي:</span>
                  <span className="font-mono text-emerald-800">{formatCurrency(printableInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>المبلغ المسدد:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(printableInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>المتبقي في الحساب:</span>
                  <span className="font-mono">{formatCurrency(printableInvoice.remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-6">مسئول المبيعات / التوريد</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">التوقيع</div>
              </div>
              <div>
                <span className="text-slate-500 block mb-6">أمين المستودع (التسليم)</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">التوقيع</div>
              </div>
              <div>
                <span className="text-slate-500 block mb-6">توقيع المستلم والختم</span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-slate-400">الاستلام</div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setPrintableInvoice(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={triggerPrint}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة الفاتورة / تصدير PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* In-app Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(invoiceToDelete)}
        title="تأكيد حذف الفاتورة"
        message={
          invoiceToDelete
            ? `هل أنت متأكد من حذف ${getTypeName(invoiceToDelete.type)} رقم (${invoiceToDelete.invoiceNumber}) بقيمة (${formatCurrency(invoiceToDelete.grandTotal)})؟ سيتم إلغاء تأثيرها المالي على الحساب واسترجاع كميات المخزون فورياً.`
            : ''
        }
        confirmLabel="نعم، حذف الفاتورة الآن"
        cancelLabel="تراجع"
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
};
