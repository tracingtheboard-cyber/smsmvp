'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  Bell, 
  Palette, 
  Save,
  Globe,
  Building2,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { currentRole } = useRole();
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'notifications' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState({
    schoolName: 'SMS Pro Academy',
    registrationNumber: 'REG-2025-0991X',
    address: '123 Education Boulevard, Singapore 123456',
    email: 'admin@smspro.edu.sg',
    phone: '+65 6123 4567',
    invoiceReminders: true,
    attendanceWarnings: true,
    gradePublishing: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'global').single();
      if (data && !error) {
        setSettings({
          schoolName: data.schoolName,
          registrationNumber: data.registrationNumber,
          address: data.address,
          email: data.email,
          phone: data.phone,
          invoiceReminders: data.invoiceReminders,
          attendanceWarnings: data.attendanceWarnings,
          gradePublishing: data.gradePublishing,
        });
      }
      setIsLoading(false);
    };
    if (currentRole === 'systemadmin') {
      fetchSettings();
    }
  }, [currentRole]);

  if (currentRole !== 'systemadmin') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
          <Shield size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2 max-w-md">You do not have permission to view the system settings. Please contact your System Administrator.</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .update({
        schoolName: settings.schoolName,
        registrationNumber: settings.registrationNumber,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        invoiceReminders: settings.invoiceReminders,
        attendanceWarnings: settings.attendanceWarnings,
        gradePublishing: settings.gradePublishing,
        updatedAt: new Date().toISOString()
      })
      .eq('id', 'global');
    
    setIsSaving(false);
    if (error) {
      alert(`Failed to save settings: ${error.message}`);
    } else {
      alert('Settings saved to Supabase successfully!');
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading configurations...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your school's global configurations and integrations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
        >
          <Save size={18} className={cn(isSaving && "animate-spin")} />
          {isSaving ? 'Saving to Cloud...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation Sidebar */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'general' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Building2 size={18} />
            General Profile
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'database' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Database size={18} />
            Database & API
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'notifications' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'security' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield size={18} />
            Security & Roles
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            
            {activeTab === 'general' && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-bold text-foreground">School Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">This information will be displayed on invoices and official documents.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Institution Name</label>
                    <input type="text" value={settings.schoolName} onChange={(e) => setSettings({...settings, schoolName: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Registration Number</label>
                    <input type="text" value={settings.registrationNumber} onChange={(e) => setSettings({...settings, registrationNumber: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-foreground">Official Address</label>
                    <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Contact Email</label>
                    <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Contact Phone</label>
                    <input type="text" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Database Connections</h3>
                    <p className="text-sm text-muted-foreground mt-1">Manage your Supabase connection strings and environment keys.</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      Supabase Project URL
                      <span className="text-xs text-muted-foreground font-normal">Stored in .env.local</span>
                    </label>
                    <input type="text" value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxqaguppgwwrzywqgfbu.supabase.co'} disabled className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Supabase Anon Key</label>
                    <input type="password" value="********************************************************" disabled className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <Shield className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Security Warning</p>
                      <p className="text-xs text-amber-700 mt-1">Database API keys are injected at build time. To change these credentials, update your local `.env.local` file and restart the development server.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Automated Notifications</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure email templates and automatic triggers for students.</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-foreground">Invoice Reminders</p>
                      <p className="text-xs text-muted-foreground mt-1">Automatically send an email 3 days before payment is due.</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" checked={settings.invoiceReminders} onChange={(e) => setSettings({...settings, invoiceReminders: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-primary translate-x-5 transition-transform" />
                      <div className="toggle-label block overflow-hidden h-5 rounded-full bg-primary opacity-50 cursor-pointer"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-foreground">Attendance Warnings</p>
                      <p className="text-xs text-muted-foreground mt-1">Send alert to registrar when a student's attendance drops below 80%.</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" checked={settings.attendanceWarnings} onChange={(e) => setSettings({...settings, attendanceWarnings: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-primary translate-x-5 transition-transform" />
                      <div className="toggle-label block overflow-hidden h-5 rounded-full bg-primary opacity-50 cursor-pointer"></div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-foreground">Grade Publishing</p>
                      <p className="text-xs text-muted-foreground mt-1">Notify students instantly when a new module grade is recorded.</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" checked={settings.gradePublishing} onChange={(e) => setSettings({...settings, gradePublishing: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-muted" />
                      <div className="toggle-label block overflow-hidden h-5 rounded-full bg-muted cursor-pointer"></div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Role Management</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure Row Level Security (RLS) policies and Role-Based Access Control.</p>
                </div>

                <div className="bg-muted p-4 rounded-xl border border-border text-sm">
                  <p className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield size={16} className="text-primary"/> 
                    Current Setup
                  </p>
                  <p className="text-muted-foreground mb-4">RLS is currently managed in the Supabase backend. The frontend UI simulates role switching for demonstration purposes via the Sidebar.</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="font-semibold">System Admin</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Full Access</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="font-semibold">Registrar</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Grades & Attendance</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold">Admission Staff</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Intakes & Enrollment</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
