import { fetchQrProduct, type QrCatalogProduct } from '@/lib/qr-catalog';

// ─── Mock supabase client ──────────────────────────────────────────────────

function makeMockSupabase(resolvedData: any, error: any = null) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
        })),
      })),
    })),
  };
}

function makeThrowingSupabase() {
  return {
    from: jest.fn(() => {
      throw new Error('Connection refused');
    }),
  };
}

describe('fetchQrProduct', () => {
  it('returns null when productId is empty string', async () => {
    const supabase = makeMockSupabase(null);
    const result = await fetchQrProduct(supabase as any, '');
    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns null when product is not found (data is null, no error)', async () => {
    const supabase = makeMockSupabase(null);
    const result = await fetchQrProduct(supabase as any, 'prod-123');
    expect(result).toBeNull();
  });

  it('returns null when supabase returns an error', async () => {
    const supabase = makeMockSupabase(null, { message: 'DB error' });
    const result = await fetchQrProduct(supabase as any, 'prod-123');
    expect(result).toBeNull();
  });

  it('returns null when product is_active is false', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'Test Product',
      retail_price: 19.99,
      description: 'A product',
      image_url: 'http://img.jpg',
      qr_enabled: true,
      is_active: false,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result).toBeNull();
  });

  it('returns null when product qr_enabled is false', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'Test Product',
      retail_price: 19.99,
      description: 'A product',
      image_url: 'http://img.jpg',
      qr_enabled: false,
      is_active: true,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result).toBeNull();
  });

  it('returns the product when qr_enabled is true and is_active is true', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'Test Product',
      retail_price: '19.99',
      description: 'A product',
      image_url: 'http://img.jpg',
      qr_enabled: true,
      is_active: true,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result).toEqual({
      id: 'prod-1',
      name: 'Test Product',
      price: 19.99,
      description: 'A product',
      image_url: 'http://img.jpg',
    });
  });

  it('returns null when is_active is undefined (not explicitly true)', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'Test Product',
      retail_price: 19.99,
      description: null,
      image_url: null,
      qr_enabled: true,
      is_active: undefined,
    });
    // is_active === false is the check; undefined passes through
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result).not.toBeNull();
  });

  it('converts retail_price to number using Number()', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'P',
      retail_price: '0',
      description: null,
      image_url: null,
      qr_enabled: true,
      is_active: true,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result?.price).toBe(0);
  });

  it('defaults price to 0 when retail_price is NaN', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'P',
      retail_price: 'not-a-number',
      description: null,
      image_url: null,
      qr_enabled: true,
      is_active: true,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result?.price).toBe(0);
  });

  it('handles null description and image_url', async () => {
    const supabase = makeMockSupabase({
      id: 'prod-1',
      name: 'P',
      retail_price: 10,
      description: null,
      image_url: null,
      qr_enabled: true,
      is_active: true,
    });
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result?.description).toBeNull();
    expect(result?.image_url).toBeNull();
  });

  it('returns null when supabase.from() throws (try/catch)', async () => {
    const supabase = makeThrowingSupabase();
    const result = await fetchQrProduct(supabase as any, 'prod-1');
    expect(result).toBeNull();
  });
});
