import axios from 'axios';
import {
  transformToFrontend,
  transformToBackend,
  ensureBackendFormat,
} from '../utils/fieldTransformers';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class CustomerService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/customers`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token and transform data
    this.api.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Transform camelCase request data to snake_case for backend
        if (
          config.data &&
          (config.method === 'post' ||
            config.method === 'put' ||
            config.method === 'patch')
        ) {
          config.data = ensureBackendFormat(config.data);
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and field transformation
    this.api.interceptors.response.use(
      response => {
        // Handle the new API response format: { success: true, data: [...] }
        if (
          response.data &&
          response.data.success &&
          response.data.data !== undefined
        ) {
          // Transform snake_case backend data to camelCase frontend format
          const transformedData = Array.isArray(response.data.data)
            ? response.data.data.map(transformToFrontend)
            : transformToFrontend(response.data.data);

          // Return just the transformed data as expected by components
          return transformedData;
        }
        // Fallback for other response formats
        return response.data;
      },
      error => {
        console.error('Customer API Error:', error);
        throw error;
      }
    );
  }

  // Get all customers with optional filtering
  async getCustomers(filters = {}) {
    try {
      const params = new URLSearchParams();

      // Add filters to query parameters
      Object.keys(filters).forEach(key => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ''
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Get customer by ID
  async getCustomerById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    try {
      const response = await this.api.post('/', customerData);
      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(id, customerData) {
    try {
      const response = await this.api.put(`/${id}`, customerData);
      return response;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Search customers
  async searchCustomers(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const response = await this.api.get(`/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Get customers by type
  async getCustomersByType(type) {
    try {
      const response = await this.api.get(`/type/${type}`);
      return response;
    } catch (error) {
      console.error('Error fetching customers by type:', error);
      throw error;
    }
  }

  // Get customers by status
  async getCustomersByStatus(status) {
    try {
      const response = await this.api.get(`/status/${status}`);
      return response;
    } catch (error) {
      console.error('Error fetching customers by status:', error);
      throw error;
    }
  }

  // Get VIP customers
  async getVIPCustomers() {
    try {
      const response = await this.api.get('/vip');
      return response;
    } catch (error) {
      console.error('Error fetching VIP customers:', error);
      throw error;
    }
  }

  // Get customer statistics
  async getCustomerStats() {
    try {
      const response = await this.api.get('/stats');
      return response;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }

  // Get customer vehicles
  async getCustomerVehicles(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/vehicles`);
      return response;
    } catch (error) {
      console.error('Error fetching customer vehicles:', error);
      throw error;
    }
  }

  // Get customer jobs
  async getCustomerJobs(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/jobs`);
      return response;
    } catch (error) {
      console.error('Error fetching customer jobs:', error);
      throw error;
    }
  }

  // Get customer service history
  async getCustomerServiceHistory(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/history`);
      return response;
    } catch (error) {
      console.error('Error fetching customer service history:', error);
      throw error;
    }
  }

  // Update customer status
  async updateCustomerStatus(id, status) {
    try {
      const response = await this.api.patch(`/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw error;
    }
  }

  // Add customer note
  async addCustomerNote(id, note) {
    try {
      const response = await this.api.post(`/${id}/notes`, { note });
      return response;
    } catch (error) {
      console.error('Error adding customer note:', error);
      throw error;
    }
  }

  // Get customer notes
  async getCustomerNotes(id) {
    try {
      const response = await this.api.get(`/${id}/notes`);
      return response;
    } catch (error) {
      console.error('Error fetching customer notes:', error);
      throw error;
    }
  }

  // Export customers
  async exportCustomers(format = 'csv', filters = {}) {
    try {
      const params = new URLSearchParams({
        format,
        ...filters,
      });

      const response = await this.api.get(`/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }

  // Import customers
  async importCustomers(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add import options
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await this.api.post('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
    }
  }

  // Bulk update customers
  async bulkUpdateCustomers(customerIds, updates) {
    try {
      const response = await this.api.patch('/bulk-update', {
        customerIds,
        updates,
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      throw error;
    }
  }

  // Bulk delete customers
  async bulkDeleteCustomers(customerIds) {
    try {
      const response = await this.api.delete('/bulk-delete', {
        data: { customerIds },
      });
      return response;
    } catch (error) {
      console.error('Error bulk deleting customers:', error);
      throw error;
    }
  }

  // Get customer communication preferences
  async getCustomerCommunicationPreferences(id) {
    try {
      const response = await this.api.get(`/${id}/communication-preferences`);
      return response;
    } catch (error) {
      console.error(
        'Error fetching customer communication preferences:',
        error
      );
      throw error;
    }
  }

  // Update customer communication preferences
  async updateCustomerCommunicationPreferences(id, preferences) {
    try {
      const response = await this.api.put(
        `/${id}/communication-preferences`,
        preferences
      );
      return response;
    } catch (error) {
      console.error(
        'Error updating customer communication preferences:',
        error
      );
      throw error;
    }
  }

  // Get customer loyalty information
  async getCustomerLoyaltyInfo(id) {
    try {
      const response = await this.api.get(`/${id}/loyalty`);
      return response;
    } catch (error) {
      console.error('Error fetching customer loyalty info:', error);
      throw error;
    }
  }

  // Update customer loyalty points
  async updateCustomerLoyaltyPoints(id, points, reason) {
    try {
      const response = await this.api.post(`/${id}/loyalty/points`, {
        points,
        reason,
      });
      return response;
    } catch (error) {
      console.error('Error updating customer loyalty points:', error);
      throw error;
    }
  }

  // Get customer financial information
  async getCustomerFinancialInfo(id) {
    try {
      const response = await this.api.get(`/${id}/financial`);
      return response;
    } catch (error) {
      console.error('Error fetching customer financial info:', error);
      throw error;
    }
  }

  // Update customer credit limit
  async updateCustomerCreditLimit(id, creditLimit) {
    try {
      const response = await this.api.patch(`/${id}/credit-limit`, {
        creditLimit,
      });
      return response;
    } catch (error) {
      console.error('Error updating customer credit limit:', error);
      throw error;
    }
  }

  // Validate customer data
  async validateCustomerData(customerData) {
    try {
      const response = await this.api.post('/validate', customerData);
      return response;
    } catch (error) {
      console.error('Error validating customer data:', error);
      throw error;
    }
  }

  // Check for duplicate customers
  async checkDuplicateCustomers(customerData) {
    try {
      const response = await this.api.post('/check-duplicates', customerData);
      return response;
    } catch (error) {
      console.error('Error checking for duplicate customers:', error);
      throw error;
    }
  }

  // Get customer suggestions (for autocomplete)
  async getCustomerSuggestions(query, limit = 10) {
    try {
      const response = await this.api.get(
        `/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching customer suggestions:', error);
      throw error;
    }
  }

  // Get recent customers
  async getRecentCustomers(limit = 10) {
    try {
      const response = await this.api.get(`/recent?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      throw error;
    }
  }

  // Get customer birthdays (for current month)
  async getCustomerBirthdays(month = new Date().getMonth() + 1) {
    try {
      const response = await this.api.get(`/birthdays?month=${month}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer birthdays:', error);
      throw error;
    }
  }

  // Get customer anniversaries (for current month)
  async getCustomerAnniversaries(month = new Date().getMonth() + 1) {
    try {
      const response = await this.api.get(`/anniversaries?month=${month}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer anniversaries:', error);
      throw error;
    }
  }

  // Get customer communications
  async getCustomerCommunications(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/communications`);
      return response;
    } catch (error) {
      console.error('Error fetching customer communications:', error);
      throw error;
    }
  }

  // Send communication to customer
  async sendCommunication(customerId, communicationData) {
    try {
      const response = await this.api.post(`/${customerId}/communications`, communicationData);
      return response;
    } catch (error) {
      console.error('Error sending communication:', error);
      throw error;
    }
  }

  // Get customer repair orders
  async getCustomerRepairOrders(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/repair-orders`);
      return response;
    } catch (error) {
      console.error('Error fetching customer repair orders:', error);
      throw error;
    }
  }

  // Get customer invoices
  async getCustomerInvoices(customerId) {
    try {
      const response = await this.api.get(`/${customerId}/invoices`);
      return response;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const customerService = new CustomerService();
