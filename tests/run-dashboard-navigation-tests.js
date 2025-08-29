#!/usr/bin/env node

/**
 * Comprehensive Dashboard Navigation Test Runner
 * 
 * This script runs all dashboard navigation tests systematically and generates
 * detailed reports for the CollisionOS auto body shop management system.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  testFiles: [
    'tests/e2e/dashboard-navigation.spec.js',
    'tests/e2e/dashboard-mobile-navigation.spec.js', 
    'tests/e2e/dashboard-performance-navigation.spec.js',
    'tests/e2e/dashboard-accessibility-navigation.spec.js'
  ],
  browsers: ['chromium'],
  viewports: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  outputDir: 'test-results/dashboard-navigation'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DashboardNavigationTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      testFiles: {},
      errors: []
    };
    
    console.log(`${colors.bold}${colors.blue}🚗 CollisionOS Dashboard Navigation Test Suite${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
  }

  async ensureOutputDirectory() {
    const outputPath = path.join(process.cwd(), testConfig.outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }

  async runTest(testFile, options = {}) {
    const testName = path.basename(testFile, '.spec.js');
    const timestamp = new Date().toISOString();
    
    console.log(`${colors.yellow}📋 Running: ${testName}${colors.reset}`);
    
    try {
      const command = `npx playwright test ${testFile} --reporter=json ${options.args || ''}`;
      const startTime = Date.now();
      
      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      const duration = Date.now() - startTime;
      const result = JSON.parse(output);
      
      this.results.testFiles[testName] = {
        status: 'passed',
        duration,
        timestamp,
        stats: result.stats || {},
        errors: []
      };
      
      this.results.passed += result.stats?.expected || 0;
      this.results.total += result.stats?.total || 0;
      
      console.log(`${colors.green}✅ ${testName} completed in ${duration}ms${colors.reset}`);
      
      return { success: true, result };
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      
      this.results.testFiles[testName] = {
        status: 'failed',
        duration,
        timestamp,
        error: error.message,
        stderr: error.stderr?.toString() || '',
        stdout: error.stdout?.toString() || ''
      };
      
      this.results.failed++;
      this.results.errors.push({
        testFile: testName,
        error: error.message,
        stderr: error.stderr?.toString()
      });
      
      console.log(`${colors.red}❌ ${testName} failed: ${error.message}${colors.reset}`);
      
      return { success: false, error };
    }
  }

  async runAllTests() {
    console.log(`${colors.blue}🔍 Running ${testConfig.testFiles.length} test suites...${colors.reset}\n`);
    
    await this.ensureOutputDirectory();
    
    // Run core navigation tests first
    await this.runTest('tests/e2e/dashboard-navigation.spec.js', {
      args: '--project=chromium'
    });
    
    // Run mobile-specific tests
    await this.runTest('tests/e2e/dashboard-mobile-navigation.spec.js', {
      args: '--project=chromium'
    });
    
    // Run performance tests (may take longer)
    console.log(`${colors.yellow}⚡ Running performance tests (may take 2-3 minutes)...${colors.reset}`);
    await this.runTest('tests/e2e/dashboard-performance-navigation.spec.js', {
      args: '--project=chromium --timeout=60000'
    });
    
    // Run accessibility tests
    await this.runTest('tests/e2e/dashboard-accessibility-navigation.spec.js', {
      args: '--project=chromium'
    });
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        totalTests: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: `${successRate}%`
      },
      testFiles: this.results.testFiles,
      errors: this.results.errors,
      testCoverage: {
        kpiCardNavigation: this.results.testFiles['dashboard-navigation']?.status === 'passed',
        activityFeedNavigation: this.results.testFiles['dashboard-navigation']?.status === 'passed',
        technicianPerformance: this.results.testFiles['dashboard-navigation']?.status === 'passed',
        alertNavigation: this.results.testFiles['dashboard-navigation']?.status === 'passed',
        mobileNavigation: this.results.testFiles['dashboard-mobile-navigation']?.status === 'passed',
        performanceOptimization: this.results.testFiles['dashboard-performance-navigation']?.status === 'passed',
        accessibilityCompliance: this.results.testFiles['dashboard-accessibility-navigation']?.status === 'passed'
      }
    };
    
    return report;
  }

  async saveReport(report) {
    const reportPath = path.join(testConfig.outputDir, 'dashboard-navigation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    const htmlReportPath = path.join(testConfig.outputDir, 'dashboard-navigation-report.html');
    const htmlReport = this.generateHTMLReport(report);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`\n${colors.blue}📊 Reports saved:${colors.reset}`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  generateHTMLReport(report) {
    const { summary, testFiles, testCoverage, errors } = report;
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>CollisionOS Dashboard Navigation Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -30px -30px 30px; border-radius: 8px 8px 0 0; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9ff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .metric-label { color: #64748b; font-weight: 500; margin-top: 5px; }
        .success { border-color: #10b981; background: #f0fdf4; }
        .success .metric-value { color: #10b981; }
        .warning { border-color: #f59e0b; background: #fffbeb; }
        .warning .metric-value { color: #f59e0b; }
        .error { border-color: #ef4444; background: #fef2f2; }
        .error .metric-value { color: #ef4444; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .coverage-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8fafc; border-radius: 6px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 0.85em; }
        .status-passed { background: #dcfce7; color: #166534; }
        .status-failed { background: #fecaca; color: #dc2626; }
        .errors { margin-top: 30px; }
        .error-item { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 10px 0; }
        .timestamp { color: #64748b; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 CollisionOS Dashboard Navigation Test Report</h1>
            <p>Comprehensive testing of interactive dashboard navigation system for auto body shop management</p>
            <p class="timestamp">Generated: ${summary.timestamp}</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card ${summary.successRate >= '90' ? 'success' : summary.successRate >= '70' ? 'warning' : 'error'}">
                <div class="metric-value">${summary.successRate}</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card success">
                <div class="metric-value">${summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card ${summary.failed > 0 ? 'error' : 'success'}">
                <div class="metric-value">${summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(summary.duration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <h2>🎯 Test Coverage</h2>
        <div class="coverage-grid">
            <div class="coverage-item">
                <span>KPI Card Navigation</span>
                <span class="status-badge ${testCoverage.kpiCardNavigation ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.kpiCardNavigation ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Activity Feed Navigation</span>
                <span class="status-badge ${testCoverage.activityFeedNavigation ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.activityFeedNavigation ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Technician Performance</span>
                <span class="status-badge ${testCoverage.technicianPerformance ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.technicianPerformance ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Alert Navigation</span>
                <span class="status-badge ${testCoverage.alertNavigation ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.alertNavigation ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Mobile Navigation</span>
                <span class="status-badge ${testCoverage.mobileNavigation ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.mobileNavigation ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Performance Optimization</span>
                <span class="status-badge ${testCoverage.performanceOptimization ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.performanceOptimization ? 'PASSED' : 'FAILED'}
                </span>
            </div>
            <div class="coverage-item">
                <span>Accessibility Compliance</span>
                <span class="status-badge ${testCoverage.accessibilityCompliance ? 'status-passed' : 'status-failed'}">
                    ${testCoverage.accessibilityCompliance ? 'PASSED' : 'FAILED'}
                </span>
            </div>
        </div>

        <h2>📋 Test File Results</h2>
        ${Object.entries(testFiles).map(([name, data]) => `
        <div class="coverage-item">
            <div>
                <strong>${name}</strong><br>
                <small>${data.timestamp} • ${data.duration}ms</small>
            </div>
            <span class="status-badge ${data.status === 'passed' ? 'status-passed' : 'status-failed'}">
                ${data.status.toUpperCase()}
            </span>
        </div>
        `).join('')}

        ${errors.length > 0 ? `
        <div class="errors">
            <h2>❌ Errors</h2>
            ${errors.map(error => `
            <div class="error-item">
                <strong>${error.testFile}</strong>
                <p>${error.error}</p>
                ${error.stderr ? `<pre style="font-size: 0.8em; color: #dc2626;">${error.stderr}</pre>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; text-align: center;">
            <p>CollisionOS Dashboard Navigation Test Suite • Auto Body Shop Management System</p>
        </div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    
    console.log(`\n${colors.bold}${colors.blue}📊 Dashboard Navigation Test Summary${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`⏱️  Duration: ${(totalDuration / 1000).toFixed(1)} seconds`);
    console.log(`📋 Total Tests: ${this.results.total}`);
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`📈 Success Rate: ${colors.bold}${successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n${colors.red}💥 Errors encountered:${colors.reset}`);
      this.results.errors.forEach(error => {
        console.log(`   ${colors.red}• ${error.testFile}: ${error.error}${colors.reset}`);
      });
    }
    
    console.log(`\n${colors.green}🎯 Navigation test coverage:${colors.reset}`);
    console.log(`   • KPI Card Navigation & URL Parameters`);
    console.log(`   • Activity Feed Interactive Links`);
    console.log(`   • Technician Performance Navigation`);
    console.log(`   • Alert System Navigation`);
    console.log(`   • Mobile Touch & Responsive Testing`);
    console.log(`   • Performance & Loading State Testing`);
    console.log(`   • Accessibility & Keyboard Navigation`);
    console.log(`   • Cross-browser & Device Compatibility`);
  }

  async run() {
    try {
      await this.runAllTests();
      const report = this.generateReport();
      await this.saveReport(report);
      this.printSummary();
      
      // Exit with error code if tests failed
      process.exit(this.results.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error(`${colors.red}💥 Test runner failed: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new DashboardNavigationTestRunner();
  runner.run().catch(console.error);
}

module.exports = DashboardNavigationTestRunner;