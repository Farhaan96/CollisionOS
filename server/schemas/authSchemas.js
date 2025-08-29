const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.alternatives()
    .try(
      Joi.string().alphanum().min(3).max(50),
      Joi.string().email().max(255)
    )
    .required()
    .messages({
      'alternatives.match': 'Username must be a valid username (alphanumeric) or email address',
      'any.required': 'Username or email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    })
});

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required(),
  
  email: Joi.string()
    .email()
    .max(255)
    .required(),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .required(),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .required(),
  
  role: Joi.string()
    .valid('admin', 'manager', 'technician', 'advisor')
    .required(),
  
  department: Joi.string()
    .max(100)
    .optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required(),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirm password must match new password'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required(),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirm password must match new password'
    })
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};