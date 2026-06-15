import { useState, useRef } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Info,
  AlertTriangle,
  CheckCircle,
  FileJson,
  HardDrive,
  Palette,
  Bell,
  HelpCircle,
  ChevronRight,
  Trash2,
  Save,
  Users,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';

export default function SettingsPage() {
  const {
    employees,
    templates,
    reminderLogs,
    initData,
    resetAllData,
    getStatistics,
  } = useAppStore();
  const { success, error, info, warning } = useToast();

  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetText, setResetText] = useState('');
  const [backupFileName, setBackupFileName] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [showInitDemoConfirm, setShowInitDemoConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statistics = getStatistics();

  const calcDataSize = () => {
    try {
      const data = localStorage.getItem('onboarding-materials-store');
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  };

  const dataSize = calcDataSize();

  const handleExportBackup = () => {
    try {
      const storeData = localStorage.getItem('onboarding-materials-store');
      if (!storeData) {
        warning('暂无数据可备份');
        return;
      }

      const backup = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: JSON.parse(storeData),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `入职材料通_备份_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('数据备份导出成功');
    } catch (e) {
      error('备份导出失败');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFileName(file.name);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || !backup.version) {
        error('备份文件格式不正确');
        return;
      }

      setPendingRestoreData(backup);
      setShowRestoreConfirm(true);
    } catch (err) {
      error('备份文件解析失败，请确认文件格式正确');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = () => {
    try {
      localStorage.setItem(
        'onboarding-materials-store',
        JSON.stringify(pendingRestoreData.data.state || pendingRestoreData.data),
      );
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
      window.location.reload();
    } catch (err) {
      error('恢复备份失败');
    }
  };

  const handleResetData = () => {
    if (resetText !== '重置所有数据') {
      warning('请输入「重置所有数据」以确认');
      return;
    }
    try {
      resetAllData();
      success('数据已重置，页面即将刷新');
      setResetConfirm(false);
      setResetText('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      error('重置失败');
    }
  };

  const handleInitDemoData = () => {
    setShowInitDemoConfirm(true);
  };

  const handleConfirmInitDemo = () => {
    initData();
    setShowInitDemoConfirm(false);
    success('示例数据加载成功');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const SettingCard = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    description,
    children,
    border = true,
  }: {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    children: React.ReactNode;
    border?: boolean;
  }) => (
    <div className={`bg-white rounded-xl ${border ? 'border border-neutral-200' : ''} overflow-hidden`}>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5.5 h-5.5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">系统设置</h1>
          <p className="text-sm text-neutral-500 mt-1">数据管理、备份恢复、个性化配置</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SettingCard
            icon={Database}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
            title="数据管理"
            description="查看当前系统的整体数据存储情况，了解各类数据的数量规模"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs text-neutral-500">员工数量</span>
                </div>
                <p className="text-2xl font-bold text-primary-700">{statistics.total}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-success-50 to-white rounded-xl border border-success-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-success-600" />
                  </div>
                  <span className="text-xs text-neutral-500">材料模板</span>
                </div>
                <p className="text-2xl font-bold text-success-700">{templates.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-warning-50 to-white rounded-xl border border-warning-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-warning-600" />
                  </div>
                  <span className="text-xs text-neutral-500">提醒记录</span>
                </div>
                <p className="text-2xl font-bold text-warning-700">{reminderLogs.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-4 h-4 text-neutral-600" />
                  </div>
                  <span className="text-xs text-neutral-500">存储空间</span>
                </div>
                <p className="text-2xl font-bold text-neutral-700">{formatSize(dataSize)}</p>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            icon={Download}
            iconBg="bg-success-50"
            iconColor="text-success-600"
            title="数据备份"
            description="导出当前所有数据为 JSON 备份文件，防止数据意外丢失"
          >
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-neutral-800 mb-0.5">完整备份</p>
                <p className="text-xs text-neutral-500">含员工、材料、审核记录、提醒日志</p>
              </div>
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <Download className="w-4 h-4" />
                导出备份
              </button>
            </div>
          </SettingCard>

          <SettingCard
            icon={Upload}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
            title="恢复备份"
            description="从 JSON 备份文件恢复数据，将覆盖当前所有数据"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportBackup}
            />
            <div className="border-2 border-dashed border-neutral-200 hover:border-primary-300 rounded-xl p-6 transition-all cursor-pointer group"
              onClick={handleImportClick}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-all">
                  <FileJson className="w-6 h-6 text-primary-500" />
                </div>
                <p className="text-sm font-medium text-neutral-700 group-hover:text-primary-700 mb-1">
                  点击选择备份文件
                </p>
                <p className="text-xs text-neutral-400">支持 .json 格式文件</p>
              </div>
            </div>
            {backupFileName && (
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                已选择文件：{backupFileName}
              </div>
            )}
          </SettingCard>
        </div>

        <div className="space-y-6">
          <SettingCard
            icon={Save}
            iconBg="bg-info-50 bg-blue-50"
            iconColor="text-blue-600"
            title="示例数据"
            description="快速加载预设的示例数据，体验系统完整功能和交互流程"
          >
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl border border-blue-100">
              <div>
                <p className="text-sm font-medium text-neutral-800 mb-0.5">加载演示数据</p>
                <p className="text-xs text-neutral-500">6 位示例员工 + 8 个材料模板</p>
              </div>
              <button
                onClick={handleInitDemoData}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <Save className="w-4 h-4" />
                加载数据
              </button>
            </div>
          </SettingCard>

          <SettingCard
            icon={RotateCcw}
            iconBg="bg-warning-50"
            iconColor="text-warning-600"
            title="数据重置"
            description="清除系统中所有数据，恢复到初始状态。操作不可撤销！"
          >
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-danger-50 hover:bg-danger-100 rounded-xl border border-danger-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-danger-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-danger-800">清除所有数据</p>
                  <p className="text-xs text-danger-600">员工、材料、日志将被永久删除</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-danger-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </SettingCard>

          <SettingCard
            icon={Shield}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            title="隐私与安全"
            description="数据仅存储在您的浏览器中，不会上传到任何服务器"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 mb-0.5">本地存储</p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    所有数据使用浏览器 localStorage 存储，100% 私有
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-0.5">定期备份</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    建议每周导出一次备份文件，避免清理浏览器缓存导致数据丢失
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-xl border border-warning-100">
                <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning-800 mb-0.5">存储限制</p>
                  <p className="text-xs text-warning-700 leading-relaxed">
                    浏览器 localStorage 通常限制为 5-10MB，建议定期清理无用的员工数据
                  </p>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            icon={HelpCircle}
            iconBg="bg-neutral-100"
            iconColor="text-neutral-600"
            title="关于系统"
            description="版本信息和技术支持"
            border={false}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">产品名称</p>
                <p className="font-medium text-neutral-800">入职材料通</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">版本号</p>
                <p className="font-medium text-neutral-800">v1.0.0</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">技术栈</p>
                <p className="font-medium text-neutral-800">React + TypeScript</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">发布日期</p>
                <p className="font-medium text-neutral-800">2025</p>
              </div>
            </div>
          </SettingCard>
        </div>
      </div>

      <Modal
        isOpen={resetConfirm}
        onClose={() => {
          setResetConfirm(false);
          setResetText('');
        }}
        title="⚠️ 数据重置确认"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-danger-50 rounded-xl border border-danger-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger-800 mb-1">此操作将永久删除所有数据！</p>
                <p className="text-sm text-danger-700 leading-relaxed">
                  包括：所有员工信息、材料提交记录、审核日志、提醒日志、材料模板配置。删除后数据将无法恢复。
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              请输入以下文字确认操作
            </label>
            <div className="p-3 bg-neutral-100 rounded-lg text-sm text-neutral-600 font-mono mb-2 text-center">
              重置所有数据
            </div>
            <input
              type="text"
              className="w-full px-4 py-3 border border-danger-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-transparent"
              placeholder="请输入上方文字"
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resetText === '重置所有数据') {
                  handleResetData();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setResetConfirm(false);
                setResetText('');
              }}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleResetData}
              disabled={resetText !== '重置所有数据'}
              className="px-5 py-2.5 text-sm font-medium text-white bg-danger-600 rounded-xl hover:bg-danger-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              确认重置
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setPendingRestoreData(null);
        }}
        title="⚠️ 确认恢复备份"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-danger-50 rounded-xl border border-danger-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger-800 mb-1">恢复备份将覆盖当前所有数据！</p>
                <p className="text-sm text-danger-700 leading-relaxed">
                  此操作不可撤销，当前所有员工、材料记录、日志数据将被备份文件中的数据替换。
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowRestoreConfirm(false);
                setPendingRestoreData(null);
              }}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleConfirmRestore}
              className="px-5 py-2.5 text-sm font-medium text-white bg-danger-600 rounded-xl hover:bg-danger-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              确认恢复
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInitDemoConfirm}
        onClose={() => setShowInitDemoConfirm(false)}
        title="加载示例数据"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">将加载示例数据</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  将预置 6 个不同状态的示例员工和 8 个材料模板，便于您体验完整功能。现有数据不会被清除。
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowInitDemoConfirm(false)}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleConfirmInitDemo}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              加载示例
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
