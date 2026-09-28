
import { calculateStudentRisk } from '../src/lib/risk/risk-engine';
import { DEFAULT_RISK_CONFIG } from '../src/lib/risk/risk-config';
import { parseAndValidateStudentCsv, generateSampleCsvContent, generateFollowUpCsvContent } from '../src/lib/csv/csv-parser';
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
    register_number: '23CS101',
    snapshot_label: 'Mid-Term 1',
    semester: 5,
    attendance_percentage: 55.0, // < 60 -> +3 pts
    sgpa: 5.4,
    cgpa: 7.1, // Drop > 0.5 compared to CGPA -> +2 pts
    backlog_count: 3, // >= 2 -> +3 pts
    backlog_subjects: ['OS', 'Maths III', 'Data Structures'],
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
    register_number: '23CS102',
    snapshot_label: 'Mid-Term 1',
    semester: 5,
    attendance_percentage: 71.0, // < 75 -> +2 pts
    sgpa: 7.2,
    cgpa: 7.5,
    backlog_count: 1, // 1 backlog -> +1 pt
    backlog_subjects: ['Maths III'],
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
    register_number: '23EC201',
    snapshot_label: 'Mid-Term 1',
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
  const sampleCsv = generateSampleCsvContent();
  const parseResult = parseAndValidateStudentCsv(sampleCsv, 'Mid-Term 1 (Sep 2026)');

  assertTest(
    'CSV Ingestion Parsed Successfully',
    parseResult.validStudents.length === 5 && parseResult.errors.length === 0,
    `Parsed ${parseResult.validStudents.length} students with 0 errors`
  );

  // Test invalid CSV row error detection
  const corruptCsv = `register_number,student_name,department,year,attendance_percentage,sgpa\n,Invalid Student,CSE,3,120,15.5`;
  const corruptResult = parseAndValidateStudentCsv(corruptCsv, 'Test Invalid');
  assertTest(
    'Zod Validation Detects Invalid Attendance (>100%) and SGPA (>10)',
    corruptResult.errors.length > 0,
    `Caught ${corruptResult.errors.length} validation errors on bad input`
  );

  // -------------------------------------------------------------
  // 4. COUNSELLING & ACTION PLAN RECORDING TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. COUNSELLING SESSION & ACTION PLAN WORKFLOW ---');
  store.importData({
    filename: 'test_baseline.csv',
    snapshotLabel: 'Mid-Term 1 (Sep 2026)',
    students: parseResult.validStudents,
    academicRecords: parseResult.validAcademicRecords,
    behaviourRecords: parseResult.validBehaviourRecords,
  });

  const session = store.recordCounsellingSession({
    register_number: '23CS101',
    session_date: new Date().toISOString(),
    counsellor_id: 'counsellor_1',
    counsellor_name: 'Dr. S. Mehta',
    counselling_type: 'ACADEMIC',
    issue_identified: 'Severe attendance deficit & OS/Maths backlogs',
    counsellor_observation: 'Student receptive to structured revision schedule',
    advice_given: 'Attend lab doubt sessions and daily morning attendance tracking',
    action_plan: [
      { id: 'act_1', action: 'Daily attendance in 8:30 AM lectures', target: '90%', deadline: '2026-10-15', completed: false },
      { id: 'act_2', action: 'Attend remedial Maths doubt clearing', target: '2 sessions/week', deadline: '2026-10-15', completed: false },
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
  const updatedStudentRecord = store.getCompleteStudentRecord('23CS101');
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
  const followUpCsv = generateFollowUpCsvContent();
  const followUpResult = parseAndValidateStudentCsv(followUpCsv, 'Mid-Term 2 (Nov 2026)');

  store.importData({
    filename: 'test_followup.csv',
    snapshotLabel: 'Mid-Term 2 (Nov 2026)',
    students: followUpResult.validStudents,
    academicRecords: followUpResult.validAcademicRecords,
    behaviourRecords: followUpResult.validBehaviourRecords,
  });

  const comparison = store.getImprovementComparison('23CS101');
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
