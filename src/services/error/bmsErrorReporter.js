/**
 * BMS Error Reporting System
 * Comprehensive error logging, user-friendly messages, and retry mechanisms
 */
import EventEmitter from 'events';

class BMSErrorReporter extends EventEmitter {
  constructor() {
    super();
    this.errorLog = [];
    this.errorPatterns = new Map();
    this.retryQueue = new Map();
    this.errorCategories = {
      PARSING: 'parsing',
      VALIDATION: 'validation',
      DATABASE: 'database',
      NETWORK: 'network',
      FILE_IO: 'file_io',
      BUSINESS_LOGIC: 'business_logic',
      SYSTEM: 'system'
    };
    
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.maxRetryAttempts = 3;
    this.retryDelays = [1000, 2000, 5000]; // Progressive delays
    this.maxLogEntries = 10000;

    this.initializeErrorPatterns();
  }

  /**
   * Initialize common error patterns and their user-friendly messages
   */
  initializeErrorPatterns() {
    this.errorPatterns.set(/XML.*parse.*error/i, {
      category: this.errorCategories.PARSING,
      severity: this.severityLevels.HIGH,
      userMessage: 'The BMS file appears to be corrupted or not in valid XML format. Please check the file and try again.',
      suggestions: [
        'Ensure the file is a valid BMS XML file from Mitchell Estimating',
        'Check that the file was not corrupted during transfer',
        'Try opening the file in a text editor to verify its contents'
      ],
      retryable: false
    });

    this.errorPatterns.set(/VIN.*invalid/i, {
      category: this.errorCategories.VALIDATION,
      severity: this.severityLevels.MEDIUM,
      userMessage: 'The Vehicle Identification Number (VIN) in the BMS file is invalid or missing.',
      suggestions: [
        'Verify the VIN in the original estimate',
        'Check that the VIN contains exactly 17 characters',
        'Ensure the VIN does not contain invalid characters (I, O, Q)'
      ],
      retryable: false
    });

    this.errorPatterns.set(/database.*connection/i, {
      category: this.errorCategories.DATABASE,
      severity: this.severityLevels.CRITICAL,
      userMessage: 'Unable to connect to the database. Please try again later.',
      suggestions: [
        'Check your internet connection',
        'Wait a few minutes and try again',
        'Contact support if the problem persists'
      ],
      retryable: true
    });

    this.errorPatterns.set(/network.*error|fetch.*failed/i, {
      category: this.errorCategories.NETWORK,
      severity: this.severityLevels.HIGH,
      userMessage: 'Network connection error occurred during file upload.',
      suggestions: [
        'Check your internet connection',
        'Ensure firewall is not blocking the connection',
        'Try again with a smaller file size'
      ],
      retryable: true
    });

    this.errorPatterns.set(/file.*too.*large/i, {
      category: this.errorCategories.FILE_IO,
      severity: this.severityLevels.MEDIUM,
      userMessage: 'The BMS file is too large to process.',
      suggestions: [
        'Split the estimate into smaller files',
        'Compress the file if possible',
        'Contact support to increase file size limits'
      ],
      retryable: false
    });

    this.errorPatterns.set(/missing.*required.*field/i, {
      category: this.errorCategories.VALIDATION,
      severity: this.severityLevels.MEDIUM,
      userMessage: 'The BMS file is missing required information.',
      suggestions: [
        'Check that the estimate is complete in Mitchell',
        'Ensure customer and vehicle information is filled out',
        'Verify that claim information is present'
      ],
      retryable: false
    });

    this.errorPatterns.set(/duplicate.*customer|customer.*exists/i, {
      category: this.errorCategories.BUSINESS_LOGIC,
      severity: this.severityLevels.LOW,
      userMessage: 'A customer with this information already exists in the system.',
      suggestions: [
        'This is normal behavior - the existing customer will be updated',
        'Check the customer list to verify the information',
        'Contact support if duplicate customers are causing issues'
      ],
      retryable: false
    });

    this.errorPatterns.set(/timeout/i, {
      category: this.errorCategories.NETWORK,
      severity: this.severityLevels.HIGH,
      userMessage: 'The request timed out. Please try again.',
      suggestions: [
        'Check your internet connection speed',
        'Try uploading fewer files at once',
        'Wait a moment and try again'
      ],
      retryable: true
    });
  }

  /**
   * Report and log an error
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   * @returns {Object} Error report
   */
  reportError(error, context = {}) {
    const errorReport = this.analyzeError(error, context);
    this.logError(errorReport);
    
    // Emit error event for listeners
    this.emit('errorReported', errorReport);
    
    // Handle retryable errors
    if (errorReport.retryable && context.operation) {
      this.scheduleRetry(errorReport, context);
    }

    return errorReport;
  }

  /**
   * Analyze error and create comprehensive report
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   * @returns {Object} Error analysis report
   */
  analyzeError(error, context) {
    const timestamp = new Date();
    const errorId = this.generateErrorId();
    
    // Find matching error pattern
    const pattern = this.findErrorPattern(error.message);
    
    const errorReport = {
      id: errorId,
      timestamp,
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        fileName: context.fileName || 'Unknown',
        fileSize: context.fileSize || 0,
        operation: context.operation || 'unknown',
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || 'unknown',
        userAgent: context.userAgent || 'unknown',
        ...context
      },
      analysis: {
        category: pattern?.category || this.errorCategories.SYSTEM,
        severity: pattern?.severity || this.severityLevels.MEDIUM,
        userMessage: pattern?.userMessage || this.generateGenericUserMessage(error),
        technicalMessage: error.message,
        suggestions: pattern?.suggestions || this.generateGenericSuggestions(error),
        retryable: pattern?.retryable || false,
        affectedComponents: this.identifyAffectedComponents(error, context)
      },
      resolution: {
        status: 'unresolved',
        resolvedAt: null,
        resolvedBy: null,
        resolution: null
      }
    };

    return errorReport;
  }

  /**
   * Find matching error pattern
   * @param {string} errorMessage - Error message to analyze
   * @returns {Object|null} Matching pattern or null
   */
  findErrorPattern(errorMessage) {
    for (const [pattern, config] of this.errorPatterns.entries()) {
      if (pattern.test(errorMessage)) {
        return config;
      }
    }
    return null;
  }

  /**
   * Generate generic user-friendly message
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  generateGenericUserMessage(error) {
    const errorType = error.name || 'Error';
    
    switch (errorType) {
      case 'ValidationError':
        return 'The BMS file contains invalid data. Please check the file and try again.';
      case 'TypeError':
        return 'There was a problem processing the file format. Please ensure you are uploading a valid BMS file.';
      case 'NetworkError':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'TimeoutError':
        return 'The operation timed out. Please try again or contact support if the problem persists.';
      default:
        return 'An unexpected error occurred while processing your file. Please try again or contact support.';
    }
  }

  /**
   * Generate generic suggestions
   * @param {Error} error - The error object
   * @returns {Array} Array of suggestions
   */
  generateGenericSuggestions(error) {
    return [
      'Try uploading the file again',
      'Check that the file is a valid BMS XML file',
      'Ensure you have a stable internet connection',
      'Contact support if the problem persists'
    ];
  }

  /**
   * Identify affected system components
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   * @returns {Array} Array of affected components
   */
  identifyAffectedComponents(error, context) {
    const components = [];
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      components.push('Database');
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      components.push('Network');
    }
    
    if (error.message.includes('parse') || error.message.includes('XML')) {
      components.push('XML Parser');
    }
    
    if (error.message.includes('validation')) {
      components.push('Data Validation');
    }
    
    if (context.operation) {
      components.push(`${context.operation} Operation`);
    }
    
    return components.length > 0 ? components : ['Unknown Component'];
  }

  /**
   * Log error to internal store
   * @param {Object} errorReport - Error report to log
   */
  logError(errorReport) {
    // Add to error log
    this.errorLog.unshift(errorReport);
    
    // Maintain maximum log size
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(0, this.maxLogEntries);
    }
    
    // Log to console based on severity
    const consoleMethod = this.getConsoleMethod(errorReport.analysis.severity);
    console[consoleMethod](`[BMS Error ${errorReport.id}]`, {
      category: errorReport.analysis.category,
      severity: errorReport.analysis.severity,
      message: errorReport.analysis.technicalMessage,
      context: errorReport.context
    });
  }

  /**
   * Get appropriate console method based on severity
   * @param {string} severity - Error severity level
   * @returns {string} Console method name
   */
  getConsoleMethod(severity) {
    switch (severity) {
      case this.severityLevels.CRITICAL:
        return 'error';
      case this.severityLevels.HIGH:
        return 'error';
      case this.severityLevels.MEDIUM:
        return 'warn';
      case this.severityLevels.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  /**
   * Schedule error retry
   * @param {Object} errorReport - Error report
   * @param {Object} context - Operation context
   */
  scheduleRetry(errorReport, context) {
    const retryKey = `${context.operation}-${context.fileName || 'unknown'}`;
    
    if (!this.retryQueue.has(retryKey)) {
      this.retryQueue.set(retryKey, {
        attempts: 0,
        lastAttempt: null,
        errors: []
      });
    }
    
    const retryInfo = this.retryQueue.get(retryKey);
    retryInfo.errors.push(errorReport);
    
    if (retryInfo.attempts < this.maxRetryAttempts) {
      const delay = this.retryDelays[retryInfo.attempts] || this.retryDelays[this.retryDelays.length - 1];
      
      setTimeout(() => {
        this.executeRetry(retryKey, errorReport, context);
      }, delay);
      
      this.emit('retryScheduled', {
        retryKey,
        attempt: retryInfo.attempts + 1,
        delay,
        errorReport
      });
    } else {
      this.emit('retryExhausted', {
        retryKey,
        totalAttempts: retryInfo.attempts,
        errors: retryInfo.errors
      });
    }
  }

  /**
   * Execute retry operation
   * @param {string} retryKey - Retry identifier
   * @param {Object} errorReport - Original error report
   * @param {Object} context - Operation context
   */
  async executeRetry(retryKey, errorReport, context) {
    const retryInfo = this.retryQueue.get(retryKey);
    retryInfo.attempts++;
    retryInfo.lastAttempt = new Date();
    
    this.emit('retryAttempt', {
      retryKey,
      attempt: retryInfo.attempts,
      errorReport
    });
    
    try {
      // The actual retry logic would be implemented by the calling service
      // This is a placeholder for retry coordination
      this.emit('retryExecute', {
        retryKey,
        context,
        attempt: retryInfo.attempts
      });
    } catch (retryError) {
      const retryErrorReport = this.reportError(retryError, {
        ...context,
        isRetry: true,
        originalErrorId: errorReport.id
      });
      
      if (retryInfo.attempts < this.maxRetryAttempts) {
        this.scheduleRetry(retryErrorReport, context);
      }
    }
  }

  /**
   * Mark error as resolved
   * @param {string} errorId - Error ID to resolve
   * @param {string} resolution - Resolution description
   * @param {string} resolvedBy - Who resolved the error
   */
  resolveError(errorId, resolution, resolvedBy = 'system') {
    const errorIndex = this.errorLog.findIndex(error => error.id === errorId);
    
    if (errorIndex !== -1) {
      this.errorLog[errorIndex].resolution = {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
        resolution
      };
      
      this.emit('errorResolved', this.errorLog[errorIndex]);
      return this.errorLog[errorIndex];
    }
    
    return null;
  }

  /**
   * Get error statistics
   * @param {Object} filters - Filters for statistics
   * @returns {Object} Error statistics
   */
  getErrorStatistics(filters = {}) {
    let filteredErrors = this.errorLog;
    
    // Apply filters
    if (filters.category) {
      filteredErrors = filteredErrors.filter(error => 
        error.analysis.category === filters.category
      );
    }
    
    if (filters.severity) {
      filteredErrors = filteredErrors.filter(error => 
        error.analysis.severity === filters.severity
      );
    }
    
    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      filteredErrors = filteredErrors.filter(error => 
        error.timestamp >= start && error.timestamp <= end
      );
    }
    
    // Calculate statistics
    const totalErrors = filteredErrors.length;
    const resolvedErrors = filteredErrors.filter(error => 
      error.resolution.status === 'resolved'
    ).length;
    
    const errorsByCategory = {};
    const errorsBySeverity = {};
    
    filteredErrors.forEach(error => {
      const category = error.analysis.category;
      const severity = error.analysis.severity;
      
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
    });
    
    return {
      totalErrors,
      resolvedErrors,
      unresolvedErrors: totalErrors - resolvedErrors,
      resolutionRate: totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: filteredErrors.slice(0, 10)
    };
  }

  /**
   * Get error details
   * @param {string} errorId - Error ID
   * @returns {Object|null} Error details
   */
  getErrorDetails(errorId) {
    return this.errorLog.find(error => error.id === errorId) || null;
  }

  /**
   * Search errors
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching errors
   */
  searchErrors(criteria) {
    return this.errorLog.filter(error => {
      let matches = true;
      
      if (criteria.message) {
        matches = matches && error.originalError.message.toLowerCase()
          .includes(criteria.message.toLowerCase());
      }
      
      if (criteria.category) {
        matches = matches && error.analysis.category === criteria.category;
      }
      
      if (criteria.severity) {
        matches = matches && error.analysis.severity === criteria.severity;
      }
      
      if (criteria.fileName) {
        matches = matches && error.context.fileName?.toLowerCase()
          .includes(criteria.fileName.toLowerCase());
      }
      
      return matches;
    });
  }

  /**
   * Export error log
   * @param {Object} options - Export options
   * @returns {Object} Exported data
   */
  exportErrorLog(options = {}) {
    const { format = 'json', limit = 1000, filters = {} } = options;
    
    const errors = this.searchErrors(filters).slice(0, limit);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID', 'Timestamp', 'Category', 'Severity', 'Message', 
        'FileName', 'Operation', 'Resolved'
      ];
      
      const csvRows = errors.map(error => [
        error.id,
        error.timestamp.toISOString(),
        error.analysis.category,
        error.analysis.severity,
        error.originalError.message,
        error.context.fileName || '',
        error.context.operation || '',
        error.resolution.status === 'resolved' ? 'Yes' : 'No'
      ]);
      
      return {
        format: 'csv',
        headers: csvHeaders,
        data: csvRows
      };
    }
    
    return {
      format: 'json',
      data: errors,
      metadata: {
        totalErrors: this.errorLog.length,
        exportedErrors: errors.length,
        exportDate: new Date()
      }
    };
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear error log
   * @param {Object} criteria - Clear criteria (optional)
   */
  clearErrorLog(criteria = {}) {
    if (Object.keys(criteria).length === 0) {
      // Clear all errors
      const clearedCount = this.errorLog.length;
      this.errorLog = [];
      this.emit('errorLogCleared', { clearedCount });
    } else {
      // Clear filtered errors
      const beforeCount = this.errorLog.length;
      this.errorLog = this.errorLog.filter(error => {
        return !this.matchesCriteria(error, criteria);
      });
      const clearedCount = beforeCount - this.errorLog.length;
      this.emit('errorLogPartiallyCleared', { clearedCount });
    }
  }

  /**
   * Check if error matches criteria
   * @param {Object} error - Error to check
   * @param {Object} criteria - Criteria to match
   * @returns {boolean} Whether error matches criteria
   */
  matchesCriteria(error, criteria) {
    if (criteria.resolved !== undefined) {
      const isResolved = error.resolution.status === 'resolved';
      if (criteria.resolved !== isResolved) return false;
    }
    
    if (criteria.category && error.analysis.category !== criteria.category) {
      return false;
    }
    
    if (criteria.severity && error.analysis.severity !== criteria.severity) {
      return false;
    }
    
    if (criteria.olderThan) {
      if (error.timestamp > criteria.olderThan) return false;
    }
    
    return true;
  }
}

export default BMSErrorReporter;