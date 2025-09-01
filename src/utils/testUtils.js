import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider } from '../contexts/ThemeContext';

// Import AuthContext
import AuthContext from '../contexts/AuthContext';

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
});

// Enhanced render function with all providers
export function renderWithProviders(
  ui,
  {
    initialEntries = ['/'],
    theme = testTheme,
    user = null,
    authContextValue = {},
    ...renderOptions
  } = {}
) {
  const defaultAuthValue = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    setIsLoading: jest.fn(),
    ...authContextValue,
  };

  // Mock AuthContext.Provider for testing
  const MockAuthProvider = ({ children }) => (
    <AuthContext.Provider value={defaultAuthValue}>
      {children}
    </AuthContext.Provider>
  );

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ThemeContextProvider>
            <MockAuthProvider>{children}</MockAuthProvider>
          </ThemeContextProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return {
    user: userEvent,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Simplified render for components that don't need all providers
export function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  function RouterWrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return {
    user: userEvent,
    ...render(ui, { wrapper: RouterWrapper }),
  };
}

// Mock user data factory
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'technician',
  department: 'body_shop',
  shopId: 1,
  isActive: true,
  ...overrides,
});

// Mock job data factory
export const createMockJob = (overrides = {}) => ({
  id: 1,
  jobNumber: 'JOB-2024-001',
  customerId: 1,
  vehicleId: 1,
  status: 'in_progress',
  priority: 'medium',
  estimatedHours: 8,
  actualHours: 4,
  description: 'Test job description',
  assignedTechnicianId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-0123',
    email: 'john@example.com',
  },
  vehicle: {
    id: 1,
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    vin: '1234567890ABCDEF',
    licensePlate: 'ABC123',
  },
  ...overrides,
});

// Mock customer data factory
export const createMockCustomer = (overrides = {}) => ({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-0123',
  address: '123 Main St',
  city: 'Anytown',
  state: 'ST',
  zipCode: '12345',
  insuranceCompany: 'State Farm',
  insurancePolicyNumber: 'SF123456',
  ...overrides,
});

// API mock helpers
export const mockApiSuccess = (data = {}) => ({
  success: true,
  data,
  status: 200,
});

export const mockApiError = (message = 'An error occurred', status = 500) => ({
  success: false,
  error: message,
  status,
});

// Mock fetch responses
export const mockFetchSuccess = data =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockApiSuccess(data)),
  });

export const mockFetchError = (message, status = 500) =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(mockApiError(message, status)),
  });

// Authentication helpers
export const mockAuthenticatedUser = (userOverrides = {}) => {
  const user = createMockUser(userOverrides);
  localStorage.setItem('token', 'mock-jwt-token');
  return user;
};

export const mockUnauthenticatedUser = () => {
  localStorage.removeItem('token');
  return null;
};

// Socket.io mock helpers
export const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
  id: 'mock-socket-id',
});

// Chart.js mock data
export const createMockChartData = (labels = [], datasets = []) => ({
  labels,
  datasets: datasets.length
    ? datasets
    : [
        {
          label: 'Test Dataset',
          data: [10, 20, 30, 40, 50],
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          borderColor: '#1976d2',
          borderWidth: 2,
        },
      ],
});

// Form testing helpers
export const fillForm = async fields => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await userEvent.clear(field);
    await userEvent.type(field, value);
  }
};

export const submitForm = async (buttonText = 'submit') => {
  const submitButton = screen.getByRole('button', {
    name: new RegExp(buttonText, 'i'),
  });
  await userEvent.click(submitButton);
};

// Async utilities
export const waitForLoadingToFinish = () =>
  waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

export const waitForErrorMessage = message =>
  waitFor(() =>
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument()
  );

// Component testing utilities
export const expectElementToBeVisible = element => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element, text) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

// Mock console methods for specific tests
export const mockConsole = () => {
  const originalConsole = { ...console };
  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  return {
    expectConsoleError: message => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    },
    expectConsoleWarn: message => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    },
  };
};

// Local storage testing helpers
export const mockLocalStorage = () => {
  const store = {};

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          Object.keys(store).forEach(key => delete store[key]);
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
  });

  return store;
};

// Material-UI specific helpers
export const getByMuiTestId = testId => screen.getByTestId(testId);
export const queryByMuiTestId = testId => screen.queryByTestId(testId);

// Custom matchers
expect.extend({
  toHaveValidationError(received, expectedError) {
    const hasError = received.querySelector(
      '.Mui-error, .error, [data-testid*="error"]'
    );
    const errorText = hasError?.textContent;

    const pass =
      hasError && (!expectedError || errorText?.includes(expectedError));

    return {
      message: () =>
        pass
          ? `Expected element not to have validation error${expectedError ? ` "${expectedError}"` : ''}`
          : `Expected element to have validation error${expectedError ? ` "${expectedError}"` : ''}`,
      pass,
    };
  },
});

// Export all testing library utilities for convenience
export * from '@testing-library/react';
export { userEvent };

// Re-export commonly used testing utilities
export { screen, fireEvent, waitFor, within } from '@testing-library/react';
