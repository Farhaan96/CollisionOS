import { create } from 'zustand';
import { jobService } from '../services/jobService';

const useJobStore = create((set, get) => ({
  // State
  jobs: [],
  loading: false,
  error: null,
  selectedJob: null,
  filters: {
    status: 'all',
    priority: 'all',
    technician: 'all',
    search: '',
  },

  // Actions
  setJobs: jobs => set({ jobs }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  setSelectedJob: job => set({ selectedJob: job }),
  setFilters: filters =>
    set(state => ({
      filters: { ...state.filters, ...filters },
    })),

  // Async Actions
  fetchJobs: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const jobs = await jobService.getJobs(options);

      // Use actual jobs from Supabase - no mock data needed
      set({ jobs: jobs || [], loading: false });
      return jobs || [];
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  moveJob: async (jobId, newStatus) => {
    const { jobs } = get();
    
    // Find the job to move
    const jobToMove = jobs.find(job => job.id === jobId);
    if (!jobToMove) {
      console.error(`Job with ID ${jobId} not found`);
      return { success: false, error: 'Job not found' };
    }

    const originalStatus = jobToMove.status;
    console.log(`Moving job ${jobId} from ${originalStatus} to ${newStatus}`);

    // Prevent unnecessary moves
    if (originalStatus === newStatus) {
      return { success: true, message: 'Job already in target status' };
    }

    // Optimistically update UI
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, status: newStatus } : job
    );
    set({ jobs: updatedJobs });

    try {
      // Try to update via API
      const result = await jobService.updateJob(jobId, { status: newStatus });

      if (result && result.success === false) {
        // Revert optimistic update on explicit failure
        set({ jobs });
        return { success: false, error: result.error || 'Failed to update job status' };
      }

      return { success: true };
    } catch (error) {
      console.warn('API update failed, keeping optimistic update:', error.message);
      
      // Keep optimistic update but warn about API failure
      // This prevents jobs from disappearing when API is down
      return { success: true, warning: 'Local update only - API unavailable' };
    }
  },

  createJob: async jobData => {
    set({ loading: true, error: null });

    try {
      const result = (await jobService.createJob)
        ? await jobService.createJob(jobData)
        : null;

      const newJob = result?.job || {
        id: `job-${Date.now()}`,
        jobNumber: jobData.jobNumber || `CR-${Date.now()}`,
        status: 'estimate',
        priority: jobData.priority || 'normal',
        customer: jobData.customer || {},
        vehicle: jobData.vehicle || {},
        insurance: jobData.insurance || {},
        estimateTotal: jobData.estimateTotal || 0,
        createdAt: new Date().toISOString(),
        targetDate:
          jobData.targetDate ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        daysInShop: 0,
        progressPercentage: 0,
        ...jobData,
      };

      const jobs = [...get().jobs, newJob];
      set({ jobs, loading: false });

      return { success: true, job: newJob };
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateJob: async (jobId, updateData) => {
    const { jobs } = get();

    // Optimistic update
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, ...updateData } : job
    );
    set({ jobs: updatedJobs });

    try {
      const result = await jobService.updateJob(jobId, updateData);

      if (result?.success) {
        // Update with server response if available
        const serverUpdatedJobs = jobs.map(job =>
          job.id === jobId ? { ...job, ...updateData, ...result.job } : job
        );
        set({ jobs: serverUpdatedJobs });
      }

      return { success: true };
    } catch (error) {
      // Keep optimistic update for now
      return { success: true, warning: 'Local update only' };
    }
  },

  deleteJob: async jobId => {
    const { jobs } = get();

    // Optimistic delete
    const filteredJobs = jobs.filter(job => job.id !== jobId);
    set({ jobs: filteredJobs });

    try {
      if (jobService.deleteJob) {
        await jobService.deleteJob(jobId);
      }
      return { success: true };
    } catch (error) {
      // Revert on error
      set({ jobs });
      throw error;
    }
  },

  // Computed getters
  getJobsByStatus: status => {
    const { jobs } = get();
    return jobs.filter(job => job.status === status);
  },

  getFilteredJobs: () => {
    const { jobs, filters } = get();

    return jobs.filter(job => {
      if (filters.status !== 'all' && job.status !== filters.status) {
        return false;
      }
      if (filters.priority !== 'all' && job.priority !== filters.priority) {
        return false;
      }
      if (
        filters.search &&
        !job.jobNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.customer?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  },
}));

export default useJobStore;
