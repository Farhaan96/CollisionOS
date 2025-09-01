import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import { createMockUser } from '../../../src/utils/testUtils';

// Test component to consume AuthContext
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, setIsLoading } =
    useAuth();

  return (
    <div>
      <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid='isAuthenticated'>{String(isAuthenticated)}</div>
      <div data-testid='isLoading'>{String(isLoading)}</div>
      <button
        data-testid='login-button'
        onClick={() => login(createMockUser(), 'test-token')}
      >
        Login
      </button>
      <button data-testid='logout-button' onClick={logout}>
        Logout
      </button>
      <button
        data-testid='set-loading-button'
        onClick={() => setIsLoading(true)}
      >
        Set Loading
      </button>
    </div>
  );
};

const renderAuthProvider = children => {
  return render(<AuthProvider>{children}</AuthProvider>);
};

describe('AuthContext', () => {
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    localStorage.clear();
  });

  describe('Initial State', () => {
    test('provides initial auth state correctly', () => {
      renderAuthProvider(<TestComponent />);

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    test('throws error when useAuth is called outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const TestComponentWithoutProvider = () => {
        useAuth();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponentWithoutProvider />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Login Functionality', () => {
    test('logs in user successfully with valid data and token', async () => {
      renderAuthProvider(<TestComponent />);
      const user = userEvent.setup();
      const mockUser = createMockUser();

      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(
          JSON.stringify(mockUser)
        );
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(console.log).toHaveBeenCalledWith(
        'AuthContext - Login successful:',
        mockUser
      );
    });

    test('logs in user with default values when userData is null', async () => {
      const TestComponentWithNullUser = () => {
        const { login, user, isAuthenticated } = useAuth();

        return (
          <div>
            <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
            <div data-testid='isAuthenticated'>{String(isAuthenticated)}</div>
            <button
              data-testid='login-null-button'
              onClick={() => login(null, 'test-token')}
            >
              Login with null user
            </button>
          </div>
        );
      };

      renderAuthProvider(<TestComponentWithNullUser />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('login-null-button'));

      const expectedUser = { firstName: 'Admin', role: 'owner' };

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(
          JSON.stringify(expectedUser)
        );
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
    });

    test('uses default token when token is null', async () => {
      const TestComponentWithNullToken = () => {
        const { login, user, isAuthenticated } = useAuth();

        return (
          <div>
            <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
            <div data-testid='isAuthenticated'>{String(isAuthenticated)}</div>
            <button
              data-testid='login-null-token-button'
              onClick={() => login(createMockUser(), null)}
            >
              Login with null token
            </button>
          </div>
        );
      };

      renderAuthProvider(<TestComponentWithNullToken />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('login-null-token-button'));

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('dev-token');
      });
    });

    test('handles login errors gracefully', async () => {
      const TestComponentWithError = () => {
        const { login, user, isAuthenticated } = useAuth();

        // Mock localStorage to throw an error
        const mockSetItem = jest.fn(() => {
          throw new Error('LocalStorage error');
        });
        Object.defineProperty(window, 'localStorage', {
          value: { setItem: mockSetItem },
          writable: true,
        });

        return (
          <div>
            <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
            <div data-testid='isAuthenticated'>{String(isAuthenticated)}</div>
            <button
              data-testid='login-error-button'
              onClick={() => login(createMockUser(), 'test-token')}
            >
              Login with error
            </button>
          </div>
        );
      };

      renderAuthProvider(<TestComponentWithError />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('login-error-button'));

      // Should not change the state when error occurs
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(console.error).toHaveBeenCalledWith(
        'AuthContext - Login error:',
        expect.any(Error)
      );
    });
  });

  describe('Logout Functionality', () => {
    test('logs out user successfully', async () => {
      renderAuthProvider(<TestComponent />);
      const user = userEvent.setup();

      // First login
      await user.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Then logout
      await user.click(screen.getByTestId('logout-button'));
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent(
          'false'
        );
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        'AuthContext - Logout successful'
      );
    });

    test('handles logout errors gracefully', async () => {
      const TestComponentWithLogoutError = () => {
        const { login, logout, user, isAuthenticated } = useAuth();

        return (
          <div>
            <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
            <div data-testid='isAuthenticated'>{String(isAuthenticated)}</div>
            <button
              data-testid='login-button'
              onClick={() => login(createMockUser(), 'test-token')}
            >
              Login
            </button>
            <button
              data-testid='logout-error-button'
              onClick={() => {
                // Mock localStorage to throw an error
                const mockRemoveItem = jest.fn(() => {
                  throw new Error('LocalStorage error');
                });
                Object.defineProperty(window, 'localStorage', {
                  value: { removeItem: mockRemoveItem },
                  writable: true,
                });
                logout();
              }}
            >
              Logout with error
            </button>
          </div>
        );
      };

      renderAuthProvider(<TestComponentWithLogoutError />);
      const user = userEvent.setup();

      // First login
      await user.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Then logout with error
      await user.click(screen.getByTestId('logout-error-button'));

      expect(console.error).toHaveBeenCalledWith(
        'AuthContext - Logout error:',
        expect.any(Error)
      );
    });
  });

  describe('Loading State Management', () => {
    test('manages loading state correctly', async () => {
      renderAuthProvider(<TestComponent />);
      const user = userEvent.setup();

      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');

      await user.click(screen.getByTestId('set-loading-button'));

      expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
    });
  });

  describe('Authentication State Consistency', () => {
    test('isAuthenticated reflects user state correctly', () => {
      renderAuthProvider(<TestComponent />);

      // Initially not authenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    test('isAuthenticated becomes true when user is set', async () => {
      renderAuthProvider(<TestComponent />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
    });

    test('isAuthenticated becomes false when user is null', async () => {
      renderAuthProvider(<TestComponent />);
      const user = userEvent.setup();

      // Login first
      await user.click(screen.getByTestId('login-button'));
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Then logout
      await user.click(screen.getByTestId('logout-button'));
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent(
          'false'
        );
      });
    });
  });

  describe('Context Value Completeness', () => {
    test('provides all expected context values', () => {
      const TestContextValues = () => {
        const context = useAuth();

        return (
          <div>
            <div data-testid='has-user'>
              {typeof context.user !== 'undefined' ? 'yes' : 'no'}
            </div>
            <div data-testid='has-isAuthenticated'>
              {typeof context.isAuthenticated !== 'undefined' ? 'yes' : 'no'}
            </div>
            <div data-testid='has-isLoading'>
              {typeof context.isLoading !== 'undefined' ? 'yes' : 'no'}
            </div>
            <div data-testid='has-login'>
              {typeof context.login === 'function' ? 'yes' : 'no'}
            </div>
            <div data-testid='has-logout'>
              {typeof context.logout === 'function' ? 'yes' : 'no'}
            </div>
            <div data-testid='has-setIsLoading'>
              {typeof context.setIsLoading === 'function' ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      renderAuthProvider(<TestContextValues />);

      expect(screen.getByTestId('has-user')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-isAuthenticated')).toHaveTextContent(
        'yes'
      );
      expect(screen.getByTestId('has-isLoading')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-login')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-logout')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-setIsLoading')).toHaveTextContent('yes');
    });
  });
});
