/**
 * Theme colour validation.
 *
 * Theme values are owner-authored, stored in `global_settings`, and injected
 * into CSS custom properties for every visitor. Only recognised colour
 * syntaxes may reach `style.setProperty`.
 */
// ThemeContext transitively imports the browser Supabase client at module
// scope; stub it so this pure-logic suite does not need env vars.
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({ from: jest.fn(), channel: jest.fn(), removeChannel: jest.fn() })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: null, profile: null })),
}));

import { isValidThemeColor, DEFAULT_THEME, PRESET_PALETTES } from '@/contexts/ThemeContext';

describe('isValidThemeColor', () => {
  it.each([
    '#fff',
    '#FFFF',
    '#1A1A2E',
    '#1a1a2eff',
    'rgb(255, 255, 255)',
    'rgba(255, 255, 255, 0.08)',
    'hsl(210, 50%, 40%)',
    'hsla(210, 50%, 40%, 0.5)',
    'transparent',
    'currentColor',
  ])('accepts %s', (value) => {
    expect(isValidThemeColor(value)).toBe(true);
  });

  it.each([
    'red; background: url(https://evil.test)',
    'url(https://evil.test/x.png)',
    'expression(alert(1))',
    'var(--something)',
    '#12345',
    '',
    '   ',
    'javascript:alert(1)',
  ])('rejects %s', (value) => {
    expect(isValidThemeColor(value)).toBe(false);
  });

  it.each([undefined, null, 42, {}, []])('rejects non-string %s', (value) => {
    expect(isValidThemeColor(value)).toBe(false);
  });

  it('accepts every value in the shipped default theme', () => {
    for (const [key, value] of Object.entries(DEFAULT_THEME)) {
      expect([key, isValidThemeColor(value)]).toEqual([key, true]);
    }
  });

  it('accepts every value in every preset palette', () => {
    for (const preset of PRESET_PALETTES) {
      for (const [key, value] of Object.entries(preset.theme)) {
        expect([preset.name, key, isValidThemeColor(value)]).toEqual([preset.name, key, true]);
      }
    }
  });
});
