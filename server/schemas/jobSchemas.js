const Joi = require('joi');

const jobStatuses = [
  'estimate',
  'intake',
  'blueprint',
  'parts_ordering',
  'parts_receiving',
  'body_structure',
  'paint_prep',
  'paint_booth',
  'reassembly',
  'quality_control',
  'calibration',
  'detail',
  'ready_pickup',
  'delivered'
];

const createJobSchema = Joi.object({
  customerId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Customer ID must be a number',
      'number.integer': 'Customer ID must be an integer',
      'number.positive': 'Customer ID must be positive',
      'any.required': 'Customer ID is required'
    }),
  
  vehicleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Vehicle ID must be a number',
      'number.integer': 'Vehicle ID must be an integer',
      'number.positive': 'Vehicle ID must be positive',
      'any.required': 'Vehicle ID is required'
    }),
  
  status: Joi.string()
    .valid(...jobStatuses)
    .default('estimate'),
  
  estimateAmount: Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': 'Estimate amount must be a number',
      'number.min': 'Estimate amount cannot be negative'
    }),
  
  totalAmount: Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': 'Total amount must be a number',
      'number.min': 'Total amount cannot be negative'
    }),
  
  assignedTo: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .optional(),
  
  damageDescription: Joi.string()
    .max(2000)
    .optional(),
  
  repairNotes: Joi.string()
    .max(2000)
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium'),
  
  estimatedCompletionDate: Joi.date()
    .iso()
    .optional(),
  
  actualCompletionDate: Joi.date()
    .iso()
    .optional(),
  
  insuranceClaimNumber: Joi.string()
    .max(100)
    .optional(),
  
  insuranceCompany: Joi.string()
    .max(255)
    .optional(),
  
  deductible: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  laborHours: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  laborRate: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
});

const updateJobSchema = Joi.object({
  status: Joi.string()
    .valid(...jobStatuses)
    .optional(),
  
  estimateAmount: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  totalAmount: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  assignedTo: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .optional(),
  
  damageDescription: Joi.string()
    .max(2000)
    .optional(),
  
  repairNotes: Joi.string()
    .max(2000)
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional(),
  
  estimatedCompletionDate: Joi.date()
    .iso()
    .optional(),
  
  actualCompletionDate: Joi.date()
    .iso()
    .optional(),
  
  insuranceClaimNumber: Joi.string()
    .max(100)
    .optional(),
  
  insuranceCompany: Joi.string()
    .max(255)
    .optional(),
  
  deductible: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  laborHours: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  laborRate: Joi.number()
    .precision(2)
    .min(0)
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
}).min(1);

const jobQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  search: Joi.string()
    .max(255)
    .optional(),
  
  status: Joi.string()
    .valid(...jobStatuses, 'all')
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent', 'all')
    .optional(),
  
  assignedTo: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  customerId: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  vehicleId: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  sortBy: Joi.string()
    .valid('createdAt', 'jobNumber', 'status', 'priority', 'estimatedCompletionDate', 'totalAmount')
    .default('createdAt'),
  
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC'),
  
  dateFrom: Joi.date()
    .iso()
    .optional(),
  
  dateTo: Joi.date()
    .iso()
    .optional()
});

const jobStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...jobStatuses)
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': `Status must be one of: ${jobStatuses.join(', ')}`
    }),
  
  notes: Joi.string()
    .max(500)
    .optional()
});

const jobMoveSchema = Joi.object({
  status: Joi.string()
    .valid(...jobStatuses)
    .required(),
  
  notes: Joi.string()
    .max(500)
    .optional(),
  
  assignedTo: Joi.number()
    .integer()
    .positive()
    .optional()
});

const jobAssignmentSchema = Joi.object({
  assignedTo: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Assigned user ID must be a number',
      'number.integer': 'Assigned user ID must be an integer',
      'number.positive': 'Assigned user ID must be positive',
      'any.required': 'Assigned user ID is required'
    }),
  
  notes: Joi.string()
    .max(500)
    .optional()
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
  jobStatusUpdateSchema,
  jobMoveSchema,
  jobAssignmentSchema,
  jobStatuses
};