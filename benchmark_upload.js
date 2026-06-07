const performSequential = async (files) => {
  const start = Date.now();
  let successCount = 0;
  for (const file of files) {
    await new Promise(r => setTimeout(r, 50)); // Mock upload latency
    await new Promise(r => setTimeout(r, 10)); // Mock DB insert latency
    successCount++;
  }
  return Date.now() - start;
};

const performParallel = async (files) => {
  const start = Date.now();

  const uploadPromises = files.map(async (file) => {
    await new Promise(r => setTimeout(r, 50)); // Mock upload latency
    return { url: 'mock' };
  });

  const results = await Promise.all(uploadPromises);

  if (results.length > 0) {
    await new Promise(r => setTimeout(r, 10)); // Mock bulk DB insert latency
  }

  return Date.now() - start;
};

async function run() {
  const files = Array.from({length: 10}, (_, i) => ({ name: `file${i}.jpg` }));

  console.log('Running benchmark with 10 files...');

  const seqTime = await performSequential(files);
  console.log(`Sequential time: ${seqTime}ms`);

  const parTime = await performParallel(files);
  console.log(`Parallel/Bulk time: ${parTime}ms`);

  const improvement = ((seqTime - parTime) / seqTime * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
}

run();
