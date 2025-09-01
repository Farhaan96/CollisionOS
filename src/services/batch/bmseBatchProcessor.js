/**
 * Enhanced BMS Batch Processing Service
 * Handles large file imports with progress tracking, pause/resume functionality
 */
import EventEmitter from 'events';

class BMSBatchProcessor extends EventEmitter {
  constructor(bmsService, validator) {
    super();
    this.bmsService = bmsService;
    this.validator = validator;
    this.batchQueue = new Map();
    this.processingBatches = new Map();
    this.completedBatches = new Map();
    this.batchSettings = {
      maxConcurrentBatches: 3,
      maxFilesPerBatch: 50,
      pauseOnError: false,
      retryAttempts: 3,
      retryDelay: 5000,
      progressUpdateInterval: 1000,
      autoCleanupAfter: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  /**
   * Create a new batch import job
   * @param {Array} files - Array of file objects
   * @param {Object} options - Batch processing options
   * @returns {string} Batch ID
   */
  createBatch(files, options = {}) {
    const batchId = this.generateBatchId();

    const batch = {
      id: batchId,
      files: files.map((file, index) => ({
        id: `${batchId}-file-${index}`,
        originalFile: file,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending',
        progress: 0,
        attempts: 0,
        error: null,
        result: null,
        validation: null,
        startTime: null,
        endTime: null,
        processingTime: 0,
      })),
      status: 'created',
      progress: 0,
      currentFileIndex: 0,
      settings: { ...this.batchSettings, ...options },
      statistics: {
        totalFiles: files.length,
        processedFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        processedSize: 0,
      },
      timestamps: {
        created: new Date(),
        started: null,
        paused: null,
        resumed: null,
        completed: null,
      },
      errors: [],
      warnings: [],
      canPause: true,
      canResume: false,
      canCancel: true,
    };

    this.batchQueue.set(batchId, batch);
    this.emit('batchCreated', batch);

    return batchId;
  }

  /**
   * Start processing a batch
   * @param {string} batchId - Batch identifier
   * @returns {Promise} Processing promise
   */
  async startBatch(batchId) {
    const batch =
      this.batchQueue.get(batchId) || this.processingBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status === 'processing') {
      throw new Error(`Batch ${batchId} is already processing`);
    }

    if (batch.status === 'completed') {
      throw new Error(`Batch ${batchId} is already completed`);
    }

    // Move to processing queue
    if (this.batchQueue.has(batchId)) {
      this.batchQueue.delete(batchId);
      this.processingBatches.set(batchId, batch);
    }

    batch.status = 'processing';
    batch.timestamps.started = new Date();
    batch.canPause = true;
    batch.canResume = false;

    this.emit('batchStarted', batch);

    try {
      await this.processBatchFiles(batch);
      await this.completeBatch(batch);
    } catch (error) {
      await this.handleBatchError(batch, error);
    }

    return batch;
  }

  /**
   * Pause a batch
   * @param {string} batchId - Batch identifier
   */
  async pauseBatch(batchId) {
    const batch = this.processingBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found or not processing`);
    }

    if (batch.status !== 'processing') {
      throw new Error(
        `Cannot pause batch ${batchId} - not in processing state`
      );
    }

    batch.status = 'paused';
    batch.timestamps.paused = new Date();
    batch.canPause = false;
    batch.canResume = true;

    this.emit('batchPaused', batch);
  }

  /**
   * Resume a paused batch
   * @param {string} batchId - Batch identifier
   */
  async resumeBatch(batchId) {
    const batch = this.processingBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== 'paused') {
      throw new Error(`Cannot resume batch ${batchId} - not in paused state`);
    }

    batch.status = 'processing';
    batch.timestamps.resumed = new Date();
    batch.canPause = true;
    batch.canResume = false;

    this.emit('batchResumed', batch);

    try {
      await this.processBatchFiles(batch);
      await this.completeBatch(batch);
    } catch (error) {
      await this.handleBatchError(batch, error);
    }
  }

  /**
   * Cancel a batch
   * @param {string} batchId - Batch identifier
   */
  async cancelBatch(batchId) {
    const batch =
      this.processingBatches.get(batchId) || this.batchQueue.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status === 'completed') {
      throw new Error(`Cannot cancel completed batch ${batchId}`);
    }

    batch.status = 'cancelled';
    batch.timestamps.completed = new Date();
    batch.canPause = false;
    batch.canResume = false;
    batch.canCancel = false;

    // Mark remaining files as skipped
    batch.files.forEach(file => {
      if (file.status === 'pending' || file.status === 'processing') {
        file.status = 'skipped';
        batch.statistics.skippedFiles++;
      }
    });

    // Move to completed batches
    if (this.batchQueue.has(batchId)) {
      this.batchQueue.delete(batchId);
    }
    if (this.processingBatches.has(batchId)) {
      this.processingBatches.delete(batchId);
    }
    this.completedBatches.set(batchId, batch);

    this.emit('batchCancelled', batch);
  }

  /**
   * Process files in a batch
   * @param {Object} batch - Batch object
   */
  async processBatchFiles(batch) {
    const progressInterval = setInterval(() => {
      if (batch.status === 'processing') {
        this.updateBatchProgress(batch);
        this.emit('batchProgress', batch);
      }
    }, batch.settings.progressUpdateInterval);

    try {
      for (let i = batch.currentFileIndex; i < batch.files.length; i++) {
        // Check if batch is paused or cancelled
        if (batch.status === 'paused' || batch.status === 'cancelled') {
          batch.currentFileIndex = i;
          break;
        }

        const file = batch.files[i];
        await this.processFile(batch, file);

        batch.currentFileIndex = i + 1;
        batch.statistics.processedFiles++;

        // Update progress
        this.updateBatchProgress(batch);
        this.emit('fileProcessed', { batch, file });
      }
    } finally {
      clearInterval(progressInterval);
    }
  }

  /**
   * Process a single file
   * @param {Object} batch - Batch object
   * @param {Object} file - File object
   */
  async processFile(batch, file) {
    file.status = 'processing';
    file.startTime = new Date();
    file.attempts++;

    this.emit('fileStarted', { batch, file });

    try {
      // Read file content
      const content = await this.readFileContent(file.originalFile);

      // Validate file if validator is available
      if (this.validator) {
        file.validation = await this.validator.validateBMSFile(content);

        if (!file.validation.isValid && batch.settings.pauseOnError) {
          file.status = 'failed';
          file.error = {
            type: 'ValidationError',
            message: 'File validation failed',
            details: file.validation.errors,
          };
          batch.statistics.failedFiles++;
          this.emit('fileError', { batch, file });
          return;
        }
      }

      // Parse and save file
      const result = await this.bmsService.uploadBMSFile(file.originalFile);

      if (result.success) {
        file.status = 'completed';
        file.result = result.data;
        batch.statistics.successfulFiles++;
        this.emit('fileCompleted', { batch, file });
      } else {
        throw new Error(result.error || 'Unknown processing error');
      }
    } catch (error) {
      await this.handleFileError(batch, file, error);
    } finally {
      file.endTime = new Date();
      file.processingTime = file.endTime - file.startTime;
      batch.statistics.processedSize += file.fileSize;
    }
  }

  /**
   * Handle file processing error
   * @param {Object} batch - Batch object
   * @param {Object} file - File object
   * @param {Error} error - Error object
   */
  async handleFileError(batch, file, error) {
    file.error = {
      type: error.constructor.name,
      message: error.message,
      timestamp: new Date(),
    };

    batch.errors.push({
      fileId: file.id,
      fileName: file.fileName,
      error: file.error,
    });

    // Retry logic
    if (file.attempts < batch.settings.retryAttempts) {
      await this.delay(batch.settings.retryDelay);
      await this.processFile(batch, file);
    } else {
      file.status = 'failed';
      batch.statistics.failedFiles++;

      this.emit('fileError', { batch, file });

      // Pause batch on error if configured
      if (batch.settings.pauseOnError) {
        await this.pauseBatch(batch.id);
      }
    }
  }

  /**
   * Complete a batch
   * @param {Object} batch - Batch object
   */
  async completeBatch(batch) {
    if (batch.status === 'paused' || batch.status === 'cancelled') {
      return; // Don't complete if paused or cancelled
    }

    batch.status = 'completed';
    batch.timestamps.completed = new Date();
    batch.canPause = false;
    batch.canResume = false;
    batch.canCancel = false;

    // Calculate final statistics
    batch.statistics.totalProcessingTime =
      batch.timestamps.completed - batch.timestamps.started;
    batch.statistics.averageFileTime =
      batch.statistics.totalProcessingTime / batch.statistics.processedFiles;
    batch.statistics.successRate =
      (batch.statistics.successfulFiles / batch.statistics.totalFiles) * 100;

    // Move to completed batches
    this.processingBatches.delete(batch.id);
    this.completedBatches.set(batch.id, batch);

    this.emit('batchCompleted', batch);

    // Schedule cleanup
    setTimeout(() => {
      this.cleanupBatch(batch.id);
    }, batch.settings.autoCleanupAfter);
  }

  /**
   * Handle batch error
   * @param {Object} batch - Batch object
   * @param {Error} error - Error object
   */
  async handleBatchError(batch, error) {
    batch.status = 'error';
    batch.error = {
      type: error.constructor.name,
      message: error.message,
      timestamp: new Date(),
    };
    batch.timestamps.completed = new Date();

    // Move to completed batches
    this.processingBatches.delete(batch.id);
    this.completedBatches.set(batch.id, batch);

    this.emit('batchError', batch);
  }

  /**
   * Update batch progress
   * @param {Object} batch - Batch object
   */
  updateBatchProgress(batch) {
    const totalFiles = batch.statistics.totalFiles;
    const processedFiles = batch.statistics.processedFiles;

    batch.progress = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

    // Update individual file progress based on processing status
    batch.files.forEach(file => {
      switch (file.status) {
        case 'completed':
          file.progress = 100;
          break;
        case 'failed':
          file.progress = 100;
          break;
        case 'processing':
          file.progress = 50; // Approximate mid-progress
          break;
        case 'pending':
          file.progress = 0;
          break;
        default:
          file.progress = 0;
      }
    });
  }

  /**
   * Get batch status
   * @param {string} batchId - Batch identifier
   * @returns {Object} Batch status
   */
  getBatchStatus(batchId) {
    const batch =
      this.batchQueue.get(batchId) ||
      this.processingBatches.get(batchId) ||
      this.completedBatches.get(batchId);

    if (!batch) {
      return null;
    }

    return {
      id: batch.id,
      status: batch.status,
      progress: batch.progress,
      statistics: batch.statistics,
      timestamps: batch.timestamps,
      canPause: batch.canPause,
      canResume: batch.canResume,
      canCancel: batch.canCancel,
      files: batch.files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        status: file.status,
        progress: file.progress,
        error: file.error,
      })),
    };
  }

  /**
   * Get detailed batch information
   * @param {string} batchId - Batch identifier
   * @returns {Object} Detailed batch information
   */
  getBatchDetails(batchId) {
    return (
      this.batchQueue.get(batchId) ||
      this.processingBatches.get(batchId) ||
      this.completedBatches.get(batchId)
    );
  }

  /**
   * List all batches
   * @param {string} status - Filter by status (optional)
   * @returns {Array} Array of batch summaries
   */
  listBatches(status = null) {
    const allBatches = [
      ...Array.from(this.batchQueue.values()),
      ...Array.from(this.processingBatches.values()),
      ...Array.from(this.completedBatches.values()),
    ];

    return allBatches
      .filter(batch => !status || batch.status === status)
      .map(batch => ({
        id: batch.id,
        status: batch.status,
        progress: batch.progress,
        statistics: batch.statistics,
        timestamps: batch.timestamps,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamps.created) - new Date(a.timestamps.created)
      );
  }

  /**
   * Cleanup old batch data
   * @param {string} batchId - Batch identifier
   */
  cleanupBatch(batchId) {
    this.completedBatches.delete(batchId);
    this.emit('batchCleaned', { batchId });
  }

  /**
   * Read file content
   * @param {File} file - File object
   * @returns {Promise<string>} File content
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Generate unique batch ID
   * @returns {string} Batch ID
   */
  generateBatchId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get processing statistics
   * @returns {Object} Overall processing statistics
   */
  getOverallStatistics() {
    const allBatches = [
      ...Array.from(this.batchQueue.values()),
      ...Array.from(this.processingBatches.values()),
      ...Array.from(this.completedBatches.values()),
    ];

    return {
      totalBatches: allBatches.length,
      activeBatches: this.processingBatches.size,
      queuedBatches: this.batchQueue.size,
      completedBatches: this.completedBatches.size,
      totalFiles: allBatches.reduce(
        (sum, batch) => sum + batch.statistics.totalFiles,
        0
      ),
      successfulFiles: allBatches.reduce(
        (sum, batch) => sum + batch.statistics.successfulFiles,
        0
      ),
      failedFiles: allBatches.reduce(
        (sum, batch) => sum + batch.statistics.failedFiles,
        0
      ),
      overallSuccessRate:
        allBatches.length > 0
          ? (allBatches.reduce(
              (sum, batch) => sum + batch.statistics.successfulFiles,
              0
            ) /
              allBatches.reduce(
                (sum, batch) => sum + batch.statistics.totalFiles,
                0
              )) *
            100
          : 0,
    };
  }
}

export default BMSBatchProcessor;
