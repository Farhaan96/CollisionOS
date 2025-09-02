const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'PartsInventoryTracking',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Parent References
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
      },
      partId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'parts', key: 'id' },
      },

      // Part Identification
      partNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Primary part number for tracking',
      },
      partDescription: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      oemPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'OEM part number if different',
      },
      vendorPartNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Vendor-specific part number',
      },
      alternatePartNumbers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of alternate part numbers',
      },
      universalProductCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'UPC/barcode for the part',
      },

      // Part Classification
      partCategory: {
        type: DataTypes.ENUM(
          'body_panel',
          'structural',
          'mechanical',
          'electrical',
          'interior',
          'glass',
          'trim',
          'hardware',
          'paint_materials',
          'consumables'
        ),
        allowNull: false,
      },
      partSubcategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      brandType: {
        type: DataTypes.ENUM(
          'oem',
          'oem_equivalent',
          'aftermarket',
          'recycled',
          'remanufactured'
        ),
        allowNull: false,
      },
      partCondition: {
        type: DataTypes.ENUM(
          'new',
          'used',
          'rebuilt',
          'reconditioned',
          'aftermarket',
          'surplus'
        ),
        allowNull: false,
      },
      qualityGrade: {
        type: DataTypes.ENUM('premium', 'standard', 'economy'),
        defaultValue: 'standard',
      },

      // Inventory Status
      inventoryStatus: {
        type: DataTypes.ENUM(
          'in_stock',
          'low_stock',
          'out_of_stock',
          'backordered',
          'discontinued',
          'special_order',
          'unknown'
        ),
        allowNull: false,
        defaultValue: 'unknown',
      },
      availabilityStatus: {
        type: DataTypes.ENUM(
          'available',
          'limited',
          'backordered',
          'special_order',
          'discontinued',
          'not_available'
        ),
        allowNull: false,
        defaultValue: 'available',
      },

      // Quantity Information
      quantityAvailable: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: 'Current quantity available',
      },
      quantityOnHand: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: 'Total quantity vendor has',
      },
      quantityReserved: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 0.0,
        comment: 'Quantity reserved for pending orders',
      },
      quantityAllocated: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 0.0,
        comment: 'Quantity allocated to confirmed orders',
      },
      quantityInTransit: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 0.0,
        comment: 'Quantity in transit to vendor',
      },
      minimumOrderQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 1.0,
        comment: 'Minimum quantity that can be ordered',
      },
      orderMultiple: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 1.0,
        comment: 'Quantity must be in multiples of this number',
      },
      unitOfMeasure: {
        type: DataTypes.STRING(20),
        defaultValue: 'each',
        comment: 'Unit of measure (each, feet, gallons, etc.)',
      },

      // Location Information
      warehouseLocation: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Specific warehouse or location where part is stocked',
      },
      binLocation: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Specific bin or shelf location',
      },
      vendorLocationCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Vendor location code',
      },
      proximityToShop: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Distance from shop in miles',
      },
      shippingZone: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Shipping zone for calculating costs',
      },

      // Timing Information
      lastCheckedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When inventory was last checked',
      },
      lastUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When inventory was last updated by vendor',
      },
      checkFrequency: {
        type: DataTypes.INTEGER,
        defaultValue: 3600,
        comment: 'How often to check inventory (seconds)',
      },
      nextCheckDue: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When next inventory check is due',
      },
      dataAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Age of inventory data in minutes',
      },

      // Lead Time Information
      leadTimeMin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Minimum lead time in days',
      },
      leadTimeMax: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum lead time in days',
      },
      leadTimeAverage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Average lead time in days',
      },
      lastDeliveryDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Actual delivery time for last order',
      },
      expediteAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether expedited shipping is available',
      },
      expediteLeadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Lead time if expedited (days)',
      },

      // Pricing Information (Current)
      currentPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Current price from vendor',
      },
      listPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Manufacturer list price',
      },
      previousPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Previous price for comparison',
      },
      priceChangeDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When price was last changed',
      },
      priceChangePercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage change in price',
      },
      priceVolatility: {
        type: DataTypes.ENUM('stable', 'fluctuating', 'increasing', 'decreasing'),
        defaultValue: 'stable',
        comment: 'Price volatility indicator',
      },

      // Audit Trail
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'parts_inventory_tracking',
      timestamps: true,
      indexes: [
        { fields: ['shopId'] },
        { fields: ['vendorId'] },
        { fields: ['partId'] },
        { fields: ['partNumber'] },
        { fields: ['oemPartNumber'] },
        { fields: ['vendorPartNumber'] },
        { fields: ['partCategory'] },
        { fields: ['brandType'] },
        { fields: ['inventoryStatus'] },
        { fields: ['availabilityStatus'] },
        { fields: ['quantityAvailable'] },
        { fields: ['lastCheckedAt'] },
        { fields: ['currentPrice'] },
        { fields: ['leadTimeAverage'] },
        { fields: ['createdAt'] },
        // Composite indexes for common queries
        { fields: ['shopId', 'vendorId'] },
        { fields: ['vendorId', 'partNumber'] },
        { fields: ['partCategory', 'inventoryStatus'] },
        { fields: ['inventoryStatus', 'lastCheckedAt'] },
        { fields: ['availabilityStatus', 'quantityAvailable'] },
      ],
    }
  );
};