'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, XCircle, Clock, UserCheck, GraduationCap, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Application, Student, Course, Intake } from '@/types';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    courseId: '',
    intakeId: ''
  });

  useEffect(() => {
    async function loadData() {
      const [
        { data: appsData },
        { data: coursesData },
        { data: intakesData }
      ] = await Promise.all([
        supabase.from('applications').select('*').order('dateApplied', { ascending: false }),
        supabase.from('courses').select('*'),
        supabase.from('intakes').select('*')
      ]);

      if (appsData) setApplications(appsData);
      if (coursesData) {
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setFormData(prev => ({ ...prev, courseId: coursesData[0].id }));
        }
      }
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

  const filteredApplications = applications.filter(app => {
    const matchSearch = `${app.firstName} ${app.lastName} ${app.email}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'enrolled':  return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'approved':  return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'rejected':  return 'text-red-500 bg-red-50 border-red-200';
      case 'reviewing': return 'text-blue-500 bg-blue-50 border-blue-200';
      default:          return 'text-amber-500 bg-amber-50 border-amber-200';
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'enrolled':  return <GraduationCap size={14} />;
      case 'approved':  return <CheckCircle2 size={14} />;
      case 'rejected':  return <XCircle size={14} />;
      case 'reviewing': return <UserCheck size={14} />;
      default:          return <Clock size={14} />;
    }
  };

  const updateStatus = async (id: string, newStatus: Application['status']) => {
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert(`Error updating status: ${error.message}`);
      return;
    }
    setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleConvertToStudent = async (app: Application) => {
    const newStudent: Student = {
      id: `s-${Date.now()}`,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      intakeId: app.intakeId,
      status: 'active',
      phase: 'academic',
      joinDate: new Date().toISOString().split('T')[0]
    };

    const { error: studentErr } = await supabase.from('students').insert([newStudent]);
    if (studentErr) {
      alert(`Error creating student: ${studentErr.message}`);
      return;
    }

    await updateStatus(app.id, 'enrolled');
  };

  const handleNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: Application = {
      id: `app-${Date.now()}`,
      ...formData,
      status: 'pending',
      dateApplied: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('applications').insert([newApp]);
    if (error) {
      alert(`Error submitting application: ${error.message}`);
      return;
    }

    setApplications([newApp, ...applications]);
    setIsModalOpen(false);
    setFormData({
      firstName: '', lastName: '', email: '', phone: '',
      courseId: courses[0]?.id || '',
      intakeId: intakes[0]?.id || ''
    });
  };

  const availableIntakes = intakes.filter(i => i.courseId === formData.courseId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Loading admissions data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Admissions Pipeline</h1>
          <p className="text-muted-foreground mt-1">Review and process new student applications.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Application
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-muted/20 items-center justify-between">
          <div className="flex bg-muted p-1 rounded-xl flex-wrap gap-1">
            {['all', 'pending', 'reviewing', 'approved', 'enrolled', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all",
                  statusFilter === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex gap-4 flex-1 max-w-md ml-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-wider">Applied Program</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-wider">Date Applied</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApplications.map(app => {
                const course = courses.find(c => c.id === app.courseId);
                const intake = intakes.find(i => i.id === app.intakeId);
                return (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-foreground">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                      <p className="text-xs text-muted-foreground">{app.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground">{course?.name || app.courseId}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{intake?.name || app.intakeId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-medium">
                        {new Date(app.dateApplied).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        getStatusColor(app.status)
                      )}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {app.status === 'approved' && (
                          <button
                            onClick={() => handleConvertToStudent(app)}
                            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            title="Convert to Enrollment"
                          >
                            <UserCheck size={14} />
                            Enroll to Intake
                          </button>
                        )}
                        {app.status !== 'approved' && app.status !== 'enrolled' && (
                          <button
                            onClick={() => updateStatus(app.id, 'approved')}
                            className="p-1.5 hover:bg-emerald-50 text-muted-foreground hover:text-emerald-500 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        {app.status !== 'rejected' && app.status !== 'enrolled' && (
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Application">
        <form onSubmit={handleNewApplication} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">First Name</label>
                <input
                  required type="text"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Last Name</label>
                <input
                  required type="text"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email</label>
                <input
                  required type="email"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone</label>
                <input
                  required type="tel"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+65 9123 4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Program / Course</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.courseId}
                onChange={e => {
                  const courseId = e.target.value;
                  const firstIntake = intakes.find(i => i.courseId === courseId);
                  setFormData({ ...formData, courseId, intakeId: firstIntake?.id || '' });
                }}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Intake Batch</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.intakeId}
                onChange={e => setFormData({ ...formData, intakeId: e.target.value })}
              >
                {availableIntakes.length === 0 && (
                  <option disabled value="">No intakes available for this course</option>
                )}
                {availableIntakes.map(i => (
                  <option key={i.id} value={i.id}>{i.name} [{i.type === 'F' ? 'Full-Time' : 'Part-Time'}]</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
