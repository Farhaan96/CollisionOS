/**
 * useApi and useMutation hooks - CollisionOS
 *
 * Reusable hooks for API data fetching with automatic loading/error states
 * Follows modern React patterns and best practices
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useApi Hook - For fetching data (GET requests)
 *
 * @param {Function} apiFunction - The API function to call
 * @param {Array} dependencies - Dependencies array for refetching
 * @param {Object} options - Additional options
 * @returns {Object} { data, loading, error, refetch }
 *
 * @example
 * const { data: customers, loading, error, refetch } = useApi(
 *   () => customerService.getAll(),
 *   []
 * );
 */
export function useApi(apiFunction, dependencies = [], options = {}) {
  const {
    immediate = true, // Whether to fetch immediately
    onSuccess = null, // Callback on success
    onError = null, // Callback on error
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await apiFunction();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Handle both direct data and { success, data } pattern
        const responseData = response?.data !== undefined ? response.data : response;
        setData(responseData);

        if (onSuccess) {
          onSuccess(responseData);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);

        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, onSuccess, onError]);

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch function
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * useMutation Hook - For mutations (POST, PUT, DELETE requests)
 *
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Additional options
 * @returns {Object} { mutate, loading, error, reset }
 *
 * @example
 * const { mutate: deleteCustomer, loading } = useMutation(
 *   (id) => customerService.delete(id),
 *   {
 *     onSuccess: () => refetchCustomers(),
 *     onError: (err) => toast.error(err.message)
 *   }
 * );
 */
export function useMutation(apiFunction, options = {}) {
  const {
    onSuccess = null,
    onError = null,
    onSettled = null, // Called regardless of success/error
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFunction(...args);

        if (isMountedRef.current) {
          // Handle both direct data and { success, data } pattern
          const responseData = response?.data !== undefined ? response.data : response;
          setData(responseData);

          if (onSuccess) {
            onSuccess(responseData, ...args);
          }

          return responseData;
        }
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage = err?.message || 'An error occurred';
          setError(errorMessage);

          if (onError) {
            onError(err, ...args);
          }

          throw err; // Re-throw so caller can handle it
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);

          if (onSettled) {
            onSettled();
          }
        }
      }
    },
    [apiFunction, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { mutate, loading, error, data, reset };
}

/**
 * useApiWithPagination Hook - For paginated API calls
 *
 * @param {Function} apiFunction - The API function to call
 * @param {Object} initialParams - Initial pagination parameters
 * @returns {Object} { data, loading, error, page, setPage, totalPages, refetch }
 *
 * @example
 * const { data: customers, loading, page, setPage, totalPages } = useApiWithPagination(
 *   (params) => customerService.getAll(params),
 *   { page: 1, limit: 25 }
 * );
 */
export function useApiWithPagination(apiFunction, initialParams = {}) {
  const [params, setParams] = useState({
    page: 1,
    limit: 25,
    ...initialParams,
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFunction(params);

      if (isMountedRef.current) {
        const responseData = response?.data || response;
        const pagination = response?.pagination || {};

        setData(responseData);
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.totalCount || responseData.length);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, params]);

  useEffect(() => {
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const setPage = useCallback((page) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setFilters = useCallback((filters) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    page: params.page,
    limit: params.limit,
    setPage,
    setLimit,
    setFilters,
    totalPages,
    totalCount,
    refetch,
  };
}

/**
 * useApiCache Hook - For caching API responses
 *
 * @param {string} cacheKey - Unique key for caching
 * @param {Function} apiFunction - The API function to call
 * @param {number} cacheTime - Cache duration in milliseconds (default: 5 minutes)
 * @returns {Object} { data, loading, error, refetch, invalidate }
 *
 * @example
 * const { data: products, loading } = useApiCache(
 *   'products-list',
 *   () => productService.getAll(),
 *   5 * 60 * 1000 // 5 minutes
 * );
 */
export function useApiCache(cacheKey, apiFunction, cacheTime = 5 * 60 * 1000) {
  const [data, setData] = useState(() => {
    // Try to load from cache on mount
    const cached = sessionStorage.getItem(`api_cache_${cacheKey}`);
    if (cached) {
      const { data: cachedData, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTime) {
        return cachedData;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFunction();

      if (isMountedRef.current) {
        const responseData = response?.data !== undefined ? response.data : response;
        setData(responseData);

        // Store in cache
        sessionStorage.setItem(
          `api_cache_${cacheKey}`,
          JSON.stringify({
            data: responseData,
            timestamp: Date.now(),
          })
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, cacheKey]);

  useEffect(() => {
    if (!data) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, data]);

  const invalidate = useCallback(() => {
    sessionStorage.removeItem(`api_cache_${cacheKey}`);
    setData(null);
    fetchData();
  }, [cacheKey, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, invalidate };
}

// Export all hooks
export default {
  useApi,
  useMutation,
  useApiWithPagination,
  useApiCache,
};
