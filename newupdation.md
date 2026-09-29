CounselAI — Admin Portal, Authentication & Counselor Scoping

1. Objective

Convert the existing CounselAI app from a single unified institutional dashboard into a secure multi-user system with:

ADMIN role with institution-wide control.

COUNSELLOR role restricted to an assigned Department/Branch + Year + Section.

Maximum 2 counselors per section.

Secure authentication and backend authorization.

Existing risk engine, CSV ingestion, counselling, follow-up and improvement features preserved.

Core rule:

The frontend must never be responsible for security. Backend/API/database authorization must enforce the counselor's scope.

2. Roles

ADMIN

Admin has complete institutional access.

Admin can:

Add/edit/disable counselors.

Set/reset counselor credentials.

Create/edit/disable departments/branches.

Create/edit/disable years.

Create/edit/disable sections.

Assign counselors to sections.

Maximum 2 counselors per section.

View/add/edit/delete students.

Import/export institution-wide CSV data.

View all counselling records.

View/manage all follow-ups.

View improvement tracking for the institution.

Change risk engine parameters.

View audit logs.

Access all dashboards and reports.

COUNSELLOR

Counselor access is restricted to their assignment.

Example:

Department: CSE
Year: 2
Section: D

The counselor can only access:

CSE → Year 2 → Section D

They must not see other sections, years or departments.

3. Two Counselors Per Section

A section can have two counselors:

CSE / Year 2 / D
    ├── Counselor A
    └── Counselor B

Both counselors share the same student scope.

Both can work with students in that section.

However, every counselling/action/follow-up record must preserve authorship:

created_by
created_at
updated_by
updated_at
counsellor_id

Recommended model:

Student data is shared within the assigned scope; counselling records are also visible within that scope, but the system records which counselor created each record.

This prevents two counselors from creating isolated versions of the same student.

4. Authentication Flow

Open CounselAI
      ↓
Login
      ↓
Username + Password
      ↓
Authenticate
      ↓
Determine Role
      ↓
ADMIN ─────────────→ Admin Portal
      │
      └─ COUNSELLOR → Load Assignment
                           ↓
                    Scoped Dashboard

Implement:

Login

Logout

Secure sessions/tokens

Password hashing

Session expiry

Protected API routes

Role-based authorization

Rate limiting on login

Never store plaintext passwords.

Use a secure password hashing algorithm such as Argon2id or the secure mechanism recommended by the chosen auth framework.

Do not use:

localStorage.role = "admin"

as actual security.

5. Admin Portal

Create a separate Admin navigation:

Admin Dashboard
Users & Counselors
Departments / Branches
Years
Sections
Students
Counselling Records
Follow-ups
Improvement Tracking
Risk Configuration
CSV Imports
Audit Logs
System Settings
Logout

Admin Dashboard

Show institution-wide:

Total Students
Total Counselors
Total Departments
Total Sections
High/Critical Risk
Moderate Risk
Follow-ups Due
Improved Students

Also provide:

Risk by department

Risk by year

Risk by section

Counselor workload

Recent imports

Recent counselling activity

6. Counselor Dashboard

The dashboard must derive the counselor's scope from the authenticated account.

Example:

Dr. Ravi Kumar
CSE • Year 2 • Section D

Dashboard metrics must be calculated only from that scope:

Total Students
High/Critical
Moderate
Follow-ups Due
Improved Students

Do not load the entire institution into the browser and filter it client-side.

7. Backend Authorization

This is a critical requirement.

For a counselor request:

authenticated user
      ↓
role = COUNSELLOR
      ↓
load counselor assignment
      ↓
department_id
year_id
section_id
      ↓
query only authorized records

Conceptually:

SELECT *
FROM students
WHERE department_id = counselor.department_id
  AND year_id = counselor.year_id
  AND section_id = counselor.section_id;

Do not trust browser-supplied values such as:

?department=CSE&year=2&section=D

for authorization.

The backend must derive scope from the authenticated counselor.

Create centralized authorization utilities/middleware, for example:

requireAuth()
requireRole("ADMIN")
requireCounselorScope()

8. Database Model

Use relational IDs rather than relying only on strings.

users

id
name
username
password_hash
role
status
created_at
updated_at

departments

id
name
code
status
created_at
updated_at

years

id
name
status

sections

id
department_id
year_id
name
status

A section belongs to exactly one department/year combination.

counselor_assignments

id
counselor_id
department_id
year_id
section_id
status

Design this as a separate table so future versions can support multiple assignments per counselor.

students

At minimum:

id
register_number
student_name
department_id
year_id
section_id
student_contact
parent_name
parent_contact
academic fields...

counselling_records

id
student_id
counsellor_id
counselling_date
counselling_type
issue_identified
counsellor_observation
advice_guidance
action_plan
created_at
updated_at

followups

id
student_id
counselling_record_id
counsellor_id
due_date
status
completion_notes
created_at
updated_at

risk_config

id
attendance_warning
attendance_severe
sgpa_drop_threshold
backlog_threshold
updated_by
updated_at

audit_logs

id
user_id
action
entity_type
entity_id
metadata
timestamp

9. Admin Management Pages

Departments

Admin can:

Add

Edit

Disable

View

Prefer ACTIVE/INACTIVE instead of deleting departments that have historical records.

Years

Admin can configure:

Year 1
Year 2
Year 3
Year 4

Sections

Example:

CSE
 ├── Year 2
 │    ├── A
 │    ├── B
 │    ├── C
 │    └── D
 └── Year 3
      ├── A
      └── B

Prevent duplicate section definitions.

Counselors

Table:

Name
Username
Department
Year
Section
Status
Actions

Actions:

Edit
Assign Scope
Disable
Reset Password
View Activity

When creating a counselor, Admin sets:

Name
Username
Temporary Password
Department
Year
Section

10. Scope Rules

A counselor assigned to:

CSE / Year 2 / D

can access:

CSE / Year 2 / D

and cannot access:

CSE / Year 2 / A
CSE / Year 3 / D
ECE / Year 2 / D
IT / Year 2 / D

This must apply to:

Dashboard

Students

Student profiles

CSV imports

Counselling records

Follow-ups

Improvement tracking

AI counselling briefs

Exports

Admin has institution-wide access.

11. CSV Import

Admin

Admin can import institution-wide data.

Counselor

Counselor can only import records belonging to the counselor's assigned scope.

Example:

Counselor scope:
CSE / Year 2 / D

Valid:

CSE / Year 2 / D

Invalid:

ECE / Year 3 / A

Mixed unauthorized CSVs must not silently import.

Preferred behavior:

Import validation
      ↓
Find unauthorized rows
      ↓
Block import
      ↓
Show row-level errors

Validate:

department
year
section
register_number
required fields
data types
ranges

12. Counselling Workflow

The student profile should become the actual counselling workspace.

Flow:

Student Profile
      ↓
Academic Summary
      ↓
Risk Explanation
      ↓
AI Counselling Brief
      ↓
Counselor Session
      ↓
Issue Identified
      ↓
Counselor Observation
      ↓
Advice / Guidance
      ↓
Action Plan
      ↓
Follow-up Date
      ↓
Save

Example:

Issue:
Low attendance + difficulty with Mathematics III

Observation:
Student reports difficulty understanding Mathematics III
and has been missing morning classes.

Guidance:
Attend classes consistently and meet subject faculty twice
per week.

Action Plan:
1. Attend all classes for next 2 weeks
2. Meet Mathematics faculty twice/week
3. Complete pending assignments

Follow-up:
15 Oct 2026

13. Follow-up Automation

The counselor should NOT manually create a duplicate follow-up task.

When a counselling record is saved with a follow-up date:

Save counselling record
       ↓
Save action plan
       ↓
Automatically create follow-up
       ↓
Status = UPCOMING

Status progression:

UPCOMING
   ↓
DUE
   ↓
OVERDUE
   ↓
COMPLETED

The follow-up belongs to the same authorized student scope.

14. AI Counselling Brief

The AI is an assistant, not the authority.

The deterministic risk engine answers:

WHO needs attention?

The AI answers:

WHY might the student need attention, what should the counselor discuss, and what intervention areas could be considered?

Input:

Student academic data
Risk signals
Relevant historical counselling records
Previous follow-up results

Output:

Risk Summary
Primary Concerns
Suggested Discussion Areas
Suggested Questions
Possible Intervention Areas

The counselor makes the final counselling decision.

Only data that the counselor is authorized to access may be sent to the AI.

Never send the entire institutional database for a single-student brief.

15. Risk Configuration

Admin controls the risk engine parameters.

Example:

Attendance Warning Threshold: 75
Severe Attendance Threshold: 60
SGPA Drop Threshold: 0.5
Multiple Backlog Threshold: 2

When Admin clicks:

Save Engine Parameters

the values are persisted and the risk engine uses the saved configuration.

The configuration changes the rules, not the underlying student data.

Counselors should not be allowed to change institutional risk parameters unless a future permission explicitly grants it.

16. Improvement Tracking

Use versioned student snapshots.

Example:

Baseline

Attendance: 56.5%
SGPA: 5.4
Backlogs: 3
Risk: Critical

Follow-up snapshot

Attendance: 76%
SGPA: 6.2
Backlogs: 1
Risk: Moderate

Compare:

Attendance: +19.5 percentage points
SGPA: +0.8
Backlogs: -2
Risk: Critical → Moderate

Counselors only see comparison data within their assigned scope.

Admin can see institution-wide comparisons.

17. Audit Logs

Record important actions:

LOGIN
LOGOUT
CREATE_COUNSELOR
UPDATE_COUNSELOR
DISABLE_COUNSELOR
CREATE_DEPARTMENT
CREATE_YEAR
CREATE_SECTION
ASSIGN_COUNSELOR
IMPORT_CSV
UPDATE_STUDENT
DELETE_STUDENT
CREATE_COUNSELLING_RECORD
UPDATE_COUNSELLING_RECORD
CREATE_FOLLOWUP
COMPLETE_FOLLOWUP
CHANGE_RISK_CONFIG

Store:

user_id
action
entity_type
entity_id
timestamp
metadata

Never log passwords, tokens or other authentication secrets.

18. Deletion Rules

Admin has deletion authority, but preserve historical institutional data wherever possible.

Prefer:

ACTIVE
INACTIVE
ARCHIVED

for departments, years, sections and counselors.

For destructive deletion:

Delete
  ↓
Confirmation modal
  ↓
Explain consequences
  ↓
Admin confirms
  ↓
Transaction
  ↓
Audit log

Respect foreign-key relationships and prevent orphaned records.

19. UI

Login

CounselAI

Username
Password

[ Sign In ]

Admin Sidebar

Dashboard
Users & Counselors
Departments
Years
Sections
Students
Counselling
Follow-ups
Improvement
Risk Configuration
CSV Imports
Audit Logs
System Settings
Logout

Counselor Sidebar

Dashboard
Students & Risk
CSV Upload
Follow-up Queue
Improvement Tracking
Logout

Display scope clearly:

Dr. Ravi Kumar
CSE • Year 2 • Section D

Admin:

Administrator
Institution-wide access

20. Authorization Matrix

Capability

Admin

Counselor

View all students

YES

NO

View assigned students

YES

YES

Add/edit assigned student

YES

YES*

Delete student

YES

YES(BUT ONLY IN THE ASSINGED LIST OF STUDENTS)

Import institution CSV

YES

NO

Import assigned CSV

YES

YES*

Export institution data

YES

NO

Export assigned data

YES

YES*

View all counselling records

YES

NO

View assigned counselling records

YES

YES

Create counselling record

YES

YES

Edit own counselling record

YES

YES

Edit another counselor's record

YES

Restricted

Delete counselling record

YES

NO

View all follow-ups

YES

NO

View assigned follow-ups

YES

YES

Create follow-up

YES

YES

Risk configuration

YES

NO

Manage departments

YES

NO

Manage years

YES

NO

Manage sections

YES

NO

Manage counselors

YES

NO

Audit logs

YES

NO

* All counselor operations remain scope-limited.

21. API Security

Protected APIs should conceptually follow:

Request
  ↓
Authenticate
  ↓
Identify user
  ↓
Check role
  ↓
If counselor → resolve assignment
  ↓
Apply scope to database query
  ↓
Perform operation

Examples:

GET /api/students
GET /api/students/:id
POST /api/students
PUT /api/students/:id
POST /api/csv/import
GET /api/followups
POST /api/counselling

Every endpoint must enforce authorization.

Do not rely on the UI to protect endpoints.

22. Error Handling

Unauthorized:

401
Authentication required.

Forbidden:

403
You do not have permission to access this resource.

Out-of-scope student:

403
Access denied. This student is outside your assigned section.

Invalid counselor CSV:

Import blocked.

The file contains students outside:
CSE • Year 2 • Section D

23. Development Seed Data

Development-only:

ADMIN
username: admin
password: change-me-immediately

COUNSELOR A
username: counselor.cse2d
password: change-me-immediately
scope: CSE / Year 2 / D

COUNSELOR B
username: counselor2.cse2d
password: change-me-immediately
scope: CSE / Year 2 / D

COUNSELOR C
username: counselor.ece3a
password: change-me-immediately
scope: ECE / Year 3 / A

These must be development credentials only and must not be shipped as production defaults.

24. Testing Requirements

Authentication

Test:

Valid admin login

Invalid password

Valid counselor login

Disabled counselor login

Logout

Expired session

Authorization

Counselor A:

CSE / Year 2 / D

Must access:

CSE / Year 2 / D

Must not access:

CSE / Year 2 / A
CSE / Year 3 / D
ECE / Year 2 / D

Counselor B has the same scope and must see the same student population.

Admin must see all scopes.

CSV

Valid counselor CSV:

CSE / Year 2 / D
→ SUCCESS

Unauthorized CSV:

ECE / Year 3 / A
→ BLOCKED

Mixed CSV:

CSE / Year 2 / D
CSE / Year 3 / A
ECE / Year 2 / B
→ BLOCKED or clearly reject unauthorized rows

Never silently import unauthorized records.

25. Migration Strategy

Do not destroy the existing application.

First:

Backup database
      ↓
Add users
      ↓
Add departments
      ↓
Add years
      ↓
Add sections
      ↓
Add counselor assignments
      ↓
Map existing students to scopes
      ↓
Add authentication
      ↓
Add authorization middleware
      ↓
Build Admin Portal
      ↓
Scope counselor queries
      ↓
Update CSV ingestion
      ↓
Test existing risk engine
      ↓
Test follow-ups
      ↓
Test improvement tracking

26. Antigravity Instructions

Before changing code:

Inspect the complete repository.

Identify frontend framework.

Identify backend/API.

Identify database and ORM.

Identify current student schema.

Identify CSV ingestion.

Identify risk engine.

Identify dashboard queries.

Identify counselling/follow-up implementation.

Identify improvement tracking.

Identify environment variables and existing API keys.

Identify any existing authentication.

Do not create duplicate systems.

Modify the current architecture where possible.

Implementation order:

PHASE 1 — Database/Data Model
PHASE 2 — Authentication
PHASE 3 — Authorization Middleware
PHASE 4 — Admin Portal
PHASE 5 — Counselor Scoping
PHASE 6 — Scope-aware CSV
PHASE 7 — Connect Existing Screens
PHASE 8 — Security & Cross-scope Testing

Do not rewrite working features unnecessarily.

27. Definition of Done

Login works.

Admin role works.

Counselor role works.

Admin Portal exists.

Admin can create counselors.

Admin can assign Department/Year/Section.

Maximum 2 counselors per section is enforced.

Admin can create departments.

Admin can create years.

Admin can create sections.

Counselor dashboard is scope-limited.

Counselor student list is scope-limited.

Counselor student profile is scope-limited.

Counselor CSV import is scope-limited.

Counselor follow-ups are scope-limited.

Counselor improvement tracking is scope-limited.

AI brief only receives authorized data.

Admin sees institution-wide data.

Backend enforces authorization.

Passwords are securely hashed.

Audit logs exist.

Logout works.

Unauthorized requests return 401/403 appropriately.

Existing risk engine still works.

Existing dashboard still works.

Existing CSV ingestion still works.

Existing follow-up system still works.

Existing improvement tracking still works.

28. Final Architecture

                         ┌───────────────┐
                         │     ADMIN     │
                         └───────┬───────┘
                                 │
                  ┌──────────────┼──────────────┐
                  ↓              ↓              ↓
             Departments       Years        Sections
                                                │
                                         ┌──────┴──────┐
                                         ↓             ↓
                                    Counselor A   Counselor B
                                         │             │
                                         └──────┬──────┘
                                                ↓
                                      SHARED SECTION SCOPE
                                                ↓
                                          Student Data
                                                ↓
                                          Risk Engine
                                                ↓
                                     AI Counselling Brief
                                                ↓
                                        Counselling
                                                ↓
                                         Action Plan
                                                ↓
                                       Follow-up Queue
                                                ↓
                                      Improvement Tracking
                                                ↓
                                      Next Data Snapshot

Product definition

CounselAI is a role-based student intervention platform where administrators manage the institution and counselor assignments, while counselors receive a secure, scope-limited workspace for identifying, counselling, following up with, and tracking the improvement of their assigned students.