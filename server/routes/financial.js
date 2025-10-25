const express = require('express');
const router = express.Router();
const {
  Job,
  Customer,
  Vehicle,
  Invoice,
  Payment,
  FinancialTransaction,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const { auditLogger } = require('../middleware/security');
const rateLimit = require('express-rate-limit');

// Rate limiting for financial operations
const financialLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 financial operations per 5 minutes
  message: { error: 'Too many financial requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment processing configurations
const PAYMENT_PROCESSORS = {
  stripe: {
    name: 'Stripe',
    apiKey: process.env.STRIPE_SECRET_KEY,
    enabled: true,
    supportedMethods: ['card', 'ach', 'apple_pay', 'google_pay'],
    fees: { card: 0.029, ach: 0.008 }, // 2.9% for cards, 0.8% for ACH
  },
  square: {
    name: 'Square',
    apiKey: process.env.SQUARE_ACCESS_TOKEN,
    enabled: true,
    supportedMethods: ['card', 'contactless'],
    fees: { card: 0.026, contactless: 0.026 }, // 2.6%
  },
  paypal: {
    name: 'PayPal',
    apiKey: process.env.PAYPAL_CLIENT_SECRET,
    enabled: true,
    supportedMethods: ['paypal', 'card'],
    fees: { paypal: 0.0349, card: 0.0349 }, // 3.49%
  },
};

// Tax rates by state/province
const TAX_RATES = {
  CA: { rate: 0.0875, name: 'California State Tax' },
  NY: { rate: 0.08, name: 'New York State Tax' },
  TX: { rate: 0.0625, name: 'Texas State Tax' },
  FL: { rate: 0.06, name: 'Florida State Tax' },
  DEFAULT: { rate: 0.075, name: 'Default Sales Tax' },
};

// Invoice statuses and payment terms
const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

const PAYMENT_TERMS = {
  NET_0: { days: 0, name: 'Due Upon Receipt' },
  NET_15: { days: 15, name: 'Net 15 Days' },
  NET_30: { days: 30, name: 'Net 30 Days' },
  NET_60: { days: 60, name: 'Net 60 Days' },
};

// POST /api/financial/invoice/generate - Generate invoice from job
router.post('/invoice/generate', financialLimit, async (req, res) => {
  try {
    const {
      jobId,
      paymentTerms = 'NET_0',
      discounts = [],
      additionalCharges = [],
    } = req.body;
    const shopId = req.user?.shopId || 1;
    const userId = req.user?.id;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get job with all related data
    const job = await Job.findByPk(jobId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'ready_pickup' && job.status !== 'delivered') {
      return res
        .status(400)
        .json({ error: 'Cannot generate invoice for incomplete job' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ where: { jobId } });
    if (existingInvoice) {
      return res
        .status(409)
        .json({ error: 'Invoice already exists for this job' });
    }

    // Calculate invoice amounts
    const invoiceData = await this.calculateInvoiceAmounts(
      job,
      discounts,
      additionalCharges
    );

    // Determine tax rate
    const taxRate = this.getTaxRate(job.customer.state || 'DEFAULT');
    const taxAmount = invoiceData.subtotal * taxRate.rate;

    // Calculate due date
    const paymentTerm = PAYMENT_TERMS[paymentTerms];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerm.days);

    // Create invoice
    const invoice = await Invoice.create({
      jobId,
      customerId: job.customer.id,
      shopId,
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate,
      paymentTerms,
      status: INVOICE_STATUS.DRAFT,
      subtotal: invoiceData.subtotal,
      taxRate: taxRate.rate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: invoiceData.totalDiscounts,
      additionalCharges: invoiceData.totalAdditional,
      totalAmount:
        Math.round(
          (invoiceData.subtotal +
            taxAmount -
            invoiceData.totalDiscounts +
            invoiceData.totalAdditional) *
            100
        ) / 100,
      lineItems: invoiceData.lineItems,
      notes: job.notes || '',
      createdBy: userId,
      metadata: {
        jobNumber: job.jobNumber,
        vehicleInfo: `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`,
        taxRateUsed: taxRate.name,
        discounts,
        additionalCharges,
      },
    });

    // Update job with invoice reference
    await job.update({ invoiceId: invoice.id, financialStatus: 'invoiced' });

    // Audit logging
    auditLogger.info('Invoice generated', {
      invoiceId: invoice.id,
      jobId,
      customerId: job.customer.id,
      amount: invoice.totalAmount,
      createdBy: userId,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'invoice_generated', {
      invoice,
      job: { id: job.id, jobNumber: job.jobNumber },
      customer: { id: job.customer.id, name: job.customer.name },
    });

    res.status(201).json({
      success: true,
      invoice,
      calculations: {
        subtotal: invoiceData.subtotal,
        taxRate: taxRate.rate,
        taxAmount,
        discounts: invoiceData.totalDiscounts,
        additionalCharges: invoiceData.totalAdditional,
        total: invoice.totalAmount,
      },
      recommendations: this.generateInvoiceRecommendations(invoice, job),
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// POST /api/financial/payment/process - Process customer payment
router.post('/payment/process', financialLimit, async (req, res) => {
  try {
    const {
      invoiceId,
      paymentMethod,
      processor = 'stripe',
      amount,
      paymentMethodId, // For Stripe payment methods
      customerPaymentInfo,
      metadata = {},
    } = req.body;

    const shopId = req.user?.shopId || 1;
    const userId = req.user?.id;

    if (!invoiceId || !paymentMethod || !amount) {
      return res
        .status(400)
        .json({ error: 'Invoice ID, payment method, and amount are required' });
    }

    // Get invoice with customer info
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Job, as: 'job' },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === INVOICE_STATUS.PAID) {
      return res.status(400).json({ error: 'Invoice is already fully paid' });
    }

    // Validate payment amount
    const remainingBalance = invoice.totalAmount - (invoice.paidAmount || 0);
    if (amount > remainingBalance) {
      return res
        .status(400)
        .json({ error: 'Payment amount exceeds remaining balance' });
    }

    // Get processor configuration
    const processorConfig = PAYMENT_PROCESSORS[processor];
    if (!processorConfig || !processorConfig.enabled) {
      return res
        .status(400)
        .json({ error: 'Invalid or disabled payment processor' });
    }

    // Process payment through selected processor
    const processingResult = await this.processPayment({
      processor,
      config: processorConfig,
      paymentMethod,
      amount,
      paymentMethodId,
      customerPaymentInfo,
      invoice,
      metadata,
    });

    if (!processingResult.success) {
      return res.status(400).json({
        error: 'Payment processing failed',
        details: processingResult.error,
        code: processingResult.errorCode,
      });
    }

    // Calculate processing fee
    const feeRate =
      processorConfig.fees[paymentMethod] || processorConfig.fees.card;
    const processingFee = Math.round(amount * feeRate * 100) / 100;
    const netAmount = amount - processingFee;

    // Create payment record
    const payment = await Payment.create({
      invoiceId,
      customerId: invoice.customer.id,
      jobId: invoice.job.id,
      shopId,
      paymentNumber: this.generatePaymentNumber(),
      paymentDate: new Date(),
      paymentMethod,
      processor,
      amount,
      processingFee,
      netAmount,
      status: processingResult.status,
      transactionId: processingResult.transactionId,
      processorResponse: processingResult.response,
      processedBy: userId,
      metadata: {
        ...metadata,
        processorFeeRate: feeRate,
        customerInfo: customerPaymentInfo,
      },
    });

    // Update invoice payment status
    const newPaidAmount = (invoice.paidAmount || 0) + amount;
    const newStatus =
      newPaidAmount >= invoice.totalAmount
        ? INVOICE_STATUS.PAID
        : INVOICE_STATUS.PARTIAL;

    await invoice.update({
      paidAmount: newPaidAmount,
      status: newStatus,
      lastPaymentDate: new Date(),
    });

    // Update job financial status
    if (newStatus === INVOICE_STATUS.PAID) {
      await invoice.job.update({
        financialStatus: 'paid_in_full',
        status:
          invoice.job.status === 'ready_pickup'
            ? 'delivered'
            : invoice.job.status,
      });
    } else {
      await invoice.job.update({ financialStatus: 'partial_payment' });
    }

    // Create financial transaction record
    await FinancialTransaction.create({
      shopId,
      type: 'payment_received',
      category: 'revenue',
      amount: netAmount, // Net amount after fees
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      referenceType: 'payment',
      referenceId: payment.id,
      jobId: invoice.job.id,
      customerId: invoice.customer.id,
      transactionDate: new Date(),
      metadata: {
        grossAmount: amount,
        processingFee,
        paymentMethod,
        processor,
      },
    });

    // Audit logging
    auditLogger.info('Payment processed', {
      paymentId: payment.id,
      invoiceId,
      amount,
      paymentMethod,
      processor,
      transactionId: processingResult.transactionId,
      processedBy: userId,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'payment_processed', {
      payment,
      invoice: { id: invoice.id, status: newStatus, paidAmount: newPaidAmount },
      customer: { id: invoice.customer.id, name: invoice.customer.name },
    });

    // Auto-trigger communication for full payment
    if (newStatus === INVOICE_STATUS.PAID) {
      this.triggerPaymentReceivedNotification(invoice, payment);
    }

    res.json({
      success: true,
      payment,
      invoice: {
        id: invoice.id,
        status: newStatus,
        totalAmount: invoice.totalAmount,
        paidAmount: newPaidAmount,
        remainingBalance:
          Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100,
      },
      processing: {
        transactionId: processingResult.transactionId,
        processingFee,
        netAmount,
        feeRate,
      },
      recommendations: this.generatePaymentRecommendations(payment, invoice),
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// GET /api/financial/reconciliation - Job cost reconciliation
router.get('/reconciliation', async (req, res) => {
  try {
    const { startDate, endDate, jobId } = req.query;
    const shopId = req.user?.shopId || 1;

    const whereClause = { shopId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }
    if (jobId) whereClause.id = jobId;

    const jobs = await Job.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: Invoice, as: 'invoice' },
        {
          model: Payment,
          as: 'payments',
          required: false,
        },
      ],
    });

    const reconciliation = [];
    let totals = {
      totalJobs: jobs.length,
      totalEstimatedRevenue: 0,
      totalActualRevenue: 0,
      totalCosts: 0,
      totalProfit: 0,
      averageMargin: 0,
    };

    for (const job of jobs) {
      const laborCost = await this.calculateJobLaborCost(job.id);
      const partsCost = await this.calculateJobPartsCost(job.id);
      const totalCosts = laborCost + partsCost;

      const estimatedRevenue = job.estimatedAmount || 0;
      const actualRevenue = job.invoice ? job.invoice.paidAmount || 0 : 0;
      const profit = actualRevenue - totalCosts;
      const marginPercent =
        actualRevenue > 0 ? (profit / actualRevenue) * 100 : 0;

      const jobReconciliation = {
        job: {
          id: job.id,
          jobNumber: job.jobNumber,
          customer: job.customer.name,
          vehicle: `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`,
          status: job.status,
          createdDate: job.createdAt,
          completedDate: job.completedAt,
        },
        financial: {
          estimatedRevenue,
          actualRevenue,
          costs: {
            labor: laborCost,
            parts: partsCost,
            total: totalCosts,
          },
          profit,
          marginPercent: Math.round(marginPercent * 100) / 100,
          paymentStatus: job.invoice?.status || 'not_invoiced',
        },
        variance: {
          revenueVariance: actualRevenue - estimatedRevenue,
          revenueVariancePercent:
            estimatedRevenue > 0
              ? ((actualRevenue - estimatedRevenue) / estimatedRevenue) * 100
              : 0,
        },
        recommendations: this.generateReconciliationRecommendations(job, {
          estimatedRevenue,
          actualRevenue,
          totalCosts,
          marginPercent,
        }),
      };

      reconciliation.push(jobReconciliation);

      // Update totals
      totals.totalEstimatedRevenue += estimatedRevenue;
      totals.totalActualRevenue += actualRevenue;
      totals.totalCosts += totalCosts;
      totals.totalProfit += profit;
    }

    // Calculate average margin
    totals.averageMargin =
      totals.totalActualRevenue > 0
        ? (totals.totalProfit / totals.totalActualRevenue) * 100
        : 0;

    // Performance metrics
    const performance = {
      profitableJobs: reconciliation.filter(r => r.financial.profit > 0).length,
      unprofitableJobs: reconciliation.filter(r => r.financial.profit < 0)
        .length,
      averageJobValue: totals.totalActualRevenue / Math.max(jobs.length, 1),
      topPerformingJobs: reconciliation
        .sort((a, b) => b.financial.marginPercent - a.financial.marginPercent)
        .slice(0, 5),
      underperformingJobs: reconciliation
        .filter(r => r.financial.marginPercent < 10)
        .sort((a, b) => a.financial.marginPercent - b.financial.marginPercent)
        .slice(0, 5),
    };

    res.json({
      reconciliation,
      totals,
      performance,
      summary: {
        period: { startDate, endDate },
        generatedAt: new Date(),
        shopId,
      },
    });
  } catch (error) {
    console.error('Error generating reconciliation:', error);
    res.status(500).json({ error: 'Failed to generate reconciliation' });
  }
});

// GET /api/financial/reports/profit-analysis - Profit analysis report
router.get('/reports/profit-analysis', async (req, res) => {
  try {
    const { period = 'monthly', category, comparison = false } = req.query;
    const shopId = req.user?.shopId || 1;

    const analysis = await this.generateProfitAnalysis(
      shopId,
      period,
      category,
      comparison
    );

    res.json({
      analysis,
      metadata: {
        period,
        category,
        comparison,
        generatedAt: new Date(),
        shopId,
      },
    });
  } catch (error) {
    console.error('Error generating profit analysis:', error);
    res.status(500).json({ error: 'Failed to generate profit analysis' });
  }
});

// POST /api/financial/quickbooks/sync - QuickBooks integration sync
router.post('/quickbooks/sync', financialLimit, async (req, res) => {
  try {
    const { syncType = 'all', dateRange } = req.body;
    const shopId = req.user?.shopId || 1;
    const userId = req.user?.id;

    // Mock QuickBooks integration
    const syncResult = await this.syncWithQuickBooks(
      shopId,
      syncType,
      dateRange
    );

    auditLogger.info('QuickBooks sync initiated', {
      shopId,
      syncType,
      userId,
      recordCount: syncResult.recordCount,
    });

    res.json({
      success: true,
      syncResult,
      summary: {
        syncType,
        recordsSynced: syncResult.recordCount,
        errors: syncResult.errors.length,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error syncing with QuickBooks:', error);
    res.status(500).json({ error: 'Failed to sync with QuickBooks' });
  }
});

// Helper Methods
router.calculateInvoiceAmounts = async function (
  job,
  discounts = [],
  additionalCharges = []
) {
  // Calculate real labor and parts costs from database
  const laborAmount = (await this.calculateJobLaborCost(job.id)) ||
    (job.estimatedLaborHours ? job.estimatedLaborHours * 85 : 0); // Fallback to estimate
  const partsAmount = (await this.calculateJobPartsCost(job.id)) || 0;
  const subtotal = laborAmount + partsAmount;

  const lineItems = [
    {
      description: 'Labor',
      quantity: job.estimatedLaborHours || 6,
      unitPrice: 85,
      amount: laborAmount,
    },
    {
      description: 'Parts',
      quantity: 1,
      unitPrice: partsAmount,
      amount: partsAmount,
    },
  ];

  // Add additional charges
  let totalAdditional = 0;
  additionalCharges.forEach(charge => {
    totalAdditional += charge.amount;
    lineItems.push({
      description: charge.description,
      quantity: 1,
      unitPrice: charge.amount,
      amount: charge.amount,
    });
  });

  // Calculate discounts
  let totalDiscounts = 0;
  discounts.forEach(discount => {
    const discountAmount =
      discount.type === 'percentage'
        ? subtotal * (discount.value / 100)
        : discount.value;
    totalDiscounts += discountAmount;
  });

  return {
    subtotal: subtotal + totalAdditional,
    totalDiscounts,
    totalAdditional,
    lineItems,
  };
};

router.getTaxRate = function (state) {
  return TAX_RATES[state] || TAX_RATES.DEFAULT;
};

router.generateInvoiceNumber = function () {
  return 'INV' + Date.now().toString().slice(-8);
};

router.generatePaymentNumber = function () {
  return 'PAY' + Date.now().toString().slice(-8);
};

router.processPayment = async function ({
  processor,
  config,
  paymentMethod,
  amount,
  paymentMethodId,
  customerPaymentInfo,
  invoice,
  metadata,
}) {
  // Mock payment processing - replace with actual processor integration
  console.log(
    `Processing ${paymentMethod} payment of $${amount} via ${processor}`
  );

  // Simulate processing delay
  await new Promise(resolve =>
    setTimeout(resolve, Math.random() * 2000 + 1000)
  );

  // Mock success/failure (95% success rate)
  if (Math.random() > 0.05) {
    return {
      success: true,
      status: 'completed',
      transactionId: `TXN_${processor.toUpperCase()}_${Date.now()}`,
      response: {
        processor,
        paymentMethod,
        amount,
        processedAt: new Date(),
        authCode: Math.random().toString(36).substr(2, 9).toUpperCase(),
      },
    };
  } else {
    return {
      success: false,
      error: 'Payment declined by processor',
      errorCode: 'CARD_DECLINED',
      response: {
        processor,
        errorCode: 'CARD_DECLINED',
        errorMessage: 'Insufficient funds',
      },
    };
  }
};

/**
 * Calculate actual labor cost for a job from database
 * Sums up all labor line items associated with the job
 */
router.calculateJobLaborCost = async function (jobId) {
  try {
    const { JobLabor, PartLine } = require('../database/models');
    const { Op } = require('sequelize');

    // Try JobLabor table if it exists
    try {
      const laborRecords = await JobLabor.findAll({
        where: { jobId },
        attributes: ['totalAmount', 'hourlyRate', 'actualHours']
      });

      if (laborRecords && laborRecords.length > 0) {
        return laborRecords.reduce((sum, labor) => {
          return sum + parseFloat(labor.totalAmount || 0);
        }, 0);
      }
    } catch (e) {
      // JobLabor table may not exist yet
    }

    // Fallback to estimating from job data or part lines with labor operation
    try {
      const laborParts = await PartLine.findAll({
        where: {
          jobId,
          operation: {
            [Op.in]: ['labor', 'refinish', 'paint']
          }
        },
        attributes: ['totalPrice']
      });

      if (laborParts && laborParts.length > 0) {
        return laborParts.reduce((sum, part) => {
          return sum + parseFloat(part.totalPrice || 0);
        }, 0);
      }
    } catch (e) {
      // PartLine table may not have these fields
    }

    // Default return if no labor data found
    return 0;
  } catch (error) {
    console.error('Error calculating job labor cost:', error);
    return 0;
  }
};

/**
 * Calculate actual parts cost for a job from database
 * Sums up all part line items associated with the job
 */
router.calculateJobPartsCost = async function (jobId) {
  try {
    const { PartLine, JobPart } = require('../database/models');
    const { Op } = require('sequelize');

    // Try JobPart table first (preferred structure)
    try {
      const jobParts = await JobPart.findAll({
        where: { jobId },
        attributes: ['totalCost']
      });

      if (jobParts && jobParts.length > 0) {
        return jobParts.reduce((sum, part) => {
          return sum + parseFloat(part.totalCost || 0);
        }, 0);
      }
    } catch (e) {
      // JobPart table may not exist
    }

    // Fallback to PartLine table
    try {
      const partLines = await PartLine.findAll({
        where: {
          jobId,
          operation: {
            [Op.in]: ['replace', 'repair', 'part']
          }
        },
        attributes: ['totalCost', 'unitCost', 'quantity']
      });

      if (partLines && partLines.length > 0) {
        return partLines.reduce((sum, part) => {
          const cost = part.totalCost || (parseFloat(part.unitCost || 0) * parseInt(part.quantity || 0));
          return sum + cost;
        }, 0);
      }
    } catch (e) {
      // PartLine table may not exist
    }

    // Default return if no parts data found
    return 0;
  } catch (error) {
    console.error('Error calculating job parts cost:', error);
    return 0;
  }
};

router.generateInvoiceRecommendations = function (invoice, job) {
  const recommendations = [];

  if (invoice.totalAmount > 5000) {
    recommendations.push({
      type: 'payment_plan',
      message: 'Consider offering payment plan for large invoice',
      action: 'Set up installment payments',
    });
  }

  if (
    job.customer.paymentHistory &&
    job.customer.paymentHistory.includes('late')
  ) {
    recommendations.push({
      type: 'payment_terms',
      message: 'Customer has history of late payments',
      action: 'Consider shorter payment terms or deposit requirement',
    });
  }

  return recommendations;
};

router.generatePaymentRecommendations = function (payment, invoice) {
  const recommendations = [];

  if (invoice.status === INVOICE_STATUS.PAID) {
    recommendations.push({
      type: 'satisfaction_survey',
      message: 'Payment complete - send satisfaction survey',
      action: 'Trigger customer satisfaction survey',
    });
  }

  return recommendations;
};

router.generateReconciliationRecommendations = function (job, financial) {
  const recommendations = [];

  if (financial.marginPercent < 10) {
    recommendations.push({
      type: 'margin_improvement',
      message: 'Low profit margin - review pricing',
      action: 'Analyze costs and adjust pricing strategy',
    });
  }

  if (financial.actualRevenue < financial.estimatedRevenue * 0.9) {
    recommendations.push({
      type: 'estimate_accuracy',
      message: 'Actual revenue significantly below estimate',
      action: 'Review estimating process for accuracy',
    });
  }

  return recommendations;
};

router.generateProfitAnalysis = async function (
  shopId,
  period,
  category,
  comparison
) {
  // Mock profit analysis
  return {
    revenue: { current: 45000, previous: 42000 },
    costs: { current: 28000, previous: 26000 },
    profit: { current: 17000, previous: 16000 },
    margin: { current: 37.8, previous: 38.1 },
    trends: [
      { period: 'Jan', profit: 15000, margin: 35.2 },
      { period: 'Feb', profit: 16500, margin: 36.8 },
      { period: 'Mar', profit: 17000, margin: 37.8 },
    ],
  };
};

router.syncWithQuickBooks = async function (shopId, syncType, dateRange) {
  // Mock QuickBooks sync
  return {
    recordCount: 25,
    errors: [],
    syncedTypes: ['invoices', 'payments', 'customers'],
    lastSync: new Date(),
  };
};

router.triggerPaymentReceivedNotification = async function (invoice, payment) {
  // Mock notification trigger
  console.log(
    `Triggering payment received notification for invoice ${invoice.invoiceNumber}`
  );
};

// Legacy endpoint for compatibility
router.get('/', (req, res) => {
  res.json({
    revenueTrend: [
      { month: 'Jan', revenue: 45000 },
      { month: 'Feb', revenue: 48000 },
      { month: 'Mar', revenue: 52000 },
    ],
  });
});

module.exports = router;
