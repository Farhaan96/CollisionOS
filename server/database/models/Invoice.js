const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Invoice = sequelize.define(
    'Invoice',
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
      invoiceNumber: {
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
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      vehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id',
        },
      },
      insuranceCompanyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'insurance_companies',
          key: 'id',
        },
      },
      // Invoice dates
      invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      serviceDates: {
        type: DataTypes.JSONB, // {start: date, end: date}
        allowNull: true,
      },
      // Financial information
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      laborAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      partsAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      paintAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      materialAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      subletAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      miscAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      // Discounts
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      discountReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Tax information
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      taxDetails: {
        type: DataTypes.JSONB,
        defaultValue: {}, // For multiple tax types
      },
      // Totals
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      // Payment information
      amountPaid: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      amountDue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          'unpaid',
          'partial',
          'paid',
          'overdue',
          'cancelled',
          'refunded'
        ),
        allowNull: false,
        defaultValue: 'unpaid',
      },
      // Payment breakdown
      customerPayment: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      insurancePayment: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      deductible: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      // Invoice status and type
      status: {
        type: DataTypes.ENUM(
          'draft',
          'sent',
          'viewed',
          'paid',
          'overdue',
          'cancelled',
          'voided'
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
      invoiceType: {
        type: DataTypes.ENUM(
          'standard',
          'insurance',
          'warranty',
          'supplement',
          'final'
        ),
        allowNull: false,
        defaultValue: 'standard',
      },
      // Billing addresses
      billingAddress: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Payment terms and methods
      paymentTerms: {
        type: DataTypes.ENUM(
          'due_on_receipt',
          'net_15',
          'net_30',
          'net_60',
          'cod'
        ),
        defaultValue: 'due_on_receipt',
      },
      paymentMethods: {
        type: DataTypes.JSONB,
        defaultValue: ['cash', 'check', 'credit_card'],
      },
      // Insurance claim information
      claimNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      adjusterId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isDRP: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Dates tracking
      sentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      viewedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      firstPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paidInFullDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Late fees and interest
      lateFeeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      daysOverdue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      // Print and delivery
      printCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastPrintDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      emailCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastEmailDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Special instructions
      termsAndConditions: {
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
      customerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // References
      poNumber: {
        type: DataTypes.STRING(50),
        allowNull: true, // Purchase order number
      },
      originalInvoiceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'invoices',
          key: 'id',
        },
      },
      // Revision tracking
      revisionNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      isRevision: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      revisionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      // Metadata
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      tableName: 'invoices',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: invoice => {
          // Generate invoice number if not provided
          if (!invoice.invoiceNumber) {
            invoice.invoiceNumber = generateInvoiceNumber();
          }

          // Set due date based on payment terms if not provided
          if (!invoice.dueDate && invoice.invoiceDate) {
            invoice.dueDate = calculateDueDate(
              invoice.invoiceDate,
              invoice.paymentTerms
            );
          }

          // Calculate totals
          invoice.totalAmount = calculateInvoiceTotal(invoice);
          invoice.amountDue =
            parseFloat(invoice.totalAmount) - parseFloat(invoice.amountPaid);
        },
        beforeUpdate: invoice => {
          // Update payment status based on amount paid
          const total = parseFloat(invoice.totalAmount);
          const paid = parseFloat(invoice.amountPaid);
          const due = total - paid;

          invoice.amountDue = due.toFixed(2);

          if (paid === 0) {
            invoice.paymentStatus = 'unpaid';
          } else if (paid >= total) {
            invoice.paymentStatus = 'paid';
            if (!invoice.paidInFullDate) {
              invoice.paidInFullDate = new Date();
            }
          } else {
            invoice.paymentStatus = 'partial';
          }

          // Check for overdue status
          if (
            invoice.dueDate &&
            new Date() > new Date(invoice.dueDate) &&
            due > 0
          ) {
            invoice.paymentStatus = 'overdue';
            const today = new Date();
            const dueDate = new Date(invoice.dueDate);
            invoice.daysOverdue = Math.ceil(
              (today - dueDate) / (1000 * 60 * 60 * 24)
            );
          }

          // Update dates
          if (invoice.changed('status')) {
            if (invoice.status === 'sent' && !invoice.sentDate) {
              invoice.sentDate = new Date();
            }

            if (invoice.status === 'viewed' && !invoice.viewedDate) {
              invoice.viewedDate = new Date();
            }
          }

          // Update payment dates
          if (invoice.changed('amountPaid') && invoice.amountPaid > 0) {
            if (!invoice.firstPaymentDate) {
              invoice.firstPaymentDate = new Date();
            }
            invoice.lastPaymentDate = new Date();
          }

          // Recalculate totals if financial fields changed
          const financialFields = [
            'laborAmount',
            'partsAmount',
            'paintAmount',
            'materialAmount',
            'subletAmount',
            'miscAmount',
            'discountAmount',
            'taxAmount',
          ];
          if (financialFields.some(field => invoice.changed(field))) {
            invoice.totalAmount = calculateInvoiceTotal(invoice);
            invoice.amountDue =
              parseFloat(invoice.totalAmount) - parseFloat(invoice.amountPaid);
          }
        },
      },
    }
  );

  // Instance methods
  Invoice.prototype.getStatusColor = function () {
    const statusColors = {
      draft: '#95A5A6',
      sent: '#3498DB',
      viewed: '#F39C12',
      paid: '#2ECC71',
      overdue: '#E74C3C',
      cancelled: '#7F8C8D',
      voided: '#34495E',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  Invoice.prototype.getPaymentStatusColor = function () {
    const paymentStatusColors = {
      unpaid: '#E74C3C',
      partial: '#F39C12',
      paid: '#2ECC71',
      overdue: '#E74C3C',
      cancelled: '#95A5A6',
      refunded: '#9B59B6',
    };
    return paymentStatusColors[this.paymentStatus] || '#95A5A6';
  };

  Invoice.prototype.isOverdue = function () {
    if (!this.dueDate) return false;
    return (
      new Date() > new Date(this.dueDate) && parseFloat(this.amountDue) > 0
    );
  };

  Invoice.prototype.isDraft = function () {
    return this.status === 'draft';
  };

  Invoice.prototype.isPaid = function () {
    return this.paymentStatus === 'paid';
  };

  Invoice.prototype.getPaymentPercentage = function () {
    const total = parseFloat(this.totalAmount);
    if (total === 0) return 0;
    return Math.round((parseFloat(this.amountPaid) / total) * 100);
  };

  Invoice.prototype.getDaysUntilDue = function () {
    if (!this.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Invoice.prototype.canBeVoided = function () {
    return (
      ['draft', 'sent', 'viewed'].includes(this.status) &&
      parseFloat(this.amountPaid) === 0
    );
  };

  Invoice.prototype.canBeCancelled = function () {
    return !['paid', 'voided', 'cancelled'].includes(this.status);
  };

  Invoice.prototype.requiresCustomerPayment = function () {
    return (
      parseFloat(this.customerPayment) > 0 || parseFloat(this.deductible) > 0
    );
  };

  Invoice.prototype.getAgingCategory = function () {
    if (!this.isOverdue()) return 'current';

    const days = this.daysOverdue;
    if (days <= 30) return '1-30 days';
    if (days <= 60) return '31-60 days';
    if (days <= 90) return '61-90 days';
    return '90+ days';
  };

  Invoice.prototype.getDiscountPercentage = function () {
    const subtotal = parseFloat(this.subtotal);
    const discount = parseFloat(this.discountAmount);

    if (subtotal === 0 || discount === 0) return 0;
    return ((discount / subtotal) * 100).toFixed(2);
  };

  /**
   * Record a payment against this invoice
   * Updates paid amount, balance due, and payment status
   * @param {number} paymentAmount - Amount of payment to record
   * @returns {Promise<Invoice>} - Updated invoice
   */
  Invoice.prototype.recordPayment = async function (paymentAmount) {
    const amount = parseFloat(paymentAmount);

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const currentPaid = parseFloat(this.amountPaid || 0);
    const total = parseFloat(this.totalAmount);
    const newPaidAmount = currentPaid + amount;

    if (newPaidAmount > total) {
      throw new Error('Payment amount exceeds invoice total');
    }

    // Update amounts
    this.amountPaid = newPaidAmount.toFixed(2);
    this.balanceDue = (total - newPaidAmount).toFixed(2);

    // Update payment status
    if (newPaidAmount >= total) {
      this.paymentStatus = 'paid';
      this.invoiceStatus = 'paid';
      if (!this.paidInFullDate) {
        this.paidInFullDate = new Date();
      }
    } else if (newPaidAmount > 0) {
      this.paymentStatus = 'partial';
      this.invoiceStatus = 'partial';
    }

    // Update payment dates
    if (!this.firstPaymentDate) {
      this.firstPaymentDate = new Date();
    }
    this.lastPaymentDate = new Date();

    // Save the invoice
    await this.save();
    return this;
  };

  // Class methods
  Invoice.generateInvoiceNumber = generateInvoiceNumber;

  return Invoice;
};

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `INV-${year}${month}${day}-${random}`;
}

// Helper function to calculate due date
function calculateDueDate(invoiceDate, paymentTerms) {
  const date = new Date(invoiceDate);

  switch (paymentTerms) {
    case 'due_on_receipt':
    case 'cod':
      return date;
    case 'net_15':
      date.setDate(date.getDate() + 15);
      return date;
    case 'net_30':
      date.setDate(date.getDate() + 30);
      return date;
    case 'net_60':
      date.setDate(date.getDate() + 60);
      return date;
    default:
      return date;
  }
}

// Helper function to calculate invoice total
function calculateInvoiceTotal(invoice) {
  const subtotal =
    parseFloat(invoice.laborAmount || 0) +
    parseFloat(invoice.partsAmount || 0) +
    parseFloat(invoice.paintAmount || 0) +
    parseFloat(invoice.materialAmount || 0) +
    parseFloat(invoice.subletAmount || 0) +
    parseFloat(invoice.miscAmount || 0);

  invoice.subtotal = subtotal.toFixed(2);

  const total =
    subtotal -
    parseFloat(invoice.discountAmount || 0) +
    parseFloat(invoice.taxAmount || 0) +
    parseFloat(invoice.lateFeeAmount || 0);

  return Math.max(0, total).toFixed(2);
}
