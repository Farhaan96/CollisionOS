const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Module name mapping for absolute imports and assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
  },

  // Test directories and file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/tests/unit/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/tests/integration/**/*.{test,spec}.{js,jsx}',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/*.spec.js', // Ignore Playwright tests
    '<rootDir>/src/components/Parts/__tests__/AutomatedSourcingDashboard.test.js', // Temporary - missing websocketService
    '<rootDir>/tests/integration/bms/enhancedBmsIntegration.test.js', // Temporary - missing testApp utility
    '<rootDir>/tests/unit/hooks/useLoadingState.test.js', // Uses vitest instead of jest
  ],

  // Coverage configuration
  collectCoverage: false, // Enable when running npm test -- --coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/__mocks__/**',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    // Critical components should have higher coverage
    './src/contexts/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/components/Auth/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { 
            targets: { node: 'current' },
            modules: 'commonjs'
          }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      },
    ],
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { 
            targets: { node: 'current' },
            modules: 'commonjs'
          }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // Extensions to resolve
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for debugging
  verbose: false,

  // Test timeout
  testTimeout: 10000,

  // Global setup/teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',

  // Custom test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Error handling
  errorOnDeprecated: true,

  // Watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
