import authService from '../../../src/services/authService';

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    test('successfully logs in with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, username: 'testuser', role: 'technician' },
          token: 'jwt-token',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await authService.login('testuser', 'password123');

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles login failure with invalid credentials', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(authService.login('invalid', 'invalid')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid',
          password: 'invalid',
        }),
      });
    });

    test('handles network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.login('user', 'pass')).rejects.toThrow(
        'Network error'
      );
    });

    test('handles missing credentials', async () => {
      await expect(authService.login('', '')).rejects.toThrow();

      await expect(authService.login(null, null)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    test('successfully logs out user', async () => {
      const mockResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Set up token first
      localStorage.setItem('token', 'test-token');

      const result = await authService.logout();

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles logout when no token exists', async () => {
      // No token in localStorage
      const result = await authService.logout();

      // Should still attempt logout
      expect(fetch).toHaveBeenCalled();
    });

    test('handles logout server error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      localStorage.setItem('token', 'test-token');

      await expect(authService.logout()).rejects.toThrow('Server error');
    });
  });

  describe('getCurrentUser', () => {
    test('returns current user when token is valid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'technician',
      };

      const mockResponse = {
        success: true,
        data: { user: mockUser },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      localStorage.setItem('token', 'valid-token');

      const result = await authService.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    test('returns null when no token exists', async () => {
      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('handles invalid token response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      localStorage.setItem('token', 'invalid-token');

      await expect(authService.getCurrentUser()).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('refreshToken', () => {
    test('successfully refreshes token', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'new-jwt-token' },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      localStorage.setItem('token', 'old-token');

      const result = await authService.refreshToken();

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer old-token',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles refresh failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Refresh failed' }),
      });

      localStorage.setItem('token', 'expired-token');

      await expect(authService.refreshToken()).rejects.toThrow(
        'Refresh failed'
      );
    });
  });

  describe('utility methods', () => {
    test('getToken returns stored token', () => {
      localStorage.setItem('token', 'test-token');

      expect(authService.getToken()).toBe('test-token');
    });

    test('getToken returns null when no token stored', () => {
      expect(authService.getToken()).toBeNull();
    });

    test('isAuthenticated returns true when token exists', () => {
      localStorage.setItem('token', 'test-token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    test('isAuthenticated returns false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('setToken stores token in localStorage', () => {
      authService.setToken('new-token');

      expect(localStorage.getItem('token')).toBe('new-token');
    });

    test('clearToken removes token from localStorage', () => {
      localStorage.setItem('token', 'test-token');

      authService.clearToken();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
