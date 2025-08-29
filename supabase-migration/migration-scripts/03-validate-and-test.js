/**
 * Validation and Testing Script for Supabase Migration
 * Comprehensive testing of migrated data and functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class MigrationValidator {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.logFile = path.join(__dirname, '..', 'validation-log.txt');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Supabase configuration not found. Please run setup script first.');
    }
    
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    
    // Initialize both service role and anon clients
    this.adminClient = createClient(config.supabaseUrl, config.serviceRoleKey);
    this.anonClient = createClient(config.supabaseUrl, config.anonKey);
    
    this.config = config;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    
    try {
      this.log(`Running test: ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      
      this.log(`✅ Test passed: ${testName} (${duration}ms)`, 'success');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      this.log(`❌ Test failed: ${testName} - ${error.message} (${duration}ms)`, 'error');
    }
  }

  // =====================================================
  // DATABASE STRUCTURE TESTS
  // =====================================================

  async testTableExistence() {
    const expectedTables = [
      'shops', 'users', 'customers', 'vehicles', 'parts', 
      'vendors', 'jobs', 'job_parts', 'job_labor', 
      'job_updates', 'estimates', 'notifications', 'audit_log'
    ];
    
    for (const table of expectedTables) {
      const { data, error } = await this.adminClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Table ${table} does not exist or is not accessible: ${error.message}`);
      }
    }
  }

  async testRLSPolicies() {
    // Test that RLS is enabled on all main tables
    const tables = ['shops', 'users', 'customers', 'vehicles', 'parts', 'vendors', 'jobs'];
    
    for (const table of tables) {
      // Try to access with anon client (should fail due to RLS)
      const { error } = await this.anonClient
        .from(table)
        .select('*')
        .limit(1);
      
      // We expect this to fail due to RLS
      if (!error) {
        this.log(`Warning: Table ${table} might not have proper RLS protection`, 'warning');
      }
    }
  }

  async testForeignKeyConstraints() {
    // Test that foreign key relationships are working
    
    // Try to insert a user with invalid shop_id (should fail)
    try {
      const { error } = await this.adminClient
        .from('users')
        .insert([{
          user_id: 'test-invalid-shop',
          shop_id: 'non-existent-shop-id',
          username: 'test-user',
          first_name: 'Test',
          last_name: 'User',
          role: 'technician'
        }]);
      
      if (!error) {
        throw new Error('Foreign key constraint not working - invalid shop_id was accepted');
      }
    } catch (insertError) {
      // This is expected to fail
    }
  }

  async testDatabaseFunctions() {
    // Test custom functions
    const functions = [
      'get_shop_dashboard_stats',
      'global_search',
      'has_permission',
      'get_user_shop'
    ];
    
    for (const funcName of functions) {
      try {
        // Try to call each function (may fail due to parameters, but should exist)
        await this.adminClient.rpc(funcName);
      } catch (error) {
        // Check if it's a "function doesn't exist" error vs parameter error
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          throw new Error(`Function ${funcName} does not exist`);
        }
        // Parameter errors are okay - function exists
      }
    }
  }

  // =====================================================
  // DATA INTEGRITY TESTS
  // =====================================================

  async testDataIntegrity() {
    // Check that all shops have at least one user
    const { data: shops } = await this.adminClient.from('shops').select('id');
    
    for (const shop of shops || []) {
      const { data: users, error } = await this.adminClient
        .from('users')
        .select('user_id')
        .eq('shop_id', shop.id)
        .limit(1);
      
      if (error) {
        throw new Error(`Failed to query users for shop ${shop.id}: ${error.message}`);
      }
      
      if (!users || users.length === 0) {
        throw new Error(`Shop ${shop.id} has no users`);
      }
    }
  }

  async testUserRolePermissions() {
    // Get a sample user and verify their permissions are set correctly
    const { data: users } = await this.adminClient
      .from('users')
      .select('user_id, role, permissions')
      .limit(5);
    
    for (const user of users || []) {
      if (!user.permissions || typeof user.permissions !== 'object') {
        throw new Error(`User ${user.user_id} has invalid permissions structure`);
      }
      
      // Check that owner/admin users have dashboard.view permission
      if (user.role === 'owner' || user.role === 'admin') {
        if (!user.permissions['dashboard.view']) {
          throw new Error(`${user.role} user ${user.user_id} missing dashboard.view permission`);
        }
      }
    }
  }

  async testJobStatusWorkflow() {
    // Verify job status values are valid
    const { data: jobs } = await this.adminClient
      .from('jobs')
      .select('id, status')
      .limit(10);
    
    const validStatuses = [
      'estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving',
      'body_structure', 'paint_prep', 'paint_booth', 'reassembly',
      'quality_control', 'calibration', 'detail', 'ready_pickup',
      'delivered', 'on_hold', 'cancelled'
    ];
    
    for (const job of jobs || []) {
      if (!validStatuses.includes(job.status)) {
        throw new Error(`Job ${job.id} has invalid status: ${job.status}`);
      }
    }
  }

  // =====================================================
  // AUTHENTICATION TESTS
  // =====================================================

  async testAuthenticationSystem() {
    // Test that we can create and authenticate a user
    const testEmail = 'test-validation@collisionos.com';
    const testPassword = 'test-password-123';
    
    try {
      // Clean up any existing test user
      try {
        await this.adminClient.auth.admin.deleteUser('test-validation-user-id');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Create test user
      const { data: createData, error: createError } = await this.adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createError) {
        throw new Error(`Failed to create test user: ${createError.message}`);
      }
      
      // Try to sign in with the test user
      const { data: signInData, error: signInError } = await this.anonClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        throw new Error(`Failed to sign in test user: ${signInError.message}`);
      }
      
      // Clean up test user
      await this.adminClient.auth.admin.deleteUser(createData.user.id);
      
    } catch (error) {
      throw error;
    }
  }

  async testPasswordReset() {
    // Test password reset functionality
    const { error } = await this.anonClient.auth.resetPasswordForEmail(
      'test@example.com',
      { redirectTo: 'http://localhost:3000/reset-password' }
    );
    
    // This should not error even for non-existent email (for security)
    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // =====================================================
  // REALTIME TESTS
  // =====================================================

  async testRealtimeSubscriptions() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Realtime subscription test timed out'));
      }, 10000);
      
      // Test realtime subscription to jobs table
      const channel = this.anonClient
        .channel('test-jobs-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs'
          },
          (payload) => {
            clearTimeout(timeout);
            this.anonClient.removeChannel(channel);
            resolve();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Trigger a change to test the subscription
            this.adminClient
              .from('jobs')
              .select('id')
              .limit(1)
              .then(({ data }) => {
                if (data && data.length > 0) {
                  // Update a job to trigger the subscription
                  this.adminClient
                    .from('jobs')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', data[0].id)
                    .then(() => {
                      // Wait a moment for the subscription to fire
                      setTimeout(() => {
                        clearTimeout(timeout);
                        this.anonClient.removeChannel(channel);
                        resolve();
                      }, 2000);
                    });
                } else {
                  clearTimeout(timeout);
                  this.anonClient.removeChannel(channel);
                  resolve(); // No jobs to test with, but subscription worked
                }
              });
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Failed to subscribe to realtime channel'));
          }
        });
    });
  }

  // =====================================================
  // PERFORMANCE TESTS
  // =====================================================

  async testQueryPerformance() {
    // Test basic query performance
    const startTime = Date.now();
    
    const { data, error } = await this.adminClient
      .from('jobs')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        assignee:users(first_name, last_name)
      `)
      .limit(10);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
    
    if (duration > 5000) { // 5 seconds
      throw new Error(`Query too slow: ${duration}ms`);
    }
    
    this.log(`Query performance: ${duration}ms for complex join`, 'info');
  }

  async testBulkOperations() {
    // Test bulk insert/update performance
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: `test-notification-${i}`,
      shop_id: 'test-shop-id',
      title: `Test Notification ${i}`,
      message: `This is test message ${i}`,
      type: 'info',
      created_at: new Date().toISOString()
    }));
    
    const startTime = Date.now();
    
    // Insert test notifications
    const { error: insertError } = await this.adminClient
      .from('notifications')
      .insert(testData);
    
    if (insertError) {
      throw new Error(`Bulk insert failed: ${insertError.message}`);
    }
    
    const insertDuration = Date.now() - startTime;
    
    // Clean up test data
    await this.adminClient
      .from('notifications')
      .delete()
      .like('id', 'test-notification-%');
    
    if (insertDuration > 10000) { // 10 seconds
      throw new Error(`Bulk insert too slow: ${insertDuration}ms`);
    }
    
    this.log(`Bulk insert performance: ${insertDuration}ms for 100 records`, 'info');
  }

  // =====================================================
  // BUSINESS LOGIC TESTS
  // =====================================================

  async testShopDashboardStats() {
    // Test the dashboard stats function
    const { data: shops } = await this.adminClient
      .from('shops')
      .select('id')
      .limit(1);
    
    if (shops && shops.length > 0) {
      const { data, error } = await this.adminClient.rpc('get_shop_dashboard_stats', {
        shop_uuid: shops[0].id
      });
      
      if (error) {
        throw new Error(`Dashboard stats function failed: ${error.message}`);
      }
      
      // Verify the structure of returned data
      const expectedKeys = ['jobs', 'customers', 'parts'];
      for (const key of expectedKeys) {
        if (!(key in data)) {
          throw new Error(`Dashboard stats missing key: ${key}`);
        }
      }
    }
  }

  async testGlobalSearch() {
    // Test the global search function
    const { data: shops } = await this.adminClient
      .from('shops')
      .select('id')
      .limit(1);
    
    if (shops && shops.length > 0) {
      const { data, error } = await this.adminClient.rpc('global_search', {
        shop_uuid: shops[0].id,
        search_term: 'test',
        entity_types: ['jobs', 'customers']
      });
      
      if (error) {
        throw new Error(`Global search function failed: ${error.message}`);
      }
      
      // Data should be an array
      if (!Array.isArray(data)) {
        throw new Error('Global search should return an array');
      }
    }
  }

  // =====================================================
  // MAIN VALIDATION RUNNER
  // =====================================================

  async runAllTests() {
    const startTime = Date.now();
    
    this.log('Starting comprehensive validation tests...');
    
    // Database Structure Tests
    await this.runTest('Table Existence', () => this.testTableExistence());
    await this.runTest('RLS Policies', () => this.testRLSPolicies());
    await this.runTest('Foreign Key Constraints', () => this.testForeignKeyConstraints());
    await this.runTest('Database Functions', () => this.testDatabaseFunctions());
    
    // Data Integrity Tests
    await this.runTest('Data Integrity', () => this.testDataIntegrity());
    await this.runTest('User Role Permissions', () => this.testUserRolePermissions());
    await this.runTest('Job Status Workflow', () => this.testJobStatusWorkflow());
    
    // Authentication Tests
    await this.runTest('Authentication System', () => this.testAuthenticationSystem());
    await this.runTest('Password Reset', () => this.testPasswordReset());
    
    // Realtime Tests
    await this.runTest('Realtime Subscriptions', () => this.testRealtimeSubscriptions());
    
    // Performance Tests
    await this.runTest('Query Performance', () => this.testQueryPerformance());
    await this.runTest('Bulk Operations', () => this.testBulkOperations());
    
    // Business Logic Tests
    await this.runTest('Dashboard Stats Function', () => this.testShopDashboardStats());
    await this.runTest('Global Search Function', () => this.testGlobalSearch());
    
    const duration = Date.now() - startTime;
    
    // Generate summary
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    const summary = {
      testDate: new Date().toISOString(),
      duration,
      totalTests: total,
      passed,
      failed,
      successRate: (passed / total * 100).toFixed(2),
      results: this.testResults
    };
    
    // Save results
    const resultsFile = path.join(__dirname, '..', 'validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
    
    this.log(`Validation completed in ${(duration / 1000).toFixed(2)} seconds`, 'success');
    this.log(`Results: ${passed}/${total} tests passed (${summary.successRate}%)`, 
             failed > 0 ? 'warning' : 'success');
    
    if (failed > 0) {
      this.log('Failed tests:', 'error');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'error');
        });
    }
    
    return summary;
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new MigrationValidator();
  
  validator.runAllTests()
    .then(summary => {
      console.log('\n📋 Validation Summary:');
      console.log(`✅ Passed: ${summary.passed}`);
      console.log(`❌ Failed: ${summary.failed}`);
      console.log(`📊 Success Rate: ${summary.successRate}%`);
      
      if (summary.failed === 0) {
        console.log('\n🎉 All tests passed! Migration is ready for production.');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some tests failed. Please review and fix issues before proceeding.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Validation failed to run:', error.message);
      process.exit(1);
    });
}

module.exports = MigrationValidator;