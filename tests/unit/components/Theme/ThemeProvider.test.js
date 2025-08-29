import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../../../../src/components/Theme/ThemeProvider';

// Test component to access theme context
const TestComponent = ({ onThemeChange }) => {
  const {
    currentTheme,
    isDarkMode,
    switchTheme,
    toggleTheme,
    themeConfigs,
    getActiveTheme
  } = useTheme();

  React.useEffect(() => {
    if (onThemeChange) {
      onThemeChange({
        currentTheme,
        isDarkMode,
        activeTheme: getActiveTheme()
      });
    }
  }, [currentTheme, isDarkMode, onThemeChange, getActiveTheme]);

  return (
    <div data-testid="test-component">
      <span data-testid="current-theme">{currentTheme}</span>
      <span data-testid="is-dark">{isDarkMode ? 'dark' : 'light'}</span>
      <span data-testid="theme-count">{Object.keys(themeConfigs).length}</span>
      <button data-testid="switch-to-light" onClick={() => switchTheme('light')}>
        Switch to Light
      </button>
      <button data-testid="switch-to-dark" onClick={() => switchTheme('dark')}>
        Switch to Dark
      </button>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock matchMedia
const mockMatchMedia = (matches) => ({
  matches,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => mockMatchMedia(false)),
    });
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
  });

  it('provides default theme context', () => {
    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    expect(themeData.currentTheme).toBe('modern'); // Default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('modern');
  });

  it('detects system dark mode preference', () => {
    window.matchMedia = jest.fn().mockImplementation(query => 
      mockMatchMedia(query === '(prefers-color-scheme: dark)')
    );

    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    // Should detect system preference but still use default theme
    expect(themeData.currentTheme).toBe('modern');
  });

  it('loads saved theme from localStorage', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'collisionos-theme') return 'light';
      return null;
    });

    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    expect(themeData.currentTheme).toBe('light');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('switches themes correctly', async () => {
    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    expect(themeData.currentTheme).toBe('modern');

    // Switch to light theme
    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-light'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    // Verify localStorage was called
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('collisionos-theme', 'light');

    // Switch to dark theme
    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-dark'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('collisionos-theme', 'dark');
  });

  it('toggles between themes correctly', async () => {
    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    const originalTheme = themeData.currentTheme;

    // Toggle theme
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-theme'));
    });

    await waitFor(() => {
      const newTheme = screen.getByTestId('current-theme').textContent;
      expect(newTheme).not.toBe(originalTheme);
    });
  });

  it('provides theme configurations', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeCount = parseInt(screen.getByTestId('theme-count').textContent);
    expect(themeCount).toBeGreaterThan(0);
    expect(themeCount).toBe(4); // light, dark, modern, auto
  });

  it('handles auto theme mode with system preference', async () => {
    // Mock dark system preference
    window.matchMedia = jest.fn().mockImplementation(query => 
      mockMatchMedia(query === '(prefers-color-scheme: dark)')
    );

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'collisionos-theme') return 'auto';
      return null;
    });

    let themeData = {};
    
    render(
      <ThemeProvider>
        <TestComponent onThemeChange={(data) => { themeData = data; }} />
      </ThemeProvider>
    );

    expect(themeData.currentTheme).toBe('auto');
    expect(themeData.activeTheme).toBe('dark'); // Should follow system preference
  });

  it('handles theme transitions', async () => {
    const transitionStates = [];
    
    const TransitionTestComponent = () => {
      const { currentTheme, isTransitioning } = useTheme();
      
      React.useEffect(() => {
        transitionStates.push({ theme: currentTheme, transitioning: isTransitioning });
      }, [currentTheme, isTransitioning]);

      return (
        <div>
          <span data-testid="transitioning">{isTransitioning ? 'true' : 'false'}</span>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TransitionTestComponent />
        <TestComponent />
      </ThemeProvider>
    );

    // Trigger theme switch
    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-light'));
    });

    // Should eventually finish transitioning
    await waitFor(() => {
      expect(screen.getByTestId('transitioning')).toHaveTextContent('false');
    });
  });

  it('creates custom themes', async () => {
    const CustomThemeTestComponent = () => {
      const { createCustomTheme, customThemes } = useTheme();

      const handleCreateTheme = () => {
        createCustomTheme('testTheme', {
          palette: {
            mode: 'light',
            primary: { main: '#ff0000' },
            background: { default: '#ffffff' }
          }
        });
      };

      return (
        <div>
          <button data-testid="create-custom" onClick={handleCreateTheme}>
            Create Custom
          </button>
          <span data-testid="custom-count">{Object.keys(customThemes).length}</span>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <CustomThemeTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('custom-count')).toHaveTextContent('0');

    // Create custom theme
    act(() => {
      fireEvent.click(screen.getByTestId('create-custom'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('custom-count')).toHaveTextContent('1');
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'collisionos-custom-themes',
      expect.stringContaining('testTheme')
    );
  });

  it('handles scheduled theme switching', async () => {
    const ScheduleTestComponent = () => {
      const { setThemeSchedule, scheduledTheme } = useTheme();

      const handleSetSchedule = () => {
        setThemeSchedule({
          lightStart: '07:00',
          darkStart: '20:00',
          lightTheme: 'light',
          darkTheme: 'dark'
        });
      };

      return (
        <div>
          <button data-testid="set-schedule" onClick={handleSetSchedule}>
            Set Schedule
          </button>
          <span data-testid="has-schedule">{scheduledTheme ? 'true' : 'false'}</span>
        </div>
      );
    };

    render(
      <ThemeProvider enableScheduledSwitching={true}>
        <ScheduleTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('has-schedule')).toHaveTextContent('false');

    // Set schedule
    act(() => {
      fireEvent.click(screen.getByTestId('set-schedule'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('has-schedule')).toHaveTextContent('true');
    });
  });

  it('updates meta tags when theme changes', async () => {
    // Mock document.head.appendChild
    const mockAppendChild = jest.fn();
    Object.defineProperty(document, 'head', {
      value: { appendChild: mockAppendChild },
      writable: true,
    });

    // Mock createElement
    const mockMeta = { name: '', content: '' };
    const mockCreateElement = jest.fn().mockReturnValue(mockMeta);
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true,
    });

    // Mock querySelector
    document.querySelector = jest.fn().mockReturnValue(null);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Switch theme to trigger meta update
    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-light'));
    });

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalledWith('meta');
    });
  });

  it('respects reduced motion preferences', () => {
    // Mock matchMedia for reduced motion
    window.matchMedia = jest.fn().mockImplementation(query => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return mockMatchMedia(true);
      }
      return mockMatchMedia(false);
    });

    const MotionTestComponent = () => {
      const { canAnimate } = useTheme();
      return <span data-testid="can-animate">{canAnimate ? 'true' : 'false'}</span>;
    };

    render(
      <ThemeProvider>
        <MotionTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('can-animate')).toHaveTextContent('false');
  });

  it('provides theme history', async () => {
    const HistoryTestComponent = () => {
      const { themeHistory } = useTheme();
      return <span data-testid="history-count">{themeHistory.length}</span>;
    };

    render(
      <ThemeProvider>
        <HistoryTestComponent />
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('history-count')).toHaveTextContent('0');

    // Switch themes to build history
    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-light'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-dark'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('history-count')).toHaveTextContent('2');
    });
  });
});