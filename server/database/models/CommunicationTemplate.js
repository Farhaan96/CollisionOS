const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const CommunicationTemplate = sequelize.define('CommunicationTemplate', {
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
    // Template identification
    templateName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    templateCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.ENUM(
        'status_update',
        'parts_arrival',
        'quality_issue',
        'delay_notification',
        'completion_notice',
        'pickup_ready',
        'delivery_reminder',
        'payment_reminder',
        'satisfaction_survey',
        'warranty_notice',
        'appointment_confirmation',
        'estimate_approval',
        'insurance_communication',
        'emergency_contact',
        'marketing',
        'other'
      ),
      allowNull: false
    },
    // Communication channels
    channels: {
      type: DataTypes.JSONB,
      defaultValue: [] // ['sms', 'email', 'phone', 'push', 'portal']
    },
    preferredChannel: {
      type: DataTypes.ENUM('sms', 'email', 'phone', 'push', 'portal', 'auto'),
      defaultValue: 'auto'
    },
    // Trigger conditions
    triggerEvents: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of event types that trigger this template
    },
    jobStatuses: {
      type: DataTypes.JSONB,
      defaultValue: [] // Job statuses that trigger this template
    },
    workflowStages: {
      type: DataTypes.JSONB,
      defaultValue: [] // Workflow stages that trigger this template
    },
    customTriggers: {
      type: DataTypes.JSONB,
      defaultValue: {} // Custom trigger conditions
    },
    // Content templates
    smsTemplate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emailSubject: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    emailTemplate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emailHtmlTemplate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phoneScript: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pushNotificationTitle: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pushNotificationBody: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    portalMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Personalization variables
    variables: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of variable definitions
    },
    dynamicContent: {
      type: DataTypes.JSONB,
      defaultValue: {} // Rules for dynamic content insertion
    },
    // Timing and scheduling
    sendImmediately: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    delayMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    businessHoursOnly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    workingDays: {
      type: DataTypes.JSONB,
      defaultValue: [1, 2, 3, 4, 5] // Monday to Friday
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true // e.g., '08:00:00'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true // e.g., '18:00:00'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'America/New_York'
    },
    // Recipient targeting
    recipientTypes: {
      type: DataTypes.JSONB,
      defaultValue: ['customer'] // ['customer', 'insurance', 'vendor', 'technician', 'manager']
    },
    customerSegments: {
      type: DataTypes.JSONB,
      defaultValue: [] // Customer segment criteria
    },
    jobTypes: {
      type: DataTypes.JSONB,
      defaultValue: [] // Job types this template applies to
    },
    priorityLevels: {
      type: DataTypes.JSONB,
      defaultValue: [] // Job priority levels this template applies to
    },
    // Approval and compliance
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approvalRoles: {
      type: DataTypes.JSONB,
      defaultValue: [] // Roles that can approve this template
    },
    complianceRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    legalReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Frequency limits
    maxFrequency: {
      type: DataTypes.ENUM('once', 'daily', 'weekly', 'unlimited'),
      defaultValue: 'unlimited'
    },
    cooldownMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    suppressDuplicates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Response handling
    trackOpens: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    trackClicks: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    trackResponses: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    allowReplies: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    autoResponseEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    autoResponseTemplate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Integration settings
    externalSystemId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    webhookUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    apiEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    integrationSettings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Personalization and branding
    brandingEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    brandColors: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disclaimers: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // A/B testing
    abTestEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    abTestVariants: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of template variants for testing
    },
    abTestSplit: {
      type: DataTypes.INTEGER,
      defaultValue: 50 // Percentage split for A/B testing
    },
    // Analytics and performance
    sentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deliveredCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    openedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    clickedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    responseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bounceCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unsubscribeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deliveryRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    openRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    clickRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    responseRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Template status and versioning
    status: {
      type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived', 'testing'),
      allowNull: false,
      defaultValue: 'draft'
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0'
    },
    parentTemplateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'communication_templates',
        key: 'id'
      }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Localization
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    translations: {
      type: DataTypes.JSONB,
      defaultValue: {} // language_code -> translated_content
    },
    // Quality and testing
    lastTested: {
      type: DataTypes.DATE,
      allowNull: true
    },
    testResults: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    qualityScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    // Notes and documentation
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    usage_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // System fields
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
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
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'communication_templates',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['templateCode']
      },
      {
        fields: ['shopId']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['preferredChannel']
      },
      {
        fields: ['isDefault']
      },
      {
        fields: ['requiresApproval']
      },
      {
        fields: ['language']
      },
      {
        fields: ['parentTemplateId']
      },
      {
        fields: ['lastTested']
      },
      {
        fields: ['qualityScore']
      },
      {
        name: 'shop_category_active',
        fields: ['shopId', 'category', 'status']
      },
      {
        name: 'template_performance',
        fields: ['templateCode', 'openRate', 'clickRate']
      }
    ],
    hooks: {
      beforeCreate: (template) => {
        // Generate template code if not provided
        if (!template.templateCode) {
          const category = template.category.toUpperCase();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          template.templateCode = `${category}_${random}`;
        }
        
        // Set default channels based on category
        if (!template.channels || template.channels.length === 0) {
          template.channels = getDefaultChannels(template.category);
        }
      },
      beforeUpdate: (template) => {
        // Update performance metrics
        if (template.changed('sentCount') || template.changed('deliveredCount') || 
            template.changed('openedCount') || template.changed('clickedCount')) {
          
          if (template.sentCount > 0) {
            template.deliveryRate = ((template.deliveredCount / template.sentCount) * 100).toFixed(2);
          }
          
          if (template.deliveredCount > 0) {
            template.openRate = ((template.openedCount / template.deliveredCount) * 100).toFixed(2);
            template.clickRate = ((template.clickedCount / template.deliveredCount) * 100).toFixed(2);
            template.responseRate = ((template.responseCount / template.deliveredCount) * 100).toFixed(2);
          }
        }
        
        // Update approval timestamp
        if (template.changed('approvedBy') && template.approvedBy) {
          template.approvedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  CommunicationTemplate.prototype.isActive = function() {
    return this.status === 'active';
  };

  CommunicationTemplate.prototype.needsApproval = function() {
    return this.requiresApproval && !this.approvedBy;
  };

  CommunicationTemplate.prototype.canSend = function() {
    return this.status === 'active' && (!this.requiresApproval || this.approvedBy);
  };

  CommunicationTemplate.prototype.getTemplate = function(channel) {
    switch (channel) {
      case 'sms':
        return this.smsTemplate;
      case 'email':
        return {
          subject: this.emailSubject,
          text: this.emailTemplate,
          html: this.emailHtmlTemplate
        };
      case 'phone':
        return this.phoneScript;
      case 'push':
        return {
          title: this.pushNotificationTitle,
          body: this.pushNotificationBody
        };
      case 'portal':
        return this.portalMessage;
      default:
        return null;
    }
  };

  CommunicationTemplate.prototype.processVariables = function(data) {
    const variables = this.variables || [];
    const processed = {};
    
    variables.forEach(variable => {
      const path = variable.path.split('.');
      let value = data;
      
      for (const key of path) {
        value = value && value[key];
      }
      
      processed[variable.name] = value || variable.defaultValue || '';
    });
    
    return processed;
  };

  CommunicationTemplate.prototype.renderContent = function(content, variables) {
    if (!content) return content;
    
    let rendered = content;
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(placeholder, variables[key]);
    });
    
    return rendered;
  };

  CommunicationTemplate.prototype.shouldSendNow = function() {
    if (this.sendImmediately && !this.businessHoursOnly) {
      return true;
    }
    
    const now = new Date();
    
    if (this.businessHoursOnly) {
      const dayOfWeek = now.getDay();
      if (!this.workingDays.includes(dayOfWeek)) {
        return false;
      }
      
      const currentTime = now.toTimeString().substr(0, 8);
      if (this.startTime && currentTime < this.startTime) {
        return false;
      }
      
      if (this.endTime && currentTime > this.endTime) {
        return false;
      }
    }
    
    return true;
  };

  CommunicationTemplate.prototype.getDelayedSendTime = function() {
    if (this.sendImmediately) {
      return new Date(Date.now() + (this.delayMinutes * 60000));
    }
    
    // Calculate next appropriate send time based on business hours
    const now = new Date();
    const sendTime = new Date(now.getTime() + (this.delayMinutes * 60000));
    
    if (!this.businessHoursOnly) {
      return sendTime;
    }
    
    // Adjust for business hours if needed
    while (!this.isWithinBusinessHours(sendTime)) {
      sendTime.setDate(sendTime.getDate() + 1);
      sendTime.setHours(parseInt(this.startTime?.substr(0, 2) || '9'), 0, 0, 0);
    }
    
    return sendTime;
  };

  CommunicationTemplate.prototype.isWithinBusinessHours = function(date) {
    const dayOfWeek = date.getDay();
    if (!this.workingDays.includes(dayOfWeek)) {
      return false;
    }
    
    const timeString = date.toTimeString().substr(0, 8);
    
    if (this.startTime && timeString < this.startTime) {
      return false;
    }
    
    if (this.endTime && timeString > this.endTime) {
      return false;
    }
    
    return true;
  };

  CommunicationTemplate.prototype.getPerformanceMetrics = function() {
    return {
      sentCount: this.sentCount,
      deliveredCount: this.deliveredCount,
      openedCount: this.openedCount,
      clickedCount: this.clickedCount,
      responseCount: this.responseCount,
      deliveryRate: this.deliveryRate,
      openRate: this.openRate,
      clickRate: this.clickRate,
      responseRate: this.responseRate
    };
  };

  CommunicationTemplate.prototype.incrementSentCount = function() {
    return this.increment('sentCount');
  };

  CommunicationTemplate.prototype.incrementDeliveredCount = function() {
    return this.increment('deliveredCount');
  };

  CommunicationTemplate.prototype.incrementOpenedCount = function() {
    return this.increment('openedCount');
  };

  CommunicationTemplate.prototype.incrementClickedCount = function() {
    return this.increment('clickedCount');
  };

  return CommunicationTemplate;
};

// Helper function to get default channels based on category
function getDefaultChannels(category) {
  const channelMap = {
    'status_update': ['sms', 'email'],
    'parts_arrival': ['sms'],
    'quality_issue': ['phone', 'email'],
    'delay_notification': ['sms', 'email'],
    'completion_notice': ['sms', 'email'],
    'pickup_ready': ['sms', 'phone'],
    'delivery_reminder': ['sms'],
    'payment_reminder': ['email', 'sms'],
    'satisfaction_survey': ['email'],
    'warranty_notice': ['email'],
    'appointment_confirmation': ['sms', 'email'],
    'estimate_approval': ['email'],
    'insurance_communication': ['email'],
    'emergency_contact': ['phone', 'sms'],
    'marketing': ['email'],
    'other': ['email']
  };
  
  return channelMap[category] || ['email'];
}