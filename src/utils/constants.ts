import { EmployeeStatus, MaterialStatus, ReminderType, ReminderChannel } from '@/types';

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.PENDING]: '待提交',
  [EmployeeStatus.SUBMITTED]: '待审核',
  [EmployeeStatus.REVIEWING]: '审核中',
  [EmployeeStatus.REJECTED]: '待补交',
  [EmployeeStatus.APPROVED]: '已通过',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; border: string; dot: string }> = {
  [EmployeeStatus.PENDING]: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  [EmployeeStatus.SUBMITTED]: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', dot: 'bg-primary-500' },
  [EmployeeStatus.REVIEWING]: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', dot: 'bg-primary-500' },
  [EmployeeStatus.REJECTED]: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200', dot: 'bg-warning-500' },
  [EmployeeStatus.APPROVED]: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200', dot: 'bg-success-500' },
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  [MaterialStatus.PENDING]: '未提交',
  [MaterialStatus.SUBMITTED]: '待审核',
  [MaterialStatus.REJECTED]: '需补正',
  [MaterialStatus.APPROVED]: '已通过',
  [MaterialStatus.EXPIRING]: '即将到期',
  [MaterialStatus.EXPIRED]: '已过期',
};

export const MATERIAL_STATUS_COLORS: Record<MaterialStatus, { bg: string; text: string; border: string; dot: string }> = {
  [MaterialStatus.PENDING]: { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  [MaterialStatus.SUBMITTED]: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', dot: 'bg-primary-500' },
  [MaterialStatus.REJECTED]: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-200', dot: 'bg-danger-500' },
  [MaterialStatus.APPROVED]: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200', dot: 'bg-success-500' },
  [MaterialStatus.EXPIRING]: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200', dot: 'bg-warning-500' },
  [MaterialStatus.EXPIRED]: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-300', dot: 'bg-danger-600' },
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  [ReminderType.FIRST]: '首次提醒',
  [ReminderType.FOLLOW_UP]: '催交提醒',
  [ReminderType.SUPPLEMENT]: '补交提醒',
  [ReminderType.EXPIRING]: '到期提醒',
  [ReminderType.APPROVED]: '通过通知',
};

export const REMINDER_CHANNEL_LABELS: Record<ReminderChannel, string> = {
  [ReminderChannel.EMAIL]: '邮件',
  [ReminderChannel.SMS]: '短信',
  [ReminderChannel.LINK]: '链接分享',
  [ReminderChannel.COPY]: '复制文案',
};

export const DEFAULT_MATERIAL_TEMPLATES = [
  {
    name: '身份证复印件',
    description: '正反面复印件或照片，需清晰可辨',
    required: true,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 1,
  },
  {
    name: '学历证书复印件',
    description: '最高学历毕业证书',
    required: true,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 2,
  },
  {
    name: '学位证书复印件',
    description: '如有则需提供',
    required: false,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 3,
  },
  {
    name: '离职证明',
    description: '上一家单位的离职证明原件',
    required: true,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 4,
  },
  {
    name: '体检报告',
    description: '近三个月内的入职体检报告',
    required: true,
    validDays: 90,
    needExpiryCheck: true,
    applicablePositions: '全部岗位',
    sortOrder: 5,
  },
  {
    name: '银行卡复印件',
    description: '工资卡复印件，需注明开户行',
    required: true,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 6,
  },
  {
    name: '社保缴纳证明',
    description: '如有社保缴纳记录请提供',
    required: false,
    validDays: 0,
    needExpiryCheck: false,
    applicablePositions: '全部岗位',
    sortOrder: 7,
  },
  {
    name: '专业资格证书',
    description: '岗位相关的职业资格证书',
    required: false,
    validDays: 365,
    needExpiryCheck: true,
    applicablePositions: '技术/专业岗位',
    sortOrder: 8,
  },
];

export const SAMPLE_EMPLOYEES = [
  {
    name: '张明辉',
    phone: '13812345678',
    email: 'zhangmh@example.com',
    idCard: '310101199001011234',
    position: '前端开发工程师',
    department: '技术部',
    onboardDate: '2026-06-20',
    status: 'pending' as const,
    remark: '社会招聘，有5年工作经验',
  },
  {
    name: '李雪婷',
    phone: '13987654321',
    email: 'lixt@example.com',
    idCard: '110101199205156789',
    position: '产品经理',
    department: '产品部',
    onboardDate: '2026-06-18',
    status: 'submitted' as const,
    remark: '985院校硕士毕业',
  },
  {
    name: '王建国',
    phone: '13600001111',
    email: 'wangjg@example.com',
    idCard: '440101198808203456',
    position: '后端开发工程师',
    department: '技术部',
    onboardDate: '2026-06-22',
    status: 'rejected' as const,
    remark: '需补充离职证明',
  },
  {
    name: '陈思琪',
    phone: '13722223333',
    email: 'chensq@example.com',
    idCard: '320101199403129876',
    position: 'UI设计师',
    department: '设计部',
    onboardDate: '2026-06-15',
    status: 'approved' as const,
    remark: '材料齐全，审核通过',
  },
  {
    name: '刘志强',
    phone: '13544445555',
    email: 'liuzq@example.com',
    idCard: '510101199111255678',
    position: '测试工程师',
    department: '技术部',
    onboardDate: '2026-06-25',
    status: 'pending' as const,
    remark: '校招，应届生',
  },
  {
    name: '赵雅文',
    phone: '13466667777',
    email: 'zhaoyw@example.com',
    idCard: '330101199307082345',
    position: '人事专员',
    department: '人力资源部',
    onboardDate: '2026-06-19',
    status: 'submitted' as const,
    remark: '',
  },
];

export const EXCEL_TEMPLATE_COLUMNS = [
  { key: 'name', label: '姓名', required: true, example: '张三' },
  { key: 'phone', label: '手机号', required: true, example: '13800138000' },
  { key: 'email', label: '邮箱', required: false, example: 'zhangsan@company.com' },
  { key: 'idCard', label: '身份证号', required: true, example: '110101199001011234' },
  { key: 'position', label: '职位', required: true, example: '前端开发工程师' },
  { key: 'department', label: '部门', required: true, example: '技术部' },
  { key: 'onboardDate', label: '入职日期', required: true, example: '2026-06-30' },
  { key: 'remark', label: '备注', required: false, example: '校招/社招等说明' },
];

export const STATUS_LABELS = EMPLOYEE_STATUS_LABELS;
export const STATUS_COLORS = EMPLOYEE_STATUS_COLORS;
