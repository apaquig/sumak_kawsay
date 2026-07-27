import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ show, title, message, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-950/45 px-4 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between border-b border-charcoal-950/10 px-5 py-4">
          <div className="flex items-center gap-2 text-charcoal-950">
            <AlertTriangle size={20} className="text-red-500" />
            <h5 className="font-bold text-lg leading-none">{title}</h5>
          </div>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md text-charcoal-800/40 hover:bg-charcoal-950/5 hover:text-charcoal-950 transition"
            aria-label="Cerrar"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-5 py-6">
          <p className="text-charcoal-800 leading-relaxed m-0 text-sm">{message}</p>
        </div>
        <footer className="flex items-center justify-end gap-3 bg-ivory-50/50 px-5 py-4 border-t border-charcoal-950/10">
          <button
            type="button"
            className="button-outline min-h-[2.35rem] !py-1.5"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button-primary !bg-red-600 hover:!bg-red-700 min-h-[2.35rem] !py-1.5"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </footer>
      </div>
    </div>
  );
}
