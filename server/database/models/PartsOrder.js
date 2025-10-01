const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const PartsOrder = sequelize.define(
    'PartsOrder',
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
      orderNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      jobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      estimateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'estimates',
          key: 'id',
        },
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      // Order details
      orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      requestedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      promisedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
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
      // Status tracking
      status: {
        type: DataTypes.ENUM(
          'draft',
          'pending',
          'sent',
          'confirmed',
          'in_production',
          'shipped',
          'partially_received',
          'received',
          'backordered',
          'cancelled',
          'returned'
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'rush'),
        defaultValue: 'normal',
      },
      // Financial information
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      handlingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      // Shipping information
      shippingMethod: {
        type: DataTypes.ENUM(
          'pickup',
          'standard',
          'expedited',
          'overnight',
          'freight',
          'delivery',
          'other'
        ),
        defaultValue: 'standard',
      },
      trackingNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      carrier: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Vendor contact information
      vendorOrderNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vendorContact: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vendorPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      vendorEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Payment information
      paymentTerms: {
        type: DataTypes.ENUM(
          'cod',
          'net_15',
          'net_30',
          'net_60',
          'prepaid',
          'credit_card',
          'account'
        ),
        defaultValue: 'account',
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          'unpaid',
          'partial',
          'paid',
          'overdue',
          'disputed'
        ),
        defaultValue: 'unpaid',
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.ENUM(
          'cash',
          'check',
          'credit_card',
          'ach',
          'wire',
          'account_credit',
          'other'
        ),
        allowNull: true,
      },
      // Special instructions and notes
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
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
      // Approval workflow
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approved: {
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
      approvalLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Quality and inspection
      inspectionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectionCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      inspectedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      qualityIssues: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Returns and exchanges
      hasReturns: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      returnReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      returnDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      returnAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      // System fields
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
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
      sentBy: {
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
      // Metadata
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Archive
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      archivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'parts_orders',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: order => {
          // Generate order number if not provided
          if (!order.orderNumber) {
            order.orderNumber = generateOrderNumber();
          }

          // Calculate total amount
          order.totalAmount = calculateOrderTotal(order);

          // Set expected date if not provided (default 5 business days)
          if (!order.expectedDate && order.orderDate) {
            const expectedDate = new Date(order.orderDate);
            expectedDate.setDate(expectedDate.getDate() + 5);
            order.expectedDate = expectedDate;
          }
        },
        beforeUpdate: order => {
          // Update dates based on status changes
          if (order.changed('status')) {
            const now = new Date();

            if (order.status === 'shipped' && !order.shippedDate) {
              order.shippedDate = now;
            }

            if (
              ['received', 'partially_received'].includes(order.status) &&
              !order.receivedDate
            ) {
              order.receivedDate = now;
            }

            if (order.status === 'cancelled') {
              order.approved = false;
            }
          }

          // Update approval date
          if (order.changed('approved') && order.approved) {
            order.approvalDate = new Date();
          }

          // Update payment date
          if (
            order.changed('paymentStatus') &&
            order.paymentStatus === 'paid'
          ) {
            order.paymentDate = new Date();
          }

          // Recalculate total if financial fields changed
          const financialFields = [
            'subtotal',
            'taxAmount',
            'shippingAmount',
            'handlingAmount',
            'discountAmount',
          ];
          if (financialFields.some(field => order.changed(field))) {
            order.totalAmount = calculateOrderTotal(order);
          }
        },
      },
    }
  );

  // Instance methods
  PartsOrder.prototype.getStatusColor = function () {
    const statusColors = {
      draft: '#95A5A6',
      pending: '#F39C12',
      sent: '#3498DB',
      confirmed: '#2ECC71',
      in_production: '#E67E22',
      shipped: '#9B59B6',
      partially_received: '#F1C40F',
      received: '#27AE60',
      backordered: '#E74C3C',
      cancelled: '#7F8C8D',
      returned: '#E91E63',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  PartsOrder.prototype.getPriorityColor = function () {
    const priorityColors = {
      low: '#2ECC71',
      normal: '#3498DB',
      high: '#F39C12',
      urgent: '#E67E22',
      rush: '#E74C3C',
    };
    return priorityColors[this.priority] || '#3498DB';
  };

  PartsOrder.prototype.isOverdue = function () {
    if (!this.expectedDate) return false;
    return (
      new Date() > new Date(this.expectedDate) &&
      !['received', 'cancelled'].includes(this.status)
    );
  };

  PartsOrder.prototype.getDaysOverdue = function () {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const expected = new Date(this.expectedDate);
    return Math.ceil((today - expected) / (1000 * 60 * 60 * 24));
  };

  PartsOrder.prototype.getDeliveryDays = function () {
    if (!this.orderDate || !this.receivedDate) return null;
    const order = new Date(this.orderDate);
    const received = new Date(this.receivedDate);
    return Math.ceil((received - order) / (1000 * 60 * 60 * 24));
  };

  PartsOrder.prototype.needsApproval = function () {
    return this.requiresApproval && !this.approved;
  };

  PartsOrder.prototype.canBeCancelled = function () {
    return ['draft', 'pending', 'sent', 'confirmed'].includes(this.status);
  };

  PartsOrder.prototype.isComplete = function () {
    return this.status === 'received';
  };

  PartsOrder.prototype.getBalance = function () {
    // This would need to be calculated based on parts order items
    return parseFloat(this.totalAmount) || 0;
  };

  // Class methods
  PartsOrder.generateOrderNumber = generateOrderNumber;

  return PartsOrder;
};

// Helper function to generate order number
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `PO-${year}${month}${day}-${random}`;
}

// Helper function to calculate order total
function calculateOrderTotal(order) {
  const subtotal = parseFloat(order.subtotal || 0);
  const tax = parseFloat(order.taxAmount || 0);
  const shipping = parseFloat(order.shippingAmount || 0);
  const handling = parseFloat(order.handlingAmount || 0);
  const discount = parseFloat(order.discountAmount || 0);

  return (subtotal + tax + shipping + handling - discount).toFixed(2);
}
