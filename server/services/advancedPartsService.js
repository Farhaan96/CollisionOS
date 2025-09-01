const { Part, Vendor, PartOrder, Job } = require('../database/models');
const { realtimeService } = require('./realtimeService');
const { auditLogger } = require('../middleware/security');

// Vendor integration configurations
const VENDOR_INTEGRATIONS = {
  'parts-authority': {
    name: 'Parts Authority',
    apiUrl: 'https://api.partsauthority.com/v1',
    apiKey: process.env.PARTS_AUTHORITY_API_KEY,
    enabled: true,
    supportedFeatures: ['pricing', 'availability', 'ordering', 'tracking'],
  },
  'auto-parts-bridge': {
    name: 'Auto Parts Bridge',
    apiUrl: 'https://api.autopartsbridge.com/v2',
    apiKey: process.env.AUTO_PARTS_BRIDGE_API_KEY,
    enabled: true,
    supportedFeatures: ['pricing', 'availability', 'catalog'],
  },
  'oe-connection': {
    name: 'OE Connection',
    apiUrl: 'https://api.oeconnection.com/v1',
    apiKey: process.env.OE_CONNECTION_API_KEY,
    enabled: true,
    supportedFeatures: ['pricing', 'availability', 'ordering', 'oem_catalog'],
  },
  lkq: {
    name: 'LKQ Corporation',
    apiUrl: 'https://api.lkqcorp.com/v1',
    apiKey: process.env.LKQ_API_KEY,
    enabled: true,
    supportedFeatures: ['used_parts', 'recycled', 'pricing', 'availability'],
  },
};

// Part categories with auto-ordering rules
const PART_CATEGORIES = {
  body_panels: {
    name: 'Body Panels',
    autoOrderThreshold: 2,
    leadTime: 3, // days
    averageCost: 150,
    suppliers: ['parts-authority', 'oe-connection'],
  },
  mechanical: {
    name: 'Mechanical Parts',
    autoOrderThreshold: 5,
    leadTime: 2,
    averageCost: 75,
    suppliers: ['auto-parts-bridge', 'parts-authority'],
  },
  electrical: {
    name: 'Electrical Components',
    autoOrderThreshold: 3,
    leadTime: 5,
    averageCost: 200,
    suppliers: ['oe-connection', 'parts-authority'],
  },
  paint_supplies: {
    name: 'Paint & Supplies',
    autoOrderThreshold: 10,
    leadTime: 1,
    averageCost: 25,
    suppliers: ['parts-authority'],
  },
  consumables: {
    name: 'Consumables',
    autoOrderThreshold: 20,
    leadTime: 1,
    averageCost: 10,
    suppliers: ['parts-authority', 'auto-parts-bridge'],
  },
};

class AdvancedPartsService {
  constructor() {
    this.integrationCache = new Map();
    this.pricingCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  // Automated parts ordering system
  async checkAndExecuteAutoOrdering(shopId) {
    try {
      auditLogger.info('Starting auto-ordering check', { shopId });

      const lowStockParts = await this.getLowStockParts(shopId);
      const orderResults = [];
      const notifications = [];

      for (const part of lowStockParts) {
        const category = PART_CATEGORIES[part.category];
        if (!category || part.quantity > category.autoOrderThreshold) {
          continue;
        }

        // Check if there's already a pending order
        const pendingOrder = await PartOrder.findOne({
          where: {
            partId: part.id,
            status: { [require('sequelize').Op.in]: ['pending', 'ordered'] },
          },
        });

        if (pendingOrder) {
          continue; // Skip if already ordered
        }

        // Calculate optimal order quantity
        const orderQuantity = await this.calculateOptimalOrderQuantity(part);

        // Get best vendor pricing
        const vendorQuotes = await this.getVendorPricing(part, orderQuantity);
        const bestQuote = this.selectBestVendor(vendorQuotes);

        if (bestQuote) {
          const autoOrder = await this.createAutomaticOrder({
            shopId,
            partId: part.id,
            vendorId: bestQuote.vendorId,
            quantity: orderQuantity,
            unitPrice: bestQuote.unitPrice,
            totalCost: bestQuote.totalCost,
            estimatedDelivery: bestQuote.estimatedDelivery,
            orderType: 'automatic',
          });

          orderResults.push({
            part: part,
            order: autoOrder,
            vendor: bestQuote.vendor,
            savings:
              vendorQuotes.length > 1
                ? this.calculateSavings(vendorQuotes, bestQuote)
                : 0,
          });

          notifications.push({
            type: 'auto_order_placed',
            message: `Auto-ordered ${orderQuantity}x ${part.partNumber} from ${bestQuote.vendor.name}`,
            priority: 'medium',
            partId: part.id,
            orderId: autoOrder.id,
          });
        } else {
          notifications.push({
            type: 'auto_order_failed',
            message: `Could not auto-order ${part.partNumber} - no vendors available`,
            priority: 'high',
            partId: part.id,
          });
        }
      }

      // Broadcast notifications
      realtimeService.broadcastToShop(shopId, 'auto_ordering_complete', {
        orderResults,
        notifications,
        summary: {
          partsChecked: lowStockParts.length,
          ordersPlaced: orderResults.length,
          totalCost: orderResults.reduce(
            (sum, result) => sum + result.order.totalCost,
            0
          ),
        },
      });

      return { orderResults, notifications };
    } catch (error) {
      auditLogger.error('Auto-ordering failed', {
        shopId,
        error: error.message,
      });
      throw error;
    }
  }

  // Vendor price comparison
  async getVendorPricing(part, quantity = 1) {
    const cacheKey = `pricing_${part.partNumber}_${quantity}`;
    const cached = this.pricingCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const quotes = [];
    const category = PART_CATEGORIES[part.category];

    if (!category) {
      return quotes;
    }

    // Get quotes from multiple vendors
    for (const vendorIntegration of category.suppliers) {
      try {
        const integration = VENDOR_INTEGRATIONS[vendorIntegration];
        if (!integration?.enabled) continue;

        const quote = await this.fetchVendorQuote(integration, part, quantity);
        if (quote) {
          quotes.push(quote);
        }
      } catch (error) {
        auditLogger.warn('Vendor quote failed', {
          vendor: vendorIntegration,
          partNumber: part.partNumber,
          error: error.message,
        });
      }
    }

    // Cache results
    this.pricingCache.set(cacheKey, {
      data: quotes,
      timestamp: Date.now(),
    });

    return quotes;
  }

  // Fetch quote from specific vendor integration
  async fetchVendorQuote(integration, part, quantity) {
    // Mock vendor API call - replace with actual API integration
    const mockDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, mockDelay));

    // Generate realistic mock quote
    const basePrice = PART_CATEGORIES[part.category]?.averageCost || 50;
    const priceVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const unitPrice = Math.round(basePrice * (1 + priceVariation) * 100) / 100;
    const quantityDiscount = quantity > 5 ? 0.1 : quantity > 2 ? 0.05 : 0;
    const finalUnitPrice =
      Math.round(unitPrice * (1 - quantityDiscount) * 100) / 100;

    const availability = Math.random() > 0.2; // 80% availability
    if (!availability) return null;

    return {
      vendorId: integration.name.toLowerCase().replace(/\s+/g, '_'),
      vendor: {
        name: integration.name,
        rating: Math.random() * 1 + 4, // 4-5 star rating
        reliabilityScore: Math.random() * 20 + 80, // 80-100%
      },
      partNumber: part.partNumber,
      availability: 'in_stock',
      unitPrice: finalUnitPrice,
      totalCost: finalUnitPrice * quantity,
      quantity: quantity,
      estimatedDelivery: new Date(
        Date.now() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000
      ), // 1-6 days
      shipping: quantity * 2.5, // $2.50 per item shipping
      leadTime: Math.floor(Math.random() * 5) + 1, // 1-5 days
      warranty: '12 months',
      restrictions: [],
      lastUpdated: new Date(),
    };
  }

  // Select best vendor based on multiple criteria
  selectBestVendor(quotes) {
    if (quotes.length === 0) return null;
    if (quotes.length === 1) return quotes[0];

    // Scoring algorithm considering price, reliability, and delivery time
    const scoredQuotes = quotes.map(quote => {
      const prices = quotes.map(q => q.totalCost);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const priceScore =
        maxPrice === minPrice
          ? 1
          : (maxPrice - quote.totalCost) / (maxPrice - minPrice);
      const reliabilityScore = quote.vendor.reliabilityScore / 100;
      const deliveryScore = 1 - (quote.leadTime - 1) / 5; // Normalize delivery time

      const totalScore =
        priceScore * 0.4 + reliabilityScore * 0.3 + deliveryScore * 0.3;

      return { ...quote, score: totalScore };
    });

    return scoredQuotes.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  // Calculate optimal order quantity using EOQ model
  async calculateOptimalOrderQuantity(part) {
    const category = PART_CATEGORIES[part.category];
    if (!category) return 5; // Default quantity

    // Get usage data for the part
    const monthlyUsage = await this.getPartMonthlyUsage(part.id);
    const annualUsage = monthlyUsage * 12;

    if (annualUsage === 0) return category.autoOrderThreshold * 2; // Safety stock

    // EOQ calculation
    const orderingCost = 25; // Fixed cost per order
    const holdingCostRate = 0.2; // 20% of part value per year
    const unitCost = category.averageCost;

    const eoq = Math.sqrt(
      (2 * annualUsage * orderingCost) / (unitCost * holdingCostRate)
    );

    // Ensure minimum order quantity
    const minOrder = category.autoOrderThreshold * 2;
    const maxOrder = Math.min(eoq, annualUsage / 4); // Don't order more than 3 months supply

    return Math.max(minOrder, Math.round(maxOrder));
  }

  // Create automatic order
  async createAutomaticOrder(orderData) {
    const order = await PartOrder.create({
      ...orderData,
      orderNumber: this.generateOrderNumber(),
      status: 'pending',
      orderDate: new Date(),
      isAutomatic: true,
      metadata: {
        autoOrderReason: 'low_stock_threshold',
        calculationMethod: 'eoq',
        vendorSelectionCriteria: 'price_reliability_delivery',
      },
    });

    // Update part expected quantity
    await Part.update(
      {
        expectedQuantity: require('sequelize').literal(
          `expectedQuantity + ${orderData.quantity}`
        ),
      },
      { where: { id: orderData.partId } }
    );

    auditLogger.info('Automatic order created', {
      orderId: order.id,
      partId: orderData.partId,
      quantity: orderData.quantity,
      vendor: orderData.vendorId,
      cost: orderData.totalCost,
    });

    return order;
  }

  // Parts queue management with priority
  async getPartsQueue(shopId, filters = {}) {
    const whereClause = { shopId };

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    const orders = await PartOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Part,
          as: 'part',
          attributes: ['id', 'partNumber', 'description', 'category'],
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'jobNumber', 'priority', 'status'],
          required: false,
        },
      ],
      order: [
        ['priority', 'DESC'],
        ['orderDate', 'ASC'],
      ],
    });

    // Calculate queue metrics
    const metrics = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      overdueOrders: orders.filter(
        o => o.estimatedDelivery && new Date(o.estimatedDelivery) < new Date()
      ).length,
      totalValue: orders.reduce(
        (sum, order) => sum + (order.totalCost || 0),
        0
      ),
      averageLeadTime: this.calculateAverageLeadTime(orders),
    };

    return {
      orders: orders.map(order => ({
        ...order.toJSON(),
        daysOverdue: this.calculateDaysOverdue(order.estimatedDelivery),
        urgencyScore: this.calculateUrgencyScore(order),
        recommendations: this.generateOrderRecommendations(order),
      })),
      metrics,
      queueAnalytics: await this.analyzePartsQueue(orders),
    };
  }

  // Inventory tracking with low stock alerts
  async getLowStockParts(shopId) {
    const parts = await Part.findAll({
      where: {
        shopId,
        quantity: {
          [require('sequelize').Op.lte]:
            require('sequelize').col('minimumQuantity'),
        },
      },
      order: [
        [require('sequelize').literal('quantity - minimumQuantity'), 'ASC'],
      ],
    });

    return parts.map(part => ({
      ...part.toJSON(),
      stockLevel: this.calculateStockLevel(part.quantity, part.minimumQuantity),
      urgency: this.calculateStockUrgency(part),
      recommendations: this.generateStockRecommendations(part),
    }));
  }

  // Parts arrival notification system
  async processPartArrival(orderId, arrivedQuantity, condition = 'good') {
    const order = await PartOrder.findByPk(orderId, {
      include: [
        { model: Part, as: 'part' },
        { model: Job, as: 'job' },
      ],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    await order.update({
      status: 'received',
      receivedDate: new Date(),
      receivedQuantity: arrivedQuantity,
      condition,
    });

    // Update part inventory
    const part = order.part;
    await part.update({
      quantity: part.quantity + arrivedQuantity,
      expectedQuantity: Math.max(0, part.expectedQuantity - arrivedQuantity),
      lastRestocked: new Date(),
    });

    // Check for job matching
    const waitingJobs = await this.findJobsWaitingForPart(part.id);

    // Generate notifications
    const notifications = [];

    // Stock level notification
    notifications.push({
      type: 'part_arrived',
      message: `${part.partNumber} has arrived (${arrivedQuantity} units)`,
      priority: 'medium',
      partId: part.id,
      orderId: order.id,
    });

    // Job matching notifications
    for (const job of waitingJobs) {
      notifications.push({
        type: 'job_parts_ready',
        message: `Parts ready for Job ${job.jobNumber}`,
        priority: 'high',
        jobId: job.id,
        partId: part.id,
      });

      // Update job status if all parts are now available
      const allPartsAvailable = await this.checkJobPartsAvailability(job.id);
      if (allPartsAvailable) {
        await job.update({ partsStatus: 'available' });

        notifications.push({
          type: 'job_ready_production',
          message: `Job ${job.jobNumber} is ready for production - all parts available`,
          priority: 'high',
          jobId: job.id,
        });
      }
    }

    // Broadcast notifications
    realtimeService.broadcastToShop(order.shopId, 'part_arrival', {
      order,
      part,
      arrivedQuantity,
      condition,
      waitingJobs,
      notifications,
    });

    auditLogger.info('Part arrival processed', {
      orderId,
      partId: part.id,
      arrivedQuantity,
      condition,
      matchedJobs: waitingJobs.length,
    });

    return { order, part, waitingJobs, notifications };
  }

  // Helper methods
  generateOrderNumber() {
    return (
      'PO' +
      Date.now().toString().slice(-8) +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
    );
  }

  calculateSavings(quotes, selectedQuote) {
    const maxCost = Math.max(...quotes.map(q => q.totalCost));
    return Math.round((maxCost - selectedQuote.totalCost) * 100) / 100;
  }

  async getPartMonthlyUsage(partId) {
    // Mock monthly usage calculation
    return Math.floor(Math.random() * 10) + 1; // 1-10 parts per month
  }

  calculateDaysOverdue(estimatedDelivery) {
    if (!estimatedDelivery) return 0;
    const overdue = Math.floor(
      (new Date() - new Date(estimatedDelivery)) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, overdue);
  }

  calculateUrgencyScore(order) {
    let score = 0;

    // Job priority influence
    if (order.job?.priority === 'rush') score += 30;
    else if (order.job?.priority === 'high') score += 20;

    // Overdue influence
    const daysOverdue = this.calculateDaysOverdue(order.estimatedDelivery);
    score += Math.min(daysOverdue * 5, 25);

    // Stock level influence
    if (order.part?.quantity <= 0) score += 25;
    else if (order.part?.quantity <= order.part?.minimumQuantity) score += 15;

    return Math.min(score, 100);
  }

  calculateStockLevel(quantity, minimumQuantity) {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= minimumQuantity * 0.5) return 'critical';
    if (quantity <= minimumQuantity) return 'low';
    if (quantity <= minimumQuantity * 2) return 'normal';
    return 'high';
  }

  calculateStockUrgency(part) {
    const stockLevel = this.calculateStockLevel(
      part.quantity,
      part.minimumQuantity
    );
    const category = PART_CATEGORIES[part.category];

    if (stockLevel === 'out_of_stock') return 'critical';
    if (stockLevel === 'critical') return 'high';
    if (stockLevel === 'low' && category?.leadTime > 3) return 'high';
    if (stockLevel === 'low') return 'medium';
    return 'low';
  }

  generateOrderRecommendations(order) {
    const recommendations = [];
    const urgencyScore = this.calculateUrgencyScore(order);

    if (urgencyScore > 75) {
      recommendations.push({
        type: 'expedite',
        message: 'Consider expediting this order',
        action: 'Contact vendor for rush delivery',
      });
    }

    const daysOverdue = this.calculateDaysOverdue(order.estimatedDelivery);
    if (daysOverdue > 3) {
      recommendations.push({
        type: 'vendor_follow_up',
        message: `Order is ${daysOverdue} days overdue`,
        action: 'Contact vendor for delivery update',
      });
    }

    return recommendations;
  }

  generateStockRecommendations(part) {
    const recommendations = [];
    const stockLevel = this.calculateStockLevel(
      part.quantity,
      part.minimumQuantity
    );

    if (stockLevel === 'out_of_stock') {
      recommendations.push({
        type: 'emergency_order',
        message: 'Part is out of stock',
        action: 'Place emergency order immediately',
      });
    } else if (stockLevel === 'critical') {
      recommendations.push({
        type: 'urgent_order',
        message: 'Stock level critical',
        action: 'Place order within 24 hours',
      });
    }

    return recommendations;
  }

  calculateAverageLeadTime(orders) {
    const ordersWithLeadTime = orders.filter(
      o => o.estimatedDelivery && o.orderDate
    );
    if (ordersWithLeadTime.length === 0) return 0;

    const totalLeadTime = ordersWithLeadTime.reduce((sum, order) => {
      const leadTime = Math.floor(
        (new Date(order.estimatedDelivery) - new Date(order.orderDate)) /
          (1000 * 60 * 60 * 24)
      );
      return sum + leadTime;
    }, 0);

    return Math.round(totalLeadTime / ordersWithLeadTime.length);
  }

  async analyzePartsQueue(orders) {
    const analysis = {
      bottlenecks: [],
      vendorPerformance: {},
      categoryBreakdown: {},
      trendAnalysis: {},
    };

    // Vendor performance analysis
    const vendorGroups = orders.reduce((groups, order) => {
      const vendorId = order.vendorId || 'unknown';
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(order);
      return groups;
    }, {});

    Object.entries(vendorGroups).forEach(([vendorId, vendorOrders]) => {
      const overdueCount = vendorOrders.filter(
        o => this.calculateDaysOverdue(o.estimatedDelivery) > 0
      ).length;
      const onTimeRate =
        ((vendorOrders.length - overdueCount) / vendorOrders.length) * 100;

      analysis.vendorPerformance[vendorId] = {
        totalOrders: vendorOrders.length,
        overdueOrders: overdueCount,
        onTimeRate,
        averageValue:
          vendorOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0) /
          vendorOrders.length,
      };
    });

    return analysis;
  }

  async findJobsWaitingForPart(partId) {
    // Mock implementation - find jobs that need this part
    const jobs = await Job.findAll({
      where: {
        partsStatus: 'waiting',
        status: { [require('sequelize').Op.notIn]: ['delivered', 'cancelled'] },
      },
      limit: 5, // Mock limit
    });

    return jobs;
  }

  async checkJobPartsAvailability(jobId) {
    // Mock implementation - check if all parts for job are available
    return Math.random() > 0.3; // 70% chance all parts are available
  }
}

module.exports = new AdvancedPartsService();
