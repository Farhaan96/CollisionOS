#!/usr/bin/env node

/**
 * Comprehensive BMS Testing Suite Runner
 * Orchestrates all BMS-related tests and generates detailed reports
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes
  retries: 2,
  coverage: {
    threshold: 90,
    include: [
      'src/services/bmsService.js',
      'src/components/Common/BMSFileUpload.js',
      'src/pages/BMSImport/**/*.js',
      'src/components/Dashboard/BMSDashboard.js'
    ]
  },
  performance: {
    enabled: true,
    thresholds: {
      parseTime: 1000,
      uploadTime: 5000,
      memoryUsage: 100 * 1024 * 1024
    }
  }
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    pattern: 'tests/unit/**/*.test.js',
    weight: 0.4
  },
  {
    name: 'Integration Tests',
    command: 'jest tests/integration/bms/bms-integration.test.js --detectOpenHandles --forceExit',
    pattern: 'tests/integration/bms/**/*.test.js',
    weight: 0.3
  },
  {
    name: 'Performance Tests',
    command: 'jest tests/performance/bms-performance.test.js --detectOpenHandles --forceExit --runInBand',
    pattern: 'tests/performance/**/*.test.js',
    weight: 0.1
  },
  {
    name: 'E2E Tests',
    command: 'npx playwright test tests/e2e/bms/bms-comprehensive.spec.js',
    pattern: 'tests/e2e/bms/**/*.spec.js',
    weight: 0.2
  }
];

class BMSTestRunner {
  constructor() {
    this.results = {
      overall: {
        startTime: new Date(),
        endTime: null,
        duration: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: 0,
        score: 0
      },
      suites: {},
      errors: [],
      warnings: [],
      performance: {
        parseTime: [],
        uploadTime: [],
        memoryUsage: []
      }
    };
    
    this.reportPath = path.join(__dirname, '..', 'coverage', 'bms-comprehensive-report.json');
    this.htmlReportPath = path.join(__dirname, '..', 'coverage', 'bms-comprehensive-report.html');
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive BMS Testing Suite...\n');
    
    // Prepare environment
    await this.prepareEnvironment();
    
    // Run test suites
    for (const suite of TEST_SUITES) {
      console.log(`\n📋 Running ${suite.name}...`);
      await this.runTestSuite(suite);
    }
    
    // Generate reports
    await this.generateReports();
    
    // Display summary
    this.displaySummary();
    
    return this.results.overall.score >= 80;
  }

  async prepareEnvironment() {
    console.log('🔧 Preparing test environment...');
    
    // Ensure coverage directory exists
    const coverageDir = path.join(__dirname, '..', 'coverage');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    // Check if sample BMS files exist
    const bmsDir = path.join(__dirname, '..', 'data', 'Example BMS');
    if (!fs.existsSync(bmsDir)) {
      console.log('⚠️  BMS sample directory not found, creating mock files...');
      await this.createMockBMSFiles();
    }
    
    // Verify dependencies
    await this.verifyDependencies();
    
    console.log('✅ Environment prepared successfully');
  }

  async createMockBMSFiles() {
    const bmsDir = path.join(__dirname, '..', 'data', 'Example BMS');
    fs.mkdirSync(bmsDir, { recursive: true });
    
    const mockFiles = [
      {
        name: 'minor_collision_estimate.xml',
        type: 'minor',
        damageLines: 5,
        total: 1500
      },
      {
        name: 'major_collision_estimate.xml',
        type: 'major',
        damageLines: 25,
        total: 8500
      },
      {
        name: 'luxury_vehicle_estimate.xml',
        type: 'luxury',
        damageLines: 15,
        total: 12000
      },
      {
        name: 'paint_only_estimate.xml',
        type: 'paint',
        damageLines: 8,
        total: 2500
      },
      {
        name: 'glass_replacement_estimate.xml',
        type: 'glass',
        damageLines: 3,
        total: 800
      }
    ];
    
    for (const mockFile of mockFiles) {
      const filePath = path.join(bmsDir, mockFile.name);
      const content = this.generateMockBMSContent(mockFile);
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
    console.log(`✅ Created ${mockFiles.length} mock BMS files`);
  }

  generateMockBMSContent(config) {
    const { type, damageLines, total } = config;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<VehicleDamageEstimateAddRq>
  <RqUID>TEST-${type.toUpperCase()}-${Date.now()}</RqUID>
  <RefClaimNum>CLM-${type.toUpperCase()}-001</RefClaimNum>
  
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <DocumentType>Estimate</DocumentType>
    <DocumentID>EST-${type.toUpperCase()}-001</DocumentID>
    <VendorCode>TEST</VendorCode>
    <DocumentStatus>Final</DocumentStatus>
    <CreateDateTime>${new Date().toISOString()}</CreateDateTime>
    <TransmitDateTime>${new Date().toISOString()}</TransmitDateTime>
    <CurrencyInfo>
      <CurCode>CAD</CurCode>
      <BaseCurCode>CAD</BaseCurCode>
      <CurRate>1.00</CurRate>
    </CurrencyInfo>
  </DocumentInfo>
  
  <AdminInfo>
    <InsuranceCompany>
      <Party>
        <OrgInfo>
          <CompanyName>${type.charAt(0).toUpperCase() + type.slice(1)} Insurance Co.</CompanyName>
        </OrgInfo>
      </Party>
    </InsuranceCompany>
    <PolicyHolder>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName>${type.charAt(0).toUpperCase() + type.slice(1)}</FirstName>
            <LastName>TestCustomer</LastName>
          </PersonName>
          <Communications>
            <CommQualifier>AL</CommQualifier>
            <Address>
              <Address1>123 ${type.charAt(0).toUpperCase() + type.slice(1)} St</Address1>
              <City>Test City</City>
              <StateProvince>ON</StateProvince>
              <PostalCode>M5V 1A1</PostalCode>
            </Address>
          </Communications>
        </PersonInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier>HP</CommQualifier>
            <CommPhone>416-555-${Math.floor(Math.random() * 9000) + 1000}</CommPhone>
          </Communications>
        </ContactInfo>
      </Party>
    </PolicyHolder>
  </AdminInfo>
  
  <ClaimInfo>
    <ClaimNum>CLM-${type.toUpperCase()}-001</ClaimNum>
    <PolicyInfo>
      <PolicyNum>POL-${type.toUpperCase()}-001</PolicyNum>
      <CoverageInfo>
        <Coverage>
          <CoverageCategory>C</CoverageCategory>
          <DeductibleInfo>
            <DeductibleStatus>D2</DeductibleStatus>
            <DeductibleAmt>${type === 'luxury' ? 1000 : 500}.00</DeductibleAmt>
          </DeductibleInfo>
        </Coverage>
      </CoverageInfo>
    </PolicyInfo>
    <LossInfo>
      <Facts>
        <LossDateTime>${new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()}</LossDateTime>
        <ReportedDateTime>${new Date().toISOString()}</ReportedDateTime>
        <DamageMemo>${type.toUpperCase()} collision damage</DamageMemo>
        <LossMemo>Damage consistent with ${type} collision</LossMemo>
      </Facts>
      <TotalLossInd>N</TotalLossInd>
    </LossInfo>
  </ClaimInfo>
  
  <VehicleInfo>
    <VINInfo>
      <VIN>
        <VINNum>TEST${type.toUpperCase()}12345678901</VINNum>
      </VIN>
    </VINInfo>
    <License>
      <LicensePlateNum>${type.toUpperCase()}123</LicensePlateNum>
      <LicensePlateStateProvince>ON</LicensePlateStateProvince>
    </License>
    <VehicleDesc>
      <ModelYear>${2018 + Math.floor(Math.random() * 6)}</ModelYear>
      <MakeDesc>${type === 'luxury' ? 'BMW' : type === 'glass' ? 'Honda' : 'Toyota'}</MakeDesc>
      <ModelName>${type === 'luxury' ? 'X5' : type === 'glass' ? 'Civic' : 'Camry'}</ModelName>
      <SubModelDesc>${type === 'luxury' ? 'xDrive40i' : 'LE'}</SubModelDesc>
      <VehicleType>PC</VehicleType>
      <OdometerInfo>
        <OdometerReading>${50000 + Math.floor(Math.random() * 100000)}</OdometerReading>
        <OdometerReadingMeasure>DK</OdometerReadingMeasure>
      </OdometerInfo>
    </VehicleDesc>
    <Paint>
      <Exterior>
        <Color>
          <ColorName>${type === 'luxury' ? 'Alpine White' : type === 'paint' ? 'Cherry Red Pearl' : 'Silver Metallic'}</ColorName>
        </Color>
      </Exterior>
    </Paint>
    <Body>
      <BodyStyle>${type === 'luxury' ? 'SUV' : '4 Door Sedan'}</BodyStyle>
    </Body>
    <Condition>
      <ConditionCode>GO</ConditionCode>
      <DrivableInd>Y</DrivableInd>
      <PriorDamageInd>N</PriorDamageInd>
    </Condition>
    <Valuation>
      <ValuationType>ACV</ValuationType>
      <ValuationAmt>${total * 3}.00</ValuationAmt>
    </Valuation>
  </VehicleInfo>
  
  ${Array.from({ length: damageLines }, (_, i) => `
  <DamageLineInfo>
    <LineNum>${i + 1}</LineNum>
    <UniqueSequenceNum>${i + 100}</UniqueSequenceNum>
    <LineDesc>${type.charAt(0).toUpperCase() + type.slice(1)} Damage Item ${i + 1}</LineDesc>
    <LineHeaderDesc>${type === 'paint' ? 'Paint Work' : type === 'glass' ? 'Glass Replacement' : 'Body Repair'}</LineHeaderDesc>
    <LineType>REPAIR</LineType>
    <PartInfo>
      <PartSourceCode>04</PartSourceCode>
      <PartType>PAA</PartType>
      <PartNum>${type.toUpperCase()}-PART-${(i + 1).toString().padStart(3, '0')}</PartNum>
      <OEMPartNum>OEM-${(i + 1).toString().padStart(6, '0')}</OEMPartNum>
      <PartPrice>${(Math.random() * 500 + 100).toFixed(2)}</PartPrice>
      <OEMPartPrice>${(Math.random() * 750 + 200).toFixed(2)}</OEMPartPrice>
      <Quantity>1</Quantity>
      <TaxableInd>1</TaxableInd>
    </PartInfo>
    <LaborInfo>
      <LaborType>BODY</LaborType>
      <LaborOperation>${type === 'paint' ? 'PAINT' : type === 'glass' ? 'REPLACE' : 'REPAIR'}</LaborOperation>
      <LaborHours>${(Math.random() * 4 + 1).toFixed(2)}</LaborHours>
      <DatabaseLaborHours>${(Math.random() * 4 + 1).toFixed(2)}</DatabaseLaborHours>
      <LaborInclInd>0</LaborInclInd>
      <TaxableInd>1</TaxableInd>
    </LaborInfo>
  </DamageLineInfo>`).join('')}
  
  <RepairTotalsInfo>
    <LaborTotalsInfo>
      <TotalType>LA</TotalType>
      <TotalTypeDesc>Labor</TotalTypeDesc>
      <TaxableAmt>${(total * 0.4).toFixed(2)}</TaxableAmt>
      <TaxTotalAmt>${(total * 0.04).toFixed(2)}</TaxTotalAmt>
      <TotalAmt>${(total * 0.44).toFixed(2)}</TotalAmt>
    </LaborTotalsInfo>
    <PartsTotalsInfo>
      <TotalType>PA</TotalType>
      <TotalTypeDesc>Parts</TotalTypeDesc>
      <TaxableAmt>${(total * 0.5).toFixed(2)}</TaxableAmt>
      <TaxTotalAmt>${(total * 0.05).toFixed(2)}</TaxTotalAmt>
      <TotalAmt>${(total * 0.55).toFixed(2)}</TotalAmt>
    </PartsTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>CE</TotalSubType>
      <TotalTypeDesc>Gross Total</TotalTypeDesc>
      <TotalAmt>${total.toFixed(2)}</TotalAmt>
    </SummaryTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>TT</TotalSubType>
      <TotalTypeDesc>Net Total</TotalTypeDesc>
      <TotalAmt>${(total - (type === 'luxury' ? 1000 : 500)).toFixed(2)}</TotalAmt>
    </SummaryTotalsInfo>
  </RepairTotalsInfo>
</VehicleDamageEstimateAddRq>`;
  }

  async verifyDependencies() {
    const requiredPackages = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      '@playwright/test',
      'fast-xml-parser'
    ];
    
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
      } catch (error) {
        this.results.warnings.push(`Missing dependency: ${pkg}`);
      }
    }
  }

  async runTestSuite(suite) {
    const startTime = Date.now();
    
    try {
      const result = await this.executeCommand(suite.command);
      const endTime = Date.now();
      
      this.results.suites[suite.name] = {
        command: suite.command,
        pattern: suite.pattern,
        weight: suite.weight,
        duration: endTime - startTime,
        success: result.exitCode === 0,
        output: result.output,
        errors: result.errors,
        stats: this.parseTestOutput(result.output, suite.name)
      };
      
      // Update overall results
      const suiteResult = this.results.suites[suite.name];
      this.results.overall.totalTests += suiteResult.stats.total;
      this.results.overall.passedTests += suiteResult.stats.passed;
      this.results.overall.failedTests += suiteResult.stats.failed;
      this.results.overall.skippedTests += suiteResult.stats.skipped;
      
      if (suiteResult.success) {
        console.log(`✅ ${suite.name} passed (${suiteResult.stats.passed}/${suiteResult.stats.total})`);
      } else {
        console.log(`❌ ${suite.name} failed (${suiteResult.stats.passed}/${suiteResult.stats.total})`);
        this.results.errors.push(`${suite.name}: ${result.errors}`);
      }
      
    } catch (error) {
      console.log(`💥 ${suite.name} crashed: ${error.message}`);
      this.results.errors.push(`${suite.name} crashed: ${error.message}`);
      
      this.results.suites[suite.name] = {
        command: suite.command,
        pattern: suite.pattern,
        weight: suite.weight,
        duration: Date.now() - startTime,
        success: false,
        output: '',
        errors: [error.message],
        stats: { total: 0, passed: 0, failed: 1, skipped: 0 }
      };
      
      this.results.overall.failedTests += 1;
    }
  }

  async executeCommand(command) {
    return new Promise((resolve) => {
      let output = '';
      let errors = '';
      
      const child = spawn(command, { 
        shell: true, 
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        errors += data.toString();
        process.stderr.write(data);
      });
      
      child.on('close', (code) => {
        resolve({
          exitCode: code,
          output,
          errors
        });
      });
      
      child.on('error', (error) => {
        resolve({
          exitCode: 1,
          output,
          errors: error.message
        });
      });
      
      // Timeout after 5 minutes
      setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          exitCode: 1,
          output,
          errors: 'Test timed out after 5 minutes'
        });
      }, TEST_CONFIG.timeout);
    });
  }

  parseTestOutput(output, suiteName) {
    const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
    
    // Parse Jest output
    if (output.includes('Tests:')) {
      const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (testMatch) {
        stats.failed = parseInt(testMatch[1]);
        stats.passed = parseInt(testMatch[2]);
        stats.total = parseInt(testMatch[3]);
      } else {
        const passedMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (passedMatch) {
          stats.passed = parseInt(passedMatch[1]);
          stats.total = parseInt(passedMatch[2]);
        }
      }
    }
    
    // Parse Playwright output
    if (output.includes('passing') || output.includes('failing')) {
      const passingMatch = output.match(/(\d+)\s+passing/);
      const failingMatch = output.match(/(\d+)\s+failing/);
      
      if (passingMatch) stats.passed = parseInt(passingMatch[1]);
      if (failingMatch) stats.failed = parseInt(failingMatch[1]);
      stats.total = stats.passed + stats.failed;
    }
    
    // Extract performance metrics if available
    if (suiteName === 'Performance Tests') {
      const parseTimeMatch = output.match(/parse time:\s+([\d.]+)ms/g);
      if (parseTimeMatch) {
        this.results.performance.parseTime = parseTimeMatch.map(m => 
          parseFloat(m.match(/[\d.]+/)[0])
        );
      }
    }
    
    return stats;
  }

  calculateScore() {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const [name, suite] of Object.entries(this.results.suites)) {
      const suiteConfig = TEST_SUITES.find(s => s.name === name);
      if (suiteConfig && suite.stats.total > 0) {
        const suiteScore = (suite.stats.passed / suite.stats.total) * 100;
        totalWeightedScore += suiteScore * suiteConfig.weight;
        totalWeight += suiteConfig.weight;
      }
    }
    
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  async generateReports() {
    console.log('\n📊 Generating reports...');
    
    this.results.overall.endTime = new Date();
    this.results.overall.duration = this.results.overall.endTime - this.results.overall.startTime;
    this.results.overall.score = this.calculateScore();
    
    // JSON Report
    fs.writeFileSync(this.reportPath, JSON.stringify(this.results, null, 2));
    
    // HTML Report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(this.htmlReportPath, htmlReport);
    
    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${this.reportPath}`);
    console.log(`   HTML: ${this.htmlReportPath}`);
  }

  generateHTMLReport() {
    const { overall, suites, errors, warnings } = this.results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BMS Comprehensive Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${overall.score >= 90 ? '#4CAF50' : overall.score >= 70 ? '#FF9800' : '#F44336'}; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #333; }
        .stat-label { color: #666; margin-top: 5px; }
        .suite-results { margin-bottom: 30px; }
        .suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .success { color: #4CAF50; }
        .failure { color: #F44336; }
        .warning { color: #FF9800; }
        .progress-bar { width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .errors { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
        .warnings { background: #fff8e1; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 BMS Comprehensive Test Report</h1>
            <div class="score">${overall.score}%</div>
            <p>Generated on ${overall.endTime.toLocaleString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${overall.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${overall.passedTests}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value failure">${overall.failedTests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(overall.duration / 1000 / 60).toFixed(1)}m</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        <div class="suite-results">
            <h2>📋 Test Suite Results</h2>
            ${Object.entries(suites).map(([name, suite]) => `
            <div class="suite">
                <div class="suite-header ${suite.success ? 'success' : 'failure'}">
                    ${suite.success ? '✅' : '❌'} ${name}
                    <span style="float: right;">${suite.stats.passed}/${suite.stats.total} tests</span>
                </div>
                <div class="suite-content">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(suite.stats.passed / suite.stats.total) * 100}%; background: ${suite.success ? '#4CAF50' : '#F44336'};"></div>
                    </div>
                    <p><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(2)}s</p>
                    <p><strong>Command:</strong> <code>${suite.command}</code></p>
                    ${suite.errors.length > 0 ? `<div class="errors"><strong>Errors:</strong><br>${suite.errors.join('<br>')}</div>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
        
        ${errors.length > 0 ? `
        <div class="errors">
            <h3>❌ Errors</h3>
            ${errors.map(error => `<p>${error}</p>`).join('')}
        </div>
        ` : ''}
        
        ${warnings.length > 0 ? `
        <div class="warnings">
            <h3>⚠️ Warnings</h3>
            ${warnings.map(warning => `<p>${warning}</p>`).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  displaySummary() {
    const { overall } = this.results;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 BMS COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Score: ${overall.score}%`);
    console.log(`📈 Tests: ${overall.passedTests}/${overall.totalTests} passed`);
    console.log(`⏱️  Duration: ${(overall.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`📝 Report: ${this.htmlReportPath}`);
    
    if (overall.score >= 90) {
      console.log('🏆 EXCELLENT - BMS functionality is production ready!');
    } else if (overall.score >= 80) {
      console.log('👍 GOOD - BMS functionality is mostly ready with minor issues');
    } else if (overall.score >= 70) {
      console.log('⚠️  FAIR - BMS functionality needs improvement');
    } else {
      console.log('❌ POOR - BMS functionality requires significant fixes');
    }
    
    console.log('='.repeat(80));
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new BMSTestRunner();
  
  runner.runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = BMSTestRunner;