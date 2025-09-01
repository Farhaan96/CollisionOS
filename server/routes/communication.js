const express = require('express');
const router = express.Router();
const {
  Job,
  Customer,
  Vehicle,
  User,
  Communication,
  CommunicationTemplate,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const { auditLogger } = require('../middleware/security');
const rateLimit = require('express-rate-limit');

// Rate limiting for communications
const communicationLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 communications per 5 minutes
  message: { error: 'Too many communication requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Communication channels
const COMMUNICATION_CHANNELS = {
  SMS: 'sms',
  EMAIL: 'email',
  PHONE: 'phone',
  PORTAL: 'portal',
  IN_PERSON: 'in_person',
};

// Communication types and triggers
const COMMUNICATION_TYPES = {
  job_created: {
    name: 'Job Created',
    defaultChannels: ['email', 'sms'],
    autoSend: true,
    priority: 'medium',
  },
  estimate_ready: {
    name: 'Estimate Ready',
    defaultChannels: ['email', 'sms'],
    autoSend: true,
    priority: 'high',
  },
  estimate_approved: {
    name: 'Estimate Approved',
    defaultChannels: ['email'],
    autoSend: false,
    priority: 'medium',
  },
  job_started: {
    name: 'Work Started',
    defaultChannels: ['sms'],
    autoSend: true,
    priority: 'medium',
  },
  parts_ordered: {
    name: 'Parts Ordered',
    defaultChannels: ['email'],
    autoSend: true,
    priority: 'low',
  },
  parts_delay: {
    name: 'Parts Delayed',
    defaultChannels: ['email', 'sms'],
    autoSend: true,
    priority: 'high',
  },
  progress_update: {
    name: 'Progress Update',
    defaultChannels: ['sms'],
    autoSend: false,
    priority: 'medium',
  },
  quality_check: {
    name: 'Quality Check Complete',
    defaultChannels: ['email'],
    autoSend: false,
    priority: 'low',
  },
  ready_pickup: {
    name: 'Ready for Pickup',
    defaultChannels: ['email', 'sms'],
    autoSend: true,
    priority: 'high',
  },
  pickup_reminder: {
    name: 'Pickup Reminder',
    defaultChannels: ['sms'],
    autoSend: true,
    priority: 'medium',
  },
  delivered: {
    name: 'Vehicle Delivered',
    defaultChannels: ['email'],
    autoSend: true,
    priority: 'medium',
  },
  payment_due: {
    name: 'Payment Due',
    defaultChannels: ['email', 'sms'],
    autoSend: true,
    priority: 'high',
  },
  satisfaction_survey: {
    name: 'Satisfaction Survey',
    defaultChannels: ['email'],
    autoSend: true,
    priority: 'low',
  },
  appointment_reminder: {
    name: 'Appointment Reminder',
    defaultChannels: ['sms'],
    autoSend: true,
    priority: 'high',
  },
  custom: {
    name: 'Custom Message',
    defaultChannels: ['email', 'sms'],
    autoSend: false,
    priority: 'medium',
  },
};

// Default message templates
const DEFAULT_TEMPLATES = {
  job_created: {
    sms: "Hi {customerName}, we've received your {vehicleDescription} for repairs. Job #{jobNumber}. We'll keep you updated!",
    email: {
      subject: 'Your Vehicle Repair Job Has Been Created - #{jobNumber}',
      html: `
        <h2>Thank you for choosing our services!</h2>
        <p>Dear {customerName},</p>
        <p>We've received your <strong>{vehicleDescription}</strong> for repairs.</p>
        <p><strong>Job Details:</strong></p>
        <ul>
          <li>Job Number: #{jobNumber}</li>
          <li>Vehicle: {vehicleDescription}</li>
          <li>Date Received: {dateCreated}</li>
          <li>Estimated Completion: {estimatedCompletion}</li>
        </ul>
        <p>You can track your repair progress anytime by visiting our customer portal.</p>
        <p>Best regards,<br/>The {shopName} Team</p>
      `,
    },
  },
  estimate_ready: {
    sms: 'Your repair estimate for {vehicleDescription} is ready! Total: {estimateAmount}. Please review and approve to begin work. Job #{jobNumber}',
    email: {
      subject: 'Repair Estimate Ready for Approval - #{jobNumber}',
      html: '<h2>Your Repair Estimate is Ready</h2><p>Dear {customerName},</p><p>We have completed the assessment of your <strong>{vehicleDescription}</strong> and your repair estimate is now ready for review.</p><p><strong>Estimate Summary:</strong></p><ul><li>Total Estimate: <strong>{estimateAmount}</strong></li><li>Labor: {laborAmount}</li><li>Parts: {partsAmount}</li><li>Estimated Repair Time: {estimatedDays} days</li></ul><p>Please review and approve your estimate to begin the repair process.</p><p><a href="{approvalLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review & Approve Estimate</a></p><p>If you have any questions, please don\'t hesitate to contact us.</p><p>Best regards,<br/>The {shopName} Team</p>',
    },
  },
  ready_pickup: {
    sms: 'Great news! Your {vehicleDescription} is ready for pickup! Please bring your ID and payment method. Job #{jobNumber}',
    email: {
      subject: 'Your Vehicle is Ready for Pickup! - #{jobNumber}',
      html: `
        <h2>Your Vehicle is Ready!</h2>
        <p>Dear {customerName},</p>
        <p>Excellent news! The repairs on your <strong>{vehicleDescription}</strong> have been completed and your vehicle is ready for pickup.</p>
        <p><strong>Pickup Information:</strong></p>
        <ul>
          <li>Job Number: #{jobNumber}</li>
          <li>Total Amount Due: {totalAmount}</li>
          <li>Pickup Hours: {pickupHours}</li>
          <li>Please bring: Photo ID and payment method</li>
        </ul>
        <p><strong>Work Completed:</strong></p>
        <p>{workSummary}</p>
        <p>Thank you for trusting us with your vehicle repair needs!</p>
        <p>Best regards,<br/>The {shopName} Team</p>
      `,
    },
  },
};

// POST /api/communication/send - Send communication to customer
router.post('/send', communicationLimit, async (req, res) => {
  try {
    const {
      customerId,
      jobId,
      type,
      channels,
      message,
      subject,
      templateId,
      templateVariables = {},
      sendImmediately = true,
      scheduledDate = null,
    } = req.body;

    const userId = req.user?.id;
    const shopId = req.user?.shopId || 1;

    if (!customerId || !type) {
      return res
        .status(400)
        .json({ error: 'Customer ID and communication type are required' });
    }

    // Get customer and job details
    const customer = await Customer.findByPk(customerId, {
      include: [
        {
          model: Job,
          as: 'jobs',
          where: jobId ? { id: jobId } : {},
          required: !!jobId,
          include: [{ model: Vehicle, as: 'vehicle' }],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const job = jobId ? customer.jobs.find(j => j.id === jobId) : null;

    // Determine channels to use
    const communicationType = COMMUNICATION_TYPES[type];
    const selectedChannels = channels ||
      communicationType?.defaultChannels || ['email'];

    // Prepare template variables
    const variables = {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shopName: 'CollisionOS Auto Body',
      jobNumber: job?.jobNumber || 'N/A',
      vehicleDescription: job?.vehicle
        ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
        : 'Vehicle',
      dateCreated: job?.createdAt
        ? new Date(job.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      estimatedCompletion: job?.estimatedCompletionDate
        ? new Date(job.estimatedCompletionDate).toLocaleDateString()
        : 'TBD',
      ...templateVariables,
    };

    // Get or create message content
    let messageContent = {};
    if (templateId) {
      const template = await CommunicationTemplate.findByPk(templateId);
      if (template) {
        messageContent = this.processTemplate(template.content, variables);
      }
    } else if (message || subject) {
      messageContent = {
        sms: message,
        email: {
          subject: subject || 'Update from Auto Body Shop',
          html: message || '',
        },
      };
    } else if (DEFAULT_TEMPLATES[type]) {
      messageContent = this.processTemplate(DEFAULT_TEMPLATES[type], variables);
    }

    // Send communications
    const results = [];
    for (const channel of selectedChannels) {
      try {
        const result = await this.sendCommunication({
          channel,
          customer,
          job,
          type,
          content:
            messageContent[channel] || messageContent.sms || messageContent,
          sendImmediately,
          scheduledDate,
          userId,
          shopId,
        });
        results.push(result);
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error.message,
        });
      }
    }

    // Log communication attempt
    const communication = await Communication.create({
      customerId,
      jobId,
      shopId,
      type,
      channels: selectedChannels,
      content: messageContent,
      status: results.every(r => r.success) ? 'sent' : 'partial_failure',
      sentBy: userId,
      sentAt: sendImmediately ? new Date() : null,
      scheduledAt: scheduledDate,
      results,
      metadata: {
        templateId,
        variables,
        automaticSend: !sendImmediately,
      },
    });

    // Audit logging
    auditLogger.info('Communication sent', {
      communicationId: communication.id,
      customerId,
      jobId,
      type,
      channels: selectedChannels,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'communication_sent', {
      communication,
      customer: { id: customer.id, name: customer.name },
      job: job ? { id: job.id, jobNumber: job.jobNumber } : null,
      results,
    });

    res.json({
      success: true,
      communication,
      results,
      summary: {
        totalChannels: selectedChannels.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({ error: 'Failed to send communication' });
  }
});

// POST /api/communication/auto-trigger - Trigger automated communications
router.post('/auto-trigger', async (req, res) => {
  try {
    const { jobId, trigger, additionalData = {} } = req.body;
    const shopId = req.user?.shopId || 1;

    if (!jobId || !trigger) {
      return res
        .status(400)
        .json({ error: 'Job ID and trigger type are required' });
    }

    const job = await Job.findByPk(jobId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const communicationType = COMMUNICATION_TYPES[trigger];
    if (!communicationType || !communicationType.autoSend) {
      return res
        .status(400)
        .json({ error: 'Invalid or non-automatic communication trigger' });
    }

    // Check customer communication preferences
    const customerPreferences = job.customer.communicationPreferences || {};
    const allowedChannels = communicationType.defaultChannels.filter(
      channel => customerPreferences[channel] !== false
    );

    if (allowedChannels.length === 0) {
      return res.json({
        success: true,
        message: 'Communication skipped due to customer preferences',
        triggered: false,
      });
    }

    // Prepare template variables with additional data
    const variables = {
      customerName: job.customer.name,
      jobNumber: job.jobNumber,
      vehicleDescription: `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`,
      shopName: 'CollisionOS Auto Body',
      ...additionalData,
    };

    // Process and send communication
    const template = DEFAULT_TEMPLATES[trigger];
    const processedTemplate = this.processTemplate(template, variables);

    const results = [];
    for (const channel of allowedChannels) {
      try {
        const result = await this.sendCommunication({
          channel,
          customer: job.customer,
          job,
          type: trigger,
          content: processedTemplate[channel],
          sendImmediately: true,
          userId: null, // Automatic
          shopId,
        });
        results.push(result);
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error.message,
        });
      }
    }

    // Log automatic communication
    const communication = await Communication.create({
      customerId: job.customer.id,
      jobId: job.id,
      shopId,
      type: trigger,
      channels: allowedChannels,
      content: processedTemplate,
      status: results.every(r => r.success) ? 'sent' : 'partial_failure',
      sentBy: null, // Automatic
      sentAt: new Date(),
      results,
      metadata: {
        automaticTrigger: trigger,
        variables,
        automaticSend: true,
      },
    });

    auditLogger.info('Automatic communication triggered', {
      trigger,
      jobId,
      customerId: job.customer.id,
      channels: allowedChannels,
      success: results.filter(r => r.success).length,
    });

    res.json({
      success: true,
      triggered: true,
      communication,
      results,
      summary: {
        trigger,
        channels: allowedChannels.length,
        successful: results.filter(r => r.success).length,
      },
    });
  } catch (error) {
    console.error('Error triggering automatic communication:', error);
    res
      .status(500)
      .json({ error: 'Failed to trigger automatic communication' });
  }
});

// GET /api/communication/history/:customerId - Get customer communication history
router.get('/history/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, offset = 0, type, channel } = req.query;

    const whereClause = { customerId };
    if (type) whereClause.type = type;

    const communications = await Communication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'jobNumber', 'status'],
          required: false,
        },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Filter by channel if specified
    let filteredCommunications = communications.rows;
    if (channel) {
      filteredCommunications = communications.rows.filter(comm =>
        comm.channels.includes(channel)
      );
    }

    // Calculate metrics
    const metrics = {
      totalCommunications: communications.count,
      byType: {},
      byChannel: {},
      responseRate: 0,
      averageResponseTime: 0,
    };

    filteredCommunications.forEach(comm => {
      // Count by type
      metrics.byType[comm.type] = (metrics.byType[comm.type] || 0) + 1;

      // Count by channel
      comm.channels.forEach(ch => {
        metrics.byChannel[ch] = (metrics.byChannel[ch] || 0) + 1;
      });
    });

    res.json({
      communications: filteredCommunications.map(comm => ({
        ...comm.toJSON(),
        deliveryStatus: this.getDeliveryStatus(comm.results),
        responseRequired: this.requiresResponse(comm.type),
        readStatus: comm.metadata?.readAt ? 'read' : 'unread',
      })),
      pagination: {
        total: communications.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < communications.count,
      },
      metrics,
    });
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ error: 'Failed to fetch communication history' });
  }
});

// POST /api/communication/templates - Create communication template
router.post('/templates', async (req, res) => {
  try {
    const { name, type, channels, content, isDefault = false } = req.body;
    const shopId = req.user?.shopId || 1;
    const userId = req.user?.id;

    if (!name || !type || !content) {
      return res
        .status(400)
        .json({ error: 'Name, type, and content are required' });
    }

    const template = await CommunicationTemplate.create({
      name,
      type,
      channels: channels || ['email', 'sms'],
      content,
      isDefault,
      shopId,
      createdBy: userId,
      isActive: true,
    });

    auditLogger.info('Communication template created', {
      templateId: template.id,
      name,
      type,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error creating communication template:', error);
    res.status(500).json({ error: 'Failed to create communication template' });
  }
});

// GET /api/communication/templates - Get communication templates
router.get('/templates', async (req, res) => {
  try {
    const { type, channel, active = true } = req.query;
    const shopId = req.user?.shopId || 1;

    const whereClause = { shopId, isActive: active === 'true' };
    if (type) whereClause.type = type;

    const templates = await CommunicationTemplate.findAll({
      where: whereClause,
      order: [
        ['isDefault', 'DESC'],
        ['name', 'ASC'],
      ],
    });

    // Filter by channel if specified
    let filteredTemplates = templates;
    if (channel) {
      filteredTemplates = templates.filter(template =>
        template.channels.includes(channel)
      );
    }

    res.json({
      templates: filteredTemplates,
      availableTypes: Object.keys(COMMUNICATION_TYPES),
      availableChannels: Object.values(COMMUNICATION_CHANNELS),
    });
  } catch (error) {
    console.error('Error fetching communication templates:', error);
    res.status(500).json({ error: 'Failed to fetch communication templates' });
  }
});

// POST /api/communication/bulk-send - Send bulk communications
router.post('/bulk-send', communicationLimit, async (req, res) => {
  try {
    const {
      recipients,
      type,
      content,
      channels,
      sendImmediately = true,
    } = req.body;
    const userId = req.user?.id;
    const shopId = req.user?.shopId || 1;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (recipients.length > 100) {
      return res
        .status(400)
        .json({ error: 'Maximum 100 recipients allowed per bulk send' });
    }

    const results = [];
    const summary = { successful: 0, failed: 0, total: recipients.length };

    for (const recipient of recipients) {
      try {
        const customer = await Customer.findByPk(recipient.customerId);
        if (!customer) {
          results.push({
            customerId: recipient.customerId,
            success: false,
            error: 'Customer not found',
          });
          summary.failed++;
          continue;
        }

        // Send to each channel
        const channelResults = [];
        for (const channel of channels) {
          const result = await this.sendCommunication({
            channel,
            customer,
            job: null,
            type,
            content: content[channel] || content,
            sendImmediately,
            userId,
            shopId,
          });
          channelResults.push(result);
        }

        // Log bulk communication
        await Communication.create({
          customerId: recipient.customerId,
          shopId,
          type,
          channels,
          content,
          status: channelResults.every(r => r.success)
            ? 'sent'
            : 'partial_failure',
          sentBy: userId,
          sentAt: sendImmediately ? new Date() : null,
          results: channelResults,
          metadata: {
            bulkSend: true,
            bulkId: `BULK_${Date.now()}`,
          },
        });

        results.push({
          customerId: recipient.customerId,
          success: channelResults.some(r => r.success),
          channels: channelResults,
          error: channelResults.every(r => !r.success)
            ? 'All channels failed'
            : null,
        });

        if (channelResults.some(r => r.success)) {
          summary.successful++;
        } else {
          summary.failed++;
        }
      } catch (error) {
        results.push({
          customerId: recipient.customerId,
          success: false,
          error: error.message,
        });
        summary.failed++;
      }
    }

    auditLogger.info('Bulk communication sent', {
      type,
      recipientCount: recipients.length,
      successful: summary.successful,
      failed: summary.failed,
      userId,
    });

    res.json({
      success: summary.successful > 0,
      results,
      summary,
    });
  } catch (error) {
    console.error('Error sending bulk communication:', error);
    res.status(500).json({ error: 'Failed to send bulk communication' });
  }
});

// Helper methods
router.sendCommunication = async function ({
  channel,
  customer,
  job,
  type,
  content,
  sendImmediately,
  userId,
  shopId,
}) {
  try {
    switch (channel) {
      case COMMUNICATION_CHANNELS.SMS:
        return await this.sendSMS(customer.phone, content);
      case COMMUNICATION_CHANNELS.EMAIL:
        return await this.sendEmail(customer.email, content);
      case COMMUNICATION_CHANNELS.PHONE:
        return {
          channel,
          success: true,
          message: 'Phone call logged',
          requiresManualAction: true,
        };
      default:
        throw new Error(`Unsupported communication channel: ${channel}`);
    }
  } catch (error) {
    return { channel, success: false, error: error.message };
  }
};

router.sendSMS = async function (phoneNumber, message) {
  // Mock SMS sending - integrate with Twilio, TextMagic, etc.
  console.log(`SMS to ${phoneNumber}: ${message}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  // Mock success/failure
  if (Math.random() > 0.1) {
    // 90% success rate
    return {
      channel: 'sms',
      success: true,
      messageId: `SMS_${Date.now()}`,
      deliveredAt: new Date(),
      cost: 0.015, // $0.015 per SMS
    };
  } else {
    throw new Error('SMS delivery failed');
  }
};

router.sendEmail = async function (emailAddress, content) {
  // Mock email sending - integrate with SendGrid, Mailgun, etc.
  const subject =
    typeof content === 'object'
      ? content.subject
      : 'Update from Auto Body Shop';
  const body = typeof content === 'object' ? content.html : content;

  console.log(`Email to ${emailAddress}: ${subject}`);

  // Simulate network delay
  await new Promise(resolve =>
    setTimeout(resolve, Math.random() * 2000 + 1000)
  );

  // Mock success/failure
  if (Math.random() > 0.05) {
    // 95% success rate
    return {
      channel: 'email',
      success: true,
      messageId: `EMAIL_${Date.now()}`,
      deliveredAt: new Date(),
      cost: 0.001, // $0.001 per email
    };
  } else {
    throw new Error('Email delivery failed');
  }
};

router.processTemplate = function (template, variables) {
  if (typeof template === 'string') {
    return this.replaceVariables(template, variables);
  }

  if (typeof template === 'object') {
    const processed = {};
    Object.keys(template).forEach(key => {
      if (typeof template[key] === 'string') {
        processed[key] = this.replaceVariables(template[key], variables);
      } else if (typeof template[key] === 'object') {
        processed[key] = {};
        Object.keys(template[key]).forEach(subKey => {
          processed[key][subKey] = this.replaceVariables(
            template[key][subKey],
            variables
          );
        });
      }
    });
    return processed;
  }

  return template;
};

router.replaceVariables = function (template, variables) {
  let result = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), variables[key] || '');
  });
  return result;
};

router.getDeliveryStatus = function (results) {
  if (!results || results.length === 0) return 'unknown';

  const successful = results.filter(r => r.success).length;
  const total = results.length;

  if (successful === 0) return 'failed';
  if (successful === total) return 'delivered';
  return 'partial';
};

router.requiresResponse = function (type) {
  return [
    'estimate_ready',
    'appointment_reminder',
    'satisfaction_survey',
  ].includes(type);
};

module.exports = router;
