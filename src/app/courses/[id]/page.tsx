'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Layers, 
  Plus, 
  GripVertical, 
  Trash2,
  Save,
  BookOpen
} from 'lucide-react';
import { mockCourses, mockModules } from '@/lib/mock-data';
import { Module } from '@/types';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { useRole } from '@/lib/RoleContext';

export default function ManageCurriculumPage() {
  const { id } = useParams();
  const router = useRouter();
  const { canEditCurriculum } = useRole();
  
  const course = mockCourses.find(c => c.id === id);
  const [modules, setModules] = useState<Module[]>(
    mockModules.filter(m => m.courseId === id).sort((a, b) => (a.order || 0) - (b.order || 0))
  );

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  if (!course) return <div>Course not found</div>;

  const availableModules = mockModules.filter(m => !modules.some(assigned => assigned.id === m.id));

  const assignModule = (module: Module) => {
    if (!canEditCurriculum) return;
    const newAssignedModule = { ...module, courseId: course.id, order: modules.length + 1 };
    setModules([...modules, newAssignedModule]);
    setIsAssignModalOpen(false);
  };

  const removeModule = (mId: string) => {
    if (!canEditCurriculum) return;
    setModules(modules.filter(m => m.id !== mId).map((m, idx) => ({ ...m, order: idx + 1 })));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors border border-border"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                {course.code}
              </span>
              <h2 className="text-2xl font-bold text-foreground">Curriculum Management</h2>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{course.name}</p>
          </div>
        </div>
        {canEditCurriculum && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm shadow-lg shadow-primary/20"
            >
              <Plus size={16} />
              Assign Module
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm">
              <Save size={16} />
              Save Curriculum
            </button>
          </div>
        )}
      </div>

      {/* Curriculum Builder */}
      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Fixed Module Sequence</h3>
          <p className="text-xs text-muted-foreground mt-1">Students must complete these modules in the order defined below.</p>
        </div>

        <div className="divide-y divide-border">
          {modules.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
              <p className="text-muted-foreground font-medium">No modules defined for this course yet.</p>
              <button onClick={() => setIsAssignModalOpen(true)} className="text-primary font-bold mt-2 hover:underline">Click here to assign a module</button>
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={module.id} className="group flex items-center p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <GripVertical size={20} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                    <div className="md:col-span-2">
                      <p className="text-sm font-bold text-foreground">{module.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{module.code}</span>
                        {module.skillCodes && module.skillCodes.length > 0 && (
                          <div className="flex gap-1">
                            {module.skillCodes.map(sc => (
                              <span key={sc} className="text-[8px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                                {sc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md border border-border">
                        {module.hours} Hours
                      </span>
                    </div>
                  </div>
                </div>

                {canEditCurriculum && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => removeModule(module.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Course Settings Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-3xl border border-border">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            Course Overview
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <textarea 
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20"
                defaultValue={course.description}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Layers size={32} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{modules.length} Modules</p>
            <p className="text-sm text-muted-foreground">Total Course Hours: {modules.reduce((acc, m) => acc + m.hours, 0)}</p>
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Updating the curriculum will affect all active and upcoming intakes for this course.
          </p>
        </div>
      </div>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Module from Global Repository"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a module below to add it to the {course.code} curriculum.</p>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {availableModules.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">No more modules available to assign.</p>
            ) : (
              availableModules.map(m => (
                <div key={m.id} className="p-4 border border-border rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors bg-card">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{m.title}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{m.code} • {m.hours} Hours</p>
                  </div>
                  <button 
                    onClick={() => assignModule(m)}
                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs rounded-lg transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
