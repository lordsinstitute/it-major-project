/**
 * Modal — accessible dialog with focus trap and Esc-to-close.
 *
 * Props:
 *   open       : boolean
 *   onClose    : () => void
 *   title      : string
 *   description: string (optional subtitle)
 *   size       : 'sm' | 'md' | 'lg' | 'xl'
 *   children   : ReactNode
 *   footer     : ReactNode (optional action area)
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ open, onClose, title, description, size = 'md', children, footer }) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  /* Trap focus inside the modal while open */
  useEffect(() => {
    if (!open) return;

    const el = dialogRef.current;
    const focusable = el?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEsc);
    first?.focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={[
          'relative w-full bg-white rounded-2xl shadow-soft-xl flex flex-col max-h-[90vh]',
          SIZE_MAP[size] ?? SIZE_MAP.md,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <p id="modal-description" className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                       hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary-500
                       focus-visible:ring-offset-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
