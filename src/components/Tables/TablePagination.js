import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

const TablePagination = ({
  count = 0,
  page = 0,
  rowsPerPage = 25,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  showFirstLastButtons = true,
  showRowsPerPage = true,
  showJumpToPage = true,
  showTotalRecords = true,
  showProgressBar = false,
  labelRowsPerPage = 'Rows per page:',
  labelDisplayedRows = ({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
  rowsPerPageOptions = PAGE_SIZE_OPTIONS,
  component = 'div',
  className,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  // Calculate pagination values
  const totalPages = Math.ceil(count / rowsPerPage);
  const from = Math.min(page * rowsPerPage + 1, count);
  const to = Math.min((page + 1) * rowsPerPage, count);
  const canGoBack = page > 0;
  const canGoForward = page < totalPages - 1;

  // Handle page changes
  const handleFirstPage = useCallback(() => {
    if (onPageChange && page !== 0) {
      onPageChange(0);
    }
  }, [onPageChange, page]);

  const handlePreviousPage = useCallback(() => {
    if (onPageChange && canGoBack) {
      onPageChange(page - 1);
    }
  }, [onPageChange, page, canGoBack]);

  const handleNextPage = useCallback(() => {
    if (onPageChange && canGoForward) {
      onPageChange(page + 1);
    }
  }, [onPageChange, page, canGoForward]);

  const handleLastPage = useCallback(() => {
    if (onPageChange && page !== totalPages - 1) {
      onPageChange(totalPages - 1);
    }
  }, [onPageChange, page, totalPages]);

  const handleRowsPerPageChange = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
    // Reset to first page when changing page size
    if (onPageChange) {
      onPageChange(0);
    }
  }, [onRowsPerPageChange, onPageChange]);

  const handleJumpToPage = useCallback(() => {
    const targetPage = parseInt(jumpToPageValue, 10) - 1; // Convert to 0-based index
    if (targetPage >= 0 && targetPage < totalPages && onPageChange) {
      onPageChange(targetPage);
    }
    setJumpToPageValue('');
  }, [jumpToPageValue, totalPages, onPageChange]);

  const handleJumpToPageKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleJumpToPage();
    }
  }, [handleJumpToPage]);

  // Generate page number buttons for desktop view
  const pageButtons = useMemo(() => {
    if (isMobile || totalPages <= 1) return [];

    const buttons = [];
    const maxVisiblePages = isSmall ? 3 : 7;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 0) {
      buttons.push(
        <Button
          key={0}
          size="small"
          onClick={() => onPageChange && onPageChange(0)}
          sx={{
            minWidth: '32px',
            height: '32px',
            background: alpha(theme.palette.background.paper, 0.5),
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          1
        </Button>
      );

      if (startPage > 1) {
        buttons.push(
          <Typography key="start-ellipsis" sx={{ px: 1, alignSelf: 'center' }}>
            ...
          </Typography>
        );
      }
    }

    // Add visible page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          size="small"
          variant={i === page ? 'contained' : 'outlined'}
          onClick={() => onPageChange && onPageChange(i)}
          sx={{
            minWidth: '32px',
            height: '32px',
            ...(i === page ? {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            } : {
              background: alpha(theme.palette.background.paper, 0.5),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.1),
              }
            })
          }}
        >
          {i + 1}
        </Button>
      );
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        buttons.push(
          <Typography key="end-ellipsis" sx={{ px: 1, alignSelf: 'center' }}>
            ...
          </Typography>
        );
      }

      buttons.push(
        <Button
          key={totalPages - 1}
          size="small"
          onClick={() => onPageChange && onPageChange(totalPages - 1)}
          sx={{
            minWidth: '32px',
            height: '32px',
            background: alpha(theme.palette.background.paper, 0.5),
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  }, [page, totalPages, isMobile, isSmall, theme, onPageChange]);

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
      <Paper sx={{ ...glassStyles, p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Skeleton variant="text" width={150} />
          <Skeleton variant="rectangular" width={200} height={32} />
          <Skeleton variant="text" width={100} />
        </Box>
        {showProgressBar && (
          <LinearProgress 
            sx={{ 
              mt: 1,
              background: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }
            }} 
          />
        )}
      </Paper>
    );
  }

  if (count === 0) {
    return (
      <Paper sx={{ ...glassStyles, p: 2, mt: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      component={component}
      className={className} 
      sx={{ ...glassStyles, p: 2, mt: 2 }}
      {...props}
    >
      {showProgressBar && (
        <LinearProgress 
          variant="determinate" 
          value={(page + 1) / totalPages * 100} 
          sx={{ 
            mb: 2,
            height: 4,
            borderRadius: 2,
            background: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 2,
            }
          }} 
        />
      )}

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: 2 
      }}>
        {/* Left section - Rows per page and total records */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'wrap',
          minWidth: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-start',
        }}>
          {showRowsPerPage && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                {labelRowsPerPage}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {showTotalRecords && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`Total: ${count.toLocaleString()}`}
                size="small"
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.dark, 0.8)})`,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {labelDisplayedRows({ from, to, count })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Center section - Page numbers (desktop only) */}
        {!isMobile && totalPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {pageButtons}
          </Box>
        )}

        {/* Right section - Navigation controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          minWidth: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-end',
        }}>
          {/* Jump to page (desktop only) */}
          {!isMobile && showJumpToPage && totalPages > 5 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                Page:
              </Typography>
              <TextField
                size="small"
                value={jumpToPageValue}
                onChange={(e) => setJumpToPageValue(e.target.value)}
                onKeyPress={handleJumpToPageKeyPress}
                onBlur={handleJumpToPage}
                placeholder={`${page + 1}`}
                type="number"
                inputProps={{
                  min: 1,
                  max: totalPages,
                  style: { textAlign: 'center', width: '50px' }
                }}
                sx={{
                  width: '80px',
                  '& .MuiOutlinedInput-root': {
                    background: alpha(theme.palette.background.paper, 0.5),
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                of {totalPages}
              </Typography>
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showFirstLastButtons && (
              <IconButton
                onClick={handleFirstPage}
                disabled={!canGoBack}
                size="small"
                sx={{
                  background: alpha(theme.palette.background.paper, 0.5),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.background.paper, 0.3),
                  }
                }}
              >
                {isMobile ? <KeyboardDoubleArrowLeft /> : <FirstPage />}
              </IconButton>
            )}
            
            <IconButton
              onClick={handlePreviousPage}
              disabled={!canGoBack}
              size="small"
              sx={{
                background: alpha(theme.palette.background.paper, 0.5),
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                },
                '&:disabled': {
                  background: alpha(theme.palette.background.paper, 0.3),
                }
              }}
            >
              {isMobile ? <KeyboardArrowLeft /> : <NavigateBefore />}
            </IconButton>

            {/* Mobile page indicator */}
            {isMobile && (
              <Box sx={{ mx: 2, textAlign: 'center', minWidth: '80px' }}>
                <Typography variant="body2" fontWeight="600">
                  {page + 1} / {totalPages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {labelDisplayedRows({ from, to, count })}
                </Typography>
              </Box>
            )}

            <IconButton
              onClick={handleNextPage}
              disabled={!canGoForward}
              size="small"
              sx={{
                background: alpha(theme.palette.background.paper, 0.5),
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                },
                '&:disabled': {
                  background: alpha(theme.palette.background.paper, 0.3),
                }
              }}
            >
              {isMobile ? <KeyboardArrowRight /> : <NavigateNext />}
            </IconButton>

            {showFirstLastButtons && (
              <IconButton
                onClick={handleLastPage}
                disabled={!canGoForward}
                size="small"
                sx={{
                  background: alpha(theme.palette.background.paper, 0.5),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.background.paper, 0.3),
                  }
                }}
              >
                {isMobile ? <KeyboardDoubleArrowRight /> : <LastPage />}
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default TablePagination;