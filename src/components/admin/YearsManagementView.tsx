'use client';

import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle2, X } from 'lucide-react';
import { AcademicYear, User } from '@/types';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [yearName, setYearName] = useState('');
  const [yearNum, setYearNum] = useState<number>(years.length + 1);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    store.addYear(yearName || `Year ${yearNum}`, Number(yearNum), currentUser);
    setSuccessMsg(`Academic Year ${yearNum} created.`);
    setShowAddModal(false);
    setYearName('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Curriculum Cohorts
            </span>
            <span className="text-xs text-slate-400">• Academic Progression</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Academic Years</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional academic years (Year 1 to Year 4+).
          </p>
        </div>

        <button
          onClick={() => {
            setYearNum(years.length + 1);
            setYearName(`Year ${years.length + 1}`);
            setShowAddModal(true);
          }}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {years.map((y) => (
          <div
            key={y.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base mb-3">
                {y.year_number}
              </div>
              <h3 className="text-base font-bold text-slate-900">{y.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Year Number: {y.year_number}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                {y.status}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{y.id}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Academic Year</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Year Number</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={yearNum}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10) || 1;
                    setYearNum(num);
                    setYearName(`Year ${num}`);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
};
