const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'VendorPartQuote',
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
      sourcingRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'parts_sourcing_requests', key: 'id' },
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
      },

      // Quote Information
      quoteNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Vendor-provided quote number',
      },
      quoteReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Internal reference for this quote',
      },
      batchQuoteId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Groups multiple part quotes from same vendor',
      },

      // Part Information
      partNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Vendor part number for this quote',
      },
      partDescription: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      oemPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'OEM part number if different from vendor part number',
      },
      alternatePartNumbers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of alternate part numbers',
      },
      brandType: {
        type: DataTypes.ENUM(
          'oem',
          'oem_equivalent', 
          'aftermarket',
          'recycled',
          'remanufactured'
        ),
        allowNull: false,
      },
      partCondition: {
        type: DataTypes.ENUM(
          'new',
          'used',
          'rebuilt',
          'reconditioned',
          'aftermarket',
          'surplus'
        ),
        allowNull: false,
      },
      qualityGrade: {
        type: DataTypes.ENUM('premium', 'standard', 'economy'),
        defaultValue: 'standard',
      },

      // Availability Information
      availabilityStatus: {
        type: DataTypes.ENUM(
          'in_stock',
          'limited_stock',
          'backordered',
          'special_order',
          'discontinued',
          'not_available'
        ),
        allowNull: false,
      },
      quantityAvailable: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: 'Quantity available from vendor',
      },
      minimumOrderQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 1.0,
        comment: 'Minimum quantity that must be ordered',
      },
      stockLocation: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Vendor warehouse or location where part is stocked',
      },
      reservationExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'How long the vendor will hold this part',
      },

      // Pricing Information
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Price per unit',
      },
      listPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Manufacturer list price',
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Discount percentage off list price',
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Fixed discount amount',
      },
      quantityBreaks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of quantity-based pricing breaks',
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        comment: 'Currency code (USD, CAD, etc.)',
      },
      taxIncluded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether tax is included in the price',
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Tax percentage if not included',
      },

      // Core and Exchange Information
      coreRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Part requires core exchange',
      },
      corePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Core charge amount',
      },
      coreCredit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Credit received for returning core',
      },
      coreReturnPeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Days allowed to return core',
      },

      // Delivery and Lead Time
      leadTimeMin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Minimum lead time in days',
      },
      leadTimeMax: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum lead time in days',
      },
      leadTimeEstimate: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Best estimate of lead time in days',
      },
      shippingMethod: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Available shipping methods',
      },
      shippingCost: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Shipping cost for this part',
      },
      freeShippingThreshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Order total required for free shipping',
      },
      expediteAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Can this part be expedited',
      },
      expediteCost: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Additional cost for expedited shipping',
      },
      expediteLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Lead time if expedited (days)',
      },

      // Quote Status and Timing
      quoteStatus: {
        type: DataTypes.ENUM(
          'pending',
          'received',
          'analyzed',
          'accepted',
          'rejected',
          'expired',
          'withdrawn'
        ),
        defaultValue: 'received',
      },
      quoteDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Date quote was received',
      },
      quoteExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quote expiration date',
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Response time from vendor in minutes',
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Quote validity period',
      },

      // Quality and Performance Scoring
      qualityScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 100 },
        comment: 'Quality score for this part/vendor combination',
      },
      reliabilityScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 100 },
        comment: 'Vendor reliability score',
      },
      overallScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 100 },
        comment: 'Overall score combining price, quality, delivery',
      },
      scoringFactors: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with detailed scoring breakdown',
      },

      // Warranty Information
      warrantyPeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Warranty period in months',
      },
      warrantyMileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Warranty mileage limit',
      },
      warrantyType: {
        type: DataTypes.ENUM(
          'manufacturer',
          'vendor',
          'parts_only',
          'parts_and_labor',
          'limited',
          'none'
        ),
        allowNull: true,
      },
      warrantyTerms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed warranty terms and conditions',
      },

      // Return and Exchange Policy
      returnPolicy: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Return policy terms',
      },
      returnPeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Return period in days',
      },
      restockingFee: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Restocking fee percentage',
      },
      exchangePolicy: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Exchange policy terms',
      },

      // API Integration Data
      apiSource: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Source API that provided this quote',
      },
      apiResponseData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Raw API response data (JSON)',
      },
      apiRequestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'API request identifier',
      },
      apiVersion: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'API version used',
      },
      integrationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Integration-specific notes and metadata',
      },

      // Selection and Decision Data
      isSelected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this quote was selected for ordering',
      },
      selectionRank: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Rank of this quote (1 = best)',
      },
      selectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason why this quote was/wasn\'t selected',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Specific reason for rejection',
      },
      alternativeRecommendations: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of alternative recommendations',
      },

      // Cost Analysis
      totalCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Total cost including shipping, taxes, etc.',
      },
      costPerDay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cost per day (factoring in lead time)',
      },
      competitiveRanking: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Price ranking among all quotes for this part',
      },
      savingsVsTarget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Savings compared to target price',
      },
      markupPotential: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Potential markup percentage',
      },

      // Special Conditions and Notes
      specialConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special terms or conditions for this quote',
      },
      restrictions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Any restrictions on this quote',
      },
      vendorNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes from the vendor',
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes about this quote',
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
      receivedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      analyzedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'vendor_part_quotes',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );
};