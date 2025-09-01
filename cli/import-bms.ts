#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, stat } from 'fs/promises';
import { basename, extname, join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import ProgressBar from 'progress';

// Import parsers and normalizer
import { EnhancedBMSParser } from '../server/services/import/bms_parser';
import { EMSParser } from '../server/services/import/ems_parser';
import { createNormalizer } from '../server/services/import/normalizers';

interface ImportOptions {
  format?: 'auto' | 'bms' | 'ems';
  dryRun?: boolean;
  verbose?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
}

interface ImportResult {
  file: string;
  success: boolean;
  jobId?: string;
  jobNumber?: string;
  error?: string;
  warnings?: string[];
  unknownTags?: string[];
}

interface ImportSummary {
  totalFiles: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: ImportResult[];
  unknownTags: Set<string>;
  processingTime: number;
}

/**
 * CLI tool for importing BMS/EMS files into CollisionOS
 * Supports single file and batch processing with progress reporting
 */
class BMSImportCLI {
  private bmsParser = new EnhancedBMSParser();
  private emsParser = new EMSParser();
  private normalizer: any = null;

  async run(): Promise<void> {
    const program = new Command();

    program
      .name('import-bms')
      .description('Import BMS/EMS estimate files into CollisionOS')
      .version('1.0.0');

    program
      .command('file <filepath>')
      .description('Import a single BMS/EMS file')
      .option('-f, --format <format>', 'File format (auto|bms|ems)', 'auto')
      .option('-d, --dry-run', 'Validate file without importing to database')
      .option('-v, --verbose', 'Show detailed output')
      .action(async (filepath: string, options: ImportOptions) => {
        await this.importSingleFile(filepath, options);
      });

    program
      .command('batch <directory>')
      .description('Import all BMS/EMS files from a directory')
      .option('-f, --format <format>', 'File format (auto|bms|ems)', 'auto')
      .option('-d, --dry-run', 'Validate files without importing to database')
      .option('-v, --verbose', 'Show detailed output')
      .option(
        '-b, --batch-size <size>',
        'Number of files to process in parallel',
        '5'
      )
      .option(
        '-c, --continue-on-error',
        'Continue processing even if some files fail'
      )
      .action(async (directory: string, options: ImportOptions) => {
        await this.importBatch(directory, options);
      });

    program
      .command('validate <filepath>')
      .description('Validate a BMS/EMS file without importing')
      .option('-f, --format <format>', 'File format (auto|bms|ems)', 'auto')
      .option('-v, --verbose', 'Show detailed validation output')
      .action(async (filepath: string, options: ImportOptions) => {
        await this.validateFile(filepath, options);
      });

    await program.parseAsync(process.argv);
  }

  /**
   * Import a single BMS/EMS file
   */
  private async importSingleFile(
    filepath: string,
    options: ImportOptions
  ): Promise<void> {
    const startTime = Date.now();
    const spinner = ora('Processing file...').start();

    try {
      // Initialize normalizer
      if (!options.dryRun) {
        spinner.text = 'Connecting to database...';
        this.normalizer = await createNormalizer();
      }

      spinner.text = `Reading file: ${basename(filepath)}`;
      const fileContent = await readFile(filepath, 'utf-8');
      const fileStats = await stat(filepath);

      // Detect format
      const format = this.detectFormat(filepath, fileContent, options.format);
      spinner.text = `Parsing ${format.toUpperCase()} file...`;

      // Parse file
      const payload = await this.parseFile(fileContent, format);

      if (options.verbose) {
        spinner.stop();
        console.log(chalk.blue('📄 File Information:'));
        console.log(`  File: ${filepath}`);
        console.log(`  Size: ${this.formatBytes(fileStats.size)}`);
        console.log(`  Format: ${format.toUpperCase()}`);
        console.log(`  Source System: ${payload.meta.source_system}`);
        console.log(`  Lines: ${payload.lines.length}`);
        console.log(`  Parts: ${payload.parts.length}`);

        if (payload.meta.unknown_tags.length > 0) {
          console.log(
            chalk.yellow(`  Unknown Tags: ${payload.meta.unknown_tags.length}`)
          );
          if (options.verbose) {
            payload.meta.unknown_tags.forEach(tag => {
              console.log(`    - ${tag}`);
            });
          }
        }

        spinner.start();
      }

      let result: any = null;

      if (!options.dryRun) {
        spinner.text = 'Saving to database...';
        result = await this.normalizer.upsertJob(payload);
      }

      const processingTime = Date.now() - startTime;
      spinner.stop();

      // Display results
      console.log(chalk.green('✅ Import completed successfully!'));

      if (!options.dryRun && result) {
        console.log(`Job Number: ${result.jobNumber}`);
        console.log(
          `Customer: ${payload.customer.firstName} ${payload.customer.lastName}`
        );
        console.log(
          `Vehicle: ${payload.vehicle.year} ${payload.vehicle.make} ${payload.vehicle.model}`
        );
        console.log(`Total Amount: $${this.calculateTotal(payload.lines)}`);
      }

      console.log(`Processing Time: ${processingTime}ms`);

      if (payload.meta.unknown_tags.length > 0) {
        console.log(
          chalk.yellow(
            `⚠️  ${payload.meta.unknown_tags.length} unknown tags encountered`
          )
        );
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Import failed:'), error.message);

      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  /**
   * Import multiple files from a directory
   */
  private async importBatch(
    directory: string,
    options: ImportOptions
  ): Promise<void> {
    const startTime = Date.now();
    const spinner = ora('Scanning directory...').start();

    try {
      // Initialize normalizer
      if (!options.dryRun) {
        spinner.text = 'Connecting to database...';
        this.normalizer = await createNormalizer();
      }

      // Get all BMS/EMS files
      const files = await this.findImportFiles(directory);

      if (files.length === 0) {
        spinner.stop();
        console.log(chalk.yellow('⚠️  No BMS/EMS files found in directory'));
        return;
      }

      spinner.stop();
      console.log(chalk.blue(`📁 Found ${files.length} files to process`));

      // Process files in batches
      const batchSize = parseInt(options.batchSize?.toString() || '5');
      const summary: ImportSummary = {
        totalFiles: files.length,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        results: [],
        unknownTags: new Set(),
        processingTime: 0,
      };

      const progressBar = new ProgressBar(
        'Processing [:bar] :percent :current/:total (:etas remaining)',
        {
          total: files.length,
          width: 50,
          complete: '█',
          incomplete: '░',
        }
      );

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file =>
          this.processFile(file, options)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        for (const [index, result] of batchResults.entries()) {
          const filename = batch[index];
          progressBar.tick();

          if (result.status === 'fulfilled') {
            summary.results.push(result.value);
            summary.successCount++;

            // Collect unknown tags
            result.value.unknownTags?.forEach(tag =>
              summary.unknownTags.add(tag)
            );
          } else {
            summary.results.push({
              file: filename,
              success: false,
              error: result.reason?.message || 'Unknown error',
            });
            summary.errorCount++;

            if (!options.continueOnError) {
              console.log(
                chalk.red(
                  `❌ Stopping batch processing due to error in ${filename}`
                )
              );
              break;
            }
          }
        }

        if (!options.continueOnError && summary.errorCount > 0) {
          break;
        }
      }

      summary.processingTime = Date.now() - startTime;
      this.printBatchSummary(summary, options);
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Batch import failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Validate a file without importing
   */
  private async validateFile(
    filepath: string,
    options: ImportOptions
  ): Promise<void> {
    try {
      const fileContent = await readFile(filepath, 'utf-8');
      const format = this.detectFormat(filepath, fileContent, options.format);

      console.log(chalk.blue('🔍 Validating file...'));
      console.log(`  Format: ${format.toUpperCase()}`);

      const payload = await this.parseFile(fileContent, format);

      console.log(chalk.green('✅ File validation successful!'));
      console.log(`  Source System: ${payload.meta.source_system}`);
      console.log(
        `  Customer: ${payload.customer.firstName} ${payload.customer.lastName}`
      );
      console.log(
        `  Vehicle: ${payload.vehicle.year} ${payload.vehicle.make} ${payload.vehicle.model}`
      );
      console.log(`  Lines: ${payload.lines.length}`);
      console.log(`  Parts: ${payload.parts.length}`);
      console.log(`  Total Amount: $${this.calculateTotal(payload.lines)}`);

      if (payload.meta.unknown_tags.length > 0) {
        console.log(
          chalk.yellow(`  Unknown Tags: ${payload.meta.unknown_tags.length}`)
        );

        if (options.verbose) {
          payload.meta.unknown_tags.forEach(tag => {
            console.log(`    - ${tag}`);
          });
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);

      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  /**
   * Process a single file and return result
   */
  private async processFile(
    filepath: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      const fileContent = await readFile(filepath, 'utf-8');
      const format = this.detectFormat(filepath, fileContent, options.format);

      const payload = await this.parseFile(fileContent, format);

      let job = null;
      if (!options.dryRun && this.normalizer) {
        job = await this.normalizer.upsertJob(payload);
      }

      return {
        file: basename(filepath),
        success: true,
        jobId: job?.id,
        jobNumber: job?.jobNumber,
        warnings:
          payload.meta.unknown_tags.length > 0
            ? [`${payload.meta.unknown_tags.length} unknown tags`]
            : [],
        unknownTags: payload.meta.unknown_tags,
      };
    } catch (error) {
      return {
        file: basename(filepath),
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse file content based on format
   */
  private async parseFile(content: string, format: string): Promise<any> {
    switch (format) {
      case 'bms':
        return await this.bmsParser.parseBMS(content);
      case 'ems':
        return await this.emsParser.parseEMS(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Detect file format based on content and filename
   */
  private detectFormat(
    filepath: string,
    content: string,
    userFormat?: string
  ): string {
    if (userFormat && userFormat !== 'auto') {
      return userFormat;
    }

    const extension = extname(filepath).toLowerCase();

    // Check file extension first
    if (['.xml', '.bms'].includes(extension)) {
      return 'bms';
    }

    if (['.ems', '.txt', '.csv'].includes(extension)) {
      return 'ems';
    }

    // Check content patterns
    const firstLine = content.split('\n')[0]?.trim();

    // XML content indicates BMS
    if (
      content.trim().startsWith('<?xml') ||
      content.includes('<VehicleDamageEstimateAddRq')
    ) {
      return 'bms';
    }

    // Pipe-delimited content indicates EMS
    if (firstLine?.includes('|') && firstLine?.includes('HDR|')) {
      return 'ems';
    }

    // Default to BMS if uncertain
    return 'bms';
  }

  /**
   * Find all importable files in directory
   */
  private async findImportFiles(directory: string): Promise<string[]> {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(directory);

      const importFiles: string[] = [];
      const validExtensions = ['.xml', '.bms', '.ems', '.txt'];

      for (const file of files) {
        const filepath = join(directory, file);
        const ext = extname(file).toLowerCase();

        if (validExtensions.includes(ext)) {
          const stats = await stat(filepath);
          if (stats.isFile()) {
            importFiles.push(filepath);
          }
        }
      }

      return importFiles.sort();
    } catch (error) {
      throw new Error(`Failed to scan directory: ${error.message}`);
    }
  }

  /**
   * Calculate total amount from estimate lines
   */
  private calculateTotal(lines: any[]): string {
    let total = 0;
    for (const line of lines) {
      total += line.amount?.toNumber() || 0;
    }
    return total.toFixed(2);
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
   * Print batch processing summary
   */
  private printBatchSummary(
    summary: ImportSummary,
    options: ImportOptions
  ): void {
    console.log(chalk.blue('\n📊 Batch Import Summary:'));
    console.log(`  Total Files: ${summary.totalFiles}`);
    console.log(chalk.green(`  Successful: ${summary.successCount}`));

    if (summary.errorCount > 0) {
      console.log(chalk.red(`  Failed: ${summary.errorCount}`));
    }

    if (summary.skippedCount > 0) {
      console.log(chalk.yellow(`  Skipped: ${summary.skippedCount}`));
    }

    console.log(
      `  Processing Time: ${(summary.processingTime / 1000).toFixed(2)}s`
    );
    console.log(
      `  Average per file: ${(summary.processingTime / summary.totalFiles).toFixed(0)}ms`
    );

    if (summary.unknownTags.size > 0) {
      console.log(
        chalk.yellow(`  Unknown Tags Found: ${summary.unknownTags.size}`)
      );
    }

    // Show failed files
    const failedFiles = summary.results.filter(r => !r.success);
    if (failedFiles.length > 0) {
      console.log(chalk.red('\n❌ Failed Files:'));
      failedFiles.forEach(result => {
        console.log(`  ${result.file}: ${result.error}`);
      });
    }

    // Show files with warnings
    const warningFiles = summary.results.filter(
      r => r.success && r.warnings && r.warnings.length > 0
    );
    if (warningFiles.length > 0) {
      console.log(chalk.yellow('\n⚠️  Files with Warnings:'));
      warningFiles.forEach(result => {
        console.log(`  ${result.file}: ${result.warnings?.join(', ')}`);
      });
    }
  }
}

// Install required packages if running directly
if (require.main === module) {
  const cli = new BMSImportCLI();
  cli.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

export default BMSImportCLI;
