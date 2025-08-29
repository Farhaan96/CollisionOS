const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ContactTimeline', {
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
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'jobs', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    
    // Communication Details
    contactType: {
      type: DataTypes.ENUM('inbound', 'outbound', 'system_generated'),
      allowNull: false,
      defaultValue: 'outbound'
    },
    communicationMethod: {
      type: DataTypes.ENUM('call', 'text', 'email', 'in_person', 'portal', 'fax', 'letter'),
      allowNull: false
    },
    direction: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'bounced', 'no_answer', 'busy', 'completed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    
    // Contact Content
    subject: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Contact Information
    contactName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    // Timing Information
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    attemptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Call duration in seconds'
    },
    
    // Follow-up Management
    requiresFollowup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    followupDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    followupReason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    followupCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Contact Preferences Compliance
    respectedQuietHours: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    customerLanguage: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Language preference used'
    },
    consentVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Engagement Tracking
    opened: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clicked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    responded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customerResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Campaign/Template Tracking
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'communication_templates', key: 'id' }
    },
    campaignId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    automationTriggerId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // System Integration
    externalSystemId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'SMS/Email service provider message ID'
    },
    externalSystemResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Provider response data'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      comment: 'Cost of communication (SMS/call charges)'
    },
    
    // Priority and Importance
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    importance: {
      type: DataTypes.ENUM('informational', 'business_critical', 'customer_satisfaction', 'payment_related'),
      defaultValue: 'informational'
    },
    
    // Error Handling
    errorCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    
    // Metadata
    sourceChannel: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Where communication originated (web, mobile, system, manual)'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of tags for categorization'
    },
    attachmentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Audit Fields
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'contact_timeline',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['jobId'] },
      { fields: ['userId'] },
      { fields: ['contactType', 'communicationMethod'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['attemptedAt'] },
      { fields: ['completedAt'] },
      { fields: ['requiresFollowup', 'followupDate'] },
      { fields: ['templateId'] },
      { fields: ['campaignId'] },
      { fields: ['priority', 'importance'] },
      { fields: ['createdAt'] },
      { fields: ['customerId', 'createdAt'] },
      { fields: ['jobId', 'createdAt'] }
    ]
  });
};