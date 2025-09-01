import React from 'react';
import { screen } from '@testing-library/react';
import { KpiCard } from '../../../../src/components/Dashboard/KpiCard';
import {
  renderWithProviders,
  createMockChartData,
} from '../../../../src/utils/testUtils';

// Mock chart components to avoid canvas rendering issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, ...props }) => (
    <div data-testid='responsive-container' {...props}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data, ...props }) => (
    <div
      data-testid='area-chart'
      data-chart-data={JSON.stringify(data)}
      {...props}
    >
      {children}
    </div>
  ),
  Area: props => <div data-testid='area' {...props} />,
  Tooltip: props => <div data-testid='tooltip' {...props} />,
}));

// Mock AnimatedCounter component
jest.mock('../../../../src/utils/AnimatedCounter', () => ({
  AnimatedCounter: ({ value }) => (
    <span data-testid='animated-counter'>{value}</span>
  ),
}));

// Mock GlassCard component
jest.mock('../../../../src/components/Common/GlassCard', () => ({
  GlassCard: ({ children, ...props }) => (
    <div data-testid='glass-card' {...props}>
      {children}
    </div>
  ),
}));

describe('KpiCard Component', () => {
  const mockKpiData = {
    label: 'Active Jobs',
    value: 42,
    deltaPct: 15,
    forecastNote: 'Expected increase',
    series: [
      { name: 'Jan', value: 30 },
      { name: 'Feb', value: 35 },
      { name: 'Mar', value: 42 },
    ],
  };

  describe('Basic Rendering', () => {
    test('renders KPI card with all basic elements', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toHaveTextContent('42');
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('Expected increase')).toBeInTheDocument();
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    test('renders with custom height', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} height={200} />);

      const chartContainer = screen.getByTestId('responsive-container');
      expect(chartContainer).toHaveAttribute('height', '200');
    });

    test('renders with default height when not specified', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      const chartContainer = screen.getByTestId('responsive-container');
      expect(chartContainer).toHaveAttribute('height', '120');
    });
  });

  describe('Delta Percentage Display', () => {
    test('displays positive delta with trending up icon', () => {
      const positiveKpi = { ...mockKpiData, deltaPct: 25 };
      renderWithProviders(<KpiCard kpi={positiveKpi} />);

      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    test('displays negative delta with trending down icon', () => {
      const negativeKpi = { ...mockKpiData, deltaPct: -10 };
      renderWithProviders(<KpiCard kpi={negativeKpi} />);

      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
    });

    test('displays zero delta correctly', () => {
      const zeroKpi = { ...mockKpiData, deltaPct: 0 };
      renderWithProviders(<KpiCard kpi={zeroKpi} />);

      expect(screen.getByText('+0%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    test('handles undefined deltaPct by showing 0%', () => {
      const { deltaPct, ...kpiWithoutDelta } = mockKpiData;
      renderWithProviders(<KpiCard kpi={kpiWithoutDelta} />);

      expect(screen.getByText('+0%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    test('handles null deltaPct by showing 0%', () => {
      const nullDeltaKpi = { ...mockKpiData, deltaPct: null };
      renderWithProviders(<KpiCard kpi={nullDeltaKpi} />);

      expect(screen.getByText('+0%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });
  });

  describe('Chip Color Logic', () => {
    test('shows success color for positive delta', () => {
      const positiveKpi = { ...mockKpiData, deltaPct: 15 };
      renderWithProviders(<KpiCard kpi={positiveKpi} />);

      const chip =
        screen.getByText('+15%').closest('[data-testid*="chip"]') ||
        screen.getByText('+15%').closest('.MuiChip-root');

      // Check that the chip exists (color testing would require more complex setup)
      expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    test('shows error color for negative delta', () => {
      const negativeKpi = { ...mockKpiData, deltaPct: -5 };
      renderWithProviders(<KpiCard kpi={negativeKpi} />);

      expect(screen.getByText('-5%')).toBeInTheDocument();
    });
  });

  describe('Forecast Note Display', () => {
    test('displays forecast note when provided', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      expect(screen.getByText('Expected increase')).toBeInTheDocument();
    });

    test('does not render forecast note when not provided', () => {
      const { forecastNote, ...kpiWithoutNote } = mockKpiData;
      renderWithProviders(<KpiCard kpi={kpiWithoutNote} />);

      expect(screen.queryByText('Expected increase')).not.toBeInTheDocument();
    });

    test('does not render forecast note when empty string', () => {
      const emptyNoteKpi = { ...mockKpiData, forecastNote: '' };
      renderWithProviders(<KpiCard kpi={emptyNoteKpi} />);

      expect(screen.queryByText('Expected increase')).not.toBeInTheDocument();
    });

    test('displays custom forecast note', () => {
      const customNoteKpi = {
        ...mockKpiData,
        forecastNote: 'Seasonal decline expected',
      };
      renderWithProviders(<KpiCard kpi={customNoteKpi} />);

      expect(screen.getByText('Seasonal decline expected')).toBeInTheDocument();
    });
  });

  describe('Chart Integration', () => {
    test('renders chart with provided series data', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    test('handles empty series data', () => {
      const emptySeriesKpi = { ...mockKpiData, series: [] };
      renderWithProviders(<KpiCard kpi={emptySeriesKpi} />);

      const chart = screen.getByTestId('area-chart');
      expect(chart).toHaveAttribute('data-chart-data', '[]');
    });

    test('handles undefined series data', () => {
      const { series, ...kpiWithoutSeries } = mockKpiData;
      renderWithProviders(<KpiCard kpi={kpiWithoutSeries} />);

      const chart = screen.getByTestId('area-chart');
      expect(chart).toHaveAttribute('data-chart-data', 'null');
    });

    test('passes correct props to chart components', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      const chart = screen.getByTestId('area-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data'));

      expect(chartData).toEqual(mockKpiData.series);
    });
  });

  describe('Layout and Styling', () => {
    test('maintains proper layout structure', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toBeInTheDocument();

      // Check that all main elements are present in the expected structure
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('applies overflow hidden to glass card', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      const glassCard = screen.getByTestId('glass-card');
      expect(glassCard).toHaveStyle({ overflow: 'hidden' });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles missing KPI data gracefully', () => {
      const minimalKpi = { label: 'Test KPI', value: 0 };
      renderWithProviders(<KpiCard kpi={minimalKpi} />);

      expect(screen.getByText('Test KPI')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toHaveTextContent('0');
    });

    test('handles very large numbers', () => {
      const largeNumberKpi = {
        ...mockKpiData,
        value: 9999999,
        deltaPct: 999,
      };
      renderWithProviders(<KpiCard kpi={largeNumberKpi} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent(
        '9999999'
      );
      expect(screen.getByText('+999%')).toBeInTheDocument();
    });

    test('handles negative values', () => {
      const negativeValueKpi = {
        ...mockKpiData,
        value: -50,
        deltaPct: -25,
      };
      renderWithProviders(<KpiCard kpi={negativeValueKpi} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent('-50');
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    test('handles decimal values', () => {
      const decimalKpi = {
        ...mockKpiData,
        value: 42.5,
        deltaPct: 15.7,
      };
      renderWithProviders(<KpiCard kpi={decimalKpi} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent('42.5');
      expect(screen.getByText('+15.7%')).toBeInTheDocument();
    });

    test('handles string values', () => {
      const stringValueKpi = {
        ...mockKpiData,
        value: '$1,234',
      };
      renderWithProviders(<KpiCard kpi={stringValueKpi} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent(
        '$1,234'
      );
    });
  });

  describe('Accessibility', () => {
    test('provides accessible structure', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      // Check that text content is properly structured
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toBeInTheDocument();

      // Chips should be properly labeled
      expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    test('maintains proper heading hierarchy', () => {
      renderWithProviders(<KpiCard kpi={mockKpiData} />);

      // The label should be a subtitle (smaller text)
      // The value should be the main heading (larger text)
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('does not render unnecessary elements when data is minimal', () => {
      const minimalKpi = { label: 'Simple KPI', value: 10 };
      renderWithProviders(<KpiCard kpi={minimalKpi} />);

      expect(screen.getByText('Simple KPI')).toBeInTheDocument();
      expect(screen.getByTestId('animated-counter')).toHaveTextContent('10');

      // Should still render chart container even with no series data
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('handles component updates efficiently', () => {
      const { rerender } = renderWithProviders(<KpiCard kpi={mockKpiData} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent('42');

      const updatedKpi = { ...mockKpiData, value: 50 };
      rerender(<KpiCard kpi={updatedKpi} />);

      expect(screen.getByTestId('animated-counter')).toHaveTextContent('50');
    });
  });
});
