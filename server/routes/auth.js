const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../database/models');
const { authenticateToken: legacyAuth } = require('../middleware/authEnhanced');
const { authenticateToken, loginWithSupabase } = require('../middleware/authSupabase');
const { validateBody } = require('../middleware/validation');
const { loginSchema } = require('../schemas/authSchemas');
const { asyncHandler, errors, successResponse } = require('../utils/errorHandler');
const { rateLimits } = require('../middleware/security');
const { isSupabaseEnabled } = require('../config/supabase');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or account disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Invalid credentials'
 *       429:
 *         description: Too many login attempts
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', 
  rateLimits.auth,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    try {
      // Try Supabase authentication first if enabled
      if (isSupabaseEnabled) {
        try {
          const result = await loginWithSupabase(username, password);
          return successResponse(res, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
            expiresIn: '1h',
            provider: 'supabase'
          }, 'Login successful');
        } catch (supabaseError) {
          console.log('Supabase login failed, trying legacy:', supabaseError.message);
        }
      }

      // Fallback to legacy authentication
      const { authRateLimit } = require('../middleware/authEnhanced');
      if (authRateLimit.isRateLimited(clientIp)) {
        throw errors.rateLimitExceeded('Too many failed login attempts');
      }

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: username },
            { email: username }
          ]
        }
      });

      if (!user) {
        authRateLimit.recordFailedAttempt(clientIp);
        throw errors.invalidCredentials();
      }

      // Check if user is active
      if (!user.isActive) {
        authRateLimit.recordFailedAttempt(clientIp);
        throw errors.accountDisabled();
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        authRateLimit.recordFailedAttempt(clientIp);
        throw errors.invalidCredentials();
      }

      // Clear failed attempts on successful login
      authRateLimit.clearAttempts(clientIp);

      // Generate JWT tokens
      const { generateAccessToken, generateRefreshToken } = require('../middleware/authEnhanced');
      const tokenPayload = { userId: user.id, role: user.role, shopId: user.shopId };
      
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Return user data without password
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        shopId: user.shopId
      };

      successResponse(res, {
        accessToken,
        refreshToken,
        user: userData,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        provider: 'legacy'
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  })
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', 
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw errors.userNotFound();
    }

    successResponse(res, user, 'User information retrieved successfully');
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Logged out successfully'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', 
  authenticateToken(),
  asyncHandler(async (req, res) => {
    // Update last logout time
    await User.update(
      { lastLogoutAt: new Date() },
      { where: { id: req.user.id } }
    );

    successResponse(res, null, 'Logged out successfully');
  })
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: JWT refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                   example: '1h'
 *       400:
 *         description: Refresh token missing
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh', 
  rateLimits.auth,
  asyncHandler(async (req, res) => {
    const { refreshTokenHandler } = require('../middleware/authEnhanced');
    return refreshTokenHandler(req, res);
  })
);

module.exports = router;
