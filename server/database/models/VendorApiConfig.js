const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'VendorApiConfig',
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

      // API Configuration
      configName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Descriptive name for this API configuration',
      },
      apiType: {
        type: DataTypes.ENUM(
          'rest_api',
          'soap_api',
          'graphql',
          'edi',
          'ftp',
          'email',
          'web_portal',
          'csv_export',
          'custom'
        ),
        allowNull: false,
      },
      apiVersion: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'API version being used',
      },
      
      // Endpoint Configuration
      baseUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Base URL for API endpoints',
      },
      endpointUrls: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with specific endpoint URLs',
      },
      testEndpointUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL for testing/sandbox environment',
      },
      productionEndpointUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL for production environment',
      },
      
      // Authentication Configuration
      authType: {
        type: DataTypes.ENUM(
          'none',
          'basic_auth',
          'api_key',
          'oauth1',
          'oauth2',
          'bearer_token',
          'certificate',
          'custom'
        ),
        allowNull: false,
        defaultValue: 'api_key',
      },
      authCredentials: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted authentication credentials (JSON)',
      },
      apiKey: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'API key for authentication',
      },
      apiSecret: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'API secret for authentication',
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Username for basic authentication',
      },
      password: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Password for authentication (encrypted)',
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'OAuth or bearer token',
      },
      tokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Token expiration date',
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Refresh token for OAuth',
      },

      // Request Configuration
      requestFormat: {
        type: DataTypes.ENUM(
          'json',
          'xml',
          'form_data',
          'query_params',
          'custom'
        ),
        defaultValue: 'json',
      },
      responseFormat: {
        type: DataTypes.ENUM(
          'json',
          'xml',
          'csv',
          'html',
          'custom'
        ),
        defaultValue: 'json',
      },
      contentType: {
        type: DataTypes.STRING(100),
        defaultValue: 'application/json',
      },
      customHeaders: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with custom HTTP headers',
      },
      requestTemplate: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Template for API requests',
      },
      
      // Rate Limiting Configuration
      rateLimitEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      maxRequestsPerMinute: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum requests per minute',
      },
      maxRequestsPerHour: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum requests per hour',
      },
      maxRequestsPerDay: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum requests per day',
      },
      burstLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum burst requests allowed',
      },
      rateLimitWindow: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        comment: 'Rate limit window in seconds',
      },

      // Timeout and Retry Configuration
      requestTimeout: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Request timeout in seconds',
      },
      connectionTimeout: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: 'Connection timeout in seconds',
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        comment: 'Maximum number of retry attempts',
      },
      retryDelay: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        comment: 'Delay between retries in milliseconds',
      },
      exponentialBackoff: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Use exponential backoff for retries',
      },

      // Feature Support Configuration
      supportsBatchRequests: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API supports batch/bulk requests',
      },
      maxBatchSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum items per batch request',
      },
      supportsRealTimeInventory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API provides real-time inventory data',
      },
      supportsPricing: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'API provides pricing information',
      },
      supportsAvailability: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'API provides availability information',
      },
      supportsLeadTimes: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'API provides lead time information',
      },
      supportsPartImages: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API provides part images',
      },
      supportsPartSpecs: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API provides detailed part specifications',
      },
      supportsOrderPlacement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API supports placing orders directly',
      },
      supportsOrderStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'API supports checking order status',
      },

      // Data Mapping Configuration
      partNumberFields: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON mapping for part number fields in API response',
      },
      priceFields: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON mapping for price fields in API response',
      },
      availabilityFields: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON mapping for availability fields in API response',
      },
      leadTimeFields: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON mapping for lead time fields in API response',
      },
      responseMapping: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Complete JSON mapping configuration for API responses',
      },
      errorMapping: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON mapping for error response handling',
      },

      // Environment Configuration
      environment: {
        type: DataTypes.ENUM('development', 'testing', 'staging', 'production'),
        defaultValue: 'production',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this configuration is active',
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is the default configuration for the vendor',
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Priority order when multiple configs exist (1 = highest)',
      },

      // Monitoring and Health Check Configuration
      healthCheckEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      healthCheckUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL for API health checks',
      },
      healthCheckInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 300,
        comment: 'Health check interval in seconds',
      },
      alertsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      alertThresholds: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON configuration for alert thresholds',
      },

      // Business Rules Configuration
      businessRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON configuration for business rules specific to this vendor API',
      },
      priceValidationRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON rules for validating prices returned by API',
      },
      dataValidationRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON rules for validating all data returned by API',
      },
      filterRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON rules for filtering API results',
      },

      // Caching Configuration
      cachingEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      cacheDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 3600,
        comment: 'Cache duration in seconds',
      },
      cacheStrategy: {
        type: DataTypes.ENUM('none', 'memory', 'redis', 'database'),
        defaultValue: 'memory',
      },
      cacheKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Custom cache key prefix',
      },

      // Status and Performance
      connectionStatus: {
        type: DataTypes.ENUM(
          'unknown',
          'connected',
          'disconnected',
          'error',
          'maintenance'
        ),
        defaultValue: 'unknown',
      },
      lastTestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastSuccessfulConnectionAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastErrorAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      consecutiveFailures: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        comment: 'Total API requests made using this configuration',
      },
      successfulRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        comment: 'Total successful API requests',
      },
      failedRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        comment: 'Total failed API requests',
      },

      // Documentation and Support
      apiDocumentationUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL to API documentation',
      },
      supportContactInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON with support contact information',
      },
      setupNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Setup and configuration notes',
      },
      troubleshootingNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Common issues and troubleshooting steps',
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
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      lastTestedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'vendor_api_configs',
      timestamps: true,
      indexes: [
        { fields: ['shopId'] },
        { fields: ['vendorId'] },
        { fields: ['configName'] },
        { fields: ['apiType'] },
        { fields: ['environment'] },
        { fields: ['isActive'] },
        { fields: ['isDefault'] },
        { fields: ['priority'] },
        { fields: ['connectionStatus'] },
        { fields: ['lastTestedAt'] },
        { fields: ['lastSuccessfulConnectionAt'] },
        { fields: ['consecutiveFailures'] },
        { fields: ['createdAt'] },
        // Composite indexes for common queries
        { fields: ['shopId', 'isActive'] },
        { fields: ['vendorId', 'isActive'] },
        { fields: ['vendorId', 'isDefault'] },
        { fields: ['vendorId', 'priority'] },
        { fields: ['environment', 'isActive'] },
        { fields: ['connectionStatus', 'isActive'] },
        { fields: ['apiType', 'isActive'] },
      ],
    }
  );
};