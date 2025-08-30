// API base URL - adjust based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Simple in-memory cache for dashboard data
const dashboardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (method, params) => `${method}-${JSON.stringify(params)}`;
const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_DURATION;

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      ...options
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Dashboard API Error (${endpoint}):`, error);
    throw error;
  }
};

export const dashboardService = {
  // Get KPI metrics from database
  async getKPIs(timeframe = 'month') {
    const cacheKey = getCacheKey('getKPIs', { timeframe });
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall(`/dashboard/kpis?timeframe=${timeframe}`);
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn('API call failed, using fallback data:', error);
      return this.getFallbackKPIs();
    }
  },

  // Get production pipeline data
  async getProductionData() {
    const cacheKey = getCacheKey('getProductionData', {});
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall('/dashboard/production');
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Production API call failed, using fallback data:', error);
      return this.getFallbackProductionData();
    }
  },

  // Get revenue trend data
  async getRevenueTrend(timeframe = 'month') {
    const cacheKey = getCacheKey('getRevenueTrend', { timeframe });
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall(`/dashboard/revenue-trend?timeframe=${timeframe}`);
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Revenue trend API call failed, using fallback data:', error);
      return this.getFallbackRevenueTrend();
    }
  },

  // Get recent jobs
  async getRecentJobs(limit = 5) {
    const cacheKey = getCacheKey('getRecentJobs', { limit });
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall(`/dashboard/recent-jobs?limit=${limit}`);
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Recent jobs API call failed, using fallback data:', error);
      return this.getFallbackRecentJobs();
    }
  },

  // Get technician performance
  async getTechnicianPerformance(timeframe = 'month') {
    const cacheKey = getCacheKey('getTechnicianPerformance', { timeframe });
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall(`/dashboard/technician-performance?timeframe=${timeframe}`);
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Technician performance API call failed, using fallback data:', error);
      return this.getFallbackTechnicianData();
    }
  },

  // Get alerts
  async getAlerts() {
    const cacheKey = getCacheKey('getAlerts', {});
    const cached = dashboardCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await apiCall('/dashboard/alerts');
      
      // Cache the result
      dashboardCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Alerts API call failed, using fallback data:', error);
      return this.getFallbackAlerts();
    }
  },

  // Combined dashboard data method (legacy support)
  async getDashboardData(timeframe = 'month') {
    try {
      const [kpis, productionStats, revenueTrend, efficiencyStats] = await Promise.all([
        this.getKPIs(timeframe),
        this.getProductionData(),
        this.getRevenueTrend(timeframe),
        this.getTechnicianPerformance(timeframe)
      ]);

      return {
        kpis: {
          revenue: kpis.revenue?.current || 0,
          jobsInProgress: kpis.totalJobs?.inProgress || 0,
          avgCycleTime: kpis.cycleTime?.current || 0,
          customerSatisfaction: kpis.customerSatisfaction?.current || 0
        },
        productionStats: {
          total: productionStats.reduce((sum, item) => sum + item.count, 0),
          statusDistribution: productionStats
        },
        financialStats: { 
          revenueTrend 
        },
        efficiencyStats: { 
          laborEfficiency: kpis.laborEfficiency?.current || 0,
          partsEfficiency: 92, // Placeholder
          bayUtilization: 73 // Placeholder
        }
      };
    } catch (error) {
      console.error('Error fetching combined dashboard data:', error);
      return this.getFallbackDashboardData();
    }
  },

  // Refresh data by clearing cache
  async refreshData() {
    try {
      await apiCall('/dashboard/refresh', { method: 'POST' });
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      this.clearCache(); // Clear local cache anyway
      return false;
    }
  },

  // Clear cache method for manual refresh
  clearCache() {
    dashboardCache.clear();
  },

  // Get cache status for debugging
  getCacheStatus() {
    return {
      size: dashboardCache.size,
      keys: Array.from(dashboardCache.keys())
    };
  },

  // Fallback data methods for when API calls fail
  getFallbackKPIs() {
    return {
      revenue: { current: 123456, change: 8.5, trend: 'up' },
      totalJobs: { current: 24, completed: 12, inProgress: 12, change: 12.3 },
      cycleTime: { current: 6.8, change: -5.6, trend: 'up' },
      customerSatisfaction: { current: 4.2, change: 3.2, trend: 'up' },
      laborEfficiency: { current: 142.5, change: 12.3, trend: 'up' },
      revenuePerTech: { current: 11025, change: 8.7, trend: 'up' },
      averageRO: { current: 1850, change: 5.8, trend: 'up' },
      technicians: [
        { name: 'Mike Johnson', efficiency: 156, revenue: 12500 },
        { name: 'Sarah Davis', efficiency: 145, revenue: 11800 },
        { name: 'Tom Wilson', efficiency: 138, revenue: 10900 },
        { name: 'Lisa Brown', efficiency: 132, revenue: 9800 }
      ]
    };
  },

  getFallbackProductionData() {
    return [
      { status: 'Estimate', count: 8, color: '#3B82F6' },
      { status: 'Parts Ordered', count: 12, color: '#F59E0B' },
      { status: 'Body Work', count: 15, color: '#8B5CF6' },
      { status: 'Paint Prep', count: 6, color: '#06B6D4' },
      { status: 'Paint Booth', count: 4, color: '#EF4444' },
      { status: 'Assembly', count: 9, color: '#10B981' },
      { status: 'QC', count: 3, color: '#6366F1' },
      { status: 'Ready', count: 5, color: '#22C55E' }
    ];
  },

  getFallbackRevenueTrend() {
    return [
      { month: 'Jan', labor: 85000, parts: 45000, total: 130000 },
      { month: 'Feb', labor: 92000, parts: 48000, total: 140000 },
      { month: 'Mar', labor: 88000, parts: 52000, total: 140000 },
      { month: 'Apr', labor: 95000, parts: 55000, total: 150000 },
      { month: 'May', labor: 102000, parts: 58000, total: 160000 },
      { month: 'Jun', labor: 108000, parts: 62000, total: 170000 }
    ];
  },

  getFallbackRecentJobs() {
    return [
      { id: '2457', customer: 'John Smith', vehicle: '2020 Honda Civic', status: 'Body Work', value: 2847.50, days: 3 },
      { id: '2458', customer: 'Sarah Johnson', vehicle: '2019 Toyota Camry', status: 'Paint Prep', value: 1956.75, days: 1 },
      { id: '2459', customer: 'Mike Wilson', vehicle: '2021 Ford F-150', status: 'Estimate', value: 3420.00, days: 0 },
      { id: '2460', customer: 'Lisa Brown', vehicle: '2018 BMW 3-Series', status: 'Assembly', value: 4120.25, days: 5 },
      { id: '2461', customer: 'Tom Davis', vehicle: '2022 Chevrolet Silverado', status: 'QC', value: 2875.50, days: 6 }
    ];
  },

  getFallbackTechnicianData() {
    return [
      { name: 'Mike Johnson', efficiency: 156, revenue: 12500 },
      { name: 'Sarah Davis', efficiency: 145, revenue: 11800 },
      { name: 'Tom Wilson', efficiency: 138, revenue: 10900 },
      { name: 'Lisa Brown', efficiency: 132, revenue: 9800 }
    ];
  },

  getFallbackAlerts() {
    return [
      { id: 1, type: 'error', title: 'Parts Overdue', message: 'BMW 3-Series front bumper 3 days overdue', priority: 'high' },
      { id: 2, type: 'warning', title: 'Cycle Time Alert', message: 'Job #2457 exceeding target by 2 days', priority: 'medium' },
      { id: 3, type: 'info', title: 'Insurance Approval', message: 'Supplement approved for $1,245', priority: 'low' }
    ];
  },

  getFallbackDashboardData() {
    return {
      kpis: { 
        revenue: 123456, 
        jobsInProgress: 12, 
        avgCycleTime: 6.2, 
        customerSatisfaction: 95 
      },
      productionStats: { 
        total: 24, 
        statusDistribution: this.getFallbackProductionData()
      },
      financialStats: { 
        revenueTrend: this.getFallbackRevenueTrend()
      },
      efficiencyStats: { 
        laborEfficiency: 88, 
        partsEfficiency: 92, 
        bayUtilization: 73 
      }
    };
  }
};
