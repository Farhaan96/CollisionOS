/**
 * Realtime Hook for Supabase
 * Replaces Socket.io with Supabase Realtime subscriptions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from './supabaseClient';
import { useAuth } from './useAuth';

/**
 * Hook for managing realtime job updates
 */
export const useJobRealtime = shopId => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const handleJobChange = useCallback(payload => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setJobs(prevJobs => {
      switch (eventType) {
        case 'INSERT':
          return [...prevJobs, newRecord];

        case 'UPDATE':
          return prevJobs.map(job =>
            job.id === newRecord.id ? { ...job, ...newRecord } : job
          );

        case 'DELETE':
          return prevJobs.filter(job => job.id !== oldRecord.id);

        default:
          return prevJobs;
      }
    });
  }, []);

  useEffect(() => {
    if (!shopId) return;

    // Subscribe to job changes
    channelRef.current = realtimeService.subscribeToJobs(
      shopId,
      handleJobChange
    );
    setLoading(false);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [shopId, handleJobChange]);

  return {
    jobs,
    loading,
    updateJob: (jobId, updates) => {
      setJobs(prevJobs =>
        prevJobs.map(job => (job.id === jobId ? { ...job, ...updates } : job))
      );
    },
  };
};

/**
 * Hook for managing realtime job updates for a specific job
 */
export const useJobUpdatesRealtime = jobId => {
  const [updates, setUpdates] = useState([]);
  const channelRef = useRef(null);

  const handleUpdateChange = useCallback(payload => {
    const { new: newUpdate } = payload;
    setUpdates(prevUpdates => [newUpdate, ...prevUpdates]);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    // Subscribe to job update changes
    channelRef.current = realtimeService.subscribeToJobUpdates(
      jobId,
      handleUpdateChange
    );

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [jobId, handleUpdateChange]);

  return { updates };
};

/**
 * Hook for managing realtime notifications
 */
export const useNotificationRealtime = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);

  const handleNotificationChange = useCallback(payload => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setNotifications(prevNotifications => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prevNotifications];

        case 'UPDATE':
          return prevNotifications.map(notification =>
            notification.id === newRecord.id
              ? { ...notification, ...newRecord }
              : notification
          );

        case 'DELETE':
          return prevNotifications.filter(
            notification => notification.id !== oldRecord.id
          );

        default:
          return prevNotifications;
      }
    });

    // Update unread count
    if (eventType === 'INSERT' && !newRecord.is_read) {
      setUnreadCount(prev => prev + 1);
    } else if (
      eventType === 'UPDATE' &&
      newRecord.is_read &&
      !oldRecord.is_read
    ) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to notification changes
    channelRef.current = realtimeService.subscribeToNotifications(
      user.id,
      handleNotificationChange
    );

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [user?.id, handleNotificationChange]);

  const markAsRead = useCallback(notificationId => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        is_read: true,
        read_at: new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(notificationId => {
    setNotifications(prevNotifications => {
      const notification = prevNotifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prevNotifications.filter(n => n.id !== notificationId);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
};

/**
 * Generic realtime hook for any table
 */
export const useTableRealtime = (
  tableName,
  filter = null,
  initialData = []
) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const handleChange = useCallback(payload => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setData(prevData => {
      switch (eventType) {
        case 'INSERT':
          return [...prevData, newRecord];

        case 'UPDATE':
          return prevData.map(item =>
            item.id === newRecord.id ? { ...item, ...newRecord } : item
          );

        case 'DELETE':
          return prevData.filter(item => item.id !== oldRecord.id);

        default:
          return prevData;
      }
    });
  }, []);

  useEffect(() => {
    const channelName = `${tableName}-changes-${Date.now()}`;

    const subscription = {
      event: '*',
      schema: 'public',
      table: tableName,
    };

    if (filter) {
      subscription.filter = filter;
    }

    try {
      channelRef.current = supabase
        .channel(channelName)
        .on('postgres_changes', subscription, handleChange)
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            setLoading(false);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setError('Failed to subscribe to realtime updates');
            setLoading(false);
          }
        });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, filter, handleChange]);

  return { data, loading, error };
};

/**
 * Hook for realtime production board updates
 */
export const useProductionBoardRealtime = shopId => {
  const { jobs } = useJobRealtime(shopId);
  const [boardState, setBoardState] = useState({
    estimate: [],
    intake: [],
    blueprint: [],
    parts_ordering: [],
    parts_receiving: [],
    body_structure: [],
    paint_prep: [],
    paint_booth: [],
    reassembly: [],
    quality_control: [],
    calibration: [],
    detail: [],
    ready_pickup: [],
    delivered: [],
    on_hold: [],
    cancelled: [],
  });

  useEffect(() => {
    // Group jobs by status
    const groupedJobs = jobs.reduce((acc, job) => {
      const status = job.status || 'estimate';
      if (!acc[status]) acc[status] = [];
      acc[status].push(job);
      return acc;
    }, {});

    // Sort jobs within each status by priority and created date
    const sortJobs = jobList => {
      const priorityOrder = { urgent: 0, rush: 1, high: 2, normal: 3, low: 4 };
      return jobList.sort((a, b) => {
        const priorityDiff =
          (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.created_at) - new Date(b.created_at);
      });
    };

    setBoardState(prevState => {
      const newState = { ...prevState };

      // Reset all columns
      Object.keys(newState).forEach(status => {
        newState[status] = [];
      });

      // Populate with sorted jobs
      Object.entries(groupedJobs).forEach(([status, jobList]) => {
        if (newState[status]) {
          newState[status] = sortJobs([...jobList]);
        }
      });

      return newState;
    });
  }, [jobs]);

  const moveJob = useCallback((jobId, fromStatus, toStatus, newIndex) => {
    setBoardState(prevState => {
      const newState = { ...prevState };

      // Remove job from source column
      const jobToMove = newState[fromStatus].find(job => job.id === jobId);
      newState[fromStatus] = newState[fromStatus].filter(
        job => job.id !== jobId
      );

      // Add job to destination column at specified index
      if (jobToMove) {
        jobToMove.status = toStatus;
        newState[toStatus].splice(newIndex, 0, jobToMove);
      }

      return newState;
    });
  }, []);

  const getColumnStats = useCallback(
    status => {
      const jobs = boardState[status] || [];
      const totalJobs = jobs.length;
      const overdueJobs = jobs.filter(
        job =>
          job.target_delivery_date &&
          new Date(job.target_delivery_date) < new Date() &&
          job.status !== 'delivered'
      ).length;
      const rushJobs = jobs.filter(
        job => job.priority === 'rush' || job.priority === 'urgent'
      ).length;

      return {
        total: totalJobs,
        overdue: overdueJobs,
        rush: rushJobs,
      };
    },
    [boardState]
  );

  return {
    boardState,
    moveJob,
    getColumnStats,
  };
};

/**
 * Hook for realtime dashboard stats
 */
export const useDashboardRealtime = shopId => {
  const { jobs } = useJobRealtime(shopId);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    overdueJobs: 0,
    avgCycleTime: 0,
    revenueThisMonth: 0,
  });

  useEffect(() => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const newStats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job =>
        [
          'intake',
          'blueprint',
          'parts_ordering',
          'parts_receiving',
          'body_structure',
          'paint_prep',
          'paint_booth',
          'reassembly',
          'quality_control',
          'calibration',
          'detail',
          'ready_pickup',
        ].includes(job.status)
      ).length,
      completedToday: jobs.filter(
        job =>
          job.status === 'delivered' &&
          job.actual_delivery_date &&
          new Date(job.actual_delivery_date).toDateString() === today
      ).length,
      overdueJobs: jobs.filter(
        job =>
          job.target_delivery_date &&
          new Date(job.target_delivery_date) < new Date() &&
          job.status !== 'delivered'
      ).length,
      avgCycleTime: jobs
        .filter(job => job.cycle_time)
        .reduce((sum, job, _, arr) => sum + job.cycle_time / arr.length, 0),
      revenueThisMonth: jobs
        .filter(
          job =>
            job.status === 'delivered' &&
            job.actual_delivery_date &&
            new Date(job.actual_delivery_date).getMonth() === thisMonth &&
            new Date(job.actual_delivery_date).getFullYear() === thisYear
        )
        .reduce((sum, job) => sum + (job.total_amount || 0), 0),
    };

    setStats(newStats);
  }, [jobs]);

  return stats;
};

/**
 * Hook for connection status
 */
export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSeen, setLastSeen] = useState(new Date());

  useEffect(() => {
    const channel = supabase
      .channel('connection-test')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setLastSeen(new Date());
      })
      .on('presence', { event: 'join' }, () => {
        setIsConnected(true);
        setLastSeen(new Date());
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false);
      })
      .subscribe();

    // Periodic connection check
    const interval = setInterval(() => {
      const timeSinceLastSeen = Date.now() - lastSeen.getTime();
      if (timeSinceLastSeen > 30000) {
        // 30 seconds
        setIsConnected(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [lastSeen]);

  return { isConnected, lastSeen };
};

export default {
  useJobRealtime,
  useJobUpdatesRealtime,
  useNotificationRealtime,
  useTableRealtime,
  useProductionBoardRealtime,
  useDashboardRealtime,
  useRealtimeStatus,
};
