# CollisionOS Advanced Analytics System

## Overview

The CollisionOS Advanced Analytics System provides comprehensive business intelligence capabilities for collision repair shops. The system is designed to work with both **Supabase (PostgreSQL)** and **SQLite** databases, offering scalable analytics from local desktop deployments to cloud-based enterprise solutions.

## Architecture

### Database Compatibility
- **Supabase (PostgreSQL)**: Full-featured analytics with materialized views, complex functions, and real-time updates
- **SQLite**: Optimized analytics with efficient queries and simplified aggregations

### Key Components
1. **Analytics Schema** - Dedicated tables for metrics aggregation
2. **Analytics Service** - Business logic layer for calculations and data processing
3. **API Endpoints** - RESTful interfaces for frontend integration
4. **Data Migration** - Setup scripts for initial deployment
5. **Real-time Updates** - Automatic metric calculations on data changes

## Features

### 📊 Dashboard Analytics
- **Real-time KPIs**: Jobs, revenue, customers, and parts metrics
- **Period Comparisons**: Today, week, month, quarter, year
- **Performance Indicators**: Cycle time, efficiency, satisfaction
- **Alert System**: Overdue jobs, low stock, at-risk customers

### 💰 Revenue Analytics
- **Revenue Trends**: Track performance over time
- **Revenue Breakdown**: Labor, parts, materials, sublet
- **Growth Analysis**: Period-over-period comparisons
- **Forecasting**: Predictive revenue modeling
- **Profitability**: Margin analysis and cost tracking

### 👥 Customer Analytics
- **Lifetime Value (LTV)**: Calculate and predict customer worth
- **Customer Segmentation**: VIP, High Value, Loyal, At Risk, Regular
- **Churn Risk Analysis**: Identify customers likely to leave
- **Retention Metrics**: Frequency, satisfaction, engagement
- **Acquisition Tracking**: Source attribution and conversion

### 🔧 Technician Performance
- **Productivity Metrics**: Jobs completed, hours worked, efficiency
- **Quality Tracking**: Rework rates, comebacks, satisfaction scores
- **Revenue Performance**: Revenue per hour, profit contribution
- **Skill Development**: Certifications, training, progression
- **Leaderboards**: Performance rankings and recognition

### 🔩 Parts & Inventory Analytics
- **ABC Analysis**: Classify parts by value and usage
- **Velocity Classification**: Fast, Medium, Slow movers
- **Inventory Optimization**: Reorder points, optimal stock levels
- **Cost Analysis**: Margins, turnover rates, vendor performance
- **Demand Forecasting**: Predict future part requirements

### 📈 Business Intelligence
- **Executive Dashboards**: High-level performance overview
- **Custom Reports**: Flexible reporting with multiple metrics
- **Trend Analysis**: Identify patterns and opportunities
- **Comparative Analysis**: Benchmark against historical data
- **Export Capabilities**: CSV, PDF, Excel formats

## Database Schema

### Core Analytics Tables

#### daily_metrics
```sql
-- Aggregated daily business metrics
- jobs_created, jobs_completed, jobs_in_progress
- revenue_total, revenue_labor, revenue_parts
- customer_satisfaction_avg, avg_cycle_time
- new_customers, returning_customers
```

#### monthly_metrics  
```sql
-- Monthly rollup with growth calculations
- total_revenue, total_jobs, total_profit
- growth rates vs previous month
- jobs_per_day, revenue_per_job
```

#### customer_analytics
```sql
-- Customer lifetime value and behavior
- lifetime_value, churn_risk_score
- total_jobs, avg_job_value
- customer_segment, acquisition_channel
- satisfaction trends and predictions
```

#### technician_analytics
```sql
-- Performance metrics by technician
- completion_rate, efficiency_rate
- revenue_generated, profit_contribution
- quality_scores, skill_development
```

#### parts_analytics
```sql
-- Parts performance and inventory optimization
- usage patterns (30d, 90d, 12m)
- margin analysis, turnover_rate
- abc_class, velocity_class
- demand_forecasting, reorder_recommendations
```

#### job_analytics
```sql
-- Job workflow and cycle time analysis
- stage durations, bottleneck identification
- estimated_vs_actual variance
- profitability_index, quality_metrics
```

### Performance Optimization

#### Indexes
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_jobs_shop_status_date ON jobs(shop_id, status, created_at);
CREATE INDEX idx_jobs_shop_completion_date ON jobs(shop_id, completion_date);
CREATE INDEX idx_customer_analytics_ltv ON customer_analytics(lifetime_value DESC);
```

#### Materialized Views (PostgreSQL)
```sql
-- Pre-computed views for fast reporting
CREATE MATERIALIZED VIEW revenue_trends AS ...
CREATE MATERIALIZED VIEW customer_segments AS ...
```

## API Endpoints

### Dashboard Analytics
```javascript
GET /api/analytics/dashboard?period=month
// Returns: jobs, revenue, customers, parts KPIs
```

### Revenue Analytics
```javascript
GET /api/analytics/revenue?period=year&groupBy=month
// Returns: timeline, totals, averages, growth rates

GET /api/analytics/revenue/comparison
// Returns: current vs previous period comparison
```

### Customer Analytics
```javascript
GET /api/analytics/customers
// Returns: segments, LTV, churn risk, top customers

GET /api/analytics/customers/churn-risk?threshold=0.7
// Returns: customers at risk of churning
```

### Technician Performance
```javascript
GET /api/analytics/technicians?period=month
// Returns: productivity, quality, revenue metrics

GET /api/analytics/technicians/leaderboard?metric=revenue_per_hour
// Returns: performance rankings
```

### Parts Analytics
```javascript
GET /api/analytics/parts
// Returns: inventory optimization, ABC analysis

GET /api/analytics/inventory/optimization
// Returns: restock recommendations, slow movers
```

### Business Intelligence
```javascript
GET /api/analytics/reports/executive-summary
// Returns: comprehensive business overview

POST /api/analytics/reports/custom
// Body: { reportName, metrics, dateRange, filters }
// Returns: custom analytics report
```

### Data Export
```javascript
GET /api/analytics/export/revenue?format=csv
// Returns: CSV download of revenue data
```

## Installation and Setup

### 1. Database Schema Setup

For **Supabase**:
```bash
# Execute the PostgreSQL analytics schema
psql -f supabase-migration/schema/04_advanced_analytics.sql
```

For **SQLite**:
```bash
# Execute the SQLite analytics schema
sqlite3 database.db < server/database/migrations/analytics_schema_sqlite.sql
```

### 2. Analytics Setup Script
```bash
# Run the analytics setup script
node server/scripts/setupAnalytics.js
```

This script will:
- Create analytics tables and indexes
- Set up default configurations for each shop
- Populate initial analytics data from existing records
- Create performance optimization indexes

### 3. API Integration

Add analytics routes to your Express app:
```javascript
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);
```

### 4. Scheduled Jobs

Set up automated data refresh:
```javascript
// Update daily metrics (run daily at midnight)
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
    const shops = await getActiveShops();
    for (const shop of shops) {
        await analyticsService.updateDailyMetrics(shop.id);
    }
});
```

## Usage Examples

### Frontend Dashboard Integration
```javascript
// React component example
const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    
    useEffect(() => {
        fetch('/api/analytics/dashboard?period=month')
            .then(response => response.json())
            .then(data => setDashboardData(data.data));
    }, []);
    
    return (
        <div>
            <MetricCard 
                title="Monthly Revenue" 
                value={dashboardData?.jobs?.revenue_this_month} 
                format="currency"
            />
            <MetricCard 
                title="Jobs Completed" 
                value={dashboardData?.jobs?.completed} 
            />
            <MetricCard 
                title="Average Cycle Time" 
                value={dashboardData?.jobs?.avg_cycle_time} 
                format="days"
            />
        </div>
    );
};
```

### Custom Reports
```javascript
// Generate custom analytics report
const customReport = await fetch('/api/analytics/reports/custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        reportName: 'Q4 Performance Review',
        metrics: ['revenue', 'customers', 'technicians'],
        dateRange: { period: 'quarter' },
        filters: { jobType: 'collision' }
    })
}).then(r => r.json());
```

## Performance Considerations

### Database Optimization
1. **Indexed Queries**: All common query patterns have optimized indexes
2. **Materialized Views**: Pre-computed aggregations for PostgreSQL
3. **Efficient Aggregation**: Minimize real-time calculations
4. **Data Retention**: Configurable retention policies for historical data

### Scalability
1. **Horizontal Scaling**: Analytics data can be partitioned by shop
2. **Caching**: Redis caching for frequently accessed metrics
3. **Async Processing**: Background jobs for heavy calculations
4. **CDN Integration**: Export files cached at edge locations

### Memory Management
1. **Streaming**: Large datasets processed in batches
2. **Lazy Loading**: Load analytics data on demand
3. **Connection Pooling**: Efficient database connection usage

## Security and Permissions

### Role-Based Access Control
```javascript
// Permission matrix for analytics access
const permissions = {
    'dashboard.view': ['owner', 'manager', 'admin', 'technician'],
    'financial.view': ['owner', 'manager', 'admin', 'accountant'],
    'customers.view': ['owner', 'manager', 'service_advisor'],
    'reports.export': ['owner', 'manager', 'admin'],
    'reports.create': ['owner', 'manager', 'admin']
};
```

### Data Privacy
1. **Row-Level Security**: Users can only access their shop's data
2. **Field-Level Filtering**: Sensitive data hidden based on role
3. **Audit Logging**: All analytics access tracked
4. **Data Anonymization**: Personal data protected in exports

## Monitoring and Alerts

### System Health
```javascript
// Monitor analytics system performance
const healthChecks = {
    dataFreshness: 'Check last update times',
    queryPerformance: 'Monitor slow queries',
    storageUsage: 'Track analytics table sizes',
    cacheHitRates: 'Monitor caching efficiency'
};
```

### Business Alerts
```javascript
// Automatic alerts for business metrics
const alerts = {
    revenue_drop: 'Revenue decreased by >10%',
    high_churn_risk: 'Customers with >70% churn risk',
    low_efficiency: 'Technician efficiency <80%',
    inventory_shortage: 'Parts below reorder point'
};
```

## Migration from Legacy Systems

### Data Import
```javascript
// Import historical data from legacy systems
const importLegacyData = async () => {
    // Parse legacy data files
    // Transform to analytics schema
    // Validate and insert data
    // Update analytics aggregations
};
```

### Gradual Migration
1. **Parallel Operation**: Run both systems during transition
2. **Data Validation**: Compare results between systems
3. **Feature Parity**: Ensure all legacy reports available
4. **Training**: User education on new analytics features

## Future Enhancements

### Advanced Analytics
1. **Machine Learning**: Predictive maintenance, demand forecasting
2. **AI Insights**: Automated pattern recognition, recommendations
3. **Real-time Processing**: Stream processing for instant metrics
4. **Advanced Visualizations**: Interactive charts, heatmaps

### Integration Capabilities
1. **External APIs**: Insurance systems, parts vendors
2. **Business Intelligence Tools**: PowerBI, Tableau connectors
3. **Mobile Analytics**: Dedicated mobile dashboards
4. **IoT Integration**: Equipment sensors, environmental data

### Compliance and Standards
1. **Data Governance**: Automated data quality checks
2. **Regulatory Compliance**: GDPR, industry standards
3. **Audit Trail**: Comprehensive activity logging
4. **Backup and Recovery**: Automated backup strategies

## Support and Maintenance

### Regular Maintenance Tasks
1. **Index Optimization**: Quarterly index analysis
2. **Data Cleanup**: Remove old analytics data based on retention policy
3. **Performance Tuning**: Monitor and optimize slow queries
4. **Schema Updates**: Apply analytics enhancements

### Troubleshooting
1. **Slow Queries**: Check indexes, analyze execution plans
2. **Data Inconsistencies**: Validate aggregation calculations
3. **Missing Data**: Verify ETL processes and triggers
4. **Permission Issues**: Review RLS policies and user roles

### Getting Help
- **Documentation**: Comprehensive API and setup guides
- **Support Forums**: Community-driven support
- **Professional Services**: Expert implementation assistance
- **Training Materials**: Video tutorials and best practices

---

## Technical Specifications

- **Database Compatibility**: PostgreSQL 12+, SQLite 3.35+
- **Node.js Version**: 16+ required
- **Memory Requirements**: 2GB minimum for analytics processing
- **Storage**: ~100MB per shop per year of analytics data
- **Performance**: Sub-second response for most analytics queries

This analytics system transforms CollisionOS into a data-driven platform that empowers shop owners with actionable insights, predictive capabilities, and comprehensive business intelligence.