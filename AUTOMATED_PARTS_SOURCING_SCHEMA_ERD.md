# CollisionOS Automated Parts Sourcing Database Schema ERD

## Overview

This document provides a comprehensive Entity Relationship Diagram (ERD) and schema documentation for the CollisionOS Automated Parts Sourcing Enhancement. This enhancement adds intelligent automation, real-time vendor integration, and advanced analytics to the collision repair parts sourcing process.

## Database Architecture Summary

- **Total Models**: 41 (35 existing + 6 new)
- **New Tables**: 6 automated parts sourcing tables
- **Indexes**: 300+ strategic indexes for optimal performance
- **Relationships**: 160+ associations with foreign key integrity
- **Performance Target**: <100ms parts lookup, <500ms vendor comparison

## New Models for Automated Parts Sourcing

### 1. PartsSourcingRequest (parts_sourcing_requests)
**Purpose**: Central workflow management for automated parts sourcing requests

**Key Features**:
- Automated sourcing workflow from request through completion
- Business rules engine for intelligent decision making
- Vehicle information capture for accurate part identification
- Priority and urgency scoring with customer waiting indicators
- Cost analysis and savings tracking
- Error handling and retry logic
- External system integration

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` RepairOrderManagement (repairOrderId)
- `belongsTo` EstimateLineItem (estimateLineItemId)
- `belongsTo` ClaimManagement (claimManagementId)
- `belongsTo` Vendor (selectedVendorId)
- `belongsTo` VendorPartQuote (selectedQuoteId)
- `hasMany` VendorPartQuote (sourcingRequestId)
- `hasMany` AutomatedPurchaseOrder (sourcingRequestId)

### 2. VendorPartQuote (vendor_part_quotes)
**Purpose**: Storage and analysis of vendor quotes with intelligent comparison

**Key Features**:
- Real-time vendor quote capture
- Comprehensive part information with brand types and conditions
- Advanced availability status with stock location tracking
- Detailed pricing with quantity breaks and core charges
- Quality and performance scoring algorithms
- Warranty and return policy tracking
- API integration data with response mapping
- Competitive analysis with ranking

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` PartsSourcingRequest (sourcingRequestId)
- `belongsTo` Vendor (vendorId)
- `belongsTo` User (receivedBy, analyzedBy, approvedBy)

### 3. VendorApiConfig (vendor_api_configs)
**Purpose**: Complete API configuration management for vendor integrations

**Key Features**:
- Multi-protocol API support (REST, SOAP, GraphQL, EDI)
- Authentication handling (API key, OAuth, basic auth, certificates)
- Rate limiting and timeout configuration
- Feature support detection and capability mapping
- Data field mapping and response parsing
- Health monitoring and alert configuration
- Business rules and validation engine
- Performance optimization settings

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` Vendor (vendorId)
- `hasMany` VendorApiMetrics (apiConfigId)
- `belongsTo` User (createdBy, updatedBy, lastTestedBy)

### 4. VendorApiMetrics (vendor_api_metrics)
**Purpose**: Comprehensive API performance monitoring and analytics

**Key Features**:
- Request/response timing with performance breakdowns
- Success/failure tracking with error categorization
- Rate limiting and throttling metrics
- Data quality validation and completeness scoring
- Business metrics (quotes returned, prices, lead times)
- Cache performance and cost tracking
- Aggregation support for summary reporting
- Performance grading and benchmarking

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` Vendor (vendorId)
- `belongsTo` VendorApiConfig (apiConfigId)
- `belongsTo` PartsSourcingRequest (sourcingRequestId)

### 5. PartsInventoryTracking (parts_inventory_tracking)
**Purpose**: Real-time inventory status tracking across all vendors

**Key Features**:
- Real-time inventory status across all vendors
- Comprehensive part classification and identification
- Quantity management with reservations and allocations
- Location tracking with warehouse and bin information
- Lead time analysis with historical performance
- Pricing history with volatility and trend analysis
- Alert and notification configuration
- Data source integration tracking

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` Vendor (vendorId)
- `belongsTo` Part (partId)
- `belongsTo` User (createdBy, updatedBy)

### 6. AutomatedPurchaseOrder (automated_purchase_orders)
**Purpose**: Intelligent automated PO generation and management

**Key Features**:
- Automated PO generation from sourcing requests
- Approval workflow management with configurable thresholds
- Vendor communication tracking with transmission status
- Performance monitoring (on-time delivery, price accuracy)
- Cost analysis and savings calculation
- Quality control and inspection requirements
- Integration with external systems (EDI, API, email)
- Complete audit trail with user tracking

**Primary Relationships**:
- `belongsTo` Shop (shopId)
- `belongsTo` PartsSourcingRequest (sourcingRequestId)
- `belongsTo` Vendor (vendorId)
- `belongsTo` VendorPartQuote (selectedQuoteId)
- `belongsTo` RepairOrderManagement (repairOrderId)
- `belongsTo` ClaimManagement (claimManagementId)

## Core Automated Parts Sourcing Workflow

```
1. PartsSourcingRequest Created
   ↓
2. Business Rules Applied
   ↓
3. Vendor APIs Queried (VendorApiConfig → VendorApiMetrics)
   ↓
4. VendorPartQuotes Collected
   ↓
5. Intelligent Analysis & Scoring
   ↓
6. Best Quote Selected
   ↓
7. AutomatedPurchaseOrder Generated
   ↓
8. PartsInventoryTracking Updated
```

## Key Database Relationships

### Primary Entity Relationships
```
Shop (1) ←→ (many) PartsSourcingRequest
Shop (1) ←→ (many) VendorPartQuote
Shop (1) ←→ (many) VendorApiConfig
Shop (1) ←→ (many) VendorApiMetrics
Shop (1) ←→ (many) PartsInventoryTracking
Shop (1) ←→ (many) AutomatedPurchaseOrder

Vendor (1) ←→ (many) VendorPartQuote
Vendor (1) ←→ (many) VendorApiConfig
Vendor (1) ←→ (many) VendorApiMetrics
Vendor (1) ←→ (many) PartsInventoryTracking
Vendor (1) ←→ (many) AutomatedPurchaseOrder

PartsSourcingRequest (1) ←→ (many) VendorPartQuote
PartsSourcingRequest (1) ←→ (many) AutomatedPurchaseOrder

VendorApiConfig (1) ←→ (many) VendorApiMetrics
```

### Integration with Existing Schema
```
RepairOrderManagement (1) ←→ (many) PartsSourcingRequest
EstimateLineItem (1) ←→ (many) PartsSourcingRequest
ClaimManagement (1) ←→ (many) PartsSourcingRequest
Part (1) ←→ (many) PartsInventoryTracking

User (1) ←→ (many) PartsSourcingRequest (requestedBy, approvedBy, reviewedBy)
User (1) ←→ (many) VendorPartQuote (receivedBy, analyzedBy, approvedBy)
User (1) ←→ (many) VendorApiConfig (createdBy, updatedBy, lastTestedBy)
User (1) ←→ (many) AutomatedPurchaseOrder (createdBy, approvedBy, sentBy)
```

## Performance Optimization Strategy

### Index Strategy (300+ Indexes)

#### Primary Performance Indexes
- **parts_sourcing_requests**: 30+ indexes including composite indexes for status+priority, shop+status, repair_order+status
- **vendor_part_quotes**: 25+ indexes including sourcingRequest+price, vendor+date, part+brand combinations
- **vendor_api_configs**: 20+ indexes for vendor+active, environment+active, connection_status+active
- **vendor_api_metrics**: 30+ indexes for performance analysis, timestamp-based queries, vendor performance
- **parts_inventory_tracking**: 25+ indexes for real-time inventory queries, vendor+part combinations
- **automated_purchase_orders**: 20+ indexes for workflow management, approval tracking, delivery monitoring

#### Query Performance Targets
- **Parts Lookup**: <100ms for single part queries across all vendors
- **Vendor Comparison**: <500ms for 5-vendor price comparison with scoring
- **Sourcing History**: <200ms for paginated sourcing request history
- **Dashboard Metrics**: <1s for comprehensive performance analytics
- **API Monitoring**: <50ms for real-time API health status queries

### Caching Strategy
- **API Response Caching**: Configurable per vendor with TTL settings
- **Inventory Data Caching**: Real-time updates with smart invalidation
- **Quote Comparison Caching**: Short-term caching for active sourcing requests
- **Performance Metrics Caching**: Aggregated metrics with scheduled refresh

## Business Logic Implementation

### Automated Decision Making
```sql
-- Example: Automated vendor selection based on business rules
SELECT vpq.*, 
       (vpq.overallScore * 0.4 + 
        (100 - vpq.leadTimeEstimate) * 0.3 + 
        (100 - vpq.competitiveRanking) * 0.3) as weighted_score
FROM vendor_part_quotes vpq
WHERE vpq.sourcingRequestId = ? 
  AND vpq.quoteStatus = 'received'
ORDER BY weighted_score DESC
LIMIT 1;
```

### Performance Monitoring Triggers
```sql
-- Update API performance metrics on new metric insertion
CREATE TRIGGER trg_update_api_performance
AFTER INSERT ON vendor_api_metrics
BEGIN
    UPDATE vendor_api_configs 
    SET totalRequests = totalRequests + 1,
        successfulRequests = CASE WHEN NEW.wasSuccessful 
                           THEN successfulRequests + 1 
                           ELSE successfulRequests END,
        consecutiveFailures = CASE WHEN NEW.wasSuccessful 
                            THEN 0 
                            ELSE consecutiveFailures + 1 END
    WHERE id = NEW.apiConfigId;
END;
```

### Cost Analysis Views
```sql
-- Vendor performance analytics view
CREATE VIEW v_vendor_performance_analytics AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(vpq.id) as total_quotes,
    AVG(vpq.unitPrice) as avg_quote_price,
    AVG(vpq.leadTimeEstimate) as avg_lead_time,
    AVG(vpq.overallScore) as avg_overall_score,
    COUNT(CASE WHEN vpq.isSelected THEN 1 END) as selected_quotes,
    ROUND(COUNT(CASE WHEN vpq.isSelected THEN 1 END) * 100.0 / COUNT(vpq.id), 2) as selection_rate
FROM vendors v
LEFT JOIN vendor_part_quotes vpq ON v.id = vpq.vendorId
WHERE vpq.quoteDate >= datetime('now', '-30 days')
GROUP BY v.id, v.name;
```

## Data Flow Architecture

### Automated Sourcing Request Flow
1. **Request Creation**: User or system creates PartsSourcingRequest
2. **Business Rules Application**: Automated rules determine sourcing strategy
3. **Vendor Selection**: Active vendors with relevant capabilities identified
4. **API Orchestration**: Multiple vendor APIs queried simultaneously
5. **Quote Collection**: VendorPartQuotes collected and validated
6. **Intelligent Analysis**: Scoring algorithm applied based on business rules
7. **Selection & Approval**: Best quote selected (automated or manual approval)
8. **PO Generation**: AutomatedPurchaseOrder created and transmitted
9. **Inventory Update**: PartsInventoryTracking updated with reservation

### Real-time API Integration Flow
1. **Configuration Management**: VendorApiConfig maintains connection settings
2. **Health Monitoring**: Continuous health checks with automated failover
3. **Request Processing**: API calls with rate limiting and retry logic
4. **Performance Tracking**: VendorApiMetrics captures all performance data
5. **Data Validation**: Response validation and quality scoring
6. **Cache Management**: Intelligent caching with TTL and invalidation
7. **Error Handling**: Automated error recovery and alerting

## Integration Points

### External System Integration
- **API Protocols**: REST, SOAP, GraphQL, custom protocols
- **Authentication**: OAuth 2.0, API keys, basic auth, certificates
- **Data Formats**: JSON, XML, CSV, custom formats
- **Communication**: Real-time, batch, webhook callbacks

### Business Intelligence Integration
- **Analytics Platform**: Ready for Tableau, Power BI, custom dashboards
- **Data Warehousing**: Optimized for ETL processes and OLAP queries
- **Real-time Reporting**: Live dashboards with automated refresh
- **KPI Monitoring**: Automated alerts and threshold monitoring

## Security and Compliance

### Data Protection
- **Sensitive Data**: API credentials encrypted at rest
- **Access Control**: Role-based access with audit trails
- **Data Retention**: Configurable retention policies by data type
- **Audit Logging**: Complete audit trail for all automated decisions

### Compliance Features
- **GDPR Compliance**: Data privacy and right to erasure
- **SOX Compliance**: Financial transaction audit trails
- **Industry Standards**: Parts sourcing compliance with automotive standards

## Scalability and Performance

### Horizontal Scaling
- **Database Sharding**: Support for multiple database instances
- **Read Replicas**: Optimized read queries across multiple replicas
- **Load Balancing**: Distributed query processing
- **Caching Layers**: Multi-tier caching for optimal performance

### Vertical Scaling
- **Partitioning**: Table partitioning by date, vendor, or shop
- **Archiving**: Automated data archiving with configurable policies
- **Optimization**: Query optimization with execution plan analysis
- **Resource Management**: Connection pooling and resource limits

## Migration and Deployment

### Database Migration
- **Migration Script**: `20250901_automated_parts_sourcing_enhancement.sql`
- **Rollback Support**: Complete rollback procedures for safe deployment
- **Data Validation**: Post-migration data integrity validation
- **Performance Testing**: Automated performance testing after migration

### Environment Support
- **Development**: Full feature parity with production
- **Testing**: Isolated testing environment with test data
- **Staging**: Production-like environment for final validation
- **Production**: High-availability deployment with monitoring

## Monitoring and Maintenance

### Performance Monitoring
- **Real-time Metrics**: Dashboard for system health and performance
- **Alert System**: Automated alerting for performance degradation
- **Trend Analysis**: Historical performance tracking and forecasting
- **Capacity Planning**: Automated capacity monitoring and alerts

### Data Quality Management
- **Validation Rules**: Automated data validation and cleansing
- **Quality Scoring**: Data quality metrics and improvement tracking
- **Anomaly Detection**: Automated detection of data quality issues
- **Correction Workflows**: Automated and manual data correction processes

## Future Enhancements

### Planned Features
- **Machine Learning Integration**: AI-powered vendor selection optimization
- **Predictive Analytics**: Demand forecasting and inventory optimization
- **Advanced Automation**: Full lights-out parts sourcing for standard parts
- **Mobile Integration**: Mobile apps for sourcing approval and monitoring

### Extensibility
- **Plugin Architecture**: Support for custom vendor integrations
- **API Extensions**: RESTful APIs for third-party integrations
- **Workflow Customization**: Configurable business rules and workflows
- **Reporting Extensions**: Custom report builders and analytics

This enhanced database schema provides CollisionOS with industry-leading automated parts sourcing capabilities that exceed the automation and intelligence found in traditional collision repair management systems.