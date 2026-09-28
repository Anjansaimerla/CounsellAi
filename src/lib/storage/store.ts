import {
  AcademicRecord,
  ActionPlanItem,
  BehaviourRecord,
  CompleteStudentRecord,
  CounsellingSession,
  DataImport,
  FollowUpItem,
  FollowUpStatus,
  ImprovementComparison,
  ImprovementStatus,
  RiskAssessment,
  Student,
} from '@/types';
import { calculateStudentRisk } from '../risk/risk-engine';
import { DEFAULT_RISK_CONFIG, RiskThresholdConfig } from '../risk/risk-config';

const STORAGE_KEY_STUDENTS = 'counsellai_students_v1';
const STORAGE_KEY_ACADEMIC = 'counsellai_academic_v1';
const STORAGE_KEY_BEHAVIOUR = 'counsellai_behaviour_v1';
const STORAGE_KEY_SESSIONS = 'counsellai_sessions_v1';
const STORAGE_KEY_FOLLOWUPS = 'counsellai_followups_v1';
const STORAGE_KEY_IMPORTS = 'counsellai_imports_v1';
const STORAGE_KEY_RISK_CONFIG = 'counsellai_risk_config_v1';

export interface DashboardStats {
  totalStudents: number;
  criticalRiskCount: number;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  followUpsDueCount: number;
  followUpsUpcomingCount: number;
  totalCounsellingSessions: number;
  improvedStudentsCount: number;
  departmentBreakdown: Record<string, { total: number; highOrCritical: number }>;
  riskDistribution: { name: string; value: number; color: string }[];
}

class CounsellStore {
  private students: Map<string, Student> = new Map();
  private academicRecords: AcademicRecord[] = [];
  private behaviourRecords: Map<string, BehaviourRecord> = new Map();
  private counsellingSessions: CounsellingSession[] = [];
  private followUps: FollowUpItem[] = [];
  private dataImports: DataImport[] = [];
  private riskConfig: RiskThresholdConfig = DEFAULT_RISK_CONFIG;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    try {
      const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (storedStudents) {
        const arr: Student[] = JSON.parse(storedStudents);
        this.students = new Map(arr.map((s) => [s.register_number, s]));
      }

      const storedAcademic = localStorage.getItem(STORAGE_KEY_ACADEMIC);
      if (storedAcademic) {
        this.academicRecords = JSON.parse(storedAcademic);
      }

      const storedBehaviour = localStorage.getItem(STORAGE_KEY_BEHAVIOUR);
      if (storedBehaviour) {
        const arr: BehaviourRecord[] = JSON.parse(storedBehaviour);
        this.behaviourRecords = new Map(arr.map((b) => [b.register_number, b]));
      }

      const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (storedSessions) {
        this.counsellingSessions = JSON.parse(storedSessions);
      }

      const storedFollowups = localStorage.getItem(STORAGE_KEY_FOLLOWUPS);
      if (storedFollowups) {
        this.followUps = JSON.parse(storedFollowups);
      }

      const storedImports = localStorage.getItem(STORAGE_KEY_IMPORTS);
      if (storedImports) {
        this.dataImports = JSON.parse(storedImports);
      }

      const storedConfig = localStorage.getItem(STORAGE_KEY_RISK_CONFIG);
      if (storedConfig) {
        this.riskConfig = { ...DEFAULT_RISK_CONFIG, ...JSON.parse(storedConfig) };
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY_STUDENTS,
        JSON.stringify(Array.from(this.students.values()))
      );
      localStorage.setItem(STORAGE_KEY_ACADEMIC, JSON.stringify(this.academicRecords));
      localStorage.setItem(
        STORAGE_KEY_BEHAVIOUR,
        JSON.stringify(Array.from(this.behaviourRecords.values()))
      );
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(this.counsellingSessions));
      localStorage.setItem(STORAGE_KEY_FOLLOWUPS, JSON.stringify(this.followUps));
      localStorage.setItem(STORAGE_KEY_IMPORTS, JSON.stringify(this.dataImports));
      localStorage.setItem(STORAGE_KEY_RISK_CONFIG, JSON.stringify(this.riskConfig));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public getRiskConfig(): RiskThresholdConfig {
    return this.riskConfig;
  }

  public setRiskConfig(config: Partial<RiskThresholdConfig>) {
    this.riskConfig = { ...this.riskConfig, ...config };
    this.saveToLocalStorage();
  }

  public getStudentsList(): Student[] {
    return Array.from(this.students.values());
  }

  public getDataImports(): DataImport[] {
    return [...this.dataImports].sort(
      (a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime()
    );
  }

  public getStudent(registerNumber: string): Student | undefined {
    return this.students.get(registerNumber.toUpperCase());
  }

  public getAcademicRecordsForStudent(registerNumber: string): AcademicRecord[] {
    return this.academicRecords
      .filter((a) => a.register_number.toUpperCase() === registerNumber.toUpperCase())
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  }

  public getLatestAcademicRecord(registerNumber: string): AcademicRecord | undefined {
    const records = this.getAcademicRecordsForStudent(registerNumber);
    return records.length > 0 ? records[records.length - 1] : undefined;
  }

  public getBehaviourRecord(registerNumber: string): BehaviourRecord | undefined {
    return this.behaviourRecords.get(registerNumber.toUpperCase());
  }

  public getCounsellingSessionsForStudent(registerNumber: string): CounsellingSession[] {
    return this.counsellingSessions
      .filter((s) => s.register_number.toUpperCase() === registerNumber.toUpperCase())
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  }

  public getAllCounsellingSessions(): CounsellingSession[] {
    return [...this.counsellingSessions].sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );
  }

  public getFollowUps(): FollowUpItem[] {
    return [...this.followUps].sort(
      (a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
    );
  }

  public getCompleteStudentRecord(registerNumber: string): CompleteStudentRecord | null {
    const student = this.getStudent(registerNumber);
    if (!student) return null;

    const academicHistory = this.getAcademicRecordsForStudent(registerNumber);
    const currentAcademic =
      academicHistory[academicHistory.length - 1] || {
        id: `empty_${registerNumber}`,
        register_number: registerNumber,
        snapshot_label: 'Current',
        semester: student.semester,
        attendance_percentage: 100,
        sgpa: 0,
        cgpa: 0,
        backlog_count: 0,
        recorded_at: new Date().toISOString(),
      };

    const behaviour = this.getBehaviourRecord(registerNumber);
    const riskAssessment = calculateStudentRisk(
      currentAcademic,
      academicHistory.slice(0, -1),
      this.riskConfig
    );
    const counsellingSessions = this.getCounsellingSessionsForStudent(registerNumber);
    const improvement = this.getImprovementComparison(registerNumber);

    return {
      student,
      currentAcademic,
      academicHistory,
      behaviour,
      riskAssessment,
      counsellingSessions,
      improvement: improvement || undefined,
    };
  }

  public getAllCompleteStudentRecords(): CompleteStudentRecord[] {
    const list: CompleteStudentRecord[] = [];
    for (const student of this.students.values()) {
      const record = this.getCompleteStudentRecord(student.register_number);
      if (record) {
        list.push(record);
      }
    }
    return list;
  }

  /**
   * Import batch from parsed CSV
   */
  public importData(params: {
    filename: string;
    snapshotLabel: string;
    students: Student[];
    academicRecords: AcademicRecord[];
    behaviourRecords: BehaviourRecord[];
    importedBy?: string;
  }): DataImport {
    const {
      filename,
      snapshotLabel,
      students,
      academicRecords,
      behaviourRecords,
      importedBy = 'Counsellor Admin',
    } = params;

    const importId = `import_${Date.now()}`;
    const importRecord: DataImport = {
      id: importId,
      filename,
      snapshot_label: snapshotLabel,
      total_rows: students.length,
      valid_rows: students.length,
      error_rows: 0,
      imported_at: new Date().toISOString(),
      imported_by: importedBy,
    };

    // Add or update students
    for (const s of students) {
      this.students.set(s.register_number.toUpperCase(), s);
    }

    // Append academic records with import reference
    for (const a of academicRecords) {
      this.academicRecords.push({
        ...a,
        import_id: importId,
        snapshot_label: snapshotLabel,
      });
    }

    // Add or update behaviour
    for (const b of behaviourRecords) {
      this.behaviourRecords.set(b.register_number.toUpperCase(), b);
    }

    this.dataImports.unshift(importRecord);
    this.saveToLocalStorage();
    return importRecord;
  }

  /**
   * Record a new counselling session
   */
  public recordCounsellingSession(session: Omit<CounsellingSession, 'id' | 'created_at'>): CounsellingSession {
    const sessionId = `session_${Date.now()}`;
    const newSession: CounsellingSession = {
      ...session,
      id: sessionId,
      created_at: new Date().toISOString(),
    };

    this.counsellingSessions.unshift(newSession);

    // If a follow up date is set, create a follow up item
    if (session.follow_up_date) {
      const student = this.getStudent(session.register_number);
      const studentFull = this.getCompleteStudentRecord(session.register_number);
      const followUpItem: FollowUpItem = {
        id: `followup_${Date.now()}`,
        session_id: sessionId,
        register_number: session.register_number,
        student_name: student?.student_name || 'Student',
        department: student?.department || 'Unknown',
        year: student?.year || 1,
        follow_up_date: session.follow_up_date,
        status: (session.follow_up_status as FollowUpStatus) || 'PENDING',
        counsellor_name: session.counsellor_name,
        counselling_type: session.counselling_type,
        issue_identified: session.issue_identified,
        action_plan_count: session.action_plan.length,
        completed_actions_count: session.action_plan.filter((a) => a.completed).length,
        previous_risk_level: studentFull?.riskAssessment.risk_level || 'HIGH',
        previous_attendance: studentFull?.currentAcademic.attendance_percentage,
        previous_sgpa: studentFull?.currentAcademic.sgpa,
        action_plan_items: [...session.action_plan],
      };
      this.followUps.unshift(followUpItem);
    }

    this.saveToLocalStorage();
    return newSession;
  }

  /**
   * Update action plan completion state
   */
  public toggleActionPlanItem(sessionId: string, actionId: string, completed: boolean) {
    const session = this.counsellingSessions.find((s) => s.id === sessionId);
    if (session) {
      const item = session.action_plan.find((a) => a.id === actionId);
      if (item) {
        item.completed = completed;
      }
      // Update follow up item count
      const followUp = this.followUps.find((f) => f.session_id === sessionId);
      if (followUp) {
        followUp.completed_actions_count = session.action_plan.filter((a) => a.completed).length;
        if (followUp.action_plan_items) {
          const fItem = followUp.action_plan_items.find((a) => a.id === actionId);
          if (fItem) fItem.completed = completed;
        }
      }
      this.saveToLocalStorage();
    }
  }

  /**
   * Conduct / Complete a Follow-up Review Session (Section 3.6 of updation.md)
   */
  public conductFollowUpReview(params: {
    followUpId: string;
    status: FollowUpStatus;
    improvementStatus?: ImprovementStatus;
    notes?: string;
    actionPlan?: ActionPlanItem[];
  }) {
    const { followUpId, status, improvementStatus, notes, actionPlan } = params;
    const f = this.followUps.find((item) => item.id === followUpId);
    if (f) {
      f.status = status;
      if (notes !== undefined) f.notes = notes;
      if (improvementStatus) f.improvement_status = improvementStatus;
      if (actionPlan) {
        f.action_plan_items = actionPlan;
        f.completed_actions_count = actionPlan.filter((a) => a.completed).length;
      }

      // Also update parent session status and action plan
      const session = this.counsellingSessions.find((s) => s.id === f.session_id);
      if (session) {
        session.follow_up_status = status;
        if (actionPlan) {
          session.action_plan = actionPlan;
        }
      }
      this.saveToLocalStorage();
    }
  }

  /**
   * Update follow up status (COMPLETED, RESCHEDULED, MISSED, etc.)
   */
  public updateFollowUpStatus(followUpId: string, status: FollowUpStatus, notes?: string) {
    const f = this.followUps.find((item) => item.id === followUpId);
    if (f) {
      f.status = status;
      if (notes !== undefined) f.notes = notes;

      // Also update parent session status
      const session = this.counsellingSessions.find((s) => s.id === f.session_id);
      if (session) {
        session.follow_up_status = status;
      }
      this.saveToLocalStorage();
    }
  }

  /**
   * Calculate Before/After Improvement Comparison
   */
  public getImprovementComparison(registerNumber: string): ImprovementComparison | null {
    const student = this.getStudent(registerNumber);
    if (!student) return null;

    const history = this.getAcademicRecordsForStudent(registerNumber);
    if (history.length < 2) return null;

    const baselineSnapshot = history[0];
    const latestSnapshot = history[history.length - 1];

    const attendance_diff =
      latestSnapshot.attendance_percentage - baselineSnapshot.attendance_percentage;
    const sgpa_diff = latestSnapshot.sgpa - baselineSnapshot.sgpa;
    const backlog_diff = latestSnapshot.backlog_count - baselineSnapshot.backlog_count;
    const assignment_diff =
      (latestSnapshot.assignment_performance || 0) -
      (baselineSnapshot.assignment_performance || 0);

    // Compute status
    let status: ImprovementStatus = 'NO_SIGNIFICANT_IMPROVEMENT';
    const hasImprovedMetrics =
      attendance_diff > 3 || sgpa_diff > 0.3 || backlog_diff < 0 || assignment_diff > 10;
    const hasDeclinedMetrics =
      attendance_diff < -5 || sgpa_diff < -0.4 || backlog_diff > 0;

    if (hasImprovedMetrics && !hasDeclinedMetrics) {
      if (attendance_diff >= 10 || sgpa_diff >= 0.8 || backlog_diff <= -2) {
        status = 'IMPROVED';
      } else {
        status = 'PARTIALLY_IMPROVED';
      }
    } else if (hasDeclinedMetrics) {
      status = 'DECLINED';
    } else if (hasImprovedMetrics && hasDeclinedMetrics) {
      status = 'PARTIALLY_IMPROVED';
    }

    return {
      register_number: student.register_number,
      student_name: student.student_name,
      department: student.department,
      year: student.year,
      baselineSnapshot,
      latestSnapshot,
      attendance_diff,
      sgpa_diff,
      backlog_diff,
      assignment_diff,
      status,
      evaluated_at: new Date().toISOString(),
    };
  }

  public getAllImprovementComparisons(): ImprovementComparison[] {
    const list: ImprovementComparison[] = [];
    for (const student of this.students.values()) {
      const comp = this.getImprovementComparison(student.register_number);
      if (comp) list.push(comp);
    }
    return list;
  }

  /**
   * Computes Dashboard Statistics
   */
  public getDashboardStats(): DashboardStats {
    const allRecords = this.getAllCompleteStudentRecords();
    let criticalRiskCount = 0;
    let highRiskCount = 0;
    let moderateRiskCount = 0;
    let lowRiskCount = 0;
    let improvedStudentsCount = 0;

    const departmentBreakdown: Record<string, { total: number; highOrCritical: number }> = {};

    for (const r of allRecords) {
      const dept = r.student.department || 'Other';
      if (!departmentBreakdown[dept]) {
        departmentBreakdown[dept] = { total: 0, highOrCritical: 0 };
      }
      departmentBreakdown[dept].total += 1;

      switch (r.riskAssessment.risk_level) {
        case 'CRITICAL':
          criticalRiskCount++;
          departmentBreakdown[dept].highOrCritical += 1;
          break;
        case 'HIGH':
          highRiskCount++;
          departmentBreakdown[dept].highOrCritical += 1;
          break;
        case 'MODERATE':
          moderateRiskCount++;
          break;
        case 'LOW':
          lowRiskCount++;
          break;
      }

      if (r.improvement && (r.improvement.status === 'IMPROVED' || r.improvement.status === 'PARTIALLY_IMPROVED')) {
        improvedStudentsCount++;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const followUpsDueCount = this.followUps.filter(
      (f) => f.status === 'PENDING' && f.follow_up_date <= today
    ).length;

    const followUpsUpcomingCount = this.followUps.filter(
      (f) => f.status === 'PENDING' && f.follow_up_date > today
    ).length;

    const riskDistribution = [
      { name: 'Critical Risk', value: criticalRiskCount, color: '#e11d48' },
      { name: 'High Risk', value: highRiskCount, color: '#ea580c' },
      { name: 'Moderate Risk', value: moderateRiskCount, color: '#d97706' },
      { name: 'Low Risk', value: lowRiskCount, color: '#10b981' },
    ].filter((item) => item.value > 0);

    return {
      totalStudents: allRecords.length,
      criticalRiskCount,
      highRiskCount,
      moderateRiskCount,
      lowRiskCount,
      followUpsDueCount,
      followUpsUpcomingCount,
      totalCounsellingSessions: this.counsellingSessions.length,
      improvedStudentsCount,
      departmentBreakdown,
      riskDistribution,
    };
  }

  public clearAll() {
    this.students.clear();
    this.academicRecords = [];
    this.behaviourRecords.clear();
    this.counsellingSessions = [];
    this.followUps = [];
    this.dataImports = [];
    this.saveToLocalStorage();
  }
}

// Global Singleton Instance
export const store = new CounsellStore();
