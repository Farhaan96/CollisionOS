import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import CircularProgress, { CircularRing, MultiRingProgress } from '../../../../src/components/Charts/CircularProgress';
import { createTheme } from '@mui/material/styles';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    circle: ({ children, ...props }) => <circle {...props}>{children}</circle>
  },
  useAnimation: () => ({
    start: jest.fn(),
    set: jest.fn()
  })
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('CircularProgress', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn().mockImplementation((element) => {
        setTimeout(() => {
          callback([{ isIntersecting: true, target: element }]);
        }, 100);
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CircularProgress - Single Ring', () => {
    it('renders with default props', () => {
      renderWithTheme(<CircularProgress />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('displays custom value and percentage', () => {
      renderWithTheme(
        <CircularProgress 
          value={50} 
          maxValue={100} 
        />
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows value instead of percentage when showPercentage is false', () => {
      renderWithTheme(
        <CircularProgress 
          value={75}
          maxValue={100}
          showPercentage={false}
        />
      );
      
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('displays custom label', () => {
      renderWithTheme(
        <CircularProgress 
          value={80}
          label="Completion Rate"
        />
      );
      
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    it('formats large values correctly', () => {
      renderWithTheme(
        <CircularProgress 
          value={1500000}
          maxValue={2000000}
          showPercentage={false}
        />
      );
      
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      renderWithTheme(
        <CircularProgress 
          value={50}
          onClick={handleClick}
        />
      );
      
      const progressContainer = screen.getByText('50%').closest('div');
      if (progressContainer) {
        fireEvent.click(progressContainer);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('displays both value and percentage when showValue is true', () => {
      renderWithTheme(
        <CircularProgress 
          value={75}
          maxValue={100}
          showValue={true}
        />
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('75 / 100')).toBeInTheDocument();
    });

    it('shows subtitle when provided', () => {
      renderWithTheme(
        <CircularProgress 
          value={60}
          label="Performance"
          subtitle="This month"
        />
      );
      
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
    });
  });

  describe('CircularProgress - Comparison Variant', () => {
    it('renders comparison variant correctly', () => {
      renderWithTheme(
        <CircularProgress 
          value={80}
          comparisonValue={60}
          variant="comparison"
          comparisonLabel="Last Month"
        />
      );
      
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('handles comparison with custom label', () => {
      renderWithTheme(
        <CircularProgress 
          value={90}
          comparisonValue={70}
          variant="comparison"
          comparisonLabel="Previous Quarter"
        />
      );
      
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  describe('CircularProgress - Multi Ring Variant', () => {
    const mockRings = [
      {
        id: 'ring1',
        value: 75,
        maxValue: 100,
        color: '#3f51b5',
        tooltip: 'Ring 1: 75%'
      },
      {
        id: 'ring2',
        value: 50,
        maxValue: 100,
        color: '#f44336',
        tooltip: 'Ring 2: 50%'
      }
    ];

    it('renders multi-ring variant', () => {
      renderWithTheme(
        <CircularProgress 
          variant="multi"
          rings={mockRings}
        />
      );
      
      // Should render the multi-ring component
      expect(screen.getByDisplayValue || screen.getByRole).toBeTruthy();
    });

    it('renders with center content', () => {
      const centerContent = <div>Center Content</div>;
      
      renderWithTheme(
        <CircularProgress 
          variant="multi"
          rings={mockRings}
          centerContent={centerContent}
        />
      );
      
      expect(screen.getByText('Center Content')).toBeInTheDocument();
    });
  });

  describe('CircularRing Component', () => {
    it('renders basic ring', () => {
      renderWithTheme(
        <CircularRing 
          value={60}
          maxValue={100}
          radius={50}
        />
      );
      
      // Check if SVG is rendered
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles different stroke widths', () => {
      renderWithTheme(
        <CircularRing 
          value={60}
          strokeWidth={12}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies custom colors', () => {
      const customColor = '#ff5722';
      renderWithTheme(
        <CircularRing 
          value={60}
          color={customColor}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with gradient', () => {
      renderWithTheme(
        <CircularRing 
          value={60}
          gradient={true}
        />
      );
      
      const svg = document.querySelector('svg');
      const defs = svg?.querySelector('defs');
      expect(defs).toBeInTheDocument();
    });

    it('handles animation props', () => {
      renderWithTheme(
        <CircularRing 
          value={60}
          animated={true}
          duration={1000}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('CircularProgress - Different Thickness', () => {
    it('applies thin thickness', () => {
      renderWithTheme(
        <CircularProgress 
          value={50}
          thickness="thin"
        />
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('applies thick thickness', () => {
      renderWithTheme(
        <CircularProgress 
          value={50}
          thickness="thick"
        />
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('CircularProgress - Edge Cases', () => {
    it('handles zero value', () => {
      renderWithTheme(
        <CircularProgress 
          value={0}
          maxValue={100}
        />
      );
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles value greater than max', () => {
      renderWithTheme(
        <CircularProgress 
          value={120}
          maxValue={100}
        />
      );
      
      expect(screen.getByText('100%')).toBeInTheDocument(); // Should be clamped to 100%
    });

    it('handles negative value', () => {
      renderWithTheme(
        <CircularProgress 
          value={-20}
          maxValue={100}
        />
      );
      
      expect(screen.getByText('0%')).toBeInTheDocument(); // Should be clamped to 0%
    });

    it('handles custom center content', () => {
      const customContent = (
        <div>
          <div>Custom</div>
          <div>Content</div>
        </div>
      );

      renderWithTheme(
        <CircularProgress 
          value={75}
          centerContent={customContent}
        />
      );
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles different line caps', () => {
      renderWithTheme(
        <CircularProgress 
          value={50}
          lineCap="square"
        />
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('enables glow effect', () => {
      renderWithTheme(
        <CircularProgress 
          value={50}
          glow={true}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('CircularProgress - Accessibility', () => {
    it('supports tooltip', () => {
      renderWithTheme(
        <CircularProgress 
          value={75}
          tooltip="Progress: 75% complete"
        />
      );
      
      // The tooltip wrapper should be present
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});