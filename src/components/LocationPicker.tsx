'use client';

/**
 * LocationPicker
 *
 * Searchable dropdown component for selecting Country and City, mirroring
 * the mobile CitySelectionModal + CountryPickerModal UX but adapted for web.
 *
 * Uses the CountryStateCity API via `@/lib/locationApi`.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Check, MapPin, Loader2, X } from 'lucide-react';
import {
  getAllCountries,
  getStatesOfCountry,
  getCitiesOfState,
  type Country,
  type State,
  type City,
} from '@/lib/locationApi';

/* ─── Generic searchable dropdown ────────────────────────────── */

interface DropdownItem {
  id: string | number;
  label: string;
  subtitle?: string;
}

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  items: DropdownItem[];
  selectedId: string | number | null;
  onSelect: (item: DropdownItem) => void;
  loading?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
}

function SearchableDropdown({
  label,
  placeholder,
  items,
  selectedId,
  onSelect,
  loading = false,
  disabled = false,
  searchPlaceholder = 'Search...',
  icon,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((i) => i.id === selectedId);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = search
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(search.toLowerCase()) ||
          i.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div ref={containerRef} className="relative">
      <label className="label-upper">{label}</label>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        className={`w-full input-glass flex items-center justify-between gap-2 text-left cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-200'
        } ${open ? 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]' : ''}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon}
          {loading ? (
            <span className="text-[var(--color-text-muted)] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </span>
          ) : selectedItem ? (
            <span className="text-[var(--color-text-primary)] truncate">{selectedItem.label}</span>
          ) : (
            <span className="text-[var(--color-text-muted)]">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--color-text-muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-[var(--color-border-light)] shadow-xl max-h-72 flex flex-col overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="p-2 border-b border-[var(--color-border-light)]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg bg-[var(--color-surface-light)] border border-transparent focus:border-[var(--color-primary)]/30 focus:outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                No results found
              </div>
            ) : (
              filtered.slice(0, 100).map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-pink-50 text-[var(--color-primary)] font-semibold'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
                    }`}
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">{item.subtitle}</span>
                      )}
                    </span>
                    {isSelected && <Check size={14} className="text-[var(--color-primary)] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── LocationPicker (Country + City) ────────────────────────── */

interface LocationPickerProps {
  /** Current country name (controlled). */
  country: string;
  /** Current state/region name (controlled). */
  state?: string;
  /** Current city name (controlled). */
  city: string;
  /** Called when the user picks a country. */
  onCountryChange: (country: string, countryCode: string) => void;
  /** Called when the user picks a state/region. */
  onStateChange?: (state: string, stateCode: string, latitude: string | null, longitude: string | null) => void;
  /** Called when the user picks a city. */
  onCityChange: (city: string, latitude: string | null, longitude: string | null) => void;
}

export default function LocationPicker({
  country,
  state: stateProp,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
}: LocationPickerProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState<State | null>(null);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Resolve the selected country's ISO2 code from the name
  const selectedCountry = countries.find(
    (c) => c.name.toLowerCase() === country.toLowerCase().trim()
  );

  // Load countries on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingCountries(true);
    getAllCountries()
      .then((data) => {
        if (!cancelled) setCountries(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedState(null);
      return;
    }
    let cancelled = false;
    setLoadingStates(true);
    getStatesOfCountry(selectedCountry.iso2)
      .then((data) => {
        if (!cancelled) {
          setStates(data);
          // Auto-select previously saved state if available
          if (stateProp) {
            const saved = data.find(
              (s) => s.name.toLowerCase() === stateProp.toLowerCase().trim()
            );
            setSelectedState(saved ?? null);
          } else {
            setSelectedState(null);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry?.iso2]);

  // Load cities when state changes
  useEffect(() => {
    if (!selectedCountry || !selectedState) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    getCitiesOfState(selectedCountry.iso2, selectedState.iso2)
      .then((data) => {
        if (!cancelled) setCities(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry?.iso2, selectedState?.iso2]);

  const countryItems: DropdownItem[] = countries.map((c) => ({
    id: c.id,
    label: c.name,
    subtitle: c.iso2,
  }));

  const stateItems: DropdownItem[] = states.map((s) => ({
    id: s.id,
    label: s.name,
    subtitle: s.iso2,
  }));

  const cityItems: DropdownItem[] = cities.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  // Ensure the saved city shows up in the dropdown even if states are not fully loaded/matched yet.
  const selectedCityItem = cities.find((c) => c.name.toLowerCase() === city.toLowerCase().trim());
  if (city && !selectedCityItem) {
    cityItems.push({
      id: 'saved_city',
      label: city,
    });
  }

  const handleCountrySelect = useCallback(
    (item: DropdownItem) => {
      const found = countries.find((c) => c.id === item.id);
      if (found) {
        onCountryChange(found.name, found.iso2);
        setSelectedState(null);
        setCities([]);
        onCityChange('', null, null);
        onStateChange?.('', '', null, null);
      }
    },
    [countries, onCountryChange, onCityChange]
  );

  const handleStateSelect = useCallback(
    (item: DropdownItem) => {
      const found = states.find((s) => s.id === item.id);
      if (found) {
        setSelectedState(found);
        setCities([]);
        onCityChange('', null, null);
        onStateChange?.(found.name, found.iso2, found.latitude, found.longitude);
      }
    },
    [states, onCityChange, onStateChange]
  );

  const handleCitySelect = useCallback(
    (item: DropdownItem) => {
      const found = cities.find((c) => c.id === item.id);
      if (found) {
        onCityChange(found.name, found.latitude, found.longitude);
      }
    },
    [cities, onCityChange]
  );

  const hasStates = states.length > 0;
  const showCityInput = !loadingCities && selectedCountry && (hasStates ? !!selectedState : true) && cities.length === 0 && !loadingStates;

  return (
    <div className={`grid grid-cols-1 ${hasStates ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
      <SearchableDropdown
        label="Country"
        placeholder="Select your country"
        items={countryItems}
        selectedId={selectedCountry?.id ?? null}
        onSelect={handleCountrySelect}
        loading={loadingCountries}
        searchPlaceholder="Search countries…"
        icon={<MapPin size={14} className="text-pink-400 shrink-0" />}
      />

      {hasStates && (
        <SearchableDropdown
          label="State / Region"
          placeholder="Select your state"
          items={stateItems}
          selectedId={selectedState?.id ?? null}
          onSelect={handleStateSelect}
          loading={loadingStates}
          searchPlaceholder="Search states…"
          icon={<MapPin size={14} className="text-amber-400 shrink-0" />}
        />
      )}

      {!showCityInput ? (
        <SearchableDropdown
          label="City"
          placeholder={
            !selectedCountry
              ? 'Select country first'
              : hasStates && !selectedState
              ? 'Select state first'
              : 'Select your city'
          }
          items={cityItems}
          selectedId={selectedCityItem ? selectedCityItem.id : city ? 'saved_city' : null}
          onSelect={handleCitySelect}
          loading={loadingCities}
          disabled={!selectedCountry || (hasStates && !selectedState)}
          searchPlaceholder="Search cities…"
          icon={<MapPin size={14} className="text-violet-400 shrink-0" />}
        />
      ) : (
        <div>
          <label className="label-upper">City</label>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value, null, null)}
              placeholder="Enter your city name"
              className="w-full input-glass pr-8"
            />
            {city && (
              <button
                type="button"
                onClick={() => onCityChange('', null, null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
