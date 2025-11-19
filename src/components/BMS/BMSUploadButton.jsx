import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../store/customerStore';

const BMSUploadButton = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { refresh: refreshCustomers } = useCustomerStore();

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      // Reset state when opening
      setUploadStatus(null);
      setUploadResult(null);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setUploadStatus('error');
      setUploadResult('Please select a valid XML file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/import/bms', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('success');
        setUploadResult(result);
        
        // Emit event with job ID for dashboard to handle
        window.dispatchEvent(new CustomEvent('bmsImported', {
          detail: { 
            result, 
            fileName: file.name,
            jobId: result.jobId
          }
        }));
        
        // Explicitly refresh customer list to show newly imported customer
        await refreshCustomers();
        
        // Close modal after brief delay
        setTimeout(() => {
          setOpen(false);
        }, 1500);
      } else {
        const error = await response.json();
        setUploadStatus('error');
        setUploadResult(error.message || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadResult('Network error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const floatingButton = (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '20px' : '24px',
        right: isMobile ? '20px' : '24px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Zoom in={true}>
        <Tooltip
          title="Upload BMS/XML File"
          placement="left"
        >
          <Fab
            color="primary"
            onClick={handleToggle}
            sx={{
              position: 'relative',
              pointerEvents: 'auto',
              width: 64,
              height: 64,
              background: open
                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: theme.shadows[8],
              '&:hover': {
                background: open
                  ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                  : 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[12],
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease-in-out',
              '& .MuiTouchRipple-root': {
                borderRadius: '50%',
              },
            }}
          >
            <Badge
              variant="dot"
              color="error"
              invisible={!open}
              sx={{
                '& .MuiBadge-badge': {
                  top: 8,
                  right: 8,
                  minWidth: 12,
                  height: 12,
                  borderRadius: 6,
                },
              }}
            >
              {open ? (
                <CloseIcon sx={{ fontSize: 28, color: 'white' }} />
              ) : (
                <UploadIcon sx={{ fontSize: 28, color: 'white' }} />
              )}
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>
    </div>
  );

  return (
    <>
      {createPortal(floatingButton, document.body)}
      
      {/* BMS Upload Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.default',
          },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Upload BMS/XML File
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            {!uploadStatus && (
              <Box textAlign="center">
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Select a BMS or XML estimate file to import
                </Typography>
                <input
                  accept=".xml"
                  style={{ display: 'none' }}
                  id="bms-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="bms-file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Choose File
                  </Button>
                </label>
              </Box>
            )}

            {uploadStatus === 'uploading' && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Processing BMS file...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {uploadProgress}% complete
                </Typography>
              </Box>
            )}

            {uploadStatus === 'success' && (
              <Box textAlign="center">
                <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                  Upload Successful!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  BMS file processed and customer data imported
                </Typography>
                {uploadResult?.data && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Customer: {uploadResult.data.customer?.firstName} {uploadResult.data.customer?.lastName}
                    </Typography>
                    {uploadResult.jobId && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Job ID: {uploadResult.jobId}
                      </Typography>
                    )}
                  </Box>
                )}
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    navigate('/bms-dashboard');
                    setOpen(false);
                  }}
                  sx={{ mt: 1 }}
                >
                  View All BMS Files
                </Button>
              </Box>
            )}

            {uploadStatus === 'error' && (
              <Box textAlign="center">
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
                  Upload Failed
                </Typography>
                <Alert severity="error" sx={{ textAlign: 'left' }}>
                  {uploadResult}
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            {uploadStatus === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {uploadStatus === 'success' && (
            <Button 
              variant="contained" 
              startIcon={<ViewIcon />}
              onClick={() => {
                navigate('/bms-dashboard');
                setOpen(false);
              }}
            >
              View Files
            </Button>
          )}
          {uploadStatus === 'error' && (
            <Button 
              variant="contained" 
              onClick={() => {
                setUploadStatus(null);
                setUploadResult(null);
                setUploadProgress(0);
              }}
            >
              Try Again
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BMSUploadButton;
