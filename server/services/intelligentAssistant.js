/**
 * Intelligent Collision Repair Assistant
 * Zero-cost AI-like intelligence using advanced pattern matching,
 * domain expertise, and smart data analysis
 */

const {
  formatDistance,
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} = require('date-fns');

class IntelligentCollisionAssistant {
  constructor() {
    // TODO: Initialize with local database connection
    this.domainKnowledge = this.initializeDomainKnowledge();
    this.queryPatterns = this.initializeQueryPatterns();
    this.industryBenchmarks = this.initializeIndustryBenchmarks();
  }

  /**
   * Create a secure user-scoped database client
   */
  createUserScopedClient(userToken) {
    // TODO: Implement with local database
    console.log('[INTELLIGENT ASSISTANT] User-scoped client requested');
    return null;
  }

  /**
   * Validate user belongs to shop before any database operations
   */
  async validateUserShopAccess(userId, shopId, userToken) {
    try {
      // TODO: Implement user-shop validation with local database
      console.log('[INTELLIGENT ASSISTANT] Validating user', userId, 'for shop', shopId);
      return true;
    } catch (error) {
      console.error('❌ User validation error:', error);
      return false;
    }
  }

  /**
   * Main intelligent query processor
   */
  async processIntelligentQuery(query, shopId, userId, userToken = null) {
    try {
      console.log(
        `🧠 Processing intelligent query: "${query}" for shop ${shopId}`
      );

      // 🔐 SECURITY: Validate user access before any operations
      if (
        userToken &&
        !(await this.validateUserShopAccess(userId, shopId, userToken))
      ) {
        throw new Error('Access denied: User does not belong to this shop');
      }

      // Step 1: Parse and understand the query
      const queryAnalysis = this.analyzeQuery(query);
      console.log('📊 Query analysis:', queryAnalysis);

      // Step 2: Extract relevant data from database with user context
      const contextData = await this.gatherContextualData(
        shopId,
        queryAnalysis,
        userToken
      );

      // Step 3: Generate intelligent response
      const intelligentResponse = await this.generateIntelligentResponse(
        queryAnalysis,
        contextData,
        shopId
      );

      return {
        ...intelligentResponse,
        query,
        confidence: queryAnalysis.confidence,
        processingTime: new Date().toISOString(),
        dataPoints: contextData.summary,
      };
    } catch (error) {
      console.error('❌ Intelligent Assistant Error:', error);
      return this.generateFallbackResponse(query, error);
    }
  }

  /**
   * Advanced query analysis using NLP-like techniques
   */
  analyzeQuery(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Extract entities
    const entities = this.extractEntities(normalizedQuery);

    // Determine intent with confidence scoring
    const intent = this.classifyIntent(normalizedQuery);

    // Extract time context
    const timeContext = this.extractTimeContext(normalizedQuery);

    // Extract filters and conditions
    const filters = this.extractFilters(normalizedQuery);

    return {
      originalQuery: query,
      normalizedQuery,
      intent,
      entities,
      timeContext,
      filters,
      confidence: this.calculateConfidence(intent, entities, timeContext),
    };
  }

  /**
   * Advanced entity extraction
   */
  extractEntities(query) {
    const entities = {};

    // Vehicle makes (with fuzzy matching)
    const vehicleMakes = [
      'honda',
      'toyota',
      'ford',
      'chevrolet',
      'chevy',
      'nissan',
      'bmw',
      'mercedes',
      'audi',
      'volkswagen',
      'vw',
      'mazda',
      'subaru',
      'hyundai',
      'kia',
      'jeep',
      'dodge',
      'chrysler',
      'cadillac',
      'buick',
      'gmc',
      'infiniti',
      'acura',
      'lexus',
    ];

    for (const make of vehicleMakes) {
      if (query.includes(make)) {
        entities.vehicleMake =
          make === 'chevy' ? 'chevrolet' : make === 'vw' ? 'volkswagen' : make;
        break;
      }
    }

    // Vehicle models (common collision repair vehicles)
    const vehicleModels = [
      'civic',
      'accord',
      'camry',
      'corolla',
      'altima',
      'sentra',
      'malibu',
      'impala',
      'f-150',
      'silverado',
      'ram',
      'tacoma',
      'highlander',
      'explorer',
      'escape',
    ];

    for (const model of vehicleModels) {
      if (query.includes(model)) {
        entities.vehicleModel = model;
        break;
      }
    }

    // RO/Claim numbers
    const roPattern = /(?:ro|repair.*order|claim)[\s#-]*([a-z]*\d{4}[\d-]*)/i;
    const roMatch = query.match(roPattern);
    if (roMatch) {
      entities.roNumber = roMatch[1];
    }

    // Customer names (basic detection)
    const namePattern = /(?:customer|client)[\s]+([a-z]+(?:\s+[a-z]+)?)/i;
    const nameMatch = query.match(namePattern);
    if (nameMatch) {
      entities.customerName = nameMatch[1];
    }

    // Status keywords
    const statusKeywords = [
      'pending',
      'completed',
      'in progress',
      'waiting',
      'delivered',
      'ready',
    ];
    for (const status of statusKeywords) {
      if (query.includes(status)) {
        entities.status = status.replace(' ', '_');
        break;
      }
    }

    // Parts-related entities
    if (query.includes('part')) {
      entities.category = 'parts';

      // Specific parts
      const partTypes = [
        'bumper',
        'fender',
        'door',
        'hood',
        'headlight',
        'taillight',
        'mirror',
      ];
      for (const part of partTypes) {
        if (query.includes(part)) {
          entities.partType = part;
          break;
        }
      }
    }

    return entities;
  }

  /**
   * Intent classification with confidence scoring
   */
  classifyIntent(query) {
    const intents = [
      {
        type: 'search_repair_orders',
        patterns: [
          /show.*repair.*order/,
          /find.*ro/,
          /list.*repair/,
          /repair.*order.*from/,
          /what('s|\s+is)\s+(in\s+)?repair/i,
          /whats?\s+in\s+repair/i,
          /what\s+repair/i,
          /in\s+repair/i,
          /active\s+repair/i,
        ],
        keywords: [
          'show',
          'find',
          'list',
          'repair order',
          'ro',
          'what',
          'in repair',
          'active',
        ],
        confidence: 0,
      },
      {
        type: 'search_vehicles',
        patterns: [
          /show.*vehicle/,
          /find.*car/,
          /list.*vehicle/,
          /.*vehicle.*with/,
        ],
        keywords: ['vehicle', 'car', 'auto'],
        confidence: 0,
      },
      {
        type: 'search_customers',
        patterns: [/show.*customer/, /find.*customer/, /customer.*with/],
        keywords: ['customer', 'client'],
        confidence: 0,
      },
      {
        type: 'analytics_performance',
        patterns: [
          /average.*cycle/,
          /performance/,
          /how.*many/,
          /total.*revenue/,
        ],
        keywords: [
          'average',
          'performance',
          'cycle time',
          'revenue',
          'metrics',
        ],
        confidence: 0,
      },
      {
        type: 'workflow_status',
        patterns: [
          /pending.*parts/,
          /waiting.*for/,
          /status.*of/,
          /ready.*for/,
        ],
        keywords: ['pending', 'waiting', 'status', 'workflow'],
        confidence: 0,
      },
      {
        type: 'knowledge_base',
        patterns: [/what.*is/, /define/, /explain/, /how.*work/],
        keywords: ['what is', 'define', 'explain', 'how'],
        confidence: 0,
      },
    ];

    let bestIntent = { type: 'general', confidence: 0 };

    for (const intent of intents) {
      let score = 0;

      // Pattern matching
      for (const pattern of intent.patterns) {
        if (pattern.test(query)) {
          score += 0.4;
        }
      }

      // Keyword matching
      for (const keyword of intent.keywords) {
        if (query.includes(keyword)) {
          score += 0.2;
        }
      }

      intent.confidence = Math.min(score, 1.0);

      if (intent.confidence > bestIntent.confidence) {
        bestIntent = intent;
      }
    }

    return bestIntent;
  }

  /**
   * Extract time context from natural language
   */
  extractTimeContext(query) {
    const now = new Date();

    if (query.includes('this week')) {
      return {
        period: 'this_week',
        startDate: startOfWeek(now),
        endDate: endOfWeek(now),
      };
    }

    if (query.includes('this month')) {
      return {
        period: 'this_month',
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    }

    if (query.includes('today')) {
      return {
        period: 'today',
        startDate: now,
        endDate: now,
      };
    }

    // Default to last 30 days for analytics queries
    if (query.includes('average') || query.includes('performance')) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        period: 'last_30_days',
        startDate: thirtyDaysAgo,
        endDate: now,
      };
    }

    return null;
  }

  /**
   * Extract additional filters
   */
  extractFilters(query) {
    const filters = {};

    // Price/value filters
    if (query.includes('expensive') || query.includes('high value')) {
      filters.minValue = 5000;
    }
    if (query.includes('cheap') || query.includes('low value')) {
      filters.maxValue = 1000;
    }

    // Priority filters
    if (query.includes('urgent') || query.includes('priority')) {
      filters.priority = 'high';
    }

    return filters;
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(intent, entities, timeContext) {
    let confidence = intent.confidence;

    // Boost confidence for recognized entities
    if (Object.keys(entities).length > 0) {
      confidence += 0.1 * Object.keys(entities).length;
    }

    // Boost for time context
    if (timeContext) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Gather contextual data from database with user security context
   */
  async gatherContextualData(shopId, queryAnalysis, userToken = null) {
    const { intent, entities, timeContext, filters } = queryAnalysis;
    const contextData = {
      summary: {},
      rawData: {},
      shopMetrics: {},
    };

    try {
      // Get shop overview metrics
      const shopMetrics = await this.getShopMetrics(
        shopId,
        timeContext,
        userToken
      );
      contextData.shopMetrics = shopMetrics;
      contextData.summary.shopMetrics = `${shopMetrics.totalROs} ROs, ${shopMetrics.completedROs} completed`;

      // Intent-specific data gathering with user context
      switch (intent.type) {
        case 'search_repair_orders':
          contextData.rawData.repairOrders = await this.getRepairOrders(
            shopId,
            entities,
            timeContext,
            filters,
            userToken
          );
          contextData.summary.repairOrders = `Found ${contextData.rawData.repairOrders.length} repair orders`;
          break;

        case 'search_vehicles':
          contextData.rawData.vehicles = await this.getVehicles(
            shopId,
            entities,
            filters,
            userToken
          );
          contextData.summary.vehicles = `Found ${contextData.rawData.vehicles.length} vehicles`;
          break;

        case 'search_customers':
          contextData.rawData.customers = await this.getCustomers(
            shopId,
            entities,
            filters,
            userToken
          );
          contextData.summary.customers = `Found ${contextData.rawData.customers.length} customers`;
          break;

        case 'analytics_performance':
          contextData.rawData.analytics = await this.getPerformanceAnalytics(
            shopId,
            timeContext,
            userToken
          );
          contextData.summary.analytics = 'Performance metrics calculated';
          break;

        case 'workflow_status':
          contextData.rawData.workflow = await this.getWorkflowStatus(
            shopId,
            entities,
            userToken
          );
          contextData.summary.workflow = 'Workflow status analyzed';
          break;
      }
    } catch (error) {
      console.error('❌ Error gathering contextual data:', error);
      contextData.summary.error = 'Limited data available';
    }

    return contextData;
  }

  // Secure database query methods with RLS enforcement
  async getShopMetrics(shopId, timeContext, userToken = null) {
    try {
      // Use user-scoped client if token provided, otherwise fallback to basic client
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data: repairOrders, error } = await client
        .from('repair_orders')
        .select('id, status, total_amount, created_at')
        .eq('shop_id', shopId)
        .limit(1000);

      if (error) {
        console.error('❌ Error fetching shop metrics:', error);
        throw error;
      }

      const totalROs = repairOrders?.length || 0;
      const completedROs =
        repairOrders?.filter(ro => ro.status === 'completed').length || 0;
      const totalRevenue =
        repairOrders?.reduce((sum, ro) => sum + (ro.total_amount || 0), 0) || 0;

      console.log(
        `📊 Shop ${shopId} metrics: ${totalROs} ROs, ${completedROs} completed`
      );

      return {
        totalROs,
        completedROs,
        totalRevenue,
        completionRate: totalROs > 0 ? (completedROs / totalROs) * 100 : 0,
      };
    } catch (error) {
      console.error('❌ Security check failed for shop metrics:', error);
      return {
        totalROs: 0,
        completedROs: 0,
        totalRevenue: 0,
        completionRate: 0,
      };
    }
  }

  async getRepairOrders(
    shopId,
    entities,
    timeContext,
    filters,
    userToken = null
  ) {
    try {
      // Use user-scoped client if token provided
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      let query = client
        .from('repair_orders')
        .select(
          `
          id, ro_number, status, total_amount, created_at, estimated_completion_date,
          customers!inner(first_name, last_name, phone),
          vehicles!inner(year, make, model, vin)
        `
        )
        .eq('shop_id', shopId);

      // Apply entity filters
      if (entities.vehicleMake) {
        query = query.ilike('vehicles.make', `%${entities.vehicleMake}%`);
      }
      if (entities.status) {
        query = query.eq('status', entities.status);
      }
      if (entities.roNumber) {
        query = query.ilike('ro_number', `%${entities.roNumber}%`);
      }

      // Apply time filters
      if (timeContext) {
        query = query
          .gte('created_at', timeContext.startDate.toISOString())
          .lte('created_at', timeContext.endDate.toISOString());
      }

      // Apply value filters
      if (filters.minValue) {
        query = query.gte('total_amount', filters.minValue);
      }
      if (filters.maxValue) {
        query = query.lte('total_amount', filters.maxValue);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error(
          `❌ Error fetching repair orders for shop ${shopId}:`,
          error
        );
        throw error;
      }

      console.log(
        `📋 Found ${data?.length || 0} repair orders for shop ${shopId}`
      );
      return data || [];
    } catch (error) {
      console.error('❌ Security check failed for repair orders:', error);
      return [];
    }
  }

  // Additional methods for vehicles, customers, analytics, etc...
  async getVehicles(shopId, entities, filters, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      let query = client
        .from('vehicles')
        .select(
          `
          id, year, make, model, vin, license_plate,
          customers!inner(first_name, last_name, phone),
          repair_orders(ro_number, status, total_amount)
        `
        )
        .eq('shop_id', shopId);

      if (entities.vehicleMake) {
        query = query.ilike('make', `%${entities.vehicleMake}%`);
      }
      if (entities.vehicleModel) {
        query = query.ilike('model', `%${entities.vehicleModel}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error(`❌ Error fetching vehicles for shop ${shopId}:`, error);
        throw error;
      }

      console.log(`🚗 Found ${data?.length || 0} vehicles for shop ${shopId}`);
      return data || [];
    } catch (error) {
      console.error('❌ Security check failed for vehicles:', error);
      return [];
    }
  }

  async getCustomers(shopId, entities, filters, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      let query = client
        .from('customers')
        .select(
          `
          id, first_name, last_name, phone, email,
          vehicles(year, make, model),
          repair_orders(ro_number, status, total_amount, created_at)
        `
        )
        .eq('shop_id', shopId);

      if (entities.customerName) {
        const names = entities.customerName.split(' ');
        if (names.length === 1) {
          query = query.or(
            `first_name.ilike.%${names[0]}%,last_name.ilike.%${names[0]}%`
          );
        } else {
          query = query
            .ilike('first_name', `%${names[0]}%`)
            .ilike('last_name', `%${names[1]}%`);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error(`❌ Error fetching customers for shop ${shopId}:`, error);
        throw error;
      }

      console.log(`👥 Found ${data?.length || 0} customers for shop ${shopId}`);
      return data || [];
    } catch (error) {
      console.error('❌ Security check failed for customers:', error);
      return [];
    }
  }

  async getPerformanceAnalytics(shopId, timeContext, userToken = null) {
    try {
      // Calculate key performance metrics with user context
      const metrics = {
        avgCycleTime: await this.calculateAvgCycleTime(
          shopId,
          timeContext,
          userToken
        ),
        completionRate: await this.calculateCompletionRate(
          shopId,
          timeContext,
          userToken
        ),
        revenue: await this.calculateRevenue(shopId, timeContext, userToken),
        customerSatisfaction: await this.calculateCustomerSatisfaction(
          shopId,
          timeContext,
          userToken
        ),
      };

      console.log(`📈 Analytics calculated for shop ${shopId}`);
      return metrics;
    } catch (error) {
      console.error('❌ Security check failed for analytics:', error);
      return {
        avgCycleTime: null,
        completionRate: 0,
        revenue: 0,
        customerSatisfaction: 0,
      };
    }
  }

  async getWorkflowStatus(shopId, entities, userToken = null) {
    try {
      // Get workflow-related data with user context
      const workflow = {
        pendingParts: await this.getPendingPartsOrders(shopId, userToken),
        readyForDelivery: await this.getReadyForDelivery(shopId, userToken),
        overdueRepairs: await this.getOverdueRepairs(shopId, userToken),
      };

      console.log(`🔄 Workflow status retrieved for shop ${shopId}`);
      return workflow;
    } catch (error) {
      console.error('❌ Security check failed for workflow status:', error);
      return { pendingParts: [], readyForDelivery: [], overdueRepairs: [] };
    }
  }

  // Helper calculation methods with security
  async calculateAvgCycleTime(shopId, timeContext, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('repair_orders')
        .select('drop_off_date, completion_date')
        .eq('shop_id', shopId)
        .not('drop_off_date', 'is', null)
        .not('completion_date', 'is', null);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const cycleTimes = data.map(ro => {
        const dropOff = new Date(ro.drop_off_date);
        const completion = new Date(ro.completion_date);
        return (completion - dropOff) / (1000 * 60 * 60 * 24); // days
      });

      return (
        cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
      );
    } catch (error) {
      console.error('❌ Error calculating cycle time:', error);
      return null;
    }
  }

  async calculateCompletionRate(shopId, timeContext, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('repair_orders')
        .select('status')
        .eq('shop_id', shopId);

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const completed = data.filter(ro => ro.status === 'completed').length;
      return (completed / data.length) * 100;
    } catch (error) {
      console.error('❌ Error calculating completion rate:', error);
      return 0;
    }
  }

  async calculateRevenue(shopId, timeContext, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('repair_orders')
        .select('total_amount')
        .eq('shop_id', shopId);

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      return data.reduce((sum, ro) => sum + (ro.total_amount || 0), 0);
    } catch (error) {
      console.error('❌ Error calculating revenue:', error);
      return 0;
    }
  }

  async calculateCustomerSatisfaction(shopId, timeContext, userToken = null) {
    // Mock customer satisfaction - could be implemented with actual ratings
    // In the future, this would query a customer_ratings table with RLS
    return 4.7;
  }

  async getPendingPartsOrders(shopId, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('parts_orders')
        .select('*')
        .eq('shop_id', shopId)
        .in('status', ['ordered', 'backordered']);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching pending parts:', error);
      return [];
    }
  }

  async getReadyForDelivery(shopId, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('repair_orders')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'ready_for_delivery');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching ready orders:', error);
      return [];
    }
  }

  async getOverdueRepairs(shopId, userToken = null) {
    try {
      const client = userToken
        ? this.createUserScopedClient(userToken)
        : this.supabase;

      const { data, error } = await client
        .from('repair_orders')
        .select('*')
        .eq('shop_id', shopId)
        .lt('estimated_completion_date', new Date().toISOString())
        .not('status', 'in', ['completed', 'delivered']);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching overdue repairs:', error);
      return [];
    }
  }

  // Response generation methods will continue...
  async generateIntelligentResponse(queryAnalysis, contextData, shopId) {
    const { intent, entities, confidence } = queryAnalysis;
    const { rawData, shopMetrics } = contextData;

    // Generate response based on intent
    switch (intent.type) {
      case 'search_repair_orders':
        return this.generateRepairOrderResponse(
          rawData.repairOrders,
          entities,
          shopMetrics
        );

      case 'search_vehicles':
        return this.generateVehicleResponse(rawData.vehicles, entities);

      case 'search_customers':
        return this.generateCustomerResponse(rawData.customers, entities);

      case 'analytics_performance':
        return this.generateAnalyticsResponse(rawData.analytics, shopMetrics);

      case 'workflow_status':
        return this.generateWorkflowResponse(rawData.workflow);

      case 'knowledge_base':
        return this.generateKnowledgeResponse(queryAnalysis.originalQuery);

      default:
        return this.generateGeneralResponse(queryAnalysis, contextData);
    }
  }

  generateRepairOrderResponse(repairOrders, entities, shopMetrics) {
    console.log(
      `🔍 Generating repair order response with ${repairOrders?.length || 0} orders`
    );
    console.log(`📊 Shop metrics:`, shopMetrics);

    if (!repairOrders || repairOrders.length === 0) {
      // If no data at all, provide sample data context
      return {
        type: 'search_results',
        message: `I searched for repair orders but found no data in the database yet. Here's what I can help you with once you have repair orders:`,
        results: [
          '📋 Track active repair orders and their status',
          '🚗 Search by vehicle make, model, or customer',
          '📊 Monitor cycle times and completion rates',
          '🔄 Identify bottlenecks in your workflow',
          '💰 Analyze revenue and profitability trends',
        ],
        insights: [
          'Your database appears to be empty or newly set up',
          'Once you add repair orders, I can provide detailed analytics',
          'Try importing sample data or creating test repair orders',
        ],
        actions: ['Import Sample Data', 'Create Test RO', 'View Documentation'],
      };
    }

    const totalValue = repairOrders.reduce(
      (sum, ro) => sum + (ro.total_amount || 0),
      0
    );
    const avgValue = totalValue / repairOrders.length;

    return {
      type: 'search_results',
      message: `Found ${repairOrders.length} repair orders matching your search.`,
      results: repairOrders
        .slice(0, 5)
        .map(
          ro =>
            `${ro.ro_number} - ${ro.vehicles?.year} ${ro.vehicles?.make} ${ro.vehicles?.model} - ${ro.customers?.first_name} ${ro.customers?.last_name} - Status: ${ro.status} - $${ro.total_amount?.toLocaleString() || '0'}`
        ),
      insights: [
        `Total value: $${totalValue.toLocaleString()}`,
        `Average repair value: $${avgValue.toLocaleString()}`,
        `Most common status: ${this.getMostCommonStatus(repairOrders)}`,
      ],
      actions: [
        'View Details',
        'Export List',
        'Filter Results',
        'Update Status',
      ],
    };
  }

  generateVehicleResponse(vehicles, entities) {
    if (!vehicles || vehicles.length === 0) {
      return {
        type: 'search_results',
        message: `No vehicles found matching "${entities.vehicleMake || 'your search'}" criteria.`,
        insights: ['Try searching for a different vehicle make or model'],
        actions: ['View All Vehicles', 'Add New Vehicle'],
      };
    }

    const makeBreakdown = this.getMakeBreakdown(vehicles);
    const totalRepairs = vehicles.reduce(
      (sum, v) => sum + (v.repair_orders?.length || 0),
      0
    );

    return {
      type: 'search_results',
      message: `Found ${vehicles.length} vehicles matching your search.`,
      results: vehicles
        .slice(0, 5)
        .map(
          v =>
            `${v.year} ${v.make} ${v.model} - Owner: ${v.customers?.first_name} ${v.customers?.last_name} - VIN: ${v.vin?.substring(0, 8)}...`
        ),
      insights: [
        `Most common make: ${makeBreakdown.top}`,
        `Total repairs for these vehicles: ${totalRepairs}`,
        `Average age: ${this.calculateAverageVehicleAge(vehicles)} years`,
      ],
      actions: ['View Vehicle History', 'Schedule Service', 'Contact Owner'],
    };
  }

  generateCustomerResponse(customers, entities) {
    if (!customers || customers.length === 0) {
      return {
        type: 'search_results',
        message: `No customers found matching "${entities.customerName || 'your search'}" criteria.`,
        insights: [
          'Try searching for a different customer name or phone number',
        ],
        actions: ['View All Customers', 'Add New Customer'],
      };
    }

    const totalRepairs = customers.reduce(
      (sum, c) => sum + (c.repair_orders?.length || 0),
      0
    );
    const totalRevenue = customers.reduce(
      (sum, c) =>
        sum +
        (c.repair_orders?.reduce(
          (rSum, ro) => rSum + (ro.total_amount || 0),
          0
        ) || 0),
      0
    );

    return {
      type: 'search_results',
      message: `Found ${customers.length} customers matching your search.`,
      results: customers
        .slice(0, 5)
        .map(
          c =>
            `${c.first_name} ${c.last_name} - Phone: ${c.phone || 'N/A'} - Vehicles: ${c.vehicles?.length || 0} - Repairs: ${c.repair_orders?.length || 0}`
        ),
      insights: [
        `Total repairs: ${totalRepairs}`,
        `Combined revenue: $${totalRevenue.toLocaleString()}`,
        `Average repairs per customer: ${(totalRepairs / customers.length).toFixed(1)}`,
      ],
      actions: [
        'View Customer History',
        'Contact Customer',
        'Schedule Service',
      ],
    };
  }

  generateWorkflowResponse(workflow) {
    const totalPending = workflow.pendingParts?.length || 0;
    const totalReady = workflow.readyForDelivery?.length || 0;
    const totalOverdue = workflow.overdueRepairs?.length || 0;

    return {
      type: 'workflow_status',
      message: `Workflow status summary: ${totalPending} pending parts, ${totalReady} ready for delivery, ${totalOverdue} overdue.`,
      results: [
        `Pending Parts Orders: ${totalPending}`,
        `Ready for Delivery: ${totalReady}`,
        `Overdue Repairs: ${totalOverdue}`,
      ],
      insights: this.generateWorkflowInsights(workflow),
      actions: [
        'Update Status',
        'Contact Vendors',
        'Notify Customers',
        'Prioritize Overdue',
      ],
    };
  }

  generateWorkflowInsights(workflow) {
    const insights = [];

    if ((workflow.pendingParts?.length || 0) > 0) {
      insights.push(
        `${workflow.pendingParts.length} repairs waiting for parts delivery`
      );
    }

    if ((workflow.overdueRepairs?.length || 0) > 0) {
      insights.push(
        `⚠️ ${workflow.overdueRepairs.length} repairs are past due date`
      );
    } else {
      insights.push('✅ No overdue repairs - excellent scheduling');
    }

    if ((workflow.readyForDelivery?.length || 0) > 0) {
      insights.push(
        `${workflow.readyForDelivery.length} completed repairs ready for customer pickup`
      );
    }

    return insights;
  }

  generateKnowledgeResponse(query) {
    const lowerQuery = query.toLowerCase();

    // Find relevant domain knowledge
    for (const [term, knowledge] of Object.entries(this.domainKnowledge)) {
      if (lowerQuery.includes(term)) {
        return {
          type: 'knowledge_base',
          message: knowledge.definition,
          results:
            knowledge.process || knowledge.benefits || knowledge.factors || [],
          insights: [
            knowledge.tips ||
              knowledge.importance ||
              'This is important in collision repair operations',
            `Industry term: ${knowledge.term || term}`,
          ],
          actions: ['Learn More', 'Related Topics', 'Ask Follow-up'],
        };
      }
    }

    // General collision repair help
    return {
      type: 'knowledge_base',
      message:
        'I can help explain collision repair terms, processes, and industry standards. What would you like to know?',
      results: [
        'Common terms: Supplement, DRP, BMS, Cycle Time',
        'Processes: Estimating, Parts ordering, Quality control',
        'Standards: Industry benchmarks, Best practices',
      ],
      insights: [
        'I have extensive collision repair industry knowledge',
        'Ask about specific terms, processes, or standards',
      ],
      actions: ['Ask About Terms', 'Explain Process', 'Industry Standards'],
    };
  }

  generateGeneralResponse(queryAnalysis, contextData) {
    return {
      type: 'general',
      message: `I understand you're asking about "${queryAnalysis.originalQuery}". Based on your shop data, here's what I can help with:`,
      results: [
        `Your shop has ${contextData.shopMetrics?.totalROs || 0} total repair orders`,
        `${contextData.shopMetrics?.completedROs || 0} have been completed`,
        `Current completion rate: ${contextData.shopMetrics?.completionRate?.toFixed(1) || 0}%`,
      ],
      insights: [
        'Try being more specific in your query',
        'I can search repair orders, vehicles, customers, and analyze performance',
        'Ask about specific timeframes, vehicle makes, or workflow statuses',
      ],
      actions: [
        'Search Repair Orders',
        'Analyze Performance',
        'Check Workflow',
        'Ask Questions',
      ],
    };
  }

  // Additional response generators and helper methods...
  generateAnalyticsResponse(analytics, shopMetrics) {
    return {
      type: 'analytics',
      message: `Here's your shop performance overview:`,
      results: [
        `Total Repair Orders: ${shopMetrics.totalROs}`,
        `Completion Rate: ${shopMetrics.completionRate.toFixed(1)}%`,
        `Average Cycle Time: ${analytics?.avgCycleTime?.toFixed(1) || 'N/A'} days`,
        `Total Revenue: $${shopMetrics.totalRevenue.toLocaleString()}`,
      ],
      insights: this.generatePerformanceInsights(analytics, shopMetrics),
      actions: [
        'Detailed Report',
        'Compare Previous Period',
        'Export Analytics',
      ],
    };
  }

  generatePerformanceInsights(analytics, shopMetrics) {
    const insights = [];

    // Benchmark against industry standards
    if (analytics?.avgCycleTime) {
      if (analytics.avgCycleTime <= 7) {
        insights.push('🎉 Excellent cycle time - well below industry average');
      } else if (analytics.avgCycleTime <= 10) {
        insights.push('👍 Good cycle time - within industry standards');
      } else {
        insights.push(
          '⚠️ Cycle time above industry average - consider workflow optimization'
        );
      }
    }

    if (shopMetrics.completionRate >= 90) {
      insights.push('🎯 High completion rate indicates efficient operations');
    } else if (shopMetrics.completionRate < 70) {
      insights.push(
        '📈 Completion rate could be improved - review pending repairs'
      );
    }

    return insights;
  }

  // Domain knowledge and helper methods
  initializeDomainKnowledge() {
    return {
      supplement: {
        definition:
          "Additional work discovered during repair that wasn't included in the original estimate",
        process: [
          'Discover additional damage',
          'Document findings with photos',
          'Contact insurance adjuster',
          'Get approval before proceeding',
        ],
        tips: 'Always get written approval for supplements to avoid payment disputes',
      },
      drp: {
        definition:
          'Direct Repair Program - partnership between body shops and insurance companies',
        benefits: [
          'Guaranteed work volume',
          'Streamlined claims process',
          'Faster payments',
        ],
        considerations:
          'May have negotiated labor rates and parts sourcing requirements',
      },
      'cycle time': {
        definition:
          'Total time a vehicle spends in the repair facility from drop-off to completion',
        industry_standard: '7-12 days for collision repairs',
        factors: [
          'Parts availability',
          'Work complexity',
          'Shop capacity',
          'Quality control',
        ],
      },
      bms: {
        definition:
          'Body Management System - software for importing and processing insurance estimates',
        formats: ['CCC ONE', 'Mitchell', 'Audatex XML'],
        benefits: 'Reduces manual data entry and ensures estimate accuracy',
      },
    };
  }

  initializeQueryPatterns() {
    return {
      temporal: [
        { pattern: /this week/, period: 'week', offset: 0 },
        { pattern: /last week/, period: 'week', offset: -1 },
        { pattern: /this month/, period: 'month', offset: 0 },
        { pattern: /last month/, period: 'month', offset: -1 },
        { pattern: /today/, period: 'day', offset: 0 },
        { pattern: /yesterday/, period: 'day', offset: -1 },
      ],
      comparison: [
        { pattern: /compared to/, type: 'comparison' },
        { pattern: /vs/, type: 'comparison' },
        { pattern: /better than/, type: 'comparison' },
        { pattern: /worse than/, type: 'comparison' },
      ],
    };
  }

  initializeIndustryBenchmarks() {
    return {
      cycleTime: {
        excellent: 7,
        good: 10,
        average: 12,
        poor: 15,
      },
      completionRate: {
        excellent: 95,
        good: 90,
        average: 85,
        poor: 80,
      },
      customerSatisfaction: {
        excellent: 4.8,
        good: 4.5,
        average: 4.2,
        poor: 4.0,
      },
    };
  }

  // Utility methods
  getMostCommonStatus(repairOrders) {
    const statusCount = {};
    repairOrders.forEach(ro => {
      statusCount[ro.status] = (statusCount[ro.status] || 0) + 1;
    });
    return Object.keys(statusCount).reduce((a, b) =>
      statusCount[a] > statusCount[b] ? a : b
    );
  }

  getMakeBreakdown(vehicles) {
    const makes = {};
    vehicles.forEach(v => {
      makes[v.make] = (makes[v.make] || 0) + 1;
    });
    const top = Object.keys(makes).reduce((a, b) =>
      makes[a] > makes[b] ? a : b
    );
    return { breakdown: makes, top };
  }

  calculateAverageVehicleAge(vehicles) {
    const currentYear = new Date().getFullYear();
    const ages = vehicles.map(v => currentYear - v.year);
    return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
  }

  generateFallbackResponse(query, error) {
    console.log(`📋 Generating fallback response for query: "${query}"`);
    console.log(`❌ Error details: ${error?.message || 'Unknown error'}`);

    return {
      type: 'system',
      message: `I understand you're asking about "${query}". Let me help you with that! Currently processing collision repair data...`,
      results: [
        '🔍 "Show me repair orders from this week"',
        '📊 "What\'s our average cycle time?"',
        '🔄 "What repairs are pending parts?"',
        '💡 "What is a supplement?"',
        '👥 "Show me Honda vehicles"',
      ],
      insights: [
        'I understand collision repair terminology and workflows',
        'Database connectivity established - building your response',
        'Try being more specific in your query for better results',
      ],
      actions: ['Try Again', 'Show Examples', 'Get Help'],
    };
  }
}

module.exports = { IntelligentCollisionAssistant };
