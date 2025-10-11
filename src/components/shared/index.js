
// Shared UI Component Library
import React from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';

// Reusable Form Field Component
export const FormField = ({ 
  name, 
  label, 
  value, 
  error, 
  onChange, 
  onBlur, 
  type = 'text', 
  required = false,
  ...props 
}) => (
  <TextField
    name={name}
    label={label}
    value={value}
    error={!!error}
    helperText={error}
    onChange={onChange}
    onBlur={onBlur}
    type={type}
    required={required}
    fullWidth
    margin="normal"
    {...props}
  />
);

// Reusable Loading Button
export const LoadingButton = ({ 
  loading, 
  children, 
  disabled, 
  onClick, 
  ...props 
}) => (
  <Button
    disabled={disabled || loading}
    onClick={onClick}
    startIcon={loading ? <CircularProgress size={20} /> : null}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </Button>
);

// Reusable Status Chip
export const StatusChip = ({ status, size = 'small' }) => {
  const getColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'estimate':
        return 'warning';
      case 'urgent':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getColor(status)}
      size={size}
      variant="outlined"
    />
  );
};

// Reusable Data Card
export const DataCard = ({ 
  title, 
  subtitle, 
  content, 
  actions, 
  loading = false,
  error = null 
}) => (
  <Card>
    <CardContent>
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography color="textSecondary" gutterBottom>
              {subtitle}
            </Typography>
          )}
          {content}
        </>
      )}
    </CardContent>
    {actions && <CardActions>{actions}</CardActions>}
  </Card>
);

// Reusable Search Bar
export const SearchBar = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search...", 
  loading = false 
}) => (
  <Box display="flex" gap={1} mb={2}>
    <TextField
      fullWidth
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="outlined"
      InputProps={{
        endAdornment: loading ? <CircularProgress size={20} /> : null
      }}
    />
    <Button 
      variant="contained" 
      onClick={onSearch}
      disabled={loading}
    >
      Search
    </Button>
  </Box>
);
