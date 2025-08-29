const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LoanerFleetManagement', {
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
    currentRenterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'customers', key: 'id' }
    },
    
    // Vehicle Identification
    unitId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Fleet unit identifier'
    },
    licensePlate: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    plateProvince: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    vin: {
      type: DataTypes.STRING(17),
      allowNull: false,
      validate: { len: [17, 17] }
    },
    
    // Vehicle Details
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1990, max: 2050 }
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    trim: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bodyStyle: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Vehicle Class and Type
    vehicleClass: {
      type: DataTypes.ENUM('economy', 'compact', 'mid_size', 'full_size', 'premium', 'suv', 'pickup', 'van'),
      allowNull: false
    },
    vehicleType: {
      type: DataTypes.ENUM('loaner', 'rental', 'courtesy', 'demo', 'shop_vehicle'),
      defaultValue: 'loaner'
    },
    seatingCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 2, max: 15 }
    },
    
    // Current Status
    currentStatus: {
      type: DataTypes.ENUM(
        'available', 'reserved', 'rented', 'maintenance', 'out_of_service', 
        'accident_damage', 'cleaning', 'inspection', 'retired'
      ),
      defaultValue: 'available'
    },
    statusChangeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statusNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Location Tracking
    currentLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Current parking location or bay'
    },
    locationUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isOnPremises: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Odometer and Usage
    currentOdometer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastOdometerReading: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    odometerUnit: {
      type: DataTypes.ENUM('miles', 'kilometers'),
      defaultValue: 'kilometers'
    },
    lastOdometerUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalRentalMiles: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Fuel Management
    fuelLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 100 },
      comment: 'Current fuel level percentage'
    },
    fuelType: {
      type: DataTypes.ENUM('gasoline', 'diesel', 'hybrid', 'electric'),
      defaultValue: 'gasoline'
    },
    lastFuelUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fuelCardAssigned: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fuelPolicyNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Condition and Damage
    overallCondition: {
      type: DataTypes.ENUM('excellent', 'very_good', 'good', 'fair', 'poor'),
      defaultValue: 'good'
    },
    hasCurrentDamage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    damageDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    damagePhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of damage photo paths'
    },
    damageReportDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    damageReportedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Insurance and Registration
    insurancePolicyNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    insuranceCompany: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    insuranceExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registrationExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Maintenance Information
    nextServiceDue: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextServiceOdometer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastServiceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastServiceOdometer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    serviceIntervalMiles: {
      type: DataTypes.INTEGER,
      defaultValue: 5000
    },
    maintenanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Safety and Inspection
    lastSafetyInspection: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextSafetyInspectionDue: {
      type: DataTypes.DATE,
      allowNull: true
    },
    safetyInspectionStatus: {
      type: DataTypes.ENUM('current', 'due_soon', 'overdue', 'not_applicable'),
      defaultValue: 'current'
    },
    
    // Equipment and Features
    hasAirConditioning: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    hasGPS: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasBluetoothAudio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasUSBCharging: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasWifiHotspot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    transmissionType: {
      type: DataTypes.ENUM('manual', 'automatic', 'cvt'),
      defaultValue: 'automatic'
    },
    equipmentNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Key Management
    keyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    },
    keyType: {
      type: DataTypes.ENUM('traditional', 'transponder', 'smart_key', 'proximity'),
      defaultValue: 'transponder'
    },
    keyLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Where keys are stored'
    },
    hasSpareKey: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    keyNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Reservation and Availability
    canBeReserved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    reservationNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minimumRentalDays: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    maximumRentalDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    advanceBookingDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    
    // Financial Information
    dailyRentalRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    weeklyRentalRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    monthlyRentalRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    securityDeposit: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    mileageRate: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
      comment: 'Rate per mile/km over allowance'
    },
    mileageAllowanceDaily: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Daily mileage allowance'
    },
    
    // Usage Statistics
    totalRentals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalRentalDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageRentalDuration: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Average rental duration in days'
    },
    utilizationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Utilization percentage'
    },
    revenueGeneratedTotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    
    // Cleaning and Preparation
    requiresCleaning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastCleanedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cleaningNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isCleaningRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Documentation
    vehiclePhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of vehicle photo paths'
    },
    documentPhotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of document photo paths (insurance, registration)'
    },
    hasPreRentalPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Customer Preferences and Restrictions
    customerPreferences: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON of customer preferences for this vehicle'
    },
    ageRestriction: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minimum age requirement'
    },
    drivingRecordRequirement: {
      type: DataTypes.ENUM('none', 'clean', 'minor_violations_ok', 'case_by_case'),
      defaultValue: 'minor_violations_ok'
    },
    creditCheckRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Special Features and Notes
    isHandicapAccessible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPetFriendly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    smokingAllowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specialFeatures: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special features or equipment'
    },
    operatingInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Fleet Management
    fleetNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Fleet management number'
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currentBookValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    plannedRetirementDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    plannedRetirementOdometer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    // Integration Data
    telematics: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON of telematics data'
    },
    gpsTrackingEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastTelematicsUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Notes and Comments
    vehicleNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerFeedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    managementNotes: {
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
    tableName: 'loaner_fleet_management',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['currentRenterId'] },
      { fields: ['unitId'], unique: true },
      { fields: ['licensePlate'] },
      { fields: ['vin'], unique: true },
      { fields: ['currentStatus'] },
      { fields: ['vehicleClass'] },
      { fields: ['vehicleType'] },
      { fields: ['canBeReserved'] },
      { fields: ['currentLocation'] },
      { fields: ['nextServiceDue'] },
      { fields: ['nextSafetyInspectionDue'] },
      { fields: ['insuranceExpiryDate'] },
      { fields: ['registrationExpiryDate'] },
      { fields: ['hasCurrentDamage'] },
      { fields: ['requiresCleaning'] },
      { fields: ['utilizationRate'] },
      { fields: ['createdAt'] },
      { fields: ['shopId', 'currentStatus'] },
      { fields: ['shopId', 'vehicleClass', 'currentStatus'] }
    ]
  });
};