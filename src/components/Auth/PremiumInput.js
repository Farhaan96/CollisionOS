import React, { useState, forwardRef } from 'react';
import {
  TextField,
  Box,
  Typography,
  IconButton,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Check,
  Close,
  Warning,
  Fingerprint,
  Face,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PremiumInput = forwardRef(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      onKeyPress,
      placeholder,
      error,
      success,
      helperText,
      showPasswordToggle = false,
      showPasswordStrength = false,
      biometricAuth = false,
      icon,
      required = false,
      disabled = false,
      onBiometricAuth,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const calculatePasswordStrength = password => {
      if (!password) return 0;

      let strength = 0;
      const checks = [
        /.{8,}/, // At least 8 characters
        /[a-z]/, // Contains lowercase
        /[A-Z]/, // Contains uppercase
        /\d/, // Contains digits
        /[^A-Za-z0-9]/, // Contains special characters
      ];

      checks.forEach(check => {
        if (check.test(password)) strength += 20;
      });

      return Math.min(strength, 100);
    };

    const handlePasswordChange = e => {
      const newValue = e.target.value;
      if (showPasswordStrength) {
        setPasswordStrength(calculatePasswordStrength(newValue));
      }
      onChange(e);
    };

    const getPasswordStrengthColor = strength => {
      if (strength < 40) return '#ef4444'; // Red
      if (strength < 70) return '#f59e0b'; // Yellow
      return '#10b981'; // Green
    };

    const getPasswordStrengthText = strength => {
      if (strength < 40) return 'Weak';
      if (strength < 70) return 'Good';
      return 'Strong';
    };

    const getStatusIcon = () => {
      if (success) return <Check sx={{ color: '#10b981', fontSize: 20 }} />;
      if (error) return <Close sx={{ color: '#ef4444', fontSize: 20 }} />;
      if (focused && value && !error)
        return <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />;
      return null;
    };

    const handleFocus = e => {
      setFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = e => {
      setFocused(false);
      if (props.onBlur) props.onBlur(e);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3, position: 'relative' }}>
          <TextField
            ref={ref}
            fullWidth
            label={label}
            type={
              showPasswordToggle ? (showPassword ? 'text' : 'password') : type
            }
            value={value}
            onChange={showPasswordStrength ? handlePasswordChange : onChange}
            onKeyPress={onKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            error={!!error}
            disabled={disabled}
            required={required}
            variant='outlined'
            InputProps={{
              startAdornment: icon && (
                <Box
                  sx={{
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(0,0,0,0.5)',
                  }}
                >
                  {icon}
                </Box>
              ),
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {/* Status Icon */}
                  {getStatusIcon()}

                  {/* Password Toggle */}
                  {showPasswordToggle && (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge='end'
                      size='small'
                      sx={{
                        color: focused ? '#3b82f6' : 'rgba(0,0,0,0.5)',
                        transition: 'color 0.2s ease',
                        '&:hover': { color: '#3b82f6' },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )}

                  {/* Biometric Auth Icons */}
                  {biometricAuth && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        onClick={() => onBiometricAuth?.('fingerprint')}
                        size='small'
                        sx={{
                          color: 'rgba(0,0,0,0.5)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#3b82f6',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <Fingerprint fontSize='small' />
                      </IconButton>
                      <IconButton
                        onClick={() => onBiometricAuth?.('face')}
                        size='small'
                        sx={{
                          color: 'rgba(0,0,0,0.5)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#3b82f6',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <Face fontSize='small' />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: focused
                  ? 'rgba(255, 255, 255, 1)'
                  : 'rgba(255, 255, 255, 0.85)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
                  transition: 'left 0.6s ease',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow:
                    '0 12px 35px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)',
                  '&::before': {
                    left: '100%',
                  },
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow:
                    '0 16px 45px rgba(59, 130, 246, 0.25), 0 0 0 2px rgba(59, 130, 246, 0.3)',
                  '&::before': {
                    left: '100%',
                  },
                },
                '&.Mui-error': {
                  boxShadow: error
                    ? '0 8px 25px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(239, 68, 68, 0.3)'
                    : 'none',
                  animation: error ? 'premiumShake 0.5s ease-in-out' : 'none',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: focused ? 2 : 1,
                  borderColor: error
                    ? '#ef4444'
                    : success
                      ? '#10b981'
                      : focused
                        ? '#3b82f6'
                        : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: error
                    ? '#ef4444'
                    : success
                      ? '#10b981'
                      : '#3b82f6',
                  borderWidth: 2,
                },
                '@keyframes premiumShake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-5px)' },
                  '75%': { transform: 'translateX(5px)' },
                },
              },
              '& .MuiInputBase-input': {
                color: 'rgba(0, 0, 0, 0.9)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                padding: { xs: '18px 14px', md: '20px 16px' },
                position: 'relative',
                zIndex: 2,
                '&::placeholder': {
                  color: 'rgba(0, 0, 0, 0.5)',
                  opacity: 1,
                },
                '&:focus': {
                  caretColor: '#3b82f6',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: error
                  ? '#ef4444'
                  : success
                    ? '#10b981'
                    : focused
                      ? '#3b82f6'
                      : 'rgba(0, 0, 0, 0.7)',
                fontWeight: focused ? 600 : 500,
                transition: 'all 0.3s ease',
                zIndex: 3,
                position: 'relative',
                transform:
                  focused || value
                    ? 'translate(14px, -9px) scale(0.75)'
                    : 'translate(14px, 20px) scale(1)',
                '&.Mui-focused': {
                  color: error ? '#ef4444' : success ? '#10b981' : '#3b82f6',
                },
              },
            }}
            {...props}
          />

          {/* Password Strength Indicator */}
          {showPasswordStrength && value && (
            <Fade in timeout={300}>
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{
                      color: getPasswordStrengthColor(passwordStrength),
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    Password Strength:{' '}
                    {getPasswordStrengthText(passwordStrength)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={passwordStrength}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        getPasswordStrengthColor(passwordStrength),
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                    },
                  }}
                />
              </Box>
            </Fade>
          )}

          {/* Helper Text */}
          {(helperText || error) && (
            <Fade in timeout={300}>
              <Typography
                variant='caption'
                sx={{
                  color: error
                    ? '#ef4444'
                    : success
                      ? '#10b981'
                      : 'rgba(0,0,0,0.6)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  mt: 0.5,
                  display: 'block',
                  pl: 1,
                }}
              >
                {error || helperText}
              </Typography>
            </Fade>
          )}
        </Box>
      </motion.div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;
