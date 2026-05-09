-- ============================================================
-- SMS2 - Full Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- 1. COURSES
CREATE TABLE IF NOT EXISTS "courses" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "code"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "duration"    TEXT,
  "studyMode"   TEXT CHECK ("studyMode" IN ('Full-Time', 'Part-Time', 'Both'))
);

-- 2. MODULES
CREATE TABLE IF NOT EXISTS "modules" (
  "id"         TEXT PRIMARY KEY,
  "courseId"   TEXT REFERENCES "courses"("id") ON DELETE CASCADE,
  "title"      TEXT NOT NULL,
  "code"       TEXT NOT NULL,
  "hours"      INTEGER DEFAULT 0,
  "order"      INTEGER DEFAULT 1,
  "skillCodes" TEXT[]
);

-- 3. INTAKES
CREATE TABLE IF NOT EXISTS "intakes" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "courseId"  TEXT REFERENCES "courses"("id") ON DELETE CASCADE,
  "startDate" DATE NOT NULL,
  "endDate"   DATE NOT NULL,
  "status"    TEXT CHECK ("status" IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  "type"      TEXT CHECK ("type" IN ('F', 'P')) DEFAULT 'F'
);

-- 4. STUDENTS
CREATE TABLE IF NOT EXISTS "students" (
  "id"        TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName"  TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "intakeId"  TEXT REFERENCES "intakes"("id") ON DELETE SET NULL,
  "status"    TEXT CHECK ("status" IN ('enrolled', 'active', 'graduated', 'withdrawn')) DEFAULT 'enrolled',
  "phase"     TEXT CHECK ("phase" IN ('admission', 'academic', 'graduation', 'alumni')) DEFAULT 'admission',
  "joinDate"  DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. APPLICATIONS (Admissions)
CREATE TABLE IF NOT EXISTS "applications" (
  "id"          TEXT PRIMARY KEY,
  "firstName"   TEXT NOT NULL,
  "lastName"    TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "phone"       TEXT,
  "courseId"    TEXT REFERENCES "courses"("id") ON DELETE SET NULL,
  "intakeId"    TEXT REFERENCES "intakes"("id") ON DELETE SET NULL,
  "status"      TEXT CHECK ("status" IN ('pending', 'reviewing', 'approved', 'rejected', 'enrolled')) DEFAULT 'pending',
  "dateApplied" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 6. GRADES
CREATE TABLE IF NOT EXISTS "grades" (
  "id"        TEXT PRIMARY KEY,
  "studentId" TEXT REFERENCES "students"("id") ON DELETE CASCADE,
  "moduleId"  TEXT REFERENCES "modules"("id") ON DELETE CASCADE,
  "score"     NUMERIC DEFAULT 0,
  "grade"     TEXT,
  "status"    TEXT CHECK ("status" IN ('passed', 'failed', 'pending')) DEFAULT 'pending',
  "attempt"   INTEGER DEFAULT 1,
  "date"      DATE NOT NULL DEFAULT CURRENT_DATE,
  "feedback"  TEXT,
  UNIQUE ("studentId", "moduleId", "attempt")
);

-- 7. ATTENDANCE
CREATE TABLE IF NOT EXISTS "attendance" (
  "id"        TEXT PRIMARY KEY,
  "studentId" TEXT REFERENCES "students"("id") ON DELETE CASCADE,
  "moduleId"  TEXT REFERENCES "modules"("id") ON DELETE CASCADE,
  "date"      DATE NOT NULL,
  "status"    TEXT CHECK ("status" IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  UNIQUE ("studentId", "moduleId", "date")
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS "payments" (
  "id"         TEXT PRIMARY KEY,
  "studentId"  TEXT REFERENCES "students"("id") ON DELETE CASCADE,
  "amount"     NUMERIC NOT NULL DEFAULT 0,
  "paidAmount" NUMERIC DEFAULT 0,
  "type"       TEXT CHECK ("type" IN ('tuition', 'registration', 'material', 'exam_fee', 'other')) DEFAULT 'tuition',
  "status"     TEXT CHECK ("status" IN ('paid', 'pending', 'overdue', 'partial')) DEFAULT 'pending',
  "date"       DATE NOT NULL DEFAULT CURRENT_DATE,
  "method"     TEXT CHECK ("method" IN ('cash', 'bank_transfer', 'credit_card'))
);

-- 9. EXPENSES
CREATE TABLE IF NOT EXISTS "expenses" (
  "id"       TEXT PRIMARY KEY,
  "category" TEXT CHECK ("category" IN ('facilities', 'marketing', 'staff', 'materials', 'software', 'other')) DEFAULT 'other',
  "title"    TEXT NOT NULL,
  "amount"   NUMERIC NOT NULL DEFAULT 0,
  "date"     DATE NOT NULL DEFAULT CURRENT_DATE,
  "status"   TEXT CHECK ("status" IN ('paid', 'pending')) DEFAULT 'paid'
);

-- 10. BUDGETS
CREATE TABLE IF NOT EXISTS "budgets" (
  "category"  TEXT PRIMARY KEY,
  "allocated" NUMERIC NOT NULL DEFAULT 0
);

-- Insert default budget categories
INSERT INTO "budgets" ("category", "allocated") VALUES
  ('staff',       150000),
  ('marketing',   20000),
  ('facilities',  45000),
  ('materials',   15000),
  ('software',    5000),
  ('other',       10000)
ON CONFLICT ("category") DO NOTHING;

-- 11. SYSTEM SETTINGS (from supabase_settings.sql)
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id"                 TEXT PRIMARY KEY,
  "schoolName"         TEXT NOT NULL,
  "registrationNumber" TEXT NOT NULL,
  "address"            TEXT NOT NULL,
  "email"              TEXT NOT NULL,
  "phone"              TEXT NOT NULL,
  "invoiceReminders"   BOOLEAN NOT NULL DEFAULT true,
  "attendanceWarnings" BOOLEAN NOT NULL DEFAULT true,
  "gradePublishing"    BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO "system_settings" ("id","schoolName","registrationNumber","address","email","phone","invoiceReminders","attendanceWarnings","gradePublishing")
VALUES ('global','SMS Pro Academy','REG-2025-0991X','123 Education Boulevard, Singapore 123456','admin@smspro.edu.sg','+65 6123 4567',true,true,false)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- RLS: Disable for now (enable + configure per-role later)
-- ============================================================
ALTER TABLE "courses"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "modules"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "intakes"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "students"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "applications"    DISABLE ROW LEVEL SECURITY;
ALTER TABLE "grades"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance"      DISABLE ROW LEVEL SECURITY;
ALTER TABLE "payments"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "budgets"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "system_settings" DISABLE ROW LEVEL SECURITY;
