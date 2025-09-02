import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import ModernStatsCard from '../../../../src/components/Dashboard/ModernStatsCard';
import { renderWithProviders } from '../../../../src/utils/testUtils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }) => (
      <div data-testid='motion-div' {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock ModernCard component
jest.mock('../../../../src/components/Common/ModernCard', () => {
  return function ModernCard({ children, variant, hover, sx, ...props }) {
    return (
      <div
        data-testid='modern-card'
        data-variant={variant}
        data-hover={hover}
        style={sx}
        {...props}
      >
        {children}
      </div>
    );
  };
});

describe('ModernStatsCard Component', () => {
  const defaultProps = {
    title: 'Active Jobs',
    value: '42',
    change: 15,
    changeType: 'positive',
    icon: DashboardIcon,
    color: 'primary',
    variant: 'glass',
  };

  describe('Basic Rendering', () => {
    test('renders with all required props', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      expect(screen.getByText('ACTIVE JOBS')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    test('renders without optional props', () => {
      renderWithProviders(<ModernStatsCard title='Simple Card' value='100' />);

      expect(screen.getByText('SIMPLE CARD')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
    });

    test('transforms title to uppercase', () => {
      renderWithProviders(
        <ModernStatsCard title='lowercase title' value='123' />
      );

      expect(screen.getByText('LOWERCASE TITLE')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    test('renders icon when provided', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      expect(screen.getByTestId('DashboardIcon')).toBeInTheDocument();
    });

    test('does not render icon when not provided', () => {
      const { icon, ...propsWithoutIcon } = defaultProps;
      renderWithProviders(<ModernStatsCard {...propsWithoutIcon} />);

      expect(screen.queryByTestId('DashboardIcon')).not.toBeInTheDocument();
    });

    test('renders different icons correctly', () => {
      const propsWithDifferentIcon = { ...defaultProps, icon: TrendingUp };
      renderWithProviders(<ModernStatsCard {...propsWithDifferentIcon} />);

      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    test('icon button is interactive', async () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      const iconButton = screen.getByRole('button');
      expect(iconButton).toBeInTheDocument();

      // Test that the button can receive focus
      await userEvent.tab();
      expect(iconButton).toHaveFocus();
    });
  });

  describe('Change Indicator', () => {
    test('renders positive change with trending up icon', () => {
      renderWithProviders(
        <ModernStatsCard
          title='Test'
          value='100'
          change={25}
          changeType='positive'
        />
      );

      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    test('renders negative change with trending down icon', () => {
      renderWithProviders(
        <ModernStatsCard
          title='Test'
          value='100'
          change={-15}
          changeType='negative'
        />
      );

      expect(screen.getByText('-15%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
    });

    test('renders neutral change without trend icon', () => {
      renderWithProviders(
        <ModernStatsCard
          title='Test'
          value='100'
          change={0}
          changeType='neutral'
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.queryByTestId('TrendingUpIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('TrendingDownIcon')).not.toBeInTheDocument();
    });

    test('handles string change values', () => {
      renderWithProviders(
        <ModernStatsCard
          title='Test'
          value='100'
          change='Custom Change'
          changeType='positive'
        />
      );

      expect(screen.getByText('Custom Change')).toBeInTheDocument();
    });

    test('does not render change section when change is undefined', () => {
      renderWithProviders(<ModernStatsCard title='Test' value='100' />);

      expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    test('applies primary color', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} color='primary' />
      );

      // Component renders without error
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('applies success color', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} color='success' />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('applies warning color', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} color='warning' />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('applies error color', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} color='error' />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('applies info color', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} color='info' />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('falls back to primary color for unknown color', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} color='unknown' />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    test('applies glass variant', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} variant='glass' />
      );

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard).toHaveAttribute('data-variant', 'glass');
    });

    test('applies gradient variant with background styling', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} variant='gradient' />
      );

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard).toHaveAttribute('data-variant', 'gradient');
    });

    test('applies solid variant', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} variant='solid' />
      );

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard).toHaveAttribute('data-variant', 'solid');
    });
  });

  describe('Custom Props and Styling', () => {
    test('passes through custom sx styles', () => {
      const customSx = { backgroundColor: 'red', margin: '10px' };
      renderWithProviders(<ModernStatsCard {...defaultProps} sx={customSx} />);

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard.style.backgroundColor).toBe('red');
      expect(modernCard.style.margin).toBe('10px');
    });

    test('applies custom height from sx', () => {
      const customSx = { height: '200px' };
      renderWithProviders(<ModernStatsCard {...defaultProps} sx={customSx} />);

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard.style.height).toBe('200px');
    });

    test('passes through additional props to ModernCard', () => {
      renderWithProviders(
        <ModernStatsCard
          {...defaultProps}
          data-custom='test-value'
          aria-label='Custom Stats Card'
        />
      );

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard).toHaveAttribute('data-custom', 'test-value');
      expect(modernCard).toHaveAttribute('aria-label', 'Custom Stats Card');
    });
  });

  describe('Typography and Content', () => {
    test('displays value with proper typography', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      const valueElement = screen.getByText('42');
      expect(valueElement).toBeInTheDocument();
    });

    test('handles long values gracefully', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} value='999,999,999' />
      );

      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    test('handles special characters in value', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} value='$1,234.56' />
      );

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    test('handles long titles gracefully', () => {
      renderWithProviders(
        <ModernStatsCard
          {...defaultProps}
          title='Very Long Title That Should Still Display Properly'
        />
      );

      expect(
        screen.getByText('VERY LONG TITLE THAT SHOULD STILL DISPLAY PROPERLY')
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('maintains consistent height', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard.style.height).toBe('140px');
    });

    test('allows height override through sx', () => {
      renderWithProviders(
        <ModernStatsCard {...defaultProps} sx={{ height: '180px' }} />
      );

      const modernCard = screen.getByTestId('modern-card');
      expect(modernCard.style.height).toBe('180px');
    });
  });

  describe('Accessibility', () => {
    test('provides proper semantic structure', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      // Title should be present and readable
      expect(screen.getByText('ACTIVE JOBS')).toBeInTheDocument();

      // Value should be the main content
      expect(screen.getByText('42')).toBeInTheDocument();

      // Change information should be supplementary
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    test('icon button has proper accessibility', async () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      const iconButton = screen.getByRole('button');

      // Button should be focusable
      await userEvent.tab();
      expect(iconButton).toHaveFocus();

      // Button should be clickable
      await userEvent.click(iconButton);
      // No specific action expected, but should not crash
    });

    test('provides meaningful text content for screen readers', () => {
      renderWithProviders(<ModernStatsCard {...defaultProps} />);

      // All text should be accessible
      expect(screen.getByText('ACTIVE JOBS')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing required props gracefully', () => {
      // Should not crash with minimal props
      expect(() => {
        renderWithProviders(<ModernStatsCard title='Test' />);
      }).not.toThrow();
    });

    test('handles undefined value', () => {
      renderWithProviders(<ModernStatsCard title='Test' value={undefined} />);

      // Should render without crashing
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    test('handles null change value', () => {
      renderWithProviders(
        <ModernStatsCard title='Test' value='100' change={null} />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
    });

    test('handles invalid changeType', () => {
      renderWithProviders(
        <ModernStatsCard
          title='Test'
          value='100'
          change={15}
          changeType='invalid'
        />
      );

      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });
});
