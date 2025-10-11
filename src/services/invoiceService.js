/**
 * Invoice Service - CollisionOS Phase 2
 *
 * Client-side service for invoice operations
 */

import apiClient from './apiClient';

export const invoiceService = {
  /**
   * Get list of invoices
   */
  async getInvoices(params = {}) {
    try {
      const response = await apiClient.get('/api/invoices', { params });
      return response.data;
    } catch (error) {
      console.error('Get invoices error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get invoice details
   */
  async getInvoice(id) {
    try {
      const response = await apiClient.get(`/api/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Create new invoice
   */
  async createInvoice(data) {
    try {
      const response = await apiClient.post('/api/invoices', data);
      return response.data;
    } catch (error) {
      console.error('Create invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Update invoice
   */
  async updateInvoice(id, data) {
    try {
      const response = await apiClient.put(`/api/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Send invoice to customer
   */
  async sendInvoice(id) {
    try {
      const response = await apiClient.post(`/api/invoices/${id}/send`);
      return response.data;
    } catch (error) {
      console.error('Send invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Void invoice
   */
  async voidInvoice(id, reason) {
    try {
      const response = await apiClient.post(`/api/invoices/${id}/void`, { reason });
      return response.data;
    } catch (error) {
      console.error('Void invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Delete invoice
   */
  async deleteInvoice(id) {
    try {
      const response = await apiClient.delete(`/api/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete invoice error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices() {
    try {
      const response = await apiClient.get('/api/invoices/overdue');
      return response.data;
    } catch (error) {
      console.error('Get overdue invoices error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
};

export default invoiceService;
