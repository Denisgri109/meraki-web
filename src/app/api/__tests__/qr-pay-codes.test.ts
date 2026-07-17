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
import { GET, POST, PATCH, DELETE } from '@/app/api/qr-pay-codes/route';

function makeChainable(finalResult: any, error: any = null) {
  const self: any = {
    then: (resolve: any, reject?: any) => Promise.resolve({ data: finalResult, error }).then(resolve, reject),
  };
  const proxies = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'maybeSingle', 'single', 'limit'];
  for (const m of proxies) {
    self[m] = jest.fn(() => self);
  }
  return self;
}

function makeMockSupabase(opts: {
  user?: any;
  profile?: any;
  profileError?: any;
  codes?: any[];
  codesError?: any;
  insertResult?: any;
  insertError?: any;
  updateResult?: any;
  updateError?: any;
  deleteResult?: any;
  deleteError?: any;
}) {
  const {
    user = { id: 'u1' },
    profile = { role: 'owner', can_view_qr_pay: false },
    profileError = null,
    codes = [],
    codesError = null,
    insertResult = { id: 'c1' },
    insertError = null,
    updateResult = { id: 'c1' },
    updateError = null,
    deleteResult = null,
    deleteError = null,
  } = opts;

  const profileChain = makeChainable(profile, profileError);
  const codesChain = makeChainable(codes, codesError);
  const insertChain = makeChainable(insertResult, insertError);
  const updateChain = makeChainable(updateResult, updateError);
  const deleteChain = makeChainable(deleteResult, deleteError);

  const fromMock = jest.fn((table: string) => {
    if (table === 'profiles') return profileChain;
    if (table === 'qr_pay_codes') {
      const callCount = fromMock.mock.calls.filter((c) => c[0] === 'qr_pay_codes').length;
      if (callCount === 1) return codesChain;
      if (insertChain._wasUsed) return updateChain;
      return codesChain;
    }
    return makeChainable(null);
  });

  return {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user } })),
    },
    from: fromMock,
    _chains: { profileChain, codesChain, insertChain, updateChain, deleteChain },
  };
}

function makeReq(body?: any, url = 'http://localhost/api/qr-pay-codes') {
  return {
    url,
    json: async () => body ?? {},
  } as any;
}

describe('GET /api/qr-pay-codes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is client', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 403 when master without can_view_qr_pay', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'master', can_view_qr_pay: false } }));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns codes for owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ codes: [{ id: 'c1' }] }));
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.codes).toEqual([{ id: 'c1' }]);
  });

  it('returns active codes for master with can_view_qr_pay', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'master', can_view_qr_pay: true }, codes: [{ id: 'c1' }] }));
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe('POST /api/qr-pay-codes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await POST(makeReq({ provider_name: 'Test', qr_payload: 'test' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await POST(makeReq({ provider_name: 'Test', qr_payload: 'test' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when provider_name missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await POST(makeReq({ qr_payload: 'test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when both qr_image_url and qr_payload provided', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await POST(makeReq({ provider_name: 'Test', qr_image_url: 'url', qr_payload: 'data' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when neither qr_image_url nor qr_payload provided', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await POST(makeReq({ provider_name: 'Test' }));
    expect(res.status).toBe(400);
  });

  it('returns 201 on successful creation with qr_payload', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ insertResult: { id: 'c1', provider_name: 'Revolut' } }));
    const res = await POST(makeReq({ provider_name: 'Revolut', qr_payload: 'tel:+123' }));
    expect(res.status).toBe(201);
  });

  it('returns 201 on successful creation with qr_image_url', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ insertResult: { id: 'c2', provider_name: 'Bizum' } }));
    const res = await POST(makeReq({ provider_name: 'Bizum', qr_image_url: 'https://cdn.test/qr.png' }));
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/qr-pay-codes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await PATCH(makeReq({ id: 'c1', is_active: false }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'master' } }));
    const res = await PATCH(makeReq({ id: 'c1', is_active: false }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when id missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PATCH(makeReq({ is_active: false }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no fields to update', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PATCH(makeReq({ id: 'c1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when both qr_image_url and qr_payload provided', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await PATCH(makeReq({ id: 'c1', qr_image_url: 'url', qr_payload: 'data' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful update', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ updateResult: { id: 'c1', is_active: false } }));
    const res = await PATCH(makeReq({ id: 'c1', is_active: false }));
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/qr-pay-codes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ user: null }));
    const res = await DELETE({ url: 'http://localhost/api/qr-pay-codes?id=c1' } as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when not owner', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({ profile: { role: 'client' } }));
    const res = await DELETE({ url: 'http://localhost/api/qr-pay-codes?id=c1' } as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when id missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase({}));
    const res = await DELETE({ url: 'http://localhost/api/qr-pay-codes' } as any);
    expect(res.status).toBe(400);
  });
});
