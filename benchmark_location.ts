import { getAllCountries } from './src/lib/locationApi';

async function run() {
  const start = Date.now();
  let failCount = 0;

  // Monkey-patch fetch to track calls
  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = async (...args) => {
    fetchCalls++;
    return originalFetch(...args);
  };

  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(getAllCountries().catch(() => failCount++));
  }
  await Promise.all(promises);
  const end = Date.now();
  console.log(`Took ${end - start}ms`);
  console.log(`Fetch calls: ${fetchCalls}`);
}

run();
