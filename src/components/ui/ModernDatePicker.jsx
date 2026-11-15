import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ModernDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  
  const [coords, setCoords] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    openUpwards: false
  });

  // Track currently viewed month/year in the calendar
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      // Create date interpreting value as YYYY-MM-DD
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  });

  // Manage typed input state
  const [inputValue, setInputValue] = useState('');
  
  // Year picking mode state
  const [isYearPickingMode, setIsYearPickingMode] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() => new Date().getFullYear() - (new Date().getFullYear() % 12));

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const pickerEstimatedHeight = 360;
    const openUpwards = spaceBelow < pickerEstimatedHeight && spaceAbove > spaceBelow;

    const pickerWidth = 288; // w-72
    let left = rect.left;
    if (left + pickerWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - pickerWidth - 8);
    }
    if (left < 8) left = 8;

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left,
      openUpwards
    });
  };

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        setViewDate(d);
        setInputValue(d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
      } else {
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Handle clicking outside & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const inContainer = containerRef.current && containerRef.current.contains(event.target);
      const inPopup = popupRef.current && popupRef.current.contains(event.target);
      if (!inContainer && !inPopup) {
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

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleYearClick = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setIsYearPickingMode(false);
  };

  const handleSelect = (day) => {
    const yyyy = viewDate.getFullYear();
    const mm = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    
    if (onChange) {
      onChange({ target: { name, value: formatted } });
    }
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    const date = new Date(inputValue);
    if (!isNaN(date.getTime()) && inputValue.trim() !== '') {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      if (onChange) {
        onChange({ target: { name, value: `${yyyy}-${mm}-${dd}` } });
      }
      setViewDate(new Date(yyyy, date.getMonth(), 1));
    } else if (inputValue.trim() === '') {
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    } else {
      // Revert to original valid value
      if (value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          setInputValue(d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
        }
      }
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(prev => !prev);
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-left focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
      >
        <input
          type="text"
          name={name}
          disabled={disabled}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (!disabled) {
              updateCoords();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full block truncate text-xs sm:text-sm font-bold focus:outline-none bg-transparent ${inputValue ? 'text-brand-dark' : 'text-slate-400'}`}
        />
        <CalendarIcon onClick={handleToggle} size={18} className="text-slate-400 shrink-0 ml-2 cursor-pointer hover:text-brand-primary transition-colors" />
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popupRef}
          style={{
            position: 'fixed',
            ...(coords.openUpwards ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
            left: `${coords.left}px`,
            width: '288px',
            zIndex: 9999
          }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                if (isYearPickingMode) {
                  setYearPageStart(prev => prev - 12);
                } else {
                  handlePrevMonth(e);
                }
              }} 
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div 
              className="font-bold text-brand-dark text-sm flex items-center justify-center space-x-1 cursor-pointer hover:bg-slate-100 rounded-lg px-2 py-1 transition-colors" 
              onClick={() => {
                if (!isYearPickingMode) {
                  setYearPageStart(viewDate.getFullYear() - (viewDate.getFullYear() % 12));
                }
                setIsYearPickingMode(!isYearPickingMode);
              }}
            >
              {isYearPickingMode ? (
                <span>{yearPageStart} - {yearPageStart + 11}</span>
              ) : (
                <>
                  <span>{monthNames[viewDate.getMonth()]}</span>
                  <span>{viewDate.getFullYear()}</span>
                </>
              )}
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                if (isYearPickingMode) {
                  setYearPageStart(prev => prev + 12);
                } else {
                  handleNextMonth(e);
                }
              }} 
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {isYearPickingMode ? (
            <div className="grid grid-cols-3 gap-2 py-2 mb-2">
              {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearClick(year)}
                  className={`
                    py-2 w-full flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-colors
                    ${year === viewDate.getFullYear()
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-8" />;
                  }

                  let isSelected = false;
                  if (value) {
                    const parts = value.split('-');
                    if (parts.length === 3) {
                      const valYear = parseInt(parts[0]);
                      const valMonth = parseInt(parts[1]) - 1;
                      const valDay = parseInt(parts[2]);
                      
                      isSelected = 
                        valDay === day &&
                        valMonth === viewDate.getMonth() &&
                        valYear === viewDate.getFullYear();
                    }
                  }

                  const today = new Date();
                  const isToday = 
                    today.getDate() === day &&
                    today.getMonth() === viewDate.getMonth() &&
                    today.getFullYear() === viewDate.getFullYear();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelect(day)}
                      className={`
                        h-8 w-full flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-colors
                        ${isSelected 
                          ? 'bg-brand-primary text-white shadow-sm font-bold' 
                          : isToday 
                            ? 'text-brand-primary bg-blue-50 hover:bg-blue-100 font-bold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                if (onChange) {
                  onChange({ target: { name, value: `${yyyy}-${mm}-${dd}` } });
                }
                setIsOpen(false);
              }}
              className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (onChange) {
                  onChange({ target: { name, value: '' } });
                }
                setIsOpen(false);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
