const { sequelize } = require('../database/connection');
const {
  Job,
  Customer,
  User,
  Part,
  EstimateLineItem,
  PartsOrderItem,
} = require('../database/models');
const { Op } = require('sequelize');

/**
 * Advanced Analytics Service for CollisionOS
 * Provides business intelligence, reporting, and predictive analytics
 * Uses direct Sequelize models for all database operations
 */
class AnalyticsService {
  // ==============================================================
  // DASHBOARD ANALYTICS
  // ==============================================================

  /**
   * Get comprehensive dashboard statistics
   * @param {string} shopId - Shop ID
   * @param {string} period - 'today', 'week', 'month', 'quarter', 'year'
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(shopId, period = 'month') {
    try {
      const dateFilter = this.getDateFilter(period);
      return await this.getSequelizeDashboardStats(shopId, dateFilter);
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get dashboard stats using Sequelize ORM
   */
  async getSequelizeDashboardStats(shopId, dateFilter) {
    const stats = {};

    // Job statistics with aggregations
    const jobStats = await Job.findAll({
      attributes: [
        'id',
        'status',
        'totalAmount',
        'cycleTime',
        'createdAt',
        'completionDate',
      ],
      where: {
        shopId,
        createdAt: { [Op.gte]: dateFilter.start },
      },
      raw: true,
    });

    // Calculate job metrics
    const activeStatuses = [
      'body_structure',
      'paint_prep',
      'paint_booth',
      'reassembly',
    ];
    const activeJobs = jobStats.filter(j => activeStatuses.includes(j.status));
    const completedJobs = jobStats.filter(j => j.status === 'delivered');

    // Revenue aggregation for completed jobs
    const revenueResult = await Job.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        shopId,
        status: 'delivered',
        createdAt: { [Op.gte]: dateFilter.start },
      },
      raw: true,
    });

    // Average cycle time for completed jobs
    const cycleTimeResult = await Job.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('cycleTime')), 'avgCycleTime'],
      ],
      where: {
        shopId,
        status: 'delivered',
        cycleTime: { [Op.not]: null },
        createdAt: { [Op.gte]: dateFilter.start },
      },
      raw: true,
    });

    stats.jobs = {
      total: jobStats.length,
      active: activeJobs.length,
      completed: completedJobs.length,
      revenue: parseFloat(revenueResult?.totalRevenue || 0),
      avg_cycle_time: parseFloat(cycleTimeResult?.avgCycleTime || 0),
    };

    // Customer statistics
    const customerStats = await Customer.findAll({
      attributes: ['id', 'createdAt'],
      where: { shopId },
      raw: true,
    });

    const newCustomers = customerStats.filter(
      c => new Date(c.createdAt) >= dateFilter.start
    );

    stats.customers = {
      total: customerStats.length,
      new_period: newCustomers.length,
    };

    // Parts statistics
    const lowStockParts = await Part.count({
      where: {
        shopId,
        isActive: true,
        currentStock: {
          [Op.lte]: sequelize.col('minimumStock'),
        },
      },
    });

    const reorderNeededParts = await Part.count({
      where: {
        shopId,
        isActive: true,
        currentStock: {
          [Op.lte]: sequelize.col('reorderPoint'),
        },
      },
    });

    stats.parts = {
      low_stock: lowStockParts,
      reorder_needed: reorderNeededParts,
    };

    return stats;
  }

  // ==============================================================
  // REVENUE ANALYTICS
  // ==============================================================

  /**
   * Get revenue analytics and trends
   * @param {string} shopId - Shop ID
   * @param {string} period - Analysis period
   * @param {string} groupBy - 'day', 'week', 'month'
   * @returns {Promise<Object>} Revenue analytics
   */
  async getRevenueAnalytics(shopId, period = 'year', groupBy = 'month') {
    try {
      const dateFilter = this.getDateFilter(period);
      return await this.getSequelizeRevenueAnalytics(
        shopId,
        dateFilter,
        groupBy
      );
    } catch (error) {
      throw new Error(`Failed to get revenue analytics: ${error.message}`);
    }
  }

  async getSequelizeRevenueAnalytics(shopId, dateFilter, groupBy) {
    const jobs = await Job.findAll({
      attributes: [
        'totalAmount',
        'laborAmount',
        'partsAmount',
        'materialsAmount',
        'createdAt',
        'completionDate',
      ],
      where: {
        shopId,
        status: 'delivered',
        completionDate: {
          [Op.gte]: dateFilter.start,
          [Op.lte]: dateFilter.end,
        },
      },
      order: [['completionDate', 'ASC']],
      raw: true,
    });

    return this.processRevenueData(jobs, groupBy);
  }

  /**
   * Process revenue data for charts and analysis
   */
  processRevenueData(data, groupBy) {
    const grouped = {};
    const totals = {
      revenue: 0,
      labor: 0,
      parts: 0,
      materials: 0,
      jobs: 0,
    };

    data.forEach(item => {
      const date = new Date(item.completionDate || item.month);
      const key = this.formatDateKey(date, groupBy);

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          revenue: 0,
          labor: 0,
          parts: 0,
          materials: 0,
          jobs: 0,
        };
      }

      const revenue = parseFloat(item.totalAmount || item.revenue || 0);
      const labor = parseFloat(item.laborAmount || 0);
      const parts = parseFloat(item.partsAmount || 0);
      const materials = parseFloat(item.materialsAmount || 0);

      grouped[key].revenue += revenue;
      grouped[key].labor += labor;
      grouped[key].parts += parts;
      grouped[key].materials += materials;
      grouped[key].jobs += 1;

      totals.revenue += revenue;
      totals.labor += labor;
      totals.parts += parts;
      totals.materials += materials;
      totals.jobs += 1;
    });

    const timeline = Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate growth rates
    timeline.forEach((item, index) => {
      if (index > 0) {
        const prev = timeline[index - 1];
        item.growth_rate =
          prev.revenue > 0
            ? ((item.revenue - prev.revenue) / prev.revenue) * 100
            : 0;
      } else {
        item.growth_rate = 0;
      }
    });

    return {
      timeline,
      totals,
      averages: {
        revenue_per_job: totals.jobs > 0 ? totals.revenue / totals.jobs : 0,
        revenue_per_period:
          timeline.length > 0 ? totals.revenue / timeline.length : 0,
      },
    };
  }

  // ==============================================================
  // CUSTOMER ANALYTICS
  // ==============================================================

  /**
   * Get customer analytics including LTV, churn risk, and segmentation
   * @param {string} shopId - Shop ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Customer analytics
   */
  async getCustomerAnalytics(shopId, options = {}) {
    try {
      return await this.getSequelizeCustomerAnalytics(shopId, options);
    } catch (error) {
      throw new Error(`Failed to get customer analytics: ${error.message}`);
    }
  }

  async getSequelizeCustomerAnalytics(shopId, options) {
    // Get all active customers
    const customers = await Customer.findAll({
      where: { shopId, isActive: true },
      raw: true,
    });

    const analytics = [];

    for (const customer of customers) {
      // Get all jobs for this customer
      const jobs = await Job.findAll({
        where: { customerId: customer.id, shopId },
        raw: true,
      });

      const completedJobs = jobs.filter(j => j.status === 'delivered');

      // Calculate total spent using aggregation
      const revenueResult = await Job.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'completedCount'],
        ],
        where: {
          customerId: customer.id,
          shopId,
          status: 'delivered',
        },
        raw: true,
      });

      const totalSpent = parseFloat(revenueResult?.totalSpent || 0);
      const completedCount = parseInt(revenueResult?.completedCount || 0);
      const avgJobValue = completedCount > 0 ? totalSpent / completedCount : 0;

      // Calculate days since last job
      const lastJobDate =
        jobs.length > 0
          ? new Date(Math.max(...jobs.map(j => new Date(j.createdAt))))
          : null;
      const daysSinceLastJob = lastJobDate
        ? Math.floor(
            (Date.now() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 9999;

      // Simple churn risk calculation
      const churnRisk = this.calculateChurnRisk(
        daysSinceLastJob,
        avgJobValue,
        jobs.length
      );

      // Customer segmentation
      const segment = this.determineCustomerSegment(
        totalSpent,
        daysSinceLastJob,
        jobs.length
      );

      analytics.push({
        customer_id: customer.id,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        total_jobs: jobs.length,
        completed_jobs: completedCount,
        total_spent: totalSpent,
        avg_job_value: avgJobValue,
        days_since_last_job: daysSinceLastJob,
        churn_risk_score: churnRisk,
        segment,
        lifetime_value: this.calculateLifetimeValue(
          totalSpent,
          jobs.length,
          daysSinceLastJob
        ),
      });
    }

    return this.processCustomerAnalytics(analytics, analytics);
  }

  /**
   * Process customer analytics data
   */
  processCustomerAnalytics(segments, analytics) {
    // Segment distribution
    const segmentDistribution = {};
    segments.forEach(customer => {
      segmentDistribution[customer.segment] =
        (segmentDistribution[customer.segment] || 0) + 1;
    });

    // Top customers by LTV
    const topCustomers = analytics
      .sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
      .slice(0, 10);

    // At-risk customers (high churn risk)
    const atRiskCustomers = analytics
      .filter(c => (c.churn_risk_score || 0) > 0.7)
      .sort((a, b) => (b.churn_risk_score || 0) - (a.churn_risk_score || 0));

    // Summary statistics
    const totalLTV = analytics.reduce(
      (sum, c) => sum + (c.lifetime_value || 0),
      0
    );
    const avgLTV = analytics.length > 0 ? totalLTV / analytics.length : 0;
    const avgChurnRisk =
      analytics.length > 0
        ? analytics.reduce((sum, c) => sum + (c.churn_risk_score || 0), 0) /
          analytics.length
        : 0;

    return {
      segmentDistribution,
      topCustomers,
      atRiskCustomers,
      summary: {
        total_customers: analytics.length,
        avg_lifetime_value: avgLTV,
        total_lifetime_value: totalLTV,
        avg_churn_risk: avgChurnRisk,
        high_risk_customers: atRiskCustomers.length,
      },
    };
  }

  // ==============================================================
  // TECHNICIAN PERFORMANCE ANALYTICS
  // ==============================================================

  /**
   * Get technician performance metrics
   * @param {string} shopId - Shop ID
   * @param {string} period - Analysis period
   * @returns {Promise<Object>} Technician performance data
   */
  async getTechnicianAnalytics(shopId, period = 'month') {
    try {
      const dateFilter = this.getDateFilter(period);
      return await this.getSequelizeTechnicianAnalytics(shopId, dateFilter);
    } catch (error) {
      throw new Error(`Failed to get technician analytics: ${error.message}`);
    }
  }

  async getSequelizeTechnicianAnalytics(shopId, dateFilter) {
    const technicians = await User.findAll({
      where: {
        shopId,
        role: 'technician',
        isActive: true,
      },
      raw: true,
    });

    const analytics = [];

    for (const tech of technicians) {
      const jobs = await Job.findAll({
        where: {
          assignedTo: tech.id,
          shopId,
          createdAt: { [Op.gte]: dateFilter.start },
        },
        raw: true,
      });

      const completedJobs = jobs.filter(j => j.status === 'delivered');

      // Aggregate revenue and hours
      const aggregates = await Job.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('actualHours')), 'totalHours'],
          [sequelize.fn('AVG', sequelize.col('efficiency')), 'avgEfficiency'],
        ],
        where: {
          assignedTo: tech.id,
          shopId,
          status: 'delivered',
          createdAt: { [Op.gte]: dateFilter.start },
        },
        raw: true,
      });

      const totalRevenue = parseFloat(aggregates?.totalRevenue || 0);
      const totalHours = parseFloat(aggregates?.totalHours || 0);
      const avgEfficiency = parseFloat(aggregates?.avgEfficiency || 100);

      analytics.push({
        technician_id: tech.id,
        technician_name: `${tech.firstName} ${tech.lastName}`,
        total_jobs: jobs.length,
        completed_jobs: completedJobs.length,
        total_hours: totalHours,
        revenue_generated: totalRevenue,
        avg_efficiency: avgEfficiency,
        revenue_per_hour: totalHours > 0 ? totalRevenue / totalHours : 0,
        completion_rate:
          jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      });
    }

    return analytics.sort((a, b) => b.revenue_generated - a.revenue_generated);
  }

  // ==============================================================
  // PARTS AND INVENTORY ANALYTICS
  // ==============================================================

  /**
   * Get parts and inventory analytics
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object>} Parts analytics
   */
  async getPartsAnalytics(shopId) {
    try {
      return await this.getSequelizePartsAnalytics(shopId);
    } catch (error) {
      throw new Error(`Failed to get parts analytics: ${error.message}`);
    }
  }

  async getSequelizePartsAnalytics(shopId) {
    const parts = await Part.findAll({
      where: { shopId, isActive: true },
      raw: true,
    });

    const analytics = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const part of parts) {
      // Get recent usage from EstimateLineItem (which represents job parts)
      const lineItems = await EstimateLineItem.findAll({
        where: {
          partNumber: part.partNumber,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
        raw: true,
      });

      // Aggregate usage statistics
      const usage = await EstimateLineItem.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'quantityUsed'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue'],
        ],
        where: {
          partNumber: part.partNumber,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
        raw: true,
      });

      const quantityUsed30d = parseFloat(usage?.quantityUsed || 0);
      const totalRevenue30d = parseFloat(usage?.totalRevenue || 0);

      // Calculate cost (estimate based on part cost price and quantity)
      const totalCost30d = quantityUsed30d * (part.costPrice || 0);
      const margin30d = totalRevenue30d - totalCost30d;
      const marginPercentage =
        totalRevenue30d > 0 ? (margin30d / totalRevenue30d) * 100 : 0;

      // Calculate turnover rate
      const avgStock = part.currentStock > 0 ? part.currentStock : 1;
      const turnoverRate =
        quantityUsed30d > 0 ? (quantityUsed30d * 12) / avgStock : 0;

      // Determine ABC class based on revenue
      let abcClass = 'C';
      if (totalRevenue30d > 1000) abcClass = 'A';
      else if (totalRevenue30d > 300) abcClass = 'B';

      analytics.push({
        part_id: part.id,
        part_number: part.partNumber,
        description: part.description,
        current_stock: part.currentStock,
        quantity_used_30d: quantityUsed30d,
        total_revenue_30d: totalRevenue30d,
        margin_30d: margin30d,
        margin_percentage: marginPercentage,
        turnover_rate: turnoverRate,
        abc_class: abcClass,
        velocity_class:
          turnoverRate > 6 ? 'Fast' : turnoverRate > 2 ? 'Medium' : 'Slow',
        cost_price: part.costPrice,
      });
    }

    return this.processPartsAnalytics(analytics);
  }

  processPartsAnalytics(data) {
    const summary = {
      total_parts: data.length,
      abc_distribution: { A: 0, B: 0, C: 0 },
      velocity_distribution: { Fast: 0, Medium: 0, Slow: 0 },
      total_inventory_value: 0,
      avg_margin: 0,
    };

    data.forEach(part => {
      summary.abc_distribution[part.abc_class]++;
      summary.velocity_distribution[part.velocity_class]++;
      summary.total_inventory_value +=
        (part.current_stock || 0) * (part.cost_price || 0);
    });

    summary.avg_margin =
      data.length > 0
        ? data.reduce((sum, p) => sum + (p.margin_percentage || 0), 0) /
          data.length
        : 0;

    // Top performing parts
    const topParts = data
      .sort((a, b) => (b.total_revenue_30d || 0) - (a.total_revenue_30d || 0))
      .slice(0, 10);

    // Low stock parts
    const lowStockParts = data
      .filter(p => (p.current_stock || 0) <= (p.minimum_stock || 0))
      .sort((a, b) => (a.current_stock || 0) - (b.current_stock || 0));

    return {
      summary,
      topParts,
      lowStockParts,
      fullAnalytics: data,
    };
  }

  // ==============================================================
  // UTILITY METHODS
  // ==============================================================

  /**
   * Get date filter based on period
   */
  getDateFilter(period) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
  }

  /**
   * Format date key for grouping
   */
  formatDateKey(date, groupBy) {
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const week = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${week}`;
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return String(date.getFullYear());
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Get week number of the year
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Calculate average of numeric array
   */
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate simple churn risk score
   */
  calculateChurnRisk(daysSinceLastJob, avgJobValue, totalJobs) {
    let risk = 0;

    // Time factor (60%)
    if (daysSinceLastJob > 365) risk += 0.6;
    else if (daysSinceLastJob > 180) risk += 0.4;
    else if (daysSinceLastJob > 90) risk += 0.2;

    // Value factor (20%)
    if (avgJobValue < 500) risk += 0.2;
    else if (avgJobValue < 1000) risk += 0.1;

    // Frequency factor (20%)
    if (totalJobs === 1) risk += 0.2;
    else if (totalJobs < 3) risk += 0.1;

    return Math.min(1, risk);
  }

  /**
   * Determine customer segment
   */
  determineCustomerSegment(totalSpent, daysSinceLastJob, totalJobs) {
    if (totalSpent > 10000 && daysSinceLastJob < 90) return 'VIP';
    if (totalSpent > 5000 && daysSinceLastJob < 180) return 'High Value';
    if (totalJobs > 3 && daysSinceLastJob < 365) return 'Loyal';
    if (daysSinceLastJob > 365) return 'At Risk';
    if (totalJobs === 0) return 'Prospect';
    return 'Regular';
  }

  /**
   * Calculate lifetime value
   */
  calculateLifetimeValue(totalSpent, totalJobs, daysSinceLastJob) {
    if (totalJobs === 0) return 0;

    const avgJobValue = totalSpent / totalJobs;
    const predictedLifespan = daysSinceLastJob < 90 ? 36 : 24; // months
    const avgJobsPerYear =
      totalJobs > 1
        ? Math.max(1, totalJobs * (365 / Math.max(365, daysSinceLastJob)))
        : 1;

    return avgJobValue * avgJobsPerYear * (predictedLifespan / 12);
  }

  /**
   * Update daily metrics (called by scheduled job)
   * NOTE: DailyMetric model not yet implemented - this is a placeholder
   */
  async updateDailyMetrics(shopId, targetDate = new Date()) {
    try {
      // TODO: Implement daily metrics tracking
      // await this.calculateAndStoreDailyMetrics(shopId, targetDate);
      console.warn('Daily metrics tracking not yet implemented');
    } catch (error) {
      throw new Error(`Failed to update daily metrics: ${error.message}`);
    }
  }

  /**
   * Calculate and store daily metrics
   * NOTE: Requires DailyMetric model to be created
   */
  async calculateAndStoreDailyMetrics(shopId, targetDate) {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate jobs created
    const jobsCreatedCount = await Job.count({
      where: {
        shopId,
        createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
      },
    });

    // Calculate jobs completed
    const jobsCompletedCount = await Job.count({
      where: {
        shopId,
        status: 'delivered',
        completionDate: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
      },
    });

    // Calculate revenue and cycle time
    const metrics = await Job.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenueTotal'],
        [sequelize.fn('AVG', sequelize.col('cycleTime')), 'avgCycleTime'],
      ],
      where: {
        shopId,
        status: 'delivered',
        completionDate: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
      },
      raw: true,
    });

    const revenueTotal = parseFloat(metrics?.revenueTotal || 0);
    const avgCycleTime = parseFloat(metrics?.avgCycleTime || 0);

    // TODO: Upsert to DailyMetric model once it's created
    const metricsData = {
      shopId,
      metricDate: dateStr,
      jobsCreated: jobsCreatedCount,
      jobsCompleted: jobsCompletedCount,
      revenueTotal,
      avgCycleTime,
      updatedAt: new Date(),
    };

    console.log('Daily metrics calculated:', metricsData);

    // TODO: Implement upsert when DailyMetric model exists
    // await DailyMetric.upsert(metricsData);
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = {
  AnalyticsService,
  analyticsService,
};
