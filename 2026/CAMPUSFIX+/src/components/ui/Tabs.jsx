/**
 * Tabs — horizontal tab navigation.
 *
 * Props:
 *   tabs      : {id: string, label: string, badge?: number|string}[]
 *   active    : string — active tab id
 *   onChange  : (id: string) => void
 *   variant   : 'underline' | 'pills'  (default 'underline')
 */
import React from 'react';

export default function Tabs({ tabs = [], active, onChange, variant = 'underline', className = '' }) {
  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
              'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
              active === tab.id
                ? 'bg-primary-600 text-white shadow-soft-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
            ].join(' ')}
          >
            {tab.label}
            {tab.badge != null && (
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-semibold
                ${active === tab.id ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="flex gap-1" role="tablist" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150',
              'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
              active === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {tab.label}
            {tab.badge != null && (
              <span className={`ml-2 text-xs rounded-full px-2 py-0.5 font-semibold
                ${active === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
