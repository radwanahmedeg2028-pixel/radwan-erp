/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Tab Views
import { DashboardView } from './components/dashboard/DashboardView';
import { WarehousesView } from './components/master-data/WarehousesView';
import { ItemsView } from './components/master-data/ItemsView';
import { UnitsView } from './components/master-data/UnitsView';
import { CustomersView } from './components/master-data/CustomersView';
import { SuppliersView } from './components/master-data/SuppliersView';
import { EmployeesAndJobsView } from './components/master-data/EmployeesAndJobsView';
import { ExpensesAndRevenuesView } from './components/master-data/ExpensesAndRevenuesView';
import { PartnersView } from './components/master-data/PartnersView';
import { FixedAssetsView } from './components/master-data/FixedAssetsView';
import { ChartOfAccountsView } from './components/master-data/ChartOfAccountsView';
import { UsersAndPermissionsView } from './components/master-data/UsersAndPermissionsView';
import { TreasuriesView } from './components/master-data/TreasuriesView';
import { VouchersView } from './components/vouchers/VouchersView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { WarehouseMgmtView } from './components/inventory/WarehouseMgmtView';
import { AccountingOpsView } from './components/accounting/AccountingOpsView';
import { OperationalReportsView } from './components/reports/OperationalReportsView';
import { FinancialStatementsView } from './components/financial/FinancialStatementsView';

import { ShieldAlert, ArrowLeft } from 'lucide-react';

const MainAppLayout: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, hasPermission } = useERP();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Permission Check
  const canView = hasPermission(activeTab, 'view');

  const renderActiveScreen = () => {
    if (!canView) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">عفواً، لا تملك صلاحية عرض هذه الشاشة</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            تم تقييد وصولك إلى هذه الشاشة بواسطة مسئول النظام. يرجى مراجعة إدارة الحسابات أو طلب منح صلاحية (عرض) من شاشة صلاحيات المستخدمين.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            العودة إلى لوحة البيانات الرئيسية
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'warehouses':
        return <WarehousesView />;
      case 'items':
        return <ItemsView />;
      case 'units':
        return <UnitsView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'employees':
      case 'jobs':
        return <EmployeesAndJobsView />;
      case 'expenses':
      case 'revenues':
        return <ExpensesAndRevenuesView />;
      case 'partners':
      case 'partner_current':
        return <PartnersView />;
      case 'assets':
        return <FixedAssetsView />;
      case 'chart_of_accounts':
        return <ChartOfAccountsView />;
      case 'users':
        return <UsersAndPermissionsView />;
      case 'treasuries':
        return <TreasuriesView />;

      // Vouchers
      case 'receipt_vouchers':
      case 'payment_vouchers':
      case 'cash_transfers':
        return <VouchersView />;

      // Invoices
      case 'purchase_invoices':
      case 'purchase_return_invoices':
      case 'sales_invoices':
      case 'sales_return_invoices':
        return <InvoicesView />;

      // Warehouse Management
      case 'warehouse_transfers':
      case 'inventory_adjustments':
      case 'cost_recalculation':
        return <WarehouseMgmtView />;

      // Accounting Operations
      case 'journal_entries':
      case 'payroll':
      case 'asset_operations':
      case 'discount_allowed':
      case 'discount_received':
        return <AccountingOpsView />;

      // Operational Reports
      case 'daily_analyzer':
      case 'report_inventory':
      case 'report_item_movement':
      case 'report_customers':
      case 'report_suppliers':
      case 'report_employees':
      case 'report_expenses':
      case 'report_revenues':
      case 'report_partners':
        return <OperationalReportsView />;

      // Final Financial Statements
      case 'trial_balance':
      case 'income_statement':
      case 'trading_account':
      case 'profit_loss':
      case 'balance_sheet':
        return <FinancialStatementsView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      {/* Arabic Sidebar (Right Side) */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveScreen()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainAppLayout />
    </ERPProvider>
  );
}
