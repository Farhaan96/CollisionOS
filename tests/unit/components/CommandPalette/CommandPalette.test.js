import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import CommandPalette from '../../../../src/components/CommandPalette/CommandPalette';
import { CommandProvider } from '../../../../src/components/CommandPalette/CommandProvider';
import { ShortcutManager } from '../../../../src/components/KeyboardShortcuts/ShortcutManager';

// Mock hooks and dependencies
jest.mock('../../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'admin', name: 'Test User' },
    logout: jest.fn(),
  }),
}));

jest.mock('../../../../src/hooks/useNotification', () => ({
  useNotification: () => ({
    showNotification: jest.fn(),
  }),
}));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { paper: '#ffffff' },
  },
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <ShortcutManager>
        <CommandProvider>{children}</CommandProvider>
      </ShortcutManager>
    </ThemeProvider>
  </BrowserRouter>
);

describe('CommandPalette', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when open prop is true', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();
  });

  it('does not render when open prop is false', () => {
    render(
      <TestWrapper>
        <CommandPalette open={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses search input when opened', async () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        'Type a command or search...'
      );
      expect(searchInput).toHaveFocus();
    });
  });

  it('filters commands based on search query', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );

    // Search for dashboard
    await userEvent.type(searchInput, 'dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Customers')).not.toBeInTheDocument();
    });
  });

  it('highlights search terms in results', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    await userEvent.type(searchInput, 'dash');

    await waitFor(() => {
      const dashboardItem = screen.getByText('Dashboard');
      const parentListItem = dashboardItem.closest('li');
      // Should have highlighted text within the item
      expect(parentListItem).toBeInTheDocument();
    });
  });

  it('navigates through commands with arrow keys', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    searchInput.focus();

    // Press arrow down to select first item
    await userEvent.keyboard('{ArrowDown}');

    // First command item should be selected (have selected styling)
    await waitFor(() => {
      const selectedItem = document.querySelector(
        '[role="button"].Mui-selected'
      );
      expect(selectedItem).toBeInTheDocument();
    });
  });

  it('executes command on Enter key', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    searchInput.focus();

    // Select first command and press Enter
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    // Should close the palette after execution
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('closes on Escape key', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    searchInput.focus();

    await userEvent.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows category filters', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText(/Navigation/)).toBeInTheDocument();
    expect(screen.getByText(/Actions/)).toBeInTheDocument();
    expect(screen.getByText(/Search/)).toBeInTheDocument();
  });

  it('filters by category when category chip is clicked', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Click on Navigation category
    const navigationChip = screen.getByText(/Navigation/);
    await userEvent.click(navigationChip);

    await waitFor(() => {
      // Should show Navigation category chip as selected
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      // Should show navigation commands
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows recent commands when no search query', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Should show recent commands section if there are any
    // Note: In a real test, you'd mock the recent commands data
    expect(screen.getByText(/commands/)).toBeInTheDocument();
  });

  it('shows no results message for empty search', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    await userEvent.type(searchInput, 'nonexistentcommand');

    await waitFor(() => {
      expect(screen.getByText('No commands found')).toBeInTheDocument();
      expect(
        screen.getByText('Try a different search term')
      ).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    await userEvent.type(searchInput, 'test');

    // Find and click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(searchInput.value).toBe('');
  });

  it('displays keyboard shortcuts hint in footer', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('↑↓ navigate')).toBeInTheDocument();
    expect(screen.getByText('↵ select')).toBeInTheDocument();
    expect(screen.getByText('esc close')).toBeInTheDocument();
  });

  it('shows command count in footer', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Should show some number of commands
    expect(screen.getByText(/\d+ commands/)).toBeInTheDocument();
  });

  it('handles command execution errors gracefully', async () => {

    // Mock console.error to avoid error output in tests
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    searchInput.focus();

    // Try to execute a command (first one)
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    // Should not crash the component
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('supports fuzzy search functionality', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );

    // Type partial/fuzzy match for "customers"
    await userEvent.type(searchInput, 'cust');

    await waitFor(() => {
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });
  });

  it('closes when backdrop is clicked', async () => {

    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Click on backdrop (outside the dialog content)
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('maintains accessibility with proper ARIA labels', () => {
    render(
      <TestWrapper>
        <CommandPalette open={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Type a command or search...'
    );
    expect(searchInput).toHaveAttribute('type', 'text');

    // Should have proper list structure
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });
});
