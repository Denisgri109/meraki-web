'use client';

import { useState, useCallback } from 'react';
import { useEditMode } from '@/contexts/EditContext';
import { ImageUrlUpload } from '@/components/ImageUrlUpload';
import { ImagePlus, RotateCcw } from 'lucide-react';

interface EditableImageProps {
  contentKey: string;
  fallback: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  bucket?: string;
  pathPrefix?: string;
}

export function EditableImage({
  contentKey,
  fallback,
  alt,
  className = '',
  imgClassName = '',
  bucket = 'site-images',
  pathPrefix = 'site-content',
}: EditableImageProps) {
  const { isEditMode, getContent, updateContent } = useEditMode();
  const src = getContent(contentKey, fallback);
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = useCallback(
    async (publicUrl: string) => {
      await updateContent(contentKey, publicUrl);
      setShowUpload(false);
    },
    [contentKey, updateContent]
  );

  const handleReset = useCallback(async () => {
    await updateContent(contentKey, fallback);
  }, [contentKey, fallback, updateContent]);

  return (
    <div className={`relative group ${className}`}>
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallback;
        }}
      />

      {isEditMode && (
        <>
          <div className="absolute inset-0 ring-2 ring-pink-400 ring-offset-1 rounded-inherit pointer-events-none" />

          {!showUpload && (
            <div className="absolute top-2 right-2 flex gap-1.5 z-10">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-pink-500 text-white shadow-md hover:bg-pink-600 transition-colors"
              >
                <ImagePlus size={14} />
                Replace
              </button>
              {src !== fallback && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-gray-600 text-white shadow-md hover:bg-gray-700 transition-colors"
                  title="Reset to default"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          )}

          {showUpload && (
            <div className="absolute inset-0 z-20 bg-white/95 rounded-inherit flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <ImageUrlUpload
                  onUpload={handleUpload}
                  bucket={bucket}
                  pathPrefix={pathPrefix}
                  label={`Replace image: ${alt}`}
                  compact={false}
                />
                <button
                  onClick={() => setShowUpload(false)}
                  className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
