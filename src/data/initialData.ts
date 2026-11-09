/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Warehouse,
  Unit,
  Item,
  Customer,
  Supplier,
  Employee,
  Job,
  ExpenseType,
  RevenueType,
  Partner,
  PartnerCurrentAccount,
  FixedAsset,
  ChartAccount,
  Treasury,
  ReceiptVoucher,
  PaymentVoucher,
  CashTransfer,
  Invoice,
  WarehouseTransfer,
  InventoryAdjustment,
  JournalEntry,
  PayrollRecord,
  AssetOperation,
  DiscountRecord,
  StockPosition,
  SystemModule,
  UserPermission,
} from '../types';

export const ALL_SYSTEM_MODULES: SystemModule[] = [
  'dashboard',
  'warehouses',
  'items',
  'units',
  'customers',
  'suppliers',
  'employees',
  'jobs',
  'expenses',
  'revenues',
  'partners',
  'partner_current',
  'assets',
  'chart_of_accounts',
  'users',
  'treasuries',
  'receipt_vouchers',
  'payment_vouchers',
  'cash_transfers',
  'purchase_invoices',
  'purchase_return_invoices',
  'sales_invoices',
  'sales_return_invoices',
  'warehouse_transfers',
  'inventory_adjustments',
  'cost_recalculation',
  'journal_entries',
  'payroll',
  'asset_operations',
  'discount_allowed',
  'discount_received',
  'daily_analyzer',
  'report_inventory',
  'report_item_movement',
  'report_customers',
  'report_suppliers',
  'report_employees',
  'report_expenses',
  'report_revenues',
  'report_partners',
  'trial_balance',
  'income_statement',
  'trading_account',
  'profit_loss',
  'balance_sheet',
];

export const createFullPermissions = (): Record<SystemModule, UserPermission> => {
  const perms: Partial<Record<SystemModule, UserPermission>> = {};
  ALL_SYSTEM_MODULES.forEach((mod) => {
    perms[mod] = { view: true, create: true, edit: true, delete: true, print: true };
  });
  return perms as Record<SystemModule, UserPermission>;
};

// Default Users - Only the primary system administrator
export const initialUsers: User[] = [
  {
    id: 'user-admin',
    code: 'USR-001',
    name: 'المهندس أحمد رضوان (المدير العام)',
    email: 'radwanahmedeg2028@gmail.com',
    password: 'admin',
    role: 'admin',
    permissions: createFullPermissions(),
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
  },
];

// Empty Master Data (clean for production/fresh start)
export const initialWarehouses: Warehouse[] = [];
export const initialUnits: Unit[] = [];
export const initialItems: Item[] = [];
export const initialStocks: StockPosition[] = [];
export const initialCustomers: Customer[] = [];
export const initialSuppliers: Supplier[] = [];
export const initialJobs: Job[] = [];
export const initialEmployees: Employee[] = [];
export const initialExpenses: ExpenseType[] = [];
export const initialRevenues: RevenueType[] = [];
export const initialPartners: Partner[] = [];
export const initialPartnerCurrentAccounts: PartnerCurrentAccount[] = [];
export const initialAssets: FixedAsset[] = [];
export const initialTreasuries: Treasury[] = [];

// Complete IFRS International Accounting Standards Chart of Accounts (clean with 0 balances)
export const initialChartOfAccounts: ChartAccount[] = [
  // 1 الأصول (Assets)
  { id: 'coa-1', code: '1', name: 'الأصول', type: 'asset', parentCode: null, level: 1, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-11', code: '11', name: 'الأصول المتداولة', type: 'asset', parentCode: '1', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-111', code: '111', name: 'النقدية وما في حكمها (الخزن والبنوك)', type: 'asset', parentCode: '11', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-112', code: '112', name: 'العملاء والمدينون التجاريون', type: 'asset', parentCode: '11', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-113', code: '113', name: 'أوراق القبض (الشيكات تحت التحصيل)', type: 'asset', parentCode: '11', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-114', code: '114', name: 'المخزون السلعي (بضاعة بالمستودعات)', type: 'asset', parentCode: '11', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-115', code: '115', name: 'مصروفات مدفوعة مقدماً وإيرادات مستحقة', type: 'asset', parentCode: '11', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-12', code: '12', name: 'الأصول غير المتداولة (الثابتة)', type: 'asset', parentCode: '1', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-121', code: '121', name: 'الأراضي والمباني', type: 'asset', parentCode: '12', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-122', code: '122', name: 'الآلات والمعدات وسيرفرات الشبكات', type: 'asset', parentCode: '12', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-123', code: '123', name: 'سيارات ووسائل النقل والانتقال', type: 'asset', parentCode: '12', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-124', code: '124', name: 'الأثاث والتجهيزات المكتبية', type: 'asset', parentCode: '12', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-129', code: '129', name: 'مجمع إهلاك الأصول الثابتة (دائن)', type: 'asset', parentCode: '12', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },

  // 2 الخصوم (Liabilities)
  { id: 'coa-2', code: '2', name: 'الخصوم والالتزامات', type: 'liability', parentCode: null, level: 1, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-21', code: '21', name: 'الالتزامات المتداولة', type: 'liability', parentCode: '2', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-211', code: '211', name: 'الموردون والدائنون التجاريون', type: 'liability', parentCode: '21', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-212', code: '212', name: 'أوراق الدفع (الشيكات الصادرة)', type: 'liability', parentCode: '21', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-213', code: '213', name: 'ضريبة القيمة المضافة المستحقة (VAT)', type: 'liability', parentCode: '21', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-214', code: '214', name: 'مصروفات مستحقة وأرصدة دائنة أخرى', type: 'liability', parentCode: '21', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-22', code: '22', name: 'الالتزامات غير المتداولة (طويلة الأجل)', type: 'liability', parentCode: '2', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-221', code: '221', name: 'قروض وتسهيلات بنكية طويلة الأجل', type: 'liability', parentCode: '22', level: 3, debit: 0, credit: 0, balance: 0, isLeaf: true },

  // 3 حقوق الملكية (Equity)
  { id: 'coa-3', code: '3', name: 'حقوق الملكية ورأس المال', type: 'equity', parentCode: null, level: 1, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-31', code: '31', name: 'رأس مال الشركاء', type: 'equity', parentCode: '3', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-32', code: '32', name: 'جاري الشركاء', type: 'equity', parentCode: '3', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-33', code: '33', name: 'أرباح مرحلة ومحتجزة', type: 'equity', parentCode: '3', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-34', code: '34', name: 'صافي أرباح وخسائر العام الحالي', type: 'equity', parentCode: '3', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },

  // 4 الإيرادات (Revenues)
  { id: 'coa-4', code: '4', name: 'الإيرادات', type: 'revenue', parentCode: null, level: 1, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-41', code: '41', name: 'إيرادات النشاط الرئيسي (المبيعات)', type: 'revenue', parentCode: '4', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-42', code: '42', name: 'مردودات ومسموحات المبيعات (مدين)', type: 'revenue', parentCode: '4', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-43', code: '43', name: 'الخصم المسموح به (مدين)', type: 'revenue', parentCode: '4', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-44', code: '44', name: 'إيرادات خدمات واستشارات تقنية', type: 'revenue', parentCode: '4', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-49', code: '49', name: 'إيرادات أخرى وأرباح رأسمالية', type: 'revenue', parentCode: '4', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },

  // 5 المصروفات (Expenses)
  { id: 'coa-5', code: '5', name: 'المصروفات والتكاليف', type: 'expense', parentCode: null, level: 1, debit: 0, credit: 0, balance: 0, isLeaf: false },
  { id: 'coa-51', code: '51', name: 'تكلفة المبيعات والمشتريات', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-52', code: '52', name: 'مردودات ومسموحات المشتريات (دائن)', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-53', code: '53', name: 'الخصم المكتسب (دائن)', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-54', code: '54', name: 'الأجور والرواتب ومستحقات الموظفين', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-55', code: '55', name: 'مصاريف عمومية وإدارية وتشغيلية', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-56', code: '56', name: 'مصاريف تسويق وبيوع وتوزيع', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
  { id: 'coa-57', code: '57', name: 'إهلاك الأصول الثابتة', type: 'expense', parentCode: '5', level: 2, debit: 0, credit: 0, balance: 0, isLeaf: true },
];

// Empty Transaction Arrays (All clean for production)
export const initialInvoices: Invoice[] = [];
export const initialReceiptVouchers: ReceiptVoucher[] = [];
export const initialPaymentVouchers: PaymentVoucher[] = [];
export const initialCashTransfers: CashTransfer[] = [];
export const initialWarehouseTransfers: WarehouseTransfer[] = [];
export const initialInventoryAdjustments: InventoryAdjustment[] = [];
export const initialJournalEntries: JournalEntry[] = [];
export const initialPayrollRecords: PayrollRecord[] = [];
export const initialAssetOperations: AssetOperation[] = [];
export const initialDiscounts: DiscountRecord[] = [];
