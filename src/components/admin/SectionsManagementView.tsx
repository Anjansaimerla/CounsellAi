'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  Users,
  AlertCircle,
  X,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { Department, AcademicYear, Section, User } from '@/types';
import { store } from '@/lib/storage/store';

interface SectionsManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const SectionsManagementView: React.FC<SectionsManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const departments = store.getActiveDepartments();
  const years = store.getYears();
  const sections = store.getSections();
  const students = store.getStudentsList();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [selectedYearId, setSelectedYearId] = useState(years[0]?.id || '');
  const [sectionName, setSectionName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !selectedYearId || !sectionName) return;

    // Check duplicate
    const exists = sections.find(
      (s) =>
        s.department_id === selectedDeptId &&
        s.year_id === selectedYearId &&
        s.name.toUpperCase() === sectionName.toUpperCase()
    );

    if (exists) {
      setErrorMsg(`Section '${sectionName.toUpperCase()}' already exists for this Department & Year.`);
      return;
    }

    store.addSection(selectedDeptId, selectedYearId, sectionName, currentUser);
    setSuccessMsg(`Section '${sectionName.toUpperCase()}' created.`);
    setShowAddModal(false);
    setSectionName('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
              Class Cohorts
            </span>
            <span className="text-xs text-slate-400">• Maximum 2 Counselors Per Section Policy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Department Sections</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure section cohorts and manage counselor assignments (max 2 per section).
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setSectionName('');
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
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

      {/* Sections Grouped by Department */}
      <div className="space-y-6">
        {departments.map((dept) => {
          const deptSections = sections.filter((s) => s.department_id === dept.id);

          return (
            <div key={dept.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {dept.code}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500">{deptSections.length} sections registered</p>
                  </div>
                </div>
              </div>

              {deptSections.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No sections defined for {dept.code} yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {deptSections.map((sec) => {
                    const yr = years.find((y) => y.id === sec.year_id);
                    const assignedCounselors = store.getCounselorsForSection(sec.id);
                    const secStudents = students.filter(
                      (s) =>
                        (s.department_id === dept.id || s.department.toUpperCase() === dept.code.toUpperCase()) &&
                        (s.year_id === sec.year_id || Number(s.year) === Number(yr?.year_number)) &&
                        (s.section_id === sec.id || s.section.toUpperCase() === sec.name.toUpperCase())
                    );

                    return (
                      <div
                        key={sec.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {dept.code} • Yr {yr?.year_number || '?'} • Sec {sec.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                assignedCounselors.length === 2
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : assignedCounselors.length === 1
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {assignedCounselors.length} / 2 Counselors
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium">{secStudents.length} Students</p>

                          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                            {assignedCounselors.length === 0 ? (
                              <span className="text-slate-400 italic">No assigned counselors</span>
                            ) : (
                              assignedCounselors.map((c) => (
                                <div key={c.id} className="flex items-center gap-1.5 text-slate-700">
                                  <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="truncate">{c.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD SECTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Section</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} (Year {y.year_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section Name / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C, D"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase"
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
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
