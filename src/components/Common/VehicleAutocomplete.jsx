import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Add, DirectionsCar } from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import { vehicleService } from '../../services/vehicleService';

/**
 * VehicleAutocomplete Component
 * Provides autocomplete search for vehicles with create option
 *
 * @param {Object} props
 * @param {Object|null} props.value - Selected vehicle object
 * @param {Function} props.onChange - Callback when vehicle is selected
 * @param {Function} props.onCreateNew - Callback to create new vehicle
 * @param {string} props.customerId - Filter vehicles by customer ID
 * @param {string} props.label - Input label
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 */
const VehicleAutocomplete = ({
  value = null,
  onChange,
  onCreateNew,
  customerId = null,
  label = 'Vehicle',
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

  // Load vehicle suggestions when search changes
  useEffect(() => {
    if (customerId) {
      loadVehiclesByCustomer();
    } else if (debouncedSearch && debouncedSearch.length >= 2) {
      loadVehicleSuggestions(debouncedSearch);
    } else {
      setOptions([]);
    }
  }, [debouncedSearch, customerId]);

  const loadVehiclesByCustomer = async () => {
    setLoading(true);
    try {
      const results = await vehicleService.getVehiclesByCustomer(customerId);
      setOptions(results || []);
    } catch (error) {
      console.error('Error loading customer vehicles:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleSuggestions = async (query) => {
    setLoading(true);
    try {
      const results = await vehicleService.getVehicleSuggestions(query, 10);
      setOptions(results || []);
    } catch (error) {
      console.error('Error loading vehicle suggestions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    // Check if "Create new vehicle" option was selected
    if (newValue && newValue.isCreateNew) {
      if (onCreateNew) {
        onCreateNew(inputValue);
      }
      return;
    }

    onChange(newValue);
  };

  const formatVehicleDisplay = (vehicle) => {
    if (!vehicle) return '';

    const parts = [];

    if (vehicle.year) parts.push(vehicle.year);
    if (vehicle.make) parts.push(vehicle.make);
    if (vehicle.model) parts.push(vehicle.model);
    if (vehicle.trim) parts.push(vehicle.trim);

    const display = parts.join(' ');
    const vin = vehicle.vin ? ` - VIN: ...${vehicle.vin.slice(-6)}` : '';
    const plate = vehicle.licensePlate ? ` - ${vehicle.licensePlate}` : '';

    return `${display}${vin}${plate}`;
  };

  const getOptionLabel = (option) => {
    if (option.isCreateNew) {
      return `Create "${option.label}"`;
    }

    return formatVehicleDisplay(option);
  };

  const renderOption = (props, option) => {
    if (option.isCreateNew) {
      return (
        <Box component="li" {...props} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          <Add sx={{ mr: 1 }} />
          Create new vehicle "{option.label}"
        </Box>
      );
    }

    return (
      <Box component="li" {...props}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <DirectionsCar />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">
              {option.year} {option.make} {option.model}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {option.trim && (
                <Typography variant="caption" color="text.secondary">
                  {option.trim}
                </Typography>
              )}
              {option.vin && (
                <Typography variant="caption" color="text.secondary">
                  VIN: {option.vin}
                </Typography>
              )}
              {option.licensePlate && (
                <Typography variant="caption" color="text.secondary">
                  Plate: {option.licensePlate}
                </Typography>
              )}
              {option.color && (
                <Chip
                  label={option.color}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Box>
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
        customerId
          ? 'No vehicles found for this customer'
          : inputValue.length < 2
            ? 'Type at least 2 characters to search'
            : 'No vehicles found'
      }
      loadingText="Searching vehicles..."
    />
  );
};

export default VehicleAutocomplete;
