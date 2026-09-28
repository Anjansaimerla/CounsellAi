'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquarePlus,
  SlidersHorizontal,
} from 'lucide-react';
import { CompleteStudentRecord, RiskLevel } from '@/types';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';

interface StudentsTableViewProps {
  students: CompleteStudentRecord[];
  onSelectStudent: (registerNumber: string) => void;
  onOpenCounsellingModal: (registerNumber: string) => void;
}

export const StudentsTableView: React.FC<StudentsTableViewProps> = ({
  students,
  onSelectStudent,
  onOpenCounsellingModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [filterLowAttendance, setFilterLowAttendance] = useState(false);
  const [filterHasBacklogs, setFilterHasBacklogs] = useState(false);
  const [sortBy, setSortBy] = useState<'risk' | 'attendance' | 'sgpa' | 'name'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique departments & years
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.student.department) set.add(s.student.department);
    });
    return Array.from(set).sort();
  }, [students]);

  const years = useMemo(() => {
    const set = new Set<number>();
    students.forEach((s) => {
      if (s.student.year) set.add(s.student.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [students]);

  // Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    return students
      .filter((record) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchName = record.student.student_name.toLowerCase().includes(q);
          const matchReg = record.student.register_number.toLowerCase().includes(q);
          const matchDept = record.student.department.toLowerCase().includes(q);
          if (!matchName && !matchReg && !matchDept) return false;
        }

        // Dept
        if (selectedDept !== 'ALL' && record.student.department !== selectedDept) {
          return false;
        }

        // Year
        if (selectedYear !== 'ALL' && record.student.year.toString() !== selectedYear) {
          return false;
        }

        // Risk Level
        if (selectedRisk !== 'ALL' && record.riskAssessment.risk_level !== selectedRisk) {
          return false;
        }

        // Low Attendance (< 75%)
        if (filterLowAttendance && record.currentAcademic.attendance_percentage >= 75) {
          return false;
        }

        // Has Backlogs
        if (filterHasBacklogs && record.currentAcademic.backlog_count === 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'risk') {
          diff = a.riskAssessment.overall_score - b.riskAssessment.overall_score;
        } else if (sortBy === 'attendance') {
          diff = a.currentAcademic.attendance_percentage - b.currentAcademic.attendance_percentage;
        } else if (sortBy === 'sgpa') {
          diff = a.currentAcademic.sgpa - b.currentAcademic.sgpa;
        } else if (sortBy === 'name') {
          diff = a.student.student_name.localeCompare(b.student.student_name);
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [
    students,
    searchQuery,
    selectedDept,
    selectedYear,
    selectedRisk,
    filterLowAttendance,
    filterHasBacklogs,
    sortBy,
    sortOrder,
  ]);

  const toggleSort = (field: 'risk' | 'attendance' | 'sgpa' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, register number (e.g. 23CS101)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Department */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Year */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    Year {y}
                  </option>
                ))}
              </select>

              {/* Risk Level */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Quick Toggle Checkbox Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={filterLowAttendance}
                  onChange={(e) => setFilterLowAttendance(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Attendance &lt; 75% Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={filterHasBacklogs}
                  onChange={(e) => setFilterHasBacklogs(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Active Backlogs Only</span>
              </label>
            </div>

            <div className="text-slate-500">
              Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
              {students.length} students
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Student / Register No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Dept / Year</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('attendance')}
                >
                  <div className="flex items-center gap-1">
                    <span>Attendance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('sgpa')}
                >
                  <div className="flex items-center gap-1">
                    <span>SGPA / CGPA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Backlogs</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('risk')}
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level & Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No students match the current search query or filter selection.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((record) => {
                  const att = record.currentAcademic.attendance_percentage;
                  const backlogs = record.currentAcademic.backlog_count;
                  const trend = record.riskAssessment.trend;

                  return (
                    <tr
                      key={record.student.register_number}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => onSelectStudent(record.student.register_number)}
                    >
                      {/* Name & Reg */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 text-sm">
                          {record.student.student_name}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {record.student.register_number}
                        </div>
                      </td>

                      {/* Dept & Year */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">
                          {record.student.department}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Year {record.student.year} • Sec {record.student.section}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="px-4 py-3.5">
                        <div
                          className={`font-semibold ${
                            att < 60
                              ? 'text-rose-600'
                              : att < 75
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {att.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {att < 75 ? 'Threshold deficit' : 'Satisfactory'}
                        </div>
                      </td>

                      {/* SGPA & CGPA */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {record.currentAcademic.sgpa.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          CGPA: {record.currentAcademic.cgpa.toFixed(2)}
                        </div>
                      </td>

                      {/* Backlogs */}
                      <td className="px-4 py-3.5">
                        <div
                          className={`font-semibold ${
                            backlogs >= 2
                              ? 'text-rose-600'
                              : backlogs === 1
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {backlogs} {backlogs === 1 ? 'subject' : 'subjects'}
                        </div>
                        {record.currentAcademic.backlog_subjects &&
                          record.currentAcademic.backlog_subjects.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {record.currentAcademic.backlog_subjects.join(', ')}
                            </div>
                          )}
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge riskLevel={record.riskAssessment.risk_level} />
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({record.riskAssessment.overall_score} pts)
                          </span>
                        </div>
                      </td>

                      {/* Trend */}
                      <td className="px-4 py-3.5">
                        {trend === 'IMPROVING' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            Improving
                          </span>
                        ) : trend === 'DECLINING' ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-[11px]">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            Declining
                          </span>
                        ) : trend === 'STABLE' ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-[11px]">
                            <Minus className="w-3.5 h-3.5 text-slate-400" />
                            Stable
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Baseline</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectStudent(record.student.register_number)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Open Profile & AI Brief"
                          >
                            <Sparkles className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => onOpenCounsellingModal(record.student.register_number)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Conduct Counselling Session"
                          >
                            <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
