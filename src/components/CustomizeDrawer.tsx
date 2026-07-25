'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEditMode } from '@/contexts/EditContext';
import {
  useTheme,
  DEFAULT_THEME,
  PRESET_PALETTES,
  type SiteTheme,
} from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';
import { ImageUrlUpload } from '@/components/ImageUrlUpload';
import {
  X,
  Palette,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Loader2,
  Save,
  Check,
  AlertTriangle,
  Eye,
  Upload,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────

type TabId = 'colors' | 'text' | 'images' | 'reset';

interface CustomizeDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface ColorField {
  key: keyof SiteTheme;
  label: string;
  description: string;
  section: string;
}

interface TextField {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

interface ImageField {
  key: string;
  label: string;
  fallback: string;
  description: string;
}

// ─── Config ─────────────────────────────────────────────────────────────

const COLOR_FIELDS: ColorField[] = [
  { key: 'primary', label: 'Primary', description: 'Main brand color (buttons, CTAs)', section: 'Core' },
  { key: 'secondary', label: 'Secondary', description: 'Supporting accent color', section: 'Core' },
  { key: 'accent', label: 'Accent', description: 'Highlight color', section: 'Core' },
  { key: 'brandPink', label: 'Brand Pink', description: 'Brand identity accent', section: 'Core' },
  { key: 'background', label: 'Background', description: 'Page background', section: 'Surfaces' },
  { key: 'surface', label: 'Surface', description: 'Card backgrounds', section: 'Surfaces' },
  { key: 'surfaceLight', label: 'Surface Light', description: 'Subtle backgrounds', section: 'Surfaces' },
  { key: 'surfaceInput', label: 'Input Background', description: 'Form input backgrounds', section: 'Surfaces' },
  { key: 'foreground', label: 'Foreground', description: 'Default text color', section: 'Text' },
  { key: 'textPrimary', label: 'Text Primary', description: 'Headings text color', section: 'Text' },
  { key: 'textSecondary', label: 'Text Secondary', description: 'Secondary text', section: 'Text' },
  { key: 'textMuted', label: 'Text Muted', description: 'Muted/placeholder text', section: 'Text' },
  { key: 'textInvert', label: 'Text Invert', description: 'Text on primary buttons', section: 'Text' },
  { key: 'border', label: 'Border', description: 'Standard border color', section: 'Borders' },
];

const TEXT_FIELDS: TextField[] = [
  {
    key: 'landing.hero.badge',
    label: 'Hero Badge',
    fallback: 'Beauty With Soul',
    placeholder: 'Beauty With Soul',
  },
  {
    key: 'landing.hero.title',
    label: 'Hero Headline',
    fallback: 'Your Premium Beauty Destination',
    multiline: true,
    rows: 2,
    placeholder: 'Your Premium Beauty Destination',
  },
  {
    key: 'landing.hero.subtitle',
    label: 'Hero Subtext',
    fallback:
      'Book appointments with top professionals, shop curated products, and learn from expert courses — all in one place.',
    multiline: true,
    rows: 3,
    placeholder: 'Book appointments with top professionals...',
  },
  {
    key: 'landing.pilates.hero.badge',
    label: 'Pilates Hero Badge',
    fallback: 'Mind. Body. Balance.',
    placeholder: 'Mind. Body. Balance.',
  },
  {
    key: 'landing.pilates.hero.title',
    label: 'Pilates Hero Headline',
    fallback: 'Find Your Flow',
    multiline: true,
    rows: 2,
    placeholder: 'Find Your Flow',
  },
  {
    key: 'landing.pilates.hero.subtitle',
    label: 'Pilates Hero Subtext',
    fallback:
      'Reformer and mat Pilates sessions for every level. Build strength, mobility, and mindfulness with our expert instructors.',
    multiline: true,
    rows: 3,
    placeholder: 'Reformer and mat Pilates sessions...',
  },
  {
    key: 'footer.tagline',
    label: 'Footer Tagline',
    fallback: 'Beauty with soul',
    placeholder: 'Beauty with soul',
  },
  {
    key: 'legal.tos_body',
    label: 'Terms of Service Body',
    fallback: '',
    multiline: true,
    rows: 10,
    placeholder: 'Leave empty to use the default Terms of Service. Enter custom text to override.',
  },
];

const IMAGE_FIELDS: ImageField[] = [
  {
    key: 'landing.hero.image_url',
    label: 'Beauty Hero Image',
    fallback:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80&auto=format&fit=crop',
    description: 'Main landing page hero background image',
  },
  {
    key: 'landing.pilates.hero.image_url',
    label: 'Pilates Hero Image',
    fallback:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80&auto=format&fit=crop',
    description: 'Pilates landing page hero background image',
  },
  {
    key: 'image.logo',
    label: 'Site Logo',
    fallback: '',
    description: 'Custom site logo (overrides text-based logo). Recommended: transparent PNG, 200x60px.',
  },
];

const RESET_PREFIXES = ['landing.', 'image.', 'legal.'];

// ─── Component ──────────────────────────────────────────────────────────

export function CustomizeDrawer({ open, onClose }: CustomizeDrawerProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const supabase = createClient();
  const { theme, updateTheme, resetTheme, previewTheme } = useTheme();
  const { getContent, updateContent, resetContent, refreshContent } = useEditMode();

  const [activeTab, setActiveTab] = useState<TabId>('colors');
  const [draftTheme, setDraftTheme] = useState<SiteTheme>(theme);
  const [themeDirty, setThemeDirty] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [savingText, setSavingText] = useState<string | null>(null);
  const [imageValues, setImageValues] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);

  // Sync draftTheme when theme loads/changes
  useEffect(() => {
    setDraftTheme(theme);
    setThemeDirty(false);
  }, [theme]);

  // Load current text values into drafts when drawer opens
  useEffect(() => {
    if (!open) return;
    const drafts: Record<string, string> = {};
    for (const field of TEXT_FIELDS) {
      drafts[field.key] = getContent(field.key, field.fallback);
    }
    setTextDrafts(drafts);

    const images: Record<string, string> = {};
    for (const field of IMAGE_FIELDS) {
      images[field.key] = getContent(field.key, field.fallback);
    }
    setImageValues(images);
  }, [open, getContent]);

  // ─── Colors tab handlers ──────────────────────────────────────────────

  const handleColorChange = useCallback(
    (key: keyof SiteTheme, value: string) => {
      const newDraft = { ...draftTheme, [key]: value };
      setDraftTheme(newDraft);
      setThemeDirty(true);
      // Live preview — apply to DOM without persisting
      previewTheme(newDraft);
    },
    [draftTheme, previewTheme]
  );

  const handlePresetSelect = useCallback(
    (presetTheme: SiteTheme) => {
      setDraftTheme(presetTheme);
      setThemeDirty(true);
      previewTheme(presetTheme);
    },
    [previewTheme]
  );

  const handleSaveTheme = useCallback(async () => {
    setSavingTheme(true);
    const { error } = await updateTheme(draftTheme);
    if (error) {
      showToast(error, 'error');
    } else {
      setThemeDirty(false);
      showToast('Theme saved! All visitors will see the new colors.', 'success');
    }
    setSavingTheme(false);
  }, [draftTheme, updateTheme, showToast]);

  const handleRevertTheme = useCallback(() => {
    setDraftTheme(theme);
    setThemeDirty(false);
    previewTheme(theme);
  }, [theme, previewTheme]);

  // ─── Text tab handlers ────────────────────────────────────────────────

  const handleTextChange = useCallback((key: string, value: string) => {
    setTextDrafts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveText = useCallback(
    async (key: string) => {
      const draftValue = textDrafts[key];
      if (draftValue === undefined) return;
      const field = TEXT_FIELDS.find((f) => f.key === key);
      const fallback = field?.fallback ?? '';

      // If draft matches fallback (or is empty and fallback is empty), delete the override
      if (draftValue.trim() === fallback.trim() || (draftValue.trim() === '' && fallback === '')) {
        setSavingText(key);
        // Delete the key to restore default
        const { error: delError } = await supabase
          .from('global_settings')
          .delete()
          .eq('key', key);
        if (delError) {
          showToast(delError.message, 'error');
        } else {
          await refreshContent();
          showToast('Reset to default', 'success');
        }
        setSavingText(null);
        return;
      }

      setSavingText(key);
      const { error } = await updateContent(key, draftValue);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Text saved', 'success');
      }
      setSavingText(null);
    },
    [textDrafts, supabase, updateContent, refreshContent, showToast]
  );

  // ─── Images tab handlers ──────────────────────────────────────────────

  const handleImageUpload = useCallback(
    async (key: string, publicUrl: string) => {
      const { error } = await updateContent(key, publicUrl);
      if (error) {
        showToast(error, 'error');
      } else {
        setImageValues((prev) => ({ ...prev, [key]: publicUrl }));
        showToast('Image updated', 'success');
      }
    },
    [updateContent, showToast]
  );

  const handleImageReset = useCallback(
    async (key: string, fallback: string) => {
      const field = IMAGE_FIELDS.find((f) => f.key === key);
      if (!field) return;
      const { error: delError } = await supabase
        .from('global_settings')
        .delete()
        .eq('key', key);
      if (delError) {
        showToast(delError.message, 'error');
      } else {
        await refreshContent();
        setImageValues((prev) => ({ ...prev, [key]: fallback }));
        showToast('Image reset to default', 'success');
      }
    },
    [supabase, refreshContent, showToast]
  );

  // ─── Reset tab handler ────────────────────────────────────────────────

  const handleResetEverything = useCallback(async () => {
    const confirmed = await showConfirm(
      'This will permanently reset ALL customizations — theme colors, text content (including Terms of Service), images, and logos — back to the original factory defaults. Every visitor will see the default site. This cannot be undone.',
      'Reset Everything to Original State',
      'Reset Everything',
      'Cancel',
      'danger'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      // 1. Reset theme (theme.* keys)
      const themeResult = await resetTheme();
      if (themeResult.error) throw new Error(themeResult.error);

      // 2. Reset content prefixes (landing.*, image.*, legal.*)
      for (const prefix of RESET_PREFIXES) {
        const result = await resetContent(prefix);
        if (result.error) throw new Error(result.error);
      }

      // 3. Refresh content state
      await refreshContent();

      // 4. Reset local drafts
      setDraftTheme(DEFAULT_THEME);
      setThemeDirty(false);
      const freshTextDrafts: Record<string, string> = {};
      for (const field of TEXT_FIELDS) {
        freshTextDrafts[field.key] = field.fallback;
      }
      setTextDrafts(freshTextDrafts);

      const freshImages: Record<string, string> = {};
      for (const field of IMAGE_FIELDS) {
        freshImages[field.key] = field.fallback;
      }
      setImageValues(freshImages);

      showToast('Everything reset to original state!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset';
      showToast(message, 'error');
    } finally {
      setResetting(false);
    }
  }, [showConfirm, resetTheme, resetContent, refreshContent, showToast]);

  // ─── Render ────────────────────────────────────────────────────────────

  if (!open) return null;

  // Role guard — only owners see the drawer content
  if (profile?.role !== 'owner') {
    return null;
  }

  const tabs: { id: TabId; label: string; icon: typeof Palette }[] = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'reset', label: 'Reset', icon: RotateCcw },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-[var(--color-primary)]" />
            <h2 id="customize-drawer-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
              Customize Website
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Close customization panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── Colors Tab ─── */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              {/* Preset Palettes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Preset Palettes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_PALETTES.map((preset) => {
                    const isActive =
                      JSON.stringify(draftTheme) === JSON.stringify(preset.theme);
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset.theme)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          isActive
                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex gap-1.5 mb-2">
                          {[preset.theme.primary, preset.theme.secondary, preset.theme.accent, preset.theme.background].map(
                            (color, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              />
                            )
                          )}
                        </div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{preset.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Colors — grouped by section */}
              <div>
                {Array.from(new Set(COLOR_FIELDS.map((f) => f.section))).map((sectionName) => (
                  <div key={sectionName} className="mb-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      {sectionName}
                    </h3>
                    <div className="space-y-3">
                      {COLOR_FIELDS.filter((f) => f.section === sectionName).map((field) => (
                        <div
                          key={field.key}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <label className="relative cursor-pointer shrink-0">
                            <input
                              type="color"
                              value={draftTheme[field.key]}
                              onChange={(e) => handleColorChange(field.key, e.target.value)}
                              className="sr-only"
                              aria-label={field.label}
                            />
                            <div
                              className="w-10 h-10 rounded-lg border-2 border-white shadow-sm ring-1 ring-gray-200"
                              style={{ backgroundColor: draftTheme[field.key] }}
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{field.label}</p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">{field.description}</p>
                          </div>
                          <input
                            type="text"
                            value={draftTheme[field.key]}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="w-20 px-2 py-1.5 text-xs font-mono rounded-lg border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 outline-none uppercase"
                            aria-label={`${field.label} hex value`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live preview note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Eye size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  Changes preview live as you pick colors. Click <strong>Save Theme</strong> to persist for all visitors.
                </p>
              </div>
            </div>
          )}

          {/* ─── Text Tab ─── */}
          {activeTab === 'text' && (
            <div className="space-y-5">
              <p className="text-xs text-[var(--color-text-muted)]">
                Edit key text sections across the site. Changes apply immediately to all visitors after saving.
              </p>
              {TEXT_FIELDS.map((field) => {
                const value = textDrafts[field.key] ?? field.fallback;
                const isDirty = value !== getContent(field.key, field.fallback);
                const isSaving = savingText === field.key;
                return (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        {field.label}
                      </label>
                      {isDirty && (
                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Unsaved
                        </span>
                      )}
                    </div>
                    {field.multiline ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleTextChange(field.key, e.target.value)}
                        rows={field.rows ?? 3}
                        placeholder={field.placeholder}
                        className="input-glass resize-none w-full text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleTextChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="input-glass w-full text-sm"
                      />
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveText(field.key)}
                        disabled={!isDirty || isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
                      >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Images Tab ─── */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              <p className="text-xs text-[var(--color-text-muted)]">
                Upload custom images by URL. Images are stored in Supabase and shown to all visitors.
              </p>
              {IMAGE_FIELDS.map((field) => {
                const currentUrl = imageValues[field.key] ?? field.fallback;
                const hasOverride = getContent(field.key, field.fallback) !== field.fallback;
                return (
                  <div key={field.key} className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{field.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{field.description}</p>
                      </div>
                      {hasOverride && (
                        <button
                          onClick={() => handleImageReset(field.key, field.fallback)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          Reset
                        </button>
                      )}
                    </div>
                    {/* Preview */}
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                      {currentUrl ? (
                        <img
                          src={currentUrl}
                          alt={field.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={32} className="text-gray-300" />
                      )}
                    </div>
                    {/* Upload by URL */}
                    <ImageUrlUpload
                      onUpload={(publicUrl) => handleImageUpload(field.key, publicUrl)}
                      bucket="site-images"
                      pathPrefix={`site-content/${field.key.replace(/\./g, '-')}`}
                      label={`Replace ${field.label}`}
                      compact={true}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Reset Tab ─── */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                      Reset Everything to Original State
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      This will permanently clear all customizations and restore the factory default site:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        Theme colors → default Merakí palette
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        All text content (hero, TOS, footer) → original copy
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        Custom images/logos → fallback images
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-red-600 font-medium">
                      This affects every visitor. This cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetEverything}
                  disabled={resetting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  {resetting ? 'Resetting...' : 'Reset Everything to Original State'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — Save bar (only for Colors tab since it has batch save) */}
        {activeTab === 'colors' && themeDirty && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleRevertTheme}
              disabled={savingTheme}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Revert
            </button>
            <button
              onClick={handleSaveTheme}
              disabled={savingTheme}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingTheme ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingTheme ? 'Saving...' : 'Save Theme'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
