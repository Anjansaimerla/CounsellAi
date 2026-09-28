'use client';

import React from 'react';
import { CompleteStudentRecord, AICounsellingBrief, ActionPlanItem } from '@/types';
import { Modal } from '../ui/Modal';
import { Printer, Download, GraduationCap, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface PrintableInterventionReportProps {
  isOpen: boolean;
  onClose: () => void;
  record: CompleteStudentRecord | null;
  aiBrief?: AICounsellingBrief | null;
  latestActionPlan?: ActionPlanItem[];
  issueIdentified?: string;
  adviceGiven?: string;
  followUpDate?: string;
}

export const PrintableInterventionReport: React.FC<PrintableInterventionReportProps> = ({
  isOpen,
  onClose,
  record,
  aiBrief,
  latestActionPlan,
  issueIdentified,
  adviceGiven,
  followUpDate,
}) => {
  if (!isOpen || !record) return null;

  const { student, currentAcademic, riskAssessment, counsellingSessions } = record;
  const activeSession = counsellingSessions.length > 0 ? counsellingSessions[0] : null;

  const displayIssue = issueIdentified || activeSession?.issue_identified || (riskAssessment.breakdown.flags.length > 0 ? riskAssessment.breakdown.flags.join('; ') : 'Academic Mentorship Review');
  const displayAdvice = adviceGiven || activeSession?.advice_given || 'Advised to maintain regular class attendance, attend faculty tutorial hours, and complete assigned coursework milestones.';
  const displayActionPlan = latestActionPlan && latestActionPlan.length > 0 ? latestActionPlan : (activeSession?.action_plan || []);
  const displayFollowUp = followUpDate || activeSession?.follow_up_date || '2026-10-15';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Student Intervention & Counselling Sheet"
      subtitle="Print-ready single-page summary for physical meetings, parent consultations, and official institutional records"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Print Button Header (Hidden on actual print) */}
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 print:hidden text-xs">
          <span className="text-slate-600 font-medium">
            Click <strong>Print / Save as PDF</strong> to generate the official institutional PDF sheet.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTAINER */}
        <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 space-y-4 text-slate-900 font-sans text-xs">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-slate-900" />
                <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                  CounsellAI Institutional Early Intervention System
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-slate-600">
                Department of Academic Mentorship & Student Development
              </p>
              <p className="text-[10px] text-slate-500">
                CONFIDENTIAL • STUDENT COUNSELLING & REMEDIAL ACTION REPORT
              </p>
            </div>
            <div className="text-right text-[11px] space-y-0.5">
              <p className="font-semibold">Report Ref: <span className="font-mono">RPT-{student.register_number}</span></p>
              <p className="text-slate-600">Date: {new Date().toLocaleDateString()}</p>
              <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] border ${
                riskAssessment.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                riskAssessment.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                riskAssessment.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {riskAssessment.risk_level} RISK ({riskAssessment.overall_score} PTS)
              </span>
            </div>
          </div>

          {/* Section 1: Student Identity */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Student Name</span>
              <strong className="text-slate-900">{student.student_name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Register Number</span>
              <strong className="font-mono text-slate-900">{student.register_number}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Department / Program</span>
              <span className="font-medium text-slate-800">{student.department} ({student.program})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Year / Sec / Sem</span>
              <span className="font-medium text-slate-800">Year {student.year} • Sec {student.section} • Sem {student.semester}</span>
            </div>
          </div>

          {/* Section 2: Academic Metrics Snapshot */}
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              1. Verified Academic Snapshot
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Attendance</span>
                <strong className={`text-sm ${currentAcademic.attendance_percentage < 75 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {currentAcademic.attendance_percentage.toFixed(1)}%
                </strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Semester SGPA</span>
                <strong className="text-sm text-slate-900">{currentAcademic.sgpa.toFixed(2)}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Cumulative CGPA</span>
                <strong className="text-sm text-slate-900">{currentAcademic.cgpa.toFixed(2)}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Standing Backlogs</span>
                <strong className={`text-sm ${currentAcademic.backlog_count > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {currentAcademic.backlog_count}
                </strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Assignment Score</span>
                <strong className="text-sm text-slate-900">
                  {currentAcademic.assignment_performance !== undefined ? `${currentAcademic.assignment_performance}%` : 'N/A'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Risk Diagnostics & Identified Concerns */}
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              2. Deterministic Risk Signals & AI Diagnostic Summary
            </h3>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
              {riskAssessment.breakdown.flags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {riskAssessment.breakdown.flags.map((flag, idx) => (
                    <span key={idx} className="font-semibold text-rose-800">
                      ⚠ {flag}
                    </span>
                  ))}
                </div>
              )}
              {aiBrief && (
                <p className="text-slate-700 leading-relaxed text-[11px] pt-1 border-t border-slate-200">
                  <strong>AI Brief Summary:</strong> {aiBrief.summary}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Confirmed Issue & Counsellor Guidance */}
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              3. Counselling Session & Counsellor Observations
            </h3>
            <div className="space-y-1.5">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block text-[10px] uppercase text-slate-500">
                  Confirmed Issue Identified:
                </span>
                <p className="text-slate-900">{displayIssue}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block text-[10px] uppercase text-slate-500">
                  Counsellor Advice / Remedial Guidance Given:
                </span>
                <p className="text-slate-900">{displayAdvice}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Agreed Structured Action Plan */}
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              4. Agreed Structured Action Plan & Milestones
            </h3>
            {displayActionPlan.length > 0 ? (
              <table className="w-full text-left border border-slate-200 rounded">
                <thead className="bg-slate-100 text-[10px] text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1.5 border-b border-slate-200">#</th>
                    <th className="p-1.5 border-b border-slate-200">Action Description</th>
                    <th className="p-1.5 border-b border-slate-200">Target / Frequency</th>
                    <th className="p-1.5 border-b border-slate-200">Responsible</th>
                    <th className="p-1.5 border-b border-slate-200">Deadline</th>
                    <th className="p-1.5 border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayActionPlan.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-1.5 font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-1.5 font-medium text-slate-900">{item.action}</td>
                      <td className="p-1.5 text-slate-700">{item.target}</td>
                      <td className="p-1.5 text-slate-700">{item.responsible_person || 'Student'}</td>
                      <td className="p-1.5 text-slate-700">{item.deadline}</td>
                      <td className="p-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          item.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.completed ? 'COMPLETED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic">No specific action items recorded yet.</p>
            )}
          </div>

          {/* Section 6: Follow-up Milestone & Signatures */}
          <div className="pt-2 border-t border-slate-300">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 mb-6">
              <span className="font-semibold text-slate-800">
                Scheduled Follow-up Date: <strong>{new Date(displayFollowUp).toLocaleDateString()}</strong>
              </span>
              <span className="text-slate-600 font-medium">
                Parent Comm Status: <strong>{activeSession?.parent_comm_status || 'NOT_REQUIRED'}</strong>
              </span>
            </div>

            {/* Official Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-4 text-center text-[10px] text-slate-600">
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-800">Student Signature</p>
                <p className="text-slate-500 mt-0.5">({student.student_name})</p>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-800">Counsellor Signature</p>
                <p className="text-slate-500 mt-0.5">({activeSession?.counsellor_name || 'Dr. S. Mehta'})</p>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-800">Head of Department (HoD)</p>
                <p className="text-slate-500 mt-0.5">Dept of {student.department}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
