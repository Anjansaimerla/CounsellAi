'use client';

import React, { useState, useMemo } from 'react';
import { CompleteStudentRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import {
  Search,
  Trash2,
  AlertTriangle,
  UserX,
  Sparkles,
  Printer,
  CheckCircle2,
  X,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface StudentManagementViewProps {
  students: CompleteStudentRecord[];
  onDeleteStudent: (registerNumber: string) => void;
  onSelectStudent: (registerNumber: string) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  onDeleteStudent,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<CompleteStudentRecord | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Fast Instant Live Filter
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;

    return students.filter((s) => {
      const name = s.student.student_name.toLowerCase();
      const reg = s.student.register_number.toLowerCase();
      const dept = s.student.department.toLowerCase();
      const sec = (s.student.section || '').toLowerCase();
      const yr = (s.student.year || '').toString();

      return (
        name.includes(q) ||
        reg.includes(q) ||
        dept.includes(q) ||
        sec.includes(q) ||
        yr === q
      );
    });
  }, [students, searchQuery]);

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.student.student_name;
    const reg = studentToDelete.student.register_number;

    onDeleteStudent(reg);
    setStudentToDelete(null);
    setDeleteSuccessMsg(`Student record for ${name} (${reg}) and all linked records permanently deleted.`);
    setTimeout(() => setDeleteSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold">Student Record Administration & Management</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Quickly search, inspect, or permanently remove individual student records. Deleting a student automatically removes all associated academic snapshots, risk evaluations, counselling logs, and follow-up milestones with zero orphaned data.
          </p>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 flex items-center gap-2 self-start md:self-auto">
          <Users className="w-4 h-4 text-blue-300" />
          <span>Total Records: {students.length}</span>
        </div>
      </div>

      {deleteSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{deleteSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Instant Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name (e.g. Aarav), register number (e.g. 23CS101), department (CSE), year..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {searchQuery ? (
                <>Found <strong className="text-slate-900">{filteredStudents.length}</strong> matching students</>
              ) : (
                <>Showing all <strong className="text-slate-900">{students.length}</strong> enrolled students</>
              )}
            </span>
            {searchQuery && (
              <span className="text-[11px] text-slate-400">Live search active</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List & Deletion Action Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Student Name / Reg No</th>
                <th className="px-4 py-3">Dept & Year</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">SGPA / CGPA</th>
                <th className="px-4 py-3">Backlogs</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm text-slate-700">No students found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No student record matches &quot;{searchQuery}&quot;. Try another name or register number.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr
                    key={item.student.register_number}
                    className="hover:bg-rose-50/20 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.student.student_name}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {item.student.register_number}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800">
                        {item.student.department}
                      </span>
                      <div className="text-slate-500 text-[11px]">
                        Year {item.student.year} (Sec {item.student.section})
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold">
                      <span className={item.currentAcademic.attendance_percentage < 75 ? 'text-rose-600' : 'text-emerald-700'}>
                        {item.currentAcademic.attendance_percentage.toFixed(1)}%
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-900">
                      <strong>{item.currentAcademic.sgpa.toFixed(2)}</strong>
                      <span className="text-slate-400 text-[11px]"> / {item.currentAcademic.cgpa.toFixed(2)}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={item.currentAcademic.backlog_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {item.currentAcademic.backlog_count}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge riskLevel={item.riskAssessment.risk_level} />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectStudent(item.student.register_number)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors flex items-center gap-1 border border-blue-200 text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Workspace</span>
                        </button>

                        <button
                          onClick={() => setStudentToDelete(item)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors flex items-center gap-1 border border-rose-200 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Student</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CONFIRMATION SAFETY MODAL */}
      {studentToDelete && (
        <Modal
          isOpen={Boolean(studentToDelete)}
          onClose={() => setStudentToDelete(null)}
          title="Confirm Student Record Deletion"
          subtitle="This administrative action cannot be undone."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900 text-sm">
                  Delete {studentToDelete.student.student_name} ({studentToDelete.student.register_number})?
                </p>
                <p className="text-rose-800 leading-relaxed">
                  Permanently deleting this student will automatically remove:
                </p>
                <ul className="list-disc pl-4 text-rose-700 space-y-0.5 pt-1">
                  <li>Master Student profile record</li>
                  <li>All {studentToDelete.academicHistory.length} academic snapshot evaluations</li>
                  <li>All {studentToDelete.counsellingSessions.length} historical counselling session records</li>
                  <li>All active follow-up action plan tasks</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Permanently</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
