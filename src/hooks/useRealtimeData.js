import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';

/**
 * Hook for managing real-time data with polling fallback
 * @param {string} dataType - Type of data (jobs, customers, etc.)
 * @param {Function} fetchFunction - Function to fetch data
 * @param {Object} options - Configuration options
 */
export const useRealtimeData = (dataType, fetchFunction, options = {}) => {
  const {
    pollingInterval = 5000,
    enablePolling = true,
    enableWebSocket = true,
    autoRefresh = true
  } = options;

  const realtime = useRealtime();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const pollingRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const result = await fetchFunction();
      if (isMountedRef.current) {
        setData(result);
        setLastFetch(new Date());
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
        console.error(`Error fetching ${dataType}:`, err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, dataType]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket subscription
  useEffect(() => {
    if (!realtime.connected || !enableWebSocket) return;

    const eventMap = {
      jobs: 'job_update',
      customers: 'customer_update',
      production: 'production_update',
      notifications: 'notification'
    };

    const event = eventMap[dataType];
    if (!event) return;

    const unsubscribe = realtime.subscribe(event, (updateData) => {
      console.log(`Real-time ${dataType} update:`, updateData);
      
      if (autoRefresh) {
        fetchData();
      } else {
        // Optimistic update based on event type
        setData(prevData => {
          if (updateData.eventType === 'INSERT') {
            return [...prevData, updateData.new];
          } else if (updateData.eventType === 'UPDATE') {
            return prevData.map(item => 
              item.id === updateData.new.id ? { ...item, ...updateData.new } : item
            );
          } else if (updateData.eventType === 'DELETE') {
            return prevData.filter(item => item.id !== updateData.old.id);
          }
          return prevData;
        });
      }
    });

    return unsubscribe;
  }, [realtime.connected, dataType, enableWebSocket, autoRefresh, fetchData]);

  // Polling fallback
  useEffect(() => {
    if (!enablePolling || !realtime.connected) return;

    pollingRef.current = setInterval(() => {
      console.log(`Polling ${dataType} data...`);
      fetchData();
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, pollingInterval, fetchData, dataType, realtime.connected]);

  // Manual refresh listener
  useEffect(() => {
    const handleManualRefresh = () => {
      console.log(`Manual refresh triggered for ${dataType}`);
      fetchData();
    };

    window.addEventListener('manualRefresh', handleManualRefresh);
    return () => window.removeEventListener('manualRefresh', handleManualRefresh);
  }, [fetchData, dataType]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Update specific item
  const updateItem = useCallback((id, updates) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  // Add new item
  const addItem = useCallback((newItem) => {
    setData(prevData => [...prevData, newItem]);
  }, []);

  // Remove item
  const removeItem = useCallback((id) => {
    setData(prevData => prevData.filter(item => item.id !== id));
  }, []);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    updateItem,
    addItem,
    removeItem,
    connected: realtime.connected,
    connectionStatus: realtime.getConnectionStatus()
  };
};

/**
 * Hook for real-time jobs data
 */
export const useRealtimeJobs = (fetchFunction, options = {}) => {
  return useRealtimeData('jobs', fetchFunction, {
    pollingInterval: 5000,
    enablePolling: true,
    enableWebSocket: true,
    autoRefresh: true,
    ...options
  });
};

/**
 * Hook for real-time customers data
 */
export const useRealtimeCustomers = (fetchFunction, options = {}) => {
  return useRealtimeData('customers', fetchFunction, {
    pollingInterval: 10000,
    enablePolling: true,
    enableWebSocket: true,
    autoRefresh: true,
    ...options
  });
};

/**
 * Hook for real-time production data
 */
export const useRealtimeProduction = (fetchFunction, options = {}) => {
  return useRealtimeData('production', fetchFunction, {
    pollingInterval: 3000,
    enablePolling: true,
    enableWebSocket: true,
    autoRefresh: true,
    ...options
  });
};

export default useRealtimeData;
