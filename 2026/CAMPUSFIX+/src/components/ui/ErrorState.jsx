/**
 * ErrorState — shown when a data fetch fails.
 *
 * Props:
 *   message : string
 *   onRetry : () => void (optional)
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="mb-4 text-red-400">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-semibold text-slate-700 mb-1">Unable to load data</h3>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
