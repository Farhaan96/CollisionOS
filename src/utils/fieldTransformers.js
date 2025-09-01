// Field transformation utilities for converting between snake_case (backend) and camelCase (frontend)

// Customer field mapping: backend snake_case → frontend camelCase
export const CUSTOMER_FIELD_MAP = {
  customer_number: 'customerNumber',
  first_name: 'firstName',
  last_name: 'lastName',
  company_name: 'companyName',
  customer_type: 'customerType',
  customer_status: 'customerStatus',
  is_active: 'isActive',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  zip_code: 'zipCode',
  date_of_birth: 'dateOfBirth',
  driver_license: 'driverLicense',
  preferred_contact: 'preferredContact',
  sms_opt_in: 'smsOptIn',
  email_opt_in: 'emailOptIn',
  marketing_opt_in: 'marketingOptIn',
  tax_id: 'taxId',
  credit_limit: 'creditLimit',
  payment_terms: 'paymentTerms',
  loyalty_points: 'loyaltyPoints',
  referral_source: 'referralSource',
  first_visit_date: 'firstVisitDate',
  last_visit_date: 'lastVisitDate',
};

// Reverse mapping: frontend camelCase → backend snake_case
export const CUSTOMER_FIELD_MAP_REVERSE = Object.entries(
  CUSTOMER_FIELD_MAP
).reduce((acc, [snakeCase, camelCase]) => {
  acc[camelCase] = snakeCase;
  return acc;
}, {});

/**
 * Transform snake_case backend data to camelCase frontend format
 * @param {Object} data - Object with snake_case fields
 * @returns {Object} Object with camelCase fields
 */
export const transformToFrontend = data => {
  if (!data || typeof data !== 'object') return data;

  const transformed = {};

  Object.keys(data).forEach(key => {
    const camelCaseKey = CUSTOMER_FIELD_MAP[key] || key;
    transformed[camelCaseKey] = data[key];
  });

  return transformed;
};

/**
 * Transform camelCase frontend data to snake_case backend format
 * @param {Object} data - Object with camelCase fields
 * @returns {Object} Object with snake_case fields
 */
export const transformToBackend = data => {
  if (!data || typeof data !== 'object') return data;

  const transformed = {};

  Object.keys(data).forEach(key => {
    const snakeCaseKey = CUSTOMER_FIELD_MAP_REVERSE[key] || key;
    transformed[snakeCaseKey] = data[key];
  });

  return transformed;
};

/**
 * Transform array of objects from snake_case to camelCase
 * @param {Array} dataArray - Array of objects with snake_case fields
 * @returns {Array} Array of objects with camelCase fields
 */
export const transformArrayToFrontend = dataArray => {
  if (!Array.isArray(dataArray)) return dataArray;
  return dataArray.map(transformToFrontend);
};

/**
 * Transform array of objects from camelCase to snake_case
 * @param {Array} dataArray - Array of objects with camelCase fields
 * @returns {Array} Array of objects with snake_case fields
 */
export const transformArrayToBackend = dataArray => {
  if (!Array.isArray(dataArray)) return dataArray;
  return dataArray.map(transformToBackend);
};

/**
 * Get customer full name - replacement for deprecated Sequelize method
 * Handles both snake_case and camelCase field names
 * @param {Object} customer - Customer object
 * @returns {string} Full name or fallback
 */
export const getCustomerFullName = customer => {
  if (!customer || typeof customer !== 'object') return 'Unknown Customer';

  const firstName = customer.firstName || customer.first_name || '';
  const lastName = customer.lastName || customer.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || 'Unknown Customer';
};

/**
 * Generic field transformer that handles both directions
 * @param {Object|Array} data - Data to transform
 * @param {'frontend'|'backend'} direction - Direction of transformation
 * @returns {Object|Array} Transformed data
 */
export const transformFields = (data, direction) => {
  if (direction === 'frontend') {
    return Array.isArray(data)
      ? transformArrayToFrontend(data)
      : transformToFrontend(data);
  } else if (direction === 'backend') {
    return Array.isArray(data)
      ? transformArrayToBackend(data)
      : transformToBackend(data);
  }
  return data;
};

/**
 * Check if an object has snake_case fields (backend format)
 * @param {Object} obj - Object to check
 * @returns {boolean} True if object appears to use snake_case
 */
export const isSnakeCaseFormat = obj => {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj);
  return keys.some(key => Object.keys(CUSTOMER_FIELD_MAP).includes(key));
};

/**
 * Check if an object has camelCase fields (frontend format)
 * @param {Object} obj - Object to check
 * @returns {boolean} True if object appears to use camelCase
 */
export const isCamelCaseFormat = obj => {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj);
  return keys.some(key => Object.values(CUSTOMER_FIELD_MAP).includes(key));
};

/**
 * Auto-detect format and transform to frontend if needed
 * @param {Object|Array} data - Data to potentially transform
 * @returns {Object|Array} Data in frontend format
 */
export const ensureFrontendFormat = data => {
  if (Array.isArray(data)) {
    if (data.length > 0 && isSnakeCaseFormat(data[0])) {
      return transformArrayToFrontend(data);
    }
    return data;
  }

  if (isSnakeCaseFormat(data)) {
    return transformToFrontend(data);
  }

  return data;
};

/**
 * Auto-detect format and transform to backend if needed
 * @param {Object|Array} data - Data to potentially transform
 * @returns {Object|Array} Data in backend format
 */
export const ensureBackendFormat = data => {
  if (Array.isArray(data)) {
    if (data.length > 0 && isCamelCaseFormat(data[0])) {
      return transformArrayToBackend(data);
    }
    return data;
  }

  if (isCamelCaseFormat(data)) {
    return transformToBackend(data);
  }

  return data;
};
