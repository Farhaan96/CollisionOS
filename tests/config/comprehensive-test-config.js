/**
 * Comprehensive Test Configuration - Phase 4
 * Enterprise testing framework configuration for CollisionOS
 */

const path = require('path');

module.exports = {
  // Test environment configuration
  testEnvironments: {
    unit: 'jsdom',
    integration: 'node',
    e2e: 'playwright'
  },

  // Coverage thresholds for production readiness
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    // Critical collision repair components
    './src/contexts/AuthContext.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/bmsService.js': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95
    },
    './src/components/Auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/Dashboard/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/pages/': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Performance benchmarks for collision repair operations
  performanceThresholds: {
    // Critical business workflow response times
    apiResponseTimes: {
      authentication: 200,      // Login/logout < 200ms
      dashboard: 300,          // Dashboard load < 300ms
      customerSearch: 150,     // Customer search < 150ms
      bmsUpload: 5000,         // BMS processing < 5s
      partsLookup: 200,        // Parts search < 200ms
      jobCreation: 500,        // RO creation < 500ms
      productionBoard: 400     // Production board < 400ms
    },
    
    // Concurrent user load targets
    concurrentUsers: {
      normal: 25,              // Normal shop operations
      peak: 50,                // Peak season/times
      stress: 100              // Stress test threshold
    },

    // Memory and resource limits
    memoryUsage: {
      maxHeapSize: '512MB',    // Browser heap limit
      maxMemoryLeak: '10MB',   // Acceptable memory leak per session
      gcFrequency: 30          // Garbage collection every 30s
    }
  },

  // Security testing configuration
  securityConfig: {
    // OWASP Top 10 validation
    vulnerabilityChecks: [
      'injection',
      'broken-authentication',
      'sensitive-data-exposure',
      'xml-external-entities',
      'broken-access-control',
      'security-misconfiguration',
      'cross-site-scripting',
      'insecure-deserialization',
      'vulnerable-components',
      'insufficient-logging'
    ],
    
    // Security headers required for production
    requiredHeaders: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Referrer-Policy'
    ],

    // Authentication security requirements
    authSecurity: {
      passwordComplexity: true,
      sessionTimeout: 3600,      // 1 hour session timeout
      maxLoginAttempts: 5,       // Brute force protection
      tokenExpiration: 1800,     // 30 minute token expiry
      requireHttps: false        // Set to true in production
    }
  },

  // Accessibility compliance configuration
  accessibilityConfig: {
    // WCAG compliance level
    wcagLevel: 'AA',
    wcagVersion: '2.1',
    
    // Accessibility testing rules
    axeConfig: {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'screen-reader': { enabled: true },
        'semantic-markup': { enabled: true }
      }
    },

    // Mobile accessibility requirements
    mobileAccessibility: {
      minTouchTargetSize: 44,    // Minimum 44x44px touch targets
      maxTapDelay: 300,          // Maximum tap delay
      swipeGestureSupport: true, // Swipe gesture alternatives
      voiceOverSupport: true     // iOS VoiceOver support
    }
  },

  // Business workflow test scenarios
  businessWorkflows: {
    // Complete BMS-to-delivery process
    bmsToDelivery: {
      steps: [
        'bms-upload',
        'customer-creation',
        'vehicle-registration', 
        'claim-processing',
        'ro-creation',
        'parts-sourcing',
        'production-workflow',
        'quality-control',
        'customer-notification',
        'delivery-completion'
      ],
      maxDuration: 300000,       // 5 minutes max for full workflow
      criticalPath: true
    },

    // Insurance claim processing
    claimProcessing: {
      steps: [
        'claim-intake',
        'damage-assessment',
        'estimate-creation',
        'adjuster-communication',
        'approval-workflow',
        'supplement-processing'
      ],
      maxDuration: 120000,       // 2 minutes max
      criticalPath: true
    },

    // Parts management workflow
    partsManagement: {
      steps: [
        'parts-search',
        'vendor-lookup',
        'price-comparison',
        'po-generation',
        'order-tracking',
        'receiving-process',
        'inventory-update'
      ],
      maxDuration: 180000,       // 3 minutes max
      criticalPath: false
    },

    // Customer communication
    customerCommunication: {
      steps: [
        'message-composition',
        'template-selection',
        'personalization',
        'delivery-channel-selection',
        'send-confirmation',
        'delivery-tracking'
      ],
      maxDuration: 60000,        // 1 minute max
      criticalPath: false
    }
  },

  // Test data management
  testData: {
    // Sample BMS files for testing
    bmsFiles: {
      stateFarm: path.join(__dirname, '../fixtures/bms/state-farm-sample.xml'),
      icbc: path.join(__dirname, '../fixtures/bms/icbc-sample.xml'),
      geico: path.join(__dirname, '../fixtures/bms/geico-sample.json'),
      progressive: path.join(__dirname, '../fixtures/bms/progressive-sample.xml')
    },

    // Test customer data
    customers: [
      {
        firstName: 'John',
        lastName: 'Smith',
        phone: '604-555-1234',
        email: 'john.smith@test.com',
        type: 'individual'
      },
      {
        firstName: 'Jane',
        lastName: 'Corporate',
        phone: '778-555-5678',
        email: 'jane@corpfleet.com',
        type: 'fleet'
      }
    ],

    // Test vehicle data
    vehicles: [
      {
        vin: '1HGBH41JXMN109186',
        year: 2021,
        make: 'Honda',
        model: 'Civic',
        color: 'Blue'
      },
      {
        vin: '1G1BC5SM5H7123456',
        year: 2017,
        make: 'Chevrolet',
        model: 'Cruze',
        color: 'White'
      }
    ]
  },

  // Reporting configuration
  reporting: {
    // Output directories
    outputDir: 'test-results',
    screenshotDir: 'test-results/screenshots',
    videoDir: 'test-results/videos',
    coverageDir: 'test-results/coverage',

    // Report formats
    formats: {
      html: true,
      json: true,
      junit: true,
      coverage: true,
      performance: true,
      accessibility: true,
      security: true
    },

    // Report aggregation
    aggregateReports: true,
    
    // CI/CD integration
    ciIntegration: {
      github: true,
      jenkins: true,
      azure: true,
      aws: true
    }
  },

  // Environment-specific configuration
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3001',
      dbUrl: 'sqlite://./dev.db',
      slowMo: 100,
      headless: false,
      retries: 1
    },
    
    staging: {
      baseUrl: 'https://staging.collisionos.com',
      apiUrl: 'https://api-staging.collisionos.com',
      dbUrl: 'postgresql://staging-db',
      slowMo: 0,
      headless: true,
      retries: 2
    },
    
    production: {
      baseUrl: 'https://app.collisionos.com',
      apiUrl: 'https://api.collisionos.com',
      dbUrl: 'postgresql://prod-db',
      slowMo: 0,
      headless: true,
      retries: 3,
      parallelism: 4
    }
  },

  // Integration testing configuration
  integrations: {
    // Third-party service testing
    externalServices: {
      paymentProcessor: {
        mock: true,
        endpoint: 'https://api.stripe.com/v1',
        testMode: true
      },
      smsProvider: {
        mock: true,
        endpoint: 'https://api.twilio.com/2010-04-01',
        testMode: true
      },
      emailProvider: {
        mock: true,
        endpoint: 'https://api.sendgrid.com/v3',
        testMode: true
      }
    },

    // Database integration
    database: {
      migrations: true,
      seedData: true,
      cleanup: true,
      isolation: 'transaction'
    }
  },

  // Monitoring and alerting
  monitoring: {
    // Test execution monitoring
    testExecution: {
      maxDuration: 3600,         // 1 hour max total test time
      memoryMonitoring: true,
      cpuMonitoring: true,
      networkMonitoring: true
    },

    // Failure alerting
    alerting: {
      onFailure: true,
      onPerformanceRegression: true,
      onSecurityViolation: true,
      onAccessibilityRegression: true,
      
      // Alert channels
      channels: {
        email: ['dev-team@collisionos.com'],
        slack: ['#testing-alerts'],
        webhook: ['https://alerts.collisionos.com/webhook']
      }
    }
  }
};

// Export specific configurations for different test types
module.exports.getConfig = function(testType, environment = 'development') {
  const baseConfig = module.exports;
  const envConfig = baseConfig.environments[environment] || baseConfig.environments.development;
  
  return {
    ...baseConfig,
    ...envConfig,
    testType
  };
};

// Validation function for configuration
module.exports.validateConfig = function(config) {
  const required = ['testType', 'baseUrl', 'apiUrl'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  return true;
};