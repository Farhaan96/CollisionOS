const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Customer, Vehicle, RepairOrderManagement, ClaimManagement } = require('../database/models');
const { queryHelpers } = require('../utils/queryHelpers');
// TODO: Replace with local auth middleware
// const { authenticateToken } = require('../middleware/auth');
const authenticateToken = (options = {}) => {
  return (req, res, next) => {
    // Temporary stub - implement proper auth
    req.user = { userId: 'dev-user', shopId: 'dev-shop', role: 'admin' };
    next();
  };
};

/**
 * GET /api/customers
 * Get all customers with filtering, search, and pagination
 */
router.get('/', authenticateToken(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = req.query;

    console.log(
      '🔍 Getting customers for user:',
      req.user?.userId,
      'shop:',
      req.user?.shopId,
      'page:',
      page,
      'limit:',
      limit,
      'sortBy:',
      sortBy
    );

    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Build where clause
    const where = {
      ...queryHelpers.forShop(shopId),
      isActive: true, // Only show active customers (soft delete)
    };

    // Add search filter
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { customerNumber: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      where.customerStatus = status;
    }

    // Add type filter
    if (type && type !== 'all') {
      where.customerType = type;
    }

    // Pagination
    const { offset, limit: limitNum } = queryHelpers.paginate(page, limit);

    // Query customers with associations
    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'year', 'make', 'model', 'vin'],
          where: { isActive: true },
          required: false,
        },
        {
          model: RepairOrderManagement,
          as: 'repairOrderManagement',
          attributes: ['id', 'repairOrderNumber', 'claimManagementId'],
          include: [
            {
              model: ClaimManagement,
              as: 'claimManagement',
              attributes: ['claimNumber'],
            },
          ],
          required: false,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: limitNum,
    });

    console.log('✅ Found', customers?.length || 0, 'customers');

    // Transform customers to match frontend expectations
    const transformedCustomers = customers.map(customer => {
      const customerData = customer.toJSON();

      // Extract claim number from first repair order (if any)
      const claimNumber = customerData.repairOrderManagement?.[0]?.claimManagement?.claimNumber;

      return {
        id: customerData.id,
        customer_number: customerData.customerNumber,
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        mobile: customerData.mobile,
        company_name: customerData.companyName,
        customer_type: customerData.customerType,
        customer_status: customerData.customerStatus,
        is_active: customerData.isActive,
        created_at: customerData.createdAt,
        updated_at: customerData.updatedAt,
        vehicles: customerData.vehicles || [],
        repair_orders: customerData.repairOrderManagement?.map(ro => ({
          id: ro.id,
          ro_number: ro.repairOrderNumber,
          claims: ro.claimManagement ? { claim_number: ro.claimManagement.claimNumber } : null,
        })) || [],
        claimNumber: claimNumber || null,
      };
    });

    // Calculate pagination metadata
    const paginationMeta = queryHelpers.paginationMeta(count, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: transformedCustomers,
      pagination: paginationMeta,
      message: 'Customers retrieved successfully',
    });
  } catch (error) {
    console.error('❌ Customers route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message,
    });
  }
});

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const customer = await Customer.findOne({
      where: {
        id,
        shopId,
      },
      attributes: [
        'id',
        'customerNumber',
        'firstName',
        'lastName',
        'email',
        'phone',
        'companyName',
        'customerType',
        'customerStatus',
        'primaryInsuranceCompany',
        'policyNumber',
        'deductible',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Transform to snake_case for frontend compatibility
    const customerData = customer.toJSON();
    const transformed = {
      id: customerData.id,
      customer_number: customerData.customerNumber,
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone,
      company_name: customerData.companyName,
      customer_type: customerData.customerType,
      customer_status: customerData.customerStatus,
      primary_insurance_company: customerData.primaryInsuranceCompany,
      policy_number: customerData.policyNumber,
      deductible: customerData.deductible,
      is_active: customerData.isActive,
      created_at: customerData.createdAt,
      updated_at: customerData.updatedAt,
    };

    res.json({
      success: true,
      data: transformed,
      message: 'Customer retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      details: error.message,
    });
  }
});

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', authenticateToken(), async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Convert snake_case to camelCase for model
    const customerData = {
      shopId,
      firstName: req.body.first_name || req.body.firstName,
      lastName: req.body.last_name || req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      mobile: req.body.mobile,
      companyName: req.body.company_name || req.body.companyName,
      customerType: req.body.customer_type || req.body.customerType || 'individual',
      customerStatus: req.body.customer_status || req.body.customerStatus || 'active',
      primaryInsuranceCompany: req.body.primary_insurance_company || req.body.primaryInsuranceCompany,
      policyNumber: req.body.policy_number || req.body.policyNumber,
      deductible: req.body.deductible,
      isActive: true,
    };

    const customer = await Customer.create(customerData);

    // Transform response to snake_case
    const customerJson = customer.toJSON();
    const transformed = {
      id: customerJson.id,
      customer_number: customerJson.customerNumber,
      first_name: customerJson.firstName,
      last_name: customerJson.lastName,
      email: customerJson.email,
      phone: customerJson.phone,
      mobile: customerJson.mobile,
      company_name: customerJson.companyName,
      customer_type: customerJson.customerType,
      customer_status: customerJson.customerStatus,
      primary_insurance_company: customerJson.primaryInsuranceCompany,
      policy_number: customerJson.policyNumber,
      deductible: customerJson.deductible,
      is_active: customerJson.isActive,
      created_at: customerJson.createdAt,
      updated_at: customerJson.updatedAt,
    };

    res.status(201).json({
      success: true,
      data: transformed,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      details: error.message,
    });
  }
});

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Convert snake_case to camelCase for model
    const updateData = {};
    if (req.body.first_name !== undefined) updateData.firstName = req.body.first_name;
    if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
    if (req.body.last_name !== undefined) updateData.lastName = req.body.last_name;
    if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.mobile !== undefined) updateData.mobile = req.body.mobile;
    if (req.body.company_name !== undefined) updateData.companyName = req.body.company_name;
    if (req.body.companyName !== undefined) updateData.companyName = req.body.companyName;
    if (req.body.customer_type !== undefined) updateData.customerType = req.body.customer_type;
    if (req.body.customerType !== undefined) updateData.customerType = req.body.customerType;
    if (req.body.customer_status !== undefined) updateData.customerStatus = req.body.customer_status;
    if (req.body.customerStatus !== undefined) updateData.customerStatus = req.body.customerStatus;
    if (req.body.primary_insurance_company !== undefined) updateData.primaryInsuranceCompany = req.body.primary_insurance_company;
    if (req.body.primaryInsuranceCompany !== undefined) updateData.primaryInsuranceCompany = req.body.primaryInsuranceCompany;
    if (req.body.policy_number !== undefined) updateData.policyNumber = req.body.policy_number;
    if (req.body.policyNumber !== undefined) updateData.policyNumber = req.body.policyNumber;
    if (req.body.deductible !== undefined) updateData.deductible = req.body.deductible;

    const [updated] = await Customer.update(updateData, {
      where: { id, shopId },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Fetch updated customer
    const customer = await Customer.findOne({
      where: { id, shopId },
    });

    // Transform response
    const customerJson = customer.toJSON();
    const transformed = {
      id: customerJson.id,
      customer_number: customerJson.customerNumber,
      first_name: customerJson.firstName,
      last_name: customerJson.lastName,
      email: customerJson.email,
      phone: customerJson.phone,
      mobile: customerJson.mobile,
      company_name: customerJson.companyName,
      customer_type: customerJson.customerType,
      customer_status: customerJson.customerStatus,
      primary_insurance_company: customerJson.primaryInsuranceCompany,
      policy_number: customerJson.policyNumber,
      deductible: customerJson.deductible,
      is_active: customerJson.isActive,
      created_at: customerJson.createdAt,
      updated_at: customerJson.updatedAt,
    };

    res.json({
      success: true,
      data: transformed,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/customers/:id
 * Soft delete customer
 */
router.delete('/:id', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Soft delete by setting isActive to false
    const [updated] = await Customer.update(
      { isActive: false },
      { where: { id, shopId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      details: error.message,
    });
  }
});

/**
 * GET /api/customers/:id/vehicles
 * Get customer vehicles
 */
router.get('/:id/vehicles', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const vehicles = await Vehicle.findAll({
      where: {
        customerId: id,
        shopId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: vehicles || [],
      message: 'Customer vehicles retrieved successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching customer vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer vehicles',
      details: error.message,
    });
  }
});

/**
 * GET /api/customers/:id/jobs
 * Get customer jobs/repair orders
 */
router.get('/:id/jobs', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const jobs = await RepairOrderManagement.findAll({
      where: {
        customerId: id,
        shopId,
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['year', 'make', 'model', 'vin'],
        },
        {
          model: ClaimManagement,
          as: 'claim',
          attributes: ['claimNumber', 'insurerName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Transform to match expected format
    const transformedJobs = jobs.map(job => {
      const jobData = job.toJSON();
      return {
        ...jobData,
        vehicles: jobData.vehicle,
        claims: jobData.claim ? {
          claim_number: jobData.claim.claimNumber,
          insurance_company: jobData.claim.insurerName,
        } : null,
      };
    });

    res.json({
      success: true,
      data: transformedJobs || [],
      message: 'Customer jobs retrieved successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching customer jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer jobs',
      details: error.message,
    });
  }
});

module.exports = router;
