/**
 * ComingSoonBadge — marks any feature as not yet implemented.
 *
 * Props:
 *   label : string (default 'Coming Soon')
 */
import React from 'react';
import { Clock } from 'lucide-react';

export default function ComingSoonBadge({ label = 'Coming Soon' }) {
  return (
    <span className="coming-soon-badge" aria-label={label}>
      <Clock size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
