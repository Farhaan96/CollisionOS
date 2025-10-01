const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const ProductionStage = sequelize.define(
    'ProductionStage',
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
      // Stage configuration
      stageName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      stageCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      stageType: {
        type: DataTypes.ENUM(
          'production',
          'quality',
          'administrative',
          'customer_interaction',
          'external'
        ),
        allowNull: false,
        defaultValue: 'production',
      },
      category: {
        type: DataTypes.ENUM(
          'intake',
          'disassembly',
          'repair',
          'paint',
          'reassembly',
          'quality',
          'delivery'
        ),
        allowNull: false,
      },
      // Stage ordering and dependencies
      stageOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Prerequisites and dependencies
      prerequisites: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of stage codes that must be completed first
      },
      dependentStages: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of stage codes that depend on this stage
      },
      // Timing and capacity
      estimatedDuration: {
        type: DataTypes.INTEGER, // minutes
        allowNull: true,
      },
      bufferTime: {
        type: DataTypes.INTEGER, // minutes
        defaultValue: 0,
      },
      maxConcurrentJobs: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Resource requirements
      requiredSkills: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of skill codes required
      },
      requiredCertifications: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of certification codes required
      },
      equipmentRequired: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of equipment IDs required
      },
      toolsRequired: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of tool codes required
      },
      bayTypes: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of bay types that can handle this stage
      },
      // Quality control
      requiresInspection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspectionCriteria: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of inspection criteria
      },
      qualityCheckpoints: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of quality checkpoint definitions
      },
      // Customer interaction
      customerVisibleName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      customerDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerNotificationRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApprovalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Photo and documentation requirements
      photosRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      photoTypes: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of photo types required: 'before', 'progress', 'after', 'damage', 'repair'
      },
      documentsRequired: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of document types required
      },
      // Environmental conditions
      environmentalRequirements: {
        type: DataTypes.JSONB,
        defaultValue: {}, // Temperature, humidity, ventilation requirements
      },
      safetyRequirements: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of safety protocols required
      },
      // Workflow rules
      canSkip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canParallelize: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      allowRework: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      maxReworkAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },
      // Cost and billing
      laborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      materialCostMultiplier: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 1.0,
      },
      isProfitCenter: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // SLA and performance targets
      targetEfficiency: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
      },
      maxDelayMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      escalationThreshold: {
        type: DataTypes.INTEGER, // minutes
        allowNull: true,
      },
      // Automation and integration
      automationRules: {
        type: DataTypes.JSONB,
        defaultValue: {}, // Rules for automatic stage progression
      },
      integrationEndpoints: {
        type: DataTypes.JSONB,
        defaultValue: {}, // External system integration points
      },
      webhookEvents: {
        type: DataTypes.JSONB,
        defaultValue: [], // Events that trigger webhooks
      },
      // Instructions and templates
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      workOrderTemplate: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      checklistTemplate: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of checklist items
      },
      // Metrics and KPIs
      trackCycleTime: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      trackQuality: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      trackEfficiency: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      kpiTargets: {
        type: DataTypes.JSONB,
        defaultValue: {}, // KPI targets specific to this stage
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
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'production_stages',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: stage => {
          // Generate stage code if not provided
          if (!stage.stageCode) {
            stage.stageCode = stage.stageName
              .toUpperCase()
              .replace(/\s+/g, '_')
              .substring(0, 20);
          }

          // Set customer visible name if not provided
          if (!stage.customerVisibleName) {
            stage.customerVisibleName = stage.stageName;
          }
        },
        beforeUpdate: stage => {
          // Validate dependencies don't create cycles
          if (
            stage.changed('prerequisites') ||
            stage.changed('dependentStages')
          ) {
            // This would need cycle detection logic in production
          }
        },
      },
    }
  );

  // Instance methods
  ProductionStage.prototype.canStartForJob = function (jobWorkflowStatuses) {
    if (!this.isActive || !this.isRequired) return false;

    // Check if all prerequisites are completed
    if (this.prerequisites && this.prerequisites.length > 0) {
      return this.prerequisites.every(prereqCode => {
        const prereqStatus = jobWorkflowStatuses.find(
          ws => ws.stage === prereqCode
        );
        return prereqStatus && prereqStatus.status === 'completed';
      });
    }

    return true;
  };

  ProductionStage.prototype.getEstimatedCompletionTime = function (startTime) {
    if (!this.estimatedDuration) return null;

    const start = new Date(startTime);
    const completion = new Date(
      start.getTime() + (this.estimatedDuration + this.bufferTime) * 60000
    );
    return completion;
  };

  ProductionStage.prototype.isOverCapacity = function (currentJobs) {
    if (!this.maxConcurrentJobs) return false;
    return currentJobs >= this.maxConcurrentJobs;
  };

  ProductionStage.prototype.getRequiredResources = function () {
    return {
      skills: this.requiredSkills || [],
      certifications: this.requiredCertifications || [],
      equipment: this.equipmentRequired || [],
      tools: this.toolsRequired || [],
      bayTypes: this.bayTypes || [],
    };
  };

  ProductionStage.prototype.validateEnvironmentalConditions = function (
    conditions
  ) {
    if (!this.environmentalRequirements) return true;

    const requirements = this.environmentalRequirements;
    if (requirements.temperature && conditions.temperature) {
      if (
        conditions.temperature < requirements.minTemperature ||
        conditions.temperature > requirements.maxTemperature
      ) {
        return false;
      }
    }

    if (requirements.humidity && conditions.humidity) {
      if (
        conditions.humidity < requirements.minHumidity ||
        conditions.humidity > requirements.maxHumidity
      ) {
        return false;
      }
    }

    return true;
  };

  ProductionStage.prototype.generateWorkOrder = function (job, technician) {
    const template = this.workOrderTemplate || '';

    return template
      .replace('{{jobNumber}}', job.jobNumber || '')
      .replace('{{stageName}}', this.stageName)
      .replace('{{technicianName}}', technician?.name || '')
      .replace('{{instructions}}', this.instructions || '')
      .replace('{{estimatedDuration}}', this.estimatedDuration || 0);
  };

  ProductionStage.prototype.getQualityCheckpoints = function () {
    return this.qualityCheckpoints || [];
  };

  ProductionStage.prototype.getInspectionCriteria = function () {
    return this.inspectionCriteria || [];
  };

  ProductionStage.prototype.canRework = function (currentReworkCount) {
    if (!this.allowRework) return false;
    return currentReworkCount < this.maxReworkAttempts;
  };

  return ProductionStage;
};
