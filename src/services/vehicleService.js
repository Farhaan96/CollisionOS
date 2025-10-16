import axios from 'axios';
import {
  transformToFrontend,
  transformToBackend,
  ensureBackendFormat,
} from '../utils/fieldTransformers';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Vehicle Service
 * Handles all vehicle-related API operations
 */
class VehicleService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/vehicles`,
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
        console.error('Vehicle API Error:', error);
        throw error;
      }
    );
  }

  /**
   * Get all vehicles with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Array of vehicles
   */
  async getVehicles(filters = {}) {
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
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle data
   */
  async getVehicleById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  /**
   * Create new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async createVehicle(vehicleData) {
    try {
      const response = await this.api.post('/', vehicleData);
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Update vehicle
   * @param {string} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateVehicle(id, vehicleData) {
    try {
      const response = await this.api.put(`/${id}`, vehicleData);
      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteVehicle(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  /**
   * Get vehicles for a specific customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Array of vehicles
   */
  async getVehiclesByCustomer(customerId) {
    try {
      const response = await this.api.get('/', {
        params: { customerId },
      });
      return response;
    } catch (error) {
      console.error('Error fetching customer vehicles:', error);
      throw error;
    }
  }

  /**
   * Search vehicles
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of matching vehicles
   */
  async searchVehicles(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const response = await this.api.get(`/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  /**
   * Decode VIN
   * @param {string} vin - Vehicle Identification Number
   * @param {boolean} useApiOnly - Force API usage
   * @returns {Promise<Object>} Decoded vehicle data
   */
  async decodeVIN(vin, useApiOnly = false) {
    try {
      const response = await this.api.post('/decode-vin', {
        vin,
        useApiOnly,
      });
      return response;
    } catch (error) {
      console.error('Error decoding VIN:', error);
      throw error;
    }
  }

  /**
   * Validate VIN
   * @param {string} vin - Vehicle Identification Number
   * @returns {Promise<Object>} Validation result
   */
  async validateVIN(vin) {
    try {
      const response = await this.api.post('/validate-vin', { vin });
      return response;
    } catch (error) {
      console.error('Error validating VIN:', error);
      throw error;
    }
  }

  /**
   * Batch decode VINs
   * @param {Array<string>} vins - Array of VINs (max 10)
   * @returns {Promise<Object>} Batch decode results
   */
  async batchDecodeVINs(vins) {
    try {
      const response = await this.api.post('/batch-decode', { vins });
      return response;
    } catch (error) {
      console.error('Error batch decoding VINs:', error);
      throw error;
    }
  }

  /**
   * Get vehicle service history
   * @param {string} id - Vehicle ID
   * @returns {Promise<Array>} Service history
   */
  async getVehicleServiceHistory(id) {
    try {
      const response = await this.api.get(`/${id}/service-history`);
      return response;
    } catch (error) {
      console.error('Error fetching service history:', error);
      throw error;
    }
  }

  /**
   * Get vehicle repair orders
   * @param {string} id - Vehicle ID
   * @returns {Promise<Array>} Repair orders
   */
  async getVehicleRepairOrders(id) {
    try {
      const response = await this.api.get(`/${id}/repair-orders`);
      return response;
    } catch (error) {
      console.error('Error fetching repair orders:', error);
      throw error;
    }
  }

  /**
   * Get vehicle suggestions (for autocomplete)
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Array of vehicle suggestions
   */
  async getVehicleSuggestions(query, limit = 10) {
    try {
      const response = await this.api.get(
        `/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching vehicle suggestions:', error);
      throw error;
    }
  }

  /**
   * Export vehicles
   * @param {string} format - Export format (csv, xlsx)
   * @param {Object} filters - Export filters
   * @returns {Promise<Blob>} Export file blob
   */
  async exportVehicles(format = 'csv', filters = {}) {
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
      console.error('Error exporting vehicles:', error);
      throw error;
    }
  }

  /**
   * Import vehicles
   * @param {File} file - Import file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importVehicles(file, options = {}) {
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
      console.error('Error importing vehicles:', error);
      throw error;
    }
  }

  /**
   * Bulk update vehicles
   * @param {Array<string>} vehicleIds - Array of vehicle IDs
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Bulk update results
   */
  async bulkUpdateVehicles(vehicleIds, updates) {
    try {
      const response = await this.api.patch('/bulk-update', {
        vehicleIds,
        updates,
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating vehicles:', error);
      throw error;
    }
  }

  /**
   * Bulk delete vehicles
   * @param {Array<string>} vehicleIds - Array of vehicle IDs
   * @returns {Promise<Object>} Bulk delete results
   */
  async bulkDeleteVehicles(vehicleIds) {
    try {
      const response = await this.api.delete('/bulk-delete', {
        data: { vehicleIds },
      });
      return response;
    } catch (error) {
      console.error('Error bulk deleting vehicles:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const vehicleService = new VehicleService();
