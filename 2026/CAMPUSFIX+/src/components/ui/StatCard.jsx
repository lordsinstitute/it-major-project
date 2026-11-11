/**
 * StatCard — metric display card for dashboards.
 *
 * Props:
 *   title      : string
 *   value      : string | number
 *   subtitle   : string (optional)
 *   icon       : ReactNode
 *   iconColor  : string — Tailwind bg class
 *   trend      : {value: string, up: boolean} (optional)
 *   loading    : boolean
 */
import React from 'react';
import Skeleton from './Skeleton';

export default function StatCard({ title, value, subtitle, icon, iconColor = 'bg-primary-100', trend, loading = false }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <span className={`p-2.5 rounded-xl ${iconColor}`}>
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
          <div className="flex items-center gap-2">
            {trend && (
              <span className={`text-xs font-semibold ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
                {trend.up ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </>
      )}
    </div>
  );
}
