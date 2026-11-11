-- ============================================================================
-- نظام «الرضوان للحسابات والمخازن» - Al-Radwan ERP System
-- تصميم هيكل قاعدة البيانات العلائقية (Relational Database Schema) لـ PostgreSQL
-- متوافق تماماً مع معايير المحاسبة الدولية (IFRS) واللائحة الضريبية والتجارية
-- ============================================================================

-- تفعيل امتداد توليد المعرفات الفريدة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. أنواع البيانات المخصصة (Custom ENUM Types)
-- ============================================================================

CREATE TYPE user_role_enum AS ENUM (
    'admin', 
    'accountant', 
    'warehouse_manager', 
    'cashier', 
    'custom'
);

CREATE TYPE treasury_type_enum AS ENUM (
    'cash',       -- خزينة نقدية
    'bank',       -- حساب بنكي
    'e_wallet'    -- محفظة إلكترونية
);

CREATE TYPE account_category_enum AS ENUM (
    'asset',       -- أصول
    'liability',   -- خصوم والتزامات
    'equity',      -- حقوق ملكية
    'revenue',     -- إيرادات
    'expense'      -- مصروفات
);

CREATE TYPE invoice_type_enum AS ENUM (
    'purchase',           -- فاتورة مشتريات
    'purchase_return',    -- مردود مشتريات
    'sales',              -- فاتورة مبيعات
    'sales_return'        -- مردود مبيعات
);

CREATE TYPE payment_method_enum AS ENUM (
    'cash',      -- نقدي فورى
    'credit',    -- آجل بالكامل
    'partial'    -- سداد جزئي
);

CREATE TYPE account_party_type_enum AS ENUM (
    'customer', 
    'supplier', 
    'employee', 
    'partner', 
    'revenue', 
    'expense', 
    'asset', 
    'other'
);

CREATE TYPE asset_operation_type_enum AS ENUM (
    'purchase',  -- شراء وإضافة أصل رأسمالي
    'sale'       -- بيع واستبعاد أصل رأسمالي
);

CREATE TYPE discount_type_enum AS ENUM (
    'discount_allowed',   -- خصم مسموح به (مدين للعميل)
    'discount_received'   -- خصم مكتسب (دائن من المورد)
);

CREATE TYPE payroll_status_enum AS ENUM (
    'draft',     -- مستحق لم يُصرف بعد
    'paid'       -- تم الصرف والتسوية النقدية
);

-- ============================================================================
-- 2. جداول النظام الأساسية والصلاحيات (Users & Permissions)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'custom',
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb, -- صلاحيات تفصيلية (view, create, edit, delete, print)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_code ON users(code);

-- ============================================================================
-- 3. جداول البيانات الأساسية (Master Data Tables)
-- ============================================================================

-- 3.1 المستودعات (Warehouses)
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    manager VARCHAR(150),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warehouses_code ON warehouses(code);

-- 3.2 وحدات القياس (Units of Measure)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_units_code ON units(code);

-- 3.3 الأصناف والسلع (Items & Products)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    default_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    base_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    cost_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (cost_price >= 0), -- متوسط التكلفة الفعلي المرجح
    selling_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (selling_price >= 0),
    calculate_vat BOOLEAN NOT NULL DEFAULT TRUE,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 14.00 CHECK (vat_rate >= 0),
    min_stock_level NUMERIC(12, 2) NOT NULL DEFAULT 5.00 CHECK (min_stock_level >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_code ON items(code);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_base_unit ON items(base_unit_id);

-- 3.4 تعدد وحدات الصنف ومعاملات التحويل (Item Multi-Units & Conversion Factors)
CREATE TABLE item_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor NUMERIC(12, 4) NOT NULL DEFAULT 1.0000 CHECK (conversion_factor > 0), -- مثال: الكرتونة = 12 قطعة
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_item_unit UNIQUE(item_id, unit_id)
);

CREATE INDEX idx_item_units_item_id ON item_units(item_id);

-- 3.5 أرصدة المخزون اللحظية لكل مستودع (Inventory Stock Positions)
CREATE TABLE inventory_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- بالوحدة الأساسية الصغرى
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_warehouse_item_stock UNIQUE(warehouse_id, item_id)
);

CREATE INDEX idx_inventory_stocks_wh_item ON inventory_stocks(warehouse_id, item_id);

-- 3.6 العملاء (Customers)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit_limit >= 0),
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- موجب: مدين عليه فلوس، سالب: دائن
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    sales_representative VARCHAR(150),
    billing_address TEXT,
    contact_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);

-- 3.7 الموردون (Suppliers)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- موجب: له فلوس مديونية علينا
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    billing_address TEXT,
    contact_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- 3.8 الوظائف (Jobs / Designations)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.9 الموظفون (Employees)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    address TEXT,
    contact_details TEXT,
    monthly_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_salary >= 0),
    daily_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (daily_salary >= 0),
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_code ON employees(code);

-- 3.10 بنود المصروفات (Expense Accounts / Types)
CREATE TABLE expense_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.11 بنود الإيرادات الأخرى (Revenue Accounts / Types)
CREATE TABLE revenue_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.12 الشركاء ورؤوس الأموال (Partners)
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- حصة رأس المال الافتتاحية
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    share_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (share_percentage >= 0 AND share_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.13 جاري الشركاء (Partner Current Accounts)
CREATE TABLE partner_current_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- متاح تعديل الرصيد الافتتاحي فقط
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.14 الأصول الثابتة (Fixed Assets)
CREATE TABLE fixed_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
    purchase_date DATE,
    current_book_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (current_book_value >= 0),
    accumulated_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (accumulated_depreciation >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.15 الصناديق والخزن والبنوك (Treasuries & Banks)
CREATE TABLE treasuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    type treasury_type_enum NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    bank_name VARCHAR(120),
    account_number VARCHAR(80),
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasuries_code ON treasuries(code);

-- 3.16 شجرة الحسابات الدولية (IFRS Chart of Accounts)
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category account_category_enum NOT NULL,
    parent_code VARCHAR(50) REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
    level SMALLINT NOT NULL CHECK (level >= 1),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_leaf BOOLEAN NOT NULL DEFAULT TRUE, -- الحسابات الطرفية فقط التي يقبل الترحيل عليها
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chart_code ON chart_of_accounts(code);
CREATE INDEX idx_chart_parent ON chart_of_accounts(parent_code);

-- ============================================================================
-- 4. جداول الفواتير وبنودها (Invoices & Invoice Lines)
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    type invoice_type_enum NOT NULL,
    invoice_date DATE NOT NULL,
    party_type account_party_type_enum NOT NULL, -- عميل أو مورد
    party_id UUID NOT NULL,                       -- معرف العميل أو المورد
    party_name VARCHAR(200) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    warehouse_name VARCHAR(150) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    calculate_vat BOOLEAN NOT NULL DEFAULT TRUE,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 14.00,
    vat_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method_enum NOT NULL DEFAULT 'cash',
    treasury_id UUID REFERENCES treasuries(id) ON DELETE RESTRICT,
    treasury_name VARCHAR(150),
    cost_of_sales_total NUMERIC(15, 2) DEFAULT 0.00, -- تكلفة البضاعة المباعة للفاتورة
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_type_date ON invoices(type, invoice_date);
CREATE INDEX idx_invoices_party ON invoices(party_id);
CREATE INDEX idx_invoices_wh ON invoices(warehouse_id);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    unit_name VARCHAR(80) NOT NULL,
    conversion_factor NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 4) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    cost_price_at_time NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- لحساب تكلفة المبيعات التاريخية
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_item ON invoice_items(item_id);

-- ============================================================================
-- 5. جداول سندات القبض والصرف والتحويلات النقدية (Vouchers & Cash Transfers)
-- ============================================================================

-- 5.1 سندات القبض (Receipt Vouchers)
CREATE TABLE receipt_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    account_type account_party_type_enum NOT NULL,
    account_id UUID NOT NULL, -- ID of customer, supplier, partner, etc.
    account_name VARCHAR(200) NOT NULL,
    payment_method treasury_type_enum NOT NULL,
    treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
    treasury_name VARCHAR(150) NOT NULL,
    reference_doc VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_vouchers_date ON receipt_vouchers(voucher_date);
CREATE INDEX idx_receipt_vouchers_treasury ON receipt_vouchers(treasury_id);

-- 5.2 سندات الصرف / الدفع (Payment Vouchers)
CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    account_type account_party_type_enum NOT NULL,
    account_id UUID NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    payment_method treasury_type_enum NOT NULL,
    treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
    treasury_name VARCHAR(150) NOT NULL,
    reference_doc VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_vouchers_date ON payment_vouchers(voucher_date);
CREATE INDEX idx_payment_vouchers_treasury ON payment_vouchers(treasury_id);

-- 5.3 تحويلات النقدية بين الخزن والبنوك (Cash Transfers)
CREATE TABLE cash_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    transfer_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    from_treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
    from_treasury_name VARCHAR(150) NOT NULL,
    from_type treasury_type_enum NOT NULL,
    to_treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
    to_treasury_name VARCHAR(150) NOT NULL,
    to_type treasury_type_enum NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_treasuries CHECK (from_treasury_id <> to_treasury_id)
);

CREATE INDEX idx_cash_transfers_date ON cash_transfers(transfer_date);

-- ============================================================================
-- 6. إدارة المستودعات والتحويلات والجرد (Warehouse Operations)
-- ============================================================================

-- 6.1 تحويلات المخازن (Warehouse Transfers)
CREATE TABLE warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    transfer_date DATE NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    from_warehouse_name VARCHAR(150) NOT NULL,
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_name VARCHAR(150) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_warehouses CHECK (from_warehouse_id <> to_warehouse_id)
);

CREATE INDEX idx_wh_transfers_date ON warehouse_transfers(transfer_date);

CREATE TABLE warehouse_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    unit_name VARCHAR(80) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wh_transfer_items ON warehouse_transfer_items(transfer_id);

-- 6.2 التسويات الجردية (Inventory Adjustments)
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_number VARCHAR(50) NOT NULL UNIQUE,
    adjustment_date DATE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    warehouse_name VARCHAR(150) NOT NULL,
    total_cost_impact NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- أثر العجز أو الزيادة على التكلفة
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    unit_name VARCHAR(80) NOT NULL,
    current_system_qty NUMERIC(15, 4) NOT NULL,
    actual_physical_qty NUMERIC(15, 4) NOT NULL,
    diff_qty NUMERIC(15, 4) NOT NULL, -- actual - system
    cost_price NUMERIC(15, 4) NOT NULL,
    total_cost_impact NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_adj_items ON inventory_adjustment_items(adjustment_id);

-- ============================================================================
-- 7. العمليات المحاسبية والرواتب والأصول (Accounting, Payroll & Assets)
-- ============================================================================

-- 7.1 قيود اليومية العامة (Journal Entries)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL CHECK (total_debit >= 0),
    total_credit NUMERIC(15, 2) NOT NULL CHECK (total_credit >= 0),
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    reference_type VARCHAR(50), -- manual, invoice, voucher, payroll, transfer, asset
    reference_id UUID,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balanced_entry CHECK (total_debit = total_credit)
);

CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
    account_name VARCHAR(200) NOT NULL,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_line_nonzero CHECK (debit > 0 OR credit > 0)
);

CREATE INDEX idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_acc ON journal_entry_lines(account_code);

-- 7.2 مسيرات الرواتب والأجور (Payroll Records)
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number VARCHAR(50) NOT NULL UNIQUE,
    payroll_date DATE NOT NULL,
    payroll_month VARCHAR(7) NOT NULL, -- e.g. '2026-11'
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    employee_name VARCHAR(200) NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL CHECK (base_salary >= 0),
    overtime_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (overtime_amount >= 0),
    deduction_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (deduction_amount >= 0),
    net_salary NUMERIC(15, 2) NOT NULL CHECK (net_salary >= 0),
    status payroll_status_enum NOT NULL DEFAULT 'draft',
    paid_date DATE,
    treasury_id UUID REFERENCES treasuries(id) ON DELETE RESTRICT,
    treasury_name VARCHAR(150),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_emp_month ON payroll_records(employee_id, payroll_month);

-- 7.3 حركات الأصول الثابتة (Fixed Asset Operations)
CREATE TABLE asset_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_number VARCHAR(50) NOT NULL UNIQUE,
    operation_date DATE NOT NULL,
    asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE RESTRICT,
    asset_name VARCHAR(200) NOT NULL,
    operation_type asset_operation_type_enum NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
    treasury_name VARCHAR(150) NOT NULL,
    gain_or_loss NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_ops_asset ON asset_operations(asset_id);

-- 7.4 الخصم المسموح به والمكتسب (Discounts Allowed & Received)
CREATE TABLE discount_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number VARCHAR(50) NOT NULL UNIQUE,
    record_date DATE NOT NULL,
    type discount_type_enum NOT NULL,
    account_type account_party_type_enum NOT NULL, -- عميل أو مورد
    account_id UUID NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discounts_date ON discount_records(record_date);
CREATE INDEX idx_discounts_account ON discount_records(account_id);
