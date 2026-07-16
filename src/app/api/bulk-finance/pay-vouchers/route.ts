import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import pLimit from 'p-limit';

interface PayVouchersBody {
  amountCents: number;
  description: string;
  targetScope: 'all' | 'clients' | 'masters';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden — Owner only' }, { status: 403 });
    }

    const body = await req.json() as PayVouchersBody;
    const { amountCents, description, targetScope } = body;

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'amountCents must be a positive number' }, { status: 400 });
    }

    if (!['all', 'clients', 'masters'].includes(targetScope)) {
      return NextResponse.json({ error: 'Invalid targetScope' }, { status: 400 });
    }

    const voucherCode = 'PAYVOUCHER_' + Date.now();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: newVoucher, error: voucherError } = await supabase
      .from('vouchers')
      .insert({
        code: voucherCode,
        discount_type: 'fixed_amount',
        discount_value: amountCents,
        max_uses: 999999,
        is_active: true,
        expires_at: expiresAt,
        description: description || 'Pay voucher distribution',
      })
      .select()
      .single();

    if (voucherError || !newVoucher) {
      return NextResponse.json({ error: 'Failed to create pay voucher' }, { status: 500 });
    }

    let usersQuery = supabase.from('profiles').select('id');
    if (targetScope === 'clients') {
      usersQuery = usersQuery.eq('role', 'client');
    } else if (targetScope === 'masters') {
      usersQuery = usersQuery.eq('role', 'master');
    }

    const { data: users, error: usersError } = await usersQuery;
    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const limit = pLimit(5);
    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ userId: string; error: string }> = [];

    const results = await Promise.all(
      users.map((u: { id: string }) =>
        limit(async () => {
          const { error: insertError } = await supabase
            .from('user_vouchers')
            .insert({
              user_id: u.id,
              voucher_id: newVoucher.id,
              is_used: false,
              expires_at: expiresAt,
            });

          if (insertError) {
            return { userId: u.id, success: false, error: insertError.message };
          }

          return { userId: u.id, success: true };
        })
      )
    );

    for (const r of results) {
      if (r.success) {
        successCount++;
      } else {
        failureCount++;
        failures.push({ userId: r.userId, error: r.error || 'Unknown error' });
      }
    }

    return NextResponse.json({
      totalUsers: users.length,
      successCount,
      failureCount,
      voucherCode: voucherCode,
      failures,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
