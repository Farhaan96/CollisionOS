import React, { Suspense, lazy, ErrorBoundary } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

// Error Boundary for catching performance-related errors
class PerformanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Performance Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>
            <Typography variant='h6'>Component Error</Typography>
            <Typography variant='body2'>
              {this.state.error?.message ||
                'An error occurred while rendering this component'}
            </Typography>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Optimized loading spinner
const LoadingSpinner = React.memo(() => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant='body2' color='text.secondary'>
      Loading dashboard components...
    </Typography>
  </Box>
));

// Performance wrapper component with optimizations
export const PerformanceWrapper = React.memo(
  ({
    children,
    fallback = <LoadingSpinner />,
    enableErrorBoundary = true,
    enableSuspense = true,
  }) => {
    const content = enableSuspense ? (
      <Suspense fallback={fallback}>{children}</Suspense>
    ) : (
      children
    );

    if (enableErrorBoundary) {
      return <PerformanceErrorBoundary>{content}</PerformanceErrorBoundary>;
    }

    return content;
  }
);

// HOC for wrapping components with performance optimizations
export const withPerformanceOptimizations = (Component, options = {}) => {
  const {
    enableMemo = true,
    enableErrorBoundary = true,
    enableSuspense = true,
    loadingComponent = <LoadingSpinner />,
  } = options;

  const WrappedComponent = props => {
    const ComponentToRender = enableMemo ? React.memo(Component) : Component;

    return (
      <PerformanceWrapper
        enableErrorBoundary={enableErrorBoundary}
        enableSuspense={enableSuspense}
        fallback={loadingComponent}
      >
        <ComponentToRender {...props} />
      </PerformanceWrapper>
    );
  };

  WrappedComponent.displayName = `WithPerformance(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Lazy loading utility with preloading
export const createLazyComponent = (importFunction, preload = false) => {
  const LazyComponent = lazy(importFunction);

  if (preload) {
    // Preload the component
    importFunction();
  }

  return LazyComponent;
};

// Virtual list component for large datasets (simplified version)
export const VirtualList = React.memo(
  ({
    items = [],
    renderItem,
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
  }) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    const visibleItems = items.slice(
      Math.max(0, visibleStart - overscan),
      visibleEnd
    );

    const offsetY = Math.max(0, (visibleStart - overscan) * itemHeight);

    return (
      <Box
        sx={{
          height: containerHeight,
          overflow: 'auto',
        }}
        onScroll={e => setScrollTop(e.target.scrollTop)}
      >
        <Box sx={{ height: items.length * itemHeight, position: 'relative' }}>
          <Box sx={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <Box
                key={visibleStart - overscan + index}
                sx={{ height: itemHeight }}
              >
                {renderItem(item, visibleStart - overscan + index)}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }
);

// Performance debugging component (only in development)
export const PerformanceDebugger = React.memo(() => {
  if (process.env.NODE_ENV !== 'development') return null;

  const [showStats, setShowStats] = React.useState(false);
  const [memoryUsage, setMemoryUsage] = React.useState(null);

  React.useEffect(() => {
    const updateMemory = () => {
      if (performance.memory) {
        setMemoryUsage({
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!showStats) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 9999,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          cursor: 'pointer',
          fontSize: '12px',
        }}
        onClick={() => setShowStats(true)}
      >
        🚀 Performance
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        fontSize: '12px',
        minWidth: 200,
      }}
    >
      <Typography
        variant='caption'
        sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}
      >
        Performance Stats
      </Typography>

      {memoryUsage && (
        <Typography variant='caption' sx={{ display: 'block' }}>
          Memory: {memoryUsage.used}MB / {memoryUsage.total}MB
        </Typography>
      )}

      <Box sx={{ mt: 1, textAlign: 'right' }}>
        <Typography
          variant='caption'
          sx={{ cursor: 'pointer', color: 'primary.main' }}
          onClick={() => setShowStats(false)}
        >
          Close
        </Typography>
      </Box>
    </Box>
  );
});

export default PerformanceWrapper;
