import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  SectionProvider,
  useSection,
  isValidSection,
  SECTIONS,
  type Section,
} from '@/contexts/SectionContext';

function wrapper(section: Section = 'beauty') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SectionProvider section={section}>{children}</SectionProvider>;
  };
}

describe('isValidSection', () => {
  it('returns true for "pilates"', () => {
    expect(isValidSection('pilates')).toBe(true);
  });

  it('returns true for "beauty"', () => {
    expect(isValidSection('beauty')).toBe(true);
  });

  it('returns false for "fitness"', () => {
    expect(isValidSection('fitness')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidSection(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidSection('')).toBe(false);
  });
});

describe('SECTIONS', () => {
  it('contains pilates and beauty', () => {
    expect(SECTIONS).toContain('pilates');
    expect(SECTIONS).toContain('beauty');
  });

  it('has exactly 2 sections', () => {
    expect(SECTIONS).toHaveLength(2);
  });
});

describe('SectionProvider - beauty', () => {
  it('provides section as beauty', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
    expect(result.current.section).toBe('beauty');
  });

  it('provides sectionPath as /beauty', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
    expect(result.current.sectionPath).toBe('/beauty');
  });

  it('isBeauty is true, isPilates is false', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
    expect(result.current.isBeauty).toBe(true);
    expect(result.current.isPilates).toBe(false);
  });

  describe('buildPath', () => {
    it('returns /beauty when no subPath', () => {
      const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
      expect(result.current.buildPath()).toBe('/beauty');
    });

    it('returns /beauty when subPath is empty string', () => {
      const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
      expect(result.current.buildPath('')).toBe('/beauty');
    });

    it('returns /beauty/dashboard for "dashboard"', () => {
      const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
      expect(result.current.buildPath('dashboard')).toBe('/beauty/dashboard');
    });

    it('strips leading slash from subPath', () => {
      const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
      expect(result.current.buildPath('/dashboard')).toBe('/beauty/dashboard');
    });

    it('returns /beauty when subPath is just "/"', () => {
      const { result } = renderHook(() => useSection(), { wrapper: wrapper('beauty') });
      expect(result.current.buildPath('/')).toBe('/beauty');
    });
  });
});

describe('SectionProvider - pilates', () => {
  it('provides section as pilates', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('pilates') });
    expect(result.current.section).toBe('pilates');
  });

  it('provides sectionPath as /pilates', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('pilates') });
    expect(result.current.sectionPath).toBe('/pilates');
  });

  it('isPilates is true, isBeauty is false', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('pilates') });
    expect(result.current.isPilates).toBe(true);
    expect(result.current.isBeauty).toBe(false);
  });

  it('buildPath returns /pilates/dashboard for "dashboard"', () => {
    const { result } = renderHook(() => useSection(), { wrapper: wrapper('pilates') });
    expect(result.current.buildPath('dashboard')).toBe('/pilates/dashboard');
  });
});

describe('useSection default context (without provider)', () => {
  it('returns beauty as default section', () => {
    const { result } = renderHook(() => useSection());
    expect(result.current.section).toBe('beauty');
  });

  it('returns /beauty as default sectionPath', () => {
    const { result } = renderHook(() => useSection());
    expect(result.current.sectionPath).toBe('/beauty');
  });

  it('default buildPath works without provider', () => {
    const { result } = renderHook(() => useSection());
    expect(result.current.buildPath('appointments')).toBe('/beauty/appointments');
  });
});

describe('SectionProvider renders children', () => {
  it('renders child content', () => {
    render(
      <SectionProvider section="pilates">
        <div data-testid="child">Hello Section</div>
      </SectionProvider>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello Section');
  });
});
