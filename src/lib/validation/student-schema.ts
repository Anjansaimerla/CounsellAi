import { z } from 'zod';

/**
 * Zod Schema for raw CSV row ingestion
 * Handles strings, coerced numbers, JSON strings, and common formats
 */
export const RawCsvStudentRowSchema = z.object({
  register_number: z
    .string({ required_error: 'Register number is required' })
    .min(1, 'Register number cannot be empty')
    .transform((val) => val.trim().toUpperCase()),
  student_name: z
    .string({ required_error: 'Student name is required' })
    .min(1, 'Student name cannot be empty')
    .transform((val) => val.trim()),
  department: z
    .string({ required_error: 'Department is required' })
    .min(1, 'Department cannot be empty')
    .transform((val) => val.trim().toUpperCase()),
  program: z
    .string()
    .optional()
    .default('B.Tech')
    .transform((val) => (val ? val.trim() : 'B.Tech')),
  year: z.coerce
    .number({ invalid_type_error: 'Year must be a number' })
    .int('Year must be an integer')
    .min(1, 'Year must be between 1 and 6')
    .max(6, 'Year must be between 1 and 6'),
  section: z
    .string()
    .optional()
    .default('A')
    .transform((val) => (val ? val.trim().toUpperCase() : 'A')),
  semester: z.coerce
    .number({ invalid_type_error: 'Semester must be a number' })
    .int('Semester must be an integer')
    .min(1, 'Semester must be between 1 and 8')
    .max(8, 'Semester must be between 1 and 8'),
  student_contact: z.string().optional().transform((v) => (v ? v.trim() : '')),
  parent_name: z.string().optional().transform((v) => (v ? v.trim() : '')),
  parent_contact: z.string().optional().transform((v) => (v ? v.trim() : '')),
  attendance_percentage: z.coerce
    .number({ invalid_type_error: 'Attendance must be a number' })
    .min(0, 'Attendance cannot be less than 0%')
    .max(100, 'Attendance cannot exceed 100%'),
  subject_wise_attendance: z.string().optional(),
  internal_assessment_marks: z.string().optional(),
  sgpa: z.coerce
    .number({ invalid_type_error: 'SGPA must be a number' })
    .min(0, 'SGPA cannot be less than 0')
    .max(10, 'SGPA cannot exceed 10'),
  cgpa: z.coerce
    .number({ invalid_type_error: 'CGPA must be a number' })
    .min(0, 'CGPA cannot be less than 0')
    .max(10, 'CGPA cannot exceed 10'),
  backlog_count: z.coerce
    .number({ invalid_type_error: 'Backlog count must be a number' })
    .int('Backlogs must be an integer')
    .min(0, 'Backlog count cannot be negative')
    .default(0),
  backlog_subjects: z.string().optional(),
  assignment_performance: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(75),
  lab_performance: z.coerce.number().min(0).max(100).optional().default(80),
  disciplinary_issues: z.string().optional().default('NONE'),
  classroom_behaviour: z.string().optional().default('Normal'),
  academic_difficulties: z.string().optional().default(''),
});

export type RawCsvStudentRow = z.infer<typeof RawCsvStudentRowSchema>;

/**
 * Counselling Session Form Zod Schema
 */
export const CounsellingSessionSchema = z.object({
  register_number: z.string().min(1, 'Student register number is required'),
  session_date: z.string().min(1, 'Session date is required'),
  counsellor_id: z.string().default('counsellor_1'),
  counsellor_name: z.string().min(1, 'Counsellor name is required'),
  counselling_type: z.enum([
    'ACADEMIC',
    'ATTENDANCE',
    'CAREER',
    'BEHAVIOURAL',
    'GENERAL',
    'PARENT_MEETING',
    'FOLLOW_UP',
    'OTHER',
  ]),
  issue_identified: z.string().min(3, 'Identified issue is required (min 3 chars)'),
  counsellor_observation: z.string().min(5, 'Observation is required (min 5 chars)'),
  advice_given: z.string().min(5, 'Advice/guidance is required (min 5 chars)'),
  action_plan: z.array(
    z.object({
      id: z.string(),
      action: z.string().min(1, 'Action description required'),
      target: z.string().min(1, 'Target required'),
      deadline: z.string().min(1, 'Deadline required'),
      completed: z.boolean().default(false),
    })
  ).min(1, 'At least one action item is required in the plan'),
  follow_up_date: z.string().optional(),
  parent_comm_status: z.enum([
    'NOT_REQUIRED',
    'PENDING_APPROVAL',
    'APPROVED',
    'CONTACTED',
    'UNABLE_TO_CONTACT',
    'COMPLETED',
  ]).default('NOT_REQUIRED'),
});

/**
 * AI Counselling Brief output validation schema
 */
export const AICounsellingBriefSchema = z.object({
  summary: z.string().min(1),
  keyConcerns: z.array(z.string()),
  performanceTrend: z.string(),
  discussionPoints: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  possibleInterventionAreas: z.array(z.string()),
});
