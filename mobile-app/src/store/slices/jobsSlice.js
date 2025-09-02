import { createSlice } from '@reduxjs/toolkit';

// Job status constants
export const JOB_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  WAITING_PARTS: 'waiting_parts',
  READY_FOR_QC: 'ready_for_qc',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
};

const initialState = {
  jobs: [],
  currentJob: null,
  filters: {
    status: null,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastSync: null,
  clockedInJobId: null,
  clockedInTime: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload;
    },
    addJobs: (state, action) => {
      const newJobs = action.payload.filter(
        newJob => !state.jobs.find(job => job.id === newJob.id)
      );
      state.jobs.push(...newJobs);
    },
    updateJob: (state, action) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = { ...state.jobs[index], ...action.payload };
      }
      if (state.currentJob && state.currentJob.id === action.payload.id) {
        state.currentJob = { ...state.currentJob, ...action.payload };
      }
    },
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: null,
        search: '',
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLastSync: (state) => {
      state.lastSync = new Date().toISOString();
    },
    clockIn: (state, action) => {
      const { jobId, timestamp } = action.payload;
      state.clockedInJobId = jobId;
      state.clockedInTime = timestamp;
    },
    clockOut: (state) => {
      state.clockedInJobId = null;
      state.clockedInTime = null;
    },
    addJobPhoto: (state, action) => {
      const { jobId, photo } = action.payload;
      const jobIndex = state.jobs.findIndex(job => job.id === jobId);
      if (jobIndex !== -1) {
        if (!state.jobs[jobIndex].photos) {
          state.jobs[jobIndex].photos = [];
        }
        state.jobs[jobIndex].photos.push(photo);
      }
      if (state.currentJob && state.currentJob.id === jobId) {
        if (!state.currentJob.photos) {
          state.currentJob.photos = [];
        }
        state.currentJob.photos.push(photo);
      }
    },
  },
});

export const {
  setJobs,
  addJobs,
  updateJob,
  setCurrentJob,
  clearCurrentJob,
  setFilters,
  clearFilters,
  setPagination,
  setLoading,
  setRefreshing,
  setError,
  clearError,
  setLastSync,
  clockIn,
  clockOut,
  addJobPhoto,
} = jobsSlice.actions;

// Selectors
export const selectJobs = (state) => state.jobs.jobs;
export const selectCurrentJob = (state) => state.jobs.currentJob;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobPagination = (state) => state.jobs.pagination;
export const selectJobsLoading = (state) => state.jobs.isLoading;
export const selectJobsRefreshing = (state) => state.jobs.isRefreshing;
export const selectJobsError = (state) => state.jobs.error;
export const selectLastJobSync = (state) => state.jobs.lastSync;
export const selectClockedInJob = (state) => state.jobs.clockedInJobId;
export const selectClockedInTime = (state) => state.jobs.clockedInTime;

// Complex selectors
export const selectJobById = (state, jobId) =>
  state.jobs.jobs.find(job => job.id === jobId);

export const selectJobsByStatus = (state, status) =>
  state.jobs.jobs.filter(job => job.status === status);

export const selectFilteredJobs = (state) => {
  const { jobs, filters } = state.jobs;
  let filteredJobs = [...jobs];

  if (filters.status) {
    filteredJobs = filteredJobs.filter(job => job.status === filters.status);
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.ro_number?.toLowerCase().includes(searchTerm) ||
      job.claim_number?.toLowerCase().includes(searchTerm) ||
      job.customer?.name?.toLowerCase().includes(searchTerm) ||
      job.vehicle?.plate?.toLowerCase().includes(searchTerm) ||
      job.vehicle?.vin?.toLowerCase().includes(searchTerm)
    );
  }

  return filteredJobs;
};

export default jobsSlice.reducer;