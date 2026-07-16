'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';

export interface DeleteButtonProps {
  /** Supabase table name, e.g. 'products' */
  table: string;
  /** Row ID to delete */
  id: string;
  /** Human label for confirmation message, e.g. 'product' */
  entityName: string;
  /** Optional specific label, e.g. 'Nail Polish Remover' */
  entityLabel?: string;
  /** Callback after successful deletion (to update local state) */
  onDeleted?: () => void;
  /** Icon size, default 16 */
  size?: number;
  /** Additional classes */
  className?: string;
  /** Disable deletion (e.g., for protected records) */
  disabled?: boolean;
  /** If true (default), only render when role === 'owner' */
  requireOwner?: boolean;
}

export function DeleteButton({
  table,
  id,
  entityName,
  entityLabel,
  onDeleted,
  size = 16,
  className = '',
  disabled = false,
  requireOwner = true,
}: DeleteButtonProps) {
  const { role } = useAuth();
  const { showConfirm } = useModal();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  // Only render for owner when requireOwner is true
  if (requireOwner && role !== 'owner') {
    return null;
  }

  const handleClick = async () => {
    if (disabled || deleting) return;

    const message = entityLabel
      ? `Are you sure you want to delete this ${entityName} (${entityLabel})?`
      : `Are you sure you want to delete this ${entityName}?`;

    const confirmed = await showConfirm(
      message,
      `Delete ${entityName}`,
      'Delete',
      'Cancel',
      'danger'
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      // Dynamic table name requires unknown cast since Supabase types are per-table
      const { error } = await (supabase as unknown as {
        from: (t: string) => { delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } };
      }).from(table).delete().eq('id', id);

      if (error) {
        showToast(error.message || 'Failed to delete', 'error');
        return;
      }

      showToast('Deleted', 'success');
      onDeleted?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const buttonClasses = [
    'p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors cursor-pointer',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      onClick={handleClick}
      disabled={disabled || deleting}
      title="Delete"
      className={buttonClasses}
    >
      {deleting ? (
        <Loader2 size={size} className="animate-spin" />
      ) : (
        <Trash2 size={size} />
      )}
    </button>
  );
}

export default DeleteButton;
