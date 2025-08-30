/**
 * CollisionOS AI Assistant Service
 * Intelligent collision repair assistant with domain-specific knowledge
 */

const { getSupabaseClient } = require('../config/supabase');

class CollisionOSAssistant {
  constructor() {
    this.supabase = getSupabaseClient(true); // Admin client for AI queries
    this.collisionKnowledge = this.loadCollisionRepairKnowledge();
  }

  /**
   * Main AI query processor
   * @param {string} query - Natural language query from user
   * @param {string} shopId - User's shop ID for data filtering
   * @param {string} userId - User ID for permissions
   * @returns {Object} AI response with data and insights
   */
  async processQuery(query, shopId, userId) {
    try {
      console.log(`🤖 AI Assistant processing query: "${query}" for shop ${shopId}`);
      
      // Analyze query intent
      const intent = this.analyzeQueryIntent(query);
      console.log(`📊 Query intent: ${intent.type} (confidence: ${intent.confidence})`);
      
      // Route to appropriate handler
      switch (intent.type) {
        case 'search':
          return await this.handleSearchQuery(query, shopId, intent);
        case 'analytics':
          return await this.handleAnalyticsQuery(query, shopId, intent);
        case 'workflow':
          return await this.handleWorkflowQuery(query, shopId, intent);
        case 'financial':
          return await this.handleFinancialQuery(query, shopId, intent);
        default:
          return this.handleGeneralQuery(query, shopId);
      }
    } catch (error) {
      console.error('❌ AI Assistant error:', error);
      return {
        type: 'error',
        message: 'I encountered an error processing your request. Please try rephrasing your question.',
        error: error.message
      };
    }
  }

  /**
   * Analyze user query to determine intent and extract entities
   */
  analyzeQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Search intent patterns
    if (this.matchesPatterns(lowerQuery, [
      'show me', 'find', 'search for', 'list', 'what are', 'which'
    ])) {
      return {
        type: 'search',
        confidence: 0.9,
        entities: this.extractEntities(query)
      };
    }
    
    // Analytics intent patterns
    if (this.matchesPatterns(lowerQuery, [
      'average', 'total', 'how many', 'count', 'statistics', 'performance', 'kpi'
    ])) {
      return {
        type: 'analytics',
        confidence: 0.85,
        entities: this.extractEntities(query)
      };
    }
    
    // Workflow intent patterns
    if (this.matchesPatterns(lowerQuery, [
      'status', 'workflow', 'progress', 'next step', 'pending', 'completed'
    ])) {
      return {
        type: 'workflow',
        confidence: 0.8,
        entities: this.extractEntities(query)
      };
    }
    
    // Financial intent patterns
    if (this.matchesPatterns(lowerQuery, [
      'revenue', 'profit', 'cost', 'invoice', 'payment', 'financial'
    ])) {
      return {
        type: 'financial',
        confidence: 0.8,
        entities: this.extractEntities(query)
      };
    }
    
    return { type: 'general', confidence: 0.5, entities: [] };
  }

  /**
   * Handle search queries (e.g., "Show me all Honda Civics")
   */
  async handleSearchQuery(query, shopId, intent) {
    const entities = intent.entities;
    let results = [];
    let searchType = 'general';

    // Vehicle searches
    if (entities.vehicleMake || entities.vehicleModel) {
      searchType = 'vehicles';
      const { data } = await this.supabase
        .from('vehicles')
        .select(`
          *, 
          customers(first_name, last_name),
          repair_orders(ro_number, status)
        `)
        .eq('shop_id', shopId)
        .ilike('make', `%${entities.vehicleMake || ''}%`)
        .ilike('model', `%${entities.vehicleModel || ''}%`)
        .limit(50);
      results = data || [];
    }
    
    // Repair order searches
    else if (entities.roNumber || query.includes('repair order') || query.includes('RO')) {
      searchType = 'repair_orders';
      let queryBuilder = this.supabase
        .from('repair_orders')
        .select(`
          *,
          customers(first_name, last_name),
          vehicles(year, make, model),
          claims(claim_number, adjuster_name)
        `)
        .eq('shop_id', shopId);
        
      if (entities.roNumber) {
        queryBuilder = queryBuilder.ilike('ro_number', `%${entities.roNumber}%`);
      }
      
      const { data } = await queryBuilder.limit(50);
      results = data || [];
    }
    
    // Parts searches
    else if (query.includes('parts') || query.includes('inventory')) {
      searchType = 'parts';
      const { data } = await this.supabase
        .from('parts_order_items')
        .select(`
          *,
          parts_orders(po_number, vendor_id, status),
          vendors(name)
        `)
        .eq('parts_orders.shop_id', shopId)
        .limit(50);
      results = data || [];
    }

    return {
      type: 'search_results',
      query,
      searchType,
      results,
      count: results.length,
      message: `Found ${results.length} ${searchType.replace('_', ' ')} matching your search.`,
      insights: this.generateSearchInsights(results, searchType)
    };
  }

  /**
   * Handle analytics queries (e.g., "What's our average cycle time?")
   */
  async handleAnalyticsQuery(query, shopId, intent) {
    const entities = intent.entities;
    
    if (query.includes('cycle time') || query.includes('turnaround')) {
      const { data } = await this.supabase.rpc('calculate_average_cycle_time', {
        shop_uuid: shopId,
        days_back: 30
      });
      
      return {
        type: 'analytics',
        metric: 'cycle_time',
        value: data?.[0]?.avg_cycle_time || 0,
        message: `Your average cycle time over the last 30 days is ${data?.[0]?.avg_cycle_time || 'N/A'} days.`,
        insights: ['This is within industry standards for collision repair.']
      };
    }
    
    if (query.includes('revenue') || query.includes('sales')) {
      const { data } = await this.supabase.rpc('calculate_monthly_revenue', {
        shop_uuid: shopId
      });
      
      return {
        type: 'analytics',
        metric: 'revenue',
        value: data?.[0]?.total_revenue || 0,
        message: `Your current month revenue is $${(data?.[0]?.total_revenue || 0).toLocaleString()}.`,
        insights: ['Revenue tracking helps identify seasonal trends.']
      };
    }

    return {
      type: 'analytics',
      message: 'I can help you analyze cycle times, revenue, parts efficiency, and more. What specific metric would you like to see?'
    };
  }

  /**
   * Handle workflow queries (e.g., "What repair orders are pending parts?")
   */
  async handleWorkflowQuery(query, shopId, intent) {
    if (query.includes('pending') && query.includes('parts')) {
      const { data } = await this.supabase
        .from('repair_orders')
        .select(`
          *,
          customers(first_name, last_name),
          vehicles(year, make, model),
          parts_orders!inner(status)
        `)
        .eq('shop_id', shopId)
        .in('parts_orders.status', ['ordered', 'backordered'])
        .limit(20);

      return {
        type: 'workflow',
        category: 'pending_parts',
        results: data || [],
        message: `${(data || []).length} repair orders are currently waiting for parts.`,
        actionable: true,
        actions: ['View Parts Orders', 'Contact Vendors', 'Update Customers']
      };
    }

    return {
      type: 'workflow',
      message: 'I can help you track repair order statuses, parts workflows, and identify bottlenecks. What workflow would you like to check?'
    };
  }

  /**
   * Handle financial queries
   */
  async handleFinancialQuery(query, shopId, intent) {
    return {
      type: 'financial',
      message: 'Financial analysis features are coming soon! I\'ll be able to help with revenue, profit margins, and cost analysis.'
    };
  }

  /**
   * Handle general queries with collision repair knowledge
   */
  handleGeneralQuery(query, shopId) {
    const knowledge = this.findRelevantKnowledge(query);
    
    return {
      type: 'knowledge',
      query,
      message: knowledge.answer,
      confidence: knowledge.confidence,
      relatedTopics: knowledge.related
    };
  }

  /**
   * Extract entities from query (vehicle make, model, RO numbers, etc.)
   */
  extractEntities(query) {
    const entities = {};
    
    // Extract vehicle makes
    const vehicleMakes = ['honda', 'toyota', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes'];
    for (const make of vehicleMakes) {
      if (query.toLowerCase().includes(make)) {
        entities.vehicleMake = make.charAt(0).toUpperCase() + make.slice(1);
        break;
      }
    }
    
    // Extract RO numbers
    const roMatch = query.match(/RO[-\s]?(\d{4}[-\s]?\d{4})/i);
    if (roMatch) {
      entities.roNumber = roMatch[1];
    }
    
    return entities;
  }

  /**
   * Check if query matches any of the given patterns
   */
  matchesPatterns(query, patterns) {
    return patterns.some(pattern => query.includes(pattern));
  }

  /**
   * Generate insights from search results
   */
  generateSearchInsights(results, searchType) {
    if (!results.length) return [];
    
    const insights = [];
    
    if (searchType === 'vehicles') {
      const makeCount = {};
      results.forEach(vehicle => {
        makeCount[vehicle.make] = (makeCount[vehicle.make] || 0) + 1;
      });
      const topMake = Object.keys(makeCount).reduce((a, b) => makeCount[a] > makeCount[b] ? a : b);
      insights.push(`Most common vehicle: ${topMake} (${makeCount[topMake]} vehicles)`);
    }
    
    return insights;
  }

  /**
   * Load collision repair domain knowledge
   */
  loadCollisionRepairKnowledge() {
    return {
      'bms': 'BMS (Body Management System) is used to import estimates from insurance companies as XML files.',
      'cycle time': 'Cycle time measures how long a vehicle spends in your shop from drop-off to completion.',
      'supplement': 'A supplement is additional work discovered during repair that wasn\'t in the original estimate.',
      'drp': 'DRP (Direct Repair Program) is a partnership agreement with insurance companies for preferred repairs.',
      'parts sourcing': 'Parts sourcing involves finding the best vendor for parts based on price, quality, and delivery time.'
    };
  }

  /**
   * Find relevant knowledge for general queries
   */
  findRelevantKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, value] of Object.entries(this.collisionKnowledge)) {
      if (lowerQuery.includes(key)) {
        return {
          answer: value,
          confidence: 0.9,
          related: [key]
        };
      }
    }
    
    return {
      answer: 'I\'m your CollisionOS AI assistant! I can help you search for repair orders, analyze shop performance, track parts orders, and answer collision repair questions. Try asking me something like "Show me pending repair orders" or "What\'s our average cycle time?"',
      confidence: 0.7,
      related: ['search', 'analytics', 'workflow']
    };
  }
}

module.exports = { CollisionOSAssistant };