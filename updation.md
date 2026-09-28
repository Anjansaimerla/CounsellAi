Right now your app basically does:

Student
   ↓
Risk Score
   ↓
Risk Level

That's useful, but it isn't really a Student Counselling System yet.

We want:

Student
   ↓
Risk Analysis
   ↓
AI Counselling Brief
   ↓
Counsellor Session
   ↓
Counselling Record
   ↓
Action Plan
   ↓
Follow-up
   ↓
New Data
   ↓
Improvement Analysis

That creates the complete intervention loop.

3.1 Student Profile should become the counselling workspace

When I click:

Aarav Sharma

don't just show his academic information.

Create a proper Student Intervention Profile.

Something like:

┌─────────────────────────────────────────────┐
│ Aarav Sharma                CRITICAL RISK   │
│ 23CS101 | CSE | Year 3 | Sec A             │
└─────────────────────────────────────────────┘

ACADEMIC SNAPSHOT

Attendance       SGPA       CGPA       Backlogs
56.5%            5.40       7.10       3

─────────────────────────────────────────────

RISK ANALYSIS

⚠ Severe attendance deficit
⚠ Multiple active backlogs
⚠ Declining academic trend

─────────────────────────────────────────────

AI COUNSELLING BRIEF

[ Generate AI Brief ]

─────────────────────────────────────────────

COUNSELLING SESSION

Issue Identified
[............................]

Counsellor Observation
[............................]

Advice / Guidance
[............................]

Action Plan
[............................]

Follow-up Date
[ 15 / 10 / 2026 ]

[ Save Counselling Record ]

Now the student profile becomes the actual place where intervention happens.

3.2 What should the AI actually do?

This is important.

Don't make the AI randomly "counsel" the student.

Instead, give the AI a very specific job:

AI receives
Student academic data
+
Risk signals
+
Historical counselling records
+
Previous follow-up results

Then it produces:

AI Counselling Brief
Risk Summary

Primary Concerns
• Attendance below threshold
• Three active backlogs
• Declining performance

Suggested Discussion Areas
• Attendance barriers
• Difficult subjects
• Assignment completion
• Study schedule

Suggested Questions
• Which subjects are you currently struggling with?
• What is preventing regular attendance?
• Are there any difficulties completing assignments?

Possible Intervention Areas
• Faculty support
• Study schedule
• Attendance monitoring
• Academic mentoring

This is much safer and more useful than:

"AI tells counselor what to do."

The AI should assist the counselor, not replace their judgment.

3.3 Then the counselor takes over

This is the human part.

The counselor talks to the student and fills:

Issue Identified
Low attendance and difficulty with Mathematics III
Counsellor Observation
Student reports difficulty understanding Mathematics III
and has been missing morning classes.
Advice / Guidance
Student advised to attend all scheduled classes,
meet the Mathematics faculty twice per week,
and complete pending assignments.

These are your attributes:

24. Issue Identified
25. Counsellor Observation
26. Advice / Guidance Given
3.4 Action Plan should be structured

Instead of one giant text box, I'd actually make the action plan a list.

For example:

ACTION PLAN

☐ Attend all classes for next 2 weeks
☐ Meet Mathematics faculty twice/week
☐ Complete pending assignments
☐ Submit backlog recovery plan

Each action could have:

Action
Responsible person
Target date
Status

For example:

Action	Target	Status
Attend classes	2 weeks	Pending
Meet faculty	2 weeks	Pending
Complete assignments	10 Oct	Pending

This makes your system much more realistic.

3.5 Follow-up should be generated from the action plan

After counselling:

Counsellor clicks

SAVE COUNSELLING SESSION

System automatically does:

Save counselling record
        ↓
Save action plan
        ↓
Create follow-up task
        ↓
Set status = Upcoming

Then Follow-up Queue becomes useful.

3.6 Follow-up screen

When the date arrives:

Aarav Sharma

Follow-up Date:
15 Oct 2026

Previous Risk:
CRITICAL

Previous Attendance:
56.5%

Previous SGPA:
5.4

Action Plan:
3 items

Counsellor conducts the follow-up.

Then records:

Follow-up Status:
Completed

Student Improvement Status:
Improved / No Change / Declined

Counsellor Notes:
......................

And saves.

3.7 Then the next CSV snapshot becomes extremely important

This is where your Improvement Tracking screen comes alive.

Suppose:

September
Attendance = 56.5%
SGPA = 5.4
Backlogs = 3
Risk = Critical

Then October CSV is uploaded.

Attendance = 76%
SGPA = 6.2
Backlogs = 1
Risk = Moderate

Your system compares:

BEFORE                  AFTER

56.5% attendance  →    76%
5.4 SGPA          →    6.2
3 backlogs        →    1
Critical          →    Moderate

Now you can say:

Student record shows measurable changes between snapshots.

That's the real purpose of Improvement Tracking.

3.8 And now all 32 attributes have a purpose

This is the important part.

Your original 32 attributes aren't supposed to exist on one giant form.

They belong to different parts of the system.

Student identity
1  Register Number
2  Student Name
3  Department
4  Program
5  Year
6  Section
7  Semester
8  Student Contact
9  Parent Name
10 Parent Contact
Academic/risk data
11 Attendance
12 Subject Attendance
13 Internal Marks
14 Semester Marks / SGPA
15 CGPA
16 Backlogs
17 Performance Trend
18 Assignment/Lab Performance
19 Disciplinary Issues
20 Classroom Behaviour
21 Academic Difficulties
Counselling record
22 Counselling Date
23 Counselling Type
24 Issue Identified
25 Counsellor Observation
26 Advice / Guidance
27 Action Plan
Follow-up
28 Follow-up Date
29 Follow-up Status
30 Parent Communication Status
31 Student Improvement Status
32 Counsellor Name

That's a much cleaner data model.

The final workflow I'd build

Your complete CounselAI system should ultimately behave like this:

                  ┌───────────────┐
                  │   CSV UPLOAD  │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │   VALIDATION  │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │ STORE SNAPSHOT│
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │  RISK ENGINE  │
                  └───────┬───────┘
                          ↓
             ┌────────────┴────────────┐
             ↓                         ↓
          LOW RISK                 AT RISK
             ↓                         ↓
          Monitor              STUDENT PROFILE
                                      ↓
                              AI COUNSELLING BRIEF
                                      ↓
                              COUNSELLOR SESSION
                                      ↓
                              ISSUE + OBSERVATION
                                      ↓
                              GUIDANCE + ACTION PLAN
                                      ↓
                              FOLLOW-UP DATE
                                      ↓
                              FOLLOW-UP QUEUE
                                      ↓
                              FOLLOW-UP SESSION
                                      ↓
                              NEW CSV SNAPSHOT
                                      ↓
                              BEFORE / AFTER
                                      ↓
                              IMPROVEMENT STATUS
And this gives each screen a clear job:
Screen	Job
Dashboard	What is happening across the institution?
Students & Risk	Which students need attention?
CSV Upload	Bring new student data into the system
Student Profile/Counselling	Understand + counsel a student
Follow-up Queue	What intervention tasks need attention?
Improvement Tracking	Did the student change after intervention?
Risk Config	What rules determine risk?