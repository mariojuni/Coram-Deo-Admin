import React from 'react';

/**
 * SoftCard — Web equivalent of CoramDeo Mobile's SoftCard.
 * Clean white background, hairline border, soft ambient elevation, rounded-[20px].
 */
export default function SoftCard({ children, className = '', hover = false, onClick, ...rest }) {
  return (
    <div
      onClick={onClick}
      className={`
        glass-light-card rounded-2xl md:rounded-[24px]
        ${hover ? 'transition-all duration-200 hover:shadow-[0_16px_36px_-4px_rgba(44,74,96,0.10)] hover:border-white cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
