const { databaseService } = require('./databaseService');
const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');

/**
 * Advanced Analytics Service for CollisionOS
 * Provides business intelligence, reporting, and predictive analytics
 * Compatible with both Supabase (PostgreSQL) and SQLite
 */
class AnalyticsService {
  constructor() {
    this.useSupabase = isSupabaseEnabled;
  }

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

      if (this.useSupabase) {
        return await this.getSupabaseDashboardStats(shopId, dateFilter);
      } else {
        return await this.getSQLiteDashboardStats(shopId, dateFilter);
      }
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get Supabase dashboard stats using RPC function
   */
  async getSupabaseDashboardStats(shopId, dateFilter) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_shop_dashboard_stats', {
      shop_uuid: shopId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get SQLite dashboard stats using raw queries
   */
  async getSQLiteDashboardStats(shopId, dateFilter) {
    const stats = {};

    // Job statistics
    const jobStats = await databaseService.query('jobs', {
      select:
        'id, status, total_amount, cycle_time, created_at, completion_date',
      where: {
        shop_id: shopId,
        created_at: { gte: dateFilter.start },
      },
    });

    stats.jobs = {
      total: jobStats.length,
      active: jobStats.filter(j =>
        ['body_structure', 'paint_prep', 'paint_booth', 'reassembly'].includes(
          j.status
        )
      ).length,
      completed: jobStats.filter(j => j.status === 'delivered').length,
      revenue: jobStats
        .filter(j => j.status === 'delivered')
        .reduce((sum, j) => sum + (j.total_amount || 0), 0),
      avg_cycle_time: this.calculateAverage(
        jobStats.filter(j => j.cycle_time).map(j => j.cycle_time)
      ),
    };

    // Customer statistics
    const customerStats = await databaseService.query('customers', {
      select: 'id, created_at',
      where: { shop_id: shopId },
    });

    stats.customers = {
      total: customerStats.length,
      new_period: customerStats.filter(
        c => new Date(c.created_at) >= dateFilter.start
      ).length,
    };

    // Parts statistics
    const partsStats = await databaseService.query('parts', {
      select: 'current_stock, minimum_stock, reorder_point',
      where: { shop_id: shopId, is_active: true },
    });

    stats.parts = {
      low_stock: partsStats.filter(p => p.current_stock <= p.minimum_stock)
        .length,
      reorder_needed: partsStats.filter(p => p.current_stock <= p.reorder_point)
        .length,
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

      if (this.useSupabase) {
        return await this.getSupabaseRevenueAnalytics(
          shopId,
          dateFilter,
          groupBy
        );
      } else {
        return await this.getSQLiteRevenueAnalytics(
          shopId,
          dateFilter,
          groupBy
        );
      }
    } catch (error) {
      throw new Error(`Failed to get revenue analytics: ${error.message}`);
    }
  }

  async getSupabaseRevenueAnalytics(shopId, dateFilter, groupBy) {
    const supabase = getSupabaseClient();

    // Use materialized view if available, fallback to regular query
    const { data, error } = await supabase
      .from('revenue_trends')
      .select('*')
      .eq('shop_id', shopId)
      .gte('month', dateFilter.start.toISOString())
      .lte('month', dateFilter.end.toISOString())
      .order('month');

    if (error) throw error;
    return this.processRevenueData(data, groupBy);
  }

  async getSQLiteRevenueAnalytics(shopId, dateFilter, groupBy) {
    const jobs = await databaseService.query('jobs', {
      select:
        'total_amount, labor_amount, parts_amount, materials_amount, created_at, completion_date',
      where: {
        shop_id: shopId,
        status: 'delivered',
        completion_date: {
          gte: dateFilter.start,
          lte: dateFilter.end,
        },
      },
      order: [['completion_date', 'ASC']],
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
      const date = new Date(item.completion_date || item.month);
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

      const revenue = parseFloat(item.total_amount || item.revenue || 0);
      const labor = parseFloat(item.labor_amount || 0);
      const parts = parseFloat(item.parts_amount || 0);
      const materials = parseFloat(item.materials_amount || 0);

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
      if (this.useSupabase) {
        return await this.getSupabaseCustomerAnalytics(shopId, options);
      } else {
        return await this.getSQLiteCustomerAnalytics(shopId, options);
      }
    } catch (error) {
      throw new Error(`Failed to get customer analytics: ${error.message}`);
    }
  }

  async getSupabaseCustomerAnalytics(shopId, options) {
    const supabase = getSupabaseClient();

    // Get customer segments from materialized view
    const { data: segments, error: segmentsError } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('shop_id', shopId);

    if (segmentsError) throw segmentsError;

    // Get customer analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('customer_analytics')
      .select('*')
      .eq('shop_id', shopId)
      .order('lifetime_value', { ascending: false });

    if (analyticsError) throw analyticsError;

    return this.processCustomerAnalytics(segments, analytics);
  }

  async getSQLiteCustomerAnalytics(shopId, options) {
    // Get all customers with their job statistics
    const customers = await databaseService.query('customers', {
      where: { shop_id: shopId, is_active: true },
    });

    const analytics = [];

    for (const customer of customers) {
      const jobs = await databaseService.query('jobs', {
        where: { customer_id: customer.id, shop_id: shopId },
      });

      const completedJobs = jobs.filter(j => j.status === 'delivered');
      const totalSpent = completedJobs.reduce(
        (sum, j) => sum + (j.total_amount || 0),
        0
      );
      const avgJobValue =
        completedJobs.length > 0 ? totalSpent / completedJobs.length : 0;

      // Calculate days since last job
      const lastJobDate =
        jobs.length > 0
          ? new Date(Math.max(...jobs.map(j => new Date(j.created_at))))
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
        customer_name: `${customer.first_name} ${customer.last_name}`,
        total_jobs: jobs.length,
        completed_jobs: completedJobs.length,
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

      if (this.useSupabase) {
        return await this.getSupabaseTechnicianAnalytics(shopId, dateFilter);
      } else {
        return await this.getSQLiteTechnicianAnalytics(shopId, dateFilter);
      }
    } catch (error) {
      throw new Error(`Failed to get technician analytics: ${error.message}`);
    }
  }

  async getSupabaseTechnicianAnalytics(shopId, dateFilter) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('technician_efficiency')
      .select('*')
      .eq('shop_id', shopId);

    if (error) throw error;
    return data;
  }

  async getSQLiteTechnicianAnalytics(shopId, dateFilter) {
    const technicians = await databaseService.query('users', {
      where: {
        shop_id: shopId,
        role: 'technician',
        is_active: true,
      },
    });

    const analytics = [];

    for (const tech of technicians) {
      const jobs = await databaseService.query('jobs', {
        where: {
          assigned_to: tech.id,
          shop_id: shopId,
          created_at: { gte: dateFilter.start },
        },
      });

      const completedJobs = jobs.filter(j => j.status === 'delivered');
      const totalRevenue = completedJobs.reduce(
        (sum, j) => sum + (j.total_amount || 0),
        0
      );
      const totalHours = completedJobs.reduce(
        (sum, j) => sum + (j.actual_hours || 0),
        0
      );
      const avgEfficiency =
        completedJobs.length > 0
          ? completedJobs.reduce((sum, j) => sum + (j.efficiency || 100), 0) /
            completedJobs.length
          : 100;

      analytics.push({
        technician_id: tech.id,
        technician_name: `${tech.first_name} ${tech.last_name}`,
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
      if (this.useSupabase) {
        return await this.getSupabasePartsAnalytics(shopId);
      } else {
        return await this.getSQLitePartsAnalytics(shopId);
      }
    } catch (error) {
      throw new Error(`Failed to get parts analytics: ${error.message}`);
    }
  }

  async getSupabasePartsAnalytics(shopId) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('parts_analytics')
      .select('*')
      .eq('shop_id', shopId)
      .order('margin_percentage', { ascending: false });

    if (error) throw error;
    return this.processPartsAnalytics(data);
  }

  async getSQLitePartsAnalytics(shopId) {
    const parts = await databaseService.query('parts', {
      where: { shop_id: shopId, is_active: true },
    });

    const analytics = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const part of parts) {
      // Get recent job parts usage
      const jobParts = await databaseService.query('job_parts', {
        where: {
          part_id: part.id,
          created_at: { gte: thirtyDaysAgo },
        },
      });

      const quantityUsed30d = jobParts.reduce(
        (sum, jp) => sum + (jp.quantity_needed || 0),
        0
      );
      const totalRevenue30d = jobParts.reduce(
        (sum, jp) => sum + (jp.total_price || 0),
        0
      );
      const totalCost30d = jobParts.reduce(
        (sum, jp) => sum + (jp.total_cost || 0),
        0
      );
      const margin30d = totalRevenue30d - totalCost30d;
      const marginPercentage =
        totalRevenue30d > 0 ? (margin30d / totalRevenue30d) * 100 : 0;

      // Calculate turnover rate
      const avgStock = part.current_stock > 0 ? part.current_stock : 1;
      const turnoverRate =
        quantityUsed30d > 0 ? (quantityUsed30d * 12) / avgStock : 0;

      // Determine ABC class based on revenue
      let abcClass = 'C';
      if (totalRevenue30d > 1000) abcClass = 'A';
      else if (totalRevenue30d > 300) abcClass = 'B';

      analytics.push({
        part_id: part.id,
        part_number: part.part_number,
        description: part.description,
        current_stock: part.current_stock,
        quantity_used_30d: quantityUsed30d,
        total_revenue_30d: totalRevenue30d,
        margin_30d: margin30d,
        margin_percentage: marginPercentage,
        turnover_rate: turnoverRate,
        abc_class: abcClass,
        velocity_class:
          turnoverRate > 6 ? 'Fast' : turnoverRate > 2 ? 'Medium' : 'Slow',
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
   */
  async updateDailyMetrics(shopId, targetDate = new Date()) {
    try {
      if (this.useSupabase) {
        const supabase = getSupabaseClient();
        await supabase.rpc('update_daily_metrics', {
          target_date: targetDate.toISOString().split('T')[0],
          shop_uuid: shopId,
        });
      } else {
        // SQLite implementation would require custom calculations
        await this.calculateAndStoreDailyMetrics(shopId, targetDate);
      }
    } catch (error) {
      throw new Error(`Failed to update daily metrics: ${error.message}`);
    }
  }

  /**
   * Calculate and store daily metrics for SQLite
   */
  async calculateAndStoreDailyMetrics(shopId, targetDate) {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate metrics for the day
    const jobsCreated = await databaseService.query('jobs', {
      where: {
        shop_id: shopId,
        created_at: { gte: startOfDay, lte: endOfDay },
      },
    });

    const jobsCompleted = await databaseService.query('jobs', {
      where: {
        shop_id: shopId,
        status: 'delivered',
        completion_date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const revenueTotal = jobsCompleted.reduce(
      (sum, job) => sum + (job.total_amount || 0),
      0
    );
    const avgCycleTime = this.calculateAverage(
      jobsCompleted.map(job => job.cycle_time).filter(Boolean)
    );

    // Upsert daily metrics
    const existingMetric = await databaseService.query('daily_metrics', {
      where: { shop_id: shopId, metric_date: dateStr },
    });

    const metricsData = {
      shop_id: shopId,
      metric_date: dateStr,
      jobs_created: jobsCreated.length,
      jobs_completed: jobsCompleted.length,
      revenue_total: revenueTotal,
      avg_cycle_time: avgCycleTime,
      updated_at: new Date(),
    };

    if (existingMetric.length > 0) {
      await databaseService.update('daily_metrics', metricsData, {
        id: existingMetric[0].id,
      });
    } else {
      await databaseService.insert('daily_metrics', metricsData);
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = {
  AnalyticsService,
  analyticsService,
};
