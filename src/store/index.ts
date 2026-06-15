import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EmployeeStatus,
  MaterialStatus,
  ReminderType,
  ReminderChannel,
  AuditResult,
} from '@/types';
import type {
  Employee,
  MaterialTemplate,
  MaterialRecord,
  ReminderLog,
  AuditLogEntry,
  SupplementRecord,
  StatsData,
  ExpiryItem,
  DuplicateInfo,
} from '@/types';
import {
  generateId,
  generateToken,
  daysBetween,
  formatDate,
  generateSubmitLink,
  validateName,
  validatePhone,
  validateIdCard,
} from '@/utils';
import { DEFAULT_MATERIAL_TEMPLATES, SAMPLE_EMPLOYEES, STATUS_LABELS } from '@/utils/constants';

interface AppState {
  employees: Employee[];
  templates: MaterialTemplate[];
  materialTemplates: MaterialTemplate[];
  materialRecords: MaterialRecord[];
  reminderLogs: ReminderLog[];
  auditLogs: AuditLogEntry[];
  supplementRecords: SupplementRecord[];
  selectedEmployeeIds: string[];
  isInitialized: boolean;

  initData: () => void;
  resetAllData: () => void;

  addEmployee: (data: Partial<Employee>) => Employee;
  addEmployees: (dataList: Partial<Employee>[]) => Employee[];
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  deleteEmployees: (ids: string[]) => void;
  setExceptionNote: (employeeId: string, note: string) => void;
  getEmployeeByToken: (token: string) => Employee | undefined;
  checkDuplicate: (data: Partial<Employee>, excludeId?: string) => DuplicateInfo;

  addTemplate: (data: Partial<MaterialTemplate>) => void;
  updateTemplate: (id: string, data: Partial<MaterialTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateActive: (id: string) => void;

  submitMaterialFile: (
    employeeId: string,
    templateId: string,
    fileData: {
      fileName: string;
      fileSize: number;
      fileType?: string;
      fileData?: string;
      expiryDate?: Date;
      submittedAt?: Date;
    },
  ) => void;
  auditMaterial: (
    recordId: string,
    action: 'approve' | 'reject',
    comment?: string,
  ) => void;
  getEmployeeMaterialRecords: (employeeId: string) => MaterialRecord[];
  getEmployeeMissingMaterials: (employeeId: string) => MaterialTemplate[];
  getEmployeeRejectedMaterials: (employeeId: string) => MaterialRecord[];

  sendReminder: (employeeId: string, type: ReminderType) => Promise<number>;
  sendBatchReminders: (employeeIds: string[], type: ReminderType) => Promise<number>;

  toggleSelectEmployee: (id: string) => void;
  selectAllEmployees: (ids: string[]) => void;
  clearSelectedEmployees: () => void;

  updateEmployeeStatus: (id: string) => void;
  checkMaterialExpiry: () => ExpiryItem[];
  getStatistics: () => StatsData;
}

const createMaterialRecordsForEmployee = (
  employeeId: string,
  templates: MaterialTemplate[],
): MaterialRecord[] => {
  const now = new Date();
  return templates
    .filter((t) => t.active)
    .map((template) => {
      let expiryDate: Date | undefined = undefined;
      if (template.hasExpiry && template.validityDays) {
        expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + template.validityDays);
      }
      return {
        id: generateId(),
        employeeId,
        templateId: template.id,
        templateName: template.name,
        required: template.required,
        status: MaterialStatus.PENDING,
        expiryDate,
        auditLogs: [],
        supplementHistory: [],
      };
    });
};

const calcEmployeeStatus = (records: MaterialRecord[]): EmployeeStatus => {
  const requiredRecords = records.filter((r) => r.required);
  if (requiredRecords.length === 0) return EmployeeStatus.PENDING;

  const allApproved = requiredRecords.every(
    (r) => r.status === MaterialStatus.APPROVED || r.status === MaterialStatus.EXPIRING,
  );
  if (allApproved) return EmployeeStatus.APPROVED;

  const hasRejected = requiredRecords.some((r) => r.status === MaterialStatus.REJECTED);
  if (hasRejected) return EmployeeStatus.REJECTED;

  const hasSubmitted = records.some(
    (r) => r.status !== MaterialStatus.PENDING && r.status !== MaterialStatus.APPROVED,
  );
  if (hasSubmitted) return EmployeeStatus.REVIEWING;

  return EmployeeStatus.PENDING;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      employees: [],
      templates: [],
      materialTemplates: [],
      materialRecords: [],
      reminderLogs: [],
      auditLogs: [],
      supplementRecords: [],
      selectedEmployeeIds: [],
      isInitialized: false,

      initData: () => {
        if (get().isInitialized && get().employees.length > 0) return;

        const now = new Date();
        const templates: MaterialTemplate[] = DEFAULT_MATERIAL_TEMPLATES.map((t, idx) => ({
          id: generateId(),
          name: t.name,
          description: t.description,
          required: t.required,
          hasExpiry: t.needExpiryCheck,
          validityDays: t.validDays || undefined,
          acceptFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          sortOrder: t.sortOrder || idx + 1,
          active: true,
          createdAt: now,
        }));

        const employees: Employee[] = [];
        const allMaterialRecords: MaterialRecord[] = [];

        SAMPLE_EMPLOYEES.forEach((sample) => {
          const empId = generateId();
          const token = generateToken();

          const expectedDate = (sample as any).expectedDate || sample.onboardDate
            ? new Date((sample as any).expectedDate || sample.onboardDate)
            : new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000);

          const records = createMaterialRecordsForEmployee(empId, templates);

          if (sample.status === EmployeeStatus.APPROVED) {
            records.forEach((r) => {
              if (r.required) {
                r.status = MaterialStatus.APPROVED;
                r.fileName = `${sample.name}_${r.templateName}.pdf`;
                r.fileSize = Math.floor(Math.random() * 500000) + 50000;
                r.submittedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);
                r.auditLogs = [
                  {
                    id: generateId(),
                    result: AuditResult.APPROVED,
                    comment: '材料完整清晰，审核通过',
                    auditor: '人事专员',
                    auditedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                  },
                ];
              }
            });
          } else if ((sample as any).status === 'rejected' || sample.status === EmployeeStatus.REJECTED) {
            records.forEach((r, i) => {
              if (r.required) {
                r.fileName = `${sample.name}_${r.templateName}.pdf`;
                r.fileSize = Math.floor(Math.random() * 500000) + 50000;
                r.submittedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);
                if (i === 0) {
                  r.status = MaterialStatus.REJECTED;
                  r.auditLogs = [
                    {
                      id: generateId(),
                      result: AuditResult.REJECTED,
                      comment: sample.remark || '材料不清晰，请重新上传',
                      auditor: '人事专员',
                      auditedAt: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000),
                    },
                  ];
                } else {
                  r.status = MaterialStatus.APPROVED;
                  r.auditLogs = [
                    {
                      id: generateId(),
                      result: AuditResult.APPROVED,
                      auditor: '人事专员',
                      auditedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                    },
                  ];
                }
              }
            });
          } else if ((sample as any).status === 'submitted' || (sample as any).status === EmployeeStatus.SUBMITTED || (sample as any).status === EmployeeStatus.REVIEWING) {
            records.forEach((r, i) => {
              if (r.required) {
                if (i < records.length - 1) {
                  r.status = MaterialStatus.SUBMITTED;
                  r.fileName = `${sample.name}_${r.templateName}.pdf`;
                  r.fileSize = Math.floor(Math.random() * 500000) + 50000;
                  r.submittedAt = new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000);
                }
              }
            });
          }

          const empStatus = calcEmployeeStatus(records);

          const employee: Employee = {
            id: empId,
            submitToken: token,
            name: sample.name,
            phone: sample.phone,
            email: sample.email,
            idCard: sample.idCard,
            position: sample.position,
            department: sample.department,
            expectedDate,
            remark: sample.remark,
            status: empStatus,
            createdAt: now,
            updatedAt: now,
            materialRecords: records,
          };

          employees.push(employee);
          allMaterialRecords.push(...records);
        });

        employees.forEach((emp) => {
          emp.status = calcEmployeeStatus(emp.materialRecords);
        });

        set({
          employees,
          templates,
          materialTemplates: templates,
          materialRecords: allMaterialRecords,
          isInitialized: true,
        });
      },

      resetAllData: () => {
        set({
          employees: [],
          templates: [],
          materialTemplates: [],
          materialRecords: [],
          reminderLogs: [],
          auditLogs: [],
          supplementRecords: [],
          selectedEmployeeIds: [],
          isInitialized: false,
        });
        localStorage.removeItem('onboarding-materials-store');
      },

      addEmployee: (data) => {
        const { templates, employees } = get();
        const empId = generateId();
        const token = generateToken();
        const now = new Date();

        const records = createMaterialRecordsForEmployee(empId, templates);

        const rawDate = (data as any).onboardDate ?? data.expectedDate;
        const parsedDate = rawDate ? new Date(rawDate) : new Date();

        const newEmployee: Employee = {
          id: empId,
          submitToken: token,
          name: data.name || '',
          phone: data.phone || '',
          email: data.email,
          idCard: data.idCard,
          position: data.position || '',
          department: data.department || '',
          expectedDate: parsedDate,
          onboardDate: parsedDate,
          remark: data.remark,
          exceptionNote: data.exceptionNote,
          status: EmployeeStatus.PENDING,
          createdAt: now,
          updatedAt: now,
          materialRecords: records,
        };

        set({
          employees: [...employees, newEmployee],
          materialRecords: [...get().materialRecords, ...records],
        });

        return newEmployee;
      },

      addEmployees: (dataList) => {
        const { templates } = get();
        const now = new Date();
        const newEmployees: Employee[] = [];
        const newRecords: MaterialRecord[] = [];

        dataList.forEach((data) => {
          const empId = generateId();
          const token = generateToken();
          const records = createMaterialRecordsForEmployee(empId, templates);

          const rawDate = (data as any).onboardDate ?? data.expectedDate;
          const parsedDate = rawDate ? new Date(rawDate) : new Date();

          const newEmployee: Employee = {
            id: empId,
            submitToken: token,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email,
            idCard: data.idCard,
            position: data.position || '',
            department: data.department || '',
            expectedDate: parsedDate,
            onboardDate: parsedDate,
            remark: data.remark,
            exceptionNote: data.exceptionNote,
            status: EmployeeStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            materialRecords: records,
          };

          newEmployees.push(newEmployee);
          newRecords.push(...records);
        });

        set({
          employees: [...get().employees, ...newEmployees],
          materialRecords: [...get().materialRecords, ...newRecords],
        });

        return newEmployees;
      },

      updateEmployee: (id, data) => {
        const { employees } = get();
        set({
          employees: employees.map((emp) =>
            emp.id === id ? { ...emp, ...data, updatedAt: new Date() } : emp,
          ),
        });
      },

      deleteEmployee: (id) => {
        const { employees, materialRecords, reminderLogs, supplementRecords } = get();
        set({
          employees: employees.filter((e) => e.id !== id),
          materialRecords: materialRecords.filter((r) => r.employeeId !== id),
          reminderLogs: reminderLogs.filter((l) => l.employeeId !== id),
          supplementRecords: supplementRecords.filter((r) => r.employeeId !== id),
          selectedEmployeeIds: get().selectedEmployeeIds.filter((eid) => eid !== id),
        });
      },

      deleteEmployees: (ids) => {
        const { employees, materialRecords, reminderLogs, supplementRecords } = get();
        set({
          employees: employees.filter((e) => !ids.includes(e.id)),
          materialRecords: materialRecords.filter((r) => !ids.includes(r.employeeId)),
          reminderLogs: reminderLogs.filter((l) => !ids.includes(l.employeeId)),
          supplementRecords: supplementRecords.filter((r) => !ids.includes(r.employeeId)),
          selectedEmployeeIds: get().selectedEmployeeIds.filter((id) => !ids.includes(id)),
        });
      },

      setExceptionNote: (employeeId, note) => {
        get().updateEmployee(employeeId, { exceptionNote: note });
      },

      getEmployeeByToken: (token) => {
        return get().employees.find((e) => e.submitToken === token);
      },

      checkDuplicate: (data, excludeId) => {
        const { employees } = get();
        const result: DuplicateInfo = { byNamePhone: [], byIdCard: [] };

        if (!data.name || !data.phone) return result;

        employees
          .filter((e) => !excludeId || e.id !== excludeId)
          .forEach((emp) => {
            if (
              emp.name === data.name &&
              emp.phone === data.phone
            ) {
              result.byNamePhone.push(emp);
            }
            if (data.idCard && emp.idCard === data.idCard) {
              result.byIdCard.push(emp);
            }
          });

        return result;
      },

      addTemplate: (data) => {
        const now = new Date();
        const template: MaterialTemplate = {
          id: generateId(),
          name: data.name || '新材料',
          description: data.description,
          required: data.required ?? true,
          hasExpiry: data.hasExpiry ?? false,
          validityDays: data.validityDays,
          acceptFormats: data.acceptFormats || ['.pdf', '.jpg', '.jpeg', '.png'],
          sortOrder: data.sortOrder || get().templates.length + 1,
          active: true,
          createdAt: now,
        };

        const newTemplates = [...get().templates, template];

        if (template.active) {
          const { employees } = get();
          const newRecords: MaterialRecord[] = [];
          employees.forEach((emp) => {
            if (!emp.materialRecords.find((r) => r.templateId === template.id)) {
              let expiryDate: Date | undefined = undefined;
              if (template.hasExpiry && template.validityDays) {
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + template.validityDays);
              }
              newRecords.push({
                id: generateId(),
                employeeId: emp.id,
                templateId: template.id,
                templateName: template.name,
                required: template.required,
                status: MaterialStatus.PENDING,
                expiryDate,
                auditLogs: [],
              });
              emp.materialRecords.push(newRecords[newRecords.length - 1]);
            }
          });
          set({
            templates: newTemplates,
            materialTemplates: newTemplates,
            employees: [...employees],
            materialRecords: [...get().materialRecords, ...newRecords],
          });
        } else {
          set({ templates: newTemplates, materialTemplates: newTemplates });
        }
      },

      updateTemplate: (id, data) => {
        const newTemplates = get().templates.map((t) =>
          t.id === id ? { ...t, ...data } : t,
        );
        set({ templates: newTemplates, materialTemplates: newTemplates });
      },

      deleteTemplate: (id) => {
        const { templates, employees, materialRecords } = get();
        set({
          templates: templates.filter((t) => t.id !== id),
          materialTemplates: templates.filter((t) => t.id !== id),
          materialRecords: materialRecords.filter((r) => r.templateId !== id),
          employees: employees.map((emp) => ({
            ...emp,
            materialRecords: emp.materialRecords.filter((r) => r.templateId !== id),
          })),
        });
        get().employees.forEach((emp) => {
          get().updateEmployeeStatus(emp.id);
        });
      },

      toggleTemplateActive: (id) => {
        const { templates } = get();
        const t = templates.find((tmpl) => tmpl.id === id);
        if (t) {
          get().updateTemplate(id, { active: !t.active });
        }
      },

      submitMaterialFile: (employeeId, templateId, fileData) => {
        const { employees } = get();
        const emp = employees.find((e) => e.id === employeeId);
        if (!emp) return;

        const record = emp.materialRecords.find((r) => r.templateId === templateId);
        if (!record) return;

        let wasRejected = false;
        let originalFileName = record.fileName || '';
        if (record.status === MaterialStatus.REJECTED && record.fileName) {
          wasRejected = true;
          originalFileName = record.fileName;
        }

        const newAuditLogs = record.status === MaterialStatus.REJECTED ? record.auditLogs : record.auditLogs;

        Object.assign(record, {
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          fileType: fileData.fileType,
          fileData: fileData.fileData,
          submittedAt: fileData.submittedAt || new Date(),
          expiryDate: fileData.expiryDate || record.expiryDate,
          status: MaterialStatus.SUBMITTED,
          auditLogs: newAuditLogs,
        });

        if (wasRejected && originalFileName) {
          const supp: SupplementRecord = {
            id: generateId(),
            employeeId,
            materialRecordId: record.id,
            originalFileName,
            newFileName: fileData.fileName,
            submittedAt: new Date(),
          };
          if (!record.supplementHistory) record.supplementHistory = [];
          record.supplementHistory.push(supp);
          set({ supplementRecords: [...get().supplementRecords, supp] });
        }

        get().updateEmployeeStatus(employeeId);

        set({ employees: [...employees] });
      },

      auditMaterial: (recordId, action, comment) => {
        const { employees } = get();
        for (const emp of employees) {
          const record = emp.materialRecords.find((r) => r.id === recordId);
          if (record) {
            const auditEntry: AuditLogEntry = {
              id: generateId(),
              result: action === 'approve' ? AuditResult.APPROVED : AuditResult.REJECTED,
              comment,
              auditor: '人事专员',
              auditedAt: new Date(),
            };

            if (!record.auditLogs) record.auditLogs = [];
            record.auditLogs.push(auditEntry);
            record.status = action === 'approve' ? MaterialStatus.APPROVED : MaterialStatus.REJECTED;

            get().updateEmployeeStatus(emp.id);
            set({ employees: [...employees] });
            return;
          }
        }
      },

      getEmployeeMaterialRecords: (employeeId) => {
        const emp = get().employees.find((e) => e.id === employeeId);
        if (!emp) return [];
        return [...emp.materialRecords].sort((a, b) => {
          const aTemplate = get().templates.find((t) => t.id === a.templateId);
          const bTemplate = get().templates.find((t) => t.id === b.templateId);
          return (aTemplate?.sortOrder || 0) - (bTemplate?.sortOrder || 0);
        });
      },

      getEmployeeMissingMaterials: (employeeId) => {
        const emp = get().employees.find((e) => e.id === employeeId);
        if (!emp) return [];
        const missingTemplateIds = emp.materialRecords
          .filter(
            (r) =>
              r.required &&
              (r.status === MaterialStatus.PENDING ||
                r.status === MaterialStatus.REJECTED),
          )
          .map((r) => r.templateId);
        return get().templates.filter((t) => missingTemplateIds.includes(t.id));
      },

      getEmployeeRejectedMaterials: (employeeId) => {
        const emp = get().employees.find((e) => e.id === employeeId);
        if (!emp) return [];
        return emp.materialRecords.filter((r) => r.status === MaterialStatus.REJECTED);
      },

      sendReminder: async (employeeId, type) => {
        const { employees, reminderLogs } = get();
        const emp = employees.find((e) => e.id === employeeId);
        if (!emp) return 0;

        const missing = get().getEmployeeMissingMaterials(employeeId);
        const rejected = get().getEmployeeRejectedMaterials(employeeId);
        const submitLink = generateSubmitLink(emp.submitToken);

        let content = `【入职材料提醒】${emp.name}您好，`;
        if (rejected.length > 0) {
          content += `您以下材料未通过审核，请修改后重新提交：${rejected
            .map((r) => r.templateName)
            .join('、')}。`;
        }
        if (missing.length > 0) {
          content += `还需提交以下材料：${missing.map((m) => m.name).join('、')}。`;
        }
        if (type === ReminderType.EXPIRING) {
          content += `部分证件即将到期，请及时续期并重新上传。`;
        }
        if (type === ReminderType.APPROVED) {
          content = `【入职材料通过】${emp.name}您好，您的入职材料已全部审核通过，请等待后续入职安排。`;
        }
        content += `提交链接：${submitLink}`;

        const log: ReminderLog = {
          id: generateId(),
          employeeId,
          type,
          content,
          channel: ReminderChannel.COPY,
          sentAt: new Date(),
          success: true,
          operator: '人事专员',
        };

        set({ reminderLogs: [...reminderLogs, log] });
        return 1;
      },

      sendBatchReminders: async (employeeIds, type) => {
        let count = 0;
        for (const id of employeeIds) {
          count += await get().sendReminder(id, type);
        }
        return count;
      },

      toggleSelectEmployee: (id) => {
        const { selectedEmployeeIds } = get();
        if (selectedEmployeeIds.includes(id)) {
          set({ selectedEmployeeIds: selectedEmployeeIds.filter((e) => e !== id) });
        } else {
          set({ selectedEmployeeIds: [...selectedEmployeeIds, id] });
        }
      },

      selectAllEmployees: (ids) => {
        set({ selectedEmployeeIds: ids });
      },

      clearSelectedEmployees: () => {
        set({ selectedEmployeeIds: [] });
      },

      updateEmployeeStatus: (id) => {
        const { employees } = get();
        const idx = employees.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const emp = employees[idx];
        const newStatus = calcEmployeeStatus(emp.materialRecords);
        if (newStatus !== emp.status) {
          emp.status = newStatus;
          emp.updatedAt = new Date();
          set({ employees: [...employees] });
        }
      },

      checkMaterialExpiry: () => {
        const { employees } = get();
        const result: ExpiryItem[] = [];
        const now = new Date();

        employees.forEach((emp) => {
          emp.materialRecords.forEach((mat) => {
            if (mat.expiryDate && mat.status === MaterialStatus.APPROVED) {
              const days = daysBetween(now, mat.expiryDate);
              if (days <= 30) {
                result.push({
                  employee: emp,
                  material: mat,
                  daysLeft: days,
                });
              }
            }
          });
        });

        return result.sort((a, b) => a.daysLeft - b.daysLeft);
      },

      getStatistics: () => {
        const { employees, materialRecords, templates } = get();
        const expiring = get().checkMaterialExpiry();

        let approved = 0,
          rejected = 0,
          pending = 0,
          reviewing = 0,
          submitted = 0;

        employees.forEach((emp) => {
          switch (emp.status) {
            case EmployeeStatus.APPROVED:
              approved++;
              break;
            case EmployeeStatus.REJECTED:
              rejected++;
              break;
            case EmployeeStatus.REVIEWING:
              reviewing++;
              submitted++;
              break;
            case EmployeeStatus.SUBMITTED:
              submitted++;
              reviewing++;
              break;
            case EmployeeStatus.PENDING:
            default:
              pending++;
              break;
          }
        });

        let materialsApproved = 0,
          materialsMissing = 0,
          materialsPending = 0,
          materialsRejected = 0,
          materialsExpiring = 0;

        materialRecords.forEach((mat) => {
          switch (mat.status) {
            case MaterialStatus.APPROVED:
            case MaterialStatus.EXPIRING:
              materialsApproved++;
              break;
            case MaterialStatus.SUBMITTED:
              materialsPending++;
              break;
            case MaterialStatus.REJECTED:
              materialsRejected++;
              break;
            case MaterialStatus.PENDING:
            default:
              materialsMissing++;
              break;
          }
        });

        materialsExpiring = expiring.length;
        const total = employees.length;
        const requiredCount = materialRecords.filter((m) => m.required).length;
        const requiredApproved = materialRecords.filter(
          (m) => m.required && m.status === MaterialStatus.APPROVED,
        ).length;
        const completionRate =
          requiredCount > 0 ? Math.round((requiredApproved / requiredCount) * 100) : 0;

        return {
          total,
          totalEmployees: total,
          approved,
          approvedCount: approved,
          rejected,
          supplementCount: rejected,
          pending,
          pendingCount: pending,
          reviewing,
          submittedCount: submitted,
          completionRate,
          materialsTotal: materialRecords.length,
          materialsApproved,
          materialsMissing,
          materialsPending,
          materialsRejected,
          materialsExpiring,
          expiringSoon: materialsExpiring,
          expiringList: expiring,
        };
      },
    }),
    {
      name: 'onboarding-materials-store',
      version: 1,
      partialize: (state) => ({
        employees: state.employees,
        templates: state.templates,
        materialTemplates: state.materialTemplates,
        materialRecords: state.materialRecords,
        reminderLogs: state.reminderLogs,
        auditLogs: state.auditLogs,
        supplementRecords: state.supplementRecords,
        selectedEmployeeIds: state.selectedEmployeeIds,
        isInitialized: state.isInitialized,
      }),
    },
  ),
);
