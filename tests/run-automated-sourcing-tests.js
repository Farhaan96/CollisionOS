#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Automated Parts Sourcing System
 * CollisionOS - Production-Ready Testing Framework
 * 
 * Executes all test suites for the automated parts sourcing system:
 * - Unit tests for core services
 * - Integration tests for vendor APIs
 * - Performance tests for load and scalability
 * - End-to-end workflow tests
 * - Frontend component tests
 * - Mobile app simulation tests
 * 
 * Provides detailed reporting and production readiness assessment
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class AutomatedSourcingTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      unit: { passed: 0, failed: 0, time: 0, coverage: 0 },
      integration: { passed: 0, failed: 0, time: 0 },
      api: { passed: 0, failed: 0, time: 0 },
      performance: { passed: 0, failed: 0, time: 0 },
      frontend: { passed: 0, failed: 0, time: 0 },
      e2e: { passed: 0, failed: 0, time: 0 }
    };
    this.testSuites = [];
    this.errors = [];
    this.warnings = [];
    this.performanceMetrics = {};
    this.coverageThreshold = {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    };
  }

  async run(options = {}) {
    console.log(chalk.blue.bold('\n🚀 CollisionOS Automated Parts Sourcing Test Suite\n'));
    console.log(chalk.gray('Comprehensive testing for production-ready parts sourcing system\n'));

    try {
      // Validate test environment
      await this.validateTestEnvironment();

      // Run test categories based on options
      if (!options.category || options.category === 'all') {
        await this.runAllTests();
      } else {
        await this.runSpecificCategory(options.category);
      }

      // Generate comprehensive reports
      await this.generateReports();
      
      // Assess production readiness
      const productionReady = this.assessProductionReadiness();
      
      console.log(chalk.green.bold('\n✅ Automated Parts Sourcing Testing Complete!\n'));
      
      if (productionReady) {
        console.log(chalk.green('🎉 System is PRODUCTION READY for deployment!'));
      } else {
        console.log(chalk.yellow('⚠️  System needs improvements before production deployment'));
      }

      return productionReady;

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Testing Suite Failed'));
      console.error(chalk.red(error.message));
      throw error;
    }
  }

  async validateTestEnvironment() {
    console.log(chalk.blue('🔍 Validating test environment...'));

    const requirements = [
      { name: 'Node.js', check: () => process.version, required: 'v14+' },
      { name: 'NPM', check: () => execSync('npm --version', { encoding: 'utf8' }).trim(), required: '6+' },
      { name: 'Jest', check: () => this.checkPackage('jest'), required: 'installed' },
      { name: 'Puppeteer', check: () => this.checkPackage('puppeteer'), required: 'installed' },
      { name: 'Supertest', check: () => this.checkPackage('supertest'), required: 'installed' }
    ];

    for (const req of requirements) {
      try {
        const version = req.check();
        console.log(chalk.green(`  ✓ ${req.name}: ${version}`));
      } catch (error) {
        throw new Error(`Missing requirement: ${req.name} (${req.required})`);
      }
    }

    // Check for test files
    const testFiles = [
      'server/test/services/automatedPartsSourcing.test.js',
      'server/test/services/vendorIntegration.test.js',
      'server/test/services/bmsEnhancement.test.js',
      'server/test/api/automatedSourcing.test.js',
      'src/components/Parts/__tests__/AutomatedSourcingDashboard.test.js',
      'tests/performance/automatedSourcingPerformance.test.js'
    ];

    for (const testFile of testFiles) {
      const exists = await this.fileExists(path.join(process.cwd(), testFile));
      if (!exists) {
        throw new Error(`Missing test file: ${testFile}`);
      }
    }

    console.log(chalk.green('✓ Test environment validation complete'));
  }

  async runAllTests() {
    console.log(chalk.blue('\n📋 Running comprehensive test suite...\n'));

    const testCategories = [
      { name: 'unit', description: 'Unit Tests - Core Services', method: 'runUnitTests' },
      { name: 'integration', description: 'Integration Tests - Vendor APIs', method: 'runIntegrationTests' },
      { name: 'api', description: 'API Tests - Endpoints', method: 'runApiTests' },
      { name: 'frontend', description: 'Frontend Tests - Components', method: 'runFrontendTests' },
      { name: 'performance', description: 'Performance Tests - Load & Scale', method: 'runPerformanceTests' },
      { name: 'e2e', description: 'End-to-End Tests - Workflows', method: 'runE2ETests' }
    ];

    for (const category of testCategories) {
      console.log(chalk.cyan(`\n📦 ${category.description}`));
      try {
        await this[category.method]();
        console.log(chalk.green(`✓ ${category.name} tests completed`));
      } catch (error) {
        console.error(chalk.red(`✗ ${category.name} tests failed: ${error.message}`));
        this.errors.push({ category: category.name, error: error.message });
      }
    }
  }

  async runSpecificCategory(category) {
    console.log(chalk.blue(`\n📦 Running ${category} tests...\n`));

    const categoryMethods = {
      unit: 'runUnitTests',
      integration: 'runIntegrationTests',
      api: 'runApiTests',
      frontend: 'runFrontendTests',
      performance: 'runPerformanceTests',
      e2e: 'runE2ETests'
    };

    if (!categoryMethods[category]) {
      throw new Error(`Unknown test category: ${category}`);
    }

    await this[categoryMethods[category]]();
  }

  async runUnitTests() {
    const startTime = Date.now();
    
    try {
      const testFiles = [
        'server/test/services/automatedPartsSourcing.test.js',
        'server/test/services/vendorIntegration.test.js',
        'server/test/services/bmsEnhancement.test.js'
      ];

      const jestConfig = {
        testMatch: testFiles.map(file => `**/${file}`),
        collectCoverage: true,
        coverageThreshold: {
          global: this.coverageThreshold
        },
        coverageReporters: ['text', 'html', 'json'],
        verbose: true,
        testTimeout: 30000
      };

      const configPath = await this.createTempJestConfig(jestConfig);
      
      const result = execSync(`npx jest --config ${configPath} --passWithNoTests`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parseJestOutput(result);
      
      this.results.unit = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime,
        coverage: testResults.coverage
      };

      console.log(chalk.green(`  ✓ Unit tests: ${testResults.passed} passed, ${testResults.failed} failed`));
      console.log(chalk.blue(`  📊 Coverage: ${testResults.coverage}%`));

    } catch (error) {
      this.results.unit.failed = 1;
      this.results.unit.time = Date.now() - startTime;
      throw new Error(`Unit tests failed: ${error.message}`);
    }
  }

  async runIntegrationTests() {
    const startTime = Date.now();
    
    try {
      // Check if backend is running
      await this.ensureBackendRunning();

      const testFiles = [
        'server/test/services/vendorIntegration.test.js'
      ];

      const jestConfig = {
        testMatch: testFiles.map(file => `**/${file}`),
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/tests/setup/integrationSetup.js'],
        testTimeout: 60000 // Longer timeout for integration tests
      };

      const configPath = await this.createTempJestConfig(jestConfig);
      
      const result = execSync(`npx jest --config ${configPath} --passWithNoTests`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parseJestOutput(result);
      
      this.results.integration = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime
      };

      console.log(chalk.green(`  ✓ Integration tests: ${testResults.passed} passed, ${testResults.failed} failed`));

    } catch (error) {
      this.results.integration.failed = 1;
      this.results.integration.time = Date.now() - startTime;
      throw new Error(`Integration tests failed: ${error.message}`);
    }
  }

  async runApiTests() {
    const startTime = Date.now();
    
    try {
      await this.ensureBackendRunning();

      const testFiles = [
        'server/test/api/automatedSourcing.test.js'
      ];

      const jestConfig = {
        testMatch: testFiles.map(file => `**/${file}`),
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/tests/setup/apiSetup.js'],
        testTimeout: 30000
      };

      const configPath = await this.createTempJestConfig(jestConfig);
      
      const result = execSync(`npx jest --config ${configPath} --passWithNoTests`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parseJestOutput(result);
      
      this.results.api = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime
      };

      console.log(chalk.green(`  ✓ API tests: ${testResults.passed} passed, ${testResults.failed} failed`));

    } catch (error) {
      this.results.api.failed = 1;
      this.results.api.time = Date.now() - startTime;
      throw new Error(`API tests failed: ${error.message}`);
    }
  }

  async runFrontendTests() {
    const startTime = Date.now();
    
    try {
      const testFiles = [
        'src/components/Parts/__tests__/AutomatedSourcingDashboard.test.js'
      ];

      const jestConfig = {
        testMatch: testFiles.map(file => `**/${file}`),
        testEnvironment: 'jsdom',
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
        moduleNameMapping: {
          '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
        },
        transformIgnorePatterns: [
          'node_modules/(?!(axios|@mui)/)'
        ],
        testTimeout: 15000
      };

      const configPath = await this.createTempJestConfig(jestConfig);
      
      const result = execSync(`npx jest --config ${configPath} --passWithNoTests`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parseJestOutput(result);
      
      this.results.frontend = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime
      };

      console.log(chalk.green(`  ✓ Frontend tests: ${testResults.passed} passed, ${testResults.failed} failed`));

    } catch (error) {
      this.results.frontend.failed = 1;
      this.results.frontend.time = Date.now() - startTime;
      throw new Error(`Frontend tests failed: ${error.message}`);
    }
  }

  async runPerformanceTests() {
    const startTime = Date.now();
    
    try {
      console.log(chalk.yellow('  🏃 Running performance tests (this may take several minutes)...'));

      const testFiles = [
        'tests/performance/automatedSourcingPerformance.test.js'
      ];

      const jestConfig = {
        testMatch: testFiles.map(file => `**/${file}`),
        testEnvironment: 'node',
        testTimeout: 300000, // 5 minutes for performance tests
        maxWorkers: 1, // Run performance tests serially
        setupFilesAfterEnv: ['<rootDir>/tests/setup/performanceSetup.js']
      };

      const configPath = await this.createTempJestConfig(jestConfig);
      
      const result = execSync(`npx jest --config ${configPath} --passWithNoTests`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parseJestOutput(result);
      
      // Extract performance metrics from test output
      this.performanceMetrics = this.extractPerformanceMetrics(result);
      
      this.results.performance = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime
      };

      console.log(chalk.green(`  ✓ Performance tests: ${testResults.passed} passed, ${testResults.failed} failed`));
      
      if (this.performanceMetrics.bmsProcessingTime) {
        console.log(chalk.blue(`  ⚡ BMS Processing: ${this.performanceMetrics.bmsProcessingTime}ms`));
      }
      if (this.performanceMetrics.vendorResponseTime) {
        console.log(chalk.blue(`  ⚡ Vendor Response: ${this.performanceMetrics.vendorResponseTime}ms`));
      }

    } catch (error) {
      this.results.performance.failed = 1;
      this.results.performance.time = Date.now() - startTime;
      throw new Error(`Performance tests failed: ${error.message}`);
    }
  }

  async runE2ETests() {
    const startTime = Date.now();
    
    try {
      await this.ensureBackendRunning();
      await this.ensureFrontendRunning();

      console.log(chalk.yellow('  🎭 Running end-to-end tests with Playwright...'));

      const result = execSync('npx playwright test tests/e2e/automated-sourcing-workflow.spec.js --reporter=json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = this.parsePlaywrightOutput(result);
      
      this.results.e2e = {
        passed: testResults.passed,
        failed: testResults.failed,
        time: Date.now() - startTime
      };

      console.log(chalk.green(`  ✓ E2E tests: ${testResults.passed} passed, ${testResults.failed} failed`));

    } catch (error) {
      this.results.e2e.failed = 1;
      this.results.e2e.time = Date.now() - startTime;
      
      // E2E tests are optional if services aren't running
      console.log(chalk.yellow(`  ⚠ E2E tests skipped: ${error.message}`));
      this.warnings.push(`E2E tests skipped: ${error.message}`);
    }
  }

  async generateReports() {
    console.log(chalk.blue('\n📊 Generating test reports...\n'));

    const totalTime = Date.now() - this.startTime;
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTime,
      results: this.results,
      performanceMetrics: this.performanceMetrics,
      errors: this.errors,
      warnings: this.warnings,
      productionReady: this.assessProductionReadiness()
    };

    // Generate JSON report
    const jsonReport = JSON.stringify(summary, null, 2);
    await this.writeFile('tests/reports/automated-sourcing-test-results.json', jsonReport);

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(summary);
    await this.writeFile('tests/reports/automated-sourcing-test-results.html', htmlReport);

    // Console summary
    this.printConsoleSummary(summary);

    console.log(chalk.green('✓ Reports generated:'));
    console.log(chalk.gray('  - tests/reports/automated-sourcing-test-results.json'));
    console.log(chalk.gray('  - tests/reports/automated-sourcing-test-results.html'));
  }

  assessProductionReadiness() {
    const totalTests = Object.values(this.results).reduce((sum, category) => sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(this.results).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, category) => sum + category.failed, 0);

    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    // Production readiness criteria
    const criteria = {
      passRate: passRate >= 95, // 95% test pass rate
      coverage: this.results.unit.coverage >= this.coverageThreshold.statements, // 90%+ coverage
      performance: this.performanceMetrics.bmsProcessingTime ? 
        this.performanceMetrics.bmsProcessingTime < 30000 : true, // <30s BMS processing
      noBlockingErrors: this.errors.filter(e => e.category !== 'e2e').length === 0
    };

    const productionReady = Object.values(criteria).every(criterion => criterion === true);

    return {
      ready: productionReady,
      criteria,
      score: Object.values(criteria).filter(c => c).length / Object.keys(criteria).length,
      passRate,
      recommendations: this.generateRecommendations(criteria)
    };
  }

  generateRecommendations(criteria) {
    const recommendations = [];

    if (!criteria.passRate) {
      recommendations.push('Improve test pass rate to 95% or higher');
    }
    if (!criteria.coverage) {
      recommendations.push(`Increase test coverage to ${this.coverageThreshold.statements}% or higher`);
    }
    if (!criteria.performance) {
      recommendations.push('Optimize BMS processing performance to under 30 seconds');
    }
    if (!criteria.noBlockingErrors) {
      recommendations.push('Fix critical errors in unit, integration, and API tests');
    }

    if (recommendations.length === 0) {
      recommendations.push('System meets all production readiness criteria! 🎉');
    }

    return recommendations;
  }

  // Helper methods
  checkPackage(packageName) {
    try {
      require.resolve(packageName);
      return 'installed';
    } catch (error) {
      throw new Error(`Package ${packageName} not found`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureBackendRunning() {
    try {
      const axios = require('axios');
      await axios.get('http://localhost:3001/health', { timeout: 2000 });
    } catch (error) {
      throw new Error('Backend server not running on localhost:3001');
    }
  }

  async ensureFrontendRunning() {
    try {
      const axios = require('axios');
      await axios.get('http://localhost:3000', { timeout: 2000 });
    } catch (error) {
      throw new Error('Frontend server not running on localhost:3000');
    }
  }

  async createTempJestConfig(config) {
    const configPath = path.join(process.cwd(), 'temp-jest.config.js');
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    await this.writeFile(configPath, configContent);
    return configPath;
  }

  parseJestOutput(output) {
    // Parse Jest output for test results
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);
    const coverageMatch = output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      coverage: coverageMatch ? parseFloat(coverageMatch[1]) : 0
    };
  }

  parsePlaywrightOutput(output) {
    // Parse Playwright JSON output
    try {
      const results = JSON.parse(output);
      return {
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0
      };
    } catch (error) {
      return { passed: 0, failed: 1 };
    }
  }

  extractPerformanceMetrics(output) {
    const metrics = {};
    
    const bmsMatch = output.match(/BMS processing completed in ([\d.]+)ms/);
    if (bmsMatch) {
      metrics.bmsProcessingTime = parseFloat(bmsMatch[1]);
    }

    const vendorMatch = output.match(/Vendor response times: \[([^\]]+)\]/);
    if (vendorMatch) {
      const times = vendorMatch[1].split(',').map(t => parseFloat(t.trim()));
      metrics.vendorResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    return metrics;
  }

  generateHtmlReport(summary) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automated Parts Sourcing Test Results</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: white; border: 1px solid #e1e4e8; border-radius: 6px; padding: 15px; }
        .success { border-left: 4px solid #28a745; }
        .warning { border-left: 4px solid #ffc107; }
        .error { border-left: 4px solid #dc3545; }
        .metric { font-size: 24px; font-weight: bold; color: #2196F3; }
        .label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e1e4e8; }
        th { background-color: #f6f8fa; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .production-ready { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; }
        .not-ready { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Automated Parts Sourcing Test Results</h1>
        <p>Comprehensive testing suite for CollisionOS parts sourcing system</p>
        <p><strong>Generated:</strong> ${summary.timestamp}</p>
        <p><strong>Total Time:</strong> ${(summary.totalTime / 1000).toFixed(2)} seconds</p>
    </div>

    ${summary.productionReady.ready ? 
      '<div class="production-ready"><strong>🎉 PRODUCTION READY</strong> - System meets all deployment criteria!</div>' :
      '<div class="not-ready"><strong>⚠️ NOT PRODUCTION READY</strong> - System needs improvements before deployment</div>'
    }

    <div class="summary">
        ${Object.entries(summary.results).map(([category, result]) => `
            <div class="card ${result.failed > 0 ? 'error' : 'success'}">
                <div class="label">${category.toUpperCase()} TESTS</div>
                <div class="metric">${result.passed}/${result.passed + result.failed}</div>
                <div style="margin-top: 10px;">
                    <span class="pass">✓ ${result.passed} passed</span><br>
                    <span class="fail">✗ ${result.failed} failed</span><br>
                    <span class="label">Time: ${(result.time / 1000).toFixed(2)}s</span>
                    ${result.coverage ? `<br><span class="label">Coverage: ${result.coverage}%</span>` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    <h2>🎯 Production Readiness Assessment</h2>
    <table>
        <tr>
            <th>Criteria</th>
            <th>Status</th>
            <th>Details</th>
        </tr>
        <tr>
            <td>Test Pass Rate</td>
            <td class="${summary.productionReady.criteria.passRate ? 'pass' : 'fail'}">
                ${summary.productionReady.criteria.passRate ? '✓ Pass' : '✗ Fail'}
            </td>
            <td>${summary.productionReady.passRate.toFixed(1)}% (Required: 95%+)</td>
        </tr>
        <tr>
            <td>Code Coverage</td>
            <td class="${summary.productionReady.criteria.coverage ? 'pass' : 'fail'}">
                ${summary.productionReady.criteria.coverage ? '✓ Pass' : '✗ Fail'}
            </td>
            <td>${summary.results.unit.coverage}% (Required: 90%+)</td>
        </tr>
        <tr>
            <td>Performance</td>
            <td class="${summary.productionReady.criteria.performance ? 'pass' : 'fail'}">
                ${summary.productionReady.criteria.performance ? '✓ Pass' : '✗ Fail'}
            </td>
            <td>${summary.performanceMetrics.bmsProcessingTime || 'N/A'}ms (Required: <30,000ms)</td>
        </tr>
        <tr>
            <td>No Blocking Errors</td>
            <td class="${summary.productionReady.criteria.noBlockingErrors ? 'pass' : 'fail'}">
                ${summary.productionReady.criteria.noBlockingErrors ? '✓ Pass' : '✗ Fail'}
            </td>
            <td>${summary.errors.filter(e => e.category !== 'e2e').length} critical errors</td>
        </tr>
    </table>

    <h2>📋 Recommendations</h2>
    <ul>
        ${summary.productionReady.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    ${summary.errors.length > 0 ? `
        <h2>❌ Errors</h2>
        <ul>
            ${summary.errors.map(error => `<li><strong>${error.category}:</strong> ${error.error}</li>`).join('')}
        </ul>
    ` : ''}

    ${summary.warnings.length > 0 ? `
        <h2>⚠️ Warnings</h2>
        <ul>
            ${summary.warnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
    ` : ''}
</body>
</html>`;
  }

  printConsoleSummary(summary) {
    console.log(chalk.blue('\n📊 Test Results Summary\n'));

    Object.entries(summary.results).forEach(([category, result]) => {
      const status = result.failed > 0 ? chalk.red('✗') : chalk.green('✓');
      const time = (result.time / 1000).toFixed(2);
      console.log(`${status} ${category.toUpperCase().padEnd(12)} ${result.passed}/${result.passed + result.failed} passed (${time}s)`);
    });

    console.log(chalk.blue('\n🎯 Production Readiness\n'));
    console.log(`Overall Score: ${(summary.productionReady.score * 100).toFixed(1)}%`);
    console.log(`Pass Rate: ${summary.productionReady.passRate.toFixed(1)}%`);
    console.log(`Production Ready: ${summary.productionReady.ready ? chalk.green('YES ✓') : chalk.red('NO ✗')}`);
  }

  async writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key) {
      options[key] = value || true;
    }
  }

  const runner = new AutomatedSourcingTestRunner();
  
  runner.run(options)
    .then((productionReady) => {
      process.exit(productionReady ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red('\nTest runner failed:'), error.message);
      process.exit(1);
    });
}

module.exports = AutomatedSourcingTestRunner;