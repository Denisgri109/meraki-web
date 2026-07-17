import { getSiteContent, getSiteContentWithDescriptions } from '@/lib/siteContent';

// Mock the supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

interface ThenableResult {
  then: (resolve: (value: any) => any, reject?: (reason: any) => any) => Promise<any>;
  order: jest.Mock;
}

function makeThenable(result: { data: any; error: any }): ThenableResult {
  // A thenable that also has .order() for chainable queries
  const thenable: ThenableResult = {
    then: (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject),
    order: jest.fn(() => makeThenable(result)),
  };
  return thenable;
}

function makeMockSupabase(data: any, error: any = null) {
  const result = error ? { data: null, error } : { data, error: null };
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => makeThenable(result)),
    })),
  };
}

describe('getSiteContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns a key-value map when supabase returns data', async () => {
    const mockData = [
      { key: 'hero.title', value: 'Welcome' },
      { key: 'hero.subtitle', value: 'Book now' },
    ];
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(mockData));

    const result = await getSiteContent();
    expect(result).toEqual({
      'hero.title': 'Welcome',
      'hero.subtitle': 'Book now',
    });
  });

  it('returns empty object when data is null', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(null));

    const result = await getSiteContent();
    expect(result).toEqual({});
  });

  it('returns empty object when data is empty array', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase([]));

    const result = await getSiteContent();
    expect(result).toEqual({});
  });

  it('returns empty object and logs error when supabase returns error', async () => {
    const mockError = { message: 'Permission denied' };
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(null, mockError));

    const result = await getSiteContent();
    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      '[siteContent] Error fetching site content:',
      mockError,
    );
  });

  it('handles single entry', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      makeMockSupabase([{ key: 'k', value: 'v' }]),
    );

    const result = await getSiteContent();
    expect(result).toEqual({ k: 'v' });
  });
});

describe('getSiteContentWithDescriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns data array when supabase returns data', async () => {
    const mockData = [
      { key: 'hero.title', value: 'Welcome', description: 'Main heading' },
      { key: 'hero.subtitle', value: 'Book now', description: null },
    ];
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(mockData));

    const result = await getSiteContentWithDescriptions();
    expect(result).toEqual(mockData);
  });

  it('returns empty array when data is null', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(null));

    const result = await getSiteContentWithDescriptions();
    expect(result).toEqual([]);
  });

  it('returns empty array when data is empty', async () => {
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase([]));

    const result = await getSiteContentWithDescriptions();
    expect(result).toEqual([]);
  });

  it('returns empty array and logs error when supabase returns error', async () => {
    const mockError = { message: 'DB down' };
    (createClient as jest.Mock).mockResolvedValue(makeMockSupabase(null, mockError));

    const result = await getSiteContentWithDescriptions();
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      '[siteContent] Error fetching site content:',
      mockError,
    );
  });
});
