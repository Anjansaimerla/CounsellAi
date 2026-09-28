import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AcademicRecord,
  AICounsellingBrief,
  BehaviourRecord,
  CounsellingSession,
  ImprovementComparison,
  RiskAssessment,
  Student,
} from '@/types';
import { AICounsellingBriefSchema } from '../validation/student-schema';

/**
 * Generates an AI-assisted Counselling Brief for a student
 * Strictly follows all constraints from aipromptrules.md and rules.md
 */
export async function generateAICounsellingBrief(params: {
  student: Student;
  academic: AcademicRecord;
  risk: RiskAssessment;
  behaviour?: BehaviourRecord;
  history?: AcademicRecord[];
  previousSessions?: CounsellingSession[];
}): Promise<AICounsellingBrief> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  const { student, academic, risk, behaviour, history = [], previousSessions = [] } = params;

  // Prepare facts payload
  const studentPayload = {
    register_number: student.register_number,
    student_name: student.student_name,
    department: student.department,
    program: student.program,
    year: student.year,
    section: student.section,
    semester: student.semester,
    academic_metrics: {
      attendance_percentage: `${academic.attendance_percentage}%`,
      subject_wise_attendance: academic.subject_wise_attendance || 'Not available in the provided data.',
      internal_assessment_marks: academic.internal_assessment_marks || 'Not available in the provided data.',
      sgpa: academic.sgpa,
      cgpa: academic.cgpa,
      backlog_count: academic.backlog_count,
      backlog_subjects: academic.backlog_subjects?.length ? academic.backlog_subjects : 'None',
      assignment_performance: academic.assignment_performance !== undefined ? `${academic.assignment_performance}%` : 'Not available in the provided data.',
      lab_performance: academic.lab_performance !== undefined ? `${academic.lab_performance}%` : 'Not available in the provided data.',
    },
    risk_assessment: {
      calculated_risk_level: risk.risk_level,
      overall_risk_score: risk.overall_score,
      identified_risk_flags: risk.breakdown.flags,
      trend: risk.trend,
    },
    documented_behaviour: {
      disciplinary_issues: behaviour?.disciplinary_issues || 'NONE',
      disciplinary_description: behaviour?.disciplinary_description || 'None reported',
      classroom_behaviour: behaviour?.classroom_behaviour || 'Not available in the provided data.',
      academic_difficulties: behaviour?.academic_difficulties || 'Not available in the provided data.',
    },
    historical_sessions_count: previousSessions.length,
  };

  const systemInstruction = `You are an academic counselling assistant.
Use ONLY the information provided in the input.
Do not invent:
- student facts
- diagnoses
- disciplinary incidents
- family circumstances
- causes of academic performance

Distinguish documented facts from suggestions.
If information is missing, explicitly state: "Not available in the provided data."
Your output must be strictly valid JSON matching this schema:
{
  "summary": "Concise 2-3 sentence summary of current academic state and identified risk factors",
  "keyConcerns": ["Bullet points of confirmed factual concerns strictly based on provided data"],
  "performanceTrend": "Objective description of trend (e.g., SGPA movement, attendance consistency)",
  "discussionPoints": ["Recommended non-judgmental topics for the counsellor to explore in session"],
  "suggestedQuestions": ["Open-ended counselling questions for the student"],
  "possibleInterventionAreas": ["Actionable academic support suggestions such as remedial sessions, peer tutoring, time-blocking"]
}

The final counselling decision belongs to the counsellor.`;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your-gemini-api-key') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
        systemInstruction,
      });

      const prompt = `Generate an academic counselling brief for the following student record:\n${JSON.stringify(
        studentPayload,
        null,
        2
      )}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = JSON.parse(text);
      const validated = AICounsellingBriefSchema.safeParse(parsed);

      if (validated.success) {
        return {
          ...validated.data,
          generatedAt: new Date().toISOString(),
          isAiGenerated: true,
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or rate limited, using deterministic brief fallback:', err);
    }
  }

  // Deterministic Fallback Synthesis (Rule 3 & Error Handling: Never fail silently)
  return generateDeterministicBrief(params);
}

/**
 * Deterministic fallback generator when AI is offline or key not provided.
 * Provides factual, structured brief from verified student data.
 */
export function generateDeterministicBrief(params: {
  student: Student;
  academic: AcademicRecord;
  risk: RiskAssessment;
  behaviour?: BehaviourRecord;
}): AICounsellingBrief {
  const { student, academic, risk, behaviour } = params;

  const keyConcerns: string[] = [];
  if (risk.breakdown.flags.length > 0) {
    keyConcerns.push(...risk.breakdown.flags);
  } else {
    keyConcerns.push('No urgent academic risk triggers detected.');
  }

  if (behaviour?.academic_difficulties) {
    keyConcerns.push(`Reported difficulty: ${behaviour.academic_difficulties}`);
  }

  const discussionPoints: string[] = [
    `Current attendance stands at ${academic.attendance_percentage.toFixed(1)}% (institutional baseline is 75%).`,
    `Current Semester SGPA is ${academic.sgpa.toFixed(2)} against CGPA of ${academic.cgpa.toFixed(2)}.`,
  ];

  if (academic.backlog_count > 0) {
    discussionPoints.push(
      `Remediation plan for ${academic.backlog_count} standing backlog(s): ${
        academic.backlog_subjects?.join(', ') || 'Listed subjects'
      }.`
    );
  }

  if (academic.subject_wise_attendance) {
    const laggingSubs = Object.entries(academic.subject_wise_attendance)
      .filter(([_, val]) => val < 75)
      .map(([sub, val]) => `${sub} (${val}%)`);
    if (laggingSubs.length > 0) {
      discussionPoints.push(`Subject-specific attendance deficits in: ${laggingSubs.join(', ')}.`);
    }
  }

  const suggestedQuestions: string[] = [
    'How do you currently organize your study and revision schedule between theory and lab subjects?',
    'Are there specific concepts in your current semester courses where you find difficulty following the lectures?',
    'What factors have contributed to attendance gaps in morning or lab sessions?',
    'What immediate academic support or peer doubt-clearing sessions would be most helpful for you right now?',
  ];

  const possibleInterventionAreas: string[] = [
    'Structured weekly timetable with dedicated slots for backlog preparation.',
    'Enrollment in department peer tutoring or faculty office hours doubt clearing.',
    'Bi-weekly attendance and internal marks check-in with assigned mentor.',
    'Assignment deadline tracking and submission check.',
  ];

  return {
    summary: `${student.student_name} (${student.register_number}, ${student.department} Year ${student.year}) is currently flagged with a ${risk.risk_level} risk level (Score: ${risk.overall_score}). Primary attention is required on ${
      risk.breakdown.flags.length > 0 ? risk.breakdown.flags[0] : 'academic maintenance'
    }.`,
    keyConcerns,
    performanceTrend:
      risk.trend === 'DECLINING'
        ? 'Declining performance: Semester SGPA has shown downward variation compared to baseline.'
        : risk.trend === 'IMPROVING'
        ? 'Improving trend: Recent metrics demonstrate positive recovery.'
        : risk.trend === 'STABLE'
        ? 'Stable performance across recent evaluations.'
        : 'Initial baseline snapshot recorded; trend will evaluate upon subsequent imports.',
    discussionPoints,
    suggestedQuestions,
    possibleInterventionAreas,
    generatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

/**
 * Generates an AI-assisted narrative comparing Before and After student performance
 */
export async function generateImprovementSummary(comparison: ImprovementComparison): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  const prompt = `You are an academic counselling assistant.
Compare the before and after metrics for student ${comparison.student_name} (${comparison.register_number}):
Baseline Attendance: ${comparison.baselineSnapshot.attendance_percentage}% → Current Attendance: ${comparison.latestSnapshot.attendance_percentage}% (Diff: ${comparison.attendance_diff > 0 ? '+' : ''}${comparison.attendance_diff.toFixed(1)}%)
Baseline SGPA: ${comparison.baselineSnapshot.sgpa} → Current SGPA: ${comparison.latestSnapshot.sgpa} (Diff: ${comparison.sgpa_diff > 0 ? '+' : ''}${comparison.sgpa_diff.toFixed(2)})
Baseline Backlogs: ${comparison.baselineSnapshot.backlog_count} → Current Backlogs: ${comparison.latestSnapshot.backlog_count}
Baseline Assignment: ${comparison.baselineSnapshot.assignment_performance || 0}% → Current: ${comparison.latestSnapshot.assignment_performance || 0}%

Calculated Status: ${comparison.status}

Write a professional, concise, 2-3 sentence counselling outcome summary strictly based on these verified numbers. Do not invent unmentioned facts.`;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your-gemini-api-key') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn('Gemini API comparison summary fallback:', err);
    }
  }

  // Fallback summary
  const attChange =
    comparison.attendance_diff >= 0
      ? `improved by +${comparison.attendance_diff.toFixed(1)}%`
      : `decreased by ${comparison.attendance_diff.toFixed(1)}%`;
  const sgpaChange =
    comparison.sgpa_diff >= 0
      ? `improved by +${comparison.sgpa_diff.toFixed(2)} SGPA points`
      : `dropped by ${Math.abs(comparison.sgpa_diff).toFixed(2)} SGPA points`;
  const backlogChange =
    comparison.backlog_diff < 0
      ? `successfully cleared ${Math.abs(comparison.backlog_diff)} backlog(s)`
      : comparison.backlog_diff > 0
      ? `incurred ${comparison.backlog_diff} additional backlog(s)`
      : `maintained backlog status at ${comparison.latestSnapshot.backlog_count}`;

  return `Following counselling interventions, ${comparison.student_name}'s attendance has ${attChange} (${comparison.baselineSnapshot.attendance_percentage}% → ${comparison.latestSnapshot.attendance_percentage}%), academic score ${sgpaChange} (${comparison.baselineSnapshot.sgpa} → ${comparison.latestSnapshot.sgpa}), and student ${backlogChange}. Overall evaluated status: ${comparison.status.replace(/_/g, ' ')}.`;
}
