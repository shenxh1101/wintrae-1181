import { cn } from '@/lib/utils';
import type { EmployeeStatus, MaterialStatus } from '@/types';
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_LABELS, MATERIAL_STATUS_COLORS, MATERIAL_STATUS_LABELS } from '@/utils/constants';

interface StatusBadgeProps {
  status: EmployeeStatus | MaterialStatus;
  type?: 'employee' | 'material';
  className?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, type = 'employee', className, showDot = true, size = 'md' }: StatusBadgeProps) {
  const colors = type === 'employee' ? EMPLOYEE_STATUS_COLORS : MATERIAL_STATUS_COLORS;
  const labels = type === 'employee' ? EMPLOYEE_STATUS_LABELS : MATERIAL_STATUS_LABELS;
  const colorSet = (colors as Record<string, any>)[status];
  const label = (labels as Record<string, any>)[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors',
        sizeClasses,
        colorSet?.bg,
        colorSet?.text,
        colorSet?.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', colorSet?.dot)} />}
      {label || String(status)}
    </span>
  );
}
