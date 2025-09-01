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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Tooltip,
  Alert,
  Collapse,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Save,
  SaveAs,
  Undo,
  Redo,
  RestartAlt,
  Check,
  Warning,
  Error as ErrorIcon,
  NavigateBefore,
  NavigateNext,
  History,
  SmartToy,
  AutoAwesome,
  Timeline,
  Settings,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Smart Form Component with advanced capabilities
const SmartForm = ({
  schema = {},
  initialValues = {},
  onSubmit = () => {},
  onValuesChange = () => {},
  enableAutoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  enableMultiStep = false,
  enableUndo = true,
  maxUndoSteps = 10,
  enableLocalStorage = true,
  storageKey = 'smart-form-data',
  validationEngine = null,
  className = '',
  sx = {},
  children,
  customFields = {},
  onStepChange = () => {},
  onFormStateChange = () => {},
}) => {
  // Form state management
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Undo/Redo state
  const [history, setHistory] = useState([initialValues]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Auto-save state
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Field dependencies tracking
  const [dependentFields, setDependentFields] = useState(new Map());
  const [conditionalFields, setConditionalFields] = useState(new Set());

  // Refs
  const autoSaveTimeoutRef = useRef(null);
  const formRef = useRef(null);

  // Memoized computed values
  const steps = useMemo(() => {
    if (!enableMultiStep || !schema.steps) return [];
    return schema.steps.map((step, index) => ({
      ...step,
      fields: step.fields || [],
      isCompleted: completedSteps.has(index),
      isValid: validateStep(index),
    }));
  }, [schema, completedSteps, formData, errors]);

  const canUndo = useMemo(() => historyIndex > 0, [historyIndex]);
  const canRedo = useMemo(
    () => historyIndex < history.length - 1,
    [historyIndex, history]
  );

  const progress = useMemo(() => {
    if (!enableMultiStep) {
      const validFields = Object.keys(schema.fields || {}).filter(
        key =>
          !errors[key] && formData[key] !== undefined && formData[key] !== ''
      );
      const totalFields = Object.keys(schema.fields || {}).length;
      return totalFields > 0 ? (validFields.length / totalFields) * 100 : 0;
    }

    const totalSteps = steps.length;
    const completedCount = completedSteps.size;
    return totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  }, [schema, formData, errors, completedSteps, steps, enableMultiStep]);

  // Validation helper functions
  const validateField = useCallback(
    (fieldName, value, allValues = formData) => {
      if (!validationEngine || !schema.fields?.[fieldName]) return null;

      const fieldSchema = schema.fields[fieldName];
      return validationEngine.validateField(
        fieldName,
        value,
        fieldSchema,
        allValues
      );
    },
    [validationEngine, schema, formData]
  );

  const validateStep = useCallback(
    stepIndex => {
      if (!steps[stepIndex]) return true;

      const stepFields = steps[stepIndex].fields;
      return stepFields.every(fieldName => !errors[fieldName]);
    },
    [steps, errors]
  );

  const validateForm = useCallback(async () => {
    if (!validationEngine) return true;

    const newErrors = {};
    let isFormValid = true;

    for (const [fieldName, fieldSchema] of Object.entries(
      schema.fields || {}
    )) {
      const fieldError = await validateField(fieldName, formData[fieldName]);
      if (fieldError) {
        newErrors[fieldName] = fieldError;
        isFormValid = false;
      }
    }

    // Cross-field validation
    if (validationEngine.validateCrossFields) {
      const crossFieldErrors = await validationEngine.validateCrossFields(
        formData,
        schema
      );
      Object.assign(newErrors, crossFieldErrors);
      if (Object.keys(crossFieldErrors).length > 0) {
        isFormValid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(isFormValid);
    return isFormValid;
  }, [validationEngine, schema, formData, validateField]);

  // Field dependency management
  const updateDependentFields = useCallback(
    (changedField, newValue) => {
      const dependencies = schema.dependencies?.[changedField];
      if (!dependencies) return;

      const newConditionalFields = new Set(conditionalFields);
      const updates = {};

      dependencies.forEach(dep => {
        const shouldShow = dep.condition(newValue, formData);

        if (shouldShow) {
          newConditionalFields.add(dep.field);
        } else {
          newConditionalFields.delete(dep.field);
          // Clear the field value if it's hidden
          updates[dep.field] =
            dep.clearOnHide !== false ? '' : formData[dep.field];
        }
      });

      setConditionalFields(newConditionalFields);

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    },
    [schema.dependencies, conditionalFields, formData]
  );

  // History management
  const addToHistory = useCallback(
    newFormData => {
      if (!enableUndo) return;

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newFormData);

      if (newHistory.length > maxUndoSteps + 1) {
        newHistory.shift();
      } else {
        setHistoryIndex(prev => prev + 1);
      }

      setHistory(newHistory);
    },
    [history, historyIndex, enableUndo, maxUndoSteps]
  );

  const undo = useCallback(() => {
    if (!canUndo) return;

    const previousIndex = historyIndex - 1;
    const previousData = history[previousIndex];

    setFormData(previousData);
    setHistoryIndex(previousIndex);
    setHasUnsavedChanges(true);
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const nextIndex = historyIndex + 1;
    const nextData = history[nextIndex];

    setFormData(nextData);
    setHistoryIndex(nextIndex);
    setHasUnsavedChanges(true);
  }, [canRedo, history, historyIndex]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!enableAutoSave || !enableLocalStorage) return;

    setIsAutoSaving(true);

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          formData,
          timestamp: Date.now(),
          currentStep,
          completedSteps: Array.from(completedSteps),
        })
      );

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Trigger custom auto-save callback if provided
      if (schema.onAutoSave) {
        await schema.onAutoSave(formData);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    enableAutoSave,
    enableLocalStorage,
    storageKey,
    formData,
    currentStep,
    completedSteps,
    schema.onAutoSave,
  ]);

  // Load saved data on mount
  useEffect(() => {
    if (!enableLocalStorage) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep || 0);
        setCompletedSteps(new Set(parsed.completedSteps || []));
        setLastSaved(new Date(parsed.timestamp));
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
    }
  }, [enableLocalStorage, storageKey]);

  // Auto-save timer
  useEffect(() => {
    if (!enableAutoSave || !hasUnsavedChanges) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(autoSave, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [enableAutoSave, hasUnsavedChanges, autoSave, autoSaveInterval]);

  // Field change handler
  const handleFieldChange = useCallback(
    (fieldName, value, shouldValidate = true) => {
      const newFormData = { ...formData, [fieldName]: value };

      setFormData(newFormData);
      setHasUnsavedChanges(true);

      // Add to history
      addToHistory(newFormData);

      // Mark field as touched
      setTouched(prev => ({ ...prev, [fieldName]: true }));

      // Validate field if needed
      if (shouldValidate) {
        const fieldError = validateField(fieldName, value, newFormData);
        setErrors(prev => ({
          ...prev,
          [fieldName]: fieldError,
        }));
      }

      // Update dependent fields
      updateDependentFields(fieldName, value);

      // Trigger callbacks
      onValuesChange(newFormData, fieldName, value);
      onFormStateChange({
        formData: newFormData,
        errors,
        isValid,
        progress,
        currentStep,
      });
    },
    [
      formData,
      addToHistory,
      validateField,
      updateDependentFields,
      onValuesChange,
      onFormStateChange,
      errors,
      isValid,
      progress,
      currentStep,
    ]
  );

  // Step navigation
  const goToStep = useCallback(
    stepIndex => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      setCurrentStep(stepIndex);
      onStepChange(stepIndex, steps[stepIndex]);
    },
    [steps, onStepChange]
  );

  const nextStep = useCallback(async () => {
    // Validate current step
    const isStepValid = await validateForm();
    if (!isStepValid) return;

    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, steps.length, validateForm, goToStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Form submission
  const handleSubmit = useCallback(
    async e => {
      e?.preventDefault();

      setIsSubmitting(true);

      try {
        const isFormValid = await validateForm();
        if (!isFormValid) {
          setIsSubmitting(false);
          return;
        }

        await onSubmit(formData, {
          errors,
          completedSteps: Array.from(completedSteps),
          currentStep,
        });

        // Clear local storage on successful submit
        if (enableLocalStorage) {
          localStorage.removeItem(storageKey);
          setHasUnsavedChanges(false);
        }

        // Clear history
        setHistory([formData]);
        setHistoryIndex(0);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      validateForm,
      onSubmit,
      errors,
      completedSteps,
      currentStep,
      enableLocalStorage,
      storageKey,
    ]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setHistory([initialValues]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);

    if (enableLocalStorage) {
      localStorage.removeItem(storageKey);
    }
  }, [initialValues, enableLocalStorage, storageKey]);

  // Render field helper
  const renderField = useCallback(
    (fieldName, fieldSchema, stepIndex = null) => {
      // Check if field should be shown based on conditions
      if (schema.dependencies) {
        const isConditional = Object.values(schema.dependencies).some(deps =>
          deps.some(dep => dep.field === fieldName)
        );

        if (isConditional && !conditionalFields.has(fieldName)) {
          return null;
        }
      }

      const fieldProps = {
        name: fieldName,
        value: formData[fieldName] || '',
        onChange: value => handleFieldChange(fieldName, value),
        error: touched[fieldName] ? errors[fieldName] : null,
        required: fieldSchema.required,
        disabled: isSubmitting || fieldSchema.disabled,
        schema: fieldSchema,
        formData,
      };

      // Use custom field component if provided
      if (customFields[fieldSchema.type]) {
        const CustomField = customFields[fieldSchema.type];
        return <CustomField key={fieldName} {...fieldProps} />;
      }

      // Default field rendering (can be extended with more field types)
      return (
        <Box key={fieldName} sx={{ mb: 3 }}>
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', mb: 1, display: 'block' }}
          >
            {fieldSchema.label} {fieldSchema.required && '*'}
          </Typography>
          {/* Field component would go here - this is a placeholder */}
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            Field: {fieldName} (Type: {fieldSchema.type})
          </Box>
        </Box>
      );
    },
    [
      schema,
      conditionalFields,
      formData,
      handleFieldChange,
      touched,
      errors,
      isSubmitting,
      customFields,
    ]
  );

  return (
    <Box
      component='form'
      ref={formRef}
      onSubmit={handleSubmit}
      className={className}
      sx={{
        width: '100%',
        maxWidth: '100%',
        ...sx,
      }}
    >
      {/* Progress and Status Bar */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${premiumDesignSystem.colors.primary.gradient})`,
          color: 'white',
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <SmartToy />
              Smart Form
              {schema.title && ` - ${schema.title}`}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Auto-save indicator */}
              {enableAutoSave && (
                <Tooltip
                  title={
                    isAutoSaving
                      ? 'Auto-saving...'
                      : lastSaved
                        ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                        : hasUnsavedChanges
                          ? 'Unsaved changes'
                          : 'All changes saved'
                  }
                >
                  <Chip
                    size='small'
                    icon={
                      isAutoSaving ? (
                        <Save />
                      ) : hasUnsavedChanges ? (
                        <Warning />
                      ) : (
                        <Check />
                      )
                    }
                    label={
                      isAutoSaving
                        ? 'Saving...'
                        : hasUnsavedChanges
                          ? 'Unsaved'
                          : 'Saved'
                    }
                    color={hasUnsavedChanges ? 'warning' : 'success'}
                    sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  />
                </Tooltip>
              )}

              {/* Undo/Redo buttons */}
              {enableUndo && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title='Undo'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={undo}
                        disabled={!canUndo}
                        sx={{
                          color: 'white',
                          '&:disabled': { color: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        <Undo />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title='Redo'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={redo}
                        disabled={!canRedo}
                        sx={{
                          color: 'white',
                          '&:disabled': { color: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        <Redo />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title='History'>
                    <IconButton
                      size='small'
                      onClick={() => setShowHistoryDialog(true)}
                      sx={{ color: 'white' }}
                    >
                      <History />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ mb: 1 }}>
            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Typography variant='caption' sx={{ opacity: 0.8 }}>
            Progress: {Math.round(progress)}% complete
            {enableMultiStep && ` (Step ${currentStep + 1} of ${steps.length})`}
          </Typography>
        </CardContent>
      </Card>

      {/* Multi-step stepper */}
      {enableMultiStep && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={currentStep} orientation='vertical'>
              {steps.map((step, index) => (
                <Step key={index} completed={step.isCompleted}>
                  <StepLabel
                    error={!step.isValid && touched[step.fields?.[0]]}
                    onClick={() => goToStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                      {step.title}
                    </Typography>
                    {step.description && (
                      <Typography variant='body2' color='text.secondary'>
                        {step.description}
                      </Typography>
                    )}
                  </StepLabel>

                  <StepContent>
                    <Box sx={{ mt: 2 }}>
                      <AnimatePresence mode='wait'>
                        {currentStep === index && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {step.fields.map(fieldName =>
                              renderField(
                                fieldName,
                                schema.fields[fieldName],
                                index
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                          variant='contained'
                          onClick={
                            index === steps.length - 1 ? handleSubmit : nextStep
                          }
                          disabled={isSubmitting}
                          startIcon={
                            index === steps.length - 1 ? (
                              <Check />
                            ) : (
                              <NavigateNext />
                            )
                          }
                        >
                          {index === steps.length - 1 ? 'Submit' : 'Next'}
                        </Button>

                        {index > 0 && (
                          <Button
                            variant='outlined'
                            onClick={previousStep}
                            startIcon={<NavigateBefore />}
                          >
                            Previous
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {/* Single-step form */}
      {!enableMultiStep && (
        <Card>
          <CardContent>
            <AnimatePresence>
              {Object.entries(schema.fields || {}).map(
                ([fieldName, fieldSchema]) =>
                  renderField(fieldName, fieldSchema)
              )}
            </AnimatePresence>

            {/* Custom content */}
            {children}

            {/* Submit button */}
            <Box
              sx={{
                mt: 4,
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant='outlined'
                onClick={resetForm}
                startIcon={<RestartAlt />}
                disabled={isSubmitting}
              >
                Reset
              </Button>

              <Button
                type='submit'
                variant='contained'
                disabled={isSubmitting || !isValid}
                startIcon={isSubmitting ? <Save /> : <Check />}
                sx={{ minWidth: 120 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Form History</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            You can restore any previous version of your form data.
          </Typography>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {history.map((historyItem, index) => (
              <Card
                key={index}
                variant={index === historyIndex ? 'elevation' : 'outlined'}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: index === historyIndex ? 'primary.50' : 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => {
                  setFormData(historyItem);
                  setHistoryIndex(index);
                  setShowHistoryDialog(false);
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant='subtitle2'>
                    Version {index + 1}
                    {index === historyIndex && ' (Current)'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {Object.keys(historyItem).length} fields filled
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartForm;
