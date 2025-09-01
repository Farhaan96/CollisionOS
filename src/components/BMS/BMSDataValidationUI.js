import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Badge,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  Info,
  BugReport,
  AutoFixHigh,
  Visibility,
  VisibilityOff,
  Speed,
  Assessment,
  TrendingUp,
  Timeline,
  DataObject,
  Security,
  Verified,
  DoNotDisturbAlt,
  SettingsApplications,
  PlaylistAddCheck,
  Rule,
  Healing,
} from '@mui/icons-material';

const BMSDataValidationUI = ({
  validationResults = {},
  onFixIssue,
  onOverrideValidation,
  onApplyAutoFix,
  showDetailedView = false,
  allowOverrides = true,
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState({
    open: false,
    issue: null,
  });
  const [autoFixDialog, setAutoFixDialog] = useState({
    open: false,
    fixes: [],
  });

  // Calculate validation statistics
  const validationStats = useMemo(() => {
    const allIssues = [];
    const fieldValidations = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalFields = 0;
    let validFields = 0;

    Object.entries(validationResults).forEach(([section, result]) => {
      if (result.errors) {
        totalErrors += result.errors.length;
        allIssues.push(
          ...result.errors.map(e => ({ ...e, section, type: 'error' }))
        );
      }
      if (result.warnings) {
        totalWarnings += result.warnings.length;
        allIssues.push(
          ...result.warnings.map(w => ({ ...w, section, type: 'warning' }))
        );
      }
      if (result.fieldValidations) {
        Object.entries(result.fieldValidations).forEach(
          ([field, validation]) => {
            totalFields++;
            if (validation.isValid) validFields++;
            fieldValidations.push({ field, ...validation, section });
          }
        );
      }
    });

    return {
      allIssues,
      fieldValidations,
      totalErrors,
      totalWarnings,
      totalIssues: totalErrors + totalWarnings,
      totalFields,
      validFields,
      validationScore:
        totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 100,
      isValid: totalErrors === 0,
      hasWarnings: totalWarnings > 0,
    };
  }, [validationResults]);

  const toggleSection = section => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getSeverityIcon = severity => {
    switch (severity) {
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Info />;
    }
  };

  const getValidationScoreColor = score => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleOverrideIssue = issue => {
    setOverrideDialog({ open: true, issue });
  };

  const confirmOverride = () => {
    if (overrideDialog.issue) {
      onOverrideValidation?.(overrideDialog.issue);
    }
    setOverrideDialog({ open: false, issue: null });
  };

  const renderValidationOverview = () => (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${alpha(getValidationScoreColor(validationStats.validationScore), 0.3)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${getValidationScoreColor(validationStats.validationScore)}, ${alpha(getValidationScoreColor(validationStats.validationScore), 0.5)})`,
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
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
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${getValidationScoreColor(validationStats.validationScore)}, ${alpha(getValidationScoreColor(validationStats.validationScore), 0.8)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 12px 24px ${alpha(getValidationScoreColor(validationStats.validationScore), 0.3)}`,
              }}
            >
              <Assessment sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 800, mb: 1 }}>
                Data Validation Report
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Comprehensive validation results and data quality analysis
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant='h2'
              sx={{
                fontWeight: 900,
                color: getValidationScoreColor(validationStats.validationScore),
                mb: 0.5,
                lineHeight: 1,
              }}
            >
              {validationStats.validationScore}%
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ fontWeight: 600 }}
            >
              Validation Score
            </Typography>
          </Box>
        </Box>

        {/* Validation Progress */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant='determinate'
            value={validationStats.validationScore}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: alpha(
                getValidationScoreColor(validationStats.validationScore),
                0.2
              ),
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                background: `linear-gradient(90deg, ${getValidationScoreColor(validationStats.validationScore)}, ${alpha(getValidationScoreColor(validationStats.validationScore), 0.8)})`,
                boxShadow: `0 2px 8px ${alpha(getValidationScoreColor(validationStats.validationScore), 0.4)}`,
              },
            }}
          />
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          {[
            {
              label: 'Total Fields',
              value: validationStats.totalFields,
              icon: DataObject,
              color: theme.palette.info.main,
            },
            {
              label: 'Valid Fields',
              value: validationStats.validFields,
              icon: Verified,
              color: theme.palette.success.main,
            },
            {
              label: 'Errors',
              value: validationStats.totalErrors,
              icon: Error,
              color: theme.palette.error.main,
            },
            {
              label: 'Warnings',
              value: validationStats.totalWarnings,
              icon: Warning,
              color: theme.palette.warning.main,
            },
          ].map((stat, index) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Paper
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  background: alpha(stat.color, 0.05),
                  border: `1px solid ${alpha(stat.color, 0.2)}`,
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(stat.color, 0.15)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.8)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    boxShadow: `0 4px 8px ${alpha(stat.color, 0.3)}`,
                  }}
                >
                  <stat.icon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography
                  variant='h5'
                  sx={{ fontWeight: 800, color: stat.color, mb: 0.5 }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ fontWeight: 600 }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Controls */}
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction='row' spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyIssues}
                  onChange={e => setShowOnlyIssues(e.target.checked)}
                  color='warning'
                />
              }
              label='Show Only Issues'
            />
          </Stack>

          <Stack direction='row' spacing={2}>
            {validationStats.totalIssues > 0 && (
              <Button
                variant='outlined'
                startIcon={<AutoFixHigh />}
                onClick={() =>
                  setAutoFixDialog({
                    open: true,
                    fixes: validationStats.allIssues,
                  })
                }
                sx={{ borderRadius: '12px' }}
              >
                Auto-Fix Issues ({validationStats.totalIssues})
              </Button>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  const renderFieldValidations = () => {
    if (!showDetailedView) return null;

    const filteredValidations = showOnlyIssues
      ? validationStats.fieldValidations.filter(v => !v.isValid)
      : validationStats.fieldValidations;

    return (
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <CardContent sx={{ p: 0 }}>
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
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlaylistAddCheck
                    sx={{ color: theme.palette.secondary.main, fontSize: 24 }}
                  />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
                    Field Validation Details
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Individual field validation results and recommendations
                  </Typography>
                </Box>
              </Box>

              <Badge badgeContent={filteredValidations.length} color='primary'>
                <Chip
                  label={`${validationStats.validFields}/${validationStats.totalFields} Valid`}
                  color={
                    validationStats.validFields === validationStats.totalFields
                      ? 'success'
                      : 'warning'
                  }
                  variant='filled'
                />
              </Badge>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <List sx={{ p: 0 }}>
              {filteredValidations.map((validation, index) => (
                <React.Fragment
                  key={`${validation.section}-${validation.field}`}
                >
                  <ListItem
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      mb: 1,
                      backgroundColor: validation.isValid
                        ? alpha(theme.palette.success.main, 0.05)
                        : alpha(theme.palette.error.main, 0.05),
                      border: `1px solid ${
                        validation.isValid
                          ? alpha(theme.palette.success.main, 0.2)
                          : alpha(theme.palette.error.main, 0.2)
                      }`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          background: validation.isValid
                            ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                            : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {validation.isValid ? (
                          <CheckCircle sx={{ color: 'white', fontSize: 16 }} />
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
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant='subtitle1'
                            sx={{ fontWeight: 600 }}
                          >
                            {validation.field}
                          </Typography>
                          <Chip
                            label={validation.section}
                            size='small'
                            variant='outlined'
                            sx={{ fontSize: '10px', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant='body2' color='text.secondary'>
                          {validation.message}
                        </Typography>
                      }
                    />

                    {!validation.isValid && allowOverrides && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title='Override validation'>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleOverrideIssue({
                                field: validation.field,
                                message: validation.message,
                              })
                            }
                            sx={{
                              backgroundColor: alpha(
                                theme.palette.warning.main,
                                0.1
                              ),
                              color: theme.palette.warning.main,
                              '&:hover': {
                                backgroundColor: alpha(
                                  theme.palette.warning.main,
                                  0.2
                                ),
                              },
                            }}
                          >
                            <DoNotDisturbAlt />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Auto-fix if available'>
                          <IconButton
                            size='small'
                            onClick={() => onApplyAutoFix?.(validation.field)}
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
                            <Healing />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </ListItem>
                  {index < filteredValidations.length - 1 && (
                    <Divider sx={{ opacity: 0.3 }} />
                  )}
                </React.Fragment>
              ))}
            </List>

            {filteredValidations.length === 0 && (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  background: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  borderRadius: '12px',
                }}
              >
                <CheckCircle
                  sx={{
                    color: theme.palette.success.main,
                    fontSize: 48,
                    mb: 2,
                  }}
                />
                <Typography
                  variant='h6'
                  sx={{
                    color: theme.palette.success.main,
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  All Fields Valid!
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  No validation issues found in the current data.
                </Typography>
              </Paper>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSectionValidations = () => {
    return Object.entries(validationResults).map(([section, result]) => {
      const hasIssues =
        (result.errors?.length || 0) + (result.warnings?.length || 0) > 0;

      if (showOnlyIssues && !hasIssues) return null;

      return (
        <Accordion
          key={section}
          expanded={expandedSections.has(section)}
          onChange={() => toggleSection(section)}
          sx={{
            mb: 2,
            borderRadius: '16px !important',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            '&::before': { display: 'none' },
            '&.Mui-expanded': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              borderRadius: '16px',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                width: '100%',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: hasIssues
                    ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`
                    : `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasIssues ? (
                  <BugReport sx={{ color: 'white', fontSize: 20 }} />
                ) : (
                  <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                )}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, textTransform: 'capitalize', mb: 0.5 }}
                >
                  {section.replace(/([A-Z])/g, ' $1').trim()} Validation
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {result.summary?.message ||
                    (hasIssues
                      ? `${(result.errors?.length || 0) + (result.warnings?.length || 0)} issues found`
                      : 'All validations passed')}
                </Typography>
              </Box>

              <Stack direction='row' spacing={1}>
                {result.errors?.length > 0 && (
                  <Chip
                    label={`${result.errors.length} errors`}
                    size='small'
                    color='error'
                    variant='filled'
                  />
                )}
                {result.warnings?.length > 0 && (
                  <Chip
                    label={`${result.warnings.length} warnings`}
                    size='small'
                    color='warning'
                    variant='filled'
                  />
                )}
                {!hasIssues && (
                  <Chip
                    label='Valid'
                    size='small'
                    color='success'
                    variant='filled'
                  />
                )}
              </Stack>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0 }}>
            {result.errors?.length > 0 && (
              <Alert severity='error' sx={{ mb: 2 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                  Errors Found:
                </Typography>
                <List dense>
                  {result.errors.map((error, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <Error
                          sx={{ fontSize: 16, color: theme.palette.error.main }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant='body2'>
                            <strong>{error.field}:</strong> {error.message}
                          </Typography>
                        }
                      />
                      {allowOverrides && (
                        <IconButton
                          size='small'
                          onClick={() => handleOverrideIssue(error)}
                          sx={{ ml: 1 }}
                        >
                          <DoNotDisturbAlt fontSize='small' />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {result.warnings?.length > 0 && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                  Warnings:
                </Typography>
                <List dense>
                  {result.warnings.map((warning, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <Warning
                          sx={{
                            fontSize: 16,
                            color: theme.palette.warning.main,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant='body2'>
                            <strong>{warning.field}:</strong> {warning.message}
                          </Typography>
                        }
                      />
                      {allowOverrides && (
                        <IconButton
                          size='small'
                          onClick={() => handleOverrideIssue(warning)}
                          sx={{ ml: 1 }}
                        >
                          <DoNotDisturbAlt fontSize='small' />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {!hasIssues && (
              <Alert severity='success'>
                <Typography variant='body2'>
                  All validation checks passed for this section.
                </Typography>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box>{renderValidationOverview()}</Box>

      <Box>
        {renderFieldValidations()}
        {renderSectionValidations()}
      </Box>

      {/* Override Confirmation Dialog */}
      <Dialog
        open={overrideDialog.open}
        onClose={() => setOverrideDialog({ open: false, issue: null })}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DoNotDisturbAlt color='warning' />
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Override Validation
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Are you sure you want to override this validation check?
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {overrideDialog.issue && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Field:</strong> {overrideDialog.issue.field}
              </Typography>
              <Typography variant='body2'>
                <strong>Issue:</strong> {overrideDialog.issue.message}
              </Typography>
            </Alert>
          )}

          <Typography variant='body2'>
            Overriding this validation will allow the import to proceed despite
            the identified issue. Please ensure you understand the implications
            before proceeding.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOverrideDialog({ open: false, issue: null })}
          >
            Cancel
          </Button>
          <Button onClick={confirmOverride} variant='contained' color='warning'>
            Override
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auto-Fix Dialog */}
      <Dialog
        open={autoFixDialog.open}
        onClose={() => setAutoFixDialog({ open: false, fixes: [] })}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoFixHigh color='info' />
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Auto-Fix Available Issues
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Review and apply automatic fixes for common validation issues
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>
            The following issues can be automatically fixed:
          </Typography>

          <List>
            {autoFixDialog.fixes.map((issue, index) => (
              <ListItem key={index}>
                <ListItemIcon>{getSeverityIcon(issue.type)}</ListItemIcon>
                <ListItemText
                  primary={issue.field || issue.message}
                  secondary={`Section: ${issue.section}`}
                />
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => onApplyAutoFix?.(issue)}
                >
                  Fix
                </Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAutoFixDialog({ open: false, fixes: [] })}>
            Close
          </Button>
          <Button
            variant='contained'
            onClick={() => {
              autoFixDialog.fixes.forEach(fix => onApplyAutoFix?.(fix));
              setAutoFixDialog({ open: false, fixes: [] });
            }}
          >
            Fix All Issues
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BMSDataValidationUI;
