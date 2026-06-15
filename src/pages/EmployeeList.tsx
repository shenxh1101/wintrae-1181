import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  UserPlus,
  Trash2,
  Eye,
  Mail,
  Bell,
  MoreVertical,
  ChevronDown,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import type { Employee, EmployeeStatus } from '@/types';
import { EmployeeStatus as EmployeeStatusEnum, ReminderType } from '@/types';
import { formatDate, maskIdCard, maskPhone, copyToClipboard } from '@/utils';
import { EMPLOYEE_STATUS_LABELS } from '@/utils/constants';
import { debounce } from '@/utils';

const statusOptions: { value: EmployeeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: EmployeeStatusEnum.PENDING, label: '待提交' },
  { value: EmployeeStatusEnum.SUBMITTED, label: '待审核' },
  { value: EmployeeStatusEnum.REJECTED, label: '待补交' },
  { value: EmployeeStatusEnum.APPROVED, label: '已通过' },
];

export default function EmployeeList() {
  const navigate = useNavigate();
  const employees = useAppStore(s => s.employees);
  const selectedIds = useAppStore(s => s.selectedEmployeeIds);
  const toggleSelect = useAppStore(s => s.toggleSelectEmployee);
  const selectAll = useAppStore(s => s.selectAllEmployees);
  const clearSelected = useAppStore(s => s.clearSelectedEmployees);
  const deleteEmployee = useAppStore(s => s.deleteEmployee);
  const deleteEmployees = useAppStore(s => s.deleteEmployees);
  const addEmployee = useAppStore(s => s.addEmployee);
  const sendBatchReminders = useAppStore(s => s.sendBatchReminders);
  const setExceptionNote = useAppStore(s => s.setExceptionNote);
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkEmployee, setRemarkEmployee] = useState<Employee | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkRemind, setShowBulkRemind] = useState(false);
  const [remindResult, setRemindResult] = useState<{ count: number; total: number } | null>(null);
  const [newEmp, setNewEmp] = useState<Partial<Employee> & { onboardDate?: string; expectedDate?: string }>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search ||
        e.name.includes(search) ||
        e.phone.includes(search) ||
        e.position.includes(search) ||
        e.department.includes(search) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchDept = deptFilter === 'all' || e.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [employees, search, statusFilter, deptFilter]);

  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id));
  const someSelected = filtered.some(e => selectedIds.includes(e.id));

  const handleSearch = debounce((v: string) => setSearch(v), 200);

  const handleAdd = () => {
    if (!newEmp.name || !newEmp.phone || !newEmp.position) {
      showToast('请填写必填项（姓名、手机号、职位）', 'warning');
      return;
    }
    const dup = employees.find(e => e.name === newEmp.name && e.phone === newEmp.phone);
    if (dup) {
      showToast('存在同名同手机号员工，请确认', 'warning');
      return;
    }

    const payload: any = { ...newEmp };
    if (newEmp.onboardDate || newEmp.expectedDate) {
      const dateStr = newEmp.onboardDate || newEmp.expectedDate;
      const parsed = dateStr ? new Date(dateStr) : new Date();
      payload.onboardDate = parsed;
      payload.expectedDate = parsed;
    }

    addEmployee(payload);
    showToast('添加成功', 'success');
    setShowAddModal(false);
    setNewEmp({});
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteEmployee(deleteTarget.id);
      showToast('已删除', 'success');
      setDeleteTarget(null);
    }
    setShowConfirmDelete(false);
  };

  const handleBulkDelete = () => {
    deleteEmployees(selectedIds);
    showToast(`已删除${selectedIds.length}名员工`, 'success');
    setShowBulkDelete(false);
    clearSelected();
  };

  const handleBatchRemind = async () => {
    if (selectedIds.length === 0) return;
    const count = await sendBatchReminders(selectedIds, ReminderType.FOLLOW_UP);
    setRemindResult({ count, total: selectedIds.length });
    setShowBulkRemind(true);
  };

  const handleCopySubmitLink = (emp: Employee) => {
    const url = `${window.location.origin}/#/submit/${emp.submitToken}`;
    copyToClipboard(url);
    showToast('提交链接已复制', 'success');
  };

  const handleSaveRemark = () => {
    if (remarkEmployee) {
      setExceptionNote(remarkEmployee.id, remarkText);
      showToast('异常备注已保存', 'success');
    }
    setShowRemarkModal(false);
    setRemarkEmployee(null);
    setRemarkText('');
  };

  const getMaterialProgress = (emp: Employee) => {
    const state = useAppStore.getState();
    const materials = state.getEmployeeMaterialRecords(emp.id);
    const required = materials.filter(m => m.required);
    const approved = required.filter(m => m.status === 'approved' || m.status === 'expiring');
    return { done: approved.length, total: required.length };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索姓名、手机号、职位、部门、邮箱..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 appearance-none cursor-pointer"
            >
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 appearance-none cursor-pointer pr-8"
            >
              {departments.map(d => <option key={d} value={d}>{d === 'all' ? '全部部门' : d}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>

          <div className="flex-1" />

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 animate-fade-in">
              <span>已选 {selectedIds.length} 人</span>
              <button onClick={clearSelected} className="text-xs text-primary-600 hover:underline">取消</button>
              <div className="w-px h-4 bg-primary-200 mx-1" />
              <button onClick={handleBatchRemind} className="flex items-center gap-1 hover:text-primary-800">
                <Bell className="w-3.5 h-3.5" /> 批量催交
              </button>
              <button onClick={() => setShowBulkDelete(true)} className="flex items-center gap-1 hover:text-danger-600 text-danger-600">
                <Trash2 className="w-3.5 h-3.5" /> 删除
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20 hover:shadow-md hover:shadow-primary-500/30"
          >
            <UserPlus className="w-4 h-4" /> 新增员工
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="w-12 px-4 py-3.5 text-left">
                  <button onClick={() => {
                    if (allSelected) clearSelected();
                    else selectAll(filtered.map(e => e.id));
                  }}>
                    {allSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> :
                     someSelected ? <CheckSquare className="w-4 h-4 text-primary-400 opacity-60" /> :
                     <Square className="w-4 h-4 text-neutral-400" />}
                  </button>
                </th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">员工信息</th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">岗位</th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">入职日期</th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">材料进度</th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">状态</th>
                <th className="px-4 py-3.5 text-left font-medium text-neutral-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm">暂无匹配的员工数据</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp, idx) => {
                  const progress = getMaterialProgress(emp);
                  const percent = progress.total > 0 ? Math.round(progress.done / progress.total * 100) : 0;
                  return (
                    <tr
                      key={emp.id}
                      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50 transition-colors ${selectedIds.includes(emp.id) ? 'bg-primary-50/30' : ''}`}
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(emp.id)}>
                          {selectedIds.includes(emp.id)
                            ? <CheckSquare className="w-4 h-4 text-primary-600" />
                            : <Square className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-medium">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-neutral-800 truncate">{emp.name}</p>
                              {emp.exceptionNote && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-warning-50 text-warning-600 border border-warning-200" title={emp.exceptionNote}>
                                  <AlertCircle className="w-3 h-3" /> 异常
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {maskPhone(emp.phone)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {emp.email || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-neutral-800 font-medium flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                          {emp.position}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{emp.department}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-neutral-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {formatDate(emp.onboardDate || emp.expectedDate) || '-'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">{maskIdCard(emp.idCard)}</p>
                      </td>
                      <td className="px-4 py-4 min-w-36">
                        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1.5">
                          <span>必填材料</span>
                          <span className="font-medium">{progress.done}/{progress.total}</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent === 100 ? 'bg-success-500' : percent >= 50 ? 'bg-primary-500' : 'bg-warning-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={emp.status} type="employee" />
                      </td>
                      <td className="px-4 py-4 relative">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/employees/${emp.id}`}
                            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleCopySubmitLink(emp)}
                            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-success-600 transition-colors"
                            title="复制提交链接"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {menuOpen === emp.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg border border-neutral-200 shadow-elevated py-1 z-10 animate-scale-in">
                                <button
                                  onClick={() => {
                                    setRemarkEmployee(emp);
                                    setRemarkText(emp.exceptionNote || '');
                                    setShowRemarkModal(true);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                >
                                  <AlertCircle className="w-3.5 h-3.5 text-warning-500" /> 异常备注
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget(emp);
                                    setShowConfirmDelete(true);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> 删除员工
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
          <span>共 {filtered.length} 条记录</span>
          <span>完成率：{
            filtered.length > 0
              ? Math.round(filtered.filter(e => e.status === 'approved').length / filtered.length * 100)
              : 0
          }%</span>
        </div>
      </div>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="新增员工"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >取消</button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >确认添加</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="姓名" required value={newEmp.name} onChange={v => setNewEmp(s => ({ ...s, name: v }))} />
          <FormField label="手机号" required value={newEmp.phone} onChange={v => setNewEmp(s => ({ ...s, phone: v }))} />
          <FormField label="邮箱" value={newEmp.email} onChange={v => setNewEmp(s => ({ ...s, email: v }))} />
          <FormField label="身份证号" value={newEmp.idCard} onChange={v => setNewEmp(s => ({ ...s, idCard: v }))} />
          <FormField label="职位" required value={newEmp.position} onChange={v => setNewEmp(s => ({ ...s, position: v }))} />
          <FormField label="部门" required value={newEmp.department} onChange={v => setNewEmp(s => ({ ...s, department: v }))} />
          <FormField label="入职日期" type="date" value={newEmp.onboardDate as any} onChange={v => setNewEmp(s => ({ ...s, onboardDate: v as any }))} />
          <FormField label="备注" value={newEmp.remark} onChange={v => setNewEmp(s => ({ ...s, remark: v }))} />
        </div>
      </Modal>

      <Modal
        open={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        title={`异常备注 - ${remarkEmployee?.name}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowRemarkModal(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >取消</button>
            <button
              onClick={handleSaveRemark}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >保存备注</button>
          </>
        }
      >
        <textarea
          value={remarkText}
          onChange={e => setRemarkText(e.target.value)}
          placeholder="请输入异常情况说明，例如：重名需要确认、资料特殊处理等..."
          rows={4}
          className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
        />
      </Modal>

      <Modal
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowConfirmDelete(false)}
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
            <p className="font-medium text-neutral-800">确定删除员工「{deleteTarget?.name}」吗？</p>
            <p className="text-sm text-neutral-500 mt-1">删除后将同时清除该员工的所有材料记录、审核记录和提醒记录，此操作不可恢复。</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        title="批量删除确认"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowBulkDelete(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >取消</button>
            <button
              onClick={handleBulkDelete}
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
            <p className="font-medium text-neutral-800">确定批量删除选中的 {selectedIds.length} 名员工吗？</p>
            <p className="text-sm text-neutral-500 mt-1">包括他们的所有关联数据将全部清除，不可恢复。</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showBulkRemind}
        onClose={() => { setShowBulkRemind(false); setRemindResult(null); clearSelected(); }}
        title="批量催交完成"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setShowBulkRemind(false); setRemindResult(null); clearSelected(); }}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >关闭</button>
            <button
              onClick={() => { setShowBulkRemind(false); setRemindResult(null); clearSelected(); navigate('/reminders'); }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >查看提醒中心</button>
          </>
        }
      >
        {remindResult && (
          <div className="py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-neutral-800">催交通知已生成</p>
              <p className="text-sm text-neutral-600">
                已为 <span className="font-bold text-primary-600">{remindResult.count}</span> / {remindResult.total} 名员工生成催交通知
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                通知已发送至提醒中心，可查看详细记录或复制链接发送给员工
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FormField({ label, required, value, onChange, type = 'text' }: {
  label: string; required?: boolean; value?: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
      />
    </div>
  );
}
