'use client';

import React from 'react';
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  CalendarClock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Layers,
  UploadCloud,
} from 'lucide-react';
import { CompleteStudentRecord } from '@/types';
import { DashboardStats } from '@/lib/storage/store';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';

interface DashboardViewProps {
  stats: DashboardStats;
  students: CompleteStudentRecord[];
  onSelectStudent: (registerNumber: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  students,
  onSelectStudent,
  onNavigateToTab,
}) => {
  // Sort high and critical risk students first
  const highRiskStudents = students
    .filter(
      (s) =>
        s.riskAssessment.risk_level === 'HIGH' ||
        s.riskAssessment.risk_level === 'CRITICAL'
    )
    .sort((a, b) => b.riskAssessment.overall_score - a.riskAssessment.overall_score);

  if (stats.totalStudents === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Welcome to CounsellAI
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Upload your student academic and attendance records via CSV to immediately calculate
            deterministic risk scores, identify students needing early intervention, and generate
            AI-assisted counselling briefs.
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => onNavigateToTab('upload')}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Student CSV</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Enrolled
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {stats.totalStudents}
              </span>
              <span className="text-xs text-slate-500">students</span>
            </div>
          </CardContent>
        </Card>

        {/* Critical & High Risk */}
        <Card className="border-rose-200/80 bg-rose-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Critical / High Risk
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700">
                {stats.criticalRiskCount + stats.highRiskCount}
              </span>
              <span className="text-xs font-medium text-rose-600">
                ({(((stats.criticalRiskCount + stats.highRiskCount) / stats.totalStudents) * 100).toFixed(0)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Moderate Risk */}
        <Card className="border-amber-200/80 bg-amber-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Moderate Risk
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-800">
                {stats.moderateRiskCount}
              </span>
              <span className="text-xs font-medium text-amber-600">to monitor</span>
            </div>
          </CardContent>
        </Card>

        {/* Follow-ups Due */}
        <Card className="border-blue-200/80 bg-blue-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Follow-ups Due
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">
                {stats.followUpsDueCount}
              </span>
              <span className="text-xs text-blue-700">action items</span>
            </div>
          </CardContent>
        </Card>

        {/* Improved */}
        <Card className="border-emerald-200/80 bg-emerald-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Improved Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-800">
                {stats.improvedStudentsCount}
              </span>
              <span className="text-xs font-medium text-emerald-700">post-counselling</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: High Risk Queue & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Risk Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              action={
                <button
                  onClick={() => onNavigateToTab('students')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View All Students</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <CardTitle>Immediate Intervention Queue</CardTitle>
              <CardDescription>
                Students detected by deterministic risk engine with severe attendance, SGPA drops, or active backlogs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {highRiskStudents.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No high or critical risk students detected in the current cohort.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {highRiskStudents.slice(0, 5).map((record) => (
                    <div
                      key={record.student.register_number}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => onSelectStudent(record.student.register_number)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-900">
                            {record.student.student_name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({record.student.register_number})
                          </span>
                          <Badge riskLevel={record.riskAssessment.risk_level} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Dept: <strong className="text-slate-700">{record.student.department}</strong>
                          </span>
                          <span>
                            Att: <strong className="text-slate-700">{record.currentAcademic.attendance_percentage}%</strong>
                          </span>
                          <span>
                            SGPA: <strong className="text-slate-700">{record.currentAcademic.sgpa}</strong>
                          </span>
                          <span>
                            Backlogs: <strong className="text-slate-700">{record.currentAcademic.backlog_count}</strong>
                          </span>
                        </div>
                        {record.riskAssessment.breakdown.flags.length > 0 && (
                          <p className="text-xs text-rose-600 mt-1 truncate">
                            ⚠️ {record.riskAssessment.breakdown.flags[0]}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(record.student.register_number);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-blue-200/60"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>AI Brief</span>
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Department Overview & Risk Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Risk Matrix</CardTitle>
              <CardDescription>High/Critical cases across departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.departmentBreakdown).map(([dept, data]) => {
                const pct = data.total > 0 ? (data.highOrCritical / data.total) * 100 : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{dept}</span>
                      <span className="text-slate-500">
                        {data.highOrCritical} / {data.total} at risk ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct > 40
                            ? 'bg-rose-500'
                            : pct > 20
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Institutional Compliance Card */}
          <Card className="bg-slate-900 text-slate-200 border-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-sm text-white">
                  Early Intervention Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Risk Engine calculates flags deterministically using institutional rules. AI generates structured counselling briefs and recommended action plans. All records preserve complete audit trails.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Active Sessions: <strong>{stats.totalCounsellingSessions}</strong></span>
                <span className="text-emerald-400">Deterministic Engine Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
