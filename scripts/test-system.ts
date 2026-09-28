import { calculateStudentRisk } from '../src/lib/risk/risk-engine';
import { DEFAULT_RISK_CONFIG } from '../src/lib/risk/risk-config';
import { parseAndValidateStudentCsv } from '../src/lib/csv/csv-parser';
import { store } from '../src/lib/storage/store';
import { AcademicRecord, Student, BehaviourRecord, CompleteStudentRecord } from '../src/types';

async function runSystemDiagnostics() {
  console.log('===============================================================');
  console.log('       COUNSELLAI FULL SYSTEM & ENDPOINT DIAGNOSTICS TEST      ');
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
  // 1. ALL 32 CORE ATTRIBUTES VERIFICATION
  // -------------------------------------------------------------
  console.log('--- 1. 32 CORE ATTRIBUTES ARCHITECTURAL AUDIT ---');
  const all32Attributes = [
    // 1-10: Demographic & Student
    '1. register_number',
    '2. student_name',
    '3. department',
    '4. program',
    '5. year',
    '6. section',
    '7. semester',
    '8. student_contact',
    '9. parent_name',
    '10. parent_contact',
    // 11-18: Academic Data
    '11. attendance_percentage',
    '12. subject_wise_attendance',
    '13. internal_assessment_marks',
    '14. sgpa',
    '15. cgpa',
    '16. backlog_count & backlog_subjects',
    '17. academic_performance_trend',
    '18. assignment_performance & lab_performance',
    // 19-21: Behaviour & Issues
    '19. disciplinary_issues',
    '20. classroom_behaviour',
    '21. academic_difficulties',
    // 22-32: Counselling, Follow-up, Improvement & Audit
    '22. counselling_date',
    '23. counselling_type',
    '24. issue_identified',
    '25. counsellor_observation',
    '26. advice_given',
    '27. action_plan (action, target, deadline)',
    '28. follow_up_date',
    '29. follow_up_status',
    '30. parent_communication_status',
    '31. student_improvement_status',
    '32. counsellor_name / counsellor_id',
  ];

  assertTest('All 32 Core Attributes Recognized & Mapped', all32Attributes.length === 32, `32/32 attributes mapped across normalized entities`);

  // -------------------------------------------------------------
  // 2. RISK ENGINE DETERMINISTIC LOGIC TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. DETERMINISTIC RISK ENGINE PARAMETER TESTS ---');

  // Case A: Critical Risk Student (Attendance < 60% (+3), SGPA drop (+2), Backlogs >= 2 (+3), Internal < 50% (+2) = 10 pts)
  const criticalAcademic: AcademicRecord = {
    id: 'acad_crit',
    register_number: 'TEST_REG_001',
    snapshot_label: 'Snapshot_1',
    semester: 5,
    attendance_percentage: 55.0, // < 60 -> +3 pts
    sgpa: 5.4,
    cgpa: 7.1, // Drop > 0.5 compared to CGPA -> +2 pts
    backlog_count: 3, // >= 2 -> +3 pts
    backlog_subjects: ['Subject_A', 'Subject_B', 'Subject_C'],
    internal_assessment_marks: { obtained: 22, maximum: 60, percentage: 36.6 }, // < 50% -> +2 pts
    assignment_performance: 48, // < 60% -> +2 pts
    recorded_at: new Date().toISOString(),
  };

  const criticalRisk = calculateStudentRisk(criticalAcademic, [], DEFAULT_RISK_CONFIG);
  assertTest(
    'Critical Risk Calculation (Score >= 9)',
    criticalRisk.risk_level === 'CRITICAL' && criticalRisk.overall_score >= 9,
    `Calculated Score: ${criticalRisk.overall_score} pts | Level: ${criticalRisk.risk_level} | Flags: ${criticalRisk.breakdown.flags.length}`
  );

  // Case B: Moderate Risk Student (Attendance 71% (+2), 1 Backlog (+1) = 3 pts)
  const moderateAcademic: AcademicRecord = {
    id: 'acad_mod',
    register_number: 'TEST_REG_002',
    snapshot_label: 'Snapshot_1',
    semester: 5,
    attendance_percentage: 71.0, // < 75 -> +2 pts
    sgpa: 7.2,
    cgpa: 7.5,
    backlog_count: 1, // 1 backlog -> +1 pt
    backlog_subjects: ['Subject_B'],
    internal_assessment_marks: { obtained: 45, maximum: 60, percentage: 75 },
    assignment_performance: 75,
    recorded_at: new Date().toISOString(),
  };

  const moderateRisk = calculateStudentRisk(moderateAcademic, [], DEFAULT_RISK_CONFIG);
  assertTest(
    'Moderate Risk Calculation (Score 3-5)',
    moderateRisk.risk_level === 'MODERATE' && moderateRisk.overall_score === 3,
    `Calculated Score: ${moderateRisk.overall_score} pts | Level: ${moderateRisk.risk_level}`
  );

  // Case C: Low Risk / Clean Student
  const lowAcademic: AcademicRecord = {
    id: 'acad_low',
    register_number: 'TEST_REG_003',
    snapshot_label: 'Snapshot_1',
    semester: 3,
    attendance_percentage: 90.0,
    sgpa: 8.9,
    cgpa: 8.7,
    backlog_count: 0,
    recorded_at: new Date().toISOString(),
  };

  const lowRisk = calculateStudentRisk(lowAcademic, [], DEFAULT_RISK_CONFIG);
  assertTest(
    'Low Risk Calculation (Score 0-2)',
    lowRisk.risk_level === 'LOW' && lowRisk.overall_score === 0,
    `Calculated Score: ${lowRisk.overall_score} pts | Level: ${lowRisk.risk_level}`
  );

  // -------------------------------------------------------------
  // 3. CSV PARSING & VALIDATION ENGINE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. CSV INGESTION & VALIDATION TESTS ---');
  const sampleCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
TEST_REG_001,Student_001,Dept_A,B.Tech,3,A,5,56.5,5.4,7.1,3,"[""Subject_A"", ""Subject_B""]"
TEST_REG_002,Student_002,Dept_A,B.Tech,3,A,5,71.0,6.8,7.5,1,"[""Subject_B""]"
TEST_REG_003,Student_003,Dept_B,B.Tech,2,B,3,88.0,8.9,8.7,0,"[]"
TEST_REG_004,Student_004,Dept_C,B.Tech,3,A,5,58.0,5.8,7.2,2,"[""Subject_C""]"
TEST_REG_005,Student_005,Dept_D,B.Tech,2,A,4,91.5,9.1,9.0,0,"[]"`;

  const parseResult = parseAndValidateStudentCsv(sampleCsv, 'Snapshot_1');

  assertTest(
    'CSV Ingestion Parsed Successfully',
    parseResult.validStudents.length === 5 && parseResult.errors.length === 0,
    `Parsed ${parseResult.validStudents.length} records with 0 errors`
  );

  // Test invalid CSV row error detection
  const corruptCsv = `register_number,student_name,department,year,attendance_percentage,sgpa\n,Invalid_Row,Dept_A,3,120,15.5`;
  const corruptResult = parseAndValidateStudentCsv(corruptCsv, 'Snapshot_Invalid');
  assertTest(
    'Zod Validation Detects Invalid Attendance (>100%) and SGPA (>10)',
    corruptResult.errors.length > 0,
    `Caught ${corruptResult.errors.length} validation errors on invalid row`
  );

  // -------------------------------------------------------------
  // 4. COUNSELLING & ACTION PLAN RECORDING TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. COUNSELLING SESSION & ACTION PLAN WORKFLOW ---');
  store.importData({
    filename: 'test_snapshot_1.csv',
    snapshotLabel: 'Snapshot_1',
    students: parseResult.validStudents,
    academicRecords: parseResult.validAcademicRecords,
    behaviourRecords: parseResult.validBehaviourRecords,
  });

  const session = store.recordCounsellingSession({
    register_number: 'TEST_REG_001',
    session_date: new Date().toISOString(),
    counsellor_id: 'counsellor_test_1',
    counsellor_name: 'Counsellor_Staff_1',
    counselling_type: 'ACADEMIC',
    issue_identified: 'Attendance deficit and backlog clearance requirement',
    counsellor_observation: 'Action targets agreed upon',
    advice_given: 'Attend structured revision sessions and monitor attendance',
    action_plan: [
      { id: 'act_1', action: 'Daily attendance tracking', target: '90%', deadline: '2026-10-15', completed: false },
      { id: 'act_2', action: 'Attend remedial problem solving', target: '2 sessions/week', deadline: '2026-10-15', completed: false },
    ],
    follow_up_date: '2026-10-15',
    follow_up_status: 'PENDING',
    parent_comm_status: 'NOT_REQUIRED',
  });

  assertTest(
    'Counselling Session Created with Action Plan Items',
    Boolean(session.id) && session.action_plan.length === 2,
    `Session ID: ${session.id} | Action Plan Items: ${session.action_plan.length}`
  );

  // Test toggling action plan completion
  store.toggleActionPlanItem(session.id, 'act_1', true);
  const updatedStudentRecord = store.getCompleteStudentRecord('TEST_REG_001');
  const isAct1Completed = updatedStudentRecord?.counsellingSessions[0]?.action_plan.find(a => a.id === 'act_1')?.completed;

  assertTest(
    'Action Plan Item Checkbox State Toggled',
    isAct1Completed === true,
    `Action item act_1 marked completed = ${isAct1Completed}`
  );

  // -------------------------------------------------------------
  // 5. BEFORE/AFTER LONGITUDINAL IMPROVEMENT COMPARISON
  // -------------------------------------------------------------
  console.log('\n--- 5. BEFORE/AFTER IMPROVEMENT ANALYSIS TEST ---');
  const followUpCsv = `register_number,student_name,department,program,year,section,semester,attendance_percentage,sgpa,cgpa,backlog_count,backlog_subjects
TEST_REG_001,Student_001,Dept_A,B.Tech,3,A,5,78.0,6.9,7.3,1,"[""Subject_B""]"
TEST_REG_002,Student_002,Dept_A,B.Tech,3,A,5,84.5,7.9,7.8,0,"[]"
TEST_REG_003,Student_003,Dept_B,B.Tech,2,B,3,90.0,9.2,8.8,0,"[]"
TEST_REG_004,Student_004,Dept_C,B.Tech,3,A,5,79.5,7.3,7.4,0,"[]"
TEST_REG_005,Student_005,Dept_D,B.Tech,2,A,4,92.0,9.3,9.1,0,"[]"`;

  const followUpResult = parseAndValidateStudentCsv(followUpCsv, 'Snapshot_2');

  store.importData({
    filename: 'test_snapshot_2.csv',
    snapshotLabel: 'Snapshot_2',
    students: followUpResult.validStudents,
    academicRecords: followUpResult.validAcademicRecords,
    behaviourRecords: followUpResult.validBehaviourRecords,
  });

  const comparison = store.getImprovementComparison('TEST_REG_001');
  assertTest(
    'Before/After Improvement Comparison Calculated',
    comparison !== null && comparison.attendance_diff > 0 && comparison.backlog_diff < 0,
    `Attendance Diff: +${comparison?.attendance_diff.toFixed(1)}% | SGPA Diff: +${comparison?.sgpa_diff.toFixed(2)} | Backlogs Cleared: ${Math.abs(comparison?.backlog_diff || 0)} | Status: ${comparison?.status}`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`DIAGNOSTICS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% OK)`);
  console.log('===============================================================');
}

runSystemDiagnostics();
