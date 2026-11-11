/**
 * Table — responsive sortable table.
 *
 * Props:
 *   columns : {key: string, label: string, sortable?: boolean, width?: string, render?: (row)=>ReactNode}[]
 *   data    : object[]
 *   sort    : {key: string, order: 'asc'|'desc'}
 *   onSort  : (key: string) => void
 *   loading : boolean
 *   emptyMessage: string
 */
import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Skeleton from './Skeleton';

export default function Table({
  columns = [],
  data = [],
  sort,
  onSort,
  loading = false,
  emptyMessage = 'No records found.',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`table-th ${col.width ?? ''} ${col.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}`}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={sort?.key === col.key ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <div className="inline-flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && (
                    <span className="text-slate-400" aria-hidden="true">
                      {sort?.key === col.key
                        ? sort.order === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                        : <ArrowUpDown size={13} />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="table-td">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="table-td">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
