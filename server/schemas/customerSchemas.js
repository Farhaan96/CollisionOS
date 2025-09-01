const Joi = require('joi');

const createCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required().messages({
    'string.min': 'First name is required',
    'string.max': 'First name cannot exceed 100 characters',
    'any.required': 'First name is required',
  }),

  lastName: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name cannot exceed 100 characters',
    'any.required': 'Last name is required',
  }),

  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 255 characters',
    'any.required': 'Email is required',
  }),

  phone: Joi.string()
    .pattern(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  alternatePhone: Joi.string()
    .pattern(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid alternate phone number',
    }),

  address: Joi.string().max(255).optional(),

  city: Joi.string().max(100).optional(),

  state: Joi.string().max(50).optional(),

  zipCode: Joi.string()
    .pattern(/^[\d\-\s]{5,10}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid ZIP code',
    }),

  customerType: Joi.string()
    .valid('individual', 'corporate', 'insurance')
    .default('individual'),

  customerStatus: Joi.string()
    .valid('active', 'inactive', 'vip')
    .default('active'),

  companyName: Joi.string().max(255).optional(),

  taxId: Joi.string().max(50).optional(),

  notes: Joi.string().max(1000).optional(),

  preferredContactMethod: Joi.string()
    .valid('email', 'phone', 'text')
    .default('email'),

  communicationPreferences: Joi.object({
    emailUpdates: Joi.boolean().default(true),
    smsUpdates: Joi.boolean().default(false),
    callUpdates: Joi.boolean().default(false),
  }).optional(),
});

const updateCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),

  lastName: Joi.string().min(1).max(100).optional(),

  email: Joi.string().email().max(255).optional(),

  phone: Joi.string()
    .pattern(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .optional(),

  alternatePhone: Joi.string()
    .pattern(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .optional(),

  address: Joi.string().max(255).optional(),

  city: Joi.string().max(100).optional(),

  state: Joi.string().max(50).optional(),

  zipCode: Joi.string()
    .pattern(/^[\d\-\s]{5,10}$/)
    .optional(),

  customerType: Joi.string()
    .valid('individual', 'corporate', 'insurance')
    .optional(),

  customerStatus: Joi.string().valid('active', 'inactive', 'vip').optional(),

  companyName: Joi.string().max(255).optional(),

  taxId: Joi.string().max(50).optional(),

  notes: Joi.string().max(1000).optional(),

  preferredContactMethod: Joi.string()
    .valid('email', 'phone', 'text')
    .optional(),

  communicationPreferences: Joi.object({
    emailUpdates: Joi.boolean(),
    smsUpdates: Joi.boolean(),
    callUpdates: Joi.boolean(),
  }).optional(),
}).min(1);

const customerQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(20),

  search: Joi.string().max(255).optional(),

  status: Joi.string().valid('active', 'inactive', 'vip', 'all').optional(),

  type: Joi.string()
    .valid('individual', 'corporate', 'insurance', 'all')
    .optional(),

  sortBy: Joi.string()
    .valid('createdAt', 'firstName', 'lastName', 'email', 'customerNumber')
    .default('createdAt'),

  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

const customerStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'vip').required(),
});

const customerSearchSchema = Joi.object({
  q: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Search query cannot be empty',
    'string.max': 'Search query cannot exceed 255 characters',
    'any.required': 'Search query is required',
  }),

  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerStatusUpdateSchema,
  customerSearchSchema,
};
