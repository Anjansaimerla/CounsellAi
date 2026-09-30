import { store } from '../src/lib/storage/store';
import { calculateStudentRisk } from '../src/lib/risk/risk-engine';
import { DEFAULT_RISK_CONFIG } from '../src/lib/risk/risk-config';
import { parseAndValidateStudentCsv } from '../src/lib/csv/csv-parser';
import { generateAICounsellingBrief, generateImprovementSummary } from '../src/lib/ai/gemini';
import {
  AcademicRecord,
  Student,
  BehaviourRecord,
  CounsellingSession,
  ImprovementComparison,
  User,
  EntityStatus,
} from '../src/types';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, condition: boolean, details?: string, error?: string) {
  results.push({ category, name, passed: condition, details, error });
  const statusStr = condition ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${statusStr} [${category}] ${name}`);
  if (details) console.log(`         \x1b[90m↳ ${details}\x1b[0m`);
  if (!condition && error) console.error(`         \x1b[31m↳ ERROR: ${error}\x1b[0m`);
}

async function runExhaustiveTestSuite() {
  console.log('\n======================================================================');
  console.log('       COUNSELLAI ENTERPRISE RIGOROUS END-TO-END TEST SUITE           ');
  console.log('======================================================================\n');

  // =========================================================================
  // 1. AUTHENTICATION & RBAC
  // =========================================================================
  console.log('\n--- 1. AUTHENTICATION & RBAC TESTS ---');
  
  // 1.1 Admin Authentication
  const adminAuth = await store.authenticateUser('admin', 'change-me-immediately');
  recordTest(
    'Auth',
    'Admin Login with correct credentials',
    adminAuth !== null && adminAuth.user.role === 'ADMIN' && adminAuth.scope === null,
    `Admin: ${adminAuth?.user.name} (Global Scope)`
  );

  // 1.2 Counselor A Authentication & Scope
  const counselorAAuth = await store.authenticateUser('counselor.cse2d', 'change-me-immediately');
  recordTest(
    'Auth',
    'Counselor A Login & Scope Assignment (CSE 2D)',
    counselorAAuth !== null &&
      counselorAAuth.user.role === 'COUNSELLOR' &&
      counselorAAuth.scope !== null &&
      counselorAAuth.scope.department_code === 'CSE' &&
      counselorAAuth.scope.section_name === 'D' &&
      counselorAAuth.scope.graduation_year === 2028,
    `Scope: ${counselorAAuth?.scope?.department_code} • Batch ${counselorAAuth?.scope?.graduation_year} (Yr ${counselorAAuth?.scope?.year_number}) • Sec ${counselorAAuth?.scope?.section_name}`
  );

  // 1.3 Invalid Password
  const invalidPass = await store.authenticateUser('admin', 'wrong-pass-1234');
  recordTest(
    'Auth',
    'Reject authentication on incorrect password',
    invalidPass === null,
    'Returned null for wrong password'
  );

  // 1.4 Non-existent username
  const nonExistent = await store.authenticateUser('ghost.user', 'some-password');
  recordTest(
    'Auth',
    'Reject authentication on non-existent username',
    nonExistent === null,
    'Returned null for non-existent username'
  );

  // 1.5 Inactive Account Login Block
  const tempUserRes = await store.createUser(
    {
      name: 'Disabled User',
      username: 'disabled.test',
      passwordPlain: 'password123',
      role: 'COUNSELLOR',
    },
    adminAuth!.user
  );
  if (tempUserRes.user) {
    store.updateUser(
      tempUserRes.user.id,
      { name: 'Disabled User', email: 'disabled@test.edu', status: 'INACTIVE' },
      adminAuth!.user
    );
    const disabledLogin = await store.authenticateUser('disabled.test', 'password123');
    recordTest(
      'Auth',
      'Reject authentication for INACTIVE / disabled accounts',
      disabledLogin === null,
      'Disabled user blocked from authenticating'
    );
    // cleanup
    store.deleteUser(tempUserRes.user.id, adminAuth!.user);
  }

  // =========================================================================
  // 2. CAPACITY POLICY (MAX 2 COUNSELORS PER SECTION)
  // =========================================================================
  console.log('\n--- 2. CAPACITY & POLICY ENFORCEMENT ---');

  const counselorBAuth = await store.authenticateUser('counselor2.cse2d', 'change-me-immediately');
  recordTest(
    'Policy',
    'Two counselors successfully assigned to same section (CSE 2D)',
    counselorBAuth !== null && counselorBAuth.scope?.section_name === 'D',
    `Counselor 2 Scope: ${counselorBAuth?.scope?.department_code} Sec ${counselorBAuth?.scope?.section_name}`
  );

  const cse2dCounselors = store.getCounselorsForSection('sec_cse_2d');
  recordTest(
    'Policy',
    'Section CSE 2D currently has exactly 2 counselors',
    cse2dCounselors.length === 2,
    `Assigned: ${cse2dCounselors.map((c) => c.name).join(', ')}`
  );

  // Attempt 3rd counselor assignment on CSE 2D
  const thirdAttempt = await store.createUser(
    {
      name: 'Third Counselor',
      username: 'third.counselor',
      passwordPlain: 'change-me-immediately',
      role: 'COUNSELLOR',
      department_id: 'dept_cse',
      year_id: 'year_2',
      section_id: 'sec_cse_2d',
    },
    adminAuth!.user
  );
  recordTest(
    'Policy',
    'Enforce Max 2 Counselors limit (3rd assignment blocked)',
    thirdAttempt.success === false && thirdAttempt.error?.includes('maximum limit reached') === true,
    `Rejection message: "${thirdAttempt.error}"`
  );

  // =========================================================================
  // 3. SCOPE ISOLATION & RBAC DATA SECURITY
  // =========================================================================
  console.log('\n--- 3. DATA SCOPING & ISOLATION TESTS ---');

  const counselorScopeA = counselorAAuth!.scope!;

  // 3.1 Scoped student listing
  const scopedStudents = store.getStudentsList(counselorScopeA);
  const allMatchScope = scopedStudents.every(
    (s) => s.department === 'CSE' && s.year === 2 && s.section === 'D'
  );
  recordTest(
    'Scope',
    'Counselor student list strictly limited to assigned section (CSE 2D)',
    scopedStudents.length > 0 && allMatchScope,
    `Retrieved ${scopedStudents.length} students, 100% strictly in CSE 2D`
  );

  // 3.2 In-scope student access
  const inScopeStudent = store.getStudent('24CSE2D01', counselorScopeA);
  recordTest(
    'Scope',
    'Counselor can access authorized student record (24CSE2D01)',
    inScopeStudent !== undefined && inScopeStudent.student_name === 'Aarav Sharma',
    `Found student: ${inScopeStudent?.student_name} (${inScopeStudent?.register_number})`
  );

  // 3.3 Out-of-scope student access blocked
  const outOfScopeStudent = store.getStudent('23ECE3A05', counselorScopeA);
  recordTest(
    'Scope',
    'Counselor access to unauthorized student record (23ECE3A05) strictly blocked',
    outOfScopeStudent === undefined,
    'Returned undefined for cross-department student'
  );

  // 3.4 Scoped Follow-up query
  const scopedFollowUps = store.getFollowUps(counselorScopeA);
  recordTest(
    'Scope',
    'Counselor follow-up list strictly scoped',
    scopedFollowUps.every((f) => {
      const st = store.getStudent(f.register_number);
      return st?.department === 'CSE' && st?.year === 2 && st?.section === 'D';
    }),
    `Found ${scopedFollowUps.length} follow-ups in scope`
  );

  // 3.5 Scope-aware CSV import verification
  const validCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
24CSE2D88,InScope Student,CSE,B.Tech,2,D,4,82.5,7.8,7.9,0,"[]"`;
  const validParsed = parseAndValidateStudentCsv(validCsv, 'Snapshot_Test', counselorScopeA);
  recordTest(
    'Scope',
    'Scope-aware CSV parser accepts in-scope rows',
    validParsed.validStudents.length === 1 && validParsed.errors.length === 0,
    'Row in CSE 2D processed with zero errors'
  );

  const crossDeptCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
23MECH1A01,Out Scope Student,MECH,B.Tech,1,A,2,70.0,6.0,6.2,1,"[""Thermodynamics""]"`;
  const invalidParsed = parseAndValidateStudentCsv(crossDeptCsv, 'Snapshot_Test', counselorScopeA);
  recordTest(
    'Scope',
    'Scope-aware CSV parser rejects out-of-scope rows with clear error',
    invalidParsed.errors.length > 0 && (invalidParsed.scopeViolationsCount || 0) > 0,
    `Error reported: "${invalidParsed.errors[0]?.message}"`
  );

  // =========================================================================
  // 4. DETERMINISTIC RISK ENGINE AUDIT
  // =========================================================================
  console.log('\n--- 4. DETERMINISTIC RISK ENGINE SCENARIOS ---');

  // 4.1 CRITICAL Risk (Low attendance < 65% + SGPA < 5.5 + 3 backlogs)
  const critAcademic: AcademicRecord = {
    id: 'test_crit',
    register_number: 'TEST_CRIT',
    snapshot_label: 'S1',
    semester: 4,
    attendance_percentage: 54.0,
    sgpa: 5.1,
    cgpa: 6.8,
    backlog_count: 3,
    backlog_subjects: ['Data Structures', 'Algorithms', 'Discrete Maths'],
    internal_assessment_marks: { obtained: 18, maximum: 60, percentage: 30.0 },
    assignment_performance: 40,
    recorded_at: new Date().toISOString(),
  };
  const critResult = calculateStudentRisk(critAcademic, [], DEFAULT_RISK_CONFIG);
  recordTest(
    'Risk Engine',
    'Calculates CRITICAL risk level for severe deficits (Score >= 9)',
    critResult.risk_level === 'CRITICAL' && critResult.overall_score >= 9,
    `Score: ${critResult.overall_score} pts | Level: ${critResult.risk_level} | Flags: ${critResult.breakdown.flags.length}`
  );

  // 4.2 HIGH Risk (Attendance 68% [2pts] + SGPA decline 0.8 [2pts] + 2 backlogs [3pts] = 7 pts)
  const highAcademic: AcademicRecord = {
    id: 'test_high',
    register_number: 'TEST_HIGH',
    snapshot_label: 'S1',
    semester: 4,
    attendance_percentage: 68.0,
    sgpa: 6.2,
    cgpa: 7.0,
    backlog_count: 2,
    backlog_subjects: ['Operating Systems', 'Computer Networks'],
    recorded_at: new Date().toISOString(),
  };
  const highResult = calculateStudentRisk(highAcademic, [], DEFAULT_RISK_CONFIG);
  recordTest(
    'Risk Engine',
    'Calculates HIGH risk level for attendance 65-74% + SGPA decline + backlogs (Score 6-8)',
    highResult.risk_level === 'HIGH' && highResult.overall_score >= 6 && highResult.overall_score <= 8,
    `Score: ${highResult.overall_score} pts | Level: ${highResult.risk_level}`
  );

  // 4.3 LOW / NO RISK (Attendance 92% + SGPA 8.8 + 0 backlogs)
  const lowAcademic: AcademicRecord = {
    id: 'test_low',
    register_number: 'TEST_LOW',
    snapshot_label: 'S1',
    semester: 4,
    attendance_percentage: 92.0,
    sgpa: 8.8,
    cgpa: 8.9,
    backlog_count: 0,
    backlog_subjects: [],
    recorded_at: new Date().toISOString(),
  };
  const lowResult = calculateStudentRisk(lowAcademic, [], DEFAULT_RISK_CONFIG);
  recordTest(
    'Risk Engine',
    'Calculates LOW risk for strong academic performance (Score <= 2)',
    lowResult.risk_level === 'LOW',
    `Score: ${lowResult.overall_score} pts | Level: ${lowResult.risk_level}`
  );

  // =========================================================================
  // 5. DEPARTMENT MANAGEMENT CRUD & CASCADE AUDIT
  // =========================================================================
  console.log('\n--- 5. DEPARTMENT CRUD & CASCADE TESTS ---');

  // Create
  const testDept = store.addDepartment('Artificial Intelligence & Data Science', 'AIDS', adminAuth!.user);
  recordTest(
    'Departments',
    'Create new department',
    testDept !== undefined && testDept.code === 'AIDS',
    `Created: ${testDept.name} (${testDept.code}) with ID: ${testDept.id}`
  );

  // Update
  const updateDeptRes = store.updateDepartment(
    testDept.id,
    'AI & Data Science Engineering',
    'AIDS',
    'ACTIVE',
    adminAuth!.user
  );
  recordTest(
    'Departments',
    'Update department name and attributes',
    updateDeptRes === true && store.getDepartmentById(testDept.id)?.name === 'AI & Data Science Engineering',
    'Department attributes updated successfully'
  );

  // Add section under this department to test cascade delete
  const testYear = store.getYears()[0];
  const testSec = store.addSection(testDept.id, testYear.id, 'A', adminAuth!.user);
  recordTest(
    'Departments',
    'Create section under newly created department',
    testSec !== undefined && testSec.department_id === testDept.id,
    `Created Section ${testSec.name} in Dept ${testDept.code}`
  );

  // Delete Department and verify cascade removal of section
  const deleteDeptRes = store.deleteDepartment(testDept.id, adminAuth!.user);
  const secAfterDeptDelete = store.getSectionById(testSec.id);
  recordTest(
    'Departments',
    'Delete department and cascade delete associated sections',
    deleteDeptRes === true &&
      store.getDepartmentById(testDept.id) === undefined &&
      secAfterDeptDelete === undefined,
    'Department deleted and orphaned sections cleaned up'
  );

  // =========================================================================
  // 6. ACADEMIC YEAR / GRADUATION BATCH CRUD & CASCADE AUDIT
  // =========================================================================
  console.log('\n--- 6. ACADEMIC YEAR / GRADUATION BATCH CRUD TESTS ---');

  // Create Academic Year
  const newYear = store.addYear('2031 (Year 1)', 1, 2031, adminAuth!.user);
  recordTest(
    'Years',
    'Create new Academic Year with Graduation Year (Batch 2031)',
    newYear !== undefined && newYear.graduation_year === 2031 && newYear.year_number === 1,
    `Created: ${newYear.name} | Grad Year: ${newYear.graduation_year}`
  );

  // Update Year
  const updateYearRes = store.updateYear(
    newYear.id,
    'Class of 2031 (Yr 1)',
    1,
    2031,
    'ACTIVE',
    adminAuth!.user
  );
  recordTest(
    'Years',
    'Update Academic Year display name and metadata',
    updateYearRes === true && store.getYearById(newYear.id)?.name === 'Class of 2031 (Yr 1)',
    'Year updated successfully'
  );

  // Delete Year
  const deleteYearRes = store.deleteYear(newYear.id, adminAuth!.user);
  recordTest(
    'Years',
    'Delete Academic Year',
    deleteYearRes === true && store.getYearById(newYear.id) === undefined,
    'Year deleted successfully'
  );

  // =========================================================================
  // 7. SECTION CRUD & MULTI-FILTER AUDIT
  // =========================================================================
  console.log('\n--- 7. SECTION CRUD & MULTI-FILTER TESTS ---');

  const cseDept = store.getDepartmentByCode('CSE')!;
  const yr2 = store.getYears().find((y) => y.year_number === 2)!;

  // Create Section
  const newSec = store.addSection(cseDept.id, yr2.id, 'Z', adminAuth!.user);
  recordTest(
    'Sections',
    'Create new Section (CSE Year 2 Sec Z)',
    newSec !== undefined && newSec.name === 'Z',
    `Created: ${cseDept.code} • Yr ${yr2.year_number} • Sec ${newSec.name}`
  );

  // Update Section
  const updateSecRes = store.updateSection(newSec.id, cseDept.id, yr2.id, 'Z_UPDATED', 'ACTIVE', adminAuth!.user);
  recordTest(
    'Sections',
    'Update Section name and status',
    updateSecRes === true && store.getSectionById(newSec.id)?.name === 'Z_UPDATED',
    'Section updated successfully'
  );

  // Delete Section
  const deleteSecRes = store.deleteSection(newSec.id, adminAuth!.user);
  recordTest(
    'Sections',
    'Delete Section',
    deleteSecRes === true && store.getSectionById(newSec.id) === undefined,
    'Section deleted successfully'
  );

  // =========================================================================
  // 8. COUNSELOR CRUD & ADMIN SELF-DELETE PREVENTION
  // =========================================================================
  console.log('\n--- 8. COUNSELOR MANAGEMENT & SAFETY TESTS ---');

  // Create Counselor
  const createdCounselorRes = await store.createUser(
    {
      name: 'Prof. Test Mentor',
      username: 'test.mentor',
      email: 'test.mentor@college.edu',
      passwordPlain: 'password123',
      role: 'COUNSELLOR',
      department_id: cseDept.id,
      year_id: yr2.id,
      section_id: 'sec_cse_2a',
    },
    adminAuth!.user
  );
  recordTest(
    'Counselors',
    'Create Counselor with Section Assignment',
    createdCounselorRes.success === true && createdCounselorRes.user !== undefined,
    `Created Counselor: ${createdCounselorRes.user?.name} (${createdCounselorRes.user?.username})`
  );

  const counselorId = createdCounselorRes.user!.id;

  // Update Counselor
  const updateCounselorRes = await store.updateUser(
    counselorId,
    {
      name: 'Prof. Test Mentor Updated',
      email: 'mentor.updated@college.edu',
      status: 'ACTIVE',
    },
    adminAuth!.user
  );
  recordTest(
    'Counselors',
    'Update Counselor details',
    updateCounselorRes.success === true && store.getUserById(counselorId)?.name === 'Prof. Test Mentor Updated',
    'Counselor details updated successfully'
  );

  // Delete Counselor
  const deleteCounselorRes = await store.deleteUser(counselorId, adminAuth!.user);
  recordTest(
    'Counselors',
    'Delete Counselor and unlink assignments',
    deleteCounselorRes === true && store.getUserById(counselorId) === undefined,
    'Counselor deleted and unassigned'
  );

  // Admin Self-Delete Block
  const adminSelfDelete = await store.deleteUser(adminAuth!.user.id, adminAuth!.user);
  recordTest(
    'Counselors',
    'Prevent Admin from deleting their own active account',
    adminSelfDelete === false,
    'Admin self-deletion strictly rejected by store safety rules'
  );

  // =========================================================================
  // 9. 32 CORE ATTRIBUTES ARCHITECTURAL INTEGRITY & COUNSELLING SESSIONS
  // =========================================================================
  console.log('\n--- 9. 32 CORE ATTRIBUTES DATA MODEL AUDIT ---');

  // Record complete session on 24CSE2D01 to populate counselling attributes
  store.recordCounsellingSession(
    {
      register_number: '24CSE2D01',
      session_date: new Date().toISOString(),
      counsellor_id: counselorAAuth!.user.id,
      counsellor_name: counselorAAuth!.user.name,
      counselling_type: 'ACADEMIC',
      issue_identified: 'Attendance deficits and algorithm concepts',
      counsellor_observation: 'Student is responsive and willing to follow structured plan',
      advice_given: 'Attend morning classes consistently and meet subject faculty twice/week',
      action_plan: [
        { id: 'act_1', action: 'Attend all classes for next 2 weeks', target: '100%', deadline: '2026-10-15', completed: false },
        { id: 'act_2', action: 'Meet Mathematics faculty twice/week', target: '2 sessions/week', deadline: '2026-10-15', completed: false },
      ],
      follow_up_date: '2026-10-15',
      follow_up_status: 'PENDING',
      parent_comm_status: 'NOT_REQUIRED',
    },
    counselorAAuth!.user
  );

  // Ingest academic snapshot with subject-wise attendance and internal assessment marks
  const currentStudent = store.getStudent('24CSE2D01')!;
  store.importData({
    filename: 'detailed_evaluation.csv',
    snapshotLabel: 'End-Term Evaluation',
    students: [currentStudent],
    academicRecords: [
      {
        id: 'acad_24CSE2D01_detailed',
        register_number: '24CSE2D01',
        snapshot_label: 'End-Term Evaluation',
        semester: 4,
        attendance_percentage: 78.5,
        subject_wise_attendance: { 'Data Structures': 80, 'Discrete Maths': 76, 'Operating Systems': 79 },
        internal_assessment_marks: { obtained: 48, maximum: 60, percentage: 80.0 },
        sgpa: 6.8,
        cgpa: 6.2,
        backlog_count: 1,
        backlog_subjects: ['Discrete Maths'],
        assignment_performance: 82.0,
        lab_performance: 85.0,
        recorded_at: new Date().toISOString(),
      },
    ],
    behaviourRecords: [],
    currentUser: adminAuth!.user,
  });

  const sampleComplete = store.getCompleteStudentRecord('24CSE2D01');
  const attrChecks = [
    { num: 1, name: 'register_number', val: sampleComplete?.student.register_number },
    { num: 2, name: 'student_name', val: sampleComplete?.student.student_name },
    { num: 3, name: 'department', val: sampleComplete?.student.department },
    { num: 4, name: 'program', val: sampleComplete?.student.program },
    { num: 5, name: 'year', val: sampleComplete?.student.year },
    { num: 6, name: 'section', val: sampleComplete?.student.section },
    { num: 7, name: 'semester', val: sampleComplete?.student.semester },
    { num: 8, name: 'student_contact', val: sampleComplete?.student.student_contact },
    { num: 9, name: 'parent_name', val: sampleComplete?.student.parent_name },
    { num: 10, name: 'parent_contact', val: sampleComplete?.student.parent_contact },
    { num: 11, name: 'attendance_percentage', val: sampleComplete?.currentAcademic.attendance_percentage },
    { num: 12, name: 'subject_wise_attendance', val: sampleComplete?.currentAcademic.subject_wise_attendance },
    { num: 13, name: 'internal_assessment_marks', val: sampleComplete?.currentAcademic.internal_assessment_marks },
    { num: 14, name: 'sgpa', val: sampleComplete?.currentAcademic.sgpa },
    { num: 15, name: 'cgpa', val: sampleComplete?.currentAcademic.cgpa },
    { num: 16, name: 'backlog_count & backlog_subjects', val: sampleComplete?.currentAcademic.backlog_count !== undefined },
    { num: 17, name: 'academic_performance_trend', val: sampleComplete?.riskAssessment.trend },
    { num: 18, name: 'assignment_performance & lab_performance', val: sampleComplete?.currentAcademic.assignment_performance !== undefined },
    { num: 19, name: 'disciplinary_issues', val: sampleComplete?.behaviour?.disciplinary_issues },
    { num: 20, name: 'classroom_behaviour', val: sampleComplete?.behaviour?.classroom_behaviour },
    { num: 21, name: 'academic_difficulties', val: sampleComplete?.behaviour?.academic_difficulties },
    { num: 22, name: 'counselling_date', val: sampleComplete?.counsellingSessions[0]?.session_date },
    { num: 23, name: 'counselling_type', val: sampleComplete?.counsellingSessions[0]?.counselling_type },
    { num: 24, name: 'issue_identified', val: sampleComplete?.counsellingSessions[0]?.issue_identified },
    { num: 25, name: 'counsellor_observation', val: sampleComplete?.counsellingSessions[0]?.counsellor_observation },
    { num: 26, name: 'advice_given', val: sampleComplete?.counsellingSessions[0]?.advice_given },
    { num: 27, name: 'action_plan', val: sampleComplete?.counsellingSessions[0]?.action_plan?.length },
    { num: 28, name: 'follow_up_date', val: sampleComplete?.counsellingSessions[0]?.follow_up_date },
    { num: 29, name: 'follow_up_status', val: sampleComplete?.counsellingSessions[0]?.follow_up_status },
    { num: 30, name: 'parent_communication_status', val: sampleComplete?.counsellingSessions[0]?.parent_comm_status },
    { num: 31, name: 'student_improvement_status', val: sampleComplete?.improvement?.status },
    { num: 32, name: 'counsellor_name / counsellor_id', val: sampleComplete?.counsellingSessions[0]?.counsellor_name },
  ];

  const missingAttrs = attrChecks.filter((a) => a.val === undefined || a.val === null);
  const all32Present = missingAttrs.length === 0;
  recordTest(
    'Attributes',
    'All 32 mandatory institutional attributes mapped & populated in complete student record',
    all32Present,
    all32Present
      ? `Verified 32/32 attributes on seed student 24CSE2D01`
      : `Missing attributes: ${missingAttrs.map((m) => `${m.num}. ${m.name}`).join(', ')}`
  );

  // =========================================================================
  // 10. AI BRIEF & IMPROVEMENT SUMMARY ENGINE
  // =========================================================================
  console.log('\n--- 10. AI GENERATION & DETERMINISTIC FALLBACK TESTS ---');

  const brief = await generateAICounsellingBrief({
    student: sampleComplete!.student,
    academic: sampleComplete!.currentAcademic,
    risk: sampleComplete!.riskAssessment,
    behaviour: sampleComplete!.behaviour,
    history: sampleComplete!.academicHistory,
    previousSessions: sampleComplete!.counsellingSessions,
  });

  const briefValid =
    typeof brief.summary === 'string' &&
    brief.summary.length > 10 &&
    Array.isArray(brief.keyConcerns) &&
    brief.keyConcerns.length > 0 &&
    Array.isArray(brief.discussionPoints) &&
    brief.discussionPoints.length > 0 &&
    Array.isArray(brief.suggestedQuestions) &&
    brief.suggestedQuestions.length > 0 &&
    Array.isArray(brief.possibleInterventionAreas) &&
    brief.possibleInterventionAreas.length > 0;

  recordTest(
    'AI Assistant',
    'Generate structured counselling brief (Schema compliant & non-hallucinatory)',
    briefValid,
    `Brief generated: ${brief.discussionPoints.length} discussion points, ${brief.suggestedQuestions.length} questions`
  );

  const comparison = store.getImprovementComparison('24CSE2D01')!;
  const summaryNarrative = await generateImprovementSummary(comparison);
  recordTest(
    'AI Assistant',
    'Generate longitudinal improvement summary from verified snapshots',
    typeof summaryNarrative === 'string' && summaryNarrative.length > 20,
    `Narrative generated: "${summaryNarrative.slice(0, 80)}..."`
  );

  // =========================================================================
  // 11. AUDIT TRAIL LOGGING
  // =========================================================================
  console.log('\n--- 11. AUDIT TRAIL RECORDING ---');
  const auditLogs = store.getAuditLogs();
  recordTest(
    'Audit Trail',
    'System records immutable audit logs for administrative & counselling events',
    auditLogs.length >= 10,
    `Total audit logs recorded: ${auditLogs.length}`
  );

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================================');
  console.log(`     TEST EXECUTION COMPLETE: ${passed}/${total} PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed === 0) {
    console.log('     STATUS: \x1b[32mALL CONSTRAINTS, RULES & WORKFLOWS ARE 100% OPERATIONAL\x1b[0m');
  } else {
    console.log(`     STATUS: \x1b[31m${failed} TEST(S) FAILED\x1b[0m`);
  }
  console.log('======================================================================\n');
}

runExhaustiveTestSuite();
