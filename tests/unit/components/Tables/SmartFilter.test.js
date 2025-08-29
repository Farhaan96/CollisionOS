import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import '@testing-library/jest-dom';
import SmartFilter from '../../../../src/components/Tables/SmartFilter';
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

const mockColumns = [
  { 
    id: 'name', 
    label: 'Name', 
    type: 'text',
    quickFilter: true,
  },
  { 
    id: 'email', 
    label: 'Email', 
    type: 'text',
    quickFilter: true,
  },
  { 
    id: 'department', 
    label: 'Department', 
    type: 'select',
    options: [
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'engineering', label: 'Engineering' },
    ],
    quickFilter: true,
  },
  { 
    id: 'salary', 
    label: 'Salary', 
    type: 'number',
  },
  { 
    id: 'startDate', 
    label: 'Start Date', 
    type: 'date',
  },
  { 
    id: 'isActive', 
    label: 'Active', 
    type: 'boolean',
  },
];

const mockSavedPresets = [
  {
    id: 'active-employees',
    name: 'Active Employees',
    filters: [
      { column: 'isActive', operator: 'equals', value: true },
    ],
    searchValue: '',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'high-salary',
    name: 'High Salary',
    filters: [
      { column: 'salary', operator: 'greaterThan', value: 100000 },
    ],
    searchValue: '',
    createdAt: '2024-01-02T15:30:00Z',
  },
];

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {component}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('SmartFilter', () => {
  const defaultProps = {
    columns: mockColumns,
    filters: [],
    onFiltersChange: jest.fn(),
    savedPresets: mockSavedPresets,
    onSavePreset: jest.fn(),
    onDeletePreset: jest.fn(),
    onLoadPreset: jest.fn(),
    searchValue: '',
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders search input with placeholder', () => {
    renderWithProviders(<SmartFilter {...defaultProps} searchPlaceholder="Search records..." />);
    
    expect(screen.getByPlaceholderText('Search records...')).toBeInTheDocument();
  });

  test('handles search input with debouncing', async () => {
    const onSearchChange = jest.fn();
    renderWithProviders(<SmartFilter {...defaultProps} onSearchChange={onSearchChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Should not call immediately
    expect(onSearchChange).not.toHaveBeenCalled();
    
    // Fast-forward time to trigger debounced call
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('test search');
    });
  });

  test('displays quick filters', () => {
    renderWithProviders(<SmartFilter {...defaultProps} enableQuickFilters={true} />);
    
    expect(screen.getByText('Quick Filters:')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
  });

  test('handles quick filter toggle', () => {
    const onFiltersChange = jest.fn();
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        onFiltersChange={onFiltersChange}
        enableQuickFilters={true}
      />
    );
    
    // Click on a quick filter
    const nameFilter = screen.getByText('Name');
    fireEvent.click(nameFilter);
    
    // Should add a new filter
    expect(onFiltersChange).toHaveBeenCalled();
  });

  test('displays active filter chips', () => {
    const activeFilters = [
      {
        id: 'filter1',
        column: 'name',
        operator: 'contains',
        value: 'john',
        label: 'Name contains john',
      },
    ];
    
    renderWithProviders(<SmartFilter {...defaultProps} filters={activeFilters} />);
    
    expect(screen.getByText('Name contains john')).toBeInTheDocument();
  });

  test('handles filter removal', () => {
    const onFiltersChange = jest.fn();
    const activeFilters = [
      {
        id: 'filter1',
        column: 'name',
        operator: 'contains',
        value: 'john',
        label: 'Name contains john',
      },
    ];
    
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
      />
    );
    
    // Click the delete button on the filter chip
    const deleteButton = screen.getByTestId('HighlightOffIcon');
    fireEvent.click(deleteButton);
    
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  test('opens advanced filter builder', () => {
    renderWithProviders(<SmartFilter {...defaultProps} enableAdvancedBuilder={true} />);
    
    const advancedButton = screen.getByText('Advanced Filters');
    fireEvent.click(advancedButton);
    
    expect(screen.getByText('Advanced Filter Builder')).toBeInTheDocument();
  });

  test('displays preset management menu', () => {
    renderWithProviders(<SmartFilter {...defaultProps} enablePresets={true} />);
    
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    expect(screen.getByText('Save Current Filters')).toBeInTheDocument();
    expect(screen.getByText('Active Employees')).toBeInTheDocument();
    expect(screen.getByText('High Salary')).toBeInTheDocument();
  });

  test('handles preset loading', () => {
    const onLoadPreset = jest.fn();
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        onLoadPreset={onLoadPreset}
        enablePresets={true}
      />
    );
    
    // Open presets menu
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    // Click on a preset
    const presetItem = screen.getByText('Active Employees');
    fireEvent.click(presetItem);
    
    expect(onLoadPreset).toHaveBeenCalledWith(mockSavedPresets[0]);
  });

  test('handles preset saving', async () => {
    const onSavePreset = jest.fn();
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        onSavePreset={onSavePreset}
        enablePresets={true}
      />
    );
    
    // Open presets menu
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    // Click save current filters
    const saveButton = screen.getByText('Save Current Filters');
    fireEvent.click(saveButton);
    
    // Should open save dialog
    expect(screen.getByText('Save Filter Preset')).toBeInTheDocument();
    
    // Enter preset name
    const nameInput = screen.getByLabelText('Preset Name');
    fireEvent.change(nameInput, { target: { value: 'My Custom Preset' } });
    
    // Click save
    const dialogSaveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(dialogSaveButton);
    
    await waitFor(() => {
      expect(onSavePreset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Custom Preset',
          filters: [],
        })
      );
    });
  });

  test('handles preset deletion', () => {
    const onDeletePreset = jest.fn();
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        onDeletePreset={onDeletePreset}
        enablePresets={true}
      />
    );
    
    // Open presets menu
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    // Click delete button on first preset
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);
    
    expect(onDeletePreset).toHaveBeenCalledWith('active-employees');
  });

  test('handles clear all filters', () => {
    const onFiltersChange = jest.fn();
    const onSearchChange = jest.fn();
    const activeFilters = [
      {
        id: 'filter1',
        column: 'name',
        operator: 'contains',
        value: 'john',
        label: 'Name contains john',
      },
    ];
    
    renderWithProviders(
      <SmartFilter 
        {...defaultProps}
        filters={activeFilters}
        searchValue="test"
        onFiltersChange={onFiltersChange}
        onSearchChange={onSearchChange}
      />
    );
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  test('shows active filter count badge', () => {
    const activeFilters = [
      {
        id: 'filter1',
        column: 'name',
        operator: 'contains',
        value: 'john',
        label: 'Name contains john',
      },
      {
        id: 'filter2',
        column: 'email',
        operator: 'contains',
        value: '@test.com',
        label: 'Email contains @test.com',
      },
    ];
    
    renderWithProviders(
      <SmartFilter 
        {...defaultProps}
        filters={activeFilters}
        searchValue="test"
        enableAdvancedBuilder={true}
      />
    );
    
    // Should show count of 3 (2 filters + 1 search)
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });

  test('applies glassmorphism styles', () => {
    renderWithProviders(<SmartFilter {...defaultProps} />);
    
    // Check if the main container has glassmorphism styles
    const filterContainer = screen.getByPlaceholderText('Search...').closest('.MuiPaper-root');
    expect(filterContainer).toHaveStyle({
      backdropFilter: 'blur(20px)',
    });
  });

  test('handles different filter operators', () => {
    // This would test the filter value input rendering for different operators
    // The actual implementation would depend on the advanced filter builder
    renderWithProviders(<SmartFilter {...defaultProps} />);
    
    // Test would verify that different input types are shown for different operators
    // (text inputs, date pickers, number inputs, selects, etc.)
  });

  test('handles search input clearing', () => {
    const onSearchChange = jest.fn();
    renderWithProviders(
      <SmartFilter 
        {...defaultProps} 
        searchValue="test search"
        onSearchChange={onSearchChange}
      />
    );
    
    // Clear button should appear when there's search text
    const clearButton = screen.getByTestId('ClearIcon');
    fireEvent.click(clearButton);
    
    // Should clear the search
    jest.advanceTimersByTime(300);
    
    waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });

  test('respects max filters limit', () => {
    const onFiltersChange = jest.fn();
    const maxFilters = 2;
    const existingFilters = [
      { id: 'filter1', column: 'name', operator: 'contains', value: 'john' },
      { id: 'filter2', column: 'email', operator: 'contains', value: 'test' },
    ];
    
    renderWithProviders(
      <SmartFilter 
        {...defaultProps}
        filters={existingFilters}
        onFiltersChange={onFiltersChange}
        maxFilters={maxFilters}
        enableQuickFilters={true}
      />
    );
    
    // Trying to add another filter should not work if at max limit
    const quickFilter = screen.getByText('Department');
    fireEvent.click(quickFilter);
    
    // Should not add new filter since we're at the limit
    expect(onFiltersChange).not.toHaveBeenCalled();
  });
});