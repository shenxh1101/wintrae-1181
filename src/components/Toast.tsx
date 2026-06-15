import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-success-50 border-success-200 text-success-700',
  error: 'bg-danger-50 border-danger-200 text-danger-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
};

const iconColors = {
  success: 'text-success-500',
  error: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
    warning: (msg) => showToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 min-w-80 max-w-sm px-4 py-3 rounded-lg border shadow-lg animate-slide-in-right',
                colors[toast.type],
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', iconColors[toast.type])} />
              <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-0.5 rounded hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
