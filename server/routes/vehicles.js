const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { Vehicle, Customer, Shop } = require('../database/models');
const VINDecoder = require('../services/vinDecoder');
const { ValidationError, NotFoundError, ApiError } = require('../utils/errorHandler');

// Rate limiting for VIN decoding API calls
const vinDecodeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 VIN decodes per windowMs
  message: {
    error: 'Too many VIN decode requests, please try again later',
    retryAfter: Math.ceil(15 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const vinDecoder = new VINDecoder();

/**
 * @swagger
 * /api/vehicles/decode-vin:
 *   post:
 *     summary: Decode VIN (Vehicle Identification Number)
 *     description: Decode a VIN using NHTSA API with local fallback and caching
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *             properties:
 *               vin:
 *                 type: string
 *                 description: 17-character Vehicle Identification Number
 *                 example: "1HGBH41JXMN109186"
 *               useApiOnly:
 *                 type: boolean
 *                 description: Force API usage, skip local fallback
 *                 default: false
 *     responses:
 *       200:
 *         description: VIN successfully decoded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 source:
 *                   type: string
 *                   enum: [nhtsa_api, local_decoder, cache]
 *                   example: "nhtsa_api"
 *                 vehicle:
 *                   type: object
 *                   properties:
 *                     vin:
 *                       type: string
 *                       example: "1HGBH41JXMN109186"
 *                     year:
 *                       type: integer
 *                       example: 1991
 *                     make:
 *                       type: string
 *                       example: "Honda"
 *                     model:
 *                       type: string
 *                       example: "Accord"
 *                     trim:
 *                       type: string
 *                       example: "LX"
 *                     engine:
 *                       type: string
 *                       example: "2.2L 4cyl"
 *                     transmission:
 *                       type: string
 *                       example: "Automatic"
 *                     drivetrain:
 *                       type: string
 *                       example: "FWD"
 *                     body_type:
 *                       type: string
 *                       example: "sedan"
 *                     doors:
 *                       type: integer
 *                       example: 4
 *                     manufacturer:
 *                       type: string
 *                       example: "Honda Motor Company"
 *                     plant_country:
 *                       type: string
 *                       example: "Japan"
 *                     vehicle_type:
 *                       type: string
 *                       example: "Passenger Car"
 *                     fuel_type:
 *                       type: string
 *                       example: "gasoline"
 *       400:
 *         description: Invalid VIN format
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error or API unavailable
 */
router.post('/decode-vin', 
  vinDecodeLimit,
  [
    body('vin')
      .isString()
      .trim()
      .isLength({ min: 17, max: 17 })
      .withMessage('VIN must be exactly 17 characters')
      .matches(/^[A-HJ-NPR-Z0-9]{17}$/i)
      .withMessage('VIN contains invalid characters'),
    body('useApiOnly')
      .optional()
      .isBoolean()
      .withMessage('useApiOnly must be boolean')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { vin, useApiOnly = false } = req.body;

      // Decode VIN
      const result = await vinDecoder.decode(vin, useApiOnly);

      res.json(result);

    } catch (error) {
      console.error('VIN decode error:', error);

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid VIN',
          message: error.message
        });
      }

      if (error instanceof ApiError) {
        return res.status(503).json({
          success: false,
          error: 'Service unavailable',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'VIN decoding failed',
        message: 'An unexpected error occurred while decoding the VIN'
      });
    }
  }
);

/**
 * @swagger
 * /api/vehicles/validate-vin:
 *   post:
 *     summary: Validate VIN format
 *     description: Validate VIN format and check digit without decoding
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *             properties:
 *               vin:
 *                 type: string
 *                 description: VIN to validate
 *                 example: "1HGBH41JXMN109186"
 *     responses:
 *       200:
 *         description: VIN validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 vin:
 *                   type: string
 *                   example: "1HGBH41JXMN109186"
 *                 normalized_vin:
 *                   type: string
 *                   example: "1HGBH41JXMN109186"
 *                 checks:
 *                   type: object
 *                   properties:
 *                     length:
 *                       type: boolean
 *                       example: true
 *                     characters:
 *                       type: boolean  
 *                       example: true
 *                     check_digit:
 *                       type: boolean
 *                       example: true
 */
router.post('/validate-vin',
  [
    body('vin')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('VIN is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          valid: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { vin } = req.body;
      
      // Perform validation checks
      const result = {
        valid: false,
        vin: vin,
        normalized_vin: null,
        checks: {
          length: false,
          characters: false,
          check_digit: false
        },
        errors: []
      };

      try {
        // Remove spaces and convert to uppercase
        const normalizedVIN = vin.replace(/\s/g, '').toUpperCase();
        result.normalized_vin = normalizedVIN;

        // Check length
        if (normalizedVIN.length === 17) {
          result.checks.length = true;
        } else {
          result.errors.push(`Invalid length: expected 17 characters, got ${normalizedVIN.length}`);
        }

        // Check characters (no I, O, Q allowed)
        if (!/[IOQ]/i.test(normalizedVIN) && /^[A-HJ-NPR-Z0-9]{17}$/i.test(normalizedVIN)) {
          result.checks.characters = true;
        } else {
          result.errors.push('Invalid characters detected (I, O, Q not allowed)');
        }

        // Check digit validation
        if (result.checks.length && result.checks.characters) {
          if (vinDecoder.validateCheckDigit(normalizedVIN)) {
            result.checks.check_digit = true;
          } else {
            result.errors.push('Check digit validation failed');
          }
        }

        result.valid = result.checks.length && result.checks.characters && result.checks.check_digit;

      } catch (error) {
        result.errors.push(error.message);
      }

      res.json(result);

    } catch (error) {
      console.error('VIN validation error:', error);
      res.status(500).json({
        valid: false,
        error: 'Validation failed',
        message: 'An unexpected error occurred during VIN validation'
      });
    }
  }
);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get vehicles
 *     description: Get list of vehicles with optional filtering
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: vin
 *         schema:
 *           type: string
 *         description: Filter by VIN
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by make
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by model
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of vehicles
 *       400:
 *         description: Invalid query parameters
 */
router.get('/',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be 0 or greater'),
    query('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be valid'),
    query('vin')
      .optional()
      .isLength({ min: 17, max: 17 })
      .withMessage('VIN must be 17 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const {
        customerId,
        vin,
        year,
        make,
        model,
        limit = 20,
        offset = 0
      } = req.query;

      // Build where clause
      const where = {
        shopId: req.user.shopId,
        isActive: true
      };

      if (customerId) where.customerId = customerId;
      if (vin) where.vin = vin.toUpperCase();
      if (year) where.year = year;
      if (make) where.make = { [require('sequelize').Op.iLike]: `%${make}%` };
      if (model) where.model = { [require('sequelize').Op.iLike]: `%${model}%` };

      const { count, rows: vehicles } = await Vehicle.findAndCountAll({
        where,
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: vehicles,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicles'
      });
    }
  }
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     description: Get detailed information about a specific vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 */
router.get('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const vehicle = await Vehicle.findOne({
        where: {
          id: req.params.id,
          shopId: req.user.shopId
        },
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }]
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      res.json({
        success: true,
        data: vehicle
      });

    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicle'
      });
    }
  }
);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create new vehicle
 *     description: Create a new vehicle record, optionally with VIN decoding
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - vin
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number
 *               decodeVin:
 *                 type: boolean
 *                 default: true
 *                 description: Auto-decode VIN data
 *               year:
 *                 type: integer
 *                 description: Vehicle year (required if decodeVin is false)
 *               make:
 *                 type: string
 *                 description: Vehicle make (required if decodeVin is false)
 *               model:
 *                 type: string
 *                 description: Vehicle model (required if decodeVin is false)
 *               trim:
 *                 type: string
 *                 description: Vehicle trim
 *               color:
 *                 type: string
 *                 description: Vehicle color
 *               licensePlate:
 *                 type: string
 *                 description: License plate number
 *               mileage:
 *                 type: integer
 *                 description: Current mileage
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  [
    body('customerId')
      .isUUID()
      .withMessage('Customer ID must be a valid UUID'),
    body('vin')
      .isString()
      .trim()
      .isLength({ min: 17, max: 17 })
      .withMessage('VIN must be exactly 17 characters'),
    body('decodeVin')
      .optional()
      .isBoolean()
      .withMessage('decodeVin must be boolean'),
    body('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be valid'),
    body('make')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Make must be 1-100 characters'),
    body('model')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Model must be 1-100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const {
        customerId,
        vin,
        decodeVin = true,
        year,
        make,
        model,
        trim,
        color,
        licensePlate,
        mileage
      } = req.body;

      // Verify customer exists and belongs to shop
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          shopId: req.user.shopId
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Check if VIN already exists
      const existingVehicle = await Vehicle.findOne({
        where: { vin: vin.toUpperCase() }
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          error: 'Vehicle with this VIN already exists'
        });
      }

      let vehicleData = {
        customerId,
        shopId: req.user.shopId,
        vin: vin.toUpperCase(),
        year,
        make,
        model,
        trim,
        color,
        licensePlate,
        mileage,
        isActive: true
      };

      // Auto-decode VIN if requested
      if (decodeVin) {
        try {
          const decoded = await vinDecoder.decode(vin);
          if (decoded.success) {
            // Merge decoded data with provided data (user data takes precedence)
            const decodedVehicle = decoded.vehicle;
            vehicleData = {
              ...vehicleData,
              year: vehicleData.year || decodedVehicle.year,
              make: vehicleData.make || decodedVehicle.make,
              model: vehicleData.model || decodedVehicle.model,
              trim: vehicleData.trim || decodedVehicle.trim,
              engineSize: decodedVehicle.engine,
              transmission: decodedVehicle.transmission,
              bodyStyle: vinDecoder.mapBodyTypeToEnum(decodedVehicle.body_type),
              fuelType: vinDecoder.mapFuelTypeToEnum(decodedVehicle.fuel_type),
              features: {
                ...vehicleData.features,
                decoded_data: decodedVehicle,
                decoded_at: new Date().toISOString()
              }
            };
          }
        } catch (decodeError) {
          console.warn('VIN decode failed during vehicle creation:', decodeError.message);
          // Continue with manual data if decode fails
        }
      }

      // Validate required fields after decoding
      if (!vehicleData.year || !vehicleData.make || !vehicleData.model) {
        return res.status(400).json({
          success: false,
          error: 'Year, make, and model are required (either provided or decoded from VIN)'
        });
      }

      const vehicle = await Vehicle.create(vehicleData);

      res.status(201).json({
        success: true,
        data: vehicle,
        message: 'Vehicle created successfully'
      });

    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create vehicle'
      });
    }
  }
);

/**
 * @swagger
 * /api/vehicles/batch-decode:
 *   post:
 *     summary: Batch decode multiple VINs
 *     description: Decode multiple VINs in a single request (max 10)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vins
 *             properties:
 *               vins:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 description: Array of VINs to decode (max 10)
 *                 example: ["1HGBH41JXMN109186", "1G1ZT51816F100000"]
 *     responses:
 *       200:
 *         description: Batch decode results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vin:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       vehicle:
 *                         type: object
 *                       error:
 *                         type: string
 */
router.post('/batch-decode',
  vinDecodeLimit,
  [
    body('vins')
      .isArray({ min: 1, max: 10 })
      .withMessage('VINs array must contain 1-10 VINs')
      .custom((vins) => {
        if (!Array.isArray(vins)) return false;
        return vins.every(vin => 
          typeof vin === 'string' && 
          vin.replace(/\s/g, '').length === 17
        );
      })
      .withMessage('All VINs must be 17-character strings')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { vins } = req.body;
      const results = [];

      // Process VINs concurrently with Promise.allSettled
      const promises = vins.map(async (vin) => {
        try {
          const result = await vinDecoder.decode(vin);
          return {
            vin,
            success: true,
            vehicle: result.vehicle,
            source: result.source
          };
        } catch (error) {
          return {
            vin,
            success: false,
            error: error.message
          };
        }
      });

      const settled = await Promise.allSettled(promises);
      
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            vin: vins[index],
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        results,
        summary: {
          total: vins.length,
          successful: successCount,
          failed: vins.length - successCount
        }
      });

    } catch (error) {
      console.error('Batch VIN decode error:', error);
      res.status(500).json({
        success: false,
        error: 'Batch VIN decoding failed'
      });
    }
  }
);

module.exports = router;