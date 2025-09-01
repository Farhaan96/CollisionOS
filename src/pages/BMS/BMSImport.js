import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

const BMSImport = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = event => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a BMS file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Get auth token if available
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'multipart/form-data',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post('/import/bms', formData, {
        headers,
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setUploadResult(response.data);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload BMS file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = event => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (
      file &&
      (file.name.toLowerCase().endsWith('.xml') ||
        file.name.toLowerCase().endsWith('.bms'))
    ) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    } else {
      setError('Please drop a valid BMS/XML file');
    }
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' component='h1' gutterBottom color='primary'>
        BMS File Import
      </Typography>

      <Typography variant='body1' color='textSecondary' paragraph>
        Upload BMS (Body Management System) files to automatically create jobs
        and estimates. Supports XML and BMS file formats from major estimating
        systems.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Upload BMS File
          </Typography>

          {/* File Drop Zone */}
          <Paper
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
              mb: 2,
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id='file-input'
              type='file'
              accept='.xml,.bms'
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <CloudUpload
              sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
            />

            {selectedFile ? (
              <Box>
                <Typography variant='h6' color='primary'>
                  {selectedFile.name}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant='h6' gutterBottom>
                  Drop your BMS file here or click to browse
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Supports XML and BMS files up to 10MB
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant='determinate' value={uploadProgress} />
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity='error' sx={{ mb: 2 }} icon={<ErrorIcon />}>
              {error}
            </Alert>
          )}

          {/* Success Result */}
          {uploadResult && (
            <Alert severity='success' sx={{ mb: 2 }} icon={<CheckCircle />}>
              BMS file processed successfully!
              {uploadResult.jobsCreated &&
                ` Created ${uploadResult.jobsCreated} job(s).`}
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            variant='contained'
            size='large'
            startIcon={<CloudUpload />}
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            fullWidth
          >
            {uploading ? 'Uploading...' : 'Upload BMS File'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Supported BMS Formats
          </Typography>

          <List>
            <ListItem>
              <Description sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary='Mitchell Estimating XML'
                secondary='Standard XML export from Mitchell systems'
              />
            </ListItem>
            <Divider />

            <ListItem>
              <Description sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary='CCC ONE XML'
                secondary='CCC Information Services estimate format'
              />
            </ListItem>
            <Divider />

            <ListItem>
              <Description sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary='Audatex XML'
                secondary='Audatex estimating system exports'
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BMSImport;
