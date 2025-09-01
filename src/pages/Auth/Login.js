import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Lock,
  Person,
  DirectionsCar,
  Build,
  Verified,
  Shield,
} from '@mui/icons-material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const usernameRef = useRef();

  useEffect(() => {
    // Check for remembered user
    const rememberedUser = localStorage.getItem('collisionos_remembered_user');
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        setUsername(userData.username);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('collisionos_remembered_user');
      }
    }

    // Focus username field after component mounts
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simple authentication logic - in real app, this would call your API
      const validCredentials = [
        { user: 'admin', pass: 'admin123', role: 'owner', firstName: 'Admin' },
        {
          user: 'manager',
          pass: 'manager123',
          role: 'manager',
          firstName: 'Manager',
        },
        {
          user: 'estimator',
          pass: 'estimator123',
          role: 'estimator',
          firstName: 'Estimator',
        },
      ];

      const credential = validCredentials.find(
        cred => cred.user === username && cred.pass === password
      );

      if (credential) {
        // Save user if remember me is checked
        if (rememberMe) {
          localStorage.setItem(
            'collisionos_remembered_user',
            JSON.stringify({
              username: credential.user,
              firstName: credential.firstName,
              role: credential.role,
            })
          );
        } else {
          localStorage.removeItem('collisionos_remembered_user');
        }

        await login(
          {
            username: credential.user,
            role: credential.role,
            firstName: credential.firstName,
          },
          'dev-token'
        );

        navigate('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.3,
        },
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: 4,
          borderRadius: 3,
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Auto Body Shop Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {/* Logo and Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              gap: 1,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DirectionsCar sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography
              variant='h4'
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                ml: 1,
              }}
            >
              CollisionOS
            </Typography>
          </Box>

          <Typography
            variant='h6'
            sx={{
              color: '#374151',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Auto Body Shop Management
          </Typography>

          <Typography
            variant='body2'
            sx={{
              color: '#6B7280',
              mb: 2,
            }}
          >
            Professional collision repair workflow system
          </Typography>

          {/* Professional Trust Indicators */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              mb: 3,
              py: 2.5,
              px: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(248, 250, 252, 0.8)',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}
          >
            {/* Secure & Compliant */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.8,
                textAlign: 'center',
              }}
            >
              <Shield
                sx={{
                  fontSize: 20,
                  color: '#059669',
                }}
              />
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#374151',
                  lineHeight: 1.3,
                }}
              >
                Secure &
                <br />
                Compliant
              </Typography>
            </Box>

            {/* Industry Certified */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.8,
                textAlign: 'center',
              }}
            >
              <Verified
                sx={{
                  fontSize: 20,
                  color: '#3B82F6',
                }}
              />
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#374151',
                  lineHeight: 1.3,
                }}
              >
                Industry
                <br />
                Certified
              </Typography>
            </Box>

            {/* Professional Service */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.8,
                textAlign: 'center',
              }}
            >
              <Build
                sx={{
                  fontSize: 20,
                  color: '#7C3AED',
                }}
              />
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#374151',
                  lineHeight: 1.3,
                }}
              >
                Professional
                <br />
                Service
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />
        </Box>

        {/* Progress Bar for Loading */}
        {loading && (
          <LinearProgress
            sx={{
              mb: 2,
              borderRadius: 1,
              height: 4,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
              },
            }}
          />
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity='error'
            sx={{
              mb: 3,
              borderRadius: 2,
              borderLeft: '4px solid #EF4444',
            }}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            ref={usernameRef}
            label='Username'
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              setShowValidation(true);
            }}
            fullWidth
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'transparent',
                '& input': {
                  backgroundColor: 'transparent !important',
                  color: '#374151',
                  '&:-webkit-autofill': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                    backgroundColor: 'transparent !important',
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                  '&:-webkit-autofill:hover': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                  },
                  '&:-webkit-autofill:focus': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                  },
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#6B7280',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            }}
            variant='outlined'
            placeholder='Enter your username'
            InputProps={{
              startAdornment: (
                <Person
                  sx={{
                    color: username ? '#667eea' : '#9CA3AF',
                    mr: 1,
                    transition: 'color 0.2s ease',
                  }}
                />
              ),
            }}
          />

          <TextField
            label='Password'
            type='password'
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setShowValidation(true);
            }}
            fullWidth
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'transparent',
                '& input': {
                  backgroundColor: 'transparent !important',
                  color: '#374151',
                  '&:-webkit-autofill': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                    backgroundColor: 'transparent !important',
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                  '&:-webkit-autofill:hover': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                  },
                  '&:-webkit-autofill:focus': {
                    WebkitBoxShadow:
                      '0 0 0 1000px transparent inset !important',
                    WebkitTextFillColor: '#374151 !important',
                  },
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#6B7280',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            }}
            variant='outlined'
            placeholder='Enter your password'
            InputProps={{
              startAdornment: (
                <Lock
                  sx={{
                    color: password ? '#667eea' : '#9CA3AF',
                    mr: 1,
                    transition: 'color 0.2s ease',
                  }}
                />
              ),
            }}
          />

          {/* Validation Feedback */}
          {showValidation && (username || password) && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  color: username ? '#10B981' : '#6B7280',
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: username ? '#10B981' : '#E5E7EB',
                    transition: 'all 0.2s ease',
                  }}
                />
                <Typography variant='caption'>Username entered</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: password ? '#10B981' : '#6B7280',
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: password ? '#10B981' : '#E5E7EB',
                    transition: 'all 0.2s ease',
                  }}
                />
                <Typography variant='caption'>Password entered</Typography>
              </Box>
            </Box>
          )}

          {/* Remember Me & Forgot Password */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#3B82F6',
                    '&.Mui-checked': {
                      color: '#3B82F6',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                >
                  Remember me
                </Typography>
              }
            />
            <Typography
              variant='body2'
              sx={{
                color: '#3B82F6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={() => setError('Password reset feature coming soon')}
            >
              Forgot password?
            </Typography>
          </Box>

          {/* Login Button */}
          <Button
            type='submit'
            variant='contained'
            disabled={loading || !username || !password}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                background: '#9CA3AF',
                boxShadow: 'none',
                transform: 'none',
              },
              transition: 'all 0.2s ease',
            }}
            startIcon={
              loading ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <Lock />
              )
            }
          >
            {loading ? 'Signing in...' : 'Sign In to CollisionOS'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
