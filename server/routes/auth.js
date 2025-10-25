const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../database/models');
const { authenticateToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { loginSchema } = require('../schemas/authSchemas');
const {
  asyncHandler,
  errors,
  successResponse,
} = require('../utils/errorHandler');
const { rateLimits } = require('../middleware/security');
const { authRateLimit } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and create session
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
 *       429:
 *         description: Too many login attempts
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/login',
  rateLimits.auth,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    if (authRateLimit.isRateLimited(clientIp)) {
      throw errors.rateLimitExceeded('Too many failed login attempts');
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: username }, { email: username }],
      },
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

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.shopId = user.shopId;

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
      shopId: user.shopId,
    };

    successResponse(
      res,
      {
        user: userData,
      },
      'Login successful'
    );
  })
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/me',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
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
 *     summary: Logout current user and destroy session
 *     tags: [Authentication]
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/logout',
  authenticateToken({ required: false }), // Optional auth since session might be invalid
  asyncHandler(async (req, res) => {
    // Update last logout time if user is authenticated
    if (req.user && req.user.id && req.user.id !== 'dev-user') {
      await User.update(
        { lastLogoutAt: new Date() },
        { where: { id: req.user.id } }
      );
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        throw errors.serverError('Failed to logout');
      }

      // Clear session cookie
      res.clearCookie('collision-os-session');
      successResponse(res, null, 'Logged out successfully');
    });
  })
);

module.exports = router;
