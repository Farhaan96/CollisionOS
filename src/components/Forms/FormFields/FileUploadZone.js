import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  CircularProgress,
  Grid,
  Paper,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  GetApp,
  Image,
  PictureAsPdf,
  Description,
  VideoLibrary,
  AudioFile,
  InsertDriveFile,
  Warning,
  Error as ErrorIcon,
  Check,
  Close,
  MoreVert,
  Refresh,
  Pause,
  PlayArrow,
  Stop,
  FolderOpen,
  CameraAlt,
  Scanner,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumDesignSystem } from '../../../theme/premiumDesignSystem';

// File type configuration
const FILE_TYPES = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    icon: Image,
    color: 'success',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  pdf: {
    extensions: ['pdf'],
    icon: PictureAsPdf,
    color: 'error',
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  document: {
    extensions: ['doc', 'docx', 'txt', 'rtf', 'odt'],
    icon: Description,
    color: 'primary',
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  video: {
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    icon: VideoLibrary,
    color: 'secondary',
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  audio: {
    extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
    icon: AudioFile,
    color: 'warning',
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  other: {
    extensions: [],
    icon: InsertDriveFile,
    color: 'default',
    maxSize: 25 * 1024 * 1024, // 25MB
  },
};

// Get file type based on extension
const getFileType = filename => {
  const extension = filename.split('.').pop()?.toLowerCase();
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(extension)) {
      return { type, ...config };
    }
  }
  return { type: 'other', ...FILE_TYPES.other };
};

// Format file size
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Chunked upload implementation
const uploadFileInChunks = async (
  file,
  onProgress,
  uploadUrl,
  chunkSize = 1024 * 1024
) => {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedChunks = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', i);
    formData.append('totalChunks', totalChunks);
    formData.append('filename', file.name);
    formData.append('fileId', file.id || Date.now().toString());

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      uploadedChunks++;
      const progress = (uploadedChunks / totalChunks) * 100;
      onProgress(progress);
    } catch (error) {
      throw new Error(`Chunk ${i} upload failed: ${error.message}`);
    }
  }

  return { success: true, uploadedChunks };
};

// File preview component
const FilePreview = ({ file, onRemove, onPreview }) => {
  const fileType = getFileType(file.name);
  const IconComponent = fileType.icon;

  const isImage = fileType.type === 'image';
  const previewUrl = useMemo(() => {
    if (isImage && file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file.preview || null;
  }, [file, isImage]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          position: 'relative',
          height: 120,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: premiumDesignSystem.shadows.glass.elevated,
          },
        }}
        onClick={() => onPreview(file)}
      >
        {isImage && previewUrl ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${previewUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 1,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
                borderRadius: 1,
              },
            }}
          />
        ) : (
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <Avatar sx={{ bgcolor: `${fileType.color}.main`, mb: 1 }}>
              <IconComponent />
            </Avatar>
          </CardContent>
        )}

        {/* File info overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            color: 'white',
            borderRadius: '0 0 4px 4px',
          }}
        >
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {file.name}
          </Typography>
          <Typography variant='caption' sx={{ opacity: 0.8 }}>
            {formatFileSize(file.size)}
          </Typography>
        </Box>

        {/* Remove button */}
        <IconButton
          size='small'
          onClick={e => {
            e.stopPropagation();
            onRemove(file);
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '&:hover': {
              bgcolor: 'error.main',
            },
          }}
        >
          <Close fontSize='small' />
        </IconButton>

        {/* Upload status */}
        {file.uploadStatus && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              bgcolor: 'rgba(0,0,0,0.6)',
              borderRadius: 1,
              p: 0.5,
            }}
          >
            {file.uploadStatus === 'uploading' && (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            )}
            {file.uploadStatus === 'success' && (
              <Check sx={{ color: 'success.main', fontSize: 16 }} />
            )}
            {file.uploadStatus === 'error' && (
              <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
            )}
          </Box>
        )}

        {/* Upload progress */}
        {file.uploadProgress > 0 && file.uploadProgress < 100 && (
          <LinearProgress
            variant='determinate'
            value={file.uploadProgress}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
        )}
      </Card>
    </motion.div>
  );
};

const FileUploadZone = ({
  multiple = true,
  maxFiles = 10,
  maxFileSize = 25 * 1024 * 1024, // 25MB
  acceptedFileTypes = null, // null means all types
  uploadUrl = null,
  enableChunkedUpload = true,
  chunkSize = 1024 * 1024, // 1MB
  enableImagePreview = true,
  enableDragDrop = true,
  autoUpload = false,
  value = [],
  onChange = () => {},
  onUploadComplete = () => {},
  onUploadError = () => {},
  disabled = false,
  error = null,
  helperText = null,
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
  showFileList = true,
  enableFileValidation = true,
  customValidation = null,
  sx = {},
  ...props
}) => {
  // State management
  const [files, setFiles] = useState(value || []);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Sync with external value
  useEffect(() => {
    if (value !== files) {
      setFiles(value || []);
    }
  }, [value]);

  // File validation
  const validateFile = useCallback(
    file => {
      const errors = [];
      const fileType = getFileType(file.name);

      // Check file size
      const maxSize =
        acceptedFileTypes?.[fileType.type]?.maxSize || maxFileSize;
      if (file.size > maxSize) {
        errors.push(`File size exceeds ${formatFileSize(maxSize)}`);
      }

      // Check file type
      if (acceptedFileTypes && !acceptedFileTypes.includes(fileType.type)) {
        errors.push(`File type ${fileType.type} is not allowed`);
      }

      // Custom validation
      if (customValidation) {
        const customErrors = customValidation(file);
        if (customErrors.length > 0) {
          errors.push(...customErrors);
        }
      }

      return errors;
    },
    [acceptedFileTypes, maxFileSize, customValidation]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    newFiles => {
      if (disabled) return;

      const fileArray = Array.from(newFiles);
      const validFiles = [];
      const errors = [];

      fileArray.forEach((file, index) => {
        // Check max files limit
        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        // Validate file
        if (enableFileValidation) {
          const fileErrors = validateFile(file);
          if (fileErrors.length > 0) {
            errors.push(`${file.name}: ${fileErrors.join(', ')}`);
            return;
          }
        }

        // Check for duplicates
        const isDuplicate = files.some(
          existingFile =>
            existingFile.name === file.name && existingFile.size === file.size
        );

        if (isDuplicate) {
          errors.push(`${file.name}: File already selected`);
          return;
        }

        // Add file with metadata
        const fileWithMetadata = {
          id: Date.now() + index,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          uploadStatus: 'pending',
          uploadProgress: 0,
          fileType: getFileType(file.name),
        };

        validFiles.push(fileWithMetadata);
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }

      if (validFiles.length > 0) {
        const newFileList = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(newFileList);
        onChange(newFileList);

        // Auto upload if enabled
        if (autoUpload && uploadUrl) {
          uploadFiles(validFiles);
        }
      }
    },
    [
      files,
      multiple,
      maxFiles,
      disabled,
      enableFileValidation,
      validateFile,
      onChange,
      autoUpload,
      uploadUrl,
    ]
  );

  // Upload files
  const uploadFiles = useCallback(
    async (filesToUpload = files) => {
      if (!uploadUrl || uploading) return;

      setUploading(true);

      for (const fileItem of filesToUpload) {
        if (fileItem.uploadStatus !== 'pending') continue;

        try {
          // Update status
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id
                ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
                : f
            )
          );

          // Progress callback
          const onProgress = progress => {
            setFiles(prev =>
              prev.map(f =>
                f.id === fileItem.id ? { ...f, uploadProgress: progress } : f
              )
            );
          };

          let result;
          if (enableChunkedUpload && fileItem.size > chunkSize) {
            result = await uploadFileInChunks(
              fileItem.file,
              onProgress,
              uploadUrl,
              chunkSize
            );
          } else {
            // Simple upload
            const formData = new FormData();
            formData.append('file', fileItem.file);

            const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            result = await response.json();
            onProgress(100);
          }

          // Update success status
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id
                ? {
                    ...f,
                    uploadStatus: 'success',
                    uploadProgress: 100,
                    uploadResult: result,
                  }
                : f
            )
          );

          onUploadComplete(fileItem, result);
        } catch (error) {
          console.error('Upload failed:', error);

          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id
                ? { ...f, uploadStatus: 'error', uploadError: error.message }
                : f
            )
          );

          onUploadError(fileItem, error);
        }
      }

      setUploading(false);
    },
    [
      files,
      uploadUrl,
      uploading,
      enableChunkedUpload,
      chunkSize,
      onUploadComplete,
      onUploadError,
    ]
  );

  // Remove file
  const removeFile = useCallback(
    fileToRemove => {
      const newFiles = files.filter(f => f.id !== fileToRemove.id);
      setFiles(newFiles);
      onChange(newFiles);
    },
    [files, onChange]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (enableDragDrop && !disabled) {
        setIsDragOver(true);
      }
    },
    [enableDragDrop, disabled]
  );

  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragOver to false if we're leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (
      rect &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (enableDragDrop && !disabled) {
        const droppedFiles = e.dataTransfer.files;
        handleFileSelect(droppedFiles);
      }
    },
    [enableDragDrop, disabled, handleFileSelect]
  );

  // File browser
  const openFileBrowser = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Preview file function
  const handlePreviewFile = useCallback(file => {
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  return (
    <Box sx={{ ...sx }}>
      {/* Upload Zone */}
      <Paper
        ref={dropZoneRef}
        elevation={isDragOver ? 8 : 2}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          background: isDragOver
            ? `linear-gradient(135deg, ${premiumDesignSystem.colors.primary[50]}, ${premiumDesignSystem.colors.primary[100]})`
            : disabled
              ? 'rgba(0,0,0,0.05)'
              : `linear-gradient(135deg, ${premiumDesignSystem.colors.glass.white[10]}, ${premiumDesignSystem.colors.glass.white[5]})`,
          border: '2px dashed',
          borderColor: error
            ? 'error.main'
            : isDragOver
              ? 'primary.main'
              : disabled
                ? 'action.disabled'
                : 'divider',
          borderRadius: 3,
          '&:hover': !disabled && {
            borderColor: 'primary.main',
            backgroundColor: premiumDesignSystem.colors.primary[50],
            transform: 'translateY(-2px)',
            boxShadow: premiumDesignSystem.shadows.colored.primary,
          },
        }}
        onClick={openFileBrowser}
      >
        <input
          ref={fileInputRef}
          type='file'
          multiple={multiple}
          accept={acceptedFileTypes?.join(',') || '*'}
          onChange={e => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />

        <motion.div
          animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <CloudUpload
            sx={{
              fontSize: 48,
              color: error
                ? 'error.main'
                : isDragOver
                  ? 'primary.main'
                  : 'text.secondary',
              mb: 2,
            }}
          />

          <Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {description}
          </Typography>

          {/* File info */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {acceptedFileTypes && (
              <Chip
                size='small'
                label={`Types: ${acceptedFileTypes.join(', ')}`}
              />
            )}
            <Chip
              size='small'
              label={`Max size: ${formatFileSize(maxFileSize)}`}
            />
            <Chip size='small' label={`Max files: ${maxFiles}`} />
          </Box>
        </motion.div>

        {isDragOver && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(25, 118, 210, 0.1)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant='h5'
              sx={{ color: 'primary.main', fontWeight: 600 }}
            >
              Drop files here!
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity='error' sx={{ mt: 2 }}>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Upload Errors:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((error, index) => (
              <li key={index}>
                <Typography variant='body2'>{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Helper Text */}
      {(helperText || error) && (
        <Typography
          variant='caption'
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 1, display: 'block' }}
        >
          {error || helperText}
        </Typography>
      )}

      {/* File List */}
      {showFileList && files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              Selected Files ({files.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {uploadUrl && !autoUpload && (
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<CloudUpload />}
                  onClick={() => uploadFiles()}
                  disabled={
                    uploading || files.every(f => f.uploadStatus === 'success')
                  }
                >
                  Upload All
                </Button>
              )}

              <Button
                variant='outlined'
                size='small'
                startIcon={<Delete />}
                onClick={() => {
                  setFiles([]);
                  onChange([]);
                }}
                disabled={files.length === 0}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <AnimatePresence>
              {files.map(file => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                  <FilePreview
                    file={file}
                    onRemove={removeFile}
                    onPreview={handlePreviewFile}
                  />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </Box>
      )}

      {/* File Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>{previewFile?.name}</Typography>
          <IconButton onClick={() => setShowPreview(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.fileType.type === 'image' && (
                <Box
                  component='img'
                  src={
                    previewFile.preview || URL.createObjectURL(previewFile.file)
                  }
                  alt={previewFile.name}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              )}

              {previewFile.fileType.type !== 'image' && (
                <Box
                  sx={{
                    py: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      bgcolor: `${previewFile.fileType.color}.main`,
                    }}
                  >
                    <previewFile.fileType.icon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant='h6' sx={{ mb: 1 }}>
                    {previewFile.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {formatFileSize(previewFile.size)} •{' '}
                    {previewFile.fileType.type}
                  </Typography>
                </Box>
              )}

              {/* File details */}
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  File Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Size:
                    </Typography>
                    <Typography variant='body2'>
                      {formatFileSize(previewFile.size)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Type:
                    </Typography>
                    <Typography variant='body2'>
                      {previewFile.type || 'Unknown'}
                    </Typography>
                  </Grid>
                  {previewFile.lastModified && (
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary'>
                        Last Modified:
                      </Typography>
                      <Typography variant='body2'>
                        {new Date(previewFile.lastModified).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FileUploadZone;
