/**
 * FormField — wraps any form control with label, hint text, and error display.
 *
 * Props:
 *   label    : string  — visible label
 *   required : boolean — adds asterisk
 *   hint     : string  — helper text below control
 *   error    : string  — validation error (shown in red)
 *   htmlFor  : string  — id of the linked control
 *   children : ReactNode — the form control
 */
import React from 'react';

export default function FormField({ label, required, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
