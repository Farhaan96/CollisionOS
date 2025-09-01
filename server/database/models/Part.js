const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Part = sequelize.define(
    'Part',
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
      // Part identification
      partNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      oemPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Part classification
      category: {
        type: DataTypes.ENUM(
          'body',
          'mechanical',
          'electrical',
          'interior',
          'exterior',
          'paint',
          'glass',
          'tire',
          'wheel',
          'accessory',
          'other'
        ),
        allowNull: false,
      },
      subcategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      partType: {
        type: DataTypes.ENUM(
          'oem',
          'aftermarket',
          'recycled',
          'remanufactured',
          'generic',
          'custom'
        ),
        allowNull: false,
        defaultValue: 'oem',
      },
      // Vehicle compatibility
      make: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      yearFrom: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      yearTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Physical properties
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      dimensions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Inventory management
      currentStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minimumStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maximumStock: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reorderPoint: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reorderQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Location tracking
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      binNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      shelfNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Pricing information
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      markupPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      // Vendor information
      primaryVendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      vendorPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Warranty information
      warrantyPeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      warrantyType: {
        type: DataTypes.ENUM('manufacturer', 'vendor', 'shop', 'none'),
        allowNull: true,
      },
      // Core exchange
      isCore: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      coreValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      coreReturnRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Status and tracking
      partStatus: {
        type: DataTypes.ENUM(
          'active',
          'discontinued',
          'backordered',
          'obsolete',
          'recalled'
        ),
        defaultValue: 'active',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Timestamps
      lastOrderDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastReceivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastSoldDate: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'parts',
      timestamps: true,
    }
  );

  // Instance methods
  Part.prototype.getFullDescription = function () {
    const parts = [this.partNumber, this.description];
    if (this.make && this.model) {
      parts.push(`(${this.make} ${this.model})`);
    }
    return parts.join(' - ');
  };

  Part.prototype.getStockStatus = function () {
    if (this.currentStock <= 0) return 'out_of_stock';
    if (this.currentStock <= this.minimumStock) return 'low_stock';
    if (this.currentStock <= this.reorderPoint) return 'reorder';
    return 'in_stock';
  };

  Part.prototype.needsReorder = function () {
    return this.currentStock <= this.reorderPoint;
  };

  Part.prototype.getMarkupAmount = function () {
    if (!this.costPrice || !this.sellingPrice) return 0;
    return this.sellingPrice - this.costPrice;
  };

  Part.prototype.getMarkupPercentage = function () {
    if (!this.costPrice || !this.sellingPrice) return 0;
    return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
  };

  Part.prototype.getTotalValue = function () {
    return this.currentStock * (this.costPrice || 0);
  };

  // Class methods
  Part.findByVehicle = async function (shopId, make, model, year) {
    return await this.findAll({
      where: {
        shopId,
        make,
        model,
        yearFrom: { [Sequelize.Op.lte]: year },
        yearTo: { [Sequelize.Op.gte]: year },
        isActive: true,
        partStatus: 'active',
      },
    });
  };

  Part.findLowStock = async function (shopId) {
    return await this.findAll({
      where: {
        shopId,
        isActive: true,
        currentStock: {
          [Sequelize.Op.lte]: Sequelize.col('minimumStock'),
        },
      },
    });
  };

  Part.findNeedsReorder = async function (shopId) {
    return await this.findAll({
      where: {
        shopId,
        isActive: true,
        currentStock: {
          [Sequelize.Op.lte]: Sequelize.col('reorderPoint'),
        },
      },
    });
  };

  return Part;
};
