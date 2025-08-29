/**
 * Test Seeded Data Script for CollisionOS Supabase Migration
 * Validates that all seeded data is properly inserted and relationships work correctly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class SeededDataTester {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.logFile = path.join(__dirname, '..', 'test-results.txt');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Supabase configuration not found. Please run setup script first.');
    }
    
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    this.client = createClient(config.supabaseUrl, config.serviceRoleKey);
    
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
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        result,
        error: null
      });
      
      this.log(`✅ Test passed: ${testName} (${duration}ms)`, 'success');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        result: null,
        error: error.message
      });
      
      this.log(`❌ Test failed: ${testName} - ${error.message} (${duration}ms)`, 'error');
      throw error;
    }
  }

  async testAllData() {
    this.log('🧪 Starting comprehensive seeded data testing...');
    
    try {
      // Test basic data existence
      await this.testShopData();
      await this.testUserData();
      await this.testCustomerData();
      await this.testVehicleData();
      await this.testVendorData();
      await this.testPartsData();
      await this.testJobsData();
      await this.testJobPartsData();
      await this.testJobLaborData();
      await this.testJobUpdatesData();
      await this.testNotificationsData();

      // Test relationships and business logic
      await this.testCustomerVehicleRelationships();
      await this.testJobCustomerVehicleRelationships();
      await this.testPartsVendorRelationships();
      await this.testJobPartsRelationships();
      await this.testUserRolePermissions();
      await this.testJobWorkflowProgression();
      await this.testFinancialCalculations();
      await this.testDataIntegrity();

      // Test queries and performance
      await this.testComplexQueries();
      await this.testPerformanceQueries();
      await this.testRealtimeSubscriptions();

      this.log('✅ All seeded data tests completed!', 'success');
      this.generateTestReport();
    } catch (error) {
      this.log(`❌ Error testing seeded data: ${error.message}`, 'error');
      throw error;
    }
  }

  async testShopData() {
    return this.runTest('Shop Data Validation', async () => {
      const { data: shops, error } = await this.client
        .from('shops')
        .select('*')
        .eq('id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch shop data: ${error.message}`);
      if (!shops || shops.length === 0) throw new Error('No shop data found');
      
      const shop = shops[0];
      if (shop.name !== 'CollisionOS Test Shop') {
        throw new Error(`Invalid shop name: ${shop.name}`);
      }
      
      return { shop_count: shops.length, shop_name: shop.name };
    });
  }

  async testUserData() {
    return this.runTest('User Data Validation', async () => {
      const { data: users, error } = await this.client
        .from('users')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch user data: ${error.message}`);
      if (!users || users.length !== 6) {
        throw new Error(`Expected 6 users, found ${users?.length || 0}`);
      }

      const roles = users.map(u => u.role);
      const expectedRoles = ['owner', 'manager', 'service_advisor', 'estimator', 'technician', 'parts_manager'];
      
      for (const role of expectedRoles) {
        if (!roles.includes(role)) {
          throw new Error(`Missing user role: ${role}`);
        }
      }

      return { user_count: users.length, roles_found: roles };
    });
  }

  async testCustomerData() {
    return this.runTest('Customer Data Validation', async () => {
      const { data: customers, error } = await this.client
        .from('customers')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch customer data: ${error.message}`);
      if (!customers || customers.length !== 5) {
        throw new Error(`Expected 5 customers, found ${customers?.length || 0}`);
      }

      const customerTypes = customers.map(c => c.customer_type);
      const expectedTypes = ['individual', 'business', 'insurance', 'individual'];
      
      // Check for VIP customer
      const vipCustomer = customers.find(c => c.customer_status === 'vip');
      if (!vipCustomer) {
        throw new Error('VIP customer not found');
      }

      return { customer_count: customers.length, types_found: customerTypes, has_vip: !!vipCustomer };
    });
  }

  async testVehicleData() {
    return this.runTest('Vehicle Data Validation', async () => {
      const { data: vehicles, error } = await this.client
        .from('vehicles')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch vehicle data: ${error.message}`);
      if (!vehicles || vehicles.length !== 5) {
        throw new Error(`Expected 5 vehicles, found ${vehicles?.length || 0}`);
      }

      const makes = vehicles.map(v => v.make);
      const expectedMakes = ['Honda', 'Hyundai', 'Volkswagen', 'Ford', 'BMW'];
      
      for (const make of expectedMakes) {
        if (!makes.includes(make)) {
          throw new Error(`Missing vehicle make: ${make}`);
        }
      }

      return { vehicle_count: vehicles.length, makes_found: makes };
    });
  }

  async testVendorData() {
    return this.runTest('Vendor Data Validation', async () => {
      const { data: vendors, error } = await this.client
        .from('vendors')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch vendor data: ${error.message}`);
      if (!vendors || vendors.length !== 4) {
        throw new Error(`Expected 4 vendors, found ${vendors?.length || 0}`);
      }

      const vendorTypes = vendors.map(v => v.vendor_type);
      const expectedTypes = ['oem', 'aftermarket', 'paint_supplier', 'equipment_supplier'];
      
      for (const type of expectedTypes) {
        if (!vendorTypes.includes(type)) {
          throw new Error(`Missing vendor type: ${type}`);
        }
      }

      return { vendor_count: vendors.length, types_found: vendorTypes };
    });
  }

  async testPartsData() {
    return this.runTest('Parts Data Validation', async () => {
      const { data: parts, error } = await this.client
        .from('parts')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch parts data: ${error.message}`);
      if (!parts || parts.length !== 5) {
        throw new Error(`Expected 5 parts, found ${parts?.length || 0}`);
      }

      const categories = parts.map(p => p.category);
      const expectedCategories = ['body', 'electrical', 'exterior', 'paint'];
      
      for (const category of expectedCategories) {
        if (!categories.includes(category)) {
          throw new Error(`Missing part category: ${category}`);
        }
      }

      // Check pricing logic
      for (const part of parts) {
        const expectedPrice = part.cost * (1 + part.markup_percentage / 100);
        if (Math.abs(part.price - expectedPrice) > 0.01) {
          throw new Error(`Invalid pricing for part ${part.name}: expected ${expectedPrice}, got ${part.price}`);
        }
      }

      return { part_count: parts.length, categories_found: categories };
    });
  }

  async testJobsData() {
    return this.runTest('Jobs Data Validation', async () => {
      const { data: jobs, error } = await this.client
        .from('jobs')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch jobs data: ${error.message}`);
      if (!jobs || jobs.length !== 5) {
        throw new Error(`Expected 5 jobs, found ${jobs?.length || 0}`);
      }

      const statuses = jobs.map(j => j.status);
      const expectedStatuses = ['estimate', 'body_structure', 'quality_control', 'ready_pickup', 'intake'];
      
      for (const status of expectedStatuses) {
        if (!statuses.includes(status)) {
          throw new Error(`Missing job status: ${status}`);
        }
      }

      // Check for VIP job
      const vipJob = jobs.find(j => j.is_vip === true);
      if (!vipJob) {
        throw new Error('VIP job not found');
      }

      return { job_count: jobs.length, statuses_found: statuses, has_vip_job: !!vipJob };
    });
  }

  async testJobPartsData() {
    return this.runTest('Job Parts Data Validation', async () => {
      const { data: jobParts, error } = await this.client
        .from('job_parts')
        .select('*');

      if (error) throw new Error(`Failed to fetch job parts data: ${error.message}`);
      if (!jobParts || jobParts.length !== 2) {
        throw new Error(`Expected 2 job parts, found ${jobParts?.length || 0}`);
      }

      // Check pricing logic
      for (const jobPart of jobParts) {
        const expectedPrice = jobPart.cost * (1 + jobPart.markup_percentage / 100);
        if (Math.abs(jobPart.price - expectedPrice) > 0.01) {
          throw new Error(`Invalid pricing for job part: expected ${expectedPrice}, got ${jobPart.price}`);
        }
      }

      return { job_part_count: jobParts.length };
    });
  }

  async testJobLaborData() {
    return this.runTest('Job Labor Data Validation', async () => {
      const { data: jobLabor, error } = await this.client
        .from('job_labor')
        .select('*');

      if (error) throw new Error(`Failed to fetch job labor data: ${error.message}`);
      if (!jobLabor || jobLabor.length !== 4) {
        throw new Error(`Expected 4 job labor records, found ${jobLabor?.length || 0}`);
      }

      // Check labor calculations
      for (const labor of jobLabor) {
        const expectedAmount = labor.hours * labor.rate;
        if (Math.abs(labor.amount - expectedAmount) > 0.01) {
          throw new Error(`Invalid labor calculation: expected ${expectedAmount}, got ${labor.amount}`);
        }
      }

      return { job_labor_count: jobLabor.length };
    });
  }

  async testJobUpdatesData() {
    return this.runTest('Job Updates Data Validation', async () => {
      const { data: jobUpdates, error } = await this.client
        .from('job_updates')
        .select('*');

      if (error) throw new Error(`Failed to fetch job updates data: ${error.message}`);
      if (!jobUpdates || jobUpdates.length !== 2) {
        throw new Error(`Expected 2 job updates, found ${jobUpdates?.length || 0}`);
      }

      const updateTypes = jobUpdates.map(u => u.update_type);
      const expectedTypes = ['status_change', 'progress'];
      
      for (const type of expectedTypes) {
        if (!updateTypes.includes(type)) {
          throw new Error(`Missing update type: ${type}`);
        }
      }

      return { job_update_count: jobUpdates.length, types_found: updateTypes };
    });
  }

  async testNotificationsData() {
    return this.runTest('Notifications Data Validation', async () => {
      const { data: notifications, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch notifications data: ${error.message}`);
      if (!notifications || notifications.length !== 2) {
        throw new Error(`Expected 2 notifications, found ${notifications?.length || 0}`);
      }

      const notificationTypes = notifications.map(n => n.type);
      const expectedTypes = ['job_assigned', 'parts_low_stock'];
      
      for (const type of expectedTypes) {
        if (!notificationTypes.includes(type)) {
          throw new Error(`Missing notification type: ${type}`);
        }
      }

      return { notification_count: notifications.length, types_found: notificationTypes };
    });
  }

  async testCustomerVehicleRelationships() {
    return this.runTest('Customer-Vehicle Relationships', async () => {
      const { data: relationships, error } = await this.client
        .from('customers')
        .select(`
          id,
          first_name,
          last_name,
          vehicles (
            id,
            make,
            model,
            year
          )
        `)
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch customer-vehicle relationships: ${error.message}`);
      
      // Check that each customer has exactly one vehicle
      for (const customer of relationships) {
        if (!customer.vehicles || customer.vehicles.length !== 1) {
          throw new Error(`Customer ${customer.first_name} ${customer.last_name} should have exactly 1 vehicle`);
        }
      }

      return { customer_count: relationships.length, all_have_vehicles: true };
    });
  }

  async testJobCustomerVehicleRelationships() {
    return this.runTest('Job-Customer-Vehicle Relationships', async () => {
      const { data: jobs, error } = await this.client
        .from('jobs')
        .select(`
          id,
          job_number,
          customers (
            id,
            first_name,
            last_name
          ),
          vehicles (
            id,
            make,
            model,
            year
          )
        `)
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch job relationships: ${error.message}`);
      
      // Check that each job has exactly one customer and one vehicle
      for (const job of jobs) {
        if (!job.customers || job.customers.length !== 1) {
          throw new Error(`Job ${job.job_number} should have exactly 1 customer`);
        }
        if (!job.vehicles || job.vehicles.length !== 1) {
          throw new Error(`Job ${job.job_number} should have exactly 1 vehicle`);
        }
      }

      return { job_count: jobs.length, all_have_relationships: true };
    });
  }

  async testPartsVendorRelationships() {
    return this.runTest('Parts-Vendor Relationships', async () => {
      const { data: parts, error } = await this.client
        .from('parts')
        .select(`
          id,
          name,
          vendors (
            id,
            name,
            vendor_type
          )
        `)
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch parts-vendor relationships: ${error.message}`);
      
      // Check that each part has exactly one vendor
      for (const part of parts) {
        if (!part.vendors || part.vendors.length !== 1) {
          throw new Error(`Part ${part.name} should have exactly 1 vendor`);
        }
      }

      return { part_count: parts.length, all_have_vendors: true };
    });
  }

  async testJobPartsRelationships() {
    return this.runTest('Job-Parts Relationships', async () => {
      const { data: jobParts, error } = await this.client
        .from('job_parts')
        .select(`
          id,
          jobs (
            id,
            job_number
          ),
          parts (
            id,
            name
          )
        `);

      if (error) throw new Error(`Failed to fetch job-parts relationships: ${error.message}`);
      
      // Check that each job part has exactly one job and one part
      for (const jobPart of jobParts) {
        if (!jobPart.jobs || jobPart.jobs.length !== 1) {
          throw new Error(`Job part should have exactly 1 job`);
        }
        if (!jobPart.parts || jobPart.parts.length !== 1) {
          throw new Error(`Job part should have exactly 1 part`);
        }
      }

      return { job_part_count: jobParts.length, all_have_relationships: true };
    });
  }

  async testUserRolePermissions() {
    return this.runTest('User Role Permissions', async () => {
      const { data: users, error } = await this.client
        .from('users')
        .select('user_id, email, role, is_active')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch users: ${error.message}`);
      
      const validRoles = ['owner', 'manager', 'service_advisor', 'estimator', 'technician', 'parts_manager', 'receptionist', 'accountant', 'admin'];
      
      for (const user of users) {
        if (!validRoles.includes(user.role)) {
          throw new Error(`Invalid role for user ${user.email}: ${user.role}`);
        }
        if (!user.is_active) {
          throw new Error(`User ${user.email} is not active`);
        }
      }

      return { user_count: users.length, all_valid_roles: true, all_active: true };
    });
  }

  async testJobWorkflowProgression() {
    return this.runTest('Job Workflow Progression', async () => {
      const { data: jobs, error } = await this.client
        .from('jobs')
        .select('id, job_number, status, priority, estimated_hours, actual_hours')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
      
      const validStatuses = ['estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving', 'body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'calibration', 'detail', 'ready_pickup', 'delivered', 'on_hold', 'cancelled'];
      const validPriorities = ['low', 'normal', 'high', 'urgent', 'rush'];
      
      for (const job of jobs) {
        if (!validStatuses.includes(job.status)) {
          throw new Error(`Invalid status for job ${job.job_number}: ${job.status}`);
        }
        if (!validPriorities.includes(job.priority)) {
          throw new Error(`Invalid priority for job ${job.job_number}: ${job.priority}`);
        }
        if (job.estimated_hours <= 0) {
          throw new Error(`Invalid estimated hours for job ${job.job_number}: ${job.estimated_hours}`);
        }
      }

      return { job_count: jobs.length, all_valid_statuses: true, all_valid_priorities: true };
    });
  }

  async testFinancialCalculations() {
    return this.runTest('Financial Calculations', async () => {
      // Test job total calculations
      const { data: jobs, error } = await this.client
        .from('jobs')
        .select(`
          id,
          job_number,
          job_parts (
            quantity,
            price
          ),
          job_labor (
            amount
          )
        `)
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch job financial data: ${error.message}`);
      
      for (const job of jobs) {
        let totalParts = 0;
        let totalLabor = 0;
        
        if (job.job_parts) {
          totalParts = job.job_parts.reduce((sum, part) => sum + (part.quantity * part.price), 0);
        }
        
        if (job.job_labor) {
          totalLabor = job.job_labor.reduce((sum, labor) => sum + labor.amount, 0);
        }
        
        const total = totalParts + totalLabor;
        
        // For jobs with parts and labor, verify calculations
        if (job.job_parts && job.job_parts.length > 0 && job.job_labor && job.job_labor.length > 0) {
          if (total <= 0) {
            throw new Error(`Invalid total calculation for job ${job.job_number}: ${total}`);
          }
        }
      }

      return { job_count: jobs.length, calculations_valid: true };
    });
  }

  async testDataIntegrity() {
    return this.runTest('Data Integrity', async () => {
      // Test foreign key constraints
      const { data: jobs, error } = await this.client
        .from('jobs')
        .select('customer_id, vehicle_id, assigned_to')
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001');

      if (error) throw new Error(`Failed to fetch jobs for integrity check: ${error.message}`);
      
      for (const job of jobs) {
        // Check customer exists
        const { data: customer } = await this.client
          .from('customers')
          .select('id')
          .eq('id', job.customer_id)
          .single();
        
        if (!customer) {
          throw new Error(`Job references non-existent customer: ${job.customer_id}`);
        }
        
        // Check vehicle exists
        const { data: vehicle } = await this.client
          .from('vehicles')
          .select('id')
          .eq('id', job.vehicle_id)
          .single();
        
        if (!vehicle) {
          throw new Error(`Job references non-existent vehicle: ${job.vehicle_id}`);
        }
        
        // Check assigned user exists (if assigned)
        if (job.assigned_to) {
          const { data: user } = await this.client
            .from('users')
            .select('user_id')
            .eq('user_id', job.assigned_to)
            .single();
          
          if (!user) {
            throw new Error(`Job references non-existent user: ${job.assigned_to}`);
          }
        }
      }

      return { integrity_check_passed: true };
    });
  }

  async testComplexQueries() {
    return this.runTest('Complex Queries', async () => {
      // Test complex join query
      const { data: jobDetails, error } = await this.client
        .from('jobs')
        .select(`
          job_number,
          status,
          priority,
          customers (
            first_name,
            last_name,
            phone
          ),
          vehicles (
            make,
            model,
            year,
            color
          ),
          job_parts (
            quantity,
            parts (
              name,
              part_number
            )
          ),
          job_labor (
            operation,
            hours,
            amount
          )
        `)
        .eq('shop_id', '550e8400-e29b-41d4-a716-446655440001')
        .limit(3);

      if (error) throw new Error(`Failed to execute complex query: ${error.message}`);
      if (!jobDetails || jobDetails.length === 0) {
        throw new Error('No job details returned from complex query');
      }

      return { complex_query_results: jobDetails.length };
    });
  }

  async testPerformanceQueries() {
    return this.runTest('Performance Queries', async () => {
      const startTime = Date.now();
      
      // Test multiple concurrent queries
      const promises = [
        this.client.from('jobs').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001'),
        this.client.from('customers').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001'),
        this.client.from('vehicles').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001'),
        this.client.from('parts').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001'),
        this.client.from('vendors').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001')
      ];

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Check for errors
      for (let i = 0; i < results.length; i++) {
        if (results[i].error) {
          throw new Error(`Query ${i + 1} failed: ${results[i].error.message}`);
        }
      }

      // Performance threshold: all queries should complete within 1 second
      if (duration > 1000) {
        throw new Error(`Performance test failed: queries took ${duration}ms (threshold: 1000ms)`);
      }

      return { query_count: results.length, duration_ms: duration };
    });
  }

  async testRealtimeSubscriptions() {
    return this.runTest('Realtime Subscriptions', async () => {
      // Test that realtime is enabled by checking if we can subscribe
      const channel = this.client.channel('test-channel');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime subscription test timed out'));
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            resolve({ realtime_enabled: true });
          })
          .on('presence', { event: 'join' }, () => {
            clearTimeout(timeout);
            resolve({ realtime_enabled: true });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve({ realtime_enabled: true });
            }
          });
      });
    });
  }

  generateTestReport() {
    this.log('📊 Generating test report...');
    
    const passedTests = this.testResults.filter(r => r.status === 'PASSED');
    const failedTests = this.testResults.filter(r => r.status === 'FAILED');
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.testResults.length,
        passed_tests: passedTests.length,
        failed_tests: failedTests.length,
        success_rate: (passedTests.length / this.testResults.length * 100).toFixed(2) + '%',
        total_duration_ms: totalDuration,
        average_duration_ms: Math.round(totalDuration / this.testResults.length)
      },
      results: this.testResults,
      failed_tests: failedTests.map(t => ({ name: t.name, error: t.error }))
    };

    const reportPath = path.join(__dirname, '..', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('📋 Test report generated:', 'info');
    this.log(`   Total tests: ${report.summary.total_tests}`, 'info');
    this.log(`   Passed: ${report.summary.passed_tests}`, 'info');
    this.log(`   Failed: ${report.summary.failed_tests}`, 'info');
    this.log(`   Success rate: ${report.summary.success_rate}`, 'info');
    this.log(`   Total duration: ${report.summary.total_duration_ms}ms`, 'info');
    this.log(`   Report saved to: ${reportPath}`, 'info');

    if (failedTests.length > 0) {
      this.log('❌ Failed tests:', 'error');
      failedTests.forEach(test => {
        this.log(`   - ${test.name}: ${test.error}`, 'error');
      });
    }
  }
}

// Run the tester if this file is executed directly
if (require.main === module) {
  const tester = new SeededDataTester();
  tester.testAllData()
    .then(() => {
      console.log('\n🎉 All seeded data tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = SeededDataTester;
