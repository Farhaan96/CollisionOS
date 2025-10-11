import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiSlice';

// Async thunks
export const clockIn = createAsyncThunk(
  'timeClock/clockIn',
  async ({ jobId = null }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post('/timeclock/clock-in', {
        technician_id: auth.user.id,
        job_id: jobId,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to clock in' });
    }
  }
);

export const clockOut = createAsyncThunk(
  'timeClock/clockOut',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { timeClock, auth } = getState();
      if (!timeClock.currentEntry) {
        throw new Error('No active clock-in entry');
      }

      const response = await api.post('/timeclock/clock-out', {
        entry_id: timeClock.currentEntry.id,
        technician_id: auth.user.id,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to clock out' });
    }
  }
);

export const fetchTimeEntries = createAsyncThunk(
  'timeClock/fetchTimeEntries',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/timeclock/entries`, {
        params: {
          technician_id: auth.user.id,
          date: today,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch time entries' });
    }
  }
);

// Slice
const timeClockSlice = createSlice({
  name: 'timeClock',
  initialState: {
    currentEntry: null,
    todayEntries: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Clock In
      .addCase(clockIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntry = action.payload.entry;
        state.todayEntries.unshift(action.payload.entry);
      })
      .addCase(clockIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to clock in';
      })

      // Clock Out
      .addCase(clockOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntry = null;
        // Update the entry in todayEntries
        const index = state.todayEntries.findIndex(
          (entry) => entry.id === action.payload.entry.id
        );
        if (index !== -1) {
          state.todayEntries[index] = action.payload.entry;
        }
      })
      .addCase(clockOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to clock out';
      })

      // Fetch Time Entries
      .addCase(fetchTimeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.todayEntries = action.payload.entries || [];
        // Find current active entry (no clock_out)
        state.currentEntry = action.payload.entries?.find(
          (entry) => !entry.clock_out
        ) || null;
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch time entries';
      });
  },
});

export const { clearError } = timeClockSlice.actions;
export default timeClockSlice.reducer;
