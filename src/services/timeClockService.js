import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002/api';

/**
 * Time Clock Service
 * Handles all time clock related API operations
 */

class TimeClockService {
  /**
   * Punch in (general or on specific RO)
   */
  async punchIn(data) {
    const response = await axios.post(`${API_BASE_URL}/timeclock/punch-in`, data);
    return response.data;
  }

  /**
   * Punch out
   */
  async punchOut(technicianId, notes = null) {
    const response = await axios.post(`${API_BASE_URL}/timeclock/punch-out`, {
      technicianId,
      notes,
    });
    return response.data;
  }

  /**
   * Start break
   */
  async startBreak(technicianId) {
    const response = await axios.post(`${API_BASE_URL}/timeclock/break-start`, {
      technicianId,
    });
    return response.data;
  }

  /**
   * End break
   */
  async endBreak(technicianId) {
    const response = await axios.post(`${API_BASE_URL}/timeclock/break-end`, {
      technicianId,
    });
    return response.data;
  }

  /**
   * Get all active clock entries
   */
  async getActiveClocks() {
    const response = await axios.get(`${API_BASE_URL}/timeclock/active`);
    return response.data;
  }

  /**
   * Get current status for specific technician
   */
  async getTechnicianStatus(technicianId) {
    const response = await axios.get(`${API_BASE_URL}/timeclock/technician/${technicianId}/current`);
    return response.data;
  }

  /**
   * Get all time entries for specific RO
   */
  async getROTimeEntries(roId) {
    const response = await axios.get(`${API_BASE_URL}/timeclock/ro/${roId}`);
    return response.data;
  }

  /**
   * Get efficiency and productivity report
   */
  async getReport(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_BASE_URL}/timeclock/report?${queryParams}`);
    return response.data;
  }

  /**
   * Get QR code for specific RO
   */
  async getROQRCode(roId) {
    const response = await axios.get(`${API_BASE_URL}/timeclock/ro/${roId}/qr-code`);
    return response.data;
  }

  /**
   * Scan QR code and punch in
   */
  async scanQRCode(qrData, technicianId) {
    const response = await axios.post(`${API_BASE_URL}/timeclock/scan-qr`, {
      qrData,
      technicianId,
    });
    return response.data;
  }
}

export default new TimeClockService();
