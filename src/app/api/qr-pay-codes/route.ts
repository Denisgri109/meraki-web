import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type QrPayCodeUpdate = Database['public']['Tables']['qr_pay_codes']['Update'];

// ─── Helpers ────────────────────────────────────────────────────────────────
// Load the caller's role + can_view_qr_pay flag in a single query.
// Returns null when unauthenticated.
async function getCaller(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_view_qr_pay')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile };
}

// GET — Owner: all codes. Authorized instructor: active only. Else: 403.
// RLS is defense-in-depth; this role check is the explicit gate.
export async function GET() {
  const supabase = await createClient();
  const caller = await getCaller(supabase);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = caller.profile?.role;
  const canView = caller.profile?.can_view_qr_pay === true;

  if (role !== 'owner' && !(role === 'master' && canView)) {
    return NextResponse.json(
      { error: 'Forbidden — QR Pay access not granted' },
      { status: 403 },
    );
  }

  let query = supabase
    .from('qr_pay_codes')
    .select('id, provider_name, qr_image_url, qr_payload, display_order, is_active, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  // Instructors only ever see active rows. RLS also enforces this, but we
  // filter here so the response shape is correct even if RLS changes.
  if (role !== 'owner') {
    query = query.eq('is_active', true);
  }

  const { data: codes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ codes });
}

// POST — Owner only. Create a code with exactly one QR source.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const caller = await getCaller(supabase);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const body = await req.json();
  const {
    provider_name,
    qr_image_url,
    qr_payload,
    display_order,
    is_active,
  } = body as {
    provider_name?: string;
    qr_image_url?: string | null;
    qr_payload?: string | null;
    display_order?: number;
    is_active?: boolean;
  };

  if (!provider_name || typeof provider_name !== 'string' || provider_name.trim().length < 1) {
    return NextResponse.json({ error: 'Provider name is required.' }, { status: 400 });
  }

  const hasImage = typeof qr_image_url === 'string' && qr_image_url.trim().length > 0;
  const hasPayload = typeof qr_payload === 'string' && qr_payload.trim().length > 0;

  if (hasImage === hasPayload) {
    return NextResponse.json(
      { error: 'Provide exactly one of qr_image_url or qr_payload.' },
      { status: 400 },
    );
  }

  const { data: code, error } = await supabase
    .from('qr_pay_codes')
    .insert({
      provider_name: provider_name.trim(),
      qr_image_url: hasImage ? (qr_image_url as string).trim() : null,
      qr_payload: hasPayload ? (qr_payload as string).trim() : null,
      display_order: typeof display_order === 'number' ? display_order : 0,
      is_active: typeof is_active === 'boolean' ? is_active : true,
      created_by: caller.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ code }, { status: 201 });
}

// PATCH — Owner only. Update fields / toggle is_active.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const caller = await getCaller(supabase);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const body = await req.json();
  const {
    id,
    provider_name,
    qr_image_url,
    qr_payload,
    display_order,
    is_active,
  } = body as {
    id?: string;
    provider_name?: string;
    qr_image_url?: string | null;
    qr_payload?: string | null;
    display_order?: number;
    is_active?: boolean;
  };

  if (!id) return NextResponse.json({ error: 'Code id required.' }, { status: 400 });

  const update: QrPayCodeUpdate = {};
  if (typeof provider_name === 'string') update.provider_name = provider_name.trim();
  if (typeof display_order === 'number') update.display_order = display_order;
  if (typeof is_active === 'boolean') update.is_active = is_active;

  // When changing the QR source, enforce exactly-one semantics.
  if (qr_image_url !== undefined || qr_payload !== undefined) {
    const image = typeof qr_image_url === 'string' ? qr_image_url.trim() : null;
    const payload = typeof qr_payload === 'string' ? qr_payload.trim() : null;
    if ((image && payload) || (!image && !payload)) {
      return NextResponse.json(
        { error: 'Provide exactly one of qr_image_url or qr_payload.' },
        { status: 400 },
      );
    }
    update.qr_image_url = image;
    update.qr_payload = payload;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const { data: code, error } = await supabase
    .from('qr_pay_codes')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ code });
}

// DELETE — Owner only. Hard-delete a code by id.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const caller = await getCaller(supabase);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Code id required.' }, { status: 400 });

  const { error } = await supabase.from('qr_pay_codes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
