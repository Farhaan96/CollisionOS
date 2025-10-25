/**
 * Rate Limiting Middleware for CollisionOS
 * Protects API endpoints from abuse and DoS attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter (applies to most routes)
 * Allows 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict limiter for authentication endpoints
 * Allows 5 requests per 15 minutes per IP (prevents brute force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

/**
 * File upload rate limiter
 * Allows 20 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Upload limit exceeded. Please try again in 1 hour.',
  },
});

/**
 * BMS upload rate limiter
 * Allows 10 BMS uploads per hour
 */
const bmsUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'BMS upload limit exceeded.',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  bmsUploadLimiter,
};
