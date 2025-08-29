const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AdvancedPartsManagement', {
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
    repairOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'repair_order_management', key: 'id' }
    },
    estimateLineItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'estimate_line_items', key: 'id' }
    },
    partsOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'parts_orders', key: 'id' }
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vendors', key: 'id' }
    },
    
    // Part Identification
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Line number on estimate/order'
    },
    partDescription: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    operationCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Body shop operation code'
    },
    
    // Part Numbers and Identification
    oemPartNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Original Equipment Manufacturer part number'
    },
    vendorPartNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Vendor/supplier part number'
    },
    alternatePartNumbers: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of alternate part numbers'
    },
    universalProductCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'UPC/barcode'
    },
    
    // Position and Location
    vehiclePosition: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Position on vehicle (front, rear, LH, RH, etc.)'
    },
    positionCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Standardized position code'
    },
    assemblyGroup: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Part of which assembly (door, fender, etc.)'
    },
    
    // Part Category and Type
    partCategory: {
      type: DataTypes.ENUM(
        'body_panel', 'structural', 'mechanical', 'electrical', 'interior', 
        'glass', 'trim', 'hardware', 'paint_materials', 'consumables'
      ),
      allowNull: false
    },
    partSubcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Part Condition and Type
    partCondition: {
      type: DataTypes.ENUM('new', 'used', 'rebuilt', 'reconditioned', 'aftermarket', 'surplus'),
      defaultValue: 'new'
    },
    brandType: {
      type: DataTypes.ENUM('oem', 'oem_equivalent', 'aftermarket', 'recycled', 'remanufactured'),
      defaultValue: 'oem'
    },
    qualityGrade: {
      type: DataTypes.ENUM('premium', 'standard', 'economy'),
      defaultValue: 'standard'
    },
    
    // Status Workflow
    partStatus: {
      type: DataTypes.ENUM(
        'needed', 'sourcing', 'quoted', 'ordered', 'backordered', 'shipped', 
        'received', 'inspected', 'installed', 'returned', 'cancelled'
      ),
      defaultValue: 'needed'
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statusChangeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statusChangeReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    statusChangedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Quantity Management
    quantityOrdered: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 1.000
    },
    quantityReceived: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    quantityInstalled: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    quantityReturned: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    quantityDefective: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    quantityRemaining: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    unitOfMeasure: {
      type: DataTypes.STRING(20),
      defaultValue: 'each',
      comment: 'each, feet, gallons, etc.'
    },
    
    // Core Part Management
    isCoreItem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Requires core exchange'
    },
    coreCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    coreReturned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    coreReturnDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    coreReturnCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    
    // Pricing Information
    listPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    netPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    markup: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Markup percentage'
    },
    sellPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    
    // Vendor and Sourcing
    primaryVendor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    alternateVendors: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of alternate vendor options'
    },
    sourcingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sourcedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    quoteExpirationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Ordering Information
    orderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    orderedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    purchaseOrderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    vendorOrderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Vendor confirmation number'
    },
    expediteRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expediteFee: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    
    // Delivery and Shipping
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    promisedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shippingMethod: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shippingCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    signatureRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Receiving Information
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    receivedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    receivingNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    packingSlipNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Quality Control and Inspection
    inspectionRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    inspectionCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    inspectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    inspectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    inspectionPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    inspectionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    defectDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Installation Information
    installationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    installedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    installationNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requiresSpecialTools: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specialToolsRequired: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    installationTime: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Installation time in hours'
    },
    
    // Warranty Information
    partWarrantyPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Warranty period in months'
    },
    partWarrantyMileage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Warranty mileage limit'
    },
    warrantyStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    warrantyEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    warrantyType: {
      type: DataTypes.ENUM('manufacturer', 'vendor', 'shop', 'extended', 'none'),
      allowNull: true
    },
    warrantyNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Return and Exchange
    isReturnable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    returnDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    returnReason: {
      type: DataTypes.ENUM(
        'defective', 'wrong_part', 'not_needed', 'customer_change', 
        'quality_issue', 'damaged_in_shipping', 'other'
      ),
      allowNull: true
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    returnedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    returnAuthNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'RMA number'
    },
    restockingFee: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    returnCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    
    // Backorder Management
    backorderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    backorderReason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    estimatedBackorderRelease: {
      type: DataTypes.DATE,
      allowNull: true
    },
    backorderAlternativeOffered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    backorderAlternativeDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Paint and Color Information
    paintCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    paintDescription: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paintType: {
      type: DataTypes.ENUM('base_coat', 'clear_coat', 'primer', 'sealer', 'single_stage'),
      allowNull: true
    },
    colorMatch: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'For paint-related parts'
    },
    
    // Environmental and Safety
    hazardousMaterial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hazmatClass: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    msdsRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specialHandling: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disposalRequirements: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Documentation and Attachments
    attachmentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hasPhotos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasDocuments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Margin Analysis
    targetMargin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Target profit margin percentage'
    },
    actualMargin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Actual profit margin percentage'
    },
    marginVariance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Variance from target margin'
    },
    marginGuardrails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON of margin rules and limits'
    },
    
    // Performance Metrics
    leadTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Lead time in days'
    },
    onTimeDelivery: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    vendorPerformanceScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    qualityRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    
    // Priority and Urgency
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
      defaultValue: 'normal'
    },
    isRushOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    rushReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerWaiting: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Notes and Comments
    partNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes visible to customer'
    },
    vendorNotes: {
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
    tableName: 'advanced_parts_management',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['repairOrderId'] },
      { fields: ['estimateLineItemId'] },
      { fields: ['partsOrderId'] },
      { fields: ['vendorId'] },
      { fields: ['lineNumber'] },
      { fields: ['oemPartNumber'] },
      { fields: ['vendorPartNumber'] },
      { fields: ['partStatus'] },
      { fields: ['partCategory'] },
      { fields: ['partCondition'] },
      { fields: ['brandType'] },
      { fields: ['orderDate'] },
      { fields: ['estimatedDeliveryDate'] },
      { fields: ['actualDeliveryDate'] },
      { fields: ['receivedDate'] },
      { fields: ['installationDate'] },
      { fields: ['priority'] },
      { fields: ['isRushOrder'] },
      { fields: ['customerWaiting'] },
      { fields: ['isCoreItem'] },
      { fields: ['isReturnable'] },
      { fields: ['createdAt'] },
      { fields: ['repairOrderId', 'lineNumber'] },
      { fields: ['partStatus', 'priority'] },
      { fields: ['vendorId', 'orderDate'] }
    ]
  });
};