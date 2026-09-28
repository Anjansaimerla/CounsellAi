export interface RiskThresholdConfig {
  attendanceWarningThreshold: number; // e.g. 75
  attendanceSevereThreshold: number;  // e.g. 60
  attendanceWarningPoints: number;    // e.g. 2
  attendanceSeverePoints: number;     // e.g. 3

  sgpaDeclineThreshold: number;       // e.g. 0.5
  sgpaDeclinePoints: number;          // e.g. 2

  backlogSinglePoints: number;        // e.g. 1
  backlogMultipleThreshold: number;   // e.g. 2
  backlogMultiplePoints: number;      // e.g. 3

  assignmentThreshold: number;        // e.g. 60
  assignmentPoints: number;           // e.g. 2

  internalMarksPercentageThreshold: number; // e.g. 50
  internalMarksPoints: number;              // e.g. 2

  // Categorization bands
  lowMaxScore: number;       // 0-2 -> LOW
  moderateMaxScore: number;  // 3-5 -> MODERATE
  highMaxScore: number;      // 6-8 -> HIGH
  // 9+ -> CRITICAL
}

export const DEFAULT_RISK_CONFIG: RiskThresholdConfig = {
  attendanceWarningThreshold: 75,
  attendanceSevereThreshold: 60,
  attendanceWarningPoints: 2,
  attendanceSeverePoints: 3,

  sgpaDeclineThreshold: 0.5,
  sgpaDeclinePoints: 2,

  backlogSinglePoints: 1,
  backlogMultipleThreshold: 2,
  backlogMultiplePoints: 3,

  assignmentThreshold: 60,
  assignmentPoints: 2,

  internalMarksPercentageThreshold: 50,
  internalMarksPoints: 2,

  lowMaxScore: 2,
  moderateMaxScore: 5,
  highMaxScore: 8,
};
