/**
 * Checkbox — styled checkbox input.
 *
 * Props:
 *   label     : string — visible label text
 *   hint      : string — helper text below label
 *   error     : string — error text below
 *   ...rest   : forwarded to <input type="checkbox">
 */
import React from 'react';

export default function Checkbox({ label, hint, error, className = '', ...rest }) {
  const id = rest.id ?? `chk-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={id}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600
                     focus:ring-primary-500 focus:ring-offset-1 cursor-pointer"
          aria-invalid={!!error}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...rest}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-slate-700 cursor-pointer leading-5">
            {label}
          </label>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 ml-7 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 ml-7 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
