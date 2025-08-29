/**
 * Parts Supplier API Integration Service
 * Handles parts catalog search, pricing, availability, and order management
 */

const { IntegrationClient } = require('./integrationFramework');
const { APIError, ValidationError } = require('../utils/errorHandler');
const { realtimeService } = require('./realtimeService');
const { Part, Vendor } = require('../database/models');

/**
 * Generic Parts Supplier Client
 */
class PartsSupplierProvider extends IntegrationClient {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Parts Supplier'
    });
    
    this.supportedOperations = config.supportedOperations || [
      'search', 'pricing', 'availability', 'ordering'
    ];
  }

  /**
   * Search parts catalog
   */
  async searchParts(searchCriteria) {
    const validation = this.validateSearchCriteria(searchCriteria);
    if (!validation.isValid) {
      throw new ValidationError('Invalid search criteria', validation.errors);
    }

    const formattedCriteria = this.formatSearchCriteria(searchCriteria);
    const response = await this.get('/parts/search', formattedCriteria);
    
    return this.formatSearchResults(response);
  }

  /**
   * Get part pricing and availability
   */
  async getPricing(partNumbers) {
    if (!Array.isArray(partNumbers)) {
      partNumbers = [partNumbers];
    }

    const formattedRequest = this.formatPricingRequest(partNumbers);
    const response = await this.post('/parts/pricing', formattedRequest);
    
    return this.formatPricingResults(response);
  }

  /**
   * Check part availability
   */
  async checkAvailability(partNumbers) {
    if (!Array.isArray(partNumbers)) {
      partNumbers = [partNumbers];
    }

    const formattedRequest = this.formatAvailabilityRequest(partNumbers);
    const response = await this.post('/parts/availability', formattedRequest);
    
    return this.formatAvailabilityResults(response);
  }

  /**
   * Create purchase order
   */
  async createOrder(orderData) {
    const validation = this.validateOrderData(orderData);
    if (!validation.isValid) {
      throw new ValidationError('Invalid order data', validation.errors);
    }

    const formattedOrder = this.formatOrderData(orderData);
    const response = await this.post('/orders', formattedOrder);
    
    return this.formatOrderResponse(response);
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderNumber) {
    const response = await this.get(`/orders/${orderNumber}`);
    return this.formatOrderStatus(response);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderNumber, reason = null) {
    const response = await this.delete(`/orders/${orderNumber}`, {
      data: { reason }
    });
    return this.formatCancelResponse(response);
  }

  // Validation methods (override in provider-specific classes)
  validateSearchCriteria(criteria) {
    const errors = [];
    
    if (!criteria.query && !criteria.partNumber && !criteria.vehicleInfo) {
      errors.push('Search query, part number, or vehicle info is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  validateOrderData(orderData) {
    const errors = [];
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('Order items are required');
    }
    
    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Formatting methods (override in provider-specific classes)
  formatSearchCriteria(criteria) { return criteria; }
  formatSearchResults(response) { return response; }
  formatPricingRequest(partNumbers) { return { parts: partNumbers }; }
  formatPricingResults(response) { return response; }
  formatAvailabilityRequest(partNumbers) { return { parts: partNumbers }; }
  formatAvailabilityResults(response) { return response; }
  formatOrderData(orderData) { return orderData; }
  formatOrderResponse(response) { return response; }
  formatOrderStatus(response) { return response; }
  formatCancelResponse(response) { return response; }
}

/**
 * LKQ Corporation Integration
 */
class LKQProvider extends PartsSupplierProvider {
  constructor(credentials) {
    super({
      name: 'LKQ',
      baseURL: 'https://api.lkq.com/v1',
      authType: 'apikey',
      credentials,
      timeout: 30000,
      supportedOperations: ['search', 'pricing', 'availability', 'ordering']
    });
  }

  formatSearchCriteria(criteria) {
    return {
      query: criteria.query,
      partNumber: criteria.partNumber,
      vehicle: criteria.vehicleInfo ? {
        vin: criteria.vehicleInfo.vin,
        year: criteria.vehicleInfo.year,
        make: criteria.vehicleInfo.make,
        model: criteria.vehicleInfo.model,
        engine: criteria.vehicleInfo.engine
      } : undefined,
      partType: criteria.partType, // OEM, Aftermarket, Recycled
      location: criteria.location,
      maxDistance: criteria.maxDistance || 50
    };
  }

  formatSearchResults(response) {
    return {
      totalResults: response.totalCount,
      parts: response.parts.map(part => ({
        partNumber: part.partNumber,
        oemPartNumber: part.oemPartNumber,
        description: part.description,
        category: part.category,
        partType: part.type,
        price: part.price,
        availability: part.availability,
        condition: part.condition,
        warranty: part.warranty,
        supplier: {
          name: part.supplier.name,
          location: part.supplier.location,
          rating: part.supplier.rating
        },
        images: part.images || []
      }))
    };
  }
}

/**
 * Genuine Parts Company Integration
 */
class GPCProvider extends PartsSupplierProvider {
  constructor(credentials) {
    super({
      name: 'GPC',
      baseURL: 'https://api.genpt.com/v2',
      authType: 'oauth',
      credentials,
      timeout: 25000
    });
  }

  formatSearchCriteria(criteria) {
    const searchParams = {
      searchTerm: criteria.query || criteria.partNumber,
      vehicleYear: criteria.vehicleInfo?.year,
      vehicleMake: criteria.vehicleInfo?.make,
      vehicleModel: criteria.vehicleInfo?.model,
      categoryFilter: criteria.category,
      priceRange: criteria.priceRange
    };

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== undefined)
    );
  }

  formatPricingRequest(partNumbers) {
    return {
      partNumbers: partNumbers,
      includeAlternates: true,
      includeCoreExchange: true
    };
  }
}

/**
 * AutoZone Commercial Integration
 */
class AutoZoneProvider extends PartsSupplierProvider {
  constructor(credentials) {
    super({
      name: 'AutoZone',
      baseURL: 'https://commercial-api.autozone.com/v1',
      authType: 'custom',
      credentials: {
        customHeader: {
          name: 'X-API-Key',
          value: credentials.apiKey
        }
      },
      timeout: 20000
    });
  }

  async searchParts(searchCriteria) {
    // AutoZone requires vehicle-specific searches
    if (!searchCriteria.vehicleInfo) {
      throw new ValidationError('Vehicle information is required for AutoZone searches');
    }

    return await super.searchParts(searchCriteria);
  }

  formatSearchCriteria(criteria) {
    return {
      make: criteria.vehicleInfo.make,
      model: criteria.vehicleInfo.model,
      year: criteria.vehicleInfo.year,
      engine: criteria.vehicleInfo.engine,
      searchType: 'parts',
      category: criteria.category,
      keyword: criteria.query
    };
  }
}

/**
 * Hollander Interchange Integration
 */
class HollanderProvider extends PartsSupplierProvider {
  constructor(credentials) {
    super({
      name: 'Hollander',
      baseURL: 'https://api.hollander.com/v1',
      authType: 'basic',
      credentials,
      timeout: 35000,
      supportedOperations: ['search', 'interchange']
    });
  }

  /**
   * Find interchange parts
   */
  async findInterchange(partNumber, vehicleInfo) {
    const response = await this.get('/interchange', {
      partNumber,
      year: vehicleInfo.year,
      make: vehicleInfo.make,
      model: vehicleInfo.model
    });

    return {
      originalPart: response.originalPart,
      interchangeableParts: response.interchangeableParts.map(part => ({
        partNumber: part.partNumber,
        description: part.description,
        fitment: part.fitment,
        condition: part.condition,
        yearRange: part.yearRange
      }))
    };
  }
}

/**
 * Parts Supplier Integration Service
 */
class PartsSupplierIntegrationService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.priceComparison = true;
  }

  /**
   * Register parts supplier provider
   */
  registerProvider(name, provider) {
    this.providers.set(name, provider);
    
    // Set up webhook handlers
    this.setupWebhookHandlers(name, provider);
    
    console.log(`✅ Parts supplier registered: ${name}`);
  }

  /**
   * Set up webhook handlers for real-time updates
   */
  setupWebhookHandlers(providerName, provider) {
    const { integrationManager } = require('./integrationFramework');
    
    // Order status updates
    integrationManager.registerWebhookHandler(
      providerName,
      'order_status_update',
      async (payload) => {
        await this.handleOrderStatusUpdate(providerName, payload);
      }
    );
    
    // Price updates
    integrationManager.registerWebhookHandler(
      providerName,
      'price_update',
      async (payload) => {
        await this.handlePriceUpdate(providerName, payload);
      }
    );
    
    // Availability updates
    integrationManager.registerWebhookHandler(
      providerName,
      'availability_update',
      async (payload) => {
        await this.handleAvailabilityUpdate(providerName, payload);
      }
    );
  }

  /**
   * Handle order status update webhook
   */
  async handleOrderStatusUpdate(providerName, payload) {
    try {
      const { orderNumber, status, trackingNumber, estimatedDelivery } = payload;
      
      console.log(`📦 Order status update from ${providerName}: ${orderNumber} -> ${status}`);
      
      // Broadcast update
      realtimeService.broadcastPartsUpdate({
        provider: providerName,
        type: 'order_status',
        orderNumber,
        status,
        trackingNumber,
        estimatedDelivery
      });
      
      return { success: true, orderNumber, status };
    } catch (error) {
      console.error('Error handling order status update:', error);
      throw error;
    }
  }

  /**
   * Handle price update webhook
   */
  async handlePriceUpdate(providerName, payload) {
    try {
      const { partNumber, newPrice, oldPrice, effectiveDate } = payload;
      
      console.log(`💰 Price update from ${providerName}: ${partNumber} ${oldPrice} -> ${newPrice}`);
      
      // Update local part pricing if exists
      await Part.update(
        { 
          costPrice: newPrice,
          lastPriceUpdate: new Date()
        },
        {
          where: {
            partNumber,
            primaryVendorId: await this.getVendorId(providerName)
          }
        }
      );
      
      // Broadcast update
      realtimeService.broadcastPartsUpdate({
        provider: providerName,
        type: 'price_update',
        partNumber,
        newPrice,
        oldPrice
      });
      
      return { success: true, partNumber, newPrice };
    } catch (error) {
      console.error('Error handling price update:', error);
      throw error;
    }
  }

  /**
   * Handle availability update webhook
   */
  async handleAvailabilityUpdate(providerName, payload) {
    try {
      const { partNumber, available, quantity, location } = payload;
      
      console.log(`📊 Availability update from ${providerName}: ${partNumber} -> ${available ? 'Available' : 'Out of Stock'}`);
      
      // Broadcast update
      realtimeService.broadcastPartsUpdate({
        provider: providerName,
        type: 'availability_update',
        partNumber,
        available,
        quantity,
        location
      });
      
      return { success: true, partNumber, available };
    } catch (error) {
      console.error('Error handling availability update:', error);
      throw error;
    }
  }

  /**
   * Search parts across multiple suppliers
   */
  async searchParts(searchCriteria, providers = null) {
    const searchProviders = providers || Array.from(this.providers.keys());
    const results = [];
    
    for (const providerName of searchProviders) {
      try {
        const provider = this.getProvider(providerName);
        if (provider.supportedOperations.includes('search')) {
          const providerResults = await provider.searchParts(searchCriteria);
          results.push({
            provider: providerName,
            results: providerResults
          });
        }
      } catch (error) {
        console.warn(`Search failed for ${providerName}:`, error.message);
        results.push({
          provider: providerName,
          error: error.message
        });
      }
    }
    
    return {
      searchCriteria,
      providers: searchProviders,
      results,
      aggregated: this.aggregateSearchResults(results)
    };
  }

  /**
   * Compare prices across suppliers
   */
  async comparePrices(partNumbers, providers = null) {
    const compareProviders = providers || Array.from(this.providers.keys());
    const comparisons = {};
    
    for (const partNumber of partNumbers) {
      comparisons[partNumber] = {
        partNumber,
        providers: [],
        bestPrice: null,
        averagePrice: null
      };
      
      const prices = [];
      
      for (const providerName of compareProviders) {
        try {
          const provider = this.getProvider(providerName);
          if (provider.supportedOperations.includes('pricing')) {
            const pricing = await provider.getPricing([partNumber]);
            const partPricing = pricing.parts && pricing.parts[0];
            
            if (partPricing && partPricing.price) {
              const providerInfo = {
                provider: providerName,
                price: partPricing.price,
                availability: partPricing.availability,
                deliveryTime: partPricing.deliveryTime
              };
              
              comparisons[partNumber].providers.push(providerInfo);
              prices.push(partPricing.price);
            }
          }
        } catch (error) {
          console.warn(`Price check failed for ${providerName}:`, error.message);
        }
      }
      
      if (prices.length > 0) {
        comparisons[partNumber].bestPrice = Math.min(...prices);
        comparisons[partNumber].averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    }
    
    return comparisons;
  }

  /**
   * Create order with best price provider
   */
  async createOrderWithBestPrice(orderData) {
    // First, compare prices for all parts
    const partNumbers = orderData.items.map(item => item.partNumber);
    const priceComparison = await this.comparePrices(partNumbers);
    
    // Group parts by best price provider
    const providerOrders = {};
    
    orderData.items.forEach(item => {
      const comparison = priceComparison[item.partNumber];
      if (comparison && comparison.providers.length > 0) {
        // Sort by price and availability
        const bestProvider = comparison.providers
          .filter(p => p.availability)
          .sort((a, b) => a.price - b.price)[0];
        
        if (bestProvider) {
          if (!providerOrders[bestProvider.provider]) {
            providerOrders[bestProvider.provider] = {
              ...orderData,
              items: []
            };
          }
          providerOrders[bestProvider.provider].items.push(item);
        }
      }
    });
    
    // Create orders with each provider
    const orderResults = [];
    for (const [providerName, providerOrder] of Object.entries(providerOrders)) {
      try {
        const provider = this.getProvider(providerName);
        const result = await provider.createOrder(providerOrder);
        orderResults.push({
          provider: providerName,
          success: true,
          orderNumber: result.orderNumber,
          items: providerOrder.items.length
        });
      } catch (error) {
        orderResults.push({
          provider: providerName,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      strategy: 'best_price',
      priceComparison,
      orderResults
    };
  }

  /**
   * Aggregate search results from multiple providers
   */
  aggregateSearchResults(results) {
    const allParts = [];
    const providerCount = {};
    
    results.forEach(result => {
      if (result.results && result.results.parts) {
        result.results.parts.forEach(part => {
          allParts.push({
            ...part,
            provider: result.provider
          });
        });
        providerCount[result.provider] = result.results.parts.length;
      }
    });
    
    // Remove duplicates based on part number
    const uniqueParts = allParts.reduce((unique, part) => {
      const existing = unique.find(p => p.partNumber === part.partNumber);
      if (!existing || (part.price && part.price < existing.price)) {
        unique = unique.filter(p => p.partNumber !== part.partNumber);
        unique.push(part);
      }
      return unique;
    }, []);
    
    return {
      totalParts: uniqueParts.length,
      providerCount,
      parts: uniqueParts.sort((a, b) => (a.price || 0) - (b.price || 0))
    };
  }

  /**
   * Get vendor ID for provider
   */
  async getVendorId(providerName) {
    const vendor = await Vendor.findOne({
      where: { name: providerName }
    });
    return vendor ? vendor.id : null;
  }

  /**
   * Get provider instance
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new APIError(`Parts supplier provider '${name}' not found`, 404);
    }
    return provider;
  }

  /**
   * Get all registered providers
   */
  getProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Health check all providers
   */
  async healthCheck() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return results;
  }
}

// Export provider classes and service
module.exports = {
  PartsSupplierProvider,
  LKQProvider,
  GPCProvider,
  AutoZoneProvider,
  HollanderProvider,
  PartsSupplierIntegrationService
};