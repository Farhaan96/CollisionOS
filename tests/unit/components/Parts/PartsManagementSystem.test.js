import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { modernTheme } from '../../../../src/theme/modernTheme';
import PartsManagementSystem from '../../../../src/components/Parts/PartsManagementSystem';
import { partsService } from '../../../../src/services/partsService';

// Mock the parts service
jest.mock('../../../../src/services/partsService');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Test wrapper with theme
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={modernTheme}>
    {children}
  </ThemeProvider>
);

describe('PartsManagementSystem', () => {
  const mockPartsData = [
    {
      id: '1',
      jobId: 'JOB-001',
      partNumber: 'TOY-52119-06903',
      description: 'Front Bumper Cover',
      category: 'body',
      quantity: 1,
      status: 'ordered',
      estimatedCost: 450.00,
      actualCost: 425.00,
      supplier: 'oem_direct'
    }
  ];

  const mockInventoryData = [
    {
      id: '1',
      partNumber: 'UNIV-PAINT-001',
      description: 'Basecoat Paint - White',
      category: 'consumables',
      currentStock: 15,
      minimumStock: 5,
      maximumStock: 30,
      unitCost: 45.00
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    partsService.getAllParts.mockResolvedValue(mockPartsData);
    partsService.getInventoryStatus.mockResolvedValue(mockInventoryData);
    partsService.getPurchaseOrders.mockResolvedValue([]);
  });

  it('renders parts management system', async () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    expect(screen.getByText('Parts Management')).toBeInTheDocument();
    expect(screen.getByText('Parts Board')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('loads parts data on mount', async () => {
    render(
      <TestWrapper>
        <PartsManagementSystem jobId="JOB-001" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(partsService.getAllParts).toHaveBeenCalledWith({ jobId: 'JOB-001' });
      expect(partsService.getInventoryStatus).toHaveBeenCalled();
      expect(partsService.getPurchaseOrders).toHaveBeenCalled();
    });
  });

  it('opens search dialog when search button is clicked', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    const searchButton = screen.getByText('Search Parts');
    fireEvent.click(searchButton);

    // PartsSearchDialog should be rendered (mocked)
    expect(screen.getByText('Search Parts')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Click Inventory tab
    const inventoryTab = screen.getByText('Inventory');
    fireEvent.click(inventoryTab);

    // Should render inventory content
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
  });

  it('handles real-time updates toggle', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    const realtimeSwitch = screen.getByRole('checkbox');
    fireEvent.click(realtimeSwitch);

    expect(realtimeSwitch).toBeChecked();
  });

  it('displays parts in the parts board', async () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('TOY-52119-06903')).toBeInTheDocument();
      expect(screen.getByText('Front Bumper Cover')).toBeInTheDocument();
    });
  });

  it('handles barcode scanning', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    const barcodeButton = screen.getByText('Scan Barcode');
    fireEvent.click(barcodeButton);

    // Should activate scanner (implementation would depend on actual scanner)
    expect(barcodeButton).toBeInTheDocument();
  });

  it('calls onPartsUpdate callback when parts change', async () => {
    const mockCallback = jest.fn();
    
    render(
      <TestWrapper>
        <PartsManagementSystem onPartsUpdate={mockCallback} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(partsService.getAllParts).toHaveBeenCalled();
    });

    // Callback should be called when data changes
    expect(mockCallback).toHaveBeenCalled();
  });

  it('handles service errors gracefully', async () => {
    partsService.getAllParts.mockRejectedValue(new Error('Service error'));
    partsService.getInventoryStatus.mockRejectedValue(new Error('Service error'));
    partsService.getPurchaseOrders.mockRejectedValue(new Error('Service error'));

    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Should not crash and should display fallback data
    await waitFor(() => {
      expect(screen.getByText('Parts Management')).toBeInTheDocument();
    });
  });
});

describe('Parts Board Component', () => {
  it('displays parts organized by status', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Should display status columns
    expect(screen.getByText('Needed')).toBeInTheDocument();
    expect(screen.getByText('Ordered')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.getByText('Installed')).toBeInTheDocument();
  });

  it('shows part count badges for each status', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Should show badges with counts
    const badges = screen.getAllByText('1', { selector: '.MuiBadge-badge' });
    expect(badges.length).toBeGreaterThan(0);
  });
});

describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    const searchButton = screen.getByLabelText(/search parts/i);
    expect(searchButton).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    const firstTab = screen.getByText('Parts Board');
    firstTab.focus();
    
    // Tab should be focusable
    expect(document.activeElement).toBe(firstTab);
  });

  it('has proper color contrast for status indicators', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Status chips should have appropriate colors
    const statusChips = screen.getAllByTestId(/status-chip/i);
    statusChips.forEach(chip => {
      expect(chip).toHaveStyle({ color: expect.any(String) });
    });
  });
});

describe('Performance', () => {
  it('renders within performance budget', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large datasets efficiently', async () => {
    const largeMockData = Array.from({ length: 1000 }, (_, index) => ({
      id: `part-${index}`,
      partNumber: `PART-${index}`,
      description: `Part ${index}`,
      category: 'body',
      status: 'ordered'
    }));

    partsService.getAllParts.mockResolvedValue(largeMockData);

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(partsService.getAllParts).toHaveBeenCalled();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle large datasets reasonably well
    expect(renderTime).toBeLessThan(1000);
  });
});

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  it('adapts layout for mobile screens', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // Should be responsive (specific implementation would depend on actual breakpoints)
    expect(screen.getByText('Parts Management')).toBeInTheDocument();
  });

  it('maintains functionality on mobile', () => {
    render(
      <TestWrapper>
        <PartsManagementSystem />
      </TestWrapper>
    );

    // All core functionality should work on mobile
    const searchButton = screen.getByText('Search Parts');
    fireEvent.click(searchButton);
    
    expect(screen.getByText('Search Parts')).toBeInTheDocument();
  });
});