const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const CommunicationLog = sequelize.define(
    'CommunicationLog',
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
      // Related records
      jobId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'communication_templates',
          key: 'id',
        },
      },
      workflowStatusId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'workflow_status',
          key: 'id',
        },
      },
      // Communication details
      communicationType: {
        type: DataTypes.ENUM('outbound', 'inbound', 'automated', 'broadcast'),
        allowNull: false,
        defaultValue: 'outbound',
      },
      channel: {
        type: DataTypes.ENUM(
          'sms',
          'email',
          'phone',
          'push',
          'portal',
          'in_person',
          'fax',
          'mail',
          'other'
        ),
        allowNull: false,
      },
      direction: {
        type: DataTypes.ENUM('sent', 'received'),
        allowNull: false,
      },
      // Recipients and senders
      recipientType: {
        type: DataTypes.ENUM(
          'customer',
          'insurance',
          'vendor',
          'technician',
          'manager',
          'admin',
          'other'
        ),
        allowNull: false,
        defaultValue: 'customer',
      },
      recipientName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      recipientPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      recipientEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      recipientAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      senderName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      // Message content
      subject: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      messageContent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      messageHtml: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of attachment objects
      },
      // Status and delivery tracking
      status: {
        type: DataTypes.ENUM(
          'draft',
          'queued',
          'sending',
          'sent',
          'delivered',
          'opened',
          'clicked',
          'replied',
          'bounced',
          'failed',
          'unsubscribed',
          'spam',
          'blocked'
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
      deliveryStatus: {
        type: DataTypes.ENUM('pending', 'delivered', 'failed', 'unknown'),
        defaultValue: 'pending',
      },
      deliveryAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      maxDeliveryAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },
      // Timing information
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      openedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clickedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      repliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Response and engagement
      wasOpened: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      openCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastOpenedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      wasClicked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      clickCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastClickedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clickedLinks: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of clicked URLs
      },
      // Response handling
      responseReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      responseContent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      responseProcessed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sentiment: {
        type: DataTypes.ENUM('positive', 'neutral', 'negative', 'unknown'),
        allowNull: true,
      },
      // External system integration
      externalMessageId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      externalThreadId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      externalSystemName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      externalSystemData: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Campaign and automation
      campaignId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      automationRuleId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      triggerEvent: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isAutomated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      abTestVariant: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      // Error handling
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      errorCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      errorDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Priority and routing
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Cost tracking
      cost: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
      },
      costCurrency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      billingUnits: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      // Compliance and legal
      requiresConsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      consentReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      consentTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      optOutReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      optOutTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      gdprCompliant: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      retentionPeriod: {
        type: DataTypes.INTEGER, // days
        allowNull: true,
      },
      // Quality and feedback
      qualityScore: {
        type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
        allowNull: true,
      },
      customerSatisfaction: {
        type: DataTypes.INTEGER, // 1-5 scale
        allowNull: true,
      },
      feedbackReceived: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Follow-up tracking
      requiresFollowUp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      followUpDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      followUpCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      parentMessageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'communication_log',
          key: 'id',
        },
      },
      threadId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Analytics and reporting
      deviceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      location: {
        type: DataTypes.JSONB,
        allowNull: true, // { country, region, city, timezone }
      },
      // System fields
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'communication_log',
      timestamps: true,
      indexes: [
        {
          fields: ['shopId'],
        },
        {
          fields: ['jobId'],
        },
        {
          fields: ['customerId'],
        },
        {
          fields: ['templateId'],
        },
        {
          fields: ['workflowStatusId'],
        },
        {
          fields: ['communicationType'],
        },
        {
          fields: ['channel'],
        },
        {
          fields: ['direction'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['deliveryStatus'],
        },
        {
          fields: ['recipientType'],
        },
        {
          fields: ['recipientEmail'],
        },
        {
          fields: ['recipientPhone'],
        },
        {
          fields: ['senderId'],
        },
        {
          fields: ['scheduledAt'],
        },
        {
          fields: ['sentAt'],
        },
        {
          fields: ['deliveredAt'],
        },
        {
          fields: ['openedAt'],
        },
        {
          fields: ['repliedAt'],
        },
        {
          fields: ['campaignId'],
        },
        {
          fields: ['automationRuleId'],
        },
        {
          fields: ['isAutomated'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['externalMessageId'],
        },
        {
          fields: ['externalThreadId'],
        },
        {
          fields: ['parentMessageId'],
        },
        {
          fields: ['threadId'],
        },
        {
          fields: ['requiresFollowUp'],
        },
        {
          fields: ['followUpDate'],
        },
        {
          name: 'recipient_communication',
          fields: ['recipientEmail', 'recipientPhone', 'sentAt'],
        },
        {
          name: 'job_communication_timeline',
          fields: ['jobId', 'sentAt', 'channel'],
        },
        {
          name: 'customer_engagement',
          fields: ['customerId', 'wasOpened', 'wasClicked'],
        },
        {
          name: 'delivery_tracking',
          fields: ['status', 'deliveryStatus', 'deliveryAttempts'],
        },
        {
          name: 'automation_performance',
          fields: ['automationRuleId', 'status', 'sentAt'],
        },
      ],
      hooks: {
        beforeCreate: log => {
          // Generate thread ID for conversation tracking
          if (!log.threadId && log.jobId) {
            log.threadId = `job_${log.jobId}_${log.channel}`;
          }

          // Set scheduled time if not provided
          if (!log.scheduledAt && log.communicationType !== 'inbound') {
            log.scheduledAt = new Date();
          }
        },
        beforeUpdate: log => {
          // Update status timestamps
          if (log.changed('status')) {
            const now = new Date();

            switch (log.status) {
              case 'sent':
                if (!log.sentAt) log.sentAt = now;
                break;
              case 'delivered':
                if (!log.deliveredAt) log.deliveredAt = now;
                log.deliveryStatus = 'delivered';
                break;
              case 'opened':
                if (!log.openedAt) log.openedAt = now;
                log.wasOpened = true;
                log.openCount = (log.openCount || 0) + 1;
                log.lastOpenedAt = now;
                break;
              case 'clicked':
                if (!log.clickedAt) log.clickedAt = now;
                log.wasClicked = true;
                log.clickCount = (log.clickCount || 0) + 1;
                log.lastClickedAt = now;
                break;
              case 'replied':
                if (!log.repliedAt) log.repliedAt = now;
                log.responseReceived = true;
                break;
              case 'failed':
              case 'bounced':
                log.deliveryStatus = 'failed';
                log.errorCount = (log.errorCount || 0) + 1;
                break;
            }
          }

          // Update engagement metrics
          if (log.changed('wasOpened') && log.wasOpened && !log.openedAt) {
            log.openedAt = new Date();
            log.openCount = Math.max(1, log.openCount || 0);
          }

          if (log.changed('wasClicked') && log.wasClicked && !log.clickedAt) {
            log.clickedAt = new Date();
            log.clickCount = Math.max(1, log.clickCount || 0);
          }

          // Update response processing
          if (log.changed('responseContent') && log.responseContent) {
            log.responseReceived = true;
            if (!log.repliedAt) log.repliedAt = new Date();
          }

          // Update opt-out timestamp
          if (
            log.changed('optOutReceived') &&
            log.optOutReceived &&
            !log.optOutTimestamp
          ) {
            log.optOutTimestamp = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  CommunicationLog.prototype.getStatusColor = function () {
    const colors = {
      draft: '#95A5A6',
      queued: '#F39C12',
      sending: '#3498DB',
      sent: '#2ECC71',
      delivered: '#27AE60',
      opened: '#8E44AD',
      clicked: '#9B59B6',
      replied: '#1ABC9C',
      bounced: '#E74C3C',
      failed: '#C0392B',
      unsubscribed: '#34495E',
      spam: '#E67E22',
      blocked: '#7F8C8D',
    };
    return colors[this.status] || '#95A5A6';
  };

  CommunicationLog.prototype.getChannelIcon = function () {
    const icons = {
      sms: 'message',
      email: 'email',
      phone: 'phone',
      push: 'notifications',
      portal: 'web',
      in_person: 'person',
      fax: 'fax',
      mail: 'mail',
      other: 'contact_support',
    };
    return icons[this.channel] || 'contact_support';
  };

  CommunicationLog.prototype.isSuccessful = function () {
    return ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(
      this.status
    );
  };

  CommunicationLog.prototype.isFailed = function () {
    return ['failed', 'bounced', 'blocked', 'spam'].includes(this.status);
  };

  CommunicationLog.prototype.wasEngaged = function () {
    return this.wasOpened || this.wasClicked || this.responseReceived;
  };

  CommunicationLog.prototype.getEngagementScore = function () {
    let score = 0;

    if (this.isSuccessful()) score += 20;
    if (this.wasOpened) score += 30;
    if (this.wasClicked) score += 40;
    if (this.responseReceived) score += 50;
    if (this.customerSatisfaction && this.customerSatisfaction >= 4)
      score += 20;

    return Math.min(100, score);
  };

  CommunicationLog.prototype.getDeliveryTime = function () {
    if (!this.sentAt || !this.deliveredAt) return null;

    const sent = new Date(this.sentAt);
    const delivered = new Date(this.deliveredAt);

    return Math.round((delivered - sent) / 1000); // seconds
  };

  CommunicationLog.prototype.getResponseTime = function () {
    if (!this.sentAt || !this.repliedAt) return null;

    const sent = new Date(this.sentAt);
    const replied = new Date(this.repliedAt);

    return Math.round((replied - sent) / (1000 * 60)); // minutes
  };

  CommunicationLog.prototype.needsRetry = function () {
    return (
      this.isFailed() &&
      this.deliveryAttempts < this.maxDeliveryAttempts &&
      !['spam', 'blocked', 'unsubscribed'].includes(this.status)
    );
  };

  CommunicationLog.prototype.canSendFollowUp = function () {
    return (
      this.requiresFollowUp &&
      !this.followUpCompleted &&
      this.followUpDate &&
      new Date() >= new Date(this.followUpDate)
    );
  };

  CommunicationLog.prototype.isOverdue = function () {
    return (
      this.requiresFollowUp &&
      !this.followUpCompleted &&
      this.followUpDate &&
      new Date() > new Date(this.followUpDate)
    );
  };

  CommunicationLog.prototype.getSentimentColor = function () {
    const colors = {
      positive: '#2ECC71',
      neutral: '#95A5A6',
      negative: '#E74C3C',
      unknown: '#BDC3C7',
    };
    return colors[this.sentiment] || '#BDC3C7';
  };

  CommunicationLog.prototype.getConversationThread = function () {
    // This would need to query for related messages in the thread
    return this.constructor.findAll({
      where: {
        threadId: this.threadId,
        shopId: this.shopId,
      },
      order: [['createdAt', 'ASC']],
    });
  };

  CommunicationLog.prototype.markAsOpened = function (openData = {}) {
    return this.update({
      status: this.status === 'delivered' ? 'opened' : this.status,
      wasOpened: true,
      openCount: (this.openCount || 0) + 1,
      openedAt: this.openedAt || new Date(),
      lastOpenedAt: new Date(),
      deviceType: openData.deviceType,
      userAgent: openData.userAgent,
      ipAddress: openData.ipAddress,
      location: openData.location,
    });
  };

  CommunicationLog.prototype.markAsClicked = function (clickData = {}) {
    return this.update({
      status: 'clicked',
      wasClicked: true,
      clickCount: (this.clickCount || 0) + 1,
      clickedAt: this.clickedAt || new Date(),
      lastClickedAt: new Date(),
      clickedLinks: [...(this.clickedLinks || []), clickData.url].filter(
        Boolean
      ),
    });
  };

  CommunicationLog.prototype.addResponse = function (
    responseContent,
    sentiment = null
  ) {
    return this.update({
      status: 'replied',
      responseReceived: true,
      responseContent: responseContent,
      repliedAt: new Date(),
      sentiment: sentiment,
    });
  };

  return CommunicationLog;
};
