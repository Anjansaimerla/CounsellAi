'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  GraduationCap,
} from 'lucide-react';
import { AcademicYear, EntityStatus, User } from '@/types';
import { store } from '@/lib/storage/store';

interface YearsManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const YearsManagementView: React.FC<YearsManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const years = store.getYears();
  const currentCalendarYear = new Date().getFullYear();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null);

  const [yearNum, setYearNum] = useState<number>(years.length + 1);
  const [gradYear, setGradYear] = useState<number>(currentCalendarYear + (4 - (years.length + 1)));
  const [yearName, setYearName] = useState('');
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAdd = () => {
    const nextNum = years.length + 1;
    const computedGradYear = currentCalendarYear + (4 - nextNum);
    setYearNum(nextNum);
    setGradYear(computedGradYear);
    setYearName(`${computedGradYear} Batch`);
    setShowAddModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = yearName || `${gradYear} Batch`;
    store.addYear(finalName, Number(yearNum), Number(gradYear), currentUser);
    setSuccessMsg(`Academic Year '${finalName}' created successfully.`);
    setShowAddModal(false);
    onRefresh();
  };

  const handleOpenEdit = (y: AcademicYear) => {
    setEditYear(y);
    setYearName(y.name);
    setYearNum(y.year_number);
    setGradYear(y.graduation_year || (currentCalendarYear + (4 - y.year_number)));
    setStatus(y.status);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editYear) return;
    const finalName = yearName || `${gradYear} Batch`;
    const success = store.updateYear(
      editYear.id,
      finalName,
      Number(yearNum),
      Number(gradYear),
      status,
      currentUser
    );
    if (success) {
      setSuccessMsg(`Academic Year '${finalName}' updated.`);
      setEditYear(null);
      onRefresh();
    } else {
      setErrorMsg('Failed to update academic year.');
    }
  };

  const handleDelete = () => {
    if (!deleteYear) return;
    const success = store.deleteYear(deleteYear.id, currentUser);
    if (success) {
      setSuccessMsg(`Academic Year '${deleteYear.name}' deleted.`);
      setDeleteYear(null);
      onRefresh();
    } else {
      setErrorMsg(`Failed to delete year.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Curriculum Cohorts
            </span>
            <span className="text-xs text-slate-400">• Graduation Year Batches</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Academic Years & Batches</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify cohorts by their graduation year (e.g. 2028 Batch) and academic progression.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Year</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {years.map((y) => (
          <div
            key={y.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs font-mono">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Grad: {y.graduation_year || 'N/A'}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    y.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      y.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {y.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{y.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Progress Level: <span className="font-semibold text-slate-700">Year {y.year_number}</span>
              </p>
              <p className="text-xs text-slate-400 font-mono text-[10px] mt-0.5">ID: {y.id}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(y)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1 text-xs"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteYear(y)}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                  title="Delete Year"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                Class of {y.graduation_year}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Academic Year / Batch</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Graduation Year (Batch Identifier)
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  required
                  value={gradYear}
                  onChange={(e) => {
                    const g = parseInt(e.target.value, 10) || currentCalendarYear;
                    setGradYear(g);
                    const calcYear = Math.max(1, Math.min(6, 4 - (g - currentCalendarYear)));
                    setYearNum(calcYear >= 1 && calcYear <= 6 ? calcYear : (years.length + 1));
                    setYearName(`${g} Batch`);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  e.g. 2028 for the graduating Class of 2028
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="e.g. 2028 Batch or Class of 2028"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editYear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Academic Year</h3>
              <button onClick={() => setEditYear(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Graduation Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  required
                  value={gradYear}
                  onChange={(e) => {
                    const g = parseInt(e.target.value, 10) || currentCalendarYear;
                    setGradYear(g);
                    const calcYear = Math.max(1, Math.min(6, 4 - (g - currentCalendarYear)));
                    setYearNum(calcYear >= 1 && calcYear <= 6 ? calcYear : yearNum);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntityStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditYear(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Update Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteYear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Delete Academic Year</h3>
              </div>
              <button onClick={() => setDeleteYear(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete academic year{' '}
                <strong className="text-slate-900 font-semibold">{deleteYear.name}</strong>?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                <strong>Warning:</strong> This action will cascade delete all linked sections and counselor assignments under this academic year.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setDeleteYear(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
