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

// Get customer search (smart search across multiple fields)
router.get('/search', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { q, limit = 20 } = req.query;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const searchTerm = q.toLowerCase();

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, customer_number, first_name, last_name, email, phone, company_name, customer_type, customer_status')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`
      )
      .limit(parseInt(limit));

    if (error) {
      console.error('Error searching customers:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to search customers',
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: customers || [],
      message: 'Customer search completed successfully',
    });
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search customers',
    });
  }
});

// Get customer statistics
router.get('/stats', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Get customer counts by status and type
    const { data: customers, error } = await supabase
      .from('customers')
      .select('customer_status, customer_type, is_active')
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error fetching customer stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer statistics',
        details: error.message,
      });
    }

    // Calculate statistics
    const stats = {
      total: customers?.length || 0,
      active: customers?.filter(c => c.is_active && c.customer_status === 'active').length || 0,
      inactive: customers?.filter(c => c.customer_status === 'inactive').length || 0,
      prospects: customers?.filter(c => c.customer_status === 'prospect').length || 0,
      vip: customers?.filter(c => c.customer_status === 'vip').length || 0,
      byType: {
        individual: customers?.filter(c => c.customer_type === 'individual').length || 0,
        business: customers?.filter(c => c.customer_type === 'business').length || 0,
        insurance: customers?.filter(c => c.customer_type === 'insurance').length || 0,
        fleet: customers?.filter(c => c.customer_type === 'fleet').length || 0,
      },
    };

    res.json({
      success: true,
      data: stats,
      message: 'Customer statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Customer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer statistics',
    });
  }
});

// Get VIP customers
router.get('/vip', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    const { data: vipCustomers, error } = await supabase
      .from('customers')
      .select('id, customer_number, first_name, last_name, email, phone, company_name, created_at')
      .eq('shop_id', shopId)
      .eq('customer_status', 'vip')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching VIP customers:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch VIP customers',
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: vipCustomers || [],
      message: 'VIP customers retrieved successfully',
    });
  } catch (error) {
    console.error('VIP customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VIP customers',
    });
  }
});

// Get customer suggestions for autocomplete
router.get('/suggestions', authenticateToken(), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { q, limit = 10 } = req.query;
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    if (!q || q.trim().length < 1) {
      // Return empty suggestions if no query
      return res.json({
        success: true,
        data: [],
        message: 'No search query provided',
      });
    }

    const searchTerm = q.toLowerCase();

    const { data: suggestions, error } = await supabase
      .from('customers')
      .select('id, customer_number, first_name, last_name, email, phone, company_name, customer_type')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      )
      .limit(parseInt(limit))
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching customer suggestions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customer suggestions',
        details: error.message,
      });
    }

    // Format suggestions for autocomplete
    const formattedSuggestions = (suggestions || []).map(customer => ({
      id: customer.id,
      label: customer.company_name || `${customer.first_name} ${customer.last_name}`,
      customerNumber: customer.customer_number,
      phone: customer.phone,
      email: customer.email,
      type: customer.customer_type,
    }));

    res.json({
      success: true,
      data: formattedSuggestions,
      message: 'Customer suggestions retrieved successfully',
    });
  } catch (error) {
    console.error('Customer suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer suggestions',
    });
  }
});

module.exports = router;
