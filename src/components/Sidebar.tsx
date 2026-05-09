'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarRange, 
  Users, 
  Settings,
  GraduationCap,
  ChevronRight,
  CreditCard,
  Clock,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole, Role } from '@/lib/RoleContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['systemadmin', 'admissionstaff', 'registrar'] },
  { name: 'Admissions', href: '/admissions', icon: Users, roles: ['systemadmin', 'admissionstaff'] },
  { name: 'Courses', href: '/courses', icon: BookOpen, roles: ['systemadmin', 'registrar', 'admissionstaff'] },
  { name: 'Modules', href: '/modules', icon: Layers, roles: ['systemadmin', 'registrar', 'admissionstaff'] },
  { name: 'Intakes', href: '/intakes', icon: CalendarRange, roles: ['systemadmin', 'registrar', 'admissionstaff'] },
  { name: 'Students', href: '/students', icon: GraduationCap, roles: ['systemadmin', 'registrar'] },
  { name: 'Grades', href: '/grades', icon: BookOpen, roles: ['systemadmin', 'registrar'] },
  { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['systemadmin', 'registrar'] },
  { name: 'Finance', href: '/finance', icon: CreditCard, roles: ['systemadmin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['systemadmin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentRole, setCurrentRole } = useRole();

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  const roleDetails = {
    systemadmin: { label: 'System Admin', initials: 'SA', color: 'from-purple-500 to-indigo-500' },
    admissionstaff: { label: 'Admission Staff', initials: 'AD', color: 'from-emerald-500 to-teal-500' },
    registrar: { label: 'Registrar Office', initials: 'RO', color: 'from-blue-500 to-cyan-500' },
  };

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <GraduationCap size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">SMS <span className="text-primary">Pro</span></h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "group-hover:text-foreground"
                )} />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight size={16} className="text-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <div className="bg-muted/30 rounded-xl p-3 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center text-white text-xs font-bold", roleDetails[currentRole].color)}>
              {roleDetails[currentRole].initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate text-foreground">{roleDetails[currentRole].label}</span>
              <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">Active Role</span>
            </div>
          </div>
          
          <select 
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="w-full bg-background border border-border text-xs rounded-lg px-2 py-1.5 text-muted-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="systemadmin">Switch to Admin</option>
            <option value="admissionstaff">Switch to Admissions</option>
            <option value="registrar">Switch to Registrar</option>
          </select>
        </div>
      </div>
    </div>
  );
}
