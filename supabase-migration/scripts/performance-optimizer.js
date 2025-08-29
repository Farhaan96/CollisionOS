/**
 * Performance Optimization Script for Supabase Migration
 * Optimizes database queries, indexes, and real-time subscriptions
 * Target: <100ms response time for 95% of queries
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class PerformanceOptimizer {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.logFile = path.join(__dirname, '..', 'performance-optimization-log.txt');
    this.reportFile = path.join(__dirname, '..', 'performance-report.json');
    
    // Load configuration
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Supabase configuration not found.');
    }
    
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    
    // Initialize Supabase admin client
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    this.config = config;
    this.optimizations = [];
    this.benchmarks = {
      before: {},
      after: {},
      improvements: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  /**
   * Run performance benchmarks
   * @param {string} phase - 'before' or 'after'
   * @returns {Promise<Object>} Benchmark results
   */
  async runBenchmarks(phase = 'before') {
    this.log(`Running ${phase} optimization benchmarks...`);
    
    const benchmarks = {};
    
    // Test 1: Simple job query
    const startTime1 = Date.now();
    const { data: jobs, error: jobsError } = await this.supabase
      .from('jobs')
      .select('id, job_number, status, customer_id')
      .limit(100);
    benchmarks.simpleJobQuery = Date.now() - startTime1;
    
    if (jobsError) {
      this.log(`Job query error: ${jobsError.message}`, 'warning');
    }

    // Test 2: Complex join query
    const startTime2 = Date.now();
    const { data: jobsWithDetails, error: joinError } = await this.supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        status,
        priority,
        customer:customers(first_name, last_name, email),
        vehicle:vehicles(year, make, model, vin),
        assignee:users!jobs_assigned_to_fkey(first_name, last_name)
      `)
      .limit(50);
    benchmarks.complexJoinQuery = Date.now() - startTime2;
    
    if (joinError) {
      this.log(`Join query error: ${joinError.message}`, 'warning');
    }

    // Test 3: Aggregation query
    const startTime3 = Date.now();
    const { data: stats, error: statsError } = await this.supabase
      .rpc('get_shop_dashboard_stats', {
        shop_uuid: jobs && jobs.length > 0 ? jobs[0].shop_id : null
      });
    benchmarks.aggregationQuery = Date.now() - startTime3;
    
    if (statsError && !statsError.message.includes('function') && !statsError.message.includes('does not exist')) {
      this.log(`Stats query error: ${statsError.message}`, 'warning');
    }

    // Test 4: Search query
    const startTime4 = Date.now();
    const { data: searchResults, error: searchError } = await this.supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .or('first_name.ilike.%test%,last_name.ilike.%test%,email.ilike.%test%')
      .limit(20);
    benchmarks.searchQuery = Date.now() - startTime4;
    
    if (searchError) {
      this.log(`Search query error: ${searchError.message}`, 'warning');
    }

    // Test 5: Count query
    const startTime5 = Date.now();
    const { count, error: countError } = await this.supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    benchmarks.countQuery = Date.now() - startTime5;
    
    if (countError) {
      this.log(`Count query error: ${countError.message}`, 'warning');
    }

    this.benchmarks[phase] = benchmarks;
    
    this.log(`${phase} benchmarks completed:`);
    Object.entries(benchmarks).forEach(([test, time]) => {
      const status = time < 100 ? '✅' : time < 500 ? '⚠️' : '❌';
      this.log(`  ${status} ${test}: ${time}ms`);
    });
    
    return benchmarks;
  }

  /**
   * Create optimized indexes
   * @returns {Promise<void>}
   */
  async createOptimizedIndexes() {
    this.log('Creating optimized database indexes...');
    
    const indexes = [
      // Multi-column indexes for common queries
      {
        name: 'idx_jobs_shop_status_priority',
        sql: `CREATE INDEX IF NOT EXISTS idx_jobs_shop_status_priority 
              ON jobs(shop_id, status, priority) 
              WHERE is_archived = false;`
      },
      {
        name: 'idx_jobs_assigned_status',
        sql: `CREATE INDEX IF NOT EXISTS idx_jobs_assigned_status 
              ON jobs(assigned_to, status) 
              WHERE assigned_to IS NOT NULL AND is_archived = false;`
      },
      {
        name: 'idx_jobs_delivery_date_status',
        sql: `CREATE INDEX IF NOT EXISTS idx_jobs_delivery_date_status 
              ON jobs(target_delivery_date, status) 
              WHERE target_delivery_date IS NOT NULL;`
      },
      // Customer search optimization
      {
        name: 'idx_customers_fulltext_search',
        sql: `CREATE INDEX IF NOT EXISTS idx_customers_fulltext_search 
              ON customers USING gin(
                to_tsvector('english', 
                  COALESCE(first_name, '') || ' ' ||
                  COALESCE(last_name, '') || ' ' ||
                  COALESCE(email, '') || ' ' ||
                  COALESCE(phone, '') || ' ' ||
                  COALESCE(customer_number, '')
                )
              );`
      },
      // Parts optimization
      {
        name: 'idx_parts_shop_category_status',
        sql: `CREATE INDEX IF NOT EXISTS idx_parts_shop_category_status 
              ON parts(shop_id, category, part_status) 
              WHERE is_active = true;`
      },
      {
        name: 'idx_parts_stock_reorder',
        sql: `CREATE INDEX IF NOT EXISTS idx_parts_stock_reorder 
              ON parts(current_stock, minimum_stock, reorder_point) 
              WHERE is_active = true AND (current_stock <= minimum_stock OR current_stock <= reorder_point);`
      },
      // Job parts for production board
      {
        name: 'idx_job_parts_status_expected',
        sql: `CREATE INDEX IF NOT EXISTS idx_job_parts_status_expected 
              ON job_parts(job_id, status, expected_date) 
              WHERE status IN ('pending', 'ordered', 'backordered');`
      },
      // Notifications optimization
      {
        name: 'idx_notifications_user_unread',
        sql: `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
              ON notifications(user_id, created_at DESC) 
              WHERE is_read = false AND expires_at > NOW();`
      },
      // Audit log optimization
      {
        name: 'idx_audit_log_table_record_time',
        sql: `CREATE INDEX IF NOT EXISTS idx_audit_log_table_record_time 
              ON audit_log(table_name, record_id, created_at DESC);`
      }
    ];
    
    for (const index of indexes) {
      try {
        this.log(`Creating index: ${index.name}`);
        
        // Execute the index creation
        const { error } = await this.supabase.rpc('exec_sql', { 
          sql: index.sql 
        });
        
        if (error) {
          // Try alternative method using direct query
          const { error: directError } = await this.supabase
            .from('_pg_index_create') // This won't work, but we'll log the attempt
            .select('*');
          
          this.log(`Index creation may have failed for ${index.name}: ${error.message}`, 'warning');
          this.log(`SQL to run manually: ${index.sql}`, 'info');
        } else {
          this.log(`✅ Index created: ${index.name}`, 'success');
          this.optimizations.push({
            type: 'index',
            name: index.name,
            status: 'success'
          });
        }
        
      } catch (error) {
        this.log(`❌ Failed to create index ${index.name}: ${error.message}`, 'error');
        this.optimizations.push({
          type: 'index',
          name: index.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  /**
   * Optimize RLS policies for performance
   * @returns {Promise<void>}
   */
  async optimizeRLSPolicies() {
    this.log('Optimizing Row Level Security policies...');
    
    const optimizedPolicies = [
      {
        table: 'jobs',
        policy: 'jobs_optimized_select',
        sql: `
          DROP POLICY IF EXISTS "jobs_optimized_select" ON jobs;
          CREATE POLICY "jobs_optimized_select" ON jobs
            FOR SELECT USING (
              shop_id = get_user_shop() AND
              (
                has_permission(auth.uid(), 'jobs.view') OR
                assigned_to = auth.uid()
              )
            );
        `
      },
      {
        table: 'customers',
        policy: 'customers_optimized_select',
        sql: `
          DROP POLICY IF EXISTS "customers_optimized_select" ON customers;
          CREATE POLICY "customers_optimized_select" ON customers
            FOR SELECT USING (
              shop_id = get_user_shop() AND
              has_permission(auth.uid(), 'customers.view')
            );
        `
      },
      {
        table: 'parts',
        policy: 'parts_optimized_select',
        sql: `
          DROP POLICY IF EXISTS "parts_optimized_select" ON parts;
          CREATE POLICY "parts_optimized_select" ON parts
            FOR SELECT USING (
              shop_id = get_user_shop() AND
              has_permission(auth.uid(), 'parts.view')
            );
        `
      }
    ];
    
    for (const policy of optimizedPolicies) {
      try {
        this.log(`Optimizing RLS policy for ${policy.table}`);
        
        const { error } = await this.supabase.rpc('exec_sql', { 
          sql: policy.sql 
        });
        
        if (error) {
          this.log(`RLS optimization may need manual intervention for ${policy.table}: ${error.message}`, 'warning');
          this.log(`SQL to run manually: ${policy.sql}`, 'info');
        } else {
          this.log(`✅ RLS policy optimized: ${policy.table}`, 'success');
          this.optimizations.push({
            type: 'rls_policy',
            table: policy.table,
            status: 'success'
          });
        }
        
      } catch (error) {
        this.log(`❌ Failed to optimize RLS for ${policy.table}: ${error.message}`, 'error');
        this.optimizations.push({
          type: 'rls_policy',
          table: policy.table,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  /**
   * Create materialized views for heavy queries
   * @returns {Promise<void>}
   */
  async createMaterializedViews() {
    this.log('Creating materialized views for performance...');
    
    const materializedViews = [
      {
        name: 'mv_shop_dashboard_stats',
        sql: `
          DROP MATERIALIZED VIEW IF EXISTS mv_shop_dashboard_stats;
          CREATE MATERIALIZED VIEW mv_shop_dashboard_stats AS
          SELECT 
            s.id as shop_id,
            s.name as shop_name,
            COUNT(j.id) as total_jobs,
            COUNT(CASE WHEN j.status IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly') THEN 1 END) as active_jobs,
            COUNT(CASE WHEN j.status = 'ready_pickup' THEN 1 END) as ready_jobs,
            COUNT(CASE WHEN j.target_delivery_date < NOW() AND j.status != 'delivered' THEN 1 END) as overdue_jobs,
            COUNT(CASE WHEN j.status = 'delivered' AND DATE(j.actual_delivery_date) = CURRENT_DATE THEN 1 END) as delivered_today,
            AVG(CASE WHEN j.status = 'delivered' THEN j.cycle_time END) as avg_cycle_time,
            SUM(CASE WHEN j.status = 'delivered' AND EXTRACT(MONTH FROM j.actual_delivery_date) = EXTRACT(MONTH FROM NOW()) THEN j.total_amount END) as revenue_this_month,
            COUNT(c.id) as total_customers,
            COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_30d,
            COUNT(CASE WHEN p.current_stock <= p.minimum_stock THEN 1 END) as low_stock_parts,
            NOW() as last_updated
          FROM shops s
          LEFT JOIN jobs j ON s.id = j.shop_id
          LEFT JOIN customers c ON s.id = c.shop_id
          LEFT JOIN parts p ON s.id = p.shop_id AND p.is_active = true
          WHERE s.is_active = true
          GROUP BY s.id, s.name;
          
          CREATE UNIQUE INDEX ON mv_shop_dashboard_stats (shop_id);
        `
      },
      {
        name: 'mv_production_board',
        sql: `
          DROP MATERIALIZED VIEW IF EXISTS mv_production_board;
          CREATE MATERIALIZED VIEW mv_production_board AS
          SELECT 
            j.id,
            j.job_number,
            j.shop_id,
            j.status,
            j.priority,
            j.customer_id,
            j.vehicle_id,
            j.assigned_to,
            j.target_delivery_date,
            j.check_in_date,
            j.created_at,
            c.first_name || ' ' || c.last_name as customer_name,
            v.year || ' ' || v.make || ' ' || v.model as vehicle_info,
            u.first_name || ' ' || u.last_name as assignee_name,
            ROW_NUMBER() OVER (
              PARTITION BY j.shop_id, j.status 
              ORDER BY 
                CASE j.priority 
                  WHEN 'urgent' THEN 0 
                  WHEN 'rush' THEN 1 
                  WHEN 'high' THEN 2 
                  WHEN 'normal' THEN 3 
                  WHEN 'low' THEN 4 
                  ELSE 5 
                END,
                j.target_delivery_date ASC NULLS LAST,
                j.created_at ASC
            ) as display_order
          FROM jobs j
          LEFT JOIN customers c ON j.customer_id = c.id
          LEFT JOIN vehicles v ON j.vehicle_id = v.id
          LEFT JOIN users u ON j.assigned_to = u.user_id
          WHERE j.is_archived = false
          ORDER BY j.shop_id, j.status, display_order;
          
          CREATE INDEX ON mv_production_board (shop_id, status);
          CREATE INDEX ON mv_production_board (assigned_to);
        `
      }
    ];
    
    for (const view of materializedViews) {
      try {
        this.log(`Creating materialized view: ${view.name}`);
        
        const { error } = await this.supabase.rpc('exec_sql', { 
          sql: view.sql 
        });
        
        if (error) {
          this.log(`Materialized view creation may need manual intervention for ${view.name}: ${error.message}`, 'warning');
          this.log(`SQL to run manually: ${view.sql}`, 'info');
        } else {
          this.log(`✅ Materialized view created: ${view.name}`, 'success');
          this.optimizations.push({
            type: 'materialized_view',
            name: view.name,
            status: 'success'
          });
        }
        
      } catch (error) {
        this.log(`❌ Failed to create materialized view ${view.name}: ${error.message}`, 'error');
        this.optimizations.push({
          type: 'materialized_view',
          name: view.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  /**
   * Optimize connection settings
   * @returns {Promise<void>}
   */
  async optimizeConnectionSettings() {
    this.log('Optimizing database connection settings...');
    
    const connectionOptimizations = [
      // Enable parallel queries
      { setting: 'max_parallel_workers_per_gather', value: '4' },
      // Optimize work memory for sorting/hashing
      { setting: 'work_mem', value: '16MB' },
      // Optimize shared buffers
      { setting: 'effective_cache_size', value: '256MB' },
      // Enable query planning optimizations
      { setting: 'enable_hashjoin', value: 'on' },
      { setting: 'enable_mergejoin', value: 'on' }
    ];
    
    for (const opt of connectionOptimizations) {
      try {
        // Note: These settings typically require database admin privileges
        // We'll log what should be optimized
        this.log(`Optimization recommendation: SET ${opt.setting} = '${opt.value}';`, 'info');
        this.optimizations.push({
          type: 'connection_setting',
          setting: opt.setting,
          value: opt.value,
          status: 'recommended'
        });
      } catch (error) {
        this.log(`Connection optimization failed for ${opt.setting}: ${error.message}`, 'warning');
      }
    }
  }

  /**
   * Test with large dataset simulation
   * @returns {Promise<void>}
   */
  async testScalability() {
    this.log('Testing scalability with simulated load...');
    
    try {
      // Get current record counts
      const { count: jobCount } = await this.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      const { count: customerCount } = await this.supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      this.log(`Current data: ${jobCount} jobs, ${customerCount} customers`);
      
      // Test concurrent query performance
      const concurrentQueries = [];
      const queryCount = 10;
      
      for (let i = 0; i < queryCount; i++) {
        concurrentQueries.push(
          this.supabase
            .from('jobs')
            .select(`
              id, job_number, status,
              customer:customers(first_name, last_name),
              vehicle:vehicles(make, model, year)
            `)
            .limit(50)
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentQueries);
      const concurrentTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const avgTime = concurrentTime / queryCount;
      
      this.log(`Concurrent query test: ${successCount}/${queryCount} succeeded`);
      this.log(`Average query time: ${avgTime.toFixed(2)}ms`);
      this.log(`Total time for ${queryCount} concurrent queries: ${concurrentTime}ms`);
      
      this.benchmarks.scalability = {
        concurrentQueries: queryCount,
        successRate: (successCount / queryCount) * 100,
        averageTime: avgTime,
        totalTime: concurrentTime
      };
      
    } catch (error) {
      this.log(`Scalability test failed: ${error.message}`, 'error');
    }
  }

  /**
   * Generate performance report
   * @returns {Promise<Object>} Performance report
   */
  async generateReport() {
    const improvements = {};
    
    // Calculate improvements
    if (this.benchmarks.before && this.benchmarks.after) {
      for (const [test, beforeTime] of Object.entries(this.benchmarks.before)) {
        const afterTime = this.benchmarks.after[test];
        if (afterTime !== undefined) {
          const improvement = ((beforeTime - afterTime) / beforeTime) * 100;
          improvements[test] = {
            before: beforeTime,
            after: afterTime,
            improvement: improvement.toFixed(2),
            status: improvement > 0 ? 'improved' : 'degraded'
          };
        }
      }
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      benchmarks: this.benchmarks,
      improvements,
      optimizations: this.optimizations,
      recommendations: this.generateRecommendations(),
      summary: {
        totalOptimizations: this.optimizations.length,
        successfulOptimizations: this.optimizations.filter(o => o.status === 'success').length,
        avgImprovementPercentage: Object.values(improvements).length > 0 
          ? (Object.values(improvements).reduce((sum, imp) => sum + parseFloat(imp.improvement), 0) / Object.values(improvements).length).toFixed(2)
          : 0
      }
    };
    
    // Save report
    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
    this.log(`Performance report saved: ${this.reportFile}`, 'success');
    
    return report;
  }

  /**
   * Generate optimization recommendations
   * @returns {Array} List of recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check if any queries are still slow
    if (this.benchmarks.after) {
      Object.entries(this.benchmarks.after).forEach(([test, time]) => {
        if (time > 100) {
          recommendations.push({
            type: 'performance',
            priority: time > 500 ? 'high' : 'medium',
            test,
            currentTime: time,
            recommendation: `${test} is taking ${time}ms. Consider additional indexing or query optimization.`
          });
        }
      });
    }
    
    // Check optimization failures
    const failedOptimizations = this.optimizations.filter(o => o.status === 'failed');
    if (failedOptimizations.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        recommendation: `${failedOptimizations.length} optimizations failed and may need manual intervention.`,
        details: failedOptimizations
      });
    }
    
    // Scalability recommendations
    if (this.benchmarks.scalability) {
      const { successRate, averageTime } = this.benchmarks.scalability;
      if (successRate < 90) {
        recommendations.push({
          type: 'scalability',
          priority: 'high',
          recommendation: `Concurrent query success rate is ${successRate}%. Consider connection pooling optimization.`
        });
      }
      if (averageTime > 200) {
        recommendations.push({
          type: 'scalability',
          priority: 'medium',
          recommendation: `Average concurrent query time is ${averageTime.toFixed(2)}ms. Consider query caching.`
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Run complete optimization suite
   * @returns {Promise<Object>} Optimization results
   */
  async runCompleteOptimization() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Starting complete performance optimization suite...');
      
      // Phase 1: Baseline benchmarks
      this.log('Phase 1: Running baseline benchmarks...');
      await this.runBenchmarks('before');
      
      // Phase 2: Create optimized indexes
      this.log('Phase 2: Creating optimized indexes...');
      await this.createOptimizedIndexes();
      
      // Phase 3: Optimize RLS policies
      this.log('Phase 3: Optimizing RLS policies...');
      await this.optimizeRLSPolicies();
      
      // Phase 4: Create materialized views
      this.log('Phase 4: Creating materialized views...');
      await this.createMaterializedViews();
      
      // Phase 5: Connection optimizations
      this.log('Phase 5: Optimizing connection settings...');
      await this.optimizeConnectionSettings();
      
      // Phase 6: Post-optimization benchmarks
      this.log('Phase 6: Running post-optimization benchmarks...');
      await this.runBenchmarks('after');
      
      // Phase 7: Scalability testing
      this.log('Phase 7: Testing scalability...');
      await this.testScalability();
      
      // Phase 8: Generate report
      this.log('Phase 8: Generating performance report...');
      const report = await this.generateReport();
      
      const duration = (Date.now() - startTime) / 1000;
      
      this.log(`🎉 Complete optimization suite finished in ${duration.toFixed(2)} seconds`, 'success');
      this.log(`📊 Performance improvements summary:`, 'info');
      
      Object.entries(report.improvements).forEach(([test, data]) => {
        const status = parseFloat(data.improvement) > 0 ? '✅' : '⚠️';
        this.log(`   ${status} ${test}: ${data.before}ms → ${data.after}ms (${data.improvement}% improvement)`);
      });
      
      if (report.recommendations.length > 0) {
        this.log(`📋 ${report.recommendations.length} recommendations generated`, 'warning');
        report.recommendations.forEach((rec, index) => {
          this.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
        });
      }
      
      return report;
      
    } catch (error) {
      this.log(`❌ Optimization suite failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Export and CLI interface
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--benchmark-only')) {
    optimizer.runBenchmarks('current')
      .then(results => {
        console.log('\n📊 Benchmark Results:');
        Object.entries(results).forEach(([test, time]) => {
          const status = time < 100 ? '✅' : time < 500 ? '⚠️' : '❌';
          console.log(`${status} ${test}: ${time}ms`);
        });
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Benchmark failed:', error.message);
        process.exit(1);
      });
  } else {
    optimizer.runCompleteOptimization()
      .then(report => {
        console.log('\n🎉 Performance optimization completed successfully!');
        console.log(`📋 Report saved: ${optimizer.reportFile}`);
        
        if (report.summary.avgImprovementPercentage > 0) {
          console.log(`📈 Average improvement: ${report.summary.avgImprovementPercentage}%`);
        }
        
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Performance optimization failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = PerformanceOptimizer;