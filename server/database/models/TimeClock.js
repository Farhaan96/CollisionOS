const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const TimeClock = sequelize.define(
    'TimeClock',
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
      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      roId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null for general clock in/out
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      // Time tracking
      clockIn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      clockOut: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      breakStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      breakEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Calculated fields
      totalHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      breakHours: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0.0,
      },
      netHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      // Labor details
      laborType: {
        type: DataTypes.ENUM(
          'body',
          'paint',
          'frame',
          'mechanical',
          'electrical',
          'glass',
          'detail',
          'prep',
          'quality_control',
          'other'
        ),
        allowNull: true,
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      laborCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Status
      status: {
        type: DataTypes.ENUM(
          'clocked_in',
          'on_break',
          'clocked_out',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'clocked_in',
      },
      // Work details
      workDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Entry method
      entryMethod: {
        type: DataTypes.ENUM(
          'manual',
          'qr_code',
          'barcode',
          'mobile_app',
          'web_app'
        ),
        defaultValue: 'manual',
      },
      // Location tracking
      bayNumber: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      // Efficiency tracking
      estimatedHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      actualVsEstimated: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      efficiencyRating: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
      },
      // Approval workflow
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
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Payroll integration
      payrollProcessed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      payrollDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payrollPeriod: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      flaggedForPayroll: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Metadata
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
      tableName: 'time_clock',
      timestamps: true,
      indexes: [
        {
          fields: ['shopId', 'technicianId'],
        },
        {
          fields: ['technicianId', 'status'],
        },
        {
          fields: ['roId'],
        },
        {
          fields: ['clockIn'],
        },
        {
          fields: ['status'],
        },
      ],
      hooks: {
        beforeCreate: (entry) => {
          // Set default hourly rate if not provided
          if (!entry.hourlyRate) {
            entry.hourlyRate = 75.0; // Default shop rate
          }
        },
        beforeUpdate: (entry) => {
          // Calculate hours worked when clocking out
          if (entry.changed('clockOut') && entry.clockOut) {
            const startTime = new Date(entry.clockIn);
            const endTime = new Date(entry.clockOut);
            const breakHours = parseFloat(entry.breakHours || 0);

            const totalHours = (endTime - startTime) / (1000 * 60 * 60);
            entry.totalHours = parseFloat(totalHours.toFixed(2));
            entry.netHours = parseFloat((totalHours - breakHours).toFixed(2));

            // Calculate labor cost
            if (entry.hourlyRate && entry.netHours) {
              entry.laborCost = parseFloat((entry.hourlyRate * entry.netHours).toFixed(2));
            }

            // Calculate efficiency if estimated hours are available
            if (entry.estimatedHours && entry.netHours) {
              entry.actualVsEstimated = parseFloat((entry.netHours - entry.estimatedHours).toFixed(2));
              entry.efficiencyRating = parseFloat(((entry.estimatedHours / entry.netHours) * 100).toFixed(2));
            }

            // Update status
            entry.status = 'clocked_out';
          }

          // Update break time calculation
          if (entry.changed('breakEnd') && entry.breakStart && entry.breakEnd) {
            const breakDuration =
              (new Date(entry.breakEnd) - new Date(entry.breakStart)) / (1000 * 60 * 60);
            entry.breakHours = Math.max(0, parseFloat(breakDuration.toFixed(2)));
          }

          // Update approval date
          if (entry.changed('approved') && entry.approved) {
            entry.approvalDate = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  TimeClock.prototype.isActive = function () {
    return this.status === 'clocked_in' && this.clockIn && !this.clockOut;
  };

  TimeClock.prototype.isOnBreak = function () {
    return this.status === 'on_break' && this.breakStart && !this.breakEnd;
  };

  TimeClock.prototype.getDuration = function () {
    if (!this.clockIn) return 0;

    const endTime = this.clockOut || new Date();
    const startTime = new Date(this.clockIn);
    const breakHours = parseFloat(this.breakHours || 0);

    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, totalHours - breakHours);
  };

  TimeClock.prototype.getEfficiencyRating = function () {
    if (!this.efficiencyRating) return 'N/A';

    if (this.efficiencyRating >= 100) return 'Excellent';
    if (this.efficiencyRating >= 90) return 'Good';
    if (this.efficiencyRating >= 80) return 'Average';
    if (this.efficiencyRating >= 70) return 'Below Average';
    return 'Poor';
  };

  TimeClock.prototype.needsApproval = function () {
    return this.requiresApproval && !this.approved;
  };

  TimeClock.prototype.calculateLaborCost = function () {
    if (!this.hourlyRate || !this.netHours) return 0;
    return parseFloat((this.hourlyRate * this.netHours).toFixed(2));
  };

  return TimeClock;
};
