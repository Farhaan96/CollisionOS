const API_BASE = '/api';

// Get auth token from localStorage or context
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const jobService = {
  async getJobs(options = {}) {
    try {
      const { search, filters, sortBy = 'priority', limit, offset } = options;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sortBy) params.append('sortBy', sortBy);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      // Add filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            value.forEach(v => params.append(key, v));
          } else if (value && !Array.isArray(value)) {
            params.append(key, value.toString());
          }
        });
      }

      const queryString = params.toString();
      const url = `${API_BASE}/jobs${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      const data = await handleResponse(response);
      
      // Handle both direct array response and wrapped response
      const jobs = Array.isArray(data) ? data : (data.data || []);
      
      // Add helper methods to each job for UI compatibility
      return jobs.map(job => ({
        ...job,
        canMoveToNextStatus: () => getValidTransitions(job.status),
        getNextStatuses: () => getValidTransitions(job.status)
      }));
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  async getRecentJobs(limit = 5) {
    try {
      const jobs = await this.getJobs({ limit });
      return jobs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      throw error;
    }
  },

  async getJob(id) {
    try {
      const response = await fetch(`${API_BASE}/jobs/${id}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleResponse(response);
      return data;
      
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  },

  async updateJob(id, updateData) {
    try {
      const response = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      
      const data = await handleResponse(response);
      return { success: true, job: data.job || data };
      
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error: error.message };
    }
  },

  async moveJob(jobId, newStatus, assignedTo = null, bayId = null, notes = '') {
    try {
      const payload = { 
        status: newStatus,
        ...(notes && { notes }),
        ...(assignedTo && { assignedTo }),
        ...(bayId && { bayId })
      };

      const response = await fetch(`${API_BASE}/jobs/${jobId}/move`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const data = await handleResponse(response);
      return { success: true, job: data.job || data };
      
    } catch (error) {
      console.error('Error moving job:', error);
      return { success: false, error: error.message };
    }
  },

  async createJob(jobData) {
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData)
      });
      
      const data = await handleResponse(response);
      return { success: true, job: data.job || data };
      
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteJob(id) {
    try {
      const response = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      await handleResponse(response);
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error: error.message };
    }
  }
};

// Helper function to get valid status transitions
function getValidTransitions(currentStatus) {
  const statusFlow = [
    'estimate',
    'intake', 
    'teardown',
    'parts_ordering',
    'parts_receiving',
    'body_structure',
    'paint_prep',
    'paint_booth',
    'reassembly',
    'qc_calibration',
    'detail',
    'ready_pickup',
    'delivered'
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1) return statusFlow; // If status not found, allow all
  
  // Allow moving to next status, staying in current, or moving backwards for corrections
  const validTransitions = [];
  
  // Allow staying in current status
  validTransitions.push(currentStatus);
  
  // Allow moving to next status
  if (currentIndex < statusFlow.length - 1) {
    validTransitions.push(statusFlow[currentIndex + 1]);
  }
  
  // Allow moving backwards for corrections (up to 2 steps back)
  for (let i = Math.max(0, currentIndex - 2); i < currentIndex; i++) {
    if (!validTransitions.includes(statusFlow[i])) {
      validTransitions.push(statusFlow[i]);
    }
  }
  
  return validTransitions;
}
