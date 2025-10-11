#!/usr/bin/env node

/**
 * Comprehensive Security Test Suite
 * 
 * Tests all security implementations:
 * - Authentication and authorization
 * - Input validation and sanitization
 * - Data encryption and compliance
 * - Rate limiting and CORS
 * - SQL injection prevention
 * - XSS protection
 */

const axios = require('axios');
const crypto = require('crypto');

class SecurityTestSuite {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3001';
    this.testResults = [];
    this.vulnerabilities = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  async runTest(testName, testFunction) {
    this.log(`Running test: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });
      
      this.log(`✅ ${testName} passed (${duration}ms)`);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      this.log(`❌ ${testName} failed (${duration}ms): ${error.message}`, 'error');
      return false;
    }
  }

  async testAuthenticationBypass() {
    // Test that development bypasses are removed
    const response = await axios.get(`${this.baseURL}/api/repair-orders`, {
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    if (response.status === 401) {
      return { message: 'Authentication properly enforced' };
    } else {
      throw new Error('Authentication bypass still present');
    }
  }

  async testJWTValidation() {
    // Test with invalid JWT
    const response = await axios.get(`${this.baseURL}/api/repair-orders`, {
      headers: { Authorization: 'Bearer invalid-token' },
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      return { message: 'JWT validation working' };
    } else {
      throw new Error('JWT validation not working');
    }
  }

  async testInputValidation() {
    // Test SQL injection attempt
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await axios.post(`${this.baseURL}/api/customers`, {
      firstName: maliciousInput,
      lastName: 'Test',
      email: 'test@example.com'
    }, {
      headers: { Authorization: 'Bearer valid-token' },
      validateStatus: () => true
    });
    
    if (response.status === 400) {
      return { message: 'Input validation blocking SQL injection' };
    } else {
      throw new Error('Input validation not working');
    }
  }

  async testXSSProtection() {
    // Test XSS attempt
    const xssPayload = '<script>alert("xss")</script>';
    const response = await axios.post(`${this.baseURL}/api/customers`, {
      firstName: xssPayload,
      lastName: 'Test',
      email: 'test@example.com'
    }, {
      headers: { Authorization: 'Bearer valid-token' },
      validateStatus: () => true
    });
    
    if (response.status === 400 || !response.data.firstName.includes('<script>')) {
      return { message: 'XSS protection working' };
    } else {
      throw new Error('XSS protection not working');
    }
  }

  async testRateLimiting() {
    // Test rate limiting by making many requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get(`${this.baseURL}/api/repair-orders`, {
          validateStatus: () => true
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      return { message: 'Rate limiting working' };
    } else {
      throw new Error('Rate limiting not working');
    }
  }

  async testCORSConfiguration() {
    // Test CORS with different origin
    const response = await axios.get(`${this.baseURL}/api/repair-orders`, {
      headers: { Origin: 'https://malicious-site.com' },
      validateStatus: () => true
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader && corsHeader !== '*') {
      return { message: 'CORS properly configured' };
    } else {
      throw new Error('CORS not properly configured');
    }
  }

  async testDataEncryption() {
    // Test that sensitive data is encrypted
    const testData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567'
    };
    
    // This would need to be implemented in the actual API
    // For now, we'll test the encryption functions directly
    const { encrypt, decrypt } = require('../server/middleware/dataEncryption');
    
    const encrypted = encrypt(testData.email);
    const decrypted = decrypt(encrypted);
    
    if (encrypted !== testData.email && decrypted === testData.email) {
      return { message: 'Data encryption working' };
    } else {
      throw new Error('Data encryption not working');
    }
  }

  async testShopIsolation() {
    // Test that users can only access their shop's data
    const response = await axios.get(`${this.baseURL}/api/repair-orders`, {
      headers: { 
        Authorization: 'Bearer valid-token',
        'X-Shop-ID': 'different-shop-id'
      },
      validateStatus: () => true
    });
    
    if (response.status === 403) {
      return { message: 'Shop isolation working' };
    } else {
      throw new Error('Shop isolation not working');
    }
  }

  async testFileUploadSecurity() {
    // Test file upload with malicious file
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from('malicious content'), {
      filename: '../../../etc/passwd',
      contentType: 'text/plain'
    });
    
    const response = await axios.post(`${this.baseURL}/api/attachments`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Bearer valid-token'
      },
      validateStatus: () => true
    });
    
    if (response.status === 400) {
      return { message: 'File upload security working' };
    } else {
      throw new Error('File upload security not working');
    }
  }

  async testErrorHandling() {
    // Test that errors don't leak sensitive information
    const response = await axios.get(`${this.baseURL}/api/nonexistent-endpoint`, {
      validateStatus: () => true
    });
    
    if (response.status === 404 && !response.data.includes('stack trace')) {
      return { message: 'Error handling secure' };
    } else {
      throw new Error('Error handling not secure');
    }
  }

  async testSecurityHeaders() {
    // Test security headers
    const response = await axios.get(`${this.baseURL}/api/repair-orders`, {
      validateStatus: () => true
    });
    
    const headers = response.headers;
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length === 0) {
      return { message: 'Security headers present' };
    } else {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  }

  async testGDPRCompliance() {
    // Test GDPR data export
    const response = await axios.get(`${this.baseURL}/api/gdpr/export`, {
      headers: { Authorization: 'Bearer valid-token' },
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.export_timestamp) {
      return { message: 'GDPR compliance working' };
    } else {
      throw new Error('GDPR compliance not working');
    }
  }

  async testAuditLogging() {
    // Test that actions are logged
    const response = await axios.get(`${this.baseURL}/api/audit-logs`, {
      headers: { Authorization: 'Bearer valid-token' },
      validateStatus: () => true
    });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      return { message: 'Audit logging working' };
    } else {
      throw new Error('Audit logging not working');
    }
  }

  async runAllTests() {
    this.log('🔒 Starting Comprehensive Security Test Suite...\n');
    
    const tests = [
      { name: 'Authentication Bypass Removal', test: () => this.testAuthenticationBypass() },
      { name: 'JWT Validation', test: () => this.testJWTValidation() },
      { name: 'Input Validation', test: () => this.testInputValidation() },
      { name: 'XSS Protection', test: () => this.testXSSProtection() },
      { name: 'Rate Limiting', test: () => this.testRateLimiting() },
      { name: 'CORS Configuration', test: () => this.testCORSConfiguration() },
      { name: 'Data Encryption', test: () => this.testDataEncryption() },
      { name: 'Shop Isolation', test: () => this.testShopIsolation() },
      { name: 'File Upload Security', test: () => this.testFileUploadSecurity() },
      { name: 'Error Handling', test: () => this.testErrorHandling() },
      { name: 'Security Headers', test: () => this.testSecurityHeaders() },
      { name: 'GDPR Compliance', test: () => this.testGDPRCompliance() },
      { name: 'Audit Logging', test: () => this.testAuditLogging() }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      const passed = await this.runTest(test.name, test.test);
      if (passed) passedTests++;
    }

    return { passedTests, totalTests };
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const successRate = (passedTests / this.testResults.length) * 100;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passedTests,
        failedTests,
        successRate: Math.round(successRate * 100) / 100,
        totalDuration: Math.round(totalDuration / 1000) + 's'
      },
      testResults: this.testResults,
      vulnerabilities: this.vulnerabilities,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    const recommendations = [];

    if (failedTests.length === 0) {
      recommendations.push('🎉 All security tests passed! System is secure for production.');
      recommendations.push('✅ Authentication and authorization working correctly');
      recommendations.push('✅ Input validation and sanitization working');
      recommendations.push('✅ Data encryption and compliance working');
      recommendations.push('🚀 Ready to proceed to Phase 3: Performance Optimization');
    } else {
      recommendations.push('⚠️ Some security tests failed. Please review and fix the following issues:');
      
      failedTests.forEach(test => {
        recommendations.push(`❌ ${test.name}: ${test.error}`);
      });
      
      recommendations.push('🔧 Fix the failing security tests before proceeding to Phase 3');
    }

    return recommendations;
  }

  async run() {
    try {
      this.log('🔒 Starting Comprehensive Security Test Suite...\n');
      
      const { passedTests, totalTests } = await this.runAllTests();
      
      const report = this.generateReport();
      
      // Save report to file
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, '..', 'security-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n' + '='.repeat(80));
      console.log('🔒 SECURITY TEST RESULTS');
      console.log('='.repeat(80));
      console.log(`✅ Passed: ${passedTests}/${totalTests}`);
      console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}%`);
      console.log(`⏱️  Total Duration: ${report.summary.totalDuration}`);
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
      console.log('='.repeat(80));
      
      if (passedTests === totalTests) {
        this.log('🎉 Phase 2 Security Hardening COMPLETED SUCCESSFULLY!');
        this.log('🚀 Ready to proceed to Phase 3: Performance Optimization');
        process.exit(0);
      } else {
        this.log('⚠️ Phase 2 has some security issues that need to be resolved');
        this.log('🔧 Please fix the failing security tests before proceeding');
        process.exit(1);
      }
    } catch (error) {
      this.log(`❌ Security test suite failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const testSuite = new SecurityTestSuite();
  testSuite.run();
}

module.exports = SecurityTestSuite;
