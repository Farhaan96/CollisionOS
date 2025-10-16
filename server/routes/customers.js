const express = require('express');
const router = express.Router();
const { getSupabaseClient } = require('../config/supabase');
const { authenticateToken } = require('../middleware/authSupabase');

// Get all customers
router.get('/', authenticateToken(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      sortBy = 'last_name',
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

    const supabase = getSupabaseClient(); // Use RLS-protected client
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Build query - be more flexible with optional columns
    // Only select columns that exist in the database to avoid schema errors
    let query = supabase
      .from('customers')
      .select(
        `
        id,
        customer_number,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        company_name,
        customer_type,
        customer_status,
        is_active,
        created_at,
        updated_at,
        vehicles:vehicles(id, year, make, model, vin),
        repair_orders:repair_orders(id, ro_number, claims:claims(claim_number))
      `
      )
      .eq('shop_id', shopId)
      .eq('is_active', true); // Only show active customers (filter out soft-deleted)

    // Add search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,customer_number.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    // Add status filter
    if (status && status !== 'all') {
      query = query.eq('customer_status', status);
    }

    // Add type filter
    if (type && type !== 'all') {
      query = query.eq('customer_type', type);
    }

    // Add sorting
    query = query.order(sortBy, {
      ascending: sortOrder.toLowerCase() === 'asc',
    });

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customers',
        details: error.message,
      });
    }

    console.log('✅ Found', customers?.length || 0, 'customers');

    // Transform customers to add claim_number at top level for easier frontend access
    const transformedCustomers = (customers || []).map(customer => {
      // Extract claim number from first repair order (if any)
      const claimNumber = customer.repair_orders?.[0]?.claims?.claim_number;

      return {
        ...customer,
        claimNumber: claimNumber || null,
      };
    });

    // Calculate pagination
    const totalPages = Math.ceil(
      (count || customers?.length || 0) / parseInt(limit)
    );

    res.json({
      success: true,
      data: transformedCustomers,
      pagination: {
        total: count || customers?.length || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
      },
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

// Get customer by ID
router.get('/:id', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select(
        `
        id,
        customer_number,
        first_name,
        last_name,
        email,
        phone,
        company_name,
        customer_type,
        customer_status,
        primary_insurance_company,
        policy_number,
        deductible,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq('id', id)
      .eq('shop_id', shopId)
      .single();

    if (error) {
      console.error('❌ Error fetching customer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer',
        details: error.message,
      });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
    });
  }
});

// Create new customer
router.post('/', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const customerData = {
      ...req.body,
      shop_id: shopId,
    };

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating customer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create customer',
        details: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
    });
  }
});

// Update customer
router.put('/:id', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .update(req.body)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating customer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update customer',
        details: error.message,
      });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer',
    });
  }
});

// Delete customer
router.delete('/:id', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient(true);
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Soft delete by setting is_active to false
    const { data: customer, error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting customer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete customer',
        details: error.message,
      });
    }

    if (!customer) {
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
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
    });
  }
});

// Get customer vehicles
router.get('/:id/vehicles', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', id)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customer vehicles:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer vehicles',
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: vehicles || [],
      message: 'Customer vehicles retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching customer vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer vehicles',
    });
  }
});

// Get customer jobs/repair orders
router.get('/:id/jobs', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const { data: jobs, error } = await supabase
      .from('repair_orders')
      .select(`
        *,
        vehicles:vehicle_id(year, make, model, vin),
        claims:claim_id(claim_number, insurance_company)
      `)
      .eq('customer_id', id)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customer jobs:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer jobs',
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: jobs || [],
      message: 'Customer jobs retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching customer jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer jobs',
    });
  }
});

module.exports = router;
