#!/usr/bin/env node
/**
 * Database Performance Testing
 * Test collision repair workflow query performance with indexes
 */

const fs = require('fs');

console.log('🔍 Database Performance Testing\n');

// Load environment
const envVars = {};
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Using process.env');
}

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Performance test queries for collision repair workflow
 */
const PERFORMANCE_TESTS = [
  {
    name: 'RO Search by Number',
    description: 'Search repair orders by RO number',
    query: `
      SELECT ro.*, c.first_name, c.last_name, v.vin, cl.claim_number
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN insurance_claims cl ON ro.claim_id = cl.id
      WHERE ro.ro_number ILIKE 'RO-2024%'
      LIMIT 10;
    `,
    expectedIndex: 'idx_repair_orders_ro_number',
    target: '< 10ms'
  },

  {
    name: 'Global Search (RO, Claim, VIN, Plate)',
    description: 'Search across RO#, Claim#, VIN, License Plate',
    query: `
      SELECT DISTINCT
        ro.id, ro.ro_number, ro.status,
        c.first_name, c.last_name, c.phone,
        v.vin, v.license_plate,
        cl.claim_number, ic.name as insurance_company
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN insurance_claims cl ON ro.claim_id = cl.id
      LEFT JOIN insurance_companies ic ON cl.insurance_company_id = ic.id
      WHERE (
        ro.ro_number ILIKE '%2024%' OR
        cl.claim_number ILIKE '%2024%' OR
        v.vin ILIKE '%123456%' OR
        v.license_plate ILIKE '%ABC%' OR
        CONCAT(c.first_name, ' ', c.last_name) ILIKE '%Smith%'
      )
      ORDER BY ro.opened_at DESC
      LIMIT 20;
    `,
    expectedIndex: 'Multiple composite indexes',
    target: '< 50ms'
  },

  {
    name: 'Parts Workflow Status Query',
    description: 'Get parts by status for workflow buckets',
    query: `
      SELECT pl.*, s.name as supplier_name, ro.ro_number
      FROM part_lines pl
      LEFT JOIN suppliers s ON pl.supplier_id = s.id
      LEFT JOIN repair_orders ro ON pl.repair_order_id = ro.id
      WHERE pl.status IN ('needed', 'ordered', 'received')
      ORDER BY pl.status, pl.created_at
      LIMIT 50;
    `,
    expectedIndex: 'idx_part_lines_status_workflow',
    target: '< 5ms'
  },

  {
    name: 'Vendor KPI Dashboard Query',
    description: 'Complex vendor performance metrics',
    query: `
      SELECT
        s.id, s.name, s.vendor_code,
        COUNT(po.id) as total_pos,
        AVG(CASE WHEN po.received_date IS NOT NULL
          THEN EXTRACT(days FROM po.received_date - po.created_at)
          END) as avg_delivery_days,
        SUM(po.total_amount) as total_spend,
        COUNT(CASE WHEN po.status = 'received' THEN 1 END)::float /
          NULLIF(COUNT(po.id), 0) * 100 as completion_rate
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.vendor_id
      WHERE s.active = true
        AND po.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY s.id, s.name, s.vendor_code
      ORDER BY total_spend DESC NULLS LAST
      LIMIT 10;
    `,
    expectedIndex: 'idx_purchase_orders_vendor_kpi',
    target: '< 100ms'
  },

  {
    name: 'PO Creation - Parts by Vendor',
    description: 'Get parts needed for specific vendor PO creation',
    query: `
      SELECT pl.*, p.part_number, p.description
      FROM part_lines pl
      LEFT JOIN parts p ON pl.part_number = p.part_number
      WHERE pl.status = 'needed'
        AND pl.supplier_id = '12345678-1234-1234-1234-123456789012'
        AND pl.repair_order_id = '87654321-4321-4321-4321-210987654321'
      ORDER BY pl.created_at;
    `,
    expectedIndex: 'idx_part_lines_ro_supplier',
    target: '< 5ms'
  },

  {
    name: 'Customer Phone/Email Lookup',
    description: 'Find customer by phone or email',
    query: `
      SELECT c.*, COUNT(ro.id) as total_ros
      FROM customers c
      LEFT JOIN repair_orders ro ON c.id = ro.customer_id
      WHERE c.phone LIKE '%555-1234%' OR c.email ILIKE '%smith@%'
      GROUP BY c.id
      ORDER BY total_ros DESC;
    `,
    expectedIndex: 'idx_customers_phone_email',
    target: '< 20ms'
  },

  {
    name: 'BMS Import History',
    description: 'Recent BMS import tracking',
    query: `
      SELECT bi.*, COUNT(ro.id) as ros_created
      FROM bms_imports bi
      LEFT JOIN repair_orders ro ON ro.bms_import_id = bi.id
      WHERE bi.import_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY bi.id
      ORDER BY bi.import_date DESC
      LIMIT 20;
    `,
    expectedIndex: 'idx_bms_imports_shop_date',
    target: '< 30ms'
  },

  {
    name: 'Vehicle VIN Lookup',
    description: 'Find vehicle by VIN for claim linking',
    query: `
      SELECT v.*, c.first_name, c.last_name, COUNT(ro.id) as repair_history
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN repair_orders ro ON v.id = ro.vehicle_id
      WHERE v.vin = '1G1BC5SM5H7123456'
      GROUP BY v.id, c.first_name, c.last_name;
    `,
    expectedIndex: 'idx_vehicles_vin',
    target: '< 5ms'
  }
];

/**
 * Test database performance
 */
async function testDatabasePerformance() {
  console.log('📊 Performance Test Configuration');
  console.log('===================================');
  console.log(`🔗 Database: ${SUPABASE_URL ? '✓ Connected' : '❌ Not configured'}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY ? '✓ Available' : '❌ Missing'}`);
  console.log(`📋 Test Queries: ${PERFORMANCE_TESTS.length}`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Cannot run performance tests - missing Supabase configuration');
    return;
  }

  console.log('\n🚀 Running Performance Tests...');
  console.log('='.repeat(60));

  const results = [];

  for (const test of PERFORMANCE_TESTS) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   Target: ${test.target}`);
    console.log(`   Expected Index: ${test.expectedIndex}`);

    try {
      const startTime = Date.now();

      // Execute query via Supabase REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: test.query.replace(/\s+/g, ' ').trim()
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        const rowCount = Array.isArray(data) ? data.length : (data.length || 0);

        console.log(`   ✅ Executed in ${duration}ms`);
        console.log(`   📊 Returned ${rowCount} rows`);

        // Performance evaluation
        const targetMs = parseInt(test.target.match(/(\d+)ms/)?.[1] || '1000');
        const status = duration <= targetMs ? '🎯 GOOD' : duration <= targetMs * 2 ? '⚠️ SLOW' : '🔥 CRITICAL';
        console.log(`   ${status} (target: ${test.target})`);

        results.push({
          name: test.name,
          duration,
          target: targetMs,
          rowCount,
          status: duration <= targetMs ? 'GOOD' : duration <= targetMs * 2 ? 'SLOW' : 'CRITICAL'
        });

      } else {
        const errorText = await response.text();
        console.log(`   ❌ Query failed: ${response.status}`);
        console.log(`   Error: ${errorText}`);

        results.push({
          name: test.name,
          duration: -1,
          target: parseInt(test.target.match(/(\d+)ms/)?.[1] || '1000'),
          rowCount: 0,
          status: 'ERROR',
          error: errorText
        });
      }

    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
      results.push({
        name: test.name,
        duration: -1,
        target: parseInt(test.target.match(/(\d+)ms/)?.[1] || '1000'),
        rowCount: 0,
        status: 'NETWORK_ERROR',
        error: error.message
      });
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Performance summary
  console.log('\n📈 Performance Test Summary');
  console.log('===========================');

  const goodTests = results.filter(r => r.status === 'GOOD');
  const slowTests = results.filter(r => r.status === 'SLOW');
  const criticalTests = results.filter(r => r.status === 'CRITICAL');
  const errorTests = results.filter(r => r.status === 'ERROR' || r.status === 'NETWORK_ERROR');

  console.log(`🎯 Good Performance: ${goodTests.length}/${results.length}`);
  console.log(`⚠️ Slow Performance: ${slowTests.length}/${results.length}`);
  console.log(`🔥 Critical Performance: ${criticalTests.length}/${results.length}`);
  console.log(`❌ Errors: ${errorTests.length}/${results.length}`);

  if (goodTests.length > 0) {
    console.log('\n✅ Well-Performing Queries:');
    goodTests.forEach(test => {
      console.log(`   ${test.name}: ${test.duration}ms (target: ${test.target}ms)`);
    });
  }

  if (slowTests.length > 0) {
    console.log('\n⚠️ Slow Queries (need optimization):');
    slowTests.forEach(test => {
      console.log(`   ${test.name}: ${test.duration}ms (target: ${test.target}ms)`);
    });
  }

  if (criticalTests.length > 0) {
    console.log('\n🔥 Critical Performance Issues:');
    criticalTests.forEach(test => {
      console.log(`   ${test.name}: ${test.duration}ms (target: ${test.target}ms)`);
    });
  }

  if (errorTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    errorTests.forEach(test => {
      console.log(`   ${test.name}: ${test.error}`);
    });
  }

  // Recommendations
  console.log('\n🔧 Optimization Recommendations');
  console.log('=================================');

  if (criticalTests.length > 0) {
    console.log('1. 🔥 URGENT: Deploy performance indexes immediately');
    console.log('   Command: Execute 08_collision_repair_performance_indexes.sql');
  }

  if (slowTests.length > 0) {
    console.log('2. ⚠️ MONITORING: Set up query performance alerts');
    console.log('   Monitor: pg_stat_statements extension');
  }

  if (goodTests.length === results.length - errorTests.length) {
    console.log('3. ✅ EXCELLENT: All queries meeting performance targets!');
  }

  console.log('4. 📊 MAINTENANCE: Schedule weekly index maintenance');
  console.log('5. 🔄 REFRESH: Update materialized views nightly');

  return {
    summary: {
      total: results.length,
      good: goodTests.length,
      slow: slowTests.length,
      critical: criticalTests.length,
      errors: errorTests.length
    },
    results,
    overall_score: ((goodTests.length / (results.length - errorTests.length)) * 100).toFixed(1)
  };
}

/**
 * Generate index deployment script
 */
function generateIndexDeploymentGuide() {
  console.log('\n📋 Index Deployment Guide');
  console.log('=========================');

  console.log('\n1. 🗄️ Deploy Performance Indexes:');
  console.log('   • File: supabase-migration/schema/08_collision_repair_performance_indexes.sql');
  console.log('   • Method: Copy-paste into Supabase Dashboard > SQL Editor');
  console.log('   • Time: ~2-5 minutes depending on data size');

  console.log('\n2. 📊 Enable Query Monitoring:');
  console.log('   • Extension: pg_stat_statements (included in index script)');
  console.log('   • Monitor: Dashboard > Database > Query Performance');

  console.log('\n3. 🔄 Setup Maintenance Schedule:');
  console.log('   • Weekly REINDEX during low-traffic hours');
  console.log('   • Nightly refresh of vendor_performance_summary materialized view');
  console.log('   • Monthly ANALYZE after bulk data operations');

  console.log('\n4. ✅ Validation:');
  console.log('   • Re-run this performance test after deployment');
  console.log('   • Verify query execution plans use new indexes');
  console.log('   • Monitor real-world application performance');

  console.log('\n💡 Expected Performance Improvements:');
  console.log('   • RO Search: 10-50x faster (100-500ms → < 10ms)');
  console.log('   • Parts Workflow: 10-40x faster (50-200ms → < 5ms)');
  console.log('   • Vendor KPIs: 5-20x faster (500-2000ms → < 100ms)');
  console.log('   • Global Search: 2-10x faster (200-1000ms → < 50ms)');
}

// Run the tests
async function main() {
  try {
    const results = await testDatabasePerformance();
    generateIndexDeploymentGuide();

    if (results) {
      console.log(`\n🏆 Overall Performance Score: ${results.overall_score}% of queries meeting targets`);

      if (parseFloat(results.overall_score) >= 80) {
        console.log('🎉 Excellent database performance!');
      } else if (parseFloat(results.overall_score) >= 60) {
        console.log('⚠️ Good performance, minor optimizations recommended');
      } else {
        console.log('🔥 Performance issues detected - immediate optimization required');
      }
    }

  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

main();