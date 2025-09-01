#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${colors.cyan}${colors.bright}${step}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if application is running
async function checkAppRunning() {
  return new Promise(resolve => {
    const http = require('http');
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000,
      },
      res => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check if Supabase is configured
function checkSupabaseConfig() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  return (
    envContent.includes('SUPABASE_URL') &&
    envContent.includes('SUPABASE_ANON_KEY')
  );
}

// Run Playwright tests
function runPlaywrightTests(testPattern = '') {
  return new Promise((resolve, reject) => {
    const args = ['test'];

    if (testPattern) {
      args.push(testPattern);
    }

    // Add additional options
    args.push('--reporter=html,line');
    args.push('--timeout=30000');

    logInfo(`Running Playwright tests with pattern: ${testPattern || 'all'}`);

    const playwright = spawn('npx', ['playwright', ...args], {
      stdio: 'inherit',
      shell: true,
    });

    playwright.on('close', code => {
      if (code === 0) {
        logSuccess('All tests passed!');
        resolve();
      } else {
        logError(`Tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    playwright.on('error', error => {
      logError(`Failed to run tests: ${error.message}`);
      reject(error);
    });
  });
}

// Main execution function
async function main() {
  log(
    `${colors.bright}${colors.magenta}🚗 CollisionOS E2E Test Runner${colors.reset}\n`
  );

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    logError(
      'package.json not found. Please run this script from the project root.'
    );
    process.exit(1);
  }

  // Check Supabase configuration
  logStep('Checking Supabase Configuration');
  if (!checkSupabaseConfig()) {
    logWarning('Supabase configuration not found in .env file');
    logInfo(
      'Make sure you have SUPABASE_URL and SUPABASE_ANON_KEY in your .env file'
    );
    logInfo(
      'You can copy from env.example and update with your Supabase project details'
    );
  } else {
    logSuccess('Supabase configuration found');
  }

  // Check if application is running
  logStep('Checking Application Status');
  const appRunning = await checkAppRunning();
  if (!appRunning) {
    logWarning('Application is not running on http://localhost:3000');
    logInfo('Please start the application with: npm start');
    logInfo('Or run: npm run dev');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question('\nDo you want to continue anyway? (y/N): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      logInfo('Exiting...');
      process.exit(0);
    }
  } else {
    logSuccess('Application is running on http://localhost:3000');
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  let testPattern = '';

  if (args.length > 0) {
    const command = args[0];
    switch (command) {
      case 'auth':
        testPattern = '**/auth*.spec.js';
        logInfo('Running authentication tests only');
        break;
      case 'dashboard':
        testPattern = '**/dashboard*.spec.js';
        logInfo('Running dashboard tests only');
        break;
      case 'customers':
        testPattern = '**/customers*.spec.js';
        logInfo('Running customer management tests only');
        break;
      case 'jobs':
        testPattern = '**/jobs*.spec.js';
        logInfo('Running job management tests only');
        break;
      case 'supabase':
        testPattern = 'tests/e2e/supabase-integration.spec.js';
        logInfo('Running Supabase integration tests only');
        break;
      case 'workflows':
        testPattern = 'tests/e2e/collisionos-workflows.spec.js';
        logInfo('Running complete workflow tests only');
        break;
      case 'smoke':
        testPattern = 'tests/e2e/smoke-tests.spec.js';
        logInfo('Running smoke tests only');
        break;
      case 'help':
        logInfo('Available test commands:');
        logInfo('  auth      - Authentication tests only');
        logInfo('  dashboard - Dashboard tests only');
        logInfo('  customers - Customer management tests only');
        logInfo('  jobs      - Job management tests only');
        logInfo('  supabase  - Supabase integration tests only');
        logInfo('  workflows - Complete workflow tests only');
        logInfo('  smoke     - Smoke tests only');
        logInfo('  help      - Show this help message');
        logInfo('');
        logInfo('Examples:');
        logInfo('  node tests/run-e2e-tests.js');
        logInfo('  node tests/run-e2e-tests.js auth');
        logInfo('  node tests/run-e2e-tests.js supabase');
        process.exit(0);
        break;
      default:
        logWarning(`Unknown command: ${command}`);
        logInfo(
          'Run "node tests/run-e2e-tests.js help" for available commands'
        );
        process.exit(1);
    }
  }

  // Check if test files exist
  logStep('Checking Test Files');
  const testDir = path.join(process.cwd(), 'tests', 'e2e');
  if (!fs.existsSync(testDir)) {
    logError('E2E test directory not found: tests/e2e/');
    logInfo('Please create the tests/e2e/ directory and add your test files');
    process.exit(1);
  }

  const testFiles = fs
    .readdirSync(testDir)
    .filter(file => file.endsWith('.spec.js'));
  if (testFiles.length === 0) {
    logError('No test files found in tests/e2e/');
    logInfo('Please add .spec.js files to the tests/e2e/ directory');
    process.exit(1);
  }

  logSuccess(`Found ${testFiles.length} test file(s): ${testFiles.join(', ')}`);

  // Run tests
  logStep('Running E2E Tests');
  try {
    await runPlaywrightTests(testPattern);

    logStep('Test Results');
    logSuccess('All tests completed successfully!');
    logInfo('Check the playwright-report/ directory for detailed results');
    logInfo(
      'Open playwright-report/index.html in your browser to view the report'
    );
  } catch (error) {
    logError('Test execution failed');
    logInfo('Check the error messages above for details');
    logInfo('You can also run tests with --headed flag to see the browser:');
    logInfo('  npx playwright test --headed');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logWarning('\nTest execution interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWarning('\nTest execution terminated');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkAppRunning,
  checkSupabaseConfig,
  runPlaywrightTests,
};
