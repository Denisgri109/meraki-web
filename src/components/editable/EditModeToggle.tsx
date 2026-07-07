'use client';

import { useEditMode } from '@/contexts/EditContext';
import { Pencil, Check } from 'lucide-react';

export function EditModeToggle() {
  const { isEditMode, canEdit, toggleEditMode } = useEditMode();

  if (!canEdit) return null;

  return (
    <button
      onClick={toggleEditMode}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
        isEditMode
          ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300 ring-offset-1'
          : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
      }`}
      title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
    >
      {isEditMode ? <Check size={14} /> : <Pencil size={14} />}
      {isEditMode ? 'Editing' : 'Edit'}
    </button>
  );
}
