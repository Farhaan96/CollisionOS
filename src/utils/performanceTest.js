// Simple performance testing utility for Dashboard components
import { render, screen } from '@testing-library/react';
import performanceMonitor from './performanceMonitor';

// Mock data for testing
const mockDashboardData = {
  kpis: {
    revenue: 123456,
    jobsInProgress: 12,
    avgCycleTime: 6.2,
    customerSatisfaction: 95,
  },
  productionStats: {
    total: 24,
    estimate: 3,
    inProgress: 12,
    qualityCheck: 2,
    readyPickup: 1,
  },
};

const mockJobs = [
  {
    id: '1',
    jobNumber: 'JOB-001',
    customerName: 'John Doe',
    status: 'estimate',
  },
  {
    id: '2',
    jobNumber: 'JOB-002',
    customerName: 'Jane Smith',
    status: 'in_progress',
  },
  {
    id: '3',
    jobNumber: 'JOB-003',
    customerName: 'Bob Wilson',
    status: 'ready_pickup',
  },
];

const mockAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Parts Overdue',
    message: '2 parts overdue',
  },
  { id: 2, type: 'error', title: 'Job Overdue', message: 'One job overdue' },
];

// Performance test suite
export const runPerformanceTests = async () => {
  console.log('🚀 Starting Dashboard Performance Tests...');

  const results = {};

  try {
    // Test 1: Component Render Performance
    console.log('\n📊 Testing Component Render Performance...');

    // Import components dynamically to measure import time
    performanceMonitor.startTiming('component-imports');
    const { KPIChart } = await import('../components/Dashboard/KPIChart');
    const { RecentJobs } = await import('../components/Dashboard/RecentJobs');
    const { AlertsPanel } = await import('../components/Dashboard/AlertsPanel');
    performanceMonitor.endTiming('component-imports');

    // Test KPIChart render performance
    performanceMonitor.startTiming('KPIChart-render');
    const kpiChartData = [
      { label: 'Jan', value: 1000 },
      { label: 'Feb', value: 1200 },
      { label: 'Mar', value: 900 },
    ];
    render(<KPIChart data={kpiChartData} type='line' />);
    results.kpiChart = performanceMonitor.endTiming('KPIChart-render');

    // Test RecentJobs render performance
    performanceMonitor.startTiming('RecentJobs-render');
    render(<RecentJobs jobs={mockJobs} />);
    results.recentJobs = performanceMonitor.endTiming('RecentJobs-render');

    // Test AlertsPanel render performance
    performanceMonitor.startTiming('AlertsPanel-render');
    render(<AlertsPanel alerts={mockAlerts} />);
    results.alertsPanel = performanceMonitor.endTiming('AlertsPanel-render');

    // Test 2: Memory Usage
    console.log('\n💾 Testing Memory Usage...');
    const memoryBefore = performanceMonitor.getMemoryUsage();

    // Render multiple instances to test memory efficiency
    for (let i = 0; i < 10; i++) {
      render(<RecentJobs jobs={mockJobs} />);
      render(<AlertsPanel alerts={mockAlerts} />);
    }

    const memoryAfter = performanceMonitor.getMemoryUsage();
    results.memoryDiff = memoryAfter ? memoryAfter.used - memoryBefore.used : 0;

    // Test 3: Re-render Performance
    console.log('\n🔄 Testing Re-render Performance...');
    performanceMonitor.startTiming('re-render-test');

    const { rerender } = render(<RecentJobs jobs={mockJobs} />);

    // Simulate prop changes
    for (let i = 0; i < 5; i++) {
      rerender(
        <RecentJobs
          jobs={[
            ...mockJobs,
            {
              id: `${i}`,
              jobNumber: `JOB-${i}`,
              customerName: `Test ${i}`,
              status: 'estimate',
            },
          ]}
        />
      );
    }

    results.reRender = performanceMonitor.endTiming('re-render-test');

    // Test 4: Service Performance
    console.log('\n🌐 Testing Service Performance...');
    const { dashboardService } = await import('../services/dashboardService');

    // Test cold call (no cache)
    performanceMonitor.startTiming('service-cold-call');
    await dashboardService.getDashboardData('month');
    results.serviceCold = performanceMonitor.endTiming('service-cold-call');

    // Test warm call (with cache)
    performanceMonitor.startTiming('service-warm-call');
    await dashboardService.getDashboardData('month');
    results.serviceWarm = performanceMonitor.endTiming('service-warm-call');

    // Generate final report
    console.log('\n📈 Performance Test Results:');
    console.table({
      'Component Import': `${performanceMonitor.getMetric('component-imports')?.duration.toFixed(2)}ms`,
      'KPIChart Render': `${results.kpiChart.toFixed(2)}ms`,
      'RecentJobs Render': `${results.recentJobs.toFixed(2)}ms`,
      'AlertsPanel Render': `${results.alertsPanel.toFixed(2)}ms`,
      'Re-render Test': `${results.reRender.toFixed(2)}ms`,
      'Service (Cold)': `${results.serviceCold.toFixed(2)}ms`,
      'Service (Warm)': `${results.serviceWarm.toFixed(2)}ms`,
      'Memory Difference': `${results.memoryDiff}MB`,
    });

    // Performance benchmarks
    const benchmarks = {
      renderTime:
        results.kpiChart < 50 &&
        results.recentJobs < 30 &&
        results.alertsPanel < 25,
      reRenderTime: results.reRender < 100,
      serviceCache: results.serviceWarm < 10,
      memoryUsage: results.memoryDiff < 20,
    };

    const passedBenchmarks = Object.values(benchmarks).filter(Boolean).length;
    const totalBenchmarks = Object.keys(benchmarks).length;

    console.log(
      `\n✅ Passed ${passedBenchmarks}/${totalBenchmarks} performance benchmarks`
    );

    if (passedBenchmarks === totalBenchmarks) {
      console.log('🎉 All performance benchmarks passed!');
    } else {
      console.log('⚠️ Some performance benchmarks need attention:');
      Object.entries(benchmarks).forEach(([key, passed]) => {
        if (!passed) {
          console.log(`  ❌ ${key} benchmark failed`);
        }
      });
    }

    return {
      results,
      benchmarks,
      passed: passedBenchmarks === totalBenchmarks,
    };
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { error: error.message };
  } finally {
    performanceMonitor.clear();
  }
};

// Automated performance regression testing
export const performanceRegressionTest = (baseline, current) => {
  const regressions = [];
  const improvements = [];

  Object.entries(baseline).forEach(([metric, baselineValue]) => {
    const currentValue = current[metric];
    if (
      currentValue &&
      typeof baselineValue === 'number' &&
      typeof currentValue === 'number'
    ) {
      const diff = ((currentValue - baselineValue) / baselineValue) * 100;

      if (diff > 20) {
        // More than 20% slower
        regressions.push({
          metric,
          diff: diff.toFixed(1),
          baseline: baselineValue,
          current: currentValue,
        });
      } else if (diff < -10) {
        // More than 10% faster
        improvements.push({
          metric,
          diff: Math.abs(diff).toFixed(1),
          baseline: baselineValue,
          current: currentValue,
        });
      }
    }
  });

  console.log('\n🔍 Performance Regression Analysis:');

  if (improvements.length > 0) {
    console.log('✅ Improvements:');
    improvements.forEach(({ metric, diff, baseline, current }) => {
      console.log(
        `  📈 ${metric}: ${diff}% faster (${baseline}ms → ${current}ms)`
      );
    });
  }

  if (regressions.length > 0) {
    console.log('❌ Regressions:');
    regressions.forEach(({ metric, diff, baseline, current }) => {
      console.log(
        `  📉 ${metric}: ${diff}% slower (${baseline}ms → ${current}ms)`
      );
    });
  }

  if (regressions.length === 0 && improvements.length === 0) {
    console.log('➡️ No significant changes in performance');
  }

  return { regressions, improvements };
};

export default { runPerformanceTests, performanceRegressionTest };
