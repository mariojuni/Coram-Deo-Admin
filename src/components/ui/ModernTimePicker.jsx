import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown } from 'lucide-react';

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
};

const formatTime12h = (time24) => {
  if (!time24) return 'Select time';
  const [h, m] = time24.split(':');
  const hNum = parseInt(h, 10);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

export default function ModernTimePicker({ name, value, onChange, placeholder = "Select time" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const popupRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const [coords, setCoords] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    openUpwards: false
  });

  const updateCoords = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const pickerEstimatedHeight = 280;
    const openUpwards = spaceBelow < pickerEstimatedHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, 200);
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
      openUpwards
    });
  };

  useEffect(() => {
    if (value) {
      setInputValue(formatTime12h(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const timeOptions = generateTimeOptions();

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const inTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
      const inPopup = popupRef.current && popupRef.current.contains(event.target);
      if (!inTrigger && !inPopup) {
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

  // Track position on scroll or resize
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

  const handleSelect = (timeStr) => {
    if (onChange) {
      onChange({ target: { name, value: timeStr } });
    }
    setIsOpen(false);
  };

  const parseTime = (timeStr) => {
    const lower = timeStr.toLowerCase().replace(/\s/g, '');
    let h = 0, m = 0;
    const isPM = lower.includes('pm');
    const isAM = lower.includes('am');
    const cleanStr = lower.replace(/[a-z]/g, '');
    const parts = cleanStr.split(':');
    
    if (parts.length >= 1) {
      h = parseInt(parts[0], 10);
      if (parts.length > 1) {
        m = parseInt(parts[1], 10);
      }
    }
    
    if (isNaN(h)) return null;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    
    h = Math.min(23, Math.max(0, h));
    m = Math.min(59, Math.max(0, m));
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleInputBlur = () => {
    if (inputValue.trim() === '') {
      if (onChange) onChange({ target: { name, value: '' } });
      return;
    }
    const parsed = parseTime(inputValue);
    if (parsed) {
      if (onChange) onChange({ target: { name, value: parsed } });
    } else {
      if (value) setInputValue(formatTime12h(value));
      else setInputValue('');
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(prev => !prev);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`w-full px-4 py-2 bg-white border ${isOpen ? 'border-brand-primary ring-2 ring-brand-primary/20 text-brand-dark shadow-sm' : 'border-slate-200/90'} rounded-2xl text-left focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all hover:border-slate-300 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3 w-full">
          <Clock size={18} className={value ? "text-brand-primary shrink-0" : "text-slate-400 shrink-0"} />
          <input
            type="text"
            name={name}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onFocus={() => {
              updateCoords();
              setIsOpen(true);
            }}
            placeholder={placeholder}
            className={`w-full block truncate text-xs sm:text-sm font-bold focus:outline-none bg-transparent ${inputValue ? 'text-brand-dark' : 'text-slate-400'}`}
          />
        </div>
        <ChevronDown 
          size={16} 
          onClick={handleToggle}
          className={`text-slate-400 transition-transform duration-200 cursor-pointer shrink-0 ml-2 hover:text-brand-primary ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popupRef}
          style={{
            position: 'fixed',
            ...(coords.openUpwards ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999
          }}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
            {timeOptions.map((time) => (
              <div 
                key={time}
                onClick={() => handleSelect(time)}
                className={`px-4 py-2 mx-2 my-0.5 rounded-xl cursor-pointer text-xs sm:text-sm transition-colors ${
                  value === time 
                    ? 'bg-blue-50 text-brand-primary font-bold' 
                    : 'text-brand-dark hover:bg-slate-50 font-medium'
                }`}
              >
                {formatTime12h(time)}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('');
              }}
              className="w-full px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
