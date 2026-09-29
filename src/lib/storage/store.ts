import {
  AcademicRecord,
  AcademicYear,
  ActionPlanItem,
  AuditAction,
  AuditLog,
  BehaviourRecord,
  CompleteStudentRecord,
  CounselorAssignment,
  CounselorScope,
  CounsellingSession,
  DataImport,
  Department,
  EntityStatus,
  FollowUpItem,
  FollowUpStatus,
  ImprovementComparison,
  ImprovementStatus,
  RiskAssessment,
  Section,
  Student,
  User,
  UserRole,
} from '@/types';
import { calculateStudentRisk } from '../risk/risk-engine';
import { DEFAULT_RISK_CONFIG, RiskThresholdConfig } from '../risk/risk-config';
import { hashPassword, verifyPassword } from '../auth/password';

const STORAGE_KEY_STUDENTS = 'counsellai_students_v2';
const STORAGE_KEY_ACADEMIC = 'counsellai_academic_v2';
const STORAGE_KEY_BEHAVIOUR = 'counsellai_behaviour_v2';
const STORAGE_KEY_SESSIONS = 'counsellai_sessions_v2';
const STORAGE_KEY_FOLLOWUPS = 'counsellai_followups_v2';
const STORAGE_KEY_IMPORTS = 'counsellai_imports_v2';
const STORAGE_KEY_RISK_CONFIG = 'counsellai_risk_config_v2';
const STORAGE_KEY_USERS = 'counsellai_users_v2';
const STORAGE_KEY_DEPARTMENTS = 'counsellai_departments_v2';
const STORAGE_KEY_YEARS = 'counsellai_years_v2';
const STORAGE_KEY_SECTIONS = 'counsellai_sections_v2';
const STORAGE_KEY_ASSIGNMENTS = 'counsellai_assignments_v2';
const STORAGE_KEY_AUDIT_LOGS = 'counsellai_audit_logs_v2';

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
  counselorCount?: number;
  departmentsCount?: number;
  sectionsCount?: number;
}

export class CounsellStore {
  private users: Map<string, User> = new Map();
  private departments: Map<string, Department> = new Map();
  private years: Map<string, AcademicYear> = new Map();
  private sections: Map<string, Section> = new Map();
  private assignments: Map<string, CounselorAssignment> = new Map();
  private auditLogs: AuditLog[] = [];

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
      if (!this.isInitialized || this.users.size === 0) {
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  // --- Persistence ---
  private loadFromLocalStorage() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (storedUsers) {
        const arr: User[] = JSON.parse(storedUsers);
        this.users = new Map(arr.map((u) => [u.id, u]));
      }

      const storedDepts = localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
      if (storedDepts) {
        const arr: Department[] = JSON.parse(storedDepts);
        this.departments = new Map(arr.map((d) => [d.id, d]));
      }

      const storedYears = localStorage.getItem(STORAGE_KEY_YEARS);
      if (storedYears) {
        const arr: AcademicYear[] = JSON.parse(storedYears);
        this.years = new Map(arr.map((y) => [y.id, y]));
      }

      const storedSections = localStorage.getItem(STORAGE_KEY_SECTIONS);
      if (storedSections) {
        const arr: Section[] = JSON.parse(storedSections);
        this.sections = new Map(arr.map((s) => [s.id, s]));
      }

      const storedAssignments = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (storedAssignments) {
        const arr: CounselorAssignment[] = JSON.parse(storedAssignments);
        this.assignments = new Map(arr.map((a) => [a.id, a]));
      }

      const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (storedAudit) {
        this.auditLogs = JSON.parse(storedAudit);
      }

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
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(Array.from(this.users.values())));
      localStorage.setItem(
        STORAGE_KEY_DEPARTMENTS,
        JSON.stringify(Array.from(this.departments.values()))
      );
      localStorage.setItem(STORAGE_KEY_YEARS, JSON.stringify(Array.from(this.years.values())));
      localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(Array.from(this.sections.values())));
      localStorage.setItem(
        STORAGE_KEY_ASSIGNMENTS,
        JSON.stringify(Array.from(this.assignments.values()))
      );
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(this.auditLogs));
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

  // --- Seed Initial Data ---
  private seedInitialData() {
    // 1. Departments
    const deptCSE: Department = {
      id: 'dept_cse',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const deptECE: Department = {
      id: 'dept_ece',
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const deptMECH: Department = {
      id: 'dept_mech',
      name: 'Mechanical Engineering',
      code: 'MECH',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const deptIT: Department = {
      id: 'dept_it',
      name: 'Information Technology',
      code: 'IT',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    [deptCSE, deptECE, deptMECH, deptIT].forEach((d) => this.departments.set(d.id, d));

    // 2. Academic Years
    const y1: AcademicYear = { id: 'year_1', name: 'Year 1', year_number: 1, status: 'ACTIVE', created_at: new Date().toISOString() };
    const y2: AcademicYear = { id: 'year_2', name: 'Year 2', year_number: 2, status: 'ACTIVE', created_at: new Date().toISOString() };
    const y3: AcademicYear = { id: 'year_3', name: 'Year 3', year_number: 3, status: 'ACTIVE', created_at: new Date().toISOString() };
    const y4: AcademicYear = { id: 'year_4', name: 'Year 4', year_number: 4, status: 'ACTIVE', created_at: new Date().toISOString() };

    [y1, y2, y3, y4].forEach((y) => this.years.set(y.id, y));

    // 3. Sections
    const secCSE2A: Section = { id: 'sec_cse_2a', department_id: deptCSE.id, year_id: y2.id, name: 'A', status: 'ACTIVE', created_at: new Date().toISOString() };
    const secCSE2B: Section = { id: 'sec_cse_2b', department_id: deptCSE.id, year_id: y2.id, name: 'B', status: 'ACTIVE', created_at: new Date().toISOString() };
    const secCSE2C: Section = { id: 'sec_cse_2c', department_id: deptCSE.id, year_id: y2.id, name: 'C', status: 'ACTIVE', created_at: new Date().toISOString() };
    const secCSE2D: Section = { id: 'sec_cse_2d', department_id: deptCSE.id, year_id: y2.id, name: 'D', status: 'ACTIVE', created_at: new Date().toISOString() };

    const secECE3A: Section = { id: 'sec_ece_3a', department_id: deptECE.id, year_id: y3.id, name: 'A', status: 'ACTIVE', created_at: new Date().toISOString() };
    const secECE3B: Section = { id: 'sec_ece_3b', department_id: deptECE.id, year_id: y3.id, name: 'B', status: 'ACTIVE', created_at: new Date().toISOString() };

    [secCSE2A, secCSE2B, secCSE2C, secCSE2D, secECE3A, secECE3B].forEach((s) => this.sections.set(s.id, s));

    // 4. Seed Users as per Section 23 of newupdation.md:
    // admin, counselor.cse2d, counselor2.cse2d, counselor.ece3a
    const defaultPasswordHash = 'change-me-immediately';

    const userAdmin: User = {
      id: 'usr_admin',
      name: 'Institutional Administrator',
      username: 'admin',
      password_hash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      email: 'admin@institution.edu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const userCounselorA: User = {
      id: 'usr_counselor_a',
      name: 'Dr. Ravi Kumar',
      username: 'counselor.cse2d',
      password_hash: defaultPasswordHash,
      role: 'COUNSELLOR',
      status: 'ACTIVE',
      email: 'ravi.kumar@institution.edu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const userCounselorB: User = {
      id: 'usr_counselor_b',
      name: 'Prof. Ananya Sharma',
      username: 'counselor2.cse2d',
      password_hash: defaultPasswordHash,
      role: 'COUNSELLOR',
      status: 'ACTIVE',
      email: 'ananya.sharma@institution.edu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const userCounselorC: User = {
      id: 'usr_counselor_c',
      name: 'Dr. Vikram Patel',
      username: 'counselor.ece3a',
      password_hash: defaultPasswordHash,
      role: 'COUNSELLOR',
      status: 'ACTIVE',
      email: 'vikram.patel@institution.edu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    [userAdmin, userCounselorA, userCounselorB, userCounselorC].forEach((u) => this.users.set(u.id, u));

    // 5. Counselor Assignments (Two counselors on CSE/2/D, one on ECE/3/A)
    const asgA: CounselorAssignment = {
      id: 'asg_counselor_a',
      counselor_id: userCounselorA.id,
      department_id: deptCSE.id,
      year_id: y2.id,
      section_id: secCSE2D.id,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString(),
    };

    const asgB: CounselorAssignment = {
      id: 'asg_counselor_b',
      counselor_id: userCounselorB.id,
      department_id: deptCSE.id,
      year_id: y2.id,
      section_id: secCSE2D.id,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString(),
    };

    const asgC: CounselorAssignment = {
      id: 'asg_counselor_c',
      counselor_id: userCounselorC.id,
      department_id: deptECE.id,
      year_id: y3.id,
      section_id: secECE3A.id,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString(),
    };

    [asgA, asgB, asgC].forEach((a) => this.assignments.set(a.id, a));

    // 6. Seed Cohort Students across CSE 2D and ECE 3A
    const seedStudents: Array<{
      student: Student;
      academic: AcademicRecord[];
      behaviour?: BehaviourRecord;
    }> = [
      {
        student: {
          register_number: '24CSE2D01',
          student_name: 'Aarav Sharma',
          department: 'CSE',
          department_id: deptCSE.id,
          program: 'B.Tech',
          year: 2,
          year_id: y2.id,
          section: 'D',
          section_id: secCSE2D.id,
          semester: 4,
          student_contact: 'aarav.sharma@example.com',
          parent_name: 'Rajesh Sharma',
          parent_contact: '+91 98765 43210',
          created_at: new Date().toISOString(),
        },
        academic: [
          {
            id: 'acad_24CSE2D01_baseline',
            register_number: '24CSE2D01',
            snapshot_label: 'Mid-Term 1',
            semester: 4,
            attendance_percentage: 54.0,
            sgpa: 5.1,
            cgpa: 5.8,
            backlog_count: 3,
            backlog_subjects: ['Data Structures', 'Discrete Math', 'OS'],
            assignment_performance: 45.0,
            lab_performance: 60.0,
            recorded_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'acad_24CSE2D01_latest',
            register_number: '24CSE2D01',
            snapshot_label: 'Mid-Term 2',
            semester: 4,
            attendance_percentage: 72.5,
            sgpa: 6.4,
            cgpa: 6.0,
            backlog_count: 1,
            backlog_subjects: ['Discrete Math'],
            assignment_performance: 78.0,
            lab_performance: 82.0,
            recorded_at: new Date().toISOString(),
          },
        ],
        behaviour: {
          id: 'beh_24CSE2D01',
          register_number: '24CSE2D01',
          disciplinary_issues: 'NONE',
          classroom_behaviour: 'Attentive after initial counseling; improved engagement.',
          academic_difficulties: 'Struggled with algorithmic recursion in Discrete Math.',
          recorded_at: new Date().toISOString(),
        },
      },
      {
        student: {
          register_number: '24CSE2D14',
          student_name: 'Priya Nair',
          department: 'CSE',
          department_id: deptCSE.id,
          program: 'B.Tech',
          year: 2,
          year_id: y2.id,
          section: 'D',
          section_id: secCSE2D.id,
          semester: 4,
          student_contact: 'priya.nair@example.com',
          parent_name: 'K. Nair',
          parent_contact: '+91 98765 11223',
          created_at: new Date().toISOString(),
        },
        academic: [
          {
            id: 'acad_24CSE2D14_latest',
            register_number: '24CSE2D14',
            snapshot_label: 'Mid-Term 2',
            semester: 4,
            attendance_percentage: 58.0,
            sgpa: 5.5,
            cgpa: 6.1,
            backlog_count: 2,
            backlog_subjects: ['Computer Organization', 'Algorithms'],
            assignment_performance: 50.0,
            lab_performance: 65.0,
            recorded_at: new Date().toISOString(),
          },
        ],
      },
      {
        student: {
          register_number: '24CSE2D28',
          student_name: 'Rohan Gupta',
          department: 'CSE',
          department_id: deptCSE.id,
          program: 'B.Tech',
          year: 2,
          year_id: y2.id,
          section: 'D',
          section_id: secCSE2D.id,
          semester: 4,
          student_contact: 'rohan.gupta@example.com',
          parent_name: 'Anil Gupta',
          parent_contact: '+91 98111 22334',
          created_at: new Date().toISOString(),
        },
        academic: [
          {
            id: 'acad_24CSE2D28_latest',
            register_number: '24CSE2D28',
            snapshot_label: 'Mid-Term 2',
            semester: 4,
            attendance_percentage: 88.0,
            sgpa: 8.4,
            cgpa: 8.2,
            backlog_count: 0,
            assignment_performance: 92.0,
            lab_performance: 90.0,
            recorded_at: new Date().toISOString(),
          },
        ],
      },
      {
        student: {
          register_number: '23ECE3A05',
          student_name: 'Deepak Varma',
          department: 'ECE',
          department_id: deptECE.id,
          program: 'B.Tech',
          year: 3,
          year_id: y3.id,
          section: 'A',
          section_id: secECE3A.id,
          semester: 6,
          student_contact: 'deepak.v@example.com',
          parent_name: 'S. Varma',
          parent_contact: '+91 94444 55555',
          created_at: new Date().toISOString(),
        },
        academic: [
          {
            id: 'acad_23ECE3A05_latest',
            register_number: '23ECE3A05',
            snapshot_label: 'Mid-Term 2',
            semester: 6,
            attendance_percentage: 52.0,
            sgpa: 4.8,
            cgpa: 5.2,
            backlog_count: 3,
            backlog_subjects: ['VLSI Design', 'DSP', 'Control Systems'],
            assignment_performance: 40.0,
            lab_performance: 55.0,
            recorded_at: new Date().toISOString(),
          },
        ],
      },
    ];

    for (const item of seedStudents) {
      this.students.set(item.student.register_number, item.student);
      item.academic.forEach((a) => this.academicRecords.push(a));
      if (item.behaviour) {
        this.behaviourRecords.set(item.student.register_number, item.behaviour);
      }
    }

    // Seed Audit Log
    this.recordAuditLog({
      user_id: userAdmin.id,
      username: userAdmin.username,
      user_role: userAdmin.role,
      action: 'LOGIN',
      entity_type: 'SYSTEM',
      metadata: { note: 'Initial system initialization completed' },
    });

    this.saveToLocalStorage();
    this.isInitialized = true;
  }

  // --- Audit Logging ---
  public recordAuditLog(params: {
    user_id: string;
    username: string;
    user_role: UserRole;
    action: AuditAction;
    entity_type: string;
    entity_id?: string;
    metadata?: Record<string, any>;
  }) {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...params,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // Keep max 500 logs in memory/storage
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveToLocalStorage();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // --- Users & Counselors ---
  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getCounselors(): User[] {
    return Array.from(this.users.values()).filter((u) => u.role === 'COUNSELLOR');
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByUsername(username: string): User | undefined {
    const uname = username.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === uname) {
        return user;
      }
    }
    return undefined;
  }

  public async authenticateUser(
    username: string,
    passwordPlain: string
  ): Promise<{ user: User; scope: CounselorScope | null } | null> {
    const user = this.getUserByUsername(username);
    if (!user || user.status === 'INACTIVE') return null;

    const isValid = await verifyPassword(passwordPlain, user.password_hash);
    if (!isValid) return null;

    let scope: CounselorScope | null = null;
    if (user.role === 'COUNSELLOR') {
      scope = this.getCounselorScope(user.id);
    }

    return { user, scope };
  }

  public getCounselorScope(counselorId: string): CounselorScope | null {
    const assignment = Array.from(this.assignments.values()).find(
      (a) => a.counselor_id === counselorId && a.status === 'ACTIVE'
    );
    if (!assignment) return null;

    const dept = this.departments.get(assignment.department_id);
    const yr = this.years.get(assignment.year_id);
    const sec = this.sections.get(assignment.section_id);

    if (!dept || !yr || !sec) return null;

    return {
      department_id: dept.id,
      department_name: dept.name,
      department_code: dept.code,
      year_id: yr.id,
      year_name: yr.name,
      year_number: yr.year_number,
      section_id: sec.id,
      section_name: sec.name,
    };
  }

  public getCounselorAssignment(counselorId: string): CounselorAssignment | undefined {
    return Array.from(this.assignments.values()).find(
      (a) => a.counselor_id === counselorId && a.status === 'ACTIVE'
    );
  }

  public getAllAssignments(): CounselorAssignment[] {
    return Array.from(this.assignments.values());
  }

  public getCounselorsForSection(sectionId: string): User[] {
    const activeAsgs = Array.from(this.assignments.values()).filter(
      (a) => a.section_id === sectionId && a.status === 'ACTIVE'
    );
    return activeAsgs
      .map((a) => this.users.get(a.counselor_id))
      .filter((u): u is User => Boolean(u));
  }

  public async createUser(
    params: {
      name: string;
      username: string;
      passwordPlain: string;
      role: UserRole;
      email?: string;
      phone?: string;
      department_id?: string;
      year_id?: string;
      section_id?: string;
    },
    adminUser: User
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const existing = this.getUserByUsername(params.username);
    if (existing) {
      return { success: false, error: `Username '${params.username}' is already taken.` };
    }

    // If assigning a section, enforce max 2 counselors per section
    if (params.role === 'COUNSELLOR' && params.section_id) {
      const activeCounselors = this.getCounselorsForSection(params.section_id);
      if (activeCounselors.length >= 2) {
        return {
          success: false,
          error: `Section already has 2 assigned counselors (maximum limit reached).`,
        };
      }
    }

    const hashedPassword = await hashPassword(params.passwordPlain);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      name: params.name,
      username: params.username,
      password_hash: hashedPassword,
      role: params.role,
      status: 'ACTIVE',
      email: params.email,
      phone: params.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.set(userId, newUser);

    // Create assignment if provided
    if (params.role === 'COUNSELLOR' && params.department_id && params.year_id && params.section_id) {
      const asgId = `asg_${Date.now()}`;
      const asg: CounselorAssignment = {
        id: asgId,
        counselor_id: userId,
        department_id: params.department_id,
        year_id: params.year_id,
        section_id: params.section_id,
        status: 'ACTIVE',
        assigned_at: new Date().toISOString(),
      };
      this.assignments.set(asgId, asg);
    }

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'CREATE_COUNSELOR',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { name: params.name, username: params.username, role: params.role },
    });

    this.saveToLocalStorage();
    return { success: true, user: newUser };
  }

  public async assignCounselorScope(
    counselorId: string,
    departmentId: string,
    yearId: string,
    sectionId: string,
    adminUser: User
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(counselorId);
    if (!user) return { success: false, error: 'User not found.' };

    // Enforce max 2 counselors per section
    const currentCounselorsOnSec = this.getCounselorsForSection(sectionId).filter(
      (c) => c.id !== counselorId
    );
    if (currentCounselorsOnSec.length >= 2) {
      return {
        success: false,
        error: `Cannot assign: Section already has the maximum of 2 counselors.`,
      };
    }

    // Remove existing assignments for this counselor
    for (const [id, asg] of this.assignments.entries()) {
      if (asg.counselor_id === counselorId) {
        this.assignments.delete(id);
      }
    }

    const asgId = `asg_${Date.now()}`;
    const asg: CounselorAssignment = {
      id: asgId,
      counselor_id: counselorId,
      department_id: departmentId,
      year_id: yearId,
      section_id: sectionId,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString(),
    };
    this.assignments.set(asgId, asg);

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'ASSIGN_COUNSELOR',
      entity_type: 'COUNSELOR_ASSIGNMENT',
      entity_id: asgId,
      metadata: { counselor_id: counselorId, departmentId, yearId, sectionId },
    });

    this.saveToLocalStorage();
    return { success: true };
  }

  public async updateUserStatus(
    userId: string,
    status: EntityStatus,
    adminUser: User
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.status = status;
    user.updated_at = new Date().toISOString();

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: status === 'INACTIVE' ? 'DISABLE_COUNSELOR' : 'ENABLE_COUNSELOR',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { status },
    });

    this.saveToLocalStorage();
    return true;
  }

  public async resetUserPassword(
    userId: string,
    newPasswordPlain: string,
    adminUser: User
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.password_hash = await hashPassword(newPasswordPlain);
    user.updated_at = new Date().toISOString();

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'RESET_PASSWORD',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { username: user.username },
    });

    this.saveToLocalStorage();
    return true;
  }

  // --- Departments, Years, Sections ---
  public getDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  public getActiveDepartments(): Department[] {
    return Array.from(this.departments.values()).filter((d) => d.status === 'ACTIVE');
  }

  public addDepartment(name: string, code: string, adminUser: User): Department {
    const id = `dept_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
    const dept: Department = {
      id,
      name,
      code: code.toUpperCase(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.departments.set(id, dept);

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'CREATE_DEPARTMENT',
      entity_type: 'DEPARTMENT',
      entity_id: id,
      metadata: { name, code },
    });

    this.saveToLocalStorage();
    return dept;
  }

  public updateDepartment(id: string, name: string, code: string, status: EntityStatus, adminUser: User): boolean {
    const dept = this.departments.get(id);
    if (!dept) return false;
    dept.name = name;
    dept.code = code.toUpperCase();
    dept.status = status;
    dept.updated_at = new Date().toISOString();

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'UPDATE_DEPARTMENT',
      entity_type: 'DEPARTMENT',
      entity_id: id,
      metadata: { name, code, status },
    });

    this.saveToLocalStorage();
    return true;
  }

  public getYears(): AcademicYear[] {
    return Array.from(this.years.values()).sort((a, b) => a.year_number - b.year_number);
  }

  public addYear(name: string, yearNumber: number, adminUser: User): AcademicYear {
    const id = `year_${yearNumber}_${Date.now()}`;
    const year: AcademicYear = {
      id,
      name,
      year_number: yearNumber,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    this.years.set(id, year);

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'CREATE_YEAR',
      entity_type: 'ACADEMIC_YEAR',
      entity_id: id,
      metadata: { name, yearNumber },
    });

    this.saveToLocalStorage();
    return year;
  }

  public getSections(): Section[] {
    return Array.from(this.sections.values());
  }

  public addSection(departmentId: string, yearId: string, name: string, adminUser: User): Section {
    const id = `sec_${departmentId}_${yearId}_${name.toLowerCase()}_${Date.now()}`;
    const section: Section = {
      id,
      department_id: departmentId,
      year_id: yearId,
      name: name.toUpperCase(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    this.sections.set(id, section);

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: 'CREATE_SECTION',
      entity_type: 'SECTION',
      entity_id: id,
      metadata: { departmentId, yearId, name },
    });

    this.saveToLocalStorage();
    return section;
  }

  public updateSectionStatus(sectionId: string, status: EntityStatus, adminUser: User): boolean {
    const sec = this.sections.get(sectionId);
    if (!sec) return false;
    sec.status = status;

    this.recordAuditLog({
      user_id: adminUser.id,
      username: adminUser.username,
      user_role: adminUser.role,
      action: status === 'INACTIVE' ? 'DISABLE_SECTION' : 'UPDATE_SECTION',
      entity_type: 'SECTION',
      entity_id: sectionId,
      metadata: { status },
    });

    this.saveToLocalStorage();
    return true;
  }

  // --- Scoped Query Helpers ---
  public isStudentInScope(student: Student, scope?: CounselorScope | null): boolean {
    if (!scope) return true; // Admin has full access

    // Check by ID if available, or fall back to code/number matching
    const matchDept =
      (student.department_id && student.department_id === scope.department_id) ||
      student.department.toUpperCase() === scope.department_code.toUpperCase();

    const matchYear =
      (student.year_id && student.year_id === scope.year_id) ||
      Number(student.year) === Number(scope.year_number);

    const matchSection =
      (student.section_id && student.section_id === scope.section_id) ||
      student.section.toUpperCase() === scope.section_name.toUpperCase();

    return Boolean(matchDept && matchYear && matchSection);
  }

  public getStudentsList(scope?: CounselorScope | null): Student[] {
    const all = Array.from(this.students.values());
    if (!scope) return all;
    return all.filter((s) => this.isStudentInScope(s, scope));
  }

  public getStudent(registerNumber: string, scope?: CounselorScope | null): Student | undefined {
    const student = this.students.get(registerNumber.toUpperCase());
    if (!student) return undefined;
    if (scope && !this.isStudentInScope(student, scope)) {
      return undefined; // Out of scope -> 403 / forbidden
    }
    return student;
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

  public getAllCounsellingSessions(scope?: CounselorScope | null): CounsellingSession[] {
    const all = [...this.counsellingSessions].sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );
    if (!scope) return all;

    return all.filter((session) => {
      const student = this.students.get(session.register_number);
      return student ? this.isStudentInScope(student, scope) : false;
    });
  }

  public getFollowUps(scope?: CounselorScope | null): FollowUpItem[] {
    const all = [...this.followUps].sort(
      (a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
    );
    if (!scope) return all;

    return all.filter((f) => {
      const student = this.students.get(f.register_number);
      return student ? this.isStudentInScope(student, scope) : false;
    });
  }

  public getCompleteStudentRecord(
    registerNumber: string,
    scope?: CounselorScope | null
  ): CompleteStudentRecord | null {
    const student = this.getStudent(registerNumber, scope);
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

  public getAllCompleteStudentRecords(scope?: CounselorScope | null): CompleteStudentRecord[] {
    const list: CompleteStudentRecord[] = [];
    const studentList = this.getStudentsList(scope);
    for (const student of studentList) {
      const record = this.getCompleteStudentRecord(student.register_number, scope);
      if (record) {
        list.push(record);
      }
    }
    return list;
  }

  public getImprovementComparison(registerNumber: string): ImprovementComparison | null {
    const student = this.students.get(registerNumber.toUpperCase());
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
      department_id: student.department_id,
      year: student.year,
      year_id: student.year_id,
      section: student.section,
      section_id: student.section_id,
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

  public getAllImprovementComparisons(scope?: CounselorScope | null): ImprovementComparison[] {
    const list: ImprovementComparison[] = [];
    const students = this.getStudentsList(scope);
    for (const student of students) {
      const comp = this.getImprovementComparison(student.register_number);
      if (comp) list.push(comp);
    }
    return list;
  }

  public getDashboardStats(scope?: CounselorScope | null): DashboardStats {
    const records = this.getAllCompleteStudentRecords(scope);
    let criticalRiskCount = 0;
    let highRiskCount = 0;
    let moderateRiskCount = 0;
    let lowRiskCount = 0;
    let improvedStudentsCount = 0;

    const departmentBreakdown: Record<string, { total: number; highOrCritical: number }> = {};

    for (const r of records) {
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

      if (
        r.improvement &&
        (r.improvement.status === 'IMPROVED' || r.improvement.status === 'PARTIALLY_IMPROVED')
      ) {
        improvedStudentsCount++;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const followUpsList = this.getFollowUps(scope);

    const followUpsDueCount = followUpsList.filter(
      (f) => f.status === 'PENDING' && f.follow_up_date <= today
    ).length;

    const followUpsUpcomingCount = followUpsList.filter(
      (f) => f.status === 'PENDING' && f.follow_up_date > today
    ).length;

    const riskDistribution = [
      { name: 'Critical Risk', value: criticalRiskCount, color: '#e11d48' },
      { name: 'High Risk', value: highRiskCount, color: '#ea580c' },
      { name: 'Moderate Risk', value: moderateRiskCount, color: '#d97706' },
      { name: 'Low Risk', value: lowRiskCount, color: '#10b981' },
    ].filter((item) => item.value > 0);

    const sessions = this.getAllCounsellingSessions(scope);

    return {
      totalStudents: records.length,
      criticalRiskCount,
      highRiskCount,
      moderateRiskCount,
      lowRiskCount,
      followUpsDueCount,
      followUpsUpcomingCount,
      totalCounsellingSessions: sessions.length,
      improvedStudentsCount,
      departmentBreakdown,
      riskDistribution,
      counselorCount: this.getCounselors().length,
      departmentsCount: this.departments.size,
      sectionsCount: this.sections.size,
    };
  }

  // --- CSV Ingestion with Scope Enforcement ---
  public importData(params: {
    filename: string;
    snapshotLabel: string;
    students: Student[];
    academicRecords: AcademicRecord[];
    behaviourRecords: BehaviourRecord[];
    importedBy?: string;
    scope?: CounselorScope | null;
    currentUser: User;
  }): { success: boolean; error?: string; importRecord?: DataImport } {
    const {
      filename,
      snapshotLabel,
      students,
      academicRecords,
      behaviourRecords,
      importedBy = params.currentUser.name,
      scope = null,
      currentUser,
    } = params;

    // Strict counselor scope validation
    if (scope && currentUser.role === 'COUNSELLOR') {
      const unauthorizedRows = students.filter(
        (s) => !this.isStudentInScope(s, scope)
      );

      if (unauthorizedRows.length > 0) {
        return {
          success: false,
          error: `Import blocked. The file contains ${unauthorizedRows.length} student(s) outside your assigned scope (${scope.department_code} • Year ${scope.year_number} • Section ${scope.section_name}). Examples: ${unauthorizedRows
            .slice(0, 3)
            .map((s) => `${s.register_number} (${s.department} Year ${s.year} Sec ${s.section})`)
            .join(', ')}`,
        };
      }
    }

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
      department_scope: scope ? scope.department_code : 'ALL',
      year_scope: scope ? `Year ${scope.year_number}` : 'ALL',
      section_scope: scope ? scope.section_name : 'ALL',
    };

    // Auto-link departmental IDs if possible
    for (const s of students) {
      if (!s.department_id) {
        const d = Array.from(this.departments.values()).find(
          (dept) => dept.code.toUpperCase() === s.department.toUpperCase()
        );
        if (d) s.department_id = d.id;
      }
      if (!s.year_id) {
        const y = Array.from(this.years.values()).find(
          (yr) => Number(yr.year_number) === Number(s.year)
        );
        if (y) s.year_id = y.id;
      }
      if (!s.section_id && s.department_id && s.year_id) {
        const sec = Array.from(this.sections.values()).find(
          (sec) =>
            sec.department_id === s.department_id &&
            sec.year_id === s.year_id &&
            sec.name.toUpperCase() === s.section.toUpperCase()
        );
        if (sec) s.section_id = sec.id;
      }

      this.students.set(s.register_number.toUpperCase(), s);
    }

    for (const a of academicRecords) {
      this.academicRecords.push({
        ...a,
        import_id: importId,
        snapshot_label: snapshotLabel,
      });
    }

    for (const b of behaviourRecords) {
      this.behaviourRecords.set(b.register_number.toUpperCase(), b);
    }

    this.dataImports.unshift(importRecord);

    this.recordAuditLog({
      user_id: currentUser.id,
      username: currentUser.username,
      user_role: currentUser.role,
      action: 'IMPORT_CSV',
      entity_type: 'DATA_IMPORT',
      entity_id: importId,
      metadata: {
        filename,
        snapshotLabel,
        totalRows: students.length,
        scope: scope ? `${scope.department_code}_Y${scope.year_number}_${scope.section_name}` : 'INSTITUTION_WIDE',
      },
    });

    this.saveToLocalStorage();
    return { success: true, importRecord };
  }

  public getDataImports(scope?: CounselorScope | null): DataImport[] {
    const all = [...this.dataImports].sort(
      (a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime()
    );
    if (!scope) return all;

    return all.filter((imp) => {
      if (!imp.department_scope || imp.department_scope === 'ALL') return true;
      return (
        imp.department_scope === scope.department_code &&
        imp.section_scope === scope.section_name
      );
    });
  }

  // --- Counselling & Follow-ups ---
  public recordCounsellingSession(
    session: Omit<CounsellingSession, 'id' | 'created_at'>,
    currentUser?: User
  ): CounsellingSession {
    const sessionId = `session_${Date.now()}`;
    const newSession: CounsellingSession = {
      ...session,
      id: sessionId,
      counsellor_id: session.counsellor_id || currentUser?.id || 'usr_counsellor',
      counsellor_name: session.counsellor_name || currentUser?.name || 'Counselor',
      created_by: currentUser?.id || session.counsellor_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.counsellingSessions.unshift(newSession);

    if (session.follow_up_date) {
      const student = this.getStudent(session.register_number);
      const studentFull = this.getCompleteStudentRecord(session.register_number);
      const followUpItem: FollowUpItem = {
        id: `followup_${Date.now()}`,
        session_id: sessionId,
        register_number: session.register_number,
        student_name: student?.student_name || 'Student',
        department: student?.department || 'Unknown',
        department_id: student?.department_id,
        year: student?.year || 1,
        year_id: student?.year_id,
        section: student?.section || 'A',
        section_id: student?.section_id,
        follow_up_date: session.follow_up_date,
        status: (session.follow_up_status as FollowUpStatus) || 'PENDING',
        counsellor_id: newSession.counsellor_id,
        counsellor_name: newSession.counsellor_name,
        created_by: newSession.created_by,
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

    if (currentUser) {
      this.recordAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        user_role: currentUser.role,
        action: 'CREATE_COUNSELLING_RECORD',
        entity_type: 'COUNSELLING_SESSION',
        entity_id: sessionId,
        metadata: {
          register_number: session.register_number,
          type: session.counselling_type,
        },
      });
    }

    this.saveToLocalStorage();
    return newSession;
  }

  public toggleActionPlanItem(sessionId: string, actionId: string, completed: boolean) {
    const session = this.counsellingSessions.find((s) => s.id === sessionId);
    if (session) {
      const item = session.action_plan.find((a) => a.id === actionId);
      if (item) item.completed = completed;

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

  public conductFollowUpReview(params: {
    followUpId: string;
    status: FollowUpStatus;
    improvementStatus?: ImprovementStatus;
    notes?: string;
    actionPlan?: ActionPlanItem[];
    currentUser?: User;
  }) {
    const { followUpId, status, improvementStatus, notes, actionPlan, currentUser } = params;
    const f = this.followUps.find((item) => item.id === followUpId);
    if (f) {
      f.status = status;
      if (notes !== undefined) f.notes = notes;
      if (improvementStatus) f.improvement_status = improvementStatus;
      if (actionPlan) {
        f.action_plan_items = actionPlan;
        f.completed_actions_count = actionPlan.filter((a) => a.completed).length;
      }

      const session = this.counsellingSessions.find((s) => s.id === f.session_id);
      if (session) {
        session.follow_up_status = status;
        if (actionPlan) session.action_plan = actionPlan;
        session.updated_at = new Date().toISOString();
      }

      if (currentUser) {
        this.recordAuditLog({
          user_id: currentUser.id,
          username: currentUser.username,
          user_role: currentUser.role,
          action: 'COMPLETE_FOLLOWUP',
          entity_type: 'FOLLOWUP',
          entity_id: followUpId,
          metadata: { status, student: f.register_number },
        });
      }

      this.saveToLocalStorage();
    }
  }

  public updateFollowUpStatus(followUpId: string, status: FollowUpStatus, notes?: string) {
    const f = this.followUps.find((item) => item.id === followUpId);
    if (f) {
      f.status = status;
      if (notes !== undefined) f.notes = notes;

      const session = this.counsellingSessions.find((s) => s.id === f.session_id);
      if (session) {
        session.follow_up_status = status;
      }
      this.saveToLocalStorage();
    }
  }

  // --- Deletion with Cascade & Audit ---
  public deleteStudent(registerNumber: string, currentUser?: User): boolean {
    const regUpper = registerNumber.toUpperCase().trim();
    if (!this.students.has(regUpper)) return false;

    this.students.delete(regUpper);
    this.academicRecords = this.academicRecords.filter(
      (a) => a.register_number.toUpperCase().trim() !== regUpper
    );
    this.behaviourRecords.delete(regUpper);
    this.counsellingSessions = this.counsellingSessions.filter(
      (s) => s.register_number.toUpperCase().trim() !== regUpper
    );
    this.followUps = this.followUps.filter(
      (f) => f.register_number.toUpperCase().trim() !== regUpper
    );

    if (currentUser) {
      this.recordAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        user_role: currentUser.role,
        action: 'DELETE_STUDENT',
        entity_type: 'STUDENT',
        entity_id: regUpper,
        metadata: { registerNumber: regUpper },
      });
    }

    this.saveToLocalStorage();
    return true;
  }

  // --- Risk Config ---
  public getRiskConfig(): RiskThresholdConfig {
    return this.riskConfig;
  }

  public setRiskConfig(config: Partial<RiskThresholdConfig>, currentUser?: User) {
    this.riskConfig = { ...this.riskConfig, ...config };

    if (currentUser) {
      this.recordAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        user_role: currentUser.role,
        action: 'CHANGE_RISK_CONFIG',
        entity_type: 'RISK_CONFIG',
        metadata: { newConfig: this.riskConfig },
      });
    }

    this.saveToLocalStorage();
  }

  public clearAll(currentUser?: User) {
    this.students.clear();
    this.academicRecords = [];
    this.behaviourRecords.clear();
    this.counsellingSessions = [];
    this.followUps = [];
    this.dataImports = [];

    if (currentUser) {
      this.recordAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        user_role: currentUser.role,
        action: 'CLEAR_ALL_DATA',
        entity_type: 'SYSTEM',
        metadata: { note: 'All student cohort data cleared' },
      });
    }

    this.saveToLocalStorage();
  }
}

export const store = new CounsellStore();
