import React from 'react';

/**
 * StatusPill — Visual pill matching CoramDeo Mobile date badges,
 * category eyebrows, and status chips.
 */
export default function StatusPill({
  children,
  variant = 'rose',
  dot = false,
  className = '',
  icon: Icon,
}) {
  const variantClasses = {
    rose: 'bg-[#FFF0F5] text-[#FF577F] border border-[#FFE4EC]',
    amber: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    emerald: 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]',
    violet: 'bg-[#F5F3FF] text-[#B66DFF] border border-[#DDD6FE]',
    slate: 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]',
    glass: 'glass-pill text-white font-medium',
  }[variant] || 'bg-[#FFF0F5] text-[#FF577F] border border-[#FFE4EC]';

  const dotClasses = {
    rose: 'bg-[#FF577F]',
    amber: 'bg-[#D97706]',
    emerald: 'bg-[#10B981]',
    violet: 'bg-[#B66DFF]',
    slate: 'bg-[#6B7280]',
    glass: 'bg-white',
  }[variant] || 'bg-[#FF577F]';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 
        rounded-full text-xs font-semibold tracking-wide
        ${variantClasses} 
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />}
      {Icon && <Icon size={13} className="shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
