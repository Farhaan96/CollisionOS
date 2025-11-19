const { DataTypes } = require('sequelize');

/**
 * Signature Model
 * Stores digital signature data for document authorization
 *
 * Features:
 * - Signature capture as base64 image data
 * - Document type and ID linking
 * - Immutable once created (no updates allowed)
 * - Audit trail with IP address and timestamp
 * - Support for multiple signatures per document
 */
module.exports = (sequelize) => {
  const Signature = sequelize.define('Signature', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Document association
    documentType: {
      type: DataTypes.ENUM(
        'repair_order',
        'estimate',
        'invoice',
        'work_authorization',
        'parts_authorization',
        'delivery_receipt',
        'pickup_receipt',
        'inspection_report',
        'customer_agreement',
        'vehicle_condition',
        'loaner_agreement',
        'general'
      ),
      allowNull: false,
      field: 'document_type',
      comment: 'Type of document being signed',
    },

    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_id',
      comment: 'ID of the document being signed',
    },

    // Signature field metadata
    signatureFieldName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'signature_field_name',
      comment: 'Name/label of signature field (e.g., "Customer Signature", "Technician Signature")',
    },

    // Signature data
    signatureData: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Base64 encoded PNG image of signature',
    },

    signatureWidth: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
      comment: 'Width of signature canvas in pixels',
    },

    signatureHeight: {
      type: DataTypes.INTEGER,
      defaultValue: 200,
      comment: 'Height of signature canvas in pixels',
    },

    // Signer information
    signedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of person who signed',
    },

    signerRole: {
      type: DataTypes.ENUM(
        'customer',
        'technician',
        'estimator',
        'manager',
        'owner',
        'inspector',
        'driver',
        'other'
      ),
      allowNull: false,
      defaultValue: 'customer',
      comment: 'Role of person signing',
    },

    signerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
      comment: 'Email of signer (optional)',
    },

    signerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Phone of signer (optional)',
    },

    // Audit trail
    signedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'signed_at',
      comment: 'Timestamp when signature was captured',
    },

    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address from which signature was captured',
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/device user agent string',
    },

    geolocation: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'GPS coordinates if available (latitude, longitude)',
    },

    // Verification and security
    verificationHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'SHA-256 hash of signature data for verification',
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether signature passed verification checks',
    },

    // Metadata
    consentText: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text of agreement/consent that was signed',
    },

    signatureNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about signature context',
    },

    // Foreign keys
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'shop_id',
      comment: 'Shop where signature was captured',
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      comment: 'CollisionOS user ID if signer is a system user',
    },

    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id',
      comment: 'Customer ID if signer is a customer',
    },

    repairOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'repair_order_id',
      comment: 'Associated repair order (if applicable)',
    },

    // Soft delete - signatures should never be hard deleted
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp (signatures are immutable)',
    },

    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'signatures',
    timestamps: true,
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['document_type', 'document_id'],
        name: 'idx_signature_document',
      },
      {
        fields: ['shop_id'],
        name: 'idx_signature_shop',
      },
      {
        fields: ['repair_order_id'],
        name: 'idx_signature_ro',
      },
      {
        fields: ['customer_id'],
        name: 'idx_signature_customer',
      },
      {
        fields: ['user_id'],
        name: 'idx_signature_user',
      },
      {
        fields: ['signed_at'],
        name: 'idx_signature_signed_at',
      },
      {
        unique: true,
        fields: ['document_type', 'document_id', 'signature_field_name', 'signed_at'],
        name: 'idx_signature_unique_field',
      },
    ],
    hooks: {
      // Prevent updates to signature data after creation
      beforeUpdate: (signature, options) => {
        if (signature.changed('signatureData')) {
          throw new Error('Signature data is immutable and cannot be modified');
        }
      },
    },
  });

  return Signature;
};
