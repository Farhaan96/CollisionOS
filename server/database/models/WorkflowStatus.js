const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const WorkflowStatus = sequelize.define(
    'WorkflowStatus',
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
      // Workflow stage information
      stage: {
        type: DataTypes.ENUM(
          'estimate',
          'intake',
          'disassembly',
          'blueprint',
          'parts_ordering',
          'parts_receiving',
          'body_structure',
          'frame_repair',
          'paint_prep',
          'paint_booth',
          'paint_finish',
          'reassembly',
          'quality_control',
          'calibration',
          'road_test',
          'detail',
          'final_inspection',
          'ready_pickup',
          'delivery',
          'completed'
        ),
        allowNull: false,
      },
      stageOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Status and timing
      status: {
        type: DataTypes.ENUM(
          'pending',
          'in_progress',
          'completed',
          'skipped',
          'on_hold',
          'rework',
          'failed'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedDuration: {
        type: DataTypes.INTEGER, // minutes
        allowNull: true,
      },
      actualDuration: {
        type: DataTypes.INTEGER, // minutes
        allowNull: true,
      },
      // Staff assignment
      technicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assignedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Location and resources
      bayNumber: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      equipmentUsed: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      toolsRequired: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      materialsUsed: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Progress tracking
      progressPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      milestones: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      checkpoints: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Quality control
      requiresInspection: {
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
      inspectionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      qualityRating: {
        type: DataTypes.INTEGER, // 1-5 scale
        allowNull: true,
      },
      // Issues and delays
      hasIssues: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      issueDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      issueResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      delayReason: {
        type: DataTypes.ENUM(
          'parts_delay',
          'customer_delay',
          'equipment_failure',
          'staff_shortage',
          'weather',
          'quality_issue',
          'customer_change',
          'insurance_delay',
          'sublet_delay',
          'calibration_delay',
          'other'
        ),
        allowNull: true,
      },
      delayMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Rework tracking
      requiresRework: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reworkReason: {
        type: DataTypes.ENUM(
          'quality_issue',
          'damage_found',
          'customer_request',
          'insurance_requirement',
          'safety_concern',
          'measurement_error',
          'paint_defect',
          'fit_issue',
          'other'
        ),
        allowNull: true,
      },
      reworkCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      originalWorkflowId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'workflow_status',
          key: 'id',
        },
      },
      // Dependencies
      dependsOn: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of stage names this stage depends on
      },
      blockedBy: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of issues blocking this stage
      },
      canStart: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Customer interaction
      customerApprovalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerNotified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerNotificationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Photos and documentation
      photosRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      photosTaken: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      documentsGenerated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      subletCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      totalStageCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Environmental conditions (for paint booth, etc.)
      temperature: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      humidity: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      boothConditions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Special requirements
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      safetyRequirements: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      certificationRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      certificationCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      customerNotes: {
        type: DataTypes.TEXT,
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
      tableName: 'workflow_status',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: workflow => {
          // Set stage order based on predefined workflow
          if (!workflow.stageOrder) {
            workflow.stageOrder = getStageOrder(workflow.stage);
          }

          // Set assignment date when technician is assigned
          if (workflow.technicianId && !workflow.assignedAt) {
            workflow.assignedAt = new Date();
          }
        },
        beforeUpdate: workflow => {
          // Update timing when status changes
          if (workflow.changed('status')) {
            const now = new Date();

            if (workflow.status === 'in_progress' && !workflow.startedAt) {
              workflow.startedAt = now;
            }

            if (workflow.status === 'completed' && !workflow.completedAt) {
              workflow.completedAt = now;
              workflow.progressPercentage = 100;

              // Calculate actual duration
              if (workflow.startedAt) {
                const duration = Math.round(
                  (now - new Date(workflow.startedAt)) / (1000 * 60)
                );
                workflow.actualDuration = duration;
              }
            }

            if (workflow.status === 'rework') {
              workflow.requiresRework = true;
              workflow.reworkCount = (workflow.reworkCount || 0) + 1;
            }
          }

          // Update inspection date
          if (
            workflow.changed('inspectionCompleted') &&
            workflow.inspectionCompleted
          ) {
            workflow.inspectionDate = new Date();
          }

          // Calculate total stage cost
          const labor = parseFloat(workflow.laborCost || 0);
          const material = parseFloat(workflow.materialCost || 0);
          const sublet = parseFloat(workflow.subletCost || 0);
          workflow.totalStageCost = (labor + material + sublet).toFixed(2);

          // Update customer notification
          if (
            workflow.changed('customerNotified') &&
            workflow.customerNotified
          ) {
            workflow.customerNotificationDate = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  WorkflowStatus.prototype.getStatusColor = function () {
    const statusColors = {
      pending: '#95A5A6',
      in_progress: '#3498DB',
      completed: '#2ECC71',
      skipped: '#F39C12',
      on_hold: '#E67E22',
      rework: '#E74C3C',
      failed: '#C0392B',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  WorkflowStatus.prototype.getStageColor = function () {
    const stageColors = {
      estimate: '#9B59B6',
      intake: '#3498DB',
      disassembly: '#E67E22',
      blueprint: '#1ABC9C',
      parts_ordering: '#F39C12',
      parts_receiving: '#27AE60',
      body_structure: '#E74C3C',
      frame_repair: '#C0392B',
      paint_prep: '#8E44AD',
      paint_booth: '#9B59B6',
      paint_finish: '#8E44AD',
      reassembly: '#2980B9',
      quality_control: '#16A085',
      calibration: '#D35400',
      road_test: '#F1C40F',
      detail: '#34495E',
      final_inspection: '#7F8C8D',
      ready_pickup: '#2ECC71',
      delivery: '#27AE60',
      completed: '#2ECC71',
    };
    return stageColors[this.stage] || '#95A5A6';
  };

  WorkflowStatus.prototype.isActive = function () {
    return this.status === 'in_progress';
  };

  WorkflowStatus.prototype.isCompleted = function () {
    return this.status === 'completed';
  };

  WorkflowStatus.prototype.isPending = function () {
    return this.status === 'pending';
  };

  WorkflowStatus.prototype.isBlocked = function () {
    return !this.canStart || (this.blockedBy && this.blockedBy.length > 0);
  };

  WorkflowStatus.prototype.needsRework = function () {
    return this.requiresRework || this.status === 'rework';
  };

  WorkflowStatus.prototype.hasDelays = function () {
    return this.delayMinutes > 0;
  };

  WorkflowStatus.prototype.getEfficiency = function () {
    if (!this.estimatedDuration || !this.actualDuration) return null;
    return ((this.estimatedDuration / this.actualDuration) * 100).toFixed(2);
  };

  WorkflowStatus.prototype.getVariance = function () {
    if (!this.estimatedDuration || !this.actualDuration) return null;
    return this.actualDuration - this.estimatedDuration;
  };

  WorkflowStatus.prototype.getDuration = function () {
    if (!this.startedAt) return 0;

    const endTime = this.completedAt || new Date();
    const startTime = new Date(this.startedAt);

    return Math.round((endTime - startTime) / (1000 * 60)); // minutes
  };

  WorkflowStatus.prototype.isOverdue = function () {
    if (!this.estimatedDuration || this.status === 'completed') return false;

    const currentDuration = this.getDuration();
    return currentDuration > this.estimatedDuration;
  };

  WorkflowStatus.prototype.needsInspection = function () {
    return this.requiresInspection && !this.inspectionCompleted;
  };

  WorkflowStatus.prototype.needsCustomerApproval = function () {
    return this.customerApprovalRequired && !this.customerApproved;
  };

  WorkflowStatus.prototype.canProceed = function () {
    return this.canStart && !this.needsCustomerApproval() && !this.isBlocked();
  };

  WorkflowStatus.prototype.getStageName = function () {
    const stageNames = {
      estimate: 'Estimate',
      intake: 'Vehicle Intake',
      disassembly: 'Disassembly',
      blueprint: 'Blueprint/Measuring',
      parts_ordering: 'Parts Ordering',
      parts_receiving: 'Parts Receiving',
      body_structure: 'Body/Structure Work',
      frame_repair: 'Frame Repair',
      paint_prep: 'Paint Preparation',
      paint_booth: 'Paint Booth',
      paint_finish: 'Paint Finishing',
      reassembly: 'Reassembly',
      quality_control: 'Quality Control',
      calibration: 'Calibration',
      road_test: 'Road Test',
      detail: 'Detailing',
      final_inspection: 'Final Inspection',
      ready_pickup: 'Ready for Pickup',
      delivery: 'Delivery',
      completed: 'Completed',
    };
    return stageNames[this.stage] || this.stage;
  };

  return WorkflowStatus;
};

// Helper function to get stage order
function getStageOrder(stage) {
  const stageOrders = {
    estimate: 1,
    intake: 2,
    disassembly: 3,
    blueprint: 4,
    parts_ordering: 5,
    parts_receiving: 6,
    body_structure: 7,
    frame_repair: 8,
    paint_prep: 9,
    paint_booth: 10,
    paint_finish: 11,
    reassembly: 12,
    quality_control: 13,
    calibration: 14,
    road_test: 15,
    detail: 16,
    final_inspection: 17,
    ready_pickup: 18,
    delivery: 19,
    completed: 20,
  };
  return stageOrders[stage] || 999;
}
