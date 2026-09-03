'use client';

import { useEditMode } from '@/contexts/EditContext';
import { EditableText } from '@/components/editable/EditableText';

interface LogoProps {
  /** ClassName applied to the rendered <img> when the owner has uploaded a logo. */
  imgClassName?: string;
  /** ClassName applied to the <EditableText> wordmark. */
  textClassName?: string;
}

/**
 * Top-left brand mark. Resolution order:
 *   1. Owner-uploaded logo from EditContext (`image.logo`), set under Customize → Site Logo.
 *   2. The editable wordmark (`brand.logo_text` → "Merakí"), rendered as plain text with no
 *      background so it sits on the navbar's own surface.
 */
export function Logo({ imgClassName = 'h-20 w-auto object-contain', textClassName = '' }: LogoProps) {
  const { getContent } = useEditMode();
  const logoUrl = getContent('image.logo', '');
  const brandAlt = getContent('brand.logo_text', 'Merakí');

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={brandAlt} className={imgClassName} />
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
