const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'AutomatedPurchaseOrder',
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
      selectedQuoteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'vendor_part_quotes', key: 'id' },
      },
      repairOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'repair_order_management', key: 'id' },
      },
      claimManagementId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'claim_management', key: 'id' },
      },

      // Purchase Order Information
      purchaseOrderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Auto-generated PO number: RO-YYMM-VENDOR-SEQ',
      },
      vendorPoNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'PO number assigned by vendor',
      },
      orderType: {
        type: DataTypes.ENUM(
          'standard',
          'rush',
          'blanket',
          'drop_ship',
          'special_order',
          'stock_order',
          'emergency'
        ),
        defaultValue: 'standard',
      },
      automationType: {
        type: DataTypes.ENUM(
          'fully_automated',
          'auto_with_approval',
          'assisted',
          'manual_review',
          'manual_only'
        ),
        allowNull: false,
      },

      // Order Status and Workflow
      orderStatus: {
        type: DataTypes.ENUM(
          'pending_approval',
          'approved',
          'sent_to_vendor',
          'acknowledged',
          'in_progress',
          'partially_received',
          'completed',
          'cancelled',
          'rejected',
          'on_hold',
          'disputed'
        ),
        defaultValue: 'pending_approval',
      },
      workflowStage: {
        type: DataTypes.ENUM(
          'created',
          'approval_pending',
          'approved',
          'transmitted',
          'acknowledged',
          'processing',
          'shipped',
          'delivered',
          'invoiced',
          'closed'
        ),
        defaultValue: 'created',
      },
      approvalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this PO requires manual approval',
      },
      approvalThreshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Dollar threshold that triggered approval requirement',
      },

      // Timing Information
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the PO was approved',
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the PO was sent to vendor',
      },
      acknowledgedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When vendor acknowledged the PO',
      },
      expectedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Expected delivery date',
      },
      promisedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Delivery date promised by vendor',
      },
      actualDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Actual delivery date',
      },
      requestedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Requested delivery date',
      },

      // Financial Information
      subtotalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Subtotal before taxes and shipping',
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Total tax amount',
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0.00,
        comment: 'Shipping and handling charges',
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Total discount applied',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total PO amount including all charges',
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        comment: 'Currency code',
      },

      // Automation Details
      automationRules: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with automation rules applied',
      },
      decisionFactors: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with factors that influenced automated decisions',
      },
      confidenceScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Confidence score for automated decisions (0-100)',
      },
      riskScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Risk score for this automated PO (0-100)',
      },
      qualityScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Expected quality score based on vendor history',
      },

      // Delivery and Shipping
      shippingMethod: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Shipping method selected',
      },
      shippingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special shipping instructions',
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Delivery address (JSON formatted)',
      },
      trackingNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Shipping tracking number',
      },
      isRushOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a rush order',
      },
      expediteFee: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Additional fee for expedited delivery',
      },

      // Terms and Conditions
      paymentTerms: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Payment terms (NET30, COD, etc.)',
      },
      fobTerms: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Free on Board terms',
      },
      warrantyTerms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Warranty terms and conditions',
      },
      returnPolicy: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Return policy for this order',
      },
      specialTerms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special terms and conditions',
      },

      // Approval Process
      requiresManagerApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      requiresOwnerApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvalChain: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of approval chain and status',
      },
      approvalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes from approvers',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for rejection if applicable',
      },

      // Vendor Response and Communication
      vendorAcknowledgement: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Vendor acknowledgement details (JSON)',
      },
      vendorComments: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comments from vendor',
      },
      communicationLog: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of communication history',
      },
      lastVendorContact: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last contact with vendor',
      },

      // Integration and External Systems
      transmissionMethod: {
        type: DataTypes.ENUM(
          'api',
          'edi',
          'email',
          'portal',
          'fax',
          'manual'
        ),
        allowNull: true,
        comment: 'How PO was transmitted to vendor',
      },
      transmissionStatus: {
        type: DataTypes.ENUM(
          'pending',
          'sent',
          'delivered',
          'failed',
          'retry_needed'
        ),
        defaultValue: 'pending',
      },
      transmissionAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of transmission attempts',
      },
      lastTransmissionError: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Last transmission error message',
      },
      externalSystemIds: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with external system IDs',
      },

      // Performance Tracking
      leadTimeAccuracy: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Accuracy of promised vs actual lead time',
      },
      priceAccuracy: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Accuracy of quoted vs invoiced price',
      },
      orderFillRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage of order filled completely',
      },
      onTimeDelivery: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        comment: 'Whether order was delivered on time',
      },
      customerSatisfaction: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 },
        comment: 'Customer satisfaction rating',
      },

      // Cost Analysis and Savings
      targetCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Target cost for this PO',
      },
      actualCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Actual final cost of PO',
      },
      savingsAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount saved compared to target',
      },
      savingsPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage savings achieved',
      },
      costVariance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Variance between expected and actual cost',
      },

      // Priority and Urgency
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
        defaultValue: 'normal',
      },
      urgencyReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for high priority/urgency',
      },
      customerWaiting: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether customer is waiting for this order',
      },
      impactsProductionSchedule: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether delay would impact production schedule',
      },

      // Quality Control and Inspection
      requiresInspection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether received parts require inspection',
      },
      inspectionCriteria: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with inspection criteria',
      },
      qualityRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Quality requirements for this order',
      },
      acceptanceCriteria: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Criteria for accepting delivered parts',
      },

      // Notes and Comments
      orderNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'General notes about this PO',
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes not sent to vendor',
      },
      vendorInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special instructions for vendor',
      },
      receivingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Instructions for receiving department',
      },

      // Audit Trail
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
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      sentBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      cancelledBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'automated_purchase_orders',
      timestamps: true,
      indexes: [
        { fields: ['shopId'] },
        { fields: ['sourcingRequestId'] },
        { fields: ['vendorId'] },
        { fields: ['selectedQuoteId'] },
        { fields: ['repairOrderId'] },
        { fields: ['claimManagementId'] },
        { fields: ['purchaseOrderNumber'], unique: true },
        { fields: ['vendorPoNumber'] },
        { fields: ['orderType'] },
        { fields: ['automationType'] },
        { fields: ['orderStatus'] },
        { fields: ['workflowStage'] },
        { fields: ['approvalRequired'] },
        { fields: ['priority'] },
        { fields: ['isRushOrder'] },
        { fields: ['customerWaiting'] },
        { fields: ['transmissionStatus'] },
        { fields: ['onTimeDelivery'] },
        { fields: ['createdAt'] },
        { fields: ['approvedAt'] },
        { fields: ['sentAt'] },
        { fields: ['expectedDeliveryDate'] },
        { fields: ['actualDeliveryDate'] },
        // Composite indexes for common queries
        { fields: ['shopId', 'orderStatus'] },
        { fields: ['shopId', 'createdAt'] },
        { fields: ['vendorId', 'orderStatus'] },
        { fields: ['vendorId', 'createdAt'] },
        { fields: ['repairOrderId', 'orderStatus'] },
        { fields: ['orderStatus', 'priority'] },
        { fields: ['orderStatus', 'createdAt'] },
        { fields: ['approvalRequired', 'orderStatus'] },
        { fields: ['workflowStage', 'createdAt'] },
        { fields: ['transmissionStatus', 'transmissionAttempts'] },
        { fields: ['customerWaiting', 'priority'] },
        { fields: ['expectedDeliveryDate', 'orderStatus'] },
        { fields: ['automationType', 'confidenceScore'] },
      ],
    }
  );
};