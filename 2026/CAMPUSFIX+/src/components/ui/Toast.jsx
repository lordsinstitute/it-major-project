/**
 * Toast — individual toast notification.
 * ToastContainer — renders the toast stack in the bottom-right corner.
 */
import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';

const TOAST_STYLES = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle, iconClass: 'text-green-500' },
  error:   { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   Icon: XCircle,     iconClass: 'text-red-500'   },
  info:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',  Icon: Info,        iconClass: 'text-blue-500'  },
  warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', Icon: AlertTriangle, iconClass: 'text-amber-500' },
};

function Toast({ id, type, message }) {
  const { dismiss } = useToast();
  const s = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-soft-lg',
        s.bg,
        s.text,
      ].join(' ')}
    >
      <s.Icon size={18} className={`shrink-0 mt-0.5 ${s.iconClass}`} aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => dismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 -mt-0.5 p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
