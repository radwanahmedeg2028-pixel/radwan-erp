/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { User, SystemModule, UserPermission } from '../../types';
import { ALL_SYSTEM_MODULES, createFullPermissions } from '../../data/initialData';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, ShieldCheck, Lock, Mail, User as UserIcon, Check, CheckSquare, Square } from 'lucide-react';

export const MODULE_NAMES_AR: Record<SystemModule, string> = {
  dashboard: 'لوحة البيانات والمؤشرات',
  warehouses: 'المستودعات',
  items: 'الأصناف والسلع',
  units: 'وحدات القياس',
  customers: 'العملاء',
  suppliers: 'الموردين',
  employees: 'الموظفين',
  jobs: 'الوظائف والمسميات',
  expenses: 'المصروفات',
  revenues: 'الإيرادات',
  partners: 'الشركاء ورؤوس الأموال',
  partner_current: 'جاري الشركاء',
  assets: 'الأصول الثابتة',
  chart_of_accounts: 'شجرة الحسابات (IFRS)',
  users: 'المستخدمين والصلاحيات',
  treasuries: 'الصناديق والبنوك',
  receipt_vouchers: 'سندات القبض',
  payment_vouchers: 'سندات الصرف والدفع',
  cash_transfers: 'تحويلات النقدية والخزن',
  purchase_invoices: 'فاتورة المشتريات',
  purchase_return_invoices: 'مردود المشتريات',
  sales_invoices: 'فاتورة المبيعات',
  sales_return_invoices: 'مردود المبيعات',
  warehouse_transfers: 'التحويل بين المستودعات',
  inventory_adjustments: 'التسوية الجردية للأصناف',
  cost_recalculation: 'إعادة احتساب متوسط التكلفة',
  journal_entries: 'تسجيل قيود اليومية',
  payroll: 'رواتب الموظفين والإضافي',
  asset_operations: 'عمليات الأصول (شراء / بيع)',
  discount_allowed: 'الخصم المسموح به',
  discount_received: 'الخصم المكتسب',
  daily_analyzer: 'محلل العمل اليومي',
  report_inventory: 'تقرير المخازن والأرصدة',
  report_item_movement: 'كارت حركة الصنف',
  report_customers: 'تقرير ومديونية العملاء',
  report_suppliers: 'تقرير ومديونية الموردين',
  report_employees: 'تقرير رواتب الموظفين',
  report_expenses: 'تقرير المصروفات',
  report_revenues: 'تقرير الإيرادات',
  report_partners: 'تقرير الشركاء وجاري الشريك',
  trial_balance: 'ميزان المراجعة',
  income_statement: 'قائمة الدخل',
  trading_account: 'حساب المتاجرة',
  profit_loss: 'حساب الأرباح والخسائر',
  balance_sheet: 'الميزانية العمومية والمركز المالي',
};

export const UsersAndPermissionsView: React.FC = () => {
  const { users, addUser, editUser, deleteUser, currentUser, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'accountant' | 'warehouse_manager' | 'cashier' | 'custom'>('accountant');
  const [permissions, setPermissions] = useState<Record<SystemModule, UserPermission>>(createFullPermissions());
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('users', 'create');
  const canEdit = hasPermission('users', 'edit');
  const canDelete = hasPermission('users', 'delete');

  const openAddModal = () => {
    setEditingUser(null);
    setCode('USR-' + String(users.length + 1).padStart(3, '0'));
    setName('');
    setEmail('');
    setPassword('123456');
    setRole('accountant');
    setPermissions(createFullPermissions());
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setCode(u.code);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || '');
    setRole(u.role);
    setPermissions(u.permissions || createFullPermissions());
    setIsActive(u.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const togglePermission = (mod: SystemModule, action: keyof UserPermission) => {
    setPermissions((prev) => {
      const current = prev[mod] || { view: true, create: true, edit: true, delete: true, print: true };
      return {
        ...prev,
        [mod]: {
          ...current,
          [action]: !current[action],
        },
      };
    });
  };

  const setAllPermissions = (val: boolean) => {
    const updated: Record<SystemModule, UserPermission> = {} as any;
    ALL_SYSTEM_MODULES.forEach((m) => {
      updated[m] = { view: val, create: val, edit: val, delete: val, print: val };
    });
    setPermissions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingUser) {
      editUser(editingUser.id, {
        code,
        name,
        email,
        password,
        role,
        permissions,
        isActive,
      });
    } else {
      addUser({
        code,
        name,
        email,
        password,
        role,
        permissions,
        isActive,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      const res = deleteUser(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'المستخدمين_وصلاحيات_النظام',
      ['كود المستخدم', 'اسم المستخدم', 'البريد الإلكتروني', 'الدور الوظيفي', 'حالة الحساب', 'تاريخ الإنشاء'],
      filtered.map((u) => [
        u.code,
        u.name,
        u.email,
        u.role === 'admin' ? 'مدير نظام كامل' : 'محاسب',
        u.isActive ? 'نشط' : 'معطل',
        u.createdAt,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="المستخدمين وصلاحيات كافة النظام"
        subtitle="إدارة حسابات الدخول، البريد الإلكتروني، كلمات السر، وتعيين صلاحيات العرض والإضافة والتعديل والحذف والطباعة لكل شاشة"
        actionLabel="إضافة مستخدم جديد"
        onAction={openAddModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم المستخدم أو البريد الإلكتروني أو الكود..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">كود المستخدم</th>
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">البريد الإلكتروني (لتسجيل الدخول)</th>
                <th className="py-3 px-4 text-center">الدور والصلاحيات</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">تاريخ الإنشاء</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{u.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    {u.name}
                    {currentUser?.id === u.id && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        أنت
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{u.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-slate-800">
                      {u.role === 'admin' ? 'مدير نظام كامل الصلاحيات' : 'محاسب / مستخدم'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{u.createdAt}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="تعديل المستخدم والصلاحيات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && currentUser?.id !== u.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف المستخدم"
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

      {/* User & Permissions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'تعديل المستخدم وصلاحيات النظام' : 'إضافة مستخدم جديد وتحديد الصلاحيات'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود المستخدم</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد عبد الله"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الدور الوظيفي</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="admin">مدير نظام كامل</option>
                <option value="accountant">محاسب عام</option>
                <option value="warehouse_manager">مدير مخازن</option>
                <option value="cashier">أمين خزينة</option>
                <option value="custom">مخصص</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البريد الإلكتروني (لتسجيل الدخول)
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@radwan.erp"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none text-left"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                كلمة السر
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
              حساب نشط ومفعل لتسجيل الدخول
            </label>
          </div>

          {/* Granular Permissions Matrix */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  مصفوفة صلاحيات النظام التفصيلية (عرض - إضافة - تعديل - حذف - طباعة)
                </h4>
                <p className="text-[11px] text-slate-500">
                  حدد الصلاحيات الدقيقة لهذا المستخدم على كل شاشة وتبويب
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllPermissions(true)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  منح الكل
                </button>
                <button
                  type="button"
                  onClick={() => setAllPermissions(false)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  إلغاء الكل
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 text-xs bg-white rounded-xl border border-slate-200">
              <div className="bg-slate-100/80 px-4 py-2 flex items-center justify-between font-bold text-slate-700 text-[11px] sticky top-0 z-10">
                <span className="w-1/3">الشاشة / التبويب</span>
                <span className="w-2/3 grid grid-cols-5 text-center">
                  <span>عرض</span>
                  <span>إضافة</span>
                  <span>تعديل</span>
                  <span>حذف</span>
                  <span>طباعة</span>
                </span>
              </div>

              {ALL_SYSTEM_MODULES.map((mod) => {
                const p = permissions[mod] || { view: false, create: false, edit: false, delete: false, print: false };
                return (
                  <div key={mod} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="w-1/3 font-medium text-slate-800 text-[11px]">
                      {MODULE_NAMES_AR[mod] || mod}
                    </span>
                    <div className="w-2/3 grid grid-cols-5 text-center">
                      {(['view', 'create', 'edit', 'delete', 'print'] as const).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => togglePermission(mod, action)}
                          className="flex items-center justify-center py-1 cursor-pointer"
                        >
                          {p[action] ? (
                            <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded border border-slate-300 bg-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ المستخدم والصلاحيات
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
