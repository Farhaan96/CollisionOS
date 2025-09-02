/**
 * Frontend Logging Utility for CollisionOS
 * Provides structured logging with development/production mode handling
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.REACT_APP_LOG_LEVEL || 'warn';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to output this log level
   */
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  /**
   * Format log message with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @returns {Object} Formatted log entry
   */
  formatMessage(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context,
      // Add collision repair specific fields
      component: context.component || 'Unknown',
      operation: context.operation || 'Unknown',
      userId: context.userId || 'anonymous'
    };
  }

  /**
   * Log error messages (always shown in production)
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   */
  error(message, context = {}) {
    if (this.shouldLog('error') || !this.isDevelopment) {
      const logEntry = this.formatMessage('error', message, context);
      // eslint-disable-next-line no-console
      console.error('[CollisionOS Error]', logEntry);
      
      // In production, could send to error reporting service
      if (!this.isDevelopment) {
        this.sendToErrorService(logEntry);
      }
    }
  }

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      const logEntry = this.formatMessage('warn', message, context);
      // eslint-disable-next-line no-console
      console.warn('[CollisionOS Warning]', logEntry);
    }
  }

  /**
   * Log info messages (development only by default)
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    if (this.shouldLog('info') && this.isDevelopment) {
      const logEntry = this.formatMessage('info', message, context);
      // eslint-disable-next-line no-console
      console.info('[CollisionOS Info]', logEntry);
    }
  }

  /**
   * Log debug messages (development only)
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      const logEntry = this.formatMessage('debug', message, context);
      // eslint-disable-next-line no-console
      console.log('[CollisionOS Debug]', logEntry);
    }
  }

  /**
   * Log service errors with collision repair context
   * @param {string} service - Service name (e.g., 'partsService', 'authService')
   * @param {string} operation - Operation name (e.g., 'searchParts', 'login')
   * @param {Error} error - Error object
   * @param {Object} additionalContext - Additional context
   */
  serviceError(service, operation, error, additionalContext = {}) {
    this.error(`${service} ${operation} failed`, {
      service,
      operation,
      error: {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      },
      ...additionalContext
    });
  }

  /**
   * Log collision repair workflow events
   * @param {string} workflow - Workflow name (e.g., 'BMS_IMPORT', 'PARTS_WORKFLOW', 'PO_CREATION')
   * @param {string} step - Current step in workflow
   * @param {string} status - Status (success, error, warning, info)
   * @param {Object} context - Workflow context
   */
  workflow(workflow, step, status, context = {}) {
    const message = `${workflow}: ${step}`;
    const workflowContext = {
      workflow,
      step,
      ...context
    };

    switch (status) {
      case 'error':
        this.error(message, workflowContext);
        break;
      case 'warning':
        this.warn(message, workflowContext);
        break;
      case 'success':
        this.info(message, workflowContext);
        break;
      default:
        this.debug(message, workflowContext);
    }
  }

  /**
   * Send error to external service (placeholder)
   * @param {Object} logEntry - Log entry to send
   */
  sendToErrorService(logEntry) {
    // Placeholder for production error reporting
    // Could integrate with Sentry, LogRocket, etc.
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: logEntry.message,
        fatal: logEntry.level === 'ERROR'
      });
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;