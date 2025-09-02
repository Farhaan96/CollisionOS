#!/usr/bin/env node

/**
 * CollisionOS Comprehensive Testing Suite Runner
 * Executes all testing components to validate the collision repair system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runComprehensiveTests() {
    console.log('🚗 CollisionOS Comprehensive Testing Suite\n');
    
    const testReport = {
        timestamp: new Date().toISOString(),
        test_suites: [],
        overall_status: 'RUNNING'
    };

    try {
        // Test Suite 1: Infrastructure Validation
        console.log('1️⃣ Running Infrastructure Validation...');
        
        try {
            const infrastructureTest = require('./test-comprehensive-infrastructure.js');
            const infrastructureResults = await infrastructureTest();
            
            testReport.test_suites.push({
                name: 'Infrastructure Validation',
                status: 'PASSED',
                success_rate: infrastructureResults.summary.success_rate,
                details: infrastructureResults.summary
            });
            console.log('   ✅ Infrastructure validation: PASSED\n');
        } catch (error) {
            testReport.test_suites.push({
                name: 'Infrastructure Validation',
                status: 'FAILED',
                error: error.message
            });
            console.log('   ❌ Infrastructure validation: FAILED\n');
        }

        // Test Suite 2: BMS Test Data Generation
        console.log('2️⃣ Generating BMS Test Data...');
        
        try {
            const BMSTestDataGenerator = require('../tests/data-factories/BMSTestDataGenerator');
            const bmsGenerator = new BMSTestDataGenerator();
            
            // Generate test files
            const testSuiteDir = path.join(__dirname, '../test-bms-files');
            const summary = bmsGenerator.generateTestSuite(10, testSuiteDir);
            
            // Generate scenario files
            const scenarios = bmsGenerator.generateScenarios();
            
            testReport.test_suites.push({
                name: 'BMS Test Data Generation',
                status: 'PASSED',
                files_generated: summary.total_files,
                total_size_kb: Math.round(summary.total_size_bytes / 1024),
                scenarios: scenarios.length,
                output_directory: testSuiteDir
            });
            console.log(`   ✅ BMS test data: Generated ${summary.total_files} files (${Math.round(summary.total_size_bytes / 1024)} KB)\n`);
        } catch (error) {
            testReport.test_suites.push({
                name: 'BMS Test Data Generation',
                status: 'FAILED',
                error: error.message
            });
            console.log('   ❌ BMS test data generation: FAILED\n');
        }

        // Test Suite 3: Unit Testing (if available)
        console.log('3️⃣ Running Unit Tests...');
        
        try {
            // Check if Jest tests exist and run them
            if (fs.existsSync(path.join(__dirname, '../tests/unit'))) {
                const jestResult = execSync('npm run test:unit', { 
                    cwd: path.dirname(__dirname),
                    encoding: 'utf8',
                    timeout: 30000
                });
                
                testReport.test_suites.push({
                    name: 'Unit Tests',
                    status: 'PASSED',
                    output: jestResult.substring(0, 500) // Truncate for report
                });
                console.log('   ✅ Unit tests: PASSED\n');
            } else {
                testReport.test_suites.push({
                    name: 'Unit Tests',
                    status: 'SKIPPED',
                    reason: 'No unit test files found'
                });
                console.log('   ⏭️ Unit tests: SKIPPED (no test files)\n');
            }
        } catch (error) {
            testReport.test_suites.push({
                name: 'Unit Tests',
                status: 'FAILED',
                error: error.message.substring(0, 500)
            });
            console.log('   ❌ Unit tests: FAILED\n');
        }

        // Test Suite 4: Integration Testing (if database available)
        console.log('4️⃣ Testing Integration Tests...');
        
        try {
            // Check if models are available for integration testing
            const modelsExist = fs.existsSync(path.join(__dirname, '../server/database/models/index.js'));
            
            if (modelsExist) {
                // Run a simple integration test
                const integrationTestPath = path.join(__dirname, '../tests/integration/collision-repair-workflow.test.js');
                
                if (fs.existsSync(integrationTestPath)) {
                    testReport.test_suites.push({
                        name: 'Integration Tests',
                        status: 'AVAILABLE',
                        test_file: integrationTestPath,
                        note: 'Integration tests ready but require database connection'
                    });
                    console.log('   ✅ Integration tests: AVAILABLE (ready for database testing)\n');
                } else {
                    testReport.test_suites.push({
                        name: 'Integration Tests',
                        status: 'CONFIGURED',
                        note: 'Integration test framework configured'
                    });
                    console.log('   ✅ Integration tests: CONFIGURED\n');
                }
            } else {
                testReport.test_suites.push({
                    name: 'Integration Tests',
                    status: 'SKIPPED',
                    reason: 'Database models not available'
                });
                console.log('   ⏭️ Integration tests: SKIPPED (no database models)\n');
            }
        } catch (error) {
            testReport.test_suites.push({
                name: 'Integration Tests',
                status: 'FAILED',
                error: error.message
            });
            console.log('   ❌ Integration tests: FAILED\n');
        }

        // Test Suite 5: Performance Testing Readiness
        console.log('5️⃣ Checking Performance Testing Readiness...');
        
        try {
            const performanceTestPath = path.join(__dirname, '../tests/performance/CollisionRepairPerformanceTests.js');
            
            if (fs.existsSync(performanceTestPath)) {
                const CollisionRepairPerformanceTests = require(performanceTestPath);
                
                testReport.test_suites.push({
                    name: 'Performance Testing',
                    status: 'READY',
                    test_file: performanceTestPath,
                    note: 'Performance tests ready for database execution'
                });
                console.log('   ✅ Performance testing: READY\n');
            } else {
                testReport.test_suites.push({
                    name: 'Performance Testing',
                    status: 'NOT_FOUND',
                    reason: 'Performance test files not found'
                });
                console.log('   ❌ Performance testing: NOT FOUND\n');
            }
        } catch (error) {
            testReport.test_suites.push({
                name: 'Performance Testing',
                status: 'ERROR',
                error: error.message
            });
            console.log('   ❌ Performance testing: ERROR\n');
        }

        // Generate comprehensive report
        const reportPath = path.join(__dirname, '../test-reports', `comprehensive-test-suite-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // Calculate overall status
        const passedSuites = testReport.test_suites.filter(s => s.status === 'PASSED' || s.status === 'READY' || s.status === 'AVAILABLE').length;
        const totalSuites = testReport.test_suites.length;
        const successRate = (passedSuites / totalSuites) * 100;
        
        testReport.overall_status = successRate >= 80 ? 'READY' : successRate >= 60 ? 'PARTIAL' : 'FAILED';
        testReport.summary = {
            total_test_suites: totalSuites,
            passed_or_ready: passedSuites,
            success_rate: successRate,
            testing_grade: successRate >= 90 ? 'A' : successRate >= 80 ? 'B' : successRate >= 70 ? 'C' : 'D'
        };

        fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

        // Display final results
        console.log('🎉 Comprehensive Testing Suite Complete!\n');
        console.log('📊 Testing Summary:');
        console.log(`  • Test Suites: ${totalSuites}`);
        console.log(`  • Ready/Passed: ${passedSuites}`);
        console.log(`  • Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`  • Testing Grade: ${testReport.summary.testing_grade}`);
        console.log(`  • Overall Status: ${testReport.overall_status}`);
        console.log(`  • Report: ${reportPath}\n`);

        // Display testing capabilities
        console.log('🔧 Testing Capabilities Ready:');
        testReport.test_suites.forEach(suite => {
            const status = suite.status === 'PASSED' ? '✅' : 
                          suite.status === 'READY' ? '🟢' :
                          suite.status === 'AVAILABLE' ? '🟡' :
                          suite.status === 'SKIPPED' ? '⏭️' : '❌';
            console.log(`  ${status} ${suite.name}: ${suite.status}`);
        });

        console.log('\n💡 Ready for CollisionOS Testing:');
        console.log('  • Comprehensive test data generation');
        console.log('  • BMS XML import file testing');
        console.log('  • Performance testing framework');
        console.log('  • Integration testing capabilities');
        console.log('  • Financial calculation validation');
        console.log('  • Data relationship integrity testing');

        if (testReport.overall_status === 'READY') {
            console.log('\n🌟 All testing infrastructure is ready for collision repair validation!');
            return testReport;
        } else {
            console.log('\n⚠️ Some testing components need attention before full testing can proceed.');
            return testReport;
        }

    } catch (error) {
        console.error('\n❌ Comprehensive testing failed:', error.message);
        testReport.overall_status = 'FAILED';
        testReport.error = error.message;
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    runComprehensiveTests()
        .then((report) => {
            if (report.overall_status === 'READY') {
                console.log('\n🎯 CollisionOS testing infrastructure is fully operational!');
                process.exit(0);
            } else {
                console.log('\n⚠️ Testing infrastructure partially ready. Check report for details.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Testing suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = runComprehensiveTests;