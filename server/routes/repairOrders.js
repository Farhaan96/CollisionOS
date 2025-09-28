/**
 * CollisionOS Repair Orders API Routes
 *
 * Handles collision repair workflow API endpoints:
 * - RO CRUD operations with claim relationship
 * - Search by RO#, Claim#, VIN, Customer
 * - Parts workflow status management
 * - Dashboard metrics and analytics
 */

const express = require('express');
const router = express.Router();
const { validationResult, body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting
const roRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: 'Too many RO requests, please try again later.',
});

// Apply rate limiting to all routes
router.use(roRateLimit);

/**
 * GET /api/repair-orders/search
 * Search repair orders with collision repair specific queries
 */
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      q: query,
      limit = 20,
      page = 1,
      status,
      priority,
      date_from,
      date_to
    } = req.query;

    const { shopId } = req.user;
    const offset = (page - 1) * limit;

    // Build search query for collision repair
    let searchSql = `
      SELECT DISTINCT
        ro.id,
        ro.ro_number,
        ro.status,
        ro.priority,
        ro.total_amount,
        ro.opened_at,
        ro.estimated_completion,
        ro.created_at,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        v.vin,
        v.year,
        v.make,
        v.model,
        v.license_plate,
        cl.claim_number,
        ic.name as insurance_company,
        ic.short_name as insurer_code
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN insurance_claims cl ON ro.claim_id = cl.id
      LEFT JOIN insurance_companies ic ON cl.insurance_company_id = ic.id
      WHERE ro.shop_id = $1
    `;

    const queryParams = [shopId];
    let paramIndex = 2;

    // Add search conditions for collision repair workflow
    const searchConditions = [];

    // Search by RO number, claim number, VIN, customer name, plate
    if (query) {
      searchConditions.push(`(
        ro.ro_number ILIKE $${paramIndex} OR
        cl.claim_number ILIKE $${paramIndex} OR
        v.vin ILIKE $${paramIndex} OR
        v.license_plate ILIKE $${paramIndex} OR
        CONCAT(c.first_name, ' ', c.last_name) ILIKE $${paramIndex} OR
        c.phone ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${query}%`);
      paramIndex++;
    }

    // Filter by status
    if (status) {
      searchConditions.push(`ro.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Filter by priority
    if (priority) {
      searchConditions.push(`ro.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    // Date range filter
    if (date_from) {
      searchConditions.push(`ro.opened_at >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      searchConditions.push(`ro.opened_at <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    if (searchConditions.length > 0) {
      searchSql += ' AND ' + searchConditions.join(' AND ');
    }

    // Add ordering and pagination
    searchSql += ` ORDER BY ro.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    // Execute search query
    const result = await req.app.locals.db.query(searchSql, queryParams);

    // Get total count for pagination
    let countSql = searchSql.replace(/SELECT DISTINCT.*FROM/, 'SELECT COUNT(DISTINCT ro.id) FROM');
    countSql = countSql.replace(/ORDER BY.*$/, '');
    countSql = countSql.replace(/LIMIT.*$/, '');

    const countResult = await req.app.locals.db.query(
      countSql,
      queryParams.slice(0, -2) // Remove limit and offset params
    );

    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      repair_orders: result.rows,
      total_count: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(totalCount / limit),
      search_meta: {
        query,
        filters: { status, priority, date_from, date_to },
        execution_time: Date.now() - req.startTime
      }
    });

  } catch (error) {
    console.error('RO search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/**
 * GET /api/repair-orders
 * Get repair orders with pagination and filtering
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      status,
      priority,
      date_from,
      date_to
    } = req.query;

    const { shopId } = req.user;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        ro.*,
        c.first_name,
        c.last_name,
        c.phone,
        v.vin,
        v.year,
        v.make,
        v.model,
        cl.claim_number,
        ic.name as insurance_company
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN insurance_claims cl ON ro.claim_id = cl.id
      LEFT JOIN insurance_companies ic ON cl.insurance_company_id = ic.id
      WHERE ro.shop_id = $1
    `;

    const params = [shopId];
    let paramIndex = 2;

    // Add filters
    if (status) {
      sql += ` AND ro.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      sql += ` AND ro.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (date_from) {
      sql += ` AND ro.opened_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      sql += ` AND ro.opened_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    sql += ` ORDER BY ro.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await req.app.locals.db.query(sql, params);

    res.json({
      success: true,
      repair_orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });

  } catch (error) {
    console.error('Get ROs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repair orders',
      error: error.message
    });
  }
});

/**
 * GET /api/repair-orders/:id
 * Get single repair order with all related data
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid RO ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { shopId } = req.user;

    // Get repair order with related data
    const roQuery = `
      SELECT
        ro.*,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        c.address,
        v.vin,
        v.year,
        v.make,
        v.model,
        v.trim,
        v.license_plate,
        v.color,
        cl.claim_number,
        cl.claim_status,
        cl.deductible,
        cl.coverage_type,
        ic.name as insurance_company,
        ic.short_name as insurer_code
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN insurance_claims cl ON ro.claim_id = cl.id
      LEFT JOIN insurance_companies ic ON cl.insurance_company_id = ic.id
      WHERE ro.id = $1 AND ro.shop_id = $2
    `;

    const roResult = await req.app.locals.db.query(roQuery, [id, shopId]);

    if (roResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair order not found'
      });
    }

    const repairOrder = roResult.rows[0];

    // Get parts for this RO grouped by status
    const partsQuery = `
      SELECT
        pl.*,
        s.name as supplier_name,
        po.po_number,
        po.status as po_status
      FROM part_lines pl
      LEFT JOIN suppliers s ON pl.supplier_id = s.id
      LEFT JOIN purchase_orders po ON pl.po_id = po.id
      WHERE pl.repair_order_id = $1
      ORDER BY pl.created_at
    `;

    const partsResult = await req.app.locals.db.query(partsQuery, [id]);

    // Group parts by status for workflow display
    const partsByStatus = partsResult.rows.reduce((acc, part) => {
      const status = part.status || 'needed';
      if (!acc[status]) acc[status] = [];
      acc[status].push(part);
      return acc;
    }, {});

    // Get purchase orders for this RO
    const posQuery = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.repair_order_id = $1
      ORDER BY po.created_at DESC
    `;

    const posResult = await req.app.locals.db.query(posQuery, [id]);

    // Get documents for this RO
    const docsQuery = `
      SELECT * FROM documents
      WHERE entity_type = 'repair_order' AND entity_id = $1
      ORDER BY created_at DESC
    `;

    const docsResult = await req.app.locals.db.query(docsQuery, [id]);

    res.json({
      success: true,
      repair_order: repairOrder,
      claim: {
        claim_number: repairOrder.claim_number,
        claim_status: repairOrder.claim_status,
        deductible: repairOrder.deductible,
        coverage_type: repairOrder.coverage_type,
        insurance_company: repairOrder.insurance_company,
        insurer_code: repairOrder.insurer_code
      },
      customer: {
        first_name: repairOrder.first_name,
        last_name: repairOrder.last_name,
        phone: repairOrder.phone,
        email: repairOrder.email,
        address: repairOrder.address
      },
      vehicle: {
        vin: repairOrder.vin,
        year: repairOrder.year,
        make: repairOrder.make,
        model: repairOrder.model,
        trim: repairOrder.trim,
        license_plate: repairOrder.license_plate,
        color: repairOrder.color
      },
      parts: partsResult.rows,
      parts_by_status: partsByStatus,
      purchase_orders: posResult.rows,
      documents: docsResult.rows
    });

  } catch (error) {
    console.error('Get RO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repair order',
      error: error.message
    });
  }
});

/**
 * POST /api/repair-orders
 * Create new repair order
 */
router.post('/', [
  body('ro_number').notEmpty().withMessage('RO number is required'),
  body('customer_id').isUUID().withMessage('Valid customer ID required'),
  body('vehicle_id').isUUID().withMessage('Valid vehicle ID required'),
  body('claim_id').optional().isUUID().withMessage('Claim ID must be valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      ro_number,
      customer_id,
      vehicle_id,
      claim_id,
      status = 'estimate',
      priority = 'normal',
      damage_description,
      total_amount,
      estimated_completion
    } = req.body;

    const { shopId, userId } = req.user;

    const insertSql = `
      INSERT INTO repair_orders (
        ro_number, shop_id, customer_id, vehicle_id, claim_id,
        status, priority, damage_description, total_amount,
        estimated_completion, created_by, opened_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const values = [
      ro_number, shopId, customer_id, vehicle_id, claim_id,
      status, priority, damage_description, total_amount,
      estimated_completion, userId
    ];

    const result = await req.app.locals.db.query(insertSql, values);

    res.status(201).json({
      success: true,
      repair_order: result.rows[0],
      message: 'Repair order created successfully'
    });

  } catch (error) {
    console.error('Create RO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create repair order',
      error: error.message
    });
  }
});

/**
 * PUT /api/repair-orders/:id
 * Update repair order
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid RO ID format')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'status', 'priority', 'damage_description', 'total_amount',
      'estimated_completion', 'delivered_at', 'notes'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);

    const updateSql = `
      UPDATE repair_orders
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND shop_id = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id, shopId);

    const result = await req.app.locals.db.query(updateSql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair order not found'
      });
    }

    res.json({
      success: true,
      repair_order: result.rows[0],
      message: 'Repair order updated successfully'
    });

  } catch (error) {
    console.error('Update RO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update repair order',
      error: error.message
    });
  }
});

/**
 * GET /api/repair-orders/metrics
 * Get dashboard metrics for repair orders
 */
router.get('/metrics', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { date_from, date_to } = req.query;

    let dateFilter = '';
    const params = [shopId];
    let paramIndex = 2;

    if (date_from) {
      dateFilter += ` AND opened_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      dateFilter += ` AND opened_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    const metricsQuery = `
      SELECT
        COUNT(*) as total_ros,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'estimate' THEN 1 END) as estimate,
        COUNT(CASE WHEN status = 'parts_pending' THEN 1 END) as parts_pending,
        COUNT(CASE WHEN status = 'ready_for_delivery' THEN 1 END) as ready_for_delivery,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COALESCE(SUM(total_amount), 0) as total_value,
        COALESCE(AVG(total_amount), 0) as avg_amount
      FROM repair_orders
      WHERE shop_id = $1 ${dateFilter}
    `;

    const result = await req.app.locals.db.query(metricsQuery, params);

    res.json({
      success: true,
      ...result.rows[0]
    });

  } catch (error) {
    console.error('Get RO metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
});

module.exports = router;