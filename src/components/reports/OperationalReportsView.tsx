/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SystemModule } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, formatNumber, exportToExcel, triggerPrint } from '../../utils/exportUtils';
import {
  BarChart3,
  Search,
  Calendar,
  Filter,
  ArrowRight,
  Printer,
  FileSpreadsheet,
  Building,
  User,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const OperationalReportsView: React.FC = () => {
  const {
    activeTab,
    invoices,
    receiptVouchers,
    paymentVouchers,
    cashTransfers,
    inventoryAdjustments,
    warehouseTransfers,
    journalEntries,
    payrollRecords,
    discounts,
    warehouses,
    items,
    stocks,
    customers,
    suppliers,
    employees,
    expenses,
    revenues,
    partners,
    partnerCurrentAccounts,
    hasPermission,
  } = useERP();

  // Active report selection
  const [selectedReport, setSelectedReport] = useState<SystemModule>(
    (activeTab as any) || 'daily_analyzer'
  );

  // Global Date Filters
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // Specific filters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');

  // Detailed ledger modal states
  const [detailedCustomer, setDetailedCustomer] = useState<string | null>(null);
  const [detailedSupplier, setDetailedSupplier] = useState<string | null>(null);
  const [detailedEmployee, setDetailedEmployee] = useState<string | null>(null);
  const [detailedExpense, setDetailedExpense] = useState<string | null>(null);
  const [detailedRevenue, setDetailedRevenue] = useState<string | null>(null);
  const [detailedPartner, setDetailedPartner] = useState<string | null>(null);

  // Sync when activeTab changes
  React.useEffect(() => {
    if (activeTab.startsWith('report_') || activeTab === 'daily_analyzer') {
      setSelectedReport(activeTab);
    }
  }, [activeTab]);

  // Helper date filter
  const isDateInRange = (dateStr: string) => {
    return dateStr >= fromDate && dateStr <= toDate;
  };

  return (
    <div className="space-y-6">
      {/* Report Switcher Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              التقارير التحليلية والتشغيلية وكشوف الحسابات
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              استخراج محلل العمليات، كروت حركة الأصناف، وأرصدة وكشوف حسابات العملاء والموردين والشركاء مع التصفية بالفترة الزمنية
            </p>
          </div>

          {/* Date range filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              الفترة من:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono bg-white focus:outline-none focus:border-emerald-500"
            />
            <span className="font-semibold text-slate-700">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 9 Reports Tab Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'daily_analyzer', label: '1. محلل العمل اليومي' },
            { id: 'report_inventory', label: '2. تقرير المخازن' },
            { id: 'report_item_movement', label: '3. حركة الصنف' },
            { id: 'report_customers', label: '4. تقرير العملاء' },
            { id: 'report_suppliers', label: '5. تقرير الموردين' },
            { id: 'report_employees', label: '6. تقرير الموظفين' },
            { id: 'report_expenses', label: '7. تقرير المصروفات' },
            { id: 'report_revenues', label: '8. تقرير الإيرادات' },
            { id: 'report_partners', label: '9. تقرير الشركاء' },
          ].map((rep) => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id as SystemModule)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedReport === rep.id
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. محلل العمل اليومي (Daily Operations Analyzer) */}
      {selectedReport === 'daily_analyzer' && (
        <DailyOperationsAnalyzer
          fromDate={fromDate}
          toDate={toDate}
          invoices={invoices}
          receiptVouchers={receiptVouchers}
          paymentVouchers={paymentVouchers}
          cashTransfers={cashTransfers}
          inventoryAdjustments={inventoryAdjustments}
        />
      )}

      {/* 2. تقرير المخازن (Warehouse Report) */}
      {selectedReport === 'report_inventory' && (
        <WarehouseInventoryReport
          warehouses={warehouses}
          items={items}
          stocks={stocks}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      )}

      {/* 3. حركة الصنف (Item Movement Ledger) */}
      {selectedReport === 'report_item_movement' && (
        <ItemMovementReport
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          invoices={invoices}
          warehouseTransfers={warehouseTransfers}
          inventoryAdjustments={inventoryAdjustments}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}

      {/* 4. تقرير العملاء (Customer Statement & Balances) */}
      {selectedReport === 'report_customers' && (
        <CustomersReport
          customers={customers}
          invoices={invoices}
          receiptVouchers={receiptVouchers}
          discounts={discounts}
          fromDate={fromDate}
          toDate={toDate}
          onOpenDetail={(cId) => setDetailedCustomer(cId)}
        />
      )}

      {/* 5. تقرير الموردين (Supplier Statement & Balances) */}
      {selectedReport === 'report_suppliers' && (
        <SuppliersReport
          suppliers={suppliers}
          invoices={invoices}
          paymentVouchers={paymentVouchers}
          discounts={discounts}
          fromDate={fromDate}
          toDate={toDate}
          onOpenDetail={(sId) => setDetailedSupplier(sId)}
        />
      )}

      {/* 6. تقرير الموظفين (Employee Statement & Balances) */}
      {selectedReport === 'report_employees' && (
        <EmployeesReport
          employees={employees}
          payrollRecords={payrollRecords}
          fromDate={fromDate}
          toDate={toDate}
          onOpenDetail={(empId) => setDetailedEmployee(empId)}
        />
      )}

      {/* 7. تقرير المصروفات (Expenses Report) */}
      {selectedReport === 'report_expenses' && (
        <ExpensesReport
          expenses={expenses}
          paymentVouchers={paymentVouchers}
          fromDate={fromDate}
          toDate={toDate}
          onOpenDetail={(expId) => setDetailedExpense(expId)}
        />
      )}

      {/* 8. تقرير الإيرادات (Revenue Report) */}
      {selectedReport === 'report_revenues' && (
        <RevenuesReport
          revenues={revenues}
          receiptVouchers={receiptVouchers}
          fromDate={fromDate}
          toDate={toDate}
          onOpenDetail={(revId) => setDetailedRevenue(revId)}
        />
      )}

      {/* 9. تقرير الشركاء وجاري الشريك (Partners Report) */}
      {selectedReport === 'report_partners' && (
        <PartnersReport
          partners={partners}
          partnerCurrentAccounts={partnerCurrentAccounts}
          receiptVouchers={receiptVouchers}
          paymentVouchers={paymentVouchers}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}

      {/* Detail Modals for Account Statements */}
      {detailedCustomer && (
        <CustomerDetailModal
          customerId={detailedCustomer}
          customer={customers.find((c) => c.id === detailedCustomer)!}
          invoices={invoices}
          receiptVouchers={receiptVouchers}
          discounts={discounts}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setDetailedCustomer(null)}
        />
      )}

      {detailedSupplier && (
        <SupplierDetailModal
          supplierId={detailedSupplier}
          supplier={suppliers.find((s) => s.id === detailedSupplier)!}
          invoices={invoices}
          paymentVouchers={paymentVouchers}
          discounts={discounts}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setDetailedSupplier(null)}
        />
      )}

      {detailedEmployee && (
        <EmployeeDetailModal
          employeeId={detailedEmployee}
          employee={employees.find((e) => e.id === detailedEmployee)!}
          payrollRecords={payrollRecords}
          paymentVouchers={paymentVouchers}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setDetailedEmployee(null)}
        />
      )}

      {detailedExpense && (
        <ExpenseDetailModal
          expenseId={detailedExpense}
          expense={expenses.find((e) => e.id === detailedExpense)!}
          paymentVouchers={paymentVouchers}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setDetailedExpense(null)}
        />
      )}

      {detailedRevenue && (
        <RevenueDetailModal
          revenueId={detailedRevenue}
          revenue={revenues.find((r) => r.id === detailedRevenue)!}
          receiptVouchers={receiptVouchers}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setDetailedRevenue(null)}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 1. Daily Operations Analyzer                                               */
/* -------------------------------------------------------------------------- */
const DailyOperationsAnalyzer: React.FC<{
  fromDate: string;
  toDate: string;
  invoices: any[];
  receiptVouchers: any[];
  paymentVouchers: any[];
  cashTransfers: any[];
  inventoryAdjustments: any[];
}> = ({ fromDate, toDate, invoices, receiptVouchers, paymentVouchers, cashTransfers, inventoryAdjustments }) => {
  // Aggregate all operations in date range
  const ops: Array<{
    date: string;
    type: string;
    refNo: string;
    party: string;
    amount: number;
    notes: string;
  }> = [];

  invoices
    .filter((i) => i.date >= fromDate && i.date <= toDate)
    .forEach((i) => {
      ops.push({
        date: i.date,
        type:
          i.type === 'sales'
            ? 'فاتورة مبيعات'
            : i.type === 'purchase'
            ? 'فاتورة مشتريات'
            : i.type === 'sales_return'
            ? 'مردود مبيعات'
            : 'مردود مشتريات',
        refNo: i.invoiceNumber,
        party: i.partyName,
        amount: i.grandTotal,
        notes: i.notes || `مستودع: ${i.warehouseName}`,
      });
    });

  receiptVouchers
    .filter((v) => v.date >= fromDate && v.date <= toDate)
    .forEach((v) => {
      ops.push({
        date: v.date,
        type: 'سند قبض',
        refNo: v.voucherNumber,
        party: v.accountName,
        amount: v.amount,
        notes: v.notes || v.treasuryName,
      });
    });

  paymentVouchers
    .filter((v) => v.date >= fromDate && v.date <= toDate)
    .forEach((v) => {
      ops.push({
        date: v.date,
        type: 'سند صرف',
        refNo: v.voucherNumber,
        party: v.accountName,
        amount: v.amount,
        notes: v.notes || v.treasuryName,
      });
    });

  cashTransfers
    .filter((t) => t.date >= fromDate && t.date <= toDate)
    .forEach((t) => {
      ops.push({
        date: t.date,
        type: 'تحويل نقدية',
        refNo: t.transferNumber,
        party: `${t.fromTreasuryName} ← ${t.toTreasuryName}`,
        amount: t.amount,
        notes: t.notes || 'مناقلة خزن',
      });
    });

  ops.sort((a, b) => b.date.localeCompare(a.date));

  const totalOpsAmount = ops.reduce((sum, o) => sum + o.amount, 0);

  const handleExport = () => {
    exportToExcel(
      `محلل_العمل_اليومي_${fromDate}_إلى_${toDate}`,
      ['التاريخ', 'نوع العملية', 'رقم المستند', 'الطرف / الحساب', 'المبلغ', 'البيان'],
      ops.map((o) => [o.date, o.type, o.refNo, o.party, o.amount, o.notes])
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">سجل محلل العمليات اليومية للنظام</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض شامل لكافة الفواتير والسندات والتحصيلات والتحويلات المسجلة خلال الفترة المحددة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إكسيل
          </button>
          <button
            onClick={triggerPrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة التقرير
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800">
        <span>إجمالي العمليات المنفذة: {ops.length} عملية</span>
        <span className="font-mono text-emerald-800">
          إجمالي حجم المعاملات: {formatCurrency(totalOpsAmount)}
        </span>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">التاريخ</th>
              <th className="py-2.5 px-4">نوع العملية</th>
              <th className="py-2.5 px-4">رقم المستند</th>
              <th className="py-2.5 px-4">الطرف / الحساب</th>
              <th className="py-2.5 px-4 text-left">المبلغ</th>
              <th className="py-2.5 px-4">البيان والشرح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {ops.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  لا توجد عمليات منفذة خلال هذه الفترة
                </td>
              </tr>
            ) : (
              ops.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono text-slate-500">{o.date}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{o.type}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-emerald-800">{o.refNo}</td>
                  <td className="py-2.5 px-4 font-semibold">{o.party}</td>
                  <td className="py-2.5 px-4 text-left font-mono font-bold text-slate-900">
                    {formatCurrency(o.amount)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{o.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Warehouse Inventory Report                                              */
/* -------------------------------------------------------------------------- */
const WarehouseInventoryReport: React.FC<{
  warehouses: any[];
  items: any[];
  stocks: any[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
}> = ({ warehouses, items, stocks, selectedWarehouseId, onSelectWarehouse }) => {
  const filteredItems = items.filter((itm) => {
    if (selectedWarehouseId === 'all') return true;
    return true; // we show quantities per selected warehouse
  });

  const getQty = (itemId: string, whId: string) => {
    if (whId === 'all') {
      return stocks.filter((s) => s.itemId === itemId).reduce((sum, s) => sum + s.quantity, 0);
    }
    const s = stocks.find((s) => s.itemId === itemId && s.warehouseId === whId);
    return s ? s.quantity : 0;
  };

  const totalInventoryValuation = filteredItems.reduce((sum, itm) => {
    const qty = getQty(itm.id, selectedWarehouseId);
    return sum + qty * itm.costPrice;
  }, 0);

  const handleExport = () => {
    exportToExcel(
      'تقرير_أرصدة_المخازن_وتكلفة_الأصناف',
      ['كود الصنف', 'اسم الصنف', 'المستودع', 'الكمية المتوفرة', 'سعر التكلفة', 'إجمالي قيمة المخزون بالتكلفة'],
      filteredItems.map((itm) => {
        const qty = getQty(itm.id, selectedWarehouseId);
        return [itm.code, itm.name, selectedWarehouseId === 'all' ? 'كافة المستودعات' : selectedWarehouseId, qty, itm.costPrice, qty * itm.costPrice];
      })
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">تقرير أرصدة وتقييم المخزون</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض الأصناف بالكميات وسعر التكلفة وإجمالي القيمة مع إمكانية تغيير المستودع المختار
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>تحديد المستودع:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة المستودعات مجتمعة</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إكسيل
          </button>
        </div>
      </div>

      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-baseline justify-between text-xs">
        <span className="font-bold text-slate-800">
          إجمالي تقييم المخزون بسعر التكلفة الفعلية (
          {selectedWarehouseId === 'all'
            ? 'كافة المستودعات'
            : warehouses.find((w) => w.id === selectedWarehouseId)?.name}
          ):
        </span>
        <span className="text-lg font-bold font-mono text-emerald-800">
          {formatCurrency(totalInventoryValuation)}
        </span>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">كود الصنف</th>
              <th className="py-2.5 px-4">اسم الصنف</th>
              <th className="py-2.5 px-4 text-center">الكمية المتوفرة</th>
              <th className="py-2.5 px-4 text-left">سعر التكلفة الفعلي</th>
              <th className="py-2.5 px-4 text-left">إجمالي القيمة بالتكلفة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredItems.map((itm) => {
              const qty = getQty(itm.id, selectedWarehouseId);
              const val = qty * itm.costPrice;

              return (
                <tr key={itm.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{itm.code}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{itm.name}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold">{formatNumber(qty)}</td>
                  <td className="py-2.5 px-4 text-left font-mono font-semibold text-amber-700">
                    {formatCurrency(itm.costPrice)}
                  </td>
                  <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-800">
                    {formatCurrency(val)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Item Movement Report                                                    */
/* -------------------------------------------------------------------------- */
const ItemMovementReport: React.FC<{
  items: any[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  invoices: any[];
  warehouseTransfers: any[];
  inventoryAdjustments: any[];
  fromDate: string;
  toDate: string;
}> = ({ items, selectedItemId, onSelectItem, invoices, warehouseTransfers, inventoryAdjustments, fromDate, toDate }) => {
  const currentItem = items.find((i) => i.id === selectedItemId);

  // Collect all movements
  interface MovementLine {
    date: string;
    type: string;
    refNo: string;
    inQty: number;
    outQty: number;
    unitPrice: number;
    actualCost: number;
    runningQty: number;
  }

  const movements: MovementLine[] = [];
  let runningQty = 0;

  // Gather transactions chronologically
  const rawEvents: Array<{
    date: string;
    type: string;
    refNo: string;
    inQty: number;
    outQty: number;
    price: number;
    cost: number;
  }> = [];

  // Purchases & Returns
  invoices.forEach((inv) => {
    inv.items
      .filter((itm: any) => itm.itemId === selectedItemId)
      .forEach((itm: any) => {
        const qty = itm.quantity * (itm.conversionFactor || 1);
        if (inv.type === 'purchase') {
          rawEvents.push({
            date: inv.date,
            type: 'فاتورة مشتريات (وارد)',
            refNo: inv.invoiceNumber,
            inQty: qty,
            outQty: 0,
            price: itm.unitPrice,
            cost: itm.costPriceAtTime || currentItem?.costPrice || 0,
          });
        } else if (inv.type === 'purchase_return') {
          rawEvents.push({
            date: inv.date,
            type: 'مردود مشتريات (منصرف)',
            refNo: inv.invoiceNumber,
            inQty: 0,
            outQty: qty,
            price: itm.unitPrice,
            cost: itm.costPriceAtTime || currentItem?.costPrice || 0,
          });
        } else if (inv.type === 'sales') {
          rawEvents.push({
            date: inv.date,
            type: 'فاتورة مبيعات (منصرف)',
            refNo: inv.invoiceNumber,
            inQty: 0,
            outQty: qty,
            price: itm.unitPrice,
            cost: itm.costPriceAtTime || currentItem?.costPrice || 0,
          });
        } else if (inv.type === 'sales_return') {
          rawEvents.push({
            date: inv.date,
            type: 'مردود مبيعات (وارد)',
            refNo: inv.invoiceNumber,
            inQty: qty,
            outQty: 0,
            price: itm.unitPrice,
            cost: itm.costPriceAtTime || currentItem?.costPrice || 0,
          });
        }
      });
  });

  // Inventory adjustments
  inventoryAdjustments.forEach((adj) => {
    adj.items
      .filter((i: any) => i.itemId === selectedItemId)
      .forEach((i: any) => {
        rawEvents.push({
          date: adj.date,
          type: 'تسوية جردية',
          refNo: adj.adjustmentNumber,
          inQty: i.diffQty > 0 ? i.diffQty : 0,
          outQty: i.diffQty < 0 ? Math.abs(i.diffQty) : 0,
          price: i.costPrice,
          cost: i.costPrice,
        });
      });
  });

  rawEvents.sort((a, b) => a.date.localeCompare(b.date));

  rawEvents.forEach((ev) => {
    runningQty += ev.inQty - ev.outQty;
    movements.push({
      date: ev.date,
      type: ev.type,
      refNo: ev.refNo,
      inQty: ev.inQty,
      outQty: ev.outQty,
      unitPrice: ev.price,
      actualCost: ev.cost,
      runningQty,
    });
  });

  const filteredMovements = movements.filter((m) => m.date >= fromDate && m.date <= toDate);

  const handleExport = () => {
    exportToExcel(
      `كارت_حركة_الصنف_${currentItem?.code || ''}`,
      ['التاريخ', 'نوع الحركة', 'رقم المستند', 'الوارد (+)', 'المنصرف (-)', 'التكلفة الفعلية بعد الحركة', 'الرصيد التراكمي'],
      filteredMovements.map((m) => [
        m.date,
        m.type,
        m.refNo,
        m.inQty,
        m.outQty,
        m.actualCost,
        m.runningQty,
      ])
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">كارت حركة الصنف التراكمي والتكلفة الفعلية</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تتبع كافة حركات الصنف (بيع، مردود، شراء، تسوية) مع إظهار التكلفة الفعلية والرصيد التراكمي بعد كل عملية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>اختر الصنف:</span>
            <select
              value={selectedItemId}
              onChange={(e) => onSelectItem(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إكسيل
          </button>
        </div>
      </div>

      {currentItem && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div>
            <span className="text-slate-500 block">الصنف:</span>
            <span className="font-bold text-slate-900">{currentItem.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">متوسط التكلفة الحالي:</span>
            <span className="font-mono font-bold text-amber-700">{formatCurrency(currentItem.costPrice)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">الرصيد التراكمي الحالي:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">{formatNumber(runningQty)} قطعة</span>
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">التاريخ</th>
              <th className="py-2.5 px-4">نوع الحركة</th>
              <th className="py-2.5 px-4">رقم المستند</th>
              <th className="py-2.5 px-4 text-center text-emerald-700">وارد (+)</th>
              <th className="py-2.5 px-4 text-center text-rose-700">منصرف (-)</th>
              <th className="py-2.5 px-4 text-left">التكلفة الفعلية</th>
              <th className="py-2.5 px-4 text-center font-bold">الرصيد التراكمي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  لا توجد حركات مسجلة لهذا الصنف خلال الفترة المحددة
                </td>
              </tr>
            ) : (
              filteredMovements.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-500">{m.date}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{m.type}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">{m.refNo}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                    {m.inQty > 0 ? `+${m.inQty}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">
                    {m.outQty > 0 ? `-${m.outQty}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-left font-mono font-semibold text-amber-700">
                    {formatCurrency(m.actualCost)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-extrabold text-slate-900 bg-slate-50/50">
                    {formatNumber(m.runningQty)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Customer Report & Statement                                             */
/* -------------------------------------------------------------------------- */
const CustomersReport: React.FC<{
  customers: any[];
  invoices: any[];
  receiptVouchers: any[];
  discounts: any[];
  fromDate: string;
  toDate: string;
  onOpenDetail: (cId: string) => void;
}> = ({ customers, invoices, receiptVouchers, discounts, fromDate, toDate, onOpenDetail }) => {
  const totalDebts = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  const handleExport = () => {
    exportToExcel(
      'تقرير_أرصدة_ومديونية_العملاء',
      ['كود العميل', 'اسم العميل', 'الهاتف', 'حد الائتمان', 'الرصيد الافتتاحي', 'المديونية الحالية'],
      customers.map((c) => [c.code, c.name, c.phone, c.creditLimit, c.openingBalance, c.currentBalance])
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">تقرير كشف حساب ومديونية العملاء</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            اضغط على اسم أي عميل لفتح كشف حساب تفصيلي بكافة العمليات والرصيد التراكمي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إكسيل
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-baseline justify-between text-xs">
        <span className="font-bold text-slate-800">إجمالي مديونية كافة العملاء (مستحقات المنشأة):</span>
        <span className="text-lg font-bold font-mono text-rose-700">{formatCurrency(totalDebts)}</span>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">كود العميل</th>
              <th className="py-2.5 px-4">اسم العميل (اضغط لعرض كشف الحساب)</th>
              <th className="py-2.5 px-4">الهاتف</th>
              <th className="py-2.5 px-4 text-left">حد الائتمان</th>
              <th className="py-2.5 px-4 text-left">الرصيد الافتتاحي</th>
              <th className="py-2.5 px-4 text-left">المديونية الحالية</th>
              <th className="py-2.5 px-4 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">
                  <button
                    onClick={() => onOpenDetail(c.id)}
                    className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold text-right cursor-pointer"
                  >
                    {c.name}
                  </button>
                </td>
                <td className="py-2.5 px-4 font-mono text-slate-500" dir="ltr">{c.phone || '-'}</td>
                <td className="py-2.5 px-4 text-left font-mono text-slate-600">{formatCurrency(c.creditLimit)}</td>
                <td className="py-2.5 px-4 text-left font-mono text-slate-600">{formatCurrency(c.openingBalance)}</td>
                <td className="py-2.5 px-4 text-left font-mono font-bold text-rose-700">
                  {formatCurrency(c.currentBalance)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={() => onOpenDetail(c.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    كشف تفصيلي ←
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Customer Detailed Statement Modal */
const CustomerDetailModal: React.FC<{
  customerId: string;
  customer: any;
  invoices: any[];
  receiptVouchers: any[];
  discounts: any[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}> = ({ customer, invoices, receiptVouchers, discounts, fromDate, toDate, onClose }) => {
  interface StatementRow {
    date: string;
    desc: string;
    refNo: string;
    debit: number; // customer debt increases (Sales)
    credit: number; // customer pays or return (Receipt / Return / Discount)
    runningBalance: number;
  }

  const rows: StatementRow[] = [];
  let running = customer?.openingBalance || 0;

  // Initial balance row
  rows.push({
    date: fromDate,
    desc: 'الرصيد الافتتاحي المنقول',
    refNo: '-',
    debit: customer?.openingBalance > 0 ? customer.openingBalance : 0,
    credit: customer?.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
    runningBalance: running,
  });

  // Sales & Returns
  invoices
    .filter((inv) => inv.partyId === customer.id && inv.date >= fromDate && inv.date <= toDate)
    .forEach((inv) => {
      if (inv.type === 'sales') {
        running += inv.grandTotal;
        rows.push({
          date: inv.date,
          desc: `فاتورة مبيعات (${inv.notes || 'بضاعة مباعة'})`,
          refNo: inv.invoiceNumber,
          debit: inv.grandTotal,
          credit: 0,
          runningBalance: running,
        });
        if (inv.paidAmount > 0) {
          running -= inv.paidAmount;
          rows.push({
            date: inv.date,
            desc: `دفعة نقدية مسددة بالفاتورة`,
            refNo: inv.invoiceNumber,
            debit: 0,
            credit: inv.paidAmount,
            runningBalance: running,
          });
        }
      } else if (inv.type === 'sales_return') {
        running -= inv.grandTotal;
        rows.push({
          date: inv.date,
          desc: `فاتورة مردود مبيعات`,
          refNo: inv.invoiceNumber,
          debit: 0,
          credit: inv.grandTotal,
          runningBalance: running,
        });
      }
    });

  // Receipts
  receiptVouchers
    .filter((r) => r.accountId === customer.id && r.date >= fromDate && r.date <= toDate)
    .forEach((r) => {
      running -= r.amount;
      rows.push({
        date: r.date,
        desc: `سند قبض نقدي / بنكي (${r.notes || r.treasuryName})`,
        refNo: r.voucherNumber,
        debit: 0,
        credit: r.amount,
        runningBalance: running,
      });
    });

  // Discounts
  discounts
    .filter((d) => d.accountId === customer.id && d.date >= fromDate && d.date <= toDate)
    .forEach((d) => {
      running -= d.amount;
      rows.push({
        date: d.date,
        desc: `خصم مسموح به (${d.notes || 'تسوية'})`,
        refNo: d.recordNumber,
        debit: 0,
        credit: d.amount,
        runningBalance: running,
      });
    });

  rows.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`كشف حساب تفصيلي للعميل: ${customer.name}`}
      maxWidth="4xl"
    >
      <div className="printable-area space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div>
            <span className="font-bold text-sm text-slate-900 block">{customer.name}</span>
            <span className="text-slate-500 font-mono">الهاتف: {customer.phone || '-'}</span>
          </div>
          <div className="text-left">
            <span className="text-slate-500 block">الرصيد التراكمي النهائي:</span>
            <span className="text-base font-extrabold font-mono text-rose-700">
              {formatCurrency(running)}
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">البيان والشرح</th>
                <th className="py-2.5 px-3">رقم المستند</th>
                <th className="py-2.5 px-3 text-left text-emerald-800">مدين (+)</th>
                <th className="py-2.5 px-3 text-left text-rose-800">دائن (-)</th>
                <th className="py-2.5 px-3 text-left font-bold">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-slate-500">{row.date}</td>
                  <td className="py-2 px-3 font-medium">{row.desc}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{row.refNo}</td>
                  <td className="py-2 px-3 text-left font-mono font-semibold text-emerald-800">
                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-semibold text-rose-800">
                    {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-slate-900 bg-slate-50/50">
                    {formatCurrency(row.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={triggerPrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة كشف الحساب
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Supplier Report & Statement                                             */
/* -------------------------------------------------------------------------- */
const SuppliersReport: React.FC<{
  suppliers: any[];
  invoices: any[];
  paymentVouchers: any[];
  discounts: any[];
  fromDate: string;
  toDate: string;
  onOpenDetail: (sId: string) => void;
}> = ({ suppliers, invoices, paymentVouchers, discounts, fromDate, toDate, onOpenDetail }) => {
  const totalDebts = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  const handleExport = () => {
    exportToExcel(
      'تقرير_أرصدة_ومستحقات_الموردين',
      ['كود المورد', 'اسم المورد', 'الهاتف', 'المسئول', 'الرصيد الافتتاحي', 'المستحق الحالي'],
      suppliers.map((s) => [s.code, s.name, s.phone, s.contactPerson, s.openingBalance, s.currentBalance])
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">تقرير كشف حساب ومستحقات الموردين</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            اضغط على اسم أي مورد لفتح كشف حساب تفصيلي بكافة التوريدات والمدفوعات والرصيد التراكمي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إكسيل
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-baseline justify-between text-xs">
        <span className="font-bold text-slate-800">إجمالي مستحقات كافة الموردين (التزامات على المنشأة):</span>
        <span className="text-lg font-bold font-mono text-amber-700">{formatCurrency(totalDebts)}</span>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">كود المورد</th>
              <th className="py-2.5 px-4">اسم المورد</th>
              <th className="py-2.5 px-4">المسئول / الهاتف</th>
              <th className="py-2.5 px-4 text-left">الرصيد الافتتاحي</th>
              <th className="py-2.5 px-4 text-left">المستحق الحالي للمورد</th>
              <th className="py-2.5 px-4 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{s.code}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">
                  <button
                    onClick={() => onOpenDetail(s.id)}
                    className="text-amber-700 hover:text-amber-800 hover:underline font-bold text-right cursor-pointer"
                  >
                    {s.name}
                  </button>
                </td>
                <td className="py-2.5 px-4">
                  <div>{s.contactPerson || '-'}</div>
                  <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{s.phone}</div>
                </td>
                <td className="py-2.5 px-4 text-left font-mono text-slate-600">{formatCurrency(s.openingBalance)}</td>
                <td className="py-2.5 px-4 text-left font-mono font-bold text-amber-700">
                  {formatCurrency(s.currentBalance)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={() => onOpenDetail(s.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    كشف تفصيلي ←
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Supplier Detailed Statement Modal */
const SupplierDetailModal: React.FC<{
  supplierId: string;
  supplier: any;
  invoices: any[];
  paymentVouchers: any[];
  discounts: any[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}> = ({ supplier, invoices, paymentVouchers, discounts, fromDate, toDate, onClose }) => {
  interface StatementRow {
    date: string;
    desc: string;
    refNo: string;
    debit: number; // payment made to supplier (decreases balance)
    credit: number; // supplier delivers goods (increases balance owed)
    runningBalance: number;
  }

  const rows: StatementRow[] = [];
  let running = supplier?.openingBalance || 0;

  rows.push({
    date: fromDate,
    desc: 'الرصيد الافتتاحي للمورد',
    refNo: '-',
    debit: 0,
    credit: running,
    runningBalance: running,
  });

  invoices
    .filter((inv) => inv.partyId === supplier.id && inv.date >= fromDate && inv.date <= toDate)
    .forEach((inv) => {
      if (inv.type === 'purchase') {
        running += inv.grandTotal;
        rows.push({
          date: inv.date,
          desc: `فاتورة مشتريات وتوريد بضائع`,
          refNo: inv.invoiceNumber,
          debit: 0,
          credit: inv.grandTotal,
          runningBalance: running,
        });
        if (inv.paidAmount > 0) {
          running -= inv.paidAmount;
          rows.push({
            date: inv.date,
            desc: `دفعة نقدية مسددة بالفاتورة`,
            refNo: inv.invoiceNumber,
            debit: inv.paidAmount,
            credit: 0,
            runningBalance: running,
          });
        }
      } else if (inv.type === 'purchase_return') {
        running -= inv.grandTotal;
        rows.push({
          date: inv.date,
          desc: `فاتورة مردود مشتريات للمورد`,
          refNo: inv.invoiceNumber,
          debit: inv.grandTotal,
          credit: 0,
          runningBalance: running,
        });
      }
    });

  paymentVouchers
    .filter((p) => p.accountId === supplier.id && p.date >= fromDate && p.date <= toDate)
    .forEach((p) => {
      running -= p.amount;
      rows.push({
        date: p.date,
        desc: `سند صرف ودفع نقدي / بنكي (${p.notes || p.treasuryName})`,
        refNo: p.voucherNumber,
        debit: p.amount,
        credit: 0,
        runningBalance: running,
      });
    });

  discounts
    .filter((d) => d.accountId === supplier.id && d.date >= fromDate && d.date <= toDate)
    .forEach((d) => {
      running -= d.amount;
      rows.push({
        date: d.date,
        desc: `خصم مكتسب من المورد`,
        refNo: d.recordNumber,
        debit: d.amount,
        credit: 0,
        runningBalance: running,
      });
    });

  rows.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`كشف حساب تفصيلي للمورد: ${supplier.name}`}
      maxWidth="4xl"
    >
      <div className="printable-area space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div>
            <span className="font-bold text-sm text-slate-900 block">{supplier.name}</span>
            <span className="text-slate-500 font-mono">الهاتف: {supplier.phone || '-'}</span>
          </div>
          <div className="text-left">
            <span className="text-slate-500 block">إجمالي المستحق للمورد حالياً:</span>
            <span className="text-base font-extrabold font-mono text-amber-700">
              {formatCurrency(running)}
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">البيان والشرح</th>
                <th className="py-2.5 px-3">رقم المستند</th>
                <th className="py-2.5 px-3 text-left text-emerald-800">مدين (سداد -)</th>
                <th className="py-2.5 px-3 text-left text-amber-800">دائن (توريد +)</th>
                <th className="py-2.5 px-3 text-left font-bold">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-slate-500">{row.date}</td>
                  <td className="py-2 px-3 font-medium">{row.desc}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{row.refNo}</td>
                  <td className="py-2 px-3 text-left font-mono font-semibold text-emerald-800">
                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-semibold text-amber-800">
                    {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-slate-900 bg-slate-50/50">
                    {formatCurrency(row.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={triggerPrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة كشف الحساب
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. Employee Report & Statement                                             */
/* -------------------------------------------------------------------------- */
const EmployeesReport: React.FC<{
  employees: any[];
  payrollRecords: any[];
  fromDate: string;
  toDate: string;
  onOpenDetail: (eId: string) => void;
}> = ({ employees, payrollRecords, fromDate, toDate, onOpenDetail }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">تقرير رواتب ومستحقات الموظفين</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          عرض إجمالي الرواتب الأساسية ومسيرات الرواتب والمستحقات لكل موظف
        </p>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">كود الموظف</th>
              <th className="py-2.5 px-4">اسم الموظف</th>
              <th className="py-2.5 px-4">الوظيفة</th>
              <th className="py-2.5 px-4 text-left">الراتب الشهري الأساسي</th>
              <th className="py-2.5 px-4 text-center">المسيرات المحسوبة</th>
              <th className="py-2.5 px-4 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {employees.map((e) => {
              const myPayrolls = payrollRecords.filter((p) => p.employeeId === e.id);
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{e.code}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{e.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{e.jobName || '-'}</td>
                  <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-800">
                    {formatCurrency(e.monthlySalary)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono">{myPayrolls.length} مسير</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => onOpenDetail(e.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      كشف تفصيلي ←
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EmployeeDetailModal: React.FC<{
  employeeId: string;
  employee: any;
  payrollRecords: any[];
  paymentVouchers: any[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}> = ({ employee, payrollRecords, fromDate, toDate, onClose }) => {
  const records = payrollRecords.filter((p) => p.employeeId === employee.id);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`كشف حساب ومسيرات الموظف: ${employee.name}`}
      maxWidth="3xl"
    >
      <div className="printable-area space-y-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-3">رقم المسير</th>
                <th className="py-2.5 px-3">شهر الاستحقاق</th>
                <th className="py-2.5 px-3 text-left">الأساسي</th>
                <th className="py-2.5 px-3 text-left text-emerald-700">إضافي</th>
                <th className="py-2.5 px-3 text-left text-rose-700">خصم</th>
                <th className="py-2.5 px-3 text-left font-bold">صافي المستحق</th>
                <th className="py-2.5 px-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-bold">{r.recordNumber}</td>
                  <td className="py-2 px-3 font-mono">{r.month}</td>
                  <td className="py-2 px-3 text-left font-mono">{formatCurrency(r.baseSalary)}</td>
                  <td className="py-2 px-3 text-left font-mono text-emerald-700">
                    {r.overtimeAmount > 0 ? `+${formatCurrency(r.overtimeAmount)}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono text-rose-700">
                    {r.deductionAmount > 0 ? `-${formatCurrency(r.deductionAmount)}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                    {formatCurrency(r.netSalary)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.status === 'paid' ? 'تم الصرف' : 'مستحق'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={triggerPrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة الكشف
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. Expenses Report & Statement                                             */
/* -------------------------------------------------------------------------- */
const ExpensesReport: React.FC<{
  expenses: any[];
  paymentVouchers: any[];
  fromDate: string;
  toDate: string;
  onOpenDetail: (expId: string) => void;
}> = ({ expenses, paymentVouchers, fromDate, toDate, onOpenDetail }) => {
  const total = expenses.reduce((sum, e) => sum + e.currentBalance, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">تقرير المصروفات والمنصرفات الإدارية والتشغيلية</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض إجمالي المصروفات المصنفة مع كشف تفصيلي بكل حركة منصرف
          </p>
        </div>
        <div className="text-left font-mono font-bold text-rose-700 text-sm">
          إجمالي المصروفات: {formatCurrency(total)}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">الكود</th>
              <th className="py-2.5 px-4">اسم بند المصروف</th>
              <th className="py-2.5 px-4 text-left">الرصيد الافتتاحي</th>
              <th className="py-2.5 px-4 text-left">إجمالي المنصرف الفعلي</th>
              <th className="py-2.5 px-4 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{exp.code}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">{exp.name}</td>
                <td className="py-2.5 px-4 text-left font-mono text-slate-600">{formatCurrency(exp.openingBalance)}</td>
                <td className="py-2.5 px-4 text-left font-mono font-bold text-rose-700">
                  {formatCurrency(exp.currentBalance)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={() => onOpenDetail(exp.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    كشف تفصيلي ←
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExpenseDetailModal: React.FC<{
  expenseId: string;
  expense: any;
  paymentVouchers: any[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}> = ({ expense, paymentVouchers, fromDate, toDate, onClose }) => {
  const vouchers = paymentVouchers.filter(
    (p) => p.accountId === expense.id && p.date >= fromDate && p.date <= toDate
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`كشف حساب تفصيلي لبند: ${expense.name}`}
      maxWidth="3xl"
    >
      <div className="printable-area space-y-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">رقم سند الصرف</th>
                <th className="py-2.5 px-3">الخزينة المسددة</th>
                <th className="py-2.5 px-3 text-left">المبلغ المنصرف</th>
                <th className="py-2.5 px-3">البيان والشرح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    لا توجد سندات صرف مسجلة لهذا البند خلال الفترة
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-500">{v.date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{v.voucherNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{v.treasuryName}</td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                      {formatCurrency(v.amount)}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{v.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={triggerPrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* 8. Revenues Report & Statement                                             */
/* -------------------------------------------------------------------------- */
const RevenuesReport: React.FC<{
  revenues: any[];
  receiptVouchers: any[];
  fromDate: string;
  toDate: string;
  onOpenDetail: (revId: string) => void;
}> = ({ revenues, receiptVouchers, fromDate, toDate, onOpenDetail }) => {
  const total = revenues.reduce((sum, r) => sum + r.currentBalance, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">تقرير بنود الإيرادات المتنوعة</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض إجمالي الإيرادات المحصلة من الخدمات والأنشطة الإضافية
          </p>
        </div>
        <div className="text-left font-mono font-bold text-emerald-700 text-sm">
          إجمالي الإيرادات: {formatCurrency(total)}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-2.5 px-4">الكود</th>
              <th className="py-2.5 px-4">اسم بند الإيراد</th>
              <th className="py-2.5 px-4 text-left">الرصيد الافتتاحي</th>
              <th className="py-2.5 px-4 text-left">إجمالي المحصل الفعلي</th>
              <th className="py-2.5 px-4 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {revenues.map((rev) => (
              <tr key={rev.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{rev.code}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">{rev.name}</td>
                <td className="py-2.5 px-4 text-left font-mono text-slate-600">{formatCurrency(rev.openingBalance)}</td>
                <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-700">
                  {formatCurrency(rev.currentBalance)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={() => onOpenDetail(rev.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    كشف تفصيلي ←
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RevenueDetailModal: React.FC<{
  revenueId: string;
  revenue: any;
  receiptVouchers: any[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}> = ({ revenue, receiptVouchers, fromDate, toDate, onClose }) => {
  const vouchers = receiptVouchers.filter(
    (r) => r.accountId === revenue.id && r.date >= fromDate && r.date <= toDate
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`كشف حساب تفصيلي لبند: ${revenue.name}`}
      maxWidth="3xl"
    >
      <div className="printable-area space-y-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">رقم سند القبض</th>
                <th className="py-2.5 px-3">الخزينة المحصل فيها</th>
                <th className="py-2.5 px-3 text-left">المبلغ المحصل</th>
                <th className="py-2.5 px-3">البيان والشرح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    لا توجد سندات قبض مسجلة لهذا الإيراد خلال الفترة
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-500">{v.date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{v.voucherNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{v.treasuryName}</td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-emerald-700">
                      {formatCurrency(v.amount)}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{v.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="no-print flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={triggerPrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* 9. Partners Report                                                         */
/* -------------------------------------------------------------------------- */
const PartnersReport: React.FC<{
  partners: any[];
  partnerCurrentAccounts: any[];
  receiptVouchers: any[];
  paymentVouchers: any[];
  fromDate: string;
  toDate: string;
}> = ({ partners, partnerCurrentAccounts }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">تقرير أرصدة الشركاء وحسابات جاري الشركاء</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          متابعة رؤوس أموال الشركاء المؤسسين ومسحوبات وتغذيات حسابات جاري الشركاء
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partners Capital Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-100 text-xs font-bold text-slate-800 border-b border-slate-200">
            رؤوس أموال الشركاء (حساب رأس المال)
          </div>
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">كود الشريك</th>
                <th className="py-2.5 px-3">اسم الشريك</th>
                <th className="py-2.5 px-3 text-center">النسبة</th>
                <th className="py-2.5 px-3 text-left">الرصيد القائم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.code}</td>
                  <td className="py-2 px-3 font-bold">{p.name}</td>
                  <td className="py-2 px-3 text-center font-mono font-semibold">%{p.sharePercentage || '-'}</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-emerald-800">
                    {formatCurrency(p.currentBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Partners Current Accounts Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-100 text-xs font-bold text-slate-800 border-b border-slate-200">
            حسابات جاري الشركاء (المسحوبات والتغذيات)
          </div>
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">كود الجاري</th>
                <th className="py-2.5 px-3">اسم الشريك</th>
                <th className="py-2.5 px-3 text-left">الافتتاحي</th>
                <th className="py-2.5 px-3 text-left">الرصيد الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {partnerCurrentAccounts.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800">{c.code}</td>
                  <td className="py-2 px-3 font-bold">{c.name}</td>
                  <td className="py-2 px-3 text-left font-mono text-slate-600">{formatCurrency(c.openingBalance)}</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-emerald-800">
                    {formatCurrency(c.currentBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
