/**
 * Invoice Model (Enhanced) - CollisionOS Phase 2
 *
 * Enhanced invoice model with financial integration features
 * Supports multiple invoice types, payment tracking, and QuickBooks sync
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InvoiceEnhanced = sequelize.define('InvoiceEnhanced', {
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
    repairOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'repair_order_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id'
    },

    // Invoice Details
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'invoice_number'
    },
    invoiceType: {
      type: DataTypes.ENUM('standard', 'estimate', 'supplement', 'final', 'credit_memo'),
      defaultValue: 'standard',
      field: 'invoice_type'
    },
    invoiceStatus: {
      type: DataTypes.ENUM('draft', 'pending', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'void'),
      defaultValue: 'draft',
      field: 'invoice_status'
    },

    // Amounts
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'tax_rate'
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'discount_amount'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'paid_amount'
    },
    balanceDue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'balance_due'
    },

    // Breakdown
    laborTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'labor_total'
    },
    partsTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'parts_total'
    },
    subletTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'sublet_total'
    },

    // Insurance
    insuranceCompanyId: {
      type: DataTypes.UUID,
      field: 'insurance_company_id'
    },
    claimNumber: {
      type: DataTypes.STRING(100),
      field: 'claim_number'
    },
    deductibleAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'deductible_amount'
    },

    // Dates
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'invoice_date'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      field: 'due_date'
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      field: 'paid_date'
    },

    // Payment Terms
    paymentTerms: {
      type: DataTypes.ENUM('due_on_receipt', 'net15', 'net30', 'net45', 'net60'),
      defaultValue: 'net30',
      field: 'payment_terms'
    },

    // Notes
    notes: {
      type: DataTypes.TEXT
    },

    // QuickBooks
    qboInvoiceId: {
      type: DataTypes.STRING(100),
      field: 'qbo_invoice_id'
    },
    qboSyncedAt: {
      type: DataTypes.DATE,
      field: 'qbo_synced_at'
    },

    // Audit
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true
  });

  return InvoiceEnhanced;
};
