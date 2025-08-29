#!/usr/bin/env node

import { Command } from 'commander';
import { watch, readFile, mkdir, rename, stat } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import chokidar from 'chokidar';

// Import parsers and normalizer
import { EnhancedBMSParser } from '../server/services/import/bms_parser';
import { EMSParser } from '../server/services/import/ems_parser';
import { createNormalizer } from '../server/services/import/normalizers';

interface WatcherOptions {
  watchDir: string;
  processedDir?: string;
  errorDir?: string;
  format?: 'auto' | 'bms' | 'ems';
  recursive?: boolean;
  debounceMs?: number;
  retryAttempts?: number;
  retryDelay?: number;
  maxFileSize?: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

interface ProcessResult {
  success: boolean;
  jobId?: string;
  jobNumber?: string;
  error?: string;
  processingTime: number;
  unknownTags?: string[];
}

/**
 * File system watcher for automatic BMS/EMS file import
 * Monitors directories for new files and processes them automatically
 */
class ImportWatcher {
  private bmsParser = new EnhancedBMSParser();
  private emsParser = new EMSParser();
  private normalizer: any = null;
  private watcher: chokidar.FSWatcher | null = null;
  private processingQueue = new Map<string, NodeJS.Timeout>();
  private activeProcessing = new Set<string>();
  private stats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    startTime: Date.now()
  };

  async run(): Promise<void> {
    const program = new Command();

    program
      .name('import-watcher')
      .description('Watch directory for BMS/EMS files and import automatically')
      .version('1.0.0');

    program
      .option('-w, --watch-dir <dir>', 'Directory to watch for import files', './imports')
      .option('-p, --processed-dir <dir>', 'Directory to move processed files')
      .option('-e, --error-dir <dir>', 'Directory to move failed files')
      .option('-f, --format <format>', 'File format (auto|bms|ems)', 'auto')
      .option('-r, --recursive', 'Watch subdirectories recursively', false)
      .option('-d, --debounce <ms>', 'Debounce time for file changes (ms)', '2000')
      .option('--retry-attempts <count>', 'Number of retry attempts for failed imports', '3')
      .option('--retry-delay <ms>', 'Delay between retry attempts (ms)', '5000')
      .option('--max-file-size <bytes>', 'Maximum file size to process (bytes)', '10485760')
      .option('--log-level <level>', 'Logging level (error|warn|info|debug)', 'info')
      .action(async (options: WatcherOptions) => {
        await this.startWatching(options);
      });

    await program.parseAsync(process.argv);
  }

  /**
   * Start watching the specified directory
   */
  private async startWatching(options: WatcherOptions): Promise<void> {
    try {
      // Initialize normalizer
      this.log('info', 'Initializing database connection...');
      this.normalizer = await createNormalizer();

      // Ensure directories exist
      await this.ensureDirectories(options);

      // Start file watcher
      await this.initializeWatcher(options);

      // Handle graceful shutdown
      this.setupGracefulShutdown();

      this.log('info', `🔍 Watching ${options.watchDir} for BMS/EMS files...`);
      this.log('info', `📊 Configuration:`);
      this.log('info', `  Watch Directory: ${options.watchDir}`);
      this.log('info', `  Processed Directory: ${options.processedDir || 'none'}`);
      this.log('info', `  Error Directory: ${options.errorDir || 'none'}`);
      this.log('info', `  Format: ${options.format}`);
      this.log('info', `  Recursive: ${options.recursive}`);
      this.log('info', `  Debounce: ${options.debounceMs}ms`);
      this.log('info', `  Max File Size: ${this.formatBytes(options.maxFileSize || 10485760)}`);

    } catch (error) {
      this.log('error', `Failed to start watcher: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Initialize file system watcher
   */
  private async initializeWatcher(options: WatcherOptions): Promise<void> {
    const watchPattern = options.recursive 
      ? join(options.watchDir, '**', '*.{xml,bms,ems,txt}')
      : join(options.watchDir, '*.{xml,bms,ems,txt}');

    this.watcher = chokidar.watch(watchPattern, {
      ignored: /[\/\\]\./,
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: parseInt(options.debounceMs?.toString() || '2000'),
        pollInterval: 100
      },
      depth: options.recursive ? undefined : 1
    });

    // Handle file events
    this.watcher
      .on('add', (filePath) => this.handleFileAdded(filePath, options))
      .on('change', (filePath) => this.handleFileChanged(filePath, options))
      .on('error', (error) => this.log('error', `Watcher error: ${error.message}`))
      .on('ready', () => this.log('info', '✅ File watcher is ready'));
  }

  /**
   * Handle new file added to watch directory
   */
  private async handleFileAdded(filePath: string, options: WatcherOptions): Promise<void> {
    this.log('debug', `File added: ${basename(filePath)}`);
    await this.queueFileForProcessing(filePath, options);
  }

  /**
   * Handle file changed in watch directory
   */
  private async handleFileChanged(filePath: string, options: WatcherOptions): Promise<void> {
    this.log('debug', `File changed: ${basename(filePath)}`);
    await this.queueFileForProcessing(filePath, options);
  }

  /**
   * Queue file for processing with debouncing
   */
  private async queueFileForProcessing(filePath: string, options: WatcherOptions): Promise<void> {
    // Cancel existing timer for this file
    const existingTimer = this.processingQueue.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Skip if already being processed
    if (this.activeProcessing.has(filePath)) {
      this.log('debug', `File already being processed: ${basename(filePath)}`);
      return;
    }

    // Validate file
    if (!this.isValidImportFile(filePath, options)) {
      return;
    }

    // Set new timer
    const timer = setTimeout(async () => {
      this.processingQueue.delete(filePath);
      await this.processFile(filePath, options);
    }, parseInt(options.debounceMs?.toString() || '2000'));

    this.processingQueue.set(filePath, timer);
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string, options: WatcherOptions, attempt: number = 1): Promise<void> {
    const filename = basename(filePath);
    
    // Skip if file doesn't exist anymore
    if (!existsSync(filePath)) {
      this.log('debug', `File no longer exists: ${filename}`);
      return;
    }

    // Mark as being processed
    this.activeProcessing.add(filePath);

    try {
      this.log('info', `📄 Processing: ${filename} (attempt ${attempt})`);

      const result = await this.importFile(filePath, options);

      if (result.success) {
        this.stats.successCount++;
        this.log('info', `✅ Successfully imported: ${filename}`);
        this.log('info', `   Job Number: ${result.jobNumber}`);
        this.log('info', `   Processing Time: ${result.processingTime}ms`);

        if (result.unknownTags && result.unknownTags.length > 0) {
          this.log('warn', `   Unknown Tags: ${result.unknownTags.length}`);
        }

        // Move to processed directory
        if (options.processedDir) {
          await this.moveFile(filePath, options.processedDir);
        }

      } else {
        throw new Error(result.error || 'Unknown import error');
      }

    } catch (error) {
      this.log('error', `❌ Failed to process ${filename}: ${error.message}`);

      // Retry logic
      const maxRetries = parseInt(options.retryAttempts?.toString() || '3');
      if (attempt < maxRetries) {
        const retryDelay = parseInt(options.retryDelay?.toString() || '5000');
        this.log('info', `⏳ Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        
        setTimeout(() => {
          this.processFile(filePath, options, attempt + 1);
        }, retryDelay);
        
        return; // Don't mark as complete yet
      }

      this.stats.errorCount++;

      // Move to error directory
      if (options.errorDir) {
        await this.moveFile(filePath, options.errorDir, `${Date.now()}-${filename}`);
      }
    } finally {
      this.activeProcessing.delete(filePath);
      this.stats.totalProcessed++;
      this.logStats();
    }
  }

  /**
   * Import a file and return result
   */
  private async importFile(filePath: string, options: WatcherOptions): Promise<ProcessResult> {
    const startTime = Date.now();

    try {
      // Read file
      const fileContent = await readFile(filePath, 'utf-8');
      
      // Detect format
      const format = this.detectFormat(filePath, fileContent, options.format);
      
      // Parse file
      let payload;
      switch (format) {
        case 'bms':
          payload = await this.bmsParser.parseBMS(fileContent);
          break;
        case 'ems':
          payload = await this.emsParser.parseEMS(fileContent);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Import to database
      const job = await this.normalizer.upsertJob(payload);

      return {
        success: true,
        jobId: job.id,
        jobNumber: job.jobNumber,
        processingTime: Date.now() - startTime,
        unknownTags: payload.meta.unknown_tags
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate if file should be processed
   */
  private isValidImportFile(filePath: string, options: WatcherOptions): boolean {
    try {
      const filename = basename(filePath);
      const extension = extname(filePath).toLowerCase();
      
      // Check file extension
      const validExtensions = ['.xml', '.bms', '.ems', '.txt'];
      if (!validExtensions.includes(extension)) {
        this.log('debug', `Skipping file with invalid extension: ${filename}`);
        return false;
      }

      // Check file size
      const stats = require('fs').statSync(filePath);
      const maxSize = options.maxFileSize || 10485760; // 10MB default
      
      if (stats.size > maxSize) {
        this.log('warn', `Skipping large file (${this.formatBytes(stats.size)}): ${filename}`);
        return false;
      }

      if (stats.size === 0) {
        this.log('debug', `Skipping empty file: ${filename}`);
        return false;
      }

      return true;

    } catch (error) {
      this.log('warn', `Error validating file ${basename(filePath)}: ${error.message}`);
      return false;
    }
  }

  /**
   * Detect file format
   */
  private detectFormat(filePath: string, content: string, userFormat?: string): string {
    if (userFormat && userFormat !== 'auto') {
      return userFormat;
    }

    const extension = extname(filePath).toLowerCase();
    
    // Check file extension first
    if (['.xml', '.bms'].includes(extension)) {
      return 'bms';
    }
    
    if (['.ems', '.txt'].includes(extension)) {
      return 'ems';
    }

    // Check content patterns
    const firstLine = content.split('\n')[0]?.trim();
    
    // XML content indicates BMS
    if (content.trim().startsWith('<?xml') || content.includes('<VehicleDamageEstimateAddRq')) {
      return 'bms';
    }
    
    // Pipe-delimited content indicates EMS
    if (firstLine?.includes('|') && firstLine?.includes('HDR|')) {
      return 'ems';
    }

    // Default to BMS
    return 'bms';
  }

  /**
   * Move file to destination directory
   */
  private async moveFile(sourcePath: string, destDir: string, newName?: string): Promise<void> {
    try {
      const filename = newName || basename(sourcePath);
      const destPath = join(destDir, filename);
      
      await rename(sourcePath, destPath);
      this.log('debug', `Moved ${basename(sourcePath)} to ${destDir}`);
      
    } catch (error) {
      this.log('warn', `Failed to move file ${basename(sourcePath)}: ${error.message}`);
    }
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(options: WatcherOptions): Promise<void> {
    const directories = [
      options.watchDir,
      options.processedDir,
      options.errorDir
    ].filter(Boolean);

    for (const dir of directories) {
      if (!existsSync(dir!)) {
        await mkdir(dir!, { recursive: true });
        this.log('info', `Created directory: ${dir}`);
      }
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.log('info', `\n📊 Shutdown signal received (${signal})`);
        await this.shutdown();
      });
    });
  }

  /**
   * Gracefully shutdown the watcher
   */
  private async shutdown(): Promise<void> {
    this.log('info', '🛑 Shutting down file watcher...');

    // Stop file watcher
    if (this.watcher) {
      await this.watcher.close();
      this.log('info', '✅ File watcher closed');
    }

    // Wait for active processing to complete
    if (this.activeProcessing.size > 0) {
      this.log('info', `⏳ Waiting for ${this.activeProcessing.size} active imports to complete...`);
      
      while (this.activeProcessing.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Clear pending queued items
    this.processingQueue.forEach(timer => clearTimeout(timer));
    this.processingQueue.clear();

    this.logFinalStats();
    this.log('info', '👋 File watcher stopped gracefully');
    
    process.exit(0);
  }

  /**
   * Log current processing statistics
   */
  private logStats(): void {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const rate = this.stats.totalProcessed > 0 ? (this.stats.totalProcessed / (uptime / 60)).toFixed(1) : '0.0';
    
    this.log('info', `📈 Stats: ${this.stats.successCount}/${this.stats.totalProcessed} successful | ${rate}/min | ${uptime}s uptime`);
  }

  /**
   * Log final statistics on shutdown
   */
  private logFinalStats(): void {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    console.log(chalk.blue('\n📊 Final Statistics:'));
    console.log(`  Total Processed: ${this.stats.totalProcessed}`);
    console.log(chalk.green(`  Successful: ${this.stats.successCount}`));
    console.log(chalk.red(`  Failed: ${this.stats.errorCount}`));
    console.log(`  Uptime: ${hours}h ${minutes}m ${seconds}s`);
    
    if (this.stats.totalProcessed > 0) {
      const rate = (this.stats.totalProcessed / (uptime / 60)).toFixed(1);
      console.log(`  Average Rate: ${rate} files/minute`);
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Logging with levels
   */
  private log(level: string, message: string): void {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevel = process.env.LOG_LEVEL || 'info';
    
    if (levels.indexOf(level) <= levels.indexOf(currentLevel)) {
      const timestamp = new Date().toISOString();
      const colors: { [key: string]: any } = {
        error: chalk.red,
        warn: chalk.yellow,
        info: chalk.blue,
        debug: chalk.gray
      };
      
      const colorFn = colors[level] || chalk.white;
      console.log(`${timestamp} ${colorFn(level.toUpperCase().padEnd(5))} ${message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const watcher = new ImportWatcher();
  watcher.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

export default ImportWatcher;