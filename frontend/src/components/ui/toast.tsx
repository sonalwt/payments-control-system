'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastCtx {
  toast: (t: Omit<Toast, 'id' | 'variant'> & { variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/60',
  error:   'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/60',
  default: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60',
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-green-600 dark:text-green-400',
  error:   'text-red-600 dark:text-red-400',
  default: 'text-blue-600 dark:text-blue-400',
};

const TITLE_STYLES: Record<ToastVariant, string> = {
  success: 'text-green-900 dark:text-green-100',
  error:   'text-red-900 dark:text-red-100',
  default: 'text-blue-900 dark:text-blue-100',
};

const DESC_STYLES: Record<ToastVariant, string> = {
  success: 'text-green-700 dark:text-green-300',
  error:   'text-red-700 dark:text-red-300',
  default: 'text-blue-700 dark:text-blue-300',
};

function ToastIcon({ variant }: { variant: ToastVariant }): React.ReactElement {
  const cls = cn('h-5 w-5 shrink-0', ICON_STYLES[variant]);
  if (variant === 'success') return <CheckCircle2 className={cls} />;
  if (variant === 'error')   return <XCircle className={cls} />;
  return <Info className={cls} />;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}): React.ReactElement {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-md transition-all duration-200',
        VARIANT_STYLES[toast.variant],
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
      )}
    >
      <ToastIcon variant={toast.variant} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', TITLE_STYLES[toast.variant])}>
          {toast.title}
        </p>
        {toast.description && (
          <p className={cn('mt-1 text-xs leading-relaxed break-words', DESC_STYLES[toast.variant])}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          'shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100',
          ICON_STYLES[toast.variant],
        )}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast: ToastCtx['toast'] = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const next: Toast = { id, variant: t.variant ?? 'default', ...t };
    setToasts((prev) => [...prev, next]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[22rem] flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
