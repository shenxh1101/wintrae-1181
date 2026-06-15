import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const actuallyOpen = open ?? isOpen ?? false;

  useEffect(() => {
    if (actuallyOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [actuallyOpen]);

  if (!actuallyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh] animate-scale-in',
          sizeClasses[size],
          className,
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
