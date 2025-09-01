// Unit tests for useLoadingState hook
// Testing comprehensive loading state management with progress tracking and error handling

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useLoadingState,
  useQuickLoading,
  useDataLoading,
  useFileUpload,
  useBackgroundSync,
  useCriticalLoading,
  LOADING_STATES,
  LOADING_PRESETS,
} from '../../../src/hooks/useLoadingState';

// Mock useNotification hook
const mockNotify = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => ({ notify: mockNotify }),
}));

// Mock timers
vi.useFakeTimers();

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with idle state', () => {
      const { result } = renderHook(() => useLoadingState());

      expect(result.current.state).toBe(LOADING_STATES.IDLE);
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
    });

    it('applies custom configuration', () => {
      const config = {
        minimumLoadTime: 1000,
        retryAttempts: 5,
        showNotifications: false,
      };

      const { result } = renderHook(() => useLoadingState(config));

      expect(result.current.config.minimumLoadTime).toBe(1000);
      expect(result.current.config.retryAttempts).toBe(5);
      expect(result.current.config.showNotifications).toBe(false);
    });
  });

  describe('Execute Operation', () => {
    it('transitions to loading state when operation starts', async () => {
      const { result } = renderHook(() => useLoadingState());

      const mockOperation = vi.fn().mockResolvedValue('success');

      act(() => {
        result.current.execute(mockOperation);
      });

      expect(result.current.state).toBe(LOADING_STATES.LOADING);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.progress).toBe(0);

      await waitFor(() => {
        expect(result.current.state).toBe(LOADING_STATES.SUCCESS);
      });
    });

    it('handles successful operation', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          minimumLoadTime: 0,
          showNotifications: true,
          successMessage: 'Operation successful!',
        })
      );

      const mockOperation = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        const resultData = await result.current.execute(mockOperation);
        expect(resultData).toBe('success data');
      });

      expect(result.current.state).toBe(LOADING_STATES.SUCCESS);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.progress).toBe(100);
      expect(mockNotify.success).toHaveBeenCalledWith('Operation successful!', {
        duration: 3000,
      });
    });

    it('handles operation errors', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ showNotifications: true })
      );

      const error = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (err) {
          expect(err).toBe(error);
        }
      });

      expect(result.current.state).toBe(LOADING_STATES.ERROR);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
      expect(mockNotify.error).toHaveBeenCalled();
    });

    it('respects minimum load time', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ minimumLoadTime: 1000 })
      );

      const mockOperation = vi.fn().mockResolvedValue('quick success');

      act(() => {
        result.current.execute(mockOperation);
      });

      expect(result.current.isLoading).toBe(true);

      // Fast forward past operation completion but before minimum time
      await act(async () => {
        await mockOperation;
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isLoading).toBe(true);

      // Fast forward to complete minimum time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles operation timeout', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          maximumLoadTime: 1000,
          showNotifications: true,
        })
      );

      const mockOperation = vi.fn(() => new Promise(() => {})); // Never resolves

      act(() => {
        result.current.execute(mockOperation);
      });

      expect(result.current.isLoading).toBe(true);

      // Fast forward to trigger timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error.name).toBe('TimeoutError');
      });
    });

    it('supports progress tracking', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          showProgress: true,
          progressInterval: 100,
          minimumLoadTime: 0,
        })
      );

      const mockOperation = vi.fn(({ onProgress }) => {
        return new Promise(resolve => {
          setTimeout(() => {
            onProgress(50, 'Half way done');
            setTimeout(() => {
              onProgress(100, 'Complete');
              resolve('success');
            }, 100);
          }, 100);
        });
      });

      act(() => {
        result.current.execute(mockOperation);
      });

      // Fast forward to trigger progress updates
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('supports operation cancellation', () => {
      const { result } = renderHook(() => useLoadingState());

      const mockOperation = vi.fn(({ signal }) => {
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          setTimeout(resolve, 1000);
        });
      });

      act(() => {
        result.current.execute(mockOperation);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isCancelled).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Retry Mechanism', () => {
    it('enables retry when operation fails', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ retryAttempts: 3 })
      );

      const error = new Error('Network error');
      const mockOperation = vi.fn().mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (err) {
          // Expected to fail
        }
      });

      expect(result.current.canRetry).toBe(true);
      expect(result.current.retryCount).toBe(0);
    });

    it('performs manual retry', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          retryAttempts: 3,
          minimumLoadTime: 0,
        })
      );

      const error = new Error('Network error');
      let callCount = 0;
      const mockOperation = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error);
        }
        return Promise.resolve('success on retry');
      });

      // First attempt - fails
      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (err) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);

      // Retry - succeeds
      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.retryCount).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('performs auto-retry with backoff', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          autoRetry: true,
          retryAttempts: 2,
          retryDelay: 500,
          retryBackoff: true,
          minimumLoadTime: 0,
        })
      );

      let callCount = 0;
      const mockOperation = vi.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error(`Attempt ${callCount} failed`));
        }
        return Promise.resolve('success after retries');
      });

      act(() => {
        result.current.execute(mockOperation);
      });

      // Wait for initial failure
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // First retry after 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(true);
      });

      // Second retry after 1000ms (backoff)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(mockOperation).toHaveBeenCalledTimes(3);
      });
    });

    it('stops retrying after max attempts', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          autoRetry: true,
          retryAttempts: 2,
          retryDelay: 100,
          minimumLoadTime: 0,
        })
      );

      const error = new Error('Persistent error');
      const mockOperation = vi.fn().mockRejectedValue(error);

      act(() => {
        result.current.execute(mockOperation);
      });

      // Wait for all retries to complete
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          expect(result.current.isError || result.current.isRetrying).toBe(
            true
          );
        });
        act(() => {
          vi.advanceTimersByTime(100 * Math.pow(2, i));
        });
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.canRetry).toBe(false);
        expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });
    });
  });

  describe('Manual State Management', () => {
    it('allows manual progress updates', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.updateProgress(75, 'Custom progress message');
      });

      expect(result.current.progress).toBe(75);
    });

    it('allows manual success state', () => {
      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useLoadingState({ onSuccess: mockOnSuccess })
      );

      const successData = { id: 1, name: 'test' };

      act(() => {
        result.current.setSuccess(successData);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.progress).toBe(100);
      expect(mockOnSuccess).toHaveBeenCalledWith(successData);
    });

    it('allows manual error state', () => {
      const { result } = renderHook(() => useLoadingState());

      const error = new Error('Manual error');

      act(() => {
        result.current.setError(error);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });

    it('resets to initial state', () => {
      const { result } = renderHook(() => useLoadingState());

      // Set some state
      act(() => {
        result.current.updateProgress(50);
        result.current.setError(new Error('test'));
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.progress).toBe(50);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Preset Configurations', () => {
    it('useQuickLoading has correct defaults', () => {
      const { result } = renderHook(() => useQuickLoading());

      expect(result.current.config).toMatchObject({
        minimumLoadTime: LOADING_PRESETS.quick.minimumLoadTime,
        retryAttempts: LOADING_PRESETS.quick.retryAttempts,
        showProgress: LOADING_PRESETS.quick.showProgress,
      });
    });

    it('useDataLoading has correct defaults', () => {
      const { result } = renderHook(() => useDataLoading());

      expect(result.current.config).toMatchObject({
        minimumLoadTime: LOADING_PRESETS.dataLoading.minimumLoadTime,
        autoRetry: LOADING_PRESETS.dataLoading.autoRetry,
        showProgress: LOADING_PRESETS.dataLoading.showProgress,
      });
    });

    it('useFileUpload has correct defaults', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.config).toMatchObject({
        maximumLoadTime: LOADING_PRESETS.fileUpload.maximumLoadTime,
        showProgress: LOADING_PRESETS.fileUpload.showProgress,
        progressInterval: LOADING_PRESETS.fileUpload.progressInterval,
      });
    });

    it('useBackgroundSync has correct defaults', () => {
      const { result } = renderHook(() => useBackgroundSync());

      expect(result.current.config).toMatchObject({
        showNotifications: LOADING_PRESETS.backgroundSync.showNotifications,
        autoRetry: LOADING_PRESETS.backgroundSync.autoRetry,
        retryBackoff: LOADING_PRESETS.backgroundSync.retryBackoff,
      });
    });

    it('useCriticalLoading has correct defaults', () => {
      const { result } = renderHook(() => useCriticalLoading());

      expect(result.current.config).toMatchObject({
        retryAttempts: LOADING_PRESETS.critical.retryAttempts,
        autoRetry: LOADING_PRESETS.critical.autoRetry,
        showNotifications: LOADING_PRESETS.critical.showNotifications,
      });
    });
  });

  describe('Helper Methods', () => {
    it('withLoading wrapper works correctly', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ minimumLoadTime: 0 })
      );

      const mockOperation = vi.fn().mockResolvedValue('wrapped success');

      const wrappedResult = await act(async () => {
        return result.current.withLoading(mockOperation);
      });

      expect(wrappedResult).toBe('wrapped success');
      expect(result.current.isSuccess).toBe(true);
    });

    it('withProgressTracking wrapper works correctly', async () => {
      const { result } = renderHook(() =>
        useLoadingState({
          minimumLoadTime: 0,
          showProgress: true,
        })
      );

      const mockOperation = vi.fn().mockResolvedValue('progress success');

      await act(async () => {
        await result.current.withProgressTracking(mockOperation, 1000);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('withRetry wrapper works correctly', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ minimumLoadTime: 0 })
      );

      let callCount = 0;
      const mockOperation = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First attempt fails'));
        }
        return Promise.resolve('retry success');
      });

      // This should auto-retry once and succeed
      await act(async () => {
        try {
          await result.current.withRetry(mockOperation, 2);
        } catch (err) {
          // Handle expected initial failure
        }
      });

      // Wait for auto-retry
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid successive calls', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ minimumLoadTime: 0 })
      );

      const mockOperation1 = vi.fn().mockResolvedValue('first');
      const mockOperation2 = vi.fn().mockResolvedValue('second');

      // Start first operation
      act(() => {
        result.current.execute(mockOperation1);
      });

      // Immediately start second operation (should cancel first)
      act(() => {
        result.current.execute(mockOperation2);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second operation should complete
      expect(mockOperation2).toHaveBeenCalled();
    });

    it('handles network offline/online scenarios', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() =>
        useLoadingState({ showNotifications: true })
      );

      const networkError = new Error('Network unavailable');
      networkError.name = 'NetworkError';
      const mockOperation = vi.fn().mockRejectedValue(networkError);

      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (err) {
          // Expected to fail
        }
      });

      expect(mockNotify.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
        expect.any(Object)
      );

      // Reset navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });
    });

    it('calculates duration correctly', async () => {
      const { result } = renderHook(() =>
        useLoadingState({ minimumLoadTime: 0 })
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const startTime = Date.now();

      await act(async () => {
        await result.current.execute(mockOperation);
      });

      const endTime = Date.now();
      const expectedDuration = endTime - startTime;

      expect(result.current.duration).toBeGreaterThanOrEqual(0);
      expect(result.current.duration).toBeLessThanOrEqual(
        expectedDuration + 100
      ); // Allow some tolerance
    });
  });
});
