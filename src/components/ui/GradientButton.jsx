import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * GradientButton — Web equivalent of CoramDeo Mobile's PrimaryGradientButton.
 * Uses signature `#FF577F` -> `#B66DFF` gradient with pill corners and glow shadow.
 */
export default function GradientButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  size = 'md',
  className = '',
  ...rest
}) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs font-semibold rounded-full',
    md: 'h-11 px-6 text-sm font-bold rounded-full',
    lg: 'h-13 px-8 text-base font-bold rounded-full',
  }[size] || 'h-11 px-6 text-sm font-bold rounded-full';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        bg-gradient-coram text-white
        shadow-church-glow hover:opacity-95 
        active:scale-[0.98] transition-all duration-200
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
          {Icon && <Icon size={18} className="shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
