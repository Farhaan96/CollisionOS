const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Attachment = sequelize.define(
    'Attachment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'shops',
          key: 'id',
        },
      },
      // Entity references (polymorphic relationship) - no constraints for flexibility
      jobId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      estimateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      vehicleId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      partsOrderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // File information
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalFileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      fileType: {
        type: DataTypes.ENUM('image', 'video', 'document', 'audio', 'other'),
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fileExtension: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // Image-specific fields
      imageWidth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      imageHeight: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      thumbnailPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      // Categorization
      category: {
        type: DataTypes.ENUM(
          'before_damage',
          'after_repair',
          'during_repair',
          'damage_assessment',
          'supplement',
          'parts_received',
          'quality_check',
          'delivery',
          'customer_signature',
          'invoice',
          'estimate',
          'blueprint',
          'authorization',
          'insurance_doc',
          'parts_receipt',
          'warranty',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      subCategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Metadata
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      // Location and context
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vehiclePart: {
        type: DataTypes.STRING(100),
        allowNull: true, // e.g., "front bumper", "driver door"
      },
      damageType: {
        type: DataTypes.STRING(100),
        allowNull: true, // e.g., "scratch", "dent", "crack"
      },
      // Date and time
      uploadDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      takenDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // User tracking - no constraint for flexibility
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      // Status and workflow
      status: {
        type: DataTypes.ENUM(
          'uploaded',
          'processing',
          'ready',
          'archived',
          'deleted'
        ),
        defaultValue: 'uploaded',
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Customer and insurance visibility
      visibleToCustomer: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      visibleToInsurance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      insuranceApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Security and access
      accessLevel: {
        type: DataTypes.ENUM(
          'public',
          'internal',
          'restricted',
          'confidential'
        ),
        defaultValue: 'internal',
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true, // For password-protected files
      },
      expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Version control
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      parentAttachmentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isLatestVersion: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Processing status
      processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      processingError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Storage information
      storageProvider: {
        type: DataTypes.ENUM(
          'local',
          'aws_s3',
          'google_cloud',
          'azure',
          'other'
        ),
        defaultValue: 'local',
      },
      storageKey: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      storageBucket: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Backup and archival
      backedUp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      backupDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      archiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // EXIF and metadata for images
      exifData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      gpsCoordinates: {
        type: DataTypes.JSON,
        allowNull: true, // {lat: number, lng: number}
      },
      cameraInfo: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      customFields: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'attachments',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: attachment => {
          // Extract file extension from original filename
          if (attachment.originalFileName && !attachment.fileExtension) {
            const parts = attachment.originalFileName.split('.');
            if (parts.length > 1) {
              attachment.fileExtension = parts.pop().toLowerCase();
            }
          }

          // Set MIME type based on file extension if not provided
          if (!attachment.mimeType && attachment.fileExtension) {
            attachment.mimeType = getMimeType(attachment.fileExtension);
          }

          // Set file type based on MIME type if not provided
          if (!attachment.fileType && attachment.mimeType) {
            attachment.fileType = getFileType(attachment.mimeType);
          }

          // Set taken date to current date if not provided for photos
          if (attachment.fileType === 'image' && !attachment.takenDate) {
            attachment.takenDate = new Date();
          }
        },
        beforeUpdate: attachment => {
          // Update version tracking
          if (
            attachment.changed('filePath') ||
            attachment.changed('fileName')
          ) {
            if (attachment.parentAttachmentId) {
              attachment.version = (attachment.version || 0) + 1;
            }
          }

          // Set archive date when archived
          if (attachment.changed('archived') && attachment.archived) {
            attachment.archiveDate = new Date();
          }

          // Set backup date when backed up
          if (attachment.changed('backedUp') && attachment.backedUp) {
            attachment.backupDate = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  Attachment.prototype.getFileTypeIcon = function () {
    const typeIcons = {
      image: 'image',
      video: 'videocam',
      document: 'description',
      audio: 'audiotrack',
      other: 'attach_file',
    };
    return typeIcons[this.fileType] || 'help';
  };

  Attachment.prototype.getFileSizeFormatted = function () {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  Attachment.prototype.isImage = function () {
    return this.fileType === 'image';
  };

  Attachment.prototype.isVideo = function () {
    return this.fileType === 'video';
  };

  Attachment.prototype.isDocument = function () {
    return this.fileType === 'document';
  };

  Attachment.prototype.canBeViewed = function () {
    return ['image', 'video', 'document'].includes(this.fileType);
  };

  Attachment.prototype.isExpired = function () {
    if (!this.expirationDate) return false;
    return new Date() > new Date(this.expirationDate);
  };

  Attachment.prototype.needsBackup = function () {
    return !this.backedUp && this.status === 'ready';
  };

  Attachment.prototype.getAccessColor = function () {
    const accessColors = {
      public: '#2ECC71',
      internal: '#3498DB',
      restricted: '#F39C12',
      confidential: '#E74C3C',
    };
    return accessColors[this.accessLevel] || '#95A5A6';
  };

  Attachment.prototype.getCategoryColor = function () {
    const categoryColors = {
      before_damage: '#E74C3C',
      after_repair: '#2ECC71',
      during_repair: '#F39C12',
      damage_assessment: '#E67E22',
      supplement: '#9B59B6',
      parts_received: '#3498DB',
      quality_check: '#1ABC9C',
      delivery: '#27AE60',
      customer_signature: '#8E44AD',
      invoice: '#34495E',
      estimate: '#16A085',
      blueprint: '#2980B9',
      authorization: '#D35400',
      insurance_doc: '#7F8C8D',
      parts_receipt: '#95A5A6',
      warranty: '#F1C40F',
      other: '#BDC3C7',
    };
    return categoryColors[this.category] || '#BDC3C7';
  };

  return Attachment;
};

// Helper functions
function getMimeType(extension) {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    txt: 'text/plain',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'document';
  return 'other';
}
