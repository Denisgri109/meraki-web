'use client';

import { useState, useCallback } from 'react';
import { useEditMode } from '@/contexts/EditContext';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';
import { CustomizeDrawer } from '@/components/CustomizeDrawer';
import { Pencil, SlidersHorizontal, RotateCcw, X, Loader2 } from 'lucide-react';

/** Content prefixes owned by the visual editor (theme colors excluded). */
const CONTENT_RESET_PREFIXES = [
  'landing.',
  'portal.',
  'legal.',
  'image.',
  'brand.',
  'footer.',
  'about.',
  'contact.',
  'getapp.',
  'support.',
];

/**
 * Floating owner-only toolbar shown globally while Visual Edit Mode is ON.
 * Rendered once from the root layout (wrapped in Toast/Modal providers).
 * Strictly gated: renders nothing unless the user is an owner AND edit
 * mode is active, so clients/masters never see it.
 */
export function EditToolbar() {
  const { isEditMode, canEdit, setEditMode, resetContent, refreshContent } = useEditMode();
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetContent = useCallback(async () => {
    const confirmed = await showConfirm(
      'This will reset ALL text, image, logo and legal-document customizations back to the factory defaults. Theme colors are not affected. This cannot be undone.',
      'Reset Section Defaults',
      'Reset Content',
      'Cancel',
      'danger'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      for (const prefix of CONTENT_RESET_PREFIXES) {
        const { error } = await resetContent(prefix);
        if (error) throw new Error(error);
      }
      await refreshContent();
      showToast('Content reset to defaults', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset content', 'error');
    } finally {
      setResetting(false);
    }
  }, [showConfirm, resetContent, refreshContent, showToast]);

  if (!canEdit || !isEditMode) return null;

  return (
    <>
      <div
        role="toolbar"
        aria-label="Visual edit mode toolbar"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-2 sm:gap-3 pl-4 pr-2 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.18)] animate-fade-in max-w-[calc(100vw-1rem)] overflow-x-auto"
      >
        {/* Status badge */}
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <Pencil size={12} className="text-pink-500" />
          Visual Edit Mode Active
        </span>

        <span className="hidden sm:block w-px h-5 bg-gray-300/70" aria-hidden="true" />

        {/* Quick actions */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal size={12} />
          Open Settings Drawer
        </button>

        <button
          onClick={handleResetContent}
          disabled={resetting}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {resetting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          {resetting ? 'Resetting...' : 'Reset Section Defaults'}
        </button>

        <button
          onClick={() => setEditMode(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <X size={12} />
          Exit Edit Mode
        </button>
      </div>

      <CustomizeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
