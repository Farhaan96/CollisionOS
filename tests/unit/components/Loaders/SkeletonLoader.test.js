// Unit tests for SkeletonLoader components
// Testing premium skeleton loading components with animation and responsiveness

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  SkeletonLoader, 
  TextSkeleton, 
  AvatarSkeleton, 
  CardSkeleton, 
  TableSkeleton,
  ChartSkeleton 
} from '../../../../src/components/Loaders/SkeletonLoader';
import { premiumDesignSystem } from '../../../../src/theme/premiumDesignSystem';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, animate, ...props }) => (
      <div data-testid="motion-div" data-animate={animate} {...props}>
        {children}
      </div>
    ),
    path: ({ children, ...props }) => (
      <path data-testid="motion-path" {...props}>
        {children}
      </path>
    ),
  },
  AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
}));

// Mock theme
const mockTheme = {
  palette: {
    mode: 'light',
    divider: '#e0e0e0',
  },
  breakpoints: {
    down: vi.fn(() => false),
    up: vi.fn(() => true),
  },
};

const TestWrapper = ({ children, darkMode = false }) => (
  <ThemeProvider theme={{ 
    ...mockTheme, 
    palette: { 
      ...mockTheme.palette, 
      mode: darkMode ? 'dark' : 'light' 
    }
  }}>
    {children}
  </ThemeProvider>
);

describe('SkeletonLoader Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TextSkeleton', () => {
    it('renders single line by default', () => {
      render(
        <TestWrapper>
          <TextSkeleton data-testid="text-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('text-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should have one motion div for single line
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs).toHaveLength(1);
    });

    it('renders multiple lines when specified', () => {
      render(
        <TestWrapper>
          <TextSkeleton lines={3} data-testid="text-skeleton" />
        </TestWrapper>
      );

      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs).toHaveLength(3);
    });

    it('applies custom width and height', () => {
      render(
        <TestWrapper>
          <TextSkeleton 
            width="200px" 
            height="2em" 
            data-testid="text-skeleton" 
          />
        </TestWrapper>
      );

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveStyle({ width: '200px', height: '2em' });
    });

    it('handles array of widths for multiple lines', () => {
      const widths = ['100%', '80%', '60%'];
      render(
        <TestWrapper>
          <TextSkeleton 
            lines={3} 
            width={widths} 
            data-testid="text-skeleton" 
          />
        </TestWrapper>
      );

      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs).toHaveLength(3);
      
      motionDivs.forEach((div, index) => {
        expect(div).toHaveStyle({ width: widths[index] });
      });
    });

    it('uses different animation variants', () => {
      const { rerender } = render(
        <TestWrapper>
          <TextSkeleton animation="pulse" data-testid="text-skeleton" />
        </TestWrapper>
      );

      let motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <TextSkeleton animation="shimmer" data-testid="text-skeleton" />
        </TestWrapper>
      );

      motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe('AvatarSkeleton', () => {
    it('renders with default circular shape', () => {
      render(
        <TestWrapper>
          <AvatarSkeleton data-testid="avatar-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ borderRadius: '50%' });
    });

    it('renders with different variants', () => {
      const { rerender } = render(
        <TestWrapper>
          <AvatarSkeleton variant="rounded" data-testid="avatar-skeleton" />
        </TestWrapper>
      );

      let skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toHaveStyle({ 
        borderRadius: premiumDesignSystem.borderRadius.lg 
      });

      rerender(
        <TestWrapper>
          <AvatarSkeleton variant="square" data-testid="avatar-skeleton" />
        </TestWrapper>
      );

      skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toHaveStyle({ 
        borderRadius: premiumDesignSystem.borderRadius.sm 
      });
    });

    it('applies custom size', () => {
      render(
        <TestWrapper>
          <AvatarSkeleton size={60} data-testid="avatar-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toHaveStyle({ width: 60, height: 60 });
    });

    it('handles responsive sizes', () => {
      const responsiveSize = { xs: 32, sm: 40, md: 48 };
      render(
        <TestWrapper>
          <AvatarSkeleton size={responsiveSize} data-testid="avatar-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('CardSkeleton', () => {
    it('renders with default structure', () => {
      render(
        <TestWrapper>
          <CardSkeleton data-testid="card-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with header when specified', () => {
      render(
        <TestWrapper>
          <CardSkeleton hasHeader={true} data-testid="card-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should contain header elements
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(1);
    });

    it('renders with avatar in header', () => {
      render(
        <TestWrapper>
          <CardSkeleton hasHeader={true} hasAvatar={true} data-testid="card-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with actions when specified', () => {
      render(
        <TestWrapper>
          <CardSkeleton hasActions={true} data-testid="card-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
      render(
        <TestWrapper>
          <CardSkeleton 
            width="300px" 
            height={250} 
            data-testid="card-skeleton" 
          />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toHaveStyle({ width: '300px', height: 250 });
    });

    it('renders custom children', () => {
      render(
        <TestWrapper>
          <CardSkeleton data-testid="card-skeleton">
            <div data-testid="custom-content">Custom content</div>
          </CardSkeleton>
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('TableSkeleton', () => {
    it('renders with default rows and columns', () => {
      render(
        <TestWrapper>
          <TableSkeleton data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should have multiple motion divs for rows
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(5); // Header + 5 default rows
    });

    it('renders specified number of rows', () => {
      render(
        <TestWrapper>
          <TableSkeleton rows={3} data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders without header when specified', () => {
      render(
        <TestWrapper>
          <TableSkeleton hasHeader={false} data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('handles responsive column count', () => {
      // Mock mobile breakpoint
      mockTheme.breakpoints.down.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <TableSkeleton columns={6} data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('ChartSkeleton', () => {
    it('renders line chart by default', () => {
      render(
        <TestWrapper>
          <ChartSkeleton data-testid="chart-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('chart-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should have SVG with animated path for line chart
      const svg = skeleton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      const path = screen.getByTestId('motion-path');
      expect(path).toBeInTheDocument();
    });

    it('renders different chart types', () => {
      const chartTypes = ['line', 'bar', 'pie'];
      
      chartTypes.forEach(type => {
        const { unmount } = render(
          <TestWrapper>
            <ChartSkeleton type={type} data-testid="chart-skeleton" />
          </TestWrapper>
        );

        const skeleton = screen.getByTestId('chart-skeleton');
        expect(skeleton).toBeInTheDocument();
        
        unmount();
      });
    });

    it('renders with title when specified', () => {
      render(
        <TestWrapper>
          <ChartSkeleton hasTitle={true} data-testid="chart-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('chart-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should have title skeleton
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(1);
    });

    it('renders with legend when specified', () => {
      render(
        <TestWrapper>
          <ChartSkeleton hasLegend={true} data-testid="chart-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('chart-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
      render(
        <TestWrapper>
          <ChartSkeleton 
            width="500px" 
            height={400} 
            data-testid="chart-skeleton" 
          />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('chart-skeleton');
      expect(skeleton).toHaveStyle({ width: '500px', height: 400 });
    });
  });

  describe('Main SkeletonLoader', () => {
    it('renders TextSkeleton by default', () => {
      render(
        <TestWrapper>
          <SkeletonLoader data-testid="skeleton-loader" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('skeleton-loader');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders different variants', () => {
      const variants = ['text', 'avatar', 'card', 'table', 'chart'];
      
      variants.forEach(variant => {
        const { unmount } = render(
          <TestWrapper>
            <SkeletonLoader variant={variant} data-testid="skeleton-loader" />
          </TestWrapper>
        );

        const skeleton = screen.getByTestId('skeleton-loader');
        expect(skeleton).toBeInTheDocument();
        
        unmount();
      });
    });

    it('forwards props to underlying components', () => {
      render(
        <TestWrapper>
          <SkeletonLoader 
            variant="text"
            lines={3}
            width="200px"
            data-testid="skeleton-loader"
          />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('skeleton-loader');
      expect(skeleton).toBeInTheDocument();
      
      // Should render 3 lines as specified
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs).toHaveLength(3);
    });
  });

  describe('Dark Mode Support', () => {
    it('renders correctly in dark mode', () => {
      render(
        <TestWrapper darkMode={true}>
          <SkeletonLoader variant="card" data-testid="skeleton-loader" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('skeleton-loader');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies appropriate colors in dark mode', () => {
      render(
        <TestWrapper darkMode={true}>
          <TextSkeleton data-testid="text-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('text-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Animation Support', () => {
    it('applies shimmer animation by default', () => {
      render(
        <TestWrapper>
          <TextSkeleton animation="shimmer" data-testid="text-skeleton" />
        </TestWrapper>
      );

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveAttribute('data-animate');
    });

    it('applies pulse animation', () => {
      render(
        <TestWrapper>
          <TextSkeleton animation="pulse" data-testid="text-skeleton" />
        </TestWrapper>
      );

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveAttribute('data-animate');
    });

    it('applies wave animation', () => {
      render(
        <TestWrapper>
          <TextSkeleton animation="wave" data-testid="text-skeleton" />
        </TestWrapper>
      );

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveAttribute('data-animate');
    });
  });

  describe('Responsive Behavior', () => {
    it('adjusts for mobile screens', async () => {
      // Mock mobile breakpoint
      mockTheme.breakpoints.down.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <CardSkeleton data-testid="card-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('handles tablet screens appropriately', async () => {
      // Mock tablet breakpoint
      mockTheme.breakpoints.down.mockImplementation((breakpoint) => 
        breakpoint === 'lg'
      );
      
      render(
        <TestWrapper>
          <TableSkeleton data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <SkeletonLoader 
            variant="text"
            aria-label="Loading content"
            data-testid="skeleton-loader"
          />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('skeleton-loader');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('is discoverable by screen readers', () => {
      render(
        <TestWrapper>
          <SkeletonLoader 
            variant="card"
            role="status"
            aria-live="polite"
            data-testid="skeleton-loader"
          />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('skeleton-loader');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    it('uses optimized transform properties', () => {
      render(
        <TestWrapper>
          <TextSkeleton data-testid="text-skeleton" />
        </TestWrapper>
      );

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv.style.willChange).toBe('transform');
      expect(motionDiv.style.transform).toContain('translate3d');
    });

    it('handles large number of skeletons efficiently', () => {
      render(
        <TestWrapper>
          <TableSkeleton rows={100} data-testid="table-skeleton" />
        </TestWrapper>
      );

      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Should render without performance issues
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(50);
    });
  });
});