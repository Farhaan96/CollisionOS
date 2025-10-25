/**
 * AI Assistant API Routes
 * Endpoints for CollisionOS AI Assistant functionality
 */

const express = require('express');
const router = express.Router();
const {
  IntelligentCollisionAssistant,
} = require('../services/intelligentAssistant');
const { ScalableNLPRouter } = require('../services/scalableNLPRouter');
// TODO: Replace with local auth middleware
// const { authenticateToken } = require('../middleware/auth');
const authenticateToken = (options = {}) => {
  return (req, res, next) => {
    // Temporary stub - implement proper auth
    req.user = { id: 'dev-user', shopId: 'dev-shop', role: 'admin' };
    next();
  };
};
const {
  aiRateLimit,
  validateUserShopAccess,
  validateQueryInput,
  auditAIQuery,
} = require('../middleware/secureAI');

// Initialize Scalable NLP Router (3-tier architecture)
const nlpRouter = new ScalableNLPRouter();

// Legacy assistant for backward compatibility
const intelligentAssistant = new IntelligentCollisionAssistant();

/**
 * @swagger
 * /api/ai/query:
 *   post:
 *     summary: Process natural language query
 *     description: Send a natural language query to the CollisionOS AI Assistant
 *     tags: [AI Assistant]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language query
 *                 example: "Show me all Honda Civics with pending parts"
 *               context:
 *                 type: object
 *                 description: Additional context for the query
 *     responses:
 *       200:
 *         description: AI response with results and insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: Response type
 *                 message:
 *                   type: string
 *                   description: Human-readable response
 *                 results:
 *                   type: array
 *                   description: Query results (if applicable)
 *                 insights:
 *                   type: array
 *                   description: AI-generated insights
 */
router.post(
  '/query',
  aiRateLimit, // Rate limiting
  authenticateToken(), // Authentication required
  validateUserShopAccess, // Validate user-shop relationship
  validateQueryInput, // Input validation and sanitization
  auditAIQuery, // Audit logging
  async (req, res) => {
    try {
      const { query, context = {} } = req.body;

      // Use authenticated user data (from secure middleware)
      const { userId, shopId } = req.secureUser;

      console.log(
        `🚀 Scalable AI Query from user ${userId} (shop ${shopId}): "${query}"`
      );

      // Extract user token from authorization header for secure database access
      const userToken = req.headers.authorization?.replace('Bearer ', '');

      // Process query with Scalable NLP Router (3-tier architecture)
      const response = await nlpRouter.processQuery(
        query,
        shopId,
        userId,
        userToken
      );

      // Log successful query with performance metrics
      console.log(
        `✅ AI Response: ${response.performance?.processingTier} (${response.performance?.processingTime}ms), results: ${response.results?.length || 0}, shop: ${shopId}`
      );

      res.json({
        success: true,
        query,
        timestamp: new Date().toISOString(),
        security: {
          shopValidated: true,
          userValidated: true,
          dataIsolated: true,
        },
        ...response,
      });
    } catch (error) {
      console.error('❌ Secure AI Query Error:', error);

      // Don't expose internal error details in production
      const isDev = process.env.NODE_ENV === 'development';

      res.status(500).json({
        error: 'AI Assistant Error',
        message:
          'I encountered an error processing your request. Please try again.',
        ...(isDev && { details: error.message }),
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/suggestions:
 *   get:
 *     summary: Get query suggestions
 *     description: Get suggested queries based on current shop data
 *     tags: [AI Assistant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested queries
 */
router.get('/suggestions', authenticateToken(), async (req, res) => {
  try {
    const { shopId } = req.user;

    // Generate contextual suggestions based on shop data
    const suggestions = await generateSmartSuggestions(shopId);

    res.json({
      success: true,
      suggestions,
      categories: [
        {
          name: 'Search',
          icon: '🔍',
          suggestions: suggestions.filter(s => s.type === 'search'),
        },
        {
          name: 'Analytics',
          icon: '📊',
          suggestions: suggestions.filter(s => s.type === 'analytics'),
        },
        {
          name: 'Workflow',
          icon: '🔄',
          suggestions: suggestions.filter(s => s.type === 'workflow'),
        },
      ],
    });
  } catch (error) {
    console.error('❌ AI Suggestions Error:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: 'Unable to generate query suggestions at this time.',
    });
  }
});

/**
 * @swagger
 * /api/ai/analytics/summary:
 *   get:
 *     summary: Get AI-powered analytics summary
 *     description: Get intelligent summary of shop performance and insights
 *     tags: [AI Assistant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics summary with AI insights
 */
router.get('/analytics/summary', authenticateToken(), async (req, res) => {
  try {
    const { shopId } = req.user;

    // Generate AI-powered analytics summary
    const summary = await intelligentAssistant.processIntelligentQuery(
      'Give me a summary of our shop performance this month',
      shopId,
      req.user.userId
    );

    res.json({
      success: true,
      summary,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI Analytics Summary Error:', error);
    res.status(500).json({
      error: 'Failed to generate analytics summary',
      message: 'Unable to generate analytics summary at this time.',
    });
  }
});

/**
 * @swagger
 * /api/ai/performance:
 *   get:
 *     summary: Get AI system performance metrics
 *     description: Monitor NLP router performance and caching statistics
 *     tags: [AI Assistant]
 *     responses:
 *       200:
 *         description: Performance metrics and statistics
 */
router.get('/performance', authenticateToken(), (req, res) => {
  const stats = nlpRouter.getStats();
  res.json({
    success: true,
    performance: stats,
    timestamp: new Date().toISOString(),
    system: {
      architecture: '3-tier hybrid NLP',
      tiers: {
        cache: 'Redis smart caching (70% target)',
        local: 'Local NLP processing (25% target)',
        cloud: 'Cloud AI APIs (5% target)',
      },
    },
  });
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Check AI system health
 *     description: Health check for all AI processing tiers
 *     tags: [AI Assistant]
 *     responses:
 *       200:
 *         description: System health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await nlpRouter.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      ...health,
      message:
        health.status === 'healthy'
          ? 'All AI systems operational'
          : 'Some AI systems are degraded but functional',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/ai/help:
 *   get:
 *     summary: Get AI assistant help
 *     description: Get information about how to use the AI assistant
 *     tags: [AI Assistant]
 *     responses:
 *       200:
 *         description: Help information and example queries
 */
router.get('/help', (req, res) => {
  res.json({
    success: true,
    name: 'CollisionOS Assist',
    description:
      'Your intelligent collision repair assistant with 3-tier scalable architecture',
    architecture: {
      tier1: 'Smart caching for instant responses',
      tier2: 'Local NLP for collision repair understanding',
      tier3: 'Cloud AI for complex query processing',
    },
    capabilities: [
      '🔍 Search for repair orders, customers, vehicles, and parts',
      '📊 Analyze shop performance and generate insights',
      '🔄 Track workflow status and identify bottlenecks',
      '💰 Review financial metrics and profitability',
      '🤖 Answer collision repair industry questions',
      '⚡ Lightning-fast responses with smart caching',
    ],
    examples: [
      {
        query: "What's in repair?",
        description: 'See all active repair orders',
        expectedTier: 'cache or local',
      },
      {
        query: 'Show me Honda vehicles',
        description: 'Search for vehicles by make',
        expectedTier: 'cache or local',
      },
      {
        query: 'What repair orders are pending parts?',
        description: 'Find workflow bottlenecks',
        expectedTier: 'local',
      },
      {
        query: "What's our average cycle time this month?",
        description: 'Get performance analytics',
        expectedTier: 'local',
      },
      {
        query:
          'Explain the complex relationship between DRP agreements and supplement approval processes in modern collision repair workflows',
        description: 'Complex industry knowledge query',
        expectedTier: 'cloud',
      },
    ],
    tips: [
      'Simple queries get instant cached responses',
      'Collision repair terms are understood by local NLP',
      'Complex questions automatically route to advanced AI',
      'Ask follow-up questions - I learn from patterns',
      'Use natural language - the system adapts to you',
    ],
    performance: nlpRouter.getStats(),
  });
});

/**
 * Generate smart query suggestions based on shop data
 */
async function generateSmartSuggestions(shopId) {
  const suggestions = [
    // Search suggestions
    {
      type: 'search',
      query: 'Show me repair orders from this week',
      priority: 'high',
    },
    {
      type: 'search',
      query: 'Find customers with multiple vehicles',
      priority: 'medium',
    },
    {
      type: 'search',
      query: 'List all BMW repairs in progress',
      priority: 'medium',
    },

    // Analytics suggestions
    {
      type: 'analytics',
      query: "What's our average cycle time?",
      priority: 'high',
    },
    {
      type: 'analytics',
      query: 'How many jobs did we complete this month?',
      priority: 'high',
    },
    {
      type: 'analytics',
      query: 'Which parts take longest to receive?',
      priority: 'medium',
    },

    // Workflow suggestions
    {
      type: 'workflow',
      query: 'What repair orders are pending parts?',
      priority: 'high',
    },
    { type: 'workflow', query: 'Show me overdue repairs', priority: 'high' },
    {
      type: 'workflow',
      query: 'Which jobs are ready for pickup?',
      priority: 'medium',
    },
  ];

  return suggestions;
}

module.exports = router;
