import { Course, Intake, Student, Grade, JourneyEvent, Module, Attendance, Payment, Application } from '@/types';

export const mockCourses: Course[] = [
  { id: 'fceec', name: 'Fundamentals in Early Childhood Care', code: 'FCEEC', description: 'Entry-level training for childcare professionals.', duration: '4 Months', studyMode: 'Full-Time' },
  { id: 'hceic', name: 'Higher Certificate in Infant Care', code: 'HCEIC', description: 'Advanced certification for infant specialists.', duration: '12 Months', studyMode: 'Both' },
  { id: 'acey', name: 'Advanced Certificate in Early Years', code: 'ACEY', description: 'Comprehensive training for early childhood educators.', duration: '18 Months', studyMode: 'Part-Time' },
  { id: 'pdece', name: 'Professional Diploma in Early Childhood Education', code: 'PDECE', description: 'High-level diploma for leadership in education.', duration: '24 Months', studyMode: 'Both' },
  { id: 'fcmec', name: 'Fundamentals in Child Management (Mandarin)', code: 'FCMEC', description: 'Childcare training in Mandarin medium.', duration: '4 Months', studyMode: 'Full-Time' },
  { id: 'hcmic', name: 'Higher Certificate in Mandarin Infant Care', code: 'HCMIC', description: 'Mandarin-based infant care certification.', duration: '12 Months', studyMode: 'Both' },
  { id: 'pdmece', name: 'Professional Diploma in Mandarin Early Childhood', code: 'PDMECE', description: 'Leadership diploma in Mandarin education.', duration: '24 Months', studyMode: 'Both' },
];

export const mockModules: Module[] = [
  { id: 'm1', courseId: 'fceec', title: 'Principles of Child Development', code: 'CDP101', hours: 45, order: 1, skillCodes: ['TSC-ECH-1001-1.1', 'TSC-ECH-2005-1.1'] },
  { id: 'm2', courseId: 'fceec', title: 'Health, Safety & Nutrition', code: 'HSN102', hours: 30, order: 2, skillCodes: ['TSC-ECH-3012-1.1'] },
  { id: 'm3', courseId: 'hceic', title: 'Infant Physical Care & Wellbeing', code: 'IPC201', hours: 60, order: 1, skillCodes: ['TSC-ECH-1002-1.1'] },
];

export const mockIntakes: Intake[] = [
  { id: '0125-FCEEC-F-1', name: 'Jan 2025 (Full-Time)', courseId: 'fceec', startDate: '2025-01-06', endDate: '2025-03-28', status: 'active', type: 'F' },
  { id: '0425-HCEIC-P-1', name: 'Apr 2025 (Part-Time)', courseId: 'hceic', startDate: '2025-04-07', endDate: '2025-06-27', status: 'upcoming', type: 'P' },
  { id: '0826-ACEY-F-1', name: '0826-ACEY-F-1', courseId: 'acey', startDate: '2026-08-01', endDate: '2028-02-01', status: 'upcoming', type: 'F' },
];

export const mockApplications: Application[] = [
  { id: 'app1', firstName: 'David', lastName: 'Lee', email: 'david.lee@example.com', phone: '+65 9123 4567', courseId: 'fceec', intakeId: '0125-FCEEC-F-1', status: 'reviewing', dateApplied: '2024-12-01' },
  { id: 'app2', firstName: 'Sarah', lastName: 'Wong', email: 'sarah.w@example.com', phone: '+65 8234 5678', courseId: 'hceic', intakeId: '0425-HCEIC-P-1', status: 'pending', dateApplied: '2024-12-05' },
  { id: 'app3', firstName: 'Chloe', lastName: 'Tan', email: 'chloe.t@example.com', phone: '+65 9345 6789', courseId: 'fcmec', intakeId: '0125-FCEEC-F-1', status: 'approved', dateApplied: '2024-11-20' },
];

export const mockStudents: Student[] = [
  { id: 's1', firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com', intakeId: '0125-FCEEC-F-1', status: 'active', phase: 'academic', joinDate: '2025-01-06' },
  { id: 's2', firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', intakeId: '0125-FCEEC-F-1', status: 'active', phase: 'academic', joinDate: '2025-01-06' },
];

export const mockGrades: Grade[] = [
  { id: 'g1', studentId: 's1', moduleId: 'm1', score: 42, grade: 'F', status: 'failed', attempt: 1, date: '2025-02-15' },
  { id: 'g2', studentId: 's2', moduleId: 'm1', score: 92, grade: 'A+', status: 'passed', attempt: 1, date: '2025-02-15' },
];

export const mockAttendance: Attendance[] = [
  { id: 'a1', studentId: 's1', moduleId: 'm1', date: '2025-02-10', status: 'present' },
  { id: 'a2', studentId: 's1', moduleId: 'm1', date: '2025-02-11', status: 'absent' },
  { id: 'a3', studentId: 's2', moduleId: 'm1', date: '2025-02-10', status: 'present' },
];

export const mockPayments: Payment[] = [
  { id: 'p1', studentId: 's1', amount: 2500, type: 'tuition', status: 'paid', date: '2024-12-15', method: 'bank_transfer' },
  { id: 'p2', studentId: 's1', amount: 500, type: 'registration', status: 'paid', date: '2024-12-15', method: 'bank_transfer' },
  { id: 'p3', studentId: 's2', amount: 2500, type: 'tuition', status: 'pending', date: '2025-01-20' },
];

export const mockJourneyEvents: JourneyEvent[] = [
  { id: 'e1', studentId: 's1', type: 'enrollment', title: 'Admitted', description: 'Enrolled in CAS-01.', date: '2024-12-10', status: 'completed' },
  { id: 'e2', studentId: 's1', type: 'payment', title: 'Tuition Paid', description: 'Received full payment for Q1.', date: '2024-12-15', status: 'completed' },
  { id: 'e3', studentId: 's1', type: 'exam', title: 'CIF101 Failed', description: 'Requires Retake.', date: '2025-02-15', status: 'completed' },
];

export const mockExpenses: any[] = [
  { id: 'ex1', category: 'staff', title: 'Lecturer Salaries (Jan)', amount: 12000, date: '2025-01-30', status: 'paid' },
  { id: 'ex2', category: 'marketing', title: 'Facebook Ad Campaign', amount: 800, date: '2025-01-15', status: 'paid' },
  { id: 'ex3', category: 'facilities', title: 'Office Rent & Utilities', amount: 3500, date: '2025-02-01', status: 'pending' },
  { id: 'ex4', category: 'materials', title: 'Textbooks for FCEEC', amount: 1200, date: '2025-01-20', status: 'paid' },
];

export const mockBudgets: any[] = [
  { category: 'staff', allocated: 150000 },
  { category: 'marketing', allocated: 20000 },
  { category: 'facilities', allocated: 45000 },
  { category: 'materials', allocated: 15000 },
  { category: 'software', allocated: 5000 },
  { category: 'other', allocated: 10000 },
];
