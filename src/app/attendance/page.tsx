'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Clock, UserMinus, Calendar, Users, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Course, Intake, Module, Student, Attendance } from '@/types';

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedIntakeId, setSelectedIntakeId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadData() {
      const [
        { data: coursesData },
        { data: intakesData },
        { data: modulesData },
        { data: studentsData },
        { data: attendanceData }
      ] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('intakes').select('*'),
        supabase.from('modules').select('*').order('order', { ascending: true }),
        supabase.from('students').select('*'),
        supabase.from('attendance').select('*')
      ]);

      if (coursesData) setCourses(coursesData);
      if (intakesData) setIntakes(intakesData);
      if (modulesData) setModules(modulesData);
      if (studentsData) setStudents(studentsData);
      if (attendanceData) setAttendance(attendanceData);

      if (coursesData && coursesData.length > 0) {
        const firstCourse = coursesData[0];
        setSelectedCourseId(firstCourse.id);
        const firstIntake = intakesData?.find(i => i.courseId === firstCourse.id);
        if (firstIntake) setSelectedIntakeId(firstIntake.id);
        const firstModule = modulesData?.find(m => m.courseId === firstCourse.id);
        if (firstModule) setSelectedModuleId(firstModule.id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const courseIntakes = intakes.filter(i => i.courseId === selectedCourseId);
  const courseModules = modules.filter(m => m.courseId === selectedCourseId);
  const intakeStudents = students.filter(s => s.intakeId === selectedIntakeId);

  const getRecord = (studentId: string) =>
    attendance.find(
      a => a.studentId === studentId && a.moduleId === selectedModuleId && a.date === currentDate
    );

  const markAttendance = (studentId: string, status: Attendance['status']) => {
    setAttendance(prev => {
      const idx = prev.findIndex(
        a => a.studentId === studentId && a.moduleId === selectedModuleId && a.date === currentDate
      );
      const record: Attendance = {
        id: idx >= 0 ? prev[idx].id : `att-${Date.now()}-${studentId}`,
        studentId,
        moduleId: selectedModuleId,
        date: currentDate,
        status
      };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = record;
        return updated;
      }
      return [...prev, record];
    });
  };

  const markAllPresent = () => {
    intakeStudents.forEach(s => markAttendance(s.id, 'present'));
  };

  const handleSubmitAttendance = async () => {
    setIsSaving(true);
    const todayRecords = attendance.filter(
      a => a.moduleId === selectedModuleId && a.date === currentDate && intakeStudents.some(s => s.id === a.studentId)
    );

    if (todayRecords.length === 0) {
      alert('No attendance records to save. Please mark attendance first.');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from('attendance').upsert(todayRecords, {
      onConflict: 'studentId,moduleId,date'
    });

    if (error) {
      alert(`Error saving attendance: ${error.message}`);
    } else {
      alert(`Attendance saved for ${todayRecords.length} students!`);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Loading attendance data...
      </div>
    );
  }

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
            onChange={e => setCurrentDate(e.target.value)}
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
              onChange={e => {
                const cId = e.target.value;
                setSelectedCourseId(cId);
                const firstIntake = intakes.find(i => i.courseId === cId);
                setSelectedIntakeId(firstIntake?.id || '');
                const firstModule = modules.find(m => m.courseId === cId);
                setSelectedModuleId(firstModule?.id || '');
              }}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Intake</label>
            <select
              value={selectedIntakeId}
              onChange={e => setSelectedIntakeId(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              {courseIntakes.length === 0 && <option value="">No intakes</option>}
              {courseIntakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Module</label>
            <div className="space-y-1">
              {courseModules.length === 0 && (
                <p className="text-xs text-muted-foreground px-2">No modules</p>
              )}
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

          {/* Stats */}
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
              <Users size={14} />
              Today's Stats
            </h4>
            {(['present', 'absent', 'late', 'excused'] as const).map(status => {
              const count = attendance.filter(
                a => a.moduleId === selectedModuleId && a.date === currentDate && a.status === status
              ).length;
              return (
                <div key={status} className="flex justify-between items-center text-xs">
                  <span className="capitalize text-muted-foreground">{status}</span>
                  <span className="font-bold text-foreground">{count}</span>
                </div>
              );
            })}
            <div className="flex justify-between items-center text-xs border-t border-border pt-2">
              <span className="text-muted-foreground">Total Students</span>
              <span className="font-bold text-foreground">{intakeStudents.length}</span>
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
                <h3 className="font-bold text-foreground">
                  Mark Attendance ({intakeStudents.length} Students)
                </h3>
              </div>
              <button
                onClick={markAllPresent}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                Mark All Present
              </button>
            </div>

            {intakeStudents.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No students in this intake. Add students first.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {intakeStudents.map(student => {
                  const record = getRecord(student.id);
                  return (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {([
                          { status: 'present' as const, icon: <Check size={20} />, activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200', label: 'Present' },
                          { status: 'absent' as const, icon: <X size={20} />, activeClass: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200', label: 'Absent' },
                          { status: 'late' as const, icon: <Clock size={20} />, activeClass: 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200', label: 'Late' },
                          { status: 'excused' as const, icon: <UserMinus size={20} />, activeClass: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200', label: 'Excused' },
                        ]).map(btn => (
                          <button
                            key={btn.status}
                            onClick={() => markAttendance(student.id, btn.status)}
                            title={btn.label}
                            className={cn(
                              "p-2 rounded-xl border transition-all",
                              record?.status === btn.status
                                ? btn.activeClass
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                            )}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
              <button
                onClick={handleSubmitAttendance}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Submit Attendance'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
