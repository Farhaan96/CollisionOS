import api from './api';

// Note: api.js already includes /api in baseURL, so paths here should not start with /api
const laborService = {
  /**
   * Perform a clock operation (clock in/out, start/stop job, break, etc.)
   */
  async clockOperation(data) {
    try {
      const response = await api.post('/labor/clock-operation', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to process clock operation');
    }
  },

  /**
   * Get current status for a technician
   */
  async getCurrentStatus(technicianId) {
    try {
      const response = await api.get(`/labor/technician/${technicianId}/current`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get current status');
    }
  },

  /**
   * Get all active labor sessions for the shop
   */
  async getActiveSessions() {
    try {
      const response = await api.get('/labor/active-sessions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get active sessions');
    }
  },

  /**
   * Get productivity data for a technician
   */
  async getProductivity(technicianId, startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/labor/productivity/${technicianId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get productivity data');
    }
  },

  /**
   * Get time entries for a specific job
   */
  async getJobTimeEntries(jobId) {
    try {
      const response = await api.get(`/labor/entries/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get job time entries');
    }
  },

  /**
   * Edit a time entry (supervisor only)
   */
  async editTimeEntry(entryId, data) {
    try {
      const response = await api.put(`/labor/entries/${entryId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to edit time entry');
    }
  },

  /**
   * Delete a time entry (supervisor only)
   */
  async deleteTimeEntry(entryId) {
    try {
      const response = await api.delete(`/labor/entries/${entryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete time entry');
    }
  },

  /**
   * Get summary for technician's current shift
   */
  async getShiftSummary(technicianId) {
    try {
      const response = await api.get(`/labor/technician/${technicianId}/shift-summary`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get shift summary');
    }
  },

  /**
   * Create a work order
   */
  async createWorkOrder(data) {
    try {
      const response = await api.post('/labor/work-order', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create work order');
    }
  },

  /**
   * Get job costing comparison (actual vs estimated hours)
   */
  async getJobCosting(jobId) {
    try {
      const response = await api.get(`/labor/job-costing/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get job costing');
    }
  },

  /**
   * Get labor efficiency metrics
   */
  async getEfficiencyMetrics(technicianId, period = 'week') {
    try {
      const response = await api.get(`/labor/efficiency/${technicianId}`, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get efficiency metrics');
    }
  },
};

export default laborService;
