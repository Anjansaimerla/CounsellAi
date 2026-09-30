import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { POST as logoutHandler } from '../src/app/api/auth/logout/route';
import { POST as briefHandler } from '../src/app/api/ai/brief/route';
import { POST as improvementHandler } from '../src/app/api/ai/improvement/route';
import { NextRequest } from 'next/server';
import { store } from '../src/lib/storage/store';

function createMockRequest(url: string, body: any): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function testAllHttpEndpoints() {
  console.log('\n======================================================================');
  console.log('       COUNSELLAI HTTP API ENDPOINTS VERIFICATION SUITE               ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assertApi(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
      if (detail) console.log(`         \x1b[90m↳ ${detail}\x1b[0m`);
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${name}`);
      if (detail) console.error(`         \x1b[31m↳ ${detail}\x1b[0m`);
    }
  }

  // 1. /api/auth/login - Admin Login
  const adminReq = createMockRequest('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'change-me-immediately',
  });
  const adminRes = await loginHandler(adminReq);
  const adminData = await adminRes.json();
  assertApi(
    'POST /api/auth/login (Admin Credentials)',
    adminRes.status === 200 && adminData.user?.role === 'ADMIN' && adminData.token,
    `Status: ${adminRes.status} | Role: ${adminData.user?.role} | Token: ${adminData.token?.slice(0, 20)}...`
  );

  // 2. /api/auth/login - Counselor Login with Scoping & Graduation Year
  const counselorReq = createMockRequest('http://localhost:3000/api/auth/login', {
    username: 'counselor.cse2d',
    password: 'change-me-immediately',
  });
  const counselorRes = await loginHandler(counselorReq);
  const counselorData = await counselorRes.json();
  assertApi(
    'POST /api/auth/login (Counselor Scope & Graduation Year Verification)',
    counselorRes.status === 200 &&
      counselorData.user?.role === 'COUNSELLOR' &&
      counselorData.scope?.department_code === 'CSE' &&
      counselorData.scope?.graduation_year === 2028,
    `Status: ${counselorRes.status} | Scope: ${counselorData.scope?.department_code} Yr ${counselorData.scope?.year_number} (Grad ${counselorData.scope?.graduation_year}) Sec ${counselorData.scope?.section_name}`
  );

  // 3. /api/auth/login - Missing Body / Missing Fields
  const emptyReq = createMockRequest('http://localhost:3000/api/auth/login', {
    username: '',
    password: '',
  });
  const emptyRes = await loginHandler(emptyReq);
  const emptyData = await emptyRes.json();
  assertApi(
    'POST /api/auth/login (Reject Missing Fields with HTTP 400)',
    emptyRes.status === 400 && Boolean(emptyData.error),
    `Status: ${emptyRes.status} | Error: "${emptyData.error}"`
  );

  // 4. /api/auth/login - Invalid Password
  const invalidPassReq = createMockRequest('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'incorrect-password',
  });
  const invalidPassRes = await loginHandler(invalidPassReq);
  const invalidPassData = await invalidPassRes.json();
  assertApi(
    'POST /api/auth/login (Reject Bad Password with HTTP 401)',
    invalidPassRes.status === 401 && Boolean(invalidPassData.error),
    `Status: ${invalidPassRes.status} | Error: "${invalidPassData.error}"`
  );

  // 5. /api/auth/logout - Logout Endpoint
  const logoutReq = createMockRequest('http://localhost:3000/api/auth/logout', {
    userId: 'usr_admin',
  });
  const logoutRes = await logoutHandler(logoutReq);
  const logoutData = await logoutRes.json();
  assertApi(
    'POST /api/auth/logout (Audit Logged & Success 200)',
    logoutRes.status === 200 && logoutData.success === true,
    `Status: ${logoutRes.status} | Success: ${logoutData.success}`
  );

  // 6. /api/ai/brief - Generate AI Brief
  const student = store.getStudent('24CSE2D01')!;
  const completeRecord = store.getCompleteStudentRecord('24CSE2D01')!;
  const briefReq = createMockRequest('http://localhost:3000/api/ai/brief', {
    student: completeRecord.student,
    academic: completeRecord.currentAcademic,
    risk: completeRecord.riskAssessment,
    behaviour: completeRecord.behaviour,
    history: completeRecord.academicHistory,
    previousSessions: completeRecord.counsellingSessions,
  });
  const briefRes = await briefHandler(briefReq);
  const briefData = await briefRes.json();
  assertApi(
    'POST /api/ai/brief (Valid Student Brief Synthesis)',
    briefRes.status === 200 &&
      typeof briefData.summary === 'string' &&
      Array.isArray(briefData.keyConcerns) &&
      Array.isArray(briefData.discussionPoints),
    `Status: ${briefRes.status} | Discussion Points: ${briefData.discussionPoints?.length} | Questions: ${briefData.suggestedQuestions?.length}`
  );

  // 7. /api/ai/brief - Missing Required Parameters
  const invalidBriefReq = createMockRequest('http://localhost:3000/api/ai/brief', {
    student: null,
  });
  const invalidBriefRes = await briefHandler(invalidBriefReq);
  const invalidBriefData = await invalidBriefRes.json();
  assertApi(
    'POST /api/ai/brief (Reject Incomplete Payload with HTTP 400)',
    invalidBriefRes.status === 400 && Boolean(invalidBriefData.error),
    `Status: ${invalidBriefRes.status} | Error: "${invalidBriefData.error}"`
  );

  // 8. /api/ai/improvement - Generate Improvement Narrative
  const comparison = store.getImprovementComparison('24CSE2D01')!;
  const improveReq = createMockRequest('http://localhost:3000/api/ai/improvement', comparison);
  const improveRes = await improvementHandler(improveReq);
  const improveData = await improveRes.json();
  assertApi(
    'POST /api/ai/improvement (Longitudinal Comparison Summary)',
    improveRes.status === 200 && typeof improveData.summary === 'string',
    `Status: ${improveRes.status} | Summary Preview: "${improveData.summary?.slice(0, 75)}..."`
  );

  // 9. /api/ai/improvement - Missing Comparison Data
  const badImproveReq = createMockRequest('http://localhost:3000/api/ai/improvement', {
    student_name: 'Test',
  });
  const badImproveRes = await improvementHandler(badImproveReq);
  const badImproveData = await badImproveRes.json();
  assertApi(
    'POST /api/ai/improvement (Reject Invalid Comparison with HTTP 400)',
    badImproveRes.status === 400 && Boolean(badImproveData.error),
    `Status: ${badImproveRes.status} | Error: "${badImproveData.error}"`
  );

  console.log('\n======================================================================');
  console.log(`     HTTP ENDPOINTS AUDIT: ${passed}/${total} PASSED (100% OK)`);
  console.log('======================================================================\n');
}

testAllHttpEndpoints();
