import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Badge,
} from '@mui/material';
import {
  Analytics,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  ExpandLess,
  Visibility,
  Assignment,
  Speed,
  DataObject,
  TrendingUp,
  Assessment,
  CloudDone,
  Info,
  BugReport,
  TaskAlt,
  Timeline,
  Insights,
} from '@mui/icons-material';

const BMSImportDashboard = ({
  importStatus = 'idle',
  validationResults = [],
  qualityScores = {},
  processingStats = {},
  onActionRequired,
  onViewDetails,
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [currentValidation, setCurrentValidation] = useState(null);

  // Calculate overall quality score
  const calculateOverallScore = () => {
    if (!qualityScores || Object.keys(qualityScores).length === 0) return 0;

    const scores = Object.values(qualityScores);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  const overallScore = calculateOverallScore();

  const getStatusColor = status => {
    switch (status) {
      case 'processing':
        return theme.palette.warning.main;
      case 'completed':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'validating':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'processing':
        return <Speed />;
      case 'completed':
        return <CloudDone />;
      case 'error':
        return <Error />;
      case 'validating':
        return <Assessment />;
      default:
        return <Info />;
    }
  };

  const getScoreColor = score => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const toggleSection = section => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatValidationIssue = issue => {
    return {
      severity: issue.severity || 'info',
      field: issue.field || 'unknown',
      message: issue.message || 'No details available',
      suggestion: issue.suggestion || null,
    };
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Processing Status Header */}
      <Box>
        <Card
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${alpha(getStatusColor(importStatus), 0.3)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${getStatusColor(importStatus)}, ${alpha(getStatusColor(importStatus), 0.5)})`,
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${getStatusColor(importStatus)}, ${alpha(getStatusColor(importStatus), 0.8)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${alpha(getStatusColor(importStatus), 0.3)}`,
                  }}
                >
                  {getStatusIcon(importStatus)}
                </Box>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                    Import Status:{' '}
                    {importStatus.charAt(0).toUpperCase() +
                      importStatus.slice(1)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Real-time processing and validation dashboard
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 800,
                    color: getScoreColor(overallScore),
                    mb: 0.5,
                  }}
                >
                  {overallScore}%
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Quality Score
                </Typography>
              </Box>
            </Box>

            {/* Progress Indicator */}
            {importStatus === 'processing' && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(getStatusColor(importStatus), 0.2),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${getStatusColor(importStatus)}, ${alpha(getStatusColor(importStatus), 0.8)})`,
                    },
                  }}
                />
              </Box>
            )}

            {/* Processing Stats */}
            <Grid container spacing={3}>
              {[
                {
                  label: 'Files Processed',
                  value: processingStats.filesProcessed || 0,
                  icon: DataObject,
                },
                {
                  label: 'Validation Checks',
                  value: validationResults.length || 0,
                  icon: TaskAlt,
                },
                {
                  label: 'Issues Found',
                  value:
                    validationResults.filter(v => v.errors?.length > 0)
                      .length || 0,
                  icon: BugReport,
                },
                {
                  label: 'Processing Time',
                  value: `${processingStats.processingTime || 0}s`,
                  icon: Speed,
                },
              ].map((stat, index) => (
                <Grid item xs={6} sm={3} key={stat.label}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      <stat.icon
                        sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                      />
                    </Box>
                    <Typography
                      variant='h6'
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Box>
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.2)}, ${alpha(theme.palette.info.main, 0.1)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Assessment
                        sx={{ color: theme.palette.info.main, fontSize: 24 }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant='h6'
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        Validation Results
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Data quality and validation checks
                      </Typography>
                    </Box>
                  </Box>

                  <Badge
                    badgeContent={validationResults.length}
                    color='primary'
                    sx={{
                      '& .MuiBadge-badge': {
                        fontWeight: 700,
                      },
                    }}
                  >
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => toggleSection('validation')}
                      endIcon={
                        expandedSections.has('validation') ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )
                      }
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                      }}
                    >
                      View Details
                    </Button>
                  </Badge>
                </Box>
              </Box>

              {/* Validation Details */}
              <Collapse in={expandedSections.has('validation')}>
                <Box sx={{ p: 3 }}>
                  <List sx={{ p: 0 }}>
                    {validationResults.map((result, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            p: 2.5,
                            borderRadius: '12px',
                            mb: 1,
                            backgroundColor: result.isValid
                              ? alpha(theme.palette.success.main, 0.05)
                              : alpha(theme.palette.error.main, 0.05),
                            border: `1px solid ${
                              result.isValid
                                ? alpha(theme.palette.success.main, 0.2)
                                : alpha(theme.palette.error.main, 0.2)
                            }`,
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                background: result.isValid
                                  ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                                  : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {result.isValid ? (
                                <CheckCircle
                                  sx={{ color: 'white', fontSize: 16 }}
                                />
                              ) : (
                                <Error sx={{ color: 'white', fontSize: 16 }} />
                              )}
                            </Box>
                          </ListItemIcon>

                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant='subtitle1'
                                  sx={{ fontWeight: 600 }}
                                >
                                  File {index + 1}
                                </Typography>
                                <Chip
                                  label={
                                    result.isValid ? 'Valid' : 'Issues Found'
                                  }
                                  size='small'
                                  color={result.isValid ? 'success' : 'error'}
                                  variant='filled'
                                  sx={{ fontWeight: 600, fontSize: '11px' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Stack spacing={1}>
                                {result.errors?.length > 0 && (
                                  <Alert severity='error' sx={{ py: 0.5 }}>
                                    <Typography variant='caption'>
                                      {result.errors.length} error(s) found
                                    </Typography>
                                  </Alert>
                                )}
                                {result.warnings?.length > 0 && (
                                  <Alert severity='warning' sx={{ py: 0.5 }}>
                                    <Typography variant='caption'>
                                      {result.warnings.length} warning(s) found
                                    </Typography>
                                  </Alert>
                                )}
                                {result.summary?.message && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {result.summary.message}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Tooltip title='View detailed validation report'>
                              <IconButton
                                size='small'
                                onClick={() => onViewDetails?.(result, index)}
                                sx={{
                                  backgroundColor: alpha(
                                    theme.palette.info.main,
                                    0.1
                                  ),
                                  color: theme.palette.info.main,
                                  '&:hover': {
                                    backgroundColor: alpha(
                                      theme.palette.info.main,
                                      0.2
                                    ),
                                  },
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {index < validationResults.length - 1 && (
                          <Divider sx={{ opacity: 0.3 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Quality Scores Breakdown */}
      {qualityScores && Object.keys(qualityScores).length > 0 && (
        <Box>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp
                    sx={{ color: theme.palette.primary.main, fontSize: 24 }}
                  />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
                    Data Quality Breakdown
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Quality scores by data category
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {Object.entries(qualityScores).map(([category, score]) => (
                  <Grid item xs={12} sm={6} md={3} key={category}>
                    <Paper
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        background: alpha(getScoreColor(score), 0.05),
                        border: `1px solid ${alpha(getScoreColor(score), 0.2)}`,
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <Typography
                        variant='h3'
                        sx={{
                          fontWeight: 800,
                          color: getScoreColor(score),
                          mb: 1,
                        }}
                      >
                        {score}%
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          textTransform: 'capitalize',
                        }}
                      >
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>

                      {/* Progress Ring */}
                      <Box
                        sx={{ position: 'relative', display: 'inline-flex' }}
                      >
                        <LinearProgress
                          variant='determinate'
                          value={score}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getScoreColor(score), 0.2),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getScoreColor(score),
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default BMSImportDashboard;
