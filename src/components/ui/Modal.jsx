import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * CoramDeo Design System — Canonical Modal
 * 
 * Implements the Soft Glass & Calm Light aesthetic:
 * - Backdrop: Atmospheric slate with blur (bg-slate-900/40 backdrop-blur-sm)
 * - Container: Frosted glass shell (glass-light-shell / border-white/95 / shadow-2xl)
 * - Header: Frosted sticky header with optional icon badge, title, subtitle & close button
 * - Body: Scrollable contained viewport with smooth scrolling
 * - Footer: Frosted sticky footer for primary (Obsidian #162533) and secondary actions
 * - Accessibility: Escape key listener, body scroll locking, click-outside handling, and ARIA attributes
 */

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  headerActions = null,
  hideCloseButton = false,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  ariaLabel,
}) {
  const modalRef = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  // Handle ESC key dismiss
  const handleKeyDown = useCallback((event) => {
    if (closeOnEsc && event.key === 'Escape') {
      event.stopPropagation();
      onClose?.();
    }
  }, [closeOnEsc, onClose]);

  // Lock body scroll and register keyboard listener when modal is mounted & open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES.md;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
      aria-label={!title ? ariaLabel : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`
          glass-light-shell rounded-2xl md:rounded-3xl
          w-full ${maxWidthClass}
          flex flex-col max-h-[92vh] sm:max-h-[88vh]
          border border-white/95 shadow-2xl
          overflow-hidden relative
          transition-all duration-200
          ${className}
        `}
      >
        {/* Modal Header */}
        {(title || Icon || !hideCloseButton) && (
          <div
            className={`
              px-5 py-4 sm:px-6 sm:py-4.5
              bg-white/85 backdrop-blur-md
              border-b border-slate-100
              flex items-center justify-between
              shrink-0 select-none
              ${headerClassName}
            `}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-[#EBF2F7] flex items-center justify-center text-[#2C4A60] border border-[#D5E3EC]/70 shadow-2xs shrink-0">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {title && (
                    <h2
                      id={titleId.current}
                      className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight"
                    >
                      {title}
                    </h2>
                  )}
                  {badge && <div className="shrink-0">{badge}</div>}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div
          className={`
            flex-1 overflow-y-auto overscroll-contain
            px-5 py-5 sm:px-6 sm:py-6
            ${bodyClassName}
          `}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`
              px-5 py-3.5 sm:px-6 sm:py-4
              bg-white/85 backdrop-blur-md
              border-t border-slate-100
              flex items-center justify-end gap-3
              shrink-0
              ${footerClassName}
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Optional Subcomponents for compound layout customization
 */
export function ModalHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-4.5 bg-white/85 backdrop-blur-md border-b border-slate-100 flex items-center justify-between shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-3.5 sm:px-6 sm:py-4 bg-white/85 backdrop-blur-md border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
