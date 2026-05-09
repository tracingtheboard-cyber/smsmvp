'use client';

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  UserMinus, 
  Calendar, 
  Search, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Users
} from 'lucide-react';
import { mockStudents, mockIntakes, mockModules, mockCourses, mockAttendance } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const [selectedCourseId, setSelectedCourseId] = useState(mockCourses[0].id);
  const [selectedIntakeId, setSelectedIntakeId] = useState(mockIntakes.find(i => i.courseId === mockCourses[0].id)?.id);
  const [selectedModuleId, setSelectedModuleId] = useState(mockModules.find(m => m.courseId === mockCourses[0].id)?.id);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  const intakeStudents = mockStudents.filter(s => s.intakeId === selectedIntakeId);
  const courseModules = mockModules.filter(m => m.courseId === selectedCourseId);
  const courseIntakes = mockIntakes.filter(i => i.courseId === selectedCourseId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Attendance Tracking</h2>
          <p className="text-muted-foreground mt-1">Mark daily attendance for modules and intakes.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border p-2 rounded-xl">
          <Calendar size={18} className="text-muted-foreground ml-2" />
          <input 
            type="date" 
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-6 shadow-sm">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Course</label>
            <select 
              value={selectedCourseId}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedCourseId(cId);
                setSelectedIntakeId(mockIntakes.find(i => i.courseId === cId)?.id);
                setSelectedModuleId(mockModules.find(m => m.courseId === cId)?.id);
              }}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              {mockCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Intake</label>
            <select 
              value={selectedIntakeId}
              onChange={(e) => setSelectedIntakeId(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              {courseIntakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Module</label>
            <div className="space-y-1">
              {courseModules.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModuleId(m.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                    selectedModuleId === m.id 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {m.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users size={20} />
                </div>
                <h3 className="font-bold text-foreground">Mark Attendance ({intakeStudents.length} Students)</h3>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                  Mark All Present
                </button>
              </div>
            </div>

            <div className="divide-y divide-border">
              {intakeStudents.map((student) => {
                const record = mockAttendance.find(a => a.studentId === student.id && a.date === currentDate);
                return (
                  <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>

                        <p className="font-semibold text-foreground text-sm">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className={cn(
                        "p-2 rounded-xl border transition-all",
                        record?.status === 'present' ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200" : "bg-card text-muted-foreground border-border hover:bg-muted"
                      )}>
                        <Check size={20} />
                      </button>
                      <button className={cn(
                        "p-2 rounded-xl border transition-all",
                        record?.status === 'absent' ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-200" : "bg-card text-muted-foreground border-border hover:bg-muted"
                      )}>
                        <X size={20} />
                      </button>
                      <button className={cn(
                        "p-2 rounded-xl border transition-all",
                        record?.status === 'late' ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200" : "bg-card text-muted-foreground border-border hover:bg-muted"
                      )}>
                        <Clock size={20} />
                      </button>
                      <button className={cn(
                        "p-2 rounded-xl border transition-all",
                        record?.status === 'excused' ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200" : "bg-card text-muted-foreground border-border hover:bg-muted"
                      )}>
                        <UserMinus size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
              <button className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                Submit Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
