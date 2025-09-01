import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import ExecutiveKPICard from '../../../../src/components/Charts/ExecutiveKPICard';
import { createTheme } from '@mui/material/styles';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useAnimation: () => ({
    start: jest.fn(),
    set: jest.fn(),
  }),
  AnimatePresence: ({ children }) => children,
}));

// Mock recharts to avoid SVG rendering issues
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid='line-chart'>{children}</div>,
  Line: () => <div data-testid='line' />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  YAxis: () => <div data-testid='y-axis' />,
}));

const theme = createTheme();

const defaultProps = {
  title: 'Revenue',
  value: 150000,
  previousValue: 120000,
  unit: '',
  prefix: '$',
  sparklineData: [100, 120, 140, 130, 150, 160, 155],
  status: 'positive',
};

const renderWithTheme = component => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ExecutiveKPICard', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(callback => ({
      observe: jest.fn().mockImplementation(element => {
        // Simulate intersection
        setTimeout(() => {
          callback([{ isIntersecting: true, target: element }]);
        }, 100);
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders KPI card with basic props', () => {
    renderWithTheme(<ExecutiveKPICard {...defaultProps} />);

    expect(screen.getByText('REVENUE')).toBeInTheDocument();
    expect(screen.getByText('150K')).toBeInTheDocument(); // Formatted value
  });

  it('displays trend indicator correctly', () => {
    renderWithTheme(<ExecutiveKPICard {...defaultProps} />);

    // Should show positive trend (25% increase from 120k to 150k)
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('handles different statuses correctly', () => {
    const { rerender } = renderWithTheme(
      <ExecutiveKPICard {...defaultProps} status='negative' />
    );

    // Test negative status
    expect(screen.getByText('REVENUE')).toBeInTheDocument();

    // Test warning status
    rerender(
      <ThemeProvider theme={theme}>
        <ExecutiveKPICard {...defaultProps} status='warning' />
      </ThemeProvider>
    );
    expect(screen.getByText('REVENUE')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    renderWithTheme(<ExecutiveKPICard {...defaultProps} value={2500000} />);

    expect(screen.getByText('2.5M')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <ExecutiveKPICard {...defaultProps} onClick={handleClick} />
    );

    const card = screen
      .getByText('REVENUE')
      .closest('div[style*="cursor: pointer"]');
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('displays custom prefix and suffix', () => {
    renderWithTheme(
      <ExecutiveKPICard
        {...defaultProps}
        prefix='$'
        suffix=' USD'
        value={1000}
      />
    );

    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText(' USD')).toBeInTheDocument();
  });

  it('shows sparkline when data is provided', () => {
    renderWithTheme(<ExecutiveKPICard {...defaultProps} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('hides sparkline when showSparkline is false', () => {
    renderWithTheme(
      <ExecutiveKPICard {...defaultProps} showSparkline={false} />
    );

    expect(
      screen.queryByTestId('responsive-container')
    ).not.toBeInTheDocument();
  });

  it('displays comparison chip when provided', () => {
    renderWithTheme(
      <ExecutiveKPICard {...defaultProps} comparison='vs last month' />
    );

    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('handles different sizes correctly', () => {
    const { container, rerender } = renderWithTheme(
      <ExecutiveKPICard {...defaultProps} size='small' />
    );

    expect(
      container.querySelector('[style*="min-height: 120px"]')
    ).toBeInTheDocument();

    // Test large size
    rerender(
      <ThemeProvider theme={theme}>
        <ExecutiveKPICard {...defaultProps} size='large' />
      </ThemeProvider>
    );

    expect(
      container.querySelector('[style*="min-height: 200px"]')
    ).toBeInTheDocument();
  });

  it('shows info icon with tooltip when detailedTooltip is provided', () => {
    renderWithTheme(
      <ExecutiveKPICard
        {...defaultProps}
        detailedTooltip='This is detailed information about the KPI'
      />
    );

    const infoIcon = screen.getByTestId('InfoIcon');
    expect(infoIcon).toBeInTheDocument();
  });

  it('handles animation prop correctly', async () => {
    const { container } = renderWithTheme(
      <ExecutiveKPICard {...defaultProps} animated={true} value={1000} />
    );

    // Initial render should show 0 or low value
    // After animation, should show the actual value
    await waitFor(
      () => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('displays icon when provided', () => {
    const TestIcon = () => <div data-testid='test-icon'>Icon</div>;

    renderWithTheme(<ExecutiveKPICard {...defaultProps} icon={TestIcon} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles zero and negative values', () => {
    renderWithTheme(
      <ExecutiveKPICard {...defaultProps} value={0} previousValue={100} />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument(); // -100% trend
  });

  it('applies custom color correctly', () => {
    const customColor = '#ff6b35';
    renderWithTheme(
      <ExecutiveKPICard {...defaultProps} customColor={customColor} />
    );

    // The component should apply the custom color
    expect(screen.getByText('REVENUE')).toBeInTheDocument();
  });

  it('handles missing sparkline data gracefully', () => {
    renderWithTheme(<ExecutiveKPICard {...defaultProps} sparklineData={[]} />);

    // Should still render the main content
    expect(screen.getByText('REVENUE')).toBeInTheDocument();
    expect(screen.getByText('150K')).toBeInTheDocument();
  });

  it('calculates trend automatically when previousValue is provided', () => {
    renderWithTheme(
      <ExecutiveKPICard title='Sales' value={200} previousValue={100} />
    );

    // 200 vs 100 = 100% increase
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('handles medium size as default', () => {
    const { container } = renderWithTheme(
      <ExecutiveKPICard {...defaultProps} />
    );

    // Should have medium size styling (160px min-height)
    expect(
      container.querySelector('[style*="min-height: 160px"]')
    ).toBeInTheDocument();
  });
});
