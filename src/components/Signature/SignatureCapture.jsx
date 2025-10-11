import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import {
  Clear,
  Check,
  Undo,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';

/**
 * SignatureCapture Component
 * Provides a canvas for capturing digital signatures with touch/mouse support
 *
 * Features:
 * - Signature pad with touch and mouse support
 * - Clear and redo functionality
 * - Responsive canvas sizing
 * - Base64 PNG export
 * - Empty signature detection
 * - Visual feedback during signing
 *
 * @param {Object} props
 * @param {Function} props.onSave - Callback with signature data (base64 PNG)
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {string} props.label - Label for signature field
 * @param {number} props.width - Canvas width (default: 500)
 * @param {number} props.height - Canvas height (default: 200)
 * @param {string} props.penColor - Pen color (default: black)
 */
const SignatureCapture = ({
  onSave,
  onCancel,
  label = 'Sign here',
  width = 500,
  height = 200,
  penColor = '#000000',
}) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState(null);

  // Check if signature is empty
  const checkEmpty = () => {
    if (sigCanvas.current) {
      const empty = sigCanvas.current.isEmpty();
      setIsEmpty(empty);
    }
  };

  // Clear the signature
  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      setError(null);
    }
  };

  // Save the signature
  const handleSave = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        setError('Please provide a signature before saving');
        return;
      }

      try {
        // Get signature as base64 PNG
        const signatureData = sigCanvas.current.toDataURL('image/png');

        // Get canvas dimensions
        const canvasWidth = sigCanvas.current.getCanvas().width;
        const canvasHeight = sigCanvas.current.getCanvas().height;

        onSave({
          signatureData,
          width: canvasWidth,
          height: canvasHeight,
        });
      } catch (err) {
        console.error('Error saving signature:', err);
        setError('Failed to save signature. Please try again.');
      }
    }
  };

  // Undo last stroke
  const handleUndo = () => {
    if (sigCanvas.current) {
      const data = sigCanvas.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove last stroke
        sigCanvas.current.fromData(data);
        checkEmpty();
      }
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: width + 40 }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Stack spacing={2}>
          {/* Label */}
          <Typography variant="subtitle1" fontWeight="medium">
            {label}
          </Typography>

          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Signature Canvas */}
          <Paper
            variant="outlined"
            sx={{
              backgroundColor: '#ffffff',
              border: '2px solid',
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative',
              cursor: 'crosshair',
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                width: width,
                height: height,
                className: 'signature-canvas',
                style: {
                  display: 'block',
                },
              }}
              penColor={penColor}
              minWidth={0.5}
              maxWidth={2.5}
              velocityFilterWeight={0.7}
              onEnd={checkEmpty}
            />

            {/* Placeholder text when empty */}
            {isEmpty && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  opacity: 0.3,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Sign here with mouse or touch
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClear}
                disabled={isEmpty}
                size="small"
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                startIcon={<Undo />}
                onClick={handleUndo}
                disabled={isEmpty}
                size="small"
              >
                Undo
              </Button>
            </Stack>

            <Stack direction="row" spacing={1}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  size="small"
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Check />}
                onClick={handleSave}
                disabled={isEmpty}
                size="small"
              >
                Save Signature
              </Button>
            </Stack>
          </Stack>

          {/* Instructions */}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Use your mouse or finger to sign. Click "Clear" to start over or "Undo" to remove the last stroke.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignatureCapture;
