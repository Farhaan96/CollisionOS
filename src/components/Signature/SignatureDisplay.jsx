import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  ZoomIn,
  Verified,
  Info,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * SignatureDisplay Component
 * Displays a saved signature with metadata
 *
 * Features:
 * - Signature image display
 * - Signer information
 * - Timestamp display
 * - Verification status
 * - Zoom/enlarge functionality
 * - Compact and detailed views
 *
 * @param {Object} props
 * @param {Object} props.signature - Signature object from backend
 * @param {boolean} props.showDetails - Show detailed metadata (default: true)
 * @param {boolean} props.allowZoom - Allow zooming signature (default: true)
 * @param {string} props.variant - Display variant: 'compact' | 'detailed' (default: 'detailed')
 */
const SignatureDisplay = ({
  signature,
  showDetails = true,
  allowZoom = true,
  variant = 'detailed',
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!signature) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No signature available
        </Typography>
      </Paper>
    );
  }

  const {
    signatureData,
    signedBy,
    signerRole,
    signedAt,
    isVerified,
    signatureFieldName,
    signerEmail,
    signerPhone,
    signatureNotes,
  } = signature;

  // Format timestamp
  const formattedDate = signedAt
    ? format(new Date(signedAt), 'MMM dd, yyyy h:mm a')
    : 'Unknown date';

  // Compact view
  if (variant === 'compact') {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Signature image */}
        <Box
          component="img"
          src={signatureData}
          alt={`Signature by ${signedBy}`}
          sx={{
            height: 50,
            maxWidth: 150,
            objectFit: 'contain',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.5,
            backgroundColor: '#fff',
          }}
        />

        {/* Metadata */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            {signedBy}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {formattedDate}
          </Typography>
        </Box>

        {/* Verification badge */}
        {isVerified && (
          <Tooltip title="Verified signature">
            <CheckCircle color="success" fontSize="small" />
          </Tooltip>
        )}

        {/* Zoom button */}
        {allowZoom && (
          <IconButton size="small" onClick={() => setZoomOpen(true)}>
            <ZoomIn fontSize="small" />
          </IconButton>
        )}
      </Paper>
    );
  }

  // Detailed view
  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight="medium">
              {signatureFieldName || 'Signature'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {isVerified ? (
                <Chip
                  icon={<Verified />}
                  label="Verified"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Error />}
                  label="Unverified"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
              {allowZoom && (
                <Tooltip title="View full size">
                  <IconButton size="small" onClick={() => setZoomOpen(true)}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* Signature image */}
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              backgroundColor: '#ffffff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 100,
            }}
          >
            <Box
              component="img"
              src={signatureData}
              alt={`Signature by ${signedBy}`}
              sx={{
                maxWidth: '100%',
                maxHeight: 200,
                objectFit: 'contain',
              }}
            />
          </Paper>

          {/* Metadata */}
          {showDetails && (
            <Box>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
                    Signed by:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {signedBy}
                  </Typography>
                  <Chip label={signerRole} size="small" variant="outlined" />
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
                    Signed at:
                  </Typography>
                  <Typography variant="body2">
                    {formattedDate}
                  </Typography>
                </Box>

                {signerEmail && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      {signerEmail}
                    </Typography>
                  </Box>
                )}

                {signerPhone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
                      Phone:
                    </Typography>
                    <Typography variant="body2">
                      {signerPhone}
                    </Typography>
                  </Box>
                )}

                {signatureNotes && (
                  <Box display="flex" gap={1}>
                    <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
                      Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {signatureNotes}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Zoom Dialog */}
      {allowZoom && (
        <Dialog
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {signatureFieldName || 'Signature'} - {signedBy}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                minHeight: 300,
              }}
            >
              <Box
                component="img"
                src={signatureData}
                alt={`Signature by ${signedBy}`}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Signed on {formattedDate}
              {isVerified && ' • Verified signature'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setZoomOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default SignatureDisplay;
