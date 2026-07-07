'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditMode } from '@/contexts/EditContext';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTextProps {
  contentKey: string;
  fallback: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  multiline?: boolean;
}

export function EditableText({
  contentKey,
  fallback,
  as: Tag = 'p',
  className = '',
  multiline = false,
}: EditableTextProps) {
  const { isEditMode, getContent, updateContent } = useEditMode();
  const value = getContent(contentKey, fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => {
    if (!isEditMode) return;
    setDraft(getContent(contentKey, fallback));
    setEditing(true);
  }, [isEditMode, getContent, contentKey, fallback]);

  const save = useCallback(async () => {
    setSaving(true);
    await updateContent(contentKey, draft);
    setSaving(false);
    setEditing(false);
  }, [draft, contentKey, updateContent]);

  const cancel = useCallback(() => {
    setDraft(getContent(contentKey, fallback));
    setEditing(false);
  }, [getContent, contentKey, fallback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <span className="relative inline-block w-full">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          rows={multiline ? 3 : 1}
          className={`w-full bg-white/90 border-2 border-pink-400 rounded-lg px-3 py-2 outline-none resize-none text-inherit font-inherit ${className}`}
          style={{ minHeight: '1.5em' }}
        />
        <span className="absolute -top-2 -right-2 flex gap-1">
          <button
            onMouseDown={(e) => { e.preventDefault(); save(); }}
            disabled={saving}
            className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md hover:bg-green-600"
          >
            <Check size={12} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); cancel(); }}
            className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </span>
      </span>
    );
  }

  return (
    <Tag
      className={`${className} ${isEditMode ? 'cursor-text rounded-md transition-all hover:bg-pink-50/60 hover:ring-2 hover:ring-pink-200 hover:ring-offset-1' : ''}`}
      onClick={startEditing}
      title={isEditMode ? 'Click to edit' : undefined}
    >
      {value}
      {isEditMode && (
        <Pencil size={12} className="inline-block ml-1.5 text-pink-400 opacity-60" />
      )}
    </Tag>
  );
}
