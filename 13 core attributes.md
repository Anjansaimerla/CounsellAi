Now the important part.

1. Student Register Number

Type: String

Rule:

Required
Unique within institution
Cannot be empty

Action:

Used as the primary student reference.

2. Student Name

Type: String

Rule:

Required
Trim whitespace

Action:

Display throughout the application.

3. Department

Type: String/enumeration

Example:

CSE
CSE-AIML
ECE
EEE

Action:

Filtering and reporting.

4. Program / Course

Example:

B.Tech
BCA
M.Tech

Action:

Used for grouping and filtering.

5. Year

Type: Integer

Allowed:

1–6

depending on institution.

6. Section

Type: String

Example:

A
B
C
D

Used for filtering.

7. Semester

Type: Integer

Typically:

1–8
8. Student Contact Number

Sensitive field.

Rules:

Validate format.
Encrypt/protect appropriately.
Don't expose unnecessarily.
9. Parent/Guardian Name

String.

Used for authorized parent communication records.

10. Parent/Guardian Contact

Sensitive.

Used only when authorized.

Academic Attributes
11. Attendance Percentage

Numeric.

Example:

72.5

Rules:

0 ≤ attendance ≤ 100

Risk engine may use thresholds.

Example:

< 75 → attendance concern
< 60 → severe attendance concern

These are configurable institutional rules, not universal standards.

12. Subject-wise Attendance

Recommended structure:

{
  "AI": 62,
  "Java": 81,
  "DBMS": 74
}

Rules:

Each value 0–100.
Subject name required.
Used to identify problematic subjects.
13. Internal Assessment Marks

Don't store just:

38

Prefer:

obtained: 38
maximum: 60

This lets the system calculate percentages consistently.

14. Semester Marks / SGPA

Separate conceptually:

semester_subject_marks
SGPA

SGPA:

0–10

depending on institution's grading system.

15. CGPA

Numeric.

Typically:

0–10

but configurable.

16. Backlog / Arrears

Store:

backlog_count
backlog_subjects[]

Don't store only "Yes".

Example:

{
  "count": 3,
  "subjects": [
    "Data Structures",
    "Mathematics",
    "AI"
  ]
}
17. Academic Performance Trend

Derived field.

Do NOT require the CSV to provide it.

Calculate from historical records.

Example:

7.8 → 7.2 → 6.5

Result:

DECLINING

Possible values:

IMPROVING
STABLE
DECLINING
INSUFFICIENT_DATA
18. Assignment / Lab Performance

Prefer structured data:

assignment_completion_percentage
average_assignment_score
lab_performance_percentage

Don't make the AI guess these.

Behaviour / Issue Data
19. Disciplinary Issues

Only use documented institutional information.

Never infer this from:

attendance
grades
AI-generated assumptions

Possible:

NONE
DOCUMENTED

with optional description.

20. Classroom Behaviour

This should be human-entered/documented.

Examples:

Good participation
Low participation
Disruptive
Inconsistent

Don't let AI infer personality from grades.

21. Academic Difficulties

Human/counsellor/student-provided.

Examples:

Difficulty understanding programming
Difficulty with mathematics
Time management
Assignment completion

AI may summarize it but shouldn't fabricate it.

Counselling Attributes
22. Counselling Date

Date/time.

Required when a counselling session is created.

23. Counselling Type

Use controlled values:

ACADEMIC
ATTENDANCE
CAREER
BEHAVIOURAL
GENERAL
PARENT_MEETING
FOLLOW_UP
OTHER
24. Issue Identified

Counsellor-confirmed issue.

Important distinction:

Risk signal ≠ confirmed issue

The AI may suggest discussion areas.

The counsellor confirms the issue.

25. Counsellor Observation

Free-text human observation.

AI can summarize but must preserve meaning.

26. Advice / Guidance Given

Record actual advice given.

AI can help structure notes.

27. Action Plan

Should be structured.

Example:

[
  {
    "action": "Attend programming doubt sessions",
    "target": "2 sessions",
    "deadline": "2026-10-15"
  }
]
28. Follow-up Date

Date.

Must be:

>= counselling date
29. Follow-up Status

Controlled values:

PENDING
DUE
COMPLETED
MISSED
RESCHEDULED
CANCELLED
30. Parent Communication Status

Controlled values:

NOT_REQUIRED
PENDING_APPROVAL
APPROVED
CONTACTED
UNABLE_TO_CONTACT
COMPLETED

Important: V1 does not automatically contact parents.

31. Student Improvement Status

Derived from follow-up comparison + counsellor assessment.

Possible:

NOT_EVALUATED
IMPROVED
PARTIALLY_IMPROVED
NO_SIGNIFICANT_IMPROVEMENT
DECLINED

AI can provide a summary, but the system should preserve the underlying metrics.

32. Counsellor Name

References the authenticated counsellor.

Do not accept arbitrary text if the counsellor is logged in.

Use:

counsellor_id

and derive/display the name.