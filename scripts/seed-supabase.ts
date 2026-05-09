import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We manually copy the mock data here because importing Next.js aliases (@/) 
// in a raw Node script can sometimes cause issues without tsconfig paths setup in ts-node/tsx.
const mockCourses = [
  { id: 'fceec', name: 'Fundamentals in Early Childhood Care', code: 'FCEEC', description: 'Entry-level training for childcare professionals.', duration: '4 Months', studyMode: 'Full-Time' },
  { id: 'hceic', name: 'Higher Certificate in Infant Care', code: 'HCEIC', description: 'Advanced certification for infant specialists.', duration: '12 Months', studyMode: 'Both' },
  { id: 'acey', name: 'Advanced Certificate in Early Years', code: 'ACEY', description: 'Comprehensive training for early childhood educators.', duration: '18 Months', studyMode: 'Part-Time' },
  { id: 'pdece', name: 'Professional Diploma in Early Childhood Education', code: 'PDECE', description: 'High-level diploma for leadership in education.', duration: '24 Months', studyMode: 'Both' },
  { id: 'fcmec', name: 'Fundamentals in Child Management (Mandarin)', code: 'FCMEC', description: 'Childcare training in Mandarin medium.', duration: '4 Months', studyMode: 'Full-Time' },
  { id: 'hcmic', name: 'Higher Certificate in Mandarin Infant Care', code: 'HCMIC', description: 'Mandarin-based infant care certification.', duration: '12 Months', studyMode: 'Both' },
  { id: 'pdmece', name: 'Professional Diploma in Mandarin Early Childhood', code: 'PDMECE', description: 'Leadership diploma in Mandarin education.', duration: '24 Months', studyMode: 'Both' },
];

const mockModules = [
  { id: 'm1', courseId: 'fceec', title: 'Principles of Child Development', code: 'CDP101', hours: 45, order: 1, skillCodes: ['TSC-ECH-1001-1.1', 'TSC-ECH-2005-1.1'] },
  { id: 'm2', courseId: 'fceec', title: 'Health, Safety & Nutrition', code: 'HSN102', hours: 30, order: 2, skillCodes: ['TSC-ECH-3012-1.1'] },
  { id: 'm3', courseId: 'hceic', title: 'Infant Physical Care & Wellbeing', code: 'IPC201', hours: 60, order: 1, skillCodes: ['TSC-ECH-1002-1.1'] },
];

const mockIntakes = [
  { id: '0125-FCEEC-F-1', name: 'Jan 2025 (Full-Time)', courseId: 'fceec', startDate: '2025-01-06', endDate: '2025-03-28', status: 'active', type: 'F' },
  { id: '0425-HCEIC-P-1', name: 'Apr 2025 (Part-Time)', courseId: 'hceic', startDate: '2025-04-07', endDate: '2025-06-27', status: 'upcoming', type: 'P' },
  { id: '0826-ACEY-F-1', name: '0826-ACEY-F-1', courseId: 'acey', startDate: '2026-08-01', endDate: '2028-02-01', status: 'upcoming', type: 'F' },
];

const mockStudents = [
  { id: 's1', firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com', intakeId: '0125-FCEEC-F-1', status: 'active', phase: 'academic', joinDate: '2025-01-06' },
  { id: 's2', firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', intakeId: '0125-FCEEC-F-1', status: 'active', phase: 'academic', joinDate: '2025-01-06' },
];

const mockApplications = [
  { id: 'app1', firstName: 'David', lastName: 'Lee', email: 'david.lee@example.com', phone: '+65 9123 4567', courseId: 'fceec', intakeId: '0125-FCEEC-F-1', status: 'reviewing', dateApplied: '2024-12-01' },
  { id: 'app2', firstName: 'Sarah', lastName: 'Wong', email: 'sarah.w@example.com', phone: '+65 8234 5678', courseId: 'hceic', intakeId: '0425-HCEIC-P-1', status: 'pending', dateApplied: '2024-12-05' },
  { id: 'app3', firstName: 'Chloe', lastName: 'Tan', email: 'chloe.t@example.com', phone: '+65 9345 6789', courseId: 'fcmec', intakeId: '0125-FCEEC-F-1', status: 'approved', dateApplied: '2024-11-20' },
];

const mockGrades = [
  { id: 'g1', studentId: 's1', moduleId: 'm1', score: 42, grade: 'F', status: 'failed', attempt: 1, date: '2025-02-15' },
  { id: 'g2', studentId: 's2', moduleId: 'm1', score: 92, grade: 'A+', status: 'passed', attempt: 1, date: '2025-02-15' },
];

const mockPayments = [
  { id: 'p1', studentId: 's1', amount: 2500, type: 'tuition', status: 'paid', date: '2024-12-15', method: 'bank_transfer' },
  { id: 'p2', studentId: 's1', amount: 500, type: 'registration', status: 'paid', date: '2024-12-15', method: 'bank_transfer' },
  { id: 'p3', studentId: 's2', amount: 2500, type: 'tuition', status: 'pending', date: '2025-01-20' },
];

const mockExpenses = [
  { id: 'ex1', category: 'staff', title: 'Lecturer Salaries (Jan)', amount: 12000, date: '2025-01-30', status: 'paid' },
  { id: 'ex2', category: 'marketing', title: 'Facebook Ad Campaign', amount: 800, date: '2025-01-15', status: 'paid' },
  { id: 'ex3', category: 'facilities', title: 'Office Rent & Utilities', amount: 3500, date: '2025-02-01', status: 'pending' },
  { id: 'ex4', category: 'materials', title: 'Textbooks for FCEEC', amount: 1200, date: '2025-01-20', status: 'paid' },
];

const mockBudgets = [
  { category: 'staff', allocated: 150000 },
  { category: 'marketing', allocated: 20000 },
  { category: 'facilities', allocated: 45000 },
  { category: 'materials', allocated: 15000 },
  { category: 'software', allocated: 5000 },
  { category: 'other', allocated: 10000 },
];

async function seed() {
  console.log('Starting DB seed...');

  // 1. Courses
  const { error: cErr } = await supabase.from('courses').upsert(mockCourses);
  if (cErr) console.error('Courses Error:', cErr.message);
  else console.log('✅ Courses seeded');

  // 2. Modules
  const { error: mErr } = await supabase.from('modules').upsert(mockModules);
  if (mErr) console.error('Modules Error:', mErr.message);
  else console.log('✅ Modules seeded');

  // 3. Intakes
  const { error: iErr } = await supabase.from('intakes').upsert(mockIntakes);
  if (iErr) console.error('Intakes Error:', iErr.message);
  else console.log('✅ Intakes seeded');

  // 4. Students
  const { error: sErr } = await supabase.from('students').upsert(mockStudents);
  if (sErr) console.error('Students Error:', sErr.message);
  else console.log('✅ Students seeded');

  // 5. Applications
  const { error: aErr } = await supabase.from('applications').upsert(mockApplications);
  if (aErr) console.error('Applications Error:', aErr.message);
  else console.log('✅ Applications seeded');

  // 6. Grades
  const { error: gErr } = await supabase.from('grades').upsert(mockGrades);
  if (gErr) console.error('Grades Error:', gErr.message);
  else console.log('✅ Grades seeded');

  // 7. Payments
  const { error: pErr } = await supabase.from('payments').upsert(mockPayments);
  if (pErr) console.error('Payments Error:', pErr.message);
  else console.log('✅ Payments seeded');

  // 8. Expenses
  const { error: exErr } = await supabase.from('expenses').upsert(mockExpenses);
  if (exErr) console.error('Expenses Error:', exErr.message);
  else console.log('✅ Expenses seeded');

  // 9. Budgets
  const { error: bErr } = await supabase.from('budgets').upsert(mockBudgets);
  if (bErr) console.error('Budgets Error:', bErr.message);
  else console.log('✅ Budgets seeded');

  console.log('Done! All mock data has been pushed to Supabase.');
}

seed();
