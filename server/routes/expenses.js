/**
 * Expenses API Routes - CollisionOS Phase 2
 *
 * Handles expense tracking, approval workflow, and payment management
 * Supports job-level costs and operating expenses
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { Expense } = require('../database/models');
const { RepairOrder } = require('../database/models');

/**
 * POST /api/expenses
 * Create a new expense record
 */
router.post('/', [
  body('expense_type').isIn(['job_cost', 'operating', 'payroll', 'overhead', 'capital']),
  body('category').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('amount').isFloat({ min: 0.01 }),
  body('expense_date').isISO8601(),
  body('repair_order_id').optional().isUUID(),
  body('vendor_id').optional().isUUID()
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
      expense_type,
      category,
      subcategory,
      repair_order_id,
      description,
      amount,
      tax_amount,
      vendor_id,
      vendor_name,
      vendor_invoice_number,
      payment_method,
      expense_date,
      due_date,
      is_billable,
      markup_percentage,
      account_code,
      account_name,
      notes,
      tags,
      receipt_url
    } = req.body;

    const { shopId, userId } = req.user;

    // Validate repair order exists if provided
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

    // Generate expense number
    const expenseNumber = await Expense.generateExpenseNumber();

    // Calculate total amount
    const taxAmountValue = tax_amount || 0;
    const totalAmount = parseFloat(amount) + parseFloat(taxAmountValue);

    // Calculate billed amount if billable
    let billedAmount = null;
    if (is_billable && markup_percentage) {
      billedAmount = parseFloat(amount) * (1 + parseFloat(markup_percentage) / 100);
    }

    // Create expense record
    const expense = await Expense.create({
      shopId,
      expenseType: expense_type,
      category,
      subcategory,
      repairOrderId: repair_order_id,
      expenseNumber,
      description,
      amount: parseFloat(amount),
      taxAmount: parseFloat(taxAmountValue),
      totalAmount,
      vendorId: vendor_id,
      vendorName: vendor_name,
      vendorInvoiceNumber: vendor_invoice_number,
      paymentMethod: payment_method,
      paymentStatus: 'unpaid',
      paidAmount: 0,
      expenseDate: expense_date,
      dueDate: due_date,
      isBillable: is_billable || false,
      markupPercentage: markup_percentage,
      billedAmount,
      accountCode: account_code,
      accountName: account_name,
      notes,
      tags,
      receiptUrl: receipt_url,
      approvalStatus: 'pending',
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      expense: expense.toJSON(),
      message: 'Expense created successfully'
    });

  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/expenses
 * List expenses with filtering and pagination
 */
router.get('/', [
  query('expense_type').optional(),
  query('category').optional(),
  query('repair_order_id').optional().isUUID(),
  query('vendor_id').optional().isUUID(),
  query('payment_status').optional(),
  query('approval_status').optional(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const {
      expense_type,
      category,
      repair_order_id,
      vendor_id,
      payment_status,
      approval_status,
      start_date,
      end_date,
      limit = 20,
      page = 1
    } = req.query;

    const { shopId } = req.user;
    const offset = (page - 1) * limit;

    const where = { shopId };
    if (expense_type) where.expenseType = expense_type;
    if (category) where.category = category;
    if (repair_order_id) where.repairOrderId = repair_order_id;
    if (vendor_id) where.vendorId = vendor_id;
    if (payment_status) where.paymentStatus = payment_status;
    if (approval_status) where.approvalStatus = approval_status;

    // Date range filter
    if (start_date || end_date) {
      where.expenseDate = {};
      if (start_date) where.expenseDate[require('sequelize').Op.gte] = start_date;
      if (end_date) where.expenseDate[require('sequelize').Op.lte] = end_date;
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber', 'status']
        }
      ]
    });

    // Calculate summary totals
    const summaryResult = await Expense.findOne({
      where,
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'totalExpenses'],
        [require('sequelize').fn('SUM', require('sequelize').col('paid_amount')), 'totalPaid']
      ],
      raw: true
    });

    res.json({
      success: true,
      expenses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      summary: {
        totalExpenses: parseFloat(summaryResult.totalExpenses || 0),
        totalPaid: parseFloat(summaryResult.totalPaid || 0),
        totalOutstanding: parseFloat(summaryResult.totalExpenses || 0) - parseFloat(summaryResult.totalPaid || 0)
      }
    });

  } catch (error) {
    console.error('List expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/expenses/categories
 * Get list of expense categories with counts
 */
router.get('/categories', async (req, res) => {
  try {
    const { shopId } = req.user;

    const categories = await Expense.findAll({
      where: { shopId },
      attributes: [
        'category',
        'subcategory',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'totalAmount']
      ],
      group: ['category', 'subcategory'],
      order: [['category', 'ASC'], ['subcategory', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/expenses/overdue
 * Get overdue expenses
 */
router.get('/overdue', async (req, res) => {
  try {
    const { shopId } = req.user;

    const expenses = await Expense.findAll({
      where: {
        shopId,
        paymentStatus: 'unpaid',
        dueDate: {
          [require('sequelize').Op.lt]: new Date()
        }
      },
      order: [['dueDate', 'ASC']],
      include: [
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber']
        }
      ]
    });

    res.json({
      success: true,
      expenses,
      count: expenses.length
    });

  } catch (error) {
    console.error('Get overdue expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/expenses/:id
 * Get expense details
 */
router.get('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId },
      include: [
        {
          model: RepairOrder,
          as: 'repairOrder',
          attributes: ['id', 'roNumber', 'status']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      expense: expense.toJSON()
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense details
 */
router.put('/:id', [
  param('id').isUUID(),
  body('category').optional().trim(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Only allow updates if expense is in draft or pending approval
    if (!['draft', 'pending'].includes(expense.approvalStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update approved or rejected expenses'
      });
    }

    const {
      category,
      subcategory,
      description,
      amount,
      tax_amount,
      vendor_name,
      vendor_invoice_number,
      expense_date,
      due_date,
      is_billable,
      markup_percentage,
      notes,
      tags,
      receipt_url
    } = req.body;

    // Update fields
    if (category) expense.category = category;
    if (subcategory !== undefined) expense.subcategory = subcategory;
    if (description) expense.description = description;
    if (amount) {
      expense.amount = parseFloat(amount);
      expense.totalAmount = parseFloat(amount) + parseFloat(expense.taxAmount || 0);
    }
    if (tax_amount !== undefined) {
      expense.taxAmount = parseFloat(tax_amount);
      expense.totalAmount = parseFloat(expense.amount) + parseFloat(tax_amount);
    }
    if (vendor_name) expense.vendorName = vendor_name;
    if (vendor_invoice_number) expense.vendorInvoiceNumber = vendor_invoice_number;
    if (expense_date) expense.expenseDate = expense_date;
    if (due_date !== undefined) expense.dueDate = due_date;
    if (is_billable !== undefined) expense.isBillable = is_billable;
    if (markup_percentage !== undefined) {
      expense.markupPercentage = markup_percentage;
      if (is_billable) {
        expense.billedAmount = parseFloat(expense.amount) * (1 + parseFloat(markup_percentage) / 100);
      }
    }
    if (notes !== undefined) expense.notes = notes;
    if (tags !== undefined) expense.tags = tags;
    if (receipt_url !== undefined) expense.receiptUrl = receipt_url;

    await expense.save();

    res.json({
      success: true,
      expense: expense.toJSON(),
      message: 'Expense updated successfully'
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/expenses/:id/approve
 * Approve expense
 */
router.post('/:id/approve', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, userId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    if (!expense.canApprove()) {
      return res.status(400).json({
        success: false,
        error: 'Expense cannot be approved (status: ' + expense.approvalStatus + ')'
      });
    }

    await expense.approve(userId);

    res.json({
      success: true,
      expense: expense.toJSON(),
      message: 'Expense approved successfully'
    });

  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/expenses/:id/reject
 * Reject expense
 */
router.post('/:id/reject', [
  param('id').isUUID(),
  body('reason').notEmpty().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { shopId, userId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    if (!expense.canApprove()) {
      return res.status(400).json({
        success: false,
        error: 'Expense cannot be rejected (status: ' + expense.approvalStatus + ')'
      });
    }

    await expense.reject(userId, reason);

    res.json({
      success: true,
      expense: expense.toJSON(),
      message: 'Expense rejected'
    });

  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/expenses/:id/pay
 * Record payment for expense
 */
router.post('/:id/pay', [
  param('id').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('payment_method').notEmpty(),
  body('payment_reference').optional()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, payment_reference } = req.body;
    const { shopId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Check if expense is approved
    if (expense.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Can only pay approved expenses'
      });
    }

    // Validate payment amount
    const remainingBalance = parseFloat(expense.totalAmount) - parseFloat(expense.paidAmount || 0);
    if (parseFloat(amount) > remainingBalance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`
      });
    }

    await expense.recordPayment(amount, payment_method, payment_reference);

    res.json({
      success: true,
      expense: expense.toJSON(),
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('Record expense payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense (only if draft or pending)
 */
router.delete('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const expense = await Expense.findOne({
      where: { id, shopId }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Only allow deletion of draft or pending expenses
    if (!['draft', 'pending'].includes(expense.approvalStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete approved or rejected expenses'
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
