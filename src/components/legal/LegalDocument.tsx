import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { EditableLegalBody } from '@/components/editable/EditableLegalBody';
import { createClient } from '@/lib/supabase/server';

/**
 * Shared shell for the public legal documents.
 *
 * The body text lives in `@/lib/constants/legal` as plain text so the owner
 * can edit it in place. This component turns that plain text into semantic
 * markup: a line like `3. Data we collect` becomes an `<h2>`, everything else
 * becomes a `<p>`. That keeps one copy of each document instead of a plain
 * string and a hand-maintained JSX duplicate that can drift apart.
 */

interface LegalDocumentProps {
  /** Page heading, e.g. 'Privacy Policy'. */
  title: string;
  /** One-line description under the heading. */
  intro?: string;
  /** `global_settings` key holding the owner override. */
  contentKey: string;
  /** Factory default body text. */
  defaultText: string;
}

/** A `2. Heading text` line — the section headings in the default bodies. */
const HEADING_RE = /^\d{1,2}\.\s+\S/;

function renderBody(text: string) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return blocks.map((block, i) => {
    if (HEADING_RE.test(block) && !block.includes('\n')) {
      return (
        <h2
          key={i}
          className="text-lg font-bold text-[var(--color-text-primary)] mt-8 mb-3 first:mt-0"
        >
          {block}
        </h2>
      );
    }
    return (
      <p key={i} className="mb-3 whitespace-pre-line">
        {block}
      </p>
    );
  });
}

export async function LegalDocument({
  title,
  intro,
  contentKey,
  defaultText,
}: LegalDocumentProps) {
  const supabase = await createClient();

  let override: string | null = null;
  try {
    const { data } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', contentKey)
      .maybeSingle();
    override = data?.value ?? null;
  } catch {
    // Fall back to the factory default if the settings lookup fails.
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      <main id="main-content" className="flex-grow pt-16 pb-32 px-6 section-lavender relative overflow-hidden">
        <div className="blob-pink -top-20 -left-40 opacity-10" aria-hidden="true" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] mb-4">
              {title}
            </h1>
            {intro && (
              <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">{intro}</p>
            )}
          </div>

          <article className="bg-white p-8 sm:p-12 rounded-[var(--radius-3xl)] text-sm text-[var(--color-text-secondary)] leading-relaxed shadow-sm border border-gray-100">
            <EditableLegalBody
              contentKey={contentKey}
              initialValue={override}
              defaultText={defaultText}
              label={title}
            >
              <>{renderBody(defaultText)}</>
            </EditableLegalBody>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
