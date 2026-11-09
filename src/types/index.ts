/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User and Permissions
export type SystemAction = 'view' | 'create' | 'edit' | 'delete' | 'print';

export type SystemModule =
  | 'dashboard'
  // Master Data
  | 'warehouses'
  | 'items'
  | 'units'
  | 'customers'
  | 'suppliers'
  | 'employees'
  | 'jobs'
  | 'expenses'
  | 'revenues'
  | 'partners'
  | 'partner_current'
  | 'assets'
  | 'chart_of_accounts'
  | 'users'
  | 'treasuries'
  // Vouchers
  | 'receipt_vouchers'
  | 'payment_vouchers'
  | 'cash_transfers'
  // Invoices
  | 'purchase_invoices'
  | 'purchase_return_invoices'
  | 'sales_invoices'
  | 'sales_return_invoices'
  // Inventory
  | 'warehouse_transfers'
  | 'inventory_adjustments'
  | 'cost_recalculation'
  // Accounting & Operations
  | 'journal_entries'
  | 'payroll'
  | 'asset_operations'
  | 'discount_allowed'
  | 'discount_received'
  // Reports
  | 'daily_analyzer'
  | 'report_inventory'
  | 'report_item_movement'
  | 'report_customers'
  | 'report_suppliers'
  | 'report_employees'
  | 'report_expenses'
  | 'report_revenues'
  | 'report_partners'
  // Final Statements
  | 'trial_balance'
  | 'income_statement'
  | 'trading_account'
  | 'profit_loss'
  | 'balance_sheet';

export interface UserPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
}

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'accountant' | 'warehouse_manager' | 'cashier' | 'custom';
  permissions: Record<SystemModule, UserPermission>;
  isActive: boolean;
  createdAt: string;
}

// Master Data Entities
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  manager: string;
  address: string;
  notes?: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
}

export interface ItemUnit {
  unitId: string;
  unitName: string;
  conversionFactor: number; // e.g., 1 box = 12 pieces => factor is 12
  isDefault: boolean;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  baseUnitId: string;
  units: ItemUnit[];
  costPrice: number; // dynamically recalculated based on actual item movements
  sellingPrice: number;
  calculateVat: boolean;
  vatRate: number; // default 14%
  minStockLevel?: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  creditLimit: number;
  openingBalance: number;
  contactPerson: string;
  phone: string;
  salesRepresentative: string;
  billingAddress: string;
  contactDetails: string;
  currentBalance: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  contactPerson: string;
  phone: string;
  billingAddress: string;
  contactDetails: string;
  currentBalance: number;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  address: string;
  contactDetails: string;
  monthlySalary: number;
  dailySalary: number;
  openingBalance: number;
  currentBalance: number;
  jobId?: string;
  jobName?: string;
}

export interface Job {
  id: string;
  code: string;
  name: string;
}

export interface ExpenseType {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
}

export interface RevenueType {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
  sharePercentage?: number;
  notes?: string;
}

export interface PartnerCurrentAccount {
  id: string;
  code: string;
  name: string; // Linked directly to partner name
  openingBalance: number; // Editable
  currentBalance: number;
  partnerId: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  purchaseDate?: string;
  currentBookValue: number;
}

export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: AccountCategory;
  parentCode: string | null;
  level: number;
  debit: number;
  credit: number;
  balance: number;
  isLeaf: boolean;
}

export type TreasuryType = 'cash' | 'bank' | 'e_wallet';

export interface Treasury {
  id: string;
  code: string;
  type: TreasuryType;
  accountName: string;
  openingBalance: number;
  currentBalance: number;
  bankName?: string;
  accountNumber?: string;
}

// Vouchers & Cash Transfers
export type AccountPartyType = 'customer' | 'supplier' | 'employee' | 'partner' | 'revenue' | 'expense' | 'asset' | 'other';

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  amount: number;
  accountType: AccountPartyType;
  accountId: string;
  accountName: string;
  paymentMethod: TreasuryType;
  treasuryId: string;
  treasuryName: string;
  notes: string;
  referenceDoc?: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  amount: number;
  accountType: AccountPartyType;
  accountId: string;
  accountName: string;
  paymentMethod: TreasuryType;
  treasuryId: string;
  treasuryName: string;
  notes: string;
  referenceDoc?: string;
}

export interface CashTransfer {
  id: string;
  transferNumber: string;
  date: string;
  amount: number;
  fromTreasuryId: string;
  fromTreasuryName: string;
  fromType: TreasuryType;
  toTreasuryId: string;
  toTreasuryName: string;
  toType: TreasuryType;
  notes: string;
}

// Invoices
export type InvoiceType = 'purchase' | 'purchase_return' | 'sales' | 'sales_return';

export interface InvoiceItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unitId: string;
  unitName: string;
  conversionFactor: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatAmount: number;
  subtotal: number;
  total: number;
  costPriceAtTime: number; // for inventory valuation & cost of sales
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  date: string;
  partyId: string; // customerId or supplierId
  partyName: string;
  warehouseId: string;
  warehouseName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  calculateVat: boolean;
  vatRate: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'cash' | 'credit' | 'partial';
  treasuryId?: string;
  treasuryName?: string;
  notes?: string;
  costOfSalesTotal?: number; // total cost price of items sold in this sales invoice
}

// Warehouse Management
export interface WarehouseTransferItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unitName: string;
  quantity: number;
  costPrice: number;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: WarehouseTransferItem[];
  totalCost: number;
  notes: string;
}

export interface InventoryAdjustmentItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unitName: string;
  currentSystemQty: number;
  actualPhysicalQty: number;
  diffQty: number;
  costPrice: number;
  totalCostImpact: number;
}

export interface InventoryAdjustment {
  id: string;
  adjustmentNumber: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  items: InventoryAdjustmentItem[];
  totalImpact: number;
  notes: string;
}

// Accounting & Operations
export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  referenceType?: 'manual' | 'invoice' | 'voucher' | 'payroll' | 'transfer' | 'asset';
  referenceId?: string;
}

export interface PayrollRecord {
  id: string;
  recordNumber: string;
  date: string;
  month: string; // e.g. "2026-11"
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  overtimeAmount: number;
  deductionAmount: number;
  netSalary: number;
  status: 'draft' | 'paid';
  paidDate?: string;
  treasuryId?: string;
  treasuryName?: string;
  notes?: string;
}

export interface AssetOperation {
  id: string;
  operationNumber: string;
  date: string;
  assetId: string;
  assetName: string;
  operationType: 'purchase' | 'sale';
  amount: number;
  treasuryId: string;
  treasuryName: string;
  gainOrLoss?: number;
  notes?: string;
}

export interface DiscountRecord {
  id: string;
  recordNumber: string;
  date: string;
  type: 'discount_allowed' | 'discount_received';
  accountType: AccountPartyType;
  accountId: string;
  accountName: string;
  amount: number;
  notes: string;
}

// Stock tracking per warehouse
export interface StockPosition {
  warehouseId: string;
  itemId: string;
  quantity: number;
}

// Navigation structure
export type MainTabKey =
  | 'dashboard'
  | 'master_data'
  | 'vouchers'
  | 'invoices'
  | 'warehouse_mgmt'
  | 'accounting_ops'
  | 'reports'
  | 'final_statements';

export interface NavItem {
  id: SystemModule;
  label: string;
  icon?: string;
}

export interface MainTabGroup {
  key: MainTabKey;
  label: string;
  icon: string;
  items: NavItem[];
}
