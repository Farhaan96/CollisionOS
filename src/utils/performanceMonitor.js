// Performance monitoring utilities for CollisionOS Dashboard
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  // Start timing a performance metric
  startTiming(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    });
  }

  // End timing and calculate duration
  endTiming(name) {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    return metric.duration;
  }

  // Get timing results
  getMetric(name) {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics() {
    const results = {};
    for (const [name, metric] of this.metrics) {
      results[name] = {
        duration: metric.duration,
        startTime: metric.startTime,
        endTime: metric.endTime,
      };
    }
    return results;
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Monitor component render times
  measureRender(componentName, renderFunction) {
    this.startTiming(`${componentName}-render`);
    const result = renderFunction();
    this.endTiming(`${componentName}-render`);
    return result;
  }

  // Monitor API call performance
  async measureAPICall(apiName, apiFunction) {
    this.startTiming(`${apiName}-api`);
    try {
      const result = await apiFunction();
      this.endTiming(`${apiName}-api`);
      return result;
    } catch (error) {
      this.endTiming(`${apiName}-api`);
      throw error;
    }
  }

  // Monitor memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }

  // Start performance observer for tracking specific metrics
  startObserver(entryTypes = ['measure', 'navigation']) {
    if (!window.PerformanceObserver) return null;

    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        console.log(
          `Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`
        );
      });
    });

    try {
      observer.observe({ entryTypes });
      this.observers.push(observer);
      return observer;
    } catch (e) {
      console.warn(
        'Performance Observer not supported for entry types:',
        entryTypes
      );
      return null;
    }
  }

  // Stop all observers
  stopObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getAllMetrics();
    const memory = this.getMemoryUsage();

    console.group('🚀 CollisionOS Performance Report');

    // Component render times
    const renderMetrics = Object.entries(metrics)
      .filter(([name]) => name.includes('-render'))
      .sort(([, a], [, b]) => b.duration - a.duration);

    if (renderMetrics.length) {
      console.group('⚡ Component Render Times');
      renderMetrics.forEach(([name, metric]) => {
        const componentName = name.replace('-render', '');
        const status =
          metric.duration < 16 ? '✅' : metric.duration < 50 ? '⚠️' : '❌';
        console.log(
          `${status} ${componentName}: ${metric.duration.toFixed(2)}ms`
        );
      });
      console.groupEnd();
    }

    // API call times
    const apiMetrics = Object.entries(metrics)
      .filter(([name]) => name.includes('-api'))
      .sort(([, a], [, b]) => b.duration - a.duration);

    if (apiMetrics.length) {
      console.group('🌐 API Call Times');
      apiMetrics.forEach(([name, metric]) => {
        const apiName = name.replace('-api', '');
        const status =
          metric.duration < 100 ? '✅' : metric.duration < 500 ? '⚠️' : '❌';
        console.log(`${status} ${apiName}: ${metric.duration.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    // Memory usage
    if (memory) {
      console.group('💾 Memory Usage');
      console.log(
        `Used: ${memory.used}MB / Total: ${memory.total}MB (${((memory.used / memory.total) * 100).toFixed(1)}%)`
      );
      console.log(`Limit: ${memory.limit}MB`);

      if (memory.used / memory.limit > 0.8) {
        console.warn('⚠️ High memory usage detected');
      }
      console.groupEnd();
    }

    // Performance recommendations
    console.group('💡 Recommendations');

    const slowRenders = renderMetrics.filter(
      ([, metric]) => metric.duration > 50
    );
    if (slowRenders.length) {
      console.warn(
        `Consider optimizing ${slowRenders.length} slow components (>50ms)`
      );
    }

    const slowAPIs = apiMetrics.filter(([, metric]) => metric.duration > 500);
    if (slowAPIs.length) {
      console.warn(
        `Consider optimizing ${slowAPIs.length} slow API calls (>500ms)`
      );
    }

    if (memory && memory.used > 100) {
      console.warn(
        'Memory usage is high, consider implementing virtualization for large lists'
      );
    }

    console.groupEnd();
    console.groupEnd();

    return {
      metrics,
      memory,
      recommendations: {
        slowRenders: slowRenders.length,
        slowAPIs: slowAPIs.length,
        highMemory: memory && memory.used > 100,
      },
    };
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureAPICall: performanceMonitor.measureAPICall.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor),
  };
};

export default performanceMonitor;
