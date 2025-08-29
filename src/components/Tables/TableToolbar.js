import React, { useState, useCallback } from 'react';
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
  Checkbox,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Search,
  ViewColumn,
  Density,
  GetApp,
  MoreVert,
  TableView,
  ViewList,
  ViewModule,
  Clear,
  FilterList,
  Sort,
  Refresh,
  Settings,
  Download,
  Print,
  Share,
  Edit,
  Delete,
  Add,
  PlaylistAdd,
  CheckBox,
  CheckBoxOutlineBlank,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact', rowHeight: 40 },
  { value: 'standard', label: 'Standard', rowHeight: 52 },
  { value: 'comfortable', label: 'Comfortable', rowHeight: 64 },
];

const VIEW_MODES = [
  { value: 'table', label: 'Table', icon: <TableView /> },
  { value: 'list', label: 'List', icon: <ViewList /> },
  { value: 'card', label: 'Card', icon: <ViewModule /> },
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
  { value: 'pdf', label: 'PDF', description: 'Portable document format' },
  { value: 'json', label: 'JSON', description: 'JavaScript object notation' },
];

const TableToolbar = ({
  title = 'Data Table',
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  density = 'standard',
  onDensityChange,
  viewMode = 'table',
  onViewModeChange,
  columns = [],
  visibleColumns = [],
  onVisibleColumnsChange,
  selectedRows = [],
  onBulkAction,
  onExport,
  onRefresh,
  showSearch = true,
  showColumnToggle = true,
  showDensitySelector = true,
  showViewModeSelector = true,
  showExportButton = true,
  showRefreshButton = true,
  bulkActions = [],
  customActions = [],
  loading = false,
  className,
  ...props
}) => {
  const theme = useTheme();
  const [searchText, setSearchText] = useState(searchValue);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [densityMenuAnchor, setDensityMenuAnchor] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

  // Handle search with debouncing
  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    // Implement debouncing
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [onSearchChange]);

  // Handle column visibility toggle
  const handleColumnToggle = useCallback((columnId) => {
    if (onVisibleColumnsChange) {
      const newVisibleColumns = visibleColumns.includes(columnId)
        ? visibleColumns.filter(id => id !== columnId)
        : [...visibleColumns, columnId];
      onVisibleColumnsChange(newVisibleColumns);
    }
  }, [visibleColumns, onVisibleColumnsChange]);

  // Handle select/deselect all columns
  const handleToggleAllColumns = useCallback((selectAll) => {
    if (onVisibleColumnsChange) {
      const newVisibleColumns = selectAll ? columns.map(col => col.id) : [];
      onVisibleColumnsChange(newVisibleColumns);
    }
  }, [columns, onVisibleColumnsChange]);

  // Handle export
  const handleExport = useCallback((format) => {
    if (onExport) {
      onExport(format, selectedRows.length > 0 ? selectedRows : 'all');
    }
    setExportMenuAnchor(null);
  }, [onExport, selectedRows]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action) => {
    if (onBulkAction) {
      onBulkAction(action, selectedRows);
    }
    setBulkMenuAnchor(null);
  }, [onBulkAction, selectedRows]);

  // Glassmorphism styles
  const glassStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
    borderRadius: premiumDesignSystem.borderRadius.xl,
    boxShadow: premiumDesignSystem.shadows.glass.elevated,
  };

  const currentDensity = DENSITY_OPTIONS.find(d => d.value === density);
  const currentViewMode = VIEW_MODES.find(v => v.value === viewMode);
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <Paper 
      className={className} 
      sx={{ ...glassStyles, p: 2, mb: 2 }}
      {...props}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {/* Left Section - Title and Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 'fit-content' }}>
            {title}
          </Typography>
          
          {showSearch && (
            <TextField
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchText && (
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange('')}
                  >
                    <Clear />
                  </IconButton>
                ),
              }}
              sx={{
                maxWidth: 400,
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  background: alpha(theme.palette.background.paper, 0.5),
                  backdropFilter: 'blur(10px)',
                  borderRadius: premiumDesignSystem.borderRadius.lg,
                }
              }}
            />
          )}
        </Box>

        {/* Center Section - Bulk Actions (when rows are selected) */}
        {hasSelectedRows && bulkActions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${selectedRows.length} selected`}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
                color: 'white',
              }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
              sx={{
                background: alpha(theme.palette.primary.main, 0.1),
                borderColor: alpha(theme.palette.primary.main, 0.3),
              }}
            >
              Bulk Actions
            </Button>
            <Menu
              anchorEl={bulkMenuAnchor}
              open={Boolean(bulkMenuAnchor)}
              onClose={() => setBulkMenuAnchor(null)}
              PaperProps={{ sx: { ...glassStyles, minWidth: 200 } }}
            >
              {bulkActions.map((action) => (
                <MenuItem key={action.id} onClick={() => handleBulkAction(action)}>
                  <ListItemIcon>{action.icon}</ListItemIcon>
                  <ListItemText primary={action.label} secondary={action.description} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}

        {/* Right Section - View Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* View Mode Selector */}
          {showViewModeSelector && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode && onViewModeChange) {
                  onViewModeChange(newMode);
                }
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: 'white',
                  },
                }
              }}
            >
              {VIEW_MODES.map((mode) => (
                <ToggleButton key={mode.value} value={mode.value}>
                  <Tooltip title={mode.label}>
                    {mode.icon}
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          {/* Column Visibility Toggle */}
          {showColumnToggle && (
            <>
              <Tooltip title="Column Visibility">
                <Badge
                  badgeContent={visibleColumns.length}
                  color="primary"
                  max={99}
                >
                  <IconButton
                    onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <ViewColumn />
                  </IconButton>
                </Badge>
              </Tooltip>
              <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={() => setColumnMenuAnchor(null)}
                PaperProps={{ sx: { ...glassStyles, minWidth: 250 } }}
              >
                <MenuItem onClick={() => handleToggleAllColumns(visibleColumns.length !== columns.length)}>
                  <Checkbox
                    checked={visibleColumns.length === columns.length}
                    indeterminate={visibleColumns.length > 0 && visibleColumns.length < columns.length}
                  />
                  <ListItemText primary="Select All" />
                </MenuItem>
                <Divider />
                {columns.map((column) => (
                  <MenuItem key={column.id} onClick={() => handleColumnToggle(column.id)}>
                    <Checkbox checked={visibleColumns.includes(column.id)} />
                    <ListItemText primary={column.label} />
                    {column.required && (
                      <Chip size="small" label="Required" color="primary" />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Density Selector */}
          {showDensitySelector && (
            <>
              <Tooltip title={`Density: ${currentDensity?.label}`}>
                <IconButton
                  onClick={(e) => setDensityMenuAnchor(e.currentTarget)}
                  sx={{
                    background: alpha(theme.palette.secondary.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.secondary.main, 0.2),
                    }
                  }}
                >
                  <Density />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={densityMenuAnchor}
                open={Boolean(densityMenuAnchor)}
                onClose={() => setDensityMenuAnchor(null)}
                PaperProps={{ sx: { ...glassStyles, minWidth: 200 } }}
              >
                {DENSITY_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    selected={density === option.value}
                    onClick={() => {
                      if (onDensityChange) {
                        onDensityChange(option.value);
                      }
                      setDensityMenuAnchor(null);
                    }}
                  >
                    <ListItemText 
                      primary={option.label} 
                      secondary={`Row height: ${option.rowHeight}px`} 
                    />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Export Button */}
          {showExportButton && (
            <>
              <Tooltip title="Export Data">
                <IconButton
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                  disabled={loading}
                  sx={{
                    background: alpha(theme.palette.success.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.success.main, 0.2),
                    }
                  }}
                >
                  <GetApp />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={() => setExportMenuAnchor(null)}
                PaperProps={{ sx: { ...glassStyles, minWidth: 250 } }}
              >
                <MenuItem disabled>
                  <ListItemText 
                    primary="Export Format" 
                    secondary={hasSelectedRows ? `${selectedRows.length} rows selected` : 'All data'} 
                  />
                </MenuItem>
                <Divider />
                {EXPORT_FORMATS.map((format) => (
                  <MenuItem key={format.value} onClick={() => handleExport(format.value)}>
                    <ListItemIcon>
                      <Download />
                    </ListItemIcon>
                    <ListItemText primary={format.label} secondary={format.description} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Refresh Button */}
          {showRefreshButton && (
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={onRefresh}
                disabled={loading}
                sx={{
                  background: alpha(theme.palette.info.main, 0.1),
                  '&:hover': {
                    background: alpha(theme.palette.info.main, 0.2),
                  },
                  ...(loading && {
                    animation: 'spin 1s linear infinite',
                  })
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}

          {/* Custom Actions Speed Dial */}
          {customActions.length > 0 && (
            <Box sx={{ position: 'relative' }}>
              <SpeedDial
                ariaLabel="Custom Actions"
                icon={<SpeedDialIcon />}
                direction="down"
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  '& .MuiSpeedDial-fab': {
                    width: 40,
                    height: 40,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    }
                  }
                }}
              >
                {customActions.map((action) => (
                  <SpeedDialAction
                    key={action.id}
                    icon={action.icon}
                    tooltipTitle={action.label}
                    onClick={() => action.onClick && action.onClick()}
                    FabProps={{
                      sx: {
                        background: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.1),
                        }
                      }
                    }}
                  />
                ))}
              </SpeedDial>
            </Box>
          )}

          {/* More Options */}
          <Tooltip title="More Options">
            <IconButton
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{
                background: alpha(theme.palette.text.primary, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.text.primary, 0.2),
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={() => setMoreMenuAnchor(null)}
            PaperProps={{ sx: { ...glassStyles, minWidth: 200 } }}
          >
            <MenuItem onClick={() => setMoreMenuAnchor(null)}>
              <ListItemIcon><Print /></ListItemIcon>
              <ListItemText primary="Print Table" />
            </MenuItem>
            <MenuItem onClick={() => setMoreMenuAnchor(null)}>
              <ListItemIcon><Share /></ListItemIcon>
              <ListItemText primary="Share" />
            </MenuItem>
            <MenuItem onClick={() => setMoreMenuAnchor(null)}>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText primary="Table Settings" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Additional styles for animations */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </Paper>
  );
};

export default TableToolbar;