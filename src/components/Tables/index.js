// Enterprise-grade virtualized data table components for CollisionOS
// Built with premium glassmorphism design and executive-level functionality

export { default as VirtualizedDataTable } from './VirtualizedDataTable';
export { default as SmartFilter } from './SmartFilter';
export { default as TableToolbar } from './TableToolbar';
export { default as TablePagination } from './TablePagination';

// Re-export commonly used types and utilities
export const TABLE_DENSITIES = {
  COMPACT: 'compact',
  STANDARD: 'standard',
  COMFORTABLE: 'comfortable',
};

export const TABLE_VIEW_MODES = {
  TABLE: 'table',
  LIST: 'list',
  CARD: 'card',
};

export const FILTER_OPERATORS = {
  TEXT: {
    CONTAINS: 'contains',
    EQUALS: 'equals',
    STARTS_WITH: 'startsWith',
    ENDS_WITH: 'endsWith',
    NOT_CONTAINS: 'notContains',
    IS_EMPTY: 'isEmpty',
    IS_NOT_EMPTY: 'isNotEmpty',
  },
  NUMBER: {
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    GREATER_THAN: 'greaterThan',
    LESS_THAN: 'lessThan',
    GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
    LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
    BETWEEN: 'between',
    IS_EMPTY: 'isEmpty',
    IS_NOT_EMPTY: 'isNotEmpty',
  },
  DATE: {
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    AFTER: 'after',
    BEFORE: 'before',
    BETWEEN: 'between',
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'thisWeek',
    LAST_WEEK: 'lastWeek',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    IS_EMPTY: 'isEmpty',
    IS_NOT_EMPTY: 'isNotEmpty',
  },
  SELECT: {
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    IN: 'in',
    NOT_IN: 'notIn',
    IS_EMPTY: 'isEmpty',
    IS_NOT_EMPTY: 'isNotEmpty',
  },
};

export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
};

// Utility functions for table operations
export const createColumn = (id, label, options = {}) => ({
  id,
  label,
  sortable: true,
  editable: true,
  width: 150,
  type: 'text',
  ...options,
});

export const createStatusColumn = (
  id,
  label,
  statusColors = {},
  options = {}
) => ({
  ...createColumn(id, label, {
    type: 'status',
    editable: false,
    statusColors,
    ...options,
  }),
});

export const createCurrencyColumn = (id, label, options = {}) => ({
  ...createColumn(id, label, {
    type: 'currency',
    format: value => `$${value?.toFixed(2) || '0.00'}`,
    ...options,
  }),
});

export const createDateColumn = (id, label, options = {}) => ({
  ...createColumn(id, label, {
    type: 'date',
    format: value => (value ? new Date(value).toLocaleDateString() : ''),
    ...options,
  }),
});

export const createCustomColumn = (id, label, renderFn, options = {}) => ({
  ...createColumn(id, label, {
    type: 'custom',
    render: renderFn,
    editable: false,
    ...options,
  }),
});

// Default column configurations for common data types
export const DEFAULT_COLUMNS = {
  id: createColumn('id', 'ID', { width: 80, sortable: true, editable: false }),
  name: createColumn('name', 'Name', { width: 200 }),
  email: createColumn('email', 'Email', { width: 250 }),
  phone: createColumn('phone', 'Phone', { width: 150 }),
  status: createStatusColumn('status', 'Status', {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
  }),
  amount: createCurrencyColumn('amount', 'Amount', { width: 120 }),
  createdAt: createDateColumn('createdAt', 'Created', { width: 120 }),
  updatedAt: createDateColumn('updatedAt', 'Updated', { width: 120 }),
};

// Common bulk actions
export const DEFAULT_BULK_ACTIONS = [
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: 'Delete',
    description: 'Permanently delete selected items',
    color: 'error',
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: 'GetApp',
    description: 'Export selected items to file',
    color: 'primary',
  },
  {
    id: 'archive',
    label: 'Archive Selected',
    icon: 'Archive',
    description: 'Move selected items to archive',
    color: 'warning',
  },
];

// Pagination size options
export const PAGINATION_SIZES = [10, 25, 50, 100, 250, 500];

export default {
  VirtualizedDataTable,
  SmartFilter,
  TableToolbar,
  TablePagination,
};
