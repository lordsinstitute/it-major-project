/**
 * Tooltip — hover/focus tooltip wrapper.
 *
 * Props:
 *   content  : string | ReactNode — tooltip text
 *   position : 'top' | 'bottom' | 'left' | 'right'  (default 'top')
 *   children : ReactNode — the trigger element
 */
import React, { useState } from 'react';

const POS = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({ content, position = 'top', children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          className={[
            'absolute z-50 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg',
            'whitespace-nowrap pointer-events-none shadow-soft-lg',
            POS[position] ?? POS.top,
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
}
