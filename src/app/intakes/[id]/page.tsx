'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  MoreVertical,
  Plus,
  Mail,
  FileDown
} from 'lucide-react';
import { mockIntakes, mockStudents, mockCourses, mockModules } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { Student } from '@/types';

export default function IntakeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const intake = mockIntakes.find(i => i.id === id);
  const course = mockCourses.find(c => c.id === intake?.courseId);
  const initialStudents = mockStudents.filter(s => s.intakeId === id);
  const modules = mockModules.filter(m => m.courseId === course?.id);

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ firstName: '', lastName: '', email: '' });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: `s${Date.now()}`,
      firstName: enrollForm.firstName,
      lastName: enrollForm.lastName,
      email: enrollForm.email,
      intakeId: id as string,
      status: 'active',
      phase: 'academic',
      joinDate: new Date().toISOString().split('T')[0]
    };
    mockStudents.push(newStudent);
    setStudents([...students, newStudent]);
    setIsEnrollModalOpen(false);
    setEnrollForm({ firstName: '', lastName: '', email: '' });
  };

  if (!intake) return <div>Intake not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors border border-border"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{intake.name}</h2>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                intake.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              )}>
                {intake.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <BookOpen size={14} />
              {course?.name} ({course?.code})
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors text-sm">
            <Mail size={16} />
            Bulk Email
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors text-sm">
            <FileDown size={16} />
            Export Nominal Roll
          </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <Users size={18} />
            <span className="text-xs font-bold uppercase">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{students.length}</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase">Avg. Attendance</span>
          </div>
          <p className="text-2xl font-bold text-foreground">92%</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase">Days Remaining</span>
          </div>
          <p className="text-2xl font-bold text-foreground">45 Days</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <BookOpen size={18} />
            <span className="text-xs font-bold uppercase">Current Module</span>
          </div>
          <p className="text-lg font-bold text-foreground truncate">{modules[0]?.title || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Intake Roster</h3>
              <button 
                onClick={() => setIsEnrollModalOpen(true)}
                className="flex items-center gap-2 text-primary text-sm font-bold hover:underline"
              >
                <Plus size={16} />
                Add to this Batch
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-center">Modules Passed</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{student.firstName} {student.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{student.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-foreground">1 / {modules.length}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-full uppercase">
                          {student.phase}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">
                        No students enrolled in this intake yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Timeline & Schedule Preview */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Module Roadmap</h3>
            <div className="space-y-6">
              {modules.sort((a, b) => a.order - b.order).map((module, idx) => (
                <div key={module.id} className="relative flex gap-4">
                  {idx !== modules.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border -translate-x-1/2" />
                  )}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs border-2",
                    idx === 0 ? "bg-primary border-primary text-white" : "bg-muted border-border text-muted-foreground"
                  )}>
                    {module.order}
                  </div>
                  <div className="pb-4">
                    <p className={cn("text-sm font-bold", idx === 0 ? "text-foreground" : "text-muted-foreground")}>{module.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{idx === 0 ? 'Currently Running' : 'Upcoming'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Student"
      >
        <form onSubmit={handleEnroll} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">First Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={enrollForm.firstName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, firstName: e.target.value })}
                  placeholder="e.g. John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Last Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={enrollForm.lastName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, lastName: e.target.value })}
                  placeholder="e.g. Doe"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email Address</label>
              <input
                required
                type="email"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={enrollForm.email}
                onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                placeholder="e.g. john@example.com"
              />
            </div>
            
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <BookOpen size={16} />
                Enrolling into: {intake.name}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
