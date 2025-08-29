import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Star,
  StarBorder,
  CheckCircle,
  Cancel,
  Warning,
  Info,
} from '@mui/icons-material';
import {
  VirtualizedDataTable,
  SmartFilter,
  TableToolbar,
  TablePagination,
  createColumn,
  createStatusColumn,
  createCurrencyColumn,
  createDateColumn,
  createCustomColumn,
} from './index';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Mock data generator
const generateMockData = (count = 10000) => {
  const statuses = ['Active', 'Pending', 'Completed', 'Cancelled', 'On Hold'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const departments = ['Sales', 'Marketing', 'Engineering', 'Support', 'Operations'];
  const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: names[Math.floor(Math.random() * names.length)],
    email: `user${index + 1}@collisionos.com`,
    department: departments[Math.floor(Math.random() * departments.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    revenue: Math.random() * 100000,
    progress: Math.floor(Math.random() * 101),
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    rating: Math.floor(Math.random() * 5) + 1,
    isActive: Math.random() > 0.3,
  }));
};

const TableDemo = () => {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [density, setDensity] = useState('standard');
  const [viewMode, setViewMode] = useState('table');
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Initialize data
  useEffect(() => {
    setTimeout(() => {
      const mockData = generateMockData(10000);
      setData(mockData);
      setFilteredData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Define columns
  const columns = useMemo(() => [
    createColumn('id', 'ID', { 
      width: 80, 
      editable: false,
      sortable: true,
      required: true,
    }),
    createColumn('name', 'Name', { 
      width: 200,
      quickFilter: true,
    }),
    createColumn('email', 'Email', { 
      width: 250,
      quickFilter: true,
    }),
    createColumn('department', 'Department', { 
      width: 150,
      type: 'select',
      options: [
        { value: 'Sales', label: 'Sales' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Support', label: 'Support' },
        { value: 'Operations', label: 'Operations' },
      ],
      quickFilter: true,
    }),
    createStatusColumn('status', 'Status', {
      'Active': 'success',
      'Pending': 'warning', 
      'Completed': 'info',
      'Cancelled': 'error',
      'On Hold': 'default',
    }, { 
      width: 120,
      quickFilter: true,
    }),
    createStatusColumn('priority', 'Priority', {
      'Low': 'info',
      'Medium': 'warning',
      'High': 'error',
      'Critical': 'error',
    }, { 
      width: 100,
    }),
    createCurrencyColumn('revenue', 'Revenue', { 
      width: 120,
      type: 'number',
    }),
    createCustomColumn('progress', 'Progress', (value) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 60,
            height: 8,
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: 4,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: `${value}%`,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ minWidth: '35px', fontSize: '0.75rem' }}>
          {value}%
        </Typography>
      </Box>
    ), {
      width: 120,
      editable: false,
    }),
    createCustomColumn('rating', 'Rating', (value) => (
      <Box sx={{ display: 'flex' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <IconButton key={i} size="small" sx={{ p: 0.25 }}>
            {i < value ? (
              <Star sx={{ fontSize: '1rem', color: theme.palette.warning.main }} />
            ) : (
              <StarBorder sx={{ fontSize: '1rem', color: theme.palette.action.disabled }} />
            )}
          </IconButton>
        ))}
      </Box>
    ), {
      width: 140,
      editable: false,
    }),
    createDateColumn('createdAt', 'Created', { 
      width: 120,
      editable: false,
    }),
    createCustomColumn('actions', 'Actions', (value, row) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton size="small" color="primary">
          <Visibility fontSize="small" />
        </IconButton>
        <IconButton size="small" color="info">
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error">
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    ), {
      width: 120,
      editable: false,
      sortable: false,
    }),
  ], [theme]);

  // Initialize visible columns
  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(col => col.id));
    }
  }, [columns, visibleColumns.length]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...data];

    // Apply search
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply filters
    filters.forEach(filter => {
      const column = columns.find(col => col.id === filter.column);
      if (!column) return;

      filtered = filtered.filter(row => {
        const value = row[filter.column];
        
        switch (filter.operator) {
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'equals':
            return value === filter.value;
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
    setPage(0); // Reset to first page when data changes
  }, [data, filters, searchValue, sortBy, sortOrder, columns]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Handle row actions
  const handleRowClick = useCallback((row) => {
    console.log('Row clicked:', row);
  }, []);

  const handleRowEdit = useCallback((row) => {
    console.log('Row edit:', row);
  }, []);

  const handleRowDelete = useCallback((row) => {
    console.log('Row delete:', row);
  }, []);

  const handleSort = useCallback((columnId, order) => {
    setSortBy(columnId);
    setSortOrder(order);
  }, []);

  const handleExport = useCallback((format, rowIds) => {
    console.log('Export:', format, rowIds);
  }, []);

  const handleBulkAction = useCallback((action, rowIds) => {
    console.log('Bulk action:', action, rowIds);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockData(10000);
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter presets for demo
  const savedPresets = [
    {
      id: 'active-high-priority',
      name: 'Active High Priority',
      filters: [
        { column: 'status', operator: 'equals', value: 'Active' },
        { column: 'priority', operator: 'equals', value: 'High' },
      ],
      searchValue: '',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'sales-dept',
      name: 'Sales Department',
      filters: [
        { column: 'department', operator: 'equals', value: 'Sales' },
      ],
      searchValue: '',
      createdAt: '2024-01-10T15:30:00Z',
    },
  ];

  // Bulk actions
  const bulkActions = [
    {
      id: 'activate',
      label: 'Activate Selected',
      icon: <CheckCircle />,
      description: 'Set status to active for selected items',
    },
    {
      id: 'deactivate', 
      label: 'Deactivate Selected',
      icon: <Cancel />,
      description: 'Set status to inactive for selected items',
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Info />,
      description: 'Export selected items to CSV',
    },
  ];

  // Custom actions
  const customActions = [
    {
      id: 'import',
      label: 'Import Data',
      icon: <Info />,
      onClick: () => console.log('Import data'),
    },
    {
      id: 'settings',
      label: 'Table Settings',
      icon: <Info />,
      onClick: () => console.log('Table settings'),
    },
  ];

  const glassStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
    borderRadius: premiumDesignSystem.borderRadius.xl,
    boxShadow: premiumDesignSystem.shadows.glass.elevated,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ ...glassStyles, p: 3, mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 2,
        }}>
          Enterprise Data Tables Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Virtualized tables with smart filtering, supporting 10,000+ rows with enterprise-grade features.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`${filteredData.length.toLocaleString()} Records`} color="primary" />
          <Chip label="Virtual Scrolling" color="secondary" />
          <Chip label="Smart Filtering" color="info" />
          <Chip label="Glassmorphism Design" color="success" />
        </Box>
      </Paper>

      {/* Smart Filter Component */}
      <SmartFilter
        columns={columns}
        filters={filters}
        onFiltersChange={setFilters}
        savedPresets={savedPresets}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search 10,000+ records..."
      />

      {/* Table Toolbar */}
      <TableToolbar
        title="Customer Data"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        density={density}
        onDensityChange={setDensity}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        columns={columns}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        selectedRows={selectedRows}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onRefresh={handleRefresh}
        bulkActions={bulkActions}
        customActions={customActions}
        loading={loading}
      />

      {/* Virtualized Data Table */}
      <VirtualizedDataTable
        data={paginatedData}
        columns={columns.filter(col => visibleColumns.includes(col.id))}
        loading={loading}
        onRowClick={handleRowClick}
        onRowSelect={setSelectedRows}
        onRowEdit={handleRowEdit}
        onRowDelete={handleRowDelete}
        onSort={handleSort}
        onExport={handleExport}
        selectedRows={selectedRows}
        sortBy={sortBy}
        sortOrder={sortOrder}
        height={600}
        rowHeight={density === 'compact' ? 40 : density === 'comfortable' ? 64 : 52}
        stickyColumns={['id', 'name']}
      />

      {/* Table Pagination */}
      <TablePagination
        count={filteredData.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
        showProgressBar={loading}
      />
    </Container>
  );
};

export default TableDemo;