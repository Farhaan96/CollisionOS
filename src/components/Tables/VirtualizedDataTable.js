import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  DragIndicator,
  UnfoldMore,
  KeyboardArrowUp,
  KeyboardArrowDown,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  GetApp,
  FilterList,
  ViewColumn,
  PushPin,
} from '@mui/icons-material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

const VirtualizedDataTable = ({
  data = [],
  columns = [],
  loading = false,
  onRowClick,
  onRowSelect,
  onRowEdit,
  onRowDelete,
  onColumnResize,
  onColumnReorder,
  onSort,
  onExport,
  selectedRows = [],
  sortBy,
  sortOrder,
  height = 600,
  rowHeight = 60,
  enableRowSelection = true,
  enableInlineEdit = true,
  enableColumnResizing = true,
  enableColumnReordering = true,
  enableExport = true,
  stickyColumns = [],
  className,
  ...props
}) => {
  const theme = useTheme();
  const parentRef = useRef();
  const [columnWidths, setColumnWidths] = useState({});
  const [columnOrder, setColumnOrder] = useState(columns.map(col => col.id));
  const [editingCell, setEditingCell] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [resizing, setResizing] = useState(null);

  // Initialize column widths
  useEffect(() => {
    const initialWidths = {};
    columns.forEach(col => {
      initialWidths[col.id] = col.width || 150;
    });
    setColumnWidths(initialWidths);
  }, [columns]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  // Handle column sorting
  const handleSort = useCallback(
    columnId => {
      if (onSort) {
        const newOrder =
          sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
        onSort(columnId, newOrder);
      }
    },
    [sortBy, sortOrder, onSort]
  );

  // Handle row selection
  const handleRowSelect = useCallback(
    (rowId, checked) => {
      if (onRowSelect) {
        if (checked) {
          onRowSelect([...selectedRows, rowId]);
        } else {
          onRowSelect(selectedRows.filter(id => id !== rowId));
        }
      }
    },
    [selectedRows, onRowSelect]
  );

  // Handle select all
  const handleSelectAll = useCallback(
    checked => {
      if (onRowSelect) {
        onRowSelect(checked ? data.map(row => row.id) : []);
      }
    },
    [data, onRowSelect]
  );

  // Handle column resizing
  const handleColumnResize = useCallback(
    (columnId, startX, startWidth) => {
      setResizing({ columnId, startX, startWidth });

      const handleMouseMove = e => {
        const newWidth = Math.max(80, startWidth + (e.clientX - startX));
        setColumnWidths(prev => ({ ...prev, [columnId]: newWidth }));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setResizing(null);
        if (onColumnResize) {
          onColumnResize(columnId, columnWidths[columnId]);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [columnWidths, onColumnResize]
  );

  // Handle inline editing
  const handleCellEdit = useCallback(
    (rowIndex, columnId, value) => {
      if (onRowEdit) {
        const row = data[rowIndex];
        onRowEdit({ ...row, [columnId]: value });
      }
      setEditingCell(null);
    },
    [data, onRowEdit]
  );

  // Handle context menu
  const handleContextMenu = useCallback((e, rowIndex) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
      rowIndex,
    });
  }, []);

  // Handle export
  const handleExport = useCallback(
    (format = 'csv') => {
      if (onExport) {
        onExport(
          format,
          selectedRows.length > 0 ? selectedRows : data.map(row => row.id)
        );
      }
    },
    [onExport, selectedRows, data]
  );

  // Render cell content
  const renderCellContent = useCallback(
    (row, column, rowIndex) => {
      const cellKey = `${rowIndex}-${column.id}`;
      const isEditing = editingCell === cellKey;
      const value = row[column.id];

      if (isEditing && enableInlineEdit && column.editable !== false) {
        return (
          <TextField
            value={value || ''}
            onChange={e => handleCellEdit(rowIndex, column.id, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleCellEdit(rowIndex, column.id, e.target.value);
              }
            }}
            size='small'
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: premiumDesignSystem.borderRadius.md,
              },
            }}
          />
        );
      }

      // Handle different cell types
      switch (column.type) {
        case 'status':
          return (
            <Chip
              label={value}
              size='small'
              color={column.statusColors?.[value] || 'default'}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
              }}
            />
          );
        case 'currency':
          return (
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, color: theme.palette.success.main }}
            >
              {column.format
                ? column.format(value)
                : `$${value?.toFixed(2) || '0.00'}`}
            </Typography>
          );
        case 'date':
          return (
            <Typography variant='body2'>
              {column.format
                ? column.format(value)
                : new Date(value).toLocaleDateString()}
            </Typography>
          );
        case 'custom':
          return column.render ? column.render(value, row, rowIndex) : value;
        default:
          return (
            <Typography
              variant='body2'
              onClick={() =>
                enableInlineEdit &&
                column.editable !== false &&
                setEditingCell(cellKey)
              }
              sx={{
                cursor:
                  enableInlineEdit && column.editable !== false
                    ? 'pointer'
                    : 'default',
              }}
            >
              {value}
            </Typography>
          );
      }
    },
    [editingCell, enableInlineEdit, handleCellEdit, theme]
  );

  // Reorder columns based on columnOrder state
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter(Boolean);
  }, [columnOrder, columns]);

  // Calculate total width for horizontal scrolling
  const totalWidth = useMemo(() => {
    return (
      orderedColumns.reduce(
        (sum, col) => sum + (columnWidths[col.id] || 150),
        0
      ) + (enableRowSelection ? 60 : 0)
    );
  }, [orderedColumns, columnWidths, enableRowSelection]);

  // Glassmorphism styles
  const glassStyles = {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
    borderRadius: premiumDesignSystem.borderRadius.xl,
    boxShadow: premiumDesignSystem.shadows.glass.elevated,
  };

  if (loading) {
    return (
      <Paper sx={{ ...glassStyles, p: 3, height }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              variant='rectangular'
              height={rowHeight}
              sx={{
                borderRadius: premiumDesignSystem.borderRadius.lg,
                background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 50%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
              }}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      className={className}
      sx={{ ...glassStyles, height, overflow: 'hidden', position: 'relative' }}
      {...props}
    >
      {/* Table Container with Virtual Scrolling */}
      <Box
        ref={parentRef}
        sx={{
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.background.paper, 0.1),
            borderRadius: premiumDesignSystem.borderRadius.full,
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: premiumDesignSystem.borderRadius.full,
          },
        }}
      >
        <TableContainer
          sx={{
            minWidth: totalWidth,
            background: 'transparent',
          }}
        >
          <Table stickyHeader>
            {/* Table Header */}
            <TableHead>
              <TableRow>
                {enableRowSelection && (
                  <TableCell
                    sx={{
                      width: 60,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                      zIndex: theme.zIndex.sticky + 1,
                    }}
                  >
                    <Checkbox
                      indeterminate={
                        selectedRows.length > 0 &&
                        selectedRows.length < data.length
                      }
                      checked={
                        data.length > 0 && selectedRows.length === data.length
                      }
                      onChange={e => handleSelectAll(e.target.checked)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </TableCell>
                )}
                {orderedColumns.map(column => (
                  <TableCell
                    key={column.id}
                    sx={{
                      width: columnWidths[column.id],
                      minWidth: columnWidths[column.id],
                      maxWidth: columnWidths[column.id],
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                      position: stickyColumns.includes(column.id)
                        ? 'sticky'
                        : 'relative',
                      left: stickyColumns.includes(column.id)
                        ? stickyColumns.indexOf(column.id) * 150
                        : 'auto',
                      zIndex: stickyColumns.includes(column.id)
                        ? theme.zIndex.sticky + 1
                        : theme.zIndex.sticky,
                      userSelect: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {enableColumnReordering && (
                          <IconButton size='small' sx={{ cursor: 'grab' }}>
                            <DragIndicator fontSize='small' />
                          </IconButton>
                        )}
                        <Typography
                          variant='subtitle2'
                          sx={{
                            fontWeight: 600,
                            cursor:
                              column.sortable !== false ? 'pointer' : 'default',
                            color:
                              sortBy === column.id
                                ? theme.palette.primary.main
                                : 'inherit',
                          }}
                          onClick={() =>
                            column.sortable !== false && handleSort(column.id)
                          }
                        >
                          {column.label}
                        </Typography>
                        {column.sortable !== false && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              ml: 0.5,
                            }}
                          >
                            {sortBy === column.id ? (
                              sortOrder === 'asc' ? (
                                <KeyboardArrowUp
                                  fontSize='small'
                                  color='primary'
                                />
                              ) : (
                                <KeyboardArrowDown
                                  fontSize='small'
                                  color='primary'
                                />
                              )
                            ) : (
                              <UnfoldMore fontSize='small' color='disabled' />
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* Column Resize Handle */}
                      {enableColumnResizing && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            cursor: 'col-resize',
                            backgroundColor:
                              resizing?.columnId === column.id
                                ? theme.palette.primary.main
                                : 'transparent',
                            '&:hover': {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.3
                              ),
                            },
                          }}
                          onMouseDown={e =>
                            handleColumnResize(
                              column.id,
                              e.clientX,
                              columnWidths[column.id]
                            )
                          }
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
                <TableCell sx={{ width: 60, background: 'transparent' }} />
              </TableRow>
            </TableHead>

            {/* Virtual Table Body */}
            <TableBody>
              <Box
                sx={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const row = data[virtualRow.index];
                  const isSelected = selectedRows.includes(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={isSelected}
                      onContextMenu={e =>
                        handleContextMenu(e, virtualRow.index)
                      }
                      onClick={() =>
                        onRowClick && onRowClick(row, virtualRow.index)
                      }
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        height: `${virtualRow.size}px`,
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                          '& .row-actions': {
                            opacity: 1,
                          },
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        },
                        transition:
                          premiumDesignSystem.animations.transitions.all,
                      }}
                    >
                      {enableRowSelection && (
                        <TableCell sx={{ width: 60 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={e => {
                              e.stopPropagation();
                              handleRowSelect(row.id, e.target.checked);
                            }}
                            sx={{
                              color: theme.palette.primary.main,
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              },
                            }}
                          />
                        </TableCell>
                      )}
                      {orderedColumns.map(column => (
                        <TableCell
                          key={column.id}
                          sx={{
                            width: columnWidths[column.id],
                            minWidth: columnWidths[column.id],
                            maxWidth: columnWidths[column.id],
                            position: stickyColumns.includes(column.id)
                              ? 'sticky'
                              : 'relative',
                            left: stickyColumns.includes(column.id)
                              ? stickyColumns.indexOf(column.id) * 150
                              : 'auto',
                            zIndex: stickyColumns.includes(column.id) ? 1 : 0,
                            background: stickyColumns.includes(column.id)
                              ? alpha(theme.palette.background.paper, 0.9)
                              : 'transparent',
                          }}
                        >
                          {renderCellContent(row, column, virtualRow.index)}
                        </TableCell>
                      ))}
                      <TableCell sx={{ width: 60 }}>
                        <Box
                          className='row-actions'
                          sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                        >
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation();
                              setContextMenu({
                                mouseX:
                                  e.currentTarget.getBoundingClientRect().left,
                                mouseY:
                                  e.currentTarget.getBoundingClientRect()
                                    .bottom,
                                rowIndex: virtualRow.index,
                              });
                            }}
                          >
                            <MoreVert fontSize='small' />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Box>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference='anchorPosition'
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            ...glassStyles,
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const row = data[contextMenu.rowIndex];
            onRowClick && onRowClick(row, contextMenu.rowIndex);
            setContextMenu(null);
          }}
        >
          <ListItemIcon>
            <Visibility fontSize='small' />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {enableInlineEdit && (
          <MenuItem
            onClick={() => {
              const row = data[contextMenu.rowIndex];
              onRowEdit && onRowEdit(row);
              setContextMenu(null);
            }}
          >
            <ListItemIcon>
              <Edit fontSize='small' />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            const row = data[contextMenu.rowIndex];
            onRowDelete && onRowDelete(row);
            setContextMenu(null);
          }}
        >
          <ListItemIcon>
            <Delete fontSize='small' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        {enableExport && (
          <MenuItem
            onClick={() => {
              handleExport('csv');
              setContextMenu(null);
            }}
          >
            <ListItemIcon>
              <GetApp fontSize='small' />
            </ListItemIcon>
            <ListItemText>Export</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default VirtualizedDataTable;
