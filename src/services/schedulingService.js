import axios from 'axios';
import {
  transformToFrontend,
  transformToBackend,
  ensureBackendFormat,
} from '../utils/fieldTransformers';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Scheduling Service
 * Handles all scheduling and calendar-related API operations
 */
class SchedulingService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/scheduling`,
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
        // Handle the new API response format: { success: true, data: {...} }
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
        console.error('Scheduling API Error:', error);
        throw error;
      }
    );
  }

  /**
   * Get capacity information by department
   * @param {Object} params - Query parameters
   * @param {string} params.date - Date in YYYY-MM-DD format
   * @param {string} params.department - Optional department filter
   * @param {string} params.view - View mode (daily, weekly, monthly)
   * @returns {Promise<Object>} Capacity data
   */
  async getCapacity(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.department) queryParams.append('department', params.department);
      if (params.view) queryParams.append('view', params.view);

      const response = await this.api.get(`/capacity?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching capacity:', error);
      throw error;
    }
  }

  /**
   * Book a new appointment or schedule operations
   * @param {Object} bookingData - Booking details
   * @param {string} bookingData.roId - Repair order ID
   * @param {Array} bookingData.operations - Array of operations to schedule
   * @param {string} bookingData.priority - Priority level
   * @param {string} bookingData.customerRequestedDate - Optional customer date
   * @returns {Promise<Object>} Scheduled appointment data
   */
  async bookAppointment(bookingData) {
    try {
      const response = await this.api.post('/book', bookingData);
      return response;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  /**
   * Get technician availability and skills
   * @param {Object} params - Query parameters
   * @param {string} params.date - Date to check availability
   * @param {string} params.department - Filter by department
   * @param {string} params.skillFilter - Filter by skill
   * @returns {Promise<Object>} Technician availability data
   */
  async getTechnicians(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.department) queryParams.append('department', params.department);
      if (params.skillFilter) queryParams.append('skill_filter', params.skillFilter);

      const response = await this.api.get(`/technicians?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
  }

  /**
   * Perform what-if analysis for scheduling scenarios
   * @param {Object} scenarioData - Scenario analysis data
   * @param {Array} scenarioData.scenarios - Array of scenarios to analyze
   * @param {string} scenarioData.comparisonMode - Comparison criteria
   * @returns {Promise<Object>} Scenario analysis results
   */
  async whatIfAnalysis(scenarioData) {
    try {
      const response = await this.api.post('/what-if', scenarioData);
      return response;
    } catch (error) {
      console.error('Error performing what-if analysis:', error);
      throw error;
    }
  }

  /**
   * Get smart ETA calculation for a repair order
   * @param {string} roId - Repair order ID
   * @param {Object} options - Optional parameters
   * @param {boolean} options.includeConfidence - Include confidence analysis
   * @param {boolean} options.breakdown - Include detailed breakdown
   * @returns {Promise<Object>} Smart ETA data
   */
  async getSmartETA(roId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.includeConfidence !== undefined) {
        queryParams.append('include_confidence', options.includeConfidence);
      }
      if (options.breakdown !== undefined) {
        queryParams.append('breakdown', options.breakdown);
      }

      const response = await this.api.get(`/smart-eta/${roId}?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching smart ETA:', error);
      throw error;
    }
  }

  /**
   * Get all appointments for a date range
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.status - Optional status filter
   * @param {string} params.technician - Optional technician filter
   * @returns {Promise<Array>} Array of appointments
   */
  async getAppointments(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.technician) queryParams.append('technician', params.technician);

      // Note: This endpoint might need to be added to backend
      const response = await this.api.get(`/appointments?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - Updated appointment data
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await this.api.put(`/appointments/${appointmentId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Delete an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteAppointment(appointmentId) {
    try {
      const response = await this.api.delete(`/appointments/${appointmentId}`);
      return response;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule an appointment (drag-and-drop support)
   * @param {string} appointmentId - Appointment ID
   * @param {Object} rescheduleData - New schedule data
   * @param {string} rescheduleData.newStartDate - New start date/time
   * @param {string} rescheduleData.newEndDate - New end date/time
   * @param {string} rescheduleData.technicianId - Optional new technician
   * @returns {Promise<Object>} Rescheduled appointment
   */
  async rescheduleAppointment(appointmentId, rescheduleData) {
    try {
      const response = await this.api.patch(`/appointments/${appointmentId}/reschedule`, rescheduleData);
      return response;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointments for today
   * @returns {Promise<Array>} Today's appointments
   */
  async getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments({
      startDate: today,
      endDate: today,
    });
  }

  /**
   * Get upcoming appointments
   * @param {number} days - Number of days to look ahead (default 7)
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcomingAppointments(days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.getAppointments({
      startDate: today.toISOString().split('T')[0],
      endDate: futureDate.toISOString().split('T')[0],
    });
  }

  /**
   * Check for scheduling conflicts
   * @param {Object} appointmentData - Appointment to check
   * @returns {Promise<Object>} Conflict information
   */
  async checkConflicts(appointmentData) {
    try {
      const response = await this.api.post('/check-conflicts', appointmentData);
      return response;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const schedulingService = new SchedulingService();
