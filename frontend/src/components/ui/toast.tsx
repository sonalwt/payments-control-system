'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
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

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast: ToastCtx['toast'] = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const next: Toast = { id, variant: t.variant ?? 'default', ...t };
    setToasts((prev) => [...prev, next]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-96 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-md border bg-background p-4 shadow-lg',
              t.variant === 'success' && 'border-green-500/50',
              t.variant === 'error' && 'border-destructive/60',
            )}
          >
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
