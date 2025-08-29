const express = require('express');
const router = express.Router();
const { Customer, Vehicle, Job } = require('../database/models');
const { authenticateToken } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams, commonSchemas } = require('../middleware/validation');
const { createCustomerSchema, updateCustomerSchema, customerQuerySchema, customerSearchSchema } = require('../schemas/customerSchemas');
const { asyncHandler, errors, successResponse, paginatedResponse } = require('../utils/errorHandler');
const { rateLimits } = require('../middleware/security');
const { Op } = require('sequelize');

// Enhanced query parameter handling for dashboard navigation
const parseCustomerFilters = (req) => {
  const {
    view = 'all',
    highlight,
    action,
    period = 'recent',
    satisfaction_filter,
    page = 1,
    limit = 20,
    search,
    status,
    type,
    sortBy = 'lastName',
    sortOrder = 'ASC'
  } = req.query;

  return {
    view: view.toLowerCase(),
    highlight: highlight || null,
    action: action || null,
    period: period.toLowerCase(),
    satisfactionFilter: satisfaction_filter || null,
    page: parseInt(page),
    limit: parseInt(limit),
    search: search || null,
    status: status || null,
    type: type || null,
    sortBy: sortBy || 'lastName',
    sortOrder: sortOrder.toUpperCase() || 'ASC',
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(v => v && v !== 'all').length,
      viewContext: view,
      hasHighlight: !!highlight,
      actionContext: action
    }
  };
};

// Apply view-specific filtering logic for customers
const applyCustomerViewFilters = (customers, filters) => {
  let filteredCustomers = [...customers];

  // Apply view-specific filters
  switch (filters.view) {
    case 'satisfaction':
      // Filter based on satisfaction period and ratings
      if (filters.period === 'recent') {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 3); // Last 3 months
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.lastJobDate && new Date(customer.lastJobDate) >= recentDate
        );
      }
      break;
    case 'insurance':
      // Filter for customers with insurance follow-ups needed
      if (filters.action === 'follow-up') {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.insuranceProvider && 
          customer.claimStatus === 'pending' ||
          customer.claimStatus === 'under_review'
        );
      }
      break;
    case 'active':
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.status === 'active' && customer.hasActiveJobs
      );
      break;
    case 'recent':
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 1);
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.lastJobDate && new Date(customer.lastJobDate) >= recentDate
      );
      break;
  }

  // Apply satisfaction filter
  if (filters.satisfactionFilter) {
    const minRating = parseFloat(filters.satisfactionFilter);
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.satisfactionRating >= minRating
    );
  }

  // Apply action-specific filters
  if (filters.action === 'pickup') {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.hasJobsReadyForPickup
    );
  }

  return filteredCustomers;
};

// Apply highlighting logic for customers
const applyCustomerHighlighting = (customers, highlightId) => {
  if (!highlightId) return customers;
  
  return customers.map(customer => ({
    ...customer,
    _highlighted: customer.id === highlightId || customer.customerNumber === highlightId,
    _highlightReason: customer.customerNumber === highlightId ? 'customer_number_match' : 'id_match'
  }));
};

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers with optional filtering and pagination
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for customer name, email, phone, or customer number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, vip, all]
 *         description: Filter by customer status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, corporate, insurance, all]
 *         description: Filter by customer type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstName, lastName, email, customerNumber]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', 
  rateLimits.read,
  validateQuery(customerQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      search,
      status,
      type,
      sortBy,
      sortOrder
    } = req.query;

    const whereClause = {
      shopId: req.user.shopId,
      isActive: true
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { customerNumber: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      whereClause.customerStatus = status;
    }

    // Add type filter
    if (type && type !== 'all') {
      whereClause.customerType = type;
    }

    const offset = (page - 1) * limit;

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        },
        {
          model: Job,
          as: 'jobs',
          attributes: ['id', 'jobNumber', 'status', 'createdAt']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const pagination = {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };

    paginatedResponse(res, customers, pagination, 'Customers retrieved successfully');
  })
);

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          include: [
            {
              model: Job,
              as: 'jobs',
              attributes: ['id', 'jobNumber', 'status', 'createdAt', 'totalAmount']
            }
          ]
        },
        {
          model: Job,
          as: 'jobs',
          attributes: ['id', 'jobNumber', 'status', 'createdAt', 'totalAmount', 'estimateAmount']
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      shopId: req.user.shopId
    };

    // Generate customer number if not provided
    if (!customerData.customerNumber) {
      customerData.customerNumber = await Customer.generateCustomerNumber(req.user.shopId);
    }

    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Soft delete by setting isActive to false
    await customer.update({ isActive: false });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        isActive: true,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
          { customerNumber: { [Op.iLike]: `%${q}%` } },
          { companyName: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Get customers by type
router.get('/type/:type', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        customerType: req.params.type,
        isActive: true
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers by type:', error);
    res.status(500).json({ error: 'Failed to fetch customers by type' });
  }
});

// Get customers by status
router.get('/status/:status', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        customerStatus: req.params.status,
        isActive: true
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers by status:', error);
    res.status(500).json({ error: 'Failed to fetch customers by status' });
  }
});

// Get VIP customers
router.get('/vip', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        customerStatus: 'vip',
        isActive: true
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching VIP customers:', error);
    res.status(500).json({ error: 'Failed to fetch VIP customers' });
  }
});

// Get customer statistics
router.get('/stats', async (req, res) => {
  try {
    const totalCustomers = await Customer.count({
      where: {
        shopId: req.user.shopId,
        isActive: true
      }
    });

    const customersByStatus = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        isActive: true
      },
      attributes: [
        'customerStatus',
        [Customer.sequelize.fn('COUNT', Customer.sequelize.col('id')), 'count']
      ],
      group: ['customerStatus']
    });

    const customersByType = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        isActive: true
      },
      attributes: [
        'customerType',
        [Customer.sequelize.fn('COUNT', Customer.sequelize.col('id')), 'count']
      ],
      group: ['customerType']
    });

    const newCustomersThisMonth = await Customer.count({
      where: {
        shopId: req.user.shopId,
        isActive: true,
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    res.json({
      totalCustomers,
      customersByStatus,
      customersByType,
      newCustomersThisMonth
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
});

// Get customer vehicles
router.get('/:id/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: {
        customerId: req.params.id,
        shopId: req.user.shopId
      },
      include: [
        {
          model: Job,
          as: 'jobs',
          attributes: ['id', 'jobNumber', 'status', 'createdAt', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching customer vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch customer vehicles' });
  }
});

// Get customer jobs
router.get('/:id/jobs', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: {
        customerId: req.params.id,
        shopId: req.user.shopId
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching customer jobs:', error);
    res.status(500).json({ error: 'Failed to fetch customer jobs' });
  }
});

// Update customer status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update({ customerStatus: status });
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
});

// Get customer suggestions (for autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        isActive: true,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { customerNumber: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'customerNumber', 'customerType'],
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customer suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch customer suggestions' });
  }
});

// Get recent customers
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const customers = await Customer.findAll({
      where: {
        shopId: req.user.shopId,
        isActive: true
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vin', 'year', 'make', 'model']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching recent customers:', error);
    res.status(500).json({ error: 'Failed to fetch recent customers' });
  }
});

module.exports = router;
