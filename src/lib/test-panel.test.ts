import { readSettings, DEFAULT_SETTINGS } from './test-panel';

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
