'use client';

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

export type Section = 'pilates' | 'beauty';

export const SECTIONS: Section[] = ['pilates', 'beauty'];

function isValidSection(value: string | undefined): value is Section {
  return value === 'pilates' || value === 'beauty';
}

interface SectionContextValue {
  section: Section;
  sectionPath: string;
  buildPath: (subPath?: string) => string;
  isPilates: boolean;
  isBeauty: boolean;
}

const DEFAULT_SECTION = 'beauty';

function createDefaultValue(section: Section): SectionContextValue {
  const sectionPath = `/${section}`;
  return {
    section,
    sectionPath,
    buildPath: (subPath?: string) => {
      if (!subPath) return sectionPath;
      const clean = subPath.startsWith('/') ? subPath.slice(1) : subPath;
      return clean ? `${sectionPath}/${clean}` : sectionPath;
    },
    isPilates: section === 'pilates',
    isBeauty: section === 'beauty',
  };
}

const SectionContext = createContext<SectionContextValue>(createDefaultValue(DEFAULT_SECTION));

export function SectionProvider({
  section,
  children,
}: {
  section: Section;
  children: ReactNode;
}) {
  const sectionPath = `/${section}`;

  const buildPath = useCallback(
    (subPath?: string) => {
      if (!subPath) return sectionPath;
      const clean = subPath.startsWith('/') ? subPath.slice(1) : subPath;
      return clean ? `${sectionPath}/${clean}` : sectionPath;
    },
    [sectionPath]
  );

  const value = useMemo<SectionContextValue>(
    () => ({
      section,
      sectionPath,
      buildPath,
      isPilates: section === 'pilates',
      isBeauty: section === 'beauty',
    }),
    [section, sectionPath, buildPath]
  );

  return <SectionContext.Provider value={value}>{children}</SectionContext.Provider>;
}

export function useSection(): SectionContextValue {
  return useContext(SectionContext);
}

export { isValidSection };
