const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Vehicle = sequelize.define(
    'Vehicle',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'shops',
          key: 'id',
        },
      },
      // Vehicle identification
      vin: {
        type: DataTypes.STRING(17),
        allowNull: false,
        unique: true,
        validate: {
          len: [17, 17],
        },
      },
      licensePlate: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Vehicle details
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
      },
      make: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      trim: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bodyStyle: {
        type: DataTypes.ENUM(
          'sedan',
          'suv',
          'truck',
          'coupe',
          'convertible',
          'wagon',
          'hatchback',
          'van',
          'motorcycle',
          'other'
        ),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      colorCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      // Engine information
      engineSize: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      engineType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      transmission: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      fuelType: {
        type: DataTypes.ENUM(
          'gasoline',
          'diesel',
          'hybrid',
          'electric',
          'plug_in_hybrid',
          'hydrogen',
          'other'
        ),
        allowNull: true,
      },
      // Vehicle specifications
      mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mileageUnit: {
        type: DataTypes.ENUM('miles', 'kilometers'),
        defaultValue: 'kilometers',
      },
      // Insurance information
      insuranceCompany: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      policyNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      claimNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      deductible: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Vehicle status
      vehicleStatus: {
        type: DataTypes.ENUM(
          'active',
          'inactive',
          'totaled',
          'sold',
          'stolen',
          'recovered'
        ),
        defaultValue: 'active',
      },
      // Service information
      lastServiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextServiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      serviceInterval: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Warranty information
      warrantyExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      warrantyType: {
        type: DataTypes.ENUM(
          'manufacturer',
          'extended',
          'certified_pre_owned',
          'none'
        ),
        allowNull: true,
      },
      // Vehicle features
      features: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Notes and history
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // System fields
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'vehicles',
      timestamps: true,
    }
  );

  // Instance methods
  Vehicle.prototype.getFullDescription = function () {
    const parts = [this.year, this.make, this.model];
    if (this.trim) parts.push(this.trim);
    if (this.bodyStyle) parts.push(this.bodyStyle);
    return parts.join(' ');
  };

  Vehicle.prototype.getDisplayName = function () {
    return `${this.year} ${this.make} ${this.model}`;
  };

  Vehicle.prototype.getMileageDisplay = function () {
    if (!this.mileage) return 'N/A';
    return `${this.mileage.toLocaleString()} ${this.mileageUnit}`;
  };

  // VIN decoding method
  Vehicle.prototype.decodeVIN = function () {
    // Basic VIN decoding logic
    const vin = this.vin;
    if (vin.length !== 17) return null;

    return {
      year: this.getYearFromVIN(vin),
      make: this.getMakeFromVIN(vin),
      model: this.getModelFromVIN(vin),
      bodyStyle: this.getBodyStyleFromVIN(vin),
      engine: this.getEngineFromVIN(vin),
    };
  };

  Vehicle.prototype.getYearFromVIN = function (vin) {
    const yearCode = vin.charAt(9);
    const yearMap = {
      A: 2010,
      B: 2011,
      C: 2012,
      D: 2013,
      E: 2014,
      F: 2015,
      G: 2016,
      H: 2017,
      J: 2018,
      K: 2019,
      L: 2020,
      M: 2021,
      N: 2022,
      P: 2023,
      R: 2024,
    };
    return yearMap[yearCode] || null;
  };

  Vehicle.prototype.getMakeFromVIN = function (vin) {
    const wmi = vin.substring(0, 3);
    // This would need a comprehensive WMI database
    const makeMap = {
      '1H': 'Honda',
      '1G': 'General Motors',
      '1F': 'Ford',
      '1N': 'Nissan',
      '1T': 'Toyota',
      '1V': 'Volkswagen',
    };
    return makeMap[wmi] || 'Unknown';
  };

  Vehicle.prototype.getModelFromVIN = function (vin) {
    // This would require manufacturer-specific decoding
    return 'Unknown';
  };

  Vehicle.prototype.getBodyStyleFromVIN = function (vin) {
    const bodyCode = vin.charAt(3);
    const bodyMap = {
      1: 'sedan',
      2: 'coupe',
      3: 'suv',
      4: 'truck',
      5: 'wagon',
      6: 'hatchback',
      7: 'convertible',
    };
    return bodyMap[bodyCode] || 'other';
  };

  Vehicle.prototype.getEngineFromVIN = function (vin) {
    const engineCode = vin.charAt(7);
    // This would require manufacturer-specific decoding
    return 'Unknown';
  };

  return Vehicle;
};
