/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { WarehouseTransfer, InventoryAdjustment, InventoryAdjustmentItem } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, formatNumber, exportToExcel } from '../../utils/exportUtils';
import {
  ArrowRightLeft,
  ClipboardCheck,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const WarehouseMgmtView: React.FC = () => {
  const {
    activeTab,
    warehouseTransfers,
    addWarehouseTransfer,
    deleteWarehouseTransfer,
    inventoryAdjustments,
    addInventoryAdjustment,
    deleteInventoryAdjustment,
    recalculateWeightedAverageCost,
    warehouses,
    items,
    stocks,
    getItemStockInWarehouse,
    hasPermission,
  } = useERP();

  const canDeleteTransfers = hasPermission('warehouse_transfers', 'delete');
  const canDeleteAdjustments = hasPermission('inventory_adjustments', 'delete');

  const [subTab, setSubTab] = useState<'transfers' | 'adjustments' | 'recalculation'>(
    activeTab === 'inventory_adjustments'
      ? 'adjustments'
      : activeTab === 'cost_recalculation'
      ? 'recalculation'
      : 'transfers'
  );

  const [searchTerm, setSearchTerm] = useState('');

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [transNotes, setTransNotes] = useState('');
  const [transferLines, setTransferLines] = useState<{ itemId: string; quantity: number }[]>([]);
  const [lineItemId, setLineItemId] = useState('');
  const [lineItemQty, setLineItemQty] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjWhId, setAdjWhId] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjLines, setAdjLines] = useState<Record<string, number>>({}); // itemId -> actualQty

  // Recalculation feedback
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  const canCreateTransfers = hasPermission('warehouse_transfers', 'create');
  const canCreateAdjustments = hasPermission('inventory_adjustments', 'create');
  const canRecalculate = hasPermission('cost_recalculation', 'create');

  // Open Transfer Modal
  const openNewTransferModal = () => {
    setTransDate(new Date().toISOString().split('T')[0]);
    setFromWhId(warehouses[0]?.id || '');
    setToWhId(warehouses[1]?.id || warehouses[0]?.id || '');
    setTransNotes('');
    setTransferLines([]);
    setLineItemId(items[0]?.id || '');
    setLineItemQty(1);
    setErrorMsg(null);
    setIsTransferModalOpen(true);
  };

  const handleAddTransferLine = () => {
    if (!lineItemId) return;
    const itm = items.find((i) => i.id === lineItemId);
    if (!itm) return;

    const available = getItemStockInWarehouse(lineItemId, fromWhId);
    if (available < lineItemQty) {
      setErrorMsg(`الكمية المتوفرة في مستودع المصدر (${available}) أقل من الكمية المطلوبة للتحويل (${lineItemQty})`);
      return;
    }

    setTransferLines([...transferLines, { itemId: lineItemId, quantity: Number(lineItemQty) }]);
    setErrorMsg(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWhId === toWhId) {
      setErrorMsg('لا يمكن التحويل من وإلى نفس المستودع');
      return;
    }
    if (transferLines.length === 0) {
      setErrorMsg('يرجى إضافة صنف واحد على الأقل للتحويل');
      return;
    }

    const fromWh = warehouses.find((w) => w.id === fromWhId);
    const toWh = warehouses.find((w) => w.id === toWhId);

    const itemsFormatted = transferLines.map((line) => {
      const itm = items.find((i) => i.id === line.itemId)!;
      return {
        itemId: itm.id,
        itemCode: itm.code,
        itemName: itm.name,
        unitName: 'قطعة',
        quantity: line.quantity,
        costPrice: itm.costPrice,
      };
    });

    const totalCost = itemsFormatted.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);

    addWarehouseTransfer({
      date: transDate,
      fromWarehouseId: fromWhId,
      fromWarehouseName: fromWh?.name || 'مستودع المصدر',
      toWarehouseId: toWhId,
      toWarehouseName: toWh?.name || 'مستودع الوجهة',
      items: itemsFormatted,
      totalCost,
      notes: transNotes,
    });

    setIsTransferModalOpen(false);
  };

  // Open Adjustment Modal
  const openNewAdjModal = () => {
    setAdjDate(new Date().toISOString().split('T')[0]);
    const defWh = warehouses[0]?.id || '';
    setAdjWhId(defWh);
    setAdjNotes('');

    // Pre-populate actual quantities with system quantities
    const initialMap: Record<string, number> = {};
    items.forEach((itm) => {
      initialMap[itm.id] = getItemStockInWarehouse(itm.id, defWh);
    });
    setAdjLines(initialMap);
    setErrorMsg(null);
    setIsAdjModalOpen(true);
  };

  const handleWhChangeInAdj = (whId: string) => {
    setAdjWhId(whId);
    const updatedMap: Record<string, number> = {};
    items.forEach((itm) => {
      updatedMap[itm.id] = getItemStockInWarehouse(itm.id, whId);
    });
    setAdjLines(updatedMap);
  };

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wh = warehouses.find((w) => w.id === adjWhId);

    // Compute diff items
    const adjustedItems: InventoryAdjustmentItem[] = [];
    let totalImpact = 0;

    items.forEach((itm) => {
      const sysQty = getItemStockInWarehouse(itm.id, adjWhId);
      const physQty = Number(adjLines[itm.id] ?? sysQty);
      const diff = physQty - sysQty;

      if (diff !== 0) {
        const costImpact = diff * itm.costPrice;
        totalImpact += costImpact;
        adjustedItems.push({
          itemId: itm.id,
          itemCode: itm.code,
          itemName: itm.name,
          unitName: 'قطعة',
          currentSystemQty: sysQty,
          actualPhysicalQty: physQty,
          diffQty: diff,
          costPrice: itm.costPrice,
          totalCostImpact: costImpact,
        });
      }
    });

    if (adjustedItems.length === 0) {
      setErrorMsg('لم يتم إجراء أي تعديل على الكميات');
      return;
    }

    addInventoryAdjustment({
      date: adjDate,
      warehouseId: adjWhId,
      warehouseName: wh?.name || 'المستودع',
      items: adjustedItems,
      totalImpact,
      notes: adjNotes,
    });

    setIsAdjModalOpen(false);
  };

  // Execute Cost Recalculation
  const handleRecalculateCost = () => {
    const res = recalculateWeightedAverageCost();
    setRecalcResult(res.message);
  };

  const handleExcelTransfers = () => {
    exportToExcel(
      'تحويلات_المستودعات',
      ['رقم التحويل', 'التاريخ', 'من مستودع', 'إلى مستودع', 'التكلفة الإجمالية', 'البيان'],
      warehouseTransfers.map((t) => [
        t.transferNumber,
        t.date,
        t.fromWarehouseName,
        t.toWarehouseName,
        t.totalCost,
        t.notes,
      ])
    );
  };

  const handleExcelAdjustments = () => {
    exportToExcel(
      'التسويات_الجردية',
      ['رقم التسوية', 'التاريخ', 'المستودع', 'الأثر المالي للتكلفة', 'ملاحظات الجرد'],
      inventoryAdjustments.map((a) => [a.adjustmentNumber, a.date, a.warehouseName, a.totalImpact, a.notes])
    );
  };

  return (
    <div>
      <PageHeader
        title={
          subTab === 'transfers'
            ? 'التحويل بين المستودعات'
            : subTab === 'adjustments'
            ? 'تسوية جردية للأصناف في المخازن'
            : 'إعادة احتساب متوسط التكلفة للأصناف'
        }
        subtitle="إدارة حركة ومناقلة البضائع، تسوية فروق الجرد الفعلي، واحتساب متوسط التكلفة المرجح الموحد"
        actionLabel={
          subTab === 'transfers'
            ? 'إنشاء تحويل جديد'
            : subTab === 'adjustments'
            ? 'تسجيل تسوية جردية'
            : undefined
        }
        onAction={subTab === 'transfers' ? openNewTransferModal : openNewAdjModal}
        canCreate={subTab === 'transfers' ? canCreateTransfers : canCreateAdjustments}
        onExportExcel={subTab === 'transfers' ? handleExcelTransfers : handleExcelAdjustments}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('transfers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'transfers' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التحويلات ({warehouseTransfers.length})
          </button>
          <button
            onClick={() => setSubTab('adjustments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'adjustments' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التسويات الجردية ({inventoryAdjustments.length})
          </button>
          <button
            onClick={() => setSubTab('recalculation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'recalculation' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            إعادة احتساب التكلفة
          </button>
        </div>
      </PageHeader>

      {/* View 1: Warehouse Transfers */}
      {subTab === 'transfers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم التحويل</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">من مستودع (المصدر)</th>
                  <th className="py-3 px-4">إلى مستودع (الوجهة)</th>
                  <th className="py-3 px-4">الأصناف المحولة</th>
                  <th className="py-3 px-4 text-left">التكلفة الإجمالية للبضاعة</th>
                  <th className="py-3 px-4">البيان</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {warehouseTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد تحويلات مستودعية مسجلة
                    </td>
                  </tr>
                ) : (
                  warehouseTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{t.date}</td>
                      <td className="py-3 px-4 font-semibold text-rose-700">{t.fromWarehouseName}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{t.toWarehouseName}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {t.items.map((i, idx) => (
                            <span key={idx} className="text-[11px] text-slate-800">
                              {i.itemName} (الكمية: {formatNumber(i.quantity)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(t.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">{t.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {canDeleteTransfers && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف إذن التحويل المستودعي وإعادة الكميات لمستودع المصدر؟')) {
                                deleteWarehouseTransfer(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف إذن التحويل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Inventory Adjustments */}
      {subTab === 'adjustments' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم إذن التسوية</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">المستودع المعني</th>
                  <th className="py-3 px-4">الأصناف والتسويات (دفتري مقابل فعلي)</th>
                  <th className="py-3 px-4 text-left">الأثر المالي الإجمالي للتكلفة</th>
                  <th className="py-3 px-4">البيان</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inventoryAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد تسويات جردية مسجلة
                    </td>
                  </tr>
                ) : (
                  inventoryAdjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{a.adjustmentNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{a.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{a.warehouseName}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {a.items.map((i, idx) => (
                            <div key={idx} className="text-[11px] flex items-center gap-2">
                              <span className="font-semibold">{i.itemName}:</span>
                              <span>دفتري {i.currentSystemQty}</span>
                              <span>← فعلي {i.actualPhysicalQty}</span>
                              <span
                                className={`font-mono font-bold ${
                                  i.diffQty >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                ({i.diffQty > 0 ? `+${i.diffQty}` : i.diffQty})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-left font-mono font-bold ${
                          a.totalImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(a.totalImpact)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{a.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {canDeleteAdjustments && (
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف إذن التسوية الجردية واسترجاع كميات النظام السابقة؟')) {
                                deleteInventoryAdjustment(a.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف إذن التسوية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Cost Recalculation (Weighted Average Cost) */}
      {subTab === 'recalculation' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              إعادة احتساب متوسط التكلفة المرجح للأصناف
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              وفقاً للمعايير المحاسبية المعتمدة، يتم احتساب متوسط التكلفة المرجح (Weighted Average Cost) لجميع أصناف المنشأة باعتبار كافة المستودعات مخزناً واحداً موحداً، ولا يتم احتساب تكلفة منفصلة لكل مخزن على حدة.
              <br />
              يقوم النظام بتجميع كافة فواتير المشتريات ومردوداتها والأرصدة الافتتاحية لحساب:
              <br />
              <span className="font-mono font-bold text-emerald-800 inline-block mt-2 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                متوسط التكلفة = إجمالي تكلفة البضاعة المتاحة ÷ إجمالي الكمية المتاحة
              </span>
            </p>
          </div>

          {recalcResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block mb-0.5">تم التحديث بنجاح:</span>
                <span>{recalcResult}</span>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleRecalculateCost}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              بدء إعادة احتساب متوسط التكلفة لجميع الأصناف الآن
            </button>
          </div>

          {/* Current Cost Summary Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>جدول أسعار التكلفة الفعلية المعتمدة حالياً لكافة الأصناف</span>
              <span className="font-mono text-emerald-700 font-normal">
                عدد الأصناف: {items.length}
              </span>
            </div>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">كود الصنف</th>
                  <th className="py-2.5 px-4">اسم الصنف</th>
                  <th className="py-2.5 px-4 text-center">الرصيد الكلي بكافة المستودعات</th>
                  <th className="py-2.5 px-4 text-left">متوسط سعر التكلفة الفعلي</th>
                  <th className="py-2.5 px-4 text-left">إجمالي قيمة المخزون بالتكلفة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((i) => {
                  const totalQty = stocks
                    .filter((s) => s.itemId === i.id)
                    .reduce((sum, s) => sum + s.quantity, 0);
                  const totalVal = totalQty * i.costPrice;

                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold">{i.code}</td>
                      <td className="py-2.5 px-4 font-medium">{i.name}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold">
                        {formatNumber(totalQty)}
                      </td>
                      <td className="py-2.5 px-4 text-left font-mono font-semibold text-amber-700">
                        {formatCurrency(i.costPrice)}
                      </td>
                      <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-800">
                        {formatCurrency(totalVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="إنشاء إذن تحويل بضائع بين المستودعات"
        maxWidth="2xl"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ التحويل</label>
              <input
                type="date"
                value={transDate}
                onChange={(e) => setTransDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">من مستودع (المصدر)</label>
              <select
                value={fromWhId}
                onChange={(e) => setFromWhId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">إلى مستودع (الوجهة)</label>
              <select
                value={toWhId}
                onChange={(e) => setToWhId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Item Adder */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">إضافة صنف للتحويل:</label>
            <div className="flex items-center gap-2">
              <select
                value={lineItemId}
                onChange={(e) => setLineItemId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {items.map((i) => {
                  const avail = getItemStockInWarehouse(i.id, fromWhId);
                  return (
                    <option key={i.id} value={i.id}>
                      {i.name} (المتوفر بمستودع المصدر: {avail})
                    </option>
                  );
                })}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">الكمية:</span>
                <input
                  type="number"
                  min="1"
                  value={lineItemQty}
                  onChange={(e) => setLineItemQty(Number(e.target.value))}
                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTransferLine}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                + إضافة
              </button>
            </div>

            {/* List */}
            <div className="space-y-1 pt-2">
              {transferLines.map((line, idx) => {
                const itm = items.find((i) => i.id === line.itemId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-900">{itm?.name}</span>
                    <span className="font-mono text-emerald-700 font-bold">الكمية: {line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setTransferLines(transferLines.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البيان وملاحظات التحويل</label>
            <input
              type="text"
              value={transNotes}
              onChange={(e) => setTransNotes(e.target.value)}
              placeholder="مثال: نقل بضاعة لتلبية طلبات فرع الإسكندرية"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              تنفيذ التحويل المستودعي
            </button>
          </div>
        </form>
      </Modal>

      {/* Inventory Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="فاتورة تسوية جردية للأصناف في المخازن"
        maxWidth="3xl"
      >
        <form onSubmit={handleAdjSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ التسوية الجردية</label>
              <input
                type="date"
                value={adjDate}
                onChange={(e) => setAdjDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع محل الجرد</label>
              <select
                value={adjWhId}
                onChange={(e) => handleWhChangeInAdj(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-bold text-slate-800 block mb-1">تعليمات الجرد الفعلي:</span>
            <span className="text-slate-600">
              قم بإدخال الكمية الفعلية الموجودة في المستودع بعد الجرد الميداني. سيقوم النظام بحساب فرق الجرد والأثر المالي بناءً على سعر التكلفة الفعلية لكل صنف.
            </span>
          </div>

          {/* Adjustments Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">كود الصنف</th>
                  <th className="py-2.5 px-3">اسم الصنف</th>
                  <th className="py-2.5 px-3 text-center">الرصيد الدفتري</th>
                  <th className="py-2.5 px-3 text-center">الكمية الفعلية بالجرد</th>
                  <th className="py-2.5 px-3 text-center">فرق الجرد</th>
                  <th className="py-2.5 px-3 text-left">التكلفة الفعلية</th>
                  <th className="py-2.5 px-3 text-left">الأثر المالي للتكلفة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((itm) => {
                  const sysQty = getItemStockInWarehouse(itm.id, adjWhId);
                  const physQty = Number(adjLines[itm.id] ?? sysQty);
                  const diff = physQty - sysQty;
                  const impact = diff * itm.costPrice;

                  return (
                    <tr key={itm.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{itm.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{itm.name}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{sysQty}</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={adjLines[itm.id] ?? sysQty}
                          onChange={(e) =>
                            setAdjLines({
                              ...adjLines,
                              [itm.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-emerald-800 bg-white"
                        />
                      </td>
                      <td
                        className={`py-2 px-3 text-center font-mono font-bold ${
                          diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-2 px-3 text-left font-mono text-slate-600">
                        {formatCurrency(itm.costPrice)}
                      </td>
                      <td
                        className={`py-2 px-3 text-left font-mono font-bold ${
                          impact > 0 ? 'text-emerald-700' : impact < 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(impact)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">أسباب وملاحظات التسوية الجردية</label>
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              placeholder="مثال: جرد دوري ربع سنوي معتمد من لجنة الجرد"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              اعتماد وترحيل التسوية الجردية
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
