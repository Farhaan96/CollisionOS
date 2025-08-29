const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SchedulingCapacity', {
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
    
    // Time Period Definition
    scheduleDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date this schedule applies to'
    },
    scheduleWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Week number of the year'
    },
    scheduleMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Month of the year (1-12)'
    },
    scheduleYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 7 },
      comment: '1=Monday, 7=Sunday'
    },
    
    // Shift Information
    shiftName: {
      type: DataTypes.STRING(50),
      defaultValue: 'day_shift'
    },
    shiftStartTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    shiftEndTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    shiftHours: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 8.00,
      comment: 'Total hours in shift'
    },
    
    // Department Capacity
    department: {
      type: DataTypes.ENUM(
        'intake', 'estimating', 'body', 'frame', 'paint', 'prep', 'assembly', 
        'mechanical', 'detailing', 'quality_control', 'glass', 'parts', 'sublet'
      ),
      allowNull: false
    },
    
    // Technician Capacity
    availableTechnicians: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of technicians available'
    },
    totalCapacityHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      comment: 'Total available labor hours'
    },
    scheduledHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      comment: 'Hours already scheduled'
    },
    remainingCapacityHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      comment: 'Hours still available'
    },
    utilizationPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: { min: 0, max: 100 },
      comment: 'Capacity utilization percentage'
    },
    
    // Skills Matrix and Specialization
    availableSkills: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of available skills in department'
    },
    specializedCapacity: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON object of specialized capacity by skill'
    },
    certifiedTechnicians: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON object of certified technicians by certification'
    },
    
    // Equipment and Bay Capacity
    totalBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    availableBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    occupiedBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bayUtilization: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: { min: 0, max: 100 }
    },
    
    // Bay Type Breakdown
    frameBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bodyBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    paintBooths: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    prepStations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    assemblyBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    detailBays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Equipment Availability
    equipmentAvailable: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of available equipment'
    },
    equipmentInUse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of equipment in use'
    },
    equipmentDowntime: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of equipment under maintenance'
    },
    
    // Workload Distribution
    jobsScheduled: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of jobs scheduled for this period'
    },
    averageJobDuration: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Average job duration in hours'
    },
    complexityWeightedHours: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      comment: 'Hours adjusted for job complexity'
    },
    
    // Priority and Rush Work
    rushJobsScheduled: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rushHoursAllocated: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    priorityJobsScheduled: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    priorityHoursAllocated: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    
    // Buffer and Flexibility
    bufferHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours reserved for unexpected work'
    },
    overtimeCapacity: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Available overtime hours'
    },
    flexibilityRating: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      comment: 'How flexible this schedule period is'
    },
    
    // Constraints and Limitations
    hasConstraints: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    constraints: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of scheduling constraints'
    },
    blockedHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours blocked for maintenance, training, etc.'
    },
    
    // Environmental and Safety Factors
    environmentalConstraints: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Weather, temperature, humidity constraints'
    },
    safetyRequirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Safety requirements affecting capacity'
    },
    ventilationRequirements: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Performance Metrics
    plannedEfficiency: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00,
      comment: 'Expected efficiency percentage'
    },
    actualEfficiency: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Actual efficiency achieved'
    },
    productivityTarget: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Target hours of productive work'
    },
    actualProductivity: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Actual productive hours achieved'
    },
    
    // Quality Considerations
    qualityControlHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours allocated for QC activities'
    },
    reworkHoursReserved: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours reserved for potential rework'
    },
    inspectionHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours allocated for inspections'
    },
    
    // Material and Parts Dependencies
    partsConstrainedHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours dependent on parts availability'
    },
    materialConstrainedHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours dependent on materials'
    },
    subletConstrainedHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours dependent on sublet services'
    },
    
    // Customer and Insurance Dependencies
    customerApprovalHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours pending customer approval'
    },
    insuranceApprovalHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00,
      comment: 'Hours pending insurance approval'
    },
    
    // Historical Performance
    historicalUtilization: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Historical utilization for this period type'
    },
    seasonalAdjustment: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      comment: 'Seasonal adjustment factor'
    },
    trendAdjustment: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      comment: 'Trend-based adjustment factor'
    },
    
    // Scheduling Algorithm Data
    algorithmVersion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Version of scheduling algorithm used'
    },
    optimizationScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Optimization score for this schedule'
    },
    schedulingRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON of scheduling rules applied'
    },
    
    // Real-time Updates
    lastRecalculated: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time capacity was recalculated'
    },
    recalculationTrigger: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'What triggered the last recalculation'
    },
    autoUpdateEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Status and Validation
    scheduleStatus: {
      type: DataTypes.ENUM('draft', 'active', 'locked', 'historical', 'archived'),
      defaultValue: 'active'
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    validationErrors: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of validation errors'
    },
    
    // Notes and Comments
    capacityNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    managerNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    schedulingNotes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'scheduling_capacity',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['scheduleDate'] },
      { fields: ['department'] },
      { fields: ['scheduleYear', 'scheduleMonth'] },
      { fields: ['scheduleWeek', 'scheduleYear'] },
      { fields: ['dayOfWeek'] },
      { fields: ['shiftName'] },
      { fields: ['scheduleStatus'] },
      { fields: ['utilizationPercentage'] },
      { fields: ['bayUtilization'] },
      { fields: ['department', 'scheduleDate'] },
      { fields: ['shopId', 'scheduleDate', 'department'] },
      { fields: ['remainingCapacityHours'] },
      { fields: ['flexibilityRating'] },
      { fields: ['lastRecalculated'] },
      { fields: ['isValid'] },
      { fields: ['createdAt'] },
      { unique: true, fields: ['shopId', 'scheduleDate', 'department', 'shiftName'] }
    ]
  });
};