import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel,
  Autocomplete,
  alpha,
  useTheme,
  Divider,
  Stack,
  Badge,
} from '@mui/material';
import {
  FilterList,
  Add,
  Clear,
  Save,
  Delete,
  ExpandMore,
  Search,
  DateRange,
  Numbers,
  TextFields,
  List as ListIcon,
  BookmarkBorder,
  Bookmark,
  Close,
  Tune,
  HighlightOff,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

const FILTER_OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
    { value: 'lessThanOrEqual', label: 'Less than or equal' },
    { value: 'between', label: 'Between' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
    { value: 'between', label: 'Between' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This week' },
    { value: 'lastWeek', label: 'Last week' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'in', label: 'In' },
    { value: 'notIn', label: 'Not in' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'equals', label: 'Equals' },
  ],
};

const SmartFilter = ({
  columns = [],
  filters = [],
  onFiltersChange,
  savedPresets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  enableQuickFilters = true,
  enablePresets = true,
  enableAdvancedBuilder = true,
  maxFilters = 10,
  className,
  ...props
}) => {
  const theme = useTheme();
  const [searchText, setSearchText] = useState(searchValue);
  const [quickFilters, setQuickFilters] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [presetMenuAnchor, setPresetMenuAnchor] = useState(null);
  const [savePresetDialog, setSavePresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [highlightText, setHighlightText] = useState('');

  // Initialize quick filters from columns
  useEffect(() => {
    const quickFilterColumns = columns.filter(col => col.quickFilter);
    setQuickFilters(quickFilterColumns.map(col => ({
      id: col.id,
      label: col.label,
      type: col.type || 'text',
      options: col.options,
      active: false,
      value: null,
    })));
  }, [columns]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(searchText);
      }
      setHighlightText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, onSearchChange]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [onFiltersChange]);

  // Add new filter
  const handleAddFilter = useCallback((column, operator = null, value = null) => {
    if (filters.length >= maxFilters) return;

    const newFilter = {
      id: `filter_${Date.now()}`,
      column: column.id,
      operator: operator || FILTER_OPERATORS[column.type || 'text'][0].value,
      value: value,
      label: `${column.label} ${operator || FILTER_OPERATORS[column.type || 'text'][0].label} ${value || ''}`.trim(),
    };

    handleFilterChange([...filters, newFilter]);
  }, [filters, maxFilters, handleFilterChange]);

  // Remove filter
  const handleRemoveFilter = useCallback((filterId) => {
    handleFilterChange(filters.filter(f => f.id !== filterId));
  }, [filters, handleFilterChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSearchText('');
    setQuickFilters(prev => prev.map(f => ({ ...f, active: false, value: null })));
    handleFilterChange([]);
  }, [handleFilterChange]);

  // Handle quick filter toggle
  const handleQuickFilterToggle = useCallback((filterId, value = null) => {
    setQuickFilters(prev => prev.map(filter => {
      if (filter.id === filterId) {
        const isActive = !filter.active;
        
        // Add or remove from main filters
        if (isActive && value !== null) {
          const column = columns.find(c => c.id === filterId);
          handleAddFilter(column, 'equals', value);
        } else if (!isActive) {
          // Remove quick filter from main filters
          const quickFilterIds = filters.filter(f => f.column === filterId).map(f => f.id);
          handleFilterChange(filters.filter(f => !quickFilterIds.includes(f.id)));
        }
        
        return { ...filter, active: isActive, value };
      }
      return filter;
    }));
  }, [columns, filters, handleAddFilter, handleFilterChange]);

  // Handle preset operations
  const handleSavePreset = useCallback(() => {
    if (onSavePreset && presetName.trim()) {
      onSavePreset({
        name: presetName.trim(),
        filters,
        searchValue: searchText,
        createdAt: new Date().toISOString(),
      });
      setPresetName('');
      setSavePresetDialog(false);
    }
  }, [onSavePreset, presetName, filters, searchText]);

  const handleLoadPreset = useCallback((preset) => {
    setSearchText(preset.searchValue || '');
    handleFilterChange(preset.filters || []);
    setPresetMenuAnchor(null);
  }, [handleFilterChange]);

  // Render filter value input
  const renderFilterValueInput = useCallback((filter, column) => {
    const operators = FILTER_OPERATORS[column.type || 'text'];
    const currentOperator = operators.find(op => op.value === filter.operator);
    
    // Skip value input for operators that don't need values
    if (['isEmpty', 'isNotEmpty', 'today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'].includes(filter.operator)) {
      return null;
    }

    switch (column.type) {
      case 'date':
        if (filter.operator === 'between') {
          return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <DatePicker
                value={filter.value?.[0] ? dayjs(filter.value[0]) : null}
                onChange={(date) => {
                  const newValue = [date?.toISOString(), filter.value?.[1]];
                  // Update filter value logic here
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    placeholder: 'From',
                  }
                }}
              />
              <Typography variant="body2">to</Typography>
              <DatePicker
                value={filter.value?.[1] ? dayjs(filter.value[1]) : null}
                onChange={(date) => {
                  const newValue = [filter.value?.[0], date?.toISOString()];
                  // Update filter value logic here
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    placeholder: 'To',
                  }
                }}
              />
            </Box>
          );
        }
        return (
          <DatePicker
            value={filter.value ? dayjs(filter.value) : null}
            onChange={(date) => {
              // Update filter value logic here
            }}
            slotProps={{
              textField: {
                size: 'small',
              }
            }}
          />
        );
      
      case 'number':
        if (filter.operator === 'between') {
          return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                type="number"
                size="small"
                placeholder="Min"
                value={filter.value?.[0] || ''}
                onChange={(e) => {
                  const newValue = [e.target.value, filter.value?.[1]];
                  // Update filter value logic here
                }}
              />
              <Typography variant="body2">to</Typography>
              <TextField
                type="number"
                size="small"
                placeholder="Max"
                value={filter.value?.[1] || ''}
                onChange={(e) => {
                  const newValue = [filter.value?.[0], e.target.value];
                  // Update filter value logic here
                }}
              />
            </Box>
          );
        }
        return (
          <TextField
            type="number"
            size="small"
            value={filter.value || ''}
            onChange={(e) => {
              // Update filter value logic here
            }}
          />
        );

      case 'select':
        if (['in', 'notIn'].includes(filter.operator)) {
          return (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select values</InputLabel>
              <Select
                multiple
                value={filter.value || []}
                onChange={(e) => {
                  // Update filter value logic here
                }}
                input={<OutlinedInput label="Select values" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {column.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={(filter.value || []).indexOf(option.value) > -1} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        return (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Select value</InputLabel>
            <Select
              value={filter.value || ''}
              onChange={(e) => {
                // Update filter value logic here
              }}
              label="Select value"
            >
              {column.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Value</InputLabel>
            <Select
              value={filter.value !== undefined ? filter.value : ''}
              onChange={(e) => {
                // Update filter value logic here
              }}
              label="Value"
            >
              <MenuItem value={true}>True</MenuItem>
              <MenuItem value={false}>False</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            size="small"
            placeholder="Enter value"
            value={filter.value || ''}
            onChange={(e) => {
              // Update filter value logic here
            }}
          />
        );
    }
  }, []);

  // Glassmorphism styles
  const glassStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
    borderRadius: premiumDesignSystem.borderRadius.xl,
    boxShadow: premiumDesignSystem.shadows.glass.elevated,
  };

  // Count active filters
  const activeFilterCount = filters.length + (searchText ? 1 : 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper 
        className={className} 
        sx={{ ...glassStyles, p: 2, mb: 2 }}
        {...props}
      >
        {/* Main Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          {/* Search Input */}
          <TextField
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchText && (
                <IconButton
                  size="small"
                  onClick={() => setSearchText('')}
                >
                  <Clear />
                </IconButton>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                background: alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(10px)',
                borderRadius: premiumDesignSystem.borderRadius.lg,
              }
            }}
          />

          {/* Filter Builder Button */}
          {enableAdvancedBuilder && (
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<Tune />}
                onClick={() => setBuilderOpen(true)}
                sx={{
                  background: alpha(theme.palette.primary.main, 0.1),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                Advanced Filters
              </Button>
            </Badge>
          )}

          {/* Preset Management */}
          {enablePresets && (
            <>
              <Button
                variant="outlined"
                startIcon={<BookmarkBorder />}
                onClick={(e) => setPresetMenuAnchor(e.currentTarget)}
                sx={{
                  background: alpha(theme.palette.secondary.main, 0.1),
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  '&:hover': {
                    background: alpha(theme.palette.secondary.main, 0.2),
                  }
                }}
              >
                Presets
              </Button>
              <Menu
                anchorEl={presetMenuAnchor}
                open={Boolean(presetMenuAnchor)}
                onClose={() => setPresetMenuAnchor(null)}
                PaperProps={{
                  sx: { ...glassStyles, minWidth: 250 }
                }}
              >
                <MenuItem onClick={() => setSavePresetDialog(true)}>
                  <Save sx={{ mr: 2 }} />
                  Save Current Filters
                </MenuItem>
                <Divider />
                {savedPresets.map((preset) => (
                  <MenuItem key={preset.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box 
                        onClick={() => handleLoadPreset(preset)}
                        sx={{ flex: 1, cursor: 'pointer' }}
                      >
                        <Typography variant="body2">{preset.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {preset.filters.length} filters • {dayjs(preset.createdAt).format('MMM DD')}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset && onDeletePreset(preset.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="text"
              startIcon={<Clear />}
              onClick={handleClearAll}
              color="error"
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Quick Filters */}
        {enableQuickFilters && quickFilters.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Quick Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {quickFilters.map((filter) => (
                <Chip
                  key={filter.id}
                  label={filter.label}
                  variant={filter.active ? 'filled' : 'outlined'}
                  color={filter.active ? 'primary' : 'default'}
                  onClick={() => handleQuickFilterToggle(filter.id, filter.value)}
                  sx={{
                    background: filter.active 
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      : alpha(theme.palette.background.paper, 0.5),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      background: filter.active 
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                        : alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Active Filter Chips */}
        {filters.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {filters.map((filter) => {
              const column = columns.find(c => c.id === filter.column);
              return (
                <Chip
                  key={filter.id}
                  label={filter.label || `${column?.label}: ${filter.value}`}
                  onDelete={() => handleRemoveFilter(filter.id)}
                  deleteIcon={<HighlightOff />}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        color: 'white',
                      }
                    }
                  }}
                />
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Advanced Filter Builder Dialog */}
      <Dialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { ...glassStyles }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Advanced Filter Builder</Typography>
          <IconButton onClick={() => setBuilderOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Filter builder content would go here */}
          <Typography variant="body2" color="text.secondary">
            Advanced filter builder interface coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setBuilderOpen(false)}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Preset Dialog */}
      <Dialog
        open={savePresetDialog}
        onClose={() => setSavePresetDialog(false)}
        PaperProps={{
          sx: { ...glassStyles }
        }}
      >
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Preset Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            margin="dense"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSavePresetDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SmartFilter;