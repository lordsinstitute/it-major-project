/**
 * Textarea — multiline text input.
 *
 * Props:
 *   error : string — shows red ring when truthy
 *   rows  : number (default 4)
 *   ...rest : forwarded to <textarea>
 */
import React from 'react';

export default function Textarea({ error, rows = 4, className = '', ...rest }) {
  return (
    <textarea
      rows={rows}
      className={[
        'input-base resize-y min-h-[80px]',
        error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
        className,
      ].join(' ')}
      aria-invalid={!!error}
      {...rest}
    />
  );
}
