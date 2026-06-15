import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Eye,
  Download,
  AlertTriangle,
  History,
  QrCode,
  Copy,
  MessageSquare,
  RefreshCw,
  Star,
  CalendarClock,
  FileCheck,
  FileX,
  Ban,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { MaterialStatus, EmployeeStatus, ReminderChannel, type MaterialRecord } from '@/types';
import { formatDate, formatDateTime, copyToClipboard, formatFileSize, maskIdCard, maskPhone, daysFromNow } from '@/utils';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const employee = useAppStore(s => s.employees.find(e => e.id === id));
  const getEmployeeMaterialRecords = useAppStore(s => s.getEmployeeMaterialRecords);
  const auditMaterial = useAppStore(s => s.auditMaterial);
  const materialTemplates = useAppStore(s => s.materialTemplates);
  const { showToast } = useToast();

  const [showQR, setShowQR] = useState(false);
  const [auditTarget, setAuditTarget] = useState<MaterialRecord | null>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'materials' | 'audit' | 'supplement'>('materials');

  const materials = useMemo(() => employee ? getEmployeeMaterialRecords(employee.id) : [], [employee, getEmployeeMaterialRecords]);

  const allAuditLogs = useMemo(() => {
    const logs: any[] = [];
    materials.forEach(r => {
      (r.auditLogs || []).forEach(l => {
        logs.push({
          ...l,
          materialRecordId: r.id,
          materialName: r.templateName,
          operator: l.auditor,
          createdAt: l.auditedAt,
          remark: l.comment,
          action: l.result === 'approved' ? 'approve' : 'reject',
        });
      });
    });
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [materials]);

  const allSupplementRecords = useMemo(() => {
    const recs: any[] = [];
    materials.forEach(r => {
      (r.supplementHistory || []).forEach(s => {
        recs.push({
          ...s,
          materialName: r.templateName,
          submitTime: s.submittedAt,
        });
      });
    });
    return recs.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
  }, [materials]);

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500 mb-4">未找到员工信息</p>
        <button onClick={() => navigate('/employees')} className="text-primary-600 hover:underline">返回员工列表</button>
      </div>
    );
  }

  const handleAudit = () => {
    if (auditTarget) {
      auditMaterial(auditTarget.id, auditAction, auditRemark);
      showToast(auditAction === 'approve' ? '已通过审核' : '已标记需补正', 'success');
      setAuditTarget(null);
      setAuditRemark('');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/submit/${employee.submitToken}`;
    copyToClipboard(url);
    showToast('提交链接已复制', 'success');
  };

  const submitUrl = `${window.location.origin}/#/submit/${employee.submitToken}`;

  const stats = {
    approved: materials.filter(m => m.status === MaterialStatus.APPROVED || m.status === MaterialStatus.EXPIRING).length,
    pending: materials.filter(m => m.status === MaterialStatus.SUBMITTED).length,
    rejected: materials.filter(m => m.status === MaterialStatus.REJECTED).length,
    missing: materials.filter(m => m.status === MaterialStatus.PENDING).length,
    expiring: materials.filter(m => m.status === MaterialStatus.EXPIRING || m.status === MaterialStatus.EXPIRED).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Copy className="w-4 h-4" /> 复制提交链接
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <QrCode className="w-4 h-4" /> 二维码
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-elevated">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur">
                  {employee.position}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-white/80">
                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {employee.department}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> 入职日期：{formatDate(employee.onboardDate || employee.expectedDate)}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {maskPhone(employee.phone)}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {employee.email || '-'}</span>
                <span className="flex items-center gap-1.5 md:col-span-2"><User className="w-3.5 h-3.5" /> 身份证：{maskIdCard(employee.idCard)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={employee.status} type="employee" className="!bg-white/15 !text-white !border-white/20 [&_span]:!bg-white" />
            <div className="mt-4 space-y-1 text-xs text-white/70">
              <p>创建时间：{formatDateTime(employee.createdAt)}</p>
              <p>更新时间：{formatDateTime(employee.updatedAt)}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 pt-5 border-t border-white/15">
          <Stat label="已通过" value={stats.approved} color="bg-success-400" />
          <Stat label="待审核" value={stats.pending} color="bg-primary-300" />
          <Stat label="需补正" value={stats.rejected} color="bg-danger-400" />
          <Stat label="未提交" value={stats.missing} color="bg-neutral-300" />
          <Stat label="临到期" value={stats.expiring} color="bg-warning-400" />
        </div>
        {employee.remark && (
          <div className="mt-4 p-3 rounded-lg bg-white/10 backdrop-blur text-xs text-white/80 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>备注：{employee.remark}</span>
          </div>
        )}
        {employee.exceptionNote && (
          <div className="mt-2 p-3 rounded-lg bg-warning-400/20 border border-warning-300/30 text-xs text-warning-100 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>异常备注：{employee.exceptionNote}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="border-b border-neutral-200 px-6">
          <div className="flex gap-6">
            {[
              { key: 'materials', label: '材料清单', icon: FileText, count: materials.length },
              { key: 'audit', label: '审核记录', icon: History, count: allAuditLogs.length },
              { key: 'supplement', label: '补交记录', icon: RefreshCw, count: allSupplementRecords.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'materials' && (
            <div className="space-y-3">
              {materials.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border transition-all ${
                    record.status === MaterialStatus.APPROVED || record.status === MaterialStatus.EXPIRING
                      ? 'border-success-100 bg-success-50/30'
                      : record.status === MaterialStatus.REJECTED
                      ? 'border-danger-100 bg-danger-50/30'
                      : record.status === MaterialStatus.SUBMITTED
                      ? 'border-primary-100 bg-primary-50/30'
                      : record.status === MaterialStatus.EXPIRED
                      ? 'border-warning-100 bg-warning-50/30'
                      : 'border-neutral-200 bg-neutral-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        record.required ? 'bg-danger-100 text-danger-600' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-neutral-800">{record.templateName}</h4>
                          {record.required && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-50 text-danger-600 border border-danger-100 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" /> 必填
                            </span>
                          )}
                          <StatusBadge status={record.status} type="material" className="!py-0.5" />
                        </div>
                        {record.fileName && (
                          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600 flex-wrap">
                            <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" /> {record.fileName}</span>
                            {record.fileSize ? <span>({formatFileSize(record.fileSize)})</span> : null}
                            <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> 提交：{formatDate(record.submittedAt)}</span>
                            {record.expiryDate && (
                              <span className={`flex items-center gap-1 ${
                                daysFromNow(record.expiryDate) < 0 ? 'text-danger-600' :
                                daysFromNow(record.expiryDate) <= 30 ? 'text-warning-600' : 'text-neutral-600'
                              }`}>
                                <Ban className="w-3 h-3" />
                                有效期至：{formatDate(record.expiryDate)}
                                {daysFromNow(record.expiryDate) <= 30 && ` (${daysFromNow(record.expiryDate) < 0 ? '已过期' : '剩' + daysFromNow(record.expiryDate) + '天'})`}
                              </span>
                            )}
                          </div>
                        )}
                        {record.auditLogs && record.auditLogs.length > 0 && (
                          <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                            record.status === MaterialStatus.REJECTED
                              ? 'bg-danger-100/50 text-danger-700 border border-danger-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}>
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{record.status === MaterialStatus.REJECTED ? '驳回意见：' : '审核备注：'}</span>
                              {record.auditLogs[record.auditLogs.length - 1].comment || '无'}
                              {record.auditLogs[record.auditLogs.length - 1].auditedAt && 
                                <span className="opacity-60 ml-2">
                                  ({formatDateTime(record.auditLogs[record.auditLogs.length - 1].auditedAt)} by {record.auditLogs[record.auditLogs.length - 1].auditor})
                                </span>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {record.fileName && (
                        <>
                          <button
                            className="p-2 rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-700 transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-700 transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {record.status === MaterialStatus.SUBMITTED && (
                        <>
                          <button
                            onClick={() => { setAuditTarget(record); setAuditAction('approve'); setAuditRemark(''); }}
                            className="p-2 rounded-lg text-success-600 hover:bg-success-50 transition-colors"
                            title="通过"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setAuditTarget(record); setAuditAction('reject'); setAuditRemark(''); }}
                            className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
                            title="驳回"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(record.status === MaterialStatus.PENDING || record.status === MaterialStatus.REJECTED) && (
                        <button
                          onClick={handleCopyLink}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                          title="提醒提交"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {allAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-sm">暂无审核记录</div>
              ) : (
                allAuditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.action === 'approve' ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'
                    }`}>
                      {log.action === 'approve' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <FileX className="w-4.5 h-4.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-800 text-sm">
                          {log.action === 'approve' ? '审核通过' : '审核驳回'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          「{log.materialName || '材料'}」
                        </span>
                      </div>
                      {log.remark && <p className="text-xs text-neutral-600 mt-1">{log.remark}</p>}
                      <p className="text-xs text-neutral-400 mt-1">
                        操作人：{log.operator} · {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'supplement' && (
            <div className="space-y-3">
              {allSupplementRecords.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-sm">暂无补交记录</div>
              ) : (
                allSupplementRecords.map((rec: any) => (
                  <div key={rec.id} className="flex items-start gap-3 p-4 rounded-xl bg-warning-50/30 border border-warning-100">
                    <div className="w-9 h-9 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-800 text-sm">补交材料</span>
                        <span className="text-xs text-neutral-500">
                          「{rec.materialName || '材料'}」
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-xs text-neutral-600">
                        <p>原文件：{rec.originalFileName || '-'}</p>
                        <p>新文件：{rec.newFileName || '员工重新提交中...'}</p>
                        {rec.reason && <p>原因：{rec.reason}</p>}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1.5">{formatDateTime(rec.submitTime)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showQR}
        onClose={() => setShowQR(false)}
        title={`${employee.name} - 个人提交入口`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowQR(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              关闭
            </button>
            <button onClick={handleCopyLink}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" /> 复制链接
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <QRCodeSVG value={submitUrl} size={200} level="M" includeMargin />
          </div>
          <p className="text-sm text-neutral-600 mt-4 text-center">扫描二维码或复制链接发送给员工</p>
          <div className="mt-3 w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 font-mono break-all">
            {submitUrl}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!auditTarget}
        onClose={() => setAuditTarget(null)}
        title={auditAction === 'approve' ? '审核通过' : '审核驳回'}
        size="md"
        footer={
          <>
            <button onClick={() => setAuditTarget(null)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              取消
            </button>
            <button onClick={handleAudit}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                auditAction === 'approve' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'
              }`}>
              确认{auditAction === 'approve' ? '通过' : '驳回'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {auditTarget && (
            <div className={`p-3 rounded-lg text-sm ${
              auditAction === 'approve' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}>
              材料：{materialTemplates.find(t => t.id === auditTarget?.templateId)?.name}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              审核备注 {auditAction === 'reject' && <span className="text-danger-500">*</span>}
            </label>
            <textarea
              value={auditRemark}
              onChange={e => setAuditRemark(e.target.value)}
              placeholder={auditAction === 'reject' ? '请输入驳回原因，员工将看到此提示' : '可选，输入审核说明'}
              rows={3}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-white/70">{label}</p>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}
