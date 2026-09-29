'use client';

import React from 'react';
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';
import { DashboardStats } from '@/lib/storage/store';
import { CompleteStudentRecord, CounselorAssignment, DataImport, User } from '@/types';
import { store } from '@/lib/storage/store';

interface AdminDashboardViewProps {
  stats: DashboardStats;
  students: CompleteStudentRecord[];
  recentImports: DataImport[];
  onSelectStudent: (regNo: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  stats,
  students,
  recentImports,
  onSelectStudent,
  onNavigateToTab,
}) => {
  const departments = store.getDepartments();
  const years = store.getYears();
  const sections = store.getSections();
  const counselors = store.getCounselors();
  const assignments = store.getAllAssignments();
  const counsellingSessions = store.getAllCounsellingSessions();
  const auditLogs = store.getAuditLogs().slice(0, 8);

  // Calculate high risk students
  const highRiskStudents = students.filter(
    (s) =>
      s.riskAssessment.risk_level === 'CRITICAL' ||
      s.riskAssessment.risk_level === 'HIGH'
  );

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Institutional Central Command
              </span>
              <span className="text-xs text-slate-400">• Full Campus Oversight</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Institutional Admin Dashboard
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-departmental student cohort monitoring, counselor assignment capacity, and real-time risk distribution.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('admin-counselors')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Manage Counselors</span>
            </button>
            <button
              onClick={() => onNavigateToTab('upload')}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Campus CSV Ingest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Enrolled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalStudents}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>Across {departments.length} Depts & {sections.length} Sections</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">High / Critical Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {stats.highRiskCount + stats.criticalRiskCount}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium mt-1">
            <span>{stats.criticalRiskCount} Critical + {stats.highRiskCount} High</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Counselors</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{counselors.length}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>{assignments.filter((a) => a.status === 'ACTIVE').length} Section Assignments</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Improved Cohort</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.improvedStudentsCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>Verified Longitudinal Growth</span>
          </div>
        </div>
      </div>

      {/* Institutional Structure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateToTab('admin-departments')}
          className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Departments</h4>
              <p className="text-xs text-slate-500">{departments.length} configured branches</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateToTab('admin-years')}
          className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Academic Years</h4>
              <p className="text-xs text-slate-500">{years.length} Academic Batches (1-4)</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateToTab('admin-sections')}
          className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Class Sections</h4>
              <p className="text-xs text-slate-500">{sections.length} Active Sections (Max 2/sec)</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departmental Risk Matrix (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Departmental Risk Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of High/Critical risk cohorts across branches
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Students</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {departments.map((dept) => {
              const deptStudents = students.filter(
                (s) =>
                  s.student.department_id === dept.id ||
                  s.student.department.toUpperCase() === dept.code.toUpperCase()
              );
              const total = deptStudents.length;
              const critical = deptStudents.filter((s) => s.riskAssessment.risk_level === 'CRITICAL').length;
              const high = deptStudents.filter((s) => s.riskAssessment.risk_level === 'HIGH').length;
              const moderate = deptStudents.filter((s) => s.riskAssessment.risk_level === 'MODERATE').length;
              const low = deptStudents.filter((s) => s.riskAssessment.risk_level === 'LOW').length;

              const highOrCritCount = critical + high;
              const highOrCritPct = total > 0 ? Math.round((highOrCritCount / total) * 100) : 0;

              return (
                <div key={dept.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">
                        {dept.code} — {dept.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">{total} students</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          highOrCritPct > 30
                            ? 'bg-rose-100 text-rose-700'
                            : highOrCritPct > 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {highOrCritPct}% At Risk ({highOrCritCount})
                      </span>
                    </div>
                  </div>

                  {/* Progress Stack Bar */}
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    {critical > 0 && (
                      <div
                        style={{ width: `${(critical / (total || 1)) * 100}%` }}
                        className="bg-rose-600 h-full"
                        title={`Critical: ${critical}`}
                      />
                    )}
                    {high > 0 && (
                      <div
                        style={{ width: `${(high / (total || 1)) * 100}%` }}
                        className="bg-orange-500 h-full"
                        title={`High: ${high}`}
                      />
                    )}
                    {moderate > 0 && (
                      <div
                        style={{ width: `${(moderate / (total || 1)) * 100}%` }}
                        className="bg-amber-400 h-full"
                        title={`Moderate: ${moderate}`}
                      />
                    )}
                    {low > 0 && (
                      <div
                        style={{ width: `${(low / (total || 1)) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Low: ${low}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Low Risk</span>
            </div>
          </div>
        </div>

        {/* Counselor Workload Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Counselor Workload</h3>
                <p className="text-xs text-slate-500">Active assignments & student quotas</p>
              </div>
              <button
                onClick={() => onNavigateToTab('admin-counselors')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {counselors.map((c) => {
                const scope = store.getCounselorScope(c.id);
                const assignedStudents = scope ? store.getStudentsList(scope) : [];
                const highRiskInScope = assignedStudents.filter((s) => {
                  const r = store.getCompleteStudentRecord(s.register_number);
                  return (
                    r?.riskAssessment.risk_level === 'CRITICAL' ||
                    r?.riskAssessment.risk_level === 'HIGH'
                  );
                }).length;

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {scope
                          ? `${scope.department_code} • Yr ${scope.year_number} • Sec ${scope.section_name}`
                          : 'No Section Assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        {assignedStudents.length} Students
                      </span>
                      {highRiskInScope > 0 && (
                        <p className="text-[10px] text-rose-600 font-medium">
                          {highRiskInScope} High/Crit
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Section Capacity Rule:</span>
              <span className="font-semibold text-slate-700">Max 2 Counselors / Sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: High Risk Student Triage & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent High Risk Cohort */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Institutional Priority Triage
              </h3>
              <p className="text-xs text-slate-500">Students requiring active counselor intervention</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {highRiskStudents.length} Students
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {highRiskStudents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No high or critical risk students detected across the campus.
              </p>
            ) : (
              highRiskStudents.slice(0, 6).map((item) => (
                <div
                  key={item.student.register_number}
                  onClick={() => onSelectStudent(item.student.register_number)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.riskAssessment.risk_level === 'CRITICAL'
                          ? 'bg-rose-600 animate-pulse'
                          : 'bg-orange-500'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {item.student.student_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.student.register_number} • {item.student.department} Yr {item.student.year} Sec {item.student.section}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.riskAssessment.risk_level === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {item.riskAssessment.risk_level}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Att: {item.currentAcademic.attendance_percentage}% | Backlogs: {item.currentAcademic.backlog_count}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Institutional Audit Activity</h3>
                <p className="text-xs text-slate-500">Security & operational event stream</p>
              </div>
              <button
                onClick={() => onNavigateToTab('admin-audit')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Full Logs
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div>
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600">{log.username}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Audit Stream Active
            </span>
            <span>Immutable local audit trail</span>
          </div>
        </div>
      </div>
    </div>
  );
};
