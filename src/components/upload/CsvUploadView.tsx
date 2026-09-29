'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  parseAndValidateStudentCsv,
  generateCsvTemplate,
  CsvParseResult,
} from '@/lib/csv/csv-parser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CounselorScope, DataImport, User } from '@/types';

interface CsvUploadViewProps {
  onImportSuccess: (result: CsvParseResult, snapshotLabel: string, filename: string) => void;
  recentImports: DataImport[];
  onNavigateToStudents: () => void;
  currentUser: User;
  scope?: CounselorScope | null;
}

export const CsvUploadView: React.FC<CsvUploadViewProps> = ({
  onImportSuccess,
  recentImports,
  onNavigateToStudents,
  currentUser,
  scope,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState('Mid-Term 1');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCounselor = currentUser.role === 'COUNSELLOR';

  const processCsvText = (text: string, filename: string) => {
    setIsProcessing(true);
    setImportDone(false);
    setServerError(null);
    try {
      const result = parseAndValidateStudentCsv(text, snapshotLabel, scope);
      setParseResult(result);
    } catch (err: any) {
      console.error('CSV parse exception:', err);
      setServerError(err.message || 'Error processing CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateCsvTemplate(scope);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      scope
        ? `counsellai_${scope.department_code}_Y${scope.year_number}_Sec${scope.section_name}_template.csv`
        : 'counsellai_campus_student_template.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitImport = () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;
    if (isCounselor && parseResult.errors.length > 0) return; // Block import if scope violations exist

    const filename = selectedFile?.name || 'student_cohort_import.csv';
    onImportSuccess(parseResult, snapshotLabel, filename);
    setImportDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sample Buttons */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Student Data Ingestion Engine</h2>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isCounselor
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}
            >
              {isCounselor ? 'Scoped Counselor Ingest' : 'Campus-Wide Ingest'}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            {isCounselor && scope ? (
              <>
                Your uploads are strictly restricted to your authorized scope:{' '}
                <strong className="text-white">
                  {scope.department_code} • Year {scope.year_number} • Section {scope.section_name}
                </strong>
                . Any records outside this scope will block the import.
              </>
            ) : (
              'Institutional Administrator mode. Cross-departmental records and all sections can be imported.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Tailored Template</span>
          </button>
        </div>
      </div>

      {/* Main Upload Box & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dropzone & Import Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Student CSV</CardTitle>
              <CardDescription>
                {isCounselor && scope
                  ? `Strict scope enforcement active for ${scope.department_code} Year ${scope.year_number} Section ${scope.section_name}`
                  : 'Institution-wide multi-section CSV ingestion'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Snapshot Label Input */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Snapshot Label / Term:</span>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="e.g. Mid-Term 1 (Sep 2026)"
                  className="w-full sm:w-64 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to select file or drag & drop CSV here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Required columns: register_number, student_name, department, year, section, attendance_percentage, sgpa, backlog_count
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Validation & Preview Section */}
          {parseResult && (
            <Card className="border-slate-200">
              <CardHeader
                action={
                  parseResult.validStudents.length > 0 &&
                  !importDone &&
                  (isCounselor ? parseResult.errors.length === 0 : true) ? (
                    <button
                      onClick={handleCommitImport}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Commit Import ({parseResult.validStudents.length} Records)
                      </span>
                    </button>
                  ) : null
                }
              >
                <CardTitle>Validation & Authorization Preview</CardTitle>
                <CardDescription>
                  {parseResult.validStudents.length} compliant records •{' '}
                  {parseResult.errors.length} errors/scope violations flagged
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {importDone && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span>
                        Successfully imported {parseResult.validStudents.length} student records into snapshot &quot;{snapshotLabel}&quot;!
                      </span>
                    </div>
                    <button
                      onClick={onNavigateToStudents}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <span>View Students & Risk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Errors Display if Any */}
                {parseResult.errors.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        {isCounselor && parseResult.scopeViolationsCount
                          ? `Import Blocked: Out-of-scope records detected (${parseResult.errors.length}):`
                          : `Validation Issues Detected (${parseResult.errors.length}):`}
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-rose-700 max-h-48 overflow-y-auto pl-2 font-sans">
                      {parseResult.errors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold shrink-0">•</span>
                          <span>
                            <strong>Row {err.rowNumber}</strong>{' '}
                            {err.registerNumber ? `(${err.registerNumber})` : ''} —{' '}
                            <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px] font-semibold">{err.field}</code>:{' '}
                            {err.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Valid Records Preview Table */}
                {parseResult.validStudents.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Reg No</th>
                          <th className="px-3 py-2">Student Name</th>
                          <th className="px-3 py-2">Dept</th>
                          <th className="px-3 py-2">Year</th>
                          <th className="px-3 py-2">Section</th>
                          <th className="px-3 py-2">Attendance</th>
                          <th className="px-3 py-2">SGPA</th>
                          <th className="px-3 py-2">Backlogs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.validStudents.map((s, i) => {
                          const acad = parseResult.validAcademicRecords[i];
                          return (
                            <tr key={s.register_number} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-medium text-slate-800">
                                {s.register_number}
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {s.student_name}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{s.department}</td>
                              <td className="px-3 py-2 text-slate-600">Yr {s.year}</td>
                              <td className="px-3 py-2 text-slate-600 font-semibold">Sec {s.section}</td>
                              <td
                                className={`px-3 py-2 font-semibold ${
                                  acad.attendance_percentage < 75
                                    ? 'text-rose-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {acad.attendance_percentage}%
                              </td>
                              <td className="px-3 py-2 text-slate-900">{acad.sgpa}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={
                                    acad.backlog_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'
                                  }
                                >
                                  {acad.backlog_count}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Recent Imports & Guidelines */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Imports</CardTitle>
              <CardDescription>
                {isCounselor ? 'Imports for your section' : 'Institution-wide history'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentImports.length === 0 ? (
                <p className="text-xs text-slate-500">No imports performed yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentImports.map((imp) => (
                    <div
                      key={imp.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="truncate">{imp.snapshot_label}</span>
                        <span className="text-emerald-700 font-mono text-[11px]">
                          {imp.valid_rows} records
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex justify-between">
                        <span className="truncate max-w-[140px]">{imp.filename}</span>
                        <span>{new Date(imp.imported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingestion Specification Guidelines */}
          <Card className="bg-slate-50 border-slate-200 text-xs text-slate-600">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-slate-700">
                Scope & Security Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <p>• <strong>Scope Checking</strong>: Counselors cannot import rows from outside their assigned section.</p>
              <p>• <strong>Authorship</strong>: Every import is logged in the permanent audit trail.</p>
              <p>• <strong>Deterministic Engine</strong>: Risk scores update automatically after import.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
