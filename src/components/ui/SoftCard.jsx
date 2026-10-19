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
        bg-white rounded-2xl md:rounded-[20px] 
        border border-gray-100/80 
        shadow-church-soft 
        ${hover ? 'transition-all duration-200 hover:shadow-church-elevated hover:border-gray-200/80 cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
