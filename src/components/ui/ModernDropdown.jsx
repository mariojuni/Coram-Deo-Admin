import React, { useState, useRef, useEffect } from 'react';
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
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border rounded-2xl text-xs sm:text-sm focus:outline-none flex justify-between items-center transition-all bg-white font-bold ${
          isOpen 
            ? 'border-church-rose ring-2 ring-church-rose/20 text-church-charcoal shadow-sm' 
            : 'border-gray-200/80 hover:border-gray-300 text-church-charcoal hover:bg-gray-50/50'
        }`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-church-charcoal font-bold'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-church-slate transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl max-h-72 overflow-hidden flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-gray-100 flex items-center bg-gray-50/50">
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
                          ? 'bg-rose-50 text-church-rose font-bold' 
                          : 'text-church-charcoal hover:bg-gray-50 font-medium'
                        }
                      `}
                    >
                      <span className="truncate pr-4">{opt.label}</span>
                      {isSelected && <Check size={15} className="text-church-rose shrink-0 ml-2" />}
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
        </div>
      )}
    </div>
  );
}
