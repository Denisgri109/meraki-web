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
});
