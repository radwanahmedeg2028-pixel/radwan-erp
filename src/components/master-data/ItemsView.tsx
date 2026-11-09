/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Item, ItemUnit } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, Plus, X, Layers, AlertCircle, Percent } from 'lucide-react';

export const ItemsView: React.FC = () => {
  const {
    items,
    warehouses,
    units,
    addItem,
    editItem,
    deleteItem,
    getItemTotalStock,
    hasPermission,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [baseUnitId, setBaseUnitId] = useState('');
  const [itemUnits, setItemUnits] = useState<ItemUnit[]>([]);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [calculateVat, setCalculateVat] = useState(true);
  const [vatRate, setVatRate] = useState<number>(14);
  const [minStockLevel, setMinStockLevel] = useState<number>(5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Additional unit conversion adder in form
  const [tempUnitId, setTempUnitId] = useState('');
  const [tempFactor, setTempFactor] = useState<number>(1);

  const canCreate = hasPermission('items', 'create');
  const canEdit = hasPermission('items', 'edit');
  const canDelete = hasPermission('items', 'delete');

  const openAddModal = () => {
    setEditingItem(null);
    setCode('ITM-' + String(items.length + 101).padStart(3, '0'));
    setName('');
    const defaultWh = warehouses[0]?.id || '';
    setWarehouseId(defaultWh);
    const defaultUnit = units[0]?.id || '';
    setBaseUnitId(defaultUnit);
    const defaultUnitName = units[0]?.name || 'قطعة';
    setItemUnits([
      {
        unitId: defaultUnit,
        unitName: defaultUnitName,
        conversionFactor: 1,
        isDefault: true,
      },
    ]);
    setCostPrice(0);
    setSellingPrice(0);
    setCalculateVat(true);
    setVatRate(14);
    setMinStockLevel(5);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setWarehouseId(item.warehouseId);
    setBaseUnitId(item.baseUnitId);
    setItemUnits(item.units || []);
    setCostPrice(item.costPrice);
    setSellingPrice(item.sellingPrice);
    setCalculateVat(item.calculateVat);
    setVatRate(item.vatRate);
    setMinStockLevel(item.minStockLevel || 5);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleAddUnitConversion = () => {
    if (!tempUnitId) return;
    const uObj = units.find((u) => u.id === tempUnitId);
    if (!uObj) return;

    if (itemUnits.some((iu) => iu.unitId === tempUnitId)) {
      setErrorMsg('هذه الوحدة مضافة بالفعل');
      return;
    }

    setItemUnits([
      ...itemUnits,
      {
        unitId: tempUnitId,
        unitName: uObj.name,
        conversionFactor: Number(tempFactor) || 1,
        isDefault: false,
      },
    ]);
    setTempUnitId('');
    setTempFactor(1);
    setErrorMsg(null);
  };

  const handleRemoveUnitConversion = (unitId: string) => {
    if (unitId === baseUnitId) {
      setErrorMsg('لا يمكن حذف الوحدة الأساسية للصنف');
      return;
    }
    setItemUnits(itemUnits.filter((u) => u.unitId !== unitId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى كتابة اسم الصنف');
      return;
    }
    if (!warehouseId) {
      setErrorMsg('يرجى تحديد المستودع الافتراضي');
      return;
    }

    if (editingItem) {
      editItem(editingItem.id, {
        code,
        name,
        warehouseId,
        baseUnitId,
        units: itemUnits,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        calculateVat,
        vatRate: Number(vatRate),
        minStockLevel: Number(minStockLevel),
      });
    } else {
      addItem({
        code,
        name,
        warehouseId,
        baseUnitId,
        units: itemUnits,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        calculateVat,
        vatRate: Number(vatRate),
        minStockLevel: Number(minStockLevel),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف من النظام؟')) {
      deleteItem(id);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWh = selectedWarehouseFilter === 'all' || item.warehouseId === selectedWarehouseFilter;
    return matchSearch && matchWh;
  });

  const handleExcel = () => {
    exportToExcel(
      'الأصناف_والمخزون',
      ['كود الصنف', 'اسم الصنف', 'المستودع', 'الوحدة الأساسية', 'سعر التكلفة', 'سعر البيع', 'ضريبة القيمة المضافة', 'الرصيد الكلي'],
      filtered.map((i) => {
        const whName = warehouses.find((w) => w.id === i.warehouseId)?.name || '';
        const bUnit = units.find((u) => u.id === i.baseUnitId)?.name || 'قطعة';
        const totalStock = getItemTotalStock(i.id);
        return [
          i.code,
          i.name,
          whName,
          bUnit,
          i.costPrice,
          i.sellingPrice,
          i.calculateVat ? `%${i.vatRate}` : 'معفى',
          totalStock,
        ];
      })
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد الأصناف والسلع"
        subtitle="إدارة بطاقات الأصناف، وتعدد الوحدات مع معاملات التحويل، وتكلفة الصنف الفعلية"
        actionLabel="إضافة صنف جديد"
        onAction={openAddModal}
        canCreate={canCreate}
        onExportExcel={handleExcel}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الصنف أو كود الصنف..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">تصفية بالمستودع:</span>
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">كافة المستودعات</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">كود الصنف</th>
                <th className="py-3 px-4">اسم الصنف</th>
                <th className="py-3 px-4">المستودع الرئيسي</th>
                <th className="py-3 px-4">الوحدات ومعامل التحويل</th>
                <th className="py-3 px-4 text-left">سعر التكلفة (الفعلية)</th>
                <th className="py-3 px-4 text-left">سعر البيع</th>
                <th className="py-3 px-4 text-center">ضريبة القيمة المضافة</th>
                <th className="py-3 px-4 text-center">الرصيد الكلي</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    لا توجد أصناف مطابقة لبيانات البحث
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const wh = warehouses.find((w) => w.id === item.warehouseId);
                  const totalStock = getItemTotalStock(item.id);
                  const isLowStock = item.minStockLevel && totalStock <= item.minStockLevel;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{wh?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.units && item.units.length > 0 ? (
                            item.units.map((u, i) => (
                              <span
                                key={i}
                                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                              >
                                {u.unitName} {u.conversionFactor > 1 && `(×${u.conversionFactor})`}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-semibold text-amber-700">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.calculateVat ? (
                          <span className="text-emerald-700 font-semibold">نعم ({item.vatRate}%)</span>
                        ) : (
                          <span className="text-slate-400">معفى</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono font-bold ${
                              isLowStock ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {formatNumber(totalStock)} <span className="text-[10px] text-slate-500 font-normal">{units.find((u) => u.id === item.baseUnitId)?.name || 'وحدة'}</span>
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-rose-500 font-normal">حد الطلب</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الصنف</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الصنف الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شاشة سامسونج 55 بوصة سمارت"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع الافتراضي</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="">اختر المستودع...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الوحدة الأساسية (الصغرى)</label>
              <select
                value={baseUnitId}
                onChange={(e) => {
                  setBaseUnitId(e.target.value);
                  const uObj = units.find((u) => u.id === e.target.value);
                  if (uObj) {
                    // Update default unit
                    setItemUnits((prev) => [
                      { unitId: uObj.id, unitName: uObj.name, conversionFactor: 1, isDefault: true },
                      ...prev.filter((iu) => iu.unitId !== uObj.id && !iu.isDefault),
                    ]);
                  }
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Conversions Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              تعدد الوحدات ومعاملات التحويل (مثل كرتونة = 12 قطعة)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={tempUnitId}
                onChange={(e) => setTempUnitId(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
              >
                <option value="">اختر وحدة إضافية...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">معامل التحويل:</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={tempFactor}
                  onChange={(e) => setTempFactor(Number(e.target.value))}
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white font-mono text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUnitConversion}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                + إضافة معامل وحدة
              </button>
            </div>

            {/* List of currently assigned units */}
            <div className="flex flex-wrap gap-2 pt-2">
              {itemUnits.map((u) => (
                <div
                  key={u.unitId}
                  className="bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2"
                >
                  <span className="font-semibold text-slate-800">{u.unitName}</span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    ({u.conversionFactor} من الأساسية)
                  </span>
                  {!u.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnitConversion(u.unitId)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & VAT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                سعر التكلفة الفعلية (ج.م)
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                يحدث آلياً من متوسط التكلفة الفعلي لحركات الشراء
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">سعر البيع الافتراضي (ج.م)</label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حد إعادة الطلب (الأمان)</label>
              <input
                type="number"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* VAT Option */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vatCheck"
                checked={calculateVat}
                onChange={(e) => setCalculateVat(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="vatCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                احتساب ضريبة القيمة المضافة (VAT) على هذا الصنف
              </label>
            </div>

            {calculateVat && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600">نسبة الضريبة (%):</span>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-16 border border-emerald-300 rounded-lg px-2 py-1 text-xs font-mono text-center bg-white"
                />
              </div>
            )}
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
              حفظ بيانات الصنف
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
