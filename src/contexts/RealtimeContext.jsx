import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Map());

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Realtime connected');
      setConnected(true);
      setLastUpdate(new Date());
    });

    newSocket.on('disconnect', () => {
      console.log('Realtime disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Realtime connection error:', error);
      setConnected(false);
    });

    // Listen for data updates
    newSocket.on('job_update', (data) => {
      console.log('Job update received:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('jobUpdated', { detail: data }));
    });

    newSocket.on('customer_update', (data) => {
      console.log('Customer update received:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('customerUpdated', { detail: data }));
    });

    newSocket.on('jobs_imported', (data) => {
      console.log('Jobs imported:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('jobsImported', { detail: data }));
    });

    newSocket.on('customers_updated', (data) => {
      console.log('Customers updated:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('customersUpdated', { detail: data }));
    });

    newSocket.on('production_update', (data) => {
      console.log('Production update received:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('productionUpdated', { detail: data }));
    });

    newSocket.on('notification', (data) => {
      console.log('Notification received:', data);
      setLastUpdate(new Date());
      window.dispatchEvent(new CustomEvent('notificationReceived', { detail: data }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Subscribe to specific events
  const subscribe = useCallback((event, callback) => {
    if (!socket) return;

    const handler = (data) => {
      callback(data);
    };

    socket.on(event, handler);
    
    setSubscriptions(prev => {
      const newSubs = new Map(prev);
      newSubs.set(event, handler);
      return newSubs;
    });

    return () => {
      socket.off(event, handler);
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        newSubs.delete(event);
        return newSubs;
      });
    };
  }, [socket]);

  // Emit events
  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  }, [socket, connected]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLastUpdate(new Date());
    window.dispatchEvent(new CustomEvent('manualRefresh'));
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return {
      connected,
      lastUpdate,
      subscriptions: subscriptions.size
    };
  }, [connected, lastUpdate, subscriptions]);

  const value = {
    socket,
    connected,
    lastUpdate,
    subscribe,
    emit,
    refresh,
    getConnectionStatus
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeContext;
