import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  FileWarning,
  FileX,
  FileCheck2,
  CalendarClock,
  Upload,
  UserPlus,
  Bell,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/utils';
import { ReminderType } from '@/types';

const statusColors = {
  approved: '#10b981',
  submitted: '#1e3a5f',
  supplement: '#f59e0b',
  pending: '#94a3b8',
};

export default function Dashboard() {
  const {
    employees,
    templates,
    reminderLogs,
    getStatistics,
    sendBatchReminders,
    checkMaterialExpiry,
  } = useAppStore();

  const stats = getStatistics();

  const pieData = [
    { name: '已通过', value: stats.approved, color: statusColors.approved },
    { name: '审核中', value: stats.reviewing, color: statusColors.submitted },
    { name: '待补交', value: stats.rejected, color: statusColors.supplement },
    { name: '未提交', value: stats.pending, color: statusColors.pending },
  ].filter((d) => d.value > 0);

  const materialTotal = Math.max(
    1,
    stats.materialsApproved + stats.materialsPending + stats.materialsRejected + stats.materialsMissing,
  );
  const materialData = [
    { name: '已通过', count: stats.materialsApproved, fill: '#10b981' },
    { name: '待审核', count: stats.materialsPending, fill: '#1e3a5f' },
    { name: '需补正', count: stats.materialsRejected, fill: '#ef4444' },
    { name: '未提交', count: stats.materialsMissing, fill: '#94a3b8' },
  ];

  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const expiringList = checkMaterialExpiry();

  const handleUrgeAll = async () => {
    const pendingIds = employees
      .filter((e) => e.status === 'pending' || e.status === 'rejected')
      .map((e) => e.id);
    if (pendingIds.length === 0) return;
    try {
      const count = await sendBatchReminders(pendingIds, ReminderType.FOLLOW_UP);
      alert(`已生成${count}条催交通知，可复制发送给员工。`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="总入职人数"
          value={stats.total}
          gradient="from-blue"
          sub={`完成率 ${stats.completionRate}%`}
          subIcon={TrendingUp}
        />
        <StatCard
          icon={CheckCircle2}
          label="材料已通过"
          value={stats.approved}
          gradient="from-green"
          sub={`占比 ${Math.round((stats.approved / (stats.total || 1)) * 100)}%`}
          subIcon={ArrowUpRight}
        />
        <StatCard
          icon={Clock}
          label="待审核/补交"
          value={stats.reviewing + stats.rejected}
          gradient="from-amber"
          sub={`待审${stats.reviewing} · 待补${stats.rejected}`}
          subIcon={AlertTriangle}
        />
        <StatCard
          icon={FileWarning}
          label="未提交材料"
          value={stats.materialsMissing}
          gradient="from-rose"
          sub={`${stats.expiringSoon}份即将到期`}
          subIcon={CalendarClock}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">员工进度分布</h3>
              <p className="text-xs text-neutral-500 mt-0.5">各状态人数统计</p>
            </div>
            <div className="flex gap-4 text-xs flex-wrap">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-neutral-600">{item.name} {item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-8">
                  <p className="text-3xl font-bold text-neutral-800">{stats.total}</p>
                  <p className="text-xs text-neutral-500">总人数</p>
                </div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={materialData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">快捷操作</h3>
              <p className="text-xs text-neutral-500 mt-0.5">常用功能一键直达</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/employees/import"
              className="group p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-100 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Upload className="w-6 h-6 text-primary-600 mb-2" />
              <p className="text-sm font-semibold text-primary-700">导入名单</p>
              <p className="text-xs text-primary-600/70 mt-0.5">批量导入员工</p>
            </Link>
            <Link
              to="/employees"
              className="group p-4 rounded-xl bg-gradient-to-br from-success-50 to-success-100/50 border border-success-100 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-6 h-6 text-success-600 mb-2" />
              <p className="text-sm font-semibold text-success-700">员工管理</p>
              <p className="text-xs text-success-600/70 mt-0.5">查看列表</p>
            </Link>
            <Link
              to="/templates"
              className="group p-4 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-100 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <FileText className="w-6 h-6 text-warning-600 mb-2" />
              <p className="text-sm font-semibold text-warning-700">材料模板</p>
              <p className="text-xs text-warning-600/70 mt-0.5">管理材料类型</p>
            </Link>
            <button
              onClick={handleUrgeAll}
              className="group p-4 rounded-xl bg-gradient-to-br from-danger-50 to-danger-100/50 border border-danger-100 hover:shadow-lg transition-all hover:-translate-y-0.5 text-left"
            >
              <Bell className="w-6 h-6 text-danger-600 mb-2" />
              <p className="text-sm font-semibold text-danger-700">一键催交</p>
              <p className="text-xs text-danger-600/70 mt-0.5">批量发送提醒</p>
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-neutral-700">材料概览</p>
              <span className="text-xs text-neutral-400">{templates.length}种模板</span>
            </div>
            <div className="space-y-2">
              <ProgressRow
                icon={FileCheck2}
                label="已审核通过"
                count={stats.materialsApproved}
                total={materialTotal}
                color="bg-success-500"
              />
              <ProgressRow
                icon={Clock}
                label="等待审核"
                count={stats.materialsPending}
                total={materialTotal}
                color="bg-primary-500"
              />
              <ProgressRow
                icon={FileX}
                label="需要补正"
                count={stats.materialsRejected}
                total={materialTotal}
                color="bg-danger-500"
              />
              <ProgressRow
                icon={FileWarning}
                label="尚未提交"
                count={stats.materialsMissing}
                total={materialTotal}
                color="bg-neutral-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">近期入职</h3>
              <p className="text-xs text-neutral-500 mt-0.5">最近添加的员工及状态</p>
            </div>
            <Link
              to="/employees"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentEmployees.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 text-sm">暂无数据</div>
          ) : (
            <div className="space-y-1">
              {recentEmployees.map((emp) => (
                <Link
                  key={emp.id}
                  to={`/employees/${emp.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 text-sm font-medium">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-800 truncate">{emp.name}</p>
                      <StatusBadge status={emp.status} type="employee" className="!py-0.5" />
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {emp.position} · {emp.department}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-neutral-400">入职</p>
                    <p className="text-xs font-medium text-neutral-600">
                      {formatDate(emp.expectedDate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">证件到期提醒</h3>
              <p className="text-xs text-neutral-500 mt-0.5">即将到期或已过期的材料</p>
            </div>
            <Link
              to="/reminders"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              提醒中心 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {expiringList.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarClock className="w-12 h-12 text-success-500/60 mx-auto mb-2" />
              <p className="text-sm text-success-600 font-medium">所有材料有效</p>
              <p className="text-xs text-neutral-400 mt-0.5">暂无到期材料</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {expiringList.slice(0, 8).map((item, idx) => (
                <Link
                  key={idx}
                  to={`/employees/${item.employee.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all hover:shadow-sm ${
                    item.daysLeft < 0
                      ? 'bg-danger-50 border-danger-100'
                      : 'bg-warning-50 border-warning-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.daysLeft < 0
                        ? 'bg-danger-500/10 text-danger-600'
                        : 'bg-warning-500/10 text-warning-600'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {item.employee.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {templates.find((t) => t.id === item.material.templateId)?.name || '材料'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-xs font-semibold ${
                        item.daysLeft < 0 ? 'text-danger-600' : 'text-warning-600'
                      }`}
                    >
                      {item.daysLeft < 0
                        ? `已过期${Math.abs(item.daysLeft)}天`
                        : `剩${item.daysLeft}天`}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {item.material.expiryDate ? formatDate(item.material.expiryDate) : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>已发送提醒</span>
              <span className="font-medium text-neutral-700">{reminderLogs.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  gradient: 'from-blue' | 'from-green' | 'from-amber' | 'from-rose';
  sub: string;
  subIcon: any;
}

function StatCard({ icon: Icon, label, value, gradient, sub, subIcon: SubIcon }: StatCardProps) {
  const gradientMap = {
    'from-blue': 'from-primary-500 to-primary-700',
    'from-green': 'from-success-400 to-success-600',
    'from-amber': 'from-warning-400 to-warning-600',
    'from-rose': 'from-danger-400 to-danger-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-neutral-200 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-2 tabular-nums">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientMap[gradient]} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-5.5 h-5.5 text-white" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs text-neutral-500">{sub}</span>
        <SubIcon className="w-3.5 h-3.5 text-neutral-400" />
      </div>
    </div>
  );
}

function ProgressRow({ icon: Icon, label, count, total, color }: any) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 text-neutral-400" />
      <span className="text-xs text-neutral-600 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-neutral-700 w-10 text-right tabular-nums">
        {count}
      </span>
    </div>
  );
}
