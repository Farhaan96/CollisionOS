const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const VehicleHistory = sequelize.define('VehicleHistory', {
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
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    // Service information
    serviceDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    serviceType: {
      type: DataTypes.ENUM(
        'collision_repair',
        'body_work',
        'paint_work',
        'frame_repair',
        'glass_replacement',
        'mechanical_repair',
        'electrical_repair',
        'interior_repair',
        'detailing',
        'inspection',
        'maintenance',
        'calibration',
        'warranty_work',
        'recall_work',
        'other'
      ),
      allowNull: false
    },
    // Mileage tracking
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mileageVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    previousMileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mileageDifference: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Service details
    workPerformed: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    partsReplaced: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    laborHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    technicianId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Damage and repair information
    damageAreas: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    repairMethods: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    paintWork: {
      type: DataTypes.JSONB,
      allowNull: true // {areas: [], type: 'spot', 'panel', 'full', colors: []}
    },
    // Cost information
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    laborCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    partsCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Quality and warranty
    qualityRating: {
      type: DataTypes.INTEGER, // 1-5 scale
      allowNull: true
    },
    warrantyProvided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    warrantyPeriod: {
      type: DataTypes.INTEGER, // months
      allowNull: true
    },
    warrantyMileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    warrantyExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Customer information
    customerSatisfaction: {
      type: DataTypes.INTEGER, // 1-5 scale
      allowNull: true
    },
    customerComments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complaintsReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    complaintDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    complaintResolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Follow-up tracking
    followUpRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    followUpCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    followUpNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Insurance and claims
    insuranceClaim: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    claimNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    insuranceCompanyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'insurance_companies',
        key: 'id'
      }
    },
    deductible: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // Sublet work
    subletWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subletVendors: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    subletCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    // Environmental conditions
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
    // Photos and documentation
    photosTaken: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    beforePhotos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    duringPhotos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    afterPhotos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    documentsGenerated: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Recalls and TSBs
    recallWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recallNumbers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    tsbWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tsbNumbers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Special circumstances
    rushJob: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    holidayWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    weekendWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    overtimeRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Compliance and regulations
    oesCompliant: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    calibrationRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    calibrationCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    calibrationCertified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Return visits
    isReturnVisit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    originalServiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'vehicle_history',
        key: 'id'
      }
    },
    returnReason: {
      type: DataTypes.ENUM(
        'warranty_issue',
        'quality_concern',
        'additional_damage',
        'customer_request',
        'insurance_requirement',
        'safety_issue',
        'other'
      ),
      allowNull: true
    },
    returnCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // System fields
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
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
    tableName: 'vehicle_history',
    timestamps: true,
    indexes: [
      {
        fields: ['shopId']
      },
      {
        fields: ['vehicleId']
      },
      {
        fields: ['jobId']
      },
      {
        fields: ['serviceDate']
      },
      {
        fields: ['serviceType']
      },
      {
        fields: ['mileage']
      },
      {
        fields: ['technicianId']
      },
      {
        fields: ['warrantyProvided']
      },
      {
        fields: ['warrantyExpiry']
      },
      {
        fields: ['customerSatisfaction']
      },
      {
        fields: ['complaintsReceived']
      },
      {
        fields: ['followUpRequired']
      },
      {
        fields: ['insuranceClaim']
      },
      {
        fields: ['claimNumber']
      },
      {
        fields: ['insuranceCompanyId']
      },
      {
        fields: ['isReturnVisit']
      },
      {
        fields: ['originalServiceId']
      },
      {
        name: 'vehicle_service_date',
        fields: ['vehicleId', 'serviceDate']
      },
      {
        name: 'vehicle_mileage_tracking',
        fields: ['vehicleId', 'mileage', 'serviceDate']
      }
    ],
    hooks: {
      beforeCreate: (history) => {
        // Calculate mileage difference if previous mileage is available
        if (history.mileage && history.previousMileage) {
          history.mileageDifference = history.mileage - history.previousMileage;
        }
        
        // Set warranty expiry date based on service date and warranty period
        if (history.warrantyProvided && history.warrantyPeriod && history.serviceDate) {
          const expiryDate = new Date(history.serviceDate);
          expiryDate.setMonth(expiryDate.getMonth() + history.warrantyPeriod);
          history.warrantyExpiry = expiryDate;
        }
      },
      beforeUpdate: (history) => {
        // Update warranty expiry if warranty period changes
        if ((history.changed('warrantyPeriod') || history.changed('serviceDate')) && 
            history.warrantyProvided && history.warrantyPeriod && history.serviceDate) {
          const expiryDate = new Date(history.serviceDate);
          expiryDate.setMonth(expiryDate.getMonth() + history.warrantyPeriod);
          history.warrantyExpiry = expiryDate;
        }
        
        // Calculate mileage difference
        if (history.changed('mileage') || history.changed('previousMileage')) {
          if (history.mileage && history.previousMileage) {
            history.mileageDifference = history.mileage - history.previousMileage;
          }
        }
        
        // Set follow-up completion if follow-up is no longer required
        if (history.changed('followUpRequired') && !history.followUpRequired) {
          history.followUpCompleted = true;
        }
      }
    }
  });

  // Instance methods
  VehicleHistory.prototype.getServiceTypeColor = function() {
    const typeColors = {
      'collision_repair': '#E74C3C',
      'body_work': '#F39C12',
      'paint_work': '#9B59B6',
      'frame_repair': '#E67E22',
      'glass_replacement': '#3498DB',
      'mechanical_repair': '#2ECC71',
      'electrical_repair': '#F1C40F',
      'interior_repair': '#8E44AD',
      'detailing': '#1ABC9C',
      'inspection': '#34495E',
      'maintenance': '#27AE60',
      'calibration': '#16A085',
      'warranty_work': '#D35400',
      'recall_work': '#C0392B',
      'other': '#95A5A6'
    };
    return typeColors[this.serviceType] || '#95A5A6';
  };

  VehicleHistory.prototype.isWarrantyActive = function() {
    if (!this.warrantyProvided || !this.warrantyExpiry) return false;
    return new Date() <= new Date(this.warrantyExpiry);
  };

  VehicleHistory.prototype.getWarrantyStatus = function() {
    if (!this.warrantyProvided) return 'No Warranty';
    if (!this.warrantyExpiry) return 'Warranty Provided';
    
    const now = new Date();
    const expiry = new Date(this.warrantyExpiry);
    
    if (now <= expiry) {
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return `${daysLeft} days remaining`;
    }
    
    return 'Expired';
  };

  VehicleHistory.prototype.getMileageChange = function() {
    return this.mileageDifference || 0;
  };

  VehicleHistory.prototype.getCustomerSatisfactionRating = function() {
    if (!this.customerSatisfaction) return 'Not Rated';
    
    const ratings = {
      1: 'Very Poor',
      2: 'Poor', 
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    
    return ratings[this.customerSatisfaction] || 'Not Rated';
  };

  VehicleHistory.prototype.hasComplaints = function() {
    return this.complaintsReceived;
  };

  VehicleHistory.prototype.needsFollowUp = function() {
    return this.followUpRequired && !this.followUpCompleted;
  };

  VehicleHistory.prototype.isOverdueForFollowUp = function() {
    if (!this.needsFollowUp() || !this.followUpDate) return false;
    return new Date() > new Date(this.followUpDate);
  };

  VehicleHistory.prototype.isReturnService = function() {
    return this.isReturnVisit;
  };

  VehicleHistory.prototype.getServiceAge = function() {
    const today = new Date();
    const serviceDate = new Date(this.serviceDate);
    const diffTime = Math.abs(today - serviceDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  VehicleHistory.prototype.requiresCalibration = function() {
    return this.calibrationRequired;
  };

  VehicleHistory.prototype.isCalibrationComplete = function() {
    return this.calibrationRequired && this.calibrationCompleted;
  };

  VehicleHistory.prototype.getTotalPhotos = function() {
    return (this.beforePhotos || 0) + (this.duringPhotos || 0) + (this.afterPhotos || 0);
  };

  VehicleHistory.prototype.getServiceValue = function() {
    return parseFloat(this.totalCost || 0);
  };

  VehicleHistory.prototype.getProfitability = function() {
    const revenue = parseFloat(this.totalCost || 0);
    const cost = parseFloat(this.partsCost || 0);
    
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue * 100).toFixed(2);
  };

  return VehicleHistory;
};