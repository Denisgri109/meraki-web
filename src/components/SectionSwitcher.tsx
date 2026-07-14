'use client';

import { Sparkles, Activity } from 'lucide-react';

export type SectionId = 'beauty' | 'pilates';

interface SectionSwitcherProps {
  activeSection: SectionId;
  onSwitch: (section: SectionId) => void;
}

export function SectionSwitcher({ activeSection, onSwitch }: SectionSwitcherProps) {
  const isBeauty = activeSection === 'beauty';

  return (
    <div className="section-toggle" role="tablist" aria-label="Website section">
      {/* Sliding thumb */}
      <span
        className={`section-toggle-thumb ${isBeauty ? 'section-toggle-thumb--beauty' : 'section-toggle-thumb--pilates'}`}
        style={{ transform: isBeauty ? 'translateX(0)' : 'translateX(100%)' }}
        aria-hidden="true"
      />

      <button
        role="tab"
        aria-selected={isBeauty}
        onClick={() => onSwitch('beauty')}
        className={`section-toggle-btn ${isBeauty ? 'section-toggle-btn--active' : ''}`}
      >
        <span className="section-toggle-icon">
          <Sparkles size={16} />
        </span>
        <span>Beauty</span>
      </button>

      <button
        role="tab"
        aria-selected={!isBeauty}
        onClick={() => onSwitch('pilates')}
        className={`section-toggle-btn ${!isBeauty ? 'section-toggle-btn--active' : ''}`}
      >
        <span className="section-toggle-icon">
          <Activity size={16} />
        </span>
        <span>Pilates</span>
      </button>
    </div>
  );
}
