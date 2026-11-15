import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function ModernDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  className = '',
  searchable = false,
  allowCustom = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 288,
    openUpwards: false
  });

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  const updateCoords = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuEstimatedHeight = 240;
    const openUpwards = spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow;

    const availableHeight = openUpwards 
      ? Math.max(120, spaceAbove - 16) 
      : Math.max(120, spaceBelow - 16);
    const maxHeight = Math.min(288, availableHeight);

    const width = rect.width;
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    if (left < 8) left = 8;

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left,
      width,
      maxHeight,
      openUpwards
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(prev => !prev);
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const clickedTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Track position on scroll or window resize
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Focus search input
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-4 py-2 border rounded-2xl text-xs sm:text-sm focus:outline-none flex justify-between items-center transition-all bg-white font-bold ${
          isOpen 
            ? 'border-brand-primary ring-2 ring-brand-primary/20 text-brand-dark shadow-sm' 
            : 'border-slate-200/80 hover:border-slate-300 text-brand-dark hover:bg-slate-50/50'
        }`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-brand-dark font-bold'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            ...(coords.openUpwards ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 9999,
          }}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100 flex items-center bg-gray-50/70 shrink-0">
              <Search size={16} className="text-gray-400 ml-2 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-church-charcoal font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredOptions.length === 0 && (!allowCustom || !searchQuery) ? (
              <div className="px-4 py-3 text-xs sm:text-sm text-gray-500 italic text-center">
                {searchable && searchQuery ? 'No matching options' : 'No options available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 text-brand-primary font-bold' 
                          : 'text-brand-dark hover:bg-slate-50 font-medium'
                        }
                      `}
                    >
                      <span className="truncate pr-4">{opt.label}</span>
                      {isSelected && <Check size={15} className="text-brand-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
                {allowCustom && searchQuery && !options.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(`custom:${searchQuery}`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between transition-colors text-church-charcoal hover:bg-gray-50 font-medium"
                  >
                    <span className="truncate pr-4">Use "{searchQuery}"</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
