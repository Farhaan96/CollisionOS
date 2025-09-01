const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const EstimateLineItem = sequelize.define(
    'EstimateLineItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      estimateId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'estimates',
          key: 'id',
        },
      },
      lineNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'part',
          'labor',
          'paint',
          'material',
          'sublet',
          'other',
          'tax',
          'discount'
        ),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'body',
          'frame',
          'mechanical',
          'electrical',
          'glass',
          'interior',
          'exterior',
          'paint',
          'refinish',
          'other'
        ),
        allowNull: true,
      },
      operationCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      // Part-specific fields
      partNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      partDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      partType: {
        type: DataTypes.ENUM(
          'OEM',
          'Aftermarket',
          'Used',
          'Reconditioned',
          'Generic'
        ),
        allowNull: true,
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      vendorPartNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Labor-specific fields
      laborHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      laborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      laborType: {
        type: DataTypes.ENUM(
          'body',
          'paint',
          'frame',
          'mechanical',
          'electrical',
          'glass',
          'detail',
          'other'
        ),
        allowNull: true,
      },
      skillLevel: {
        type: DataTypes.ENUM('apprentice', 'journeyman', 'expert', 'master'),
        allowNull: true,
      },
      // Paint-specific fields
      paintCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      paintType: {
        type: DataTypes.ENUM(
          'basecoat',
          'clearcoat',
          'primer',
          'sealer',
          'adhesion_promoter',
          'other'
        ),
        allowNull: true,
      },
      coverage: {
        type: DataTypes.DECIMAL(6, 2), // square feet
        allowNull: true,
      },
      coats: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Pricing and discounts
      listPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      markup: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
      },
      discount: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      // Tax information
      taxable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      // Status and workflow
      status: {
        type: DataTypes.ENUM(
          'pending',
          'approved',
          'rejected',
          'on_hold',
          'supplement'
        ),
        defaultValue: 'pending',
      },
      approvalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Additional information
      includedInOriginal: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      supplementNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isSublet: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      subletVendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      // R&I (Remove and Install) specific
      isRandI: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      removeTime: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      installTime: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      // Refinish specific
      isRefinish: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      refinishHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      // Metadata
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // System fields
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'estimate_line_items',
      timestamps: true,
      indexes: [
        {
          fields: ['estimateId'],
        },
        {
          fields: ['lineNumber'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['operationCode'],
        },
        {
          fields: ['partNumber'],
        },
        {
          fields: ['vendorId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['approvalRequired'],
        },
        {
          fields: ['includedInOriginal'],
        },
        {
          fields: ['supplementNumber'],
        },
        {
          fields: ['isSublet'],
        },
        {
          name: 'estimate_line_composite',
          fields: ['estimateId', 'lineNumber'],
        },
      ],
      hooks: {
        beforeCreate: lineItem => {
          // Calculate total price
          lineItem.totalPrice = calculateLineItemTotal(lineItem);

          // Set defaults based on type
          if (lineItem.type === 'labor' && !lineItem.laborRate) {
            lineItem.laborRate = 75.0; // Default labor rate
          }

          if (lineItem.type === 'tax') {
            lineItem.taxable = false;
          }
        },
        beforeUpdate: lineItem => {
          // Recalculate total if quantity or price changes
          if (
            lineItem.changed('quantity') ||
            lineItem.changed('unitPrice') ||
            lineItem.changed('discount') ||
            lineItem.changed('discountAmount')
          ) {
            lineItem.totalPrice = calculateLineItemTotal(lineItem);
          }

          // Update approval date if status changes to approved
          if (lineItem.changed('status') && lineItem.status === 'approved') {
            lineItem.approvalDate = new Date();
          }

          // Calculate tax amount if taxable and tax rate is set
          if (lineItem.taxable && lineItem.taxRate) {
            lineItem.taxAmount = (lineItem.totalPrice * lineItem.taxRate) / 100;
          }
        },
      },
    }
  );

  // Instance methods
  EstimateLineItem.prototype.getTypeIcon = function () {
    const typeIcons = {
      part: 'build',
      labor: 'engineering',
      paint: 'palette',
      material: 'inventory',
      sublet: 'swap_horiz',
      other: 'more_horiz',
      tax: 'account_balance',
      discount: 'trending_down',
    };
    return typeIcons[this.type] || 'help';
  };

  EstimateLineItem.prototype.getStatusColor = function () {
    const statusColors = {
      pending: '#FFA500',
      approved: '#2ECC71',
      rejected: '#E74C3C',
      on_hold: '#95A5A6',
      supplement: '#9B59B6',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  EstimateLineItem.prototype.getProfitMargin = function () {
    if (!this.cost || this.totalPrice === 0) return 0;
    return ((this.totalPrice - this.cost) / this.totalPrice) * 100;
  };

  EstimateLineItem.prototype.getDiscountedPrice = function () {
    let price = parseFloat(this.unitPrice) * parseFloat(this.quantity);

    if (this.discount && this.discount > 0) {
      price = price * (1 - this.discount / 100);
    }

    if (this.discountAmount && this.discountAmount > 0) {
      price = price - parseFloat(this.discountAmount);
    }

    return Math.max(0, price);
  };

  EstimateLineItem.prototype.isSupplement = function () {
    return (
      !this.includedInOriginal ||
      (this.supplementNumber && this.supplementNumber > 0)
    );
  };

  return EstimateLineItem;
};

// Helper function to calculate line item total
function calculateLineItemTotal(lineItem) {
  let total =
    parseFloat(lineItem.unitPrice || 0) * parseFloat(lineItem.quantity || 0);

  // Apply percentage discount
  if (lineItem.discount && lineItem.discount > 0) {
    total = total * (1 - lineItem.discount / 100);
  }

  // Apply fixed discount amount
  if (lineItem.discountAmount && lineItem.discountAmount > 0) {
    total = total - parseFloat(lineItem.discountAmount);
  }

  return Math.max(0, total).toFixed(2);
}
