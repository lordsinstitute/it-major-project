/**
 * Badge — generic coloured label.
 *
 * Props:
 *   color   : 'slate'|'indigo'|'teal'|'green'|'yellow'|'orange'|'red'|'blue'|'amber'|'violet'|'pink'
 *   variant : 'neutral'|'primary'|'success'|'warning'|'danger'|'info' (alias for color)
 *   size    : 'sm' | 'md'
 *   dot     : boolean — render a coloured dot
 */
import React from 'react';

const VARIANT_MAP = {
  neutral: 'slate',
  primary: 'indigo',
  success: 'green',
  warning: 'amber',
  danger: 'red',
  info: 'blue',
  teal: 'teal',
};

const COLOR_MAP = {
  slate:  'bg-slate-100  text-slate-700  ring-slate-300',
  indigo: 'bg-indigo-50  text-indigo-700 ring-indigo-200',
  teal:   'bg-teal-50    text-teal-700   ring-teal-200',
  green:  'bg-green-50   text-green-700  ring-green-200',
  yellow: 'bg-yellow-50  text-yellow-700 ring-yellow-200',
  orange: 'bg-orange-50  text-orange-700 ring-orange-200',
  red:    'bg-red-50     text-red-700    ring-red-200',
  blue:   'bg-blue-50    text-blue-700   ring-blue-200',
  amber:  'bg-amber-50   text-amber-700  ring-amber-200',
  violet: 'bg-violet-50  text-violet-700 ring-violet-200',
  pink:   'bg-pink-50    text-pink-700   ring-pink-200',
};

const DOT_COLOR = {
  slate: 'bg-slate-400', indigo: 'bg-indigo-500', teal: 'bg-teal-500',
  green: 'bg-green-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500',
  red: 'bg-red-500', blue: 'bg-blue-500', amber: 'bg-amber-500',
  violet: 'bg-violet-500', pink: 'bg-pink-500',
};

export default function Badge({
  color,
  variant,
  size = 'md',
  dot = false,
  children,
  className = '',
}) {
  const resolvedColor = (variant && VARIANT_MAP[variant]) || color || 'slate';

  return (
    <span
      className={[
        'badge-base',
        COLOR_MAP[resolvedColor] ?? COLOR_MAP.slate,
        size === 'sm' ? 'text-[11px] px-2 py-0' : '',
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLOR[resolvedColor] ?? DOT_COLOR.slate}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
