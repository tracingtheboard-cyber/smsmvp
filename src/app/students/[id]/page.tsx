'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Circle, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Mail,
  MoreVertical,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { mockStudents, mockJourneyEvents, mockIntakes, mockCourses, mockGrades, mockModules } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function StudentJourneyPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const student = mockStudents.find(s => s.id === id);
  const journey = mockJourneyEvents.filter(e => e.studentId === id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const intake = mockIntakes.find(i => i.id === student?.intakeId);
  const course = mockCourses.find(c => c.id === intake?.courseId);
  
  // Grade calculations
  const studentGrades = mockGrades.filter(g => g.studentId === id);
  const failedModules = studentGrades.filter(g => g.status === 'failed');
  const courseModules = mockModules.filter(m => m.courseId === course?.id);
  
  const passedCount = studentGrades.filter(g => g.status === 'passed').length;
  const progressPercent = courseModules.length > 0 ? Math.round((passedCount / courseModules.length) * 100) : 0;

  if (!student) return <div>Student not found</div>;

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
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{student.firstName} {student.lastName}</h2>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                student.phase === 'academic' ? "bg-blue-100 text-blue-600" : 
                student.phase === 'admission' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {student.phase}
              </span>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail size={14} />
              {student.email}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors">
            Edit Profile
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Action
          </button>
        </div>
      </div>

      {failedModules.length > 0 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 text-red-700 shadow-sm shadow-red-100"
        >
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold">Module Retake Required</p>
            <p className="text-sm">This student has failed {failedModules.length} module(s). Graduation is blocked until these are passed.</p>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2">
            <RotateCcw size={16} />
            Schedule Retake
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Academic Info</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen size={18} className="text-primary mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">{course?.name}</p>
                  <p className="text-xs text-muted-foreground">Course Code: {course?.code}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-primary mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">{intake?.name}</p>
                  <p className="text-xs text-muted-foreground">Batch Period</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap size={18} className="text-primary mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">Expected July 2025</p>
                  <p className="text-xs text-muted-foreground">Graduation Date</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl border border-primary/20 p-6">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Overall Progress</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">{progressPercent}%</span>
              <span className="text-sm text-muted-foreground mb-1">to Graduation</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {passedCount} of {courseModules.length} modules completed
            </p>
          </div>
        </div>

        {/* Right Column: Timeline Journey */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-foreground">Student Journey Timeline</h3>
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {journey.map((event, index) => {
              const isFailed = event.description.toLowerCase().includes('failed');
              return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  {/* Dot */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border border-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300",
                    isFailed ? "bg-red-500 text-white" :
                    event.status === 'completed' ? "bg-primary text-white" : 
                    event.status === 'pending' ? "bg-blue-100 text-blue-600 border-blue-200" : "bg-muted text-muted-foreground"
                  )}>
                    {isFailed ? <AlertCircle size={18} /> :
                     event.status === 'completed' ? <CheckCircle2 size={18} /> : 
                     event.status === 'pending' ? <Clock size={18} /> : <Circle size={18} />}
                  </div>

                  {/* Content Card */}
                  <div className={cn(
                    "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border transition-all",
                    isFailed 
                      ? "bg-red-50/50 border-red-200 shadow-sm hover:border-red-400" 
                      : "border-border bg-card shadow-sm group-hover:shadow-md group-hover:border-primary/30"
                  )}>
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className={cn("font-bold", isFailed ? "text-red-700" : "text-foreground")}>
                        {event.title}
                        {isFailed && <span className="ml-2 text-[10px] bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">FAIL</span>}
                      </div>
                      <time className={cn("font-medium text-xs", isFailed ? "text-red-500" : "text-primary")}>
                        {new Date(event.date).toLocaleDateString()}
                      </time>
                    </div>
                    <div className={cn("text-sm", isFailed ? "text-red-600" : "text-muted-foreground")}>
                      {event.description}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
