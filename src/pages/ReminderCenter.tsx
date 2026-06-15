import { useState, useMemo } from 'react';
import {
  Send,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Mail,
  MessageSquare,
  QrCode,
  Filter,
  Search,
  ChevronDown,
  User,
  FileText,
  Calendar,
  Bell,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { EmployeeStatus, MaterialStatus, ReminderType } from '@/types';
import { copyToClipboard, formatDate, maskPhone, generateSubmitLink } from '@/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { QRCodeSVG } from 'qrcode.react';

export default function ReminderCenter() {
  const {
    employees,
    templates,
    reminderLogs,
    sendBatchReminders,
    sendReminder,
    getEmployeeMissingMaterials,
    getEmployeeRejectedMaterials,
  } = useAppStore();
  const { success, error, info } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'board' | 'logs'>('board');
  const [previewEmployee, setPreviewEmployee] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrEmployeeId, setQrEmployeeId] = useState<string | null>(null);

  const statusGroups = useMemo(() => {
    const groups: Record<EmployeeStatus, typeof employees> = {
      [EmployeeStatus.PENDING]: [],
      [EmployeeStatus.SUBMITTED]: [],
      [EmployeeStatus.REVIEWING]: [],
      [EmployeeStatus.REJECTED]: [],
      [EmployeeStatus.APPROVED]: [],
    };

    const filtered = employees.filter((emp) => {
      const matchSearch =
        emp.name.includes(searchTerm) ||
        emp.phone.includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
      return matchSearch && matchStatus;
    });

    filtered.forEach((emp) => {
      groups[emp.status].push(emp);
    });

    return groups;
  }, [employees, searchTerm, statusFilter]);

  const boardColumns = [
    {
      key: EmployeeStatus.PENDING,
      title: '未提交',
      icon: Clock,
      color: 'bg-neutral-50 border-neutral-200',
      headerColor: 'bg-neutral-500',
      badgeColor: 'neutral',
      reminderType: ReminderType.FIRST,
      emptyText: '暂无未提交人员',
    },
    {
      key: EmployeeStatus.REJECTED,
      title: '待补交',
      icon: AlertTriangle,
      color: 'bg-warning-50 border-warning-200',
      headerColor: 'bg-warning-500',
      badgeColor: 'warning',
      reminderType: ReminderType.SUPPLEMENT,
      emptyText: '暂无待补交人员',
    },
    {
      key: EmployeeStatus.APPROVED,
      title: '已通过',
      icon: CheckCircle,
      color: 'bg-success-50 border-success-200',
      headerColor: 'bg-success-500',
      badgeColor: 'success',
      reminderType: ReminderType.APPROVED,
      emptyText: '暂无已通过人员',
    },
  ];

  const handleSendBatch = async (status: EmployeeStatus, type: ReminderType) => {
    try {
      const targetEmployees = statusGroups[status];
      if (targetEmployees.length === 0) {
        info('当前分组暂无人员');
        return;
      }
      const count = await sendBatchReminders(
        targetEmployees.map((e) => e.id),
        type,
      );
      success(`已成功发送 ${count} 条${STATUS_LABELS[status]}催交通知`);
    } catch (e) {
      error('批量发送失败，请重试');
    }
  };

  const handleSendSingle = async (empId: string, type: ReminderType) => {
    try {
      await sendReminder(empId, type);
      success('提醒已发送');
    } catch (e) {
      error('发送失败');
    }
  };

  const handleCopyMessage = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const missing = getEmployeeMissingMaterials(empId);
    const rejected = getEmployeeRejectedMaterials(empId);
    const submitLink = generateSubmitLink(emp.submitToken);

    let message = `【入职材料提醒】${emp.name}您好，`;

    if (rejected.length > 0) {
      message += `您以下材料未通过审核，请修改后重新提交：${rejected
        .map((r) => r.templateName)
        .join('、')}。`;
    }
    if (missing.length > 0) {
      message += `还需提交以下材料：${missing.map((m) => m.name).join('、')}。`;
    }
    message += `请点击链接提交：${submitLink}`;

    copyToClipboard(message).then(() => {
      success('提醒文案已复制到剪贴板');
    });
  };

  const handleShowQR = (empId: string) => {
    setQrEmployeeId(empId);
    setQrModalOpen(true);
  };

  const qrEmployee = qrEmployeeId ? employees.find((e) => e.id === qrEmployeeId) : null;

  const recentLogs = useMemo(() => {
    return [...reminderLogs].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()).slice(0, 50);
  }, [reminderLogs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">提醒中心</h1>
          <p className="text-sm text-neutral-500 mt-1">批量催交、个人提醒、文案复制、提交入口管理</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索姓名/手机号/邮箱"
              className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'board'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
            }`}
            onClick={() => setActiveTab('board')}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              看板视图
            </div>
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'logs'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              提醒日志
              {reminderLogs.length > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  {reminderLogs.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {activeTab === 'board' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {boardColumns.map((col) => {
                const ColumnIcon = col.icon;
                const groupEmployees = statusGroups[col.key];
                return (
                  <div
                    key={col.key}
                    className={`rounded-xl border-2 ${col.color} overflow-hidden transition-all hover:shadow-lg`}
                  >
                    <div className={`${col.headerColor} text-white px-5 py-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ColumnIcon className="w-5 h-5" />
                          <span className="font-semibold">{col.title}</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                            {groupEmployees.length}
                          </span>
                        </div>
                        {col.key !== EmployeeStatus.APPROVED && groupEmployees.length > 0 && (
                          <button
                            onClick={() => handleSendBatch(col.key, col.reminderType)}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            批量催交
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {groupEmployees.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400">
                          <ColumnIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">{col.emptyText}</p>
                        </div>
                      ) : (
                        groupEmployees.map((emp) => {
                          const missing = getEmployeeMissingMaterials(emp.id);
                          const rejected = getEmployeeRejectedMaterials(emp.id);
                          return (
                            <div
                              key={emp.id}
                              className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-md hover:border-primary-300 transition-all group cursor-pointer"
                              onClick={() => setPreviewEmployee(emp.id)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-primary-900">{emp.name}</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                      {emp.department} · {emp.position}
                                    </p>
                                  </div>
                                </div>
                                <StatusBadge status={emp.status} size="sm" />
                              </div>

                              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {maskPhone(emp.phone)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(emp.expectedDate)}
                                </span>
                              </div>

                              {(missing.length > 0 || rejected.length > 0) && (
                                <div className="bg-neutral-50 rounded-lg p-2.5 mb-3 space-y-1.5">
                                  {missing.length > 0 && (
                                    <div className="flex items-start gap-2 text-xs">
                                      <FileText className="w-3 h-3 text-danger-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-neutral-600">
                                        缺失 <b className="text-danger-600">{missing.length}</b> 项：
                                        {missing.map((m) => m.name).join('、')}
                                      </span>
                                    </div>
                                  )}
                                  {rejected.length > 0 && (
                                    <div className="flex items-start gap-2 text-xs">
                                      <AlertTriangle className="w-3 h-3 text-warning-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-neutral-600">
                                        驳回 <b className="text-warning-600">{rejected.length}</b> 项：
                                        {rejected.map((r) => r.templateName).join('、')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div
                                className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleSendSingle(emp.id, col.reminderType)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-medium transition-all"
                                  title="发送提醒"
                                >
                                  <Send className="w-3 h-3" />
                                  发送
                                </button>
                                <button
                                  onClick={() => handleCopyMessage(emp.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-all"
                                  title="复制文案"
                                >
                                  <Copy className="w-3 h-3" />
                                  复制
                                </button>
                                <button
                                  onClick={() => handleShowQR(emp.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-success-50 hover:bg-success-100 text-success-700 rounded-lg text-xs font-medium transition-all"
                                  title="提交二维码"
                                >
                                  <QrCode className="w-3 h-3" />
                                  二维码
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            {recentLogs.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">暂无提醒记录</p>
                <p className="text-sm">发送催交通知后，记录将显示在这里</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        发送时间
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        接收人
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        提醒类型
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        发送渠道
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {recentLogs.map((log) => {
                      const emp = employees.find((e) => e.id === log.employeeId);
                      return (
                        <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-4 px-4 text-sm text-neutral-600">
                            {formatDate(log.sentAt, 'YYYY-MM-DD HH:mm')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                                {emp?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900">{emp?.name || '未知'}</p>
                                <p className="text-xs text-neutral-500">{maskPhone(emp?.phone || '')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                                log.type === ReminderType.FIRST
                                  ? 'bg-neutral-100 text-neutral-700'
                                  : log.type === ReminderType.FOLLOW_UP
                                  ? 'bg-primary-100 text-primary-700'
                                  : log.type === ReminderType.SUPPLEMENT
                                  ? 'bg-warning-100 text-warning-700'
                                  : log.type === ReminderType.EXPIRING
                                  ? 'bg-danger-100 text-danger-700'
                                  : 'bg-success-100 text-success-700'
                              }`}
                            >
                              {log.type === ReminderType.FIRST
                                ? '首次提醒'
                                : log.type === ReminderType.FOLLOW_UP
                                ? '二次催交'
                                : log.type === ReminderType.SUPPLEMENT
                                ? '补交提醒'
                                : log.type === ReminderType.EXPIRING
                                ? '到期提醒'
                                : '审核通过'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-neutral-400" />
                              <MessageSquare className="w-4 h-4 text-neutral-400" />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1 text-xs text-success-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                已送达
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-danger-600">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                发送失败
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => {
                                if (emp) handleCopyMessage(emp.id);
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              复制文案
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!previewEmployee}
        onClose={() => setPreviewEmployee(null)}
        title="员工详情预览"
        size="lg"
      >
        {previewEmployee &&
          (() => {
            const emp = employees.find((e) => e.id === previewEmployee);
            if (!emp) return null;
            const missing = getEmployeeMissingMaterials(emp.id);
            const rejected = getEmployeeRejectedMaterials(emp.id);
            const submitLink = generateSubmitLink(emp.submitToken);
            let message = `【入职材料提醒】${emp.name}您好，`;
            if (rejected.length > 0) {
              message += `您以下材料未通过审核，请修改后重新提交：${rejected
                .map((r) => r.templateName)
                .join('、')}。`;
            }
            if (missing.length > 0) {
              message += `还需提交以下材料：${missing.map((m) => m.name).join('、')}。`;
            }
            message += `请点击链接提交：${submitLink}`;

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary-900">{emp.name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      {emp.department} · {emp.position}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </span>
                      {emp.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {emp.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={emp.status} />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-3">材料提交情况</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-danger-50 rounded-xl border border-danger-100">
                      <p className="text-xs text-danger-600 mb-1">待提交</p>
                      <p className="text-3xl font-bold text-danger-700">{missing.length}</p>
                    </div>
                    <div className="p-4 bg-warning-50 rounded-xl border border-warning-100">
                      <p className="text-xs text-warning-600 mb-1">待补交</p>
                      <p className="text-3xl font-bold text-warning-700">{rejected.length}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-neutral-800">提醒文案预览</h4>
                    <button
                      onClick={() => {
                        copyToClipboard(message).then(() => success('文案已复制'));
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      一键复制
                    </button>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {message}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setPreviewEmployee(null)}
                    className="px-5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      handleSendSingle(emp.id, ReminderType.FOLLOW_UP);
                      setPreviewEmployee(null);
                    }}
                    className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    发送提醒
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="个人提交入口" size="sm">
        {qrEmployee && (
          <div className="text-center space-y-6 py-4">
            <div className="p-4 bg-gradient-to-br from-primary-50 to-success-50 rounded-2xl inline-block">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={generateSubmitLink(qrEmployee.submitToken)}
                  size={200}
                  level="H"
                  includeMargin
                  fgColor="#1e3a5f"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">{qrEmployee.name}</h3>
              <p className="text-sm text-neutral-500">{qrEmployee.department} · {qrEmployee.position}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl">
              <p className="text-xs text-neutral-500 mb-1.5">提交链接</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-primary-700 font-mono truncate flex-1 text-left">
                  {generateSubmitLink(qrEmployee.submitToken)}
                </p>
                <button
                  onClick={() => {
                    copyToClipboard(generateSubmitLink(qrEmployee.submitToken)).then(() =>
                      success('链接已复制'),
                    );
                  }}
                  className="flex-shrink-0 p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-400">请截图发送或打印二维码交给员工本人</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Phone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
