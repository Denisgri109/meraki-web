'use client';

import { useEffect, useState } from 'react';
import { useEditMode } from '@/contexts/EditContext';
import { EditableText } from '@/components/editable/EditableText';

/**
 * Static default logo served from /public/brand/logo.png.
 * Drop a `logo.png` file in `public/brand/` and it will appear in the top-left.
 */
const DEFAULT_LOGO_PATH = '/brand/logo.png';

interface LogoProps {
  /** ClassName applied to the rendered <img> (both DB logo and static fallback). */
  imgClassName?: string;
  /** ClassName applied to the <EditableText> text fallback. */
  textClassName?: string;
}

/**
 * Top-left brand logo. Resolution order:
 *   1. Owner-uploaded logo from EditContext (`image.logo`) — highest priority.
 *   2. Static file at `/brand/logo.png` — probed at runtime via `new Image()`;
 *      renders only if the file loads.
 *   3. Editable text fallback (`brand.logo_text` → "Merakí") — shown while the
 *      static file has not been probed or if it fails to load. Keeps the text
 *      in the DOM (preserves inline-edit + existing tests).
 */
export function Logo({ imgClassName = 'h-20 w-auto object-contain', textClassName = '' }: LogoProps) {
  const { getContent } = useEditMode();
  const logoUrl = getContent('image.logo', '');
  const brandAlt = getContent('brand.logo_text', 'Merakí');

  // null  = not yet probed (show text fallback)
  // true  = static logo file exists (show <img>)
  // false = static logo file missing/errored (show text fallback)
  const [staticLogoOk, setStaticLogoOk] = useState<boolean | null>(null);

  useEffect(() => {
    // DB-uploaded logo takes priority; no need to probe the static file.
    if (logoUrl) {
      setStaticLogoOk(null);
      return;
    }
    let cancelled = false;
    const probe = new Image();
    probe.src = DEFAULT_LOGO_PATH;
    probe.onload = () => { if (!cancelled) setStaticLogoOk(true); };
    probe.onerror = () => { if (!cancelled) setStaticLogoOk(false); };
    return () => { cancelled = true; };
  }, [logoUrl]);

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={brandAlt} className={imgClassName} />
    );
  }

  if (staticLogoOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={DEFAULT_LOGO_PATH} alt={brandAlt} className={imgClassName} />
    );
  }

  return (
    <EditableText
      contentKey="brand.logo_text"
      fallback="Merakí"
      as="span"
      className={textClassName}
    />
  );
}
