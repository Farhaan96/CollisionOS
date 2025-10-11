/**
 * Expense Service - CollisionOS Phase 2
 *
 * Client-side service for expense operations
 */

import apiClient from './apiClient';

export const expenseService = {
  /**
   * Get list of expenses
   */
  async getExpenses(params = {}) {
    try {
      const response = await apiClient.get('/api/expenses', { params });
      return response.data;
    } catch (error) {
      console.error('Get expenses error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get expense details
   */
  async getExpense(id) {
    try {
      const response = await apiClient.get(`/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Create new expense
   */
  async createExpense(data) {
    try {
      const response = await apiClient.post('/api/expenses', data);
      return response.data;
    } catch (error) {
      console.error('Create expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Update expense
   */
  async updateExpense(id, data) {
    try {
      const response = await apiClient.put(`/api/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Approve expense
   */
  async approveExpense(id) {
    try {
      const response = await apiClient.post(`/api/expenses/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Approve expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Reject expense
   */
  async rejectExpense(id, data) {
    try {
      const response = await apiClient.post(`/api/expenses/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Reject expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Record expense payment
   */
  async payExpense(id, data) {
    try {
      const response = await apiClient.post(`/api/expenses/${id}/pay`, data);
      return response.data;
    } catch (error) {
      console.error('Pay expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Delete expense
   */
  async deleteExpense(id) {
    try {
      const response = await apiClient.delete(`/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get expense categories
   */
  async getCategories() {
    try {
      const response = await apiClient.get('/api/expenses/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get overdue expenses
   */
  async getOverdueExpenses() {
    try {
      const response = await apiClient.get('/api/expenses/overdue');
      return response.data;
    } catch (error) {
      console.error('Get overdue expenses error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
};

export default expenseService;
