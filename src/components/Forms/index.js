// Advanced Form Components for CollisionOS
// Executive-level form handling with smart validation

export { default as SmartForm } from './SmartForm';
export { default as ValidationEngine, ValidationDisplay, ValidationSummary, VALIDATION_TYPES } from './ValidationEngine';

// Form Fields
export { default as SmartAutocomplete } from './FormFields/SmartAutocomplete';
export { default as FileUploadZone } from './FormFields/FileUploadZone';
export { default as DateTimeRangePicker } from './FormFields/DateTimeRangePicker';

// Form field types for easy reference
export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  AUTOCOMPLETE: 'autocomplete',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  DATE_RANGE: 'dateRange',
  FILE_UPLOAD: 'fileUpload',
  RICH_TEXT: 'richText',
  PHONE: 'phone',
  URL: 'url',
  CUSTOM: 'custom'
};

// Form configuration helpers
export const createFormSchema = ({
  fields = {},
  steps = null,
  dependencies = {},
  validation = {},
  title = '',
  description = '',
  submitLabel = 'Submit',
  onAutoSave = null
}) => ({
  fields,
  steps,
  dependencies,
  validation,
  title,
  description,
  submitLabel,
  onAutoSave
});

// Field schema helper
export const createFieldSchema = ({
  type = FORM_FIELD_TYPES.TEXT,
  label = '',
  placeholder = '',
  required = false,
  disabled = false,
  validation = [],
  options = null, // For select/radio fields
  multiple = false, // For select/autocomplete
  defaultValue = null,
  helperText = '',
  ...customProps
}) => ({
  type,
  label,
  placeholder,
  required,
  disabled,
  validation,
  options,
  multiple,
  defaultValue,
  helperText,
  ...customProps
});

// Validation rule helpers
export const createValidationRule = (type, options = {}, message = null, severity = 'error') => ({
  type,
  options,
  message,
  severity
});

// Common validation rules
export const COMMON_VALIDATION_RULES = {
  required: () => createValidationRule(VALIDATION_TYPES.REQUIRED),
  email: () => createValidationRule(VALIDATION_TYPES.EMAIL),
  minLength: (min) => createValidationRule(VALIDATION_TYPES.MIN_LENGTH, { min }),
  maxLength: (max) => createValidationRule(VALIDATION_TYPES.MAX_LENGTH, { max }),
  pattern: (regex, message) => createValidationRule(VALIDATION_TYPES.PATTERN, { regex }, message),
  number: () => createValidationRule(VALIDATION_TYPES.NUMBER),
  positive: () => createValidationRule(VALIDATION_TYPES.POSITIVE),
  minValue: (min) => createValidationRule(VALIDATION_TYPES.MIN_VALUE, { min }),
  maxValue: (max) => createValidationRule(VALIDATION_TYPES.MAX_VALUE, { max }),
  phone: () => createValidationRule(VALIDATION_TYPES.PHONE),
  url: () => createValidationRule(VALIDATION_TYPES.URL),
  custom: (validateFn, message, severity = 'error') => ({
    type: VALIDATION_TYPES.CUSTOM,
    validate: validateFn,
    message,
    severity
  })
};

// Form presets for common use cases
export const FORM_PRESETS = {
  // Contact form
  CONTACT_FORM: {
    fields: {
      firstName: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXT,
        label: 'First Name',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required()]
      }),
      lastName: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXT,
        label: 'Last Name',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required()]
      }),
      email: createFieldSchema({
        type: FORM_FIELD_TYPES.EMAIL,
        label: 'Email Address',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required(), COMMON_VALIDATION_RULES.email()]
      }),
      phone: createFieldSchema({
        type: FORM_FIELD_TYPES.PHONE,
        label: 'Phone Number',
        validation: [COMMON_VALIDATION_RULES.phone()]
      }),
      message: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXTAREA,
        label: 'Message',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required(), COMMON_VALIDATION_RULES.minLength(10)]
      })
    },
    title: 'Contact Us',
    description: 'Send us a message and we\'ll get back to you.'
  },
  
  // User registration form
  USER_REGISTRATION: {
    fields: {
      username: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXT,
        label: 'Username',
        required: true,
        validation: [
          COMMON_VALIDATION_RULES.required(),
          COMMON_VALIDATION_RULES.minLength(3),
          COMMON_VALIDATION_RULES.pattern(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscore and hyphen allowed')
        ]
      }),
      email: createFieldSchema({
        type: FORM_FIELD_TYPES.EMAIL,
        label: 'Email Address',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required(), COMMON_VALIDATION_RULES.email()]
      }),
      password: createFieldSchema({
        type: FORM_FIELD_TYPES.PASSWORD,
        label: 'Password',
        required: true,
        validation: [
          COMMON_VALIDATION_RULES.required(),
          COMMON_VALIDATION_RULES.minLength(8),
          COMMON_VALIDATION_RULES.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain uppercase, lowercase, number and special character'
          )
        ]
      }),
      confirmPassword: createFieldSchema({
        type: FORM_FIELD_TYPES.PASSWORD,
        label: 'Confirm Password',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required()]
      })
    },
    dependencies: {
      password: [
        {
          field: 'confirmPassword',
          condition: (password) => password.length > 0,
          clearOnHide: true
        }
      ]
    },
    title: 'Create Account',
    description: 'Join us today and start your journey.'
  },
  
  // Customer information form
  CUSTOMER_INFO: {
    fields: {
      companyName: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXT,
        label: 'Company Name',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required()]
      }),
      contactPerson: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXT,
        label: 'Contact Person',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required()]
      }),
      email: createFieldSchema({
        type: FORM_FIELD_TYPES.EMAIL,
        label: 'Email Address',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required(), COMMON_VALIDATION_RULES.email()]
      }),
      phone: createFieldSchema({
        type: FORM_FIELD_TYPES.PHONE,
        label: 'Phone Number',
        required: true,
        validation: [COMMON_VALIDATION_RULES.required(), COMMON_VALIDATION_RULES.phone()]
      }),
      address: createFieldSchema({
        type: FORM_FIELD_TYPES.TEXTAREA,
        label: 'Address',
        validation: [COMMON_VALIDATION_RULES.minLength(10)]
      }),
      website: createFieldSchema({
        type: FORM_FIELD_TYPES.URL,
        label: 'Website',
        validation: [COMMON_VALIDATION_RULES.url()]
      })
    },
    title: 'Customer Information',
    description: 'Please provide your company details.'
  }
};

// Utility functions
export const validateFormData = async (data, schema, validationEngine) => {
  const results = {};
  
  for (const [fieldName, fieldValue] of Object.entries(data)) {
    const fieldSchema = schema.fields[fieldName];
    if (fieldSchema) {
      results[fieldName] = await validationEngine.validateField(
        fieldName,
        fieldValue,
        fieldSchema,
        data
      );
    }
  }
  
  // Cross-field validation
  const crossFieldErrors = await validationEngine.validateCrossFields(data);
  Object.assign(results, crossFieldErrors);
  
  return results;
};

export const getFormProgress = (data, schema) => {
  const totalFields = Object.keys(schema.fields).length;
  if (totalFields === 0) return 100;
  
  const completedFields = Object.entries(data).filter(([key, value]) => {
    const field = schema.fields[key];
    if (!field) return false;
    
    // Check if field has a value
    if (value === null || value === undefined || value === '') return false;
    
    // For arrays (multi-select), check if not empty
    if (Array.isArray(value)) return value.length > 0;
    
    return true;
  }).length;
  
  return Math.round((completedFields / totalFields) * 100);
};

export const isFormValid = (validationResults) => {
  return Object.values(validationResults).every(result => 
    result.isValid !== false && (!result.errors || result.errors.length === 0)
  );
};

export const getFieldErrors = (validationResults, fieldName) => {
  const result = validationResults[fieldName];
  return result?.errors || [];
};

export const getFieldWarnings = (validationResults, fieldName) => {
  const result = validationResults[fieldName];
  return result?.warnings || [];
};

export default {
  SmartForm,
  ValidationEngine,
  ValidationDisplay,
  ValidationSummary,
  SmartAutocomplete,
  FileUploadZone,
  DateTimeRangePicker,
  FORM_FIELD_TYPES,
  VALIDATION_TYPES,
  COMMON_VALIDATION_RULES,
  FORM_PRESETS,
  createFormSchema,
  createFieldSchema,
  createValidationRule,
  validateFormData,
  getFormProgress,
  isFormValid,
  getFieldErrors,
  getFieldWarnings
};