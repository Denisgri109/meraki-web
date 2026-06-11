export function parseScanCode(text: string): { type: 'stamp' | 'invalid'; value: string } {
  const trimmed = text.trim();
  if (!trimmed) return { type: 'invalid', value: '' };

  if (trimmed.includes('loyalty/stamp')) {
    const match = trimmed.match(/[?&]master_id=([^&]+)/);
    if (match && match[1] && isUuid(match[1])) {
      return { type: 'stamp', value: match[1] };
    }
  }

  if (trimmed.startsWith('stamp:')) {
    const masterId = trimmed.slice('stamp:'.length).trim();
    if (isUuid(masterId)) {
      return { type: 'stamp', value: masterId };
    }
  }

  if (isUuid(trimmed)) {
    return { type: 'stamp', value: trimmed };
  }

  return { type: 'invalid', value: '' };
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
