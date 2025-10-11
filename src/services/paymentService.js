/**
 * Payment Service - CollisionOS Phase 2
 *
 * Client-side service for payment operations
 */

import apiClient from './apiClient';

export const paymentService = {
  /**
   * Create a payment intent (for Stripe payments)
   */
  async createPaymentIntent(data) {
    try {
      const response = await apiClient.post('/api/payments/stripe/intent', data);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Confirm a Stripe payment and record in system
   */
  async confirmPayment(data) {
    try {
      const response = await apiClient.post('/api/payments/stripe/confirm', data);
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Create a payment (non-Stripe: cash, check, etc.)
   */
  async createPayment(data) {
    try {
      const response = await apiClient.post('/api/payments', data);
      return response.data;
    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get list of payments
   */
  async getPayments(params = {}) {
    try {
      const response = await apiClient.get('/api/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Get payments error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Get payment details
   */
  async getPayment(id) {
    try {
      const response = await apiClient.get(`/api/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Process refund
   */
  async refundPayment(id, data) {
    try {
      const response = await apiClient.post(`/api/payments/${id}/refund`, data);
      return response.data;
    } catch (error) {
      console.error('Refund payment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
};

export default paymentService;
