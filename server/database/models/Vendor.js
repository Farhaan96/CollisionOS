const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Vendor = sequelize.define('Vendor', {
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
    // Vendor identification
    vendorNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // Contact information
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fax: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Address information
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(50),
      defaultValue: 'Canada'
    },
    // Vendor classification
    vendorType: {
      type: DataTypes.ENUM(
        'oem',
        'aftermarket',
        'recycled',
        'remanufactured',
        'paint_supplier',
        'equipment_supplier',
        'service_provider',
        'other'
      ),
      allowNull: false,
      defaultValue: 'aftermarket'
    },
    vendorStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'blacklisted'),
      defaultValue: 'active'
    },
    // Business information
    taxId: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    businessLicense: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Financial terms
    paymentTerms: {
      type: DataTypes.ENUM('immediate', 'net_15', 'net_30', 'net_60', 'net_90'),
      defaultValue: 'net_30'
    },
    creditLimit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currentBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    // Performance metrics
    averageDeliveryTime: {
      type: DataTypes.INTEGER, // in days
      allowNull: true
    },
    fillRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    returnRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    qualityRating: {
      type: DataTypes.DECIMAL(3, 1), // 1-10 scale
      allowNull: true
    },
    // Integration information
    apiEndpoint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    apiKey: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    integrationType: {
      type: DataTypes.ENUM('manual', 'api', 'edi', 'web_portal'),
      defaultValue: 'manual'
    },
    // Specializations
    specializations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Notes and preferences
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // System fields
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'vendors',
    timestamps: true
  });

  // Instance methods
  Vendor.prototype.getFullAddress = function() {
    const parts = [this.address, this.city, this.state, this.zipCode, this.country];
    return parts.filter(part => part).join(', ');
  };

  Vendor.prototype.getPerformanceScore = function() {
    let score = 0;
    let factors = 0;

    if (this.averageDeliveryTime !== null) {
      score += Math.max(0, 10 - this.averageDeliveryTime);
      factors++;
    }

    if (this.fillRate !== null) {
      score += this.fillRate;
      factors++;
    }

    if (this.qualityRating !== null) {
      score += this.qualityRating;
      factors++;
    }

    if (this.returnRate !== null) {
      score += Math.max(0, 10 - this.returnRate);
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  };

  Vendor.prototype.getPerformanceGrade = function() {
    const score = this.getPerformanceScore();
    if (score >= 9) return 'A';
    if (score >= 8) return 'B';
    if (score >= 7) return 'C';
    if (score >= 6) return 'D';
    return 'F';
  };

  Vendor.prototype.isPreferred = function() {
    return this.getPerformanceScore() >= 8.5;
  };

  // Class methods
  Vendor.generateVendorNumber = async function(shopId) {
    const lastVendor = await this.findOne({
      where: { shopId },
      order: [['vendorNumber', 'DESC']]
    });
    
    if (!lastVendor) {
      return 'VEND-0001';
    }
    
    const lastNumber = parseInt(lastVendor.vendorNumber.split('-')[1]);
    return `VEND-${String(lastNumber + 1).padStart(4, '0')}`;
  };

  Vendor.findByType = async function(shopId, vendorType) {
    return await this.findAll({
      where: {
        shopId,
        vendorType,
        isActive: true,
        vendorStatus: 'active'
      },
      order: [['name', 'ASC']]
    });
  };

  Vendor.findPreferred = async function(shopId) {
    const vendors = await this.findAll({
      where: {
        shopId,
        isActive: true,
        vendorStatus: 'active'
      }
    });

    return vendors.filter(vendor => vendor.isPreferred());
  };

  return Vendor;
};
