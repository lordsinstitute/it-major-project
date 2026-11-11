/**
 * Card — elevated surface container.
 *
 * Props:
 *   padding  : 'none' | 'sm' | 'md' | 'lg'  (default 'md')
 *   hover    : boolean — adds hover lift effect
 *   className: string
 */
import React from 'react';

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ padding = 'md', hover = false, className = '', children, ...rest }) {
  return (
    <div
      className={[
        'card',
        PADDING[padding] ?? PADDING.md,
        hover ? 'transition-shadow duration-200 hover:shadow-soft-lg cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
