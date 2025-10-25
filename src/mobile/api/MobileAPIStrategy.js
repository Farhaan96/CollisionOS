/**
 * CollisionOS Mobile API Strategy
 * Optimized API layer for mobile applications with offline support
 */

// =============================================
// MOBILE API CLIENT
// =============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import axios from 'axios';
import { io } from 'socket.io-client';

// =============================================
// API HOOKS FOR REACT NATIVE
// =============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export class MobileAPIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      timeout: 10000,
      retries: 3,
      offlineQueueSize: 1000,
      ...options,
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.options.timeout,
    });

    this.socket = null;
    this.offlineQueue = [];
    this.isConnected = true;
    this.authToken = null;

    this.setupInterceptors();
    this.setupNetworkListener();
    this.initializeOfflineQueue();
  }

  // =============================================
  // AUTHENTICATION
  // =============================================

  async setAuthToken(token) {
    this.authToken = token;
    await AsyncStorage.setItem('auth_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getAuthToken() {
    if (!this.authToken) {
      this.authToken = await AsyncStorage.getItem('auth_token');
      if (this.authToken) {
        this.client.defaults.headers.common['Authorization'] =
          `Bearer ${this.authToken}`;
      }
    }
    return this.authToken;
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('auth_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // =============================================
  // NETWORK MANAGEMENT
  // =============================================

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable;

      if (!wasConnected && this.isConnected) {
        this.processOfflineQueue();
        this.syncCachedData();
      }
    });
  }

  async isNetworkConnected() {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  }

  // =============================================
  // REQUEST INTERCEPTORS
  // =============================================

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async config => {
        // Add auth token
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add mobile client headers
        config.headers['X-Client-Type'] = 'mobile';
        config.headers['X-Client-Version'] = '1.0.0';
        config.headers['X-Platform'] = Platform.OS;

        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        // Cache successful responses
        if (response.config.method === 'get') {
          this.cacheResponse(response.config.url, response.data);
        }
        return response;
      },
      async error => {
        // Handle token refresh
        if (error.response?.status === 401) {
          return this.handleTokenRefresh(error.config);
        }

        // Handle network errors - add to offline queue
        if (!this.isConnected && error.code === 'NETWORK_ERROR') {
          if (error.config.method !== 'get') {
            await this.addToOfflineQueue(error.config);
            return Promise.resolve({ data: { queued: true } });
          } else {
            // Try to serve from cache
            const cached = await this.getCachedResponse(error.config.url);
            if (cached) {
              return Promise.resolve({ data: cached });
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // =============================================
  // OFFLINE QUEUE MANAGEMENT
  // =============================================

  async initializeOfflineQueue() {
    try {
      const storedQueue = await AsyncStorage.getItem('offline_queue');
      if (storedQueue) {
        this.offlineQueue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  async addToOfflineQueue(config) {
    if (this.offlineQueue.length >= this.options.offlineQueueSize) {
      this.offlineQueue.shift(); // Remove oldest item
    }

    const queueItem = {
      id: Date.now().toString(),
      config: {
        ...config,
        timestamp: new Date().toISOString(),
        retries: 0,
      },
    };

    this.offlineQueue.push(queueItem);
    await AsyncStorage.setItem(
      'offline_queue',
      JSON.stringify(this.offlineQueue)
    );
  }

  async processOfflineQueue() {
    if (!this.isConnected || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        await this.client(item.config);
        console.log('Successfully synced offline request:', item.id);
      } catch (error) {
        if (item.config.retries < this.options.retries) {
          item.config.retries++;
          this.offlineQueue.push(item);
        } else {
          console.error(
            'Failed to sync offline request after retries:',
            item.id
          );
        }
      }
    }

    await AsyncStorage.setItem(
      'offline_queue',
      JSON.stringify(this.offlineQueue)
    );
  }

  // =============================================
  // CACHING SYSTEM
  // =============================================

  async cacheResponse(url, data) {
    try {
      const cacheKey = `api_cache_${url}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        url,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  async getCachedResponse(url) {
    try {
      const cacheKey = `api_cache_${url}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
          return parsedCache.data;
        }
      }
    } catch (error) {
      console.warn('Failed to get cached response:', error);
    }
    return null;
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // =============================================
  // REAL-TIME CONNECTIONS
  // =============================================

  async connectSocket() {
    const token = await this.getAuthToken();
    if (!token) return;

    this.socket = io(this.baseURL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', error => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // =============================================
  // MOBILE-OPTIMIZED ENDPOINTS
  // =============================================

  // Customer API methods
  async getJobStatus(jobId) {
    const response = await this.client.get(
      `/api/mobile/customer/jobs/${jobId}/status`
    );
    return response.data;
  }

  async getJobTimeline(jobId) {
    const response = await this.client.get(
      `/api/mobile/customer/jobs/${jobId}/timeline`
    );
    return response.data;
  }

  async uploadJobPhoto(jobId, photo) {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.name || 'photo.jpg',
    });
    formData.append('jobId', jobId);
    formData.append('category', photo.category || 'progress');

    const response = await this.client.post(
      `/api/mobile/customer/jobs/${jobId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Extended timeout for photo uploads
      }
    );
    return response.data;
  }

  async getEstimate(estimateId) {
    const response = await this.client.get(
      `/api/mobile/customer/estimates/${estimateId}`
    );
    return response.data;
  }

  async approveEstimate(estimateId, signature) {
    const response = await this.client.post(
      `/api/mobile/customer/estimates/${estimateId}/approve`,
      { signature }
    );
    return response.data;
  }

  async getMessages(customerId) {
    const response = await this.client.get(
      `/api/mobile/customer/messages?customerId=${customerId}`
    );
    return response.data;
  }

  async sendMessage(message) {
    const response = await this.client.post(
      '/api/mobile/customer/messages',
      message
    );
    return response.data;
  }

  // Technician API methods
  async getTechnicianTasks(technicianId) {
    const response = await this.client.get(
      `/api/mobile/technician/tasks?technicianId=${technicianId}`
    );
    return response.data;
  }

  async updateTaskStatus(taskId, status, notes = '') {
    const response = await this.client.put(
      `/api/mobile/technician/tasks/${taskId}/status`,
      {
        status,
        notes,
      }
    );
    return response.data;
  }

  async startTimeEntry(taskId, jobId) {
    const response = await this.client.post(
      '/api/mobile/technician/time-entries',
      {
        taskId,
        jobId,
        startTime: new Date().toISOString(),
      }
    );
    return response.data;
  }

  async endTimeEntry(timeEntryId, notes = '') {
    const response = await this.client.put(
      `/api/mobile/technician/time-entries/${timeEntryId}`,
      {
        endTime: new Date().toISOString(),
        notes,
      }
    );
    return response.data;
  }

  async scanJobQR(qrCode) {
    const response = await this.client.get(
      `/api/mobile/technician/jobs/scan/${encodeURIComponent(qrCode)}`
    );
    return response.data;
  }

  async uploadTaskPhoto(taskId, photo) {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.name || 'task_photo.jpg',
    });
    formData.append('taskId', taskId);
    formData.append('category', photo.category || 'progress');

    const response = await this.client.post(
      `/api/mobile/technician/tasks/${taskId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );
    return response.data;
  }

  // =============================================
  // DATA SYNCHRONIZATION
  // =============================================

  async syncCachedData() {
    try {
      // Sync essential data when coming back online
      const syncPromises = [];

      // Get user profile
      syncPromises.push(this.client.get('/api/mobile/profile'));

      // Get active jobs/tasks
      syncPromises.push(this.client.get('/api/mobile/active-items'));

      // Get unread notifications
      syncPromises.push(this.client.get('/api/mobile/notifications/unread'));

      await Promise.allSettled(syncPromises);
      console.log('Data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  async batchUploadPhotos(photos) {
    const formData = new FormData();

    photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.name || `photo_${index}.jpg`,
      });
      formData.append(
        `metadata[${index}]`,
        JSON.stringify({
          jobId: photo.jobId,
          category: photo.category,
          timestamp: photo.timestamp,
        })
      );
    });

    const response = await this.client.post(
      '/api/mobile/photos/batch',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Extended timeout for batch uploads
      }
    );
    return response.data;
  }

  async batchUpdateTasks(updates) {
    const response = await this.client.put('/api/mobile/tasks/batch', {
      updates,
    });
    return response.data;
  }
}

// Custom hook for API client
export const useAPIClient = () => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const apiClient = new MobileAPIClient(
      process.env.REACT_NATIVE_API_URL || 'http://localhost:3002'
    );
    setClient(apiClient);

    return () => {
      apiClient.disconnectSocket();
    };
  }, []);

  return client;
};

// Job status hook
export const useJobStatus = jobId => {
  const client = useAPIClient();

  return useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: () => client?.getJobStatus(jobId),
    enabled: !!client && !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Photo upload mutation
export const usePhotoUpload = () => {
  const client = useAPIClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, photo }) => client?.uploadJobPhoto(jobId, photo),
    onSuccess: (data, variables) => {
      // Invalidate job photos query
      queryClient.invalidateQueries(['jobPhotos', variables.jobId]);
    },
  });
};

// Technician tasks hook
export const useTechnicianTasks = technicianId => {
  const client = useAPIClient();

  return useQuery({
    queryKey: ['technicianTasks', technicianId],
    queryFn: () => client?.getTechnicianTasks(technicianId),
    enabled: !!client && !!technicianId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Task status update mutation
export const useTaskStatusUpdate = () => {
  const client = useAPIClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status, notes }) =>
      client?.updateTaskStatus(taskId, status, notes),
    onSuccess: () => {
      // Invalidate tasks queries
      queryClient.invalidateQueries(['technicianTasks']);
    },
  });
};

// Network status hook
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  return isConnected;
};

// Offline queue hook
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(0);
  const client = useAPIClient();

  useEffect(() => {
    const checkQueue = async () => {
      if (client) {
        setQueueSize(client.offlineQueue.length);
      }
    };

    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, [client]);

  const processQueue = async () => {
    if (client) {
      await client.processOfflineQueue();
      setQueueSize(client.offlineQueue.length);
    }
  };

  return { queueSize, processQueue };
};

export default MobileAPIClient;
