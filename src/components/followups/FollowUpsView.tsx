'use client';

import React, { useState } from 'react';
import {
  FollowUpItem,
  FollowUpStatus,
  ImprovementStatus,
  ActionPlanItem,
} from '@/types';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Modal } from '../ui/Modal';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  CheckSquare,
  Square,
  FileEdit,
  Save,
  Check,
} from 'lucide-react';

interface FollowUpsViewProps {
  followUps: FollowUpItem[];
  onUpdateStatus: (followUpId: string, status: FollowUpStatus, notes?: string) => void;
  onConductFollowUpReview: (params: {
    followUpId: string;
    status: FollowUpStatus;
    improvementStatus?: ImprovementStatus;
    notes?: string;
    actionPlan?: ActionPlanItem[];
  }) => void;
  onSelectStudent: (registerNumber: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  followUps,
  onUpdateStatus,
  onConductFollowUpReview,
  onSelectStudent,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DUE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviewItem, setSelectedReviewItem] = useState<FollowUpItem | null>(null);

  // Review Form State (Section 3.6 of updation.md)
  const [reviewStatus, setReviewStatus] = useState<FollowUpStatus>('COMPLETED');
  const [improvementStatus, setImprovementStatus] = useState<ImprovementStatus>('IMPROVED');
  const [counsellorNotes, setCounsellorNotes] = useState('');
  const [actionPlanList, setActionPlanList] = useState<ActionPlanItem[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const handleOpenReview = (item: FollowUpItem) => {
    setSelectedReviewItem(item);
    setReviewStatus(item.status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED');
    setImprovementStatus(item.improvement_status || 'IMPROVED');
    setCounsellorNotes(item.notes || '');
    setActionPlanList(item.action_plan_items ? [...item.action_plan_items] : []);
  };

  const handleTogglePlanItem = (id: string) => {
    setActionPlanList(
      actionPlanList.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewItem) return;

    onConductFollowUpReview({
      followUpId: selectedReviewItem.id,
      status: reviewStatus,
      improvementStatus: improvementStatus,
      notes: counsellorNotes.trim(),
      actionPlan: actionPlanList,
    });

    setSelectedReviewItem(null);
  };

  const filteredFollowUps = followUps.filter((item) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.student_name.toLowerCase().includes(q);
      const matchReg = item.register_number.toLowerCase().includes(q);
      const matchIssue = item.issue_identified.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchIssue) return false;
    }

    // Filter Tab
    if (activeFilter === 'DUE') {
      return item.status === 'PENDING' && item.follow_up_date <= today;
    }
    if (activeFilter === 'UPCOMING') {
      return item.status === 'PENDING' && item.follow_up_date > today;
    }
    if (activeFilter === 'COMPLETED') {
      return item.status === 'COMPLETED';
    }
    return true;
  });

  const dueCount = followUps.filter(
    (f) => f.status === 'PENDING' && f.follow_up_date <= today
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search follow-ups by student name, register number, issue..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({followUps.length})
              </button>
              <button
                onClick={() => setActiveFilter('DUE')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  activeFilter === 'DUE'
                    ? 'bg-rose-50 text-rose-800 font-semibold shadow-sm border border-rose-200'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span>Due / Overdue</span>
                {dueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                    {dueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'UPCOMING'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'COMPLETED'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up List */}
      <div className="space-y-3">
        {filteredFollowUps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-500">
              No follow-ups found in this filter category.
            </CardContent>
          </Card>
        ) : (
          filteredFollowUps.map((item) => {
            const isDue = item.status === 'PENDING' && item.follow_up_date <= today;

            return (
              <Card
                key={item.id}
                className={`transition-all hover:border-blue-300 ${
                  isDue ? 'border-rose-200 bg-rose-50/10' : ''
                }`}
              >
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                  {/* Left Info (Section 3.6 of updation.md) */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {item.student_name}
                      </span>
                      <span className="font-mono text-slate-500 text-xs">
                        ({item.register_number})
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">
                        {item.department} Year {item.year}
                      </span>
                      {item.previous_risk_level && (
                        <Badge riskLevel={item.previous_risk_level} />
                      )}
                      <Badge status={isDue ? 'DUE' : item.status} />
                    </div>

                    <p className="text-slate-700 font-medium">
                      Identified Issue:{' '}
                      <span className="text-slate-900">{item.issue_identified}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] pt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Follow-up Date:{' '}
                        {new Date(item.follow_up_date).toLocaleDateString()}
                      </span>
                      {item.previous_attendance !== undefined && (
                        <span>
                          Baseline Attendance:{' '}
                          <strong className="text-slate-800">
                            {item.previous_attendance}%
                          </strong>
                        </span>
                      )}
                      {item.previous_sgpa !== undefined && (
                        <span>
                          Baseline SGPA:{' '}
                          <strong className="text-slate-800">
                            {item.previous_sgpa}
                          </strong>
                        </span>
                      )}
                      <span>
                        Action Plan:{' '}
                        <strong className="text-slate-800">
                          {item.completed_actions_count} / {item.action_plan_count} items
                        </strong>
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">
                        <strong>Counsellor Follow-up Note:</strong> {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Actions (Section 3.6 of updation.md) */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onSelectStudent(item.register_number)}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-1 border border-slate-200"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => handleOpenReview(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Conduct Follow-up Session</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CONDUCT FOLLOW-UP REVIEW MODAL (Section 3.6 of updation.md) */}
      {selectedReviewItem && (
        <Modal
          isOpen={Boolean(selectedReviewItem)}
          onClose={() => setSelectedReviewItem(null)}
          title={`Follow-up Session: ${selectedReviewItem.student_name}`}
          subtitle={`${selectedReviewItem.register_number} • ${selectedReviewItem.department} Year ${selectedReviewItem.year}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
            {/* Baseline Snapshot Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">
                  Previous Risk
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedReviewItem.previous_risk_level || 'HIGH'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">
                  Previous Attendance
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedReviewItem.previous_attendance !== undefined
                    ? `${selectedReviewItem.previous_attendance}%`
                    : '56.5%'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">
                  Previous SGPA
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedReviewItem.previous_sgpa !== undefined
                    ? selectedReviewItem.previous_sgpa
                    : '5.40'}
                </span>
              </div>
            </div>

            {/* Action Plan Checklist */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">
                Action Plan Milestone Verification:
              </span>
              {actionPlanList.length > 0 ? (
                <div className="space-y-1.5">
                  {actionPlanList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePlanItem(item.id)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={
                            item.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 font-medium'
                          }
                        >
                          {item.action} ({item.target})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Target: {item.deadline}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No action items attached.</p>
              )}
            </div>

            {/* Follow-up Status (Attribute 29) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Follow-up Status (Attribute 29) *
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as FollowUpStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending / In-Progress</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="MISSED">Missed</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Student Improvement Status (Attribute 31) *
                </label>
                <select
                  value={improvementStatus}
                  onChange={(e) =>
                    setImprovementStatus(e.target.value as ImprovementStatus)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                >
                  <option value="IMPROVED">Improved</option>
                  <option value="PARTIALLY_IMPROVED">Partially Improved</option>
                  <option value="NO_SIGNIFICANT_IMPROVEMENT">No Significant Change</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
            </div>

            {/* Counsellor Follow-up Notes */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Counsellor Follow-up Notes & Observation *
              </label>
              <textarea
                value={counsellorNotes}
                onChange={(e) => setCounsellorNotes(e.target.value)}
                rows={3}
                placeholder="Document student's progress against action plan, attendance consistency, and next steps..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedReviewItem(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Follow-up Review</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
