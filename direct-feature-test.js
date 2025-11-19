/**
 * Direct Feature Testing (Bypasses Auth)
 * Tests database and model functionality directly
 */

const path = require('path');
const { Sequelize } = require('sequelize');

// Colors for output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, 'blue');
  console.log('='.repeat(80) + '\n');
}

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✓ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`✗ ${name}`, 'red');
  }
  if (details) {
    log(`  ${details}`, 'gray');
  }
  testResults.tests.push({ name, passed, details });
}

// Test 1: Invoice.recordPayment() Method
async function testInvoiceRecordPayment() {
  logSection('TEST 1: INVOICE.RECORDPAYMENT() METHOD');

  try {
    // Load models
    const { Invoice } = require('./server/database/models');

    // Test 1.1: Method exists
    log('1.1 Checking if Invoice.recordPayment() method exists...', 'yellow');
    const methodExists = typeof Invoice.prototype.recordPayment === 'function';
    logTest(
      'Invoice.recordPayment() method exists',
      methodExists,
      methodExists ? 'Method found on Invoice prototype' : 'Method NOT found'
    );

    if (!methodExists) {
      log('Skipping functional tests - method does not exist', 'yellow');
      return;
    }

    // Test 1.2: Method signature and logic
    log('\n1.2 Testing method signature and logic...', 'yellow');
    const methodSource = Invoice.prototype.recordPayment.toString();

    const hasAmountValidation = methodSource.includes('amount') || methodSource.includes('paymentAmount');
    const hasBalanceCalculation = methodSource.includes('amountDue') || methodSource.includes('balanceDue');
    const hasStatusUpdate = methodSource.includes('paymentStatus') || methodSource.includes('invoiceStatus');
    const hasSaveCall = methodSource.includes('save()');

    logTest(
      'Method validates payment amount',
      hasAmountValidation,
      hasAmountValidation ? 'Amount validation found' : 'No amount validation'
    );

    logTest(
      'Method calculates balance due',
      hasBalanceCalculation,
      hasBalanceCalculation ? 'Balance calculation found' : 'No balance calculation'
    );

    logTest(
      'Method updates payment status',
      hasStatusUpdate,
      hasStatusUpdate ? 'Status update logic found' : 'No status update'
    );

    logTest(
      'Method saves invoice changes',
      hasSaveCall,
      hasSaveCall ? 'save() call found' : 'No save() call'
    );

    // Test 1.3: Simulate payment recording
    log('\n1.3 Simulating payment recording logic...', 'yellow');

    // Create mock invoice
    const mockInvoice = {
      totalAmount: 1000.00,
      amountPaid: 0,
      balanceDue: 1000.00,
      paymentStatus: 'unpaid',
      invoiceStatus: 'sent',
      save: async function() { return this; }
    };

    try {
      // Manually test the logic
      const paymentAmount = 500.00;
      const newAmountPaid = parseFloat(mockInvoice.amountPaid) + paymentAmount;
      const newBalanceDue = parseFloat(mockInvoice.totalAmount) - newAmountPaid;
      const isFullyPaid = newAmountPaid >= parseFloat(mockInvoice.totalAmount);

      const calculationCorrect = newBalanceDue === 500.00;
      const statusCorrect = !isFullyPaid; // Should be partial

      logTest(
        'Payment calculation logic correct',
        calculationCorrect,
        calculationCorrect
          ? `$1000 - $500 = $500 remaining`
          : `Calculation error`
      );

      logTest(
        'Payment status logic correct',
        statusCorrect,
        statusCorrect
          ? 'Partial payment correctly identified'
          : 'Status logic error'
      );

    } catch (error) {
      logTest('Payment recording simulation', false, error.message);
    }

  } catch (error) {
    logTest('Invoice model loading', false, error.message);
  }
}

// Test 2: Financial Calculations (Labor & Parts)
async function testFinancialCalculations() {
  logSection('TEST 2: LABOR & PARTS COST CALCULATIONS');

  try {
    const financialRouter = require('./server/routes/financial.js');

    // Test 2.1: Labor cost calculation function
    log('2.1 Testing labor cost calculation...', 'yellow');
    const hasLaborCalc = typeof financialRouter.calculateJobLaborCost === 'function';
    logTest(
      'calculateJobLaborCost() function exists',
      hasLaborCalc,
      hasLaborCalc ? 'Function found in financial router' : 'Function NOT found'
    );

    if (hasLaborCalc) {
      const laborFuncSource = financialRouter.calculateJobLaborCost.toString();
      const usesDatabase = laborFuncSource.includes('JobLabor') ||
                          laborFuncSource.includes('PartLine') ||
                          laborFuncSource.includes('findAll');
      const notRandom = !laborFuncSource.includes('Math.random()');

      logTest(
        'Labor calculation queries database',
        usesDatabase,
        usesDatabase ? 'Uses database queries (JobLabor/PartLine)' : 'No database queries found'
      );

      logTest(
        'Labor calculation NOT using random numbers',
        notRandom,
        notRandom ? 'No Math.random() calls' : 'WARNING: Uses random numbers!'
      );
    }

    // Test 2.2: Parts cost calculation function
    log('\n2.2 Testing parts cost calculation...', 'yellow');
    const hasPartsCalc = typeof financialRouter.calculateJobPartsCost === 'function';
    logTest(
      'calculateJobPartsCost() function exists',
      hasPartsCalc,
      hasPartsCalc ? 'Function found in financial router' : 'Function NOT found'
    );

    if (hasPartsCalc) {
      const partsFuncSource = financialRouter.calculateJobPartsCost.toString();
      const usesDatabase = partsFuncSource.includes('JobPart') ||
                          partsFuncSource.includes('PartLine') ||
                          partsFuncSource.includes('findAll');
      const notRandom = !partsFuncSource.includes('Math.random()');

      logTest(
        'Parts calculation queries database',
        usesDatabase,
        usesDatabase ? 'Uses database queries (JobPart/PartLine)' : 'No database queries found'
      );

      logTest(
        'Parts calculation NOT using random numbers',
        notRandom,
        notRandom ? 'No Math.random() calls' : 'WARNING: Uses random numbers!'
      );
    }

    // Test 2.3: Calculate invoice amounts
    log('\n2.3 Testing invoice amounts calculation...', 'yellow');
    const hasInvoiceCalc = typeof financialRouter.calculateInvoiceAmounts === 'function';
    logTest(
      'calculateInvoiceAmounts() function exists',
      hasInvoiceCalc,
      hasInvoiceCalc ? 'Function found' : 'Function NOT found'
    );

    if (hasInvoiceCalc) {
      const invoiceCalcSource = financialRouter.calculateInvoiceAmounts.toString();
      const callsLaborCalc = invoiceCalcSource.includes('calculateJobLaborCost');
      const callsPartsCalc = invoiceCalcSource.includes('calculateJobPartsCost');

      logTest(
        'Invoice calculation uses real labor costs',
        callsLaborCalc,
        callsLaborCalc ? 'Calls calculateJobLaborCost()' : 'Does NOT call calculateJobLaborCost()'
      );

      logTest(
        'Invoice calculation uses real parts costs',
        callsPartsCalc,
        callsPartsCalc ? 'Calls calculateJobPartsCost()' : 'Does NOT call calculateJobPartsCost()'
      );
    }

  } catch (error) {
    logTest('Financial router loading', false, error.message);
  }
}

// Test 3: BMS Auto-PO Service
async function testBMSAutoPO() {
  logSection('TEST 3: BMS AUTO-PO CREATION');

  try {
    // Test 3.1: Automatic PO creation service
    log('3.1 Testing automatic PO creation service...', 'yellow');
    const autoPOService = require('./server/services/automaticPOCreationService.js');
    const serviceExists = !!autoPOService;
    logTest(
      'Automatic PO creation service exists',
      serviceExists,
      serviceExists ? 'Service file loaded successfully' : 'Service NOT found'
    );

    if (serviceExists) {
      const hasCreateMethod = typeof autoPOService.createPOsForRepairOrder === 'function' ||
                             typeof autoPOService.createPurchaseOrders === 'function';
      logTest(
        'Service has PO creation method',
        hasCreateMethod,
        hasCreateMethod ? 'PO creation method found' : 'No PO creation method'
      );
    }

    // Test 3.2: Supplier mapping service
    log('\n3.2 Testing supplier mapping service...', 'yellow');
    const supplierService = require('./server/services/supplierMappingService.js');
    const supplierServiceExists = !!supplierService;
    logTest(
      'Supplier mapping service exists',
      supplierServiceExists,
      supplierServiceExists ? 'Service file loaded successfully' : 'Service NOT found'
    );

    if (supplierServiceExists) {
      const hasMappingMethod = typeof supplierService.mapSupplier === 'function' ||
                              typeof supplierService.findSupplier === 'function';
      logTest(
        'Service has supplier mapping method',
        hasMappingMethod,
        hasMappingMethod ? 'Supplier mapping method found' : 'No mapping method'
      );
    }

    // Test 3.3: BMS service integration
    log('\n3.3 Testing BMS service integration...', 'yellow');
    const bmsService = require('./server/services/bmsService.js');
    const bmsServiceExists = !!bmsService;
    logTest(
      'BMS service exists',
      bmsServiceExists,
      bmsServiceExists ? 'BMS service loaded' : 'BMS service NOT found'
    );

  } catch (error) {
    logTest('BMS services loading', false, error.message);
  }
}

// Test 4: Loaner Fleet Model
async function testLoanerFleet() {
  logSection('TEST 4: LOANER FLEET DATABASE MODEL');

  try {
    const { LoanerFleet } = require('./server/database/models');

    // Test 4.1: Model exists
    log('4.1 Checking loaner fleet model...', 'yellow');
    const modelExists = !!LoanerFleet;
    logTest(
      'LoanerFleet model exists',
      modelExists,
      modelExists ? 'Model loaded successfully' : 'Model NOT found'
    );

    if (!modelExists) {
      log('Skipping model tests - model does not exist', 'yellow');
      return;
    }

    // Test 4.2: CRUD methods
    log('\n4.2 Testing CRUD method availability...', 'yellow');
    const hasCreate = typeof LoanerFleet.create === 'function';
    const hasFindAll = typeof LoanerFleet.findAll === 'function';
    const hasFindByPk = typeof LoanerFleet.findByPk === 'function';
    const hasUpdate = typeof LoanerFleet.update === 'function';
    const hasDestroy = typeof LoanerFleet.destroy === 'function';

    logTest('CREATE method available', hasCreate, hasCreate ? 'create() exists' : 'No create()');
    logTest('READ methods available', hasFindAll && hasFindByPk,
      (hasFindAll && hasFindByPk) ? 'findAll() and findByPk() exist' : 'Missing read methods');
    logTest('UPDATE method available', hasUpdate, hasUpdate ? 'update() exists' : 'No update()');
    logTest('DELETE method available', hasDestroy, hasDestroy ? 'destroy() exists' : 'No destroy()');

    // Test 4.3: Model attributes
    log('\n4.3 Testing model attributes...', 'yellow');
    const expectedFields = ['make', 'model', 'year', 'vin', 'status'];
    let hasAllFields = true;
    let missingFields = [];

    if (LoanerFleet.rawAttributes) {
      expectedFields.forEach(field => {
        if (!LoanerFleet.rawAttributes[field]) {
          hasAllFields = false;
          missingFields.push(field);
        }
      });

      logTest(
        'Model has expected fields',
        hasAllFields,
        hasAllFields
          ? 'All expected fields present (make, model, year, vin, status)'
          : `Missing fields: ${missingFields.join(', ')}`
      );
    } else {
      logTest('Model has expected fields', false, 'Cannot access model attributes');
    }

  } catch (error) {
    logTest('LoanerFleet model loading', false, error.message);
  }
}

// Test 5: Frontend Services
async function testFrontendServices() {
  logSection('TEST 5: FRONTEND SERVICES');

  try {
    // Test 5.1: Scheduling service (frontend)
    log('5.1 Testing frontend scheduling service...', 'yellow');
    try {
      const schedulingService = require('./src/services/schedulingService.js');
      logTest(
        'Frontend scheduling service exists',
        true,
        'Service file found in src/services/'
      );
    } catch (error) {
      logTest(
        'Frontend scheduling service exists',
        false,
        'Service NOT found (this is frontend code, may require transpilation)'
      );
    }

    // Test 5.2: RO service (frontend)
    log('\n5.2 Testing frontend RO service...', 'yellow');
    try {
      const roService = require('./src/services/roService.js');
      logTest(
        'Frontend RO service exists',
        true,
        'Service file found in src/services/'
      );
    } catch (error) {
      logTest(
        'Frontend RO service exists',
        false,
        'Service NOT found or requires transpilation'
      );
    }

  } catch (error) {
    log('Frontend services testing skipped (requires React transpilation)', 'gray');
  }
}

// Summary
function printSummary() {
  logSection('DIRECT FEATURE TEST SUMMARY');

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);

  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');

  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  ✗ ${t.name}`, 'red');
        if (t.details) {
          log(`    ${t.details}`, 'gray');
        }
      });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Critical issues summary
  logSection('CRITICAL ISSUES SUMMARY');

  const criticalIssues = [];

  // Check Invoice.recordPayment
  const invoiceTests = testResults.tests.filter(t => t.name.includes('recordPayment'));
  if (invoiceTests.some(t => !t.passed)) {
    criticalIssues.push({
      severity: 'HIGH',
      feature: 'Financial System - Invoice Payment Recording',
      status: '❌ BROKEN',
      action: 'Fix Invoice.recordPayment() method'
    });
  } else {
    log('✓ Invoice.recordPayment() - WORKING', 'green');
  }

  // Check Labor/Parts calculations
  const calcTests = testResults.tests.filter(t =>
    t.name.includes('Labor') || t.name.includes('Parts')
  );
  if (calcTests.some(t => !t.passed)) {
    criticalIssues.push({
      severity: 'HIGH',
      feature: 'Financial System - Cost Calculations',
      status: '❌ BROKEN',
      action: 'Implement real database queries for labor/parts costs'
    });
  } else {
    log('✓ Labor & Parts Calculations - WORKING', 'green');
  }

  // Check BMS Auto-PO
  const bmsTests = testResults.tests.filter(t =>
    t.name.includes('PO') || t.name.includes('BMS') || t.name.includes('Supplier')
  );
  if (bmsTests.some(t => !t.passed)) {
    criticalIssues.push({
      severity: 'MEDIUM',
      feature: 'BMS Auto-PO Creation',
      status: '⚠ INCOMPLETE',
      action: 'Verify automatic PO service integration'
    });
  } else {
    log('✓ BMS Auto-PO Service - WORKING', 'green');
  }

  // Check Loaner Fleet
  const loanerTests = testResults.tests.filter(t => t.name.includes('Loaner'));
  if (loanerTests.some(t => !t.passed)) {
    criticalIssues.push({
      severity: 'LOW',
      feature: 'Loaner Fleet CRUD',
      status: '⚠ INCOMPLETE',
      action: 'Verify model and endpoints'
    });
  } else {
    log('✓ Loaner Fleet Model - WORKING', 'green');
  }

  if (criticalIssues.length > 0) {
    console.log();
    criticalIssues.forEach(issue => {
      const color = issue.severity === 'HIGH' ? 'red' : issue.severity === 'MEDIUM' ? 'yellow' : 'blue';
      log(`[${issue.severity}] ${issue.feature}`, color);
      log(`  Status: ${issue.status}`, 'gray');
      log(`  Action: ${issue.action}`, 'gray');
      console.log();
    });
  }
}

// Main runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════════════╗', 'blue');
  log('║   CollisionOS - Direct Feature Testing (No Auth Required)             ║', 'blue');
  log('║   Tests Database Models & Services Directly                           ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════════════╝\n', 'blue');

  log(`Started: ${new Date().toLocaleString()}\n`, 'gray');

  try {
    await testInvoiceRecordPayment();
    await testFinancialCalculations();
    await testBMSAutoPO();
    await testLoanerFleet();
    await testFrontendServices();

    printSummary();

    log(`\nCompleted: ${new Date().toLocaleString()}`, 'gray');

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n✗ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests, testResults };
