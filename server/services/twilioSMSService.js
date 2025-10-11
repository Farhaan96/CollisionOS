
// Twilio SMS Integration for CollisionOS
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

class TwilioSMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Send SMS message
   */
  async sendSMS(to, message, templateId = null) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      // Log message in database
      await this.logMessage({
        to: to,
        message: message,
        template_id: templateId,
        twilio_sid: result.sid,
        status: 'sent',
        direction: 'outbound'
      });

      return { success: true, message_sid: result.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send template-based SMS
   */
  async sendTemplateSMS(to, templateName, variables = {}) {
    try {
      // Get template from database
      const { data: template } = await this.supabase
        .from('sms_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Replace variables in template
      let message = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return await this.sendSMS(to, message, template.id);
    } catch (error) {
      console.error('Template SMS failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send automated reminders
   */
  async sendReminders() {
    try {
      // Get pending reminders
      const { data: reminders } = await this.supabase
        .from('sms_reminders')
        .select(`
          *,
          customers!inner(phone, first_name, last_name),
          repair_orders!inner(ro_number, status)
        `)
        .eq('status', 'pending')
        .lte('send_at', new Date().toISOString());

      for (const reminder of reminders) {
        const variables = {
          customer_name: reminder.customers.first_name,
          ro_number: reminder.repair_orders.ro_number,
          shop_name: 'CollisionOS Shop'
        };

        await this.sendTemplateSMS(
          reminder.customers.phone,
          reminder.template_name,
          variables
        );

        // Mark reminder as sent
        await this.supabase
          .from('sms_reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id);
      }

      return { success: true, sent: reminders.length };
    } catch (error) {
      console.error('Reminder sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle incoming SMS
   */
  async handleIncomingSMS(req, res) {
    try {
      const { From, Body, MessageSid } = req.body;

      // Find customer by phone number
      const { data: customer } = await this.supabase
        .from('customers')
        .select('*')
        .eq('phone', From)
        .single();

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Log incoming message
      await this.logMessage({
        from: From,
        message: Body,
        customer_id: customer.id,
        twilio_sid: MessageSid,
        status: 'received',
        direction: 'inbound'
      });

      // Auto-reply based on keywords
      const autoReply = await this.generateAutoReply(Body, customer);
      if (autoReply) {
        await this.sendSMS(From, autoReply);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Incoming SMS handling failed:', error);
      res.status(500).json({ error: 'SMS handling failed' });
    }
  }

  /**
   * Generate auto-reply based on message content
   */
  async generateAutoReply(message, customer) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('status') || lowerMessage.includes('update')) {
      // Get latest repair order status
      const { data: ro } = await this.supabase
        .from('repair_orders')
        .select('ro_number, status, estimated_completion')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ro) {
        return `Hi ${customer.first_name}, your repair order ${ro.ro_number} is currently ${ro.status}. Estimated completion: ${ro.estimated_completion}`;
      }
    }

    if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return `Hi ${customer.first_name}, to schedule an appointment, please call us at (555) 123-4567 or visit our website.`;
    }

    if (lowerMessage.includes('payment') || lowerMessage.includes('bill')) {
      return `Hi ${customer.first_name}, for payment information, please call us at (555) 123-4567 or visit our customer portal.`;
    }

    return `Hi ${customer.first_name}, thank you for your message. We'll get back to you soon. For immediate assistance, call (555) 123-4567.`;
  }

  /**
   * Log message in database
   */
  async logMessage(messageData) {
    try {
      await this.supabase
        .from('sms_messages')
        .insert({
          ...messageData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Message logging failed:', error);
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(recipients, message, templateId = null) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient.phone, message, templateId);
      results.push({ recipient, result });
    }

    return { success: true, results };
  }

  /**
   * Get SMS analytics
   */
  async getSMSAnalytics(shopId, dateRange) {
    try {
      const { data: messages } = await this.supabase
        .from('sms_messages')
        .select('direction, status, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      const analytics = {
        total_messages: messages.length,
        sent_messages: messages.filter(m => m.direction === 'outbound').length,
        received_messages: messages.filter(m => m.direction === 'inbound').length,
        delivery_rate: 0,
        response_rate: 0
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('SMS analytics failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TwilioSMSService;
