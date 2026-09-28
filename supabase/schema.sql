-- CounsellAI Supabase Database Architecture & Schema
-- Generated based on databasearchitecture.md & securityrules.md

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Data Imports Table
CREATE TABLE IF NOT EXISTS data_imports (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  snapshot_label TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  imported_by TEXT NOT NULL DEFAULT 'counsellor',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Students Table (Master Entity)
CREATE TABLE IF NOT EXISTS students (
  register_number TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT 'B.Tech',
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 6),
  section TEXT NOT NULL DEFAULT 'A',
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  student_contact TEXT,
  parent_name TEXT,
  parent_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Academic Records Table (Versioned / Snapshot-based)
CREATE TABLE IF NOT EXISTS academic_records (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  snapshot_label TEXT NOT NULL,
  semester INTEGER NOT NULL,
  attendance_percentage NUMERIC(5,2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
  subject_wise_attendance JSONB,
  internal_assessment_marks JSONB,
  sgpa NUMERIC(4,2) NOT NULL CHECK (sgpa >= 0 AND sgpa <= 10),
  cgpa NUMERIC(4,2) NOT NULL CHECK (cgpa >= 0 AND cgpa <= 10),
  backlog_count INTEGER NOT NULL DEFAULT 0 CHECK (backlog_count >= 0),
  backlog_subjects JSONB,
  assignment_performance NUMERIC(5,2),
  lab_performance NUMERIC(5,2),
  import_id TEXT REFERENCES data_imports(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Behaviour Records Table
CREATE TABLE IF NOT EXISTS behaviour_records (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  disciplinary_issues TEXT NOT NULL DEFAULT 'NONE',
  disciplinary_description TEXT,
  classroom_behaviour TEXT,
  academic_difficulties TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  breakdown JSONB NOT NULL,
  trend TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Counselling Sessions Table
CREATE TABLE IF NOT EXISTS counselling_sessions (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counsellor_id TEXT NOT NULL,
  counsellor_name TEXT NOT NULL,
  counselling_type TEXT NOT NULL CHECK (counselling_type IN ('ACADEMIC', 'ATTENDANCE', 'CAREER', 'BEHAVIOURAL', 'GENERAL', 'PARENT_MEETING', 'FOLLOW_UP', 'OTHER')),
  issue_identified TEXT NOT NULL,
  counsellor_observation TEXT NOT NULL,
  advice_given TEXT NOT NULL,
  action_plan JSONB NOT NULL DEFAULT '[]',
  follow_up_date TIMESTAMPTZ,
  follow_up_status TEXT CHECK (follow_up_status IN ('PENDING', 'DUE', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'CANCELLED')),
  parent_comm_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (parent_comm_status IN ('NOT_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'CONTACTED', 'UNABLE_TO_CONTACT', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES counselling_sessions(id) ON DELETE CASCADE,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  follow_up_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DUE', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'CANCELLED')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Improvement Records Table (Before / After Comparison)
CREATE TABLE IF NOT EXISTS improvement_records (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  baseline_record_id TEXT NOT NULL REFERENCES academic_records(id),
  latest_record_id TEXT NOT NULL REFERENCES academic_records(id),
  attendance_diff NUMERIC(5,2) NOT NULL,
  sgpa_diff NUMERIC(4,2) NOT NULL,
  backlog_diff INTEGER NOT NULL,
  assignment_diff NUMERIC(5,2),
  status TEXT NOT NULL CHECK (status IN ('NOT_EVALUATED', 'IMPROVED', 'PARTIALLY_IMPROVED', 'NO_SIGNIFICANT_IMPROVEMENT', 'DECLINED')),
  ai_summary TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_records ENABLE ROW LEVEL SECURITY;

-- Default Policies for Authenticated Counsellors
CREATE POLICY "Allow authenticated read on all data" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on all data" ON students FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to academic_records" ON academic_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to counselling_sessions" ON counselling_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to risk_assessments" ON risk_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to follow_ups" ON follow_ups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to improvement_records" ON improvement_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to data_imports" ON data_imports FOR ALL TO authenticated USING (true);
