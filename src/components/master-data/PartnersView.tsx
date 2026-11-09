/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Partner, PartnerCurrentAccount } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, AlertTriangle, ShieldCheck, Lock, Users, Wallet } from 'lucide-react';

export const PartnersView: React.FC = () => {
  const {
    partners,
    partnerCurrentAccounts,
    addPartner,
    editPartner,
    deletePartner,
    editPartnerCurrentOpeningBalance,
    hasPermission,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'current'>('partners');
  const [searchTerm, setSearchTerm] = useState('');

  // Partner modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [sharePercentage, setSharePercentage] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Partner Current edit modal
  const [isCurrentModalOpen, setIsCurrentModalOpen] = useState(false);
  const [editingCurrent, setEditingCurrent] = useState<PartnerCurrentAccount | null>(null);
  const [currentOpeningBalance, setCurrentOpeningBalance] = useState<number>(0);

  const canCreate = hasPermission('partners', 'create');
  const canEdit = hasPermission('partners', 'edit');
  const canDelete = hasPermission('partners', 'delete');

  const openAddPartnerModal = () => {
    setEditingPartner(null);
    setPartnerCode('PRT-' + String(partners.length + 1).padStart(2, '0'));
    setPartnerName('');
    setOpeningBalance(0);
    setSharePercentage(50);
    setNotes('');
    setErrorMsg(null);
    setIsPartnerModalOpen(true);
  };

  const openEditPartnerModal = (p: Partner) => {
    setEditingPartner(p);
    setPartnerCode(p.code);
    setPartnerName(p.name);
    setOpeningBalance(p.openingBalance);
    setSharePercentage(p.sharePercentage || 50);
    setNotes(p.notes || '');
    setErrorMsg(null);
    setIsPartnerModalOpen(true);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      setErrorMsg('يرجى إدخال اسم الشريك');
      return;
    }

    if (editingPartner) {
      const res = editPartner(editingPartner.id, {
        code: partnerCode,
        name: partnerName,
        openingBalance: Number(openingBalance),
        sharePercentage: Number(sharePercentage),
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'حدث خطأ أثناء التعديل');
        return;
      }
    } else {
      addPartner({
        code: partnerCode,
        name: partnerName,
        openingBalance: Number(openingBalance),
        sharePercentage: Number(sharePercentage),
        notes,
      });
    }
    setIsPartnerModalOpen(false);
  };

  const handleDeletePartner = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الشريك؟ سيتم حذف حساب جاري الشريك المرتبط أيضاً.')) {
      const res = deletePartner(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const openEditCurrentModal = (curr: PartnerCurrentAccount) => {
    setEditingCurrent(curr);
    setCurrentOpeningBalance(curr.openingBalance);
    setIsCurrentModalOpen(true);
  };

  const handleCurrentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCurrent) {
      editPartnerCurrentOpeningBalance(editingCurrent.id, Number(currentOpeningBalance));
    }
    setIsCurrentModalOpen(false);
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCurrents = partnerCurrentAccounts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    if (activeSubTab === 'partners') {
      exportToExcel(
        'الشركاء_ورأس_المال',
        ['كود الشريك', 'اسم الشريك', 'نسبة الحصة (%)', 'رأس المال الافتتاحي', 'الرصيد القائم', 'ملاحظات'],
        filteredPartners.map((p) => [
          p.code,
          p.name,
          p.sharePercentage || '',
          p.openingBalance,
          p.currentBalance,
          p.notes || '',
        ])
      );
    } else {
      exportToExcel(
        'حسابات_جاري_الشركاء',
        ['كود جاري الشريك', 'اسم الشريك', 'الرصيد الافتتاحي', 'الرصيد الحالي'],
        filteredCurrents.map((c) => [c.code, c.name, c.openingBalance, c.currentBalance])
      );
    }
  };

  return (
    <div>
      <PageHeader
        title={activeSubTab === 'partners' ? 'تكويد الشركاء (رأس المال)' : 'حسابات جاري الشركاء'}
        subtitle={
          activeSubTab === 'partners'
            ? 'إدارة حسابات الشركاء ورؤوس الأموال (مرتبط آلياً بحسابات جاري الشركاء مع حظر حذف الشريك ذو الرصيد القائم)'
            : 'متابعة مسحوبات وتغذيات جاري الشركاء (لا يمكن إضافة أو حذف حساب جاري شريك مستقل، بل تعديل رصيده الافتتاحي فقط)'
        }
        actionLabel={activeSubTab === 'partners' ? 'إضافة شريك جديد' : undefined}
        onAction={activeSubTab === 'partners' ? openAddPartnerModal : undefined}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('partners')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'partners' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الشركاء ({partners.length})
          </button>
          <button
            onClick={() => setActiveSubTab('current')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'current' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            جاري الشركاء ({partnerCurrentAccounts.length})
          </button>
        </div>
      </PageHeader>

      {/* Info notice about rule */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">قاعدة النظام المالية للشركاء:</span>
          <span>
            عند إضافة أي شريك يتم إنشاء حساب "جاري الشريك" له تلقائياً وبنفس الاسم. وعند وجود رصيد قائم في حساب الشريك لا يسمح النظام بحذفه أو تعديل رصيده الافتتاحي حفاظاً على دقة الميزانية العمومية. كما لا يمكن إضافة أو حذف حساب جاري شريك يدوياً بل يتم تعديل رصيده الافتتاحي فقط.
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الشريك أو الكود..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {activeSubTab === 'partners' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">كود الشريك</th>
                  <th className="py-3 px-4">اسم الشريك</th>
                  <th className="py-3 px-4 text-center">النسبة المئوية (%)</th>
                  <th className="py-3 px-4 text-left">رأس المال الافتتاحي</th>
                  <th className="py-3 px-4 text-left">الرصيد القائم</th>
                  <th className="py-3 px-4">ملاحظات</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا يوجد شركاء مطابقون للبحث
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((p) => {
                    const hasActiveBalance = p.currentBalance !== 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          {p.sharePercentage ? `%${p.sharePercentage}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-medium text-slate-700">
                          {formatCurrency(p.openingBalance)}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                          {formatCurrency(p.currentBalance)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">{p.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => openEditPartnerModal(p)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeletePartner(p.id)}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  hasActiveBalance
                                    ? 'text-slate-300 hover:text-slate-400 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={
                                  hasActiveBalance
                                    ? 'لا يمكن حذف الشريك لوجود رصيد قائم في حسابه'
                                    : 'حذف الشريك'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Partner Current Accounts View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              حسابات جاري الشركاء منشأة تلقائياً من بطاقة الشريك. يمكنك تعديل الرصيد الافتتاحي لكل حساب:
            </span>
            <span className="text-emerald-700 font-mono font-bold">
              إجمالي الجاري: {formatCurrency(partnerCurrentAccounts.reduce((s, c) => s + c.currentBalance, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">كود جاري الشريك</th>
                  <th className="py-3 px-4">اسم جاري الشريك (مطابق للشريك)</th>
                  <th className="py-3 px-4 text-left">الرصيد الافتتاحي (قابل للتعديل)</th>
                  <th className="py-3 px-4 text-left">الرصيد الحالي</th>
                  <th className="py-3 px-4 text-center">الإجراء المسموح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCurrents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      لا توجد حسابات جاري شركاء
                    </td>
                  </tr>
                ) : (
                  filteredCurrents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-semibold text-slate-700">
                        {formatCurrency(c.openingBalance)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                        {formatCurrency(c.currentBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openEditCurrentModal(c)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          تعديل الرصيد الافتتاحي
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partner Add/Edit Modal */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title={editingPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}
        maxWidth="md"
      >
        <form onSubmit={handlePartnerSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود الشريك</label>
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الشريك</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="الاسم الكامل للشريك"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              سيتم إنشاء وتحديث حساب "جاري الشريك" بنفس الاسم آلياً
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رأس المال الافتتاحي (ج.م)
              </label>
              <input
                type="number"
                value={openingBalance}
                disabled={Boolean(editingPartner && editingPartner.currentBalance !== 0)}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
              {editingPartner && editingPartner.currentBalance !== 0 && (
                <span className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> مقفل لوجود رصيد قائم
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نسبة الحصة (%)</label>
              <input
                type="number"
                value={sharePercentage}
                onChange={(e) => setSharePercentage(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPartnerModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ بيانات الشريك
            </button>
          </div>
        </form>
      </Modal>

      {/* Partner Current Edit Opening Balance Modal */}
      <Modal
        isOpen={isCurrentModalOpen}
        onClose={() => setIsCurrentModalOpen(false)}
        title={`تعديل الرصيد الافتتاحي لجاري الشريك (${editingCurrent?.name})`}
        maxWidth="md"
      >
        <form onSubmit={handleCurrentSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            وفقاً لضوابط النظام، اسم حساب جاري الشريك مرتبط بالشريك الرئيسي ولا يمكن تعديله أو حذفه هنا، ولكن يمكنك تحديد أو تعديل الرصيد الافتتاحي لجاري هذا الشريك:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الرصيد الافتتاحي لجاري الشريك (ج.م)
            </label>
            <input
              type="number"
              step="0.01"
              value={currentOpeningBalance}
              onChange={(e) => setCurrentOpeningBalance(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCurrentModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ الرصيد الافتتاحي
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
