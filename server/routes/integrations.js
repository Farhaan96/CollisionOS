/**
 * Third-Party Integrations API Routes
 * Handles insurance companies, parts suppliers, and other external API integrations
 */

const express = require('express');
const router = express.Router();
const {
  asyncHandler,
  successResponse,
  errors,
} = require('../utils/errorHandler');
const { integrationManager } = require('../services/integrationFramework');
const {
  InsuranceIntegrationService,
  MitchellProvider,
  CCCProvider,
  AudatexProvider,
} = require('../services/insuranceIntegration');
const {
  PartsSupplierIntegrationService,
  LKQProvider,
  GPCProvider,
  AutoZoneProvider,
  HollanderProvider,
} = require('../services/partsSupplierIntegration');

// Initialize integration services
const insuranceService = new InsuranceIntegrationService();
const partsSupplierService = new PartsSupplierIntegrationService();

// Note: Services are managed independently, not registered with the global manager
// Individual providers are registered with services as needed

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Get all integration providers status
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: List of all integration providers
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Get statistics from individual services
    const insuranceStats = insuranceService.getStatistics();
    const partsStats = partsSupplierService.getStatistics();

    successResponse(
      res,
      {
        statistics: {
          totalProviders:
            insuranceStats.totalProviders + partsStats.totalProviders,
          providers: {
            insurance: insuranceStats,
            partsSupplier: partsStats,
          },
        },
        providers: {
          insurance: insuranceService.getStatistics(),
          partsSupplier: partsSupplierService.getStatistics(),
        },
      },
      'Integration providers retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/integrations/health:
 *   get:
 *     summary: Health check all integration providers
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: Health status of all providers
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const insuranceHealth = await insuranceService.healthCheck();
    const partsHealth = await partsSupplierService.healthCheck();

    successResponse(
      res,
      {
        insurance: insuranceHealth,
        partsSuppliers: partsHealth,
        timestamp: new Date().toISOString(),
      },
      'Health check completed'
    );
  })
);

// Insurance Integration Routes

/**
 * @swagger
 * /api/integrations/insurance/providers:
 *   get:
 *     summary: Get registered insurance providers
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: List of insurance providers
 */
router.get(
  '/insurance/providers',
  asyncHandler(async (req, res) => {
    const providers = insuranceService.getProviders();
    successResponse(res, providers, 'Insurance providers retrieved');
  })
);

/**
 * @swagger
 * /api/integrations/insurance/providers:
 *   post:
 *     summary: Register new insurance provider
 *     tags: [Insurance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [mitchell, ccc, audatex, custom]
 *               credentials:
 *                 type: object
 *     responses:
 *       200:
 *         description: Insurance provider registered successfully
 */
router.post(
  '/insurance/providers',
  asyncHandler(async (req, res) => {
    const { name, type, credentials } = req.body;

    if (!name || !type || !credentials) {
      throw errors.missingField('name, type, and credentials are required');
    }

    let provider;
    switch (type.toLowerCase()) {
      case 'mitchell':
        provider = new MitchellProvider(credentials);
        break;
      case 'ccc':
        provider = new CCCProvider(credentials);
        break;
      case 'audatex':
        provider = new AudatexProvider(credentials);
        break;
      default:
        throw errors.invalidField('type', 'Must be mitchell, ccc, or audatex');
    }

    insuranceService.registerProvider(name, provider);

    successResponse(
      res,
      { name, type },
      'Insurance provider registered successfully',
      201
    );
  })
);

/**
 * @swagger
 * /api/integrations/insurance/claims:
 *   post:
 *     summary: Submit insurance claim
 *     tags: [Insurance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               claimData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Claim submitted successfully
 */
router.post(
  '/insurance/claims',
  asyncHandler(async (req, res) => {
    const { provider, claimData } = req.body;

    if (!provider || !claimData) {
      throw errors.missingField('provider and claimData are required');
    }

    const result = await insuranceService.submitClaim(provider, claimData);

    successResponse(res, result, 'Claim submitted successfully');
  })
);

/**
 * @swagger
 * /api/integrations/insurance/estimates:
 *   post:
 *     summary: Submit estimate for approval
 *     tags: [Insurance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               estimateData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Estimate submitted successfully
 */
router.post(
  '/insurance/estimates',
  asyncHandler(async (req, res) => {
    const { provider, estimateData } = req.body;

    if (!provider || !estimateData) {
      throw errors.missingField('provider and estimateData are required');
    }

    const result = await insuranceService.submitEstimate(
      provider,
      estimateData
    );

    successResponse(res, result, 'Estimate submitted successfully');
  })
);

/**
 * @swagger
 * /api/integrations/insurance/claims/{claimNumber}/status:
 *   get:
 *     summary: Get claim status
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: claimNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claim status retrieved
 */
router.get(
  '/insurance/claims/:claimNumber/status',
  asyncHandler(async (req, res) => {
    const { claimNumber } = req.params;
    const { provider } = req.query;

    if (!provider) {
      throw errors.missingField('provider query parameter is required');
    }

    const status = await insuranceService.getClaimStatus(provider, claimNumber);

    successResponse(res, status, 'Claim status retrieved');
  })
);

// Parts Supplier Integration Routes

/**
 * @swagger
 * /api/integrations/parts/providers:
 *   get:
 *     summary: Get registered parts supplier providers
 *     tags: [Parts]
 *     responses:
 *       200:
 *         description: List of parts supplier providers
 */
router.get(
  '/parts/providers',
  asyncHandler(async (req, res) => {
    const providers = partsSupplierService.getProviders();
    successResponse(res, providers, 'Parts supplier providers retrieved');
  })
);

/**
 * @swagger
 * /api/integrations/parts/providers:
 *   post:
 *     summary: Register new parts supplier provider
 *     tags: [Parts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lkq, gpc, autozone, hollander, custom]
 *               credentials:
 *                 type: object
 *     responses:
 *       200:
 *         description: Parts supplier provider registered successfully
 */
router.post(
  '/parts/providers',
  asyncHandler(async (req, res) => {
    const { name, type, credentials } = req.body;

    if (!name || !type || !credentials) {
      throw errors.missingField('name, type, and credentials are required');
    }

    let provider;
    switch (type.toLowerCase()) {
      case 'lkq':
        provider = new LKQProvider(credentials);
        break;
      case 'gpc':
        provider = new GPCProvider(credentials);
        break;
      case 'autozone':
        provider = new AutoZoneProvider(credentials);
        break;
      case 'hollander':
        provider = new HollanderProvider(credentials);
        break;
      default:
        throw errors.invalidField(
          'type',
          'Must be lkq, gpc, autozone, or hollander'
        );
    }

    partsSupplierService.registerProvider(name, provider);

    successResponse(
      res,
      { name, type },
      'Parts supplier provider registered successfully',
      201
    );
  })
);

/**
 * @swagger
 * /api/integrations/parts/search:
 *   post:
 *     summary: Search parts across suppliers
 *     tags: [Parts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchCriteria:
 *                 type: object
 *               providers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Parts search results
 */
router.post(
  '/parts/search',
  asyncHandler(async (req, res) => {
    const { searchCriteria, providers } = req.body;

    if (!searchCriteria) {
      throw errors.missingField('searchCriteria is required');
    }

    const results = await partsSupplierService.searchParts(
      searchCriteria,
      providers
    );

    successResponse(res, results, 'Parts search completed');
  })
);

/**
 * @swagger
 * /api/integrations/parts/pricing/compare:
 *   post:
 *     summary: Compare prices across suppliers
 *     tags: [Parts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               providers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Price comparison results
 */
router.post(
  '/parts/pricing/compare',
  asyncHandler(async (req, res) => {
    const { partNumbers, providers } = req.body;

    if (
      !partNumbers ||
      !Array.isArray(partNumbers) ||
      partNumbers.length === 0
    ) {
      throw errors.missingField('partNumbers array is required');
    }

    const comparison = await partsSupplierService.comparePrices(
      partNumbers,
      providers
    );

    successResponse(res, comparison, 'Price comparison completed');
  })
);

/**
 * @swagger
 * /api/integrations/parts/orders:
 *   post:
 *     summary: Create parts order with best price strategy
 *     tags: [Parts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderData:
 *                 type: object
 *               strategy:
 *                 type: string
 *                 enum: [best_price, fastest_delivery, preferred_supplier]
 *     responses:
 *       200:
 *         description: Orders created successfully
 */
router.post(
  '/parts/orders',
  asyncHandler(async (req, res) => {
    const { orderData, strategy = 'best_price' } = req.body;

    if (!orderData) {
      throw errors.missingField('orderData is required');
    }

    let result;
    switch (strategy) {
      case 'best_price':
        result = await partsSupplierService.createOrderWithBestPrice(orderData);
        break;
      default:
        throw errors.invalidField(
          'strategy',
          'Only best_price strategy is currently supported'
        );
    }

    successResponse(res, result, 'Orders created successfully');
  })
);

// Webhook Endpoints

/**
 * @swagger
 * /api/integrations/webhooks/{provider}/{eventType}:
 *   post:
 *     summary: Handle webhook from integration provider
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post(
  '/webhooks/:provider/:eventType',
  asyncHandler(async (req, res) => {
    const { provider, eventType } = req.params;
    const signature =
      req.headers['x-signature'] || req.headers['x-hub-signature-256'];
    const payload = req.body;

    const result = await integrationManager.handleWebhook(
      provider,
      eventType,
      payload,
      signature
    );

    successResponse(res, result, 'Webhook processed');
  })
);

// Configuration Management

/**
 * @swagger
 * /api/integrations/config:
 *   get:
 *     summary: Get integration configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Integration configuration
 */
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    const config = {
      supportedInsuranceProviders: ['mitchell', 'ccc', 'audatex'],
      supportedPartsSuppliers: ['lkq', 'gpc', 'autozone', 'hollander'],
      features: {
        realTimeUpdates: true,
        webhookSupport: true,
        priceComparison: true,
        automaticOrdering: true,
      },
      rateLimits: {
        requestsPerMinute: 60,
        burstLimit: 10,
      },
    };

    successResponse(res, config, 'Integration configuration retrieved');
  })
);

module.exports = router;
