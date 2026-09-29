'use client';

import React, { useState, useEffect } from 'react';
import {
  CompleteStudentRecord,
  AICounsellingBrief,
  CounsellingType,
  ParentCommStatus,
  ActionPlanItem,
  User as UserModel,
} from '@/types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  Sparkles,
  User,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckSquare,
  Square,
  Layers,
  Save,
  Check,
  AlertCircle,
  MessageSquarePlus,
  HelpCircle,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { PrintableInterventionReport } from './PrintableInterventionReport';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CompleteStudentRecord | null;
  currentUser?: UserModel | null;
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
    action_plan: ActionPlanItem[];
    follow_up_date?: string;
    parent_comm_status: ParentCommStatus;
  }) => void;
  onToggleActionItem: (sessionId: string, actionId: string, completed: boolean) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser,
  onSaveSession,
  onToggleActionItem,
}) => {
  const [aiBrief, setAiBrief] = useState<AICounsellingBrief | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [showSubjectDetails, setShowSubjectDetails] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // In-line Counselling Session Form State
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [counsellorName, setCounsellorName] = useState(currentUser?.name || 'Dr. S. Mehta');
  const [counsellingType, setCounsellingType] = useState<CounsellingType>('ACADEMIC');
  const [issueIdentified, setIssueIdentified] = useState('');
  const [counsellorObservation, setCounsellorObservation] = useState('');
  const [adviceGiven, setAdviceGiven] = useState('');
  const [parentCommStatus, setParentCommStatus] = useState<ParentCommStatus>('NOT_REQUIRED');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Default follow-up date 2 weeks ahead
  const defaultFollowUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUp);

  // Structured Action Plan List (Section 3.4 of updation.md)
  const [actionItems, setActionItems] = useState<ActionPlanItem[]>([
    {
      id: 'act_1',
      action: 'Attend all scheduled morning classes for next 2 weeks',
      target: '100% attendance',
      responsible_person: 'Student',
      deadline: defaultFollowUp,
      completed: false,
    },
    {
      id: 'act_2',
      action: 'Meet subject faculty twice per week for doubt clearing',
      target: '2 sessions / week',
      responsible_person: 'Faculty Mentor & Student',
      deadline: defaultFollowUp,
      completed: false,
    },
  ]);

  // Reset form when record changes
  useEffect(() => {
    setAiBrief(null);
    setBriefError(null);
    setSaveSuccessMsg(false);
    setFormError(null);
    if (record) {
      // Pre-fill initial suggested issue if high risk
      if (record.riskAssessment.breakdown.flags.length > 0) {
        setIssueIdentified(record.riskAssessment.breakdown.flags.join('; '));
      } else {
        setIssueIdentified('');
      }
    }
  }, [record?.student.register_number]);

  if (!record) return null;

  const { student, currentAcademic, behaviour, riskAssessment, counsellingSessions } = record;

  const handleGenerateAiBrief = async () => {
    setIsGeneratingBrief(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          academic: currentAcademic,
          risk: riskAssessment,
          behaviour,
          history: record.academicHistory,
          previousSessions: counsellingSessions,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate brief (status ${res.status})`);
      }

      const data = await res.json();
      setAiBrief(data);
    } catch (err: any) {
      console.error('Error generating AI brief:', err);
      setBriefError('Unable to reach Gemini API. Showing deterministic factual summary.');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleAddActionItem = () => {
    setActionItems([
      ...actionItems,
      {
        id: `action_${Date.now()}`,
        action: '',
        target: '',
        responsible_person: 'Student',
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
    field: keyof ActionPlanItem,
    value: any
  ) => {
    setActionItems(
      actionItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveCounsellingRecord = (e: React.FormEvent) => {
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
      setFormError('Please specify at least one action item with a clear target.');
      return;
    }

    onSaveSession({
      register_number: student.register_number,
      session_date: new Date(sessionDate).toISOString(),
      counsellor_id: currentUser?.id || 'usr_counsellor',
      counsellor_name: counsellorName,
      created_by: currentUser?.id,
      counselling_type: counsellingType,
      issue_identified: issueIdentified.trim(),
      counsellor_observation: counsellorObservation.trim(),
      advice_given: adviceGiven.trim(),
      action_plan: validActions,
      follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      parent_comm_status: parentCommStatus,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Intervention Workspace"
      subtitle={`${student.student_name} (${student.register_number}) • ${student.department} Year ${student.year} (Section ${student.section})`}
      maxWidth="4xl"
    >
      <div className="space-y-6 text-xs">
        {/* TOP IDENTITY HEADER (Section 3.1) */}
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {student.student_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">
                  {student.student_name}
                </span>
                <Badge riskLevel={riskAssessment.risk_level} />
              </div>
              <p className="text-slate-400 text-xs mt-0.5 font-mono">
                {student.register_number} | {student.department} | Year {student.year} | Sec {student.section} | Sem {student.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              Trend: <strong className="text-white">{riskAssessment.trend}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowPrintReport(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export Summary</span>
            </button>
          </div>
        </div>

        {/* 1. ACADEMIC SNAPSHOT (Section 3.1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Academic Snapshot</span>
            </span>
            <button
              onClick={() => setShowSubjectDetails(!showSubjectDetails)}
              className="text-blue-600 hover:text-blue-800 text-[11px] font-medium"
            >
              {showSubjectDetails ? 'Hide Subject Details ▲' : 'View Subject Attendance Breakdown ▼'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Attendance */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Attendance</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  currentAcademic.attendance_percentage < 60
                    ? 'text-rose-600'
                    : currentAcademic.attendance_percentage < 75
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {currentAcademic.attendance_percentage.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">Institutional min: 75%</span>
            </div>

            {/* SGPA / CGPA */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">SGPA / CGPA</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {currentAcademic.sgpa.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {currentAcademic.cgpa.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Semester {currentAcademic.semester}</span>
            </div>

            {/* Backlogs */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Standing Backlogs</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  currentAcademic.backlog_count >= 2
                    ? 'text-rose-600'
                    : currentAcademic.backlog_count === 1
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {currentAcademic.backlog_count}
              </div>
              <span className="text-[10px] text-slate-400">
                {currentAcademic.backlog_subjects?.length
                  ? currentAcademic.backlog_subjects.join(', ')
                  : 'Arrears count'}
              </span>
            </div>

            {/* Assignment & Lab */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Assignment Score</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {currentAcademic.assignment_performance !== undefined
                  ? `${currentAcademic.assignment_performance}%`
                  : 'N/A'}
              </div>
              <span className="text-[10px] text-slate-400">
                Lab Performance: {currentAcademic.lab_performance || 80}%
              </span>
            </div>
          </div>

          {/* Collapsible Subject Breakdown */}
          {showSubjectDetails && currentAcademic.subject_wise_attendance && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
              <span className="font-semibold text-slate-700 block">Subject-wise Attendance Distribution:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(currentAcademic.subject_wise_attendance).map(([sub, val]) => (
                  <div key={sub} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-800 truncate">{sub}</span>
                    <span className={`font-bold ${val < 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {val}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. RISK ANALYSIS (Section 3.1) */}
        <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Deterministic Risk Analysis</span>
            </span>
            <span className="font-mono font-bold text-rose-700 text-xs">
              Score: {riskAssessment.overall_score} pts ({riskAssessment.risk_level})
            </span>
          </div>

          {riskAssessment.breakdown.flags.length > 0 ? (
            <ul className="space-y-1 text-slate-800 font-medium">
              {riskAssessment.breakdown.flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">⚠</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-800 font-medium">
              ✓ No critical risk triggers detected in current academic period.
            </p>
          )}

          {behaviour?.academic_difficulties && (
            <p className="text-slate-600 text-[11px] pt-1 border-t border-rose-200/60">
              <strong>Reported Difficulties:</strong> {behaviour.academic_difficulties}
            </p>
          )}
        </div>

        {/* 3. AI COUNSELLING BRIEF (Section 3.1 & 3.2) */}
        <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
                AI Pre-Counselling Brief
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiBrief}
              disabled={isGeneratingBrief}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isGeneratingBrief ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Brief...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiBrief ? 'Regenerate Brief' : 'Generate AI Brief'}</span>
                </>
              )}
            </button>
          </div>

          {briefError && (
            <p className="text-rose-600 text-xs">{briefError}</p>
          )}

          {aiBrief ? (
            <div className="space-y-3 pt-2 border-t border-blue-200/60">
              {/* Summary */}
              <p className="text-slate-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-blue-100">
                {aiBrief.summary}
              </p>

              {/* Discussion Points & Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Suggested Discussion Areas
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {aiBrief.discussionPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-semibold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Suggested Open-Ended Questions
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {aiBrief.suggestedQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-semibold">Q{i + 1}:</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Possible Intervention Areas */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-semibold text-slate-700 mr-1">Possible Interventions:</span>
                {aiBrief.possibleInterventionAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px]"
                  >
                    ✓ {area}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 italic text-[11px]">
              Click &quot;Generate AI Brief&quot; to synthesize structured risk concerns and session discussion points.
            </p>
          )}
        </div>

        {/* 4. COUNSELLING SESSION & ACTION PLAN FORM (Section 3.1, 3.3, 3.4, 3.5) */}
        <form
          onSubmit={handleSaveCounsellingRecord}
          className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              <span>Conduct Counselling Session & Build Action Plan</span>
            </span>
            <span className="text-slate-500 text-[11px]">
              Counsellor: <strong>{counsellorName}</strong>
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Counselling record saved successfully! Follow-up task scheduled for{' '}
                <strong>{new Date(followUpDate).toLocaleDateString()}</strong>.
              </span>
            </div>
          )}

          {/* Row: Date & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Session Date *
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
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
          </div>

          {/* Issue Identified (Attribute 24) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Issue Identified * (Attribute 24)
            </label>
            <input
              type="text"
              value={issueIdentified}
              onChange={(e) => setIssueIdentified(e.target.value)}
              placeholder="e.g. Low attendance and difficulty understanding Mathematics III & OS"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
              required
            />
          </div>

          {/* Counsellor Observation (Attribute 25) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Counsellor Observation * (Attribute 25)
            </label>
            <textarea
              value={counsellorObservation}
              onChange={(e) => setCounsellorObservation(e.target.value)}
              rows={2}
              placeholder="e.g. Student reports difficulty understanding Mathematics III and has been missing morning 8:30 AM lectures..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
              required
            />
          </div>

          {/* Advice / Guidance (Attribute 26) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Advice / Guidance Given * (Attribute 26)
            </label>
            <textarea
              value={adviceGiven}
              onChange={(e) => setAdviceGiven(e.target.value)}
              rows={2}
              placeholder="e.g. Student advised to attend all scheduled classes, meet Mathematics faculty twice/week, and complete pending assignments..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
              required
            />
          </div>

          {/* Structured Action Plan (Section 3.4) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Action Plan Items (Attribute 27)
              </label>
              <button
                type="button"
                onClick={handleAddActionItem}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <input
                    type="text"
                    value={item.action}
                    onChange={(e) => handleUpdateActionItem(item.id, 'action', e.target.value)}
                    placeholder={`Action ${index + 1} (e.g. Attend classes)`}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                  <input
                    type="text"
                    value={item.target}
                    onChange={(e) => handleUpdateActionItem(item.id, 'target', e.target.value)}
                    placeholder="Target (e.g. 2 weeks)"
                    className="w-full sm:w-32 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                  <input
                    type="text"
                    value={item.responsible_person || 'Student'}
                    onChange={(e) =>
                      handleUpdateActionItem(item.id, 'responsible_person', e.target.value)
                    }
                    placeholder="Responsible"
                    className="w-full sm:w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 text-[11px]"
                  />
                  <input
                    type="date"
                    value={item.deadline}
                    onChange={(e) => handleUpdateActionItem(item.id, 'deadline', e.target.value)}
                    className="w-full sm:w-32 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
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

          {/* Follow-up Date (Attribute 28) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Follow-up Date * (Attribute 28)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Parent Communication Status (Attribute 30)
              </label>
              <select
                value={parentCommStatus}
                onChange={(e) => setParentCommStatus(e.target.value as ParentCommStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900"
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

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Counselling Record</span>
            </button>
          </div>
        </form>

        {/* 5. HISTORICAL SESSIONS & ACTION PLAN CHECKLIST (Section 3.4 & 3.5) */}
        {counsellingSessions.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
              Previous Counselling Sessions ({counsellingSessions.length})
            </span>
            <div className="space-y-3">
              {counsellingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between font-semibold border-b border-slate-200 pb-1.5">
                    <span className="text-slate-900">
                      {new Date(session.session_date).toLocaleDateString()} — {session.counselling_type}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      By {session.counsellor_name}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    <strong>Issue:</strong> {session.issue_identified}
                  </p>
                  <p className="text-slate-700">
                    <strong>Advice:</strong> {session.advice_given}
                  </p>

                  {/* Interactive Action Plan Items Checklist */}
                  {session.action_plan.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-slate-800 text-[11px]">
                        Action Plan Items:
                      </span>
                      {session.action_plan.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            onToggleActionItem(session.id, item.id, !item.completed)
                          }
                          className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {item.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
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
                          <span className="text-slate-400 text-[10px]">
                            Deadline: {item.deadline}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Printable Single-Page Official Intervention Summary Report */}
      <PrintableInterventionReport
        isOpen={showPrintReport}
        onClose={() => setShowPrintReport(false)}
        record={record}
        aiBrief={aiBrief}
        latestActionPlan={actionItems}
        issueIdentified={issueIdentified}
        adviceGiven={adviceGiven}
        followUpDate={followUpDate}
      />
    </Modal>
  );
};
