/**
 * Pagination — page navigation control.
 *
 * Props:
 *   page        : number (0-indexed, matching Spring Boot Page)
 *   totalPages  : number
 *   totalElements: number
 *   pageSize    : number
 *   onPageChange: (page: number) => void
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalElements, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  const btn = (label, targetPage, disabled = false, ariaLabel) => (
    <button
      key={`pg-${targetPage}-${label}`}
      onClick={() => !disabled && onPageChange(targetPage)}
      disabled={disabled}
      aria-label={ariaLabel ?? `Go to page ${targetPage + 1}`}
      aria-current={targetPage === page ? 'page' : undefined}
      className={[
        'h-8 min-w-[2rem] px-2.5 rounded-lg text-sm font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
        targetPage === page
          ? 'bg-primary-600 text-white'
          : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 py-2"
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{totalElements}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600
                     hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed
                     focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
                     transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {start > 0 && (
          <>
            {btn('1', 0)}
            {start > 1 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}
        {pages.map((p) => btn(String(p + 1), p))}
        {end < totalPages - 1 && (
          <>
            {end < totalPages - 2 && <span className="px-1 text-slate-400">…</span>}
            {btn(String(totalPages), totalPages - 1)}
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600
                     hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed
                     focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
                     transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
