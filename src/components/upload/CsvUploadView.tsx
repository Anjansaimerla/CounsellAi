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
} from 'lucide-react';
import {
  parseAndValidateStudentCsv,
  generateCsvTemplate,
  CsvParseResult,
} from '@/lib/csv/csv-parser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DataImport } from '@/types';

interface CsvUploadViewProps {
  onImportSuccess: (result: CsvParseResult, snapshotLabel: string, filename: string) => void;
  recentImports: DataImport[];
  onNavigateToStudents: () => void;
}

export const CsvUploadView: React.FC<CsvUploadViewProps> = ({
  onImportSuccess,
  recentImports,
  onNavigateToStudents,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState('Mid-Term 1');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCsvText = (text: string, filename: string) => {
    setIsProcessing(true);
    setImportDone(false);
    try {
      const result = parseAndValidateStudentCsv(text, snapshotLabel);
      setParseResult(result);
    } catch (err) {
      console.error('CSV parse exception:', err);
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
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'counsellai_student_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitImport = () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;
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
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Upload institutional CSV data containing academic scores, attendance, backlogs, and behaviour notes. CounsellAI validates schema types and executes deterministic risk calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
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
                Supports files from 100 to 500+ records with full schema verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Snapshot Label Input */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Snapshot Label / Term:</span>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="e.g. Mid-Term 1 (Sep 2026)"
                  className="w-full sm:w-64 px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium text-slate-900"
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to select file or drag & drop CSV here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Required columns: register_number, student_name, department, year, attendance_percentage, sgpa, backlog_count
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Validation & Preview Section */}
          {parseResult && (
            <Card className="border-slate-200">
              <CardHeader
                action={
                  parseResult.validStudents.length > 0 && !importDone ? (
                    <button
                      onClick={handleCommitImport}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Import {parseResult.validStudents.length} Valid Records
                      </span>
                    </button>
                  ) : null
                }
              >
                <CardTitle>Validation & Ingestion Preview</CardTitle>
                <CardDescription>
                  {parseResult.validStudents.length} valid rows ready for import •{' '}
                  {parseResult.errors.length} errors flagged
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
                      className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1"
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
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Validation Errors Detected ({parseResult.errors.length}):</span>
                    </div>
                    <ul className="space-y-1 text-rose-700 max-h-40 overflow-y-auto pl-2">
                      {parseResult.errors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold">•</span>
                          <span>
                            <strong>Row {err.rowNumber}</strong>{' '}
                            {err.registerNumber ? `(${err.registerNumber})` : ''} - Field{' '}
                            <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">{err.field}</code>:{' '}
                            {err.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Valid Records Preview Table */}
                {parseResult.validStudents.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Reg No</th>
                          <th className="px-3 py-2">Student Name</th>
                          <th className="px-3 py-2">Dept</th>
                          <th className="px-3 py-2">Year</th>
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
                              <td className="px-3 py-2 text-slate-600">Year {s.year}</td>
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
              <CardTitle>Recent Data Imports</CardTitle>
              <CardDescription>Snapshot history and audit log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentImports.length === 0 ? (
                <p className="text-xs text-slate-500">No imports performed yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentImports.map((imp) => (
                    <div
                      key={imp.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="truncate">{imp.snapshot_label}</span>
                        <span className="text-emerald-700 font-mono text-[11px]">
                          {imp.valid_rows} records
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex justify-between">
                        <span>{imp.filename}</span>
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
                CSV Format Standards (V1)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <p>• <strong>register_number</strong>: Unique institution ID (e.g. 23CS101)</p>
              <p>• <strong>attendance_percentage</strong>: Numeric 0.0 - 100.0</p>
              <p>• <strong>sgpa / cgpa</strong>: Numeric 0.00 - 10.00</p>
              <p>• <strong>backlog_count</strong>: Integer &gt;= 0</p>
              <p>• <strong>subject_wise_attendance</strong>: JSON object or key-value list</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
