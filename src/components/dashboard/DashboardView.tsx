/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useERP } from '../../context/ERPContext';
import { StatCard } from '../common/StatCard';
import { formatCurrency, formatNumber } from '../../utils/exportUtils';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Wallet,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building,
  CreditCard,
  Scale,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    invoices,
    expenses,
    revenues,
    paymentVouchers,
    customers,
    suppliers,
    treasuries,
    setActiveTab,
  } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. All-time calculations
  const allSalesInvoices = invoices.filter((i) => i.type === 'sales');
  const allSalesReturns = invoices.filter((i) => i.type === 'sales_return');
  const totalSalesAll = allSalesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalSalesReturnsAll = allSalesReturns.reduce((sum, i) => sum + i.grandTotal, 0);
  const netSalesAll = totalSalesAll - totalSalesReturnsAll;

  const allPurchaseInvoices = invoices.filter((i) => i.type === 'purchase');
  const allPurchaseReturns = invoices.filter((i) => i.type === 'purchase_return');
  const totalPurchasesAll = allPurchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPurchaseReturnsAll = allPurchaseReturns.reduce((sum, i) => sum + i.grandTotal, 0);
  const netPurchasesAll = totalPurchasesAll - totalPurchaseReturnsAll;

  // Cost of sales: sum of items sold * costPrice
  const costOfSalesAll = allSalesInvoices.reduce((sum, inv) => {
    const invCost =
      inv.costOfSalesTotal ??
      inv.items.reduce((s, itm) => s + itm.quantity * (itm.conversionFactor || 1) * itm.costPriceAtTime, 0);
    return sum + invCost;
  }, 0);

  // Total expenses all-time
  const voucherExpensesAll = paymentVouchers
    .filter((p) => p.accountType === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);
  const masterExpensesAll = expenses.reduce((sum, e) => sum + e.currentBalance, 0);
  const totalExpensesAll = Math.max(voucherExpensesAll, masterExpensesAll);

  // Other revenues
  const otherRevenuesAll = revenues.reduce((sum, r) => sum + r.currentBalance, 0);

  // Net profit all-time = Net Sales - Cost of Goods Sold + Other Revenues - Expenses
  const netProfitAll = netSalesAll - costOfSalesAll + otherRevenuesAll - totalExpensesAll;

  // 2. Today's calculations
  const todaySalesInvoices = allSalesInvoices.filter((i) => i.date === todayStr);
  const todaySalesReturns = allSalesReturns.filter((i) => i.date === todayStr);
  const netSalesToday =
    todaySalesInvoices.reduce((sum, i) => sum + i.grandTotal, 0) -
    todaySalesReturns.reduce((sum, i) => sum + i.grandTotal, 0);

  const todayPurchaseInvoices = allPurchaseInvoices.filter((i) => i.date === todayStr);
  const todayPurchaseReturns = allPurchaseReturns.filter((i) => i.date === todayStr);
  const netPurchasesToday =
    todayPurchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0) -
    todayPurchaseReturns.reduce((sum, i) => sum + i.grandTotal, 0);

  const costOfSalesToday = todaySalesInvoices.reduce((sum, inv) => {
    return (
      sum +
      (inv.costOfSalesTotal ??
        inv.items.reduce((s, itm) => s + itm.quantity * (itm.conversionFactor || 1) * itm.costPriceAtTime, 0))
    );
  }, 0);

  const expensesToday = paymentVouchers
    .filter((p) => p.accountType === 'expense' && p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const revenuesToday = paymentVouchers
    .filter((p) => p.accountType === 'revenue' && p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const netProfitToday = netSalesToday - costOfSalesToday + revenuesToday - expensesToday;

  // 3. Top 10 customer debts
  const top10Customers = [...customers]
    .filter((c) => c.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 10);

  // 4. Top 10 supplier debts
  const top10Suppliers = [...suppliers]
    .filter((s) => s.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 10);

  // 5. Total cash and bank balances
  const totalTreasuriesBalance = treasuries.reduce((sum, t) => sum + t.currentBalance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">
            نظام الرضوان المحاسبي المتكامل
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            لوحة البيانات والمؤشرات المالية والتشغيلية
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1.5 max-w-2xl">
            متابعة فورية للمبيعات، المشتريات، تكلفة البضاعة المباعة، المصروفات، السيولة النقدية، ومديونيات العملاء والموردين وفق المعايير المحاسبية.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-700/80 px-5 py-3.5 rounded-2xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي السيولة والخزن والبنوك</span>
            <span className="text-lg md:text-xl font-bold font-mono tabular-nums text-white">
              {formatCurrency(totalTreasuriesBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: All-Time Financial Performance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            المؤشرات المالية (طول الفترة)
          </h2>
          <span className="text-xs text-slate-500">حسابات تراكمية منذ بداية النشاط</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="صافي المبيعات (طول الفترة)"
            value={formatCurrency(netSalesAll)}
            subtitle="إجمالي الفواتير بعد المردودات"
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="صافي المشتريات (طول الفترة)"
            value={formatCurrency(netPurchasesAll)}
            subtitle="مشتريات البضاعة بعد المردودات"
            icon={<ShoppingCart className="w-4 h-4 text-sky-600" />}
          />
          <StatCard
            title="تكلفة المبيعات (طول الفترة)"
            value={formatCurrency(costOfSalesAll)}
            subtitle="التكلفة الفعلية للبضاعة المباعة"
            icon={<Scale className="w-4 h-4 text-amber-600" />}
          />
          <StatCard
            title="إجمالي المصروفات (طول الفترة)"
            value={formatCurrency(totalExpensesAll)}
            subtitle="المصروفات التشغيلية والإدارية"
            icon={<ArrowDownLeft className="w-4 h-4 text-rose-600" />}
          />
          <StatCard
            title="صافي الأرباح (طول الفترة)"
            value={formatCurrency(netProfitAll)}
            subtitle="مجمل الربح مخصوماً منه المصروفات"
            trend={netProfitAll >= 0 ? '+ربح تشغيلي' : '-عجز تشغيلي'}
            isPositive={netProfitAll >= 0}
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
          />
        </div>
      </div>

      {/* Section 2: Today's Operational Performance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            المؤشرات المالية ليوم العمل الحالي ({todayStr})
          </h2>
          <span className="text-xs text-slate-500">حركات اليوم الفورية</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="صافي مبيعات اليوم"
            value={formatCurrency(netSalesToday)}
            subtitle={`${todaySalesInvoices.length} فواتير بيع اليوم`}
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
          />
          <StatCard
            title="صافي مشتريات اليوم"
            value={formatCurrency(netPurchasesToday)}
            subtitle={`${todayPurchaseInvoices.length} فواتير شراء اليوم`}
            icon={<ShoppingCart className="w-4 h-4 text-sky-600" />}
          />
          <StatCard
            title="تكلفة مبيعات اليوم"
            value={formatCurrency(costOfSalesToday)}
            subtitle="تكلفة البضاعة المباعة اليوم"
            icon={<Scale className="w-4 h-4 text-amber-600" />}
          />
          <StatCard
            title="إجمالي مصروفات اليوم"
            value={formatCurrency(expensesToday)}
            subtitle="سندات صرف ومصروفات اليوم"
            icon={<ArrowDownLeft className="w-4 h-4 text-rose-600" />}
          />
          <StatCard
            title="صافي أرباح اليوم"
            value={formatCurrency(netProfitToday)}
            subtitle="صافي ربح حركة اليوم"
            trend={netProfitToday >= 0 ? '+ربح يومي' : '-عجز يومي'}
            isPositive={netProfitToday >= 0}
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
          />
        </div>
      </div>

      {/* Section 3: Treasuries & Cash/Bank Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              أرصدة الخزن والبنوك والمحافظ الإلكترونية
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تفصيل أرصدة السيولة النقدية المتاحة بجميع الحسابات البنكية والخزائن
            </p>
          </div>
          <button
            onClick={() => setActiveTab('treasuries')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            إدارة الصناديق والبنوك ←
          </button>
        </div>

        {treasuries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            لم يتم تكويد صناديق أو بنوك حتى الآن. يمكنك إضافة صناديق وبنوك من شاشة الصناديق.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {treasuries.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono">{t.code}</span>
                  <span className="font-semibold text-slate-600">
                    {t.type === 'cash' ? 'خزينة نقدية' : t.type === 'bank' ? 'حساب بنكي' : 'محفظة إلكترونية'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 truncate">{t.accountName}</h4>
                <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">الرصيد المتاح:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                    {formatCurrency(t.currentBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Top 10 Customer Debts & Top 10 Supplier Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Customers Debt */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                أعلى 10 مديونية عملاء (مستحقات للمنشأة)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                العملاء الأكثر مديونية مرتبين تنازلياً حسب الرصيد القائم
              </p>
            </div>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
            >
              شاشة العملاء ←
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {top10Customers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد مديونيات قائمة على العملاء حالياً
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">اسم العميل</th>
                    <th className="py-2.5 px-3">الهاتف</th>
                    <th className="py-2.5 px-3">حد الائتمان</th>
                    <th className="py-2.5 px-3 text-left">المديونية الحالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {top10Customers.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[150px]">
                        {c.name}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500" dir="ltr">{c.phone || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                        {formatCurrency(c.currentBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top 10 Supplier Debts */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                أعلى 10 مديونية موردين (التزامات على المنشأة)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                الموردون الواجب سداد مستحقاتهم مرتبين تنازلياً
              </p>
            </div>
            <button
              onClick={() => setActiveTab('suppliers')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
            >
              شاشة الموردين ←
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {top10Suppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد مستحقات أو التزامات للموردين حالياً
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">اسم المورد</th>
                    <th className="py-2.5 px-3">المسئول</th>
                    <th className="py-2.5 px-3">الهاتف</th>
                    <th className="py-2.5 px-3 text-left">المستحق للمورد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {top10Suppliers.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[150px]">
                        {s.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{s.contactPerson || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500" dir="ltr">{s.phone || '-'}</td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-amber-700">
                        {formatCurrency(s.currentBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
