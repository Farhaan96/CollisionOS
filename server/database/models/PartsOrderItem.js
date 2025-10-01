const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const PartsOrderItem = sequelize.define(
    'PartsOrderItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      partsOrderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'parts_orders',
          key: 'id',
        },
      },
      partId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'parts',
          key: 'id',
        },
      },
      estimateLineItemId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'estimate_line_items',
          key: 'id',
        },
      },
      lineNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Part identification
      partNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      vendorPartNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      partType: {
        type: DataTypes.ENUM(
          'OEM',
          'Aftermarket',
          'Used',
          'Reconditioned',
          'Generic'
        ),
        allowNull: false,
        defaultValue: 'OEM',
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
          'hardware',
          'other'
        ),
        allowNull: true,
      },
      // Quantities
      quantityOrdered: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      quantityReceived: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      quantityBackordered: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      quantityReturned: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      // Pricing
      unitCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      listPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      discount: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
        defaultValue: 0.0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      totalCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      core: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      // Status tracking
      status: {
        type: DataTypes.ENUM(
          'pending',
          'ordered',
          'confirmed',
          'shipped',
          'received',
          'backordered',
          'cancelled',
          'returned',
          'damaged'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Vendor information
      vendorName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      vendorOrderNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vendorLineNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      // Shipping and tracking
      expectedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      shippedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      receivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trackingNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Location and storage
      binLocation: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      shelfLocation: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      warehouseLocation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Quality and condition
      condition: {
        type: DataTypes.ENUM(
          'new',
          'used',
          'reconditioned',
          'damaged',
          'defective'
        ),
        defaultValue: 'new',
      },
      qualityGrade: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
        allowNull: true,
      },
      inspectionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectionPassed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      inspectionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      inspectionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Warranty information
      warrantyMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      warrantyMiles: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      warrantyType: {
        type: DataTypes.ENUM('manufacturer', 'vendor', 'shop', 'none'),
        defaultValue: 'manufacturer',
      },
      // Return information
      returnable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      returnDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      returnReason: {
        type: DataTypes.ENUM(
          'wrong_part',
          'damaged',
          'defective',
          'no_longer_needed',
          'customer_change',
          'warranty',
          'other'
        ),
        allowNull: true,
      },
      returnNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Special handling
      specialHandling: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      handlingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hazardousMaterial: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Installation tracking
      installed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      installedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      installedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      // Metadata and notes
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receivingNotes: {
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
      receivedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'parts_order_items',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: item => {
          // Calculate total cost
          item.totalCost = calculateItemTotal(item);

          // Set return deadline (default 30 days from receipt)
          if (item.returnable && !item.returnDeadline && item.receivedDate) {
            const deadline = new Date(item.receivedDate);
            deadline.setDate(deadline.getDate() + 30);
            item.returnDeadline = deadline;
          }
        },
        beforeUpdate: item => {
          // Update received date when status changes to received
          if (
            item.changed('status') &&
            item.status === 'received' &&
            !item.receivedDate
          ) {
            item.receivedDate = new Date();
          }

          // Update shipped date when status changes to shipped
          if (
            item.changed('status') &&
            item.status === 'shipped' &&
            !item.shippedDate
          ) {
            item.shippedDate = new Date();
          }

          // Set installation date when marked as installed
          if (
            item.changed('installed') &&
            item.installed &&
            !item.installedDate
          ) {
            item.installedDate = new Date();
          }

          // Set return deadline when received
          if (
            item.changed('receivedDate') &&
            item.receivedDate &&
            item.returnable &&
            !item.returnDeadline
          ) {
            const deadline = new Date(item.receivedDate);
            deadline.setDate(deadline.getDate() + 30);
            item.returnDeadline = deadline;
          }

          // Recalculate total cost if pricing changes
          if (
            item.changed('quantityOrdered') ||
            item.changed('unitCost') ||
            item.changed('discount') ||
            item.changed('discountAmount')
          ) {
            item.totalCost = calculateItemTotal(item);
          }
        },
      },
    }
  );

  // Instance methods
  PartsOrderItem.prototype.getStatusColor = function () {
    const statusColors = {
      pending: '#95A5A6',
      ordered: '#F39C12',
      confirmed: '#3498DB',
      shipped: '#9B59B6',
      received: '#2ECC71',
      backordered: '#E74C3C',
      cancelled: '#7F8C8D',
      returned: '#E91E63',
      damaged: '#E67E22',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  PartsOrderItem.prototype.getCompletionPercentage = function () {
    if (this.quantityOrdered === 0) return 0;
    return Math.round((this.quantityReceived / this.quantityOrdered) * 100);
  };

  PartsOrderItem.prototype.isFullyReceived = function () {
    return this.quantityReceived >= this.quantityOrdered;
  };

  PartsOrderItem.prototype.isPartiallyReceived = function () {
    return (
      this.quantityReceived > 0 && this.quantityReceived < this.quantityOrdered
    );
  };

  PartsOrderItem.prototype.isOverdue = function () {
    if (!this.expectedDate) return false;
    return (
      new Date() > new Date(this.expectedDate) &&
      !['received', 'cancelled', 'returned'].includes(this.status)
    );
  };

  PartsOrderItem.prototype.canBeReturned = function () {
    if (!this.returnable) return false;
    if (this.returnDeadline && new Date() > new Date(this.returnDeadline))
      return false;
    return ['received'].includes(this.status);
  };

  PartsOrderItem.prototype.getRemainingQuantity = function () {
    return Math.max(0, this.quantityOrdered - this.quantityReceived);
  };

  PartsOrderItem.prototype.getDiscountedCost = function () {
    let cost = parseFloat(this.unitCost) * parseFloat(this.quantityOrdered);

    if (this.discount && this.discount > 0) {
      cost = cost * (1 - this.discount / 100);
    }

    if (this.discountAmount && this.discountAmount > 0) {
      cost = cost - parseFloat(this.discountAmount);
    }

    return Math.max(0, cost);
  };

  PartsOrderItem.prototype.getWarrantyExpiry = function () {
    if (!this.installedDate || (!this.warrantyMonths && !this.warrantyMiles))
      return null;

    const expiry = new Date(this.installedDate);
    if (this.warrantyMonths) {
      expiry.setMonth(expiry.getMonth() + this.warrantyMonths);
    }

    return expiry;
  };

  PartsOrderItem.prototype.isUnderWarranty = function () {
    const expiry = this.getWarrantyExpiry();
    if (!expiry) return false;
    return new Date() <= expiry;
  };

  return PartsOrderItem;
};

// Helper function to calculate item total cost
function calculateItemTotal(item) {
  let total =
    parseFloat(item.unitCost || 0) * parseFloat(item.quantityOrdered || 0);

  // Apply percentage discount
  if (item.discount && item.discount > 0) {
    total = total * (1 - item.discount / 100);
  }

  // Apply fixed discount amount
  if (item.discountAmount && item.discountAmount > 0) {
    total = total - parseFloat(item.discountAmount);
  }

  // Add core charge
  if (item.core && item.core > 0) {
    total += parseFloat(item.core) * parseFloat(item.quantityOrdered || 0);
  }

  return Math.max(0, total).toFixed(2);
}
