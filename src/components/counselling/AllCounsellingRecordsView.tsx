'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import { CounsellingSession, CounselorScope, User as UserModel } from '@/types';
import { store } from '@/lib/storage/store';

interface AllCounsellingRecordsViewProps {
  currentUser: UserModel;
  scope?: CounselorScope | null;
  onSelectStudent: (regNo: string) => void;
}

export const AllCounsellingRecordsView: React.FC<AllCounsellingRecordsViewProps> = ({
  currentUser,
  scope,
  onSelectStudent,
}) => {
  const sessions = store.getAllCounsellingSessions(scope);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredSessions = sessions.filter((s) => {
    const student = store.getStudent(s.register_number);
    const matchesSearch =
      s.register_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student && student.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.counsellor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.issue_identified.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || s.counselling_type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Intervention Records
            </span>
            <span className="text-xs text-slate-400">
              • {currentUser.role === 'ADMIN' ? 'Institution-Wide Master Repository' : `${scope?.department_code} • Year ${scope?.year_number} • Sec ${scope?.section_name}`}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Counselling Session Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserving counselor authorship, guidance, action plans, and automated follow-up milestones.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>{sessions.length} Recorded Sessions</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, counselor, or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Counselling Types</option>
            <option value="ACADEMIC">ACADEMIC</option>
            <option value="ATTENDANCE">ATTENDANCE</option>
            <option value="CAREER">CAREER</option>
            <option value="BEHAVIOURAL">BEHAVIOURAL</option>
            <option value="PARENT_MEETING">PARENT_MEETING</option>
            <option value="FOLLOW_UP">FOLLOW_UP</option>
          </select>
        </div>
      </div>

      {/* Sessions Feed */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
            No counselling records found.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const student = store.getStudent(session.register_number);

            return (
              <div
                key={session.id}
                onClick={() => onSelectStudent(session.register_number)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-900 text-sm">
                      {student?.student_name || 'Student'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({session.register_number})
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-100 text-blue-800">
                      {session.counselling_type}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      • {student?.department} Yr {student?.year} Sec {student?.section}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-2">
                    <strong className="text-slate-900">Issue:</strong> {session.issue_identified}
                  </p>

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    <strong className="text-slate-700">Observation:</strong> {session.counsellor_observation}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      Conducted by: <strong className="text-slate-700">{session.counsellor_name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(session.session_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {session.action_plan.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 font-medium">
                          {session.action_plan.filter((a) => a.completed).length} / {session.action_plan.length} Actions Done
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {session.follow_up_date && (
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[10px]">Follow-up Target</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(session.follow_up_date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
