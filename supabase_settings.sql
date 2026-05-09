-- Create the system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT PRIMARY KEY,
    "schoolName" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "invoiceReminders" BOOLEAN NOT NULL DEFAULT true,
    "attendanceWarnings" BOOLEAN NOT NULL DEFAULT true,
    "gradePublishing" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings
INSERT INTO "system_settings" (
    "id", 
    "schoolName", 
    "registrationNumber", 
    "address", 
    "email", 
    "phone", 
    "invoiceReminders", 
    "attendanceWarnings", 
    "gradePublishing"
) VALUES (
    'global',
    'SMS Pro Academy',
    'REG-2025-0991X',
    '123 Education Boulevard, Singapore 123456',
    'admin@smspro.edu.sg',
    '+65 6123 4567',
    true,
    true,
    false
) ON CONFLICT ("id") DO NOTHING;
