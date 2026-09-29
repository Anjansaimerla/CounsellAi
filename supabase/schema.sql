-- CounselAI Enterprise Supabase Database Architecture & Schema
-- Multi-User Role-Based Access Control, Departmental Scopes & Audit Logging

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COUNSELLOR')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  year_number INTEGER NOT NULL UNIQUE CHECK (year_number >= 1 AND year_number <= 6),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Sections Table (Belongs to Department & Year)
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_dept_year_section UNIQUE (department_id, year_id, name)
);

-- 6. Counselor Assignments Table (Max 2 counselors per section)
CREATE TABLE IF NOT EXISTS counselor_assignments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  counselor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function & Trigger to enforce Max 2 Active Counselors Per Section
CREATE OR REPLACE FUNCTION enforce_max_two_counselors_per_section()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  IF NEW.status = 'ACTIVE' THEN
    SELECT COUNT(*) INTO active_count
    FROM counselor_assignments
    WHERE section_id = NEW.section_id
      AND status = 'ACTIVE'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

    IF active_count >= 2 THEN
      RAISE EXCEPTION 'A section can have a maximum of 2 active counselors assigned.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_max_two_counselors ON counselor_assignments;
CREATE TRIGGER trigger_max_two_counselors
BEFORE INSERT OR UPDATE ON counselor_assignments
FOR EACH ROW EXECUTE FUNCTION enforce_max_two_counselors_per_section();

-- 7. Data Imports Table
CREATE TABLE IF NOT EXISTS data_imports (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  snapshot_label TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  imported_by TEXT NOT NULL DEFAULT 'counsellor',
  department_scope TEXT,
  year_scope TEXT,
  section_scope TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Students Table (Master Entity with relational foreign keys + display denormalizations)
CREATE TABLE IF NOT EXISTS students (
  register_number TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  program TEXT NOT NULL DEFAULT 'B.Tech',
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 6),
  year_id TEXT REFERENCES academic_years(id) ON DELETE SET NULL,
  section TEXT NOT NULL DEFAULT 'A',
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  student_contact TEXT,
  parent_name TEXT,
  parent_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Academic Records Table (Versioned snapshots)
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

-- 10. Behaviour Records Table
CREATE TABLE IF NOT EXISTS behaviour_records (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  disciplinary_issues TEXT NOT NULL DEFAULT 'NONE',
  disciplinary_description TEXT,
  classroom_behaviour TEXT,
  academic_difficulties TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  breakdown JSONB NOT NULL,
  trend TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Counselling Sessions Table (with Authorship & Counselor Tracking)
CREATE TABLE IF NOT EXISTS counselling_sessions (
  id TEXT PRIMARY KEY,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counsellor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counsellor_name TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  counselling_type TEXT NOT NULL CHECK (counselling_type IN ('ACADEMIC', 'ATTENDANCE', 'CAREER', 'BEHAVIOURAL', 'GENERAL', 'PARENT_MEETING', 'FOLLOW_UP', 'OTHER')),
  issue_identified TEXT NOT NULL,
  counsellor_observation TEXT NOT NULL,
  advice_given TEXT NOT NULL,
  action_plan JSONB NOT NULL DEFAULT '[]',
  follow_up_date TIMESTAMPTZ,
  follow_up_status TEXT CHECK (follow_up_status IN ('PENDING', 'DUE', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'CANCELLED')),
  parent_comm_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (parent_comm_status IN ('NOT_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'CONTACTED', 'UNABLE_TO_CONTACT', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES counselling_sessions(id) ON DELETE CASCADE,
  register_number TEXT NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
  counsellor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  counsellor_name TEXT NOT NULL,
  created_by TEXT,
  follow_up_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DUE', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'CANCELLED')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Improvement Records Table
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

-- 15. Risk Configuration Table
CREATE TABLE IF NOT EXISTS risk_config (
  id TEXT PRIMARY KEY DEFAULT 'current_config',
  attendance_warning NUMERIC(5,2) NOT NULL DEFAULT 75.0,
  attendance_severe NUMERIC(5,2) NOT NULL DEFAULT 60.0,
  sgpa_drop_threshold NUMERIC(4,2) NOT NULL DEFAULT 0.5,
  backlog_threshold INTEGER NOT NULL DEFAULT 2,
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance scoped queries
CREATE INDEX IF NOT EXISTS idx_students_scope ON students(department_id, year_id, section_id);
CREATE INDEX IF NOT EXISTS idx_students_dept_yr_sec ON students(department, year, section);
CREATE INDEX IF NOT EXISTS idx_counselor_assignments ON counselor_assignments(counselor_id, status);
CREATE INDEX IF NOT EXISTS idx_academic_records_regno ON academic_records(register_number);
CREATE INDEX IF NOT EXISTS idx_counselling_sessions_regno ON counselling_sessions(register_number);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(status, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
