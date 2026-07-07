import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, bucket = 'site-images', pathPrefix = 'uploads' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image (status ${response.status})` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const matchedType = ALLOWED_CONTENT_TYPES.find((t) => contentType.includes(t));

    if (!matchedType) {
      return NextResponse.json(
        { error: `Unsupported image type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}` },
        { status: 415 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Image too large (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Max: 10 MB` },
        { status: 413 }
      );
    }

    const ext = matchedType.split('/')[1].replace('svg+xml', 'svg');
    const fileName = `${pathPrefix}/${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: matchedType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload-image-url] Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({
      publicUrl: publicUrlData.publicUrl,
      path: fileName,
      bucket,
    });
  } catch (err) {
    console.error('[upload-image-url] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
