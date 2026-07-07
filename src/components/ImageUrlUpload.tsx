'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Check, X, Link2 } from 'lucide-react';

interface ImageUrlUploadProps {
  onUpload: (publicUrl: string) => void;
  bucket?: string;
  pathPrefix?: string;
  label?: string;
  compact?: boolean;
}

export function ImageUrlUpload({
  onUpload,
  bucket = 'site-images',
  pathPrefix = 'uploads',
  label = 'Add image by URL',
  compact = false,
}: ImageUrlUploadProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!url.trim()) {
      setError('Please paste an image URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/upload-image-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), bucket, pathPrefix }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      onUpload(data.publicUrl);
      setSuccess(true);
      setUrl('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpload();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste image URL..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={loading || !url.trim()}
          className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : success ? <Check size={14} /> : <Upload size={14} />}
          {loading ? '' : success ? 'Done' : 'Add'}
        </button>
        {error && <span className="text-xs text-red-500 absolute mt-8">{error}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-3">
        <Upload size={16} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/image.jpg"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
          disabled={loading}
        />
        <button
          onClick={handleUpload}
          disabled={loading || !url.trim()}
          className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <Check size={16} /> : <Upload size={16} />}
          {loading ? 'Uploading...' : success ? 'Added!' : 'Upload'}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
          <X size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
