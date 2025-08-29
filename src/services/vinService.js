import api from './api';

/**
 * VIN Service - Frontend API integration for VIN decoding functionality
 * Provides comprehensive VIN validation and decoding capabilities
 */
class VINService {
  /**
   * Validate VIN format and check digit
   * @param {string} vin - VIN to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateVIN(vin) {
    try {
      const response = await api.post('/vehicles/validate-vin', { vin });
      return response.data;
    } catch (error) {
      console.error('VIN validation error:', error);
      throw new Error(error.response?.data?.message || 'VIN validation failed');
    }
  }

  /**
   * Decode VIN using NHTSA API with local fallback
   * @param {string} vin - VIN to decode
   * @param {boolean} useApiOnly - Force API usage, skip local fallback
   * @returns {Promise<Object>} Decoded vehicle information
   */
  async decodeVIN(vin, useApiOnly = false) {
    try {
      const response = await api.post('/vehicles/decode-vin', { 
        vin, 
        useApiOnly 
      });
      return response.data;
    } catch (error) {
      console.error('VIN decoding error:', error);
      throw new Error(error.response?.data?.message || 'VIN decoding failed');
    }
  }

  /**
   * Batch decode multiple VINs
   * @param {string[]} vins - Array of VINs to decode (max 10)
   * @returns {Promise<Object>} Batch decode results
   */
  async batchDecodeVINs(vins) {
    try {
      if (!Array.isArray(vins) || vins.length === 0) {
        throw new Error('VINs array is required');
      }
      
      if (vins.length > 10) {
        throw new Error('Maximum 10 VINs allowed per batch');
      }

      const response = await api.post('/vehicles/batch-decode', { vins });
      return response.data;
    } catch (error) {
      console.error('Batch VIN decoding error:', error);
      throw new Error(error.response?.data?.message || 'Batch VIN decoding failed');
    }
  }

  /**
   * Get vehicles list with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Vehicles list with pagination
   */
  async getVehicles(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/vehicles?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get vehicles error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch vehicles');
    }
  }

  /**
   * Get vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  async getVehicle(id) {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get vehicle error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch vehicle');
    }
  }

  /**
   * Create new vehicle with optional VIN decoding
   * @param {Object} vehicleData - Vehicle data to create
   * @returns {Promise<Object>} Created vehicle
   */
  async createVehicle(vehicleData) {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Create vehicle error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create vehicle');
    }
  }

  /**
   * Update vehicle information
   * @param {string} id - Vehicle ID
   * @param {Object} updates - Vehicle updates
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateVehicle(id, updates) {
    try {
      const response = await api.put(`/vehicles/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update vehicle error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update vehicle');
    }
  }

  /**
   * Delete vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Delete confirmation
   */
  async deleteVehicle(id) {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete vehicle error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  }

  /**
   * Client-side VIN format validation
   * @param {string} vin - VIN to validate
   * @returns {Object} Basic validation result
   */
  validateVINFormat(vin) {
    const result = {
      valid: false,
      errors: [],
      normalized: null
    };

    if (!vin || typeof vin !== 'string') {
      result.errors.push('VIN is required');
      return result;
    }

    // Normalize VIN
    const normalized = vin.replace(/\s/g, '').toUpperCase();
    result.normalized = normalized;

    // Check length
    if (normalized.length !== 17) {
      result.errors.push(`Invalid length: expected 17 characters, got ${normalized.length}`);
    }

    // Check characters (no I, O, Q)
    if (/[IOQ]/i.test(normalized)) {
      result.errors.push('VIN cannot contain letters I, O, or Q');
    }

    // Check alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(normalized)) {
      result.errors.push('VIN must contain only letters and numbers (excluding I, O, Q)');
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Format VIN for display with proper spacing
   * @param {string} vin - VIN to format
   * @returns {string} Formatted VIN
   */
  formatVINDisplay(vin) {
    if (!vin || vin.length !== 17) {
      return vin;
    }

    // Format as: ABC-DE-F-GH-IJKLMN (WMI-VDS-CheckDigit-ModelYear+PlantCode-SerialNumber)
    return `${vin.slice(0, 3)}-${vin.slice(3, 8)}-${vin.slice(8, 9)}-${vin.slice(9, 11)}-${vin.slice(11)}`;
  }

  /**
   * Extract basic info from VIN without API call
   * @param {string} vin - VIN to analyze
   * @returns {Object} Basic VIN information
   */
  extractBasicVINInfo(vin) {
    if (!vin || vin.length !== 17) {
      return null;
    }

    const normalized = vin.toUpperCase();
    
    return {
      wmi: normalized.slice(0, 3),        // World Manufacturer Identifier
      vds: normalized.slice(3, 9),        // Vehicle Descriptor Section
      checkDigit: normalized.slice(8, 9), // Check digit
      modelYear: normalized.slice(9, 10), // Model year
      plantCode: normalized.slice(10, 11), // Assembly plant
      serialNumber: normalized.slice(11),   // Vehicle serial number
      countryCode: normalized.slice(0, 1),  // Country of manufacture
      formatted: this.formatVINDisplay(normalized)
    };
  }

  /**
   * Get country name from VIN first character
   * @param {string} countryCode - First character of VIN
   * @returns {string} Country name
   */
  getCountryFromVIN(countryCode) {
    const countryMap = {
      '1': 'United States', '2': 'Canada', '3': 'Mexico',
      '4': 'United States', '5': 'United States',
      '6': 'Australia', '8': 'Argentina', '9': 'Brazil',
      'A': 'South Africa', 'B': 'Kenya', 'C': 'Benin',
      'J': 'Japan', 'K': 'South Korea', 'L': 'China',
      'M': 'India', 'N': 'Turkey', 'P': 'Italy',
      'R': 'Taiwan', 'S': 'United Kingdom', 'T': 'Czech Republic',
      'U': 'Romania', 'V': 'France', 'W': 'Germany',
      'X': 'Russia', 'Y': 'Sweden', 'Z': 'Italy'
    };

    return countryMap[countryCode] || 'Unknown';
  }

  /**
   * Get estimated year from model year code
   * @param {string} yearCode - 10th character of VIN
   * @returns {number|null} Estimated year
   */
  getYearFromCode(yearCode) {
    const yearMap = {
      // 1980s-1990s
      'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 
      'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 
      'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 
      'W': 1998, 'X': 1999, 'Y': 2000,
      // 2000s
      '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, 
      '6': 2006, '7': 2007, '8': 2008, '9': 2009
    };

    const baseYear = yearMap[yearCode];
    if (!baseYear) return null;

    // For letters, determine decade based on current year
    if (isNaN(yearCode)) {
      const currentYear = new Date().getFullYear();
      const decade1 = baseYear;
      const decade2 = baseYear + 30;
      
      // Choose the decade that makes most sense
      return Math.abs(currentYear - decade2) < Math.abs(currentYear - decade1) ? decade2 : decade1;
    }

    return baseYear;
  }
}

// Export singleton instance
export const vinService = new VINService();
export default vinService;