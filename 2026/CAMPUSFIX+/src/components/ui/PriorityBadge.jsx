/**
 * PriorityBadge — renders a complaint priority using PRIORITY_META colours.
 *
 * Props:
 *   priority : string  (PRIORITIES constant)
 *   size     : 'sm' | 'md'
 */
import React from 'react';
import { PRIORITY_META } from '../../constants/priorities';
import * as Icons from 'lucide-react';

export default function PriorityBadge({ priority, size = 'md' }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;

  const IconComponent = Icons[meta.icon];

  return (
    <span
      className={[
        'badge-base',
        meta.bg,
        meta.text,
        meta.ring,
        size === 'sm' ? 'text-[11px] px-2 py-0' : '',
      ].join(' ')}
      aria-label={`Priority: ${meta.label}`}
    >
      {IconComponent && <IconComponent size={size === 'sm' ? 11 : 12} aria-hidden="true" />}
      {meta.label}
    </span>
  );
}
