import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartSettingsDialog } from '../ChartSettingsDialog';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

describe('ChartSettingsDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    chartId: 'test-chart',
    defaultSettings: {
      chartType: 'line',
      colorScheme: 'default',
      showLegend: true,
      animated: true,
      gradient: true,
    },
    onSettingsChange: jest.fn(),
  };

  const renderWithTheme = (component) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
  };

  test('renders dialog when open', () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    expect(screen.getByText('Chart Settings')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Chart Settings')).not.toBeInTheDocument();
  });

  test('displays all chart type options', () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    expect(screen.getByText('Pie Chart')).toBeInTheDocument();
    expect(screen.getByText('Doughnut')).toBeInTheDocument();
  });

  test('displays color scheme options', () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Cool Blues')).toBeInTheDocument();
    expect(screen.getByText('Warm Colors')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Monochrome')).toBeInTheDocument();
  });

  test('displays display options switches', () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    expect(screen.getByText('Show Legend')).toBeInTheDocument();
    expect(screen.getByText('Show Grid Lines')).toBeInTheDocument();
    expect(screen.getByText('Animated')).toBeInTheDocument();
    expect(screen.getByText('Gradient Fill')).toBeInTheDocument();
  });

  test('calls onClose when cancel button clicked', () => {
    const handleClose = jest.fn();
    renderWithTheme(
      <ChartSettingsDialog {...defaultProps} onClose={handleClose} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when X button clicked', () => {
    const handleClose = jest.fn();
    renderWithTheme(
      <ChartSettingsDialog {...defaultProps} onClose={handleClose} />
    );

    const closeButton = screen.getAllByRole('button')[0]; // First button is the X
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('saves settings to localStorage when save button clicked', async () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const saved = localStorage.getItem('chart-settings-test-chart');
      expect(saved).toBeTruthy();
    });
  });

  test('calls onSettingsChange when save button clicked', async () => {
    const handleSettingsChange = jest.fn();
    renderWithTheme(
      <ChartSettingsDialog
        {...defaultProps}
        onSettingsChange={handleSettingsChange}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSettingsChange).toHaveBeenCalledTimes(1);
    });
  });

  test('resets settings when reset button clicked', () => {
    localStorage.setItem(
      'chart-settings-test-chart',
      JSON.stringify({ chartType: 'bar', colorScheme: 'cool' })
    );

    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    const resetButton = screen.getByRole('button', {
      name: /reset to defaults/i,
    });
    fireEvent.click(resetButton);

    // After reset, localStorage should not have the saved settings
    const saved = localStorage.getItem('chart-settings-test-chart');
    expect(saved).toBeNull();
  });

  test('displays success message after saving', async () => {
    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Settings saved successfully!')
      ).toBeInTheDocument();
    });
  });

  test('export button shows alert (placeholder)', () => {
    // Mock window.alert
    window.alert = jest.fn();

    renderWithTheme(<ChartSettingsDialog {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /export png/i });
    fireEvent.click(exportButton);

    expect(window.alert).toHaveBeenCalled();
  });
});
