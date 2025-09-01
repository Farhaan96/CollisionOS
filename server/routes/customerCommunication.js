/**
 * CollisionOS Customer Communication APIs
 * Phase 2 Backend Development
 *
 * Multi-channel communication with automation triggers
 * Features:
 * - SMS and Email automation for 13 communication types
 * - Customer notification templates with dynamic variables
 * - Multi-channel delivery (SMS, Email, Portal) with tracking
 * - Bulk communication system (up to 100 recipients)
 * - Communication history and engagement metrics
 * - Template management with automated triggers
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const {
  ContactTimeline,
  CommunicationTemplate,
  CommunicationLog,
  Customer,
  RepairOrderManagement,
  User,
  ProductionWorkflow,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const rateLimit = require('express-rate-limit');

// Rate limiting for communication operations
const communicationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 communications per 15 minutes
  message: 'Too many communication requests, please try again later.',
});

// Bulk communication rate limiting
const bulkCommunicationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk communications per hour
  message: 'Too many bulk communications, please try again later.',
});

/**
 * POST /api/communication/send - Send communications with multi-channel support
 *
 * Body: {
 *   customer_id: string,
 *   template_id?: string,
 *   channels: ['sms', 'email', 'portal'],
 *   message: {
 *     subject?: string,
 *     content: string,
 *     variables?: object
 *   },
 *   priority: 'low' | 'normal' | 'high' | 'urgent',
 *   scheduled_send?: string,
 *   ro_id?: string,
 *   communication_type: string
 * }
 */
router.post('/send', communicationRateLimit, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      customer_id,
      template_id,
      channels = ['email'],
      message,
      priority = 'normal',
      scheduled_send,
      ro_id,
      communication_type = 'general',
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate customer
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get template if specified
    let template = null;
    if (template_id) {
      template = await CommunicationTemplate.findOne({
        where: { id: template_id, shopId },
      });
    }

    // Prepare message content with variable substitution
    const processed_message = await processMessageContent(
      message,
      template,
      customer,
      ro_id,
      shopId
    );

    // Validate channels and customer contact info
    const delivery_channels = await validateDeliveryChannels(
      channels,
      customer
    );

    if (delivery_channels.valid_channels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid delivery channels available for customer',
        details: delivery_channels.channel_issues,
      });
    }

    // Create communication log entry
    const communication_log = await CommunicationLog.create({
      customerId: customer_id,
      repairOrderId: ro_id,
      templateId: template_id,
      communication_type,
      channels: JSON.stringify(delivery_channels.valid_channels),
      subject: processed_message.subject,
      message_content: processed_message.content,
      priority,
      status: scheduled_send ? 'scheduled' : 'sending',
      scheduled_send_date: scheduled_send ? new Date(scheduled_send) : null,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Send messages through each channel
    const delivery_results = [];

    if (!scheduled_send) {
      for (const channel of delivery_channels.valid_channels) {
        const delivery_result = await sendThroughChannel(
          channel,
          customer,
          processed_message,
          communication_log.id
        );
        delivery_results.push(delivery_result);
      }

      // Update communication log with delivery results
      const successful_deliveries = delivery_results.filter(r => r.success);
      const failed_deliveries = delivery_results.filter(r => !r.success);

      await CommunicationLog.update(
        {
          status: successful_deliveries.length > 0 ? 'sent' : 'failed',
          sent_date: successful_deliveries.length > 0 ? new Date() : null,
          delivery_results: JSON.stringify(delivery_results),
          failure_reason:
            failed_deliveries.length > 0
              ? failed_deliveries.map(f => f.error).join('; ')
              : null,
          updatedBy: userId,
        },
        {
          where: { id: communication_log.id },
        }
      );
    }

    // Create contact timeline entry
    await ContactTimeline.create({
      customerId: customer_id,
      jobId: ro_id,
      userId,
      templateId: template_id,
      interaction_type: 'outbound_communication',
      communication_channel: delivery_channels.valid_channels.join(', '),
      interaction_summary: processed_message.subject || 'Communication sent',
      interaction_details: processed_message.content.substring(0, 500),
      interaction_outcome: delivery_results.some(r => r.success)
        ? 'delivered'
        : 'failed',
      follow_up_required: priority === 'urgent',
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Broadcast real-time notification
    realtimeService.broadcastCommunicationUpdate(
      {
        communication_id: communication_log.id,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        communication_type,
        channels: delivery_channels.valid_channels,
        status: scheduled_send ? 'scheduled' : 'sent',
        priority,
      },
      'sent'
    );

    res.json({
      success: true,
      message: scheduled_send
        ? 'Communication scheduled successfully'
        : 'Communication sent successfully',
      data: {
        communication_id: communication_log.id,
        delivery_summary: {
          channels_attempted: delivery_channels.valid_channels,
          successful_deliveries: delivery_results.filter(r => r.success).length,
          failed_deliveries: delivery_results.filter(r => !r.success).length,
          delivery_results: scheduled_send ? null : delivery_results,
        },
        scheduling: scheduled_send
          ? {
              scheduled_for: scheduled_send,
              status: 'scheduled',
            }
          : null,
        next_steps: delivery_results.some(r => !r.success)
          ? ['Review failed deliveries', 'Consider alternative channels']
          : ['Monitor delivery confirmation', 'Track customer response'],
      },
    });
  } catch (error) {
    console.error('Communication send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send communication',
      error: error.message,
    });
  }
});

/**
 * POST /api/communication/auto-trigger - Automated communication triggers
 *
 * Body: {
 *   trigger_event: string,
 *   ro_id: string,
 *   event_data: object,
 *   override_settings?: object
 * }
 */
router.post('/auto-trigger', async (req, res) => {
  try {
    const {
      trigger_event,
      ro_id,
      event_data,
      override_settings = {},
    } = req.body;
    const { shopId, userId } = req.user;

    // Get repair order with customer
    const repair_order = await RepairOrderManagement.findOne({
      where: { id: ro_id, shopId },
      include: [
        {
          model: Customer,
          as: 'customer',
        },
      ],
    });

    if (!repair_order || !repair_order.customer) {
      return res.status(404).json({
        success: false,
        message: 'Repair order or customer not found',
      });
    }

    // Get automation template for this trigger event
    const automation_template = await getAutomationTemplate(
      trigger_event,
      shopId
    );

    if (!automation_template || !automation_template.enabled) {
      return res.json({
        success: true,
        message: 'Automation template not found or disabled for this event',
        data: { trigger_processed: false },
      });
    }

    // Check automation rules and conditions
    const automation_check = await evaluateAutomationRules(
      automation_template,
      repair_order,
      event_data
    );

    if (!automation_check.should_trigger) {
      return res.json({
        success: true,
        message: 'Automation conditions not met',
        data: {
          trigger_processed: false,
          reason: automation_check.reason,
        },
      });
    }

    // Process template with event-specific variables
    const template_variables = {
      ...event_data,
      customer_name: `${repair_order.customer.firstName} ${repair_order.customer.lastName}`,
      ro_number: repair_order.ro_number,
      shop_name: 'Auto Body Shop', // Would come from shop settings
      ...override_settings.variables,
    };

    const processed_message = {
      subject: substituteVariables(
        automation_template.subject,
        template_variables
      ),
      content: substituteVariables(
        automation_template.message_content,
        template_variables
      ),
    };

    // Determine delivery channels
    const channels = override_settings.channels ||
      automation_template.default_channels || ['email'];
    const delivery_channels = await validateDeliveryChannels(
      channels,
      repair_order.customer
    );

    // Create automated communication log
    const communication_log = await CommunicationLog.create({
      customerId: repair_order.customerId,
      repairOrderId: ro_id,
      templateId: automation_template.id,
      communication_type: `auto_${trigger_event}`,
      channels: JSON.stringify(delivery_channels.valid_channels),
      subject: processed_message.subject,
      message_content: processed_message.content,
      priority: automation_template.priority || 'normal',
      status: 'sending',
      automated: true,
      trigger_event: trigger_event,
      trigger_data: JSON.stringify(event_data),
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Send automated messages
    const delivery_results = [];
    for (const channel of delivery_channels.valid_channels) {
      const result = await sendThroughChannel(
        channel,
        repair_order.customer,
        processed_message,
        communication_log.id
      );
      delivery_results.push(result);
    }

    // Update log with results
    await CommunicationLog.update(
      {
        status: delivery_results.some(r => r.success) ? 'sent' : 'failed',
        sent_date: new Date(),
        delivery_results: JSON.stringify(delivery_results),
        updatedBy: userId,
      },
      {
        where: { id: communication_log.id },
      }
    );

    // Create timeline entry
    await ContactTimeline.create({
      customerId: repair_order.customerId,
      jobId: ro_id,
      userId,
      templateId: automation_template.id,
      interaction_type: 'automated_communication',
      communication_channel: delivery_channels.valid_channels.join(', '),
      interaction_summary: `Auto: ${trigger_event} - ${processed_message.subject}`,
      interaction_details: processed_message.content.substring(0, 500),
      interaction_outcome: delivery_results.some(r => r.success)
        ? 'delivered'
        : 'failed',
      automated: true,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Broadcast real-time notification
    realtimeService.broadcastCommunicationUpdate(
      {
        communication_id: communication_log.id,
        customer_name: `${repair_order.customer.firstName} ${repair_order.customer.lastName}`,
        ro_number: repair_order.ro_number,
        trigger_event,
        channels: delivery_channels.valid_channels,
        automated: true,
      },
      'auto_sent'
    );

    res.json({
      success: true,
      message: 'Automated communication triggered successfully',
      data: {
        communication_id: communication_log.id,
        trigger_event,
        automation_template: automation_template.name,
        delivery_summary: {
          channels_used: delivery_channels.valid_channels,
          successful_deliveries: delivery_results.filter(r => r.success).length,
          delivery_results,
        },
      },
    });
  } catch (error) {
    console.error('Auto-trigger communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger automated communication',
      error: error.message,
    });
  }
});

/**
 * GET /api/communication/history/:customerId - Customer communication history
 */
router.get('/history/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopId } = req.user;
    const {
      limit = 50,
      offset = 0,
      channel,
      communication_type,
      date_from,
      date_to,
      include_timeline = true,
    } = req.query;

    // Build filters
    const where_clause = { customerId, shopId };
    if (channel) where_clause.channels = { [Op.like]: `%${channel}%` };
    if (communication_type)
      where_clause.communication_type = communication_type;

    if (date_from || date_to) {
      where_clause.created_at = {};
      if (date_from) where_clause.created_at[Op.gte] = new Date(date_from);
      if (date_to) where_clause.created_at[Op.lte] = new Date(date_to);
    }

    // Get communication logs
    const { count, rows: communications } =
      await CommunicationLog.findAndCountAll({
        where: where_clause,
        include: [
          {
            model: CommunicationTemplate,
            as: 'template',
            attributes: ['name', 'category', 'communication_type'],
          },
          {
            model: RepairOrderManagement,
            as: 'repairOrder',
            attributes: ['ro_number', 'status'],
            required: false,
          },
          {
            model: User,
            as: 'creator',
            attributes: ['firstName', 'lastName'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

    // Get contact timeline if requested
    let timeline_entries = [];
    if (include_timeline === 'true') {
      timeline_entries = await ContactTimeline.findAll({
        where: { customerId, shopId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 20,
      });
    }

    // Calculate communication analytics
    const analytics = await calculateCommunicationAnalytics(customerId, shopId);

    res.json({
      success: true,
      data: {
        customer_id: customerId,
        communication_history: communications.map(formatCommunicationLog),
        timeline_entries: timeline_entries.map(formatTimelineEntry),
        analytics,
        pagination: {
          total_communications: count,
          current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          per_page: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit)),
        },
        filters_applied: {
          channel: channel || 'all',
          communication_type: communication_type || 'all',
          date_range: { from: date_from, to: date_to },
        },
      },
    });
  } catch (error) {
    console.error('Communication history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get communication history',
      error: error.message,
    });
  }
});

/**
 * POST /api/communication/templates - Manage communication templates
 *
 * Body: {
 *   name: string,
 *   category: string,
 *   communication_type: string,
 *   subject: string,
 *   message_content: string,
 *   default_channels: string[],
 *   automated: boolean,
 *   trigger_events?: string[],
 *   automation_rules?: object,
 *   variables?: string[]
 * }
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      category,
      communication_type,
      subject,
      message_content,
      default_channels = ['email'],
      automated = false,
      trigger_events = [],
      automation_rules = {},
      variables = [],
    } = req.body;
    const { shopId, userId } = req.user;

    // Create template
    const template = await CommunicationTemplate.create({
      name,
      category,
      communication_type,
      subject,
      message_content,
      default_channels: JSON.stringify(default_channels),
      automated,
      trigger_events: JSON.stringify(trigger_events),
      automation_rules: JSON.stringify(automation_rules),
      available_variables: JSON.stringify(variables),
      enabled: true,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    res.json({
      success: true,
      message: 'Communication template created successfully',
      data: {
        template_id: template.id,
        name: template.name,
        category: template.category,
        automated: template.automated,
        trigger_events: JSON.parse(template.trigger_events),
      },
    });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
});

/**
 * GET /api/communication/templates - Get template library
 */
router.get('/templates', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { category, automated, communication_type } = req.query;

    const where_clause = { shopId };
    if (category) where_clause.category = category;
    if (automated !== undefined) where_clause.automated = automated === 'true';
    if (communication_type)
      where_clause.communication_type = communication_type;

    const templates = await CommunicationTemplate.findAll({
      where: where_clause,
      order: [
        ['category', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    // Group templates by category
    const templates_by_category = {};
    const automation_templates = [];

    templates.forEach(template => {
      const template_data = {
        template_id: template.id,
        name: template.name,
        communication_type: template.communication_type,
        subject: template.subject,
        default_channels: JSON.parse(template.default_channels || '["email"]'),
        automated: template.automated,
        enabled: template.enabled,
        usage_count: template.usage_count || 0,
        variables: JSON.parse(template.available_variables || '[]'),
      };

      // Group by category
      if (!templates_by_category[template.category]) {
        templates_by_category[template.category] = [];
      }
      templates_by_category[template.category].push(template_data);

      // Separate automation templates
      if (template.automated) {
        automation_templates.push({
          ...template_data,
          trigger_events: JSON.parse(template.trigger_events || '[]'),
          automation_rules: JSON.parse(template.automation_rules || '{}'),
        });
      }
    });

    res.json({
      success: true,
      data: {
        templates_by_category,
        automation_templates,
        template_categories: Object.keys(templates_by_category),
        total_templates: templates.length,
        automated_templates: automation_templates.length,
      },
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message,
    });
  }
});

/**
 * POST /api/communication/bulk-send - Bulk communications
 *
 * Body: {
 *   recipient_type: 'customers' | 'active_jobs' | 'custom_list',
 *   recipients: string[] | object,
 *   template_id?: string,
 *   message: {
 *     subject: string,
 *     content: string
 *   },
 *   channels: string[],
 *   priority: 'low' | 'normal' | 'high',
 *   scheduled_send?: string
 * }
 */
router.post('/bulk-send', bulkCommunicationRateLimit, async (req, res) => {
  try {
    const {
      recipient_type,
      recipients,
      template_id,
      message,
      channels = ['email'],
      priority = 'normal',
      scheduled_send,
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate bulk send limits
    const recipient_list = await buildRecipientList(
      recipient_type,
      recipients,
      shopId
    );

    if (recipient_list.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients found',
      });
    }

    if (recipient_list.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Bulk communication limited to 100 recipients per batch',
      });
    }

    // Get template if specified
    let template = null;
    if (template_id) {
      template = await CommunicationTemplate.findOne({
        where: { id: template_id, shopId },
      });
    }

    // Create bulk communication job
    const bulk_job_id = `BULK-${Date.now()}`;
    const delivery_results = [];

    // Process each recipient
    for (const recipient of recipient_list) {
      try {
        // Process message content for this recipient
        const processed_message = await processMessageContent(
          message,
          template,
          recipient.customer,
          recipient.ro_id,
          shopId
        );

        // Create individual communication log
        const comm_log = await CommunicationLog.create({
          customerId: recipient.customer.id,
          repairOrderId: recipient.ro_id,
          templateId: template_id,
          communication_type: 'bulk_communication',
          channels: JSON.stringify(channels),
          subject: processed_message.subject,
          message_content: processed_message.content,
          priority,
          status: scheduled_send ? 'scheduled' : 'sending',
          scheduled_send_date: scheduled_send ? new Date(scheduled_send) : null,
          bulk_job_id,
          shopId,
          createdBy: userId,
          updatedBy: userId,
        });

        // Send if not scheduled
        if (!scheduled_send) {
          const delivery_channels = await validateDeliveryChannels(
            channels,
            recipient.customer
          );
          const channel_results = [];

          for (const channel of delivery_channels.valid_channels) {
            const result = await sendThroughChannel(
              channel,
              recipient.customer,
              processed_message,
              comm_log.id
            );
            channel_results.push(result);
          }

          // Update communication log
          await CommunicationLog.update(
            {
              status: channel_results.some(r => r.success) ? 'sent' : 'failed',
              sent_date: new Date(),
              delivery_results: JSON.stringify(channel_results),
              updatedBy: userId,
            },
            {
              where: { id: comm_log.id },
            }
          );

          delivery_results.push({
            customer_id: recipient.customer.id,
            customer_name: `${recipient.customer.firstName} ${recipient.customer.lastName}`,
            channels_attempted: delivery_channels.valid_channels,
            success: channel_results.some(r => r.success),
            results: channel_results,
          });
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.customer.id}:`, error);
        delivery_results.push({
          customer_id: recipient.customer.id,
          customer_name: `${recipient.customer.firstName} ${recipient.customer.lastName}`,
          success: false,
          error: error.message,
        });
      }
    }

    // Calculate summary
    const successful_sends = delivery_results.filter(r => r.success).length;
    const failed_sends = delivery_results.filter(r => !r.success).length;

    // Broadcast bulk communication update
    realtimeService.broadcastCommunicationUpdate(
      {
        bulk_job_id,
        recipient_count: recipient_list.length,
        successful_sends,
        failed_sends,
        status: scheduled_send ? 'scheduled' : 'completed',
        channels,
      },
      'bulk_sent'
    );

    res.json({
      success: true,
      message: scheduled_send
        ? `Bulk communication scheduled for ${recipient_list.length} recipients`
        : `Bulk communication completed: ${successful_sends} sent, ${failed_sends} failed`,
      data: {
        bulk_job_id,
        summary: {
          total_recipients: recipient_list.length,
          successful_sends,
          failed_sends,
          success_rate:
            recipient_list.length > 0
              ? ((successful_sends / recipient_list.length) * 100).toFixed(1)
              : '0.0',
        },
        delivery_results: scheduled_send ? null : delivery_results,
        scheduled_details: scheduled_send
          ? {
              scheduled_for: scheduled_send,
              estimated_completion: 'Within 1 hour of scheduled time',
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Bulk communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk communication',
      error: error.message,
    });
  }
});

/**
 * Helper Functions
 */

async function processMessageContent(
  message,
  template,
  customer,
  ro_id,
  shopId
) {
  // Use template content if available, otherwise use provided message
  const base_subject =
    template?.subject || message.subject || 'Update from Auto Body Shop';
  const base_content = template?.message_content || message.content;

  // Build variable context
  const variables = {
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_full_name: `${customer.firstName} ${customer.lastName}`,
    shop_name: 'Auto Body Shop', // Would come from shop settings
    current_date: new Date().toLocaleDateString(),
    current_time: new Date().toLocaleTimeString(),
    ...message.variables,
  };

  // Add RO-specific variables if applicable
  if (ro_id) {
    const ro = await RepairOrderManagement.findByPk(ro_id);
    if (ro) {
      variables.ro_number = ro.ro_number;
      variables.ro_status = ro.status;
      variables.estimated_completion = ro.estimated_completion_date || 'TBD';
    }
  }

  return {
    subject: substituteVariables(base_subject, variables),
    content: substituteVariables(base_content, variables),
  };
}

function substituteVariables(text, variables) {
  if (!text) return '';

  let result = text;
  Object.keys(variables).forEach(key => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, variables[key] || '');
  });

  return result;
}

async function validateDeliveryChannels(channels, customer) {
  const valid_channels = [];
  const channel_issues = [];

  for (const channel of channels) {
    switch (channel) {
      case 'sms':
        if (customer.phone && customer.sms_opt_in !== false) {
          valid_channels.push('sms');
        } else {
          channel_issues.push('SMS: No phone number or opted out');
        }
        break;

      case 'email':
        if (customer.email && customer.email_opt_in !== false) {
          valid_channels.push('email');
        } else {
          channel_issues.push('Email: No email address or opted out');
        }
        break;

      case 'portal':
        if (customer.portal_enabled) {
          valid_channels.push('portal');
        } else {
          channel_issues.push('Portal: Customer portal not enabled');
        }
        break;

      default:
        channel_issues.push(`${channel}: Unsupported channel`);
    }
  }

  return { valid_channels, channel_issues };
}

async function sendThroughChannel(
  channel,
  customer,
  message,
  communication_log_id
) {
  // Mock implementation - in real system would integrate with actual services
  try {
    switch (channel) {
      case 'sms':
        // Integration with SMS service (Twilio, etc.)
        console.log(
          `SMS to ${customer.phone}: ${message.content.substring(0, 50)}...`
        );
        return {
          channel: 'sms',
          success: true,
          delivery_id: `SMS-${Date.now()}`,
          sent_at: new Date().toISOString(),
        };

      case 'email':
        // Integration with email service (SendGrid, etc.)
        console.log(`Email to ${customer.email}: ${message.subject}`);
        return {
          channel: 'email',
          success: true,
          delivery_id: `EMAIL-${Date.now()}`,
          sent_at: new Date().toISOString(),
        };

      case 'portal':
        // Create portal notification
        console.log(`Portal notification for customer ${customer.id}`);
        return {
          channel: 'portal',
          success: true,
          delivery_id: `PORTAL-${Date.now()}`,
          sent_at: new Date().toISOString(),
        };

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  } catch (error) {
    return {
      channel,
      success: false,
      error: error.message,
      attempted_at: new Date().toISOString(),
    };
  }
}

async function getAutomationTemplate(trigger_event, shopId) {
  return await CommunicationTemplate.findOne({
    where: {
      shopId,
      automated: true,
      enabled: true,
      trigger_events: { [Op.like]: `%${trigger_event}%` },
    },
  });
}

async function evaluateAutomationRules(template, repair_order, event_data) {
  // Simple rule evaluation - in real implementation would be more sophisticated
  const rules = JSON.parse(template.automation_rules || '{}');

  // Example rules evaluation
  if (rules.only_business_hours && !isBusinessHours()) {
    return { should_trigger: false, reason: 'Outside business hours' };
  }

  if (rules.min_job_value && repair_order.total_amount < rules.min_job_value) {
    return { should_trigger: false, reason: 'Job value below threshold' };
  }

  return { should_trigger: true, reason: 'All conditions met' };
}

function isBusinessHours() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  return day >= 1 && day <= 5 && hour >= 8 && hour < 18; // Mon-Fri 8AM-6PM
}

function formatCommunicationLog(log) {
  return {
    communication_id: log.id,
    communication_type: log.communication_type,
    subject: log.subject,
    channels: JSON.parse(log.channels || '[]'),
    status: log.status,
    priority: log.priority,
    automated: log.automated || false,
    created_date: log.created_at,
    sent_date: log.sent_date,
    template_name: log.template?.name,
    ro_number: log.repairOrder?.ro_number,
    created_by: log.creator
      ? `${log.creator.firstName} ${log.creator.lastName}`
      : null,
    delivery_success: log.delivery_results
      ? JSON.parse(log.delivery_results).some(r => r.success)
      : null,
  };
}

function formatTimelineEntry(entry) {
  return {
    timeline_id: entry.id,
    interaction_type: entry.interaction_type,
    interaction_date: entry.created_at,
    summary: entry.interaction_summary,
    channel: entry.communication_channel,
    outcome: entry.interaction_outcome,
    automated: entry.automated || false,
    user: entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : null,
    follow_up_required: entry.follow_up_required,
  };
}

async function calculateCommunicationAnalytics(customerId, shopId) {
  const total_communications = await CommunicationLog.count({
    where: { customerId, shopId },
  });

  const successful_communications = await CommunicationLog.count({
    where: { customerId, shopId, status: 'sent' },
  });

  const automated_communications = await CommunicationLog.count({
    where: { customerId, shopId, automated: true },
  });

  // Get channel preferences
  const channel_usage = await CommunicationLog.findAll({
    where: { customerId, shopId },
    attributes: [
      'channels',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['channels'],
  });

  return {
    total_communications,
    successful_communications,
    automated_communications,
    success_rate:
      total_communications > 0
        ? ((successful_communications / total_communications) * 100).toFixed(1)
        : '0.0',
    automation_rate:
      total_communications > 0
        ? ((automated_communications / total_communications) * 100).toFixed(1)
        : '0.0',
    preferred_channels: channel_usage.map(usage => ({
      channels: JSON.parse(usage.channels || '[]'),
      usage_count: parseInt(usage.dataValues.count),
    })),
  };
}

async function buildRecipientList(recipient_type, recipients, shopId) {
  switch (recipient_type) {
    case 'customers':
      // Get all active customers
      const customers = await Customer.findAll({
        where: { shopId, status: 'active' },
      });
      return customers.map(customer => ({ customer, ro_id: null }));

    case 'active_jobs':
      // Get customers with active repair orders
      const active_ros = await RepairOrderManagement.findAll({
        where: {
          shopId,
          status: {
            [Op.in]: ['in_progress', 'waiting_parts', 'ready_for_pickup'],
          },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });
      return active_ros.map(ro => ({ customer: ro.customer, ro_id: ro.id }));

    case 'custom_list':
      // Recipients provided as list of customer IDs
      const custom_customers = await Customer.findAll({
        where: { id: recipients, shopId },
      });
      return custom_customers.map(customer => ({ customer, ro_id: null }));

    default:
      return [];
  }
}

module.exports = router;
