'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Layers, 
  Users, 
  Plus, 
  ChevronRight,
  MoreVertical,
  Clock,
  Upload,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';
import { Modal } from '@/components/Modal';
import { Course, Module } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseModulesMap, setCourseModulesMap] = useState<Record<string, Module[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { canEditCurriculum } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration: '12 Months',
    studyMode: 'Both' as 'Full-Time' | 'Part-Time' | 'Both'
  });

  useEffect(() => {
    async function loadData() {
      const [{ data: coursesData }, { data: modulesData }] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('modules').select('*').order('order', { ascending: true })
      ]);
      if (coursesData) setCourses(coursesData);
      if (modulesData) {
        const map: Record<string, Module[]> = {};
        modulesData.forEach(m => {
          if (m.courseId) {
            if (!map[m.courseId]) map[m.courseId] = [];
            map[m.courseId].push(m);
          }
        });
        setCourseModulesMap(map);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({ name: '', code: '', description: '', duration: '12 Months', studyMode: 'Both' });
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({ 
      name: course.name, 
      code: course.code, 
      description: course.description || '', 
      duration: course.duration || '12 Months',
      studyMode: course.studyMode || 'Both'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      const { error } = await supabase.from('courses').update(formData).eq('id', editingCourse.id);
      if (error) { alert(`Error: ${error.message}`); return; }
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...formData } : c));
    } else {
      const newCourse: Course = { id: formData.code.toLowerCase(), ...formData };
      const { error } = await supabase.from('courses').insert([newCourse]);
      if (error) { alert(`Error: ${error.message}`); return; }
      setCourses([...courses, newCourse]);
    }
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedCourses = json.map((row: any) => ({
        id: (row.Code || row.code || `c-${Date.now()}`).toLowerCase(),
        name: row.Name || row.name || 'Unnamed Course',
        code: row.Code || row.code || 'UNKNOWN',
        description: row.Description || row.description || '',
        duration: row.Duration || row.duration || '12 Months',
        studyMode: (row.StudyMode || row.studyMode || 'Both') as 'Full-Time' | 'Part-Time' | 'Both'
      })).filter((c: any) => c.name && c.code);

      if (importedCourses.length > 0) {
        const { error } = await supabase.from('courses').insert(importedCourses);
        if (error) { alert(`Import error: ${error.message}`); }
        else { setCourses(prev => [...importedCourses, ...prev]); }
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Code', 'Description', 'Duration', 'StudyMode'],
      ['Higher Certificate in Infant Care', 'HCEIC', 'Comprehensive infant care course', '12 Months', 'Both'],
      ['Diploma in Early Childhood Education', 'DECE', 'Advanced diploma for educators', '24 Months', 'Full-Time']
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Courses_Template");
    XLSX.writeFile(wb, "Course_Import_Template.xlsx");
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Loading courses from database...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Course Catalog</h2>
          <p className="text-muted-foreground mt-1">Manage vocational training programs and their constituent modules.</p>
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
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Create New Course
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredCourses.map((course) => {
          const courseModules = courseModulesMap[course.id] || [];

          return (
            <div key={course.id} className="group bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <BookOpen size={32} />
                  </div>
                  {canEditCurriculum && (
                    <button 
                      onClick={() => openEditModal(course)}
                      className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                      {course.code}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md",
                      course.studyMode === 'Full-Time' ? 'bg-blue-50 text-blue-600' :
                      course.studyMode === 'Part-Time' ? 'bg-purple-50 text-purple-600' :
                      'bg-emerald-50 text-emerald-600'
                    )}>
                      {course.studyMode === 'Both' ? 'Full & Part Time' : course.studyMode}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground leading-tight">{course.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{course.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Modules</span>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <Layers size={14} className="text-primary" />
                      {courseModules.length} Fixed
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Students</span>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <Users size={14} className="text-primary" />
                      — Active
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Duration</span>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <Clock size={14} className="text-primary" />
                      {course.duration || '12 Months'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules Dropdown Preview */}
              <div className="bg-muted/30 px-8 py-6 border-t border-border mt-auto">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Module Structure</h4>
                <div className="space-y-3">
                  {courseModules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 3).map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl group/mod hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover/mod:bg-primary/10 group-hover/mod:text-primary transition-colors">
                          {module.order}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{module.title}</p>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase">{module.code}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover/mod:opacity-100 transition-all" />
                    </div>
                  ))}
                  {courseModules.length > 3 && (
                    <div className="text-center pt-2 text-xs font-semibold text-muted-foreground">
                      + {courseModules.length - 3} more modules
                    </div>
                  )}
                </div>
                {canEditCurriculum && (
                  <Link 
                    href={`/courses/${course.id}`}
                    className="block w-full mt-6 py-2.5 rounded-xl border border-dashed border-border text-center text-sm font-semibold text-muted-foreground hover:bg-card hover:text-primary hover:border-primary/50 transition-all"
                  >
                    Manage Curriculum
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? "Edit Course Information" : "Create New Course"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Course Name</label>
            <input
              required
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Higher Certificate in Infant Care"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Course Code</label>
              <input
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono uppercase"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. HCEIC"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Duration</label>
              <input
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 12 Months"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Study Mode</label>
            <select
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={formData.studyMode}
              onChange={(e) => setFormData({ ...formData, studyMode: e.target.value as any })}
            >
              <option value="Both">Full-Time & Part-Time</option>
              <option value="Full-Time">Full-Time Only</option>
              <option value="Part-Time">Part-Time Only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the course..."
            />
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              {editingCourse ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
