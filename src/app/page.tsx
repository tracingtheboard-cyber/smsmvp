import { 
  Users, 
  BookOpen, 
  CalendarRange, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { 
    name: 'Total Students', 
    value: '2,840', 
    change: '+12.5%', 
    trend: 'up', 
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  { 
    name: 'Active Courses', 
    value: '42', 
    change: '+3.2%', 
    trend: 'up', 
    icon: BookOpen,
    color: 'text-purple-600',
    bg: 'bg-purple-100'
  },
  { 
    name: 'Current Intakes', 
    value: '12', 
    change: '0%', 
    trend: 'neutral', 
    icon: CalendarRange,
    color: 'text-orange-600',
    bg: 'bg-orange-100'
  },
  { 
    name: 'Attendance Rate', 
    value: '94.2%', 
    change: '-1.2%', 
    trend: 'down', 
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100'
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <div className={cn(
                  "flex items-center text-sm font-medium px-2 py-1 rounded-full",
                  stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" : 
                  stat.trend === 'down' ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                )}>
                  {stat.change}
                  {stat.trend === 'up' ? <ArrowUpRight size={14} className="ml-1" /> : 
                   stat.trend === 'down' ? <ArrowDownRight size={14} className="ml-1" /> : null}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lifecycle Funnel */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-foreground">Student Lifecycle Distribution</h3>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">Total Flow: 2.8k</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {[
              { label: 'Admission', count: 420, color: 'bg-blue-500', width: '25%' },
              { label: 'Academic', count: 1850, color: 'bg-indigo-500', width: '55%' },
              { label: 'Graduation', count: 320, color: 'bg-purple-500', width: '15%' },
              { label: 'Alumni', count: 250, color: 'bg-emerald-500', width: '10%' },
            ].map((phase, i) => (
              <div key={phase.label} className="flex-1 flex flex-col gap-2 min-w-[120px]">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{phase.label}</span>
                  <span className="text-sm font-bold text-foreground">{phase.count}</span>
                </div>
                <div className="relative h-12 rounded-xl overflow-hidden bg-muted group">
                  <div 
                    className={cn("absolute inset-y-0 left-0 transition-all duration-1000 ease-out flex items-center justify-end pr-3 text-white text-[10px] font-bold shadow-lg", phase.color)}
                    style={{ width: phase.width }}
                  >
                    {phase.width}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Students Table (Simplified) */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recently Enrolled Students</h3>
            <button className="text-sm text-primary font-medium hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Student</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Course</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Intake</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Alex Johnson', course: 'Computer Science', intake: 'Sept 2024', status: 'Enrolled' },
                  { name: 'Maria Garcia', course: 'Business Admin', intake: 'Sept 2024', status: 'Enrolled' },
                  { name: 'David Smith', course: 'Graphic Design', intake: 'Jan 2025', status: 'Pending' },
                  { name: 'Sarah Wilson', course: 'Psychology', intake: 'Sept 2024', status: 'Enrolled' },
                ].map((student, i) => (
                  <tr key={i} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{student.name}</span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{student.course}</td>
                    <td className="py-4 text-sm text-muted-foreground">{student.intake}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                        student.status === 'Enrolled' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Users size={18} />
              Register New Student
            </button>
            <button className="w-full py-3 px-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <BookOpen size={18} />
              Add New Course
            </button>
            <button className="w-full py-3 px-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <CalendarRange size={18} />
              Schedule Intake
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Intake Status</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Sept 2024</span>
                  <span className="text-muted-foreground">85% Full</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Jan 2025</span>
                  <span className="text-muted-foreground">30% Full</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
