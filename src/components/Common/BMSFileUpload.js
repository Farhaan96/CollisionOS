import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  Paper,
  CircularProgress,
  Stack,
  alpha,
  Tooltip,
  Badge,
  Fade,
  Zoom
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Delete,
  Visibility,
  Download,
  Refresh,
  FileUpload,
  Speed,
  DataObject,
  InsertDriveFile,
  Timeline,
  TrendingUp,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  CloudDone
} from '@mui/icons-material';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import bmsService from '../../services/bmsService';

const BMSFileUpload = ({ onUploadComplete, onError, allowedTypes = ['BMS', 'EMS'] }) => {
  const theme = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null);
  const [processingFile, setProcessingFile] = useState(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [currentImportId, setCurrentImportId] = useState(null);
  const [uploadStats, setUploadStats] = useState({
    totalFiles: 0,
    successCount: 0,
    errorCount: 0,
    totalTime: 0
  });
  const [validationResults, setValidationResults] = useState([]);
  const [dataPreviewMode, setDataPreviewMode] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const isBMS = file.type === 'text/xml' || fileName.endsWith('.xml');
      const isEMS = file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.ems');
      const isPDF = file.type === 'application/pdf' || fileName.endsWith('.pdf');
      
      return (allowedTypes.includes('BMS') && (isBMS || isPDF)) || (allowedTypes.includes('EMS') && isEMS);
    });
    
    if (validFiles.length > 0) {
      handleFileUpload(validFiles);
    } else {
      const typeText = allowedTypes.join(' and ');
      setError(`Please upload valid ${typeText} files`);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileUpload = async (files) => {
    const startTime = Date.now();
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setSuccessAnimation(false);

    try {
      if (files.length === 1) {
        // Single file upload
        await handleSingleFileUpload(files[0], startTime);
      } else {
        // Batch file upload
        await handleBatchFileUpload(files, startTime);
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(`Upload failed: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
      setProcessingFile(null);
    }
  };

  const handleSingleFileUpload = async (file, startTime) => {
    try {
      setProcessingFile(file.name);
      
      // Determine file type and API endpoint
      const fileName = file.name.toLowerCase();
      const isBMS = fileName.endsWith('.xml');
      const isEMS = fileName.endsWith('.txt') || fileName.endsWith('.ems');
      
      let endpoint = '/api/import/bms';
      let fileType = 'BMS';
      
      if (isEMS) {
        endpoint = '/api/import/ems';
        fileType = 'EMS';
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(25);
      setProcessingFile(`Processing ${fileType} file: ${file.name}`);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Upload failed');
      }
      
      setCurrentImportId(result.importId);
      
      // Poll for completion if we have an import ID
      if (result.importId) {
        await pollImportStatus(result.importId);
      } else {
        // Handle immediate response
        handleUploadComplete(result, file, fileType, startTime);
      }
      
    } catch (error) {
      console.error('Single file upload error:', error);
      throw error;
    }
  };

  const handleBatchFileUpload = async (files, startTime) => {
    try {
      setProcessingFile(`Processing ${files.length} files...`);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      setUploadProgress(25);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/import/batch`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Batch upload failed');
      }
      
      setCurrentImportId(result.batchId);
      
      // Poll for batch completion
      if (result.batchId) {
        await pollImportStatus(result.batchId, true);
      } else {
        // Handle immediate response
        handleBatchUploadComplete(result, files, startTime);
      }
      
    } catch (error) {
      console.error('Batch file upload error:', error);
      throw error;
    }
  };

  const pollImportStatus = async (importId, isBatch = false) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/import/status/${importId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );
        
        const statusResult = await response.json();
        
        if (!response.ok) {
          throw new Error(statusResult.error || 'Failed to get import status');
        }
        
        const status = statusResult.data;
        
        // Update progress and processing message
        setUploadProgress(status.progress || 0);
        setProcessingFile(status.message || 'Processing...');
        
        if (status.status === 'completed') {
          if (isBatch) {
            handleBatchStatusComplete(status);
          } else {
            handleSingleStatusComplete(status);
          }
          return true; // Stop polling
        } else if (status.status === 'failed') {
          throw new Error(status.error?.message || status.message || 'Import failed');
        }
        
        return false; // Continue polling
        
      } catch (error) {
        console.error('Error checking import status:', error);
        throw error;
      }
    };
    
    const poll = async () => {
      attempts++;
      const completed = await checkStatus();
      
      if (!completed && attempts < maxAttempts) {
        setTimeout(poll, 5000); // Poll every 5 seconds
      } else if (!completed) {
        throw new Error('Import timed out');
      }
    };
    
    // Start polling
    await poll();
  };

  const handleSingleStatusComplete = (status) => {
    const fileResult = {
      id: status.id,
      file: { name: status.fileName },
      result: {
        success: true,
        data: status.result,
        message: status.message
      },
      timestamp: new Date(status.completedAt),
      status: 'success',
      fileType: status.result?.vehicle ? 'BMS/EMS' : 'Unknown'
    };

    setUploadedFiles(prev => [...prev, fileResult]);
    
    // Notify parent component
    if (onUploadComplete) {
      onUploadComplete(status.result, { name: status.fileName });
    }

    // Update stats
    setUploadStats(prev => ({
      ...prev,
      totalFiles: 1,
      successCount: 1,
      totalTime: (new Date() - new Date(status.startTime)) / 1000
    }));

    setUploading(false);
    setUploadProgress(100);
    setProcessingFile(null);
    setSuccessAnimation(true);
    
    setTimeout(() => setSuccessAnimation(false), 3000);
  };

  const handleBatchStatusComplete = (batchStatus) => {
    const results = batchStatus.files.map(fileStatus => ({
      id: `${batchStatus.id}-${fileStatus.fileName}`,
      file: { name: fileStatus.fileName },
      result: {
        success: fileStatus.status === 'success',
        data: fileStatus.status === 'success' ? fileStatus : null,
        message: fileStatus.error || 'Processed successfully'
      },
      timestamp: new Date(batchStatus.completedAt),
      status: fileStatus.status,
      fileType: fileStatus.fileType || 'Unknown'
    }));

    setUploadedFiles(prev => [...prev, ...results]);
    
    // Notify parent component for successful imports
    results.forEach(result => {
      if (result.result.success && onUploadComplete) {
        onUploadComplete(result.result.data, result.file);
      } else if (!result.result.success && onError) {
        onError(result.result.message, result.file);
      }
    });

    // Update stats
    setUploadStats(prev => ({
      ...prev,
      totalFiles: batchStatus.totalFiles,
      successCount: batchStatus.successfulImports,
      errorCount: batchStatus.failedImports,
      totalTime: (new Date(batchStatus.completedAt) - new Date(batchStatus.startTime)) / 1000
    }));

    setUploading(false);
    setUploadProgress(100);
    setProcessingFile(null);
    setSuccessAnimation(true);
    
    setTimeout(() => setSuccessAnimation(false), 3000);
  };

  const handleUploadComplete = (result, file, fileType, startTime) => {
    const fileResult = {
      id: result.importId || `file-${Date.now()}`,
      file,
      result: {
        success: true,
        data: result.data,
        message: result.message
      },
      timestamp: new Date(),
      status: 'success',
      fileType
    };

    setUploadedFiles(prev => [...prev, fileResult]);
    
    if (onUploadComplete) {
      onUploadComplete(result.data, file);
    }

    const endTime = Date.now();
    setUploadStats(prev => ({
      ...prev,
      totalFiles: 1,
      successCount: 1,
      totalTime: (endTime - startTime) / 1000
    }));

    setUploading(false);
    setUploadProgress(100);
    setProcessingFile(null);
    setSuccessAnimation(true);
    
    setTimeout(() => setSuccessAnimation(false), 3000);
  };

  const handleBatchUploadComplete = (result, files, startTime) => {
    const results = result.results.map((fileResult, index) => ({
      id: `batch-${Date.now()}-${index}`,
      file: files[index],
      result: {
        success: fileResult.status === 'success',
        data: fileResult.status === 'success' ? fileResult : null,
        message: fileResult.error || 'Processed successfully'
      },
      timestamp: new Date(),
      status: fileResult.status,
      fileType: fileResult.fileType || 'Unknown'
    }));

    setUploadedFiles(prev => [...prev, ...results]);
    
    results.forEach(result => {
      if (result.result.success && onUploadComplete) {
        onUploadComplete(result.result.data, result.file);
      } else if (!result.result.success && onError) {
        onError(result.result.message, result.file);
      }
    });

    const endTime = Date.now();
    setUploadStats(prev => ({
      ...prev,
      totalFiles: result.summary.totalFiles,
      successCount: result.summary.successful,
      errorCount: result.summary.failed,
      totalTime: (endTime - startTime) / 1000
    }));

    setUploading(false);
    setUploadProgress(100);
    setProcessingFile(null);
    setSuccessAnimation(true);
    
    setTimeout(() => setSuccessAnimation(false), 3000);
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleViewFile = (file) => {
    setExpandedFile(expandedFile === file.id ? null : file.id);
  };

  const handleDownloadBMSData = (file) => {
    const dataStr = JSON.stringify(file.result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.file.name.replace('.xml', '')}_parsed.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Description color="primary" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Enhanced Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          component={motion.div}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            background: isDragOver 
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.15)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
            backdropFilter: 'blur(20px)',
            border: isDragOver 
              ? `2px dashed ${theme.palette.primary.main}` 
              : `2px dashed ${alpha(theme.palette.text.secondary, 0.2)}`,
            borderRadius: '24px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: isDragOver
                ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                : 'transparent',
              transition: 'all 0.3s ease'
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <CardContent sx={{ textAlign: 'center', py: 6, position: 'relative' }}>
            <motion.div
              animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  background: isDragOver 
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                  boxShadow: isDragOver 
                    ? `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`
                    : `0 10px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <CloudUpload 
                  sx={{ 
                    fontSize: 48,
                    color: isDragOver ? 'white' : theme.palette.primary.main
                  }} 
                />
              </Box>
            </motion.div>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              {isDragOver ? 'Drop Files Here' : `Upload ${allowedTypes.join('/')} Files`}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              {isDragOver 
                ? `Release to start processing your ${allowedTypes.join('/')} files`
                : `Drag and drop ${allowedTypes.join('/')} files here, or click to browse`
              }
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
              <Chip 
                icon={<InsertDriveFile />}
                label="XML Format" 
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main
                }}
              />
              <Chip 
                icon={<Speed />}
                label="Fast Processing" 
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  color: theme.palette.success.main
                }}
              />
              <Chip 
                icon={<DataObject />}
                label="Auto Parse" 
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: alpha(theme.palette.info.main, 0.3),
                  color: theme.palette.info.main
                }}
              />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', opacity: 0.8 }}>
              Supports {allowedTypes.includes('BMS') ? 'BMS XML' : ''}{allowedTypes.includes('BMS') && allowedTypes.includes('EMS') ? ' and ' : ''}{allowedTypes.includes('EMS') ? 'EMS pipe-delimited' : ''} files • Multiple files supported
            </Typography>
            
            <input
              id="file-input"
              type="file"
              multiple
              accept={allowedTypes.includes('BMS') && allowedTypes.includes('EMS') 
                ? ".xml,.txt,.ems,text/xml,text/plain" 
                : allowedTypes.includes('BMS') 
                  ? ".xml,text/xml" 
                  : ".txt,.ems,text/plain"}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label={`Upload ${allowedTypes.join('/')} files`}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Paper 
              sx={{ 
                p: 4, 
                mb: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Animation */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.05)} 50%, transparent 100%)`,
                  animation: 'shimmer 2s infinite',
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                  }
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    mr: 3,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Refresh sx={{ color: 'white', fontSize: 28 }} />
                  </motion.div>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Processing {allowedTypes.join('/')} Files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {processingFile || 'Analyzing file structure...'}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {Math.round(uploadProgress)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Complete
                  </Typography>
                </Box>
              </Box>

              {/* Enhanced Progress Bar */}
              <Box sx={{ position: 'relative', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                        animation: 'progress-shimmer 1.5s infinite'
                      }
                    }
                  }}
                />
              </Box>

              {/* Processing Stats */}
              <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                    {uploadStats.successCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Successful
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
                    {uploadStats.errorCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Errors
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                    {uploadStats.totalTime.toFixed(1)}s
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Elapsed
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {successAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <Paper
              sx={{
                p: 3,
                mb: 3,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: '16px'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <CloudDone sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
              </motion.div>
              <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700, mb: 1 }}>
                Upload Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All files have been processed successfully
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <Alert 
              severity="error"
              icon={<ErrorOutline />}
              sx={{ 
                mb: 3,
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})`,
                backdropFilter: 'blur(20px)',
                '& .MuiAlert-icon': {
                  fontSize: '24px'
                },
                '& .MuiAlert-message': {
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
              onClose={() => setError(null)}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Processing Error
              </Typography>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Description sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Processed Files
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {uploadedFiles.length} files uploaded and analyzed
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Badge 
                      badgeContent={uploadedFiles.length} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          fontWeight: 700
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Timeline sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      </Box>
                    </Badge>
                  </Box>
                </Box>

                {/* Files List */}
                <List sx={{ p: 0 }}>
                  {uploadedFiles.map((file, index) => (
                    <React.Fragment key={file.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            px: 3,
                            py: 2,
                            borderLeft: `4px solid ${file.status === 'success' ? theme.palette.success.main : theme.palette.error.main}`,
                            backgroundColor: file.status === 'success' 
                              ? alpha(theme.palette.success.main, 0.05) 
                              : alpha(theme.palette.error.main, 0.05),
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: file.status === 'success' 
                                ? alpha(theme.palette.success.main, 0.1) 
                                : alpha(theme.palette.error.main, 0.1),
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: file.status === 'success'
                                  ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                                  : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 12px ${alpha(file.status === 'success' ? theme.palette.success.main : theme.palette.error.main, 0.3)}`
                              }}
                            >
                              {file.status === 'success' ? (
                                <CheckCircleOutline sx={{ color: 'white', fontSize: 20 }} />
                              ) : (
                                <ErrorOutline sx={{ color: 'white', fontSize: 20 }} />
                              )}
                            </Box>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {file.file.name}
                                </Typography>
                                <Chip 
                                  label={file.status} 
                                  size="small"
                                  color={file.status === 'success' ? 'success' : 'error'}
                                  variant="filled"
                                  sx={{ 
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    fontSize: '11px'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Stack spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  <InfoOutlined sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                  {formatFileSize(file.file.size)} • {formatTimestamp(file.timestamp)}
                                </Typography>
                                {file.result.success && (
                                  <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                                    <CheckCircleOutline sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                    Customer: {file.result.data.customer?.name || 'N/A'} • 
                                    Vehicle: {file.result.data.vehicle?.year || 'N/A'} {file.result.data.vehicle?.make || 'N/A'} {file.result.data.vehicle?.model || 'N/A'} •
                                    Claim: {file.result.data.claimInfo?.claimNumber || 'N/A'}
                                  </Typography>
                                )}
                                {!file.result.success && (
                                  <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
                                    <ErrorOutline sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                    {file.result.error || file.result.message}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          
                          <Stack direction="row" spacing={1}>
                            <Tooltip title={expandedFile === file.id ? 'Collapse details' : 'Expand details'}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewFile(file)}
                                sx={{
                                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.info.main, 0.2),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {expandedFile === file.id ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Tooltip>
                            
                            {file.result.success && (
                              <Tooltip title="Download parsed data">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadBMSData(file)}
                                  sx={{
                                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.success.main, 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            <Tooltip title="Remove file">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(file.id)}
                                sx={{
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItem>
                        
                        {/* Enhanced Expanded File Details */}
                        <Collapse in={expandedFile === file.id}>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Paper 
                              sx={{ 
                                mx: 3,
                                mb: 2,
                                p: 3,
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)}, ${alpha(theme.palette.background.default, 0.6)})`,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                backdropFilter: 'blur(10px)'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                                <DataObject sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Parsed Data Preview
                              </Typography>
                              
                              {file.result.success ? (
                                <Stack spacing={2}>
                                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.info.main, fontWeight: 700, mb: 1 }}>
                                        Document Info
                                      </Typography>
                                      <Typography variant="body2">
                                        {file.result.data.documentInfo?.documentNumber || 'N/A'}
                                      </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.warning.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.warning.main, fontWeight: 700, mb: 1 }}>
                                        Claim Number
                                      </Typography>
                                      <Typography variant="body2">
                                        {file.result.data.claimInfo?.claimNumber || 'N/A'}
                                      </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.success.main, fontWeight: 700, mb: 1 }}>
                                        Vehicle
                                      </Typography>
                                      <Typography variant="body2">
                                        {file.result.data.vehicle?.year || 'N/A'} {file.result.data.vehicle?.make || 'N/A'} {file.result.data.vehicle?.model || 'N/A'}
                                      </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.secondary.main, fontWeight: 700, mb: 1 }}>
                                        VIN
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {file.result.data.vehicle?.vin || 'N/A'}
                                      </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>
                                        Total Lines
                                      </Typography>
                                      <Typography variant="body2">
                                        {file.result.data.damage?.damageLines?.length || 0}
                                      </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                                      <Typography variant="subtitle2" sx={{ color: theme.palette.success.main, fontWeight: 700, mb: 1 }}>
                                        Gross Total
                                      </Typography>
                                      <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                                        ${file.result.data.damage?.totalAmount || 'N/A'}
                                      </Typography>
                                    </Paper>
                                  </Box>
                                </Stack>
                              ) : (
                                <Paper sx={{ p: 2, borderRadius: '12px', backgroundColor: alpha(theme.palette.error.main, 0.05) }}>
                                  <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
                                    <ErrorOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {file.result.error || file.result.message}
                                  </Typography>
                                </Paper>
                              )}
                            </Paper>
                          </motion.div>
                        </Collapse>
                      </motion.div>
                      
                      {index < uploadedFiles.length - 1 && (
                        <Divider sx={{ mx: 3, opacity: 0.3 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default BMSFileUpload;
