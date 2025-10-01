const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'VendorApiMetrics',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Parent References
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
      },
      apiConfigId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'vendor_api_configs', key: 'id' },
      },
      sourcingRequestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'parts_sourcing_requests', key: 'id' },
      },

      // Request Information
      requestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Unique identifier for this API request',
      },
      endpoint: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'API endpoint that was called',
      },
      httpMethod: {
        type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        allowNull: false,
        defaultValue: 'GET',
      },
      requestType: {
        type: DataTypes.ENUM(
          'part_search',
          'price_check',
          'availability_check',
          'order_placement',
          'order_status',
          'inventory_update',
          'health_check',
          'authentication',
          'batch_request',
          'other'
        ),
        allowNull: false,
      },

      // Timing Metrics
      requestTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the request was initiated',
      },
      responseTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the response was received',
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds',
      },
      connectionTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time to establish connection in milliseconds',
      },
      processingTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time to process response in milliseconds',
      },
      totalTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Total time from request to processed response in milliseconds',
      },

      // Request Details
      requestSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Size of request payload in bytes',
      },
      requestHeaders: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with request headers (sensitive data removed)',
      },
      requestParameters: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with request parameters',
      },
      requestBody: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Request body (sensitive data removed)',
      },

      // Response Details
      httpStatusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'HTTP status code returned',
      },
      responseSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Size of response payload in bytes',
      },
      responseHeaders: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with response headers',
      },
      recordsReturned: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of records returned in response',
      },
      recordsRequested: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of records requested',
      },

      // Success/Failure Metrics
      wasSuccessful: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        comment: 'Whether the request was successful',
      },
      errorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Error code if request failed',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if request failed',
      },
      errorType: {
        type: DataTypes.ENUM(
          'connection_error',
          'timeout_error',
          'authentication_error',
          'authorization_error',
          'rate_limit_error',
          'validation_error',
          'server_error',
          'unknown_error'
        ),
        allowNull: true,
      },
      retryAttempt: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Which retry attempt this was (0 = first attempt)',
      },
      finalAttempt: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this was the final retry attempt',
      },

      // Rate Limiting Metrics
      rateLimitRemaining: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Remaining requests in current rate limit window',
      },
      rateLimitReset: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When rate limit window resets',
      },
      rateLimitHit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether rate limit was hit',
      },
      throttleDelay: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Delay applied due to rate limiting (milliseconds)',
      },

      // Data Quality Metrics
      dataValidationPassed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether response data passed validation',
      },
      validationErrors: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of validation errors',
      },
      dataCompletenesScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Completeness score of returned data (0-100)',
      },
      dataAccuracyScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Accuracy score of returned data (0-100)',
      },
      dataFreshnessMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Age of data in minutes (if provided by API)',
      },

      // Business Metrics
      quotesReturned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of valid quotes returned',
      },
      averagePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Average price across all quotes returned',
      },
      lowestPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Lowest price returned',
      },
      averageLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Average lead time across all quotes (days)',
      },
      partsAvailable: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of parts that were available',
      },
      partsBackordered: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of parts that were backordered',
      },

      // Cache Metrics
      cacheHit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this request hit the cache',
      },
      cacheKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Cache key used for this request',
      },
      cacheAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Age of cached data in seconds',
      },

      // Performance Benchmarks
      isPerformanceBaseline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this metric should be used as a performance baseline',
      },
      performanceGrade: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
        allowNull: true,
        comment: 'Overall performance grade for this request',
      },
      responseTimeGrade: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
        allowNull: true,
        comment: 'Grade based on response time',
      },
      reliabilityGrade: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
        allowNull: true,
        comment: 'Grade based on reliability (success rate)',
      },
      dataQualityGrade: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
        allowNull: true,
        comment: 'Grade based on data quality',
      },

      // Cost Metrics
      apiCallCost: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        comment: 'Cost per API call (if applicable)',
      },
      dataTransferCost: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        comment: 'Cost for data transfer (if applicable)',
      },
      totalCost: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        comment: 'Total cost for this API request',
      },

      // Context Information
      userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'User agent used for the request',
      },
      sourceIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Source IP address',
      },
      sessionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Session identifier',
      },
      correlationId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Correlation ID for tracing requests',
      },
      environment: {
        type: DataTypes.ENUM('development', 'testing', 'staging', 'production'),
        defaultValue: 'production',
      },

      // Aggregation Period (for summary records)
      aggregationPeriod: {
        type: DataTypes.ENUM('hourly', 'daily', 'weekly', 'monthly'),
        allowNull: true,
        comment: 'If this is an aggregated record, the aggregation period',
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Start of aggregation period',
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'End of aggregation period',
      },
      recordCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Number of individual records represented by this record',
      },

      // Additional Metadata
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with additional metadata',
      },
      tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of tags for categorizing this metric',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes about this API call',
      },

      // Audit Trail
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'vendor_api_metrics',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );
};