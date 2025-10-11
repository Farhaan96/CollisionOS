import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import SignatureCapture from './SignatureCapture';
import { toast } from 'react-hot-toast';

/**
 * SignatureModal Component
 * Modal dialog wrapper for signature capture with form inputs
 *
 * Features:
 * - Modal dialog with signature capture
 * - Signer information form
 * - Consent text display
 * - Save and cancel actions
 * - Loading states
 * - Error handling
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler (receives signature object)
 * @param {string} props.title - Dialog title
 * @param {string} props.fieldName - Signature field name
 * @param {string} props.consentText - Consent/agreement text
 * @param {string} props.defaultSignerName - Pre-filled signer name
 * @param {string} props.defaultSignerEmail - Pre-filled signer email
 * @param {string} props.defaultSignerPhone - Pre-filled signer phone
 * @param {string} props.defaultSignerRole - Pre-filled signer role
 * @param {boolean} props.requireEmail - Require email input
 * @param {boolean} props.requirePhone - Require phone input
 */
const SignatureModal = ({
  open,
  onClose,
  onSave,
  title = 'Digital Signature',
  fieldName = 'Signature',
  consentText = null,
  defaultSignerName = '',
  defaultSignerEmail = '',
  defaultSignerPhone = '',
  defaultSignerRole = 'customer',
  requireEmail = false,
  requirePhone = false,
}) => {
  const [signatureData, setSignatureData] = useState(null);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerEmail, setSignerEmail] = useState(defaultSignerEmail);
  const [signerPhone, setSignerPhone] = useState(defaultSignerPhone);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Handle signature capture
  const handleSignatureSave = (data) => {
    setSignatureData(data);
    setError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!signatureData) {
      setError('Please provide a signature');
      return false;
    }

    if (!signerName.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (requireEmail && !signerEmail.trim()) {
      setError('Please enter your email');
      return false;
    }

    if (requirePhone && !signerPhone.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const signatureObject = {
        ...signatureData,
        signedBy: signerName.trim(),
        signerEmail: signerEmail.trim() || null,
        signerPhone: signerPhone.trim() || null,
        signerRole,
        signatureFieldName: fieldName,
        signatureNotes: notes.trim() || null,
        consentText: consentText || null,
      };

      await onSave(signatureObject);
      handleClose();
    } catch (err) {
      console.error('Error saving signature:', err);
      setError(err.message || 'Failed to save signature. Please try again.');
      toast.error('Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSaving) {
      // Reset state
      setSignatureData(null);
      setSignerName(defaultSignerName);
      setSignerEmail(defaultSignerEmail);
      setSignerPhone(defaultSignerPhone);
      setSignerRole(defaultSignerRole);
      setNotes('');
      setError(null);
      onClose();
    }
  };

  const signerRoles = [
    { value: 'customer', label: 'Customer' },
    { value: 'technician', label: 'Technician' },
    { value: 'estimator', label: 'Estimator' },
    { value: 'manager', label: 'Manager' },
    { value: 'owner', label: 'Owner' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'driver', label: 'Driver' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <Button
            onClick={handleClose}
            disabled={isSaving}
            startIcon={<Close />}
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Consent text */}
          {consentText && (
            <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Please read and acknowledge:
              </Typography>
              <Typography variant="body2">
                {consentText}
              </Typography>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Signer information form */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Signer Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Full Name *"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                fullWidth
                required
                disabled={isSaving}
                placeholder="Enter your full name"
              />

              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  label="Role"
                  disabled={isSaving}
                >
                  {signerRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label={`Email ${requireEmail ? '*' : '(Optional)'}`}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                fullWidth
                required={requireEmail}
                disabled={isSaving}
                type="email"
                placeholder="your.email@example.com"
              />

              <TextField
                label={`Phone ${requirePhone ? '*' : '(Optional)'}`}
                value={signerPhone}
                onChange={(e) => setSignerPhone(e.target.value)}
                fullWidth
                required={requirePhone}
                disabled={isSaving}
                type="tel"
                placeholder="(555) 123-4567"
              />

              <TextField
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                disabled={isSaving}
                placeholder="Any additional notes or comments"
              />
            </Stack>
          </Box>

          {/* Signature capture */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {fieldName}
            </Typography>
            <SignatureCapture
              onSave={handleSignatureSave}
              label="Please sign below"
              width={500}
              height={200}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSaving}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !signatureData}
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
        >
          {isSaving ? 'Saving...' : 'Save Signature'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureModal;
