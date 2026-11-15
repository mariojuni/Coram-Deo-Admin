import React, { useEffect, useRef, useCallback, useId } from 'react';
import { X } from 'lucide-react';

/**
 * CoramDeo Design System — Canonical Modal
 * 
 * Implements the Soft Glass & Calm Light aesthetic:
 * - Backdrop: Focused slate-950 with blur (bg-slate-950/50 backdrop-blur-md)
 * - Container: Crisp white luminous shell (bg-white / border-slate-200/80 / shadow-2xl / rounded-[28px])
 * - Header: Frosted white sticky header with branded Nordic steel icon badge, title, subtitle & close button
 * - Body: Gentle slate-50/50 canvas with smooth custom scrollbar
 * - Footer: Crisp sticky footer for Obsidian (#162533) primary action and white secondary actions
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
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;

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
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? ariaLabel : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-white rounded-2xl md:rounded-[28px]
          w-full ${maxWidthClass}
          flex flex-col max-h-[90vh] sm:max-h-[86vh]
          border border-slate-200/80
          shadow-[0_25px_70px_-15px_rgba(15,23,42,0.25)]
          overflow-hidden relative
          transition-all duration-200
          animate-in zoom-in-[0.98] duration-150
          ${className}
        `}
      >
        {/* Modal Header */}
        {(title || Icon || !hideCloseButton) && (
          <div
            className={`
              px-6 py-4.5 sm:px-7 sm:py-5
              bg-white
              border-b border-slate-100
              flex items-center justify-between
              shrink-0 select-none
              ${headerClassName}
            `}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              {Icon && (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC] flex items-center justify-center shadow-xs shrink-0">
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
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20"
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
            px-6 py-6 sm:px-7 sm:py-6
            bg-slate-50/50 custom-scrollbar
            ${bodyClassName}
          `}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`
              px-6 py-4 sm:px-7 sm:py-4.5
              bg-white
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
    <div className={`px-6 py-4.5 sm:px-7 sm:py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-7 sm:py-6 bg-slate-50/50 custom-scrollbar ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 sm:px-7 sm:py-4.5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
