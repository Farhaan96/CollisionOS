/**
 * Jest Configuration for Integration Tests
 * Optimized for Node.js backend API testing
 */

const path = require('path');

module.exports = {
  // Test environment for Node.js backend integration tests
  testEnvironment: 'node',

  // No React setup files needed for integration tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup/integrationSetup.js'],

  // Module name mapping for backend imports
  moduleNameMapper: {
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Test directories for integration tests only
  testMatch: [
    '<rootDir>/tests/integration/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/tests/performance/**/*.{test,spec}.{js,jsx}',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/src/', // Ignore frontend tests
  ],

  // Coverage configuration for backend integration tests
  collectCoverage: false,
  collectCoverageFrom: [
    'server/**/*.{js,jsx}',
    '!server/**/*.d.ts',
    '!server/**/*.stories.{js,jsx}',
    '!server/**/__mocks__/**',
    '!server/**/__tests__/**',
    '!server/**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'text-summary', 'json-summary'],

  // Transform configuration for Node.js
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { 
            targets: { node: 'current' },
            modules: 'commonjs'
          }],
        ],
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      },
    ],
  },

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/server', '<rootDir>/tests'],

  // Extensions to resolve
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Test timeout for integration tests (longer than unit tests)
  testTimeout: 30000,

  // Global setup/teardown for integration tests
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',

  // Error handling
  errorOnDeprecated: false,

  // Force exit to prevent hanging
  forceExit: true,

  // Detect open handles for debugging
  detectOpenHandles: true,

  // Max workers for integration tests
  maxWorkers: 1, // Run integration tests sequentially to avoid conflicts

  // Global variables for tests
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.API_BASE_URL': 'http://localhost:3001',
  },
};