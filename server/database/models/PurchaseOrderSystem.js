const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'PurchaseOrderSystem',
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
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
      },

      // PO Identification - Advanced Numbering System
      purchaseOrderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Format: ${RO}-${YYMM}-${VENDORCODE}-${seq}',
      },
      roNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'RO number component',
      },
      yearMonth: {
        type: DataTypes.STRING(4),
        allowNull: false,
        comment: 'YYMM format',
      },
      vendorCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Vendor short code',
      },
      sequenceNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Sequential number for this RO/vendor/month',
      },

      // PO Status and Workflow
      poStatus: {
        type: DataTypes.ENUM(
          'draft',
          'pending_approval',
          'approved',
          'sent',
          'acknowledged',
          'partial_received',
          'fully_received',
          'cancelled',
          'closed',
          'disputed'
        ),
        defaultValue: 'draft',
      },
      previousStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      statusChangeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusChangeReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      statusChangedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },

      // Important Dates
      poDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      requestedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      promisedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastModificationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Vendor Information
      vendorName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      vendorContact: {
        type: DataTypes.STRING(255),
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
      vendorFax: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // Delivery Information
      deliveryMethod: {
        type: DataTypes.ENUM(
          'pickup',
          'delivery',
          'ship_ground',
          'ship_air',
          'ship_overnight',
          'courier'
        ),
        defaultValue: 'delivery',
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      shippingAccount: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'UPS, FedEx account number',
      },

      // Payment Terms
      paymentTerms: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Net 30, COD, etc.',
      },
      paymentTermsCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      discountTerms: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '2/10 Net 30, etc.',
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      discountDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // Financial Totals
      subtotalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      handlingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },

      // Line Item Summary
      totalLineItems: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        defaultValue: 0.0,
      },

      // Approval Workflow
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvalThreshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      approvedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      rejectedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Transmission Information
      transmissionMethod: {
        type: DataTypes.ENUM(
          'email',
          'fax',
          'phone',
          'portal',
          'edi',
          'mail',
          'hand_delivery'
        ),
        allowNull: true,
      },
      sentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sentBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      acknowledgmentReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      acknowledgmentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      vendorConfirmationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Receiving Tracking
      receivingStatus: {
        type: DataTypes.ENUM(
          'not_started',
          'partial',
          'complete',
          'over_received',
          'discrepancy'
        ),
        defaultValue: 'not_started',
      },
      firstReceiptDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastReceiptDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalReceived: {
        type: DataTypes.DECIMAL(12, 3),
        defaultValue: 0.0,
      },
      percentReceived: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },

      // Partial Receiving
      allowPartialReceiving: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      partialShipments: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      backorderedItems: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      cancelledItems: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Quality Control
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
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      inspectionPassed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      qualityIssues: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Expediting and Rush Orders
      isRushOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rushReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expediteRequested: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      expediteFee: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      expediteApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Tracking Information
      trackingNumbers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of tracking numbers',
      },
      carrier: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      shippingMethod: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliverySignature: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // Budget and Cost Control
      budgetCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      departmentCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      projectCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      costCenter: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Contract and Agreement Information
      contractNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      agreementType: {
        type: DataTypes.ENUM('standard', 'blanket', 'contract', 'spot_buy'),
        defaultValue: 'spot_buy',
      },
      blanketOrderNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contractExpiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Environmental and Compliance
      requiresMSDS: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hazardousMaterials: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      complianceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      certificationRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      certificationReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Returns and Adjustments
      returnsAllowed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      returnDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      restockingFee: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      returnedItems: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      adjustmentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      adjustmentReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Communication Log
      communicationCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastContactDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastContactMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vendorResponseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Average response time in hours',
      },

      // Performance Metrics
      onTimeDelivery: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      deliveryVariance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Days early/late (negative = early)',
      },
      accuracyRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage of items received correctly',
      },
      vendorRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 },
      },

      // Recurring Order Information
      isRecurringOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurringFrequency: {
        type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'annually'),
        allowNull: true,
      },
      nextRecurringDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      parentOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'purchase_order_system', key: 'id' },
      },

      // Integration and EDI
      ediCapable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ediDocumentNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      externalSystemId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      syncStatus: {
        type: DataTypes.ENUM(
          'not_synced',
          'synced',
          'sync_error',
          'pending_sync'
        ),
        defaultValue: 'not_synced',
      },
      lastSyncDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Document Management
      attachmentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      hasQuote: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hasContract: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hasConfirmation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hasInvoice: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Special Instructions
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryInstructionsSpecial: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      packingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      handlingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Internal References
      requestedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      authorizedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      buyerAssigned: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },

      // Notes and Comments
      poNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      vendorNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      receivingNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Audit Fields
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
    },
    {
      tableName: 'purchase_order_system',
      timestamps: true,
      indexes: [
        { fields: ['shopId'] },
        { fields: ['repairOrderId'] },
        { fields: ['vendorId'] },
        { fields: ['purchaseOrderNumber'], unique: true },
        { fields: ['roNumber'] },
        { fields: ['yearMonth'] },
        { fields: ['vendorCode'] },
        { fields: ['poStatus'] },
        { fields: ['poDate'] },
        { fields: ['requestedDeliveryDate'] },
        { fields: ['promisedDeliveryDate'] },
        { fields: ['actualDeliveryDate'] },
        { fields: ['approvedBy'] },
        { fields: ['approvedDate'] },
        { fields: ['sentDate'] },
        { fields: ['receivingStatus'] },
        { fields: ['isRushOrder'] },
        { fields: ['requiresApproval'] },
        { fields: ['totalAmount'] },
        { fields: ['onTimeDelivery'] },
        { fields: ['vendorRating'] },
        { fields: ['createdAt'] },
        { fields: ['repairOrderId', 'vendorId'] },
        { fields: ['poStatus', 'requestedDeliveryDate'] },
        { fields: ['vendorId', 'poDate'] },
      ],
    }
  );
};
