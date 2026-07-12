import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { code, amount_cents } = body as { code: string; amount_cents?: number };

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    return NextResponse.json({ error: 'Voucher code is required.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('redeem_voucher', {
    p_code: code.trim(),
    p_user_id: user.id,
    p_amount_cents: amount_cents ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
