// Premium Data Table Skeleton for CollisionOS
// Sophisticated table loading placeholders with realistic data shapes and interactive elements

import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Skeleton as MuiSkeleton,
} from '@mui/material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';
import { SkeletonLoader } from './SkeletonLoader';
import { animationUtils, containerAnimations } from '../../utils/animations';

// Animation variants for staggered loading
const tableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      when: 'beforeChildren',
    },
  },
};

const rowVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// Column type configurations for realistic data shapes
const columnTypes = {
  id: { width: '80px', align: 'left' },
  name: { width: '200px', align: 'left' },
  email: { width: '250px', align: 'left' },
  phone: { width: '150px', align: 'left' },
  status: { width: '120px', align: 'center' },
  date: { width: '140px', align: 'left' },
  amount: { width: '120px', align: 'right' },
  progress: { width: '150px', align: 'left' },
  actions: { width: '100px', align: 'center' },
  avatar: { width: '60px', align: 'center' },
  priority: { width: '100px', align: 'center' },
  category: { width: '130px', align: 'left' },
  description: { width: '300px', align: 'left' },
};

// Generate realistic skeleton widths based on column type
const getSkeletonWidth = (columnType, rowIndex) => {
  const baseWidths = {
    id: ['60%', '70%', '50%'],
    name: ['80%', '90%', '70%', '85%'],
    email: ['85%', '75%', '95%', '80%'],
    phone: ['70%', '80%', '75%'],
    status: ['60%', '70%', '65%'],
    date: ['85%', '80%', '90%'],
    amount: ['70%', '80%', '60%', '75%'],
    progress: ['100%', '100%', '100%'],
    actions: ['80%', '80%', '80%'],
    avatar: ['100%', '100%', '100%'],
    priority: ['60%', '70%', '50%'],
    category: ['75%', '80%', '70%', '85%'],
    description: ['90%', '70%', '85%', '95%', '60%'],
  };

  const widths = baseWidths[columnType] || baseWidths.name;
  return widths[rowIndex % widths.length];
};

// Header cell skeleton component
const HeaderCellSkeleton = ({
  columnType,
  sortable = true,
  filterable = false,
  width,
  align = 'left',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent={
        align === 'center'
          ? 'center'
          : align === 'right'
            ? 'flex-end'
            : 'flex-start'
      }
      gap={1}
      width={width}
      px={2}
      py={1.5}
    >
      <SkeletonLoader
        variant='text'
        width='70%'
        height='1.2em'
        animation='pulse'
      />

      {sortable && (
        <motion.div
          animate={{ rotate: [0, 180, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.1)',
            }}
          />
        </motion.div>
      )}

      {filterable && (
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: 2,
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.08)',
          }}
        />
      )}
    </Box>
  );
};

// Data cell skeleton component
const DataCellSkeleton = ({ columnType, rowIndex, width, align = 'left' }) => {
  const renderCellContent = () => {
    switch (columnType) {
      case 'avatar':
        return <SkeletonLoader variant='avatar' size={32} animation='pulse' />;

      case 'status':
        return (
          <Box
            sx={{
              width: 80,
              height: 24,
              borderRadius: premiumDesignSystem.borderRadius.full,
              backgroundColor: 'rgba(0,0,0,0.08)',
            }}
          />
        );

      case 'progress':
        return (
          <Box width='100%' display='flex' alignItems='center' gap={1}>
            <Box
              flex={1}
              height={8}
              borderRadius={4}
              overflow='hidden'
              bgcolor='rgba(0,0,0,0.08)'
              position='relative'
            >
              <motion.div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  borderRadius: 4,
                  background:
                    premiumDesignSystem.colors.primary.gradient.default,
                }}
                animate={{
                  width: ['0%', '60%', '40%', '80%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: rowIndex * 0.2,
                }}
              />
            </Box>
            <SkeletonLoader
              variant='text'
              width='30px'
              height='0.9em'
              animation='pulse'
            />
          </Box>
        );

      case 'actions':
        return (
          <Box display='flex' gap={0.5} justifyContent='center'>
            {[1, 2, 3].map(i => (
              <Box
                key={i}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </Box>
        );

      case 'priority':
        return (
          <Box display='flex' justifyContent='center'>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor:
                  [
                    premiumDesignSystem.colors.semantic.error.main,
                    premiumDesignSystem.colors.semantic.warning.main,
                    premiumDesignSystem.colors.semantic.success.main,
                  ][rowIndex % 3] + '40',
              }}
            />
          </Box>
        );

      default:
        return (
          <SkeletonLoader
            variant='text'
            width={getSkeletonWidth(columnType, rowIndex)}
            height='1em'
            animation='pulse'
          />
        );
    }
  };

  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent={
        align === 'center'
          ? 'center'
          : align === 'right'
            ? 'flex-end'
            : 'flex-start'
      }
      width={width}
      px={2}
      py={1}
      minHeight={48}
    >
      {renderCellContent()}
    </Box>
  );
};

// Toolbar skeleton component
const ToolbarSkeleton = ({
  showSearch = true,
  showFilters = true,
  showActions = true,
  showViewOptions = true,
}) => {
  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      p={2}
      gap={2}
      flexWrap='wrap'
    >
      <Box display='flex' alignItems='center' gap={2} flex={1} minWidth={300}>
        {showSearch && (
          <SkeletonLoader
            variant='text'
            width='250px'
            height='40px'
            animation='pulse'
            sx={{ borderRadius: premiumDesignSystem.borderRadius.lg }}
          />
        )}

        {showFilters && (
          <Box display='flex' gap={1}>
            {[1, 2].map(i => (
              <Box
                key={i}
                sx={{
                  width: 80,
                  height: 32,
                  borderRadius: premiumDesignSystem.borderRadius.md,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box display='flex' alignItems='center' gap={1}>
        {showActions && (
          <Box display='flex' gap={1}>
            {[1, 2].map(i => (
              <Box
                key={i}
                sx={{
                  width: 100,
                  height: 36,
                  borderRadius: premiumDesignSystem.borderRadius.md,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </Box>
        )}

        {showViewOptions && (
          <Box display='flex' gap={0.5}>
            {[1, 2, 3].map(i => (
              <Box
                key={i}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: premiumDesignSystem.borderRadius.sm,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Pagination skeleton component
const PaginationSkeleton = ({ showPageSize = true, showJump = true }) => {
  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      p={2}
      gap={2}
      flexWrap='wrap'
    >
      <Box display='flex' alignItems='center' gap={2}>
        {showPageSize && (
          <Box display='flex' alignItems='center' gap={1}>
            <SkeletonLoader
              variant='text'
              width='100px'
              height='1em'
              animation='pulse'
            />
            <Box
              sx={{
                width: 60,
                height: 32,
                borderRadius: premiumDesignSystem.borderRadius.sm,
                backgroundColor: 'rgba(0,0,0,0.08)',
              }}
            />
          </Box>
        )}

        <SkeletonLoader
          variant='text'
          width='150px'
          height='1em'
          animation='pulse'
        />
      </Box>

      <Box display='flex' alignItems='center' gap={1}>
        {showJump && (
          <Box display='flex' alignItems='center' gap={1}>
            <SkeletonLoader
              variant='text'
              width='60px'
              height='1em'
              animation='pulse'
            />
            <Box
              sx={{
                width: 60,
                height: 32,
                borderRadius: premiumDesignSystem.borderRadius.sm,
                backgroundColor: 'rgba(0,0,0,0.08)',
              }}
            />
          </Box>
        )}

        <Box display='flex' gap={0.5}>
          {[1, 2, 3, 4, 5].map(i => (
            <Box
              key={i}
              sx={{
                width: 32,
                height: 32,
                borderRadius: premiumDesignSystem.borderRadius.sm,
                backgroundColor:
                  i === 2
                    ? premiumDesignSystem.colors.primary[500] + '20'
                    : 'rgba(0,0,0,0.08)',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// Main DataTableSkeleton component
const DataTableSkeleton = forwardRef(
  (
    {
      rows = 8,
      columns = [
        { type: 'avatar', sortable: false },
        { type: 'name', sortable: true },
        { type: 'email', sortable: true },
        { type: 'status', sortable: true, filterable: true },
        { type: 'date', sortable: true },
        { type: 'actions', sortable: false },
      ],
      hasHeader = true,
      hasToolbar = true,
      hasPagination = true,
      showSorting = true,
      showFilters = true,
      variant = 'default', // 'default', 'compact', 'comfortable'
      elevation = 1,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    // Adjust columns for mobile
    const visibleColumns = useMemo(() => {
      if (isMobile) {
        return columns.slice(0, 2); // Show only first 2 columns on mobile
      }
      if (isTablet) {
        return columns.slice(0, 4); // Show only first 4 columns on tablet
      }
      return columns;
    }, [columns, isMobile, isTablet]);

    const rowHeight =
      variant === 'compact' ? 40 : variant === 'comfortable' ? 64 : 48;
    const headerHeight = variant === 'compact' ? 36 : 48;

    return (
      <motion.div
        ref={ref}
        variants={tableContainerVariants}
        initial='hidden'
        animate='visible'
        style={{ ...animationUtils.optimizedTransform }}
        {...props}
      >
        <Paper
          elevation={elevation}
          sx={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: premiumDesignSystem.borderRadius.xl,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Toolbar */}
          {hasToolbar && (
            <motion.div variants={rowVariants}>
              <ToolbarSkeleton
                showSearch={true}
                showFilters={showFilters}
                showActions={true}
                showViewOptions={true}
              />
            </motion.div>
          )}

          {/* Table container */}
          <Box overflow='auto'>
            <Box minWidth={isMobile ? 300 : 600}>
              {/* Header */}
              {hasHeader && (
                <motion.div variants={rowVariants}>
                  <Box
                    display='flex'
                    bgcolor={theme.palette.action.hover}
                    borderBottom={`1px solid ${theme.palette.divider}`}
                    minHeight={headerHeight}
                    sx={{ position: 'sticky', top: 0, zIndex: 1 }}
                  >
                    {visibleColumns.map((column, index) => (
                      <HeaderCellSkeleton
                        key={index}
                        columnType={column.type}
                        sortable={showSorting && column.sortable !== false}
                        filterable={showFilters && column.filterable}
                        width={columnTypes[column.type]?.width || '150px'}
                        align={columnTypes[column.type]?.align || 'left'}
                      />
                    ))}
                  </Box>
                </motion.div>
              )}

              {/* Data rows */}
              {Array.from({ length: rows }, (_, rowIndex) => (
                <motion.div key={rowIndex} variants={rowVariants}>
                  <Box
                    display='flex'
                    borderBottom={
                      rowIndex < rows - 1
                        ? `1px solid ${theme.palette.divider}`
                        : 'none'
                    }
                    minHeight={rowHeight}
                    sx={{
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {visibleColumns.map((column, colIndex) => (
                      <DataCellSkeleton
                        key={colIndex}
                        columnType={column.type}
                        rowIndex={rowIndex}
                        width={columnTypes[column.type]?.width || '150px'}
                        align={columnTypes[column.type]?.align || 'left'}
                      />
                    ))}
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Pagination */}
          {hasPagination && (
            <motion.div variants={rowVariants}>
              <Box borderTop={`1px solid ${theme.palette.divider}`}>
                <PaginationSkeleton
                  showPageSize={!isMobile}
                  showJump={!isMobile}
                />
              </Box>
            </motion.div>
          )}
        </Paper>
      </motion.div>
    );
  }
);

DataTableSkeleton.displayName = 'DataTableSkeleton';

export default DataTableSkeleton;

export {
  HeaderCellSkeleton,
  DataCellSkeleton,
  ToolbarSkeleton,
  PaginationSkeleton,
};
