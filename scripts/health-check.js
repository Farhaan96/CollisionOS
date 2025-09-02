#!/usr/bin/env node
/**
 * CollisionOS Automated Parts Sourcing - Comprehensive Health Check System
 * Enterprise-grade health monitoring for production deployment
 */

const http = require('http');
const https = require('https');
const { promisify } = require('util');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const dnsLookup = promisify(dns.lookup);

// Configuration
const config = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  maxRetries: parseInt(process.env.HEALTH_CHECK_RETRIES) || 3,
  verbose: process.env.HEALTH_CHECK_VERBOSE === 'true',
  includeVendorChecks: process.env.HEALTH_CHECK_INCLUDE_VENDORS === 'true',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'collisionos:'
  },
  
  // Vendor API configuration (for production health checks)
  vendors: {
    lkq: {
      apiKey: process.env.LKQ_API_KEY,
      apiUrl: process.env.LKQ_API_URL || 'https://api.lkq.com',
      enabled: !!process.env.LKQ_API_KEY
    },
    partsTrader: {
      apiKey: process.env.PARTS_TRADER_API_KEY,
      apiUrl: process.env.PARTS_TRADER_API_URL || 'https://api.partstrader.com',
      enabled: !!process.env.PARTS_TRADER_API_KEY
    },
    oeConnection: {
      apiKey: process.env.OE_CONNECTION_API_KEY,
      apiUrl: process.env.OE_CONNECTION_API_URL || 'https://api.oeconnection.com',
      enabled: !!process.env.OE_CONNECTION_API_KEY
    }
  }
};

// Health check results
const healthStatus = {
  status: 'unknown',
  timestamp: new Date().toISOString(),
  environment: config.environment,
  version: process.env.npm_package_version || 'unknown',
  uptime: process.uptime(),
  checks: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
const log = (message, level = 'info') => {
  if (config.verbose || level === 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
};

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, options.timeout || config.timeoutMs);

    const req = protocol.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

// Health check functions
const checkApplicationHealth = async () => {
  const checkName = 'application';
  healthStatus.checks[checkName] = {
    status: 'checking',
    message: 'Checking application health...',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check basic application responsiveness
    const response = await makeRequest(`http://localhost:${config.port}/api/health/basic`);
    
    if (response.statusCode === 200) {
      healthStatus.checks[checkName] = {
        status: 'healthy',
        message: 'Application is responding normally',
        timestamp: new Date().toISOString(),
        details: {
          port: config.port,
          responseTime: '<5s',
          statusCode: response.statusCode
        }
      };
      return true;
    } else {
      throw new Error(`Unexpected status code: ${response.statusCode}`);
    }
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'unhealthy',
      message: `Application health check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

const checkDatabaseHealth = async () => {
  const checkName = 'database';
  healthStatus.checks[checkName] = {
    status: 'checking',
    message: 'Checking database connectivity...',
    timestamp: new Date().toISOString()
  };

  if (!config.database.url) {
    healthStatus.checks[checkName] = {
      status: 'warning',
      message: 'Database URL not configured',
      timestamp: new Date().toISOString()
    };
    return false;
  }

  try {
    // For Docker health checks, we'll check if the database connection is working
    // by making a request to our application's database health endpoint
    const response = await makeRequest(`http://localhost:${config.port}/api/health/database`);
    
    if (response.statusCode === 200) {
      const dbStatus = JSON.parse(response.data);
      healthStatus.checks[checkName] = {
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString(),
        details: {
          connectionCount: dbStatus.connections || 'unknown',
          latency: dbStatus.latency || 'unknown'
        }
      };
      return true;
    } else {
      throw new Error(`Database health endpoint returned ${response.statusCode}`);
    }
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'unhealthy',
      message: `Database health check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

const checkRedisHealth = async () => {
  const checkName = 'redis';
  healthStatus.checks[checkName] = {
    status: 'checking',
    message: 'Checking Redis connectivity...',
    timestamp: new Date().toISOString()
  };

  if (!config.redis.url) {
    healthStatus.checks[checkName] = {
      status: 'warning',
      message: 'Redis URL not configured',
      timestamp: new Date().toISOString()
    };
    return false;
  }

  try {
    const response = await makeRequest(`http://localhost:${config.port}/api/health/redis`);
    
    if (response.statusCode === 200) {
      const redisStatus = JSON.parse(response.data);
      healthStatus.checks[checkName] = {
        status: 'healthy',
        message: 'Redis connection is healthy',
        timestamp: new Date().toISOString(),
        details: {
          connected: redisStatus.connected,
          memory: redisStatus.memory || 'unknown'
        }
      };
      return true;
    } else {
      throw new Error(`Redis health endpoint returned ${response.statusCode}`);
    }
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'unhealthy',
      message: `Redis health check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

const checkAutomatedSourcingHealth = async () => {
  const checkName = 'automated-sourcing';
  healthStatus.checks[checkName] = {
    status: 'checking',
    message: 'Checking automated parts sourcing system...',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeRequest(`http://localhost:${config.port}/api/sourcing/health`);
    
    if (response.statusCode === 200) {
      const sourcingStatus = JSON.parse(response.data);
      healthStatus.checks[checkName] = {
        status: 'healthy',
        message: 'Automated sourcing system is operational',
        timestamp: new Date().toISOString(),
        details: {
          queueSize: sourcingStatus.queueSize || 0,
          activeJobs: sourcingStatus.activeJobs || 0,
          vendorsConnected: sourcingStatus.vendorsConnected || 0
        }
      };
      return true;
    } else {
      throw new Error(`Sourcing health endpoint returned ${response.statusCode}`);
    }
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'unhealthy',
      message: `Automated sourcing health check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

const checkVendorAPIHealth = async (vendorName, vendorConfig) => {
  const checkName = `vendor-${vendorName}`;
  
  if (!vendorConfig.enabled) {
    healthStatus.checks[checkName] = {
      status: 'disabled',
      message: `${vendorName} API is disabled (no API key configured)`,
      timestamp: new Date().toISOString()
    };
    return false;
  }

  healthStatus.checks[checkName] = {
    status: 'checking',
    message: `Checking ${vendorName} API connectivity...`,
    timestamp: new Date().toISOString()
  };

  try {
    // For vendor health checks, we'll check through our application's vendor health endpoint
    // to avoid exposing API keys in the health check script
    const response = await makeRequest(`http://localhost:${config.port}/api/health/vendor/${vendorName}`);
    
    if (response.statusCode === 200) {
      const vendorStatus = JSON.parse(response.data);
      healthStatus.checks[checkName] = {
        status: vendorStatus.connected ? 'healthy' : 'warning',
        message: vendorStatus.connected ? 
          `${vendorName} API is connected and responding` :
          `${vendorName} API connection has issues`,
        timestamp: new Date().toISOString(),
        details: {
          responseTime: vendorStatus.responseTime || 'unknown',
          quotaRemaining: vendorStatus.quotaRemaining || 'unknown',
          lastError: vendorStatus.lastError || null
        }
      };
      return vendorStatus.connected;
    } else {
      throw new Error(`Vendor health endpoint returned ${response.statusCode}`);
    }
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'warning',
      message: `${vendorName} API health check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

const checkSystemResources = async () => {
  const checkName = 'system-resources';
  healthStatus.checks[checkName] = {
    status: 'checking',
    message: 'Checking system resources...',
    timestamp: new Date().toISOString()
  };

  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Convert to MB
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Check if memory usage is concerning (>1GB)
    const memoryWarning = memoryUsageMB.rss > 1024;
    
    healthStatus.checks[checkName] = {
      status: memoryWarning ? 'warning' : 'healthy',
      message: memoryWarning ? 
        'High memory usage detected' : 
        'System resources within normal limits',
      timestamp: new Date().toISOString(),
      details: {
        memory: memoryUsageMB,
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version
      }
    };
    
    return !memoryWarning;
  } catch (error) {
    healthStatus.checks[checkName] = {
      status: 'warning',
      message: `System resource check failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
};

// Main health check orchestrator
const runHealthChecks = async () => {
  log('Starting comprehensive health check...', 'info');
  const startTime = Date.now();
  
  // Core application health checks
  const coreChecks = [
    checkApplicationHealth(),
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkAutomatedSourcingHealth(),
    checkSystemResources()
  ];

  // Vendor API health checks (if enabled)
  const vendorChecks = [];
  if (config.includeVendorChecks) {
    for (const [vendorName, vendorConfig] of Object.entries(config.vendors)) {
      vendorChecks.push(checkVendorAPIHealth(vendorName, vendorConfig));
    }
  }

  // Execute all checks
  const allChecks = [...coreChecks, ...vendorChecks];
  const results = await Promise.allSettled(allChecks);

  // Calculate summary
  healthStatus.summary.total = Object.keys(healthStatus.checks).length;
  
  Object.values(healthStatus.checks).forEach(check => {
    switch (check.status) {
      case 'healthy':
        healthStatus.summary.passed++;
        break;
      case 'unhealthy':
        healthStatus.summary.failed++;
        break;
      case 'warning':
      case 'disabled':
        healthStatus.summary.warnings++;
        break;
    }
  });

  // Determine overall status
  if (healthStatus.summary.failed > 0) {
    healthStatus.status = 'unhealthy';
  } else if (healthStatus.summary.warnings > 0) {
    healthStatus.status = 'degraded';
  } else {
    healthStatus.status = 'healthy';
  }

  const duration = Date.now() - startTime;
  healthStatus.checkDuration = `${duration}ms`;
  
  log(`Health check completed in ${duration}ms - Status: ${healthStatus.status}`, 'info');
  
  return healthStatus;
};

// CLI interface
const main = async () => {
  try {
    const result = await runHealthChecks();
    
    // Output results
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n🏥 CollisionOS Health Check Report`);
      console.log(`=================================`);
      console.log(`Overall Status: ${result.status.toUpperCase()}`);
      console.log(`Environment: ${result.environment}`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log(`Check Duration: ${result.checkDuration}`);
      console.log(`\nSummary:`);
      console.log(`  Total Checks: ${result.summary.total}`);
      console.log(`  ✅ Passed: ${result.summary.passed}`);
      console.log(`  ❌ Failed: ${result.summary.failed}`);
      console.log(`  ⚠️  Warnings: ${result.summary.warnings}`);
      
      console.log(`\nDetailed Results:`);
      Object.entries(result.checks).forEach(([name, check]) => {
        const icon = check.status === 'healthy' ? '✅' : 
                    check.status === 'unhealthy' ? '❌' : 
                    check.status === 'disabled' ? '⏸️' : '⚠️';
        console.log(`  ${icon} ${name}: ${check.message}`);
        
        if (check.details && config.verbose) {
          console.log(`     Details: ${JSON.stringify(check.details, null, 2)}`);
        }
      });
    }

    // Exit with appropriate code
    process.exit(result.status === 'healthy' ? 0 : 1);
    
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error');
    console.error(`❌ Health check system error: ${error.message}`);
    process.exit(2);
  }
};

// Handle being called directly
if (require.main === module) {
  main();
}

module.exports = {
  runHealthChecks,
  healthStatus,
  config
};