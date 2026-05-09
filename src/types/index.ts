export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  duration?: string; // e.g. "12 Months", "6 Months"
  studyMode?: 'Full-Time' | 'Part-Time' | 'Both';
}

export interface Module {
  id: string;
  courseId?: string;
  title: string;
  code: string;
  hours: number;
  order?: number;
  skillCodes?: string[];
}

export interface Intake {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  type?: 'F' | 'P';
}

export interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseId: string;
  intakeId: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'enrolled';
  dateApplied: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  intakeId: string;
  status: 'enrolled' | 'active' | 'graduated' | 'withdrawn';
  phase: 'admission' | 'academic' | 'graduation' | 'alumni';
  joinDate: string;
}

export interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  score: number;
  grade: string;
  status: 'passed' | 'failed' | 'pending';
  attempt: number;
  date: string;
  feedback?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  moduleId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paidAmount?: number;
  type: 'tuition' | 'registration' | 'material' | 'exam_fee' | 'other';
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  date: string;
  method?: 'cash' | 'bank_transfer' | 'credit_card';
}

export interface JourneyEvent {
  id: string;
  studentId: string;
  type: 'enrollment' | 'intake_start' | 'exam' | 'course_complete' | 'graduation' | 'payment';
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'upcoming';
}

export interface Expense {
  id: string;
  category: 'facilities' | 'marketing' | 'staff' | 'materials' | 'software' | 'other';
  title: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export interface Budget {
  category: string;
  allocated: number;
}
