
// Comprehensive Error Handling Implementation

// 1. Global Error Boundary for React
import React from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" gutterBottom>
              {this.state.error && this.state.error.toString()}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
              sx={{ mt: 1 }}
            >
              Reload Page
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// 2. API Error Handler
export const handleApiError = (error, context = '') => {
  console.error(`API Error in ${context}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data?.message || `Server error (${status})`,
      status,
      type: 'server_error'
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      status: 0,
      type: 'network_error'
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
      type: 'unknown_error'
    };
  }
};

// 3. Form Validation Error Handler
export const handleValidationError = (error) => {
  if (error.details) {
    const errors = {};
    error.details.forEach(detail => {
      errors[detail.path[0]] = detail.message;
    });
    return errors;
  }
  return { general: error.message };
};

// 4. Database Error Handler
export const handleDatabaseError = (error) => {
  console.error('Database Error:', error);
  
  if (error.code === '23505') {
    return { message: 'Duplicate entry - this record already exists' };
  } else if (error.code === '23503') {
    return { message: 'Referenced record not found' };
  } else if (error.code === '23502') {
    return { message: 'Required field is missing' };
  } else {
    return { message: 'Database operation failed' };
  }
};

// 5. User-Friendly Error Messages
export const getUserFriendlyMessage = (error) => {
  const errorMessages = {
    'network_error': 'Please check your internet connection and try again',
    'server_error': 'Our servers are experiencing issues. Please try again later',
    'validation_error': 'Please check your input and try again',
    'authentication_error': 'Please log in again to continue',
    'authorization_error': 'You do not have permission to perform this action',
    'not_found': 'The requested resource was not found',
    'timeout': 'The request timed out. Please try again',
    'unknown_error': 'An unexpected error occurred. Please contact support'
  };
  
  return errorMessages[error.type] || errorMessages['unknown_error'];
};

// 6. Error Recovery Strategies
export const createErrorRecovery = (error, retryFn) => {
  const retryableErrors = ['network_error', 'timeout', 'server_error'];
  
  if (retryableErrors.includes(error.type)) {
    return {
      canRetry: true,
      retryAfter: 1000, // 1 second
      maxRetries: 3,
      retryFn
    };
  }
  
  return { canRetry: false };
};

// 7. Error Logging Service
export const logError = (error, context = {}, severity = 'error') => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    severity,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Send to logging service (e.g., Sentry, LogRocket)
  console.error('Error Log:', errorLog);
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoringService(errorLog);
  }
};
