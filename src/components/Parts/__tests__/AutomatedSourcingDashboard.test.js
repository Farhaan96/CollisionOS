/**
 * Comprehensive Frontend Tests for Automated Sourcing Dashboard
 * CollisionOS - Desktop Dashboard Component Testing
 * 
 * Tests the desktop dashboard components for automated parts sourcing:
 * - Real-time vendor integration monitor
 * - Parts sourcing status display
 * - PO generation interface
 * - Performance metrics and KPIs
 * - Interactive charts and data visualization
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import AutomatedSourcingDashboard from '../AutomatedSourcingDashboard';
import VendorIntegrationMonitor from '../VendorIntegrationMonitor';
import PartsSearchDialog from '../PartsSearchDialog';

// Mock the API services
jest.mock('../../../services/partsService', () => ({
  getAutomatedSourcingStats: jest.fn(),
  getVendorPerformance: jest.fn(),
  searchParts: jest.fn(),
  generatePurchaseOrder: jest.fn()
}));

jest.mock('../../../services/websocketService', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>
}));

const mockTheme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={mockTheme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('AutomatedSourcingDashboard Component Tests', () => {
  let mockPartsService;
  let mockWebSocketService;

  beforeEach(() => {
    mockPartsService = require('../../../services/partsService');
    mockWebSocketService = require('../../../services/websocketService');
    
    // Mock default API responses
    mockPartsService.getAutomatedSourcingStats.mockResolvedValue({
      success: true,
      data: {
        totalParts: 150,
        successfullySourced: 142,
        sourcingSuccessRate: 94.7,
        avgProcessingTime: 1.2,
        totalSavings: 12500.00,
        activePOs: 8,
        pendingApprovals: 3
      }
    });

    mockPartsService.getVendorPerformance.mockResolvedValue({
      success: true,
      data: [
        { vendorId: 'lkq_direct', name: 'LKQ Direct', successRate: 92.5, avgResponseTime: 1.1, reliability: 95.2 },
        { vendorId: 'parts_trader', name: 'PartsTrader', successRate: 87.3, avgResponseTime: 1.8, reliability: 89.4 },
        { vendorId: 'oe_connection', name: 'OE Connection', successRate: 98.1, avgResponseTime: 2.1, reliability: 98.7 }
      ]
    });

    jest.clearAllMocks();
  });

  describe('Dashboard Component Rendering', () => {
    it('should render main dashboard with key metrics', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Automated Parts Sourcing Dashboard')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total parts
        expect(screen.getByText('142')).toBeInTheDocument(); // Successfully sourced
        expect(screen.getByText('94.7%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('$12,500.00')).toBeInTheDocument(); // Total savings
      });
    });

    it('should display KPI cards with correct values', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        // Check KPI cards
        expect(screen.getByTestId('total-parts-card')).toBeInTheDocument();
        expect(screen.getByTestId('success-rate-card')).toBeInTheDocument();
        expect(screen.getByTestId('avg-processing-time-card')).toBeInTheDocument();
        expect(screen.getByTestId('total-savings-card')).toBeInTheDocument();
      });

      // Verify KPI values
      expect(screen.getByText('Total Parts Processed')).toBeInTheDocument();
      expect(screen.getByText('Sourcing Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Processing Time')).toBeInTheDocument();
      expect(screen.getByText('Total Cost Savings')).toBeInTheDocument();
    });

    it('should render charts and data visualizations', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should display vendor performance table', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Vendor Performance')).toBeInTheDocument();
        expect(screen.getByText('LKQ Direct')).toBeInTheDocument();
        expect(screen.getByText('PartsTrader')).toBeInTheDocument();
        expect(screen.getByText('OE Connection')).toBeInTheDocument();
      });

      // Check performance metrics
      expect(screen.getByText('92.5%')).toBeInTheDocument(); // LKQ success rate
      expect(screen.getByText('87.3%')).toBeInTheDocument(); // PartsTrader success rate
      expect(screen.getByText('98.1%')).toBeInTheDocument(); // OE Connection success rate
    });
  });

  describe('Real-time Updates and WebSocket Integration', () => {
    it('should establish WebSocket connection on mount', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      expect(mockWebSocketService.connect).toHaveBeenCalled();
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('parts-sourcing-updates', expect.any(Function));
    });

    it('should handle real-time vendor updates', async () => {
      let updateHandler;
      mockWebSocketService.subscribe.mockImplementation((channel, handler) => {
        updateHandler = handler;
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      // Simulate vendor update
      const vendorUpdate = {
        type: 'vendor_update',
        vendorId: 'lkq_direct',
        data: {
          successRate: 94.2,
          avgResponseTime: 0.9,
          partsAvailable: 1250
        }
      };

      await act(async () => {
        updateHandler(vendorUpdate);
      });

      await waitFor(() => {
        expect(screen.getByText('94.2%')).toBeInTheDocument();
      });
    });

    it('should handle real-time parts sourcing notifications', async () => {
      let notificationHandler;
      mockWebSocketService.subscribe.mockImplementation((channel, handler) => {
        if (channel === 'sourcing-notifications') {
          notificationHandler = handler;
        }
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      // Simulate sourcing notification
      const notification = {
        type: 'parts_sourced',
        message: 'Front bumper cover sourced successfully',
        partNumber: 'GM-84044368',
        vendor: 'LKQ Direct',
        price: 415.00
      };

      await act(async () => {
        notificationHandler?.(notification);
      });

      await waitFor(() => {
        expect(screen.getByText(/Front bumper cover sourced successfully/)).toBeInTheDocument();
      });
    });

    it('should clean up WebSocket connections on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <AutomatedSourcingDashboard />
        </TestWrapper>
      );

      unmount();

      expect(mockWebSocketService.unsubscribe).toHaveBeenCalled();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Interactive Features', () => {
    it('should open parts search dialog when search button clicked', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      const searchButton = screen.getByTestId('parts-search-button');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('parts-search-dialog')).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button clicked', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      const refreshButton = screen.getByTestId('refresh-data-button');
      
      // Clear previous calls
      mockPartsService.getAutomatedSourcingStats.mockClear();
      
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockPartsService.getAutomatedSourcingStats).toHaveBeenCalledTimes(1);
        expect(mockPartsService.getVendorPerformance).toHaveBeenCalledTimes(1);
      });
    });

    it('should filter vendor table by performance metrics', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('LKQ Direct')).toBeInTheDocument();
      });

      const performanceFilter = screen.getByTestId('performance-filter');
      fireEvent.change(performanceFilter, { target: { value: 'high-performance' } });

      await waitFor(() => {
        // Only high-performance vendors should be visible
        expect(screen.getByText('OE Connection')).toBeInTheDocument(); // 98.1% success rate
        expect(screen.queryByText('PartsTrader')).not.toBeInTheDocument(); // 87.3% filtered out
      });
    });

    it('should export performance data when export button clicked', async () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-blob-url');
      global.URL.revokeObjectURL = jest.fn();

      const mockLink = {
        click: jest.fn(),
        download: '',
        href: ''
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      const exportButton = screen.getByTestId('export-data-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toContain('.csv');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API calls fail', async () => {
      mockPartsService.getAutomatedSourcingStats.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Error loading dashboard data/)).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching data', async () => {
      mockPartsService.getAutomatedSourcingStats.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 1000))
      );

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle WebSocket connection errors gracefully', async () => {
      mockWebSocketService.connect.mockRejectedValue(new Error('WebSocket connection failed'));

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Real-time updates unavailable/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render within performance thresholds', async () => {
      const startTime = performance.now();

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Automated Parts Sourcing Dashboard')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // 2 second render requirement
    });

    it('should handle large datasets efficiently', async () => {
      const largeVendorData = Array(100).fill().map((_, i) => ({
        vendorId: `vendor_${i}`,
        name: `Vendor ${i}`,
        successRate: 85 + Math.random() * 15,
        avgResponseTime: 1 + Math.random() * 2,
        reliability: 85 + Math.random() * 15
      }));

      mockPartsService.getVendorPerformance.mockResolvedValue({
        success: true,
        data: largeVendorData
      });

      const startTime = performance.now();

      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Vendor Performance')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(3000); // Should handle large datasets within 3 seconds
    });

    it('should be responsive across different screen sizes', async () => {
      // Mock different viewport sizes
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1024, height: 768 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];

      for (const viewport of viewports) {
        // Mock viewport
        Object.defineProperty(window, 'innerWidth', { value: viewport.width, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: viewport.height, configurable: true });

        await act(async () => {
          render(
            <TestWrapper>
              <AutomatedSourcingDashboard />
            </TestWrapper>
          );
        });

        await waitFor(() => {
          expect(screen.getByText('Automated Parts Sourcing Dashboard')).toBeInTheDocument();
        });

        // Component should render without layout issues
        const dashboard = screen.getByTestId('automated-sourcing-dashboard');
        expect(dashboard).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search parts/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      const searchButton = screen.getByTestId('parts-search-button');
      searchButton.focus();
      
      expect(document.activeElement).toBe(searchButton);

      // Tab to next focusable element
      fireEvent.keyDown(searchButton, { key: 'Tab' });
      
      const refreshButton = screen.getByTestId('refresh-data-button');
      expect(document.activeElement).toBe(refreshButton);
    });

    it('should announce status updates to screen readers', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AutomatedSourcingDashboard />
          </TestWrapper>
        );
      });

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});

describe('VendorIntegrationMonitor Component Tests', () => {
  let mockPartsService;

  beforeEach(() => {
    mockPartsService = require('../../../services/partsService');
    
    mockPartsService.getVendorStatus.mockResolvedValue({
      success: true,
      data: {
        lkq_direct: { status: 'active', responseTime: 1.1, lastPing: Date.now() },
        parts_trader: { status: 'active', responseTime: 1.8, lastPing: Date.now() },
        oe_connection: { status: 'maintenance', responseTime: null, lastPing: Date.now() - 300000 }
      }
    });

    jest.clearAllMocks();
  });

  it('should display vendor status indicators', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <VendorIntegrationMonitor />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Vendor Integration Status')).toBeInTheDocument();
      expect(screen.getByTestId('lkq-status-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('parts-trader-status-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('oe-connection-status-indicator')).toBeInTheDocument();
    });

    // Check status colors
    expect(screen.getByTestId('lkq-status-indicator')).toHaveClass('status-active');
    expect(screen.getByTestId('oe-connection-status-indicator')).toHaveClass('status-maintenance');
  });

  it('should show response time metrics', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <VendorIntegrationMonitor />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('1.1s')).toBeInTheDocument(); // LKQ response time
      expect(screen.getByText('1.8s')).toBeInTheDocument(); // PartsTrader response time
    });
  });

  it('should update status in real-time', async () => {
    let statusHandler;
    const mockWebSocketService = require('../../../services/websocketService');
    mockWebSocketService.subscribe.mockImplementation((channel, handler) => {
      if (channel === 'vendor-status') {
        statusHandler = handler;
      }
    });

    await act(async () => {
      render(
        <TestWrapper>
          <VendorIntegrationMonitor />
        </TestWrapper>
      );
    });

    // Simulate status update
    const statusUpdate = {
      vendorId: 'lkq_direct',
      status: 'degraded',
      responseTime: 3.2
    };

    await act(async () => {
      statusHandler?.(statusUpdate);
    });

    await waitFor(() => {
      expect(screen.getByTestId('lkq-status-indicator')).toHaveClass('status-degraded');
      expect(screen.getByText('3.2s')).toBeInTheDocument();
    });
  });
});

describe('PartsSearchDialog Component Tests', () => {
  let mockPartsService;

  beforeEach(() => {
    mockPartsService = require('../../../services/partsService');
    
    mockPartsService.searchParts.mockResolvedValue({
      success: true,
      data: {
        parts: [
          {
            partNumber: 'GM-84044368',
            description: 'Front Bumper Cover',
            price: 420.00,
            vendor: 'LKQ Direct',
            availability: 'In Stock'
          },
          {
            partNumber: 'GM-84044368',
            description: 'Front Bumper Cover',
            price: 445.00,
            vendor: 'PartsTrader',
            availability: 'In Stock'
          }
        ],
        totalResults: 2
      }
    });

    jest.clearAllMocks();
  });

  it('should render search form', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <PartsSearchDialog open={true} onClose={() => {}} />
        </TestWrapper>
      );
    });

    expect(screen.getByLabelText(/part number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vehicle year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('should perform parts search and display results', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <PartsSearchDialog open={true} onClose={() => {}} />
        </TestWrapper>
      );
    });

    const partNumberInput = screen.getByLabelText(/part number/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(partNumberInput, { target: { value: 'GM-84044368' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPartsService.searchParts).toHaveBeenCalledWith({
        partNumber: 'GM-84044368',
        year: '',
        make: '',
        model: ''
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Front Bumper Cover')).toBeInTheDocument();
      expect(screen.getByText('$420.00')).toBeInTheDocument();
      expect(screen.getByText('LKQ Direct')).toBeInTheDocument();
      expect(screen.getByText('$445.00')).toBeInTheDocument();
      expect(screen.getByText('PartsTrader')).toBeInTheDocument();
    });
  });

  it('should generate purchase order from search results', async () => {
    mockPartsService.generatePurchaseOrder.mockResolvedValue({
      success: true,
      poNumber: 'RO-2024-001-2401-LKQU-001'
    });

    await act(async () => {
      render(
        <TestWrapper>
          <PartsSearchDialog open={true} onClose={() => {}} />
        </TestWrapper>
      );
    });

    // Perform search first
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Front Bumper Cover')).toBeInTheDocument();
    });

    // Generate PO
    const generatePoButton = screen.getByTestId('generate-po-button-0');
    fireEvent.click(generatePoButton);

    await waitFor(() => {
      expect(mockPartsService.generatePurchaseOrder).toHaveBeenCalledWith({
        partNumber: 'GM-84044368',
        vendor: 'LKQ Direct',
        price: 420.00,
        quantity: 1
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Purchase order generated/i)).toBeInTheDocument();
      expect(screen.getByText('RO-2024-001-2401-LKQU-001')).toBeInTheDocument();
    });
  });
});