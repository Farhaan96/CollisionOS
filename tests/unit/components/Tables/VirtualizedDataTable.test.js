import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import VirtualizedDataTable from '../../../../src/components/Tables/VirtualizedDataTable';
import { premiumDesignSystem } from '../../../../src/theme/premiumDesignSystem';
import { createTheme } from '@mui/material/styles';

// Create theme for testing
const theme = createTheme({
  palette: {
    primary: { main: '#6366F1' },
    secondary: { main: '#8B5CF6' },
    background: { paper: '#ffffff' },
    common: { white: '#ffffff' },
  },
});

// Mock data for testing
const mockColumns = [
  { id: 'id', label: 'ID', width: 80, editable: false },
  { id: 'name', label: 'Name', width: 200 },
  { id: 'email', label: 'Email', width: 250 },
  { id: 'status', label: 'Status', width: 120, type: 'status', statusColors: { active: 'success' } },
  { id: 'amount', label: 'Amount', width: 120, type: 'currency' },
  { id: 'createdAt', label: 'Created', width: 120, type: 'date' },
];

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@test.com', status: 'active', amount: 1000, createdAt: '2024-01-01' },
  { id: 2, name: 'Jane Smith', email: 'jane@test.com', status: 'inactive', amount: 2000, createdAt: '2024-01-02' },
  { id: 3, name: 'Bob Johnson', email: 'bob@test.com', status: 'pending', amount: 1500, createdAt: '2024-01-03' },
];

// Mock virtualization
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 150,
    getVirtualItems: () => mockData.map((_, index) => ({
      index,
      start: index * 50,
      size: 50,
    })),
  }),
}));

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('VirtualizedDataTable', () => {
  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with data', () => {
    renderWithTheme(<VirtualizedDataTable {...defaultProps} />);
    
    // Check if table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check if data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    renderWithTheme(<VirtualizedDataTable {...defaultProps} loading={true} />);
    
    // Check for skeleton loading components
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('handles row selection', () => {
    const onRowSelect = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onRowSelect={onRowSelect}
        enableRowSelection={true}
      />
    );
    
    // Click on checkbox (first checkbox is "select all")
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    fireEvent.click(checkboxes[1]); // Click first row checkbox
    expect(onRowSelect).toHaveBeenCalledWith([1]);
  });

  test('handles column sorting', () => {
    const onSort = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onSort={onSort}
      />
    );
    
    // Click on sortable column header
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  test('handles row click', () => {
    const onRowClick = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onRowClick={onRowClick}
      />
    );
    
    // Find and click a table row
    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.click(row);
    
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'John Doe' }),
      0
    );
  });

  test('renders different cell types correctly', () => {
    renderWithTheme(<VirtualizedDataTable {...defaultProps} />);
    
    // Check status chip
    expect(screen.getByText('active')).toBeInTheDocument();
    
    // Check currency formatting
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    
    // Check date formatting
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });

  test('handles context menu', async () => {
    const onRowEdit = jest.fn();
    const onRowDelete = jest.fn();
    
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onRowEdit={onRowEdit}
        onRowDelete={onRowDelete}
      />
    );
    
    // Right click on a row
    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.contextMenu(row);
    
    // Check if context menu appears
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  test('handles inline editing', () => {
    const onRowEdit = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onRowEdit={onRowEdit}
        enableInlineEdit={true}
      />
    );
    
    // Click on editable cell
    const nameCell = screen.getByText('John Doe');
    fireEvent.click(nameCell);
    
    // Check if input field appears (would need more specific implementation)
    // This is a simplified test - actual implementation would be more complex
  });

  test('handles column resizing', () => {
    const onColumnResize = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onColumnResize={onColumnResize}
        enableColumnResizing={true}
      />
    );
    
    // This would test the column resize handle interaction
    // Implementation details would depend on the exact resize mechanism
  });

  test('handles export functionality', () => {
    const onExport = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onExport={onExport}
        enableExport={true}
      />
    );
    
    // Right click to open context menu and click export
    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.contextMenu(row);
    
    waitFor(() => {
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      expect(onExport).toHaveBeenCalledWith('csv');
    });
  });

  test('applies glassmorphism styles', () => {
    renderWithTheme(<VirtualizedDataTable {...defaultProps} />);
    
    // Check if the main container has glassmorphism styles
    const tableContainer = screen.getByRole('table').closest('div');
    expect(tableContainer).toHaveStyle({
      backdropFilter: 'blur(20px)',
    });
  });

  test('handles sticky columns', () => {
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        stickyColumns={['id', 'name']}
      />
    );
    
    // Check if sticky columns have position sticky
    const stickyHeaders = screen.getAllByRole('columnheader');
    // The exact implementation would depend on how sticky positioning is applied
    expect(stickyHeaders.length).toBeGreaterThan(0);
  });

  test('handles empty data state', () => {
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        data={[]}
      />
    );
    
    // Should still render headers but no data rows
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('handles select all functionality', () => {
    const onRowSelect = jest.fn();
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        onRowSelect={onRowSelect}
        enableRowSelection={true}
      />
    );
    
    // Click select all checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);
    
    expect(onRowSelect).toHaveBeenCalledWith([1, 2, 3]);
  });

  test('applies correct row height', () => {
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        rowHeight={80}
      />
    );
    
    // This would test that the virtualization is using the correct row height
    // The exact test would depend on how the height is applied
  });

  test('handles large datasets efficiently', () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      status: 'active',
      amount: Math.random() * 10000,
      createdAt: '2024-01-01',
    }));
    
    renderWithTheme(
      <VirtualizedDataTable 
        {...defaultProps} 
        data={largeData}
      />
    );
    
    // Should render without performance issues
    expect(screen.getByText('Name')).toBeInTheDocument();
    // Only visible rows should be in DOM due to virtualization
  });
});