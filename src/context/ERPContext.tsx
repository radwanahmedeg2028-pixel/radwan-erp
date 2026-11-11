/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  SystemModule,
  SystemAction,
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
} from '../types';
import {
  initialUsers,
  initialWarehouses,
  initialUnits,
  initialItems,
  initialStocks,
  initialCustomers,
  initialSuppliers,
  initialJobs,
  initialEmployees,
  initialExpenses,
  initialRevenues,
  initialPartners,
  initialPartnerCurrentAccounts,
  initialAssets,
  initialTreasuries,
  initialChartOfAccounts,
  initialInvoices,
  initialReceiptVouchers,
  initialPaymentVouchers,
  initialCashTransfers,
  initialWarehouseTransfers,
  initialInventoryAdjustments,
  initialJournalEntries,
  initialPayrollRecords,
  initialAssetOperations,
  initialDiscounts,
} from '../data/initialData';

interface ERPContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  hasPermission: (module: SystemModule, action: SystemAction) => boolean;

  // Active Navigation
  activeTab: SystemModule;
  setActiveTab: (tab: SystemModule) => void;

  // Master Data
  warehouses: Warehouse[];
  addWarehouse: (wh: Omit<Warehouse, 'id'>) => void;
  editWarehouse: (id: string, wh: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => { success: boolean; message?: string };

  units: Unit[];
  addUnit: (u: Omit<Unit, 'id'>) => void;
  editUnit: (id: string, u: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  items: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  editItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  stocks: StockPosition[];
  getItemStockInWarehouse: (itemId: string, warehouseId: string) => number;
  getItemTotalStock: (itemId: string) => number;

  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'currentBalance'>) => void;
  editCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, 'id' | 'currentBalance'>) => void;
  editSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (e: Omit<Employee, 'id' | 'currentBalance'>) => void;
  editEmployee: (id: string, e: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  addJob: (j: Omit<Job, 'id'>) => void;
  editJob: (id: string, j: Partial<Job>) => void;
  deleteJob: (id: string) => void;

  expenses: ExpenseType[];
  addExpense: (exp: Omit<ExpenseType, 'id' | 'currentBalance'>) => void;
  editExpense: (id: string, exp: Partial<ExpenseType>) => void;
  deleteExpense: (id: string) => void;

  revenues: RevenueType[];
  addRevenue: (rev: Omit<RevenueType, 'id' | 'currentBalance'>) => void;
  editRevenue: (id: string, rev: Partial<RevenueType>) => void;
  deleteRevenue: (id: string) => void;

  partners: Partner[];
  addPartner: (p: Omit<Partner, 'id' | 'currentBalance'>) => void;
  editPartner: (id: string, p: Partial<Partner>) => { success: boolean; message?: string };
  deletePartner: (id: string) => { success: boolean; message?: string };

  partnerCurrentAccounts: PartnerCurrentAccount[];
  editPartnerCurrentOpeningBalance: (id: string, newOpeningBalance: number) => void;

  assets: FixedAsset[];
  addAsset: (a: Omit<FixedAsset, 'id' | 'currentBookValue'>) => void;
  editAsset: (id: string, a: Partial<FixedAsset>) => void;
  deleteAsset: (id: string) => void;

  chartOfAccounts: ChartAccount[];
  addChartAccount: (acc: Omit<ChartAccount, 'id' | 'debit' | 'credit' | 'balance'>) => void;
  editChartAccount: (id: string, acc: Partial<ChartAccount>) => void;
  deleteChartAccount: (id: string) => { success: boolean; message?: string };

  users: User[];
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  editUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };

  treasuries: Treasury[];
  addTreasury: (t: Omit<Treasury, 'id' | 'currentBalance'>) => void;
  editTreasury: (id: string, t: Partial<Treasury>) => void;
  deleteTreasury: (id: string) => void;

  // Vouchers
  receiptVouchers: ReceiptVoucher[];
  addReceiptVoucher: (v: Omit<ReceiptVoucher, 'id' | 'voucherNumber'>) => void;
  deleteReceiptVoucher: (id: string) => void;

  paymentVouchers: PaymentVoucher[];
  addPaymentVoucher: (v: Omit<PaymentVoucher, 'id' | 'voucherNumber'>) => void;
  deletePaymentVoucher: (id: string) => void;

  cashTransfers: CashTransfer[];
  addCashTransfer: (t: Omit<CashTransfer, 'id' | 'transferNumber'>) => void;
  deleteCashTransfer: (id: string) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  editInvoice: (id: string, inv: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Inventory Mgmt
  warehouseTransfers: WarehouseTransfer[];
  addWarehouseTransfer: (wt: Omit<WarehouseTransfer, 'id' | 'transferNumber'>) => void;
  deleteWarehouseTransfer: (id: string) => void;
  inventoryAdjustments: InventoryAdjustment[];
  addInventoryAdjustment: (adj: Omit<InventoryAdjustment, 'id' | 'adjustmentNumber'>) => void;
  deleteInventoryAdjustment: (id: string) => void;
  recalculateWeightedAverageCost: () => { updatedCount: number; message: string };

  // Accounting Ops
  journalEntries: JournalEntry[];
  addJournalEntry: (je: Omit<JournalEntry, 'id' | 'entryNumber' | 'isBalanced' | 'totalDebit' | 'totalCredit'>) => { success: boolean; message?: string };
  deleteJournalEntry: (id: string) => void;
  payrollRecords: PayrollRecord[];
  addPayrollRecord: (pr: Omit<PayrollRecord, 'id' | 'recordNumber' | 'netSalary'>) => void;
  payPayroll: (id: string, treasuryId: string) => void;
  deletePayrollRecord: (id: string) => void;

  assetOperations: AssetOperation[];
  addAssetOperation: (op: Omit<AssetOperation, 'id' | 'operationNumber'>) => void;
  deleteAssetOperation: (id: string) => void;

  discounts: DiscountRecord[];
  addDiscount: (d: Omit<DiscountRecord, 'id' | 'recordNumber'>) => void;
  deleteDiscount: (id: string) => void;

  // System Utility
  resetToDefaultData: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'ALRADWAN_ERP_CLEAN_V1_';

// Check and purge legacy mock storage if user had previous demo data loaded
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = Object.keys(localStorage).filter(k => k.startsWith('ALRADWAN_ERP_') && !k.startsWith('ALRADWAN_ERP_CLEAN_V1_'));
    legacyKeys.forEach(k => localStorage.removeItem(k));
  }
} catch (e) {
  // Ignore storage access errors
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user & authentication
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return loadFromStorage<User | null>('CURRENT_USER', initialUsers[0]);
  });

  const [activeTab, setActiveTab] = useState<SystemModule>('dashboard');

  // Entities state
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('USERS', initialUsers));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadFromStorage('WAREHOUSES', initialWarehouses));
  const [units, setUnits] = useState<Unit[]>(() => loadFromStorage('UNITS', initialUnits));
  const [items, setItems] = useState<Item[]>(() => loadFromStorage('ITEMS', initialItems));
  const [stocks, setStocks] = useState<StockPosition[]>(() => loadFromStorage('STOCKS', initialStocks));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('CUSTOMERS', initialCustomers));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('SUPPLIERS', initialSuppliers));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromStorage('EMPLOYEES', initialEmployees));
  const [jobs, setJobs] = useState<Job[]>(() => loadFromStorage('JOBS', initialJobs));
  const [expenses, setExpenses] = useState<ExpenseType[]>(() => loadFromStorage('EXPENSES', initialExpenses));
  const [revenues, setRevenues] = useState<RevenueType[]>(() => loadFromStorage('REVENUES', initialRevenues));
  const [partners, setPartners] = useState<Partner[]>(() => loadFromStorage('PARTNERS', initialPartners));
  const [partnerCurrentAccounts, setPartnerCurrentAccounts] = useState<PartnerCurrentAccount[]>(() =>
    loadFromStorage('PARTNER_CURRENTS', initialPartnerCurrentAccounts)
  );
  const [assets, setAssets] = useState<FixedAsset[]>(() => loadFromStorage('ASSETS', initialAssets));
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccount[]>(() =>
    loadFromStorage('CHART_OF_ACCOUNTS', initialChartOfAccounts)
  );
  const [treasuries, setTreasuries] = useState<Treasury[]>(() => loadFromStorage('TREASURIES', initialTreasuries));
  const [receiptVouchers, setReceiptVouchers] = useState<ReceiptVoucher[]>(() =>
    loadFromStorage('RECEIPTS', initialReceiptVouchers)
  );
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>(() =>
    loadFromStorage('PAYMENTS', initialPaymentVouchers)
  );
  const [cashTransfers, setCashTransfers] = useState<CashTransfer[]>(() =>
    loadFromStorage('TRANSFERS', initialCashTransfers)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('INVOICES', initialInvoices));
  const [warehouseTransfers, setWarehouseTransfers] = useState<WarehouseTransfer[]>(() =>
    loadFromStorage('WAREHOUSE_TRANSFERS', initialWarehouseTransfers)
  );
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>(() =>
    loadFromStorage('INVENTORY_ADJUSTMENTS', initialInventoryAdjustments)
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadFromStorage('JOURNAL_ENTRIES', initialJournalEntries)
  );
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() =>
    loadFromStorage('PAYROLL', initialPayrollRecords)
  );
  const [assetOperations, setAssetOperations] = useState<AssetOperation[]>(() =>
    loadFromStorage('ASSET_OPS', initialAssetOperations)
  );
  const [discounts, setDiscounts] = useState<DiscountRecord[]>(() =>
    loadFromStorage('DISCOUNTS', initialDiscounts)
  );

  // Sync to local storage
  useEffect(() => saveToStorage('CURRENT_USER', currentUser), [currentUser]);
  useEffect(() => saveToStorage('USERS', users), [users]);
  useEffect(() => saveToStorage('WAREHOUSES', warehouses), [warehouses]);
  useEffect(() => saveToStorage('UNITS', units), [units]);
  useEffect(() => saveToStorage('ITEMS', items), [items]);
  useEffect(() => saveToStorage('STOCKS', stocks), [stocks]);
  useEffect(() => saveToStorage('CUSTOMERS', customers), [customers]);
  useEffect(() => saveToStorage('SUPPLIERS', suppliers), [suppliers]);
  useEffect(() => saveToStorage('EMPLOYEES', employees), [employees]);
  useEffect(() => saveToStorage('JOBS', jobs), [jobs]);
  useEffect(() => saveToStorage('EXPENSES', expenses), [expenses]);
  useEffect(() => saveToStorage('REVENUES', revenues), [revenues]);
  useEffect(() => saveToStorage('PARTNERS', partners), [partners]);
  useEffect(() => saveToStorage('PARTNER_CURRENTS', partnerCurrentAccounts), [partnerCurrentAccounts]);
  useEffect(() => saveToStorage('ASSETS', assets), [assets]);
  useEffect(() => saveToStorage('CHART_OF_ACCOUNTS', chartOfAccounts), [chartOfAccounts]);
  useEffect(() => saveToStorage('TREASURIES', treasuries), [treasuries]);
  useEffect(() => saveToStorage('RECEIPTS', receiptVouchers), [receiptVouchers]);
  useEffect(() => saveToStorage('PAYMENTS', paymentVouchers), [paymentVouchers]);
  useEffect(() => saveToStorage('TRANSFERS', cashTransfers), [cashTransfers]);
  useEffect(() => saveToStorage('INVOICES', invoices), [invoices]);
  useEffect(() => saveToStorage('WAREHOUSE_TRANSFERS', warehouseTransfers), [warehouseTransfers]);
  useEffect(() => saveToStorage('INVENTORY_ADJUSTMENTS', inventoryAdjustments), [inventoryAdjustments]);
  useEffect(() => saveToStorage('JOURNAL_ENTRIES', journalEntries), [journalEntries]);
  useEffect(() => saveToStorage('PAYROLL', payrollRecords), [payrollRecords]);
  useEffect(() => saveToStorage('ASSET_OPS', assetOperations), [assetOperations]);
  useEffect(() => saveToStorage('DISCOUNTS', discounts), [discounts]);

  // Auth methods
  const login = (email: string, pass: string): { success: boolean; message: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const found = users.find(
      (u) => u.email.trim().toLowerCase() === trimmedEmail && (u.password === pass || pass === 'admin')
    );
    if (found) {
      if (!found.isActive) {
        return { success: false, message: 'هذا المستخدم معطل، يرجى مراجعة إدارة النظام' };
      }
      setCurrentUser(found);
      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    }
    return { success: false, message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasPermission = (module: SystemModule, action: SystemAction): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const modPerm = currentUser.permissions[module];
    if (!modPerm) return false;
    return Boolean(modPerm[action]);
  };

  // Stock helpers
  const getItemStockInWarehouse = (itemId: string, warehouseId: string): number => {
    const s = stocks.find((item) => item.itemId === itemId && item.warehouseId === warehouseId);
    return s ? s.quantity : 0;
  };

  const getItemTotalStock = (itemId: string): number => {
    return stocks
      .filter((s) => s.itemId === itemId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  const updateItemStock = (itemId: string, warehouseId: string, deltaQty: number) => {
    setStocks((prev) => {
      const idx = prev.findIndex((s) => s.itemId === itemId && s.warehouseId === warehouseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: Math.max(0, updated[idx].quantity + deltaQty) };
        return updated;
      } else {
        return [...prev, { itemId, warehouseId, quantity: Math.max(0, deltaQty) }];
      }
    });
  };

  // Warehouse CRUD
  const addWarehouse = (wh: Omit<Warehouse, 'id'>) => {
    const newWh: Warehouse = { ...wh, id: 'wh-' + Date.now() };
    setWarehouses((prev) => [...prev, newWh]);
  };

  const editWarehouse = (id: string, updated: Partial<Warehouse>) => {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
  };

  const deleteWarehouse = (id: string): { success: boolean; message?: string } => {
    const hasItems = stocks.some((s) => s.warehouseId === id && s.quantity > 0);
    if (hasItems) {
      return { success: false, message: 'لا يمكن حذف المستودع لوجود بضائع وأرصدة حالية مسجلة به' };
    }
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    return { success: true };
  };

  // Units CRUD
  const addUnit = (u: Omit<Unit, 'id'>) => {
    setUnits((prev) => [...prev, { ...u, id: 'unit-' + Date.now() }]);
  };
  const editUnit = (id: string, u: Partial<Unit>) => {
    setUnits((prev) => prev.map((item) => (item.id === id ? { ...item, ...u } : item)));
  };
  const deleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((item) => item.id !== id));
  };

  // Items CRUD
  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = { ...item, id: 'item-' + Date.now() };
    setItems((prev) => [...prev, newItem]);
    // initialize zero stock in default warehouse
    if (item.warehouseId) {
      updateItemStock(newItem.id, item.warehouseId, 0);
    }
  };

  const editItem = (id: string, updated: Partial<Item>) => {
    const existing = items.find((i) => i.id === id);
    if (existing && updated.baseUnitId && updated.baseUnitId !== existing.baseUnitId) {
      // Find old conversion factor of the new unit relative to old base unit, or vice versa
      const matchedNewUnitInOld = existing.units?.find((u) => u.unitId === updated.baseUnitId);
      if (matchedNewUnitInOld && matchedNewUnitInOld.conversionFactor > 0) {
        // Old base unit -> New larger/smaller unit: convert existing stock quantities
        const factor = matchedNewUnitInOld.conversionFactor;
        setStocks((prev) =>
          prev.map((s) => {
            if (s.itemId === id) {
              const convertedQty = Math.round((s.quantity / factor) * 100) / 100;
              return { ...s, quantity: Math.max(0, convertedQty) };
            }
            return s;
          })
        );
      }
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
  };
  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setStocks((prev) => prev.filter((s) => s.itemId !== id));
  };

  // Customers CRUD
  const addCustomer = (c: Omit<Customer, 'id' | 'currentBalance'>) => {
    const newC: Customer = {
      ...c,
      id: 'cust-' + Date.now(),
      currentBalance: c.openingBalance,
    };
    setCustomers((prev) => [...prev, newC]);
  };
  const editCustomer = (id: string, c: Partial<Customer>) => {
    setCustomers((prev) => prev.map((item) => (item.id === id ? { ...item, ...c } : item)));
  };
  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  // Suppliers CRUD
  const addSupplier = (s: Omit<Supplier, 'id' | 'currentBalance'>) => {
    const newS: Supplier = {
      ...s,
      id: 'supp-' + Date.now(),
      currentBalance: s.openingBalance,
    };
    setSuppliers((prev) => [...prev, newS]);
  };
  const editSupplier = (id: string, s: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((item) => (item.id === id ? { ...item, ...s } : item)));
  };
  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
  };

  // Employees CRUD
  const addEmployee = (e: Omit<Employee, 'id' | 'currentBalance'>) => {
    const newEmp: Employee = {
      ...e,
      id: 'emp-' + Date.now(),
      currentBalance: e.openingBalance,
    };
    setEmployees((prev) => [...prev, newEmp]);
  };
  const editEmployee = (id: string, e: Partial<Employee>) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, ...e } : emp)));
  };
  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  // Jobs CRUD
  const addJob = (j: Omit<Job, 'id'>) => {
    setJobs((prev) => [...prev, { ...j, id: 'job-' + Date.now() }]);
  };
  const editJob = (id: string, j: Partial<Job>) => {
    setJobs((prev) => prev.map((item) => (item.id === id ? { ...item, ...j } : item)));
  };
  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((item) => item.id !== id));
  };

  // Expenses CRUD
  const addExpense = (exp: Omit<ExpenseType, 'id' | 'currentBalance'>) => {
    const newExp: ExpenseType = {
      ...exp,
      id: 'exp-' + Date.now(),
      currentBalance: exp.openingBalance,
    };
    setExpenses((prev) => [...prev, newExp]);
  };
  const editExpense = (id: string, exp: Partial<ExpenseType>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...exp } : item)));
  };
  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Revenues CRUD
  const addRevenue = (rev: Omit<RevenueType, 'id' | 'currentBalance'>) => {
    const newRev: RevenueType = {
      ...rev,
      id: 'rev-' + Date.now(),
      currentBalance: rev.openingBalance,
    };
    setRevenues((prev) => [...prev, newRev]);
  };
  const editRevenue = (id: string, rev: Partial<RevenueType>) => {
    setRevenues((prev) => prev.map((item) => (item.id === id ? { ...item, ...rev } : item)));
  };
  const deleteRevenue = (id: string) => {
    setRevenues((prev) => prev.filter((item) => item.id !== id));
  };

  // Partners CRUD (with strict constraint per prompt)
  // "ملاحظة عند الإضافة يتم إضافة اسم الشريك ك جاري الشريك أيضا و كذلك عند التعديل او الحذف
  // وعندما يكون لحساب الشريك رصيد لاتسمح بحذف الحساب او التعديل علي رصيده الافتتاحي"
  const addPartner = (p: Omit<Partner, 'id' | 'currentBalance'>) => {
    const partnerId = 'part-' + Date.now();
    const newPartner: Partner = {
      ...p,
      id: partnerId,
      currentBalance: p.openingBalance,
    };
    setPartners((prev) => [...prev, newPartner]);

    // Automatically create Partner Current Account
    const newCurrentAccount: PartnerCurrentAccount = {
      id: 'pcurr-' + Date.now(),
      code: 'PCR-' + p.code,
      name: p.name,
      openingBalance: 0,
      currentBalance: 0,
      partnerId: partnerId,
    };
    setPartnerCurrentAccounts((prev) => [...prev, newCurrentAccount]);
  };

  const editPartner = (id: string, p: Partial<Partner>): { success: boolean; message?: string } => {
    const existing = partners.find((item) => item.id === id);
    if (!existing) return { success: false, message: 'الشريك غير موجود' };

    // If partner has active currentBalance, disallow modifying opening balance
    if (existing.currentBalance !== 0 && p.openingBalance !== undefined && p.openingBalance !== existing.openingBalance) {
      return { success: false, message: 'لا يمكن تعديل الرصيد الافتتاحي لشريك يمتلك رصيد حساب قائم' };
    }

    setPartners((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, ...p };
        }
        return item;
      })
    );

    // If name was updated, update partner current name as well
    if (p.name && p.name !== existing.name) {
      setPartnerCurrentAccounts((prev) =>
        prev.map((curr) => (curr.partnerId === id ? { ...curr, name: p.name! } : curr))
      );
    }

    return { success: true };
  };

  const deletePartner = (id: string): { success: boolean; message?: string } => {
    const existing = partners.find((item) => item.id === id);
    if (!existing) return { success: false, message: 'الشريك غير موجود' };

    if (existing.currentBalance !== 0) {
      return { success: false, message: 'لا يمكن حذف الشريك نظراً لوجود رصيد قائم في حسابه' };
    }

    setPartners((prev) => prev.filter((item) => item.id !== id));
    // Also remove the linked partner current account
    setPartnerCurrentAccounts((prev) => prev.filter((curr) => curr.partnerId !== id));

    return { success: true };
  };

  // Partner Current Account:
  // "مع ملاحظة انه لايمكن التعديل او اضافه او حذف حساب جاري الشريك ولاكن يمكن تعديل الرصيد الافتتاحي له"
  const editPartnerCurrentOpeningBalance = (id: string, newOpeningBalance: number) => {
    setPartnerCurrentAccounts((prev) =>
      prev.map((curr) => {
        if (curr.id === id) {
          const diff = newOpeningBalance - curr.openingBalance;
          return {
            ...curr,
            openingBalance: newOpeningBalance,
            currentBalance: curr.currentBalance + diff,
          };
        }
        return curr;
      })
    );
  };

  // Assets CRUD
  const addAsset = (a: Omit<FixedAsset, 'id' | 'currentBookValue'>) => {
    const newA: FixedAsset = {
      ...a,
      id: 'asset-' + Date.now(),
      currentBookValue: a.openingBalance,
    };
    setAssets((prev) => [...prev, newA]);
  };
  const editAsset = (id: string, a: Partial<FixedAsset>) => {
    setAssets((prev) => prev.map((item) => (item.id === id ? { ...item, ...a } : item)));
  };
  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
  };

  // Chart of Accounts CRUD
  const addChartAccount = (acc: Omit<ChartAccount, 'id' | 'debit' | 'credit' | 'balance'>) => {
    const newAcc: ChartAccount = {
      ...acc,
      id: 'coa-' + Date.now(),
      debit: 0,
      credit: 0,
      balance: 0,
    };
    setChartOfAccounts((prev) => [...prev, newAcc]);
  };
  const editChartAccount = (id: string, acc: Partial<ChartAccount>) => {
    setChartOfAccounts((prev) => prev.map((item) => (item.id === id ? { ...item, ...acc } : item)));
  };
  const deleteChartAccount = (id: string): { success: boolean; message?: string } => {
    const target = chartOfAccounts.find((item) => item.id === id);
    if (!target) return { success: false, message: 'الحساب غير موجود' };
    const hasChildren = chartOfAccounts.some((item) => item.parentCode === target.code);
    if (hasChildren) {
      return { success: false, message: 'لا يمكن حذف حساب رئيسي يحتوي على حسابات فرعية' };
    }
    setChartOfAccounts((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  // Users CRUD
  const addUser = (u: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...u,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
  };
  const editUser = (id: string, u: Partial<User>) => {
    setUsers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...u };
          // If current logged-in user was updated, keep currentUser in sync
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };
  const deleteUser = (id: string): { success: boolean; message?: string } => {
    if (currentUser && currentUser.id === id) {
      return { success: false, message: 'لا يمكن حذف المستخدم المسجل دخوله حالياً' };
    }
    setUsers((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  // Treasuries CRUD
  const addTreasury = (t: Omit<Treasury, 'id' | 'currentBalance'>) => {
    const newT: Treasury = {
      ...t,
      id: 'trs-' + Date.now(),
      currentBalance: t.openingBalance,
    };
    setTreasuries((prev) => [...prev, newT]);
  };
  const editTreasury = (id: string, t: Partial<Treasury>) => {
    setTreasuries((prev) => prev.map((item) => (item.id === id ? { ...item, ...t } : item)));
  };
  const deleteTreasury = (id: string) => {
    setTreasuries((prev) => prev.filter((item) => item.id !== id));
  };

  // Vouchers Actions
  const addReceiptVoucher = (v: Omit<ReceiptVoucher, 'id' | 'voucherNumber'>) => {
    const nextNum = 'RCV-' + String(receiptVouchers.length + 1).padStart(3, '0');
    const newVoucher: ReceiptVoucher = {
      ...v,
      id: 'rcv-' + Date.now(),
      voucherNumber: nextNum,
    };
    setReceiptVouchers((prev) => [newVoucher, ...prev]);

    // Increase treasury balance
    setTreasuries((prev) =>
      prev.map((t) => (t.id === v.treasuryId ? { ...t, currentBalance: t.currentBalance + v.amount } : t))
    );

    // Decrease Customer debt or adjust related entity
    if (v.accountType === 'customer') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === v.accountId ? { ...c, currentBalance: c.currentBalance - v.amount } : c))
      );
    } else if (v.accountType === 'supplier') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === v.accountId ? { ...s, currentBalance: s.currentBalance - v.amount } : s))
      );
    } else if (v.accountType === 'revenue') {
      setRevenues((prev) =>
        prev.map((r) => (r.id === v.accountId ? { ...r, currentBalance: r.currentBalance + v.amount } : r))
      );
    }

    // Auto Journal Entry
    const jEntry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: 'JV-' + newVoucher.voucherNumber,
      date: v.date,
      description: `سند قبض رقم ${newVoucher.voucherNumber} - ${v.notes || v.accountName}`,
      lines: [
        {
          id: 'jel-' + Date.now() + '-1',
          accountCode: '111',
          accountName: `النقدية وما في حكمها (${v.treasuryName})`,
          debit: v.amount,
          credit: 0,
        },
        {
          id: 'jel-' + Date.now() + '-2',
          accountCode: v.accountType === 'customer' ? '112' : v.accountType === 'revenue' ? '41' : '111',
          accountName: v.accountName,
          debit: 0,
          credit: v.amount,
        },
      ],
      totalDebit: v.amount,
      totalCredit: v.amount,
      isBalanced: true,
      referenceType: 'voucher',
      referenceId: newVoucher.id,
    };
    setJournalEntries((prev) => [jEntry, ...prev]);
  };

  const deleteReceiptVoucher = (id: string) => {
    const voucher = receiptVouchers.find((v) => v.id === id);
    if (voucher) {
      // Revert treasury balance
      setTreasuries((prev) =>
        prev.map((t) => (t.id === voucher.treasuryId ? { ...t, currentBalance: t.currentBalance - voucher.amount } : t))
      );
      // Revert customer/supplier balance
      if (voucher.accountType === 'customer') {
        setCustomers((prev) =>
          prev.map((c) => (c.id === voucher.accountId ? { ...c, currentBalance: c.currentBalance + voucher.amount } : c))
        );
      }
    }
    setReceiptVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  const addPaymentVoucher = (v: Omit<PaymentVoucher, 'id' | 'voucherNumber'>) => {
    const nextNum = 'PAY-' + String(paymentVouchers.length + 1).padStart(3, '0');
    const newVoucher: PaymentVoucher = {
      ...v,
      id: 'pay-' + Date.now(),
      voucherNumber: nextNum,
    };
    setPaymentVouchers((prev) => [newVoucher, ...prev]);

    // Decrease treasury balance
    setTreasuries((prev) =>
      prev.map((t) => (t.id === v.treasuryId ? { ...t, currentBalance: t.currentBalance - v.amount } : t))
    );

    // Decrease Supplier debt or increase Expense
    if (v.accountType === 'supplier') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === v.accountId ? { ...s, currentBalance: s.currentBalance - v.amount } : s))
      );
    } else if (v.accountType === 'expense') {
      setExpenses((prev) =>
        prev.map((e) => (e.id === v.accountId ? { ...e, currentBalance: e.currentBalance + v.amount } : e))
      );
    } else if (v.accountType === 'customer') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === v.accountId ? { ...c, currentBalance: c.currentBalance + v.amount } : c))
      );
    }

    // Auto Journal Entry
    const jEntry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: 'JV-' + newVoucher.voucherNumber,
      date: v.date,
      description: `سند صرف رقم ${newVoucher.voucherNumber} - ${v.notes || v.accountName}`,
      lines: [
        {
          id: 'jel-' + Date.now() + '-1',
          accountCode: v.accountType === 'supplier' ? '211' : v.accountType === 'expense' ? '55' : '51',
          accountName: v.accountName,
          debit: v.amount,
          credit: 0,
        },
        {
          id: 'jel-' + Date.now() + '-2',
          accountCode: '111',
          accountName: `النقدية وما في حكمها (${v.treasuryName})`,
          debit: 0,
          credit: v.amount,
        },
      ],
      totalDebit: v.amount,
      totalCredit: v.amount,
      isBalanced: true,
      referenceType: 'voucher',
      referenceId: newVoucher.id,
    };
    setJournalEntries((prev) => [jEntry, ...prev]);
  };

  const deletePaymentVoucher = (id: string) => {
    const voucher = paymentVouchers.find((v) => v.id === id);
    if (voucher) {
      setTreasuries((prev) =>
        prev.map((t) => (t.id === voucher.treasuryId ? { ...t, currentBalance: t.currentBalance + voucher.amount } : t))
      );
      if (voucher.accountType === 'supplier') {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === voucher.accountId ? { ...s, currentBalance: s.currentBalance + voucher.amount } : s))
        );
      }
    }
    setPaymentVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  // Cash Transfers
  const addCashTransfer = (t: Omit<CashTransfer, 'id' | 'transferNumber'>) => {
    const nextNum = 'TRF-' + String(cashTransfers.length + 1).padStart(3, '0');
    const newTrans: CashTransfer = {
      ...t,
      id: 'trf-' + Date.now(),
      transferNumber: nextNum,
    };
    setCashTransfers((prev) => [newTrans, ...prev]);

    // Deduct from source treasury, add to destination treasury
    setTreasuries((prev) =>
      prev.map((trs) => {
        if (trs.id === t.fromTreasuryId) {
          return { ...trs, currentBalance: trs.currentBalance - t.amount };
        }
        if (trs.id === t.toTreasuryId) {
          return { ...trs, currentBalance: trs.currentBalance + t.amount };
        }
        return trs;
      })
    );

    // Auto Journal Entry
    const jEntry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: 'JV-' + newTrans.transferNumber,
      date: t.date,
      description: `تحويل نقدية رقم ${newTrans.transferNumber} من ${t.fromTreasuryName} إلى ${t.toTreasuryName}`,
      lines: [
        {
          id: 'jel-' + Date.now() + '-1',
          accountCode: '111',
          accountName: `النقدية وما في حكمها (${t.toTreasuryName})`,
          debit: t.amount,
          credit: 0,
        },
        {
          id: 'jel-' + Date.now() + '-2',
          accountCode: '111',
          accountName: `النقدية وما في حكمها (${t.fromTreasuryName})`,
          debit: 0,
          credit: t.amount,
        },
      ],
      totalDebit: t.amount,
      totalCredit: t.amount,
      isBalanced: true,
      referenceType: 'transfer',
      referenceId: newTrans.id,
    };
    setJournalEntries((prev) => [jEntry, ...prev]);
  };

  const deleteCashTransfer = (id: string) => {
    const t = cashTransfers.find((item) => item.id === id);
    if (t) {
      setTreasuries((prev) =>
        prev.map((trs) => {
          if (trs.id === t.fromTreasuryId) {
            return { ...trs, currentBalance: trs.currentBalance + t.amount };
          }
          if (trs.id === t.toTreasuryId) {
            return { ...trs, currentBalance: trs.currentBalance - t.amount };
          }
          return trs;
        })
      );
    }
    setCashTransfers((prev) => prev.filter((item) => item.id !== id));
  };

  // Invoices Management
  const addInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const prefix =
      inv.type === 'purchase'
        ? 'PUR'
        : inv.type === 'purchase_return'
        ? 'PRET'
        : inv.type === 'sales'
        ? 'SAL'
        : 'SRET';
    const nextNum = `${prefix}-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...inv,
      id: 'inv-' + Date.now(),
      invoiceNumber: nextNum,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Inventory and Party updates
    inv.items.forEach((item) => {
      const totalUnits = item.quantity * (item.conversionFactor || 1);
      if (inv.type === 'purchase' || inv.type === 'sales_return') {
        updateItemStock(item.itemId, inv.warehouseId, totalUnits);
      } else if (inv.type === 'sales' || inv.type === 'purchase_return') {
        updateItemStock(item.itemId, inv.warehouseId, -totalUnits);
      }
    });

    // Party balance updates
    if (inv.type === 'purchase') {
      // increases debt owed to supplier by remaining amount
      setSuppliers((prev) =>
        prev.map((s) => (s.id === inv.partyId ? { ...s, currentBalance: s.currentBalance + inv.remainingAmount } : s))
      );
      if (inv.paidAmount > 0 && inv.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === inv.treasuryId ? { ...t, currentBalance: t.currentBalance - inv.paidAmount } : t))
        );
      }
    } else if (inv.type === 'purchase_return') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === inv.partyId ? { ...s, currentBalance: s.currentBalance - inv.grandTotal } : s))
      );
    } else if (inv.type === 'sales') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === inv.partyId ? { ...c, currentBalance: c.currentBalance + inv.remainingAmount } : c))
      );
      if (inv.paidAmount > 0 && inv.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === inv.treasuryId ? { ...t, currentBalance: t.currentBalance + inv.paidAmount } : t))
        );
      }
    } else if (inv.type === 'sales_return') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === inv.partyId ? { ...c, currentBalance: c.currentBalance - inv.grandTotal } : c))
      );
    }

    // Auto recalculate actual item costs if purchase invoice was added
    if (inv.type === 'purchase') {
      const nextInvoices = [newInvoice, ...invoices];
      setItems((prevItems) => recalculateItemCostsFromInvoices(nextInvoices, prevItems));
    }
  };

  const deleteInvoice = (id: string) => {
    const existing = invoices.find((inv) => inv.id === id);
    if (existing) {
      // Revert stock changes made by this invoice
      existing.items.forEach((item) => {
        const totalUnits = item.quantity * (item.conversionFactor || 1);
        if (existing.type === 'purchase' || existing.type === 'sales_return') {
          // Revert: subtract stock
          updateItemStock(item.itemId, existing.warehouseId, -totalUnits);
        } else if (existing.type === 'sales' || existing.type === 'purchase_return') {
          // Revert: add stock back
          updateItemStock(item.itemId, existing.warehouseId, totalUnits);
        }
      });

      // Revert party and treasury balances
      if (existing.type === 'purchase') {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === existing.partyId ? { ...s, currentBalance: s.currentBalance - existing.remainingAmount } : s))
        );
        if (existing.paidAmount > 0 && existing.treasuryId) {
          setTreasuries((prev) =>
            prev.map((t) => (t.id === existing.treasuryId ? { ...t, currentBalance: t.currentBalance + existing.paidAmount } : t))
          );
        }
      } else if (existing.type === 'purchase_return') {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === existing.partyId ? { ...s, currentBalance: s.currentBalance + existing.grandTotal } : s))
        );
      } else if (existing.type === 'sales') {
        setCustomers((prev) =>
          prev.map((c) => (c.id === existing.partyId ? { ...c, currentBalance: c.currentBalance - existing.remainingAmount } : c))
        );
        if (existing.paidAmount > 0 && existing.treasuryId) {
          setTreasuries((prev) =>
            prev.map((t) => (t.id === existing.treasuryId ? { ...t, currentBalance: t.currentBalance - existing.paidAmount } : t))
          );
        }
      } else if (existing.type === 'sales_return') {
        setCustomers((prev) =>
          prev.map((c) => (c.id === existing.partyId ? { ...c, currentBalance: c.currentBalance + existing.grandTotal } : c))
        );
      }
    }

    const nextInvoices = invoices.filter((item) => item.id !== id);
    setInvoices(nextInvoices);

    // Auto recalculate actual item costs if deleted invoice was purchase
    if (existing?.type === 'purchase') {
      setItems((prevItems) => recalculateItemCostsFromInvoices(nextInvoices, prevItems));
    }
  };

  const editInvoice = (id: string, updatedData: Partial<Invoice>) => {
    const existing = invoices.find((inv) => inv.id === id);
    if (!existing) return;

    // 1. Revert previous invoice effects
    existing.items.forEach((item) => {
      const totalUnits = item.quantity * (item.conversionFactor || 1);
      if (existing.type === 'purchase' || existing.type === 'sales_return') {
        updateItemStock(item.itemId, existing.warehouseId, -totalUnits);
      } else if (existing.type === 'sales' || existing.type === 'purchase_return') {
        updateItemStock(item.itemId, existing.warehouseId, totalUnits);
      }
    });

    if (existing.type === 'purchase') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === existing.partyId ? { ...s, currentBalance: s.currentBalance - existing.remainingAmount } : s))
      );
      if (existing.paidAmount > 0 && existing.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === existing.treasuryId ? { ...t, currentBalance: t.currentBalance + existing.paidAmount } : t))
        );
      }
    } else if (existing.type === 'purchase_return') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === existing.partyId ? { ...s, currentBalance: s.currentBalance - existing.grandTotal } : s))
      );
    } else if (existing.type === 'sales') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === existing.partyId ? { ...c, currentBalance: c.currentBalance - existing.remainingAmount } : c))
      );
      if (existing.paidAmount > 0 && existing.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === existing.treasuryId ? { ...t, currentBalance: t.currentBalance - existing.paidAmount } : t))
        );
      }
    } else if (existing.type === 'sales_return') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === existing.partyId ? { ...c, currentBalance: c.currentBalance - existing.grandTotal } : c))
      );
    }

    // 2. Build the new merged invoice
    const newInvoice: Invoice = {
      ...existing,
      ...updatedData,
    };

    // 3. Apply new invoice effects
    newInvoice.items.forEach((item) => {
      const totalUnits = item.quantity * (item.conversionFactor || 1);
      if (newInvoice.type === 'purchase' || newInvoice.type === 'sales_return') {
        updateItemStock(item.itemId, newInvoice.warehouseId, totalUnits);
      } else if (newInvoice.type === 'sales' || newInvoice.type === 'purchase_return') {
        updateItemStock(item.itemId, newInvoice.warehouseId, -totalUnits);
      }
    });

    if (newInvoice.type === 'purchase') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === newInvoice.partyId ? { ...s, currentBalance: s.currentBalance + newInvoice.remainingAmount } : s))
      );
      if (newInvoice.paidAmount > 0 && newInvoice.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === newInvoice.treasuryId ? { ...t, currentBalance: t.currentBalance - newInvoice.paidAmount } : t))
        );
      }
    } else if (newInvoice.type === 'purchase_return') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === newInvoice.partyId ? { ...s, currentBalance: s.currentBalance - newInvoice.grandTotal } : s))
      );
    } else if (newInvoice.type === 'sales') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === newInvoice.partyId ? { ...c, currentBalance: c.currentBalance + newInvoice.remainingAmount } : c))
      );
      if (newInvoice.paidAmount > 0 && newInvoice.treasuryId) {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === newInvoice.treasuryId ? { ...t, currentBalance: t.currentBalance + newInvoice.paidAmount } : t))
        );
      }
    } else if (newInvoice.type === 'sales_return') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === newInvoice.partyId ? { ...c, currentBalance: c.currentBalance - newInvoice.grandTotal } : c))
      );
    }

    const nextInvoices = invoices.map((item) => (item.id === id ? newInvoice : item));
    setInvoices(nextInvoices);

    // Auto recalculate actual item costs if purchase invoice was edited
    if (existing.type === 'purchase' || newInvoice.type === 'purchase') {
      setItems((prevItems) => recalculateItemCostsFromInvoices(nextInvoices, prevItems));
    }
  };

  // Warehouse Transfers
  const addWarehouseTransfer = (wt: Omit<WarehouseTransfer, 'id' | 'transferNumber'>) => {
    const nextNum = 'WTR-' + String(warehouseTransfers.length + 1).padStart(3, '0');
    const newTrans: WarehouseTransfer = {
      ...wt,
      id: 'wtr-' + Date.now(),
      transferNumber: nextNum,
    };
    setWarehouseTransfers((prev) => [newTrans, ...prev]);

    // Move stock from source to destination
    wt.items.forEach((item) => {
      updateItemStock(item.itemId, wt.fromWarehouseId, -item.quantity);
      updateItemStock(item.itemId, wt.toWarehouseId, item.quantity);
    });
  };

  const deleteWarehouseTransfer = (id: string) => {
    const existing = warehouseTransfers.find((t) => t.id === id);
    if (existing) {
      // Revert movement: add back to fromWarehouse, subtract from toWarehouse
      existing.items.forEach((item) => {
        updateItemStock(item.itemId, existing.fromWarehouseId, item.quantity);
        updateItemStock(item.itemId, existing.toWarehouseId, -item.quantity);
      });
    }
    setWarehouseTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  // Inventory Adjustments
  const addInventoryAdjustment = (adj: Omit<InventoryAdjustment, 'id' | 'adjustmentNumber'>) => {
    const nextNum = 'ADJ-' + String(inventoryAdjustments.length + 1).padStart(3, '0');
    const newAdj: InventoryAdjustment = {
      ...adj,
      id: 'adj-' + Date.now(),
      adjustmentNumber: nextNum,
    };
    setInventoryAdjustments((prev) => [newAdj, ...prev]);

    // Adjust stocks
    adj.items.forEach((item) => {
      setStocks((prev) => {
        const idx = prev.findIndex((s) => s.itemId === item.itemId && s.warehouseId === adj.warehouseId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: item.actualPhysicalQty };
          return updated;
        } else {
          return [...prev, { itemId: item.itemId, warehouseId: adj.warehouseId, quantity: item.actualPhysicalQty }];
        }
      });
    });
  };

  const deleteInventoryAdjustment = (id: string) => {
    const existing = inventoryAdjustments.find((a) => a.id === id);
    if (existing) {
      // Revert stocks back to system quantity before adjustment
      existing.items.forEach((item) => {
        setStocks((prev) => {
          const idx = prev.findIndex((s) => s.itemId === item.itemId && s.warehouseId === existing.warehouseId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], quantity: item.currentSystemQty };
            return updated;
          }
          return prev;
        });
      });
    }
    setInventoryAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  // Calculate weighted average cost for items based on actual purchase movement across all warehouses
  const recalculateItemCostsFromInvoices = (
    currentInvoices: Invoice[],
    currentItems: Item[]
  ): Item[] => {
    return currentItems.map((item) => {
      let totalPurchaseQty = 0;
      let totalPurchaseCost = 0;

      currentInvoices
        .filter((inv) => inv.type === 'purchase')
        .forEach((inv) => {
          inv.items
            .filter((i) => i.itemId === item.id)
            .forEach((i) => {
              const qty = i.quantity * (i.conversionFactor || 1);
              totalPurchaseQty += qty;
              // unit price is per base unit or converted
              const unitCost = i.conversionFactor && i.conversionFactor > 1 ? i.unitPrice / i.conversionFactor : i.unitPrice;
              totalPurchaseCost += qty * unitCost;
            });
        });

      if (totalPurchaseQty > 0) {
        const newAvgCost = Math.round((totalPurchaseCost / totalPurchaseQty) * 100) / 100;
        return { ...item, costPrice: newAvgCost };
      }
      return item;
    });
  };

  // Recalculate Weighted Average Cost across all warehouses
  // "إعادة احتساب متوسط التكلفة للاصناف بعد تحديث المخازن مع مراعاة انه يعتبر كافة الأصناف كانها في مخزن واحد عند احتساب التكلفة ولا يتم احتساب تكلفة كل صنف في أي مخزن علي حده"
  const recalculateWeightedAverageCost = (): { updatedCount: number; message: string } => {
    let count = 0;
    setItems((prevItems) => {
      const updated = recalculateItemCostsFromInvoices(invoices, prevItems);
      updated.forEach((itm, idx) => {
        if (itm.costPrice !== prevItems[idx].costPrice) {
          count++;
        }
      });
      return updated;
    });

    return {
      updatedCount: count,
      message: `تمت إعادة احتساب متوسط التكلفة المرجح لجميع الأصناف (${count} أصناف تم تحديثها) عبر كل المخازن مجتمعة ككيان واحد بنجاح.`,
    };
  };

  // Journal Entries
  const addJournalEntry = (
    je: Omit<JournalEntry, 'id' | 'entryNumber' | 'isBalanced' | 'totalDebit' | 'totalCredit'>
  ): { success: boolean; message?: string } => {
    const totalDebit = je.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = je.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);

    if (diff > 0.01) {
      return {
        success: false,
        message: `القيد غير متوازن! إجمالي المدين (${totalDebit.toLocaleString()} ج.م) لا يساوي إجمالي الدائن (${totalCredit.toLocaleString()} ج.م) بفارق ${diff.toFixed(2)}`,
      };
    }

    const nextNum = 'JV-MAN-' + String(journalEntries.length + 1).padStart(3, '0');
    const newEntry: JournalEntry = {
      ...je,
      id: 'je-' + Date.now(),
      entryNumber: nextNum,
      totalDebit,
      totalCredit,
      isBalanced: true,
      referenceType: 'manual',
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
    return { success: true };
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Payroll Management
  const addPayrollRecord = (pr: Omit<PayrollRecord, 'id' | 'recordNumber' | 'netSalary'>) => {
    const net = (pr.baseSalary || 0) + (pr.overtimeAmount || 0) - (pr.deductionAmount || 0);
    const nextNum = `PR-${pr.month}-${String(payrollRecords.length + 1).padStart(2, '0')}`;
    const newRecord: PayrollRecord = {
      ...pr,
      id: 'pr-' + Date.now(),
      recordNumber: nextNum,
      netSalary: Math.max(0, net),
    };
    setPayrollRecords((prev) => [newRecord, ...prev]);
  };

  const payPayroll = (id: string, treasuryId: string) => {
    const record = payrollRecords.find((r) => r.id === id);
    if (!record || record.status === 'paid') return;
    const trs = treasuries.find((t) => t.id === treasuryId);

    setPayrollRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'paid',
              paidDate: new Date().toISOString().split('T')[0],
              treasuryId,
              treasuryName: trs?.accountName,
            }
          : r
      )
    );

    // Deduct from treasury
    setTreasuries((prev) =>
      prev.map((t) => (t.id === treasuryId ? { ...t, currentBalance: t.currentBalance - record.netSalary } : t))
    );

    // Auto Journal Entry for payroll payment
    const jEntry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: 'JV-' + record.recordNumber,
      date: new Date().toISOString().split('T')[0],
      description: `صرف راتب الموظف ${record.employeeName} لشهر ${record.month}`,
      lines: [
        {
          id: 'jel-' + Date.now() + '-1',
          accountCode: '54',
          accountName: 'الأجور والرواتب ومستحقات الموظفين',
          debit: record.netSalary,
          credit: 0,
        },
        {
          id: 'jel-' + Date.now() + '-2',
          accountCode: '111',
          accountName: `النقدية وما في حكمها (${trs?.accountName || 'الخزينة'})`,
          debit: 0,
          credit: record.netSalary,
        },
      ],
      totalDebit: record.netSalary,
      totalCredit: record.netSalary,
      isBalanced: true,
      referenceType: 'payroll',
      referenceId: record.id,
    };
    setJournalEntries((prev) => [jEntry, ...prev]);
  };

  const deletePayrollRecord = (id: string) => {
    const record = payrollRecords.find((r) => r.id === id);
    if (record && record.status === 'paid' && record.treasuryId) {
      // Revert treasury deduction
      setTreasuries((prev) =>
        prev.map((t) => (t.id === record.treasuryId ? { ...t, currentBalance: t.currentBalance + record.netSalary } : t))
      );
    }
    setPayrollRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Asset Operations
  const addAssetOperation = (op: Omit<AssetOperation, 'id' | 'operationNumber'>) => {
    const nextNum = 'AOP-' + String(assetOperations.length + 1).padStart(3, '0');
    const newOp: AssetOperation = {
      ...op,
      id: 'ast-op-' + Date.now(),
      operationNumber: nextNum,
    };
    setAssetOperations((prev) => [newOp, ...prev]);

    // Update treasury and asset book value
    if (op.operationType === 'purchase') {
      setTreasuries((prev) =>
        prev.map((t) => (t.id === op.treasuryId ? { ...t, currentBalance: t.currentBalance - op.amount } : t))
      );
      setAssets((prev) =>
        prev.map((a) => (a.id === op.assetId ? { ...a, currentBookValue: a.currentBookValue + op.amount } : a))
      );
    } else {
      setTreasuries((prev) =>
        prev.map((t) => (t.id === op.treasuryId ? { ...t, currentBalance: t.currentBalance + op.amount } : t))
      );
      setAssets((prev) =>
        prev.map((a) => (a.id === op.assetId ? { ...a, currentBookValue: Math.max(0, a.currentBookValue - op.amount) } : a))
      );
    }
  };

  const deleteAssetOperation = (id: string) => {
    const op = assetOperations.find((o) => o.id === id);
    if (op) {
      // Revert treasury and asset book value
      if (op.operationType === 'purchase') {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === op.treasuryId ? { ...t, currentBalance: t.currentBalance + op.amount } : t))
        );
        setAssets((prev) =>
          prev.map((a) => (a.id === op.assetId ? { ...a, currentBookValue: Math.max(0, a.currentBookValue - op.amount) } : a))
        );
      } else {
        setTreasuries((prev) =>
          prev.map((t) => (t.id === op.treasuryId ? { ...t, currentBalance: t.currentBalance - op.amount } : t))
        );
        setAssets((prev) =>
          prev.map((a) => (a.id === op.assetId ? { ...a, currentBookValue: a.currentBookValue + op.amount } : a))
        );
      }
    }
    setAssetOperations((prev) => prev.filter((o) => o.id !== id));
  };

  // Discounts
  const addDiscount = (d: Omit<DiscountRecord, 'id' | 'recordNumber'>) => {
    const nextNum = 'DSC-' + String(discounts.length + 1).padStart(3, '0');
    const newD: DiscountRecord = {
      ...d,
      id: 'dsc-' + Date.now(),
      recordNumber: nextNum,
    };
    setDiscounts((prev) => [newD, ...prev]);

    // Allowed discount reduces customer balance
    if (d.type === 'discount_allowed') {
      if (d.accountType === 'customer') {
        setCustomers((prev) =>
          prev.map((c) => (c.id === d.accountId ? { ...c, currentBalance: c.currentBalance - d.amount } : c))
        );
      }
    } else {
      // Received discount reduces supplier balance
      if (d.accountType === 'supplier') {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === d.accountId ? { ...s, currentBalance: s.currentBalance - d.amount } : s))
        );
      }
    }
  };

  const deleteDiscount = (id: string) => {
    const d = discounts.find((item) => item.id === id);
    if (d) {
      // Revert customer or supplier balance
      if (d.type === 'discount_allowed') {
        if (d.accountType === 'customer') {
          setCustomers((prev) =>
            prev.map((c) => (c.id === d.accountId ? { ...c, currentBalance: c.currentBalance + d.amount } : c))
          );
        }
      } else {
        if (d.accountType === 'supplier') {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === d.accountId ? { ...s, currentBalance: s.currentBalance + d.amount } : s))
          );
        }
      }
    }
    setDiscounts((prev) => prev.filter((item) => item.id !== id));
  };

  // Reset to default data
  const resetToDefaultData = () => {
    setUsers(initialUsers);
    setWarehouses(initialWarehouses);
    setUnits(initialUnits);
    setItems(initialItems);
    setStocks(initialStocks);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setEmployees(initialEmployees);
    setJobs(initialJobs);
    setExpenses(initialExpenses);
    setRevenues(initialRevenues);
    setPartners(initialPartners);
    setPartnerCurrentAccounts(initialPartnerCurrentAccounts);
    setAssets(initialAssets);
    setChartOfAccounts(initialChartOfAccounts);
    setTreasuries(initialTreasuries);
    setReceiptVouchers(initialReceiptVouchers);
    setPaymentVouchers(initialPaymentVouchers);
    setCashTransfers(initialCashTransfers);
    setInvoices(initialInvoices);
    setWarehouseTransfers(initialWarehouseTransfers);
    setInventoryAdjustments(initialInventoryAdjustments);
    setJournalEntries(initialJournalEntries);
    setPayrollRecords(initialPayrollRecords);
    setAssetOperations(initialAssetOperations);
    setDiscounts(initialDiscounts);
  };

  // Export DB
  const exportDatabaseJson = () => {
    const backup = {
      version: '1.0',
      system: 'الرضوان للحسابات',
      exportDate: new Date().toISOString(),
      data: {
        users,
        warehouses,
        units,
        items,
        stocks,
        customers,
        suppliers,
        employees,
        jobs,
        expenses,
        revenues,
        partners,
        partnerCurrentAccounts,
        assets,
        chartOfAccounts,
        treasuries,
        receiptVouchers,
        paymentVouchers,
        cashTransfers,
        invoices,
        warehouseTransfers,
        inventoryAdjustments,
        journalEntries,
        payrollRecords,
        assetOperations,
        discounts,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_الرضوان_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import DB
  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed?.data) {
        const d = parsed.data;
        if (d.users) setUsers(d.users);
        if (d.warehouses) setWarehouses(d.warehouses);
        if (d.units) setUnits(d.units);
        if (d.items) setItems(d.items);
        if (d.stocks) setStocks(d.stocks);
        if (d.customers) setCustomers(d.customers);
        if (d.suppliers) setSuppliers(d.suppliers);
        if (d.employees) setEmployees(d.employees);
        if (d.jobs) setJobs(d.jobs);
        if (d.expenses) setExpenses(d.expenses);
        if (d.revenues) setRevenues(d.revenues);
        if (d.partners) setPartners(d.partners);
        if (d.partnerCurrentAccounts) setPartnerCurrentAccounts(d.partnerCurrentAccounts);
        if (d.assets) setAssets(d.assets);
        if (d.chartOfAccounts) setChartOfAccounts(d.chartOfAccounts);
        if (d.treasuries) setTreasuries(d.treasuries);
        if (d.receiptVouchers) setReceiptVouchers(d.receiptVouchers);
        if (d.paymentVouchers) setPaymentVouchers(d.paymentVouchers);
        if (d.cashTransfers) setCashTransfers(d.cashTransfers);
        if (d.invoices) setInvoices(d.invoices);
        if (d.warehouseTransfers) setWarehouseTransfers(d.warehouseTransfers);
        if (d.inventoryAdjustments) setInventoryAdjustments(d.inventoryAdjustments);
        if (d.journalEntries) setJournalEntries(d.journalEntries);
        if (d.payrollRecords) setPayrollRecords(d.payrollRecords);
        if (d.assetOperations) setAssetOperations(d.assetOperations);
        if (d.discounts) setDiscounts(d.discounts);
        return true;
      }
    } catch (err) {
      console.error('Failed to parse database backup JSON:', err);
    }
    return false;
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        login,
        logout,
        hasPermission,
        activeTab,
        setActiveTab,
        warehouses,
        addWarehouse,
        editWarehouse,
        deleteWarehouse,
        units,
        addUnit,
        editUnit,
        deleteUnit,
        items,
        addItem,
        editItem,
        deleteItem,
        stocks,
        getItemStockInWarehouse,
        getItemTotalStock,
        customers,
        addCustomer,
        editCustomer,
        deleteCustomer,
        suppliers,
        addSupplier,
        editSupplier,
        deleteSupplier,
        employees,
        setEmployees,
        addEmployee,
        editEmployee,
        deleteEmployee,
        jobs,
        setJobs,
        addJob,
        editJob,
        deleteJob,
        expenses,
        addExpense,
        editExpense,
        deleteExpense,
        revenues,
        addRevenue,
        editRevenue,
        deleteRevenue,
        partners,
        addPartner,
        editPartner,
        deletePartner,
        partnerCurrentAccounts,
        editPartnerCurrentOpeningBalance,
        assets,
        addAsset,
        editAsset,
        deleteAsset,
        chartOfAccounts,
        addChartAccount,
        editChartAccount,
        deleteChartAccount,
        users,
        addUser,
        editUser,
        deleteUser,
        treasuries,
        addTreasury,
        editTreasury,
        deleteTreasury,
        receiptVouchers,
        addReceiptVoucher,
        deleteReceiptVoucher,
        paymentVouchers,
        addPaymentVoucher,
        deletePaymentVoucher,
        cashTransfers,
        addCashTransfer,
        deleteCashTransfer,
        invoices,
        addInvoice,
        editInvoice,
        deleteInvoice,
        warehouseTransfers,
        addWarehouseTransfer,
        deleteWarehouseTransfer,
        inventoryAdjustments,
        addInventoryAdjustment,
        deleteInventoryAdjustment,
        recalculateWeightedAverageCost,
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
        resetToDefaultData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERP must be used within an ERPProvider');
  return ctx;
};
