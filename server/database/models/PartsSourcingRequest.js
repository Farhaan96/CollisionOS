const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'PartsSourcingRequest',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Parent References
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
      },
      repairOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'repair_order_management', key: 'id' },
      },
      estimateLineItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'estimate_line_items', key: 'id' },
      },
      claimManagementId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'claim_management', key: 'id' },
      },

      // Sourcing Request Information
      requestNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Auto-generated sourcing request number',
      },
      batchId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Groups multiple parts for batch sourcing',
      },
      
      // Part Identification
      partDescription: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      oemPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      alternatePartNumbers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of alternate part numbers',
      },
      partCategory: {
        type: DataTypes.ENUM(
          'body_panel',
          'structural',
          'mechanical',
          'electrical',
          'interior',
          'glass',
          'trim',
          'hardware',
          'paint_materials',
          'consumables'
        ),
        allowNull: false,
      },
      vehiclePosition: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Vehicle Information for Sourcing
      vehicleVin: {
        type: DataTypes.STRING(17),
        allowNull: true,
      },
      vehicleYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vehicleMake: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vehicleModel: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vehicleTrim: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vehicleEngine: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paintCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Sourcing Criteria
      quantityNeeded: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 1.0,
      },
      unitOfMeasure: {
        type: DataTypes.STRING(20),
        defaultValue: 'each',
      },
      preferredBrandTypes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of preferred brand types (OEM, aftermarket, etc.)',
      },
      acceptedConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of acceptable part conditions',
      },
      maxPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Maximum acceptable price per unit',
      },
      targetPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Target price per unit',
      },
      
      // Delivery Requirements
      requiredByDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Hard deadline for delivery',
      },
      preferredDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Preferred delivery date',
      },
      maxLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum acceptable lead time in days',
      },
      rushOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerWaiting: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Business Rules for Automated Sourcing
      businessRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object containing automated sourcing business rules',
      },
      vendorPreferences: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with vendor preferences and exclusions',
      },
      qualityRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with quality requirements and standards',
      },

      // Sourcing Status and Workflow
      sourcingStatus: {
        type: DataTypes.ENUM(
          'pending',
          'in_progress',
          'quotes_received',
          'analyzed',
          'approved',
          'ordered',
          'cancelled',
          'timeout',
          'failed'
        ),
        defaultValue: 'pending',
      },
      automationType: {
        type: DataTypes.ENUM(
          'fully_automated',
          'assisted',
          'manual_review_required',
          'manual_only'
        ),
        defaultValue: 'assisted',
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      approvalThreshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Price threshold requiring manual approval',
      },

      // Sourcing Results
      vendorCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of vendors contacted',
      },
      quotesReceived: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of quotes received',
      },
      bestPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Best price received across all vendors',
      },
      averagePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Average price across all quotes',
      },
      bestLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Best lead time in days',
      },
      averageLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Average lead time across all quotes',
      },
      selectedVendorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'vendors', key: 'id' },
      },
      selectedQuoteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'vendor_part_quotes', key: 'id' },
      },
      selectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for vendor/quote selection (automated or manual)',
      },

      // Processing Timeline
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      sourcingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      quotingDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      quotingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      analyzedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Processing Metrics
      totalProcessingTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Total processing time in minutes',
      },
      quotingResponseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Average response time from vendors in minutes',
      },
      apiCallsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of API calls made for this request',
      },
      emailsSentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of emails sent for this request',
      },

      // Error Handling and Retries
      errorCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },
      nextRetryAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Integration and External System Data
      externalRequestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'External system reference ID',
      },
      integrationData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON data from external integrations',
      },
      apiResponseData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON data from API responses',
      },

      // Priority and Urgency
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
        defaultValue: 'normal',
      },
      urgencyScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Calculated urgency score (1-100)',
      },
      
      // Cost Analysis
      savingsAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Estimated savings compared to standard pricing',
      },
      savingsPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage savings achieved',
      },
      costAnalysisData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with detailed cost analysis',
      },

      // Notes and Comments
      sourcingNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Audit Trail
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      requestedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'parts_sourcing_requests',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );
};