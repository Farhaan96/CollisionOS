const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RepairOrderManagement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Parent References
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'shops', key: 'id' }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'customers', key: 'id' }
    },
    vehicleProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vehicle_profiles', key: 'id' }
    },
    claimManagementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'claim_management', key: 'id' }
    },
    estimateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'estimates', key: 'id' }
    },
    
    // RO Identification
    repairOrderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Shop generated RO number'
    },
    internalReferenceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Internal tracking reference'
    },
    
    // RO Status and Workflow
    roStatus: {
      type: DataTypes.ENUM(
        'draft', 'estimate_pending', 'estimate_approved', 'parts_ordered', 
        'parts_hold', 'in_production', 'quality_control', 'supplement_pending',
        'supplement_approved', 'customer_approval', 'ready_for_delivery', 
        'completed', 'delivered', 'invoiced', 'paid', 'archived', 'cancelled'
      ),
      defaultValue: 'draft'
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statusChangeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statusChangeReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    statusChangedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Important Dates
    dateCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    dateEstimateApproved: {
      type: DataTypes.DATE,
      allowNull: true
    },
    datePartsOrdered: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dateProductionStarted: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dateQCCompleted: {
      type: DataTypes.DATE,
      allowNull: true
    },
    promisedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Hold Management
    isOnHold: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    holdStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    holdEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    holdReason: {
      type: DataTypes.ENUM(
        'parts_delay', 'insurance_approval', 'customer_approval', 'supplement_review',
        'sublet_delay', 'technician_unavailable', 'equipment_down', 'material_shortage',
        'quality_issue', 'customer_request', 'payment_issue', 'other'
      ),
      allowNull: true
    },
    holdDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    holdDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total days on hold'
    },
    
    // SLA Management
    slaType: {
      type: DataTypes.ENUM('standard', 'priority', 'express', 'fleet', 'insurance_sla'),
      defaultValue: 'standard'
    },
    targetCompletionDays: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isOverdue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    overdueBy: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Days overdue'
    },
    slaRiskLevel: {
      type: DataTypes.ENUM('green', 'yellow', 'red', 'critical'),
      defaultValue: 'green'
    },
    
    // Status Badges and Flags
    isRush: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPriority: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    requiresSpecialHandling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasComplications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    complicationDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Assignment and Responsibility
    primaryTechnician: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    assignedEstimator: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    assignedSalesRep: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    qcInspector: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Financial Summary
    estimatedTotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    approvedTotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    invoicedTotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    balanceDue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    
    // Tax Breakdown
    partsCost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    laborCost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    materialsCost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    subletCost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    
    taxableAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    pstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    gstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    hstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    totalTaxes: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    
    // Customer Payment Information
    customerPortionDue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    insurancePortionDue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    deductibleAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    deductibleCollected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Supplement Tracking
    supplementCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalSupplementAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    lastSupplementDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    supplementsPending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Parts Status
    partsOrderedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partsReceivedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partsPendingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partsBackorderedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    allPartsReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    nextPartExpectedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Production Tracking
    productionStage: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    productionPercentComplete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    hoursEstimated: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    hoursActual: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    efficiencyRatio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Actual/Estimated hours'
    },
    
    // Quality Control
    qcRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    qcCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    qcDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    qcPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    qcNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requiresRework: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reworkReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Customer Communication
    lastCustomerContact: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextScheduledContact: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customerSatisfactionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    
    // ADAS and Calibration
    requiresADASCalibration: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    adasCalibrationCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    adasCalibrationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    adasCalibrationNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Environmental and Safety
    hazardousMaterialsPresent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hazmatDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    safetyPrecautions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Storage Information
    storageLocation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    internalStorageCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    
    // External Services (Sublets)
    requiresSublets: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subletServicesDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subletCostsApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Document Management
    estimateDocumentPath: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    photoCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hasBeforePhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasAfterPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasProgressPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Warranty and Follow-up
    warrantyProvided: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    warrantyPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Warranty period in months'
    },
    warrantyStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    warrantyEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Notes and Comments
    roNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatorNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    technicianNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Compliance and Tracking
    complianceChecklist: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON checklist of compliance items'
    },
    complianceComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Audit Fields
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'repair_order_management',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['vehicleProfileId'] },
      { fields: ['claimManagementId'] },
      { fields: ['estimateId'] },
      { fields: ['repairOrderNumber'], unique: true },
      { fields: ['roStatus'] },
      { fields: ['isOnHold'] },
      { fields: ['isOverdue'] },
      { fields: ['slaRiskLevel'] },
      { fields: ['isRush', 'isPriority'] },
      { fields: ['primaryTechnician'] },
      { fields: ['assignedEstimator'] },
      { fields: ['productionStage'] },
      { fields: ['promisedDeliveryDate'] },
      { fields: ['actualDeliveryDate'] },
      { fields: ['allPartsReceived'] },
      { fields: ['qcRequired', 'qcCompleted'] },
      { fields: ['requiresADASCalibration'] },
      { fields: ['createdAt'] },
      { fields: ['customerId', 'createdAt'] },
      { fields: ['roStatus', 'createdAt'] }
    ]
  });
};