#!/usr/bin/env node

/**
 * Phase 1 Test Runner
 * 
 * Runs comprehensive end-to-end tests for the collision repair workflow
 * Tests BMS → RO → Parts → PO workflow validation
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class Phase1TestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  async runTest(testName, testCommand) {
    this.log(`Running test: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = execSync(testCommand, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - startTime;
      this.log(`✅ ${testName} passed (${duration}ms)`);
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        output: result
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${testName} failed (${duration}ms): ${error.message}`, 'error');
      
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout || error.stderr
      });
      
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Phase 1 Workflow Validation Tests...\n');
    
    const tests = [
      {
        name: 'Database Schema Validation',
        command: 'node scripts/verify-schema.js'
      },
      {
        name: 'API Endpoints Health Check',
        command: 'node scripts/test-api-endpoints.js'
      },
      {
        name: 'BMS Parser Validation',
        command: 'node scripts/test-bms-parser.js'
      },
      {
        name: 'Frontend Build Test',
        command: 'npm run build'
      },
      {
        name: 'Backend Server Test',
        command: 'node scripts/test-server-startup.js'
      },
      {
        name: 'Database Connection Test',
        command: 'node scripts/test-database-connection.js'
      },
      {
        name: 'Authentication Flow Test',
        command: 'node scripts/test-auth-flow.js'
      },
      {
        name: 'Parts Workflow Test',
        command: 'node scripts/test-parts-workflow.js'
      },
      {
        name: 'Purchase Order Test',
        command: 'node scripts/test-purchase-orders.js'
      },
      {
        name: 'Search Functionality Test',
        command: 'node scripts/test-search-functionality.js'
      }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      const passed = await this.runTest(test.name, test.command);
      if (passed) passedTests++;
    }

    // Run Playwright E2E tests
    this.log('\n🎭 Running Playwright E2E Tests...');
    try {
      const playwrightResult = execSync('npx playwright test tests/e2e/phase1-workflow-validation.spec.js --reporter=html', {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      this.log('✅ Playwright E2E tests completed');
      this.testResults.push({
        name: 'Playwright E2E Tests',
        status: 'passed',
        duration: 0,
        output: playwrightResult
      });
      passedTests++;
      totalTests++;
    } catch (error) {
      this.log(`❌ Playwright E2E tests failed: ${error.message}`, 'error');
      this.testResults.push({
        name: 'Playwright E2E Tests',
        status: 'failed',
        duration: 0,
        error: error.message,
        output: error.stdout || error.stderr
      });
    }

    return { passedTests, totalTests };
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const successRate = (passedTests / this.testResults.length) * 100;

    const report = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 1: Critical Stabilization',
      summary: {
        totalTests: this.testResults.length,
        passedTests,
        failedTests,
        successRate: Math.round(successRate * 100) / 100,
        totalDuration: Math.round(totalDuration / 1000) + 's'
      },
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'phase1-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Test report saved to: ${reportPath}`);
    
    return report;
  }

  generateRecommendations() {
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    const recommendations = [];

    if (failedTests.length === 0) {
      recommendations.push('🎉 All tests passed! Phase 1 is complete and ready for production.');
      recommendations.push('✅ Database schema is properly deployed');
      recommendations.push('✅ Frontend-backend integration is working');
      recommendations.push('✅ End-to-end workflow is functional');
      recommendations.push('🚀 Ready to proceed to Phase 2: Security Hardening');
    } else {
      recommendations.push('⚠️ Some tests failed. Please review and fix the following issues:');
      
      failedTests.forEach(test => {
        recommendations.push(`❌ ${test.name}: ${test.error}`);
      });
      
      recommendations.push('🔧 Fix the failing tests before proceeding to Phase 2');
    }

    return recommendations;
  }

  async run() {
    try {
      this.log('🚀 Starting Phase 1 Test Suite...\n');
      
      const { passedTests, totalTests } = await this.runAllTests();
      
      const report = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 1 TEST RESULTS SUMMARY');
      console.log('='.repeat(80));
      console.log(`✅ Passed: ${passedTests}/${totalTests}`);
      console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}%`);
      console.log(`⏱️  Total Duration: ${report.summary.totalDuration}`);
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
      console.log('='.repeat(80));
      
      if (passedTests === totalTests) {
        this.log('🎉 Phase 1 Critical Stabilization COMPLETED SUCCESSFULLY!');
        this.log('🚀 Ready to proceed to Phase 2: Security Hardening');
        process.exit(0);
      } else {
        this.log('⚠️ Phase 1 has some issues that need to be resolved');
        this.log('🔧 Please fix the failing tests before proceeding');
        process.exit(1);
      }
    } catch (error) {
      this.log(`❌ Test runner failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new Phase1TestRunner();
  runner.run();
}

module.exports = Phase1TestRunner;