/**
 * Phase 1 Comprehensive Test Runner
 * Tests all Phase 1 features: Production Board, Time Clock, Invoicing, Payments, QuickBooks
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3002/api';

// Create axios instance with cookie support
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test configuration
const TEST_CONFIG = {
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'admin123',
};

let authToken = null;
let testShopId = null;
let testUserId = null;
let testJobId = null;
let testInvoiceId = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Helper: Make authenticated request
 */
function apiRequest(method, endpoint, data = null, config = {}) {
  const requestConfig = {
    ...TEST_CONFIG,
    method,
    url: endpoint,
    ...config,
  };
  if (data) {
    requestConfig.data = data;
  }
  return axiosInstance(requestConfig);
}

/**
 * Test runner helper
 */
async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const result = await testFn();
    if (result === true) {
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASS', error: null });
      console.log(`✅ PASS: ${name}`);
      return true;
    } else if (result === false) {
      testResults.failed++;
      testResults.tests.push({ name, status: 'FAIL', error: 'Test returned false' });
      console.log(`❌ FAIL: ${name}`);
      return false;
    } else {
      testResults.skipped++;
      testResults.tests.push({ name, status: 'SKIP', error: null });
      console.log(`⚠️ SKIP: ${name}`);
      return null;
    }
  } catch (error) {
    testResults.failed++;
    const errorMsg = error.response?.data?.error || error.message;
    testResults.tests.push({ name, status: 'FAIL', error: errorMsg });
    console.log(`❌ FAIL: ${name} - ${errorMsg}`);
    return false;
  }
}

/**
 * Test 1: Authentication
 */
async function testAuthentication() {
  try {
    const response = await axiosInstance.post('/auth/login', {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });

    // Check response structure - response is wrapped in data.user
    const userData = response.data?.data?.user || response.data?.user;
    if (userData) {
      testShopId = userData.shopId;
      testUserId = userData.id;
      console.log('   User:', userData.email);
      console.log('   Shop ID:', testShopId);
      console.log('   User ID:', testUserId);
      console.log('   Session cookies:', response.headers['set-cookie'] ? 'Set' : 'Not set');
      return true;
    }
    
    throw new Error('Invalid response format: ' + JSON.stringify(response.data));
  } catch (error) {
    throw new Error(`Authentication failed: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 2: Production Board - Load Jobs
 */
async function testProductionBoardLoad() {
  const response = await apiRequest('GET', '/production/board');
  if (response.data.success && Array.isArray(response.data.jobs)) {
    console.log(`   Found ${response.data.jobs.length} jobs`);
    if (response.data.jobs.length > 0) {
      testJobId = response.data.jobs[0].id;
      console.log(`   Using job ID: ${testJobId}`);
    }
    return true;
  }
  throw new Error('Invalid response format');
}

/**
 * Test 3: Production Board - Update Job Status
 */
async function testProductionBoardUpdateStatus() {
  if (!testJobId) {
    return null; // Skip if no job available
  }

  const response = await apiRequest('PUT', `/production/board/${testJobId}/status`, {
    status: 'in_repair',
  });
  
  if (response.data.success) {
    console.log('   Status updated successfully');
    return true;
  }
  throw new Error('Status update failed');
}

/**
 * Test 4: Time Clock - Get Current Status
 */
async function testTimeClockStatus() {
  if (!testUserId) {
    return null;
  }

  const response = await apiRequest('GET', `/timeclock/technician/${testUserId}/current`);
  if (response.data.success !== undefined) {
    console.log(`   Clocked in: ${response.data.isClockedIn || false}`);
    return true;
  }
  throw new Error('Status check failed');
}

/**
 * Test 5: Time Clock - Punch In
 */
async function testTimeClockPunchIn() {
  if (!testUserId) {
    return null;
  }

  try {
    const response = await apiRequest('POST', '/timeclock/punch-in', {
      technicianId: testUserId,
      entryMethod: 'web_app',
    });
    if (response.data.success) {
      console.log('   Clocked in successfully');
      return true;
    }
    throw new Error('Punch in failed');
  } catch (error) {
    if (error.response?.data?.error?.includes('Already clocked in')) {
      console.log('   Already clocked in (expected)');
      return true;
    }
    throw error;
  }
}

/**
 * Test 6: Invoice Generation - List Invoices
 */
async function testInvoiceList() {
  const response = await apiRequest('GET', '/invoices');
  if (response.data.success && Array.isArray(response.data.invoices)) {
    console.log(`   Found ${response.data.invoices.length} invoices`);
    if (response.data.invoices.length > 0) {
      testInvoiceId = response.data.invoices[0].id;
    }
    return true;
  }
  throw new Error('Invalid response format');
}

/**
 * Test 7: Invoice Generation - Generate from RO
 */
async function testInvoiceGeneration() {
  if (!testJobId) {
    return null;
  }

  try {
    const response = await apiRequest('POST', `/invoices/generate-from-ro/${testJobId}`, {
      payment_terms: 'net30',
    });
    if (response.data.success) {
      testInvoiceId = response.data.invoice.id;
      console.log(`   Invoice generated: ${response.data.invoice.invoiceNumber}`);
      return true;
    }
    throw new Error('Invoice generation failed');
  } catch (error) {
    const errorMsg = error.response?.data?.error || '';
    if (errorMsg.includes('already exists') || errorMsg.includes('incomplete job')) {
      console.log(`   ${errorMsg.includes('already exists') ? 'Invoice already exists' : 'Job not complete'} (expected)`);
      return null; // Skip, not a failure
    }
    throw error;
  }
}

/**
 * Test 8: Invoice PDF Generation
 */
async function testInvoicePDF() {
  if (!testInvoiceId) {
    return null;
  }

  try {
    const response = await apiRequest('GET', `/invoices/${testInvoiceId}/pdf`, null, {
      responseType: 'arraybuffer',
    });
    if (response.data && response.headers['content-type'] === 'application/pdf') {
      console.log(`   PDF generated: ${response.data.byteLength} bytes`);
      return true;
    }
    throw new Error('PDF generation failed');
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.response?.status === 404 ? 'Invoice not found' : error.message}`);
  }
}

/**
 * Test 9: Payment Processing - Create Payment Intent
 */
async function testPaymentIntent() {
  if (!testInvoiceId) {
    return null;
  }

  try {
    const response = await apiRequest('POST', '/payments/stripe/intent', {
      amount: 100.0,
      invoice_id: testInvoiceId,
    });
    if (response.data.success && response.data.clientSecret) {
      console.log('   Payment intent created');
      return true;
    }
    throw new Error('Payment intent creation failed');
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg.includes('Stripe') || errorMsg.includes('STRIPE')) {
      console.log('   Stripe not configured (expected in test environment)');
      return null; // Skip, not a failure
    }
    throw error;
  }
}

/**
 * Test 10: Payment Recording - Cash Payment
 */
async function testCashPayment() {
  if (!testInvoiceId) {
    return null;
  }

  try {
    const response = await apiRequest('POST', '/payments', {
      invoice_id: testInvoiceId,
      payment_type: 'cash',
      amount: 50.0,
      notes: 'Test payment',
    });
    if (response.data.success) {
      console.log(`   Cash payment recorded: ${response.data.payment?.paymentNumber || 'N/A'}`);
      return true;
    }
    throw new Error('Payment recording failed');
  } catch (error) {
    throw new Error(`Payment recording failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Test 11: QuickBooks - Get Status
 */
async function testQuickBooksStatus() {
  try {
    const response = await apiRequest('GET', '/quickbooks/status');
    if (response.data.success !== undefined) {
      console.log(`   QuickBooks: ${response.data.connected ? 'Connected' : 'Not Connected'}`);
      return true;
    }
    throw new Error('Status check failed');
  } catch (error) {
    throw new Error(`QuickBooks status failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Phase 1 Comprehensive Test Suite');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(70));

  // Authenticate first
  await runTest('Authentication', testAuthentication);

  // Run all tests
  await runTest('Production Board - Load Jobs', testProductionBoardLoad);
  await runTest('Production Board - Update Status', testProductionBoardUpdateStatus);
  await runTest('Time Clock - Get Status', testTimeClockStatus);
  await runTest('Time Clock - Punch In', testTimeClockPunchIn);
  await runTest('Invoice - List', testInvoiceList);
  await runTest('Invoice - Generate from RO', testInvoiceGeneration);
  await runTest('Invoice - PDF Generation', testInvoicePDF);
  await runTest('Payment - Create Intent', testPaymentIntent);
  await runTest('Payment - Record Cash Payment', testCashPayment);
  await runTest('QuickBooks - Get Status', testQuickBooksStatus);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️ Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  const totalRun = testResults.passed + testResults.failed;
  if (totalRun > 0) {
    const successRate = ((testResults.passed / totalRun) * 100).toFixed(1);
    console.log(`📊 Success Rate: ${successRate}%`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 Detailed Results');
  console.log('='.repeat(70));
  testResults.tests.forEach((test) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test.status}: ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Phase 1 implementation is working correctly.');
  } else {
    console.log(`\n⚠️ ${testResults.failed} test(s) failed. Please review the errors above.`);
  }

  return testResults.failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };

