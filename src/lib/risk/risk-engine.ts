import {
  AcademicRecord,
  PerformanceTrend,
  RiskAssessment,
  RiskBreakdown,
  RiskLevel,
} from '@/types';
import { DEFAULT_RISK_CONFIG, RiskThresholdConfig } from './risk-config';

/**
 * Deterministic Risk Engine.
 * Calculates risk points and levels based on clear institutional rules.
 * Business logic remains strictly in TypeScript.
 */
export function calculateStudentRisk(
  currentRecord: AcademicRecord,
  history: AcademicRecord[] = [],
  config: RiskThresholdConfig = DEFAULT_RISK_CONFIG
): RiskAssessment {
  let attendanceScore = 0;
  let sgpaDeclineScore = 0;
  let backlogScore = 0;
  let assignmentScore = 0;
  let internalScore = 0;
  const flags: string[] = [];

  // 1. Attendance Check
  const att = currentRecord.attendance_percentage;
  if (att < config.attendanceSevereThreshold) {
    attendanceScore = config.attendanceSeverePoints;
    flags.push(`Severe attendance deficit: ${att.toFixed(1)}% (< ${config.attendanceSevereThreshold}%)`);
  } else if (att < config.attendanceWarningThreshold) {
    attendanceScore = config.attendanceWarningPoints;
    flags.push(`Attendance below threshold: ${att.toFixed(1)}% (< ${config.attendanceWarningThreshold}%)`);
  }

  // 2. Trend & SGPA Decline Check
  let trend: PerformanceTrend = 'INSUFFICIENT_DATA';
  if (history.length > 0) {
    // Sort history chronologically if needed
    const sorted = [...history].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const prev = sorted[sorted.length - 1];
    const diff = currentRecord.sgpa - prev.sgpa;

    if (diff <= -config.sgpaDeclineThreshold) {
      sgpaDeclineScore = config.sgpaDeclinePoints;
      flags.push(
        `Significant SGPA drop: ${prev.sgpa.toFixed(2)} → ${currentRecord.sgpa.toFixed(2)} (drop of ${Math.abs(diff).toFixed(2)})`
      );
      trend = 'DECLINING';
    } else if (diff >= 0.3) {
      trend = 'IMPROVING';
    } else {
      trend = 'STABLE';
    }
  } else if (currentRecord.cgpa > 0 && currentRecord.sgpa > 0) {
    // Check if current semester SGPA is significantly below cumulative CGPA
    const diff = currentRecord.sgpa - currentRecord.cgpa;
    if (diff <= -config.sgpaDeclineThreshold) {
      sgpaDeclineScore = config.sgpaDeclinePoints;
      flags.push(
        `Semester SGPA (${currentRecord.sgpa.toFixed(2)}) lagging behind cumulative CGPA (${currentRecord.cgpa.toFixed(2)})`
      );
      trend = 'DECLINING';
    } else if (diff >= 0.3) {
      trend = 'IMPROVING';
    } else {
      trend = 'STABLE';
    }
  }

  // 3. Backlog Check
  const backlogs = currentRecord.backlog_count;
  if (backlogs >= config.backlogMultipleThreshold) {
    backlogScore = config.backlogMultiplePoints;
    const subjectsStr = currentRecord.backlog_subjects?.length
      ? ` in ${currentRecord.backlog_subjects.join(', ')}`
      : '';
    flags.push(`Multiple standing backlogs: ${backlogs} subjects${subjectsStr}`);
  } else if (backlogs === 1) {
    backlogScore = config.backlogSinglePoints;
    const subjectsStr = currentRecord.backlog_subjects?.length
      ? ` (${currentRecord.backlog_subjects[0]})`
      : '';
    flags.push(`1 active backlog${subjectsStr}`);
  }

  // 4. Assignment / Lab Performance Check
  if (currentRecord.assignment_performance !== undefined) {
    if (currentRecord.assignment_performance < config.assignmentThreshold) {
      assignmentScore = config.assignmentPoints;
      flags.push(
        `Low assignment submission/score: ${currentRecord.assignment_performance.toFixed(1)}% (< ${config.assignmentThreshold}%)`
      );
    }
  }

  // 5. Internal Assessment Marks Check
  if (currentRecord.internal_assessment_marks) {
    let intPct = currentRecord.internal_assessment_marks.percentage;
    if (
      intPct === undefined &&
      currentRecord.internal_assessment_marks.obtained !== undefined &&
      currentRecord.internal_assessment_marks.maximum
    ) {
      intPct =
        (currentRecord.internal_assessment_marks.obtained /
          currentRecord.internal_assessment_marks.maximum) *
        100;
    }
    if (intPct !== undefined && intPct < config.internalMarksPercentageThreshold) {
      internalScore = config.internalMarksPoints;
      flags.push(`Internal assessment marks low: ${intPct.toFixed(1)}% (< ${config.internalMarksPercentageThreshold}%)`);
    }
  }

  // Calculate Overall Points
  const overallScore =
    attendanceScore + sgpaDeclineScore + backlogScore + assignmentScore + internalScore;

  // Determine Risk Level
  let riskLevel: RiskLevel = 'LOW';
  if (overallScore > config.highMaxScore) {
    riskLevel = 'CRITICAL';
  } else if (overallScore > config.moderateMaxScore) {
    riskLevel = 'HIGH';
  } else if (overallScore > config.lowMaxScore) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }

  const breakdown: RiskBreakdown = {
    attendanceScore,
    sgpaDeclineScore,
    backlogScore,
    assignmentScore,
    internalScore,
    flags,
  };

  return {
    id: `risk_${currentRecord.register_number}_${Date.now()}`,
    register_number: currentRecord.register_number,
    overall_score: overallScore,
    risk_level: riskLevel,
    breakdown,
    calculated_at: new Date().toISOString(),
    trend,
  };
}
