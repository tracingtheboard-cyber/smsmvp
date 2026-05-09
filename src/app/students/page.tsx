'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, MoreVertical, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { Student, Intake } from '@/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [intakeFilter, setIntakeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    intakeId: ''
  });

  useEffect(() => {
    async function loadData() {
      const [{ data: studentsData }, { data: intakesData }] = await Promise.all([
        supabase.from('students').select('*').order('joinDate', { ascending: false }),
        supabase.from('intakes').select('*')
      ]);
      if (studentsData) setStudents(studentsData);
      if (intakesData) {
        setIntakes(intakesData);
        if (intakesData.length > 0) {
          setFormData(prev => ({ ...prev, intakeId: intakesData[0].id }));
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName} ${s.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchIntake = !intakeFilter || s.intakeId === intakeFilter;
    return matchSearch && matchIntake;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: `s-${Date.now()}`,
      ...formData,
      status: 'enrolled',
      phase: 'admission',
      joinDate: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('students').insert([newStudent]);
    if (error) {
      alert(`Error adding student: ${error.message}`);
      return;
    }

    setStudents([newStudent, ...students]);
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', intakeId: intakes[0]?.id || '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const imported: Student[] = (json as any[]).map((row, i) => ({
        id: `s-import-${Date.now()}-${i}`,
        firstName: row.FirstName || row['First Name'] || row.firstName || '',
        lastName: row.LastName || row['Last Name'] || row.lastName || '',
        email: row.Email || row.email || '',
        intakeId: row.IntakeID || row.intakeId || intakes[0]?.id || '',
        status: 'enrolled' as const,
        phase: 'admission' as const,
        joinDate: new Date().toISOString().split('T')[0]
      })).filter(s => s.firstName && s.email);

      if (imported.length > 0) {
        const { error } = await supabase.from('students').insert(imported);
        if (error) {
          alert(`Import error: ${error.message}`);
        } else {
          setStudents(prev => [...imported, ...prev]);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['First Name', 'Last Name', 'Email', 'IntakeID'],
      ['张', '伟', 'zhang.wei@example.com', intakes[0]?.id || ''],
      ['李', '娜', 'li.na@example.com', intakes[0]?.id || '']
    ]);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Loading students from database...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Students</h2>
          <p className="text-muted-foreground mt-1">Manage student registrations and profiles.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <select
              className="pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              value={intakeFilter}
              onChange={e => setIntakeFilter(e.target.value)}
            >
              <option value="">All Intakes</option>
              {intakes.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
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
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Intake</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Joined</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => {
                const intake = intakes.find(i => i.id === student.intakeId);
                return (
                  <tr key={student.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <Link href={`/students/${student.id}`} className="hover:underline">
                          <span className="font-semibold text-foreground">{student.firstName} {student.lastName}</span>
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">{intake?.name || student.intakeId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                        student.status === 'active' ? "bg-emerald-100 text-emerald-600" :
                        student.status === 'enrolled' ? "bg-blue-100 text-blue-600" :
                        student.status === 'graduated' ? "bg-purple-100 text-purple-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(student.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <input
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Alex"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <input
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Johnson"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <input
              required
              type="email"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="alex@school.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Intake (Batch)</label>
            <select
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.intakeId}
              onChange={e => setFormData({ ...formData, intakeId: e.target.value })}
            >
              {intakes.map(intake => (
                <option key={intake.id} value={intake.id}>{intake.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
