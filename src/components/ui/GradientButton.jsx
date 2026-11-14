import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * GradientButton — Web equivalent of CoramDeo Mobile's Atmospheric & Gradient Buttons.
 * Supports primary (Atmospheric Navy-Steel), accent (Gold/Amber), and verse (Rose/Purple) variants.
 */
export default function GradientButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className = '',
  ...rest
}) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs font-bold rounded-xl',
    md: 'h-10 px-5 text-xs font-bold rounded-2xl',
    lg: 'h-12 px-7 text-sm font-bold rounded-2xl',
  }[size] || 'h-10 px-5 text-xs font-bold rounded-2xl';

  const variantClasses = {
    primary: 'bg-[#162533] hover:bg-[#1E2E3D] text-white shadow-sm',
    atmospheric: 'bg-gradient-coram text-white shadow-sm',
    steel: 'bg-[#2C4A60] hover:bg-[#1D3547] text-white shadow-sm',
    glass: 'glass-light-pill text-[#2C4A60] hover:bg-white shadow-2xs',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm',
    verse: 'bg-gradient-verse text-white shadow-sm',
  }[variant] || 'bg-[#162533] hover:bg-[#1E2E3D] text-white shadow-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        ${variantClasses}
        hover:opacity-95 active:scale-[0.98] transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none
        ${sizeClasses}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin text-white" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">{children}</span>
        </>
      )}
    </button>
  );
}
