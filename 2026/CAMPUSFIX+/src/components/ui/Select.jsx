/**
 * Select — native dropdown.
 *
 * Props:
 *   options : {value: string, label: string}[]
 *   error   : string — shows red ring when truthy
 *   placeholder: string — first disabled option
 *   ...rest : forwarded to <select>
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ options = [], error, placeholder, className = '', ...rest }) {
  return (
    <div className="relative">
      <select
        className={[
          'input-base appearance-none pr-9',
          error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
          className,
        ].join(' ')}
        aria-invalid={!!error}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
