import { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  Users,
  FileCheck,
  Building2,
  ChevronDown,
  Info,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToast } from '@/components/Toast';
import { EmployeeStatus } from '@/types';
import { STATUS_LABELS } from '@/utils/constants';
import { formatDate, downloadFile } from '@/utils';
import * as XLSX from 'xlsx';

export default function DataExport() {
  const { employees, templates, getStatistics, getEmployeeMissingMaterials } = useAppStore();
  const { success, error, info } = useToast();

  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'phone',
    'department',
    'position',
    'status',
    'expectedDate',
    'progress',
    'missingMaterials',
  ]);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [exporting, setExporting] = useState(false);

  const statistics = useMemo(() => getStatistics(), [getStatistics]);

  const allFields = [
    { key: 'name', label: '姓名', icon: Users },
    { key: 'phone', label: '手机号', icon: Users },
    { key: 'email', label: '邮箱', icon: Users },
    { key: 'idCard', label: '身份证号', icon: Users },
    { key: 'department', label: '部门', icon: Building2 },
    { key: 'position', label: '职位', icon: Building2 },
    { key: 'status', label: '当前状态', icon: FileCheck },
    { key: 'expectedDate', label: '入职日期', icon: Calendar },
    { key: 'createdAt', label: '创建时间', icon: Calendar },
    { key: 'progress', label: '完成进度', icon: FileCheck },
    { key: 'missingMaterials', label: '缺失材料', icon: FileCheck },
    { key: 'remark', label: '异常备注', icon: Info },
  ];

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const toggleAllFields = () => {
    if (selectedFields.length === allFields.length) {
      setSelectedFields(allFields.slice(0, 7).map((f) => f.key));
    } else {
      setSelectedFields(allFields.map((f) => f.key));
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        if (emp.expectedDate.getTime() < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo).getTime();
        if (emp.expectedDate.getTime() > to) return false;
      }
      return true;
    });
  }, [employees, statusFilter, dateFrom, dateTo]);

  const handleExport = async () => {
    if (filteredEmployees.length === 0) {
      info('当前筛选条件下无数据可导出');
      return;
    }
    if (selectedFields.length === 0) {
      error('请至少选择一个导出字段');
      return;
    }

    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      const summaryData: any[][] = [
        ['入职材料通 - 数据汇总报告'],
        [`导出时间：${formatDate(new Date(), 'YYYY-MM-DD HH:mm')}`],
        [`筛选条件：${statusFilter === 'all' ? '全部状态' : STATUS_LABELS[statusFilter]}${dateFrom ? '，入职起：' + dateFrom : ''}${dateTo ? '，入职止：' + dateTo : ''}`],
        [],
        ['统计项', '数量', '占比'],
        ['总人数', statistics.total, '100%'],
        ['已通过', statistics.approved, statistics.total ? `${((statistics.approved / statistics.total) * 100).toFixed(1)}%` : '0%'],
        ['待补交', statistics.rejected, statistics.total ? `${((statistics.rejected / statistics.total) * 100).toFixed(1)}%` : '0%'],
        ['审核中', statistics.reviewing, statistics.total ? `${((statistics.reviewing / statistics.total) * 100).toFixed(1)}%` : '0%'],
        ['未提交', statistics.pending, statistics.total ? `${((statistics.pending / statistics.total) * 100).toFixed(1)}%` : '0%'],
        [`材料总完成率`, `${statistics.completionRate}%`, ''],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
      wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }];
      XLSX.utils.book_append_sheet(wb, wsSummary, '数据汇总');

      const employeeHeaders = selectedFields.map((f) => allFields.find((af) => af.key === f)?.label || f);
      const employeeRows = filteredEmployees.map((emp) => {
        const missing = getEmployeeMissingMaterials(emp.id);
        const requiredTotal = emp.materialRecords.filter((m) => m.required).length;
        const requiredApproved = emp.materialRecords.filter(
          (m) => m.required && m.status === 'approved',
        ).length;
        const progress = requiredTotal > 0 ? `${requiredApproved}/${requiredTotal}` : '-';

        return selectedFields.map((field) => {
          switch (field) {
            case 'name':
              return emp.name;
            case 'phone':
              return emp.phone;
            case 'email':
              return emp.email || '-';
            case 'idCard':
              return emp.idCard || '-';
            case 'department':
              return emp.department;
            case 'position':
              return emp.position;
            case 'status':
              return STATUS_LABELS[emp.status] || '-';
            case 'expectedDate':
              return formatDate(emp.expectedDate);
            case 'createdAt':
              return formatDate(emp.createdAt, 'YYYY-MM-DD HH:mm');
            case 'progress':
              return progress;
            case 'missingMaterials':
              return missing.length > 0 ? missing.map((m) => m.name).join('、') : '无';
            case 'remark':
              return emp.remark || '-';
            default:
              return '-';
          }
        });
      });

      const wsEmployees = XLSX.utils.aoa_to_sheet([employeeHeaders, ...employeeRows]);
      wsEmployees['!cols'] = selectedFields.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsEmployees, '员工清单');

      if (includeMaterials) {
        const materialHeaders = ['姓名', '部门', '职位', '材料名称', '是否必填', '当前状态', '提交时间', '审核时间', '有效期至', '审核意见'];
        const materialRows: any[][] = [];
        filteredEmployees.forEach((emp) => {
          emp.materialRecords.forEach((record) => {
            const template = templates.find((t) => t.id === record.templateId);
            const lastAudit = record.auditLogs && record.auditLogs.length > 0
              ? record.auditLogs[record.auditLogs.length - 1]
              : null;

            materialRows.push([
              emp.name,
              emp.department,
              emp.position,
              template?.name || record.templateId,
              record.required ? '是' : '否',
              (() => {
                switch (record.status) {
                  case 'pending': return '待提交';
                  case 'submitted': return '待审核';
                  case 'approved': return '已通过';
                  case 'rejected': return '已驳回';
                  default: return '-';
                }
              })(),
              record.submittedAt ? formatDate(record.submittedAt, 'YYYY-MM-DD HH:mm') : '-',
              lastAudit?.auditedAt ? formatDate(lastAudit.auditedAt, 'YYYY-MM-DD HH:mm') : '-',
              record.expiryDate ? formatDate(record.expiryDate) : '-',
              lastAudit?.comment || '-',
            ]);
          });
        });

        const wsMaterials = XLSX.utils.aoa_to_sheet([materialHeaders, ...materialRows]);
        wsMaterials['!cols'] = materialHeaders.map(() => ({ wch: 16 }));
        XLSX.utils.book_append_sheet(wb, wsMaterials, '材料明细');
      }

      const fileName = `入职材料清单_${formatDate(new Date()).replace(/\//g, '')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      success(`成功导出 ${filteredEmployees.length} 条员工数据`);
    } catch (e) {
      error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const exportQuickStats = () => {
    const data = `
入职材料追踪 - 快速统计报表
生成时间：${formatDate(new Date(), 'YYYY-MM-DD HH:mm')}
═══════════════════════════════════════════

📊 整体统计
├── 员工总数：${statistics.total} 人
├── 已通过：${statistics.approved} 人 (${statistics.total ? ((statistics.approved / statistics.total) * 100).toFixed(1) : 0}%)
├── 审核中：${statistics.reviewing} 人 (${statistics.total ? ((statistics.reviewing / statistics.total) * 100).toFixed(1) : 0}%)
├── 待补交：${statistics.rejected} 人 (${statistics.total ? ((statistics.rejected / statistics.total) * 100).toFixed(1) : 0}%)
└── 未提交：${statistics.pending} 人 (${statistics.total ? ((statistics.pending / statistics.total) * 100).toFixed(1) : 0}%)

📈 完成率：${statistics.completionRate}%
⚠️  即将到期：${statistics.expiringSoon} 项
📋 异常备注：${employees.filter((e) => e.remark).length} 条

═══════════════════════════════════════════
`.trim();
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `统计报表_${formatDate(new Date()).replace(/\//g, '')}.txt`);
    success('统计报表已下载');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">数据导出</h1>
          <p className="text-sm text-neutral-500 mt-1">自定义筛选条件和字段，导出完整的入职材料追踪数据</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-500" />
                筛选条件
              </h2>
              <span className="text-xs text-neutral-500 bg-neutral-50 px-3 py-1 rounded-full">
                匹配 {filteredEmployees.length} 人
              </span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">员工状态</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
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
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">入职日期起</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">入职日期止</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {(dateFrom || dateTo || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重置筛选条件
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary-500" />
                导出字段
              </h2>
              <button
                onClick={toggleAllFields}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                {selectedFields.length === allFields.length ? '取消全选' : '全选字段'}
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allFields.map((field) => {
                  const Icon = field.icon;
                  const isSelected = selectedFields.includes(field.key);
                  return (
                    <button
                      key={field.key}
                      onClick={() => toggleField(field.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs opacity-60 mt-0.5">{field.key}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      includeMaterials ? 'bg-primary-600' : 'bg-neutral-200'
                    }`}
                    onClick={() => setIncludeMaterials(!includeMaterials)}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md ${
                        includeMaterials ? 'left-5.5 translate-x-0.5' : 'left-0.5'
                      }`}
                      style={{ left: includeMaterials ? '22px' : '2px' }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800 group-hover:text-primary-700 transition-colors">
                      包含「材料明细」工作表
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      在导出文件中额外包含每个员工的材料提交详情页签
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl text-white p-6 shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">导出预览</h3>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">导出员工</span>
                  <span className="font-bold text-xl">{filteredEmployees.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">字段数量</span>
                  <span className="font-bold text-xl">{selectedFields.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">额外工作表</span>
                  <span className="font-bold">
                    {includeMaterials ? '材料明细' : '无'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleExport}
                  disabled={exporting || filteredEmployees.length === 0}
                  className="w-full py-3 bg-white hover:bg-white/90 text-primary-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      导出中...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      导出 Excel 文件
                    </>
                  )}
                </button>
                <button
                  onClick={exportQuickStats}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-white/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  快速统计报表
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-500" />
              当前数据概览
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600">员工总数</span>
                <span className="text-sm font-bold text-neutral-900">{statistics.total}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600">整体完成率</span>
                <span className="text-sm font-bold text-success-600">{statistics.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600">材料模板数</span>
                <span className="text-sm font-bold text-neutral-900">{templates.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-600">即将到期证件</span>
                <span className="text-sm font-bold text-warning-600">{statistics.expiringSoon} 项</span>
              </div>
            </div>
          </div>

          <div className="bg-warning-50 rounded-xl border border-warning-200 p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-warning-800 space-y-1.5">
                <p className="font-medium">导出说明</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-warning-700">
                  <li>导出的 Excel 包含数据汇总和员工清单两个工作表</li>
                  <li>勾选材料明细后会追加第三个工作表</li>
                  <li>身份证、手机号等敏感信息不会脱敏，请妥善保管文件</li>
                  <li>大数量导出建议分批次进行筛选</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
