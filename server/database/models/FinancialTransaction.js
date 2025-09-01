const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const FinancialTransaction = sequelize.define(
    'FinancialTransaction',
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
      // Related records
      jobId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      invoiceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'invoices',
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
      partsOrderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'parts_orders',
          key: 'id',
        },
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
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
      // Transaction identification
      transactionNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      externalTransactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      referenceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Transaction details
      transactionType: {
        type: DataTypes.ENUM(
          'payment_received',
          'payment_sent',
          'refund_issued',
          'refund_received',
          'adjustment',
          'fee',
          'discount',
          'tax',
          'interest',
          'penalty',
          'chargeback',
          'dispute',
          'settlement',
          'writeoff',
          'other'
        ),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'customer_payment',
          'insurance_payment',
          'vendor_payment',
          'employee_payment',
          'tax_payment',
          'fee_payment',
          'refund',
          'adjustment',
          'other'
        ),
        allowNull: false,
      },
      subCategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Financial amounts
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      exchangeRate: {
        type: DataTypes.DECIMAL(10, 6),
        defaultValue: 1.0,
      },
      baseAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true, // Amount in shop's base currency
      },
      // Payment method details
      paymentMethod: {
        type: DataTypes.ENUM(
          'cash',
          'check',
          'credit_card',
          'debit_card',
          'bank_transfer',
          'ach',
          'wire_transfer',
          'paypal',
          'stripe',
          'square',
          'financing',
          'insurance_direct',
          'other'
        ),
        allowNull: false,
      },
      paymentDetails: {
        type: DataTypes.JSONB,
        defaultValue: {}, // Card last 4, check number, etc.
      },
      // Status and processing
      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'completed',
          'failed',
          'cancelled',
          'disputed',
          'refunded',
          'partially_refunded',
          'reversed',
          'settled'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      processingStatus: {
        type: DataTypes.ENUM(
          'queued',
          'processing',
          'processed',
          'failed',
          'retry'
        ),
        defaultValue: 'queued',
      },
      // Dates and timing
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      effectiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      processedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      settledDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Fees and costs
      processingFee: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.0,
      },
      merchantFee: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.0,
      },
      bankFee: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.0,
      },
      otherFees: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.0,
      },
      totalFees: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.0,
      },
      netAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      // Tax information
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
      },
      taxExempt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      taxDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Account and ledger
      debitAccount: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      creditAccount: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      glCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      costCenter: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Authorization and security
      authorizationCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      approvalCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      securityCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
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
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Recurring and scheduled
      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurringFrequency: {
        type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'annually'),
        allowNull: true,
      },
      nextRecurrenceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      recurringEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      parentTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'financial_transactions',
          key: 'id',
        },
      },
      // Split and partial payments
      isSplit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      splitTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      splitSequence: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      splitCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Dispute and chargeback
      isDisputed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      disputeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      disputeReason: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      disputeAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      disputeResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      disputeResolutionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Refund tracking
      originalTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'financial_transactions',
          key: 'id',
        },
      },
      refundAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      refundableAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      refundReason: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      // Integration and sync
      externalSystemName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      externalSystemId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      syncStatus: {
        type: DataTypes.ENUM('pending', 'synced', 'failed', 'not_applicable'),
        defaultValue: 'pending',
      },
      lastSyncDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      syncData: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Reconciliation
      reconciledDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bankStatementDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bankReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isReconciled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reconciliationDifference: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      // Audit trail
      transactionHistory: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of status changes and modifications
      },
      errorLog: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of processing errors
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },
      // Description and notes
      description: {
        type: DataTypes.STRING(500),
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
      // Tags and classification
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      businessPurpose: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      projectCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // System fields
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reconciledBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'financial_transactions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['transactionNumber'],
        },
        {
          fields: ['shopId'],
        },
        {
          fields: ['jobId'],
        },
        {
          fields: ['customerId'],
        },
        {
          fields: ['invoiceId'],
        },
        {
          fields: ['vendorId'],
        },
        {
          fields: ['insuranceCompanyId'],
        },
        {
          fields: ['transactionType'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['paymentMethod'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['transactionDate'],
        },
        {
          fields: ['processedDate'],
        },
        {
          fields: ['settledDate'],
        },
        {
          fields: ['dueDate'],
        },
        {
          fields: ['amount'],
        },
        {
          fields: ['externalTransactionId'],
        },
        {
          fields: ['referenceNumber'],
        },
        {
          fields: ['authorizationCode'],
        },
        {
          fields: ['approved'],
        },
        {
          fields: ['isReconciled'],
        },
        {
          fields: ['syncStatus'],
        },
        {
          fields: ['isDisputed'],
        },
        {
          fields: ['originalTransactionId'],
        },
        {
          fields: ['parentTransactionId'],
        },
        {
          name: 'transaction_date_range',
          fields: ['shopId', 'transactionDate', 'amount'],
        },
        {
          name: 'customer_transactions',
          fields: ['customerId', 'transactionDate', 'status'],
        },
        {
          name: 'job_financial_summary',
          fields: ['jobId', 'transactionType', 'status', 'amount'],
        },
        {
          name: 'payment_method_analysis',
          fields: ['paymentMethod', 'transactionDate', 'amount'],
        },
        {
          name: 'reconciliation_queue',
          fields: ['isReconciled', 'transactionDate', 'amount'],
        },
      ],
      hooks: {
        beforeCreate: transaction => {
          // Generate transaction number if not provided
          if (!transaction.transactionNumber) {
            transaction.transactionNumber = generateTransactionNumber(
              transaction.transactionType
            );
          }

          // Calculate net amount
          transaction.netAmount = calculateNetAmount(transaction);

          // Set effective date if not provided
          if (!transaction.effectiveDate) {
            transaction.effectiveDate =
              transaction.transactionDate || new Date();
          }

          // Calculate base currency amount if different
          if (
            transaction.currency !== 'USD' &&
            transaction.exchangeRate !== 1.0
          ) {
            transaction.baseAmount = (
              parseFloat(transaction.amount) *
              parseFloat(transaction.exchangeRate)
            ).toFixed(2);
          }
        },
        beforeUpdate: transaction => {
          // Update status timestamps
          if (transaction.changed('status')) {
            const now = new Date();

            switch (transaction.status) {
              case 'processing':
                if (!transaction.processedDate) transaction.processedDate = now;
                break;
              case 'completed':
                if (!transaction.processedDate) transaction.processedDate = now;
                if (!transaction.settledDate) transaction.settledDate = now;
                break;
              case 'settled':
                if (!transaction.settledDate) transaction.settledDate = now;
                break;
            }

            // Add to history
            transaction.transactionHistory = [
              ...(transaction.transactionHistory || []),
              {
                timestamp: now,
                field: 'status',
                oldValue: transaction._previousDataValues?.status,
                newValue: transaction.status,
                user: transaction.processedBy,
              },
            ];
          }

          // Update approval timestamp
          if (
            transaction.changed('approved') &&
            transaction.approved &&
            !transaction.approvedAt
          ) {
            transaction.approvedAt = new Date();
          }

          // Recalculate net amount if fees changed
          const feeFields = [
            'processingFee',
            'merchantFee',
            'bankFee',
            'otherFees',
          ];
          if (feeFields.some(field => transaction.changed(field))) {
            transaction.netAmount = calculateNetAmount(transaction);
          }

          // Update dispute status
          if (
            transaction.changed('isDisputed') &&
            transaction.isDisputed &&
            !transaction.disputeDate
          ) {
            transaction.disputeDate = new Date();
          }

          // Update reconciliation
          if (
            transaction.changed('isReconciled') &&
            transaction.isReconciled &&
            !transaction.reconciledDate
          ) {
            transaction.reconciledDate = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  FinancialTransaction.prototype.getStatusColor = function () {
    const colors = {
      pending: '#F39C12',
      processing: '#3498DB',
      completed: '#2ECC71',
      failed: '#E74C3C',
      cancelled: '#95A5A6',
      disputed: '#E67E22',
      refunded: '#9B59B6',
      partially_refunded: '#8E44AD',
      reversed: '#C0392B',
      settled: '#27AE60',
    };
    return colors[this.status] || '#95A5A6';
  };

  FinancialTransaction.prototype.getTypeColor = function () {
    const colors = {
      payment_received: '#2ECC71',
      payment_sent: '#E74C3C',
      refund_issued: '#9B59B6',
      refund_received: '#3498DB',
      adjustment: '#F39C12',
      fee: '#E67E22',
      discount: '#1ABC9C',
      tax: '#34495E',
      interest: '#16A085',
      penalty: '#C0392B',
      chargeback: '#8E44AD',
      dispute: '#E67E22',
      settlement: '#27AE60',
      writeoff: '#7F8C8D',
      other: '#95A5A6',
    };
    return colors[this.transactionType] || '#95A5A6';
  };

  FinancialTransaction.prototype.isIncoming = function () {
    return ['payment_received', 'refund_received', 'settlement'].includes(
      this.transactionType
    );
  };

  FinancialTransaction.prototype.isOutgoing = function () {
    return ['payment_sent', 'refund_issued', 'fee', 'penalty'].includes(
      this.transactionType
    );
  };

  FinancialTransaction.prototype.isPending = function () {
    return ['pending', 'processing'].includes(this.status);
  };

  FinancialTransaction.prototype.isCompleted = function () {
    return ['completed', 'settled'].includes(this.status);
  };

  FinancialTransaction.prototype.isFailed = function () {
    return ['failed', 'cancelled', 'disputed'].includes(this.status);
  };

  FinancialTransaction.prototype.canBeRefunded = function () {
    return (
      this.isCompleted() &&
      this.isIncoming() &&
      parseFloat(this.refundableAmount || this.amount) > 0
    );
  };

  FinancialTransaction.prototype.canBeDisputed = function () {
    return this.isCompleted() && !this.isDisputed;
  };

  FinancialTransaction.prototype.needsApproval = function () {
    return this.requiresApproval && !this.approved;
  };

  FinancialTransaction.prototype.needsReconciliation = function () {
    return this.isCompleted() && !this.isReconciled;
  };

  FinancialTransaction.prototype.canRetry = function () {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  };

  FinancialTransaction.prototype.getProcessingTime = function () {
    if (!this.createdAt || !this.processedDate) return null;

    const created = new Date(this.createdAt);
    const processed = new Date(this.processedDate);

    return Math.round((processed - created) / (1000 * 60)); // minutes
  };

  FinancialTransaction.prototype.getSettlementTime = function () {
    if (!this.processedDate || !this.settledDate) return null;

    const processed = new Date(this.processedDate);
    const settled = new Date(this.settledDate);

    return Math.round((settled - processed) / (1000 * 60 * 60 * 24)); // days
  };

  FinancialTransaction.prototype.getEffectiveAmount = function () {
    return this.isIncoming()
      ? parseFloat(this.netAmount || this.amount)
      : -parseFloat(this.netAmount || this.amount);
  };

  FinancialTransaction.prototype.getFeePercentage = function () {
    if (!this.amount || parseFloat(this.amount) === 0) return 0;

    return (
      (parseFloat(this.totalFees || 0) / parseFloat(this.amount)) *
      100
    ).toFixed(2);
  };

  FinancialTransaction.prototype.addToHistory = function (
    field,
    oldValue,
    newValue,
    userId = null
  ) {
    const history = this.transactionHistory || [];
    history.push({
      timestamp: new Date(),
      field: field,
      oldValue: oldValue,
      newValue: newValue,
      user: userId,
    });

    return this.update({ transactionHistory: history });
  };

  FinancialTransaction.prototype.logError = function (error, context = {}) {
    const errorLog = this.errorLog || [];
    errorLog.push({
      timestamp: new Date(),
      error: error.message || error,
      stack: error.stack,
      context: context,
      retryCount: this.retryCount,
    });

    return this.update({
      errorLog: errorLog,
      retryCount: this.retryCount + 1,
    });
  };

  FinancialTransaction.prototype.markAsReconciled = function (bankData = {}) {
    return this.update({
      isReconciled: true,
      reconciledDate: new Date(),
      bankStatementDate: bankData.statementDate,
      bankReference: bankData.reference,
      reconciliationDifference: bankData.difference || 0,
    });
  };

  // Class methods
  FinancialTransaction.generateTransactionNumber = generateTransactionNumber;

  return FinancialTransaction;
};

// Helper function to generate transaction number
function generateTransactionNumber(type) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  const typePrefix = {
    payment_received: 'PR',
    payment_sent: 'PS',
    refund_issued: 'RI',
    refund_received: 'RR',
    adjustment: 'ADJ',
    fee: 'FEE',
    discount: 'DIS',
    tax: 'TAX',
    interest: 'INT',
    penalty: 'PEN',
    chargeback: 'CB',
    dispute: 'DPT',
    settlement: 'SET',
    writeoff: 'WO',
  };

  const prefix = typePrefix[type] || 'TXN';
  return `${prefix}-${year}${month}${day}-${random}`;
}

// Helper function to calculate net amount
function calculateNetAmount(transaction) {
  const amount = parseFloat(transaction.amount || 0);
  const processingFee = parseFloat(transaction.processingFee || 0);
  const merchantFee = parseFloat(transaction.merchantFee || 0);
  const bankFee = parseFloat(transaction.bankFee || 0);
  const otherFees = parseFloat(transaction.otherFees || 0);

  const totalFees = processingFee + merchantFee + bankFee + otherFees;
  transaction.totalFees = totalFees.toFixed(2);

  return (amount - totalFees).toFixed(2);
}
