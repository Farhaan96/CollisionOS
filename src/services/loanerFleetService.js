import api from './api';

/**
 * Loaner Fleet Service - Frontend API integration for courtesy car management
 * Provides comprehensive loaner vehicle tracking and assignment capabilities
 */
class LoanerFleetService {
  /**
   * Get all loaner vehicles with optional filtering
   * @param {Object} filters - Filter parameters (status, availability, etc.)
   * @returns {Promise<Object>} Loaner vehicles list
   */
  async getFleet(filters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/loaner-fleet/fleet?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get fleet error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch loaner fleet'
      );
    }
  }

  /**
   * Get fleet utilization statistics
   * @param {Object} dateRange - Optional date range for statistics
   * @returns {Promise<Object>} Utilization statistics
   */
  async getUtilization(dateRange = {}) {
    try {
      const params = new URLSearchParams();

      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await api.get(
        `/loaner-fleet/utilization?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Get utilization error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch utilization data'
      );
    }
  }

  /**
   * Reserve a loaner vehicle for a customer
   * @param {Object} reservationData - Reservation details
   * @returns {Promise<Object>} Reservation confirmation
   */
  async reserveVehicle(reservationData) {
    try {
      const response = await api.post('/loaner-fleet/reserve', reservationData);
      return response.data;
    } catch (error) {
      console.error('Reserve vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to reserve vehicle'
      );
    }
  }

  /**
   * Check out a loaner vehicle to a customer
   * @param {Object} checkoutData - Checkout details (vehicleId, customerId, roId, etc.)
   * @returns {Promise<Object>} Checkout confirmation
   */
  async checkOutVehicle(checkoutData) {
    try {
      const response = await api.post(
        '/loaner-fleet/check-out',
        checkoutData
      );
      return response.data;
    } catch (error) {
      console.error('Check out vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to check out vehicle'
      );
    }
  }

  /**
   * Check in a loaner vehicle from a customer
   * @param {Object} checkinData - Checkin details (vehicleId, condition, mileage, etc.)
   * @returns {Promise<Object>} Checkin confirmation
   */
  async checkInVehicle(checkinData) {
    try {
      const response = await api.post('/loaner-fleet/check-in', checkinData);
      return response.data;
    } catch (error) {
      console.error('Check in vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to check in vehicle'
      );
    }
  }

  /**
   * Add a new vehicle to the loaner fleet
   * @param {Object} vehicleData - Vehicle information
   * @returns {Promise<Object>} Created vehicle
   */
  async addVehicle(vehicleData) {
    try {
      const response = await api.post('/loaner-fleet/fleet', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Add vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to add vehicle to fleet'
      );
    }
  }

  /**
   * Update loaner vehicle information
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updates - Vehicle updates
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateVehicle(vehicleId, updates) {
    try {
      const response = await api.put(`/loaner-fleet/fleet/${vehicleId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update vehicle'
      );
    }
  }

  /**
   * Remove a vehicle from the loaner fleet
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Delete confirmation
   */
  async removeVehicle(vehicleId) {
    try {
      const response = await api.delete(`/loaner-fleet/fleet/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Remove vehicle error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to remove vehicle'
      );
    }
  }

  /**
   * Get active assignments
   * @returns {Promise<Array>} List of active assignments
   */
  async getActiveAssignments() {
    try {
      const response = await api.get('/loaner-fleet/assignments/active');
      return response.data;
    } catch (error) {
      console.error('Get active assignments error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch active assignments'
      );
    }
  }

  /**
   * Get assignment history
   * @param {Object} filters - Filter parameters (customerId, vehicleId, dateRange)
   * @returns {Promise<Array>} List of historical assignments
   */
  async getAssignmentHistory(filters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(
        `/loaner-fleet/assignments/history?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Get assignment history error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch assignment history'
      );
    }
  }

  /**
   * Get assignment by ID
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<Object>} Assignment details
   */
  async getAssignment(assignmentId) {
    try {
      const response = await api.get(`/loaner-fleet/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Get assignment error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch assignment'
      );
    }
  }

  /**
   * Update assignment information
   * @param {string} assignmentId - Assignment ID
   * @param {Object} updates - Assignment updates
   * @returns {Promise<Object>} Updated assignment
   */
  async updateAssignment(assignmentId, updates) {
    try {
      const response = await api.put(
        `/loaner-fleet/assignments/${assignmentId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error('Update assignment error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update assignment'
      );
    }
  }

  /**
   * Get maintenance schedule for loaner fleet
   * @returns {Promise<Array>} Maintenance schedule
   */
  async getMaintenanceSchedule() {
    try {
      const response = await api.get('/loaner-fleet/maintenance/schedule');
      return response.data;
    } catch (error) {
      console.error('Get maintenance schedule error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch maintenance schedule'
      );
    }
  }

  /**
   * Record maintenance for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} maintenanceData - Maintenance details
   * @returns {Promise<Object>} Maintenance record
   */
  async recordMaintenance(vehicleId, maintenanceData) {
    try {
      const response = await api.post(
        `/loaner-fleet/maintenance/${vehicleId}`,
        maintenanceData
      );
      return response.data;
    } catch (error) {
      console.error('Record maintenance error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to record maintenance'
      );
    }
  }

  /**
   * Get vehicle availability for a date range
   * @param {Object} dateRange - Start and end dates
   * @returns {Promise<Array>} Available vehicles
   */
  async getAvailability(dateRange) {
    try {
      const params = new URLSearchParams();

      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await api.get(
        `/loaner-fleet/availability?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Get availability error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch availability'
      );
    }
  }

  /**
   * Generate fleet report
   * @param {Object} reportParams - Report parameters (type, dateRange, etc.)
   * @returns {Promise<Object>} Report data
   */
  async generateReport(reportParams) {
    try {
      const response = await api.post('/loaner-fleet/reports', reportParams);
      return response.data;
    } catch (error) {
      console.error('Generate report error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to generate report'
      );
    }
  }

  /**
   * Client-side helper: Calculate vehicle utilization percentage
   * @param {Object} vehicle - Vehicle with assignment history
   * @returns {number} Utilization percentage
   */
  calculateUtilization(vehicle) {
    if (!vehicle || !vehicle.assignments) {
      return 0;
    }

    const totalDays = 30; // Default to last 30 days
    const assignedDays = vehicle.assignments.reduce((total, assignment) => {
      const start = new Date(assignment.startDate);
      const end = assignment.endDate
        ? new Date(assignment.endDate)
        : new Date();
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return total + days;
    }, 0);

    return Math.min(100, Math.round((assignedDays / totalDays) * 100));
  }

  /**
   * Client-side helper: Format vehicle status for display
   * @param {string} status - Vehicle status code
   * @returns {Object} Formatted status with color and label
   */
  formatStatus(status) {
    const statusMap = {
      available: { label: 'Available', color: 'success', icon: 'CheckCircle' },
      'in-use': { label: 'In Use', color: 'primary', icon: 'Person' },
      reserved: { label: 'Reserved', color: 'info', icon: 'Schedule' },
      maintenance: { label: 'Maintenance', color: 'warning', icon: 'Build' },
      'out-of-service': {
        label: 'Out of Service',
        color: 'error',
        icon: 'Warning',
      },
    };

    return statusMap[status] || { label: status, color: 'default', icon: 'Help' };
  }

  /**
   * Client-side helper: Calculate estimated return date
   * @param {Date} startDate - Assignment start date
   * @param {number} estimatedDays - Estimated repair days
   * @returns {Date} Estimated return date
   */
  calculateReturnDate(startDate, estimatedDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + estimatedDays);
    return date;
  }

  /**
   * Client-side helper: Check if maintenance is due
   * @param {Object} vehicle - Vehicle object with maintenance info
   * @returns {boolean} True if maintenance is due
   */
  isMaintenanceDue(vehicle) {
    if (!vehicle) return false;

    const {
      mileage,
      lastServiceMileage,
      serviceMileageInterval = 5000,
      lastServiceDate,
      serviceDaysInterval = 90,
    } = vehicle;

    // Check mileage
    if (mileage && lastServiceMileage) {
      if (mileage - lastServiceMileage >= serviceMileageInterval) {
        return true;
      }
    }

    // Check days since last service
    if (lastServiceDate) {
      const daysSinceService = Math.ceil(
        (new Date() - new Date(lastServiceDate)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceService >= serviceDaysInterval) {
        return true;
      }
    }

    return false;
  }
}

// Export singleton instance
export const loanerFleetService = new LoanerFleetService();
export default loanerFleetService;
