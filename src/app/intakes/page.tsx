'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, BookOpen, Clock, ChevronRight, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { Intake, Course } from '@/types';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { useRole } from '@/lib/RoleContext';
import { supabase } from '@/lib/supabase';

export default function IntakesPage() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canEditCurriculum } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    startDate: '',
    endDate: '',
    status: 'upcoming' as Intake['status'],
    type: 'F' as 'F' | 'P', // F = Full Time, P = Part Time
  });

  useEffect(() => {
    async function loadData() {
      const [{ data: coursesData }, { data: intakesData }] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('intakes').select('*')
      ]);
      
      if (coursesData) {
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setFormData(prev => ({ ...prev, courseId: coursesData[0].id }));
        }
      }
      if (intakesData) setIntakes(intakesData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Automatically calculate end date based on course duration
  useEffect(() => {
    if (formData.startDate && formData.courseId && courses.length > 0) {
      const course = courses.find(c => c.id === formData.courseId);
      if (course?.duration) {
        const monthsStr = course.duration.split(' ')[0];
        let months = parseInt(monthsStr, 10);
        if (!isNaN(months)) {
          // Part-time duration generally doubles
          if (formData.type === 'P') {
            months *= 2;
          }

          const startDateObj = new Date(formData.startDate);
          startDateObj.setMonth(startDateObj.getMonth() + months);
          // Adjust for end of month or exactly X months later minus 1 day (standard duration calc)
          startDateObj.setDate(startDateObj.getDate() - 1);
          
          const newEndDate = startDateObj.toISOString().split('T')[0];
          if (formData.endDate !== newEndDate) {
            setFormData(prev => ({ ...prev, endDate: newEndDate }));
          }
        }
      }
    }
  }, [formData.startDate, formData.courseId, formData.type, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Get MMYY from startDate
    const date = new Date(formData.startDate);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yy = date.getFullYear().toString().slice(-2);
    const mmyy = `${mm}${yy}`;
    
    // 2. Get Course Code
    const course = courses.find(c => c.id === formData.courseId);
    const courseCode = course?.code || 'UNK';
    
    // 3. Calculate sequence for this course in this month
    const sameMonthIntakes = intakes.filter(i => {
      const iDate = new Date(i.startDate);
      const iMmyy = `${(iDate.getMonth() + 1).toString().padStart(2, '0')}${iDate.getFullYear().toString().slice(-2)}`;
      return iMmyy === mmyy && i.courseId === formData.courseId;
    });
    const seq = sameMonthIntakes.length + 1;

    // 4. Final ID: 0826-CAS-01-F-1
    const newId = `${mmyy}-${courseCode}-${formData.type}-${seq}`;
    
    const newIntake: Intake = {
      ...formData,
      id: `${newId}-${Date.now()}`, // ensure absolute uniqueness with timestamp suffix
      name: formData.name || newId,
    };
    
    // Insert into Supabase
    const { error } = await supabase.from('intakes').insert([newIntake]);
    
    if (error) {
      alert(`Error creating intake: ${error.message}`);
      return;
    }
    
    setIntakes([...intakes, newIntake]);
    setIsModalOpen(false);
    setFormData({ name: '', courseId: courses[0]?.id || '', startDate: '', endDate: '', status: 'upcoming', type: 'F' });
  };

  const generateIntakeName = () => {
    if (!formData.startDate) {
      alert("Please select a Start Date first.");
      return;
    }
    const dateObj = new Date(formData.startDate);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(2);
    const courseCode = courses.find(c => c.id === formData.courseId)?.code || 'CRS';
    const type = formData.type;
    
    const prefix = `${mm}${yy}-${courseCode}-${type}`;
    const existingCount = intakes.filter(i => i.id.startsWith(prefix) || i.name.startsWith(prefix)).length;
    const nextSeq = existingCount + 1;
    
    setFormData({ ...formData, name: `${prefix}-${nextSeq}` });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedIntakes = json.map((row: any, index: number) => ({
        id: `import-${Date.now()}-${index}`,
        name: row.Name || row.name || `Imported-${index}`,
        courseId: row.CourseID || row.courseId || (courses.length > 0 ? courses[0].id : ''),
        startDate: row.StartDate || row.startDate || new Date().toISOString().split('T')[0],
        endDate: row.EndDate || row.endDate || new Date().toISOString().split('T')[0],
        status: (row.Status || row.status || 'upcoming').toLowerCase() as Intake['status'],
        type: (row.Type || row.type || 'F').toUpperCase() as 'F' | 'P',
      })).filter((i: any) => i.name && i.courseId);

      if (importedIntakes.length > 0) {
        const { error } = await supabase.from('intakes').insert(importedIntakes);
        if (error) {
          alert(`Error importing intakes: ${error.message}`);
        } else {
          setIntakes(prev => [...prev, ...importedIntakes]);
        }
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'CourseID', 'StartDate', 'EndDate', 'Status', 'Type'],
      ['0725-FCEEC-F-1', courses.length > 0 ? courses[0].id : 'course-1', '2025-07-01', '2026-06-30', 'upcoming', 'F'],
      ['0825-FCEEC-P-1', courses.length > 0 ? courses[0].id : 'course-1', '2025-08-01', '2027-07-31', 'upcoming', 'P']
    ]);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Intakes_Template");
    XLSX.writeFile(wb, "Intake_Import_Template.xlsx");
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading intakes from database...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Intake Management</h2>
          <p className="text-muted-foreground mt-1">Schedule and manage course intakes, academic calendars, and class assignments.</p>
        </div>
        {canEditCurriculum && (
          <div className="flex gap-3">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
              title="Download Excel Template"
            >
              <Download size={18} />
              Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
            >
              <Upload size={18} />
              Import
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Create Intake
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {intakes.map((intake) => {
          const course = courses.find(c => c.id === intake.courseId);
          return (
            <div key={intake.id} className="group bg-card rounded-3xl border border-border shadow-sm p-6 flex flex-col hover:border-primary/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-0.5">{intake.name}</h3>
                    {intake.name !== intake.id && (
                      <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest">{intake.id}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                    intake.type === 'F' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                  )}>
                    {intake.type === 'F' ? 'Full-Time' : 'Part-Time'}
                  </span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                    intake.status === 'active' ? "bg-emerald-100 text-emerald-600" :
                    intake.status === 'upcoming' ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {intake.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                <BookOpen size={16} />
                {course?.name} ({course?.code})
              </p>

              <div className="flex items-center justify-between mb-6 bg-muted/50 p-4 rounded-xl">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  {new Date(intake.startDate).toLocaleDateString()} – {new Date(intake.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-end text-sm">
                <Link
                  href={`/intakes/${intake.id}`}
                  className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group/link"
                >
                  Manage Batch
                  <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Intake"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Intake Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-foreground">Intake Name / ID</label>
              <button 
                type="button" 
                onClick={generateIntakeName}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Auto-Generate
              </button>
            </div>
            <input
              required
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="e.g. 0725-FCEEC-F-1"
            />
          </div>

          {/* Course and Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Programme / Course</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Study Mode</label>
              <div className="flex bg-muted p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'F' })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    formData.type === 'F' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Full-Time
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'P' })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    formData.type === 'P' ? "bg-background text-purple-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Part-Time
                </button>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Start Date</label>
              <input
                required
                type="date"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              {formData.startDate && (
                <p className="text-xs text-muted-foreground font-medium pl-1">
                  {new Date(parseInt(formData.startDate.split('-')[0]), parseInt(formData.startDate.split('-')[1]) - 1, parseInt(formData.startDate.split('-')[2])).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">End Date</label>
              <input
                required
                type="date"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              {formData.endDate && (
                <p className="text-xs text-muted-foreground font-medium pl-1">
                  {new Date(parseInt(formData.endDate.split('-')[0]), parseInt(formData.endDate.split('-')[1]) - 1, parseInt(formData.endDate.split('-')[2])).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Status</label>
            <div className="grid grid-cols-3 gap-3">
              {(['upcoming', 'active', 'completed'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={cn(
                    "py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                    formData.status === s
                      ? s === 'active' ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : s === 'upcoming' ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-gray-100 border-gray-300 text-gray-700"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Study Mode */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Study Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  value="F" 
                  checked={formData.type === 'F'}
                  onChange={() => setFormData({...formData, type: 'F'})}
                  className="w-4 h-4 text-primary focus:ring-primary/20 border-border"
                />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">Full Time (F)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  value="P" 
                  checked={formData.type === 'P'}
                  onChange={() => setFormData({...formData, type: 'P'})}
                  className="w-4 h-4 text-primary focus:ring-primary/20 border-border"
                />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">Part Time (P)</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Create Intake
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
