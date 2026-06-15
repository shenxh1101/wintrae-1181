import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Bell,
  FileDown,
  Settings,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/employees', label: '员工管理', icon: Users },
  { to: '/employees/import', label: '名单导入', icon: FileSpreadsheet },
  { to: '/templates', label: '材料模板', icon: FolderKanban },
  { to: '/reminders', label: '提醒中心', icon: Bell },
  { to: '/export', label: '数据导出', icon: FileDown },
  { to: '/settings', label: '系统设置', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const getStatistics = useAppStore(s => s.getStatistics);
  const employeeCount = useAppStore(s => s.employees.length);
  const materialRecordCount = useAppStore(s => s.materialRecords.length);
  const stats = useMemo(() => getStatistics(), [getStatistics, employeeCount, materialRecordCount]);

  if (location.pathname.startsWith('/submit/')) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-800 leading-tight">入职材料通</h1>
              <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-warning-500" />
                智能材料追踪系统
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
                )
              }
            >
              <Icon className={cn('w-4.5 h-4.5 transition-transform duration-200', 'group-hover:scale-105')} />
              <span className="flex-1">{label}</span>
              <ChevronRight className={cn(
                'w-3.5 h-3.5 transition-all duration-200 opacity-0 -translate-x-1',
                'group-hover:opacity-40 group-hover:translate-x-0'
              )} />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-success-50 p-2.5">
              <p className="text-lg font-bold text-success-600">{stats.approvedCount}</p>
              <p className="text-[11px] text-success-700/80">已通过</p>
            </div>
            <div className="rounded-lg bg-danger-50 p-2.5">
              <p className="text-lg font-bold text-danger-600">{stats.pendingCount}</p>
              <p className="text-[11px] text-danger-700/80">待提交</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">整体完成率</span>
            <span className="font-semibold text-primary-600">{stats.completionRate}%</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">
              {navItems.find(n => (n.end && location.pathname === n.to) || (!n.end && location.pathname.startsWith(n.to)))?.label || '欢迎使用'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 text-xs text-neutral-600">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" />
              数据已同步
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium shadow-md shadow-primary-500/20">
              HR
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
