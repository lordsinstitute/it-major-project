/**
 * Avatar — user avatar with initials fallback.
 *
 * Props:
 *   name      : string — used for accessible label
 *   initials  : string — displayed when no image (max 2 chars)
 *   src       : string — image URL
 *   color     : string — Tailwind bg class (e.g. 'bg-indigo-500')
 *   size      : 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
import React from 'react';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export default function Avatar({ name, initials, src, color = 'bg-indigo-500', size = 'md', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0',
        SIZES[size] ?? SIZES.md,
        src ? '' : color,
        className,
      ].join(' ')}
      aria-label={name ?? initials}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span aria-hidden="true">{(initials ?? name?.slice(0, 2) ?? '?').toUpperCase()}</span>
      )}
    </span>
  );
}
