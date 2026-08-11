import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import net from 'node:net';
import { createClient } from '@/lib/supabase/server';

// SVG is deliberately excluded: SVGs can carry <script>, and objects in this
// bucket are served from a public storage origin.
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Every caller of this route (CustomizeDrawer, EditableImage, QrPayMethodsManager)
// writes to site-images. Allowlisting stops a caller naming any other bucket.
const ALLOWED_BUCKETS = ['site-images'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Blocks loopback, link-local (incl. 169.254.169.254 cloud metadata), private,
 * CGNAT and multicast/reserved ranges so this route cannot be used to read
 * internal services and re-host the response at a public URL.
 */
function isBlockedAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  const v6 = ip.toLowerCase();
  if (v6 === '::' || v6 === '::1') return true;
  if (v6.startsWith('fc') || v6.startsWith('fd')) return true; // unique local
  if (v6.startsWith('fe80')) return true; // link-local
  if (v6.startsWith('::ffff:')) return isBlockedAddress(v6.slice(7)); // v4-mapped
  return true; // unknown format — fail closed
}

/** Keeps a caller-supplied prefix inside the bucket and free of traversal. */
function sanitisePathPrefix(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim() === '') return 'uploads';
  const cleaned = raw
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
    .slice(0, 4)
    .join('/');
  return cleaned || 'uploads';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the owner customizes site imagery, so only the owner may make the
    // server fetch a remote URL.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
    }

    const body = await request.json();
    const { url, bucket = 'site-images' } = body;
    const pathPrefix = sanitisePathPrefix(body.pathPrefix);

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (typeof bucket !== 'string' || !ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Unsupported storage bucket' }, { status: 400 });
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

    if (parsedUrl.port !== '' && parsedUrl.port !== '80' && parsedUrl.port !== '443') {
      return NextResponse.json({ error: 'Only ports 80 and 443 are allowed' }, { status: 400 });
    }

    // Resolve the host and refuse anything pointing at internal space.
    // (A rebinding attacker could still swap the answer between this check and
    // the fetch; an egress proxy would be the complete fix.)
    let addresses: { address: string }[];
    try {
      addresses = await dns.lookup(parsedUrl.hostname, { all: true });
    } catch {
      return NextResponse.json({ error: 'Could not resolve image host' }, { status: 400 });
    }

    if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
      return NextResponse.json({ error: 'This host is not allowed' }, { status: 400 });
    }

    // Redirects are not followed: a 302 to an internal address would bypass
    // the check above.
    const response = await fetch(parsedUrl.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: 'Redirects are not supported' }, { status: 400 });
    }

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

    const ext = matchedType.split('/')[1];
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
