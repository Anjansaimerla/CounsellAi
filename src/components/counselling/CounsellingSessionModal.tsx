'use client';

import React, { useState } from 'react';
import { CounsellingType, ParentCommStatus, Student } from '@/types';
import { Modal } from '../ui/Modal';
import { Plus, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';

interface CounsellingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSaveSession: (sessionData: {
    register_number: string;
    session_date: string;
    counsellor_id: string;
    counsellor_name: string;
    counselling_type: CounsellingType;
    issue_identified: string;
    counsellor_observation: string;
    advice_given: string;
    action_plan: { id: string; action: string; target: string; deadline: string; completed: boolean }[];
    follow_up_date?: string;
    parent_comm_status: ParentCommStatus;
  }) => void;
}

export const CounsellingSessionModal: React.FC<CounsellingSessionModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveSession,
}) => {
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [counsellorName, setCounsellorName] = useState('Dr. S. Mehta');
  const [counsellingType, setCounsellingType] = useState<CounsellingType>('ACADEMIC');
  const [issueIdentified, setIssueIdentified] = useState('');
  const [counsellorObservation, setCounsellorObservation] = useState('');
  const [adviceGiven, setAdviceGiven] = useState('');
  const [parentCommStatus, setParentCommStatus] = useState<ParentCommStatus>('NOT_REQUIRED');

  // Default follow-up 2 weeks out
  const defaultFollowUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUp);

  // Dynamic Action Plan Builder
  const [actionItems, setActionItems] = useState<
    { id: string; action: string; target: string; deadline: string; completed: boolean }[]
  >([
    {
      id: 'action_1',
      action: 'Attend daily doubt clearing session in departmental lab',
      target: '4 sessions / week',
      deadline: defaultFollowUp,
      completed: false,
    },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  if (!student) return null;

  const handleAddActionItem = () => {
    setActionItems([
      ...actionItems,
      {
        id: `action_${Date.now()}`,
        action: '',
        target: '',
        deadline: followUpDate || defaultFollowUp,
        completed: false,
      },
    ]);
  };

  const handleRemoveActionItem = (id: string) => {
    if (actionItems.length === 1) return;
    setActionItems(actionItems.filter((a) => a.id !== id));
  };

  const handleUpdateActionItem = (
    id: string,
    field: 'action' | 'target' | 'deadline',
    value: string
  ) => {
    setActionItems(
      actionItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!issueIdentified.trim()) {
      setFormError('Please enter the confirmed issue identified during the session.');
      return;
    }
    if (!counsellorObservation.trim()) {
      setFormError('Please enter counsellor observations.');
      return;
    }
    if (!adviceGiven.trim()) {
      setFormError('Please enter the guidance and advice given.');
      return;
    }

    const validActions = actionItems.filter((a) => a.action.trim() && a.target.trim());
    if (validActions.length === 0) {
      setFormError('Please specify at least one actionable milestone in the action plan.');
      return;
    }

    onSaveSession({
      register_number: student.register_number,
      session_date: new Date(sessionDate).toISOString(),
      counsellor_id: 'counsellor_1',
      counsellor_name: counsellorName,
      counselling_type: counsellingType,
      issue_identified: issueIdentified.trim(),
      counsellor_observation: counsellorObservation.trim(),
      advice_given: adviceGiven.trim(),
      action_plan: validActions,
      follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      parent_comm_status: parentCommStatus,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Counselling Session"
      subtitle={`Student: ${student.student_name} (${student.register_number}) • ${student.department}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Row 1: Date, Type, Counsellor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Session Date *
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Counselling Type *
            </label>
            <select
              value={counsellingType}
              onChange={(e) => setCounsellingType(e.target.value as CounsellingType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
            >
              <option value="ACADEMIC">Academic Intervention</option>
              <option value="ATTENDANCE">Attendance Shortage</option>
              <option value="BEHAVIOURAL">Behavioural & Classroom</option>
              <option value="CAREER">Career & Placement</option>
              <option value="PARENT_MEETING">Parent Consultation</option>
              <option value="FOLLOW_UP">Follow-up Review</option>
              <option value="GENERAL">General Counselling</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Counsellor Name *
            </label>
            <input
              type="text"
              value={counsellorName}
              onChange={(e) => setCounsellorName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Issue Identified */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Confirmed Issue Identified *
          </label>
          <input
            type="text"
            value={issueIdentified}
            onChange={(e) => setIssueIdentified(e.target.value)}
            placeholder="e.g. Backlog in Mathematics III and severe morning session attendance deficit"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
            required
          />
        </div>

        {/* Observation */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Counsellor Observation *
          </label>
          <textarea
            value={counsellorObservation}
            onChange={(e) => setCounsellorObservation(e.target.value)}
            rows={2}
            placeholder="Document student's feedback, attitude, explanation, and engagement..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
            required
          />
        </div>

        {/* Advice Given */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Advice / Guidance Given *
          </label>
          <textarea
            value={adviceGiven}
            onChange={(e) => setAdviceGiven(e.target.value)}
            rows={2}
            placeholder="Document specific study strategy, attendance targets, and remedial steps agreed upon..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
            required
          />
        </div>

        {/* Action Plan Builder */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800">
              Structured Action Plan Items *
            </label>
            <button
              type="button"
              onClick={handleAddActionItem}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  type="text"
                  value={item.action}
                  onChange={(e) => handleUpdateActionItem(item.id, 'action', e.target.value)}
                  placeholder={`Action ${index + 1} (e.g. Attend tutorial)`}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 text-xs"
                />
                <input
                  type="text"
                  value={item.target}
                  onChange={(e) => handleUpdateActionItem(item.id, 'target', e.target.value)}
                  placeholder="Target (e.g. 2 hrs/day)"
                  className="w-full sm:w-36 px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 text-xs"
                />
                <input
                  type="date"
                  value={item.deadline}
                  onChange={(e) => handleUpdateActionItem(item.id, 'deadline', e.target.value)}
                  className="w-full sm:w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveActionItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 self-end sm:self-center"
                  disabled={actionItems.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up & Parent Communication */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Scheduled Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Parent Communication Status
            </label>
            <select
              value={parentCommStatus}
              onChange={(e) => setParentCommStatus(e.target.value as ParentCommStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="NOT_REQUIRED">Not Required</option>
              <option value="PENDING_APPROVAL">Pending Department Approval</option>
              <option value="APPROVED">Approved for Contact</option>
              <option value="CONTACTED">Parent Contacted</option>
              <option value="UNABLE_TO_CONTACT">Unable to Reach</option>
              <option value="COMPLETED">Parent Meeting Completed</option>
            </select>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Counselling Record</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
