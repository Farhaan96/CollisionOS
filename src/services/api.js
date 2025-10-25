/**
 * API Configuration - CollisionOS
 *
 * Base API client configuration with axios
 * Handles authentication, error handling, and request/response interceptors
 */

import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send session cookies with requests
});

// Request interceptor - Add metadata and context
api.interceptors.request.use(
  (config) => {
    // Session cookie is automatically sent by browser (withCredentials: true)

    // Add shop context if available (optional, may not be needed with sessions)
    const shopId = localStorage.getItem('shop_id');
    if (shopId) {
      config.headers['X-Shop-ID'] = shopId;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    // Log request duration for debugging
    if (response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  (error) => {
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - session expired, redirect to login
          // Session cookie is automatically handled by browser
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.warn('Access forbidden:', data.message);
          break;

        case 404:
          // Not found
          console.warn('Resource not found:', error.config?.url);
          break;

        case 422:
          // Validation error
          console.warn('Validation error:', data.errors || data.message);
          break;

        case 429:
          // Rate limited
          console.warn('Rate limit exceeded');
          break;

        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;

        default:
          console.error('Unexpected API error:', status, data);
      }

      // Return structured error response
      return Promise.reject({
        message: data.message || `HTTP ${status} Error`,
        status,
        errors: data.errors || [],
        data: data
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error - please check your connection',
        status: 0,
        errors: [],
        data: null
      });
    } else {
      // Other error
      console.error('Request setup error:', error.message);
      return Promise.reject({
        message: error.message || 'Request failed',
        status: 0,
        errors: [],
        data: null
      });
    }
  }
);

// Helper functions for common API patterns

/**
 * GET request with error handling
 */
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST request with error handling
 */
export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * PUT request with error handling
 */
export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * DELETE request with error handling
 */
export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload file with progress tracking
 */
export const uploadFile = async (url, file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await api.post(url, formData, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Download file
 */
export const downloadFile = async (url, filename = null) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    throw error;
  }
};

// Export the configured axios instance as default
export default api;