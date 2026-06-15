export enum EmployeeStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

export enum MaterialStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
}

export enum ReminderType {
  FIRST = 'first',
  FOLLOW_UP = 'urge',
  SUPPLEMENT = 'supplement',
  EXPIRING = 'expiry',
  APPROVED = 'approved',
}

export enum ReminderChannel {
  EMAIL = 'email',
  SMS = 'sms',
  LINK = 'link',
  COPY = 'copy',
}

export enum AuditResult {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface AuditLogEntry {
  id: string;
  result: AuditResult;
  comment?: string;
  auditor: string;
  auditedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idCard?: string;
  position: string;
  department: string;
  expectedDate: Date;
  onboardDate?: Date;
  status: EmployeeStatus;
  submitToken: string;
  remark?: string;
  exceptionNote?: string;
  createdAt: Date;
  updatedAt: Date;
  materialRecords: MaterialRecord[];
}

export interface MaterialTemplate {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  hasExpiry: boolean;
  validityDays?: number;
  acceptFormats?: string[];
  applicableDepartments?: string[];
  sortOrder: number;
  active: boolean;
  createdAt: Date;
}

export interface MaterialRecord {
  id: string;
  employeeId: string;
  templateId: string;
  templateName: string;
  required: boolean;
  status: MaterialStatus;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileData?: string;
  submittedAt?: Date;
  expiryDate?: Date;
  auditLogs?: AuditLogEntry[];
  supplementHistory?: SupplementRecord[];
}

export interface SupplementRecord {
  id: string;
  employeeId: string;
  materialRecordId: string;
  originalFileName: string;
  newFileName: string;
  reason?: string;
  submittedAt: Date;
}

export interface ReminderLog {
  id: string;
  employeeId: string;
  type: ReminderType;
  content: string;
  channel: ReminderChannel;
  sentAt: Date;
  success: boolean;
  operator: string;
}

export interface ExpiryItem {
  employee: Employee;
  material: MaterialRecord;
  daysLeft: number;
}

export interface StatsData {
  total: number;
  totalEmployees: number;
  approved: number;
  approvedCount: number;
  rejected: number;
  supplementCount: number;
  pending: number;
  pendingCount: number;
  reviewing: number;
  submittedCount: number;
  completionRate: number;
  materialsTotal: number;
  materialsApproved: number;
  materialsMissing: number;
  materialsPending: number;
  materialsRejected: number;
  materialsExpiring: number;
  expiringSoon: number;
  expiringList: ExpiryItem[];
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Partial<Employee>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface ColumnMapping {
  [key: string]: string | null;
}

export interface DuplicateInfo {
  byNamePhone: Employee[];
  byIdCard: Employee[];
}
