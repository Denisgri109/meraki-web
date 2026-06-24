import { readSettings, buildParams, SeedSettings, DEFAULT_SETTINGS } from './test-panel';

describe('readSettings', () => {
  const SETTINGS_KEY = 'meraki:test-panel:seed-settings';

  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('returns default settings when localStorage is empty', () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns parsed settings when localStorage has valid JSON', () => {
    const customSettings = {
      clientEmail: 'custom@example.com',
      masterEmail: 'master@example.com',
      minutesOffset: '10',
      durationMinutes: '60',
      price: '50',
      notes: 'Test notes',
      message: 'Test message',
      loyaltyAmount: '100',
      orderQuantity: '2',
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(customSettings));

    expect(readSettings()).toEqual(customSettings);
  });

  it('merges default settings with partial valid JSON', () => {
    const partialSettings = {
      clientEmail: 'custom@example.com',
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(partialSettings));

    expect(readSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      ...partialSettings,
    });
  });

  it('returns default settings when localStorage.getItem throws an error', () => {
    // Mock localStorage.getItem to throw an error
    jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('localStorage is not accessible');
    });

    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns default settings when JSON.parse throws an error', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem(SETTINGS_KEY, 'invalid json');

    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('buildParams', () => {
  let settings: SeedSettings;

  beforeEach(() => {
    // Reset to defaults before each test
    settings = { ...DEFAULT_SETTINGS };
  });

  it('preserves existing actionParams', () => {
    const actionParams = { existingParam: 'test_value', anotherParam: 123 };
    const result = buildParams('any_action', actionParams, settings);

    expect(result).toHaveProperty('existingParam', 'test_value');
    expect(result).toHaveProperty('anotherParam', 123);
  });

  it('handles undefined actionParams gracefully', () => {
    const result = buildParams('any_action', undefined, settings);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('maps valid clientEmail and masterEmail to client_id and master_id', () => {
    // Uses defaults 'testclient@gmail.com' and 'daxyburn@gmail.com'
    const result = buildParams('any_action', undefined, settings);

    expect(result).toHaveProperty('client_id', '3f19e0f2-7e0b-4dc2-8a8e-3ac1939d9f1f');
    expect(result).toHaveProperty('master_id', 'aab4ab46-76d5-4a98-8487-2a6f1b8a2a1b');
  });

  it('ignores invalid emails for id mapping', () => {
    settings.clientEmail = 'nonexistent@gmail.com';
    settings.masterEmail = '';

    const result = buildParams('any_action', undefined, settings);

    expect(result).not.toHaveProperty('client_id');
    expect(result).not.toHaveProperty('master_id');
  });

  it('trims and includes notes and messages if provided', () => {
    settings.notes = '   Some notes   ';
    settings.message = '  Hello World! ';

    const result = buildParams('any_action', undefined, settings);

    expect(result).toHaveProperty('notes', 'Some notes');
    expect(result).toHaveProperty('message', 'Hello World!');
  });

  it('does not include empty notes or messages after trimming', () => {
    settings.notes = '      ';
    settings.message = '';

    const result = buildParams('any_action', undefined, settings);

    expect(result).not.toHaveProperty('notes');
    expect(result).not.toHaveProperty('message');
  });

  describe('action: create_appointment', () => {
    it('parses appointment specific fields to numbers', () => {
      settings.minutesOffset = '15';
      settings.durationMinutes = '60';
      settings.price = '50.50';

      const result = buildParams('create_appointment', undefined, settings);

      expect(result).toHaveProperty('minutes_offset', 15);
      expect(result).toHaveProperty('duration_minutes', 60);
      expect(result).toHaveProperty('price', 50.5);
    });

    it('ignores appointment specific fields if empty', () => {
      settings.minutesOffset = '   ';
      settings.durationMinutes = '';
      settings.price = ' ';

      const result = buildParams('create_appointment', undefined, settings);

      expect(result).not.toHaveProperty('minutes_offset');
      expect(result).not.toHaveProperty('duration_minutes');
      expect(result).not.toHaveProperty('price');
    });
  });

  describe('action: add_loyalty_points', () => {
    it('parses loyalty amount to number', () => {
      settings.loyaltyAmount = '100';

      const result = buildParams('add_loyalty_points', undefined, settings);

      expect(result).toHaveProperty('amount', 100);
    });

    it('ignores loyalty amount if empty', () => {
      settings.loyaltyAmount = '   ';

      const result = buildParams('add_loyalty_points', undefined, settings);

      expect(result).not.toHaveProperty('amount');
    });
  });

  describe('action: create_order', () => {
    it('parses order specific fields to numbers', () => {
      settings.orderQuantity = '3';
      settings.price = '19.99';

      const result = buildParams('create_order', undefined, settings);

      expect(result).toHaveProperty('quantity', 3);
      expect(result).toHaveProperty('price', 19.99);
    });

    it('ignores order specific fields if empty', () => {
      settings.orderQuantity = '   ';
      settings.price = '';

      const result = buildParams('create_order', undefined, settings);

      expect(result).not.toHaveProperty('quantity');
      expect(result).not.toHaveProperty('price');
    });

  });
});
