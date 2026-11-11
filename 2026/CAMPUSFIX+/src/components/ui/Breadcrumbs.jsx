/**
 * Breadcrumbs — standalone breadcrumb navigation.
 *
 * Props:
 *   items : {label: string, href?: string}[]
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
        <li>
          <Link to="/" aria-label="Home" className="hover:text-slate-600 transition-colors">
            <Home size={14} />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight size={14} aria-hidden="true" />
            {item.href ? (
              <Link to={item.href} className="hover:text-slate-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
