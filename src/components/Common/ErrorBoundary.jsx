import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Error Fallback Component
 * Displays when a component crashes
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <ErrorIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h4" gutterBottom>
          Oops! Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We encountered an error while loading this page. Don't worry, your data is safe.
        </Typography>

        <Alert severity="error" sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={resetErrorBoundary}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </Box>

        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="caption" color="text.secondary">
              Stack Trace (Dev Mode):
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 200,
                fontSize: '0.75rem',
              }}
            >
              {error.stack}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

/**
 * Error Boundary Wrapper Component
 * Catches errors in child components and displays fallback UI
 */
export function ErrorBoundary({ children, fallback }) {
  const handleError = (error, errorInfo) => {
    // Log error to console in development
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // In production, you would send this to an error tracking service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Reset any state that might have caused the error
        // This is called when user clicks "Try Again"
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * Page-level Error Boundary
 * Specialized for lazy-loaded pages
 */
export function PageErrorBoundary({ children, pageName }) {
  return (
    <ErrorBoundary
      fallback={(props) => (
        <ErrorFallback
          {...props}
          pageName={pageName}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
