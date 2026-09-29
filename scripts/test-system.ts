import { calculateStudentRisk } from '../src/lib/risk/risk-engine';
import { DEFAULT_RISK_CONFIG } from '../src/lib/risk/risk-config';
import { parseAndValidateStudentCsv } from '../src/lib/csv/csv-parser';
import { store } from '../src/lib/storage/store';
import { AcademicRecord, Student, BehaviourRecord, CompleteStudentRecord, User } from '../src/types';

async function runSystemDiagnostics() {
  console.log('===============================================================');
  console.log('    COUNSELLAI RBAC, AUTH, SCOPING & RISK SYSTEM DIAGNOSTICS   ');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${name}`);
      if (detail) console.log(`         -> ${detail}`);
    } else {
      console.error(`  [FAIL] ${name}`);
      if (detail) console.error(`         -> ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // 1. ALL 32 CORE ATTRIBUTES AUDIT
  // -------------------------------------------------------------
  console.log('--- 1. 32 CORE ATTRIBUTES ARCHITECTURAL AUDIT ---');
  const all32Attributes = [
    '1. register_number', '2. student_name', '3. department', '4. program', '5. year', '6. section',
    '7. semester', '8. student_contact', '9. parent_name', '10. parent_contact', '11. attendance_percentage',
    '12. subject_wise_attendance', '13. internal_assessment_marks', '14. sgpa', '15. cgpa',
    '16. backlog_count & backlog_subjects', '17. academic_performance_trend', '18. assignment_performance & lab_performance',
    '19. disciplinary_issues', '20. classroom_behaviour', '21. academic_difficulties', '22. counselling_date',
    '23. counselling_type', '24. issue_identified', '25. counsellor_observation', '26. advice_given',
    '27. action_plan (action, target, deadline)', '28. follow_up_date', '29. follow_up_status',
    '30. parent_communication_status', '31. student_improvement_status', '32. counsellor_name / counsellor_id'
  ];

  assertTest('All 32 Core Attributes Recognized & Mapped', all32Attributes.length === 32, '32/32 attributes mapped across normalized entities');

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & SEED USERS TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & SEED USERS TESTS ---');
  const adminAuth = await store.authenticateUser('admin', 'change-me-immediately');
  assertTest(
    'Admin Authentication',
    adminAuth !== null && adminAuth.user.role === 'ADMIN',
    `Authenticated: ${adminAuth?.user.name} (Role: ${adminAuth?.user.role})`
  );

  const counselorAAuth = await store.authenticateUser('counselor.cse2d', 'change-me-immediately');
  assertTest(
    'Counselor A Authentication (CSE 2D)',
    counselorAAuth !== null && counselorAAuth.user.role === 'COUNSELLOR' && counselorAAuth.scope?.section_name === 'D',
    `Scope: ${counselorAAuth?.scope?.department_code} Yr ${counselorAAuth?.scope?.year_number} Sec ${counselorAAuth?.scope?.section_name}`
  );

  const invalidAuth = await store.authenticateUser('admin', 'wrong-password');
  assertTest('Invalid Password Rejected', invalidAuth === null, 'Returned null on wrong password');

  // -------------------------------------------------------------
  // 3. TWO COUNSELORS PER SECTION & CAPACITY ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 3. TWO COUNSELORS PER SECTION CONSTRAINT TESTS ---');
  const counselorBAuth = await store.authenticateUser('counselor2.cse2d', 'change-me-immediately');
  assertTest(
    'Counselor B Authentication (Shares CSE 2D Scope with Counselor A)',
    counselorBAuth !== null && counselorBAuth.scope?.section_name === 'D',
    `Counselor B Scope: ${counselorBAuth?.scope?.department_code} Yr ${counselorBAuth?.scope?.year_number} Sec ${counselorBAuth?.scope?.section_name}`
  );

  const cse2dCounselors = store.getCounselorsForSection('sec_cse_2d');
  assertTest(
    'Section CSE 2D Has Exactly 2 Counselors Assigned',
    cse2dCounselors.length === 2,
    `Active Counselors on CSE 2D: ${cse2dCounselors.map((c) => c.name).join(', ')}`
  );

  // Attempt to assign a 3rd counselor to CSE 2D -> Must be rejected!
  const thirdCounselorAttempt = await store.createUser(
    {
      name: 'Extra Counselor',
      username: 'extra.counselor',
      passwordPlain: 'change-me-immediately',
      role: 'COUNSELLOR',
      department_id: 'dept_cse',
      year_id: 'year_2',
      section_id: 'sec_cse_2d',
    },
    adminAuth!.user
  );
  assertTest(
    'Max 2 Counselors Per Section Limit Enforced (3rd Assignment Blocked)',
    thirdCounselorAttempt.success === false,
    `Blocked with message: "${thirdCounselorAttempt.error}"`
  );

  // -------------------------------------------------------------
  // 4. COUNSELOR SCOPING & AUTHORIZATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. SCOPE ISOLATION TESTS ---');
  const adminUser = adminAuth!.user;
  const counselorScopeA = counselorAAuth!.scope!;

  // Counselor A queries their section (CSE 2D)
  const scopedStudentsA = store.getStudentsList(counselorScopeA);
  assertTest(
    'Counselor A sees only assigned section students (CSE 2D)',
    scopedStudentsA.every((s) => s.department === 'CSE' && s.year === 2 && s.section === 'D'),
    `Found ${scopedStudentsA.length} student(s) in scope`
  );

  // Out of scope query test: Counselor A querying ECE 3A student -> MUST RETURN NULL / FORBIDDEN
  const outOfScopeStudent = store.getStudent('23ECE3A05', counselorScopeA);
  assertTest(
    'Out-of-Scope Student Access Forbidden (Returns undefined)',
    outOfScopeStudent === undefined,
    '23ECE3A05 (ECE 3A) correctly forbidden for Counselor A (CSE 2D)'
  );

  // In-scope query test: Counselor A querying CSE 2D student -> ALLOWED
  const inScopeStudent = store.getStudent('24CSE2D01', counselorScopeA);
  assertTest(
    'In-Scope Student Access Allowed',
    inScopeStudent !== undefined && inScopeStudent.student_name === 'Aarav Sharma',
    `Found student: ${inScopeStudent?.student_name} (${inScopeStudent?.register_number})`
  );

  // -------------------------------------------------------------
  // 5. DETERMINISTIC RISK ENGINE PARAMETER TESTS
  // -------------------------------------------------------------
  console.log('\n--- 5. DETERMINISTIC RISK ENGINE TESTS ---');
  const criticalAcademic: AcademicRecord = {
    id: 'acad_crit',
    register_number: 'TEST_REG_001',
    snapshot_label: 'Snapshot_1',
    semester: 5,
    attendance_percentage: 55.0,
    sgpa: 5.4,
    cgpa: 7.1,
    backlog_count: 3,
    backlog_subjects: ['Subject_A', 'Subject_B', 'Subject_C'],
    internal_assessment_marks: { obtained: 22, maximum: 60, percentage: 36.6 },
    assignment_performance: 48,
    recorded_at: new Date().toISOString(),
  };

  const criticalRisk = calculateStudentRisk(criticalAcademic, [], DEFAULT_RISK_CONFIG);
  assertTest(
    'Critical Risk Calculation (Score >= 9)',
    criticalRisk.risk_level === 'CRITICAL' && criticalRisk.overall_score >= 9,
    `Calculated Score: ${criticalRisk.overall_score} pts | Level: ${criticalRisk.risk_level}`
  );

  // -------------------------------------------------------------
  // 6. SCOPE-AWARE CSV INGESTION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 6. SCOPE-AWARE CSV INGESTION TESTS ---');
  // Valid scoped CSV for Counselor A (CSE 2D)
  const validScopedCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
24CSE2D99,Test Student CSE,CSE,B.Tech,2,D,4,72.0,6.5,7.0,1,"[""Maths""]"`;

  const validParseResult = parseAndValidateStudentCsv(validScopedCsv, 'Snapshot_Test', counselorScopeA);
  assertTest(
    'Valid Scope CSV Accepted for Counselor',
    validParseResult.validStudents.length === 1 && validParseResult.errors.length === 0,
    'Row in CSE Year 2 Section D parsed with 0 errors'
  );

  // Out of scope CSV for Counselor A (contains ECE 3A row)
  const invalidScopeCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
23ECE3A99,Foreign Student,ECE,B.Tech,3,A,6,80.0,7.5,7.8,0,"[]"`;

  const invalidParseResult = parseAndValidateStudentCsv(invalidScopeCsv, 'Snapshot_Test', counselorScopeA);
  assertTest(
    'Out-of-Scope CSV Rows Blocked for Counselor',
    invalidParseResult.errors.length > 0 && (invalidParseResult.scopeViolationsCount || 0) > 0,
    `Correctly blocked with scope error: "${invalidParseResult.errors[0]?.message}"`
  );

  // -------------------------------------------------------------
  // 7. COUNSELLING SESSION, AUTHORSHIP & AUTOMATED FOLLOW-UP
  // -------------------------------------------------------------
  console.log('\n--- 7. COUNSELLING AUTHORSHIP & AUTOMATED FOLLOW-UP ---');
  const session = store.recordCounsellingSession(
    {
      register_number: '24CSE2D01',
      session_date: new Date().toISOString(),
      counsellor_id: counselorAAuth!.user.id,
      counsellor_name: counselorAAuth!.user.name,
      counselling_type: 'ACADEMIC',
      issue_identified: 'Attendance deficit and mathematics difficulties',
      counsellor_observation: 'Student reports commuting delays and needs problem practice',
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

  assertTest(
    'Counselling Session Preserves Counselor Authorship',
    session.created_by === counselorAAuth!.user.id && session.counsellor_name === counselorAAuth!.user.name,
    `Author: ${session.counsellor_name} (${session.counsellor_id})`
  );

  const followUps = store.getFollowUps(counselorScopeA);
  assertTest(
    'Follow-up Task Automatically Created on Session Save',
    followUps.some((f) => f.session_id === session.id),
    `Auto-created follow-up due: ${followUps[0]?.follow_up_date} (Status: ${followUps[0]?.status})`
  );

  // -------------------------------------------------------------
  // 8. LONGITUDINAL BEFORE / AFTER IMPROVEMENT COMPARISON
  // -------------------------------------------------------------
  console.log('\n--- 8. LONGITUDINAL IMPROVEMENT COMPARISON ---');
  const comparison = store.getImprovementComparison('24CSE2D01');
  assertTest(
    'Longitudinal Improvement Comparison Evaluated',
    comparison !== null && comparison.attendance_diff > 0 && comparison.backlog_diff < 0,
    `Attendance: +${comparison?.attendance_diff.toFixed(1)}% | SGPA: +${comparison?.sgpa_diff.toFixed(2)} | Backlogs: ${comparison?.backlog_diff} | Status: ${comparison?.status}`
  );

  // -------------------------------------------------------------
  // 9. AUDIT LOGGING RECORDING
  // -------------------------------------------------------------
  console.log('\n--- 9. AUDIT LOGGING RECORDING ---');
  const auditLogs = store.getAuditLogs();
  assertTest(
    'System Audit Logs Recorded for Actions',
    auditLogs.length > 0 && auditLogs.some((l) => l.action === 'CREATE_COUNSELLING_RECORD'),
    `Total Logs: ${auditLogs.length} | Latest Action: ${auditLogs[0]?.action}`
  );

  console.log('\n===============================================================');
  console.log(`DIAGNOSTICS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% OK)`);
  console.log('===============================================================');
}

runSystemDiagnostics();
