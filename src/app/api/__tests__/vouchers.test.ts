jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    constructor(url: string) { this.url = url; }
    json() { return Promise.resolve({}); }
  },
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { GET as GetVouchers, POST as PostVoucher, PATCH as PatchVoucher } from '@/app/api/vouchers/route';
import { POST as RedeemVoucher } from '@/app/api/vouchers/redeem/route';

function makeChainable(finalResult: any, error: any = null) {
  const self: any = {
    then: (resolve: any, reject?: any) => Promise.resolve({ data: finalResult, error }).then(resolve, reject),
  };
  for (const m of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'maybeSingle', 'single']) {
    self[m] = jest.fn(() => self);
  }
  return self;
}

function makeMockSupabase(opts: {
  user?: any;
  profile?: any;
  vouchers?: any[];
  insertResult?: any;
  updateResult?: any;
  rpcResult?: any;
  rpcError?: any;
}) {
  const {
    user = { id: 'u1' },
    profile = { role: 'owner' },
    vouchers = [],
    insertResult = { id: 'v1' },
    updateResult = { id: 'v1' },
    rpcResult = { success: true },
    rpcError = null,
  } = opts;

  return {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user } })),
    },
    from: jest.fn((table: string) => {
      if (table === 'profiles') return makeChainable(profile);
      if (table === 'vouchers') {
        const chain = makeChainable(vouchers.length ? vouchers : insertResult);
        return chain;
      }
      return makeChainable(null);
    }),
    rpc: jest.fn(() => Promise.resolve({ data: rpcResult, error: rpcError })),
  };
}

function makeReq(body?: any, _method = 'POST') {
  return {
    url: 'http://localhost/api/vouchers',
    json: async () => body ?? {},
  } as any;
}

// ─── Vouchers CRUD ─────────────────────────────────────────────────────────

describe('GET /api/vouchers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await GetVouchers();
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await GetVouchers();
    expect(res.status).toBe(403);
  });

  it('returns vouchers for owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ vouchers: [{ id: 'v1' }] }));
    const res = await GetVouchers();
    expect(res.status).toBe(200);
  });
});

describe('POST /api/vouchers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'percentage', discount_value: 10 }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'percentage', discount_value: 10 }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when code too short', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PostVoucher(makeReq({ code: 'AB', discount_type: 'percentage', discount_value: 10 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when discount_type invalid', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'invalid', discount_value: 10 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when discount_value negative', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'percentage', discount_value: -5 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when percentage > 100', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'percentage', discount_value: 150 }));
    expect(res.status).toBe(400);
  });

  it('returns 201 on successful creation', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ insertResult: { id: 'v1', code: 'TEST' } }));
    const res = await PostVoucher(makeReq({ code: 'TEST', discount_type: 'percentage', discount_value: 10 }));
    expect(res.status).toBe(201);
  });

  it('accepts free_month discount type', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ insertResult: { id: 'v2' } }));
    const res = await PostVoucher(makeReq({ code: 'FREE', discount_type: 'free_month', discount_value: 0 }));
    expect(res.status).toBe(201);
  });

  it('accepts fixed_amount discount type', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ insertResult: { id: 'v3' } }));
    const res = await PostVoucher(makeReq({ code: 'FIXED', discount_type: 'fixed_amount', discount_value: 500 }));
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/vouchers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await PatchVoucher(makeReq({ id: 'v1', is_active: false }, 'PATCH'));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await PatchVoucher(makeReq({ id: 'v1', is_active: false }, 'PATCH'));
    expect(res.status).toBe(403);
  });

  it('returns 400 when id missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PatchVoucher(makeReq({ is_active: false }, 'PATCH'));
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful update', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ updateResult: { id: 'v1', is_active: false } }));
    const res = await PatchVoucher(makeReq({ id: 'v1', is_active: false }, 'PATCH'));
    expect(res.status).toBe(200);
  });
});

// ─── Voucher Redeem ────────────────────────────────────────────────────────

describe('POST /api/vouchers/redeem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await RedeemVoucher(makeReq({ code: 'TEST' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when code too short', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await RedeemVoucher(makeReq({ code: 'AB' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when code missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await RedeemVoucher(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 500 when RPC fails', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ rpcError: { message: 'Voucher expired' } }));
    const res = await RedeemVoucher(makeReq({ code: 'TEST' }));
    expect(res.status).toBe(500);
  });

  it('returns success when RPC succeeds', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ rpcResult: { success: true, discount: 10 } }));
    const res = await RedeemVoucher(makeReq({ code: 'TEST' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // The Apply button must not consume the voucher. This route used to call
  // redeem_voucher, which writes the redemption row and increments
  // current_uses, so abandoning the checkout destroyed the voucher and the
  // customer was still billed full price.
  it('calls the read-only preview_voucher RPC and never redeem_voucher', async () => {
    const client = makeMockSupabase({ rpcResult: { success: true } });
    (createClient as jest.Mock).mockResolvedValue(client);

    await RedeemVoucher(makeReq({ code: '  summer50 ', amount_cents: 5000 }));

    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('preview_voucher', {
      p_code: 'summer50',
      p_amount_cents: 5000,
    });
    expect(client.rpc).not.toHaveBeenCalledWith('redeem_voucher', expect.anything());
  });

  it('passes a null amount when none is supplied', async () => {
    const client = makeMockSupabase({ rpcResult: { success: true } });
    (createClient as jest.Mock).mockResolvedValue(client);

    await RedeemVoucher(makeReq({ code: 'SUMMER50' }));

    expect(client.rpc).toHaveBeenCalledWith('preview_voucher', {
      p_code: 'SUMMER50',
      p_amount_cents: null,
    });
  });

  it('rejects a non-integer or negative amount', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    expect((await RedeemVoucher(makeReq({ code: 'TEST', amount_cents: -1 }))).status).toBe(400);
    expect((await RedeemVoucher(makeReq({ code: 'TEST', amount_cents: 12.5 }))).status).toBe(400);
  });
});
