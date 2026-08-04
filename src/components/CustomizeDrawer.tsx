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
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
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

interface TextGroup {
  id: string;
  title: string;
  description: string;
  fields: TextField[];
}

interface ImageField {
  key: string;
  label: string;
  fallback: string;
  description: string;
}

interface SupportSettingField {
  field: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

interface ResetSection {
  id: string;
  title: string;
  description: string;
  prefixes: string[];
  keys: string[];
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

const TEXT_GROUPS: TextGroup[] = [
  {
    id: 'hero',
    title: 'Hero & Headers',
    description: 'Main headlines shown at the top of the Beauty and Pilates landing pages.',
    fields: [
      { key: 'landing.hero.badge', label: 'Beauty Hero Badge', fallback: 'Beauty With Soul', placeholder: 'Beauty With Soul' },
      { key: 'landing.hero.title', label: 'Beauty Hero Headline', fallback: 'Your Premium Beauty Destination', multiline: true, rows: 2, placeholder: 'Your Premium Beauty Destination' },
      { key: 'landing.hero.subtitle', label: 'Beauty Hero Subtext', fallback: 'Book appointments with top professionals, shop curated products, and learn from expert courses — all in one place.', multiline: true, rows: 3, placeholder: 'Book appointments with top professionals...' },
      { key: 'landing.pilates.hero.badge', label: 'Pilates Hero Badge', fallback: 'Move With Purpose', placeholder: 'Move With Purpose' },
      { key: 'landing.pilates.hero.title', label: 'Pilates Hero Headline', fallback: 'Your Pilates Journey Starts Here', multiline: true, rows: 2, placeholder: 'Your Pilates Journey Starts Here' },
      { key: 'landing.pilates.hero.subtitle', label: 'Pilates Hero Subtext', fallback: 'Book group classes, follow weekly schedules, and train with expert instructors — for every level, every body.', multiline: true, rows: 3, placeholder: 'Book group classes...' },
    ],
  },
  {
    id: 'landing',
    title: 'Landing Content',
    description: 'Section titles, step cards, and testimonial copy on both landing pages.',
    fields: [
      { key: 'landing.how_it_works.badge', label: 'Beauty Steps Badge', fallback: 'How It Works', placeholder: 'How It Works' },
      { key: 'landing.how_it_works.title', label: 'Beauty Steps Title', fallback: 'Beauty Made Simple', placeholder: 'Beauty Made Simple' },
      { key: 'landing.features.badge', label: 'Beauty Features Badge', fallback: 'Everything You Need', placeholder: 'Everything You Need' },
      { key: 'landing.features.title', label: 'Beauty Features Title', fallback: 'One Platform, Endless Beauty', placeholder: 'One Platform, Endless Beauty' },
      { key: 'landing.testimonial.badge', label: 'Beauty Testimonial Badge', fallback: 'Join Thousands of Happy Clients', placeholder: 'Join Thousands of Happy Clients' },
      { key: 'landing.testimonial.quote', label: 'Beauty Testimonial Quote', fallback: 'Merakí transformed how I do beauty. Everything I need in one beautiful app.', multiline: true, rows: 2, placeholder: 'Merakí transformed how I do beauty...' },
      { key: 'landing.testimonial.author', label: 'Beauty Testimonial Author', fallback: '— Sarah K., London', placeholder: '— Sarah K., London' },
      { key: 'landing.pilates.how_it_works.badge', label: 'Pilates Steps Badge', fallback: 'How It Works', placeholder: 'How It Works' },
      { key: 'landing.pilates.how_it_works.title', label: 'Pilates Steps Title', fallback: 'Pilates Made Simple', placeholder: 'Pilates Made Simple' },
      { key: 'landing.pilates.features.badge', label: 'Pilates Features Badge', fallback: 'Everything You Need', placeholder: 'Everything You Need' },
      { key: 'landing.pilates.features.title', label: 'Pilates Features Title', fallback: 'One Studio, Every Level', placeholder: 'One Studio, Every Level' },
      { key: 'landing.pilates.testimonial.badge', label: 'Pilates Testimonial Badge', fallback: 'Join Hundreds of Stronger Bodies', placeholder: 'Join Hundreds of Stronger Bodies' },
      { key: 'landing.pilates.testimonial.quote', label: 'Pilates Testimonial Quote', fallback: 'Pilates at Merakí changed how I move. The classes, the instructors — everything just clicks.', multiline: true, rows: 2, placeholder: 'Pilates at Merakí changed how I move...' },
      { key: 'landing.pilates.testimonial.author', label: 'Pilates Testimonial Author', fallback: '— Emma R., London', placeholder: '— Emma R., London' },
    ],
  },
  {
    id: 'pages',
    title: 'Static Pages',
    description: 'Copy on the About, Contact, and Get App pages.',
    fields: [
      { key: 'about.eyebrow', label: 'About Eyebrow', fallback: 'Our Story', placeholder: 'Our Story' },
      { key: 'about.heading', label: 'About Heading', fallback: 'Beauty With Soul', placeholder: 'Beauty With Soul' },
      { key: 'about.paragraph1', label: 'About Paragraph 1', fallback: 'Welcome to Merakí, your premium destination for all things beauty. The word "Merakí" is a Greek word often used to describe doing something with soul, creativity, or love — when you put "something of yourself" into what you\'re doing, whatever it may be.', multiline: true, rows: 4, placeholder: 'Welcome to Merakí...' },
      { key: 'about.paragraph2', label: 'About Paragraph 2', fallback: 'Founded on the belief that beauty is an expression of the inner self, our platform connects you with top-tier professionals, curated products, and expert knowledge all in one seamless place.', multiline: true, rows: 3, placeholder: 'Founded on the belief...' },
      { key: 'about.paragraph3', label: 'About Paragraph 3', fallback: 'Whether you are looking to book your next transforming hair appointment, find the perfect skincare routine, or learn a new makeup technique from our academy, Merakí provides an unparalleled, luxury experience.', multiline: true, rows: 3, placeholder: 'Whether you are looking...' },
      { key: 'about.cta', label: 'About CTA Label', fallback: 'Join the Merakí Family', placeholder: 'Join the Merakí Family' },
      { key: 'contact.eyebrow', label: 'Contact Eyebrow', fallback: 'Get in Touch', placeholder: 'Get in Touch' },
      { key: 'contact.heading', label: 'Contact Heading', fallback: "Let's craft your perfect look.", placeholder: "Let's craft your perfect look." },
      { key: 'contact.paragraph', label: 'Contact Intro', fallback: "Have a question about our services, products, or your account? We're here to help. Reach out to our dedicated support team to start your journey.", multiline: true, rows: 3, placeholder: 'Have a question...' },
      { key: 'contact.email', label: 'Contact Email', fallback: 'hello@merakiapp.com', placeholder: 'hello@merakiapp.com' },
      { key: 'contact.phone', label: 'Contact Phone', fallback: '+44 (0) 20 7123 4567', placeholder: '+44 (0) 20 7123 4567' },
      { key: 'contact.hours', label: 'Contact Opening Hours', fallback: 'Mon-Fri, 9am - 6pm GMT', placeholder: 'Mon-Fri, 9am - 6pm GMT' },
      { key: 'contact.form_heading', label: 'Contact Form Heading', fallback: 'Send us a message', placeholder: 'Send us a message' },
      { key: 'contact.form_button', label: 'Contact Form Button', fallback: 'Send Message', placeholder: 'Send Message' },
      { key: 'getapp.heading', label: 'Get App Heading', fallback: 'Meraká is Coming to Your Pocket', placeholder: 'Meraká is Coming to Your Pocket' },
      { key: 'getapp.subtext', label: 'Get App Subtext', fallback: "We're crafting the official Meraká mobile app to bring real-time messaging, instant booking updates, stamp tag scanning, and personalized alerts right to your phone. It's almost here.", multiline: true, rows: 3, placeholder: "We're crafting the official Meraká mobile app..." },
    ],
  },
  {
    id: 'legal',
    title: 'Legal Documents',
    description: 'Full document bodies. Leave empty to restore the built-in default document.',
    fields: [
      { key: 'legal.tos_body', label: 'Terms of Service Body', fallback: '', multiline: true, rows: 12, placeholder: 'Leave empty to use the default Terms of Service. Enter custom text to override.' },
      { key: 'legal.privacy_policy_body', label: 'Privacy Policy Body', fallback: '', multiline: true, rows: 12, placeholder: 'Leave empty to use the default Privacy Policy. Enter custom text to override.' },
    ],
  },
  {
    id: 'support',
    title: 'Support & FAQ',
    description: 'Support page text and the contact information shown to clients. FAQ items are managed on the Support page.',
    fields: [
      { key: 'support.header_title', label: 'Support Page Title', fallback: 'Support', placeholder: 'Support' },
      { key: 'support.header_subtitle', label: 'Support Page Subtitle', fallback: 'Find answers and get in touch', placeholder: 'Find answers and get in touch' },
      { key: 'support.banner_text', label: 'Support Banner Text', fallback: 'If a feature is not working as expected, please try the mobile app.', multiline: true, rows: 2, placeholder: 'If a feature is not working as expected...' },
    ],
  },
  {
    id: 'branding',
    title: 'Footer & Branding',
    description: 'Brand name, footer tagline, and copyright notice shown site-wide.',
    fields: [
      { key: 'brand.logo_text', label: 'Brand Name (Logo Text)', fallback: 'Merakí', placeholder: 'Merakí' },
      { key: 'footer.tagline', label: 'Footer Tagline', fallback: 'Beauty with soul', placeholder: 'Beauty with soul' },
      { key: 'footer.copyright', label: 'Footer Copyright', fallback: 'Merakí. All rights reserved.', placeholder: 'Merakí. All rights reserved.' },
    ],
  },
];

const SUPPORT_SETTING_FIELDS: SupportSettingField[] = [
  { field: 'email', label: 'Support Email', placeholder: 'support@yoursalon.com' },
  { field: 'phone', label: 'Support Phone', placeholder: '+353 1 234 5678' },
  { field: 'hours', label: 'Business Hours', placeholder: 'Mon-Fri: 9:00 AM - 6:00 PM' },
  { field: 'address', label: 'Address', placeholder: '123 Beauty Lane, Dublin' },
  { field: 'additional_info', label: 'Additional Info', placeholder: 'Any additional information for clients...', multiline: true },
];

const IMAGE_FIELDS: ImageField[] = [
  {
    key: 'landing.hero.image_url',
    label: 'Beauty Hero Image',
    fallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80&auto=format&fit=crop',
    description: 'Main landing page hero background image',
  },
  {
    key: 'landing.pilates.hero.image_url',
    label: 'Pilates Hero Image',
    fallback: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80&auto=format&fit=crop',
    description: 'Pilates landing page hero background image',
  },
  {
    key: 'image.logo',
    label: 'Site Logo',
    fallback: '',
    description: 'Custom site logo (overrides text-based logo). Recommended: transparent PNG, 200x60px.',
  },
  {
    key: 'landing.features.image_url',
    label: 'Beauty Feature Banner',
    fallback: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format&fit=crop',
    description: 'Large image beside the Beauty features list',
  },
  {
    key: 'landing.pilates.features.image_url',
    label: 'Pilates Feature Banner',
    fallback: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80&auto=format&fit=crop',
    description: 'Large image beside the Pilates features list',
  },
  {
    key: 'landing.testimonial.image_url',
    label: 'Beauty Testimonial Banner',
    fallback: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop',
    description: 'Background image behind the Beauty testimonial section',
  },
  {
    key: 'landing.pilates.testimonial.image_url',
    label: 'Pilates Testimonial Banner',
    fallback: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1600&q=80&auto=format&fit=crop',
    description: 'Background image behind the Pilates testimonial section',
  },
  {
    key: 'landing.how_it_works.step1_image',
    label: 'Beauty Step 1 Illustration',
    fallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
    description: 'Beauty "How It Works" step 1 image',
  },
  {
    key: 'landing.how_it_works.step2_image',
    label: 'Beauty Step 2 Illustration',
    fallback: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80&auto=format&fit=crop',
    description: 'Beauty "How It Works" step 2 image',
  },
  {
    key: 'landing.how_it_works.step3_image',
    label: 'Beauty Step 3 Illustration',
    fallback: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&auto=format&fit=crop',
    description: 'Beauty "How It Works" step 3 image',
  },
  {
    key: 'landing.pilates.how_it_works.step1_image',
    label: 'Pilates Step 1 Illustration',
    fallback: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80&auto=format&fit=crop',
    description: 'Pilates "How It Works" step 1 image',
  },
  {
    key: 'landing.pilates.how_it_works.step2_image',
    label: 'Pilates Step 2 Illustration',
    fallback: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80&auto=format&fit=crop',
    description: 'Pilates "How It Works" step 2 image',
  },
  {
    key: 'landing.pilates.how_it_works.step3_image',
    label: 'Pilates Step 3 Illustration',
    fallback: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80&auto=format&fit=crop',
    description: 'Pilates "How It Works" step 3 image',
  },
];

const ALL_TEXT_FIELDS: TextField[] = TEXT_GROUPS.flatMap((g) => g.fields);

const RESET_SECTIONS: ResetSection[] = [
  {
    id: 'landing',
    title: 'Landing Pages',
    description: 'Hero copy, section titles, step cards, testimonials, and portal text (Beauty & Pilates).',
    prefixes: ['landing.', 'portal.'],
    keys: [],
  },
  {
    id: 'legal',
    title: 'Legal Documents',
    description: 'Custom Terms of Service and Privacy Policy bodies.',
    prefixes: ['legal.'],
    keys: [],
  },
  {
    id: 'branding',
    title: 'Footer & Branding',
    description: 'Logo text/image, footer tagline, and copyright notice.',
    prefixes: ['brand.', 'footer.', 'image.'],
    keys: [],
  },
  {
    id: 'pages',
    title: 'Static Pages',
    description: 'About, Contact, and Get App page copy.',
    prefixes: ['about.', 'contact.', 'getapp.'],
    keys: [],
  },
  {
    id: 'support',
    title: 'Support & FAQ',
    description: 'Support page text, contact info, and all FAQ items.',
    prefixes: ['support.'],
    keys: ['faq_items', 'support_settings'],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function parseSupportSettings(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

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
  const [supportDrafts, setSupportDrafts] = useState<Record<string, string>>({});
  const [savingText, setSavingText] = useState<string | null>(null);
  const [imageValues, setImageValues] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [resettingSection, setResettingSection] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ hero: true });

  // Sync draftTheme when theme loads/changes
  useEffect(() => {
    setDraftTheme(theme);
    setThemeDirty(false);
  }, [theme]);

  // Load current text values into drafts when drawer opens
  useEffect(() => {
    if (!open) return;
    const drafts: Record<string, string> = {};
    for (const field of ALL_TEXT_FIELDS) {
      drafts[field.key] = getContent(field.key, field.fallback);
    }
    setTextDrafts(drafts);

    const support = parseSupportSettings(getContent('support_settings', ''));
    const supportValues: Record<string, string> = {};
    for (const field of SUPPORT_SETTING_FIELDS) {
      supportValues[field.field] = support[field.field] ?? '';
    }
    setSupportDrafts(supportValues);

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
      const field = ALL_TEXT_FIELDS.find((f) => f.key === key);
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

  // ─── Support settings handlers ────────────────────────────────────────

  const handleSupportChange = useCallback((field: string, value: string) => {
    setSupportDrafts((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveSupport = useCallback(async () => {
    setSavingText('support_settings');
    const merged = {
      email: supportDrafts.email?.trim() ?? '',
      phone: supportDrafts.phone?.trim() ?? '',
      hours: supportDrafts.hours?.trim() ?? '',
      address: supportDrafts.address?.trim() ?? '',
      additional_info: supportDrafts.additional_info ?? '',
    };
    const { error } = await updateContent('support_settings', JSON.stringify(merged));
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Support contact info saved', 'success');
    }
    setSavingText(null);
  }, [supportDrafts, updateContent, showToast]);

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

  // ─── Reset tab handlers ───────────────────────────────────────────────

  const reloadDraftsAfterReset = useCallback(async () => {
    await refreshContent();
    const freshText: Record<string, string> = {};
    for (const field of ALL_TEXT_FIELDS) {
      freshText[field.key] = field.fallback;
    }
    setTextDrafts(freshText);
    const freshSupport: Record<string, string> = {};
    for (const field of SUPPORT_SETTING_FIELDS) {
      freshSupport[field.field] = '';
    }
    setSupportDrafts(freshSupport);
    const freshImages: Record<string, string> = {};
    for (const field of IMAGE_FIELDS) {
      freshImages[field.key] = field.fallback;
    }
    setImageValues(freshImages);
  }, [refreshContent]);

  const handleResetSection = useCallback(
    async (section: ResetSection) => {
      const confirmed = await showConfirm(
        `This will reset ${section.title} back to the factory defaults. This cannot be undone.`,
        `Reset ${section.title}`,
        'Reset',
        'Cancel',
        'danger'
      );
      if (!confirmed) return;

      setResettingSection(section.id);
      try {
        for (const prefix of section.prefixes) {
          const { error } = await resetContent(prefix);
          if (error) throw new Error(error);
        }
        for (const key of section.keys) {
          const { error } = await supabase.from('global_settings').delete().eq('key', key);
          if (error) throw new Error(error.message);
        }
        await reloadDraftsAfterReset();
        showToast(`${section.title} reset to defaults`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to reset', 'error');
      } finally {
        setResettingSection(null);
      }
    },
    [showConfirm, resetContent, supabase, reloadDraftsAfterReset, showToast]
  );

  const handleResetEverything = useCallback(async () => {
    const confirmed = await showConfirm(
      'This will permanently reset ALL customizations — theme colors, text content (including legal documents), support info, FAQs, images, and logos — back to the original factory defaults. Every visitor will see the default site. This cannot be undone.',
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

      // 2. Reset every content section
      for (const section of RESET_SECTIONS) {
        for (const prefix of section.prefixes) {
          const result = await resetContent(prefix);
          if (result.error) throw new Error(result.error);
        }
        for (const key of section.keys) {
          const { error } = await supabase.from('global_settings').delete().eq('key', key);
          if (error) throw new Error(error.message);
        }
      }

      // 3. Refresh content state + local drafts
      await reloadDraftsAfterReset();
      setDraftTheme(DEFAULT_THEME);
      setThemeDirty(false);

      showToast('Everything reset to original state!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset';
      showToast(message, 'error');
    } finally {
      setResetting(false);
    }
  }, [showConfirm, resetTheme, resetContent, supabase, reloadDraftsAfterReset, showToast]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────

  if (!open) return null;

  // Role guard — only owners see the drawer content
  if (profile?.role !== 'owner') {
    return null;
  }

  const tabs: { id: TabId; label: string; icon: typeof Palette }[] = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'text', label: 'Content & Text', icon: Type },
    { id: 'images', label: 'Media & Images', icon: ImageIcon },
    { id: 'reset', label: 'Reset', icon: RotateCcw },
  ];

  const renderTextField = (field: TextField) => {
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-[var(--color-text-invert)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

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
                className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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

          {/* ─── Content & Text Tab ─── */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Edit key text sections across the site, grouped by area. Changes apply immediately
                to all visitors after saving.
              </p>

              {TEXT_GROUPS.map((group) => {
                const isOpen = !!openGroups[group.id];
                return (
                  <div key={group.id} className="rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                      aria-expanded={isOpen}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{group.title}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{group.description}</p>
                      </div>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-[var(--color-text-muted)] shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-[var(--color-text-muted)] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 space-y-5 bg-white">
                        {group.fields.map(renderTextField)}

                        {/* Support contact info lives inside the Support & FAQ group */}
                        {group.id === 'support' && (
                          <div className="pt-4 border-t border-gray-100 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                              Support Contact Info
                            </p>
                            {SUPPORT_SETTING_FIELDS.map((field) => (
                              <div key={field.field} className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                                  {field.label}
                                </label>
                                {field.multiline ? (
                                  <textarea
                                    value={supportDrafts[field.field] ?? ''}
                                    onChange={(e) => handleSupportChange(field.field, e.target.value)}
                                    rows={3}
                                    placeholder={field.placeholder}
                                    className="input-glass resize-none w-full text-sm"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={supportDrafts[field.field] ?? ''}
                                    onChange={(e) => handleSupportChange(field.field, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="input-glass w-full text-sm"
                                  />
                                )}
                              </div>
                            ))}
                            <div className="flex justify-end">
                              <button
                                onClick={handleSaveSupport}
                                disabled={savingText === 'support_settings'}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-[var(--color-text-invert)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
                              >
                                {savingText === 'support_settings' ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Save size={12} />
                                )}
                                {savingText === 'support_settings' ? 'Saving...' : 'Save Contact Info'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Media & Images Tab ─── */}
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
              <p className="text-xs text-[var(--color-text-muted)]">
                Revert a specific section back to factory defaults, or reset everything at once.
              </p>

              {RESET_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{section.description}</p>
                  </div>
                  <button
                    onClick={() => handleResetSection(section)}
                    disabled={resettingSection !== null || resetting}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resettingSection === section.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    Reset
                  </button>
                </div>
              ))}

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
                        All text content (hero, legal docs, footer) → original copy
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        Support info &amp; FAQs → factory defaults
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
                  disabled={resetting || resettingSection !== null}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-text-invert)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
