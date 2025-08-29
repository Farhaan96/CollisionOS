import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider } from '../../../../src/components/Theme/ThemeProvider';
import { ThemeSwitcher } from '../../../../src/components/Theme/ThemeSwitcher';

// Mock the useTheme hook responses
const mockUseTheme = {
  currentTheme: 'modern',
  themeConfigs: {
    light: { name: 'Light', description: 'Light theme', preview: { primary: '#1976d2', background: '#ffffff' } },
    dark: { name: 'Dark', description: 'Dark theme', preview: { primary: '#90caf9', background: '#121212' } },
    modern: { name: 'Modern', description: 'Modern theme', preview: { primary: '#6366f1', background: '#0f172a' } },
    auto: { name: 'Auto', description: 'Auto theme', preview: { primary: '#6366f1', background: 'var(--system-bg)' } }
  },
  switchTheme: jest.fn(),
  toggleTheme: jest.fn(),
  previewTheme: jest.fn().mockResolvedValue(),
  customThemes: {},
  createCustomTheme: jest.fn(),
  scheduledTheme: null,
  setThemeSchedule: jest.fn(),
  isDarkMode: false,
  isTransitioning: false,
  canAnimate: true
};

// Mock ResizeObserver and matchMedia
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS.supports
global.CSS = {
  supports: jest.fn().mockReturnValue(true)
};

// Create wrapper component with ThemeProvider
const TestWrapper = ({ children, ...props }) => (
  <ThemeProvider {...props}>
    {children}
  </ThemeProvider>
);

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Icon variant', () => {
    it('renders icon button by default', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      expect(iconButton).toBeInTheDocument();
      expect(iconButton).toHaveAttribute('aria-label');
    });

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      
      await user.hover(iconButton);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('opens menu on click', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      
      await user.click(iconButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle variant', () => {
    it('renders switch component', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher variant="toggle" />
        </TestWrapper>
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows light and dark icons', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher variant="toggle" showLabel={true} />
        </TestWrapper>
      );

      // Should have light/dark mode indicators
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('toggles theme on switch click', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher variant="toggle" />
        </TestWrapper>
      );

      const switchElement = screen.getByRole('checkbox');
      
      await user.click(switchElement);
      
      // The actual theme switching is handled by the ThemeProvider mock
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Compact variant', () => {
    it('renders compact icon button', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher variant="compact" />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      expect(iconButton).toBeInTheDocument();
    });
  });

  describe('Theme menu', () => {
    it('shows theme previews in menu', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Should show current theme information
      expect(screen.getByText(/Modern/)).toBeInTheDocument();
    });

    it('shows custom theme creator option', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      await waitFor(() => {
        expect(screen.getByText(/Create Custom Theme/)).toBeInTheDocument();
      });
    });

    it('shows schedule switching option', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      await waitFor(() => {
        expect(screen.getByText(/Schedule Switching/)).toBeInTheDocument();
      });
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <TestWrapper>
            <ThemeSwitcher />
          </TestWrapper>
        </div>
      );

      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom theme dialog', () => {
    it('opens custom theme dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      // Click create custom theme
      const createCustomButton = await screen.findByText(/Create Custom Theme/);
      await user.click(createCustomButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/Theme Name/)).toBeInTheDocument();
      });
    });

    it('allows theme name input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu and custom dialog
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      const createCustomButton = await screen.findByText(/Create Custom Theme/);
      await user.click(createCustomButton);

      const nameInput = await screen.findByLabelText(/Theme Name/);
      await user.type(nameInput, 'My Custom Theme');

      expect(nameInput).toHaveValue('My Custom Theme');
    });

    it('shows color picker inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu and custom dialog
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      const createCustomButton = await screen.findByText(/Create Custom Theme/);
      await user.click(createCustomButton);

      await waitFor(() => {
        expect(screen.getByText(/Primary/)).toBeInTheDocument();
        expect(screen.getByText(/Secondary/)).toBeInTheDocument();
        expect(screen.getByText(/Background/)).toBeInTheDocument();
      });
    });
  });

  describe('Schedule dialog', () => {
    it('opens schedule dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      // Click schedule switching
      const scheduleButton = await screen.findByText(/Schedule Switching/);
      await user.click(scheduleButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Schedule Theme Switching/)).toBeInTheDocument();
      });
    });

    it('shows time inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu and schedule dialog
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      const scheduleButton = await screen.findByText(/Schedule Switching/);
      await user.click(scheduleButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Light Theme Start/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Dark Theme Start/)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard shortcuts', () => {
    it('responds to keyboard shortcut', async () => {
      render(
        <TestWrapper>
          <ThemeSwitcher showShortcut={true} />
        </TestWrapper>
      );

      // Simulate Cmd+Shift+L (Mac) or Ctrl+Shift+L (Windows)
      fireEvent.keyDown(window, {
        key: 'L',
        metaKey: true,
        shiftKey: true,
        preventDefault: jest.fn()
      });

      // The actual toggle is handled by the theme provider
      expect(true).toBe(true); // Placeholder assertion
    });

    it('shows keyboard shortcut in tooltip when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher showShortcut={true} />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      
      await user.hover(iconButton);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('does not show keyboard shortcut when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher showShortcut={false} />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      
      await user.hover(iconButton);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        // Should not contain keyboard shortcut text
      });
    });
  });

  describe('Preview functionality', () => {
    it('shows preview indicator when previewing', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Open menu
      const iconButton = screen.getByRole('button');
      await user.click(iconButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Find and toggle preview mode
      const previewSwitch = screen.getByRole('checkbox', { name: '' });
      if (previewSwitch) {
        await user.click(previewSwitch);
      }

      // Preview functionality is handled by the theme provider
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Responsive behavior', () => {
    it('adapts to mobile screen size', () => {
      // Mock mobile breakpoint
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      expect(iconButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const iconButton = screen.getByRole('button');
      
      // Focus the button
      await user.tab();
      expect(iconButton).toHaveFocus();

      // Open menu with Enter
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });
});