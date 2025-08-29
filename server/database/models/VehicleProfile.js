const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('VehicleProfile', {
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
    
    // Core Vehicle Identification
    vin: {
      type: DataTypes.STRING(17),
      allowNull: true,
      unique: false, // Allow null VINs for older vehicles
      validate: { len: [0, 17] }
    },
    licensePlate: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    plateProvince: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    plateCountry: {
      type: DataTypes.STRING(3),
      defaultValue: 'CAN'
    },
    
    // Year/Make/Model/Trim (YMMT)
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1900, max: 2050 }
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
    submodel: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Vehicle Specifications
    bodyStyle: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Sedan, SUV, Coupe, Hatchback, Pickup, Van, etc.'
    },
    doors: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 2, max: 6 }
    },
    engineSize: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fuelType: {
      type: DataTypes.ENUM('gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid', 'hydrogen', 'other'),
      allowNull: true
    },
    transmission: {
      type: DataTypes.ENUM('manual', 'automatic', 'cvt', 'dual_clutch'),
      allowNull: true
    },
    drivetrain: {
      type: DataTypes.ENUM('fwd', 'rwd', 'awd', '4wd'),
      allowNull: true
    },
    
    // Color and Paint Information
    exteriorColor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    interiorColor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    paintCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Manufacturer paint code'
    },
    paintType: {
      type: DataTypes.ENUM('solid', 'metallic', 'pearl', 'matte', 'tri_coat', 'multi_stage'),
      allowNull: true
    },
    hasCustomPaint: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customPaintDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Odometer Tracking
    currentOdometer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Current odometer reading'
    },
    odometerUnit: {
      type: DataTypes.ENUM('miles', 'kilometers'),
      defaultValue: 'kilometers'
    },
    lastOdometerUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    odometerSource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'How odometer was obtained - estimate, customer, inspection, etc.'
    },
    
    // Vehicle Options and Equipment
    hasAirbags: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    airbagCount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    hasABS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    hasTractionControl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasStabilityControl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasADASFeatures: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Advanced Driver Assistance Systems'
    },
    adasFeatures: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of ADAS features'
    },
    requiresCalibration: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Requires ADAS calibration after repair'
    },
    
    // Special Vehicle Classifications
    isLuxuryVehicle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isExoticVehicle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isClassicVehicle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isCommercialVehicle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFleetVehicle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fleetName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fleetNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Construction and Materials
    frameType: {
      type: DataTypes.ENUM('unibody', 'body_on_frame', 'space_frame', 'monocoque'),
      allowNull: true
    },
    bodyMaterial: {
      type: DataTypes.ENUM('steel', 'aluminum', 'carbon_fiber', 'fiberglass', 'mixed'),
      allowNull: true
    },
    hasAluminumPanels: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    aluminumPanelDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Which panels are aluminum'
    },
    requiresSpecialHandling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specialHandlingNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Glass Information
    hasRainSensor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasHeatedWindshield: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasLaneKeepingCamera: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    windshieldType: {
      type: DataTypes.ENUM('standard', 'acoustic', 'solar', 'heads_up_display'),
      allowNull: true
    },
    
    // Market and Valuation
    msrpWhenNew: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currentMarketValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    valuationSource: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'KBB, NADA, Black Book, etc.'
    },
    valuationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Key Information
    keyType: {
      type: DataTypes.ENUM('traditional', 'transponder', 'smart_key', 'proximity', 'push_button'),
      allowNull: true
    },
    keyCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    hasValet: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    keyNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Condition and History
    overallCondition: {
      type: DataTypes.ENUM('excellent', 'very_good', 'good', 'fair', 'poor'),
      allowNull: true
    },
    priorDamageReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasFloodDamage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasFireDamage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasSalvageTitle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    titleStatus: {
      type: DataTypes.ENUM('clean', 'salvage', 'rebuilt', 'lemon', 'flood', 'hail', 'manufacturer_buyback'),
      defaultValue: 'clean'
    },
    
    // Owner Information
    ownerType: {
      type: DataTypes.ENUM('individual', 'business', 'fleet', 'rental', 'lease', 'government'),
      allowNull: true
    },
    isLeased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    leasingCompany: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lienholderName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lienholderAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Storage and Location
    storageLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Where vehicle is stored on lot'
    },
    storageDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    storageFeeDaily: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    storageChargesApply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Photos and Documentation
    photosTaken: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    photoCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hasPreRepairPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasDamageMapping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Status and Workflow
    vehicleStatus: {
      type: DataTypes.ENUM('active', 'completed', 'archived', 'transferred', 'total_loss'),
      defaultValue: 'active'
    },
    lastInspectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextInspectionDue: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Notes and Comments
    vehicleNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerVehicleComments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // VIN Decode Information
    vinDecoded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    vinDecodeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    vinDecodeSource: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vinDecodeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data from VIN decode service'
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
    tableName: 'vehicle_profiles',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['vin'], unique: false },
      { fields: ['licensePlate'] },
      { fields: ['year', 'make', 'model'] },
      { fields: ['make', 'model'] },
      { fields: ['vehicleStatus'] },
      { fields: ['isFleetVehicle', 'fleetName'] },
      { fields: ['requiresCalibration'] },
      { fields: ['hasADASFeatures'] },
      { fields: ['titleStatus'] },
      { fields: ['storageLocation'] },
      { fields: ['lastInspectionDate'] },
      { fields: ['createdAt'] },
      { fields: ['customerId', 'createdAt'] }
    ]
  });
};