const performParallel = async (files) => {
  const start = Date.now();
  let maxConcurrent = 0;
  let currentConcurrent = 0;

  const uploadPromises = files.map(async (file) => {
    currentConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    await new Promise(r => setTimeout(r, 50)); // Mock upload latency
    currentConcurrent--;
    return { url: 'mock' };
  });

  const results = await Promise.all(uploadPromises);
  if (results.length > 0) {
    await new Promise(r => setTimeout(r, 10)); // Mock DB insert latency
  }

  return { time: Date.now() - start, maxConcurrent };
};

const performLimitedParallel = async (files, concurrencyLimit) => {
  const start = Date.now();
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(concurrencyLimit);
  let maxConcurrent = 0;
  let currentConcurrent = 0;

  const uploadPromises = files.map((file) => limit(async () => {
    currentConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    await new Promise(r => setTimeout(r, 50)); // Mock upload latency
    currentConcurrent--;
    return { url: 'mock' };
  }));

  const results = await Promise.all(uploadPromises);
  if (results.length > 0) {
    await new Promise(r => setTimeout(r, 10)); // Mock DB insert latency
  }

  return { time: Date.now() - start, maxConcurrent };
};

async function run() {
  const files = Array.from({length: 50}, (_, i) => ({ name: `file${i}.jpg` }));

  console.log('Running benchmark with 50 files...');

  const parResult = await performParallel(files);
  console.log(`Unrestricted Parallel time: ${parResult.time}ms, Max Concurrent: ${parResult.maxConcurrent}`);

  const limResult = await performLimitedParallel(files, 5);
  console.log(`Limited Parallel (5) time: ${limResult.time}ms, Max Concurrent: ${limResult.maxConcurrent}`);

}

run();
