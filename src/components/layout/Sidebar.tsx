/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SystemModule } from '../../types';
import {
  LayoutDashboard,
  Database,
  Receipt,
  FileSpreadsheet,
  Warehouse,
  Calculator,
  BarChart3,
  Scale,
  ChevronDown,
  Building2,
  Box,
  Users,
  Briefcase,
  Layers,
  ArrowRightLeft,
  CircleDollarSign,
  TrendingUp,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface TabDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: { id: SystemModule; label: string; icon?: React.ReactNode }[];
}

export const NAVIGATION_TABS: TabDefinition[] = [
  {
    id: 'dashboard-group',
    title: 'لوحة البيانات',
    icon: <LayoutDashboard className="w-5 h-5 text-emerald-400" />,
    children: [
      { id: 'dashboard', label: 'المؤشرات واللوحة الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    id: 'master-data-group',
    title: 'تكويد البيانات الأساسية',
    icon: <Database className="w-5 h-5 text-sky-400" />,
    children: [
      { id: 'warehouses', label: '1. المستودعات' },
      { id: 'items', label: '2. الأصناف' },
      { id: 'units', label: '3. الوحدات' },
      { id: 'customers', label: '4. العملاء' },
      { id: 'suppliers', label: '5. الموردين' },
      { id: 'employees', label: '6. الموظفين' },
      { id: 'jobs', label: '7. الوظائف' },
      { id: 'expenses', label: '8. المصروفات' },
      { id: 'revenues', label: '9. الإيرادات' },
      { id: 'partners', label: '10. الشركاء' },
      { id: 'partner_current', label: '11. جاري الشركاء' },
      { id: 'assets', label: '12. الأصول الثابتة' },
      { id: 'chart_of_accounts', label: '13. شجرة الحسابات (IFRS)' },
      { id: 'users', label: '14. المستخدمين والصلاحيات' },
      { id: 'treasuries', label: '15. الصناديق والبنوك' },
    ],
  },
  {
    id: 'vouchers-group',
    title: 'السندات والتحويلات',
    icon: <Receipt className="w-5 h-5 text-amber-400" />,
    children: [
      { id: 'receipt_vouchers', label: '1. سندات قبض' },
      { id: 'payment_vouchers', label: '2. سندات صرف ودفع' },
      { id: 'cash_transfers', label: '3. تحويلات النقدية والخزن' },
    ],
  },
  {
    id: 'invoices-group',
    title: 'الفواتير والمبيعات',
    icon: <FileSpreadsheet className="w-5 h-5 text-indigo-400" />,
    children: [
      { id: 'purchase_invoices', label: '1. فاتورة المشتريات' },
      { id: 'purchase_return_invoices', label: '2. مردود المشتريات' },
      { id: 'sales_invoices', label: '3. فاتورة المبيعات' },
      { id: 'sales_return_invoices', label: '4. مردود المبيعات' },
    ],
  },
  {
    id: 'inventory-group',
    title: 'إدارة المخازن',
    icon: <Warehouse className="w-5 h-5 text-teal-400" />,
    children: [
      { id: 'warehouse_transfers', label: '1. التحويل بين المستودعات' },
      { id: 'inventory_adjustments', label: '2. تسوية جردية للأصناف' },
      { id: 'cost_recalculation', label: '3. إعادة احتساب متوسط التكلفة' },
    ],
  },
  {
    id: 'accounting-group',
    title: 'العمليات والرواتب',
    icon: <Calculator className="w-5 h-5 text-violet-400" />,
    children: [
      { id: 'journal_entries', label: '1. تسجيل قيود اليومية' },
      { id: 'payroll', label: '2. رواتب الموظفين والإضافي' },
      { id: 'asset_operations', label: '3. عمليات الأصول (شراء / بيع)' },
      { id: 'discount_allowed', label: '4. الخصم المسموح به' },
      { id: 'discount_received', label: '5. الخصم المكتسب' },
    ],
  },
  {
    id: 'reports-group',
    title: 'التقارير التفصيلية',
    icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
    children: [
      { id: 'daily_analyzer', label: '1. محلل العمل اليومي' },
      { id: 'report_inventory', label: '2. تقرير المخازن والأرصدة' },
      { id: 'report_item_movement', label: '3. كارت حركة الصنف التراكمي' },
      { id: 'report_customers', label: '4. تقرير ومديونية العملاء' },
      { id: 'report_suppliers', label: '5. تقرير ومديونية الموردين' },
      { id: 'report_employees', label: '6. كشف مستحقات الموظفين' },
      { id: 'report_expenses', label: '7. تقرير المصروفات' },
      { id: 'report_revenues', label: '8. تقرير الإيرادات' },
      { id: 'report_partners', label: '9. تقرير الشركاء وجاري الشريك' },
    ],
  },
  {
    id: 'final-statements-group',
    title: 'التقارير الختامية',
    icon: <Scale className="w-5 h-5 text-rose-400" />,
    children: [
      { id: 'trial_balance', label: '1. ميزان المراجعة بالمجاميع والأرصدة' },
      { id: 'income_statement', label: '2. قائمة الدخل الشامل' },
      { id: 'trading_account', label: '3. حساب المتاجرة' },
      { id: 'profit_loss', label: '4. حساب الأرباح والخسائر' },
      { id: 'balance_sheet', label: '5. الميزانية العمومية والمركز المالي' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeTab, setActiveTab, currentUser, hasPermission } = useERP();

  // Find which tab group contains the active item
  const findParentGroup = (tab: SystemModule) => {
    const grp = NAVIGATION_TABS.find((g) => g.children.some((c) => c.id === tab));
    return grp ? grp.id : 'dashboard-group';
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'dashboard-group': true,
    'master-data-group': true,
    'vouchers-group': false,
    'invoices-group': false,
    'inventory-group': false,
    'accounting-group': false,
    'reports-group': false,
    'final-statements-group': false,
    [findParentGroup(activeTab)]: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <aside
      className={`no-print bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-950">
            <Building2 className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-wide truncate">
                الرضوان للحسابات
              </h1>
              <p className="text-[11px] text-slate-400 truncate">نظام الحسابات والمخازن ERP</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-xs">
        {NAVIGATION_TABS.map((group) => {
          const isOpen = openGroups[group.id];
          const hasActiveChild = group.children.some((c) => c.id === activeTab);

          if (collapsed) {
            return (
              <div key={group.id} className="relative group/tooltip">
                <button
                  onClick={() => {
                    toggleGroup(group.id);
                    if (group.children.length === 1) {
                      setActiveTab(group.children[0].id);
                    }
                  }}
                  className={`w-full h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                    hasActiveChild ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={group.title}
                >
                  {group.icon}
                </button>
              </div>
            );
          }

          return (
            <div key={group.id} className="rounded-xl overflow-hidden mb-1">
              {/* Group Accordion Header */}
              <button
                onClick={() => {
                  if (group.children.length === 1) {
                    setActiveTab(group.children[0].id);
                  } else {
                    toggleGroup(group.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  hasActiveChild
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {group.icon}
                  <span className="truncate">{group.title}</span>
                </div>
                {group.children.length > 1 && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Group Sub-items */}
              {group.children.length > 1 && isOpen && (
                <div className="mr-3 pr-2 border-r border-slate-800 mt-1 space-y-0.5">
                  {group.children.map((child) => {
                    const isSelected = activeTab === child.id;
                    const canView = hasPermission(child.id, 'view');

                    return (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full text-right px-3 py-1.5 rounded-lg transition-all text-[11px] block truncate cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                        } ${!canView ? 'opacity-40 line-through' : ''}`}
                        title={!canView ? 'لا توجد صلاحية عرض لهذا البند' : child.label}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info & Footer */}
      {!collapsed && currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <span className="text-white font-semibold block truncate">{currentUser.name}</span>
              <span className="text-slate-400 text-[11px] block truncate">{currentUser.email}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
