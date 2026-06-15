import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  Shield,
  Send,
  ChevronRight,
  Info,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToast } from '@/components/Toast';
import { MaterialStatus, AuditResult } from '@/types';
import { formatDate, fileToBase64, maskIdCard, maskPhone } from '@/utils';

export default function EmployeeSubmit() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { employees, templates, submitMaterialFile, getEmployeeMaterialRecords } = useAppStore();
  const { success, error, info } = useToast();

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});

  const employee = useMemo(() => {
    return employees.find((e) => e.submitToken === token);
  }, [employees, token]);

  const materialRecords = useMemo(() => {
    if (!employee) return [];
    return getEmployeeMaterialRecords(employee.id);
  }, [employee, getEmployeeMaterialRecords]);

  useEffect(() => {
    if (employee) {
      const initialDates: Record<string, string> = {};
      materialRecords.forEach((r) => {
        if (r.expiryDate) {
          initialDates[r.templateId] = formatDate(r.expiryDate);
        }
      });
      setExpiryDates(initialDates);
    }
  }, [employee, materialRecords]);

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-danger-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">链接无效或已过期</h2>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            您访问的提交入口不存在或已失效，请联系人事部门获取最新的提交链接。
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const stats = useMemo(() => {
    const total = materialRecords.filter((r) => r.required).length;
    const approved = materialRecords.filter(
      (r) => r.required && r.status === MaterialStatus.APPROVED,
    ).length;
    const pending = materialRecords.filter(
      (r) =>
        r.required &&
        (r.status === MaterialStatus.PENDING || r.status === MaterialStatus.SUBMITTED || r.status === MaterialStatus.REJECTED),
    ).length;
    return { total, approved, pending, progress: total > 0 ? Math.round((approved / total) * 100) : 0 };
  }, [materialRecords]);

  const handleFileUpload = async (templateId: string, file: File) => {
    const template = templates.find((t) => t.id === templateId);
    if (template?.hasExpiry && !expiryDates[templateId]) {
      error('请先填写证件有效期后再上传');
      return;
    }

    setUploadingId(templateId);
    try {
      const base64 = await fileToBase64(file);
      const expiryDate = expiryDates[templateId] ? new Date(expiryDates[templateId]) : undefined;

      await submitMaterialFile(employee.id, templateId, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64,
        expiryDate,
        submittedAt: new Date(),
      });

      success(`${file.name} 上传成功`);
    } catch (e) {
      error('文件上传失败，请重试');
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileInput = (templateId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        error('文件大小不能超过 10MB');
        return;
      }
      handleFileUpload(templateId, file);
    }
  };

  const getStatusIcon = (status: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.APPROVED:
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case MaterialStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case MaterialStatus.SUBMITTED:
        return <Clock className="w-5 h-5 text-warning-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.APPROVED:
        return '已通过';
      case MaterialStatus.REJECTED:
        return '未通过';
      case MaterialStatus.SUBMITTED:
        return '审核中';
      default:
        return '待提交';
    }
  };

  const getStatusBgClass = (status: MaterialStatus) => {
    switch (status) {
      case MaterialStatus.APPROVED:
        return 'bg-success-50 border-success-200';
      case MaterialStatus.REJECTED:
        return 'bg-danger-50 border-danger-200';
      case MaterialStatus.SUBMITTED:
        return 'bg-warning-50 border-warning-200';
      default:
        return 'bg-white border-neutral-200 hover:border-primary-300';
    }
  };

  const isAllApproved = stats.total > 0 && stats.approved === stats.total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">入职材料通</h1>
              <p className="text-xs text-neutral-500">员工材料提交系统</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">欢迎，{employee.name}</h2>
                  <p className="text-white/80 text-sm flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {employee.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {employee.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      入职日期：{formatDate(employee.expectedDate)}
                    </span>
                  </p>
                </div>
              </div>
              {isAllApproved && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">全部材料已通过</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-neutral-700">
                整体进度 ({stats.approved}/{stats.total})
              </span>
              <span className="text-2xl font-bold text-primary-600">{stats.progress}%</span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-700"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-2xl font-bold text-neutral-400">{stats.total}</p>
                <p className="text-xs text-neutral-500 mt-1">需提交项</p>
              </div>
              <div className="text-center p-3 bg-success-50 rounded-xl">
                <p className="text-2xl font-bold text-success-600">{stats.approved}</p>
                <p className="text-xs text-success-600 mt-1">已通过</p>
              </div>
              <div className="text-center p-3 bg-warning-50 rounded-xl">
                <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
                <p className="text-xs text-warning-600 mt-1">待处理</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">材料清单</h3>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg">
                <Info className="w-3.5 h-3.5" />
                标「*」为必填项
              </div>
            </div>

            <div className="space-y-4">
              {materialRecords.map((record) => {
                const template = templates.find((t) => t.id === record.templateId);
                if (!template) return null;

                const isUploading = uploadingId === record.templateId;
                const inputId = `file-${record.templateId}`;
                const needExpiry = template.hasExpiry;
                const lastAudit = record.auditLogs?.filter((l) => l.result === AuditResult.REJECTED).slice(-1)[0];

                return (
                  <div
                    key={record.templateId}
                    className={`rounded-2xl border-2 transition-all overflow-hidden ${getStatusBgClass(
                      record.status,
                    )}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              record.status === MaterialStatus.APPROVED
                                ? 'bg-success-100'
                                : record.status === MaterialStatus.REJECTED
                                ? 'bg-danger-100'
                                : record.status === MaterialStatus.SUBMITTED
                                ? 'bg-warning-100'
                                : 'bg-neutral-100'
                            }`}
                          >
                            {record.fileName ? (
                              <FileText
                                className={`w-5 h-5 ${
                                  record.status === MaterialStatus.APPROVED
                                    ? 'text-success-600'
                                    : record.status === MaterialStatus.REJECTED
                                    ? 'text-danger-600'
                                    : 'text-warning-600'
                                }`}
                              />
                            ) : (
                              <Upload
                                className={`w-5 h-5 ${
                                  record.status === MaterialStatus.PENDING ? 'text-neutral-500' : ''
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-semibold text-neutral-900">
                                {template.name}
                                {record.required && (
                                  <span className="text-danger-500 ml-0.5">*</span>
                                )}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(record.status)}
                                <span
                                  className={`text-xs font-medium ${
                                    record.status === MaterialStatus.APPROVED
                                      ? 'text-success-600'
                                      : record.status === MaterialStatus.REJECTED
                                      ? 'text-danger-600'
                                      : record.status === MaterialStatus.SUBMITTED
                                      ? 'text-warning-600'
                                      : 'text-neutral-500'
                                  }`}
                                >
                                  {getStatusText(record.status)}
                                </span>
                              </div>
                            </div>
                            {template.description && (
                              <p className="text-xs text-neutral-500 mb-2">{template.description}</p>
                            )}

                            {record.fileName && (
                              <div className="flex items-center gap-2 p-2.5 bg-white/60 rounded-lg border border-white/80">
                                {record.fileType?.startsWith('image/') ? (
                                  <ImageIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                ) : (
                                  <Paperclip className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                )}
                                <span className="text-sm text-neutral-700 truncate flex-1">
                                  {record.fileName}
                                </span>
                                {record.fileSize && (
                                  <span className="text-xs text-neutral-400 flex-shrink-0">
                                    {(record.fileSize / 1024).toFixed(1)} KB
                                  </span>
                                )}
                                {record.submittedAt && (
                                  <span className="text-xs text-neutral-400 flex-shrink-0">
                                    {formatDate(record.submittedAt)}
                                  </span>
                                )}
                              </div>
                            )}

                            {needExpiry && (
                              <div className="mt-3">
                                <label className="text-xs text-neutral-600 mb-1.5 block font-medium">
                                  有效期至
                                  {record.status !== MaterialStatus.APPROVED && (
                                    <span className="text-danger-500 ml-0.5">*</span>
                                  )}
                                </label>
                                <input
                                  type="date"
                                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${
                                    record.status === MaterialStatus.APPROVED
                                      ? 'bg-neutral-50 border-neutral-200 text-neutral-500'
                                      : 'bg-white border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                                  }`}
                                  value={expiryDates[record.templateId] || ''}
                                  onChange={(e) =>
                                    setExpiryDates({
                                      ...expiryDates,
                                      [record.templateId]: e.target.value,
                                    })
                                  }
                                  disabled={record.status === MaterialStatus.APPROVED}
                                />
                              </div>
                            )}

                            {lastAudit && (
                              <div className="mt-3 p-3 bg-danger-50 rounded-lg border border-danger-100">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-danger-700 mb-0.5">
                                      审核未通过原因
                                    </p>
                                    <p className="text-xs text-danger-600">{lastAudit.comment || '材料不符合要求，请重新上传'}</p>
                                    {lastAudit.auditedAt && (
                                      <p className="text-xs text-danger-400 mt-1">
                                        {formatDate(lastAudit.auditedAt, 'YYYY-MM-DD HH:mm')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {record.status !== MaterialStatus.APPROVED && (
                        <div className="pt-3 border-t border-black/5 flex items-center gap-3">
                          <input
                            id={inputId}
                            type="file"
                            className="hidden"
                            accept={template.acceptFormats?.join(',') || 'image/*,.pdf,.doc,.docx'}
                            onChange={(e) => handleFileInput(record.templateId, e)}
                            disabled={isUploading}
                          />
                          <label
                            htmlFor={inputId}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                              isUploading
                                ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                                : record.status === MaterialStatus.REJECTED
                                ? 'bg-danger-500 hover:bg-danger-600 text-white shadow-sm hover:shadow'
                                : record.status === MaterialStatus.SUBMITTED
                                ? 'bg-warning-500 hover:bg-warning-600 text-white shadow-sm hover:shadow'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow'
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                上传中...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                {record.status === MaterialStatus.REJECTED
                                  ? '重新上传'
                                  : record.status === MaterialStatus.SUBMITTED
                                  ? '覆盖上传'
                                  : '上传文件'}
                              </>
                            )}
                          </label>
                          {template.acceptFormats && (
                            <span className="text-xs text-neutral-400">
                              支持 {template.acceptFormats.join('/')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isAllApproved && (
              <div className="mt-8 p-6 bg-gradient-to-r from-success-50 to-success-100 rounded-2xl border-2 border-success-200 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-success-800 mb-2">恭喜！所有材料已审核通过</h3>
                <p className="text-success-600 text-sm mb-5">
                  您的入职材料已全部审核通过，请等待人事部门安排后续入职手续。
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-success-700 bg-white/60 py-3 px-4 rounded-xl inline-flex">
                  <User className="w-4 h-4" />
                  如有疑问请联系 HR：{maskPhone(employee.phone)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur rounded-2xl border border-neutral-200 p-5 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-600 space-y-1.5">
              <p className="font-medium text-neutral-800">温馨提示：</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>请上传清晰的扫描件或照片，确保文件内容完整可辨认</li>
                <li>单文件大小不超过 10MB，支持 PDF、JPG、PNG、Word 等格式</li>
                <li>带有效期的证件请务必填写到期日期，系统将提前提醒您续期</li>
                <li>提交后人事将在 1-2 个工作日内完成审核，驳回项请按要求重新提交</li>
              </ul>
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-neutral-400 pb-4">
          © {new Date().getFullYear()} 入职材料通 · 保护您的隐私与数据安全
        </footer>
      </div>
    </div>
  );
}
