/**
 * Stripe Payment Service - CollisionOS
 *
 * Handles credit card payment processing via Stripe
 * PCI DSS compliant - never stores raw card data
 */

const Decimal = require('decimal.js');

class StripePaymentService {
  constructor() {
    // Initialize Stripe only if API key is available
    this.stripeClient = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
    this.currency = 'usd';
  }

  /**
   * Create a payment intent for credit card processing
   * @param {Object} params - Payment intent parameters
   * @param {number} params.amount - Amount in dollars
   * @param {string} params.currency - Currency code (default: USD)
   * @param {string} params.customerId - Stripe customer ID (optional)
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent object
   */
  async createPaymentIntent({ amount, currency = 'usd', customerId, metadata = {} }) {
    try {
      // Convert dollars to cents (Stripe uses cents)
      const amountInCents = new Decimal(amount).times(100).toFixed(0);

      const intentParams = {
        amount: parseInt(amountInCents),
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          source: 'collision_os',
          timestamp: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true
        }
      };

      // Associate with existing customer if provided
      if (customerId) {
        intentParams.customer = customerId;
      }

      const paymentIntent = await this.stripeClient.paymentIntents.create(intentParams);

      console.log('Payment intent created:', paymentIntent.id);

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: amount,
          currency: currency,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID from Stripe Elements
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: new Decimal(paymentIntent.amount).div(100).toNumber(),
          currency: paymentIntent.currency
        }
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: new Decimal(paymentIntent.amount).div(100).toNumber(),
          currency: paymentIntent.currency,
          charges: paymentIntent.charges.data.map(charge => ({
            id: charge.id,
            amount: new Decimal(charge.amount).div(100).toNumber(),
            status: charge.status,
            paid: charge.paid,
            paymentMethod: charge.payment_method_details
          }))
        }
      };
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or retrieve a Stripe customer
   * @param {Object} customerData - Customer information
   * @param {string} customerData.email - Customer email
   * @param {string} customerData.name - Customer name
   * @param {string} customerData.phone - Customer phone
   * @param {Object} customerData.metadata - Additional metadata
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const { email, name, phone, metadata = {} } = customerData;

      // Check if customer already exists
      const existingCustomers = await this.stripeClient.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return {
          success: true,
          customer: existingCustomers.data[0],
          isNew: false
        };
      }

      // Create new customer
      const customer = await this.stripeClient.customers.create({
        email,
        name,
        phone,
        metadata: {
          ...metadata,
          source: 'collision_os'
        }
      });

      return {
        success: true,
        customer,
        isNew: true
      };
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save a payment method for future use
   * @param {string} paymentMethodId - Payment method ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Payment method details
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await this.stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return {
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year
          } : null
        }
      };
    } catch (error) {
      console.error('Failed to attach payment method:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a refund
   * @param {string} paymentIntentId - Payment intent ID to refund
   * @param {number} amount - Amount to refund (optional, defaults to full amount)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        reason
      };

      if (amount) {
        refundParams.amount = new Decimal(amount).times(100).toFixed(0);
      }

      const refund = await this.stripeClient.refunds.create(refundParams);

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: new Decimal(refund.amount).div(100).toNumber(),
          status: refund.status,
          reason: refund.reason
        }
      };
    } catch (error) {
      console.error('Refund failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Calculate Stripe processing fee
   * @param {number} amount - Payment amount
   * @returns {Object} Fee breakdown
   */
  calculateProcessingFee(amount) {
    // Stripe US pricing: 2.9% + $0.30 per transaction
    const percentageFee = new Decimal(amount).times(0.029);
    const fixedFee = new Decimal(0.30);
    const totalFee = percentageFee.plus(fixedFee);

    return {
      amount: parseFloat(amount),
      percentageFee: percentageFee.toFixed(2),
      fixedFee: fixedFee.toFixed(2),
      totalFee: totalFee.toFixed(2),
      netAmount: new Decimal(amount).minus(totalFee).toFixed(2)
    };
  }

  /**
   * List payment methods for a customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} List of payment methods
   */
  async listPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          } : null,
          createdAt: new Date(pm.created * 1000)
        }))
      };
    } catch (error) {
      console.error('Failed to list payment methods:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe event object
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhookEvent(event) {
    try {
      console.log('Processing Stripe webhook:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);

        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);

        case 'charge.refunded':
          return await this.handleChargeRefunded(event.data.object);

        case 'customer.created':
          console.log('Customer created:', event.data.object.id);
          return { success: true, processed: true };

        default:
          console.log('Unhandled event type:', event.type);
          return { success: true, processed: false };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle successful payment
   * @private
   */
  async handlePaymentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    // Update payment record in database
    // This will be handled by the payment routes
    return { success: true, event: 'payment_succeeded' };
  }

  /**
   * Handle failed payment
   * @private
   */
  async handlePaymentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
    // Update payment record and notify user
    return { success: true, event: 'payment_failed' };
  }

  /**
   * Handle charge refunded
   * @private
   */
  async handleChargeRefunded(charge) {
    console.log('Charge refunded:', charge.id);
    // Update payment record
    return { success: true, event: 'charge_refunded' };
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Request body
   * @param {string} signature - Stripe signature header
   * @returns {Object|null} Verified event or null
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  }
}

module.exports = new StripePaymentService();
