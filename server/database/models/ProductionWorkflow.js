const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ProductionWorkflow', {
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
    repairOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'repair_order_management', key: 'id' }
    },
    productionStageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'production_stages', key: 'id' }
    },
    
    // Stage Information
    stageName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Current production stage name'
    },
    stageOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Order in production workflow'
    },
    stageType: {
      type: DataTypes.ENUM(
        'intake', 'blueprint', 'disassembly', 'parts_hold', 'frame_repair',
        'body_work', 'prep_prime', 'paint_booth', 'paint_finish', 'denib_polish',
        'mechanical_repair', 'assembly', 'adas_calibration', 'final_qc', 
        'detail_cleanup', 'pre_delivery_inspection', 'customer_walkthrough', 'delivery'
      ),
      allowNull: false
    },
    stageCategory: {
      type: DataTypes.ENUM('structural', 'body', 'paint', 'mechanical', 'assembly', 'quality', 'delivery'),
      allowNull: false
    },
    
    // Stage Status
    stageStatus: {
      type: DataTypes.ENUM('pending', 'ready', 'in_progress', 'on_hold', 'completed', 'bypassed', 'failed', 'rework'),
      defaultValue: 'pending'
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
    
    // Timing Information
    plannedStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    plannedEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    plannedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Planned duration in minutes'
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual duration in minutes'
    },
    elapsedTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Resource Assignment
    assignedTechnician: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    backupTechnician: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    requiredSkills: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of required skills'
    },
    certificationRequired: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of required certifications'
    },
    
    // Equipment and Bay Assignment
    assignedBay: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    bayType: {
      type: DataTypes.ENUM('general', 'frame', 'paint_booth', 'prep_station', 'assembly', 'alignment'),
      allowNull: true
    },
    requiredEquipment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of required equipment'
    },
    equipmentAssigned: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of assigned equipment'
    },
    
    // Stage Dependencies
    dependsOnStages: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of stage IDs this depends on'
    },
    blockedByStages: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of stage IDs blocking this'
    },
    blockingStages: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of stage IDs this is blocking'
    },
    
    // Quality Control
    qcRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    qcCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    qcDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    qcInspector: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    qcPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    qcNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qcPhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of photo paths'
    },
    
    // Checklist Management
    hasChecklist: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    checklistItems: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of checklist items'
    },
    checklistCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    checklistProgress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
      comment: 'Checklist completion percentage'
    },
    
    // Progress Tracking
    progressPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Hold and Delay Management
    onHold: {
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
        'parts_delay', 'technician_unavailable', 'equipment_down', 'customer_approval',
        'insurance_approval', 'material_shortage', 'quality_issue', 'rework_required',
        'sublet_delay', 'environmental', 'safety_concern', 'other'
      ),
      allowNull: true
    },
    holdDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    holdDurationMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Rework Management
    requiresRework: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reworkReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reworkCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reworkDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    originalWorkOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'production_workflow', key: 'id' }
    },
    
    // Photo Documentation
    requiresPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    photoRequirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of required photo types'
    },
    beforePhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of before photo paths'
    },
    progressPhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of progress photo paths'
    },
    afterPhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of after photo paths'
    },
    photoCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Material and Supplies
    materialsRequired: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of required materials'
    },
    materialsUsed: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of materials actually used'
    },
    materialsCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    
    // Labor Tracking
    estimatedHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    actualHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    laborRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    laborCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    efficiencyRatio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Actual hours / Estimated hours'
    },
    
    // Environmental Conditions
    temperatureRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Required temperature in Celsius'
    },
    humidityRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Required humidity percentage'
    },
    environmentalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Customer Interaction
    requiresCustomerApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customerApprovalReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customerApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customerNotificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customerNotificationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Priority and Urgency
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
      defaultValue: 'normal'
    },
    isRush: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    rushReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Performance Metrics
    firstTimeRight: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    qualityScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    customerSatisfactionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    
    // Stage Notes
    stageNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    technicianNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    supervisorNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerVisibleNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Integration and Automation
    triggeredBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'What triggered this stage (manual, automatic, schedule, etc.)'
    },
    automationRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON of automation rules for this stage'
    },
    webhooksTriggered: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of webhooks triggered'
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
    tableName: 'production_workflow',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['repairOrderId'] },
      { fields: ['productionStageId'] },
      { fields: ['stageName'] },
      { fields: ['stageOrder'] },
      { fields: ['stageType'] },
      { fields: ['stageCategory'] },
      { fields: ['stageStatus'] },
      { fields: ['assignedTechnician'] },
      { fields: ['assignedBay'] },
      { fields: ['plannedStartDate'] },
      { fields: ['actualStartDate'] },
      { fields: ['plannedEndDate'] },
      { fields: ['actualEndDate'] },
      { fields: ['onHold'] },
      { fields: ['isCompleted'] },
      { fields: ['requiresRework'] },
      { fields: ['qcRequired', 'qcCompleted'] },
      { fields: ['priority'] },
      { fields: ['isRush'] },
      { fields: ['createdAt'] },
      { fields: ['repairOrderId', 'stageOrder'] },
      { fields: ['stageStatus', 'assignedTechnician'] },
      { fields: ['assignedTechnician', 'stageStatus'] }
    ]
  });
};