'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Users,
  AlertCircle,
  AlertTriangle,
  X,
  UserCheck,
  Building2,
  Calendar,
  Search,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { Department, AcademicYear, Section, EntityStatus, User } from '@/types';
import { store } from '@/lib/storage/store';

interface SectionsManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const SectionsManagementView: React.FC<SectionsManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const departments = store.getDepartments();
  const years = store.getYears();
  const sections = store.getSections();
  const students = store.getStudentsList();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeptId, setFilterDeptId] = useState<string>('ALL');
  const [filterYearId, setFilterYearId] = useState<string>('ALL');
  const [filterCapacity, setFilterCapacity] = useState<string>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editSec, setEditSec] = useState<Section | null>(null);
  const [deleteSec, setDeleteSec] = useState<Section | null>(null);

  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [yearId, setYearId] = useState(years[0]?.id || '');
  const [secName, setSecName] = useState('');
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setErrorMsg(null);
    setDeptId(departments[0]?.id || '');
    setYearId(years[0]?.id || '');
    setSecName('');
    setStatus('ACTIVE');
    setShowAddModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId || !yearId || !secName) return;

    // Check duplicate
    const exists = sections.find(
      (s) =>
        s.department_id === deptId &&
        s.year_id === yearId &&
        s.name.toUpperCase() === secName.trim().toUpperCase()
    );

    if (exists) {
      setErrorMsg(`Section '${secName.trim().toUpperCase()}' already exists for this Department & Batch.`);
      return;
    }

    store.addSection(deptId, yearId, secName.trim(), currentUser);
    setSuccessMsg(`Section '${secName.trim().toUpperCase()}' created successfully.`);
    setShowAddModal(false);
    setSecName('');
    onRefresh();
  };

  const handleOpenEdit = (sec: Section) => {
    setEditSec(sec);
    setDeptId(sec.department_id);
    setYearId(sec.year_id);
    setSecName(sec.name);
    setStatus(sec.status);
    setErrorMsg(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSec || !deptId || !yearId || !secName) return;

    const trimmed = secName.trim().toUpperCase();
    const exists = sections.find(
      (s) =>
        s.id !== editSec.id &&
        s.department_id === deptId &&
        s.year_id === yearId &&
        s.name.toUpperCase() === trimmed
    );

    if (exists) {
      setErrorMsg(`Another Section with name '${trimmed}' already exists for this Department & Batch.`);
      return;
    }

    const success = store.updateSection(editSec.id, deptId, yearId, trimmed, status, currentUser);
    if (success) {
      setSuccessMsg(`Section '${trimmed}' updated successfully.`);
      setEditSec(null);
      onRefresh();
    } else {
      setErrorMsg('Failed to update section.');
    }
  };

  const handleDelete = () => {
    if (!deleteSec) return;
    const success = store.deleteSection(deleteSec.id, currentUser);
    if (success) {
      setSuccessMsg(`Section '${deleteSec.name}' deleted successfully.`);
      setDeleteSec(null);
      onRefresh();
    } else {
      setErrorMsg('Failed to delete section.');
    }
  };

  // Filtered sections computation
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const dept = departments.find((d) => d.id === sec.department_id);
      const yr = years.find((y) => y.id === sec.year_id);
      const assignedCounselors = store.getCounselorsForSection(sec.id);

      // Dept filter
      if (filterDeptId !== 'ALL' && sec.department_id !== filterDeptId) return false;

      // Year filter
      if (filterYearId !== 'ALL' && sec.year_id !== filterYearId) return false;

      // Capacity filter
      if (filterCapacity === 'EMPTY' && assignedCounselors.length !== 0) return false;
      if (filterCapacity === 'PARTIAL' && assignedCounselors.length !== 1) return false;
      if (filterCapacity === 'FULL' && assignedCounselors.length !== 2) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sec.name.toLowerCase().includes(q);
        const matchesDept = dept?.name.toLowerCase().includes(q) || dept?.code.toLowerCase().includes(q);
        const matchesYear =
          yr?.name.toLowerCase().includes(q) ||
          String(yr?.graduation_year).includes(q) ||
          `year ${yr?.year_number}`.includes(q);
        const matchesCounselor = assignedCounselors.some(
          (c) => c.name.toLowerCase().includes(q) || (c.email ? c.email.toLowerCase().includes(q) : false)
        );

        if (!matchesName && !matchesDept && !matchesYear && !matchesCounselor) return false;
      }

      return true;
    });
  }, [sections, departments, years, filterDeptId, filterYearId, filterCapacity, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
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
            Configure section cohorts, view graduation year batches, and manage counselor allocations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
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

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by section, department, graduation batch, or counselor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-xs text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>

          {/* Graduation Year / Batch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={filterYearId}
              onChange={(e) => setFilterYearId(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-xs text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  Grad {y.graduation_year || y.name} (Yr {y.year_number})
                </option>
              ))}
            </select>
          </div>

          {/* Counselor Capacity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <select
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-xs text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Counselor Status</option>
              <option value="EMPTY">Unassigned (0/2)</option>
              <option value="PARTIAL">1 Counselor (1/2)</option>
              <option value="FULL">Fully Assigned (2/2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTIONS GRID */}
      {filteredSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Sections Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or add a new section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSections.map((sec) => {
            const dept = departments.find((d) => d.id === sec.department_id);
            const yr = years.find((y) => y.id === sec.year_id);
            const assignedCounselors = store.getCounselorsForSection(sec.id);
            const secStudents = students.filter(
              (s) =>
                (s.department_id === sec.department_id ||
                  s.department.toUpperCase() === dept?.code.toUpperCase()) &&
                (s.year_id === sec.year_id || Number(s.year) === Number(yr?.year_number)) &&
                (s.section_id === sec.id || s.section.toUpperCase() === sec.name.toUpperCase())
            );

            return (
              <div
                key={sec.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                        {dept?.code || 'DEPT'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Grad {yr?.graduation_year || yr?.name || 'N/A'}</span>
                      </span>
                    </div>

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

                  <div className="mt-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {dept?.code} • {yr?.graduation_year ? `${yr.graduation_year} Batch (Yr ${yr.year_number})` : `Yr ${yr?.year_number}`} • Sec {sec.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dept?.name} • Year {yr?.year_number || '?'}
                    </p>
                  </div>

                  <div className="mt-3 py-2 px-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Students Enrolled</span>
                    <span className="font-bold text-slate-800">{secStudents.length}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Assigned Counselors
                    </span>
                    {assignedCounselors.length === 0 ? (
                      <span className="text-slate-400 italic block py-0.5">No assigned counselors yet</span>
                    ) : (
                      assignedCounselors.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sec)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1 text-xs"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteSec(sec)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">{sec.id.split('_').pop()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year / Graduation Batch</label>
                <select
                  value={yearId}
                  onChange={(e) => setYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      Grad {y.graduation_year || y.name} • Year {y.year_number} ({y.name})
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
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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

      {/* EDIT SECTION MODAL */}
      {editSec && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Section</h3>
              <button onClick={() => setEditSec(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year / Graduation Batch</label>
                <select
                  value={yearId}
                  onChange={(e) => setYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      Grad {y.graduation_year || y.name} • Year {y.year_number} ({y.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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
                  onClick={() => setEditSec(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Update Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SECTION MODAL */}
      {deleteSec && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Delete Section</h3>
              </div>
              <button onClick={() => setDeleteSec(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete section{' '}
                <strong className="text-slate-900 font-semibold">{deleteSec.name}</strong>?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                <strong>Warning:</strong> Counselor assignments for this section will be unlinked.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setDeleteSec(null)}
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
