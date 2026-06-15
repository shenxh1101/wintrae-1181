import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  FileText,
  AlertCircle,
  Clock,
  Star,
  StarOff,
  Briefcase,
  CalendarClock,
  ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import type { MaterialTemplate } from '@/types';
import { formatDateTime } from '@/utils';

export default function MaterialTemplates() {
  const templates = useAppStore(s => s.materialTemplates);
  const addTemplate = useAppStore(s => s.addTemplate);
  const updateTemplate = useAppStore(s => s.updateTemplate);
  const deleteTemplate = useAppStore(s => s.deleteTemplate);
  const toggleActive = useAppStore(s => s.toggleTemplateActive);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MaterialTemplate | null>(null);
  const [form, setForm] = useState<Partial<MaterialTemplate>>({});
  const [deleteTarget, setDeleteTarget] = useState<MaterialTemplate | null>(null);
  const [sortBy, setSortBy] = useState<'order' | 'name'>('order');

  const sorted = [...templates].sort((a, b) => {
    if (sortBy === 'order') return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      required: true,
      hasExpiry: false,
      validityDays: 0,
      applicableDepartments: ['全部岗位'],
      sortOrder: templates.length + 1,
    } as any);
    setShowModal(true);
  };

  const openEdit = (t: MaterialTemplate) => {
    setEditing(t);
    setForm({
      ...t,
      needExpiryCheck: (t as any).needExpiryCheck ?? t.hasExpiry,
      validDays: (t as any).validDays ?? t.validityDays,
      applicablePositions: (t as any).applicablePositions ?? (t.applicableDepartments?.join('、') || '全部岗位'),
    } as any);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      showToast('请输入材料名称', 'warning');
      return;
    }

    const payload: Partial<MaterialTemplate> = {
      ...form,
      hasExpiry: (form as any).needExpiryCheck ?? form.hasExpiry,
      validityDays: (form as any).validDays ?? form.validityDays,
      applicableDepartments: (form as any).applicablePositions
        ? String((form as any).applicablePositions).split(/[、,，]/).map(s => s.trim()).filter(Boolean)
        : form.applicableDepartments,
    };
    delete (payload as any).needExpiryCheck;
    delete (payload as any).validDays;
    delete (payload as any).applicablePositions;

    if (editing) {
      updateTemplate(editing.id, payload);
      showToast('模板已更新', 'success');
    } else {
      addTemplate(payload);
      showToast('模板已添加', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteTemplate(deleteTarget.id);
      showToast('模板已删除', 'success');
      setDeleteTarget(null);
    }
  };

  const activeCount = templates.filter(t => t.active).length;
  const requiredCount = templates.filter(t => t.required).length;
  const expiryCount = templates.filter(t => (t as any).needExpiryCheck ?? t.hasExpiry).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="材料模板总数" value={templates.length} color="primary" />
        <StatCard icon={Star} label="必填材料" value={requiredCount} color="success" />
        <StatCard icon={StarOff} label="选填材料" value={templates.length - requiredCount} color="warning" />
        <StatCard icon={CalendarClock} label="需有效期检查" value={expiryCount} color="danger" />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-neutral-800">材料类型模板</h3>
            <p className="text-xs text-neutral-500 mt-0.5">管理入职所需的各类材料，配置必填规则和有效期</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'order' ? 'name' : 'order')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === 'order' ? '按排序' : '按名称'}
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              新增模板
            </button>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-400">暂无材料模板，请点击右上角添加</p>
            </div>
          ) : (
            sorted.map(t => (
              <div
                key={t.id}
                className={`px-6 py-4 flex items-start gap-4 hover:bg-neutral-50/50 transition-colors ${!t.active ? 'opacity-50' : ''}`}
              >
                <div className="text-neutral-300 cursor-grab pt-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: t.required ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                  <FileText className={`w-5 h-5 ${t.required ? 'text-success-600' : 'text-neutral-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-neutral-800">{t.name}</h4>
                    {t.required && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-danger-50 text-danger-600 border border-danger-200">
                        <Star className="w-2.5 h-2.5" /> 必填
                      </span>
                    )}
                    {!t.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200">
                        已停用
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {(t as any).applicablePositions || (t.applicableDepartments?.join('、') || '全部岗位')}
                    </span>
                    {((t as any).needExpiryCheck ?? t.hasExpiry) && (
                      <span className="flex items-center gap-1 text-warning-600">
                        <Clock className="w-3 h-3" />
                        有效期 {(t as any).validDays ?? t.validityDays ?? 0} 天
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      创建于 {formatDateTime(t.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(t.id)}
                    className={`p-2 rounded-lg transition-colors ${t.active ? 'text-success-500 hover:bg-success-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                    title={t.active ? '点击停用' : '点击启用'}
                  >
                    {t.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-lg text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-2 rounded-lg text-neutral-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? '编辑材料模板' : '新增材料模板'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >取消</button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >{editing ? '保存修改' : '确认添加'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                材料名称 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                placeholder="如：身份证复印件、离职证明等"
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">描述说明</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                placeholder="对材料要求的补充说明，如：需清晰可辨、加盖公章等"
                rows={2}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">适用岗位</label>
              <input
                type="text"
                value={(form as any).applicablePositions || (form.applicableDepartments?.join('、') || '')}
                onChange={e => setForm(s => ({ ...s, applicablePositions: e.target.value } as any))}
                placeholder="全部岗位 / 技术岗位 / 管理岗位等"
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">排序号</label>
              <input
                type="number"
                value={form.sortOrder || 0}
                onChange={e => setForm(s => ({ ...s, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.required ?? true}
                  onChange={e => setForm(s => ({ ...s, required: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">必填材料</span>
                <span className="text-xs text-neutral-400">（员工必须提交）</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={(form as any).needExpiryCheck ?? form.hasExpiry ?? false}
                  onChange={e => setForm(s => ({ ...s, needExpiryCheck: e.target.checked, hasExpiry: e.target.checked } as any))}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">需要有效期检查</span>
              </label>
            </div>
            {((form as any).needExpiryCheck ?? form.hasExpiry) && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">有效天数</label>
                <input
                  type="number"
                  value={(form as any).validDays ?? form.validityDays ?? 0}
                  onChange={e => setForm(s => ({ ...s, validDays: Number(e.target.value), validityDays: Number(e.target.value) } as any))}
                  placeholder="如：90 表示体检报告3个月内有效"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
                <p className="text-xs text-neutral-400 mt-1">从员工上传日期开始计算，到期前30天将自动提醒</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除模板"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >取消</button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors"
            >确认删除</button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-800">确定删除「{deleteTarget?.name}」吗？</p>
            <p className="text-sm text-neutral-500 mt-1">删除后，已关联此模板的员工材料记录将一并清除。</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    primary: 'from-primary-100 to-primary-200 text-primary-700',
    success: 'from-success-100 to-success-200 text-success-700',
    warning: 'from-warning-100 to-warning-200 text-warning-700',
    danger: 'from-danger-100 to-danger-200 text-danger-700',
  };
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
