// Advanced Loading State Management Hook for CollisionOS
// Comprehensive loading state management with progress tracking, error handling, and retry mechanisms

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNotification } from './useNotification';

// Loading state types
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRYING: 'retrying',
  CANCELLED: 'cancelled',
};

// Default configuration
const DEFAULT_CONFIG = {
  minimumLoadTime: 500,
  maximumLoadTime: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  retryBackoff: true,
  autoRetry: false,
  showProgress: true,
  showNotifications: true,
  progressInterval: 100,
  errorMessages: {
    generic: 'Something went wrong. Please try again.',
    timeout: 'Request timed out. Please check your connection.',
    network: 'Network error. Please check your internet connection.',
    server: 'Server error. Please try again later.',
  },
  successMessage: 'Operation completed successfully!',
};

// Progress calculation utilities
const calculateProgress = (startTime, estimatedDuration) => {
  const elapsed = Date.now() - startTime;
  const progress = Math.min((elapsed / estimatedDuration) * 100, 90);
  return Math.round(progress);
};

const getProgressMessage = (progress, context) => {
  const messages = {
    0: `Starting ${context}...`,
    10: `Initializing ${context}...`,
    25: `Processing ${context}...`,
    50: `Almost there...`,
    75: `Finalizing ${context}...`,
    90: `Completing ${context}...`,
  };
  
  const thresholds = Object.keys(messages).map(Number).sort((a, b) => b - a);
  const threshold = thresholds.find(t => progress >= t) || 0;
  return messages[threshold];
};

// Hook implementation
export const useLoadingState = (config = {}) => {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const { notify } = useNotification();
  
  // Core state
  const [state, setState] = useState(LOADING_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Refs for cleanup and control
  const timeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const minimumTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentOperationRef = useRef(null);
  
  // Derived state
  const isLoading = state === LOADING_STATES.LOADING || state === LOADING_STATES.RETRYING;
  const isSuccess = state === LOADING_STATES.SUCCESS;
  const isError = state === LOADING_STATES.ERROR;
  const canRetry = retryCount < finalConfig.retryAttempts && isError;
  const progressMessage = useMemo(() => 
    getProgressMessage(progress, config.context || 'operation'), 
    [progress, config.context]
  );
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (minimumTimeoutRef.current) {
      clearTimeout(minimumTimeoutRef.current);
      minimumTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  // Progress tracking
  const startProgressTracking = useCallback((estimatedDuration = 5000) => {
    if (!finalConfig.showProgress) return;
    
    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const newProgress = calculateProgress(startTime, estimatedDuration);
      setProgress(newProgress);
      
      if (newProgress >= 90) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, finalConfig.progressInterval);
  }, [finalConfig.showProgress, finalConfig.progressInterval]);
  
  // Error handling
  const handleError = useCallback((err, shouldRetry = false) => {
    setError(err);
    
    // Determine error type and message
    let errorMessage = finalConfig.errorMessages.generic;
    if (err.name === 'TimeoutError' || err.code === 'TIMEOUT') {
      errorMessage = finalConfig.errorMessages.timeout;
    } else if (err.name === 'NetworkError' || !navigator.onLine) {
      errorMessage = finalConfig.errorMessages.network;
    } else if (err.status >= 500) {
      errorMessage = finalConfig.errorMessages.server;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    // Show notification if enabled
    if (finalConfig.showNotifications) {
      notify.error(errorMessage, {
        duration: 5000,
        action: canRetry ? {
          label: 'Retry',
          onClick: () => retry(),
        } : undefined,
      });
    }
    
    // Auto-retry logic
    if (shouldRetry && finalConfig.autoRetry && retryCount < finalConfig.retryAttempts) {
      const delay = finalConfig.retryBackoff 
        ? finalConfig.retryDelay * Math.pow(2, retryCount)
        : finalConfig.retryDelay;
      
      setTimeout(() => {
        retry();
      }, delay);
    } else {
      setState(LOADING_STATES.ERROR);
    }
  }, [
    finalConfig.errorMessages, 
    finalConfig.showNotifications, 
    finalConfig.autoRetry, 
    finalConfig.retryAttempts, 
    finalConfig.retryDelay, 
    finalConfig.retryBackoff,
    retryCount,
    notify,
    canRetry
  ]);
  
  // Main execute function
  const execute = useCallback(async (operation, options = {}) => {
    // Cleanup previous operation
    cleanup();
    
    const operationConfig = { ...finalConfig, ...options };
    const operationStartTime = Date.now();
    
    // Reset state
    setState(LOADING_STATES.LOADING);
    setProgress(0);
    setError(null);
    setStartTime(operationStartTime);
    setRetryCount(0);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    // Store operation reference
    currentOperationRef.current = operation;
    
    try {
      // Set up timeout
      if (operationConfig.maximumLoadTime) {
        timeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            const timeoutError = new Error('Operation timed out');
            timeoutError.name = 'TimeoutError';
            timeoutError.code = 'TIMEOUT';
            handleError(timeoutError, operationConfig.autoRetry);
          }
        }, operationConfig.maximumLoadTime);
      }
      
      // Start progress tracking
      if (operationConfig.showProgress) {
        startProgressTracking(operationConfig.estimatedDuration);
      }
      
      // Execute operation
      const result = await operation({
        signal: abortControllerRef.current.signal,
        onProgress: (progressValue, message) => {
          setProgress(Math.min(progressValue, 100));
          if (message && operationConfig.onProgressMessage) {
            operationConfig.onProgressMessage(message);
          }
        },
      });
      
      // Ensure minimum load time
      const elapsed = Date.now() - operationStartTime;
      const remainingTime = Math.max(0, operationConfig.minimumLoadTime - elapsed);
      
      if (remainingTime > 0) {
        minimumTimeoutRef.current = setTimeout(() => {
          finishSuccess(result, operationConfig);
        }, remainingTime);
      } else {
        finishSuccess(result, operationConfig);
      }
      
      return result;
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setState(LOADING_STATES.CANCELLED);
        return;
      }
      
      handleError(err, operationConfig.autoRetry);
      throw err;
    }
  }, [cleanup, finalConfig, handleError, startProgressTracking]);
  
  // Success handler
  const finishSuccess = useCallback((result, operationConfig) => {
    cleanup();
    setState(LOADING_STATES.SUCCESS);
    setProgress(100);
    
    if (operationConfig.showNotifications && operationConfig.successMessage) {
      notify.success(operationConfig.successMessage, {
        duration: 3000,
      });
    }
    
    if (operationConfig.onSuccess) {
      operationConfig.onSuccess(result);
    }
    
    // Auto-reset after success
    if (operationConfig.autoReset !== false) {
      setTimeout(() => {
        reset();
      }, operationConfig.resetDelay || 2000);
    }
  }, [cleanup, notify]);
  
  // Retry function
  const retry = useCallback(async () => {
    if (!currentOperationRef.current || retryCount >= finalConfig.retryAttempts) {
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setState(LOADING_STATES.RETRYING);
    
    try {
      await execute(currentOperationRef.current, {
        ...finalConfig,
        autoRetry: false, // Prevent infinite retry loop
      });
    } catch (err) {
      // Error already handled by execute
    }
  }, [execute, finalConfig, retryCount]);
  
  // Cancel function
  const cancel = useCallback(() => {
    cleanup();
    setState(LOADING_STATES.CANCELLED);
    setProgress(0);
    
    if (finalConfig.onCancel) {
      finalConfig.onCancel();
    }
  }, [cleanup, finalConfig]);
  
  // Reset function
  const reset = useCallback(() => {
    cleanup();
    setState(LOADING_STATES.IDLE);
    setProgress(0);
    setError(null);
    setRetryCount(0);
    setStartTime(null);
    currentOperationRef.current = null;
  }, [cleanup]);
  
  // Manual progress update
  const updateProgress = useCallback((value, message) => {
    setProgress(Math.min(Math.max(value, 0), 100));
    if (message && finalConfig.onProgressMessage) {
      finalConfig.onProgressMessage(message);
    }
  }, [finalConfig]);
  
  // Set success state manually
  const setSuccess = useCallback((result) => {
    cleanup();
    setState(LOADING_STATES.SUCCESS);
    setProgress(100);
    
    if (finalConfig.onSuccess) {
      finalConfig.onSuccess(result);
    }
  }, [cleanup, finalConfig]);
  
  // Set error state manually
  const setErrorManually = useCallback((err) => {
    handleError(err, false);
  }, [handleError]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Performance monitoring
  const duration = startTime ? Date.now() - startTime : 0;
  
  return {
    // State
    state,
    isLoading,
    isSuccess,
    isError,
    isIdle: state === LOADING_STATES.IDLE,
    isRetrying: state === LOADING_STATES.RETRYING,
    isCancelled: state === LOADING_STATES.CANCELLED,
    
    // Progress
    progress,
    progressMessage,
    
    // Error handling
    error,
    retryCount,
    canRetry,
    
    // Actions
    execute,
    retry,
    cancel,
    reset,
    updateProgress,
    setSuccess,
    setError: setErrorManually,
    
    // Utilities
    duration,
    config: finalConfig,
    
    // Promise-based helpers
    executeAsync: execute,
    
    // Wrapper functions for common patterns
    withLoading: useCallback(async (operation) => {
      try {
        return await execute(operation);
      } catch (err) {
        return Promise.reject(err);
      }
    }, [execute]),
    
    withProgressTracking: useCallback(async (operation, estimatedDuration = 5000) => {
      return execute(operation, { 
        estimatedDuration, 
        showProgress: true 
      });
    }, [execute]),
    
    withRetry: useCallback(async (operation, maxAttempts = 3) => {
      return execute(operation, { 
        retryAttempts: maxAttempts, 
        autoRetry: true 
      });
    }, [execute]),
  };
};

// Preset configurations for common use cases
export const LOADING_PRESETS = {
  // Quick operations (API calls, form submissions)
  quick: {
    minimumLoadTime: 300,
    maximumLoadTime: 10000,
    retryAttempts: 2,
    showProgress: false,
    estimatedDuration: 2000,
  },
  
  // Data loading operations
  dataLoading: {
    minimumLoadTime: 500,
    maximumLoadTime: 30000,
    retryAttempts: 3,
    showProgress: true,
    estimatedDuration: 5000,
    autoRetry: true,
  },
  
  // File upload operations
  fileUpload: {
    minimumLoadTime: 0,
    maximumLoadTime: 300000, // 5 minutes
    retryAttempts: 2,
    showProgress: true,
    progressInterval: 250,
    autoRetry: false,
  },
  
  // Background sync operations
  backgroundSync: {
    minimumLoadTime: 0,
    maximumLoadTime: 120000, // 2 minutes
    retryAttempts: 5,
    showProgress: false,
    showNotifications: false,
    autoRetry: true,
    retryBackoff: true,
  },
  
  // Critical operations (payments, important updates)
  critical: {
    minimumLoadTime: 1000,
    maximumLoadTime: 60000,
    retryAttempts: 1,
    showProgress: true,
    showNotifications: true,
    autoRetry: false,
  },
};

// Convenience hook for common patterns
export const useQuickLoading = (config) => 
  useLoadingState({ ...LOADING_PRESETS.quick, ...config });

export const useDataLoading = (config) => 
  useLoadingState({ ...LOADING_PRESETS.dataLoading, ...config });

export const useFileUpload = (config) => 
  useLoadingState({ ...LOADING_PRESETS.fileUpload, ...config });

export const useBackgroundSync = (config) => 
  useLoadingState({ ...LOADING_PRESETS.backgroundSync, ...config });

export const useCriticalLoading = (config) => 
  useLoadingState({ ...LOADING_PRESETS.critical, ...config });

export default useLoadingState;