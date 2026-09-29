'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Users,
  PowerOff,
  Power,
} from 'lucide-react';
import { Department, EntityStatus, User } from '@/types';
import { store } from '@/lib/storage/store';

interface DepartmentsManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const DepartmentsManagementView: React.FC<DepartmentsManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const departments = store.getDepartments();
  const sections = store.getSections();
  const students = store.getStudentsList();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    store.addDepartment(name, code, currentUser);
    setSuccessMsg(`Department '${code}' created successfully.`);
    setShowAddModal(false);
    setName('');
    setCode('');
    onRefresh();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept || !name || !code) return;

    store.updateDepartment(editDept.id, name, code, status, currentUser);
    setSuccessMsg(`Department '${code}' updated successfully.`);
    setEditDept(null);
    onRefresh();
  };

  const handleToggleStatus = (dept: Department) => {
    const nextStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    store.updateDepartment(dept.id, dept.name, dept.code, nextStatus, currentUser);
    setSuccessMsg(`Department '${dept.code}' status changed to ${nextStatus}.`);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
              Department Structure
            </span>
            <span className="text-xs text-slate-400">• Institutional Branches</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Academic Departments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional branches, codes, and activation status.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setCode('');
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptSections = sections.filter((s) => s.department_id === dept.id);
          const deptStudents = students.filter(
            (s) =>
              s.department_id === dept.id ||
              s.department.toUpperCase() === dept.code.toUpperCase()
          );

          return (
            <div
              key={dept.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                    {dept.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      dept.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dept.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {dept.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono text-[11px]">ID: {dept.id}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">Sections</span>
                    <span className="font-bold text-slate-800 text-sm">{deptSections.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">Students</span>
                    <span className="font-bold text-slate-800 text-sm">{deptStudents.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    setEditDept(dept);
                    setName(dept.name);
                    setCode(dept.code);
                    setStatus(dept.status);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    dept.status === 'ACTIVE'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {dept.status === 'ACTIVE' ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Department</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, ECE, MECH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editDept && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Department</h3>
              <button onClick={() => setEditDept(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
