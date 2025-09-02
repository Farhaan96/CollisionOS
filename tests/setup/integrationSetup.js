/**
 * Integration Test Setup
 * Configures Node.js environment for backend API testing
 */

// Ensure Node.js globals are available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Configure test environment variables
process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
process.env.TEST_TOKEN = process.env.TEST_TOKEN || 'dev-token';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Add any global setup logic here
  console.log('🧪 Integration Test Environment Setup Complete');
});

afterAll(async () => {
  // Add any global cleanup logic here
  console.log('🧪 Integration Test Environment Cleanup Complete');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = {};