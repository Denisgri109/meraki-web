'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EditContextType {
  isEditMode: boolean;
  canEdit: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
  /** True until the first content fetch resolves (false when SSR seeded it). */
  loading: boolean;
  content: Record<string, string>;
  getContent: (key: string, fallback: string) => string;
  updateContent: (key: string, value: string) => Promise<{ error: string | null }>;
  /** Delete a single override so the built-in default applies again. */
  clearContent: (key: string) => Promise<{ error: string | null }>;
  refreshContent: () => Promise<void>;
  resetContent: (prefix?: string) => Promise<{ error: string | null }>;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditProvider({
  children,
  initialContent,
}: {
  children: ReactNode;
  initialContent?: Record<string, string>;
}) {
  const { profile, user } = useAuth();
  const canEdit = profile?.role === 'owner';
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<Record<string, string>>(initialContent ?? {});
  const [loading, setLoading] = useState(
    !(initialContent && Object.keys(initialContent).length > 0)
  );
  const supabase = createClient();

  // Keeps the latest map available to callbacks without re-creating them.
  const contentRef = useRef<Record<string, string>>(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const fetchContent = useCallback(async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('key, value');

    if (error) {
      console.error('[EditContext] Error fetching content:', error);
      return;
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.key] = row.value;
    }
    setContent(map);
  }, [supabase]);

  useEffect(() => {
    if (initialContent && Object.keys(initialContent).length > 0) return;
    // fetchContent calls setState asynchronously — standard data-fetch pattern
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContent().finally(() => setLoading(false));
  }, [fetchContent, initialContent]);

  // Live-sync edits made from another tab, another device, or the mobile app.
  useEffect(() => {
    const channel = supabase
      .channel('global_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_settings' },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchContent]);

  useEffect(() => {
    if (!canEdit && isEditMode) {
      setIsEditMode(false);
    }
  }, [canEdit, isEditMode]);

  // An empty stored value means "no override", so clearing a field restores
  // the built-in default rather than rendering blank.
  const getContent = useCallback(
    (key: string, fallback: string) => {
      const value = content[key];
      return value === undefined || value === '' ? fallback : value;
    },
    [content]
  );

  const updateContent = useCallback(
    async (key: string, value: string) => {
      if (!user) return { error: 'Not authenticated' };
      if (!canEdit) return { error: 'Only owners can edit content' };

      const previous = contentRef.current[key];

      setContent((prev) => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from('global_settings')
        .upsert(
          { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('[EditContext] Error saving:', error);
        // Restore the pre-save value. Deleting the key would wipe an existing
        // customization from the UI even though the database still holds it.
        setContent((prev) => {
          const next = { ...prev };
          if (previous === undefined) delete next[key];
          else next[key] = previous;
          return next;
        });
        return { error: error.message };
      }

      return { error: null };
    },
    [user, canEdit, supabase]
  );

  const clearContent = useCallback(
    async (key: string) => {
      if (!user) return { error: 'Not authenticated' };
      if (!canEdit) return { error: 'Only owners can reset content' };

      const previous = contentRef.current[key];
      if (previous === undefined) return { error: null };

      setContent((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      const { error } = await supabase.from('global_settings').delete().eq('key', key);

      if (error) {
        console.error('[EditContext] Error clearing content:', error);
        setContent((prev) => ({ ...prev, [key]: previous }));
        return { error: error.message };
      }

      return { error: null };
    },
    [user, canEdit, supabase]
  );

  const toggleEditMode = useCallback(() => {
    if (canEdit) {
      setIsEditMode((prev) => !prev);
    }
  }, [canEdit]);

  const setEditMode = useCallback(
    (enabled: boolean) => {
      if (canEdit) {
        setIsEditMode(enabled);
      }
    },
    [canEdit]
  );

  const refreshContent = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  const resetContent = useCallback(
    async (prefix = 'landing.') => {
      if (!user) return { error: 'Not authenticated' };
      if (!canEdit) return { error: 'Only owners can reset content' };

      const keysToDelete = Object.keys(content).filter((k) => k.startsWith(prefix));

      if (keysToDelete.length === 0) {
        return { error: null };
      }

      setContent((prev) => {
        const next = { ...prev };
        for (const k of keysToDelete) delete next[k];
        return next;
      });

      const { error } = await supabase
        .from('global_settings')
        .delete()
        .filter('key', 'like', `${prefix}%`);

      if (error) {
        console.error('[EditContext] Error resetting content:', error);
        await fetchContent();
        return { error: error.message };
      }

      return { error: null };
    },
    [user, canEdit, content, supabase, fetchContent]
  );

  return (
    <EditContext.Provider
      value={{
        isEditMode,
        canEdit,
        toggleEditMode,
        setEditMode,
        loading,
        content,
        getContent,
        updateContent,
        clearContent,
        refreshContent,
        resetContent,
      }}
    >
      {children}
    </EditContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditProvider');
  }
  return context;
}
