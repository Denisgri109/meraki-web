import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import pLimit from 'p-limit';

interface GrantPassesBody {
  packageId: string;
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

    const body = await req.json() as GrantPassesBody;
    const { packageId, targetScope } = body;

    if (!packageId || typeof packageId !== 'string') {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
    }

    if (!['all', 'clients', 'masters'].includes(targetScope)) {
      return NextResponse.json({ error: 'Invalid targetScope' }, { status: 400 });
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
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'grant_user_pass',
            {
              p_user_id: u.id,
              p_package_id: packageId,
              p_granted_by: user.id,
              p_note: 'Bulk grant by owner',
            }
          );

          if (rpcError) {
            return { userId: u.id, success: false, error: rpcError.message };
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
      failures,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
