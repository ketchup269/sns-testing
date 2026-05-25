/** @type {import('jest').Config} */

const sharedConfig = {
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp|avif)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/scripts/',
  ],
  // Allow ESM packages from next/upstash/intl to be transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|next-intl|use-intl|@formatjs|intl-messageformat)/)',
  ],
}

const config = {
  projects: [
    // ─── Unit Tests ──────────────────────────────────────────────────────
    // Pure functions, isolated components with fully mocked dependencies.
    // Test a single module in isolation.
    {
      ...sharedConfig,
      displayName: 'unit',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: [
        '**/__tests__/unit/**/*.test.{ts,tsx}',
      ],
    },

    // ─── Integration Tests ───────────────────────────────────────────────
    // API routes and server actions — multiple modules collaborating
    // with mocked external dependencies (Prisma, APIs, etc.)
    {
      ...sharedConfig,
      displayName: 'integration',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: [
        '**/__tests__/integration/**/*.test.{ts,tsx}',
      ],
    },

    // ─── E2E Tests ───────────────────────────────────────────────────────
    // Full user flows — page-level components with real context providers,
    // or multi-step API workflows end-to-end.
    {
      ...sharedConfig,
      displayName: 'e2e',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: [
        '**/__tests__/e2e/**/*.test.{ts,tsx}',
      ],
    },
  ],

  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/actions/**/*.{ts,tsx}',
    'app/components/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
  },
}

module.exports = config
