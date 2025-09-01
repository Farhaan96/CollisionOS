/**
 * CollisionOS Advanced Parts Management APIs
 * Phase 2 Backend Development
 *
 * Comprehensive parts workflow with status tracking and vendor integration
 * Features:
 * - Parts workflow states: needed → sourcing → ordered → backordered → received → installed → returned → cancelled
 * - Advanced parts search and filtering
 * - Vendor quote requests and margin analysis
 * - Real-time margin calculations
 * - Bulk status updates for multiple parts
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const {
  AdvancedPartsManagement,
  PurchaseOrderSystem,
  Vendor,
  RepairOrderManagement,
  User,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const rateLimit = require('express-rate-limit');

// Rate limiting for parts operations
const partsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 parts operations per 15 minutes
  message: 'Too many parts operations, please try again later.',
});

/**
 * GET /api/parts/workflow/:roId - Parts status buckets for RO
 */
router.get('/workflow/:roId', async (req, res) => {
  try {
    const { roId } = req.params;
    const { shopId } = req.user;

    const parts = await AdvancedPartsManagement.findAll({
      where: {
        repairOrderId: roId,
        shopId,
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['name', 'vendor_code', 'discount_percentage'],
        },
        {
          model: PurchaseOrderSystem,
          as: 'partsOrder',
          attributes: ['po_number', 'status', 'requested_delivery_date'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    // Group parts by status buckets
    const workflow_buckets = {
      needed: [],
      sourcing: [],
      ordered: [],
      backordered: [],
      received: [],
      installed: [],
      returned: [],
      cancelled: [],
    };

    let total_value = 0;
    let margin_analysis = {
      total_cost: 0,
      total_sell: 0,
      estimated_margin: 0,
      margin_percentage: 0,
    };

    parts.forEach(part => {
      const status = part.status || 'needed';
      if (workflow_buckets[status]) {
        workflow_buckets[status].push({
          id: part.id,
          part_number: part.part_number,
          description: part.part_description,
          quantity: part.quantity,
          unit_cost: part.unit_cost,
          total_cost: part.quantity * part.unit_cost,
          vendor: part.vendor?.name || 'Not assigned',
          po_number: part.partsOrder?.po_number || null,
          expected_date:
            part.expected_delivery_date ||
            part.partsOrder?.requested_delivery_date,
          days_in_status: part.status_changed_date
            ? Math.ceil(
                (new Date() - new Date(part.status_changed_date)) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          priority: part.priority || 'normal',
          notes: part.sourcing_notes,
        });
      }

      // Calculate totals and margins
      const part_total = part.quantity * part.unit_cost;
      total_value += part_total;

      if (part.vendor) {
        const discount = part.vendor.discount_percentage || 0;
        const cost = part.unit_cost * (1 - discount / 100);
        margin_analysis.total_cost += cost * part.quantity;
        margin_analysis.total_sell += part_total;
      }
    });

    margin_analysis.estimated_margin =
      margin_analysis.total_sell - margin_analysis.total_cost;
    margin_analysis.margin_percentage =
      margin_analysis.total_sell > 0
        ? (margin_analysis.estimated_margin / margin_analysis.total_sell) * 100
        : 0;

    // Calculate workflow metrics
    const workflow_metrics = {
      total_parts: parts.length,
      total_value: total_value.toFixed(2),
      completion_rate:
        parts.length > 0
          ? ((workflow_buckets.installed.length / parts.length) * 100).toFixed(
              1
            )
          : '0',
      parts_on_order:
        workflow_buckets.ordered.length + workflow_buckets.backordered.length,
      ready_to_install: workflow_buckets.received.length,
      critical_delays: workflow_buckets.backordered.filter(
        p => p.days_in_status > 7
      ).length,
    };

    res.json({
      success: true,
      data: {
        workflow_buckets,
        workflow_metrics,
        margin_analysis,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Parts workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get parts workflow',
      error: error.message,
    });
  }
});

/**
 * POST /api/parts/bulk-update - Multi-select status updates
 *
 * Body: {
 *   part_ids: string[],
 *   new_status: string,
 *   vendor_id?: string,
 *   notes?: string,
 *   expected_date?: string
 * }
 */
router.post('/bulk-update', partsRateLimit, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { part_ids, new_status, vendor_id, notes, expected_date } = req.body;
    const { shopId, userId } = req.user;

    // Validate status transition
    const valid_statuses = [
      'needed',
      'sourcing',
      'ordered',
      'backordered',
      'received',
      'installed',
      'returned',
      'cancelled',
    ];
    if (!valid_statuses.includes(new_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }

    // Get current parts to validate ownership and status transitions
    const parts = await AdvancedPartsManagement.findAll({
      where: { id: part_ids, shopId },
    });

    if (parts.length !== part_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'Some parts not found',
      });
    }

    // Validate status transitions
    const invalid_transitions = parts.filter(part => {
      return !isValidStatusTransition(part.status, new_status);
    });

    if (invalid_transitions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transitions detected',
        invalid_parts: invalid_transitions.map(p => ({
          id: p.id,
          part_number: p.part_number,
          current_status: p.status,
          attempted_status: new_status,
        })),
      });
    }

    // Build update object
    const update_data = {
      status: new_status,
      status_changed_date: new Date(),
      statusChangedBy: userId,
      updatedBy: userId,
    };

    // Add status-specific fields
    if (vendor_id) update_data.vendorId = vendor_id;
    if (notes) update_data.sourcing_notes = notes;
    if (expected_date) update_data.expected_delivery_date = expected_date;

    // Set status-specific fields
    switch (new_status) {
      case 'sourcing':
        update_data.sourcedBy = userId;
        update_data.sourcing_date = new Date();
        break;
      case 'ordered':
        update_data.orderedBy = userId;
        update_data.order_date = new Date();
        break;
      case 'received':
        update_data.receivedBy = userId;
        update_data.received_date = new Date();
        break;
      case 'installed':
        update_data.installedBy = userId;
        update_data.installation_date = new Date();
        break;
      case 'returned':
        update_data.returnedBy = userId;
        update_data.return_date = new Date();
        break;
    }

    // Execute bulk update
    const [updated_count] = await AdvancedPartsManagement.update(update_data, {
      where: { id: part_ids },
    });

    // Broadcast real-time updates
    for (const part of parts) {
      realtimeService.broadcastPartsUpdate(
        {
          part_id: part.id,
          part_number: part.part_number,
          old_status: part.status,
          new_status,
          updated_by: userId,
        },
        'bulk_updated'
      );
    }

    res.json({
      success: true,
      message: `${updated_count} parts updated successfully`,
      data: {
        updated_count,
        new_status,
        part_count: parts.length,
      },
    });
  } catch (error) {
    console.error('Bulk parts update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update parts',
      error: error.message,
    });
  }
});

/**
 * GET /api/parts/search - Advanced parts search and filtering
 */
router.get('/search', async (req, res) => {
  try {
    const { shopId } = req.user;
    const {
      q, // Search query
      status, // Filter by status
      vendor_id, // Filter by vendor
      ro_number, // Filter by RO
      priority, // Filter by priority
      date_from, // Date range start
      date_to, // Date range end
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 50,
    } = req.query;

    // Build where clause
    const where_clause = { shopId };

    if (q) {
      where_clause[Op.or] = [
        { part_number: { [Op.like]: `%${q}%` } },
        { part_description: { [Op.like]: `%${q}%` } },
      ];
    }

    if (status) where_clause.status = status;
    if (vendor_id) where_clause.vendorId = vendor_id;
    if (priority) where_clause.priority = priority;

    // Date range filter
    if (date_from || date_to) {
      where_clause.created_at = {};
      if (date_from) where_clause.created_at[Op.gte] = new Date(date_from);
      if (date_to) where_clause.created_at[Op.lte] = new Date(date_to);
    }

    // RO filter
    const include_options = [
      {
        model: Vendor,
        as: 'vendor',
        attributes: ['name', 'vendor_code', 'discount_percentage'],
      },
      {
        model: RepairOrderManagement,
        as: 'repairOrder',
        attributes: ['ro_number', 'status'],
        where: ro_number
          ? { ro_number: { [Op.like]: `%${ro_number}%` } }
          : undefined,
      },
      {
        model: PurchaseOrderSystem,
        as: 'partsOrder',
        attributes: ['po_number', 'status', 'requested_delivery_date'],
        required: false,
      },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: parts } =
      await AdvancedPartsManagement.findAndCountAll({
        where: where_clause,
        include: include_options,
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset,
      });

    // Calculate search metrics
    const search_metrics = {
      total_found: count,
      page: parseInt(page),
      per_page: parseInt(limit),
      total_pages: Math.ceil(count / parseInt(limit)),
      status_breakdown: await getStatusBreakdown(where_clause),
      total_value: parts.reduce(
        (sum, part) => sum + part.quantity * part.unit_cost,
        0
      ),
    };

    res.json({
      success: true,
      data: {
        parts: parts.map(formatPartForResponse),
        search_metrics,
        filters_applied: {
          search_query: q || null,
          status,
          vendor_id,
          ro_number,
          priority,
          date_range: { from: date_from, to: date_to },
        },
      },
    });
  } catch (error) {
    console.error('Parts search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search parts',
      error: error.message,
    });
  }
});

/**
 * POST /api/parts/vendor-quote - Request vendor quotes
 *
 * Body: {
 *   part_requests: [{
 *     part_number: string,
 *     description: string,
 *     quantity: number,
 *     oem_part_number?: string
 *   }],
 *   vendor_ids: string[],
 *   urgent: boolean,
 *   delivery_needed_by: string
 * }
 */
router.post('/vendor-quote', partsRateLimit, async (req, res) => {
  try {
    const { part_requests, vendor_ids, urgent, delivery_needed_by } = req.body;
    const { shopId, userId } = req.user;

    // Validate vendors
    const vendors = await Vendor.findAll({
      where: { id: vendor_ids, shopId },
    });

    if (vendors.length !== vendor_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'Some vendors not found',
      });
    }

    const quote_requests = [];

    // Create quote request for each vendor
    for (const vendor of vendors) {
      const quote_id = `QR-${Date.now()}-${vendor.vendor_code}`;

      // In a real implementation, this would integrate with vendor APIs
      // For now, we'll simulate the quote request process
      quote_requests.push({
        quote_id,
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        status: 'requested',
        parts: part_requests.map(part => ({
          ...part,
          estimated_price: estimatePartPrice(part, vendor.discount_percentage),
          estimated_delivery: calculateDeliveryEstimate(vendor, urgent),
        })),
        total_estimated: part_requests.reduce(
          (sum, part) =>
            sum +
            part.quantity * estimatePartPrice(part, vendor.discount_percentage),
          0
        ),
        urgent,
        delivery_needed_by,
        requested_date: new Date(),
        requested_by: userId,
      });
    }

    // Log quote requests (in real implementation, would be stored in database)
    console.log('Vendor quote requests created:', quote_requests);

    // Broadcast real-time notification
    realtimeService.broadcastPartsUpdate(
      {
        action: 'quote_requested',
        vendor_count: vendors.length,
        part_count: part_requests.length,
        urgent,
      },
      'quote_requested'
    );

    res.json({
      success: true,
      message: `Quote requests sent to ${vendors.length} vendors`,
      data: {
        quote_requests: quote_requests.map(qr => ({
          quote_id: qr.quote_id,
          vendor_name: qr.vendor_name,
          status: qr.status,
          part_count: qr.parts.length,
          total_estimated: qr.total_estimated.toFixed(2),
          estimated_response_time: '24-48 hours',
        })),
      },
    });
  } catch (error) {
    console.error('Vendor quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request vendor quotes',
      error: error.message,
    });
  }
});

/**
 * GET /api/parts/margin-analysis - Real-time margin calculations
 */
router.get('/margin-analysis', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { ro_id, vendor_id, date_range = '30' } = req.query;

    const where_clause = { shopId };

    if (ro_id) where_clause.repairOrderId = ro_id;
    if (vendor_id) where_clause.vendorId = vendor_id;

    // Date range filter
    const date_from = new Date();
    date_from.setDate(date_from.getDate() - parseInt(date_range));
    where_clause.created_at = { [Op.gte]: date_from };

    const parts = await AdvancedPartsManagement.findAll({
      where: where_clause,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['name', 'discount_percentage', 'markup_percentage'],
        },
      ],
    });

    // Calculate detailed margin analysis
    let total_sell = 0;
    let total_cost = 0;
    let total_margin = 0;
    const vendor_analysis = {};
    const status_analysis = {};

    parts.forEach(part => {
      const sell_price = part.quantity * part.unit_cost;
      let cost_price = sell_price;

      if (part.vendor) {
        const discount = part.vendor.discount_percentage || 0;
        cost_price = sell_price * (1 - discount / 100);

        if (!vendor_analysis[part.vendor.name]) {
          vendor_analysis[part.vendor.name] = {
            total_sell: 0,
            total_cost: 0,
            total_margin: 0,
            part_count: 0,
          };
        }

        vendor_analysis[part.vendor.name].total_sell += sell_price;
        vendor_analysis[part.vendor.name].total_cost += cost_price;
        vendor_analysis[part.vendor.name].total_margin +=
          sell_price - cost_price;
        vendor_analysis[part.vendor.name].part_count++;
      }

      // Status analysis
      const status = part.status || 'needed';
      if (!status_analysis[status]) {
        status_analysis[status] = {
          total_sell: 0,
          total_cost: 0,
          part_count: 0,
        };
      }
      status_analysis[status].total_sell += sell_price;
      status_analysis[status].total_cost += cost_price;
      status_analysis[status].part_count++;

      total_sell += sell_price;
      total_cost += cost_price;
      total_margin += sell_price - cost_price;
    });

    // Calculate percentages
    Object.values(vendor_analysis).forEach(vendor => {
      vendor.margin_percentage =
        vendor.total_sell > 0
          ? (vendor.total_margin / vendor.total_sell) * 100
          : 0;
    });

    Object.values(status_analysis).forEach(status => {
      status.margin_percentage =
        status.total_sell > 0
          ? ((status.total_sell - status.total_cost) / status.total_sell) * 100
          : 0;
    });

    res.json({
      success: true,
      data: {
        overall_analysis: {
          total_parts: parts.length,
          total_sell_value: total_sell.toFixed(2),
          total_cost_value: total_cost.toFixed(2),
          total_margin: total_margin.toFixed(2),
          margin_percentage:
            total_sell > 0
              ? ((total_margin / total_sell) * 100).toFixed(2)
              : '0.00',
        },
        vendor_analysis,
        status_analysis,
        analysis_period: `${date_range} days`,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Margin analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate margin analysis',
      error: error.message,
    });
  }
});

/**
 * Helper Functions
 */

function isValidStatusTransition(current_status, new_status) {
  const valid_transitions = {
    needed: ['sourcing', 'ordered', 'cancelled'],
    sourcing: ['ordered', 'needed', 'cancelled'],
    ordered: ['backordered', 'received', 'cancelled'],
    backordered: ['received', 'cancelled'],
    received: ['installed', 'returned'],
    installed: ['returned'], // Can return defective installed parts
    returned: ['needed', 'cancelled'],
    cancelled: ['needed'], // Can reactivate cancelled parts
  };

  return valid_transitions[current_status]?.includes(new_status) || false;
}

function formatPartForResponse(part) {
  return {
    id: part.id,
    part_number: part.part_number,
    description: part.part_description,
    quantity: part.quantity,
    unit_cost: part.unit_cost,
    total_cost: part.quantity * part.unit_cost,
    status: part.status,
    vendor: part.vendor
      ? {
          name: part.vendor.name,
          code: part.vendor.vendor_code,
          discount: part.vendor.discount_percentage,
        }
      : null,
    ro_number: part.repairOrder?.ro_number,
    po_number: part.partsOrder?.po_number,
    expected_date:
      part.expected_delivery_date || part.partsOrder?.requested_delivery_date,
    priority: part.priority,
    days_in_status: part.status_changed_date
      ? Math.ceil(
          (new Date() - new Date(part.status_changed_date)) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
    created_at: part.created_at,
    updated_at: part.updated_at,
  };
}

async function getStatusBreakdown(base_where_clause) {
  const statuses = [
    'needed',
    'sourcing',
    'ordered',
    'backordered',
    'received',
    'installed',
    'returned',
    'cancelled',
  ];
  const breakdown = {};

  for (const status of statuses) {
    const count = await AdvancedPartsManagement.count({
      where: { ...base_where_clause, status },
    });
    breakdown[status] = count;
  }

  return breakdown;
}

function estimatePartPrice(part, discount_percentage = 0) {
  // Simple pricing estimation - in real implementation would use vendor catalogs
  const base_price = 50; // Default base price
  const price_multiplier = part.part_number.includes('OEM') ? 1.5 : 1.0;
  const estimated =
    base_price * price_multiplier * (1 - discount_percentage / 100);
  return Math.round(estimated * 100) / 100;
}

function calculateDeliveryEstimate(vendor, urgent = false) {
  const base_days = vendor.typical_delivery_days || 3;
  return urgent ? Math.max(1, base_days - 2) : base_days;
}

module.exports = router;
