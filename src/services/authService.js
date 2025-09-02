import axios from 'axios';
import logger from '../utils/logger';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get auth header
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async validateToken(token) {
    try {
      if (!token) return null;

      const response = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post(
          '/api/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      // Logout errors are typically non-critical since we clear local storage anyway
      logger.warn('Logout API call failed, but continuing with local cleanup', {
        component: 'authService',
        operation: 'logout',
        error: error.message
      });
    } finally {
      localStorage.removeItem('token');
    }
  },
};
