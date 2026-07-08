'use client';

import { Sparkles, Activity } from 'lucide-react';

export type SectionId = 'beauty' | 'pilates';

interface SectionSwitcherProps {
  activeSection: SectionId;
  onSwitch: (section: SectionId) => void;
}

export function SectionSwitcher({ activeSection, onSwitch }: SectionSwitcherProps) {
  return (
    <div className="flex justify-center py-4">
      <div className="section-switcher" role="tablist" aria-label="Website section">
        <button
          role="tab"
          aria-selected={activeSection === 'beauty'}
          onClick={() => onSwitch('beauty')}
          className={`section-switcher-btn ${
            activeSection === 'beauty'
              ? 'section-switcher-btn-active-beauty'
              : ''
          }`}
        >
          <Sparkles size={15} />
          <span>Beauty</span>
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'pilates'}
          onClick={() => onSwitch('pilates')}
          className={`section-switcher-btn ${
            activeSection === 'pilates'
              ? 'section-switcher-btn-active-pilates'
              : ''
          }`}
        >
          <Activity size={15} />
          <span>Pilates</span>
        </button>
      </div>
    </div>
  );
}
