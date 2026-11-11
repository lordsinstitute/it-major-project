/**
 * Skeleton — loading placeholder.
 *
 * Props:
 *   className : string — use w-* h-* to size
 *   count     : number — render N skeletons in a column
 */
import React from 'react';

export default function Skeleton({ className = 'h-4 w-full', count = 1 }) {
  if (count === 1) {
    return <span className={`skeleton block ${className}`} aria-hidden="true" />;
  }
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`skeleton block ${className}`} />
      ))}
    </div>
  );
}
