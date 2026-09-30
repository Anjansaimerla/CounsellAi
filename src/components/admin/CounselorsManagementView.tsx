'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  UserX,
  UserCheck,
  Layers,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  History,
  Lock,
  X,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { CounselorAssignment, CounselorScope, Department, AcademicYear, Section, User } from '@/types';
import { store } from '@/lib/storage/store';

interface CounselorsManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const CounselorsManagementView: React.FC<CounselorsManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const users = store.getUsers();
  const departments = store.getActiveDepartments();
  const years = store.getYears();
  const sections = store.getSections();

  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);

  // Form States (Create)
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('change-me-immediately');
  const [newRole, setNewRole] = useState<'COUNSELLOR' | 'ADMIN'>('COUNSELLOR');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id || '');
  const [newYearId, setNewYearId] = useState(years[0]?.id || '');
  const [newSectionId, setNewSectionId] = useState('');

  // Form States (Edit)
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'COUNSELLOR' | 'ADMIN'>('COUNSELLOR');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editPasswordVal, setEditPasswordVal] = useState('');

  // Assign scope states
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignYearId, setAssignYearId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');

  // Reset password states
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Table row password reveal state
  const [revealedRowPassId, setRevealedRowPassId] = useState<string | null>(null);
  const [copiedRowPassId, setCopiedRowPassId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredSectionsForNew = sections.filter(
    (s) => s.department_id === newDeptId && s.year_id === newYearId && s.status === 'ACTIVE'
  );

  const filteredSectionsForAssign = sections.filter(
    (s) => s.department_id === assignDeptId && s.year_id === assignYearId && s.status === 'ACTIVE'
  );

  const filteredUsers = users.filter((u) => {
    const scope = u.role === 'COUNSELLOR' ? store.getCounselorScope(u.id) : null;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (scope && scope.department_code.toLowerCase().includes(q)) ||
      (scope && scope.section_name.toLowerCase().includes(q))
    );
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await store.createUser(
      {
        name: newName,
        username: newUsername,
        passwordPlain: newPassword,
        role: newRole,
        email: newEmail || undefined,
        phone: newPhone || undefined,
        department_id: newRole === 'COUNSELLOR' ? newDeptId : undefined,
        year_id: newRole === 'COUNSELLOR' ? newYearId : undefined,
        section_id: newRole === 'COUNSELLOR' ? newSectionId : undefined,
      },
      currentUser
    );

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create user');
      return;
    }

    setSuccessMsg(`User '${newUsername}' created successfully.`);
    setShowAddModal(false);
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPhone('');
    onRefresh();
  };

  const handleOpenEdit = (user: User) => {
    setErrorMsg(null);
    setEditUserModal(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditStatus(user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    setEditPasswordVal('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    setErrorMsg(null);

    const res = await store.updateUser(
      editUserModal.id,
      {
        name: editName,
        username: editUsername,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        status: editStatus,
        passwordPlain: editPasswordVal.trim() || undefined,
      },
      currentUser
    );

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update user.');
      return;
    }

    setSuccessMsg(`User '${editUsername}' updated successfully.`);
    setEditUserModal(null);
    onRefresh();
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    setErrorMsg(null);

    const ok = await store.deleteUser(deleteUserModal.id, currentUser);
    if (!ok) {
      setErrorMsg('Cannot delete user (you cannot delete your own account).');
      return;
    }

    setSuccessMsg(`User '${deleteUserModal.username}' deleted.`);
    setDeleteUserModal(null);
    onRefresh();
  };

  const handleAssignScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    setErrorMsg(null);

    if (!assignDeptId || !assignYearId || !assignSectionId) {
      setErrorMsg('Please select Department, Year, and Section.');
      return;
    }

    const res = await store.assignCounselorScope(
      showAssignModal.id,
      assignDeptId,
      assignYearId,
      assignSectionId,
      currentUser
    );

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to assign scope.');
      return;
    }

    setSuccessMsg(`Scope assigned successfully for ${showAssignModal.name}.`);
    setShowAssignModal(null);
    onRefresh();
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await store.updateUserStatus(user.id, nextStatus, currentUser);
    setSuccessMsg(`Updated status for ${user.username} to ${nextStatus}.`);
    onRefresh();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;

    await store.resetUserPassword(showResetModal.id, resetPasswordVal, currentUser);
    setSuccessMsg(`Password reset successfully for ${showResetModal.username}.`);
    setShowResetModal(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              User Management
            </span>
            <span className="text-xs text-slate-400">• Maximum 2 Counselors Per Section Rule</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Counselors & User Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure counselor accounts, edit details, assign scopes, and manage access.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Counselor / User</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
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
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Counselors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            System Accounts ({filteredUsers.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search counselor, dept, section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Name & Username</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Assigned Scope</th>
                <th className="px-4 py-3.5">Password</th>
                <th className="px-4 py-3.5">Assigned Section Status</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((user) => {
                const scope = user.role === 'COUNSELLOR' ? store.getCounselorScope(user.id) : null;
                const activeCoCounselors = scope ? store.getCounselorsForSection(scope.section_id) : [];

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{user.name}</p>
                          <p className="text-[11px] text-slate-500">{user.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="text-slate-500 font-medium">Institution-Wide (All)</span>
                      ) : scope ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-semibold">
                            {scope.department_code}
                          </span>
                          <span>•</span>
                          <span>{scope.graduation_year ? `${scope.graduation_year} Batch (Yr ${scope.year_number})` : `Yr ${scope.year_number}`}</span>
                          <span>•</span>
                          <span>Sec {scope.section_name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* CURRENT PASSWORD COLUMN */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 select-all min-w-[70px]">
                          {revealedRowPassId === user.id
                            ? (user.current_password_display || 'change-me-immediately')
                            : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRevealedRowPassId(revealedRowPassId === user.id ? null : user.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title={revealedRowPassId === user.id ? 'Hide password' : 'Show password'}
                        >
                          {revealedRowPassId === user.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(user.current_password_display || 'change-me-immediately');
                            setCopiedRowPassId(user.id);
                            setTimeout(() => setCopiedRowPassId(null), 2000);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Copy password"
                        >
                          {copiedRowPassId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {user.role === 'COUNSELLOR' && scope ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              activeCoCounselors.length === 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {activeCoCounselors.length} / 2 Counselors Assigned
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit Counselor Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {user.role === 'COUNSELLOR' && (
                          <button
                            onClick={() => {
                              setErrorMsg(null);
                              setShowAssignModal(user);
                              const currScope = store.getCounselorScope(user.id);
                              if (currScope) {
                                setAssignDeptId(currScope.department_id);
                                setAssignYearId(currScope.year_id);
                                setAssignSectionId(currScope.section_id);
                              } else {
                                setAssignDeptId(departments[0]?.id || '');
                                setAssignYearId(years[0]?.id || '');
                                setAssignSectionId('');
                              }
                            }}
                            title="Assign Department & Section"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setErrorMsg(null);
                            setResetPasswordVal('');
                            setShowCurrentPass(false);
                            setCopiedPass(false);
                            setShowResetModal(user);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'ACTIVE' ? 'Disable User' : 'Enable User'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              setErrorMsg(null);
                              setDeleteUserModal(user);
                            }}
                            title="Delete Counselor / User"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD COUNSELOR / USER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create System Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. counselor.cse2a"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="COUNSELLOR">COUNSELLOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@institution.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              {newRole === 'COUNSELLOR' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 block text-xs">
                    Assign Department Scope (Max 2 counselors / section)
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Department</label>
                      <select
                        value={newDeptId}
                        onChange={(e) => {
                          setNewDeptId(e.target.value);
                          setNewSectionId('');
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Graduation Year / Batch</label>
                      <select
                        value={newYearId}
                        onChange={(e) => {
                          setNewYearId(e.target.value);
                          setNewSectionId('');
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-xs"
                      >
                        {years.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.graduation_year ? `${y.graduation_year} (Yr ${y.year_number})` : y.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Section</label>
                      <select
                        value={newSectionId}
                        onChange={(e) => setNewSectionId(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-xs"
                      >
                        <option value="">Select Section</option>
                        {filteredSectionsForNew.map((s) => {
                          const assigned = store.getCounselorsForSection(s.id);
                          return (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={assigned.length >= 2}
                            >
                              Sec {s.name} ({assigned.length}/2 assigned)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT COUNSELOR / USER */}
      {editUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit User Details</h3>
              </div>
              <button
                onClick={() => setEditUserModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                  >
                    <option value="COUNSELLOR">COUNSELLOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Change Password <span className="text-[10px] text-slate-400 font-normal">(Leave blank to keep existing password)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter new password to override..."
                  value={editPasswordVal}
                  onChange={(e) => setEditPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE COUNSELOR / USER */}
      {deleteUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Counselor / User</h3>
                <p className="text-xs text-slate-500">Irreversible Action</p>
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{deleteUserModal.name}</strong> (
                {deleteUserModal.username})?
              </p>
              <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                Any active section scope assignments for this counselor will be unlinked immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN SCOPE (WITH MAX 2 CHECK) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Assign Counselor Scope</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignScope} className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600">
                Assigning scope for <strong className="text-slate-900">{showAssignModal.name}</strong> ({showAssignModal.username}).
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={assignDeptId}
                  onChange={(e) => {
                    setAssignDeptId(e.target.value);
                    setAssignSectionId('');
                  }}
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
                <label className="block font-semibold text-slate-700 mb-1">Graduation Year / Batch</label>
                <select
                  value={assignYearId}
                  onChange={(e) => {
                    setAssignYearId(e.target.value);
                    setAssignSectionId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.graduation_year ? `${y.graduation_year} (Year ${y.year_number})` : y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Section (Max 2 Counselors Capacity)
                </label>
                <select
                  required
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Section --</option>
                  {filteredSectionsForAssign.map((sec) => {
                    const assignedCounselors = store
                      .getCounselorsForSection(sec.id)
                      .filter((c) => c.id !== showAssignModal.id);
                    const isFull = assignedCounselors.length >= 2;

                    return (
                      <option
                        key={sec.id}
                        value={sec.id}
                        disabled={isFull}
                        className={isFull ? 'text-slate-400 bg-slate-100' : ''}
                      >
                        Section {sec.name} — {assignedCounselors.length}/2 Active Counselors {isFull ? '(FULL)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Save Scope Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET PASSWORD */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Reset Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(null);
                  setResetPasswordVal('');
                  setShowCurrentPass(false);
                  setCopiedPass(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600">
                Credentials for <strong className="text-slate-900">{showResetModal.username}</strong> ({showResetModal.name}):
              </p>

              {/* CURRENT PASSWORD DISPLAY CARD */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Current Password
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
                      title={showCurrentPass ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPass ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const passToCopy = showResetModal.current_password_display || 'change-me-immediately';
                        navigator.clipboard.writeText(passToCopy);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }}
                      className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                      title="Copy current password"
                    >
                      {copiedPass ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-xs text-slate-900 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 select-all flex items-center justify-between">
                    <span>
                      {showCurrentPass
                        ? (showResetModal.current_password_display || 'change-me-immediately')
                        : '••••••••••••••••'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Active</span>
                  </div>
                </div>
              </div>

              {/* NEW PASSWORD INPUT */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Set New Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 4 characters)..."
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">Encrypted with PBKDF2</span>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = 'Pass_' + Math.random().toString(36).slice(-6) + '!';
                      setResetPasswordVal(randomPass);
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(null);
                    setResetPasswordVal('');
                    setShowCurrentPass(false);
                    setCopiedPass(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resetPasswordVal.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
