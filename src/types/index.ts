export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type PerformanceTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';

export type CounsellingType =
  | 'ACADEMIC'
  | 'ATTENDANCE'
  | 'CAREER'
  | 'BEHAVIOURAL'
  | 'GENERAL'
  | 'PARENT_MEETING'
  | 'FOLLOW_UP'
  | 'OTHER';

export type FollowUpStatus =
  | 'PENDING'
  | 'DUE'
  | 'COMPLETED'
  | 'MISSED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export type ParentCommStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONTACTED'
  | 'UNABLE_TO_CONTACT'
  | 'COMPLETED';

export type ImprovementStatus =
  | 'NOT_EVALUATED'
  | 'IMPROVED'
  | 'PARTIALLY_IMPROVED'
  | 'NO_SIGNIFICANT_IMPROVEMENT'
  | 'DECLINED';

export interface SubjectWiseAttendance {
  [subjectCodeOrName: string]: number; // 0 to 100
}

export interface InternalAssessmentSubject {
  obtained: number;
  maximum: number;
}

export interface InternalAssessmentMarks {
  obtained?: number;
  maximum?: number;
  percentage?: number;
  subjects?: Record<string, InternalAssessmentSubject>;
}

export interface Student {
  register_number: string;
  student_name: string;
  department: string;
  program: string;
  year: number;
  section: string;
  semester: number;
  student_contact?: string;
  parent_name?: string;
  parent_contact?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicRecord {
  id: string;
  register_number: string;
  snapshot_label: string; // e.g. "Mid-Term 1 (Sep 2026)", "Mid-Term 2 (Nov 2026)"
  semester: number;
  attendance_percentage: number;
  subject_wise_attendance?: SubjectWiseAttendance;
  internal_assessment_marks?: InternalAssessmentMarks;
  sgpa: number;
  cgpa: number;
  backlog_count: number;
  backlog_subjects?: string[];
  assignment_performance?: number; // 0 to 100
  lab_performance?: number; // 0 to 100
  recorded_at: string;
  import_id?: string;
}

export interface BehaviourRecord {
  id: string;
  register_number: string;
  disciplinary_issues: 'NONE' | 'DOCUMENTED';
  disciplinary_description?: string;
  classroom_behaviour?: string;
  academic_difficulties?: string;
  recorded_at: string;
}

export interface RiskBreakdown {
  attendanceScore: number;
  sgpaDeclineScore: number;
  backlogScore: number;
  assignmentScore: number;
  internalScore: number;
  flags: string[];
}

export interface RiskAssessment {
  id: string;
  register_number: string;
  overall_score: number;
  risk_level: RiskLevel;
  breakdown: RiskBreakdown;
  calculated_at: string;
  trend: PerformanceTrend;
}

export interface ActionPlanItem {
  id: string;
  session_id?: string;
  action: string;
  target: string;
  responsible_person?: string;
  deadline: string;
  completed: boolean;
}

export interface CounsellingSession {
  id: string;
  register_number: string;
  session_date: string;
  counsellor_id: string;
  counsellor_name: string;
  counselling_type: CounsellingType;
  issue_identified: string;
  counsellor_observation: string;
  advice_given: string;
  action_plan: ActionPlanItem[];
  follow_up_date?: string;
  follow_up_status?: FollowUpStatus;
  parent_comm_status: ParentCommStatus;
  created_at: string;
}

export interface FollowUpItem {
  id: string;
  session_id: string;
  register_number: string;
  student_name: string;
  department: string;
  year: number;
  follow_up_date: string;
  status: FollowUpStatus;
  counsellor_name: string;
  counselling_type: CounsellingType;
  issue_identified: string;
  action_plan_count: number;
  completed_actions_count: number;
  previous_risk_level?: RiskLevel;
  previous_attendance?: number;
  previous_sgpa?: number;
  improvement_status?: ImprovementStatus;
  notes?: string;
  action_plan_items?: ActionPlanItem[];
}

export interface DataImport {
  id: string;
  filename: string;
  snapshot_label: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  imported_at: string;
  imported_by: string;
}

export interface ImprovementComparison {
  register_number: string;
  student_name: string;
  department: string;
  year: number;
  baselineSnapshot: AcademicRecord;
  latestSnapshot: AcademicRecord;
  attendance_diff: number;
  sgpa_diff: number;
  backlog_diff: number;
  assignment_diff: number;
  status: ImprovementStatus;
  ai_summary?: string;
  evaluated_at: string;
}

export interface AICounsellingBrief {
  summary: string;
  keyConcerns: string[];
  performanceTrend: string;
  discussionPoints: string[];
  suggestedQuestions: string[];
  possibleInterventionAreas: string[];
  generatedAt: string;
  isAiGenerated: boolean;
}

export interface CompleteStudentRecord {
  student: Student;
  currentAcademic: AcademicRecord;
  academicHistory: AcademicRecord[];
  behaviour?: BehaviourRecord;
  riskAssessment: RiskAssessment;
  counsellingSessions: CounsellingSession[];
  improvement?: ImprovementComparison;
}
