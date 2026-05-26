'use client';

/**
 * LocationGateModal
 *
 * Full-screen overlay shown when a signed-in user has no country/state/city
 * on their profile. Blocks access to the dashboard until they select a
 * complete location. Designed to match the mobile CitySelectionModal —
 * clean white card, black CTA, soft rose-pink accent (no violet).
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Flag, Map as MapIcon, Building2, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  getAllCountries,
  getStatesOfCountry,
  type Country,
  type State,
} from '@/lib/locationApi';

const supabase = createClient();

interface LocationGateModalProps {
  onSaved: () => void;
}

export default function LocationGateModal({ onSaved }: LocationGateModalProps) {
  const { profile, refreshProfile } = useAuth();

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedStateLat, setSelectedStateLat] = useState<string | null>(null);
  const [selectedStateLng, setSelectedStateLng] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Load countries once ────────────────────────────────────────────
  useEffect(() => {
    getAllCountries()
      .then(setCountries)
      .catch(() => {})
      .finally(() => setLoadingCountries(false));
  }, []);

  // ── Pre-fill country from profile (run once) ───────────────────────
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    if (!profile) return;
    const existing = profile as Record<string, unknown>;
    if (existing.country && typeof existing.country === 'string') {
      prefilled.current = true;
      setSelectedCountry(existing.country);
      const code = (existing.country_code as string) || '';
      setSelectedCountryCode(code);
    }
  }, [profile]);

  // ── Load states whenever country changes ───────────────────────────
  useEffect(() => {
    if (!selectedCountryCode) {
      setStates([]);
      return;
    }
    let cancelled = false;
    setLoadingStates(true);
    getStatesOfCountry(selectedCountryCode)
      .then((data) => {
        if (!cancelled) setStates(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountryCode]);

  const hasStates = states.length > 0;

  const handleSave = async () => {
    if (!selectedCountry.trim()) {
      setError('Please select your country');
      return;
    }
    if (hasStates && !selectedState.trim()) {
      setError('Please select your state / region');
      return;
    }
    if (!profile?.id) return;

    setSaving(true);
    setError('');
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          country: selectedCountry,
          country_code: selectedCountryCode,
          state: selectedState || null,
          state_code: selectedStateCode || null,
          city: selectedCity.trim() || null,
          latitude: selectedStateLat ? parseFloat(selectedStateLat) : null,
          longitude: selectedStateLng ? parseFloat(selectedStateLng) : null,
          location_setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (dbError) throw dbError;
      await refreshProfile?.();
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save location';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !!selectedCountry &&
    (!hasStates || !!selectedState) &&
    !saving;

  const filteredCountries = countrySearch
    ? countries.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countries;

  const filteredStates = stateSearch
    ? states.filter((s) =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
      )
    : states;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center px-8 pb-8">
        {/* Decorative top accent bar (rose-pink) */}
        <div className="w-12 h-1 rounded-full bg-[#E8A0B4] mt-5 mb-6" />

        {/* Icon — black circle with white pin */}
        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mb-3">
          <MapPin size={26} className="text-white" />
        </div>

        {/* Title & subtitle */}
        <h2 className="text-[22px] font-bold text-gray-900 text-center mb-1.5 tracking-tight">
          Set your location
        </h2>
        <p className="text-sm text-gray-500 text-center leading-snug mb-6 px-2">
          Help us connect you with nearby professionals and services.
        </p>

        {/* Country */}
        <div className="w-full mb-3">
          <label className="block text-[11px] font-semibold text-gray-900 uppercase tracking-wider mb-1.5 ml-0.5">
            Country
          </label>
          <button
            type="button"
            onClick={() => setCountryPickerOpen(true)}
            disabled={loadingCountries}
            className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-left hover:border-gray-300 transition disabled:opacity-50"
          >
            <Flag size={16} className="text-gray-400 flex-shrink-0" />
            <span
              className={`flex-1 text-[15px] truncate ${
                selectedCountry ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}
            >
              {loadingCountries
                ? 'Loading countries…'
                : selectedCountry || 'Select your country'}
            </span>
            <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>

        {/* State / Region — only when the country has states */}
        {(loadingStates || hasStates) && (
          <div className="w-full mb-3">
            <label className="block text-[11px] font-semibold text-gray-900 uppercase tracking-wider mb-1.5 ml-0.5">
              State / Region
            </label>
            <button
              type="button"
              onClick={() => hasStates && setStatePickerOpen(true)}
              disabled={loadingStates || !hasStates}
              className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-left hover:border-gray-300 transition disabled:opacity-50"
            >
              <MapIcon size={16} className="text-gray-400 flex-shrink-0" />
              <span
                className={`flex-1 text-[15px] truncate ${
                  selectedState ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {loadingStates
                  ? 'Loading states…'
                  : selectedState || 'Select your state / region'}
              </span>
              {loadingStates ? (
                <Loader2 size={16} className="text-gray-400 animate-spin flex-shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
          </div>
        )}

        {/* City — free text input (optional) */}
        <div className="w-full mb-3">
          <label className="block text-[11px] font-semibold text-gray-900 uppercase tracking-wider mb-1.5 ml-0.5">
            City <span className="text-gray-400 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <div
            className={`flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 transition focus-within:border-gray-400 ${
              !selectedCountryCode ? 'opacity-50' : ''
            }`}
          >
            <Building2 size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder={
                selectedCountryCode
                  ? 'Type your city name (optional)'
                  : 'Select a country first'
              }
              disabled={!selectedCountryCode}
              className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        </div>

        {error && (
          <p className="w-full text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        {/* Continue */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full mt-5 py-4 rounded-2xl bg-black text-white font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 transition hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>

      {/* ── Country picker (searchable list) ────────────────────────── */}
      {countryPickerOpen && (
        <PickerSheet
          title="Select Country"
          search={countrySearch}
          onSearchChange={setCountrySearch}
          onClose={() => {
            setCountryPickerOpen(false);
            setCountrySearch('');
          }}
          loading={loadingCountries}
          emptyMessage="No countries found"
          hasResults={filteredCountries.length > 0}
        >
          {filteredCountries.slice(0, 100).map((c) => {
            const isSelected = c.iso2 === selectedCountryCode;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCountry(c.name);
                  setSelectedCountryCode(c.iso2);
                  setSelectedState('');
                  setSelectedStateCode('');
                  setSelectedStateLat(null);
                  setSelectedStateLng(null);
                  setCountryPickerOpen(false);
                  setCountrySearch('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${
                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`text-[15px] ${
                      isSelected ? 'text-gray-900 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400">{c.iso2}</span>
                </div>
                {isSelected && (
                  <span className="text-gray-900 font-semibold">✓</span>
                )}
              </button>
            );
          })}
        </PickerSheet>
      )}

      {/* ── State picker (searchable list) ──────────────────────────── */}
      {statePickerOpen && (
        <PickerSheet
          title="Select State / Region"
          search={stateSearch}
          onSearchChange={setStateSearch}
          onClose={() => {
            setStatePickerOpen(false);
            setStateSearch('');
          }}
          loading={loadingStates}
          emptyMessage="No states available for this country"
          hasResults={filteredStates.length > 0}
        >
          {filteredStates.slice(0, 100).map((s) => {
            const isSelected = s.iso2 === selectedStateCode;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedState(s.name);
                  setSelectedStateCode(s.iso2);
                  setSelectedStateLat(s.latitude);
                  setSelectedStateLng(s.longitude);
                  setStatePickerOpen(false);
                  setStateSearch('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${
                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`text-[15px] ${
                      isSelected ? 'text-gray-900 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {s.name}
                  </span>
                  <span className="text-xs text-gray-400">{s.iso2}</span>
                </div>
                {isSelected && (
                  <span className="text-gray-900 font-semibold">✓</span>
                )}
              </button>
            );
          })}
        </PickerSheet>
      )}
    </div>
  );
}

/* ─── Reusable searchable picker sheet ─────────────────────────────── */

interface PickerSheetProps {
  title: string;
  search: string;
  onSearchChange: (v: string) => void;
  onClose: () => void;
  loading?: boolean;
  emptyMessage?: string;
  hasResults: boolean;
  children: React.ReactNode;
}

function PickerSheet({
  title,
  search,
  onSearchChange,
  onClose,
  loading,
  emptyMessage = 'No results',
  hasResults,
  children,
}: PickerSheetProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            autoFocus
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-gray-400 transition"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 size={22} className="text-gray-400 animate-spin" />
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          ) : hasResults ? (
            children
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
