import Papa from 'papaparse';
import {
  AcademicRecord,
  BehaviourRecord,
  InternalAssessmentMarks,
  Student,
  SubjectWiseAttendance,
} from '@/types';
import { RawCsvStudentRow, RawCsvStudentRowSchema } from '../validation/student-schema';

export interface CsvValidationError {
  rowNumber: number;
  registerNumber?: string;
  field: string;
  message: string;
}

export interface CsvParseResult {
  totalRows: number;
  validStudents: Student[];
  validAcademicRecords: AcademicRecord[];
  validBehaviourRecords: BehaviourRecord[];
  errors: CsvValidationError[];
  rawRowsCount: number;
}

/**
 * Safely parses subject-wise attendance field
 */
function parseSubjectWiseAttendance(raw?: string): SubjectWiseAttendance | undefined {
  if (!raw || !raw.trim()) return undefined;
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    // format "AI: 62, Java: 81, DBMS: 74"
    const result: SubjectWiseAttendance = {};
    const parts = trimmed.split(/[,;]/);
    for (const p of parts) {
      const [k, v] = p.split(':');
      if (k && v && !isNaN(Number(v.trim()))) {
        result[k.trim()] = Number(v.trim());
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Safely parses internal assessment marks field
 */
function parseInternalMarks(raw?: string): InternalAssessmentMarks | undefined {
  if (!raw || !raw.trim()) return undefined;
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    if (trimmed.includes('/')) {
      const [obt, max] = trimmed.split('/');
      return {
        obtained: Number(obt.trim()),
        maximum: Number(max.trim()),
        percentage: (Number(obt.trim()) / Number(max.trim())) * 100,
      };
    }
    const num = Number(trimmed);
    if (!isNaN(num)) {
      return { percentage: num, obtained: num, maximum: 100 };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Safely parses backlog subjects list
 */
function parseBacklogSubjects(raw?: string): string[] {
  if (!raw || !raw.trim()) return [];
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
    return trimmed
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'nil');
  } catch {
    return [];
  }
}

/**
 * Parse and validate CSV content string
 */
export function parseAndValidateStudentCsv(
  csvContent: string,
  snapshotLabel: string = 'Current Snapshot'
): CsvParseResult {
  const parsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  });

  const errors: CsvValidationError[] = [];
  const validStudents: Student[] = [];
  const validAcademicRecords: AcademicRecord[] = [];
  const validBehaviourRecords: BehaviourRecord[] = [];
  const seenRegisterNumbers = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // 1-based + 1 for header
    const validationResult = RawCsvStudentRowSchema.safeParse(row);

    if (!validationResult.success) {
      for (const issue of validationResult.error.issues) {
        errors.push({
          rowNumber,
          registerNumber: row.register_number ? String(row.register_number).trim() : undefined,
          field: issue.path.join('.'),
          message: issue.message,
        });
      }
      return;
    }

    const data: RawCsvStudentRow = validationResult.data;

    // Check Duplicate within same CSV
    if (seenRegisterNumbers.has(data.register_number)) {
      errors.push({
        rowNumber,
        registerNumber: data.register_number,
        field: 'register_number',
        message: `Duplicate register number "${data.register_number}" encountered in CSV`,
      });
      return;
    }
    seenRegisterNumbers.add(data.register_number);

    // 1. Build Student Entity
    const student: Student = {
      register_number: data.register_number,
      student_name: data.student_name,
      department: data.department,
      program: data.program || 'B.Tech',
      year: data.year,
      section: data.section || 'A',
      semester: data.semester,
      student_contact: data.student_contact,
      parent_name: data.parent_name,
      parent_contact: data.parent_contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Build Academic Record Entity
    const academicRecord: AcademicRecord = {
      id: `acad_${data.register_number}_${Date.now()}_${index}`,
      register_number: data.register_number,
      snapshot_label: snapshotLabel,
      semester: data.semester,
      attendance_percentage: data.attendance_percentage,
      subject_wise_attendance: parseSubjectWiseAttendance(data.subject_wise_attendance),
      internal_assessment_marks: parseInternalMarks(data.internal_assessment_marks),
      sgpa: data.sgpa,
      cgpa: data.cgpa,
      backlog_count: data.backlog_count,
      backlog_subjects: parseBacklogSubjects(data.backlog_subjects),
      assignment_performance: data.assignment_performance,
      lab_performance: data.lab_performance,
      recorded_at: new Date().toISOString(),
    };

    // 3. Build Behaviour Entity
    const behaviourRecord: BehaviourRecord = {
      id: `beh_${data.register_number}_${Date.now()}_${index}`,
      register_number: data.register_number,
      disciplinary_issues:
        data.disciplinary_issues?.toUpperCase() === 'DOCUMENTED' ? 'DOCUMENTED' : 'NONE',
      disciplinary_description:
        data.disciplinary_issues?.toUpperCase() === 'DOCUMENTED' ? data.disciplinary_issues : undefined,
      classroom_behaviour: data.classroom_behaviour,
      academic_difficulties: data.academic_difficulties,
      recorded_at: new Date().toISOString(),
    };

    validStudents.push(student);
    validAcademicRecords.push(academicRecord);
    validBehaviourRecords.push(behaviourRecord);
  });

  return {
    totalRows: parsed.data.length,
    validStudents,
    validAcademicRecords,
    validBehaviourRecords,
    errors,
    rawRowsCount: parsed.data.length,
  };
}

/**
 * Generates a clean official CSV template with standard column headers for production data ingestion
 */
export function generateCsvTemplate(): string {
  const headers = [
    'register_number',
    'student_name',
    'department',
    'program',
    'year',
    'section',
    'semester',
    'student_contact',
    'parent_name',
    'parent_contact',
    'attendance_percentage',
    'subject_wise_attendance',
    'internal_assessment_marks',
    'sgpa',
    'cgpa',
    'backlog_count',
    'backlog_subjects',
    'assignment_performance',
    'lab_performance',
    'disciplinary_issues',
    'classroom_behaviour',
    'academic_difficulties',
  ];

  return headers.join(',');
}
