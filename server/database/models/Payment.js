/**
 * Payment Model - CollisionOS
 *
 * Represents payment transactions for invoices
 * Supports multiple payment types: cash, credit card, check, insurance
 * Integrates with Stripe for credit card processing
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
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
      field: 'repair_order_id',
      references: {
        model: 'repair_orders',
        key: 'id'
      }
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'invoice_id'
    },

    // Payment Details
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'payment_number'
    },
    paymentType: {
      type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'check', 'insurance', 'wire_transfer', 'ach'),
      allowNull: false,
      field: 'payment_type'
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status'
    },

    // Amounts
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    processingFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'processing_fee'
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },

    // Payment Gateway Details
    gatewayTransactionId: {
      type: DataTypes.STRING(255),
      field: 'gateway_transaction_id'
    },
    gatewayReference: {
      type: DataTypes.STRING(255),
      field: 'gateway_reference'
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      field: 'gateway_response'
    },

    // Check Details
    checkNumber: {
      type: DataTypes.STRING(50),
      field: 'check_number'
    },
    checkDate: {
      type: DataTypes.DATEONLY,
      field: 'check_date'
    },
    bankName: {
      type: DataTypes.STRING(255),
      field: 'bank_name'
    },

    // Credit Card Details (tokenized)
    cardLastFour: {
      type: DataTypes.STRING(4),
      field: 'card_last_four'
    },
    cardBrand: {
      type: DataTypes.STRING(50),
      field: 'card_brand'
    },
    cardToken: {
      type: DataTypes.STRING(255),
      field: 'card_token'
    },

    // Insurance Payment Details
    insuranceCompanyId: {
      type: DataTypes.UUID,
      field: 'insurance_company_id'
    },
    claimNumber: {
      type: DataTypes.STRING(100),
      field: 'claim_number'
    },
    eobReference: {
      type: DataTypes.STRING(100),
      field: 'eob_reference'
    },

    // Metadata
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'payment_date'
    },
    appliedDate: {
      type: DataTypes.DATE,
      field: 'applied_date'
    },
    notes: {
      type: DataTypes.TEXT
    },
    receiptUrl: {
      type: DataTypes.STRING(500),
      field: 'receipt_url'
    },
    receiptGeneratedAt: {
      type: DataTypes.DATE,
      field: 'receipt_generated_at'
    },

    // QuickBooks Integration
    qboPaymentId: {
      type: DataTypes.STRING(100),
      field: 'qbo_payment_id'
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
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['repair_order_id'] },
      { fields: ['invoice_id'] },
      { fields: ['payment_date'] },
      { fields: ['payment_status'] },
      { fields: ['payment_type'] },
      { fields: ['gateway_transaction_id'] }
    ]
  });

  // Class methods
  Payment.generatePaymentNumber = async function() {
    const year = new Date().getFullYear();
    const count = await this.count({
      where: {
        paymentNumber: {
          [sequelize.Sequelize.Op.like]: `PAY-${year}-%`
        }
      }
    });
    return `PAY-${year}-${String(count + 1).padStart(5, '0')}`;
  };

  // Instance methods
  Payment.prototype.isCompleted = function() {
    return this.paymentStatus === 'completed';
  };

  Payment.prototype.canRefund = function() {
    return this.paymentStatus === 'completed' && this.paymentType === 'credit_card';
  };

  return Payment;
};
