const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const bmsService = require('./bmsService');
const bmsValidator = require('./bmsValidator');
const errorReporter = require('./bmsErrorReporter');

/**
 * BMS Batch Processor
 * Handles batch processing of multiple BMS/EMS files
 */
class BMSBatchProcessor {
  constructor() {
    this.activeBatches = new Map();
    this.batchHistory = new Map();
    this.statistics = {
      totalBatches: 0,
      totalFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Create a new batch job
   */
  createBatch(files, options = {}) {
    const batchId = uuidv4();
    const batch = {
      id: batchId,
      status: 'created',
      files: files.map((file, index) => ({
        id: uuidv4(),
        fileName: file.name,
        fileSize: file.size,
        filePath: file.path,
        status: 'pending',
        index,
        originalFile: file.originalFile
      })),
      options: {
        pauseOnError: options.pauseOnError || false,
        maxRetries: options.maxRetries || 3,
        validateFirst: options.validateFirst || true,
        userId: options.userId,
        userAgent: options.userAgent,
        concurrency: options.concurrency || 3
      },
      results: [],
      statistics: {
        totalFiles: files.length,
        processedFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        startTime: null,
        endTime: null,
        processingTime: 0
      },
      errors: [],
      createdAt: new Date(),
      createdBy: options.userId
    };

    this.activeBatches.set(batchId, batch);
    this.statistics.totalBatches++;

    console.log(`Created batch ${batchId} with ${files.length} files`);
    return batch;
  }

  /**
   * Start batch processing
   */
  async startBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== 'created') {
      throw new Error(`Batch ${batchId} is not in created state`);
    }

    batch.status = 'processing';
    batch.statistics.startTime = new Date();

    console.log(`Starting batch processing for ${batchId}`);

    try {
      // Process files with concurrency control
      await this.processFilesInBatch(batch);
      
      // Complete batch
      batch.status = 'completed';
      batch.statistics.endTime = new Date();
      batch.statistics.processingTime = batch.statistics.endTime - batch.statistics.startTime;

      // Move to history
      this.batchHistory.set(batchId, batch);
      this.activeBatches.delete(batchId);

      // Update global statistics
      this.updateGlobalStatistics(batch);

      console.log(`Batch ${batchId} completed successfully`);
      return batch;

    } catch (error) {
      batch.status = 'failed';
      batch.statistics.endTime = new Date();
      batch.errors.push({
        type: 'BATCH_PROCESSING_ERROR',
        message: error.message,
        timestamp: new Date()
      });

      // Move to history
      this.batchHistory.set(batchId, batch);
      this.activeBatches.delete(batchId);

      console.error(`Batch ${batchId} failed:`, error);
      throw error;
    }
  }

  /**
   * Process files in batch with concurrency control
   */
  async processFilesInBatch(batch) {
    const { concurrency } = batch.options;
    const files = batch.files.filter(file => file.status === 'pending');
    
    // Process files in chunks
    for (let i = 0; i < files.length; i += concurrency) {
      const chunk = files.slice(i, i + concurrency);
      
      // Process chunk concurrently
      const promises = chunk.map(file => this.processFileInBatch(file, batch));
      await Promise.allSettled(promises);

      // Check if should pause on error
      if (batch.options.pauseOnError) {
        const hasErrors = batch.files.some(f => f.status === 'failed');
        if (hasErrors) {
          batch.status = 'paused';
          throw new Error('Batch paused due to processing errors');
        }
      }
    }
  }

  /**
   * Process a single file within a batch
   */
  async processFileInBatch(file, batch) {
    try {
      file.status = 'processing';
      file.startTime = new Date();

      console.log(`Processing file ${file.fileName} in batch ${batch.id}`);

      // Read file content
      const content = await fs.readFile(file.filePath, 'utf8');

      // Validate file if requested
      if (batch.options.validateFirst) {
        const validation = await bmsValidator.validateBMSFile(content);
        file.validation = validation;
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors[0]?.message || 'Unknown validation error'}`);
        }
      }

      // Determine file type and process
      const trimmedContent = content.trim();
      let result;

      if (trimmedContent.startsWith('<')) {
        // BMS XML format
        file.fileType = 'BMS';
        result = await bmsService.processBMSFile(content, {
          uploadId: file.id,
          fileName: file.fileName,
          userId: batch.options.userId
        });
      } else {
        // EMS text format
        file.fileType = 'EMS';
        result = await bmsService.processEMSFile(content, {
          uploadId: file.id,
          fileName: file.fileName,
          userId: batch.options.userId
        });
      }

      // Success
      file.status = 'completed';
      file.endTime = new Date();
      file.processingTime = file.endTime - file.startTime;
      file.result = result;

      batch.statistics.processedFiles++;
      batch.statistics.successfulFiles++;
      batch.results.push({
        fileId: file.id,
        fileName: file.fileName,
        status: 'success',
        result
      });

      console.log(`Successfully processed ${file.fileName}`);

    } catch (error) {
      console.error(`Error processing ${file.fileName}:`, error);

      file.status = 'failed';
      file.endTime = new Date();
      file.error = {
        type: error.constructor.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };

      batch.statistics.processedFiles++;
      batch.statistics.failedFiles++;
      batch.results.push({
        fileId: file.id,
        fileName: file.fileName,
        status: 'error',
        error: file.error
      });

      // Report error
      errorReporter.reportError(error, {
        batchId: batch.id,
        fileId: file.id,
        fileName: file.fileName,
        userId: batch.options.userId,
        operation: 'batch_file_processing'
      });

    } finally {
      // Cleanup temp file
      try {
        await fs.unlink(file.filePath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp file ${file.filePath}:`, cleanupError);
      }
    }
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId) {
    // Check active batches first
    let batch = this.activeBatches.get(batchId);
    if (batch) {
      return this.formatBatchStatus(batch);
    }

    // Check history
    batch = this.batchHistory.get(batchId);
    if (batch) {
      return this.formatBatchStatus(batch);
    }

    return null;
  }

  /**
   * Format batch status for API response
   */
  formatBatchStatus(batch) {
    const progress = batch.statistics.totalFiles > 0 
      ? Math.round((batch.statistics.processedFiles / batch.statistics.totalFiles) * 100)
      : 0;

    return {
      id: batch.id,
      status: batch.status,
      progress,
      statistics: batch.statistics,
      files: batch.files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        status: file.status,
        fileType: file.fileType,
        processingTime: file.processingTime,
        error: file.error
      })),
      results: batch.results,
      errors: batch.errors,
      createdAt: batch.createdAt,
      message: this.getBatchStatusMessage(batch)
    };
  }

  /**
   * Get status message for batch
   */
  getBatchStatusMessage(batch) {
    switch (batch.status) {
      case 'created':
        return 'Batch created and ready to start';
      case 'processing':
        return `Processing ${batch.statistics.processedFiles}/${batch.statistics.totalFiles} files`;
      case 'paused':
        return 'Batch processing paused due to errors';
      case 'completed':
        return `Batch completed: ${batch.statistics.successfulFiles} successful, ${batch.statistics.failedFiles} failed`;
      case 'failed':
        return 'Batch processing failed';
      case 'cancelled':
        return 'Batch processing cancelled';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Pause batch processing
   */
  async pauseBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== 'processing') {
      throw new Error(`Batch ${batchId} is not currently processing`);
    }

    batch.status = 'paused';
    console.log(`Paused batch ${batchId}`);
    
    return this.formatBatchStatus(batch);
  }

  /**
   * Resume batch processing
   */
  async resumeBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== 'paused') {
      throw new Error(`Batch ${batchId} is not paused`);
    }

    batch.status = 'processing';
    console.log(`Resumed batch ${batchId}`);
    
    // Continue processing remaining files
    this.processFilesInBatch(batch).catch(error => {
      console.error(`Error resuming batch ${batchId}:`, error);
      batch.status = 'failed';
    });

    return this.formatBatchStatus(batch);
  }

  /**
   * Cancel batch processing
   */
  async cancelBatch(batchId) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = 'cancelled';
    batch.statistics.endTime = new Date();
    
    // Cleanup temp files
    const pendingFiles = batch.files.filter(file => file.status === 'pending' || file.status === 'processing');
    await Promise.allSettled(
      pendingFiles.map(file => 
        fs.unlink(file.filePath).catch(() => {})
      )
    );

    // Move to history
    this.batchHistory.set(batchId, batch);
    this.activeBatches.delete(batchId);

    console.log(`Cancelled batch ${batchId}`);
    return this.formatBatchStatus(batch);
  }

  /**
   * Update global statistics
   */
  updateGlobalStatistics(batch) {
    this.statistics.totalFiles += batch.statistics.totalFiles;
    this.statistics.successfulFiles += batch.statistics.successfulFiles;
    this.statistics.failedFiles += batch.statistics.failedFiles;
    
    // Update average processing time
    const totalProcessingTime = this.statistics.avgProcessingTime * (this.statistics.totalBatches - 1) + batch.statistics.processingTime;
    this.statistics.avgProcessingTime = totalProcessingTime / this.statistics.totalBatches;
  }

  /**
   * Get overall statistics
   */
  getOverallStatistics() {
    return {
      ...this.statistics,
      activeBatches: this.activeBatches.size,
      completedBatches: this.batchHistory.size,
      successRate: this.statistics.totalFiles > 0 
        ? Math.round((this.statistics.successfulFiles / this.statistics.totalFiles) * 100)
        : 0
    };
  }

  /**
   * Cleanup old batch records
   */
  cleanupOldBatches(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    for (const [id, batch] of this.batchHistory.entries()) {
      if (new Date(batch.createdAt) < cutoffDate) {
        this.batchHistory.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

module.exports = new BMSBatchProcessor();