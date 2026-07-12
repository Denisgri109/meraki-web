import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_DISCOUNT_TYPES = ['free_month', 'percentage', 'free_trial', 'fixed_amount'] as const;
type DiscountType = typeof VALID_DISCOUNT_TYPES[number];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const { data: vouchers, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vouchers });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const body = await req.json();
  const { code, discount_type, discount_value, max_uses, description } = body as {
    code: string;
    discount_type: string;
    discount_value: number;
    max_uses?: number;
    description?: string;
  };

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    return NextResponse.json({ error: 'Voucher code must be at least 3 characters.' }, { status: 400 });
  }

  if (!VALID_DISCOUNT_TYPES.includes(discount_type as DiscountType)) {
    return NextResponse.json({ error: 'Invalid discount type.' }, { status: 400 });
  }

  if (typeof discount_value !== 'number' || discount_value < 0) {
    return NextResponse.json({ error: 'Discount value must be a non-negative number.' }, { status: 400 });
  }

  if (discount_type === 'percentage' && discount_value > 100) {
    return NextResponse.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
  }

  const dt = discount_type as DiscountType;
  const storedValue =
    dt === 'free_month' || dt === 'free_trial' ? 100 : Math.round(discount_value);

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .insert({
      code: code.trim().toUpperCase(),
      discount_type: dt,
      discount_value: storedValue,
      max_uses: max_uses ?? 1,
      is_active: true,
      created_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      benefit_expires_days: 7,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A voucher with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voucher }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
  }

  const body = await req.json();
  const { id, is_active } = body as { id: string; is_active: boolean };

  if (!id) return NextResponse.json({ error: 'Voucher ID required.' }, { status: 400 });

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ voucher });
}
