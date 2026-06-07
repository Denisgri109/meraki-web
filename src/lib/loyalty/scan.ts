export function parseScanCode(text: string): { type: 'stamp' | 'points' | 'invalid'; value: string } {
  const trimmed = text.trim();
  if (!trimmed) return { type: 'invalid', value: '' };

  if (trimmed.startsWith('stamp:')) {
    const masterId = trimmed.slice('stamp:'.length).trim();
    if (!isUuid(masterId)) {
      return { type: 'invalid', value: '' };
    }
    return { type: 'stamp', value: masterId };
  } else if (trimmed.startsWith('qr:')) {
    const code = trimmed.slice('qr:'.length).trim();
    if (!code) {
      return { type: 'invalid', value: '' };
    }
    return { type: 'points', value: code };
  } else {
    // Legacy/NFC plain text fallback
    return { type: 'points', value: trimmed };
  }
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function shouldDebounceScan(
  text: string,
  now: number,
  lastDecoded: { text: string; at: number } | null,
  debounceMs: number = 3000
): boolean {
  if (lastDecoded && lastDecoded.text === text && now - lastDecoded.at < debounceMs) {
    return true;
  }
  return false;
}
