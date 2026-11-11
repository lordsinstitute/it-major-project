/**
 * Input — text input field.
 *
 * Props:
 *   error   : string  — shows red ring when truthy
 *   icon    : ReactNode — icon rendered inside left side
 *   ...rest : forwarded to <input>
 */
import React from 'react';

export default function Input({ error, icon, className = '', ...rest }) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={[
          'input-base',
          icon ? 'pl-9' : '',
          error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
          className,
        ].join(' ')}
        aria-invalid={!!error}
        {...rest}
      />
    </div>
  );
}
