/**
 * Invoices API Routes - CollisionOS Phase 2
 *
 * Enhanced invoicing with multiple invoice types, payment tracking, and QuickBooks sync
 * Supports standard invoices, estimates, supplements, final invoices, and credit memos
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { Invoice, Payment, RepairOrder, Customer } = require('../database/models');

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post('/', [
  body('customer_id').isUUID(),
  body('repair_order_id').optional().isUUID(),
  body('invoice_type').isIn(['standard', 'estimate', 'supplement', 'final', 'credit_memo']),
  body('subtotal').isFloat({ min: 0 }),
  body('invoice_date').isISO8601()
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
      customer_id,
      repair_order_id,
      invoice_type,
      subtotal,
      tax_rate,
      discount_amount,
      labor_total,
      parts_total,
      sublet_total,
      insurance_company_id,
      claim_number,
      deductible_amount,
      invoice_date,
      due_date,
      payment_terms,
      notes
    } = req.body;

    const { shopId, userId } = req.user;

    // Validate customer exists
    const customer = await Customer.findOne({
      where: { id: customer_id, shopId }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Validate repair order if provided
    if (repair_order_id) {
      const ro = await RepairOrder.findOne({
        where: { id: repair_order_id, shopId }
      });

      if (!ro) {
        return res.status(404).json({
          success: false,
          error: 'Repair order not found'
        });
      }
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await Invoice.count({
      where: {
        shopId,
        invoiceNumber: {
          [require('sequelize').Op.like]: `INV-${year}-%`
        }
      }
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Calculate amounts
    const subtotalValue = parseFloat(subtotal);
    const taxRateValue = parseFloat(tax_rate || 0);
    const discountValue = parseFloat(discount_amount || 0);

    const taxAmount = (subtotalValue - discountValue) * (taxRateValue / 100);
    const totalAmount = subtotalValue - discountValue + taxAmount;
    const balanceDue = totalAmount;

    // Calculate due date if not provided
    let dueDateValue = due_date;
    if (!dueDateValue && payment_terms) {
      const invoiceDateObj = new Date(invoice_date);
      switch (payment_terms) {
        case 'due_on_receipt':
          dueDateValue = invoice_date;
          break;
        case 'net15':
          dueDateValue = new Date(invoiceDateObj.setDate(invoiceDateObj.getDate() + 15));
          break;
        case 'net30':
          dueDateValue = new Date(invoiceDateObj.setDate(invoiceDateObj.getDate() + 30));
          break;
        case 'net45':
          dueDateValue = new Date(invoiceDateObj.setDate(invoiceDateObj.getDate() + 45));
          break;
        case 'net60':
          dueDateValue = new Date(invoiceDateObj.setDate(invoiceDateObj.getDate() + 60));
          break;
      }
    }

    // Create invoice
    const invoice = await Invoice.create({
      shopId,
      customerId: customer_id,
      repairOrderId: repair_order_id,
      invoiceNumber,
      invoiceType: invoice_type,
      invoiceStatus: 'draft',
      subtotal: subtotalValue,
      taxRate: taxRateValue,
      taxAmount,
      discountAmount: discountValue,
      totalAmount,
      paidAmount: 0,
      balanceDue,
      laborTotal: parseFloat(labor_total || 0),
      partsTotal: parseFloat(parts_total || 0),
      subletTotal: parseFloat(sublet_total || 0),
      insuranceCompanyId: insurance_company_id,
      claimNumber: claim_number,
      deductibleAmount: parseFloat(deductible_amount || 0),
      invoiceDate: invoice_date,
      dueDate: dueDateValue,
      paymentTerms: payment_terms || 'net30',
      notes,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      invoice: invoice.toJSON(),
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices
 * List invoices with filtering and pagination
 */
router.get('/', [
  query('customer_id').optional().isUUID(),
  query('repair_order_id').optional().isUUID(),
  query('invoice_type').optional(),
  query('invoice_status').optional(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const {
      customer_id,
      repair_order_id,
      invoice_type,
      invoice_status,
      start_date,
      end_date,
      limit = 20,
      page = 1
    } = req.query;

    const { shopId } = req.user;
    const offset = (page - 1) * limit;

    const where = { shopId };
    if (customer_id) where.customerId = customer_id;
    if (repair_order_id) where.repairOrderId = repair_order_id;
    if (invoice_type) where.invoiceType = invoice_type;
    if (invoice_status) where.invoiceStatus = invoice_status;

    // Date range filter
    if (start_date || end_date) {
      where.invoiceDate = {};
      if (start_date) where.invoiceDate[require('sequelize').Op.gte] = start_date;
      if (end_date) where.invoiceDate[require('sequelize').Op.lte] = end_date;
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['invoiceDate', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber', 'status']
        }
      ]
    });

    // Calculate summary totals
    const summaryResult = await Invoice.findOne({
      where,
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'totalInvoiced'],
        [require('sequelize').fn('SUM', require('sequelize').col('paid_amount')), 'totalPaid'],
        [require('sequelize').fn('SUM', require('sequelize').col('balance_due')), 'totalOutstanding']
      ],
      raw: true
    });

    res.json({
      success: true,
      invoices: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      summary: {
        totalInvoiced: parseFloat(summaryResult.totalInvoiced || 0),
        totalPaid: parseFloat(summaryResult.totalPaid || 0),
        totalOutstanding: parseFloat(summaryResult.totalOutstanding || 0)
      }
    });

  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices/overdue
 * Get overdue invoices
 */
router.get('/overdue', async (req, res) => {
  try {
    const { shopId } = req.user;

    const invoices = await Invoice.findAll({
      where: {
        shopId,
        invoiceStatus: {
          [require('sequelize').Op.in]: ['sent', 'viewed', 'partial']
        },
        balanceDue: {
          [require('sequelize').Op.gt]: 0
        },
        dueDate: {
          [require('sequelize').Op.lt]: new Date()
        }
      },
      order: [['dueDate', 'ASC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    // Update status to overdue
    await Promise.all(
      invoices.map(invoice => {
        if (invoice.invoiceStatus !== 'overdue') {
          invoice.invoiceStatus = 'overdue';
          return invoice.save();
        }
      })
    );

    res.json({
      success: true,
      invoices,
      count: invoices.length
    });

  } catch (error) {
    console.error('Get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get invoice details with payment history
 */
router.get('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'email', 'phone', 'address']
        },
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber', 'status', 'vehicleId']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'paymentNumber', 'paymentType', 'amount', 'paymentDate', 'paymentStatus']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice: invoice.toJSON()
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/invoices/:id
 * Update invoice (only if draft)
 */
router.put('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Only allow updates if invoice is draft
    if (invoice.invoiceStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only update draft invoices'
      });
    }

    const {
      subtotal,
      tax_rate,
      discount_amount,
      labor_total,
      parts_total,
      sublet_total,
      due_date,
      payment_terms,
      notes
    } = req.body;

    // Update fields and recalculate
    if (subtotal !== undefined) invoice.subtotal = parseFloat(subtotal);
    if (tax_rate !== undefined) invoice.taxRate = parseFloat(tax_rate);
    if (discount_amount !== undefined) invoice.discountAmount = parseFloat(discount_amount);
    if (labor_total !== undefined) invoice.laborTotal = parseFloat(labor_total);
    if (parts_total !== undefined) invoice.partsTotal = parseFloat(parts_total);
    if (sublet_total !== undefined) invoice.subletTotal = parseFloat(sublet_total);
    if (due_date !== undefined) invoice.dueDate = due_date;
    if (payment_terms) invoice.paymentTerms = payment_terms;
    if (notes !== undefined) invoice.notes = notes;

    // Recalculate amounts
    const subtotalValue = parseFloat(invoice.subtotal);
    const discountValue = parseFloat(invoice.discountAmount);
    const taxRateValue = parseFloat(invoice.taxRate);

    invoice.taxAmount = (subtotalValue - discountValue) * (taxRateValue / 100);
    invoice.totalAmount = subtotalValue - discountValue + invoice.taxAmount;
    invoice.balanceDue = invoice.totalAmount - parseFloat(invoice.paidAmount || 0);

    await invoice.save();

    res.json({
      success: true,
      invoice: invoice.toJSON(),
      message: 'Invoice updated successfully'
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/invoices/:id/send
 * Mark invoice as sent
 */
router.post('/:id/send', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (invoice.invoiceStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already paid'
      });
    }

    invoice.invoiceStatus = 'sent';
    await invoice.save();

    // TODO: Send email notification to customer

    res.json({
      success: true,
      invoice: invoice.toJSON(),
      message: 'Invoice marked as sent'
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/invoices/:id/void
 * Void an invoice
 */
router.post('/:id/void', [
  param('id').isUUID(),
  body('reason').optional()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (invoice.invoiceStatus === 'void') {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already void'
      });
    }

    if (parseFloat(invoice.paidAmount) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot void invoice with payments. Issue a credit memo instead.'
      });
    }

    invoice.invoiceStatus = 'void';
    if (reason) {
      invoice.notes = (invoice.notes || '') + `\n\nVoided: ${reason}`;
    }
    await invoice.save();

    res.json({
      success: true,
      invoice: invoice.toJSON(),
      message: 'Invoice voided successfully'
    });

  } catch (error) {
    console.error('Void invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete invoice (only if draft and no payments)
 */
router.delete('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (invoice.invoiceStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only delete draft invoices'
      });
    }

    if (parseFloat(invoice.paidAmount) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete invoice with payments'
      });
    }

    await invoice.destroy();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/invoices/generate-from-ro/:roId
 * Generate invoice from completed repair order
 */
router.post('/generate-from-ro/:roId', [
  param('roId').isUUID(),
  body('payment_terms').optional().isIn(['due_on_receipt', 'net15', 'net30', 'net45', 'net60']),
], async (req, res) => {
  try {
    const { roId } = req.params;
    const { payment_terms = 'net30', discounts = [], additional_charges = [] } = req.body;
    const { shopId, userId } = req.user;

    // Get repair order with all related data
    const { Job, Part, LaborTimeEntry } = require('../database/models');
    const ro = await Job.findOne({
      where: { id: roId, shopId },
      include: [
        { model: Customer, as: 'customer' },
        { model: require('../database/models').Vehicle, as: 'vehicle' },
        { model: Part, as: 'parts' },
        { model: LaborTimeEntry, as: 'laborEntries' },
      ],
    });

    if (!ro) {
      return res.status(404).json({
        success: false,
        error: 'Repair order not found',
      });
    }

    // Check if job is complete
    if (ro.status !== 'ready_pickup' && ro.status !== 'delivered' && ro.status !== 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate invoice for incomplete job. Job must be ready for pickup or delivered.',
      });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ where: { repairOrderId: roId, shopId } });
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        error: 'Invoice already exists for this repair order',
        invoice: existingInvoice.toJSON(),
      });
    }

    // Calculate invoice amounts
    const partsTotal = ro.parts?.reduce((sum, part) => {
      return sum + (parseFloat(part.unitPrice || 0) * parseFloat(part.quantity || 0));
    }, 0) || 0;

    const laborTotal = ro.laborEntries?.reduce((sum, entry) => {
      return sum + (parseFloat(entry.totalHours || 0) * parseFloat(entry.hourlyRate || 75));
    }, 0) || parseFloat(ro.estimatedLaborTotal || 0);

    const subletTotal = parseFloat(ro.subletTotal || 0);
    const materialsTotal = parseFloat(ro.materialsTotal || 0);
    const miscTotal = parseFloat(ro.miscTotal || 0);

    const subtotal = partsTotal + laborTotal + subletTotal + materialsTotal + miscTotal;

    // Apply discounts
    const discountAmount = discounts.reduce((sum, discount) => {
      if (discount.type === 'percentage') {
        return sum + (subtotal * (parseFloat(discount.value) / 100));
      } else {
        return sum + parseFloat(discount.value);
      }
    }, 0);

    // Add additional charges
    const additionalAmount = additional_charges.reduce((sum, charge) => {
      return sum + parseFloat(charge.amount || 0);
    }, 0);

    // Calculate tax (default 10% if not set)
    const taxRate = parseFloat(ro.taxRate || 10);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);

    // Calculate total
    const totalAmount = taxableAmount + taxAmount + additionalAmount;

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await Invoice.count({
      where: {
        shopId,
        invoiceNumber: {
          [require('sequelize').Op.like]: `INV-${year}-%`,
        },
      },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Calculate due date
    const invoiceDate = new Date();
    let dueDate = new Date(invoiceDate);
    switch (payment_terms) {
      case 'due_on_receipt':
        dueDate = invoiceDate;
        break;
      case 'net15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'net30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'net45':
        dueDate.setDate(dueDate.getDate() + 45);
        break;
      case 'net60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
    }

    // Create invoice
    const invoice = await Invoice.create({
      shopId,
      customerId: ro.customerId,
      repairOrderId: roId,
      invoiceNumber,
      invoiceType: 'standard',
      invoiceStatus: 'draft',
      subtotal,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: 0,
      balanceDue: Math.round(totalAmount * 100) / 100,
      laborTotal: Math.round(laborTotal * 100) / 100,
      partsTotal: Math.round(partsTotal * 100) / 100,
      subletTotal: Math.round(subletTotal * 100) / 100,
      materialsTotal: Math.round(materialsTotal * 100) / 100,
      miscTotal: Math.round(miscTotal * 100) / 100,
      invoiceDate,
      dueDate,
      paymentTerms: payment_terms,
      notes: ro.notes || '',
      createdBy: userId,
      metadata: {
        jobNumber: ro.jobNumber,
        vehicleInfo: ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : '',
        discounts,
        additional_charges,
      },
    });

    // Update job with invoice reference
    await ro.update({ invoiceId: invoice.id });

    res.status(201).json({
      success: true,
      invoice: invoice.toJSON(),
      message: 'Invoice generated successfully from repair order',
    });
  } catch (error) {
    console.error('Generate invoice from RO error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Generate PDF for invoice
 */
router.get('/:id/pdf', [
  param('id').isUUID(),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const invoice = await Invoice.findOne({
      where: { id, shopId },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'email', 'phone', 'address'],
        },
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber', 'status'],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Use PDFKit or Puppeteer to generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);

    // Invoice Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    const invoiceDate = invoice.invoiceDate instanceof Date 
      ? invoice.invoiceDate 
      : new Date(invoice.invoiceDate);
    const dueDate = invoice.dueDate instanceof Date 
      ? invoice.dueDate 
      : invoice.dueDate ? new Date(invoice.dueDate) : null;
    doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, { align: 'right' });
    doc.text(`Due Date: ${dueDate ? dueDate.toLocaleDateString() : 'N/A'}`, { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(14).text('Bill To:', { underline: true });
    doc.fontSize(10);
    if (invoice.customer) {
      doc.text(`${invoice.customer.firstName} ${invoice.customer.lastName}`);
      if (invoice.customer.companyName) doc.text(invoice.customer.companyName);
      if (invoice.customer.address) doc.text(invoice.customer.address);
      if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`);
      if (invoice.customer.email) doc.text(`Email: ${invoice.customer.email}`);
    }
    doc.moveDown();

    // Line Items
    doc.fontSize(14).text('Line Items:', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text('Description', 50, doc.y, { width: 200 });
    doc.text('Quantity', 250, doc.y, { width: 80, align: 'right' });
    doc.text('Rate', 330, doc.y, { width: 80, align: 'right' });
    doc.text('Amount', 410, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(510, doc.y).stroke();
    doc.moveDown(0.5);

    // Labor
    if (invoice.laborTotal > 0) {
      doc.text('Labor', 50);
      doc.text('1', 250, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.laborTotal.toFixed(2)}`, 330, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.laborTotal.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    }

    // Parts
    if (invoice.partsTotal > 0) {
      doc.text('Parts', 50);
      doc.text('1', 250, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.partsTotal.toFixed(2)}`, 330, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.partsTotal.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    }

    // Sublet
    if (invoice.subletTotal > 0) {
      doc.text('Sublet', 50);
      doc.text('1', 250, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.subletTotal.toFixed(2)}`, 330, doc.y, { width: 80, align: 'right' });
      doc.text(`$${invoice.subletTotal.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(510, doc.y).stroke();
    doc.moveDown(0.5);

    // Totals
    doc.text('Subtotal:', 350, doc.y, { width: 100, align: 'right' });
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.5);

    if (invoice.discountAmount > 0) {
      doc.text('Discount:', 350, doc.y, { width: 100, align: 'right' });
      doc.text(`-$${invoice.discountAmount.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.text(`Tax (${invoice.taxRate}%):`, 350, doc.y, { width: 100, align: 'right' });
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.5);

    doc.moveTo(350, doc.y).lineTo(510, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 350, doc.y, { width: 100, align: 'right' });
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, 410, doc.y, { width: 100, align: 'right' });
    doc.moveDown();

    // Notes
    if (invoice.notes) {
      doc.fontSize(10).font('Helvetica');
      doc.moveDown();
      doc.text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
