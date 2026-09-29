'use client';

import React, { useState, useEffect } from 'react';
import { CounsellingType, ParentCommStatus, Student, User } from '@/types';
import { Modal } from '../ui/Modal';
import { Plus, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';

interface CounsellingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentUser?: User | null;
  onSaveSession: (sessionData: {
    register_number: string;
    session_date: string;
    counsellor_id: string;
    counsellor_name: string;
    created_by?: string;
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
  currentUser,
  onSaveSession,
}) => {
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [counsellorName, setCounsellorName] = useState(currentUser?.name || 'Counselor');
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
      action: 'Attend daily tutorial clearing sessions in department',
      target: '4 sessions / week',
      deadline: defaultFollowUp,
      completed: false,
    },
  ]);

  useEffect(() => {
    if (currentUser) {
      setCounsellorName(currentUser.name);
    }
  }, [currentUser]);

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
    setActionItems(actionItems.filter((item) => item.id !== id));
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
    if (!student) return;

    // Filter valid action items
    const validActions = actionItems.filter((a) => a.action.trim().length > 0);

    onSaveSession({
      register_number: student.register_number,
      session_date: new Date(sessionDate).toISOString(),
      counsellor_id: currentUser?.id || 'usr_counsellor',
      counsellor_name: counsellorName,
      created_by: currentUser?.id,
      counselling_type: counsellingType,
      issue_identified: issueIdentified,
      counsellor_observation: counsellorObservation,
      advice_given: adviceGiven,
      action_plan: validActions,
      follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      parent_comm_status: parentCommStatus,
    });

    onClose();
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Academic Counselling Session"
      subtitle={`Student: ${student.student_name} (${student.register_number}) • ${student.department} Year ${student.year}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Row 1: Session Date, Counsellor Name, Counselling Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Counsellor Name</label>
            <input
              type="text"
              required
              value={counsellorName}
              onChange={(e) => setCounsellorName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Counselling Type</label>
            <select
              value={counsellingType}
              onChange={(e) => setCounsellingType(e.target.value as CounsellingType)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium bg-white"
            >
              <option value="ACADEMIC">ACADEMIC</option>
              <option value="ATTENDANCE">ATTENDANCE</option>
              <option value="CAREER">CAREER</option>
              <option value="BEHAVIOURAL">BEHAVIOURAL</option>
              <option value="GENERAL">GENERAL</option>
              <option value="PARENT_MEETING">PARENT_MEETING</option>
              <option value="FOLLOW_UP">FOLLOW_UP</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>

        {/* Issue Identified */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Primary Issue Identified <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={issueIdentified}
            onChange={(e) => setIssueIdentified(e.target.value)}
            placeholder="e.g. Critical drop in internal marks and morning lecture attendance in Mathematics III"
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Observation */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Counsellor Observation & Root Cause Notes
          </label>
          <textarea
            rows={2}
            value={counsellorObservation}
            onChange={(e) => setCounsellorObservation(e.target.value)}
            placeholder="e.g. Student expresses difficulty understanding recursion concepts and commutes 2 hours daily."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Guidance / Advice Given */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Advice / Intervention Guidance Provided <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={adviceGiven}
            onChange={(e) => setAdviceGiven(e.target.value)}
            placeholder="e.g. Instructed to attend departmental remedial hour on Mondays & Thursdays, meet faculty advisor."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Plan Builder (Section 12 & 13 of newupdation.md) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs">
              Structured Action Plan & Milestones
            </span>
            <button
              type="button"
              onClick={handleAddActionItem}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 bg-white p-2 rounded border border-slate-200 items-center"
              >
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    placeholder={`Action ${index + 1} (e.g. Complete 5 practice problem sets)`}
                    value={item.action}
                    onChange={(e) => handleUpdateActionItem(item.id, 'action', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Target (e.g. 80% mark)"
                    value={item.target}
                    onChange={(e) => handleUpdateActionItem(item.id, 'target', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="date"
                    value={item.deadline}
                    onChange={(e) => handleUpdateActionItem(item.id, 'deadline', e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px]"
                  />
                </div>
                <div className="col-span-1 text-right">
                  {actionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Follow-up Date (Section 13) & Parent Communication */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
          <div>
            <label className="block font-semibold text-blue-950 mb-1">
              Automated Follow-up Review Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <span className="text-[10px] text-blue-700 mt-1 block">
              Auto-schedules a milestone in the follow-up queue.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-blue-950 mb-1">Parent Communication</label>
            <select
              value={parentCommStatus}
              onChange={(e) => setParentCommStatus(e.target.value as ParentCommStatus)}
              className="w-full px-3 py-1.5 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="NOT_REQUIRED">Not Required</option>
              <option value="PENDING_APPROVAL">Pending Departmental Notice</option>
              <option value="CONTACTED">Parent Contacted via Phone/Email</option>
              <option value="UNABLE_TO_CONTACT">Unable to Contact</option>
              <option value="COMPLETED">Parent In-Person Meeting Held</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
          >
            Save Record & Schedule Follow-up
          </button>
        </div>
      </form>
    </Modal>
  );
};
