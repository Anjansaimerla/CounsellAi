'use client';

import React, { useState } from 'react';
import { ImprovementComparison } from '@/types';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Modal } from '../ui/Modal';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ImprovementViewProps {
  comparisons: ImprovementComparison[];
  onSelectStudent: (registerNumber: string) => void;
  onLoadUpdateDataset: () => void;
  totalStudentsCount: number;
}

export const ImprovementView: React.FC<ImprovementViewProps> = ({
  comparisons,
  onSelectStudent,
  onLoadUpdateDataset,
  totalStudentsCount,
}) => {
  const [selectedComparison, setSelectedComparison] = useState<ImprovementComparison | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const handleOpenAiSummary = async (comp: ImprovementComparison) => {
    setSelectedComparison(comp);
    setAiSummary(null);
    setIsLoadingSummary(true);

    try {
      const res = await fetch('/api/ai/improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comp),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        throw new Error('Summary fetch failed');
      }
    } catch {
      // Deterministic calculation summary
      const attChange =
        comp.attendance_diff >= 0
          ? `+${comp.attendance_diff.toFixed(1)}%`
          : `${comp.attendance_diff.toFixed(1)}%`;
      const sgpaChange =
        comp.sgpa_diff >= 0
          ? `+${comp.sgpa_diff.toFixed(2)}`
          : `${comp.sgpa_diff.toFixed(2)}`;
      const backlogCleared = comp.backlog_diff < 0 ? `cleared ${Math.abs(comp.backlog_diff)} backlog(s)` : 'maintained backlogs';

      setAiSummary(
        `Following counselling intervention, ${comp.student_name} achieved an attendance shift of ${attChange} (${comp.baselineSnapshot.attendance_percentage}% → ${comp.latestSnapshot.attendance_percentage}%), SGPA change of ${sgpaChange} (${comp.baselineSnapshot.sgpa} → ${comp.latestSnapshot.sgpa}), and ${backlogCleared}. Overall status: ${comp.status.replace(/_/g, ' ')}.`
      );
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const improvedCount = comparisons.filter(
    (c) => c.status === 'IMPROVED' || c.status === 'PARTIALLY_IMPROVED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Longitudinal Student Improvement Tracking</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Compares academic records across versioned data snapshots. Evaluates attendance recovery, SGPA progression, and backlog clearance post-counselling.
          </p>
        </div>

        {comparisons.length > 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {improvedCount} of {comparisons.length} evaluated students showing positive recovery
            </span>
          </div>
        ) : (
          <button
            onClick={onLoadUpdateDataset}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Follow-up Data Snapshot (Step 12-14)</span>
          </button>
        )}
      </div>

      {comparisons.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              No Snapshot Comparison Available Yet
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Improvement tracking requires at least two snapshots (e.g. Mid-Term 1 Baseline and Mid-Term 2 Follow-Up).
              Click below to load the second comparison dataset and immediately see measurable before-and-after results.
            </p>
            <button
              onClick={onLoadUpdateDataset}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Follow-up Update Dataset</span>
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Snapshot Comparison</CardTitle>
            <CardDescription>
              Baseline Snapshot: &quot;{comparisons[0]?.baselineSnapshot.snapshot_label}&quot; vs. Latest Snapshot: &quot;{comparisons[0]?.latestSnapshot.snapshot_label}&quot;
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Student / Reg No</th>
                  <th className="px-4 py-3">Attendance (Before → After)</th>
                  <th className="px-4 py-3">SGPA (Before → After)</th>
                  <th className="px-4 py-3">Backlogs (Before → After)</th>
                  <th className="px-4 py-3">Assignments</th>
                  <th className="px-4 py-3">Evaluated Status</th>
                  <th className="px-4 py-3 text-right">AI Outcome Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisons.map((comp) => {
                  const attDiff = comp.attendance_diff;
                  const sgpaDiff = comp.sgpa_diff;
                  const backlogDiff = comp.backlog_diff;

                  return (
                    <tr
                      key={comp.register_number}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{comp.student_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {comp.register_number} • {comp.department}
                        </div>
                      </td>

                      {/* Attendance Diff */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-slate-500">
                            {comp.baselineSnapshot.attendance_percentage}%
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">
                            {comp.latestSnapshot.attendance_percentage}%
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                              attDiff >= 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {attDiff >= 0 ? `+${attDiff.toFixed(1)}%` : `${attDiff.toFixed(1)}%`}
                          </span>
                        </div>
                      </td>

                      {/* SGPA Diff */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-slate-500">{comp.baselineSnapshot.sgpa}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">{comp.latestSnapshot.sgpa}</span>
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                              sgpaDiff >= 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sgpaDiff >= 0 ? `+${sgpaDiff.toFixed(2)}` : `${sgpaDiff.toFixed(2)}`}
                          </span>
                        </div>
                      </td>

                      {/* Backlog Diff */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-slate-500">
                            {comp.baselineSnapshot.backlog_count}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">
                            {comp.latestSnapshot.backlog_count}
                          </span>
                          {backlogDiff < 0 && (
                            <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                              Cleared {Math.abs(backlogDiff)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assignment Diff */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span>{comp.baselineSnapshot.assignment_performance || 0}%</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">
                            {comp.latestSnapshot.assignment_performance || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <Badge improvement={comp.status} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenAiSummary(comp)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors flex items-center gap-1 ml-auto border border-blue-200 text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Outcome Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* AI Outcome Report Modal */}
      {selectedComparison && (
        <Modal
          isOpen={Boolean(selectedComparison)}
          onClose={() => setSelectedComparison(null)}
          title={`Intervention Outcome Analysis: ${selectedComparison.student_name}`}
          subtitle={`${selectedComparison.register_number} • ${selectedComparison.department}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {isLoadingSummary ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600">Generating comparative outcome summary...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1 font-medium">
                      Baseline ({selectedComparison.baselineSnapshot.snapshot_label})
                    </span>
                    <p className="text-slate-800">
                      Attendance: <strong>{selectedComparison.baselineSnapshot.attendance_percentage}%</strong>
                    </p>
                    <p className="text-slate-800">
                      SGPA: <strong>{selectedComparison.baselineSnapshot.sgpa}</strong>
                    </p>
                    <p className="text-slate-800">
                      Backlogs: <strong>{selectedComparison.baselineSnapshot.backlog_count}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <span className="text-emerald-800 block mb-1 font-semibold">
                      Follow-up ({selectedComparison.latestSnapshot.snapshot_label})
                    </span>
                    <p className="text-slate-900">
                      Attendance: <strong>{selectedComparison.latestSnapshot.attendance_percentage}%</strong>
                    </p>
                    <p className="text-slate-900">
                      SGPA: <strong>{selectedComparison.latestSnapshot.sgpa}</strong>
                    </p>
                    <p className="text-slate-900">
                      Backlogs: <strong>{selectedComparison.latestSnapshot.backlog_count}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
                      AI-Assisted Progress Assessment
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed pt-1">{aiSummary}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-slate-500 text-[11px]">
                  <span>Evaluated Status: <Badge improvement={selectedComparison.status} /></span>
                  <button
                    onClick={() => {
                      onSelectStudent(selectedComparison.register_number);
                      setSelectedComparison(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Open Student Profile →
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
