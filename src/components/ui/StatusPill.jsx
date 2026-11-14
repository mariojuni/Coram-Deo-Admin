import React from 'react';

/**
 * StatusPill — Visual pill matching CoramDeo Mobile date badges,
 * category eyebrows, and status chips.
 */
export default function StatusPill({
  children,
  variant = 'glass',
  dot = false,
  className = '',
  icon: Icon,
}) {
  const variantClasses = {
    navy: 'bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]',
    steel: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    rose: 'bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]',
    violet: 'bg-slate-100 text-[#4F748E] border border-slate-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    glass: 'glass-light-pill text-[#2C4A60] font-bold shadow-2xs',
  }[variant] || 'glass-light-pill text-[#2C4A60] font-bold shadow-2xs';

  const dotClasses = {
    navy: 'bg-[#2C4A60]',
    steel: 'bg-[#2C4A60]',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-[#2C4A60]',
    violet: 'bg-[#4F748E]',
    slate: 'bg-slate-500',
    glass: 'bg-[#2C4A60]',
  }[variant] || 'bg-[#2C4A60]';

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
