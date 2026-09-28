FR-01 — Authentication

User must be able to securely sign in.

FR-02 — CSV Upload

Counsellor can upload a CSV containing multiple student records.

Example:

register_number,student_name,department,...
23A001,Rahul,CSE,...
23A002,Priya,CSE,...

The system must:

Validate file type.
Validate required columns.
Validate data types.
Detect duplicates.
Show errors before ingestion.
Allow successful records to be imported.
FR-03 — Student Analysis

After ingestion:

CSV
 ↓
Validation
 ↓
Normalization
 ↓
Database
 ↓
Risk Engine
FR-04 — Risk Detection

The system calculates intervention indicators.

Example:

Attendance < threshold
SGPA declining
Backlogs present
Assignment performance low
Internal marks low

These produce a configurable risk score.

FR-05 — AI Counselling Brief

AI receives relevant structured data and generates:

Summary
Key concerns
Performance trend
Discussion areas
Suggested questions
Possible intervention areas

AI must not invent facts.

FR-06 — Counselling Record

Counsellor can record:

Date
Type
Issue
Observation
Advice
Action plan
Follow-up date
FR-07 — Follow-up

System displays:

Upcoming follow-ups
Due follow-ups
Overdue follow-ups
Completed follow-ups
FR-08 — Improvement Analysis

When new academic data becomes available:

OLD SNAPSHOT
     ↓
NEW DATA
     ↓
COMPARE
     ↓
IMPROVEMENT STATUS