import axios from 'axios';
import logger from '../utils/logger';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This sends cookies with requests
});

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      // Session cookie is automatically stored by the browser
      return response.data;
    } catch (error) {
      logger.error('Login failed', {
        component: 'authService',
        operation: 'login',
        error: error.message,
      });
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      // Session cookie is automatically sent with the request
      return response.data.data;
    } catch (error) {
      // If session is invalid, user is not authenticated
      return null;
    }
  },

  async checkAuth() {
    // Alias for getCurrentUser for backward compatibility
    return this.getCurrentUser();
  },

  async logout() {
    try {
      await api.post('/auth/logout');
      // Session cookie is automatically cleared by the server
    } catch (error) {
      // Logout errors are typically non-critical
      logger.warn('Logout API call failed, but session should be cleared', {
        component: 'authService',
        operation: 'logout',
        error: error.message,
      });
    }
  },
};
