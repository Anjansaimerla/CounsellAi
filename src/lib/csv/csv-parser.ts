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
 * Generate CSV sample template string
 */
export function generateSampleCsvContent(): string {
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

  const rows = [
    [
      '23CS101',
      'Aarav Sharma',
      'CSE',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543210',
      'Ramesh Sharma',
      '9876543211',
      '56.5',
      '{"Data Structures": 52, "OS": 58, "DBMS": 60}',
      '{"obtained": 22, "maximum": 60}',
      '5.4',
      '7.1',
      '3',
      '["OS", "Data Structures", "Maths III"]',
      '48',
      '55',
      'NONE',
      'Low participation in lab sessions',
      'Difficulty understanding OS memory management and recursion algorithms',
    ],
    [
      '23CS102',
      'Priya Nair',
      'CSE',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543212',
      'Suresh Nair',
      '9876543213',
      '71.0',
      '{"Data Structures": 68, "OS": 72, "DBMS": 73}',
      '{"obtained": 34, "maximum": 60}',
      '6.8',
      '7.5',
      '1',
      '["Maths III"]',
      '64',
      '78',
      'NONE',
      'Attentive but struggles with rapid exam pace',
      'Needs extra problem-solving practice in applied mathematics',
    ],
    [
      '23EC201',
      'Karthik Reddy',
      'ECE',
      'B.Tech',
      '2',
      'B',
      '3',
      '9876543214',
      'Venkat Reddy',
      '9876543215',
      '88.0',
      '{"Signals": 85, "Networks": 90, "Digital Electronics": 89}',
      '{"obtained": 52, "maximum": 60}',
      '8.9',
      '8.7',
      '0',
      '[]',
      '92',
      '95',
      'NONE',
      'Excellent participation and peer mentoring',
      'None reported',
    ],
    [
      '23AI301',
      'Sneha Verma',
      'CSE-AIML',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543216',
      'Anand Verma',
      '9876543217',
      '58.0',
      '{"Deep Learning": 54, "NLP": 59, "Computer Vision": 61}',
      '{"obtained": 25, "maximum": 60}',
      '5.8',
      '7.2',
      '2',
      '["Probability & Stats", "Linear Algebra"]',
      '52',
      '60',
      'NONE',
      'Frequently late to morning 8:30 AM lectures',
      'Commute difficulties impacting attendance; math prerequisites gap',
    ],
    [
      '23IT401',
      'Rohan Gupta',
      'IT',
      'B.Tech',
      '2',
      'A',
      '4',
      '9876543218',
      'Sunil Gupta',
      '9876543219',
      '91.5',
      '{"Web Tech": 92, "Java": 90, "Software Engg": 93}',
      '{"obtained": 54, "maximum": 60}',
      '9.1',
      '9.0',
      '0',
      '[]',
      '96',
      '94',
      'NONE',
      'Consistently high performer',
      'None',
    ],
  ];

  return [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          if (val.includes(',') || val.includes('"') || val.includes('{') || val.includes('[')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\n');
}

/**
 * Generates an updated comparison CSV (Snapshot 2 / After Follow-Up) for demoing step 12-14
 */
export function generateFollowUpCsvContent(): string {
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

  const rows = [
    [
      '23CS101',
      'Aarav Sharma',
      'CSE',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543210',
      'Ramesh Sharma',
      '9876543211',
      '78.0', // Improved from 56.5% -> 78%
      '{"Data Structures": 76, "OS": 80, "DBMS": 78}',
      '{"obtained": 44, "maximum": 60}', // Improved from 22 -> 44
      '6.9', // Improved from 5.4 -> 6.9
      '7.3',
      '1', // Cleared 2 backlogs (from 3 -> 1)
      '["Maths III"]',
      '82', // Improved from 48% -> 82%
      '85',
      'NONE',
      'Active participant in doubt clearing sessions',
      'Improved understanding of recursion; continuing remedial maths',
    ],
    [
      '23CS102',
      'Priya Nair',
      'CSE',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543212',
      'Suresh Nair',
      '9876543213',
      '84.5', // Improved from 71.0 -> 84.5%
      '{"Data Structures": 82, "OS": 85, "DBMS": 86}',
      '{"obtained": 48, "maximum": 60}',
      '7.9', // Improved from 6.8 -> 7.9
      '7.8',
      '0', // Cleared 1 backlog (from 1 -> 0)
      '[]',
      '88',
      '86',
      'NONE',
      'Confident in problem solving',
      'Successfully cleared backlog',
    ],
    [
      '23EC201',
      'Karthik Reddy',
      'ECE',
      'B.Tech',
      '2',
      'B',
      '3',
      '9876543214',
      'Venkat Reddy',
      '9876543215',
      '90.0',
      '{"Signals": 88, "Networks": 92, "Digital Electronics": 91}',
      '{"obtained": 55, "maximum": 60}',
      '9.2',
      '8.8',
      '0',
      '[]',
      '95',
      '96',
      'NONE',
      'Consistent stellar performer',
      'None',
    ],
    [
      '23AI301',
      'Sneha Verma',
      'CSE-AIML',
      'B.Tech',
      '3',
      'A',
      '5',
      '9876543216',
      'Anand Verma',
      '9876543217',
      '79.5', // Improved from 58% -> 79.5%
      '{"Deep Learning": 78, "NLP": 81, "Computer Vision": 80}',
      '{"obtained": 45, "maximum": 60}',
      '7.3', // Improved from 5.8 -> 7.3
      '7.4',
      '0', // Cleared 2 backlogs
      '[]',
      '80',
      '84',
      'NONE',
      'Hostel accommodation resolved commute problem, on time consistently',
      'Resolved',
    ],
    [
      '23IT401',
      'Rohan Gupta',
      'IT',
      'B.Tech',
      '2',
      'A',
      '4',
      '9876543218',
      'Sunil Gupta',
      '9876543219',
      '92.0',
      '{"Web Tech": 94, "Java": 92, "Software Engg": 95}',
      '{"obtained": 56, "maximum": 60}',
      '9.3',
      '9.1',
      '0',
      '[]',
      '98',
      '95',
      'NONE',
      'Top ranker',
      'None',
    ],
  ];

  return [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          if (val.includes(',') || val.includes('"') || val.includes('{') || val.includes('[')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\n');
}
