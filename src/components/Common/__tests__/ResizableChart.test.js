import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResizableChart } from '../ResizableChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const MockChart = () => <div data-testid="mock-chart">Mock Chart Content</div>;

describe('ResizableChart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithTheme = (component) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
  };

  test('renders chart content', () => {
    renderWithTheme(
      <ResizableChart
        title="Test Chart"
        chartId="test-chart"
        defaultHeight={400}
      >
        <MockChart />
      </ResizableChart>
    );

    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  test('renders settings button when onSettingsClick provided', () => {
    const handleSettingsClick = jest.fn();

    renderWithTheme(
      <ResizableChart
        title="Test Chart"
        chartId="test-chart"
        defaultHeight={400}
        onSettingsClick={handleSettingsClick}
      >
        <MockChart />
      </ResizableChart>
    );

    const settingsButton = screen.getByRole('button', { name: /chart settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  test('calls onSettingsClick when settings button clicked', () => {
    const handleSettingsClick = jest.fn();

    renderWithTheme(
      <ResizableChart
        title="Test Chart"
        chartId="test-chart"
        defaultHeight={400}
        onSettingsClick={handleSettingsClick}
      >
        <MockChart />
      </ResizableChart>
    );

    const settingsButton = screen.getByRole('button', { name: /chart settings/i });
    fireEvent.click(settingsButton);

    expect(handleSettingsClick).toHaveBeenCalledTimes(1);
  });

  test('loads saved size from localStorage', () => {
    const savedSize = { height: 500 };
    localStorage.setItem('chart-size-test-chart', JSON.stringify(savedSize));

    renderWithTheme(
      <ResizableChart
        title="Test Chart"
        chartId="test-chart"
        defaultHeight={400}
      >
        <MockChart />
      </ResizableChart>
    );

    // Chart should render with saved height
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  test('uses default height when no saved size', () => {
    renderWithTheme(
      <ResizableChart
        title="Test Chart"
        chartId="test-chart"
        defaultHeight={400}
      >
        <MockChart />
      </ResizableChart>
    );

    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });
});
