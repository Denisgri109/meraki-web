import { performance } from 'perf_hooks';

function genSlotLabels_original(sh: number, sm: number, eh: number, em: number) {
  const out: string[] = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m < em)) {
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return out;
}

const slotCache = new Map<string, string[]>();
function genSlotLabels_memo(sh: number, sm: number, eh: number, em: number) {
  const key = `${sh}:${sm}-${eh}:${em}`;
  let cached = slotCache.get(key);
  if (cached) return cached;
  const out: string[] = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m < em)) {
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  slotCache.set(key, out);
  return out;
}

const ITERATIONS = 100000;

// Warmup
for (let i = 0; i < 1000; i++) {
  genSlotLabels_original(9, 0, 17, 0);
  genSlotLabels_memo(9, 0, 17, 0);
}

const start_orig = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  genSlotLabels_original(9, 0, 17, 0);
}
const end_orig = performance.now();
console.log(`Original: ${end_orig - start_orig}ms`);

const start_memo = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  genSlotLabels_memo(9, 0, 17, 0);
}
const end_memo = performance.now();
console.log(`Memoized: ${end_memo - start_memo}ms`);
