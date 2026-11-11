/**
 * StatusBadge — renders a complaint status using STATUS_META colours.
 *
 * Props:
 *   status : string  (STATUSES constant)
 *   size   : 'sm' | 'md'
 *   showIcon: boolean (default true)
 */
import React from 'react';
import { STATUS_META } from '../../constants/statuses';
import * as Icons from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const meta = STATUS_META[status];
  if (!meta) return null;

  const IconComponent = showIcon ? Icons[meta.icon] : null;

  return (
    <span
      className={[
        'badge-base',
        meta.bg,
        meta.text,
        meta.ring,
        size === 'sm' ? 'text-[11px] px-2 py-0' : '',
      ].join(' ')}
      aria-label={`Status: ${meta.label}`}
    >
      {showIcon && IconComponent && (
        <IconComponent size={size === 'sm' ? 11 : 12} aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}
