import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
  ArrowRight,
  FileQuestion,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToast } from '@/components/Toast';
import type { Employee, ImportPreviewRow } from '@/types';
import { validateChineseName, validateEmail, validateIdCard, validatePhone, formatDate } from '@/utils';
import { EXCEL_TEMPLATE_COLUMNS } from '@/utils/constants';

type Step = 'upload' | 'preview' | 'complete';

export default function EmployeeImport() {
  const navigate = useNavigate();
  const employees = useAppStore(s => s.employees);
  const addEmployees = useAppStore(s => s.addEmployees);
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [skipErrors, setSkipErrors] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldMap: Record<string, string[]> = {
    name: ['姓名', '名字', '员工姓名', 'name'],
    phone: ['手机号', '手机', '电话', '联系电话', 'phone', 'mobile'],
    email: ['邮箱', '电子邮件', 'email', 'e-mail', 'mail'],
    idCard: ['身份证号', '身份证', '身份证号码', '证件号', 'idcard', 'id'],
    position: ['职位', '岗位', '应聘职位', 'position', 'job'],
    department: ['部门', '所属部门', 'department', 'dept'],
    onboardDate: ['入职日期', '入职时间', '到岗日期', 'onboard', 'date'],
    remark: ['备注', '说明', 'remark', 'note'],
  };

  const matchColumn = (header: string): string | null => {
    const h = header.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(fieldMap)) {
      if (aliases.some(a => a.toLowerCase() === h || h.includes(a.toLowerCase()))) {
        return field;
      }
    }
    return null;
  };

  const validateRow = (data: Partial<Employee>, rowIndex: number, existing: Employee[]): ImportPreviewRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.name || !validateChineseName(data.name)) {
      errors.push('姓名格式不正确');
    }
    if (!data.phone || !validatePhone(data.phone)) {
      errors.push('手机号格式不正确');
    }
    if (data.email && !validateEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }
    if (data.idCard && !validateIdCard(data.idCard)) {
      errors.push('身份证号格式不正确');
    }
    if (!data.position) {
      errors.push('职位不能为空');
    }
    if (!data.department) {
      errors.push('部门不能为空');
    }
    if (!data.onboardDate && !(data as any).expectedDate) {
      errors.push('入职日期不能为空');
    }

    const isDuplicate = existing.some(
      e => (e.name === data.name && e.phone === data.phone) || (data.idCard && e.idCard === data.idCard)
    );
    if (isDuplicate) {
      warnings.push('与现有员工信息重复，请确认');
    }

    return {
      rowIndex,
      data,
      errors,
      warnings,
      isDuplicate,
    };
  };

  const parseDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    
    let dateStr = String(value).trim();
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        dateStr = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    } else if (dateStr.includes('年') && dateStr.includes('月') && dateStr.includes('日')) {
      dateStr = dateStr.replace(/年|月/g, '-').replace('日', '');
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  };

  const checkIntraBatchDuplicates = (rows: ImportPreviewRow[]): ImportPreviewRow[] => {
    return rows.map((row, idx) => {
      const hasBatchDuplicate = rows.some((other, otherIdx) => {
        if (idx === otherIdx) return false;
        const sameNamePhone = row.data.name === other.data.name && row.data.phone === other.data.phone;
        const sameIdCard = row.data.idCard && other.data.idCard && row.data.idCard === other.data.idCard;
        return sameNamePhone || sameIdCard;
      });
      
      if (hasBatchDuplicate && !row.warnings.includes('导入表格内存在重复人员，请确认')) {
        return {
          ...row,
          warnings: [...row.warnings, '导入表格内存在重复人员，请确认'],
          isDuplicate: true,
        };
      }
      return row;
    });
  };

  const processFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast('请上传Excel或CSV文件', 'error');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

        if (json.length < 2) {
          showToast('文件内容为空或格式不正确', 'error');
          return;
        }

        const headers = json[0] as string[];
        const mappings: (string | null)[] = headers.map(matchColumn);

        const rows: ImportPreviewRow[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          if (!row.some(cell => cell && String(cell).trim())) continue;

          const empData: Partial<Employee> & { onboardDate?: any; expectedDate?: any } = {};
          row.forEach((cell, idx) => {
            const field = mappings[idx];
            if (field && cell !== undefined && cell !== null) {
              (empData as any)[field] = String(cell).trim();
            }
          });

          const rawDate = (empData as any).onboardDate || (empData as any).expectedDate;
          const parsedDate = parseDate(rawDate);
          if (parsedDate) {
            (empData as any).onboardDate = parsedDate;
            (empData as any).expectedDate = parsedDate;
          }

          rows.push(validateRow(empData, i, employees));
        }

        if (rows.length === 0) {
          showToast('未解析到有效数据行', 'warning');
          return;
        }

        const rowsWithDupCheck = checkIntraBatchDuplicates(rows);

        setPreviewRows(rowsWithDupCheck);
        setStep('preview');
        showToast(`成功解析 ${rowsWithDupCheck.length} 条数据`, 'success');
      } catch (err) {
        console.error(err);
        showToast('文件解析失败，请检查格式', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const downloadTemplate = () => {
    const headers = EXCEL_TEMPLATE_COLUMNS.map(c => c.label);
    const example = EXCEL_TEMPLATE_COLUMNS.map(c => c.example);
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '入职名单');
    XLSX.writeFile(wb, `入职名单模板_${formatDate(new Date())}.xlsx`);
    showToast('模板下载成功', 'success');
  };

  const validRows = previewRows.filter(r => r.errors.length === 0);
  const invalidRows = previewRows.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    const toImport = skipErrors ? validRows : previewRows.filter(r => r.errors.length === 0);
    if (toImport.length === 0) {
      showToast('没有可导入的数据', 'warning');
      return;
    }

    setImporting(true);
    await new Promise(r => setTimeout(r, 800));

    const importData = toImport.map(r => {
      const parsedDate = parseDate(r.data.onboardDate ?? (r.data as any).expectedDate);
      return {
        ...r.data,
        onboardDate: parsedDate || undefined,
        expectedDate: parsedDate || undefined,
      };
    });

    const result = addEmployees(importData);
    setImportedCount(result.length);
    setImporting(false);
    setStep('complete');
    showToast(`成功导入 ${result.length} 名员工`, 'success');
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setPreviewRows([]);
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <StepIndicator current={step} />
      </div>

      {step === 'upload' && (
        <>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-1">批量导入入职名单</h3>
              <p className="text-sm text-neutral-500">支持 .xlsx / .xls / .csv 格式，推荐下载模板后填写</p>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-primary-400 bg-primary-50 scale-[1.01]'
                  : 'border-neutral-300 bg-neutral-50/50 hover:border-primary-300 hover:bg-primary-50/30'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <p className="font-medium text-neutral-700 mb-1">
                {isDragOver ? '释放文件以上传' : '点击选择文件或拖拽到此处'}
              </p>
              <p className="text-xs text-neutral-400">仅支持 Excel 和 CSV 格式文件</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载导入模板
              </button>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-500">含示例数据，可参考填写格式</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Users, title: '批量添加', desc: '一次性导入多名待入职员工信息' },
              { icon: AlertCircle, title: '智能校验', desc: '自动检查必填项、格式、重名问题' },
              { icon: CheckCircle2, title: '预览确认', desc: '导入前查看完整数据，异常项高亮' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <p className="font-medium text-neutral-800 mb-1">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'preview' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                数据预览 - {fileName}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                共 {previewRows.length} 条，{validRows.length} 条正常，{invalidRows.length} 条异常
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={e => setSkipErrors(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                跳过异常数据
              </label>
              <button
                onClick={reset}
                className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> 重新选择
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-neutral-50 sticky top-0 z-10">
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-3 text-left font-medium text-neutral-600 w-14">#</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">姓名</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">手机号</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">邮箱</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">职位</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">部门</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600">入职日期</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-600 w-28">状态</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-neutral-100 last:border-0 ${
                      row.errors.length > 0 ? 'bg-danger-50/40' : row.warnings.length > 0 ? 'bg-warning-50/40' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 text-neutral-500">{row.rowIndex}</td>
                    <td className="px-3 py-2.5 font-medium text-neutral-800">{row.data.name || '-'}</td>
                    <td className="px-3 py-2.5 text-neutral-700 font-mono text-xs">{row.data.phone || '-'}</td>
                    <td className="px-3 py-2.5 text-neutral-700 text-xs">{row.data.email || '-'}</td>
                    <td className="px-3 py-2.5 text-neutral-700">{row.data.position || '-'}</td>
                    <td className="px-3 py-2.5 text-neutral-700">{row.data.department || '-'}</td>
                    <td className="px-3 py-2.5 text-neutral-700 text-xs">{(row.data as any).onboardDate ? formatDate((row.data as any).onboardDate) : '-'}</td>
                    <td className="px-3 py-2.5">
                      {row.errors.length > 0 ? (
                        <div className="flex items-center gap-1 text-danger-600" title={row.errors.join('；')}>
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">{row.errors.length}项错误</span>
                        </div>
                      ) : row.warnings.length > 0 ? (
                        <div className="flex items-center gap-1 text-warning-600" title={row.warnings.join('；')}>
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">需确认</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-success-600">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">正常</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-success-100 border border-success-300" />
                正常 {validRows.length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warning-100 border border-warning-300" />
                警告 {previewRows.filter(r => r.warnings.length > 0 && r.errors.length === 0).length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-danger-100 border border-danger-300" />
                错误 {invalidRows.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >返回</button>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {importing ? '导入中...' : `确认导入 (${skipErrors ? validRows.length : validRows.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">导入成功！</h3>
          <p className="text-neutral-500 mb-8">
            已成功导入 <span className="text-success-600 font-semibold">{importedCount}</span> 名员工，
            {previewRows.length - importedCount > 0 && `跳过 ${previewRows.length - importedCount} 条异常数据。`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> 继续导入
            </button>
            <button
              onClick={() => navigate('/employees')}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              查看员工列表
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'upload', label: '上传文件', icon: Upload },
    { key: 'preview', label: '预览校验', icon: FileQuestion },
    { key: 'complete', label: '导入完成', icon: CheckCircle2 },
  ];
  const currentIdx = steps.findIndex(s => s.key === current);

  return (
    <div className="flex items-center gap-0 w-full max-w-2xl mx-auto">
      {steps.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? isCurrent
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-success-100 text-success-600'
                  : 'bg-neutral-100 text-neutral-400'
              }`}>
                <step.icon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-sm font-medium transition-colors ${
                isActive ? 'text-neutral-800' : 'text-neutral-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${
                i < currentIdx ? 'bg-success-400' : 'bg-neutral-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
