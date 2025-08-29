import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as ContentCopyIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { vinService } from '../../services/vinService';

/**
 * VIN Decoder Component
 * Provides VIN validation, decoding, and auto-population functionality
 * for vehicle forms in CollisionOS
 */
const VINDecoder = ({ 
  onVehicleDecoded, 
  onValidationChange,
  initialVin = '',
  showAdvanced = false,
  compact = false 
}) => {
  const [vin, setVin] = useState(initialVin);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState(null);
  const [decodedVehicle, setDecodedVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [useApiOnly, setUseApiOnly] = useState(false);

  /**
   * Handle VIN input change with real-time validation
   */
  const handleVinChange = async (event) => {
    const value = event.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    setVin(value);
    setError(null);
    setDecodedVehicle(null);

    // Clear previous validation
    setValidation(null);

    // Real-time validation for complete VINs
    if (value.length === 17) {
      try {
        const validationResult = await vinService.validateVIN(value);
        setValidation(validationResult);
        
        if (onValidationChange) {
          onValidationChange(validationResult);
        }
      } catch (err) {
        console.error('VIN validation error:', err);
      }
    }
  };

  /**
   * Decode VIN and populate vehicle information
   */
  const handleDecode = async () => {
    if (!vin || vin.length !== 17) {
      setError('Please enter a complete 17-character VIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await vinService.decodeVIN(vin, useApiOnly);
      
      if (result.success) {
        setDecodedVehicle(result);
        
        // Call callback with decoded vehicle data
        if (onVehicleDecoded) {
          onVehicleDecoded(result.vehicle);
        }
      } else {
        setError(result.error || 'VIN decoding failed');
      }
    } catch (err) {
      setError(err.message || 'VIN decoding failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all data and reset form
   */
  const handleClear = () => {
    setVin('');
    setValidation(null);
    setDecodedVehicle(null);
    setError(null);
    
    if (onVehicleDecoded) {
      onVehicleDecoded(null);
    }
    if (onValidationChange) {
      onValidationChange(null);
    }
  };

  /**
   * Copy VIN to clipboard
   */
  const handleCopyVin = async () => {
    if (vin) {
      try {
        await navigator.clipboard.writeText(vin);
      } catch (err) {
        console.error('Failed to copy VIN:', err);
      }
    }
  };

  /**
   * Get validation status icon and color
   */
  const getValidationStatus = () => {
    if (!validation) return null;

    if (validation.valid) {
      return {
        icon: <CheckCircleIcon color="success" />,
        color: 'success',
        message: 'Valid VIN'
      };
    } else {
      return {
        icon: <ErrorIcon color="error" />,
        color: 'error',
        message: validation.errors?.join(', ') || 'Invalid VIN'
      };
    }
  };

  const validationStatus = getValidationStatus();

  if (compact) {
    return (
      <Box sx={{ width: '100%' }}>
        <TextField
          fullWidth
          label="Vehicle VIN"
          value={vin}
          onChange={handleVinChange}
          placeholder="Enter 17-character VIN"
          inputProps={{ maxLength: 17 }}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {validationStatus && (
                  <Tooltip title={validationStatus.message}>
                    {validationStatus.icon}
                  </Tooltip>
                )}
                {vin && (
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <Button
                  size="small"
                  onClick={handleDecode}
                  disabled={!vin || vin.length !== 17 || loading}
                  variant="contained"
                  startIcon={loading ? null : <SearchIcon />}
                >
                  {loading ? 'Decoding...' : 'Decode'}
                </Button>
              </Box>
            )
          }}
        />
        
        {loading && <LinearProgress sx={{ mt: 1 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        
        {decodedVehicle && (
          <Paper elevation={1} sx={{ p: 2, mt: 1, bgcolor: 'success.50' }}>
            <Typography variant="subtitle2" color="success.main">
              Vehicle Decoded ({decodedVehicle.source})
            </Typography>
            <Typography variant="body2">
              {decodedVehicle.vehicle.year} {decodedVehicle.vehicle.make} {decodedVehicle.vehicle.model}
              {decodedVehicle.vehicle.trim && ` ${decodedVehicle.vehicle.trim}`}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader
        title="VIN Decoder"
        subheader="Decode Vehicle Identification Number"
        action={
          showAdvanced && (
            <FormControlLabel
              control={
                <Switch
                  checked={useApiOnly}
                  onChange={(e) => setUseApiOnly(e.target.checked)}
                  size="small"
                />
              }
              label="API Only"
            />
          )
        }
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Vehicle VIN"
            value={vin}
            onChange={handleVinChange}
            placeholder="Enter 17-character VIN (e.g., 1HGCM82633A004352)"
            inputProps={{ 
              maxLength: 17,
              style: { 
                fontFamily: 'monospace', 
                fontSize: '1.1em',
                letterSpacing: '0.1em'
              }
            }}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {validationStatus && (
                    <Tooltip title={validationStatus.message}>
                      {validationStatus.icon}
                    </Tooltip>
                  )}
                  {vin && (
                    <>
                      <Tooltip title="Copy VIN">
                        <IconButton size="small" onClick={handleCopyVin}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clear">
                        <IconButton size="small" onClick={handleClear}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              )
            }}
            helperText={`${vin.length}/17 characters`}
          />
          
          {loading && <LinearProgress sx={{ mt: 1 }} />}
        </Box>

        {/* Validation Status */}
        {validation && (
          <Box sx={{ mb: 2 }}>
            <Alert 
              severity={validation.valid ? 'success' : 'error'} 
              icon={validationStatus?.icon}
            >
              <Typography variant="subtitle2">
                VIN {validation.valid ? 'Valid' : 'Invalid'}
              </Typography>
              {!validation.valid && validation.errors && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Issues: {validation.errors.join(', ')}
                </Typography>
              )}
            </Alert>
            
            {validation.checks && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Length"
                  color={validation.checks.length ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label="Characters"
                  color={validation.checks.characters ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label="Check Digit"
                  color={validation.checks.check_digit ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleDecode}
            disabled={!vin || vin.length !== 17 || loading}
            startIcon={loading ? null : <SearchIcon />}
            size="large"
            fullWidth
          >
            {loading ? 'Decoding VIN...' : 'Decode VIN'}
          </Button>
        </Box>

        {/* Decoded Vehicle Information */}
        {decodedVehicle && (
          <Paper elevation={2} sx={{ p: 3, bgcolor: 'success.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Vehicle Successfully Decoded
              </Typography>
              <Chip
                label={decodedVehicle.source === 'nhtsa_api' ? 'NHTSA API' : decodedVehicle.source}
                color="success"
                variant="outlined"
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Year
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {decodedVehicle.vehicle.year}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Make
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {decodedVehicle.vehicle.make}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Model
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {decodedVehicle.vehicle.model}
                </Typography>
              </Grid>
              
              {decodedVehicle.vehicle.trim && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Trim
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {decodedVehicle.vehicle.trim}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.engine && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Engine
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.engine}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.transmission && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Transmission
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.transmission}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.body_type && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Body Type
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.body_type}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.doors && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Doors
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.doors}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.manufacturer && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.manufacturer}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.plant_country && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Country of Origin
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.plant_country}
                    {decodedVehicle.vehicle.plant_city && `, ${decodedVehicle.vehicle.plant_city}`}
                  </Typography>
                </Grid>
              )}

              {decodedVehicle.vehicle.vehicle_type && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Vehicle Type
                  </Typography>
                  <Typography variant="body1">
                    {decodedVehicle.vehicle.vehicle_type}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Decoded: {new Date(decodedVehicle.vehicle.decoded_at).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Source: {decodedVehicle.vehicle.source}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Help Information */}
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2">
              <strong>VIN Decoder Features:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Real-time VIN validation with check digit verification</li>
              <li>NHTSA API integration for comprehensive vehicle data</li>
              <li>Local decoding fallback for offline operations</li>
              <li>Auto-population of vehicle forms</li>
              <li>Caching for improved performance</li>
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VINDecoder;