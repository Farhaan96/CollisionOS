const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const { Attachment } = require('../database/models');

class PhotoUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'image/tiff'
    ];
    this.allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'tiff'];
    this.thumbnailSize = { width: 300, height: 300 };
    this.maxImageDimensions = { width: 2000, height: 2000 };
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedExtensions.includes(ext)) {
      errors.push(`File extension .${ext} is not allowed. Allowed extensions: ${this.allowedExtensions.map(e => '.' + e).join(', ')}`);
    }

    // Validate magic bytes for common image formats
    if (file.buffer) {
      const magicBytes = this.getMagicBytes(file.buffer);
      if (!this.validateMagicBytes(magicBytes, file.mimetype)) {
        errors.push('File content does not match declared file type (security check failed)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate storage path for uploaded file
   */
  generateStoragePath(jobId, category) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return path.join('uploads', year.toString(), month, jobId || 'general');
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueId = crypto.randomUUID();
    return `${uniqueId}${ext}`;
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Extract EXIF data from image
   */
  async extractExifData(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
        exif: metadata.exif ? this.parseExifData(metadata.exif) : null,
        orientation: metadata.orientation || 1
      };
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return null;
    }
  }

  /**
   * Parse EXIF buffer data
   */
  parseExifData(exifBuffer) {
    // Basic EXIF parsing - in production, use a library like 'exif-parser' for comprehensive parsing
    try {
      return {
        raw: exifBuffer.toString('base64')
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Process and optimize image
   */
  async processImage(inputPath, outputPath, options = {}) {
    try {
      const { 
        maxWidth = this.maxImageDimensions.width,
        maxHeight = this.maxImageDimensions.height,
        quality = 85,
        format = 'jpeg'
      } = options;

      let pipeline = sharp(inputPath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });

      // Apply format-specific optimization
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: 6, progressive: true });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality, effort: 4 });
          break;
        default:
          pipeline = pipeline.jpeg({ quality });
      }

      await pipeline.toFile(outputPath);
      
      // Get final image metadata
      const finalMetadata = await sharp(outputPath).metadata();
      
      return {
        success: true,
        width: finalMetadata.width,
        height: finalMetadata.height,
        size: (await fs.stat(outputPath)).size
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      return true;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return false;
    }
  }

  /**
   * Upload single photo
   */
  async uploadPhoto(file, metadata = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate paths and filenames
      const storagePath = this.generateStoragePath(metadata.jobId, metadata.category);
      const filename = this.generateFilename(file.originalname);
      const fullStoragePath = path.join(process.cwd(), storagePath);
      const filePath = path.join(fullStoragePath, filename);
      
      // Generate thumbnail path
      const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
      const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);

      // Ensure directories exist
      await this.ensureDirectoryExists(fullStoragePath);
      await this.ensureDirectoryExists(thumbnailDir);

      // Save original file temporarily
      const tempPath = path.join(fullStoragePath, `temp_${filename}`);
      await fs.writeFile(tempPath, file.buffer);

      // Process and optimize image
      const processResult = await this.processImage(tempPath, filePath);
      
      // Generate thumbnail
      const thumbnailGenerated = await this.generateThumbnail(filePath, thumbnailPath);
      
      // Extract EXIF data
      const exifData = await this.extractExifData(filePath);
      
      // Clean up temp file
      await fs.unlink(tempPath);

      // Prepare attachment record
      const attachmentData = {
        fileName: filename,
        originalFileName: file.originalname,
        filePath: path.relative(process.cwd(), filePath),
        thumbnailPath: thumbnailGenerated ? path.relative(process.cwd(), thumbnailPath) : null,
        fileType: 'image',
        mimeType: file.mimetype,
        fileExtension: path.extname(file.originalname).toLowerCase().substring(1),
        fileSize: processResult.size,
        imageWidth: processResult.width,
        imageHeight: processResult.height,
        exifData: exifData,
        status: 'ready',
        processed: true,
        storageProvider: 'local',
        uploadDate: new Date(),
        ...metadata // jobId, estimateId, category, description, etc.
      };

      // Create database record
      const attachment = await Attachment.create(attachmentData);

      return {
        success: true,
        attachment: attachment,
        file: {
          id: attachment.id,
          filename: filename,
          originalName: file.originalname,
          size: processResult.size,
          dimensions: {
            width: processResult.width,
            height: processResult.height
          },
          path: attachmentData.filePath,
          thumbnailPath: attachmentData.thumbnailPath,
          category: metadata.category || 'other'
        }
      };

    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple photos
   */
  async uploadMultiplePhotos(files, metadata = {}) {
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: files.length,
        successful: 0,
        failed: 0
      }
    };

    for (const file of files) {
      try {
        const result = await this.uploadPhoto(file, metadata);
        results.successful.push(result);
        results.summary.successful++;
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId) {
    try {
      const attachment = await Attachment.findByPk(attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }
      return attachment;
    } catch (error) {
      throw new Error(`Error retrieving attachment: ${error.message}`);
    }
  }

  /**
   * Delete attachment and associated files
   */
  async deleteAttachment(attachmentId) {
    try {
      const attachment = await Attachment.findByPk(attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Delete physical files
      const filePath = path.join(process.cwd(), attachment.filePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Could not delete main file:', error.message);
      }

      // Delete thumbnail if exists
      if (attachment.thumbnailPath) {
        const thumbnailPath = path.join(process.cwd(), attachment.thumbnailPath);
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          console.warn('Could not delete thumbnail:', error.message);
        }
      }

      // Delete database record
      await attachment.destroy();

      return { success: true, message: 'Attachment deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting attachment: ${error.message}`);
    }
  }

  /**
   * Get attachments for a job
   */
  async getJobAttachments(jobId, options = {}) {
    try {
      const {
        category,
        fileType = 'image',
        limit,
        offset,
        orderBy = 'uploadDate',
        orderDirection = 'DESC'
      } = options;

      const whereClause = { jobId, fileType };
      if (category) {
        whereClause.category = category;
      }

      const attachments = await Attachment.findAndCountAll({
        where: whereClause,
        order: [[orderBy, orderDirection]],
        limit,
        offset,
        // Note: Include removed due to potential association issues during testing
        // include: [
        //   {
        //     model: require('../database/models').User,
        //     as: 'uploader',
        //     attributes: ['id', 'firstName', 'lastName', 'email']
        //   }
        // ]
      });

      return {
        attachments: attachments.rows,
        total: attachments.count,
        pagination: limit ? {
          limit,
          offset,
          hasMore: (offset + limit) < attachments.count
        } : null
      };
    } catch (error) {
      throw new Error(`Error retrieving job attachments: ${error.message}`);
    }
  }

  /**
   * Validate magic bytes
   */
  validateMagicBytes(magicBytes, mimeType) {
    const signatures = {
      'image/jpeg': ['FFD8FF'],
      'image/png': ['89504E47'],
      'image/webp': ['52494646'], // RIFF header for WebP
      'image/gif': ['47494638']
    };

    const signature = signatures[mimeType];
    if (!signature) return true; // Allow if no signature defined

    const fileHeader = magicBytes.slice(0, 8).toString('hex').toUpperCase();
    return signature.some(sig => fileHeader.startsWith(sig));
  }

  /**
   * Get magic bytes from buffer
   */
  getMagicBytes(buffer) {
    return buffer.slice(0, 8);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get supported categories for auto body shop
   */
  getSupportedCategories() {
    return [
      { value: 'damage_assessment', label: 'Damage Assessment', description: 'Initial damage documentation' },
      { value: 'before_damage', label: 'Before Repair', description: 'Pre-repair condition' },
      { value: 'during_repair', label: 'During Repair', description: 'Work in progress' },
      { value: 'after_repair', label: 'After Repair', description: 'Completed work' },
      { value: 'supplement', label: 'Supplement', description: 'Additional damage found' },
      { value: 'parts_received', label: 'Parts', description: 'Parts condition/packaging' },
      { value: 'quality_check', label: 'Quality Check', description: 'Final inspection' },
      { value: 'delivery', label: 'Delivery', description: 'Vehicle pickup/delivery' },
      { value: 'customer_signature', label: 'Customer Authorization', description: 'Signed documents' },
      { value: 'insurance_doc', label: 'Insurance', description: 'Claim documents' },
      { value: 'invoice', label: 'Invoice', description: 'Billing documentation' },
      { value: 'estimate', label: 'Estimate', description: 'Repair estimate' },
      { value: 'blueprint', label: 'VIN/Labels', description: 'Vehicle identification' },
      { value: 'warranty', label: 'Warranty', description: 'Warranty documentation' },
      { value: 'other', label: 'Other', description: 'Other documentation' }
    ];
  }
}

module.exports = new PhotoUploadService();