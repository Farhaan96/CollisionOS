import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Parts API service
const partsAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/parts`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
partsAPI.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Parts Service
class PartsService {
  // Parts Management
  async getAllParts(filters = {}) {
    try {
      const response = await partsAPI.get('/', { params: filters });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPartById(id) {
    try {
      const response = await partsAPI.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createPart(partData) {
    try {
      const response = await partsAPI.post('/', partData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePart(id, partData) {
    try {
      const response = await partsAPI.put(`/${id}`, partData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePart(id) {
    try {
      const response = await partsAPI.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Inventory Management
  async getInventoryStatus() {
    try {
      const response = await partsAPI.get('/inventory/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLowStockParts() {
    try {
      const response = await partsAPI.get('/inventory/low-stock');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStock(partId, quantity, operation = 'set') {
    try {
      const response = await partsAPI.put(`/${partId}/stock`, {
        quantity,
        operation, // 'set', 'add', 'subtract'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInventoryHistory(partId, startDate, endDate) {
    try {
      const response = await partsAPI.get(`/${partId}/inventory/history`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Parts Search and Lookup
  async searchParts(query, filters = {}) {
    try {
      const response = await partsAPI.get('/search', {
        params: { q: query, ...filters },
      });

      // Handle both new API format and legacy format
      if (response.data?.success) {
        return response.data.data.parts || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Parts search failed:', error);
      throw this.handleError(error);
    }
  }

  async searchPartsByVehicle(make, model, year, category = null) {
    try {
      const response = await partsAPI.get('/search/vehicle', {
        params: { make, model, year, category },
      });

      // Handle both new API format and legacy format
      if (response.data?.success) {
        return response.data.data.parts || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Vehicle parts search failed:', error);
      throw this.handleError(error);
    }
  }

  async lookupPartByNumber(partNumber, supplier = null) {
    try {
      const response = await partsAPI.get('/lookup', {
        params: { partNumber, supplier },
      });

      // Handle both new API format and legacy format
      if (response.data?.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Part lookup failed:', error);
      throw this.handleError(error);
    }
  }

  // Price Comparison
  async comparePrices(partNumber, suppliers = []) {
    try {
      const response = await partsAPI.post('/prices/compare', {
        partNumber,
        suppliers,
      });

      // Handle both new API format and legacy format
      if (response.data?.success) {
        return response.data.data.comparisons || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Price comparison failed:', error);
      throw this.handleError(error);
    }
  }

  async getBestPrice(partNumber, minQuality = 'aftermarket') {
    try {
      const response = await partsAPI.get('/prices/best', {
        params: { partNumber, minQuality },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Purchase Orders
  async createPurchaseOrder(orderData) {
    try {
      const response = await partsAPI.post('/purchase-orders', orderData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPurchaseOrders(filters = {}) {
    try {
      const response = await partsAPI.get('/purchase-orders', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPurchaseOrderById(id) {
    try {
      const response = await partsAPI.get(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePurchaseOrder(id, updates) {
    try {
      const response = await partsAPI.put(`/purchase-orders/${id}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async receivePurchaseOrder(id, receivedItems) {
    try {
      const response = await partsAPI.post(`/purchase-orders/${id}/receive`, {
        receivedItems,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vendor Management
  async getVendors() {
    try {
      const response = await partsAPI.get('/vendors');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVendorById(id) {
    try {
      const response = await partsAPI.get(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createVendor(vendorData) {
    try {
      const response = await partsAPI.post('/vendors', vendorData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateVendor(id, vendorData) {
    try {
      const response = await partsAPI.put(`/vendors/${id}`, vendorData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVendorPricing(vendorId, partNumber) {
    try {
      const response = await partsAPI.get(`/vendors/${vendorId}/pricing`, {
        params: { partNumber },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analytics and Reports
  async getPartsAnalytics(startDate, endDate) {
    try {
      const response = await partsAPI.get('/analytics', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTopSellingParts(limit = 10, period = '30d') {
    try {
      const response = await partsAPI.get('/analytics/top-selling', {
        params: { limit, period },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSlowMovingParts(threshold = 90) {
    try {
      const response = await partsAPI.get('/analytics/slow-moving', {
        params: { threshold },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPartsValuation() {
    try {
      const response = await partsAPI.get('/analytics/valuation');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Import/Export
  async importPartsFromBMS(bmsData) {
    try {
      const response = await partsAPI.post('/import/bms', bmsData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exportPartsData(format = 'csv', filters = {}) {
    try {
      const response = await partsAPI.get('/export', {
        params: { format, ...filters },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkUpdateParts(updates) {
    try {
      const response = await partsAPI.put('/bulk-update', { updates });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Barcode/QR Code
  async lookupByBarcode(barcode) {
    try {
      const response = await partsAPI.get('/barcode', {
        params: { barcode },
      });

      // Handle both new API format and legacy format
      if (response.data?.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      throw this.handleError(error);
    }
  }

  async generatePartBarcode(partId) {
    try {
      const response = await partsAPI.post(`/${partId}/barcode`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Real-time Updates
  subscribeToUpdates(callback) {
    // This would typically use WebSocket or Socket.io
    // For now, using polling as fallback
    const interval = setInterval(async () => {
      try {
        const updates = await this.getRecentUpdates();
        if (updates.length > 0) {
          callback(updates);
        }
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  async getRecentUpdates(since = null) {
    try {
      const response = await partsAPI.get('/updates', {
        params: { since },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        status,
        message: data?.message || 'Server error occurred',
        details: data?.details || null,
        type: 'server_error',
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        status: 0,
        message: 'Network error - please check your connection',
        type: 'network_error',
      };
    } else {
      // Other error
      return {
        status: 0,
        message: error.message || 'Unknown error occurred',
        type: 'client_error',
      };
    }
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  calculateMarkup(cost, selling) {
    if (!cost || !selling) return 0;
    return ((selling - cost) / cost) * 100;
  }

  calculateMargin(cost, selling) {
    if (!selling) return 0;
    return ((selling - cost) / selling) * 100;
  }
}

// Export singleton instance
export const partsService = new PartsService();
export default partsService;
