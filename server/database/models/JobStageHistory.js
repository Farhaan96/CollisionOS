const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const JobStageHistory = sequelize.define(
    'JobStageHistory',
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
      jobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      workflowStatusId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'workflow_status',
          key: 'id',
        },
      },
      productionStageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'production_stages',
          key: 'id',
        },
      },
      // Movement tracking
      fromStage: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      toStage: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      movementType: {
        type: DataTypes.ENUM(
          'forward',
          'backward',
          'skip',
          'restart',
          'parallel'
        ),
        allowNull: false,
        defaultValue: 'forward',
      },
      movementReason: {
        type: DataTypes.ENUM(
          'normal_progression',
          'rework_required',
          'quality_issue',
          'customer_request',
          'parts_delay',
          'equipment_failure',
          'scheduling_optimization',
          'emergency_rush',
          'stage_skip_approved',
          'parallel_processing',
          'other'
        ),
        allowNull: false,
        defaultValue: 'normal_progression',
      },
      // Timing information
      transitionTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      stageStartTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stageEndTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stageDuration: {
        type: DataTypes.INTEGER, // minutes
        allowNull: true,
      },
      waitTime: {
        type: DataTypes.INTEGER, // minutes before stage started
        allowNull: true,
        defaultValue: 0,
      },
      // Staff information
      technicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      supervisorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      authorizedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      // Location and resources
      bayNumber: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      bayType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      equipmentUsed: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      toolsUsed: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      materialsConsumed: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Quality and performance metrics
      qualityScore: {
        type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
        allowNull: true,
      },
      efficiencyPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      firstTimeRight: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      reworkRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reworkCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Issues and delays
      hadIssues: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      issueType: {
        type: DataTypes.ENUM(
          'quality_defect',
          'equipment_malfunction',
          'parts_shortage',
          'skill_gap',
          'customer_change',
          'damage_discovery',
          'measurement_error',
          'safety_concern',
          'environmental_condition',
          'other'
        ),
        allowNull: true,
      },
      issueDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      delayMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      delayReason: {
        type: DataTypes.ENUM(
          'parts_wait',
          'equipment_downtime',
          'customer_delay',
          'insurance_delay',
          'quality_rework',
          'scheduling_conflict',
          'weather_delay',
          'staff_shortage',
          'safety_hold',
          'other'
        ),
        allowNull: true,
      },
      resolutionTime: {
        type: DataTypes.INTEGER, // minutes to resolve issue
        allowNull: true,
      },
      // Cost tracking
      laborCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      materialCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      overheadCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      totalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      budgetVariance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Customer interaction
      customerNotified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerNotificationTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customerApprovalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApprovalTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customerFeedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Environmental conditions
      temperature: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      humidity: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      weatherConditions: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      environmentalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Photos and documentation
      photosTaken: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      photosRequired: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      documentsGenerated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      photoUrls: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      documentUrls: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Inspection and quality control
      inspectionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectionCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      inspectionTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      inspectionResults: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      inspectionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Work order and instructions
      workOrderNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      workInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      safetyNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Notes and comments
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      technicianNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      supervisorNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      qualityNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // System integration
      externalSystemData: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      syncStatus: {
        type: DataTypes.ENUM('pending', 'synced', 'failed', 'not_applicable'),
        defaultValue: 'not_applicable',
      },
      lastSyncTime: {
        type: DataTypes.DATE,
        allowNull: true,
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
      // System fields
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      recordedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'job_stage_history',
      timestamps: true,
      indexes: [
        {
          fields: ['shopId'],
        },
        {
          fields: ['jobId'],
        },
        {
          fields: ['workflowStatusId'],
        },
        {
          fields: ['productionStageId'],
        },
        {
          fields: ['transitionTime'],
        },
        {
          fields: ['stageStartTime'],
        },
        {
          fields: ['stageEndTime'],
        },
        {
          fields: ['fromStage'],
        },
        {
          fields: ['toStage'],
        },
        {
          fields: ['movementType'],
        },
        {
          fields: ['movementReason'],
        },
        {
          fields: ['technicianId'],
        },
        {
          fields: ['bayNumber'],
        },
        {
          fields: ['hadIssues'],
        },
        {
          fields: ['reworkRequired'],
        },
        {
          fields: ['qualityScore'],
        },
        {
          fields: ['firstTimeRight'],
        },
        {
          fields: ['customerApprovalRequired'],
        },
        {
          fields: ['inspectionRequired'],
        },
        {
          name: 'job_stage_timeline',
          fields: ['jobId', 'transitionTime'],
        },
        {
          name: 'technician_performance',
          fields: ['technicianId', 'transitionTime', 'qualityScore'],
        },
        {
          name: 'stage_metrics',
          fields: ['toStage', 'transitionTime', 'efficiencyPercentage'],
        },
        {
          name: 'quality_tracking',
          fields: ['toStage', 'qualityScore', 'firstTimeRight'],
        },
      ],
      hooks: {
        beforeCreate: history => {
          // Calculate stage duration if end time is provided
          if (history.stageStartTime && history.stageEndTime) {
            const start = new Date(history.stageStartTime);
            const end = new Date(history.stageEndTime);
            history.stageDuration = Math.round((end - start) / (1000 * 60));
          }

          // Calculate total cost
          const labor = parseFloat(history.laborCost || 0);
          const material = parseFloat(history.materialCost || 0);
          const overhead = parseFloat(history.overheadCost || 0);
          history.totalCost = (labor + material + overhead).toFixed(2);
        },
        beforeUpdate: history => {
          // Update customer notification time
          if (history.changed('customerNotified') && history.customerNotified) {
            history.customerNotificationTime = new Date();
          }

          // Update customer approval time
          if (history.changed('customerApproved') && history.customerApproved) {
            history.customerApprovalTime = new Date();
          }

          // Update inspection time
          if (
            history.changed('inspectionCompleted') &&
            history.inspectionCompleted
          ) {
            history.inspectionTime = new Date();
          }

          // Recalculate total cost if cost fields changed
          const costFields = ['laborCost', 'materialCost', 'overheadCost'];
          if (costFields.some(field => history.changed(field))) {
            const labor = parseFloat(history.laborCost || 0);
            const material = parseFloat(history.materialCost || 0);
            const overhead = parseFloat(history.overheadCost || 0);
            history.totalCost = (labor + material + overhead).toFixed(2);
          }

          // Calculate stage duration if end time changed
          if (
            history.changed('stageEndTime') &&
            history.stageStartTime &&
            history.stageEndTime
          ) {
            const start = new Date(history.stageStartTime);
            const end = new Date(history.stageEndTime);
            history.stageDuration = Math.round((end - start) / (1000 * 60));
          }
        },
      },
    }
  );

  // Instance methods
  JobStageHistory.prototype.getMovementTypeColor = function () {
    const colors = {
      forward: '#2ECC71',
      backward: '#E74C3C',
      skip: '#F39C12',
      restart: '#9B59B6',
      parallel: '#3498DB',
    };
    return colors[this.movementType] || '#95A5A6';
  };

  JobStageHistory.prototype.getQualityRating = function () {
    if (!this.qualityScore) return 'N/A';

    if (this.qualityScore >= 4.5) return 'Excellent';
    if (this.qualityScore >= 4.0) return 'Good';
    if (this.qualityScore >= 3.0) return 'Satisfactory';
    if (this.qualityScore >= 2.0) return 'Needs Improvement';
    return 'Poor';
  };

  JobStageHistory.prototype.getEfficiencyRating = function () {
    if (!this.efficiencyPercentage) return 'N/A';

    if (this.efficiencyPercentage >= 100) return 'Excellent';
    if (this.efficiencyPercentage >= 90) return 'Good';
    if (this.efficiencyPercentage >= 80) return 'Satisfactory';
    if (this.efficiencyPercentage >= 70) return 'Needs Improvement';
    return 'Poor';
  };

  JobStageHistory.prototype.hadQualityIssues = function () {
    return this.hadIssues || this.reworkRequired || !this.firstTimeRight;
  };

  JobStageHistory.prototype.isOverBudget = function () {
    return parseFloat(this.budgetVariance || 0) > 0;
  };

  JobStageHistory.prototype.getTotalDelayTime = function () {
    return (
      (this.waitTime || 0) +
      (this.delayMinutes || 0) +
      (this.resolutionTime || 0)
    );
  };

  JobStageHistory.prototype.getStageVelocity = function () {
    if (!this.stageDuration || this.stageDuration === 0) return 0;

    // Velocity = work completed / time spent (higher is better)
    const baseVelocity = 100 / this.stageDuration;
    const qualityMultiplier = this.firstTimeRight ? 1.0 : 0.8;

    return (baseVelocity * qualityMultiplier).toFixed(2);
  };

  JobStageHistory.prototype.getCostVariance = function () {
    return parseFloat(this.budgetVariance || 0);
  };

  JobStageHistory.prototype.getResourceUtilization = function () {
    return {
      equipment: this.equipmentUsed || [],
      tools: this.toolsUsed || [],
      materials: this.materialsConsumed || [],
      bay: this.bayNumber,
      bayType: this.bayType,
    };
  };

  JobStageHistory.prototype.getIssuesSummary = function () {
    return {
      hasIssues: this.hadIssues,
      issueType: this.issueType,
      description: this.issueDescription,
      delayTime: this.delayMinutes,
      resolutionTime: this.resolutionTime,
      requiresRework: this.reworkRequired,
      reworkCount: this.reworkCount,
    };
  };

  JobStageHistory.prototype.getCustomerInteraction = function () {
    return {
      notified: this.customerNotified,
      notificationTime: this.customerNotificationTime,
      approvalRequired: this.customerApprovalRequired,
      approved: this.customerApproved,
      approvalTime: this.customerApprovalTime,
      feedback: this.customerFeedback,
    };
  };

  return JobStageHistory;
};
