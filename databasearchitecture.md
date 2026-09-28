I'd use these core tables.

users
students
academic_records
attendance_records
subject_records
counselling_sessions
action_plans
follow_ups
risk_assessments
data_imports
Relationship
Student
  │
  ├── Academic Records
  ├── Attendance
  ├── Subject Records
  ├── Risk Assessments
  └── Counselling Sessions
          │
          └── Action Plan
                  │
                  └── Follow-up