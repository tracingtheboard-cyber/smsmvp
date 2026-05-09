'use client';

import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit2,
  Upload,
  Download,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { mockModules } from '@/lib/mock-data';
import { Module } from '@/types';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { useRole } from '@/lib/RoleContext';

export default function GlobalModulesPage() {
  const [modules, setModules] = useState<Module[]>(mockModules);
  const [searchTerm, setSearchTerm] = useState('');
  const { canEditCurriculum } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingModule({
      id: `m${Date.now()}`,
      title: '',
      code: '',
      hours: 40,
      skillCodes: []
    });
  };

  const updateModule = (updated: Module) => {
    const exists = modules.find(m => m.id === updated.id);
    if (exists) {
      setModules(modules.map(m => m.id === updated.id ? updated : m));
    } else {
      setModules([...modules, updated]);
    }
    setEditingModule(null);
  };

  const removeModule = (mId: string) => {
    setModules(modules.filter(m => m.id !== mId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedModules = json.map((row: any, index: number) => ({
        id: `m-import-${Date.now()}-${index}`,
        title: row.Title || row.title || 'Unnamed Module',
        code: row.Code || row.code || 'UNKNOWN',
        hours: parseInt(row.Hours || row.hours || '40', 10),
        skillCodes: (row.SkillCodes || row.skillCodes || '').split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
      })).filter((m: any) => m.title && m.code);

      if (importedModules.length > 0) {
        setModules(prev => [...prev, ...importedModules]);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Title', 'Code', 'Hours', 'SkillCodes'],
      ['Introduction to Infant Care', 'IC101', '40', 'TSC-ECH-1001-1.1, TSC-ECH-1002-1.1'],
      ['Child Development', 'CD201', '60', 'TSC-ECH-2005-1.1']
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modules_Template");
    XLSX.writeFile(wb, "Module_Import_Template.xlsx");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Global Modules</h2>
          <p className="text-muted-foreground mt-1">Manage the central repository of all educational modules.</p>
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
              Create Module
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search modules by title or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Module Code</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Title</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Hours</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Skill Codes</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredModules.map((module) => (
                <tr key={module.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono px-2 py-1 bg-muted rounded-md">{module.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-foreground">{module.title}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{module.hours}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {module.skillCodes?.map(sc => (
                        <span key={sc} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-medium">
                          {sc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canEditCurriculum && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingModule(module)}
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => removeModule(module.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredModules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No modules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!editingModule}
        onClose={() => setEditingModule(null)}
        title={editingModule?.title ? "Edit Module Details" : "Create New Module"}
      >
        {editingModule && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateModule(editingModule);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Module Title</label>
              <input
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={editingModule.title}
                onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Module Code</label>
                <input
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                  value={editingModule.code}
                  onChange={(e) => setEditingModule({ ...editingModule, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Total Hours</label>
                <input
                  required
                  type="number"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={editingModule.hours}
                  onChange={(e) => setEditingModule({ ...editingModule, hours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Gov Skill Codes (Comma separated)</label>
              <input
                placeholder="e.g. TSC-ECH-1001-1.1, TSC-ECH-2005-1.1"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                value={editingModule.skillCodes?.join(', ') || ''}
                onChange={(e) => setEditingModule({ 
                  ...editingModule, 
                  skillCodes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') 
                })}
              />
              <p className="text-[10px] text-muted-foreground">Multiple codes will be saved as separate reference tags.</p>
            </div>

            <div className="pt-2 border-t border-border mt-4">
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity mt-4"
              >
                Save Module
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
