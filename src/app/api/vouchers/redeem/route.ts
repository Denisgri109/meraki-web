import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Read-only voucher check for the checkout "Apply" button.
 *
 * This route used to call `redeem_voucher`, which is a *commit*: it writes the
 * redemption row and increments `current_uses`. Pressing Apply therefore burned
 * the voucher before the customer had paid, and the code was never passed on to
 * the charge — so the customer lost the voucher and was billed full price.
 *
 * `preview_voucher` runs the same validation ladder and writes nothing. The
 * voucher is only consumed once the customer proceeds to payment (via
 * `claim-voucher`, which is the ledger `create-stripe-session` reads).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { code, amount_cents } = body as { code: string; amount_cents?: number };

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    return NextResponse.json({ error: 'Voucher code is required.' }, { status: 400 });
  }

  if (amount_cents !== undefined && amount_cents !== null) {
    if (!Number.isInteger(amount_cents) || amount_cents < 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }
  }

  const { data, error } = await supabase.rpc('preview_voucher', {
    p_code: code.trim(),
    // The SQL parameter defaults to NULL, so omitting it is the same as passing null —
    // and the generated Args type only accepts undefined for an optional argument.
    p_amount_cents: amount_cents ?? undefined,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
