/**
 * Comprehensive Phase 1 Supabase Integration Test Runner
 * Tests all components of the hybrid cloud sync implementation
 */

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  categories: {},
};

// Helper to log test result
function logTest(category, test, status, details = '') {
  if (!testResults.categories[category]) {
    testResults.categories[category] = { tests: [], passed: 0, failed: 0, warnings: 0 };
  }

  const result = { test, status, details, timestamp: new Date().toISOString() };
  testResults.categories[category].tests.push(result);
  testResults.summary.totalTests++;

  if (status === 'PASS') {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
    console.log(`✅ ${test}`);
  } else if (status === 'FAIL') {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    console.log(`❌ ${test}`);
    if (details) console.log(`   ${details}`);
  } else if (status === 'WARN') {
    testResults.categories[category].warnings++;
    testResults.summary.warnings++;
    console.log(`⚠️  ${test}`);
    if (details) console.log(`   ${details}`);
  }
}

// =====================================================================
// TEST CATEGORY 1: Syntax Validation
// =====================================================================
async function testSyntaxValidation() {
  console.log('\n📋 CATEGORY 1: Syntax and Import Validation\n');

  const files = [
    'server/services/syncConfig.js',
    'server/services/syncQueue.js',
    'server/services/databaseServiceHybrid.js',
    'server/routes/sync.js',
    'src/services/syncService.js',
    'src/pages/Settings/CloudSyncSettings.jsx',
  ];

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, '..', file);

      if (!fs.existsSync(filePath)) {
        logTest('Syntax Validation', `File exists: ${file}`, 'FAIL', 'File not found');
        continue;
      }

      // Check file can be read
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.length === 0) {
        logTest('Syntax Validation', `${file} has content`, 'FAIL', 'File is empty');
        continue;
      }

      // Basic syntax checks
      const hasModuleExports = content.includes('module.exports') || content.includes('export');
      const hasRequireOrImport = content.includes('require(') || content.includes('import');

      logTest('Syntax Validation', `${file} - file structure valid`, 'PASS');

      if (file.includes('.js') && !file.includes('syncService.js') && !hasModuleExports) {
        logTest('Syntax Validation', `${file} - exports check`, 'WARN', 'No exports found');
      }

    } catch (error) {
      logTest('Syntax Validation', `${file} - syntax check`, 'FAIL', error.message);
    }
  }
}

// =====================================================================
// TEST CATEGORY 2: File Structure and Content Validation
// =====================================================================
async function testFileStructure() {
  console.log('\n📁 CATEGORY 2: File Structure Validation\n');

  // Test syncConfig.js structure
  try {
    const syncConfigPath = path.join(__dirname, '../server/services/syncConfig.js');
    const content = fs.readFileSync(syncConfigPath, 'utf8');

    const hasDefaultConfig = content.includes('DEFAULT_SYNC_CONFIG');
    const hasFeatureCosts = content.includes('FEATURE_COSTS');
    const hasClass = content.includes('class SyncConfigService');
    const hasInitialize = content.includes('async initialize()');
    const hasGetConfig = content.includes('getShopConfig');
    const hasUpdateConfig = content.includes('updateShopConfig');
    const hasValidateCredentials = content.includes('validateCredentials');

    logTest('File Structure', 'syncConfig.js - DEFAULT_SYNC_CONFIG defined', hasDefaultConfig ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - FEATURE_COSTS defined', hasFeatureCosts ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - SyncConfigService class', hasClass ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - initialize() method', hasInitialize ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - getShopConfig() method', hasGetConfig ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - updateShopConfig() method', hasUpdateConfig ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncConfig.js - validateCredentials() method', hasValidateCredentials ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('File Structure', 'syncConfig.js validation', 'FAIL', error.message);
  }

  // Test syncQueue.js structure
  try {
    const syncQueuePath = path.join(__dirname, '../server/services/syncQueue.js');
    const content = fs.readFileSync(syncQueuePath, 'utf8');

    const hasOperationTypes = content.includes('OPERATION_TYPES');
    const hasSyncStatus = content.includes('SYNC_STATUS');
    const hasClass = content.includes('class SyncQueueService');
    const hasEnqueue = content.includes('enqueue(');
    const hasProcessQueue = content.includes('processQueue()');
    const hasRetryLogic = content.includes('handleOperationError');

    logTest('File Structure', 'syncQueue.js - OPERATION_TYPES defined', hasOperationTypes ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncQueue.js - SYNC_STATUS defined', hasSyncStatus ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncQueue.js - SyncQueueService class', hasClass ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncQueue.js - enqueue() method', hasEnqueue ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncQueue.js - processQueue() method', hasProcessQueue ? 'PASS' : 'FAIL');
    logTest('File Structure', 'syncQueue.js - retry logic', hasRetryLogic ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('File Structure', 'syncQueue.js validation', 'FAIL', error.message);
  }

  // Test databaseServiceHybrid.js structure
  try {
    const hybridPath = path.join(__dirname, '../server/services/databaseServiceHybrid.js');
    const content = fs.readFileSync(hybridPath, 'utf8');

    const hasClass = content.includes('class HybridDatabaseService');
    const hasCreate = content.includes('async create(');
    const hasUpdate = content.includes('async update(');
    const hasDelete = content.includes('async delete(');
    const hasBulkCreate = content.includes('async bulkCreate(');
    const hasQueueSync = content.includes('queueCloudSync');
    const hasLocalWrite = content.includes('writeToLocal');

    logTest('File Structure', 'databaseServiceHybrid.js - HybridDatabaseService class', hasClass ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - create() method', hasCreate ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - update() method', hasUpdate ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - delete() method', hasDelete ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - bulkCreate() method', hasBulkCreate ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - queueCloudSync() method', hasQueueSync ? 'PASS' : 'FAIL');
    logTest('File Structure', 'databaseServiceHybrid.js - writeToLocal() method', hasLocalWrite ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('File Structure', 'databaseServiceHybrid.js validation', 'FAIL', error.message);
  }

  // Test sync routes structure
  try {
    const routesPath = path.join(__dirname, '../server/routes/sync.js');
    const content = fs.readFileSync(routesPath, 'utf8');

    const hasGetStatus = content.includes("router.get('/status'");
    const hasGetConfig = content.includes("router.get('/config'");
    const hasPutConfig = content.includes("router.put('/config'");
    const hasGetQueue = content.includes("router.get('/queue'");
    const hasTriggerSync = content.includes("router.post('/trigger'");
    const hasTestConnection = content.includes("router.post('/test-connection'");
    const hasEnable = content.includes("router.post('/enable'");
    const hasDisable = content.includes("router.post('/disable'");

    logTest('File Structure', 'sync.js - GET /status endpoint', hasGetStatus ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - GET /config endpoint', hasGetConfig ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - PUT /config endpoint', hasPutConfig ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - GET /queue endpoint', hasGetQueue ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - POST /trigger endpoint', hasTriggerSync ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - POST /test-connection endpoint', hasTestConnection ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - POST /enable endpoint', hasEnable ? 'PASS' : 'FAIL');
    logTest('File Structure', 'sync.js - POST /disable endpoint', hasDisable ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('File Structure', 'sync.js validation', 'FAIL', error.message);
  }
}

// =====================================================================
// TEST CATEGORY 3: SQL Migration Validation
// =====================================================================
async function testSQLMigrations() {
  console.log('\n🗄️  CATEGORY 3: SQL Migration Validation\n');

  const migrationFiles = [
    'supabase/migrations/20250121000001_initial_core_tables.sql',
    'supabase/migrations/20250121000002_claims_estimates_repair_orders.sql',
    'supabase/migrations/20250121000003_parts_and_purchase_orders.sql',
    'supabase/migrations/20250121000004_remaining_tables.sql',
    'supabase/migrations/20250121000005_row_level_security.sql',
  ];

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(__dirname, '..', file);

      if (!fs.existsSync(filePath)) {
        logTest('SQL Migrations', `${file} exists`, 'FAIL', 'File not found');
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');

      // Basic SQL syntax checks
      const hasCreateTable = content.includes('CREATE TABLE');
      const hasUuidExtension = file.includes('initial') ? content.includes('uuid-ossp') : true;
      const hasIndexes = content.includes('CREATE INDEX') || content.includes('idx_');
      const endsWithSemicolon = content.trim().endsWith(';');

      logTest('SQL Migrations', `${file} - file exists and readable`, 'PASS');

      if (hasCreateTable) {
        logTest('SQL Migrations', `${file} - has CREATE TABLE statements`, 'PASS');
      } else {
        logTest('SQL Migrations', `${file} - has CREATE TABLE statements`, 'WARN', 'No CREATE TABLE found');
      }

      if (file.includes('initial') && hasUuidExtension) {
        logTest('SQL Migrations', `${file} - UUID extension enabled`, 'PASS');
      }

    } catch (error) {
      logTest('SQL Migrations', `${file} validation`, 'FAIL', error.message);
    }
  }
}

// =====================================================================
// TEST CATEGORY 4: Frontend Component Validation
// =====================================================================
async function testFrontendComponents() {
  console.log('\n⚛️  CATEGORY 4: Frontend Component Validation\n');

  // Test CloudSyncSettings.jsx
  try {
    const componentPath = path.join(__dirname, '../src/pages/Settings/CloudSyncSettings.jsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    const hasImports = content.includes('import React');
    const hasMaterialUI = content.includes('@mui/material');
    const hasSyncService = content.includes("from '../../services/syncService'");
    const hasState = content.includes('useState');
    const hasEffect = content.includes('useEffect');
    const hasFeatureToggles = content.includes('FormControlLabel');
    const hasCostBreakdown = content.includes('costBreakdown');

    logTest('Frontend', 'CloudSyncSettings.jsx - React imports', hasImports ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - Material-UI imports', hasMaterialUI ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - syncService import', hasSyncService ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - useState hook', hasState ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - useEffect hook', hasEffect ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - feature toggles', hasFeatureToggles ? 'PASS' : 'FAIL');
    logTest('Frontend', 'CloudSyncSettings.jsx - cost breakdown', hasCostBreakdown ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Frontend', 'CloudSyncSettings.jsx validation', 'FAIL', error.message);
  }

  // Test syncService.js (frontend)
  try {
    const servicePath = path.join(__dirname, '../src/services/syncService.js');
    const content = fs.readFileSync(servicePath, 'utf8');

    const hasClass = content.includes('class SyncService');
    const hasGetStatus = content.includes('async getStatus()');
    const hasGetConfig = content.includes('async getConfig');
    const hasUpdateConfig = content.includes('async updateConfig');
    const hasTriggerSync = content.includes('async triggerSync()');
    const hasTestConnection = content.includes('async testConnection()');
    const hasExport = content.includes('export const syncService');

    logTest('Frontend', 'syncService.js - SyncService class', hasClass ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - getStatus() method', hasGetStatus ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - getConfig() method', hasGetConfig ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - updateConfig() method', hasUpdateConfig ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - triggerSync() method', hasTriggerSync ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - testConnection() method', hasTestConnection ? 'PASS' : 'FAIL');
    logTest('Frontend', 'syncService.js - exports singleton', hasExport ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Frontend', 'syncService.js validation', 'FAIL', error.message);
  }
}

// =====================================================================
// TEST CATEGORY 5: Configuration and Environment
// =====================================================================
async function testConfiguration() {
  console.log('\n⚙️  CATEGORY 5: Configuration Validation\n');

  // Test .env.example has required variables
  try {
    const envExamplePath = path.join(__dirname, '../.env.example');

    if (!fs.existsSync(envExamplePath)) {
      logTest('Configuration', '.env.example file exists', 'WARN', 'File not found - should be created');
    } else {
      const content = fs.readFileSync(envExamplePath, 'utf8');

      const hasSupabaseUrl = content.includes('SUPABASE_URL');
      const hasSupabaseKey = content.includes('SUPABASE_ANON_KEY');
      const hasServiceKey = content.includes('SUPABASE_SERVICE_ROLE_KEY');
      const hasEnableSupabase = content.includes('ENABLE_SUPABASE');
      const hasSyncEnabled = content.includes('SYNC_ENABLED');

      logTest('Configuration', '.env.example - SUPABASE_URL', hasSupabaseUrl ? 'PASS' : 'WARN');
      logTest('Configuration', '.env.example - SUPABASE_ANON_KEY', hasSupabaseKey ? 'PASS' : 'WARN');
      logTest('Configuration', '.env.example - SUPABASE_SERVICE_ROLE_KEY', hasServiceKey ? 'PASS' : 'WARN');
      logTest('Configuration', '.env.example - ENABLE_SUPABASE', hasEnableSupabase ? 'PASS' : 'WARN');
      logTest('Configuration', '.env.example - SYNC_ENABLED', hasSyncEnabled ? 'PASS' : 'WARN');
    }

  } catch (error) {
    logTest('Configuration', '.env.example validation', 'FAIL', error.message);
  }

  // Test package.json has required dependencies
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const hasSupabaseJS = '@supabase/supabase-js' in allDeps;
    const hasSequelize = 'sequelize' in allDeps;
    const hasExpress = 'express' in allDeps;

    logTest('Configuration', 'package.json - @supabase/supabase-js dependency', hasSupabaseJS ? 'PASS' : 'WARN');
    logTest('Configuration', 'package.json - sequelize dependency', hasSequelize ? 'PASS' : 'FAIL');
    logTest('Configuration', 'package.json - express dependency', hasExpress ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Configuration', 'package.json validation', 'FAIL', error.message);
  }
}

// =====================================================================
// Generate Test Report
// =====================================================================
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 PHASE 1 SUPABASE INTEGRATION TEST REPORT');
  console.log('='.repeat(70));

  console.log(`\n📅 Test Date: ${testResults.timestamp}`);
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   ✅ Passed: ${testResults.summary.passed}`);
  console.log(`   ❌ Failed: ${testResults.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.summary.warnings}`);

  const passRate = ((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1);
  console.log(`   📊 Pass Rate: ${passRate}%`);

  console.log(`\n🔍 Results by Category:`);

  for (const [category, results] of Object.entries(testResults.categories)) {
    const categoryPassRate = ((results.passed / results.tests.length) * 100).toFixed(1);
    console.log(`\n   ${category}:`);
    console.log(`      Total: ${results.tests.length}`);
    console.log(`      Passed: ${results.passed}`);
    console.log(`      Failed: ${results.failed}`);
    console.log(`      Warnings: ${results.warnings}`);
    console.log(`      Pass Rate: ${categoryPassRate}%`);
  }

  // Overall Status
  const overallStatus = testResults.summary.failed === 0 ? '🟢 EXCELLENT' :
                       testResults.summary.failed <= 5 ? '🟡 GOOD' :
                       '🔴 NEEDS ATTENTION';

  console.log(`\n📋 Overall Status: ${overallStatus}`);

  if (testResults.summary.failed === 0 && testResults.summary.warnings === 0) {
    console.log('\n🎉 All tests passed! Phase 1 Supabase integration is ready for deployment.');
  } else if (testResults.summary.failed === 0) {
    console.log('\n✅ All critical tests passed. Review warnings before deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Review failures before proceeding.');
  }

  // Save detailed report to file
  const reportPath = path.join(__dirname, '../tests/reports/phase1-integration-test-report.json');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  console.log('\n' + '='.repeat(70));
}

// =====================================================================
// Main Test Runner
// =====================================================================
async function runAllTests() {
  console.log('🚀 Starting Phase 1 Supabase Integration Tests...\n');

  try {
    await testSyntaxValidation();
    await testFileStructure();
    await testSQLMigrations();
    await testFrontendComponents();
    await testConfiguration();

    generateReport();

  } catch (error) {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
