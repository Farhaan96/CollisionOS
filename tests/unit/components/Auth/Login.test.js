import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import Login from '../../../../src/pages/Auth/Login';
import {
  renderWithProviders,
  createMockUser,
} from '../../../../src/utils/testUtils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock AuthContext
const mockLogin = jest.fn();
jest.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: jest.fn(),
    setIsLoading: jest.fn(),
  }),
}));

describe('Login Component', () => {
  let mockNavigate;
  let user;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    // userEvent v13 doesn't have setup(), just use userEvent directly
    user = userEvent;
    mockLogin.mockClear();
    mockNavigate.mockClear();

    // Mock document.body.classList
    document.body.classList.add = jest.fn();
    document.body.classList.remove = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders login form with all required elements', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('CollisionOS')).toBeInTheDocument();
      expect(
        screen.getByText('Executive-Grade Business Management Suite')
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    test('renders premium demo accounts section', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Executive Demo Access')).toBeInTheDocument();
      expect(screen.getByText('Chief Executive')).toBeInTheDocument();
      expect(screen.getByText('Operations Manager')).toBeInTheDocument();
      expect(screen.getByText('Senior Estimator')).toBeInTheDocument();
      expect(screen.getByText('admin / admin123')).toBeInTheDocument();
      expect(screen.getByText('manager / manager123')).toBeInTheDocument();
      expect(screen.getByText('estimator / estimator123')).toBeInTheDocument();
    });

    test('renders premium UI elements', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('AI Analytics')).toBeInTheDocument();
      expect(screen.getByText('Cloud Sync')).toBeInTheDocument();
    });

    test('focuses username field on mount', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);

      await waitFor(
        () => {
          expect(usernameField).toHaveFocus();
        },
        { timeout: 200 }
      );
    });

    test('adds and removes login-page class from body', () => {
      const { unmount } = renderWithProviders(<Login />);

      expect(document.body.classList.add).toHaveBeenCalledWith('login-page');

      unmount();

      expect(document.body.classList.remove).toHaveBeenCalledWith('login-page');
    });
  });

  describe('Form Interactions', () => {
    test('updates username field on input', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'testuser');

      expect(usernameField).toHaveValue('testuser');
    });

    test('updates password field on input', async () => {
      renderWithProviders(<Login />);

      const passwordField = screen.getByLabelText(/password/i);
      await user.type(passwordField, 'testpass');

      expect(passwordField).toHaveValue('testpass');
    });

    test('toggles password visibility on eye icon click', async () => {
      renderWithProviders(<Login />);

      const passwordField = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', {
        name: /toggle password visibility/i,
      });

      // Initially password type
      expect(passwordField).toHaveAttribute('type', 'password');

      await user.click(toggleButton);

      // After click, should be text type
      expect(passwordField).toHaveAttribute('type', 'text');

      await user.click(toggleButton);

      // After another click, back to password type
      expect(passwordField).toHaveAttribute('type', 'password');
    });

    test('submits form on enter key press in username field', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.type(usernameField, '{enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test('submits form on enter key press in password field', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.type(passwordField, '{enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows error when username is empty', async () => {
      renderWithProviders(<Login />);

      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter both username and password')
        ).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows error when password is empty', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter both username and password')
        ).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows error when both fields are empty', async () => {
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter both username and password')
        ).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Flow', () => {
    test('successfully logs in with valid admin credentials', async () => {
      mockLogin.mockResolvedValue();
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockLogin).toHaveBeenCalledWith(
            {
              username: 'admin',
              role: 'owner',
              firstName: 'Admin',
              avatar: 'A',
            },
            'dev-token'
          );
        },
        { timeout: 3000 }
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('successfully logs in with valid manager credentials', async () => {
      mockLogin.mockResolvedValue();
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'manager');
      await user.type(passwordField, 'manager123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockLogin).toHaveBeenCalledWith(
            {
              username: 'manager',
              role: 'manager',
              firstName: 'Manager',
              avatar: 'M',
            },
            'dev-token'
          );
        },
        { timeout: 3000 }
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('successfully logs in with valid estimator credentials', async () => {
      mockLogin.mockResolvedValue();
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'estimator');
      await user.type(passwordField, 'estimator123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockLogin).toHaveBeenCalledWith(
            {
              username: 'estimator',
              role: 'estimator',
              firstName: 'Estimator',
              avatar: 'E',
            },
            'dev-token'
          );
        },
        { timeout: 3000 }
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('shows error for invalid credentials', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'invalid');
      await user.type(passwordField, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles login context error gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Context error'));
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Context error')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    test('shows loading state during authentication', async () => {
      mockLogin.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('disables form during loading', async () => {
      mockLogin.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      // Try to interact with form elements while loading
      await user.type(usernameField, 'newtext');
      await user.type(passwordField, 'newtext');

      // Form should still have original values (disabled)
      expect(usernameField).toHaveValue('admin');
      expect(passwordField).toHaveValue('admin123');
    });

    test('resets loading state after successful login', async () => {
      mockLogin.mockResolvedValue();
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    test('resets loading state after login error', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'invalid');
      await user.type(passwordField, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays and clears error messages properly', async () => {
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First, trigger an error
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter both username and password')
        ).toBeInTheDocument();
      });

      // Then, fill the form and submit again (should clear error)
      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter both username and password')
        ).not.toBeInTheDocument();
      });
    });

    test('shows default error message for unknown errors', async () => {
      mockLogin.mockRejectedValue(new Error());
      renderWithProviders(<Login />);

      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'admin');
      await user.type(passwordField, 'admin123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Login failed. Please check your credentials.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders(<Login />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('has proper button roles', () => {
      renderWithProviders(<Login />);

      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /toggle password visibility/i })
      ).toBeInTheDocument();
    });

    test('error messages are announced to screen readers', async () => {
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(
          'Please enter both username and password'
        );
      });
    });
  });
});
