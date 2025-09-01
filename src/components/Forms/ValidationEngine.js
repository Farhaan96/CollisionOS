import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Divider,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Check,
  Error as ErrorIcon,
  Warning,
  Info,
  ExpandMore,
  ExpandLess,
  Refresh,
  Settings,
  BugReport,
  Security,
  Speed,
  Tune,
  Analytics,
  VerifiedUser,
  Schedule,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Validation rule types
const VALIDATION_TYPES = {
  REQUIRED: 'required',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  EMAIL: 'email',
  URL: 'url',
  NUMBER: 'number',
  INTEGER: 'integer',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  DATE: 'date',
  FUTURE_DATE: 'futureDate',
  PAST_DATE: 'pastDate',
  PHONE: 'phone',
  CUSTOM: 'custom',
  ASYNC: 'async',
  CROSS_FIELD: 'crossField',
};

// Built-in validation rules
const BUILT_IN_RULES = {
  [VALIDATION_TYPES.REQUIRED]: {
    validate: value => value !== null && value !== undefined && value !== '',
    message: 'This field is required',
    severity: 'error',
  },

  [VALIDATION_TYPES.MIN_LENGTH]: {
    validate: (value, options) => !value || value.length >= options.min,
    message: options => `Minimum ${options.min} characters required`,
    severity: 'error',
  },

  [VALIDATION_TYPES.MAX_LENGTH]: {
    validate: (value, options) => !value || value.length <= options.max,
    message: options => `Maximum ${options.max} characters allowed`,
    severity: 'error',
  },

  [VALIDATION_TYPES.PATTERN]: {
    validate: (value, options) => !value || options.regex.test(value),
    message: options => options.message || 'Invalid format',
    severity: 'error',
  },

  [VALIDATION_TYPES.EMAIL]: {
    validate: value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
    severity: 'error',
  },

  [VALIDATION_TYPES.URL]: {
    validate: value => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Please enter a valid URL',
    severity: 'error',
  },

  [VALIDATION_TYPES.NUMBER]: {
    validate: value => !value || !isNaN(Number(value)),
    message: 'Please enter a valid number',
    severity: 'error',
  },

  [VALIDATION_TYPES.INTEGER]: {
    validate: value => !value || Number.isInteger(Number(value)),
    message: 'Please enter a valid integer',
    severity: 'error',
  },

  [VALIDATION_TYPES.POSITIVE]: {
    validate: value => !value || Number(value) > 0,
    message: 'Please enter a positive number',
    severity: 'error',
  },

  [VALIDATION_TYPES.MIN_VALUE]: {
    validate: (value, options) => !value || Number(value) >= options.min,
    message: options => `Value must be at least ${options.min}`,
    severity: 'error',
  },

  [VALIDATION_TYPES.MAX_VALUE]: {
    validate: (value, options) => !value || Number(value) <= options.max,
    message: options => `Value must not exceed ${options.max}`,
    severity: 'error',
  },

  [VALIDATION_TYPES.PHONE]: {
    validate: value =>
      !value ||
      (/^[\+]?[\d\s\-\(\)]+$/.test(value) &&
        value.replace(/\D/g, '').length >= 10),
    message: 'Please enter a valid phone number',
    severity: 'error',
  },
};

// Validation severity levels
const SEVERITY_LEVELS = {
  error: { icon: ErrorIcon, color: 'error', priority: 3 },
  warning: { icon: Warning, color: 'warning', priority: 2 },
  info: { icon: Info, color: 'info', priority: 1 },
  success: { icon: Check, color: 'success', priority: 0 },
};

// Validation engine class
class ValidationEngine {
  constructor(options = {}) {
    this.rules = { ...BUILT_IN_RULES, ...options.customRules };
    this.asyncValidators = new Map();
    this.crossFieldValidators = [];
    this.validationCache = new Map();
    this.options = {
      debounceMs: 300,
      enableAsyncValidation: true,
      enableCaching: true,
      enableCrossFieldValidation: true,
      ...options,
    };
  }

  // Add custom rule
  addRule(name, rule) {
    this.rules[name] = rule;
  }

  // Add async validator
  addAsyncValidator(fieldName, validator) {
    this.asyncValidators.set(fieldName, validator);
  }

  // Add cross-field validator
  addCrossFieldValidator(validator) {
    this.crossFieldValidators.push(validator);
  }

  // Validate single field
  async validateField(fieldName, value, schema = {}, allValues = {}) {
    const fieldRules = schema.validation || [];
    const errors = [];
    const warnings = [];
    const infos = [];

    // Check cache
    const cacheKey = `${fieldName}:${JSON.stringify(value)}:${JSON.stringify(allValues)}`;
    if (this.options.enableCaching && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    // Run synchronous validations
    for (const rule of fieldRules) {
      if (typeof rule === 'string') {
        // Built-in rule
        const builtInRule = this.rules[rule];
        if (builtInRule && !builtInRule.validate(value)) {
          errors.push({
            type: rule,
            message: builtInRule.message,
            severity: builtInRule.severity,
          });
        }
      } else if (typeof rule === 'object') {
        // Rule with options
        const builtInRule = this.rules[rule.type];
        if (builtInRule) {
          const isValid = builtInRule.validate(value, rule.options);
          if (!isValid) {
            const message =
              typeof builtInRule.message === 'function'
                ? builtInRule.message(rule.options)
                : builtInRule.message;

            const severity = rule.severity || builtInRule.severity;
            const errorObj = {
              type: rule.type,
              message: rule.message || message,
              severity,
            };

            if (severity === 'error') errors.push(errorObj);
            else if (severity === 'warning') warnings.push(errorObj);
            else if (severity === 'info') infos.push(errorObj);
          }
        } else if (rule.type === VALIDATION_TYPES.CUSTOM && rule.validate) {
          // Custom validation function
          const result = rule.validate(value, allValues);
          if (result !== true) {
            const severity = rule.severity || 'error';
            const errorObj = {
              type: VALIDATION_TYPES.CUSTOM,
              message: typeof result === 'string' ? result : rule.message,
              severity,
            };

            if (severity === 'error') errors.push(errorObj);
            else if (severity === 'warning') warnings.push(errorObj);
            else if (severity === 'info') infos.push(errorObj);
          }
        }
      }
    }

    // Run async validation
    if (
      this.options.enableAsyncValidation &&
      this.asyncValidators.has(fieldName)
    ) {
      try {
        const asyncValidator = this.asyncValidators.get(fieldName);
        const asyncResult = await asyncValidator(value, allValues);

        if (asyncResult !== true) {
          const severity = asyncResult.severity || 'error';
          const errorObj = {
            type: VALIDATION_TYPES.ASYNC,
            message: asyncResult.message || 'Async validation failed',
            severity,
            async: true,
          };

          if (severity === 'error') errors.push(errorObj);
          else if (severity === 'warning') warnings.push(errorObj);
          else if (severity === 'info') infos.push(errorObj);
        }
      } catch (error) {
        errors.push({
          type: VALIDATION_TYPES.ASYNC,
          message: 'Validation service error',
          severity: 'error',
          async: true,
        });
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      hasWarnings: warnings.length > 0,
      hasInfos: infos.length > 0,
    };

    // Cache result
    if (this.options.enableCaching) {
      this.validationCache.set(cacheKey, result);
    }

    return result;
  }

  // Validate cross fields
  async validateCrossFields(allValues) {
    if (!this.options.enableCrossFieldValidation) return {};

    const errors = {};

    for (const validator of this.crossFieldValidators) {
      try {
        const result = await validator(allValues);
        if (result && typeof result === 'object') {
          Object.assign(errors, result);
        }
      } catch (error) {
        console.error('Cross-field validation error:', error);
      }
    }

    return errors;
  }

  // Clear cache
  clearCache() {
    this.validationCache.clear();
  }
}

// React component for displaying validation results
const ValidationDisplay = ({
  validationResult = {},
  fieldName = '',
  showDetails = false,
  onRetryAsync = null,
  sx = {},
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAsyncSpinner, setShowAsyncSpinner] = useState(false);

  const { errors = [], warnings = [], infos = [], isValid } = validationResult;
  const hasAsyncError = errors.some(e => e.async);

  // Get primary message (highest priority)
  const primaryMessage = useMemo(() => {
    const allMessages = [...errors, ...warnings, ...infos];
    if (allMessages.length === 0) return null;

    return allMessages.sort(
      (a, b) =>
        SEVERITY_LEVELS[b.severity].priority -
        SEVERITY_LEVELS[a.severity].priority
    )[0];
  }, [errors, warnings, infos]);

  const handleRetryAsync = useCallback(async () => {
    if (!onRetryAsync) return;

    setShowAsyncSpinner(true);
    try {
      await onRetryAsync();
    } finally {
      setShowAsyncSpinner(false);
    }
  }, [onRetryAsync]);

  if (!primaryMessage) {
    return isValid ? (
      <Chip
        size='small'
        icon={<Check />}
        label='Valid'
        color='success'
        variant='outlined'
        sx={{ ...sx }}
      />
    ) : null;
  }

  const SeverityIcon = SEVERITY_LEVELS[primaryMessage.severity].icon;
  const severityColor = SEVERITY_LEVELS[primaryMessage.severity].color;

  return (
    <Box sx={{ ...sx }}>
      <Alert
        severity={severityColor}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {hasAsyncError && (
              <Tooltip title='Retry async validation'>
                <IconButton
                  size='small'
                  onClick={handleRetryAsync}
                  disabled={showAsyncSpinner}
                >
                  {showAsyncSpinner ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Refresh fontSize='small' />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {errors.length + warnings.length + infos.length > 1 && (
              <IconButton size='small' onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        }
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='body2'>{primaryMessage.message}</Typography>

          {errors.length + warnings.length + infos.length > 1 && (
            <Chip
              size='small'
              label={`+${errors.length + warnings.length + infos.length - 1} more`}
              variant='outlined'
            />
          )}
        </Box>

        <Collapse in={expanded} timeout={300}>
          <List dense sx={{ mt: 1 }}>
            {[...errors, ...warnings, ...infos].slice(1).map((issue, index) => {
              const IssueIcon = SEVERITY_LEVELS[issue.severity].icon;
              const issueColor = SEVERITY_LEVELS[issue.severity].color;

              return (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <IssueIcon fontSize='small' color={issueColor} />
                  </ListItemIcon>
                  <ListItemText
                    primary={issue.message}
                    secondary={issue.async ? 'Async validation' : undefined}
                  />
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </Alert>
    </Box>
  );
};

// Form validation summary component
const ValidationSummary = ({
  validationResults = {},
  showSuccessFields = false,
  showWarnings = true,
  showInfos = false,
  onFieldFocus = null,
  sx = {},
}) => {
  const [expanded, setExpanded] = useState(true);

  // Aggregate validation stats
  const stats = useMemo(() => {
    const fields = Object.keys(validationResults);
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let validCount = 0;

    const errorFields = [];
    const warningFields = [];
    const infoFields = [];
    const validFields = [];

    fields.forEach(fieldName => {
      const result = validationResults[fieldName];
      if (result.errors?.length > 0) {
        errorCount += result.errors.length;
        errorFields.push({ fieldName, issues: result.errors });
      } else if (result.warnings?.length > 0) {
        warningCount += result.warnings.length;
        warningFields.push({ fieldName, issues: result.warnings });
      } else if (result.infos?.length > 0) {
        infoCount += result.infos.length;
        infoFields.push({ fieldName, issues: result.infos });
      } else {
        validCount++;
        validFields.push({ fieldName });
      }
    });

    return {
      totalFields: fields.length,
      errorCount,
      warningCount,
      infoCount,
      validCount,
      errorFields,
      warningFields,
      infoFields,
      validFields,
    };
  }, [validationResults]);

  const overallScore =
    stats.totalFields > 0
      ? Math.round(
          ((stats.validCount + stats.warningFields.length * 0.5) /
            stats.totalFields) *
            100
        )
      : 100;

  if (stats.totalFields === 0) {
    return null;
  }

  return (
    <Card sx={{ ...sx }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant='h6'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <VerifiedUser />
            Form Validation Summary
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress
                variant='determinate'
                value={overallScore}
                size={32}
                color={
                  overallScore >= 80
                    ? 'success'
                    : overallScore >= 60
                      ? 'warning'
                      : 'error'
                }
              />
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {overallScore}%
              </Typography>
            </Box>

            <IconButton size='small' onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Progress bar */}
        <LinearProgress
          variant='determinate'
          value={overallScore}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 2,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor:
                overallScore >= 80
                  ? premiumDesignSystem.colors.semantic.success.main
                  : overallScore >= 60
                    ? premiumDesignSystem.colors.semantic.warning.main
                    : premiumDesignSystem.colors.semantic.error.main,
            },
          }}
        />

        {/* Stats chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            icon={<Check />}
            label={`${stats.validCount} Valid`}
            color='success'
            variant='outlined'
            size='small'
          />

          {stats.errorCount > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${stats.errorCount} Errors`}
              color='error'
              variant='outlined'
              size='small'
            />
          )}

          {stats.warningCount > 0 && showWarnings && (
            <Chip
              icon={<Warning />}
              label={`${stats.warningCount} Warnings`}
              color='warning'
              variant='outlined'
              size='small'
            />
          )}

          {stats.infoCount > 0 && showInfos && (
            <Chip
              icon={<Info />}
              label={`${stats.infoCount} Info`}
              color='info'
              variant='outlined'
              size='small'
            />
          )}
        </Box>

        <Collapse in={expanded}>
          <Box>
            {/* Error fields */}
            {stats.errorFields.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='subtitle2'
                  color='error'
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <ErrorIcon fontSize='small' />
                  Fields with Errors
                </Typography>

                {stats.errorFields.map(({ fieldName, issues }, index) => (
                  <Card
                    key={index}
                    variant='outlined'
                    sx={{
                      mb: 1,
                      cursor: onFieldFocus ? 'pointer' : 'default',
                      '&:hover': onFieldFocus && {
                        backgroundColor: 'error.50',
                      },
                    }}
                    onClick={() => onFieldFocus?.(fieldName)}
                  >
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                        {fieldName}
                      </Typography>
                      {issues.map((issue, issueIndex) => (
                        <Typography
                          key={issueIndex}
                          variant='caption'
                          color='error'
                          sx={{ display: 'block' }}
                        >
                          • {issue.message}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Warning fields */}
            {stats.warningFields.length > 0 && showWarnings && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='subtitle2'
                  color='warning'
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Warning fontSize='small' />
                  Fields with Warnings
                </Typography>

                {stats.warningFields.map(({ fieldName, issues }, index) => (
                  <Card
                    key={index}
                    variant='outlined'
                    sx={{
                      mb: 1,
                      cursor: onFieldFocus ? 'pointer' : 'default',
                      '&:hover': onFieldFocus && {
                        backgroundColor: 'warning.50',
                      },
                    }}
                    onClick={() => onFieldFocus?.(fieldName)}
                  >
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                        {fieldName}
                      </Typography>
                      {issues.map((issue, issueIndex) => (
                        <Typography
                          key={issueIndex}
                          variant='caption'
                          color='warning'
                          sx={{ display: 'block' }}
                        >
                          • {issue.message}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Valid fields (if enabled) */}
            {showSuccessFields && stats.validFields.length > 0 && (
              <Box>
                <Typography
                  variant='subtitle2'
                  color='success'
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Check fontSize='small' />
                  Valid Fields
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {stats.validFields.map(({ fieldName }, index) => (
                    <Chip
                      key={index}
                      label={fieldName}
                      size='small'
                      color='success'
                      variant='outlined'
                      onClick={() => onFieldFocus?.(fieldName)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Export validation engine and components
export {
  ValidationEngine,
  ValidationDisplay,
  ValidationSummary,
  VALIDATION_TYPES,
  BUILT_IN_RULES,
  SEVERITY_LEVELS,
};

export default ValidationEngine;
