'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { SUPPORTED_COUNTRIES, type CountryConfig } from '@/lib/validation';

interface CountryCodeDropdownProps {
  selectedCountryCode: string;
  onSelectCountryCode: (code: string) => void;
  disabled?: boolean;
}

export default function CountryCodeDropdown({
  selectedCountryCode,
  onSelectCountryCode,
  disabled = false,
}: CountryCodeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 h-[46px] px-3 bg-white/70 backdrop-blur-md border border-[var(--color-border-light)] rounded-xl text-sm font-medium transition-all ${
          disabled
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:border-pink-200 cursor-pointer active:scale-95'
        }`}
        style={{
          boxSizing: 'border-box',
        }}
      >
        <span className="text-base select-none">{selectedCountry.flag}</span>
        <span className="text-[var(--color-text-primary)] font-medium text-xs sm:text-sm">{selectedCountry.callingCode}</span>
        <ChevronDown
          size={14}
          className={`text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-48 bg-white/95 backdrop-blur-md border border-[var(--color-border-light)] shadow-xl rounded-xl overflow-hidden z-[100] animate-scale-in"
          style={{
            transformOrigin: 'top left',
          }}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {SUPPORTED_COUNTRIES.map((country: CountryConfig) => {
              const isSelected = country.code === selectedCountryCode;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onSelectCountryCode(country.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-pink-50/80 text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base select-none">{country.flag}</span>
                    <span className="truncate max-w-[100px]">{country.name}</span>
                  </span>
                  <span className="text-[var(--color-text-muted)] text-[11px] font-mono">{country.callingCode}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
