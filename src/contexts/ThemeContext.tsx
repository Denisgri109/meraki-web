'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SiteTheme {
  primary: string;
  secondary: string;
  accent: string;
  brandPink: string;
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceInput: string;
  foreground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInvert: string;
  border: string;
  borderLight: string;
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#2D2D2D',
  secondary: '#C399D9',
  accent: '#E6A4B4',
  brandPink: '#E6A4B4',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F8F8F8',
  surfaceInput: '#F5F5F5',
  foreground: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInvert: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: 'rgba(0, 0, 0, 0.06)',
};

interface ThemeKeyMapping {
  themeKey: keyof SiteTheme;
  cssVar: string;
  dbKey: string;
}

const THEME_KEYS: ThemeKeyMapping[] = [
  { themeKey: 'primary', cssVar: '--color-primary', dbKey: 'theme.primary' },
  { themeKey: 'secondary', cssVar: '--color-secondary', dbKey: 'theme.secondary' },
  { themeKey: 'accent', cssVar: '--color-accent', dbKey: 'theme.accent' },
  { themeKey: 'brandPink', cssVar: '--color-brand-pink', dbKey: 'theme.brandPink' },
  { themeKey: 'background', cssVar: '--color-background', dbKey: 'theme.background' },
  { themeKey: 'surface', cssVar: '--color-surface', dbKey: 'theme.surface' },
  { themeKey: 'surfaceLight', cssVar: '--color-surface-light', dbKey: 'theme.surfaceLight' },
  { themeKey: 'surfaceInput', cssVar: '--color-surface-input', dbKey: 'theme.surfaceInput' },
  { themeKey: 'foreground', cssVar: '--color-foreground', dbKey: 'theme.foreground' },
  { themeKey: 'textPrimary', cssVar: '--color-text-primary', dbKey: 'theme.textPrimary' },
  { themeKey: 'textSecondary', cssVar: '--color-text-secondary', dbKey: 'theme.textSecondary' },
  { themeKey: 'textMuted', cssVar: '--color-text-muted', dbKey: 'theme.textMuted' },
  { themeKey: 'textInvert', cssVar: '--color-text-invert', dbKey: 'theme.textInvert' },
  { themeKey: 'border', cssVar: '--color-border', dbKey: 'theme.border' },
  { themeKey: 'borderLight', cssVar: '--color-border-light', dbKey: 'theme.borderLight' },
];

// Curated preset palettes for the color picker
export interface PresetPalette {
  name: string;
  theme: SiteTheme;
}

export const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Merakí Default',
    theme: { ...DEFAULT_THEME },
  },
  {
    name: 'Ocean Breeze',
    theme: {
      primary: '#1E3A5F', secondary: '#4A90D9', accent: '#5DADE2', brandPink: '#5DADE2',
      background: '#F0F6FA', surface: '#FFFFFF', surfaceLight: '#E8F0F5', surfaceInput: '#E0EBF2',
      foreground: '#1A2A3A', textPrimary: '#1A2A3A', textSecondary: '#5A7A9A', textMuted: '#8AABCA',
      textInvert: '#FFFFFF', border: '#C8DAE8', borderLight: 'rgba(30, 58, 95, 0.08)',
    },
  },
  {
    name: 'Forest Sage',
    theme: {
      primary: '#2D4A3E', secondary: '#7BA890', accent: '#8FBC8F', brandPink: '#8FBC8F',
      background: '#F5F9F5', surface: '#FFFFFF', surfaceLight: '#EAF2EA', surfaceInput: '#E0EDE0',
      foreground: '#1A2E22', textPrimary: '#1A2E22', textSecondary: '#5A7A6A', textMuted: '#8AAB9A',
      textInvert: '#FFFFFF', border: '#C8DDC8', borderLight: 'rgba(45, 74, 62, 0.08)',
    },
  },
  {
    name: 'Sunset Coral',
    theme: {
      primary: '#B83D3D', secondary: '#F5A623', accent: '#FF7F50', brandPink: '#FF7F50',
      background: '#FFF8F0', surface: '#FFFFFF', surfaceLight: '#FFF0E0', surfaceInput: '#FDE8D5',
      foreground: '#3A1A1A', textPrimary: '#3A1A1A', textSecondary: '#8A5A5A', textMuted: '#BA8A8A',
      textInvert: '#FFFFFF', border: '#F0D0C0', borderLight: 'rgba(184, 61, 61, 0.08)',
    },
  },
  {
    name: 'Royal Plum',
    theme: {
      primary: '#4A2D5E', secondary: '#9B6BB0', accent: '#B088C7', brandPink: '#B088C7',
      background: '#FAF5FA', surface: '#FFFFFF', surfaceLight: '#F5EAF5', surfaceInput: '#EDE0ED',
      foreground: '#2A1A3A', textPrimary: '#2A1A3A', textSecondary: '#6A5A7A', textMuted: '#9A8AAA',
      textInvert: '#FFFFFF', border: '#D8C0D8', borderLight: 'rgba(74, 45, 94, 0.08)',
    },
  },
  {
    name: 'Midnight Graphite',
    theme: {
      primary: '#E6A4B4', secondary: '#72CFF9', accent: '#C399D9', brandPink: '#E6A4B4',
      background: '#1A1A2E', surface: '#1E1E32', surfaceLight: '#252540', surfaceInput: '#1A1A2E',
      foreground: '#F0F0F5', textPrimary: '#F0F0F5', textSecondary: '#A0A0B5', textMuted: '#707085',
      textInvert: '#0F0F1A', border: '#2A2A45', borderLight: 'rgba(255, 255, 255, 0.08)',
    },
  },
  {
    name: 'Dark Mode',
    theme: {
      primary: '#E07A96',
      secondary: '#C399D9',
      accent: '#EC4899',
      brandPink: '#E07A96',
      background: '#12111A',
      surface: '#1E1B2E',
      surfaceLight: '#252238',
      surfaceInput: '#161426',
      foreground: '#ECEBF4',
      textPrimary: '#ECEBF4',
      textSecondary: '#A19CBB',
      textMuted: '#6B6885',
      textInvert: '#12111A',
      border: '#2A2740',
      borderLight: 'rgba(255, 255, 255, 0.08)',
    },
  },
];

// ─── Context ────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: SiteTheme;
  isLoading: boolean;
  canEditTheme: boolean;
  /** Persist partial theme updates to DB + apply to DOM immediately. */
  updateTheme: (partial: Partial<SiteTheme>) => Promise<{ error: string | null }>;
  /** Delete all theme.* keys from DB + revert to DEFAULT_THEME. */
  resetTheme: () => Promise<{ error: string | null }>;
  /** Apply a theme to the DOM only (no DB write). Used for live preview. */
  previewTheme: (theme: SiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── DOM Injection ──────────────────────────────────────────────────────

/** Determine if a hex color is "dark" (luminance < 0.5). */
function isColorDark(hex: string): boolean {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function applyThemeToDOM(theme: SiteTheme): void {
  const root = document.documentElement;
  for (const mapping of THEME_KEYS) {
    const value = theme[mapping.themeKey];
    if (value) {
      root.style.setProperty(mapping.cssVar, value);
    } else {
      root.style.removeProperty(mapping.cssVar);
    }
  }
  const dark = isColorDark(theme.background);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// ─── Provider ───────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const canEditTheme = profile?.role === 'owner';
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch persisted theme from global_settings on mount
  useEffect(() => {
    let mounted = true;

    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('key, value')
          .like('key', 'theme.%');

        if (error) throw error;

        const dbMap: Record<string, string> = {};
        for (const row of data ?? []) {
          dbMap[row.key] = row.value;
        }

        // Build theme from DB values, falling back to defaults
        const loadedTheme: SiteTheme = { ...DEFAULT_THEME };
        for (const mapping of THEME_KEYS) {
          const dbValue = dbMap[mapping.dbKey];
          if (dbValue) {
            loadedTheme[mapping.themeKey] = dbValue;
          }
        }

        if (mounted) {
          setTheme(loadedTheme);
          applyThemeToDOM(loadedTheme);
        }
      } catch (err) {
        console.error('[ThemeProvider] Error fetching theme:', err);
        if (mounted) applyThemeToDOM(DEFAULT_THEME);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTheme();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const updateTheme = useCallback(
    async (partial: Partial<SiteTheme>) => {
      if (!user) return { error: 'Not authenticated' };
      if (!canEditTheme) return { error: 'Only owners can change the site theme' };

      // Optimistic update — apply immediately for instant visual feedback
      const previousTheme = theme;
      const newTheme: SiteTheme = { ...theme, ...partial };
      setTheme(newTheme);
      applyThemeToDOM(newTheme);

      // Build upsert rows for changed keys only
      const now = new Date().toISOString();
      const upsertRows = THEME_KEYS.filter((m) => partial[m.themeKey] !== undefined).map((m) => ({
        key: m.dbKey,
        value: partial[m.themeKey] as string,
        updated_by: user.id,
        updated_at: now,
      }));

      if (upsertRows.length === 0) return { error: null };

      const { error } = await supabase
        .from('global_settings')
        .upsert(upsertRows, { onConflict: 'key' });

      if (error) {
        // Rollback on failure
        console.error('[ThemeProvider] Error saving theme:', error);
        setTheme(previousTheme);
        applyThemeToDOM(previousTheme);
        return { error: error.message };
      }

      return { error: null };
    },
    [user, canEditTheme, theme, supabase]
  );

  const resetTheme = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' };
    if (!canEditTheme) return { error: 'Only owners can reset the site theme' };

    // Apply default theme immediately
    const previousTheme = theme;
    setTheme(DEFAULT_THEME);
    applyThemeToDOM(DEFAULT_THEME);

    const { error } = await supabase
      .from('global_settings')
      .delete()
      .like('key', 'theme.%');

    if (error) {
      // Rollback on failure
      console.error('[ThemeProvider] Error resetting theme:', error);
      setTheme(previousTheme);
      applyThemeToDOM(previousTheme);
      return { error: error.message };
    }

    return { error: null };
  }, [user, canEditTheme, theme, supabase]);

  // CRITICAL: previewTheme must NOT call setTheme.
  // If it did, the theme state would change, triggering the CustomizeDrawer's
  // useEffect that resets draftTheme + themeDirty, making the Save button
  // vanish before the user can click it.
  const previewTheme = useCallback((newTheme: SiteTheme) => {
    applyThemeToDOM(newTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, isLoading, canEditTheme, updateTheme, resetTheme, previewTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
