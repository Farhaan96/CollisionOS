/**
 * Load Testing Script for Sync Queue
 * Tests sync queue performance under high load
 *
 * Usage:
 *   node scripts/load-test-sync-queue.js [operations] [concurrency]
 *
 * Examples:
 *   node scripts/load-test-sync-queue.js 1000           # 1000 operations, default concurrency
 *   node scripts/load-test-sync-queue.js 5000 10        # 5000 operations, 10 concurrent
 */

const { hybridDatabaseService } = require('../server/services/databaseServiceHybrid');
const { syncQueueService } = require('../server/services/syncQueue');
const { syncConfigService } = require('../server/services/syncConfig');

// Configuration
const OPERATIONS_COUNT = parseInt(process.argv[2]) || 1000;
const CONCURRENCY = parseInt(process.argv[3]) || 5;
const TEST_SHOP_ID = 'test-shop-123';

// Test data generators
const generateCustomer = (index) => ({
  id: `cust-${Date.now()}-${index}`,
  shop_id: TEST_SHOP_ID,
  first_name: `Test${index}`,
  last_name: `Customer${index}`,
  email: `test${index}@example.com`,
  phone: `555-${String(index).padStart(4, '0')}`,
  created_at: new Date(),
  updated_at: new Date(),
});

const generateVehicle = (index, customerId) => ({
  id: `veh-${Date.now()}-${index}`,
  shop_id: TEST_SHOP_ID,
  customer_id: customerId,
  vin: `TEST${String(index).padStart(13, '0')}`,
  year: 2020 + (index % 5),
  make: ['Toyota', 'Honda', 'Ford', 'Chevrolet'][index % 4],
  model: ['Camry', 'Accord', 'F-150', 'Silverado'][index % 4],
  created_at: new Date(),
  updated_at: new Date(),
});

const generateRepairOrder = (index, customerId, vehicleId) => ({
  id: `ro-${Date.now()}-${index}`,
  shop_id: TEST_SHOP_ID,
  ro_number: `RO-${Date.now()}-${index}`,
  customer_id: customerId,
  vehicle_id: vehicleId,
  status: 'open',
  opened_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
});

// Performance metrics
const metrics = {
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0,
  totalTime: 0,
  startTime: null,
  endTime: null,
  operationTimes: [],
  queueSizeSamples: [],
  memoryUsageSamples: [],
};

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('\n' + '='.repeat(60));
  console.log('CollisionOS Sync Queue Load Test');
  console.log('='.repeat(60));
  console.log(`Operations: ${OPERATIONS_COUNT}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Sync Enabled: ${syncConfigService.isSyncEnabled()}`);
  console.log('='.repeat(60) + '\n');

  // Check if sync is enabled
  if (!syncConfigService.isSyncEnabled()) {
    console.error('❌ ERROR: Sync is not enabled. Set ENABLE_SUPABASE=true and SYNC_ENABLED=true in .env');
    console.log('\nFor testing without Supabase, this script will simulate queue operations.\n');
  }

  // Start monitoring
  const monitorInterval = startMonitoring();

  // Start timer
  metrics.startTime = Date.now();

  try {
    // Run test scenarios
    await runCreateOperations();
    await runUpdateOperations();
    await runDeleteOperations();
    await runBulkOperations();
    await runMixedOperations();

    // Wait for queue to process
    console.log('\nWaiting for queue to process remaining operations...');
    await waitForQueueToEmpty(60000); // 60 second timeout

  } catch (error) {
    console.error('\n❌ Load test failed:', error);
  } finally {
    // Stop monitoring
    clearInterval(monitorInterval);

    // End timer
    metrics.endTime = Date.now();
    metrics.totalTime = metrics.endTime - metrics.startTime;

    // Print results
    printResults();
  }
}

/**
 * Test Scenario 1: Create Operations
 */
async function runCreateOperations() {
  console.log(`\n📝 Running CREATE operations (${Math.floor(OPERATIONS_COUNT * 0.4)} ops)...`);
  const count = Math.floor(OPERATIONS_COUNT * 0.4);
  const batches = Math.ceil(count / CONCURRENCY);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * CONCURRENCY;
    const end = Math.min(start + CONCURRENCY, count);

    for (let i = start; i < end; i++) {
      promises.push(executeCreateOperation(i));
    }

    await Promise.allSettled(promises);
    process.stdout.write(`\rProgress: ${end}/${count} (${Math.round((end / count) * 100)}%)`);
  }

  console.log(' ✅ Done');
}

/**
 * Test Scenario 2: Update Operations
 */
async function runUpdateOperations() {
  console.log(`\n🔄 Running UPDATE operations (${Math.floor(OPERATIONS_COUNT * 0.3)} ops)...`);
  const count = Math.floor(OPERATIONS_COUNT * 0.3);
  const batches = Math.ceil(count / CONCURRENCY);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * CONCURRENCY;
    const end = Math.min(start + CONCURRENCY, count);

    for (let i = start; i < end; i++) {
      promises.push(executeUpdateOperation(i));
    }

    await Promise.allSettled(promises);
    process.stdout.write(`\rProgress: ${end}/${count} (${Math.round((end / count) * 100)}%)`);
  }

  console.log(' ✅ Done');
}

/**
 * Test Scenario 3: Delete Operations
 */
async function runDeleteOperations() {
  console.log(`\n🗑️  Running DELETE operations (${Math.floor(OPERATIONS_COUNT * 0.1)} ops)...`);
  const count = Math.floor(OPERATIONS_COUNT * 0.1);
  const batches = Math.ceil(count / CONCURRENCY);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * CONCURRENCY;
    const end = Math.min(start + CONCURRENCY, count);

    for (let i = start; i < end; i++) {
      promises.push(executeDeleteOperation(i));
    }

    await Promise.allSettled(promises);
    process.stdout.write(`\rProgress: ${end}/${count} (${Math.round((end / count) * 100)}%)`);
  }

  console.log(' ✅ Done');
}

/**
 * Test Scenario 4: Bulk Operations
 */
async function runBulkOperations() {
  console.log(`\n📦 Running BULK operations (${Math.floor(OPERATIONS_COUNT * 0.1)} ops)...`);
  const count = Math.floor(OPERATIONS_COUNT * 0.1);
  const batchSize = 50; // Bulk create 50 at a time
  const batches = Math.ceil(count / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, count);
    const records = [];

    for (let i = start; i < end; i++) {
      records.push(generateCustomer(i + 10000));
    }

    await executeBulkCreateOperation(records);
    process.stdout.write(`\rProgress: ${end}/${count} (${Math.round((end / count) * 100)}%)`);
  }

  console.log(' ✅ Done');
}

/**
 * Test Scenario 5: Mixed Operations
 */
async function runMixedOperations() {
  console.log(`\n🔀 Running MIXED operations (${Math.floor(OPERATIONS_COUNT * 0.1)} ops)...`);
  const count = Math.floor(OPERATIONS_COUNT * 0.1);
  const batches = Math.ceil(count / CONCURRENCY);

  for (let batch = 0; batch < batches; batch++) {
    const promises = [];
    const start = batch * CONCURRENCY;
    const end = Math.min(start + CONCURRENCY, count);

    for (let i = start; i < end; i++) {
      // Random operation type
      const rand = Math.random();
      if (rand < 0.5) {
        promises.push(executeCreateOperation(i + 20000));
      } else if (rand < 0.8) {
        promises.push(executeUpdateOperation(i + 20000));
      } else {
        promises.push(executeDeleteOperation(i + 20000));
      }
    }

    await Promise.allSettled(promises);
    process.stdout.write(`\rProgress: ${end}/${count} (${Math.round((end / count) * 100)}%)`);
  }

  console.log(' ✅ Done');
}

/**
 * Execute single create operation
 */
async function executeCreateOperation(index) {
  const startTime = Date.now();
  try {
    const customer = generateCustomer(index);
    syncQueueService.queueCreate('customers', customer, { shopId: TEST_SHOP_ID });

    metrics.successfulOperations++;
    metrics.operationTimes.push(Date.now() - startTime);
  } catch (error) {
    metrics.failedOperations++;
    console.error(`\n❌ Create operation ${index} failed:`, error.message);
  }
  metrics.totalOperations++;
}

/**
 * Execute single update operation
 */
async function executeUpdateOperation(index) {
  const startTime = Date.now();
  try {
    const updates = {
      first_name: `Updated${index}`,
      updated_at: new Date(),
    };
    syncQueueService.queueUpdate('customers', { id: `cust-${index}` }, updates, { shopId: TEST_SHOP_ID });

    metrics.successfulOperations++;
    metrics.operationTimes.push(Date.now() - startTime);
  } catch (error) {
    metrics.failedOperations++;
    console.error(`\n❌ Update operation ${index} failed:`, error.message);
  }
  metrics.totalOperations++;
}

/**
 * Execute single delete operation
 */
async function executeDeleteOperation(index) {
  const startTime = Date.now();
  try {
    syncQueueService.queueDelete('customers', { id: `cust-${index}` }, { shopId: TEST_SHOP_ID });

    metrics.successfulOperations++;
    metrics.operationTimes.push(Date.now() - startTime);
  } catch (error) {
    metrics.failedOperations++;
    console.error(`\n❌ Delete operation ${index} failed:`, error.message);
  }
  metrics.totalOperations++;
}

/**
 * Execute bulk create operation
 */
async function executeBulkCreateOperation(records) {
  const startTime = Date.now();
  try {
    syncQueueService.queueBulkCreate('customers', records, { shopId: TEST_SHOP_ID });

    metrics.successfulOperations += records.length;
    metrics.operationTimes.push(Date.now() - startTime);
  } catch (error) {
    metrics.failedOperations += records.length;
    console.error(`\n❌ Bulk create operation failed:`, error.message);
  }
  metrics.totalOperations += records.length;
}

/**
 * Wait for queue to empty (or timeout)
 */
async function waitForQueueToEmpty(timeoutMs) {
  const startTime = Date.now();
  let lastSize = -1;

  while (Date.now() - startTime < timeoutMs) {
    const stats = syncQueueService.getStats();
    const queueSize = stats.queueSize;

    if (queueSize === 0) {
      console.log('✅ Queue empty!');
      return;
    }

    if (queueSize !== lastSize) {
      process.stdout.write(`\rQueue size: ${queueSize}, Processed: ${stats.totalProcessed}`);
      lastSize = queueSize;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
  }

  console.log('\n⚠️  Timeout reached, queue still has items');
}

/**
 * Start monitoring metrics
 */
function startMonitoring() {
  return setInterval(() => {
    const stats = syncQueueService.getStats();
    const memUsage = process.memoryUsage();

    metrics.queueSizeSamples.push(stats.queueSize);
    metrics.memoryUsageSamples.push(memUsage.heapUsed / 1024 / 1024); // MB
  }, 1000); // Sample every second
}

/**
 * Print test results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('Load Test Results');
  console.log('='.repeat(60));

  // Operation stats
  console.log('\n📊 Operation Statistics:');
  console.log(`  Total Operations:      ${metrics.totalOperations}`);
  console.log(`  Successful:            ${metrics.successfulOperations} (${((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(2)}%)`);
  console.log(`  Failed:                ${metrics.failedOperations} (${((metrics.failedOperations / metrics.totalOperations) * 100).toFixed(2)}%)`);

  // Time stats
  console.log('\n⏱️  Time Statistics:');
  console.log(`  Total Time:            ${(metrics.totalTime / 1000).toFixed(2)}s`);
  console.log(`  Throughput:            ${(metrics.totalOperations / (metrics.totalTime / 1000)).toFixed(2)} ops/sec`);

  if (metrics.operationTimes.length > 0) {
    const avgTime = metrics.operationTimes.reduce((a, b) => a + b, 0) / metrics.operationTimes.length;
    const minTime = Math.min(...metrics.operationTimes);
    const maxTime = Math.max(...metrics.operationTimes);

    console.log(`  Avg Operation Time:    ${avgTime.toFixed(2)}ms`);
    console.log(`  Min Operation Time:    ${minTime}ms`);
    console.log(`  Max Operation Time:    ${maxTime}ms`);
  }

  // Queue stats
  const finalStats = syncQueueService.getStats();
  console.log('\n📦 Queue Statistics:');
  console.log(`  Final Queue Size:      ${finalStats.queueSize}`);
  console.log(`  Total Processed:       ${finalStats.totalProcessed}`);
  console.log(`  Total Failed:          ${finalStats.totalFailed}`);
  console.log(`  Total Retried:         ${finalStats.totalRetried}`);

  if (metrics.queueSizeSamples.length > 0) {
    const maxQueue = Math.max(...metrics.queueSizeSamples);
    const avgQueue = metrics.queueSizeSamples.reduce((a, b) => a + b, 0) / metrics.queueSizeSamples.length;
    console.log(`  Max Queue Size:        ${maxQueue}`);
    console.log(`  Avg Queue Size:        ${avgQueue.toFixed(2)}`);
  }

  // Memory stats
  if (metrics.memoryUsageSamples.length > 0) {
    const maxMem = Math.max(...metrics.memoryUsageSamples);
    const avgMem = metrics.memoryUsageSamples.reduce((a, b) => a + b, 0) / metrics.memoryUsageSamples.length;
    console.log('\n💾 Memory Statistics:');
    console.log(`  Max Heap Used:         ${maxMem.toFixed(2)} MB`);
    console.log(`  Avg Heap Used:         ${avgMem.toFixed(2)} MB`);
  }

  // Performance grade
  console.log('\n🎯 Performance Grade:');
  const successRate = (metrics.successfulOperations / metrics.totalOperations) * 100;
  const throughput = metrics.totalOperations / (metrics.totalTime / 1000);

  let grade = 'F';
  if (successRate > 99 && throughput > 100) grade = 'A';
  else if (successRate > 95 && throughput > 50) grade = 'B';
  else if (successRate > 90 && throughput > 25) grade = 'C';
  else if (successRate > 80) grade = 'D';

  console.log(`  Grade:                 ${grade}`);
  console.log(`  Success Rate:          ${successRate.toFixed(2)}%`);
  console.log(`  Throughput:            ${throughput.toFixed(2)} ops/sec`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (finalStats.queueSize > 100) {
    console.log(`  ⚠️  Queue still has ${finalStats.queueSize} items - increase SYNC_INTERVAL or SYNC_BATCH_SIZE`);
  }
  if (finalStats.totalFailed > metrics.totalOperations * 0.01) {
    console.log(`  ⚠️  High failure rate (${finalStats.totalFailed}) - check Supabase connection`);
  }
  if (maxMem > 500) {
    console.log(`  ⚠️  High memory usage (${maxMem.toFixed(2)} MB) - consider Redis queue`);
  }
  if (throughput < 50) {
    console.log(`  ⚠️  Low throughput (${throughput.toFixed(2)} ops/sec) - optimize batch processing`);
  }
  if (grade === 'A') {
    console.log(`  ✅ Excellent performance! System handles load well.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the load test
runLoadTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
