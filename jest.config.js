const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // `Tests/` holds vendored copies of third-party suites (zod, jsx-ast-utils,
  // eslint-plugin-jsx-a11y, @stripe/react-stripe-js). They are not this
  // project's tests, they do not run under our jsdom setup, and sweeping them
  // in made a bare `npx jest` fail with hundreds of unrelated errors — which
  // is why the .bat runner had to name paths by hand. Our own tests live in
  // src/.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/Tests/',
  ],
  // Also keep `Tests/` out of jest's haste module map. It vendors two copies
  // of `source-map` (one under Tests/next/dist/compiled), and the duplicate
  // package name made *every* suite fail to run with
  // "The name `source-map` was looked up in the Haste module map" — the web
  // test suite could not execute at all before this.
  modulePathIgnorePatterns: ['<rootDir>/Tests/'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
