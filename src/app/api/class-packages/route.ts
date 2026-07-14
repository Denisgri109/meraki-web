import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

/**
 * Owner-only CRUD for the class package catalog (class_packages).
 * Mirrors the access-control pattern in /api/vouchers/route.ts:
 *   getUser → profiles.role === 'owner' gate → RLS also enforces owner-only writes.
 *
 * GET    /api/class-packages        → list all packages (owner) | active packages (client)
 * POST   /api/class-packages        → create a package (owner only)
 * PATCH  /api/class-packages        → update fields / toggle is_active (owner only)
 */

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isOwner: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return { supabase, user, isOwner: profile?.role === 'owner' };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Owner sees all packages (incl. inactive); clients only see active ones.
  const query = supabase
    .from('class_packages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (profile?.role !== 'owner') {
    query.eq('is_active', true);
  }

  const { data: packages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const { supabase, user, isOwner } = await requireOwner();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isOwner) return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });

  const body = await req.json();
  const { name, description, total_credits, price_cents, validity_days, sort_order } = body as {
    name?: string;
    description?: string;
    total_credits?: number;
    price_cents?: number;
    validity_days?: number | null;
    sort_order?: number;
  };

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Package name must be at least 2 characters.' }, { status: 400 });
  }
  if (!Number.isInteger(total_credits) || (total_credits as number) <= 0) {
    return NextResponse.json({ error: 'Total credits must be a positive whole number.' }, { status: 400 });
  }
  if (!Number.isInteger(price_cents) || (price_cents as number) < 0) {
    return NextResponse.json({ error: 'Price must be a non-negative whole number of cents.' }, { status: 400 });
  }
  if (validity_days != null && (!Number.isInteger(validity_days) || validity_days <= 0)) {
    return NextResponse.json({ error: 'Validity days must be a positive whole number or omitted for no expiry.' }, { status: 400 });
  }

  // After validation these are concrete values; type them so supabase-js's
  // RejectExcessProperties check on the Insert literal passes cleanly.
  const insert: Database['public']['Tables']['class_packages']['Insert'] = {
    owner_id: user.id,
    name: name.trim(),
    description: description?.trim() || null,
    total_credits: total_credits as number,
    price_cents: price_cents as number,
    validity_days: validity_days ?? null,
    sort_order: typeof sort_order === 'number' ? sort_order : 0,
    is_active: true,
  };

  const { data: pkg, error } = await supabase
    .from('class_packages')
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ package: pkg }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, isOwner } = await requireOwner();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isOwner) return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });

  const body = await req.json();
  const { id, ...fields } = body as {
    id?: string;
    name?: string;
    description?: string | null;
    total_credits?: number;
    price_cents?: number;
    validity_days?: number | null;
    is_active?: boolean;
    sort_order?: number;
  };

  if (!id) return NextResponse.json({ error: 'Package id is required.' }, { status: 400 });

  // Build a whitelist of allowed updates so clients can't set owner_id etc.
  // Typed against the generated Update type so supabase-js accepts it.
  const update: Database['public']['Tables']['class_packages']['Update'] = {};
  if (typeof fields.name === 'string') update.name = fields.name.trim();
  if (fields.description !== undefined) update.description = fields.description?.trim() || null;
  if (Number.isInteger(fields.total_credits) && fields.total_credits! > 0) update.total_credits = fields.total_credits;
  if (Number.isInteger(fields.price_cents) && fields.price_cents! >= 0) update.price_cents = fields.price_cents;
  if (fields.validity_days === null || (Number.isInteger(fields.validity_days) && fields.validity_days! > 0)) {
    update.validity_days = fields.validity_days ?? null;
  }
  if (typeof fields.is_active === 'boolean') update.is_active = fields.is_active;
  if (Number.isInteger(fields.sort_order)) update.sort_order = fields.sort_order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { data: pkg, error } = await supabase
    .from('class_packages')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ package: pkg });
}
