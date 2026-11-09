/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Unit } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Scale } from 'lucide-react';

export const UnitsView: React.FC = () => {
  const { units, addUnit, editUnit, deleteUnit, hasPermission } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('units', 'create');
  const canEdit = hasPermission('units', 'edit');
  const canDelete = hasPermission('units', 'delete');

  const openAddModal = () => {
    setEditingUnit(null);
    setCode('UN-' + String(units.length + 1).padStart(2, '0'));
    setName('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: Unit) => {
    setEditingUnit(u);
    setCode(u.code);
    setName(u.name);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الوحدة');
      return;
    }
    if (editingUnit) {
      editUnit(editingUnit.id, { code, name });
    } else {
      addUnit({ code, name });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
      deleteUnit(id);
    }
  };

  const filtered = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcel = () => {
    exportToExcel(
      'وحدات_القياس',
      ['كود الوحدة', 'اسم الوحدة'],
      filtered.map((u) => [u.code, u.name])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد وحدات القياس"
        subtitle="تعريف وحدات القياس المستخدمة للأصناف والسلع (قطعة، كرتونة، دستة، كيلو، متر...)"
        actionLabel="إضافة وحدة جديدة"
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
          placeholder="ابحث باسم الوحدة أو الكود..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] text-slate-400 block">{u.code}</span>
                <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {canEdit && (
                <button
                  onClick={() => openEditModal(u)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="تعديل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس جديدة'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود الوحدة</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الوحدة</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: قطعة، دستة، كرتونة، كجم"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
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
              حفظ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
