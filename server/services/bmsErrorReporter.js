/**
 * BMS Error Reporter
 * Handles error reporting, categorization, and management for BMS operations
 */
class BMSErrorReporter {
  constructor() {
    this.errorStore = new Map();
    this.errorCategories = {
      parsing: 'File Parsing Error',
      validation: 'Data Validation Error',
      database: 'Database Operation Error',
      network: 'Network/API Error',
      file_io: 'File I/O Error',
      business_logic: 'Business Logic Error',
      system: 'System Error',
    };

    this.severityLevels = ['low', 'medium', 'high', 'critical'];
    this.statistics = {
      totalErrors: 0,
      resolvedErrors: 0,
      categoryBreakdown: {},
      severityBreakdown: {},
    };
  }

  /**
   * Report and categorize an error
   */
  reportError(error, context = {}) {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const errorReport = {
      id: errorId,
      timestamp: new Date(),
      error: {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      context: {
        operation: context.operation || 'unknown',
        fileName: context.fileName,
        userId: context.userId,
        batchId: context.batchId,
        fileId: context.fileId,
        userAgent: context.userAgent,
        ...context,
      },
      analysis: this.analyzeError(error, context),
      resolved: false,
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
    };

    // Store error
    this.errorStore.set(errorId, errorReport);

    // Update statistics
    this.updateStatistics(errorReport);

    console.error(`Error reported [${errorId}]:`, error.message);

    return errorReport;
  }

  /**
   * Analyze error to determine category, severity, and suggested actions
   */
  analyzeError(error, context) {
    const analysis = {
      category: 'system',
      severity: 'medium',
      retryable: false,
      userMessage: 'An error occurred while processing the file',
      technicalMessage: error.message,
      suggestedActions: [],
      relatedErrors: [],
    };

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Categorize error
    if (
      errorMessage.includes('xml') ||
      errorMessage.includes('parse') ||
      errorMessage.includes('syntax')
    ) {
      analysis.category = 'parsing';
      analysis.severity = 'high';
      analysis.userMessage = 'The file format is invalid or corrupted';
      analysis.suggestedActions.push(
        'Verify file format',
        'Check file encoding',
        'Try re-exporting from source system'
      );
    } else if (
      errorMessage.includes('validation') ||
      errorMessage.includes('required') ||
      errorMessage.includes('missing')
    ) {
      analysis.category = 'validation';
      analysis.severity = 'medium';
      analysis.userMessage = 'The file is missing required information';
      analysis.suggestedActions.push(
        'Check file completeness',
        'Verify all required fields are present'
      );
    } else if (
      errorMessage.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('connection')
    ) {
      analysis.category = 'database';
      analysis.severity = 'high';
      analysis.retryable = true;
      analysis.userMessage = 'A database error occurred';
      analysis.suggestedActions.push(
        'Retry the operation',
        'Contact system administrator if problem persists'
      );
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch')
    ) {
      analysis.category = 'network';
      analysis.severity = 'medium';
      analysis.retryable = true;
      analysis.userMessage = 'A network error occurred';
      analysis.suggestedActions.push(
        'Check internet connection',
        'Retry the operation'
      );
    } else if (
      errorMessage.includes('file') ||
      errorMessage.includes('enoent') ||
      errorMessage.includes('permission')
    ) {
      analysis.category = 'file_io';
      analysis.severity = 'high';
      analysis.userMessage = 'File access error occurred';
      analysis.suggestedActions.push(
        'Check file permissions',
        'Verify file exists',
        'Try uploading the file again'
      );
    } else if (
      errorMessage.includes('business') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('constraint')
    ) {
      analysis.category = 'business_logic';
      analysis.severity = 'medium';
      analysis.userMessage = 'Data does not meet business requirements';
      analysis.suggestedActions.push(
        'Review data values',
        'Check business rules'
      );
    }

    // Determine severity
    if (
      errorMessage.includes('critical') ||
      errorMessage.includes('fatal') ||
      errorName.includes('error')
    ) {
      analysis.severity = 'critical';
    } else if (
      errorMessage.includes('warning') ||
      errorMessage.includes('minor')
    ) {
      analysis.severity = 'low';
    }

    // Check if retryable
    if (
      analysis.category === 'network' ||
      analysis.category === 'database' ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('temporary')
    ) {
      analysis.retryable = true;
    }

    return analysis;
  }

  /**
   * Update error statistics
   */
  updateStatistics(errorReport) {
    this.statistics.totalErrors++;

    // Update category breakdown
    const category = errorReport.analysis.category;
    this.statistics.categoryBreakdown[category] =
      (this.statistics.categoryBreakdown[category] || 0) + 1;

    // Update severity breakdown
    const severity = errorReport.analysis.severity;
    this.statistics.severityBreakdown[severity] =
      (this.statistics.severityBreakdown[severity] || 0) + 1;
  }

  /**
   * Resolve an error
   */
  resolveError(errorId, resolution, resolvedBy) {
    const errorReport = this.errorStore.get(errorId);
    if (!errorReport) {
      return null;
    }

    errorReport.resolved = true;
    errorReport.resolution = resolution;
    errorReport.resolvedBy = resolvedBy;
    errorReport.resolvedAt = new Date();

    this.statistics.resolvedErrors++;

    console.log(`Error ${errorId} resolved by ${resolvedBy}`);
    return errorReport;
  }

  /**
   * Get error by ID
   */
  getError(errorId) {
    return this.errorStore.get(errorId) || null;
  }

  /**
   * Search errors by filters
   */
  searchErrors(filters = {}) {
    const errors = Array.from(this.errorStore.values());

    let filteredErrors = errors;

    // Filter by severity
    if (filters.severity) {
      filteredErrors = filteredErrors.filter(
        error => error.analysis.severity === filters.severity
      );
    }

    // Filter by category
    if (filters.category) {
      filteredErrors = filteredErrors.filter(
        error => error.analysis.category === filters.category
      );
    }

    // Filter by resolved status
    if (filters.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(
        error => error.resolved === filters.resolved
      );
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredErrors = filteredErrors.filter(
        error => new Date(error.timestamp) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredErrors = filteredErrors.filter(
        error => new Date(error.timestamp) <= endDate
      );
    }

    // Sort by timestamp (newest first)
    filteredErrors.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return filteredErrors;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(filters = {}) {
    const errors = this.searchErrors(filters);

    const stats = {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
      categories: {},
      severities: {},
      recentErrors: errors.slice(0, 10),
      topCategories: [],
      resolutionRate: 0,
    };

    // Calculate resolution rate
    if (stats.total > 0) {
      stats.resolutionRate = Math.round((stats.resolved / stats.total) * 100);
    }

    // Category breakdown
    errors.forEach(error => {
      const category = error.analysis.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    // Severity breakdown
    errors.forEach(error => {
      const severity = error.analysis.severity;
      stats.severities[severity] = (stats.severities[severity] || 0) + 1;
    });

    // Top categories
    stats.topCategories = Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / stats.total) * 100),
      }));

    return stats;
  }

  /**
   * Get related errors (similar patterns)
   */
  getRelatedErrors(errorId) {
    const error = this.errorStore.get(errorId);
    if (!error) {
      return [];
    }

    const relatedErrors = [];
    const errorMessage = error.error.message.toLowerCase();
    const errorCategory = error.analysis.category;

    for (const [id, otherError] of this.errorStore.entries()) {
      if (id === errorId) continue;

      // Same category
      if (otherError.analysis.category === errorCategory) {
        // Similar message
        if (
          this.calculateSimilarity(
            errorMessage,
            otherError.error.message.toLowerCase()
          ) > 0.7
        ) {
          relatedErrors.push({
            id: otherError.id,
            message: otherError.error.message,
            timestamp: otherError.timestamp,
            similarity: 'high',
          });
        }
      }
    }

    return relatedErrors.slice(0, 5);
  }

  /**
   * Calculate message similarity
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Export error report
   */
  exportErrorReport(format = 'json', filters = {}) {
    const errors = this.searchErrors(filters);
    const statistics = this.getErrorStatistics(filters);

    const report = {
      generatedAt: new Date().toISOString(),
      filters,
      statistics,
      errors: errors.map(error => ({
        id: error.id,
        timestamp: error.timestamp,
        category: error.analysis.category,
        severity: error.analysis.severity,
        message: error.error.message,
        context: error.context,
        resolved: error.resolved,
        resolvedAt: error.resolvedAt,
        resolvedBy: error.resolvedBy,
      })),
    };

    if (format === 'csv') {
      return this.convertToCSV(report.errors);
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Convert errors to CSV format
   */
  convertToCSV(errors) {
    const headers = [
      'ID',
      'Timestamp',
      'Category',
      'Severity',
      'Message',
      'Operation',
      'File Name',
      'User ID',
      'Resolved',
      'Resolved At',
    ];
    const rows = errors.map(error => [
      error.id,
      error.timestamp,
      error.category,
      error.severity,
      `"${error.message.replace(/"/g, '""')}"`,
      error.context.operation || '',
      error.context.fileName || '',
      error.context.userId || '',
      error.resolved,
      error.resolvedAt || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup old errors
   */
  cleanupOldErrors(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    for (const [id, error] of this.errorStore.entries()) {
      if (new Date(error.timestamp) < cutoffDate) {
        this.errorStore.delete(id);
        deletedCount++;
      }
    }

    // Recalculate statistics
    this.recalculateStatistics();

    return deletedCount;
  }

  /**
   * Recalculate statistics after cleanup
   */
  recalculateStatistics() {
    this.statistics = {
      totalErrors: 0,
      resolvedErrors: 0,
      categoryBreakdown: {},
      severityBreakdown: {},
    };

    for (const error of this.errorStore.values()) {
      this.updateStatistics(error);
      if (error.resolved) {
        this.statistics.resolvedErrors++;
      }
    }
  }
}

module.exports = new BMSErrorReporter();
