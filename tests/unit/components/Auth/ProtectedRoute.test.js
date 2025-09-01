import React from 'react';
import { screen } from '@testing-library/react';
import { Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../../../../src/components/Auth/ProtectedRoute';
import {
  renderWithProviders,
  createMockUser,
} from '../../../../src/utils/testUtils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => null),
  Outlet: jest.fn(() => (
    <div data-testid='protected-content'>Protected Content</div>
  )),
}));

const MockedNavigate = Navigate;
const MockedOutlet = Outlet;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated User', () => {
    test('renders Outlet when user is authenticated', () => {
      const mockUser = createMockUser();
      const authContextValue = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedOutlet).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(MockedNavigate).not.toHaveBeenCalled();
    });

    test('renders Outlet when isAuthenticated is true regardless of user object', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedOutlet).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(MockedNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated User', () => {
    test('renders Navigate to login when user is not authenticated', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedNavigate).toHaveBeenCalledWith(
        { to: '/login', replace: true },
        {}
      );
      expect(MockedOutlet).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('renders Navigate when user exists but isAuthenticated is false', () => {
      const mockUser = createMockUser();
      const authContextValue = {
        user: mockUser,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedNavigate).toHaveBeenCalledWith(
        { to: '/login', replace: true },
        {}
      );
      expect(MockedOutlet).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles loading state by checking isAuthenticated', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      // Should redirect to login since isAuthenticated is false, regardless of loading state
      expect(MockedNavigate).toHaveBeenCalledWith(
        { to: '/login', replace: true },
        {}
      );
      expect(MockedOutlet).not.toHaveBeenCalled();
    });

    test('works with authenticated user during loading', () => {
      const mockUser = createMockUser();
      const authContextValue = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedOutlet).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(MockedNavigate).not.toHaveBeenCalled();
    });

    test('uses replace navigation to prevent back button issues', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ replace: true }),
        {}
      );
    });

    test('redirects to correct login path', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/login' }),
        {}
      );
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with AuthContext', () => {
      const mockUser = createMockUser({
        username: 'testuser',
        role: 'technician',
      });
      const authContextValue = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      expect(MockedOutlet).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('re-renders correctly when authentication state changes', () => {
      const mockUser = createMockUser();
      let authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      const { rerender } = renderWithProviders(<ProtectedRoute />, {
        authContextValue,
      });

      // Initially should redirect
      expect(MockedNavigate).toHaveBeenCalledWith(
        { to: '/login', replace: true },
        {}
      );

      // Update to authenticated state
      authContextValue = {
        ...authContextValue,
        user: mockUser,
        isAuthenticated: true,
      };

      rerender(<ProtectedRoute />);

      expect(MockedOutlet).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const mockUser = createMockUser();
      const authContextValue = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      const { rerender } = renderWithProviders(<ProtectedRoute />, {
        authContextValue,
      });

      const initialCallCount = MockedOutlet.mock.calls.length;

      // Rerender with same props
      rerender(<ProtectedRoute />);

      // Should have been called again due to rerender
      expect(MockedOutlet.mock.calls.length).toBe(initialCallCount + 1);
    });
  });

  describe('Security', () => {
    test('immediately redirects unauthenticated users', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      // Should immediately call Navigate, not render protected content
      expect(MockedNavigate).toHaveBeenCalled();
      expect(MockedOutlet).not.toHaveBeenCalled();
    });

    test('does not expose protected content to unauthenticated users even briefly', () => {
      const authContextValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        setIsLoading: jest.fn(),
      };

      renderWithProviders(<ProtectedRoute />, { authContextValue });

      // Verify protected content never renders
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
