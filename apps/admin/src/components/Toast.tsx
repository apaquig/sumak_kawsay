import { CheckCircle2, CircleAlert, TriangleAlert, X } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  text: string;
}

const STYLES: Record<ToastType, { boxClass: string; icon: ReactElement }> = {
  success: {
    boxClass: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />,
  },
  error: {
    boxClass: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <CircleAlert className="mt-0.5 shrink-0 text-rose-600" size={18} />,
  },
  warning: {
    boxClass: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <TriangleAlert className="mt-0.5 shrink-0 text-amber-600" size={18} />,
  },
};

const SUCCESS_DISMISS_MS = 4_500;

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.type !== 'success') return;
    const timer = setTimeout(() => onDismiss(toast.id), SUCCESS_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const style = STYLES[toast.type];

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-5 fade-in duration-300 ${style.boxClass}`}
      style={{ width: '320px', maxWidth: 'calc(100vw - 2rem)' }}
    >
      {style.icon}
      <p className="flex-1 leading-5 text-sm m-0 pr-1">{toast.text}</p>
      <button
        type="button"
        aria-label="Cerrar aviso"
        className="grid size-6 shrink-0 place-items-center rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-all -mr-1 -mt-1"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Pila de avisos flotantes, por encima del editor modal. */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
