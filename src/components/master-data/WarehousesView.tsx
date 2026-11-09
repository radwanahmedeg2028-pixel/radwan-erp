/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Warehouse } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, MapPin, User, Warehouse as WarehouseIcon } from 'lucide-react';

export const WarehousesView: React.FC = () => {
  const { warehouses, addWarehouse, editWarehouse, deleteWarehouse, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('warehouses', 'create');
  const canEdit = hasPermission('warehouses', 'edit');
  const canDelete = hasPermission('warehouses', 'delete');

  const openAddModal = () => {
    setEditingWh(null);
    setCode('WH-' + String(warehouses.length + 1).padStart(2, '0'));
    setName('');
    setManager('');
    setAddress('');
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWh(wh);
    setCode(wh.code);
    setName(wh.name);
    setManager(wh.manager);
    setAddress(wh.address);
    setNotes(wh.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المستودع');
      return;
    }
    if (editingWh) {
      editWarehouse(editingWh.id, { code, name, manager, address, notes });
    } else {
      addWarehouse({ code, name, manager, address, notes });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستودع؟')) {
      const res = deleteWarehouse(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'المستودعات',
      ['كود المستودع', 'اسم المستودع', 'المسئول عن المستودع', 'عنوان المستودع', 'ملاحظات'],
      filtered.map((w) => [w.code, w.name, w.manager, w.address, w.notes || ''])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد المستودعات"
        subtitle="إدارة مستودعات ومخازن المنشأة ومسئولي التخزين"
        actionLabel="إضافة مستودع جديد"
        onAction={openAddModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      />

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث بكود المستودع أو الاسم أو المسئول..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((wh) => (
          <div
            key={wh.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                  {wh.code}
                </span>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(wh)}
                      title="تعديل"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(wh.id)}
                      title="حذف"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-slate-400 shrink-0" />
                {wh.name}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>المسئول: </span>
                  <span className="font-medium text-slate-800">{wh.manager || 'غير محدد'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>العنوان: </span>
                  <span className="font-medium text-slate-800">{wh.address || 'غير محدد'}</span>
                </div>
              </div>
            </div>

            {wh.notes && (
              <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                {wh.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWh ? 'تعديل بيانات المستودع' : 'إضافة مستودع جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود المستودع</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستودع</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: المستودع المركزي"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">المسئول عن المستودع</label>
            <input
              type="text"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="اسم أمين المخزن أو المدير"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان المستودع</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المنطقة، الشارع، رقم القطعة"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات إضافية</label>
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ المستودع
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
