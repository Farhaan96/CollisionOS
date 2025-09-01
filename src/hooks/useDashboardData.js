import { useState, useEffect, useCallback, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useDebounce } from './useDebounce';

export const useDashboardData = (
  timeframe = 'month',
  refreshInterval = 30000
) => {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Debounce timeframe changes to prevent excessive API calls
  const debouncedTimeframe = useDebounce(timeframe, 300);

  // Memoize the fetch functions to prevent unnecessary re-renders
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const dashboardData =
        await dashboardService.getDashboardData(debouncedTimeframe);
      setData(dashboardData);
      setLastRefresh(Date.now());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err);
    }
  }, [debouncedTimeframe]);

  const fetchAlerts = useCallback(async () => {
    try {
      const alertsData = await dashboardService.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, []);

  // Manual refresh function for user-triggered updates
  const refresh = useCallback(async () => {
    setLoading(true);
    dashboardService.clearCache(); // Clear cache for fresh data
    await Promise.all([fetchDashboardData(), fetchAlerts()]);
    setLoading(false);
  }, [fetchDashboardData, fetchAlerts]);

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchAlerts()]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchDashboardData, fetchAlerts]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Only fetch new data, don't show loading state for background refresh
      Promise.all([fetchDashboardData(), fetchAlerts()]);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchAlerts, refreshInterval]);

  // Memoize computed values to prevent unnecessary recalculations
  const stats = useMemo(() => {
    if (!data) return null;

    return {
      totalRevenue: data.kpis?.revenue || 0,
      activeJobs: data.kpis?.jobsInProgress || 0,
      avgCycleTime: data.kpis?.avgCycleTime || 0,
      customerSatisfaction: data.kpis?.customerSatisfaction || 0,
      laborEfficiency: data.efficiencyStats?.laborEfficiency || 0,
      partsEfficiency: data.efficiencyStats?.partsEfficiency || 0,
      bayUtilization: data.efficiencyStats?.bayUtilization || 0,
    };
  }, [data]);

  const alertStats = useMemo(() => {
    if (!alerts.length) return { total: 0, critical: 0, warnings: 0 };

    return {
      total: alerts.length,
      critical: alerts.filter(alert => alert.type === 'error').length,
      warnings: alerts.filter(alert => alert.type === 'warning').length,
    };
  }, [alerts]);

  return {
    data,
    alerts,
    stats,
    alertStats,
    loading,
    error,
    lastRefresh,
    refresh,
    isStale: Date.now() - lastRefresh > refreshInterval * 2, // Data is considered stale if not refreshed in 2x interval
  };
};

export default useDashboardData;
