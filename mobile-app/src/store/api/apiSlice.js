import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getTokenFromSecureStore } from '../../services/AuthService';

// Base API URL - adjust for your CollisionOS backend
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    try {
      const token = await getTokenFromSecureStore();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return headers;
    }
  },
});

// Base query with re-auth logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Token expired, attempt to refresh or logout
    api.dispatch({ type: 'auth/logout' });
  }
  
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Job', 'Part', 'Vendor', 'Notification', 'User'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: ['User'],
    }),

    refreshToken: builder.mutation({
      query: ({ refreshToken }) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),

    // Job management endpoints
    getJobs: builder.query({
      query: ({ page = 1, limit = 20, status, search } = {}) => ({
        url: '/mobile/jobs',
        params: { page, limit, status, search },
      }),
      providesTags: ['Job'],
      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        const { page, ...otherArgs } = queryArgs || {};
        return endpointName + JSON.stringify(otherArgs);
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg?.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...newItems.data],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page === 1;
      },
    }),

    getJobById: builder.query({
      query: (jobId) => `/mobile/jobs/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: 'Job', id: jobId }],
    }),

    updateJobStatus: builder.mutation({
      query: ({ jobId, status, notes }) => ({
        url: `/mobile/jobs/${jobId}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    addJobPhoto: builder.mutation({
      query: ({ jobId, photo, description, location }) => {
        const formData = new FormData();
        formData.append('photo', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || 'photo.jpg',
        });
        formData.append('description', description);
        if (location) {
          formData.append('location', JSON.stringify(location));
        }
        
        return {
          url: `/mobile/jobs/${jobId}/photos`,
          method: 'POST',
          body: formData,
          headers: {
            'content-type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    // Parts management endpoints
    getParts: builder.query({
      query: ({ jobId, status, search } = {}) => ({
        url: '/mobile/parts',
        params: { jobId, status, search },
      }),
      providesTags: ['Part'],
    }),

    updatePartStatus: builder.mutation({
      query: ({ partId, status, quantity, notes }) => ({
        url: `/mobile/parts/${partId}/status`,
        method: 'PATCH',
        body: { status, quantity, notes },
      }),
      invalidatesTags: (result, error, { partId }) => [
        { type: 'Part', id: partId },
        'Part',
      ],
    }),

    scanPart: builder.mutation({
      query: ({ barcode, jobId }) => ({
        url: '/mobile/parts/scan',
        method: 'POST',
        body: { barcode, jobId },
      }),
      invalidatesTags: ['Part'],
    }),

    receivePart: builder.mutation({
      query: ({ partId, receivedQuantity, condition, photos }) => {
        const formData = new FormData();
        formData.append('receivedQuantity', receivedQuantity.toString());
        formData.append('condition', condition);
        
        if (photos && photos.length > 0) {
          photos.forEach((photo, index) => {
            formData.append(`photos`, {
              uri: photo.uri,
              type: photo.type || 'image/jpeg',
              name: photo.fileName || `part-photo-${index}.jpg`,
            });
          });
        }
        
        return {
          url: `/mobile/parts/${partId}/receive`,
          method: 'POST',
          body: formData,
          headers: {
            'content-type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: (result, error, { partId }) => [
        { type: 'Part', id: partId },
        'Part',
      ],
    }),

    // Vendor endpoints
    getVendors: builder.query({
      query: () => '/mobile/vendors',
      providesTags: ['Vendor'],
    }),

    getVendorContacts: builder.query({
      query: (vendorId) => `/mobile/vendors/${vendorId}/contacts`,
      providesTags: (result, error, vendorId) => [{ type: 'Vendor', id: vendorId }],
    }),

    // Notification endpoints
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20, unreadOnly = false } = {}) => ({
        url: '/mobile/notifications',
        params: { page, limit, unreadOnly },
      }),
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/mobile/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Sync endpoints
    syncData: builder.mutation({
      query: (syncData) => ({
        url: '/mobile/sync',
        method: 'POST',
        body: syncData,
      }),
    }),

    // Time tracking endpoints
    clockIn: builder.mutation({
      query: ({ jobId, location }) => ({
        url: '/mobile/time/clock-in',
        method: 'POST',
        body: { jobId, location },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    clockOut: builder.mutation({
      query: ({ jobId, location, notes }) => ({
        url: '/mobile/time/clock-out',
        method: 'POST',
        body: { jobId, location, notes },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),
  }),
});

export const {
  // Auth
  useLoginMutation,
  useRefreshTokenMutation,
  
  // Jobs
  useGetJobsQuery,
  useGetJobByIdQuery,
  useUpdateJobStatusMutation,
  useAddJobPhotoMutation,
  
  // Parts
  useGetPartsQuery,
  useUpdatePartStatusMutation,
  useScanPartMutation,
  useReceivePartMutation,
  
  // Vendors
  useGetVendorsQuery,
  useGetVendorContactsQuery,
  
  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  
  // Sync
  useSyncDataMutation,
  
  // Time tracking
  useClockInMutation,
  useClockOutMutation,
} = api;