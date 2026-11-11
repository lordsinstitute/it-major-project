/**
 * Button — primary interactive element.
 *
 * Props:
 *   variant   : 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'  (default 'primary')
 *   size      : 'xs' | 'sm' | 'md' | 'lg'  (default 'md')
 *   loading   : boolean — shows spinner and disables interaction
 *   icon      : ReactNode | Component — rendered before children
 *   iconLeft  : ReactNode | Component — alias for icon
 *   iconRight : ReactNode | Component — rendered after children
 *   fullWidth : boolean
 *   ...rest   : forwarded to <button>
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-soft-sm',
  secondary:
    'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-500 shadow-soft-sm',
  outline:
    'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-primary-500',
  ghost:
    'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-primary-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-soft-sm',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-base rounded-xl gap-2',
};

function renderIconElement(iconItem, size) {
  if (!iconItem) return null;
  const iconPx = size === 'lg' ? 18 : size === 'xs' ? 13 : 15;
  if (React.isValidElement(iconItem)) {
    return iconItem;
  }
  if (typeof iconItem === 'function' || (typeof iconItem === 'object' && iconItem !== null && '$$typeof' in iconItem)) {
    const IconComp = iconItem;
    return <IconComp size={iconPx} className="shrink-0" aria-hidden="true" />;
  }
  return iconItem;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconLeft,
  iconRight,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}) {
  const leftIcon = icon || iconLeft;

  return (
    <button
      className={[
        'btn-base',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 18 : 15} className="animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0 inline-flex items-center">
          {renderIconElement(leftIcon, size)}
        </span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && (
        <span className="shrink-0 inline-flex items-center">
          {renderIconElement(iconRight, size)}
        </span>
      )}
    </button>
  );
}
