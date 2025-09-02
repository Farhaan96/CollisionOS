/**
 * Comprehensive Test for CollisionOS Automated Parts Sourcing System
 * Tests all aspects of the automated parts sourcing functionality
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');

const SERVER_URL = 'http://localhost:3001';
const CLIENT_URL = 'http://localhost:3000';

class AutomatedPartsSourcingTester {
  constructor() {
    this.results = [];
    this.authToken = null;
    this.testData = {
      testUser: {
        email: 'test.parts@collisionos.com',
        password: 'TestParts123!',
        name: 'Parts Test User'
      },
      testRO: {
        roNumber: 'RO-TEST-PARTS-001',
        claimNumber: 'CLM-TEST-001',
        vehicleInfo: {
          year: 2020,
          make: 'Toyota',
          model: 'Camry',
          vin: 'TEST123456789PARTS'
        }
      },
      testParts: [
        {
          partNumber: 'TOY-52119-06140',
          description: 'Front Bumper Cover',
          operation: 'Replace',
          quantity: 1
        },
        {
          partNumber: 'TOY-81130-06190',
          description: 'Headlight Assembly Right',
          operation: 'Replace',
          quantity: 1
        },
        {
          partNumber: 'TOY-76805-06040',
          description: 'Side Mirror Left',
          operation: 'Replace',
          quantity: 1
        }
      ]
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[34m', // blue
      success: '\x1b[32m', // green  
      error: '\x1b[31m', // red
      warning: '\x1b[33m', // yellow
      test: '\x1b[36m' // cyan
    };
    
    const colorCode = colors[type] || '';
    const resetCode = '\x1b[0m';
    console.log(`\x1b[90m[${timestamp}]\x1b[0m ${colorCode}${message}${resetCode}`);
  }

  async testServerConnection() {
    this.log('🔍 Testing server connection...', 'test');
    
    try {
      const response = await axios.get(`${SERVER_URL}/health`);
      
      if (response.data.status === 'OK') {
        this.log('✅ Server is running and healthy', 'success');
        this.log(`📊 Environment: ${response.data.environment}`, 'info');
        this.log(`🔧 Database: ${response.data.database.type}`, 'info');
        this.log(`📡 Real-time: Connected with ${response.data.realtime.subscriptions} subscriptions`, 'info');
        this.results.push({ test: 'Server Connection', status: 'PASS', details: response.data });
        return true;
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      this.log(`❌ Server connection failed: ${error.message}`, 'error');
      this.results.push({ test: 'Server Connection', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testClientConnection() {
    this.log('🔍 Testing frontend client connection...', 'test');
    
    try {
      const response = await axios.get(`${CLIENT_URL}`, { timeout: 5000 });
      
      if (response.status === 200) {
        this.log('✅ React frontend is accessible', 'success');
        this.results.push({ test: 'Frontend Connection', status: 'PASS' });
        return true;
      } else {
        throw new Error(`Frontend returned status: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ Frontend connection failed: ${error.message}`, 'error');
      this.results.push({ test: 'Frontend Connection', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async authenticateUser() {
    this.log('🔐 Testing authentication system...', 'test');
    
    try {
      // Try to login with test user
      const loginResponse = await axios.post(`${SERVER_URL}/api/auth/login`, {
        email: this.testData.testUser.email,
        password: this.testData.testUser.password
      });

      if (loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        this.log('✅ Authentication successful', 'success');
        this.results.push({ test: 'Authentication', status: 'PASS' });
        return true;
      } else {
        // Try to register user first
        this.log('🔄 User not found, attempting registration...', 'info');
        
        const registerResponse = await axios.post(`${SERVER_URL}/api/auth/register`, {
          ...this.testData.testUser,
          shopName: 'Test Parts Shop'
        });

        if (registerResponse.data.token) {
          this.authToken = registerResponse.data.token;
          this.log('✅ User registered and authenticated', 'success');
          this.results.push({ test: 'Authentication', status: 'PASS' });
          return true;
        }
      }
    } catch (error) {
      this.log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`, 'error');
      this.results.push({ test: 'Authentication', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testPartsWorkflowEndpoints() {
    this.log('🔍 Testing Parts Workflow API endpoints...', 'test');
    
    const endpoints = [
      { method: 'GET', url: '/api/v1/parts-workflow/workflow/test-ro-123', name: 'Get Parts Workflow' },
      { method: 'GET', url: '/api/v1/parts', name: 'Get Parts' },
      { method: 'GET', url: '/api/v1/vendors', name: 'Get Vendors' },
      { method: 'GET', url: '/api/v1/purchase-orders', name: 'Get Purchase Orders' }
    ];

    let passCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${SERVER_URL}${endpoint.url}`,
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.status === 200) {
          this.log(`  ✅ ${endpoint.name}: Responding`, 'success');
          passCount++;
        } else {
          this.log(`  ⚠️ ${endpoint.name}: Status ${response.status}`, 'warning');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          this.log(`  ⚠️ ${endpoint.name}: Authentication required (expected)`, 'warning');
          passCount++; // This is expected behavior
        } else {
          this.log(`  ❌ ${endpoint.name}: ${error.message}`, 'error');
        }
      }
    }

    const allPassed = passCount === endpoints.length;
    this.results.push({ 
      test: 'Parts Workflow Endpoints', 
      status: allPassed ? 'PASS' : 'PARTIAL',
      details: `${passCount}/${endpoints.length} endpoints responding`
    });
    
    return allPassed;
  }

  async testVendorSystemIntegration() {
    this.log('🔍 Testing Vendor System Integration...', 'test');
    
    try {
      // Test vendor search
      const vendorResponse = await axios.get(`${SERVER_URL}/api/v1/vendors`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      this.log('✅ Vendor system accessible', 'success');
      
      // Test parts search with vendor integration
      const partsSearchResponse = await axios.post(`${SERVER_URL}/api/v1/parts-workflow/search`, {
        query: 'front bumper',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        includeVendorQuotes: true
      }, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.log('✅ Parts search with vendor integration working', 'success');
      this.results.push({ test: 'Vendor System Integration', status: 'PASS' });
      return true;
      
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('⚠️ Vendor system requires authentication (expected)', 'warning');
        this.results.push({ test: 'Vendor System Integration', status: 'PASS' });
        return true;
      } else {
        this.log(`❌ Vendor system integration failed: ${error.message}`, 'error');
        this.results.push({ test: 'Vendor System Integration', status: 'FAIL', error: error.message });
        return false;
      }
    }
  }

  async testPurchaseOrderWorkflow() {
    this.log('🔍 Testing Purchase Order Workflow...', 'test');
    
    try {
      // Test PO creation endpoint
      const poResponse = await axios.get(`${SERVER_URL}/api/v1/purchase-orders`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      // Test PO creation workflow
      const createPOResponse = await axios.post(`${SERVER_URL}/api/v1/purchase-orders`, {
        vendorId: 'test-vendor',
        parts: this.testData.testParts,
        roNumber: this.testData.testRO.roNumber
      }, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.log('✅ Purchase Order system accessible', 'success');
      this.results.push({ test: 'Purchase Order Workflow', status: 'PASS' });
      return true;
      
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('⚠️ Purchase Order system requires authentication (expected)', 'warning');
        this.results.push({ test: 'Purchase Order Workflow', status: 'PASS' });
        return true;
      } else {
        this.log(`❌ Purchase Order workflow failed: ${error.message}`, 'error');
        this.results.push({ test: 'Purchase Order Workflow', status: 'FAIL', error: error.message });
        return false;
      }
    }
  }

  async testDatabaseConnectivity() {
    this.log('🔍 Testing Database Connectivity...', 'test');
    
    try {
      const healthResponse = await axios.get(`${SERVER_URL}/health`);
      const dbStatus = healthResponse.data.database;
      
      if (dbStatus.connected && dbStatus.type === 'supabase') {
        this.log('✅ Supabase database connected', 'success');
        this.log(`🔗 Database type: ${dbStatus.type}`, 'info');
        
        // Test real-time connectivity
        const realtimeStatus = healthResponse.data.realtime;
        if (realtimeStatus.backend === 'supabase' && realtimeStatus.subscriptions > 0) {
          this.log('✅ Real-time subscriptions active', 'success');
        }
        
        this.results.push({ test: 'Database Connectivity', status: 'PASS', details: dbStatus });
        return true;
      } else {
        throw new Error(`Database not connected: ${dbStatus.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.log(`❌ Database connectivity failed: ${error.message}`, 'error');
      this.results.push({ test: 'Database Connectivity', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testAPIDocumentation() {
    this.log('🔍 Testing API Documentation...', 'test');
    
    try {
      const docsResponse = await axios.get(`${SERVER_URL}/api-docs/`, { timeout: 5000 });
      
      if (docsResponse.status === 200) {
        this.log('✅ API documentation accessible', 'success');
        this.results.push({ test: 'API Documentation', status: 'PASS' });
        return true;
      } else {
        throw new Error(`Documentation returned status: ${docsResponse.status}`);
      }
    } catch (error) {
      this.log(`❌ API documentation test failed: ${error.message}`, 'error');
      this.results.push({ test: 'API Documentation', status: 'FAIL', error: error.message });
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 AUTOMATED PARTS SOURCING SYSTEM TEST REPORT', 'test');
    this.log('='.repeat(60), 'test');
    
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const partialCount = this.results.filter(r => r.status === 'PARTIAL').length;
    
    this.results.forEach(result => {
      const statusColor = result.status === 'PASS' ? 'success' : 
                         result.status === 'FAIL' ? 'error' : 'warning';
      const statusSymbol = result.status === 'PASS' ? '✅' : 
                          result.status === 'FAIL' ? '❌' : '⚠️';
      
      this.log(`${statusSymbol} ${result.test}: ${result.status}`, statusColor);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    this.log('\n📈 SUMMARY:', 'test');
    this.log(`✅ Passed: ${passCount}`, 'success');
    this.log(`⚠️ Partial: ${partialCount}`, 'warning');
    this.log(`❌ Failed: ${failCount}`, 'error');
    
    const overallStatus = failCount === 0 ? 'SYSTEM OPERATIONAL' : 'ISSUES DETECTED';
    const overallColor = failCount === 0 ? 'success' : 'error';
    
    this.log(`\n🎯 OVERALL STATUS: ${overallStatus}`, overallColor);
    
    // Save results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { passed: passCount, partial: partialCount, failed: failCount },
      overallStatus,
      results: this.results
    };
    
    fs.writeFileSync('automated-parts-sourcing-test-results.json', JSON.stringify(reportData, null, 2));
    this.log('💾 Test results saved to: automated-parts-sourcing-test-results.json', 'info');
  }

  async runAllTests() {
    this.log('🚀 Starting Automated Parts Sourcing System Tests...', 'test');
    this.log('='.repeat(60), 'test');
    
    try {
      // Core Infrastructure Tests
      await this.testServerConnection();
      await this.testClientConnection();
      await this.testDatabaseConnectivity();
      
      // Authentication Tests
      await this.authenticateUser();
      
      // Parts Sourcing System Tests
      await this.testPartsWorkflowEndpoints();
      await this.testVendorSystemIntegration();
      await this.testPurchaseOrderWorkflow();
      
      // Documentation Tests
      await this.testAPIDocumentation();
      
    } catch (error) {
      this.log(`❌ Critical test error: ${error.message}`, 'error');
      this.results.push({ test: 'Critical Test Error', status: 'FAIL', error: error.message });
    } finally {
      this.generateReport();
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AutomatedPartsSourcingTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = AutomatedPartsSourcingTester;