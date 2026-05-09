'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, FileDown, BookOpen, Users, ChevronRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { Grade, Course, Module, Intake, Student } from '@/types';
import { supabase } from '@/lib/supabase';

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const [
        { data: coursesData },
        { data: modulesData },
        { data: intakesData },
        { data: studentsData },
        { data: gradesData }
      ] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('modules').select('*'),
        supabase.from('intakes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('grades').select('*')
      ]);

      if (coursesData) setCourses(coursesData);
      if (modulesData) setModules(modulesData);
      if (intakesData) setIntakes(intakesData);
      if (studentsData) setStudents(studentsData);
      if (gradesData) setGrades(gradesData);

      if (coursesData && coursesData.length > 0) {
        const firstCourse = coursesData[0];
        setSelectedCourseId(firstCourse.id);
        const firstMod = modulesData?.find(m => m.courseId === firstCourse.id);
        if (firstMod) setSelectedModuleId(firstMod.id);
        const firstIntake = intakesData?.find(i => i.courseId === firstCourse.id);
        if (firstIntake) setSelectedIntakeId(firstIntake.id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const courseModules = modules.filter(m => m.courseId === selectedCourseId);
  const currentModule = modules.find(m => m.id === selectedModuleId);
  const courseIntakes = intakes.filter(i => i.courseId === selectedCourseId);
  
  const intakeStudents = students.filter(s => s.intakeId === selectedIntakeId);

  const exportToExcel = () => {
    if (!currentModule || !selectedIntakeId) return;
    
    const data = intakeStudents.map(student => {
      const existingGrade = grades.find(g => g.studentId === student.id && g.moduleId === selectedModuleId);
      return {
        'Student ID': student.id,
        'Name': `${student.firstName} ${student.lastName}`,
        'Module ID': currentModule.id,
        'Module Name': currentModule.title,
        'Score (0-100)': existingGrade ? existingGrade.score : '',
        'Grade (A/B/C/F)': existingGrade ? existingGrade.grade : '',
        'Feedback': existingGrade?.feedback || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Style adjustments (optional, but good for UX)
    const wscols = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 35}, {wch: 15}, {wch: 20}, {wch: 30}];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marking List");
    const fileName = `MarkingList_${currentModule.code || currentModule.id}_${selectedIntakeId}.xlsx`;
    
    // Write File
    XLSX.writeFile(wb, fileName);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const updatedGrades = [...grades];
      let updatedCount = 0;
      
      data.forEach((row: any) => {
        const studentId = row['Student ID'];
        const moduleId = row['Module ID'];
        const rawScore = row['Score (0-100)'];
        const score = rawScore !== '' && rawScore !== undefined ? Number(rawScore) : null;
        const gradeLetter = row['Grade (A/B/C/F)'];
        const feedback = row['Feedback'];
        
        if (!studentId || !moduleId || score === null) return;

        const existingIdx = updatedGrades.findIndex(g => g.studentId === studentId && g.moduleId === moduleId);
        
        const newGrade: Grade = {
          id: existingIdx >= 0 ? updatedGrades[existingIdx].id : `g${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
          studentId,
          moduleId,
          score: isNaN(score) ? 0 : score,
          grade: gradeLetter || (score >= 50 ? 'Pass' : 'Fail'),
          status: score >= 50 ? 'passed' : 'failed',
          attempt: existingIdx >= 0 ? updatedGrades[existingIdx].attempt : 1,
          date: new Date().toISOString().split('T')[0],
          feedback: feedback || ''
        };

        if (existingIdx >= 0) {
          updatedGrades[existingIdx] = newGrade;
        } else {
          updatedGrades.push(newGrade);
        }
        updatedCount++;
      });
      
      setGrades(updatedGrades);
      alert(`Successfully imported/updated grades for ${updatedCount} students!`);
      
      // Clear file input
      if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const updateStudentGrade = (studentId: string, field: keyof Grade, value: any) => {
    setGrades(prev => {
      const existingIdx = prev.findIndex(g => g.studentId === studentId && g.moduleId === selectedModuleId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], [field]: value };
        // Auto update status if score changes
        if (field === 'score') {
          updated[existingIdx].status = Number(value) >= 50 ? 'passed' : 'failed';
        }
        return updated;
      } else {
        // Create new
        const newGrade: Grade = {
          id: `g${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
          studentId,
          moduleId: selectedModuleId!,
          score: field === 'score' ? Number(value) : 0,
          grade: field === 'grade' ? value : '',
          status: field === 'score' ? (Number(value) >= 50 ? 'passed' : 'failed') : 'pending',
          attempt: 1,
          date: new Date().toISOString().split('T')[0],
          feedback: field === 'feedback' ? value : ''
        };
        return [...prev, newGrade];
      }
    });
  };

  const handleSaveGrades = async () => {
    // Save grades for the current selectedModuleId
    const currentModuleGrades = grades.filter(g => g.moduleId === selectedModuleId);
    if (currentModuleGrades.length === 0) return;

    const { error } = await supabase.from('grades').upsert(currentModuleGrades);
    if (error) {
      alert(`Error saving grades: ${error.message}`);
    } else {
      alert('Grades successfully saved to database!');
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading grades data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Grades Management</h2>
          <p className="text-muted-foreground mt-1">Select a course and module to manage student results.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            id="excel-upload" 
            className="hidden" 
            accept=".xlsx, .xls"
            onChange={handleImport}
          />
          <button 
            onClick={() => document.getElementById('excel-upload')?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
          >
            <Upload size={18} />
            Import Excel
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
          >
            <FileDown size={18} />
            Export Template
          </button>
          <button 
            onClick={handleSaveGrades}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">1. Select Course</label>
              <select 
                value={selectedCourseId}
                onChange={(e) => {
                  const cId = e.target.value;
                  setSelectedCourseId(cId);
                  const firstMod = modules.find(m => m.courseId === cId);
                  setSelectedModuleId(firstMod?.id || '');
                  const firstIntake = intakes.find(i => i.courseId === cId);
                  setSelectedIntakeId(firstIntake?.id || '');
                }}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">2. Select Intake</label>
              <select 
                value={selectedIntakeId}
                onChange={(e) => setSelectedIntakeId(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              >
                {courseIntakes.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">3. Select Module</label>
              <div className="space-y-2">
                {courseModules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModuleId(m.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group",
                      selectedModuleId === m.id 
                        ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{m.title}</span>
                    <ChevronRight size={14} className={cn(
                      "transition-transform",
                      selectedModuleId === m.id ? "translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5">
            <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <Users size={16} />
              Module Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Students in Batch</span>
                <span className="font-bold text-foreground">{intakeStudents.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Grades Entered</span>
                <span className="font-bold text-foreground">
                  {grades.filter(g => g.moduleId === selectedModuleId).length} / {intakeStudents.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Entry Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{currentModule?.title}</h3>
                  <p className="text-xs text-muted-foreground">Module Code: {currentModule?.code}</p>
                </div>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter students..." 
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Score (0-100)</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Grade</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Feedback / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {intakeStudents.map((student) => {
                    const grade = grades.find(g => g.studentId === student.id && g.moduleId === selectedModuleId);
                    return (
                      <tr key={student.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{student.firstName} {student.lastName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">{student.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            value={grade?.score || ''}
                            onChange={(e) => updateStudentGrade(student.id, 'score', e.target.value)}
                            className="w-16 px-2 py-1 bg-muted border border-border rounded text-center font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="--"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-block w-8 py-1 rounded text-[10px] font-bold text-center",
                            grade?.grade === 'A' ? "bg-emerald-100 text-emerald-600" : 
                            grade?.grade === 'B' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {grade?.grade || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                            grade?.status === 'passed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                            grade?.status === 'failed' ? "bg-red-50 text-red-600 border border-red-100" : "bg-muted text-muted-foreground"
                          )}>
                            {grade?.status || 'Not Evaluated'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            value={grade?.feedback || ''}
                            onChange={(e) => updateStudentGrade(student.id, 'feedback', e.target.value)}
                            placeholder="Add internal note..." 
                            className="w-full bg-transparent text-sm text-muted-foreground italic outline-none border-b border-transparent focus:border-border transition-colors"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
