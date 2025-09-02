-- =====================================================
-- CollisionOS Automated Parts Sourcing Enhancement
-- Migration: 20250901_automated_parts_sourcing_enhancement
-- Created: 2025-09-01
-- Description: Enhanced database schema for automated parts sourcing system
-- =====================================================

-- =====================================================
-- 1. PARTS SOURCING REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS parts_sourcing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    repairOrderId INTEGER NOT NULL REFERENCES repair_order_management(id),
    estimateLineItemId INTEGER REFERENCES estimate_line_items(id),
    claimManagementId INTEGER REFERENCES claim_management(id),
    
    -- Sourcing Request Information
    requestNumber VARCHAR(50) NOT NULL UNIQUE,
    batchId VARCHAR(50),
    
    -- Part Identification
    partDescription VARCHAR(500) NOT NULL,
    oemPartNumber VARCHAR(100),
    alternatePartNumbers TEXT,
    partCategory TEXT CHECK(partCategory IN (
        'body_panel', 'structural', 'mechanical', 'electrical', 
        'interior', 'glass', 'trim', 'hardware', 'paint_materials', 'consumables'
    )) NOT NULL,
    vehiclePosition VARCHAR(100),
    
    -- Vehicle Information for Sourcing
    vehicleVin VARCHAR(17),
    vehicleYear INTEGER,
    vehicleMake VARCHAR(50),
    vehicleModel VARCHAR(100),
    vehicleTrim VARCHAR(100),
    vehicleEngine VARCHAR(100),
    paintCode VARCHAR(50),
    
    -- Sourcing Criteria
    quantityNeeded DECIMAL(10,3) NOT NULL DEFAULT 1.0,
    unitOfMeasure VARCHAR(20) DEFAULT 'each',
    preferredBrandTypes TEXT,
    acceptedConditions TEXT,
    maxPrice DECIMAL(12,2),
    targetPrice DECIMAL(12,2),
    
    -- Delivery Requirements
    requiredByDate DATETIME,
    preferredDeliveryDate DATETIME,
    maxLeadTime INTEGER,
    rushOrder BOOLEAN DEFAULT FALSE,
    customerWaiting BOOLEAN DEFAULT FALSE,
    
    -- Business Rules for Automated Sourcing
    businessRules TEXT,
    vendorPreferences TEXT,
    qualityRequirements TEXT,
    
    -- Sourcing Status and Workflow
    sourcingStatus TEXT CHECK(sourcingStatus IN (
        'pending', 'in_progress', 'quotes_received', 'analyzed', 
        'approved', 'ordered', 'cancelled', 'timeout', 'failed'
    )) DEFAULT 'pending',
    automationType TEXT CHECK(automationType IN (
        'fully_automated', 'assisted', 'manual_review_required', 'manual_only'
    )) DEFAULT 'assisted',
    requiresApproval BOOLEAN DEFAULT TRUE,
    approvalThreshold DECIMAL(10,2),
    
    -- Sourcing Results
    vendorCount INTEGER DEFAULT 0,
    quotesReceived INTEGER DEFAULT 0,
    bestPrice DECIMAL(12,2),
    averagePrice DECIMAL(12,2),
    bestLeadTime INTEGER,
    averageLeadTime INTEGER,
    selectedVendorId INTEGER REFERENCES vendors(id),
    selectedQuoteId INTEGER REFERENCES vendor_part_quotes(id),
    selectionReason TEXT,
    
    -- Processing Timeline
    requestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sourcingStartedAt DATETIME,
    quotingDeadline DATETIME,
    quotingCompletedAt DATETIME,
    analyzedAt DATETIME,
    approvedAt DATETIME,
    completedAt DATETIME,
    
    -- Processing Metrics
    totalProcessingTime INTEGER,
    quotingResponseTime INTEGER,
    apiCallsCount INTEGER DEFAULT 0,
    emailsSentCount INTEGER DEFAULT 0,
    
    -- Error Handling and Retries
    errorCount INTEGER DEFAULT 0,
    lastError TEXT,
    retryCount INTEGER DEFAULT 0,
    maxRetries INTEGER DEFAULT 3,
    nextRetryAt DATETIME,
    
    -- Integration and External System Data
    externalRequestId VARCHAR(100),
    integrationData TEXT,
    apiResponseData TEXT,
    
    -- Priority and Urgency
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent', 'critical')) DEFAULT 'normal',
    urgencyScore INTEGER,
    
    -- Cost Analysis
    savingsAmount DECIMAL(10,2),
    savingsPercentage DECIMAL(5,2),
    costAnalysisData TEXT,
    
    -- Notes and Comments
    sourcingNotes TEXT,
    internalNotes TEXT,
    customerNotes TEXT,
    
    -- Audit Trail
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy INTEGER REFERENCES users(id),
    updatedBy INTEGER REFERENCES users(id),
    requestedBy INTEGER NOT NULL REFERENCES users(id),
    approvedBy INTEGER REFERENCES users(id),
    reviewedBy INTEGER REFERENCES users(id)
);

-- =====================================================
-- 2. VENDOR PART QUOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_part_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    sourcingRequestId INTEGER NOT NULL REFERENCES parts_sourcing_requests(id),
    vendorId INTEGER NOT NULL REFERENCES vendors(id),
    
    -- Quote Information
    quoteNumber VARCHAR(50),
    quoteReference VARCHAR(100),
    batchQuoteId VARCHAR(50),
    
    -- Part Information
    partNumber VARCHAR(100) NOT NULL,
    partDescription VARCHAR(500) NOT NULL,
    oemPartNumber VARCHAR(100),
    alternatePartNumbers TEXT,
    brandType TEXT CHECK(brandType IN (
        'oem', 'oem_equivalent', 'aftermarket', 'recycled', 'remanufactured'
    )) NOT NULL,
    partCondition TEXT CHECK(partCondition IN (
        'new', 'used', 'rebuilt', 'reconditioned', 'aftermarket', 'surplus'
    )) NOT NULL,
    qualityGrade TEXT CHECK(qualityGrade IN ('premium', 'standard', 'economy')) DEFAULT 'standard',
    
    -- Availability Information
    availabilityStatus TEXT CHECK(availabilityStatus IN (
        'in_stock', 'limited_stock', 'backordered', 'special_order', 'discontinued', 'not_available'
    )) NOT NULL,
    quantityAvailable DECIMAL(10,3),
    minimumOrderQuantity DECIMAL(10,3) DEFAULT 1.0,
    stockLocation VARCHAR(100),
    reservationExpiry DATETIME,
    
    -- Pricing Information
    unitPrice DECIMAL(12,2) NOT NULL,
    listPrice DECIMAL(12,2),
    discountPercentage DECIMAL(5,2),
    discountAmount DECIMAL(10,2),
    quantityBreaks TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    taxIncluded BOOLEAN DEFAULT FALSE,
    taxRate DECIMAL(5,2),
    
    -- Core and Exchange Information
    coreRequired BOOLEAN DEFAULT FALSE,
    corePrice DECIMAL(10,2),
    coreCredit DECIMAL(10,2),
    coreReturnPeriod INTEGER,
    
    -- Delivery and Lead Time
    leadTimeMin INTEGER,
    leadTimeMax INTEGER,
    leadTimeEstimate INTEGER,
    shippingMethod VARCHAR(100),
    shippingCost DECIMAL(8,2),
    freeShippingThreshold DECIMAL(10,2),
    expediteAvailable BOOLEAN DEFAULT FALSE,
    expediteCost DECIMAL(8,2),
    expediteLeadTime INTEGER,
    
    -- Quote Status and Timing
    quoteStatus TEXT CHECK(quoteStatus IN (
        'pending', 'received', 'analyzed', 'accepted', 'rejected', 'expired', 'withdrawn'
    )) DEFAULT 'received',
    quoteDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quoteExpiry DATETIME,
    responseTime INTEGER,
    validUntil DATETIME,
    
    -- Quality and Performance Scoring
    qualityScore INTEGER CHECK(qualityScore >= 1 AND qualityScore <= 100),
    reliabilityScore INTEGER CHECK(reliabilityScore >= 1 AND reliabilityScore <= 100),
    overallScore INTEGER CHECK(overallScore >= 1 AND overallScore <= 100),
    scoringFactors TEXT,
    
    -- Warranty Information
    warrantyPeriod INTEGER,
    warrantyMileage INTEGER,
    warrantyType TEXT CHECK(warrantyType IN (
        'manufacturer', 'vendor', 'parts_only', 'parts_and_labor', 'limited', 'none'
    )),
    warrantyTerms TEXT,
    
    -- Return and Exchange Policy
    returnPolicy TEXT,
    returnPeriod INTEGER,
    restockingFee DECIMAL(5,2),
    exchangePolicy TEXT,
    
    -- API Integration Data
    apiSource VARCHAR(50),
    apiResponseData TEXT,
    apiRequestId VARCHAR(100),
    apiVersion VARCHAR(20),
    integrationNotes TEXT,
    
    -- Selection and Decision Data
    isSelected BOOLEAN DEFAULT FALSE,
    selectionRank INTEGER,
    selectionReason TEXT,
    rejectionReason TEXT,
    alternativeRecommendations TEXT,
    
    -- Cost Analysis
    totalCost DECIMAL(12,2),
    costPerDay DECIMAL(10,2),
    competitiveRanking INTEGER,
    savingsVsTarget DECIMAL(10,2),
    markupPotential DECIMAL(5,2),
    
    -- Special Conditions and Notes
    specialConditions TEXT,
    restrictions TEXT,
    vendorNotes TEXT,
    internalNotes TEXT,
    
    -- Audit Trail
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    receivedBy INTEGER REFERENCES users(id),
    analyzedBy INTEGER REFERENCES users(id),
    approvedBy INTEGER REFERENCES users(id)
);

-- =====================================================
-- 3. VENDOR API CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_api_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    vendorId INTEGER NOT NULL REFERENCES vendors(id),
    
    -- API Configuration
    configName VARCHAR(100) NOT NULL,
    apiType TEXT CHECK(apiType IN (
        'rest_api', 'soap_api', 'graphql', 'edi', 'ftp', 'email', 'web_portal', 'csv_export', 'custom'
    )) NOT NULL,
    apiVersion VARCHAR(20),
    
    -- Endpoint Configuration
    baseUrl VARCHAR(500),
    endpointUrls TEXT,
    testEndpointUrl VARCHAR(500),
    productionEndpointUrl VARCHAR(500),
    
    -- Authentication Configuration
    authType TEXT CHECK(authType IN (
        'none', 'basic_auth', 'api_key', 'oauth1', 'oauth2', 'bearer_token', 'certificate', 'custom'
    )) NOT NULL DEFAULT 'api_key',
    authCredentials TEXT,
    apiKey VARCHAR(500),
    apiSecret VARCHAR(500),
    username VARCHAR(100),
    password VARCHAR(500),
    token TEXT,
    tokenExpiry DATETIME,
    refreshToken TEXT,
    
    -- Request Configuration
    requestFormat TEXT CHECK(requestFormat IN ('json', 'xml', 'form_data', 'query_params', 'custom')) DEFAULT 'json',
    responseFormat TEXT CHECK(responseFormat IN ('json', 'xml', 'csv', 'html', 'custom')) DEFAULT 'json',
    contentType VARCHAR(100) DEFAULT 'application/json',
    customHeaders TEXT,
    requestTemplate TEXT,
    
    -- Rate Limiting Configuration
    rateLimitEnabled BOOLEAN DEFAULT TRUE,
    maxRequestsPerMinute INTEGER,
    maxRequestsPerHour INTEGER,
    maxRequestsPerDay INTEGER,
    burstLimit INTEGER,
    rateLimitWindow INTEGER DEFAULT 60,
    
    -- Timeout and Retry Configuration
    requestTimeout INTEGER DEFAULT 30,
    connectionTimeout INTEGER DEFAULT 10,
    maxRetries INTEGER DEFAULT 3,
    retryDelay INTEGER DEFAULT 1000,
    exponentialBackoff BOOLEAN DEFAULT TRUE,
    
    -- Feature Support Configuration
    supportsBatchRequests BOOLEAN DEFAULT FALSE,
    maxBatchSize INTEGER,
    supportsRealTimeInventory BOOLEAN DEFAULT FALSE,
    supportsPricing BOOLEAN DEFAULT TRUE,
    supportsAvailability BOOLEAN DEFAULT TRUE,
    supportsLeadTimes BOOLEAN DEFAULT TRUE,
    supportsPartImages BOOLEAN DEFAULT FALSE,
    supportsPartSpecs BOOLEAN DEFAULT FALSE,
    supportsOrderPlacement BOOLEAN DEFAULT FALSE,
    supportsOrderStatus BOOLEAN DEFAULT FALSE,
    
    -- Data Mapping Configuration
    partNumberFields TEXT,
    priceFields TEXT,
    availabilityFields TEXT,
    leadTimeFields TEXT,
    responseMapping TEXT,
    errorMapping TEXT,
    
    -- Environment Configuration
    environment TEXT CHECK(environment IN ('development', 'testing', 'staging', 'production')) DEFAULT 'production',
    isActive BOOLEAN DEFAULT TRUE,
    isDefault BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1,
    
    -- Monitoring and Health Check Configuration
    healthCheckEnabled BOOLEAN DEFAULT TRUE,
    healthCheckUrl VARCHAR(500),
    healthCheckInterval INTEGER DEFAULT 300,
    alertsEnabled BOOLEAN DEFAULT TRUE,
    alertThresholds TEXT,
    
    -- Business Rules Configuration
    businessRules TEXT,
    priceValidationRules TEXT,
    dataValidationRules TEXT,
    filterRules TEXT,
    
    -- Caching Configuration
    cachingEnabled BOOLEAN DEFAULT TRUE,
    cacheDuration INTEGER DEFAULT 3600,
    cacheStrategy TEXT CHECK(cacheStrategy IN ('none', 'memory', 'redis', 'database')) DEFAULT 'memory',
    cacheKey VARCHAR(100),
    
    -- Status and Performance
    connectionStatus TEXT CHECK(connectionStatus IN (
        'unknown', 'connected', 'disconnected', 'error', 'maintenance'
    )) DEFAULT 'unknown',
    lastTestedAt DATETIME,
    lastSuccessfulConnectionAt DATETIME,
    lastErrorAt DATETIME,
    lastError TEXT,
    consecutiveFailures INTEGER DEFAULT 0,
    totalRequests BIGINT DEFAULT 0,
    successfulRequests BIGINT DEFAULT 0,
    failedRequests BIGINT DEFAULT 0,
    
    -- Documentation and Support
    apiDocumentationUrl VARCHAR(500),
    supportContactInfo TEXT,
    setupNotes TEXT,
    troubleshootingNotes TEXT,
    
    -- Audit Trail
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy INTEGER REFERENCES users(id),
    updatedBy INTEGER REFERENCES users(id),
    lastTestedBy INTEGER REFERENCES users(id)
);

-- =====================================================
-- 4. VENDOR API METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_api_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    vendorId INTEGER NOT NULL REFERENCES vendors(id),
    apiConfigId INTEGER REFERENCES vendor_api_configs(id),
    sourcingRequestId INTEGER REFERENCES parts_sourcing_requests(id),
    
    -- Request Information
    requestId VARCHAR(100),
    endpoint VARCHAR(500) NOT NULL,
    httpMethod TEXT CHECK(httpMethod IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')) NOT NULL DEFAULT 'GET',
    requestType TEXT CHECK(requestType IN (
        'part_search', 'price_check', 'availability_check', 'order_placement', 
        'order_status', 'inventory_update', 'health_check', 'authentication', 
        'batch_request', 'other'
    )) NOT NULL,
    
    -- Timing Metrics
    requestTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responseTimestamp DATETIME,
    responseTime INTEGER,
    connectionTime INTEGER,
    processingTime INTEGER,
    totalTime INTEGER,
    
    -- Request Details
    requestSize INTEGER,
    requestHeaders TEXT,
    requestParameters TEXT,
    requestBody TEXT,
    
    -- Response Details
    httpStatusCode INTEGER,
    responseSize INTEGER,
    responseHeaders TEXT,
    recordsReturned INTEGER,
    recordsRequested INTEGER,
    
    -- Success/Failure Metrics
    wasSuccessful BOOLEAN NOT NULL,
    errorCode VARCHAR(50),
    errorMessage TEXT,
    errorType TEXT CHECK(errorType IN (
        'connection_error', 'timeout_error', 'authentication_error', 'authorization_error',
        'rate_limit_error', 'validation_error', 'server_error', 'unknown_error'
    )),
    retryAttempt INTEGER DEFAULT 0,
    finalAttempt BOOLEAN DEFAULT TRUE,
    
    -- Rate Limiting Metrics
    rateLimitRemaining INTEGER,
    rateLimitReset DATETIME,
    rateLimitHit BOOLEAN DEFAULT FALSE,
    throttleDelay INTEGER,
    
    -- Data Quality Metrics
    dataValidationPassed BOOLEAN DEFAULT TRUE,
    validationErrors TEXT,
    dataCompletenesScore INTEGER CHECK(dataCompletenesScore >= 0 AND dataCompletenesScore <= 100),
    dataAccuracyScore INTEGER CHECK(dataAccuracyScore >= 0 AND dataAccuracyScore <= 100),
    dataFreshnessMinutes INTEGER,
    
    -- Business Metrics
    quotesReturned INTEGER DEFAULT 0,
    averagePrice DECIMAL(12,2),
    lowestPrice DECIMAL(12,2),
    averageLeadTime INTEGER,
    partsAvailable INTEGER DEFAULT 0,
    partsBackordered INTEGER DEFAULT 0,
    
    -- Cache Metrics
    cacheHit BOOLEAN DEFAULT FALSE,
    cacheKey VARCHAR(255),
    cacheAge INTEGER,
    
    -- Performance Benchmarks
    isPerformanceBaseline BOOLEAN DEFAULT FALSE,
    performanceGrade TEXT CHECK(performanceGrade IN ('A', 'B', 'C', 'D', 'F')),
    responseTimeGrade TEXT CHECK(responseTimeGrade IN ('A', 'B', 'C', 'D', 'F')),
    reliabilityGrade TEXT CHECK(reliabilityGrade IN ('A', 'B', 'C', 'D', 'F')),
    dataQualityGrade TEXT CHECK(dataQualityGrade IN ('A', 'B', 'C', 'D', 'F')),
    
    -- Cost Metrics
    apiCallCost DECIMAL(8,4),
    dataTransferCost DECIMAL(8,4),
    totalCost DECIMAL(8,4),
    
    -- Context Information
    userAgent VARCHAR(255),
    sourceIp VARCHAR(45),
    sessionId VARCHAR(100),
    correlationId VARCHAR(100),
    environment TEXT CHECK(environment IN ('development', 'testing', 'staging', 'production')) DEFAULT 'production',
    
    -- Aggregation Period (for summary records)
    aggregationPeriod TEXT CHECK(aggregationPeriod IN ('hourly', 'daily', 'weekly', 'monthly')),
    periodStart DATETIME,
    periodEnd DATETIME,
    recordCount INTEGER DEFAULT 1,
    
    -- Additional Metadata
    metadata TEXT,
    tags TEXT,
    notes TEXT,
    
    -- Audit Trail
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. PARTS INVENTORY TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS parts_inventory_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    vendorId INTEGER NOT NULL REFERENCES vendors(id),
    partId INTEGER REFERENCES parts(id),
    
    -- Part Identification
    partNumber VARCHAR(100) NOT NULL,
    partDescription VARCHAR(500) NOT NULL,
    oemPartNumber VARCHAR(100),
    vendorPartNumber VARCHAR(100),
    alternatePartNumbers TEXT,
    universalProductCode VARCHAR(50),
    
    -- Part Classification
    partCategory TEXT CHECK(partCategory IN (
        'body_panel', 'structural', 'mechanical', 'electrical', 
        'interior', 'glass', 'trim', 'hardware', 'paint_materials', 'consumables'
    )) NOT NULL,
    partSubcategory VARCHAR(100),
    brandType TEXT CHECK(brandType IN (
        'oem', 'oem_equivalent', 'aftermarket', 'recycled', 'remanufactured'
    )) NOT NULL,
    partCondition TEXT CHECK(partCondition IN (
        'new', 'used', 'rebuilt', 'reconditioned', 'aftermarket', 'surplus'
    )) NOT NULL,
    qualityGrade TEXT CHECK(qualityGrade IN ('premium', 'standard', 'economy')) DEFAULT 'standard',
    
    -- Inventory Status
    inventoryStatus TEXT CHECK(inventoryStatus IN (
        'in_stock', 'low_stock', 'out_of_stock', 'backordered', 'discontinued', 'special_order', 'unknown'
    )) NOT NULL DEFAULT 'unknown',
    availabilityStatus TEXT CHECK(availabilityStatus IN (
        'available', 'limited', 'backordered', 'special_order', 'discontinued', 'not_available'
    )) NOT NULL DEFAULT 'available',
    
    -- Quantity Information
    quantityAvailable DECIMAL(10,3),
    quantityOnHand DECIMAL(10,3),
    quantityReserved DECIMAL(10,3) DEFAULT 0.0,
    quantityAllocated DECIMAL(10,3) DEFAULT 0.0,
    quantityInTransit DECIMAL(10,3) DEFAULT 0.0,
    minimumOrderQuantity DECIMAL(10,3) DEFAULT 1.0,
    orderMultiple DECIMAL(10,3) DEFAULT 1.0,
    unitOfMeasure VARCHAR(20) DEFAULT 'each',
    
    -- Location Information
    warehouseLocation VARCHAR(100),
    binLocation VARCHAR(50),
    vendorLocationCode VARCHAR(20),
    proximityToShop DECIMAL(8,2),
    shippingZone VARCHAR(10),
    
    -- Timing Information
    lastCheckedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedAt DATETIME,
    checkFrequency INTEGER DEFAULT 3600,
    nextCheckDue DATETIME,
    dataAge INTEGER,
    
    -- Lead Time Information
    leadTimeMin INTEGER,
    leadTimeMax INTEGER,
    leadTimeAverage INTEGER,
    lastDeliveryDays INTEGER,
    expediteAvailable BOOLEAN DEFAULT FALSE,
    expediteLeadTime INTEGER,
    
    -- Pricing Information (Current)
    currentPrice DECIMAL(12,2),
    listPrice DECIMAL(12,2),
    previousPrice DECIMAL(12,2),
    priceChangeDate DATETIME,
    priceChangePercent DECIMAL(5,2),
    priceVolatility TEXT CHECK(priceVolatility IN ('stable', 'fluctuating', 'increasing', 'decreasing')) DEFAULT 'stable',
    
    -- Audit Trail
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy INTEGER REFERENCES users(id),
    updatedBy INTEGER REFERENCES users(id)
);

-- =====================================================
-- 6. AUTOMATED PURCHASE ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS automated_purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent References
    shopId INTEGER NOT NULL REFERENCES shops(id),
    sourcingRequestId INTEGER NOT NULL REFERENCES parts_sourcing_requests(id),
    vendorId INTEGER NOT NULL REFERENCES vendors(id),
    selectedQuoteId INTEGER REFERENCES vendor_part_quotes(id),
    repairOrderId INTEGER REFERENCES repair_order_management(id),
    claimManagementId INTEGER REFERENCES claim_management(id),
    
    -- Purchase Order Information
    purchaseOrderNumber VARCHAR(50) NOT NULL UNIQUE,
    vendorPoNumber VARCHAR(50),
    orderType TEXT CHECK(orderType IN (
        'standard', 'rush', 'blanket', 'drop_ship', 'special_order', 'stock_order', 'emergency'
    )) DEFAULT 'standard',
    automationType TEXT CHECK(automationType IN (
        'fully_automated', 'auto_with_approval', 'assisted', 'manual_review', 'manual_only'
    )) NOT NULL,
    
    -- Order Status and Workflow
    orderStatus TEXT CHECK(orderStatus IN (
        'pending_approval', 'approved', 'sent_to_vendor', 'acknowledged', 'in_progress', 
        'partially_received', 'completed', 'cancelled', 'rejected', 'on_hold', 'disputed'
    )) DEFAULT 'pending_approval',
    workflowStage TEXT CHECK(workflowStage IN (
        'created', 'approval_pending', 'approved', 'transmitted', 'acknowledged', 
        'processing', 'shipped', 'delivered', 'invoiced', 'closed'
    )) DEFAULT 'created',
    approvalRequired BOOLEAN DEFAULT TRUE,
    approvalThreshold DECIMAL(10,2),
    
    -- Timing Information
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    approvedAt DATETIME,
    sentAt DATETIME,
    acknowledgedAt DATETIME,
    expectedDeliveryDate DATETIME,
    promisedDeliveryDate DATETIME,
    actualDeliveryDate DATETIME,
    requestedDeliveryDate DATETIME,
    
    -- Financial Information
    subtotalAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxAmount DECIMAL(10,2) DEFAULT 0.00,
    shippingAmount DECIMAL(8,2) DEFAULT 0.00,
    discountAmount DECIMAL(10,2) DEFAULT 0.00,
    totalAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Automation Details
    automationRules TEXT,
    decisionFactors TEXT,
    confidenceScore INTEGER CHECK(confidenceScore >= 0 AND confidenceScore <= 100),
    riskScore INTEGER CHECK(riskScore >= 0 AND riskScore <= 100),
    qualityScore INTEGER CHECK(qualityScore >= 0 AND qualityScore <= 100),
    
    -- Delivery and Shipping
    shippingMethod VARCHAR(100),
    shippingInstructions TEXT,
    deliveryAddress TEXT,
    trackingNumber VARCHAR(100),
    isRushOrder BOOLEAN DEFAULT FALSE,
    expediteFee DECIMAL(8,2),
    
    -- Terms and Conditions
    paymentTerms VARCHAR(50),
    fobTerms VARCHAR(100),
    warrantyTerms TEXT,
    returnPolicy TEXT,
    specialTerms TEXT,
    
    -- Approval Process
    requiresManagerApproval BOOLEAN DEFAULT FALSE,
    requiresOwnerApproval BOOLEAN DEFAULT FALSE,
    approvalChain TEXT,
    approvalNotes TEXT,
    rejectionReason TEXT,
    
    -- Vendor Response and Communication
    vendorAcknowledgement TEXT,
    vendorComments TEXT,
    communicationLog TEXT,
    lastVendorContact DATETIME,
    
    -- Integration and External Systems
    transmissionMethod TEXT CHECK(transmissionMethod IN (
        'api', 'edi', 'email', 'portal', 'fax', 'manual'
    )),
    transmissionStatus TEXT CHECK(transmissionStatus IN (
        'pending', 'sent', 'delivered', 'failed', 'retry_needed'
    )) DEFAULT 'pending',
    transmissionAttempts INTEGER DEFAULT 0,
    lastTransmissionError TEXT,
    externalSystemIds TEXT,
    
    -- Performance Tracking
    leadTimeAccuracy DECIMAL(5,2),
    priceAccuracy DECIMAL(5,2),
    orderFillRate DECIMAL(5,2),
    onTimeDelivery BOOLEAN,
    customerSatisfaction INTEGER CHECK(customerSatisfaction >= 1 AND customerSatisfaction <= 5),
    
    -- Cost Analysis and Savings
    targetCost DECIMAL(12,2),
    actualCost DECIMAL(12,2),
    savingsAmount DECIMAL(10,2),
    savingsPercentage DECIMAL(5,2),
    costVariance DECIMAL(10,2),
    
    -- Priority and Urgency
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent', 'critical')) DEFAULT 'normal',
    urgencyReason TEXT,
    customerWaiting BOOLEAN DEFAULT FALSE,
    impactsProductionSchedule BOOLEAN DEFAULT FALSE,
    
    -- Quality Control and Inspection
    requiresInspection BOOLEAN DEFAULT FALSE,
    inspectionCriteria TEXT,
    qualityRequirements TEXT,
    acceptanceCriteria TEXT,
    
    -- Notes and Comments
    orderNotes TEXT,
    internalNotes TEXT,
    vendorInstructions TEXT,
    receivingInstructions TEXT,
    
    -- Audit Trail
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy INTEGER REFERENCES users(id),
    updatedBy INTEGER REFERENCES users(id),
    approvedBy INTEGER REFERENCES users(id),
    sentBy INTEGER REFERENCES users(id),
    cancelledBy INTEGER REFERENCES users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Parts Sourcing Requests Indexes
CREATE INDEX IF NOT EXISTS idx_psr_shop_status ON parts_sourcing_requests(shopId, sourcingStatus);
CREATE INDEX IF NOT EXISTS idx_psr_repair_order_status ON parts_sourcing_requests(repairOrderId, sourcingStatus);
CREATE INDEX IF NOT EXISTS idx_psr_status_requested ON parts_sourcing_requests(sourcingStatus, requestedAt);
CREATE INDEX IF NOT EXISTS idx_psr_priority_requested ON parts_sourcing_requests(priority, requestedAt);
CREATE INDEX IF NOT EXISTS idx_psr_customer_waiting ON parts_sourcing_requests(customerWaiting, requestedAt);
CREATE INDEX IF NOT EXISTS idx_psr_rush_order ON parts_sourcing_requests(rushOrder, requestedAt);
CREATE INDEX IF NOT EXISTS idx_psr_vendor_part ON parts_sourcing_requests(selectedVendorId, oemPartNumber);
CREATE INDEX IF NOT EXISTS idx_psr_vehicle_ymm ON parts_sourcing_requests(vehicleYear, vehicleMake, vehicleModel);

-- Vendor Part Quotes Indexes
CREATE INDEX IF NOT EXISTS idx_vpq_sourcing_status ON vendor_part_quotes(sourcingRequestId, quoteStatus);
CREATE INDEX IF NOT EXISTS idx_vpq_sourcing_price ON vendor_part_quotes(sourcingRequestId, unitPrice);
CREATE INDEX IF NOT EXISTS idx_vpq_sourcing_leadtime ON vendor_part_quotes(sourcingRequestId, leadTimeEstimate);
CREATE INDEX IF NOT EXISTS idx_vpq_sourcing_score ON vendor_part_quotes(sourcingRequestId, overallScore);
CREATE INDEX IF NOT EXISTS idx_vpq_vendor_date ON vendor_part_quotes(vendorId, quoteDate);
CREATE INDEX IF NOT EXISTS idx_vpq_vendor_price ON vendor_part_quotes(vendorId, unitPrice);
CREATE INDEX IF NOT EXISTS idx_vpq_vendor_availability ON vendor_part_quotes(vendorId, availabilityStatus);
CREATE INDEX IF NOT EXISTS idx_vpq_part_brand ON vendor_part_quotes(partNumber, brandType);
CREATE INDEX IF NOT EXISTS idx_vpq_selected ON vendor_part_quotes(isSelected, quoteDate);
CREATE INDEX IF NOT EXISTS idx_vpq_status_expiry ON vendor_part_quotes(quoteStatus, quoteExpiry);

-- Vendor API Configs Indexes
CREATE INDEX IF NOT EXISTS idx_vac_shop_active ON vendor_api_configs(shopId, isActive);
CREATE INDEX IF NOT EXISTS idx_vac_vendor_active ON vendor_api_configs(vendorId, isActive);
CREATE INDEX IF NOT EXISTS idx_vac_vendor_default ON vendor_api_configs(vendorId, isDefault);
CREATE INDEX IF NOT EXISTS idx_vac_vendor_priority ON vendor_api_configs(vendorId, priority);
CREATE INDEX IF NOT EXISTS idx_vac_env_active ON vendor_api_configs(environment, isActive);
CREATE INDEX IF NOT EXISTS idx_vac_connection_active ON vendor_api_configs(connectionStatus, isActive);
CREATE INDEX IF NOT EXISTS idx_vac_api_type_active ON vendor_api_configs(apiType, isActive);

-- Vendor API Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_vam_shop_timestamp ON vendor_api_metrics(shopId, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_vendor_timestamp ON vendor_api_metrics(vendorId, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_vendor_success ON vendor_api_metrics(vendorId, wasSuccessful);
CREATE INDEX IF NOT EXISTS idx_vam_vendor_response ON vendor_api_metrics(vendorId, responseTime);
CREATE INDEX IF NOT EXISTS idx_vam_config_timestamp ON vendor_api_metrics(apiConfigId, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_request_type ON vendor_api_metrics(requestType, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_endpoint ON vendor_api_metrics(endpoint, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_success ON vendor_api_metrics(wasSuccessful, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_error_type ON vendor_api_metrics(errorType, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_performance ON vendor_api_metrics(performanceGrade, requestTimestamp);
CREATE INDEX IF NOT EXISTS idx_vam_aggregation ON vendor_api_metrics(aggregationPeriod, periodStart);

-- Parts Inventory Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_pit_shop_vendor ON parts_inventory_tracking(shopId, vendorId);
CREATE INDEX IF NOT EXISTS idx_pit_shop_category ON parts_inventory_tracking(shopId, partCategory);
CREATE INDEX IF NOT EXISTS idx_pit_shop_status ON parts_inventory_tracking(shopId, inventoryStatus);
CREATE INDEX IF NOT EXISTS idx_pit_vendor_part ON parts_inventory_tracking(vendorId, partNumber);
CREATE INDEX IF NOT EXISTS idx_pit_vendor_status ON parts_inventory_tracking(vendorId, inventoryStatus);
CREATE INDEX IF NOT EXISTS idx_pit_vendor_checked ON parts_inventory_tracking(vendorId, lastCheckedAt);
CREATE INDEX IF NOT EXISTS idx_pit_part_brand ON parts_inventory_tracking(partNumber, brandType);
CREATE INDEX IF NOT EXISTS idx_pit_category_status ON parts_inventory_tracking(partCategory, inventoryStatus);
CREATE INDEX IF NOT EXISTS idx_pit_status_checked ON parts_inventory_tracking(inventoryStatus, lastCheckedAt);
CREATE INDEX IF NOT EXISTS idx_pit_availability_qty ON parts_inventory_tracking(availabilityStatus, quantityAvailable);

-- Automated Purchase Orders Indexes
CREATE INDEX IF NOT EXISTS idx_apo_shop_status ON automated_purchase_orders(shopId, orderStatus);
CREATE INDEX IF NOT EXISTS idx_apo_shop_created ON automated_purchase_orders(shopId, createdAt);
CREATE INDEX IF NOT EXISTS idx_apo_vendor_status ON automated_purchase_orders(vendorId, orderStatus);
CREATE INDEX IF NOT EXISTS idx_apo_vendor_created ON automated_purchase_orders(vendorId, createdAt);
CREATE INDEX IF NOT EXISTS idx_apo_repair_order_status ON automated_purchase_orders(repairOrderId, orderStatus);
CREATE INDEX IF NOT EXISTS idx_apo_status_priority ON automated_purchase_orders(orderStatus, priority);
CREATE INDEX IF NOT EXISTS idx_apo_status_created ON automated_purchase_orders(orderStatus, createdAt);
CREATE INDEX IF NOT EXISTS idx_apo_approval_status ON automated_purchase_orders(approvalRequired, orderStatus);
CREATE INDEX IF NOT EXISTS idx_apo_workflow ON automated_purchase_orders(workflowStage, createdAt);
CREATE INDEX IF NOT EXISTS idx_apo_transmission ON automated_purchase_orders(transmissionStatus, transmissionAttempts);
CREATE INDEX IF NOT EXISTS idx_apo_customer_waiting ON automated_purchase_orders(customerWaiting, priority);
CREATE INDEX IF NOT EXISTS idx_apo_delivery ON automated_purchase_orders(expectedDeliveryDate, orderStatus);
CREATE INDEX IF NOT EXISTS idx_apo_automation ON automated_purchase_orders(automationType, confidenceScore);

-- =====================================================
-- TRIGGERS FOR AUTOMATED WORKFLOWS
-- =====================================================

-- Update parts_sourcing_requests timestamp on quote received
CREATE TRIGGER IF NOT EXISTS trg_update_sourcing_on_quote
AFTER INSERT ON vendor_part_quotes
BEGIN
    UPDATE parts_sourcing_requests 
    SET quotesReceived = quotesReceived + 1,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = NEW.sourcingRequestId;
END;

-- Update purchase order totals when financial data changes
CREATE TRIGGER IF NOT EXISTS trg_update_po_totals
AFTER UPDATE ON automated_purchase_orders
WHEN NEW.subtotalAmount != OLD.subtotalAmount 
   OR NEW.taxAmount != OLD.taxAmount 
   OR NEW.shippingAmount != OLD.shippingAmount 
   OR NEW.discountAmount != OLD.discountAmount
BEGIN
    UPDATE automated_purchase_orders 
    SET totalAmount = NEW.subtotalAmount + NEW.taxAmount + NEW.shippingAmount - NEW.discountAmount,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update inventory tracking next check due date
CREATE TRIGGER IF NOT EXISTS trg_update_inventory_check_due
AFTER UPDATE ON parts_inventory_tracking
WHEN NEW.lastCheckedAt != OLD.lastCheckedAt
BEGIN
    UPDATE parts_inventory_tracking 
    SET nextCheckDue = datetime(NEW.lastCheckedAt, '+' || NEW.checkFrequency || ' seconds'),
        dataAge = CAST((julianday('now') - julianday(NEW.lastCheckedAt)) * 1440 AS INTEGER),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update API config performance metrics
CREATE TRIGGER IF NOT EXISTS trg_update_api_performance
AFTER INSERT ON vendor_api_metrics
BEGIN
    UPDATE vendor_api_configs 
    SET totalRequests = totalRequests + 1,
        successfulRequests = CASE WHEN NEW.wasSuccessful THEN successfulRequests + 1 ELSE successfulRequests END,
        failedRequests = CASE WHEN NOT NEW.wasSuccessful THEN failedRequests + 1 ELSE failedRequests END,
        lastSuccessfulConnectionAt = CASE WHEN NEW.wasSuccessful THEN NEW.requestTimestamp ELSE lastSuccessfulConnectionAt END,
        lastErrorAt = CASE WHEN NOT NEW.wasSuccessful THEN NEW.requestTimestamp ELSE lastErrorAt END,
        lastError = CASE WHEN NOT NEW.wasSuccessful THEN NEW.errorMessage ELSE lastError END,
        consecutiveFailures = CASE WHEN NEW.wasSuccessful THEN 0 ELSE consecutiveFailures + 1 END,
        connectionStatus = CASE 
            WHEN NEW.wasSuccessful THEN 'connected' 
            WHEN consecutiveFailures > 3 THEN 'error' 
            ELSE connectionStatus 
        END
    WHERE id = NEW.apiConfigId;
END;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active sourcing requests with vendor information
CREATE VIEW IF NOT EXISTS v_active_sourcing_requests AS
SELECT 
    psr.*,
    v.name as vendor_name,
    v.vendorType as vendor_type,
    rom.roNumber as repair_order_number,
    cm.claimNumber as claim_number
FROM parts_sourcing_requests psr
LEFT JOIN vendors v ON psr.selectedVendorId = v.id
LEFT JOIN repair_order_management rom ON psr.repairOrderId = rom.id
LEFT JOIN claim_management cm ON psr.claimManagementId = cm.id
WHERE psr.sourcingStatus IN ('pending', 'in_progress', 'quotes_received', 'analyzed');

-- View for vendor performance metrics
CREATE VIEW IF NOT EXISTS v_vendor_performance_metrics AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(vpq.id) as total_quotes,
    AVG(vpq.unitPrice) as avg_quote_price,
    AVG(vpq.leadTimeEstimate) as avg_lead_time,
    AVG(vpq.overallScore) as avg_overall_score,
    COUNT(CASE WHEN vpq.isSelected THEN 1 END) as selected_quotes,
    ROUND(COUNT(CASE WHEN vpq.isSelected THEN 1 END) * 100.0 / COUNT(vpq.id), 2) as selection_rate,
    COUNT(apo.id) as total_purchase_orders,
    AVG(apo.totalAmount) as avg_po_amount,
    COUNT(CASE WHEN apo.onTimeDelivery THEN 1 END) as on_time_deliveries,
    ROUND(COUNT(CASE WHEN apo.onTimeDelivery THEN 1 END) * 100.0 / COUNT(apo.id), 2) as on_time_rate
FROM vendors v
LEFT JOIN vendor_part_quotes vpq ON v.id = vpq.vendorId
LEFT JOIN automated_purchase_orders apo ON v.id = apo.vendorId
GROUP BY v.id, v.name;

-- View for parts sourcing analytics
CREATE VIEW IF NOT EXISTS v_parts_sourcing_analytics AS
SELECT 
    psr.partCategory,
    psr.partDescription,
    COUNT(psr.id) as total_requests,
    AVG(psr.quotesReceived) as avg_quotes_received,
    AVG(psr.bestPrice) as avg_best_price,
    AVG(psr.bestLeadTime) as avg_best_lead_time,
    AVG(psr.savingsAmount) as avg_savings,
    AVG(psr.totalProcessingTime) as avg_processing_time,
    COUNT(CASE WHEN psr.sourcingStatus = 'completed' THEN 1 END) as completed_requests,
    ROUND(COUNT(CASE WHEN psr.sourcingStatus = 'completed' THEN 1 END) * 100.0 / COUNT(psr.id), 2) as completion_rate
FROM parts_sourcing_requests psr
WHERE psr.requestedAt >= datetime('now', '-30 days')
GROUP BY psr.partCategory, psr.partDescription
HAVING COUNT(psr.id) > 1
ORDER BY total_requests DESC;

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default sourcing automation rules
INSERT OR REPLACE INTO communication_templates (
    shopId, templateName, templateType, channel, subject, bodyTemplate, 
    isActive, createdAt, updatedAt
) VALUES 
(1, 'Parts Quote Request', 'parts_sourcing', 'email', 
 'Parts Quote Request - RO #{ro_number}', 
 'Dear {vendor_name},\n\nWe are requesting a quote for the following part:\n\nPart: {part_description}\nOEM Part Number: {oem_part_number}\nQuantity: {quantity}\nVehicle: {vehicle_year} {vehicle_make} {vehicle_model}\n\nPlease provide your best price and availability.\n\nThank you,\n{shop_name}',
 TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(1, 'PO Transmission Confirmation', 'purchase_order', 'email',
 'Purchase Order #{po_number} Transmitted',
 'Hello {vendor_name},\n\nPurchase Order #{po_number} has been successfully transmitted.\n\nOrder Details:\n- Total Amount: ${total_amount}\n- Expected Delivery: {expected_delivery_date}\n\nPlease confirm receipt and processing.\n\nBest regards,\n{shop_name}',
 TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Migration completed successfully
-- New tables created: 6
-- Indexes created: 50+
-- Triggers created: 4
-- Views created: 3
-- 
-- The automated parts sourcing system is now ready for:
-- - Real-time parts sourcing requests
-- - Vendor API integration and performance tracking
-- - Automated quote comparison and selection
-- - Intelligent purchase order generation
-- - Comprehensive inventory tracking
-- - Performance analytics and reporting
-- =====================================================