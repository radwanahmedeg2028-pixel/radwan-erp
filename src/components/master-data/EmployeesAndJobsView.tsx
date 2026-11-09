/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee, Job } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { formatCurrency, exportToExcel } from '../../utils/exportUtils';
import { Edit2, Trash2, Search, UserCheck, Briefcase } from 'lucide-react';

export const EmployeesAndJobsView: React.FC = () => {
  const {
    employees,
    jobs,
    addEmployee,
    editEmployee,
    deleteEmployee,
    addJob,
    editJob,
    deleteJob,
    hasPermission,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'jobs'>('employees');
  const [searchTerm, setSearchTerm] = useState('');

  // Employee modal state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empContact, setEmpContact] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(10000);
  const [dailySalary, setDailySalary] = useState<number>(333.33);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [jobId, setJobId] = useState('');

  // Job modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobCode, setJobCode] = useState('');
  const [jobName, setJobName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = hasPermission('employees', 'create');
  const canEdit = hasPermission('employees', 'edit');
  const canDelete = hasPermission('employees', 'delete');

  const openAddEmpModal = () => {
    setEditingEmp(null);
    setEmpCode('EMP-' + String(employees.length + 1).padStart(3, '0'));
    setEmpName('');
    setEmpAddress('');
    setEmpContact('');
    setMonthlySalary(10000);
    setDailySalary(333.33);
    setOpeningBalance(0);
    setJobId(jobs[0]?.id || '');
    setErrorMsg(null);
    setIsEmpModalOpen(true);
  };

  const openEditEmpModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpCode(emp.code);
    setEmpName(emp.name);
    setEmpAddress(emp.address);
    setEmpContact(emp.contactDetails);
    setMonthlySalary(emp.monthlySalary);
    setDailySalary(emp.dailySalary);
    setOpeningBalance(emp.openingBalance);
    setJobId(emp.jobId || '');
    setErrorMsg(null);
    setIsEmpModalOpen(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      setErrorMsg('يرجى كتابة اسم الموظف');
      return;
    }
    const selectedJob = jobs.find((j) => j.id === jobId);
    if (editingEmp) {
      editEmployee(editingEmp.id, {
        code: empCode,
        name: empName,
        address: empAddress,
        contactDetails: empContact,
        monthlySalary: Number(monthlySalary),
        dailySalary: Number(dailySalary),
        openingBalance: Number(openingBalance),
        jobId,
        jobName: selectedJob?.name,
      });
    } else {
      addEmployee({
        code: empCode,
        name: empName,
        address: empAddress,
        contactDetails: empContact,
        monthlySalary: Number(monthlySalary),
        dailySalary: Number(dailySalary),
        openingBalance: Number(openingBalance),
        jobId,
        jobName: selectedJob?.name,
      });
    }
    setIsEmpModalOpen(false);
  };

  const openAddJobModal = () => {
    setEditingJob(null);
    setJobCode('JOB-' + String(jobs.length + 1).padStart(2, '0'));
    setJobName('');
    setErrorMsg(null);
    setIsJobModalOpen(true);
  };

  const openEditJobModal = (j: Job) => {
    setEditingJob(j);
    setJobCode(j.code);
    setJobName(j.name);
    setErrorMsg(null);
    setIsJobModalOpen(true);
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) {
      setErrorMsg('يرجى كتابة اسم الوظيفة');
      return;
    }
    if (editingJob) {
      editJob(editingJob.id, { code: jobCode, name: jobName });
    } else {
      addJob({ code: jobCode, name: jobName });
    }
    setIsJobModalOpen(false);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.contactDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(
    (j) =>
      j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcelEmployees = () => {
    exportToExcel(
      'الموظفين',
      ['كود الموظف', 'اسم الموظف', 'الوظيفة', 'العنوان', 'وسائل التواصل', 'الراتب الشهري', 'الراتب اليومي', 'الرصيد الافتتاحي'],
      filteredEmployees.map((e) => [
        e.code,
        e.name,
        e.jobName || '',
        e.address,
        e.contactDetails,
        e.monthlySalary,
        e.dailySalary,
        e.openingBalance,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="تكويد الموظفين والوظائف"
        subtitle="إدارة بيانات العاملين، الرواتب الشهرية واليومية، والمسميات الوظيفية"
        actionLabel={activeSubTab === 'employees' ? 'إضافة موظف جديد' : 'إضافة وظيفة جديدة'}
        onAction={activeSubTab === 'employees' ? openAddEmpModal : openAddJobModal}
        canCreate={canCreate}
        onExportExcel={activeSubTab === 'employees' ? handleExcelEmployees : undefined}
      >
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'employees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الموظفين ({employees.length})
          </button>
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الوظائف ({jobs.length})
          </button>
        </div>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeSubTab === 'employees'
              ? 'ابحث باسم الموظف أو الكود أو الهاتف...'
              : 'ابحث باسم الوظيفة أو الكود...'
          }
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {activeSubTab === 'employees' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">كود الموظف</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">المسمى الوظيفي</th>
                  <th className="py-3 px-4">العنوان</th>
                  <th className="py-3 px-4">وسائل التواصل</th>
                  <th className="py-3 px-4 text-left">الراتب الشهري</th>
                  <th className="py-3 px-4 text-left">الراتب اليومي</th>
                  <th className="py-3 px-4 text-left">الرصيد الافتتاحي</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      لا يوجد موظفون مطابقون لبيانات البحث
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{e.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{e.name}</td>
                      <td className="py-3 px-4 text-slate-700">{e.jobName || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{e.address || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{e.contactDetails || '-'}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                        {formatCurrency(e.monthlySalary)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-slate-600">
                        {formatCurrency(e.dailySalary)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-slate-600">
                        {formatCurrency(e.openingBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => openEditEmpModal(e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) deleteEmployee(e.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredJobs.map((j) => (
            <div
              key={j.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono text-[11px] text-slate-400 block">{j.code}</span>
                  <h4 className="text-sm font-bold text-slate-900">{j.name}</h4>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {canEdit && (
                  <button
                    onClick={() => openEditJobModal(j)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) deleteJob(j.id);
                    }}
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
      )}

      {/* Employee Modal */}
      <Modal
        isOpen={isEmpModalOpen}
        onClose={() => setIsEmpModalOpen(false)}
        title={editingEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        maxWidth="3xl"
      >
        <form onSubmit={handleEmpSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الموظف</label>
              <input
                type="text"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الموظف الكامل</label>
              <input
                type="text"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="الاسم الرباعي للموظف"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الوظيفة / القسم</label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="">اختر الوظيفة...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">وسائل التواصل (الهاتف / البريد)</label>
              <input
                type="text"
                value={empContact}
                onChange={(e) => setEmpContact(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان الموظف ومحل السكن</label>
            <input
              type="text"
              value={empAddress}
              onChange={(e) => setEmpAddress(e.target.value)}
              placeholder="العنوان التفصيلي"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الراتب الشهري الأساسي (ج.م)</label>
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMonthlySalary(m);
                  setDailySalary(Math.round((m / 30) * 100) / 100);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الراتب اليومي المحسوب (ج.م)</label>
              <input
                type="number"
                step="0.01"
                value={dailySalary}
                onChange={(e) => setDailySalary(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (ج.م)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEmpModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ الموظف
            </button>
          </div>
        </form>
      </Modal>

      {/* Job Modal */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title={editingJob ? 'تعديل بيانات الوظيفة' : 'إضافة مسمى وظيفي جديد'}
        maxWidth="md"
      >
        <form onSubmit={handleJobSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود الوظيفة</label>
            <input
              type="text"
              value={jobCode}
              onChange={(e) => setJobCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الوظيفة</label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="مثال: محاسب، أمين مخزن، مدير تسويق"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJobModalOpen(false)}
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
