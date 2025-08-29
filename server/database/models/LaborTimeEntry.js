const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const LaborTimeEntry = sequelize.define('LaborTimeEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    technicianId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    estimateLineItemId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'estimate_line_items',
        key: 'id'
      }
    },
    // Time tracking
    clockIn: {
      type: DataTypes.DATE,
      allowNull: false
    },
    clockOut: {
      type: DataTypes.DATE,
      allowNull: true
    },
    breakStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    breakEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Calculated time
    hoursWorked: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    breakTime: {
      type: DataTypes.DECIMAL(6, 2), // hours
      allowNull: true,
      defaultValue: 0.00
    },
    billableHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    nonBillableHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    // Work details
    laborType: {
      type: DataTypes.ENUM('body', 'paint', 'frame', 'mechanical', 'electrical', 'glass', 'detail', 'prep', 'quality_control', 'other'),
      allowNull: false
    },
    workDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    operationCode: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // Status and classification
    status: {
      type: DataTypes.ENUM('active', 'completed', 'on_break', 'cancelled', 'disputed'),
      allowNull: false,
      defaultValue: 'active'
    },
    workStatus: {
      type: DataTypes.ENUM('in_progress', 'completed', 'quality_check', 'rework_required', 'waiting_parts', 'waiting_approval', 'on_hold'),
      allowNull: true,
      defaultValue: 'in_progress'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    // Rates and billing
    hourlyRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    overtimeRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    laborCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    customerRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    billableAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // Quality and efficiency
    qualityRating: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    efficiency: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    varianceHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    // Approval workflow
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Rework tracking
    isRework: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reworkReason: {
      type: DataTypes.ENUM('quality_issue', 'damage', 'incorrect_procedure', 'parts_issue', 'customer_request', 'other'),
      allowNull: true
    },
    originalTimeEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'labor_time_entries',
        key: 'id'
      }
    },
    reworkCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Location and equipment
    bayNumber: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    equipmentUsed: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    toolsUsed: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Weather and conditions (for body shops with outdoor work)
    weatherConditions: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    humidity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // Progress tracking
    progressPercentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    milestonesCompleted: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    nextSteps: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Issues and delays
    hasIssues: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    issueDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delayReason: {
      type: DataTypes.ENUM('parts_delay', 'equipment_failure', 'quality_issue', 'customer_delay', 'weather', 'other'),
      allowNull: true
    },
    delayMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Notes and documentation
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Photos and documentation
    photosRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    photosTaken: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    documentsAttached: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Payroll integration
    payrollProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    payrollDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payrollPeriod: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // System fields
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'labor_time_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['shopId']
      },
      {
        fields: ['technicianId']
      },
      {
        fields: ['jobId']
      },
      {
        fields: ['estimateLineItemId']
      },
      {
        fields: ['clockIn']
      },
      {
        fields: ['clockOut']
      },
      {
        fields: ['laborType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['workStatus']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['requiresApproval']
      },
      {
        fields: ['approved']
      },
      {
        fields: ['isRework']
      },
      {
        fields: ['payrollProcessed']
      },
      {
        fields: ['payrollPeriod']
      },
      {
        name: 'technician_date_composite',
        fields: ['technicianId', 'clockIn']
      },
      {
        name: 'job_labor_composite',
        fields: ['jobId', 'laborType', 'clockIn']
      }
    ],
    hooks: {
      beforeCreate: (entry) => {
        // Set default hourly rate if not provided
        if (!entry.hourlyRate) {
          entry.hourlyRate = 75.00; // Default shop rate
        }
        
        // Set overtime rate (usually 1.5x regular rate)
        if (!entry.overtimeRate && entry.hourlyRate) {
          entry.overtimeRate = entry.hourlyRate * 1.5;
        }
        
        // If clockOut is provided, calculate hours
        if (entry.clockOut) {
          entry.hoursWorked = calculateHoursWorked(entry);
        }
      },
      beforeUpdate: (entry) => {
        // Calculate hours worked when clocking out
        if (entry.changed('clockOut') && entry.clockOut) {
          entry.hoursWorked = calculateHoursWorked(entry);
          entry.status = 'completed';
          
          // Calculate efficiency if estimated hours are available
          if (entry.estimatedHours && entry.hoursWorked) {
            entry.efficiency = ((entry.estimatedHours / entry.hoursWorked) * 100).toFixed(2);
            entry.varianceHours = (entry.hoursWorked - entry.estimatedHours).toFixed(2);
          }
          
          // Calculate labor cost
          if (entry.hourlyRate && entry.hoursWorked) {
            entry.laborCost = (entry.hourlyRate * entry.hoursWorked).toFixed(2);
          }
          
          // Calculate billable amount
          if (entry.customerRate && entry.billableHours) {
            entry.billableAmount = (entry.customerRate * entry.billableHours).toFixed(2);
          }
        }
        
        // Update approval date
        if (entry.changed('approved') && entry.approved) {
          entry.approvalDate = new Date();
        }
        
        // Update break time calculation
        if (entry.changed('breakStart') || entry.changed('breakEnd')) {
          if (entry.breakStart && entry.breakEnd) {
            const breakDuration = (new Date(entry.breakEnd) - new Date(entry.breakStart)) / (1000 * 60 * 60);
            entry.breakTime = Math.max(0, breakDuration).toFixed(2);
          }
        }
      }
    }
  });

  // Instance methods
  LaborTimeEntry.prototype.getStatusColor = function() {
    const statusColors = {
      'active': '#3498DB',
      'completed': '#2ECC71',
      'on_break': '#F39C12',
      'cancelled': '#95A5A6',
      'disputed': '#E74C3C'
    };
    return statusColors[this.status] || '#95A5A6';
  };

  LaborTimeEntry.prototype.getWorkStatusColor = function() {
    const statusColors = {
      'in_progress': '#3498DB',
      'completed': '#2ECC71',
      'quality_check': '#9B59B6',
      'rework_required': '#E74C3C',
      'waiting_parts': '#F39C12',
      'waiting_approval': '#E67E22',
      'on_hold': '#95A5A6'
    };
    return statusColors[this.workStatus] || '#95A5A6';
  };

  LaborTimeEntry.prototype.isActive = function() {
    return this.status === 'active' && this.clockIn && !this.clockOut;
  };

  LaborTimeEntry.prototype.isOnBreak = function() {
    return this.status === 'on_break' && this.breakStart && !this.breakEnd;
  };

  LaborTimeEntry.prototype.getDuration = function() {
    if (!this.clockIn) return 0;
    
    const endTime = this.clockOut || new Date();
    const startTime = new Date(this.clockIn);
    const breakTime = parseFloat(this.breakTime || 0);
    
    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, totalHours - breakTime);
  };

  LaborTimeEntry.prototype.getEfficiencyRating = function() {
    if (!this.efficiency) return 'N/A';
    
    if (this.efficiency >= 100) return 'Excellent';
    if (this.efficiency >= 90) return 'Good';
    if (this.efficiency >= 80) return 'Average';
    if (this.efficiency >= 70) return 'Below Average';
    return 'Poor';
  };

  LaborTimeEntry.prototype.isOvertime = function() {
    return parseFloat(this.overtimeHours || 0) > 0;
  };

  LaborTimeEntry.prototype.needsApproval = function() {
    return this.requiresApproval && !this.approved;
  };

  LaborTimeEntry.prototype.getProfitability = function() {
    const cost = parseFloat(this.laborCost || 0);
    const revenue = parseFloat(this.billableAmount || 0);
    
    if (cost === 0 || revenue === 0) return 0;
    
    return ((revenue - cost) / revenue * 100).toFixed(2);
  };

  return LaborTimeEntry;
};

// Helper function to calculate hours worked
function calculateHoursWorked(entry) {
  if (!entry.clockIn || !entry.clockOut) return null;
  
  const startTime = new Date(entry.clockIn);
  const endTime = new Date(entry.clockOut);
  const breakTime = parseFloat(entry.breakTime || 0);
  
  const totalHours = (endTime - startTime) / (1000 * 60 * 60);
  const workHours = Math.max(0, totalHours - breakTime);
  
  return workHours.toFixed(2);
}