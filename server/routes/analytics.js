const express = require('express');
const router = express.Router();
const { analyticsService } = require('../services/analyticsService');
const { auth, requirePermission } = require('../middleware/auth');

/**
 * Analytics API Routes
 * All routes require authentication and appropriate permissions
 */

// ==============================================================
// DASHBOARD ANALYTICS
// ==============================================================

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard statistics
 */
router.get('/dashboard', auth, requirePermission('dashboard.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { period = 'month' } = req.query;

        const stats = await analyticsService.getDashboardStats(shopId, period);
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard analytics',
            error: error.message
        });
    }
});

// ==============================================================
// REVENUE ANALYTICS
// ==============================================================

/**
 * GET /api/analytics/revenue
 * Get revenue analytics and trends
 */
router.get('/revenue', auth, requirePermission('financial.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { 
            period = 'year',
            groupBy = 'month',
            includeForecasting = false
        } = req.query;

        const analytics = await analyticsService.getRevenueAnalytics(shopId, period, groupBy);
        
        // Add forecasting if requested (simplified implementation)
        if (includeForecasting === 'true') {
            analytics.forecast = await generateRevenueForecast(analytics.timeline);
        }

        res.json({
            success: true,
            data: analytics,
            period,
            groupBy
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/revenue/comparison
 * Compare revenue across different periods
 */
router.get('/revenue/comparison', auth, requirePermission('financial.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { 
            currentPeriod = 'month',
            comparisonPeriod = 'month',
            groupBy = 'day'
        } = req.query;

        // Get current period data
        const currentData = await analyticsService.getRevenueAnalytics(shopId, currentPeriod, groupBy);
        
        // Get comparison period data (shifted back)
        const comparisonData = await analyticsService.getRevenueAnalytics(
            shopId, 
            comparisonPeriod, 
            groupBy
        );

        // Calculate comparison metrics
        const comparison = {
            current: currentData.totals,
            previous: comparisonData.totals,
            change: {
                revenue: calculatePercentageChange(currentData.totals.revenue, comparisonData.totals.revenue),
                jobs: calculatePercentageChange(currentData.totals.jobs, comparisonData.totals.jobs),
                avg_job_value: calculatePercentageChange(
                    currentData.averages.revenue_per_job,
                    comparisonData.averages.revenue_per_job
                )
            }
        };

        res.json({
            success: true,
            data: {
                comparison,
                currentTimeline: currentData.timeline,
                previousTimeline: comparisonData.timeline
            }
        });
    } catch (error) {
        console.error('Revenue comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue comparison',
            error: error.message
        });
    }
});

// ==============================================================
// CUSTOMER ANALYTICS
// ==============================================================

/**
 * GET /api/analytics/customers
 * Get customer analytics including LTV and segmentation
 */
router.get('/customers', auth, requirePermission('customers.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { 
            segment,
            sortBy = 'lifetime_value',
            limit = 100,
            includeChurnRisk = true
        } = req.query;

        const analytics = await analyticsService.getCustomerAnalytics(shopId, {
            segment,
            sortBy,
            limit: parseInt(limit),
            includeChurnRisk: includeChurnRisk === 'true'
        });

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Customer analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/customers/segments
 * Get customer segmentation analysis
 */
router.get('/customers/segments', auth, requirePermission('customers.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        
        const analytics = await analyticsService.getCustomerAnalytics(shopId);
        
        res.json({
            success: true,
            data: {
                segmentDistribution: analytics.segmentDistribution,
                summary: analytics.summary
            }
        });
    } catch (error) {
        console.error('Customer segmentation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer segmentation',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/customers/churn-risk
 * Get customers at risk of churning
 */
router.get('/customers/churn-risk', auth, requirePermission('customers.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { threshold = 0.7 } = req.query;
        
        const analytics = await analyticsService.getCustomerAnalytics(shopId);
        
        const atRiskCustomers = analytics.atRiskCustomers.filter(
            customer => customer.churn_risk_score >= parseFloat(threshold)
        );

        res.json({
            success: true,
            data: {
                atRiskCustomers,
                totalAtRisk: atRiskCustomers.length,
                threshold: parseFloat(threshold)
            }
        });
    } catch (error) {
        console.error('Churn risk analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch churn risk analytics',
            error: error.message
        });
    }
});

// ==============================================================
// TECHNICIAN PERFORMANCE ANALYTICS
// ==============================================================

/**
 * GET /api/analytics/technicians
 * Get technician performance metrics
 */
router.get('/technicians', auth, requirePermission('users.view'), async (req, res) => {
    try {
        const { shopId, role } = req.user;
        const { period = 'month', technicianId } = req.query;

        // Technicians can only view their own data unless they have management permissions
        const canViewAll = ['owner', 'manager', 'admin'].includes(role);
        
        const analytics = await analyticsService.getTechnicianAnalytics(shopId, period);
        
        // Filter data based on permissions
        let filteredAnalytics = analytics;
        if (!canViewAll) {
            filteredAnalytics = analytics.filter(tech => tech.technician_id === req.user.id);
        } else if (technicianId) {
            filteredAnalytics = analytics.filter(tech => tech.technician_id === technicianId);
        }

        res.json({
            success: true,
            data: filteredAnalytics,
            period
        });
    } catch (error) {
        console.error('Technician analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch technician analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/technicians/leaderboard
 * Get technician performance leaderboard
 */
router.get('/technicians/leaderboard', auth, requirePermission('users.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { 
            period = 'month',
            metric = 'revenue_per_hour',
            limit = 10
        } = req.query;

        const analytics = await analyticsService.getTechnicianAnalytics(shopId, period);
        
        // Sort by requested metric
        const sortedAnalytics = analytics.sort((a, b) => {
            const aValue = parseFloat(a[metric] || 0);
            const bValue = parseFloat(b[metric] || 0);
            return bValue - aValue;
        });

        const leaderboard = sortedAnalytics.slice(0, parseInt(limit)).map((tech, index) => ({
            ...tech,
            rank: index + 1
        }));

        res.json({
            success: true,
            data: {
                leaderboard,
                metric,
                period
            }
        });
    } catch (error) {
        console.error('Technician leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch technician leaderboard',
            error: error.message
        });
    }
});

// ==============================================================
// PARTS AND INVENTORY ANALYTICS
// ==============================================================

/**
 * GET /api/analytics/parts
 * Get parts and inventory analytics
 */
router.get('/parts', auth, requirePermission('parts.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { 
            category,
            abcClass,
            velocityClass,
            lowStock = false
        } = req.query;

        const analytics = await analyticsService.getPartsAnalytics(shopId);
        
        // Apply filters
        let filteredAnalytics = analytics.fullAnalytics;
        
        if (category) {
            filteredAnalytics = filteredAnalytics.filter(part => part.category === category);
        }
        
        if (abcClass) {
            filteredAnalytics = filteredAnalytics.filter(part => part.abc_class === abcClass);
        }
        
        if (velocityClass) {
            filteredAnalytics = filteredAnalytics.filter(part => part.velocity_class === velocityClass);
        }
        
        if (lowStock === 'true') {
            filteredAnalytics = analytics.lowStockParts;
        }

        res.json({
            success: true,
            data: {
                ...analytics,
                filteredAnalytics
            }
        });
    } catch (error) {
        console.error('Parts analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parts analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/analytics/inventory/optimization
 * Get inventory optimization recommendations
 */
router.get('/inventory/optimization', auth, requirePermission('inventory.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        
        const analytics = await analyticsService.getPartsAnalytics(shopId);
        
        // Generate optimization recommendations
        const recommendations = generateInventoryRecommendations(analytics);

        res.json({
            success: true,
            data: {
                summary: analytics.summary,
                recommendations
            }
        });
    } catch (error) {
        console.error('Inventory optimization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory optimization',
            error: error.message
        });
    }
});

// ==============================================================
// BUSINESS INTELLIGENCE REPORTS
// ==============================================================

/**
 * GET /api/analytics/reports/executive-summary
 * Get executive summary report
 */
router.get('/reports/executive-summary', auth, requirePermission('reports.view'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { period = 'month' } = req.query;

        // Get data from multiple analytics endpoints
        const [
            dashboardStats,
            revenueAnalytics,
            customerAnalytics,
            technicianAnalytics,
            partsAnalytics
        ] = await Promise.all([
            analyticsService.getDashboardStats(shopId, period),
            analyticsService.getRevenueAnalytics(shopId, period),
            analyticsService.getCustomerAnalytics(shopId),
            analyticsService.getTechnicianAnalytics(shopId, period),
            analyticsService.getPartsAnalytics(shopId)
        ]);

        const executiveSummary = {
            period,
            generatedAt: new Date().toISOString(),
            
            // Key metrics
            keyMetrics: {
                totalRevenue: revenueAnalytics.totals.revenue,
                totalJobs: revenueAnalytics.totals.jobs,
                avgJobValue: revenueAnalytics.averages.revenue_per_job,
                totalCustomers: customerAnalytics.summary.total_customers,
                avgCustomerLTV: customerAnalytics.summary.avg_lifetime_value
            },
            
            // Performance indicators
            performance: {
                revenue: dashboardStats.jobs?.revenue_this_month || 0,
                jobsCompleted: dashboardStats.jobs?.completed || 0,
                avgCycleTime: dashboardStats.jobs?.avg_cycle_time || 0,
                customerSatisfaction: dashboardStats.customers?.satisfaction_avg || 0
            },
            
            // Alerts and recommendations
            alerts: [
                ...(dashboardStats.jobs?.overdue > 0 ? [`${dashboardStats.jobs.overdue} jobs are overdue`] : []),
                ...(partsAnalytics.lowStockParts.length > 0 ? [`${partsAnalytics.lowStockParts.length} parts are low in stock`] : []),
                ...(customerAnalytics.summary.high_risk_customers > 0 ? [`${customerAnalytics.summary.high_risk_customers} customers at risk of churning`] : [])
            ]
        };

        res.json({
            success: true,
            data: executiveSummary
        });
    } catch (error) {
        console.error('Executive summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate executive summary',
            error: error.message
        });
    }
});

/**
 * POST /api/analytics/reports/custom
 * Generate custom analytics report
 */
router.post('/reports/custom', auth, requirePermission('reports.create'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const {
            reportName,
            metrics,
            dateRange,
            filters,
            groupBy = 'month'
        } = req.body;

        // Validate required fields
        if (!reportName || !metrics || !Array.isArray(metrics)) {
            return res.status(400).json({
                success: false,
                message: 'Report name and metrics array are required'
            });
        }

        // Generate custom report based on requested metrics
        const customReport = {
            reportName,
            generatedAt: new Date().toISOString(),
            dateRange,
            filters,
            data: {}
        };

        // Fetch data based on requested metrics
        for (const metric of metrics) {
            switch (metric) {
                case 'revenue':
                    customReport.data.revenue = await analyticsService.getRevenueAnalytics(
                        shopId, 
                        dateRange?.period || 'month',
                        groupBy
                    );
                    break;
                case 'customers':
                    customReport.data.customers = await analyticsService.getCustomerAnalytics(shopId);
                    break;
                case 'technicians':
                    customReport.data.technicians = await analyticsService.getTechnicianAnalytics(
                        shopId, 
                        dateRange?.period || 'month'
                    );
                    break;
                case 'parts':
                    customReport.data.parts = await analyticsService.getPartsAnalytics(shopId);
                    break;
                default:
                    console.warn(`Unknown metric requested: ${metric}`);
            }
        }

        res.json({
            success: true,
            data: customReport
        });
    } catch (error) {
        console.error('Custom report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate custom report',
            error: error.message
        });
    }
});

// ==============================================================
// DATA EXPORT ENDPOINTS
// ==============================================================

/**
 * GET /api/analytics/export/:type
 * Export analytics data in various formats
 */
router.get('/export/:type', auth, requirePermission('reports.export'), async (req, res) => {
    try {
        const { shopId } = req.user;
        const { type } = req.params;
        const { format = 'json', period = 'month' } = req.query;

        let data;
        
        switch (type) {
            case 'dashboard':
                data = await analyticsService.getDashboardStats(shopId, period);
                break;
            case 'revenue':
                data = await analyticsService.getRevenueAnalytics(shopId, period);
                break;
            case 'customers':
                data = await analyticsService.getCustomerAnalytics(shopId);
                break;
            case 'technicians':
                data = await analyticsService.getTechnicianAnalytics(shopId, period);
                break;
            case 'parts':
                data = await analyticsService.getPartsAnalytics(shopId);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type'
                });
        }

        // Set appropriate headers based on format
        const filename = `${type}-analytics-${new Date().toISOString().split('T')[0]}`;
        
        switch (format) {
            case 'csv':
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
                res.send(convertToCSV(data));
                break;
            case 'json':
            default:
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
                res.json({
                    success: true,
                    data,
                    exportedAt: new Date().toISOString()
                });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export analytics data',
            error: error.message
        });
    }
});

// ==============================================================
// UTILITY FUNCTIONS
// ==============================================================

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Generate simple revenue forecast (simplified implementation)
 */
async function generateRevenueForecast(timeline) {
    if (timeline.length < 3) return [];
    
    // Simple linear trend forecast
    const lastThreeMonths = timeline.slice(-3);
    const avgGrowth = lastThreeMonths.reduce((sum, month) => sum + (month.growth_rate || 0), 0) / 3;
    const lastRevenue = timeline[timeline.length - 1].revenue;
    
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
        forecast.push({
            period: `Forecast +${i}`,
            revenue: lastRevenue * Math.pow(1 + (avgGrowth / 100), i),
            confidence: Math.max(0.3, 0.9 - (i * 0.2)) // Decreasing confidence
        });
    }
    
    return forecast;
}

/**
 * Generate inventory optimization recommendations
 */
function generateInventoryRecommendations(analytics) {
    const recommendations = [];
    
    // Low stock recommendations
    analytics.lowStockParts.forEach(part => {
        recommendations.push({
            type: 'restock',
            priority: 'high',
            item: part.part_number,
            message: `Restock ${part.description} - Current stock: ${part.current_stock}`,
            action: 'Order immediately'
        });
    });
    
    // Slow moving parts
    const slowMovingParts = analytics.fullAnalytics.filter(
        part => part.velocity_class === 'Slow' && part.current_stock > part.optimal_stock_level
    );
    
    slowMovingParts.slice(0, 5).forEach(part => {
        recommendations.push({
            type: 'reduce_stock',
            priority: 'medium',
            item: part.part_number,
            message: `Consider reducing stock for ${part.description}`,
            action: `Reduce to ${part.optimal_stock_level} units`
        });
    });
    
    return recommendations;
}

/**
 * Convert data to CSV format (simplified implementation)
 */
function convertToCSV(data) {
    if (!data || typeof data !== 'object') return '';
    
    // This is a simplified CSV conversion
    // In production, you'd want a more robust CSV library
    if (Array.isArray(data)) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => 
            Object.values(item).map(value => 
                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',')
        );
        
        return [headers, ...rows].join('\n');
    }
    
    // Convert object to key-value CSV
    return Object.entries(data)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
}

module.exports = router;