import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Person, Business } from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import { customerService } from '../../services/customerService';
import { getCustomerFullName } from '../../utils/fieldTransformers';

/**
 * CustomerAutocomplete Component
 * Provides autocomplete search for customers with create option
 *
 * @param {Object} props
 * @param {Object|null} props.value - Selected customer object
 * @param {Function} props.onChange - Callback when customer is selected
 * @param {Function} props.onCreateNew - Callback to create new customer
 * @param {string} props.label - Input label
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 */
const CustomerAutocomplete = ({
  value = null,
  onChange,
  onCreateNew,
  label = 'Customer',
  required = false,
  disabled = false,
  error = false,
  helperText = '',
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Load customer suggestions when search changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      loadCustomerSuggestions(debouncedSearch);
    } else {
      setOptions([]);
    }
  }, [debouncedSearch]);

  const loadCustomerSuggestions = async (query) => {
    setLoading(true);
    try {
      const results = await customerService.getCustomerSuggestions(query, 10);
      setOptions(results || []);
    } catch (error) {
      console.error('Error loading customer suggestions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    // Check if "Create new customer" option was selected
    if (newValue && newValue.isCreateNew) {
      if (onCreateNew) {
        onCreateNew(inputValue);
      }
      return;
    }

    onChange(newValue);
  };

  const getOptionLabel = (option) => {
    if (option.isCreateNew) {
      return `Create "${option.label}"`;
    }

    const name = getCustomerFullName(option);
    const phone = option.phone ? ` - ${option.phone}` : '';
    const customerNumber = option.customerNumber ? ` (${option.customerNumber})` : '';

    return `${name}${phone}${customerNumber}`;
  };

  const renderOption = (props, option) => {
    if (option.isCreateNew) {
      return (
        <Box component="li" {...props} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          <Add sx={{ mr: 1 }} />
          Create new customer "{option.label}"
        </Box>
      );
    }

    const typeIcon = option.customerType === 'business' ? <Business /> : <Person />;

    return (
      <Box component="li" {...props}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          {typeIcon}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">
              {getCustomerFullName(option)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {option.phone && (
                <Typography variant="caption" color="text.secondary">
                  {option.phone}
                </Typography>
              )}
              {option.email && (
                <Typography variant="caption" color="text.secondary">
                  {option.email}
                </Typography>
              )}
              {option.companyName && (
                <Typography variant="caption" color="text.secondary">
                  {option.companyName}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            label={option.customerType || 'individual'}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
    );
  };

  const filterOptions = (options, params) => {
    const filtered = options;

    // Add "create new" option if we have input and onCreate handler
    if (params.inputValue !== '' && onCreateNew) {
      filtered.push({
        isCreateNew: true,
        label: params.inputValue,
      });
    }

    return filtered;
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={options}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      filterOptions={filterOptions}
      loading={loading}
      disabled={disabled}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        inputValue.length < 2
          ? 'Type at least 2 characters to search'
          : 'No customers found'
      }
      loadingText="Searching customers..."
    />
  );
};

export default CustomerAutocomplete;
