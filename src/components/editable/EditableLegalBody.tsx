'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditMode } from '@/contexts/EditContext';
import { Pencil, Check, X, Loader2, RotateCcw } from 'lucide-react';

interface EditableLegalBodyProps {
  /** global_settings key, e.g. 'legal.tos_body' */
  contentKey: string;
  /** Server-fetched override so the first client render matches SSR. */
  initialValue: string | null;
  /** Factory plain-text default used to seed the editor. */
  defaultText: string;
  /** Human label used on the edit button, e.g. 'Terms of Service'. */
  label: string;
  /** Rich default markup rendered while no override exists. */
  children: React.ReactNode;
}

/**
 * Renders a legal document body that owners can replace with custom text.
 * - No override saved → renders the rich default `children`.
 * - Override saved → renders the custom text with preserved line breaks.
 * - Owner edit mode → shows an "Edit document" trigger with a full
 *   multiline editor (save publishes globally, clearing restores default).
 */
export function EditableLegalBody({
  contentKey,
  initialValue,
  defaultText,
  label,
  children,
}: EditableLegalBodyProps) {
  const router = useRouter();
  const { isEditMode, canEdit, content, updateContent } = useEditMode();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefer live context once loaded; fall back to the server-rendered value
  // so the first client render matches SSR and hydration stays clean.
  const override = contentKey in content ? content[contentKey] : (initialValue ?? '');

  const startEditing = useCallback(() => {
    setDraft(override || defaultText);
    setEditing(true);
  }, [override, defaultText]);

  const save = useCallback(async () => {
    setSaving(true);
    // Saving an empty body restores the rich factory default.
    const { error } = await updateContent(contentKey, draft.trim() === defaultText.trim() ? '' : draft);
    setSaving(false);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
  }, [contentKey, draft, defaultText, updateContent, router]);

  const restoreDefault = useCallback(async () => {
    setSaving(true);
    const { error } = await updateContent(contentKey, '');
    setSaving(false);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
  }, [contentKey, updateContent, router]);

  if (editing && isEditMode && canEdit) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-pink-600 flex items-center gap-1.5">
            <Pencil size={12} />
            Editing {label} — plain text, blank lines separate sections
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={restoreDefault}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={12} />
              Restore Default
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={12} />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={24}
          className="w-full bg-white border-2 border-pink-400 rounded-xl px-4 py-3 outline-none resize-y text-sm leading-relaxed text-[var(--color-text-secondary)] font-mono"
          aria-label={`${label} body editor`}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {isEditMode && canEdit && (
        <button
          onClick={startEditing}
          className="absolute -top-3 right-0 z-20 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-pink-500 text-white shadow-md hover:bg-pink-600 transition-colors cursor-pointer"
          title={`Edit ${label}`}
        >
          <Pencil size={12} />
          Edit {label}
        </button>
      )}
      {override ? (
        <div className="whitespace-pre-wrap">{override}</div>
      ) : (
        children
      )}
    </div>
  );
}
