/**
 * Expense Model - CollisionOS
 *
 * Represents business expenses including job costs and operating expenses
 * Supports approval workflow and QuickBooks synchronization
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'shop_id'
    },

    // Expense Classification
    expenseType: {
      type: DataTypes.ENUM('job_cost', 'operating', 'payroll', 'overhead', 'capital'),
      allowNull: false,
      field: 'expense_type'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      // Common categories: 'sublet', 'materials', 'rent', 'utilities', 'insurance', 'supplies'
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    // Job-Related (if applicable)
    repairOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'repair_order_id',
      references: {
        model: 'repair_orders',
        key: 'id'
      }
    },
    isBillable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_billable'
    },
    markupPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'markup_percentage'
    },
    billedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'billed_amount'
    },

    // Expense Details
    expenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'expense_number'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },

    // Vendor Information
    vendorId: {
      type: DataTypes.UUID,
      field: 'vendor_id'
    },
    vendorName: {
      type: DataTypes.STRING(255),
      field: 'vendor_name'
    },
    vendorInvoiceNumber: {
      type: DataTypes.STRING(100),
      field: 'vendor_invoice_number'
    },

    // Payment Details
    paymentMethod: {
      type: DataTypes.STRING(50),
      field: 'payment_method'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid', 'partial', 'overdue', 'cancelled'),
      defaultValue: 'unpaid',
      field: 'payment_status'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'paid_amount',
      validate: {
        min: 0
      }
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      field: 'payment_reference'
    },

    // Dates
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'expense_date'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      field: 'due_date'
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      field: 'paid_date'
    },

    // Approval Workflow
    approvalStatus: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      field: 'approval_status'
    },
    approvedBy: {
      type: DataTypes.UUID,
      field: 'approved_by'
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason'
    },

    // QuickBooks Integration
    qboExpenseId: {
      type: DataTypes.STRING(100),
      field: 'qbo_expense_id'
    },
    qboSyncedAt: {
      type: DataTypes.DATE,
      field: 'qbo_synced_at'
    },
    accountCode: {
      type: DataTypes.STRING(50),
      field: 'account_code'
    },
    accountName: {
      type: DataTypes.STRING(255),
      field: 'account_name'
    },

    // Attachments
    receiptUrl: {
      type: DataTypes.STRING(500),
      field: 'receipt_url'
    },
    attachments: {
      type: DataTypes.JSONB
    },

    // Metadata
    notes: {
      type: DataTypes.TEXT
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    // Audit
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    }
  }, {
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['repair_order_id'] },
      { fields: ['vendor_id'] },
      { fields: ['expense_date'] },
      { fields: ['expense_type'] },
      { fields: ['category'] },
      { fields: ['payment_status'] },
      { fields: ['approval_status'] }
    ]
  });

  // Class methods
  Expense.generateExpenseNumber = async function() {
    const year = new Date().getFullYear();
    const count = await this.count({
      where: {
        expenseNumber: {
          [sequelize.Sequelize.Op.like]: `EXP-${year}-%`
        }
      }
    });
    return `EXP-${year}-${String(count + 1).padStart(5, '0')}`;
  };

  // Instance methods
  Expense.prototype.isJobCost = function() {
    return this.expenseType === 'job_cost';
  };

  Expense.prototype.isOperating = function() {
    return this.expenseType === 'operating';
  };

  Expense.prototype.canApprove = function() {
    return this.approvalStatus === 'pending';
  };

  Expense.prototype.isOverdue = function() {
    if (!this.dueDate || this.paymentStatus === 'paid') {
      return false;
    }
    return new Date(this.dueDate) < new Date() && this.paymentStatus === 'unpaid';
  };

  Expense.prototype.approve = async function(userId) {
    this.approvalStatus = 'approved';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    return await this.save();
  };

  Expense.prototype.reject = async function(userId, reason) {
    this.approvalStatus = 'rejected';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    this.rejectionReason = reason;
    return await this.save();
  };

  Expense.prototype.recordPayment = async function(amount, paymentMethod, reference) {
    this.paidAmount = parseFloat(this.paidAmount || 0) + parseFloat(amount);
    this.paymentMethod = paymentMethod;
    this.paymentReference = reference;

    if (this.paidAmount >= parseFloat(this.totalAmount)) {
      this.paymentStatus = 'paid';
      this.paidDate = new Date();
    } else if (this.paidAmount > 0) {
      this.paymentStatus = 'partial';
    }

    return await this.save();
  };

  return Expense;
};
