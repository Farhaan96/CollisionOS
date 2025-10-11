/**
 * Payments API Routes - CollisionOS Phase 2
 *
 * Handles payment processing, recording, and management
 * Supports multiple payment types: cash, credit card, check, insurance
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const stripePaymentService = require('../services/stripePaymentService');
const { Payment } = require('../database/models');
const { Invoice } = require('../database/models');

/**
 * POST /api/payments
 * Create a new payment record
 */
router.post('/', [
  body('invoice_id').optional().isUUID(),
  body('repair_order_id').optional().isUUID(),
  body('payment_type').isIn(['cash', 'credit_card', 'debit_card', 'check', 'insurance', 'wire_transfer', 'ach']),
  body('amount').isFloat({ min: 0.01 }),
  body('payment_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      invoice_id,
      repair_order_id,
      payment_type,
      amount,
      payment_date,
      payment_method,
      notes,
      // Check-specific fields
      check_number,
      check_date,
      bank_name,
      // Insurance-specific fields
      insurance_company_id,
      claim_number,
      eob_reference,
      // Card details (from Stripe)
      gateway_transaction_id,
      card_last_four,
      card_brand
    } = req.body;

    const { shopId, userId } = req.user;

    // Generate payment number
    const paymentNumber = await Payment.generatePaymentNumber();

    // Calculate processing fee if credit card
    let processingFee = 0;
    let netAmount = amount;

    if (payment_type === 'credit_card' && payment_method === 'stripe') {
      const feeCalc = stripePaymentService.calculateProcessingFee(amount);
      processingFee = parseFloat(feeCalc.totalFee);
      netAmount = parseFloat(feeCalc.netAmount);
    }

    // Create payment record
    const payment = await Payment.create({
      shopId,
      repairOrderId: repair_order_id,
      invoiceId: invoice_id,
      paymentNumber,
      paymentType: payment_type,
      paymentMethod: payment_method || 'manual',
      paymentStatus: 'completed', // Mark as completed for non-card payments
      amount: parseFloat(amount),
      processingFee,
      netAmount,
      paymentDate: payment_date || new Date(),
      appliedDate: new Date(),
      notes,
      // Check details
      checkNumber: check_number,
      checkDate: check_date,
      bankName: bank_name,
      // Insurance details
      insuranceCompanyId: insurance_company_id,
      claimNumber: claim_number,
      eobReference: eob_reference,
      // Card details
      gatewayTransactionId: gateway_transaction_id,
      cardLastFour: card_last_four,
      cardBrand: card_brand,
      createdBy: userId
    });

    // Update invoice if provided
    if (invoice_id) {
      const invoice = await Invoice.findByPk(invoice_id);
      if (invoice) {
        await invoice.recordPayment(amount);
      }
    }

    res.status(201).json({
      success: true,
      payment: payment.toJSON(),
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/stripe/intent
 * Create a Stripe payment intent
 */
router.post('/stripe/intent', [
  body('amount').isFloat({ min: 0.01 }),
  body('invoice_id').optional().isUUID(),
  body('customer_email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, invoice_id, customer_email, customer_name } = req.body;
    const { shopId } = req.user;

    // Create or get Stripe customer if email provided
    let stripeCustomerId = null;
    if (customer_email) {
      const customerResult = await stripePaymentService.createCustomer({
        email: customer_email,
        name: customer_name,
        metadata: {
          shop_id: shopId,
          invoice_id: invoice_id || ''
        }
      });

      if (customerResult.success) {
        stripeCustomerId = customerResult.customer.id;
      }
    }

    // Create payment intent
    const result = await stripePaymentService.createPaymentIntent({
      amount: parseFloat(amount),
      customerId: stripeCustomerId,
      metadata: {
        shop_id: shopId,
        invoice_id: invoice_id || '',
        source: 'collision_os_web'
      }
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      clientSecret: result.paymentIntent.clientSecret,
      paymentIntentId: result.paymentIntent.id,
      amount: result.paymentIntent.amount
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/stripe/confirm
 * Confirm a Stripe payment and create payment record
 */
router.post('/stripe/confirm', [
  body('payment_intent_id').notEmpty(),
  body('invoice_id').optional().isUUID(),
  body('repair_order_id').optional().isUUID()
], async (req, res) => {
  try {
    const { payment_intent_id, invoice_id, repair_order_id } = req.body;
    const { shopId, userId } = req.user;

    // Retrieve payment intent from Stripe
    const intentResult = await stripePaymentService.getPaymentIntent(payment_intent_id);

    if (!intentResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to retrieve payment intent'
      });
    }

    const paymentIntent = intentResult.paymentIntent;

    // Check if payment already recorded
    const existingPayment = await Payment.findOne({
      where: { gatewayTransactionId: payment_intent_id }
    });

    if (existingPayment) {
      return res.json({
        success: true,
        payment: existingPayment.toJSON(),
        message: 'Payment already recorded'
      });
    }

    // Extract card details from charges
    const charge = paymentIntent.charges[0];
    const cardDetails = charge?.paymentMethod?.card || {};

    // Calculate fees
    const amount = paymentIntent.amount;
    const feeCalc = stripePaymentService.calculateProcessingFee(amount);

    // Create payment record
    const payment = await Payment.create({
      shopId,
      repairOrderId: repair_order_id,
      invoiceId: invoice_id,
      paymentNumber: await Payment.generatePaymentNumber(),
      paymentType: 'credit_card',
      paymentMethod: 'stripe',
      paymentStatus: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      amount,
      processingFee: parseFloat(feeCalc.totalFee),
      netAmount: parseFloat(feeCalc.netAmount),
      gatewayTransactionId: payment_intent_id,
      gatewayReference: charge?.id,
      gatewayResponse: paymentIntent,
      cardLastFour: cardDetails.last4,
      cardBrand: cardDetails.brand,
      paymentDate: new Date(),
      appliedDate: new Date(),
      createdBy: userId
    });

    // Update invoice
    if (invoice_id) {
      const invoice = await Invoice.findByPk(invoice_id);
      if (invoice) {
        await invoice.recordPayment(amount);
      }
    }

    res.json({
      success: true,
      payment: payment.toJSON(),
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments
 * List payments with filtering
 */
router.get('/', [
  query('invoice_id').optional().isUUID(),
  query('repair_order_id').optional().isUUID(),
  query('payment_type').optional(),
  query('payment_status').optional(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const {
      invoice_id,
      repair_order_id,
      payment_type,
      payment_status,
      limit = 20,
      page = 1
    } = req.query;

    const { shopId } = req.user;
    const offset = (page - 1) * limit;

    const where = { shopId };
    if (invoice_id) where.invoiceId = invoice_id;
    if (repair_order_id) where.repairOrderId = repair_order_id;
    if (payment_type) where.paymentType = payment_type;
    if (payment_status) where.paymentStatus = payment_status;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      payments: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const payment = await Payment.findOne({
      where: { id, shopId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: payment.toJSON()
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/:id/refund
 * Process a payment refund
 */
router.post('/:id/refund', [
  param('id').isUUID(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const { shopId, userId } = req.user;

    const payment = await Payment.findOne({
      where: { id, shopId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        error: 'Payment cannot be refunded'
      });
    }

    // Process refund via Stripe
    const refundResult = await stripePaymentService.createRefund(
      payment.gatewayTransactionId,
      amount || payment.amount,
      reason || 'requested_by_customer'
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        error: refundResult.error
      });
    }

    // Update payment status
    payment.paymentStatus = 'refunded';
    payment.notes = `${payment.notes || ''}\nRefunded: ${refundResult.refund.amount} on ${new Date().toISOString()}`;
    await payment.save();

    // Update invoice if linked
    if (payment.invoiceId) {
      const invoice = await Invoice.findByPk(payment.invoiceId);
      if (invoice) {
        invoice.paidAmount = parseFloat(invoice.paidAmount) - parseFloat(refundResult.refund.amount);
        invoice.balanceDue = parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount);
        invoice.invoiceStatus = invoice.balanceDue > 0 ? 'partial' : 'paid';
        await invoice.save();
      }
    }

    res.json({
      success: true,
      payment: payment.toJSON(),
      refund: refundResult.refund,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const event = stripePaymentService.verifyWebhookSignature(payload, signature);

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Process webhook event
    const result = await stripePaymentService.handleWebhookEvent(event);

    res.json({
      success: true,
      received: true
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
