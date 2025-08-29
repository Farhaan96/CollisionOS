import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Divider,
  Chip,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
  Construction as ConstructionIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import VINDecoder from '../components/Common/VINDecoder';
import vinService from '../services/vinService';

/**
 * VIN Decoder Demo Page
 * Demonstrates VIN decoding functionality and integration with vehicle forms
 */
const VINDecoderDemo = () => {
  const [vehicleForm, setVehicleForm] = useState({
    customerId: '',
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    color: '',
    licensePlate: '',
    mileage: '',
    engineSize: '',
    transmission: '',
    bodyStyle: '',
    fuelType: ''
  });
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [batchResults, setBatchResults] = useState(null);
  const [batchVINs, setBatchVINs] = useState('');

  /**
   * Handle vehicle data from VIN decoder
   */
  const handleVehicleDecoded = (vehicleData) => {
    if (!vehicleData || !autoPopulate) return;

    setVehicleForm(prev => ({
      ...prev,
      vin: vehicleData.vin || prev.vin,
      year: vehicleData.year || prev.year,
      make: vehicleData.make || prev.make,
      model: vehicleData.model || prev.model,
      trim: vehicleData.trim || prev.trim,
      engineSize: vehicleData.engine || prev.engineSize,
      transmission: vehicleData.transmission || prev.transmission,
      bodyStyle: vehicleData.body_type || prev.bodyStyle,
      fuelType: vehicleData.fuel_type || prev.fuelType
    }));
  };

  /**
   * Handle form field changes
   */
  const handleFormChange = (field) => (event) => {
    setVehicleForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  /**
   * Handle batch VIN decoding
   */
  const handleBatchDecode = async () => {
    if (!batchVINs.trim()) return;

    const vins = batchVINs
      .split(/[\n,\r\t]/)
      .map(vin => vin.trim())
      .filter(vin => vin.length > 0);

    try {
      const results = await vinService.batchDecodeVINs(vins);
      setBatchResults(results);
    } catch (error) {
      console.error('Batch decode error:', error);
    }
  };

  /**
   * Clear form data
   */
  const handleClearForm = () => {
    setVehicleForm({
      customerId: '',
      vin: '',
      year: '',
      make: '',
      model: '',
      trim: '',
      color: '',
      licensePlate: '',
      mileage: '',
      engineSize: '',
      transmission: '',
      bodyStyle: '',
      fuelType: ''
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          VIN Decoder Demonstration
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Advanced Vehicle Identification Number decoding with NHTSA API integration
        </Typography>
      </Box>

      {/* Features Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-time Validation
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Instant VIN validation with check digit verification
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CarIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                NHTSA Integration
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Official NHTSA database for comprehensive vehicle data
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ConstructionIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Auto-Population
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Automatically populate vehicle forms with decoded data
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* VIN Decoder Component */}
        <Grid item xs={12} lg={6}>
          <VINDecoder
            onVehicleDecoded={handleVehicleDecoded}
            showAdvanced={true}
            initialVin={vehicleForm.vin}
          />
        </Grid>

        {/* Vehicle Form */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader
              title="Vehicle Information Form"
              subheader="Auto-populated from VIN decoder"
              action={
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoPopulate}
                      onChange={(e) => setAutoPopulate(e.target.checked)}
                    />
                  }
                  label="Auto-populate"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="VIN"
                    value={vehicleForm.vin}
                    onChange={handleFormChange('vin')}
                    inputProps={{ 
                      style: { fontFamily: 'monospace' },
                      maxLength: 17 
                    }}
                    helperText="Vehicle Identification Number"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    value={vehicleForm.year}
                    onChange={handleFormChange('year')}
                    type="number"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Make"
                    value={vehicleForm.make}
                    onChange={handleFormChange('make')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={vehicleForm.model}
                    onChange={handleFormChange('model')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Trim"
                    value={vehicleForm.trim}
                    onChange={handleFormChange('trim')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Engine"
                    value={vehicleForm.engineSize}
                    onChange={handleFormChange('engineSize')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Transmission"
                    value={vehicleForm.transmission}
                    onChange={handleFormChange('transmission')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Body Style"
                    value={vehicleForm.bodyStyle}
                    onChange={handleFormChange('bodyStyle')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Fuel Type"
                    value={vehicleForm.fuelType}
                    onChange={handleFormChange('fuelType')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={vehicleForm.color}
                    onChange={handleFormChange('color')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="License Plate"
                    value={vehicleForm.licensePlate}
                    onChange={handleFormChange('licensePlate')}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Mileage"
                    value={vehicleForm.mileage}
                    onChange={handleFormChange('mileage')}
                    type="number"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary">
                  Save Vehicle
                </Button>
                <Button variant="outlined" onClick={handleClearForm}>
                  Clear Form
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Batch VIN Decoder */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardHeader
            title="Batch VIN Decoder"
            subheader="Decode multiple VINs at once (max 10)"
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="VINs to Decode"
                  placeholder="Enter VINs separated by new lines or commas&#10;Example:&#10;1HGCM82633A004352&#10;1G1ZT51816F100000&#10;JM1BK32F981123456"
                  value={batchVINs}
                  onChange={(e) => setBatchVINs(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleBatchDecode}
                  disabled={!batchVINs.trim()}
                  sx={{ mt: 2 }}
                >
                  Decode Batch
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                {batchResults && (
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Batch Results
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                      <Chip
                        label={`Total: ${batchResults.summary.total}`}
                        color="default"
                        size="small"
                      />
                      <Chip
                        label={`Success: ${batchResults.summary.successful}`}
                        color="success"
                        size="small"
                      />
                      <Chip
                        label={`Failed: ${batchResults.summary.failed}`}
                        color="error"
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    {batchResults.results.map((result, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {result.vin}
                        </Typography>
                        {result.success ? (
                          <Typography variant="body2" color="success.main">
                            ✅ {result.vehicle.year} {result.vehicle.make} {result.vehicle.model}
                            {result.source && ` (${result.source})`}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="error.main">
                            ❌ {result.error}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Paper>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* API Information */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="h6" gutterBottom>
            VIN Decoder API Endpoints
          </Typography>
          <Typography component="div" variant="body2">
            <strong>Available endpoints:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><code>POST /api/vehicles/validate-vin</code> - Validate VIN format</li>
              <li><code>POST /api/vehicles/decode-vin</code> - Decode single VIN</li>
              <li><code>POST /api/vehicles/batch-decode</code> - Decode multiple VINs</li>
              <li><code>GET /api/vehicles</code> - List vehicles with filtering</li>
              <li><code>POST /api/vehicles</code> - Create vehicle with auto-decode</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Features:</strong> NHTSA API integration, local fallback, caching, rate limiting (100 requests per 15 minutes)
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default VINDecoderDemo;