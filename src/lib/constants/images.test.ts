import {
  DEFAULT_PRODUCT_IMAGE,
  DEFAULT_PRODUCT_IMAGE_LARGE,
  DEFAULT_PRODUCT_IMAGE_MEDIUM,
  DEFAULT_PRODUCT_IMAGE_HERO,
  FALLBACK_PRODUCT_IMAGES,
  FALLBACK_PRODUCT_IMAGES_LARGE,
} from '@/lib/constants/images';

describe('image constants', () => {
  it('DEFAULT_PRODUCT_IMAGE is a non-empty URL string', () => {
    expect(typeof DEFAULT_PRODUCT_IMAGE).toBe('string');
    expect(DEFAULT_PRODUCT_IMAGE.length).toBeGreaterThan(0);
    expect(DEFAULT_PRODUCT_IMAGE).toMatch(/^https?:\/\//);
  });

  it('DEFAULT_PRODUCT_IMAGE_LARGE is a non-empty URL string', () => {
    expect(typeof DEFAULT_PRODUCT_IMAGE_LARGE).toBe('string');
    expect(DEFAULT_PRODUCT_IMAGE_LARGE).toMatch(/^https?:\/\//);
  });

  it('DEFAULT_PRODUCT_IMAGE_MEDIUM is a non-empty URL string', () => {
    expect(typeof DEFAULT_PRODUCT_IMAGE_MEDIUM).toBe('string');
    expect(DEFAULT_PRODUCT_IMAGE_MEDIUM).toMatch(/^https?:\/\//);
  });

  it('DEFAULT_PRODUCT_IMAGE_HERO is a non-empty URL string', () => {
    expect(typeof DEFAULT_PRODUCT_IMAGE_HERO).toBe('string');
    expect(DEFAULT_PRODUCT_IMAGE_HERO).toMatch(/^https?:\/\//);
  });

  it('FALLBACK_PRODUCT_IMAGES is a non-empty array of URL strings', () => {
    expect(Array.isArray(FALLBACK_PRODUCT_IMAGES)).toBe(true);
    expect(FALLBACK_PRODUCT_IMAGES.length).toBeGreaterThan(0);
    for (const url of FALLBACK_PRODUCT_IMAGES) {
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it('FALLBACK_PRODUCT_IMAGES_LARGE is a non-empty array of URL strings', () => {
    expect(Array.isArray(FALLBACK_PRODUCT_IMAGES_LARGE)).toBe(true);
    expect(FALLBACK_PRODUCT_IMAGES_LARGE.length).toBeGreaterThan(0);
    for (const url of FALLBACK_PRODUCT_IMAGES_LARGE) {
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it('FALLBACK_PRODUCT_IMAGES and FALLBACK_PRODUCT_IMAGES_LARGE have same length', () => {
    expect(FALLBACK_PRODUCT_IMAGES.length).toBe(FALLBACK_PRODUCT_IMAGES_LARGE.length);
  });
});
