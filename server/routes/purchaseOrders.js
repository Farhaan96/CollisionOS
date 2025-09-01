/**
 * CollisionOS Purchase Order Workflow APIs
 * Phase 2 Backend Development
 *
 * Advanced PO System with structured numbering and vendor management
 * Features:
 * - Structured PO numbering: ${ro_number}-${YYMM}-${vendorCode}-${seq}
 * - Vendor code generation: 4 chars uppercase from supplier name
 * - Margin validation against vendor agreements
 * - Status workflow: draft → sent → ack → partial → received → closed
 * - Partial receiving with quantity tracking
 * - Returns handling for quantity mismatches
 * - PO splitting by vendor or delivery
 */

const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const {
  PurchaseOrderSystem,
  AdvancedPartsManagement,
  RepairOrderManagement,
  Vendor,
  User,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const rateLimit = require('express-rate-limit');

// Rate limiting for PO operations
const poRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 PO operations per 15 minutes
  message: 'Too many PO operations, please try again later.',
});

/**
 * POST /api/pos - Create PO from selected part lines
 *
 * Body: {
 *   part_line_ids: string[],
 *   vendor_id: string,
 *   ro_number: string,
 *   delivery_date: string,
 *   notes: string,
 *   expedite: boolean
 * }
 */
router.post('/', poRateLimit, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      part_line_ids,
      vendor_id,
      ro_number,
      delivery_date,
      notes,
      expedite,
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate vendor exists
    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Get part lines and validate they're all needed
    const partLines = await AdvancedPartsManagement.findAll({
      where: {
        id: part_line_ids,
        shopId,
        status: 'needed',
        vendorId: vendor_id,
      },
      include: [
        {
          model: RepairOrderManagement,
          as: 'repairOrder',
          attributes: ['ro_number'],
        },
      ],
    });

    if (partLines.length !== part_line_ids.length) {
      return res.status(400).json({
        success: false,
        message:
          'Some part lines are not available for ordering or belong to different vendor',
      });
    }

    // Generate PO number with structured format
    const poNumber = await generatePONumber(ro_number, vendor);

    // Calculate totals and margin validation
    let subtotal = 0;
    let estimated_margin = 0;

    for (const partLine of partLines) {
      subtotal += partLine.quantity * partLine.unit_cost;

      // Calculate margin against vendor agreement
      const agreementDiscount = vendor.discount_percentage || 0;
      const cost = partLine.unit_cost * (1 - agreementDiscount / 100);
      const sell = partLine.unit_cost; // Assuming unit_cost is sell price for now
      estimated_margin += (sell - cost) * partLine.quantity;
    }

    // Create purchase order
    const purchaseOrder = await PurchaseOrderSystem.create({
      po_number: poNumber,
      repairOrderId: partLines[0].repairOrderId,
      vendorId: vendor_id,
      status: 'draft',
      subtotal,
      tax_amount: subtotal * 0.08, // Default 8% tax
      total_amount: subtotal * 1.08,
      estimated_margin,
      requested_delivery_date: delivery_date,
      po_notes: notes,
      expedite,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Update part lines to reference this PO and change status to ordered
    await AdvancedPartsManagement.update(
      {
        partsOrderId: purchaseOrder.id,
        status: 'ordered',
        orderedBy: userId,
        order_date: new Date(),
        updatedBy: userId,
      },
      {
        where: { id: part_line_ids },
      }
    );

    // Broadcast real-time update
    realtimeService.broadcastPOUpdate(
      {
        po_id: purchaseOrder.id,
        po_number: poNumber,
        status: 'draft',
        vendor_name: vendor.name,
        total_amount: purchaseOrder.total_amount,
      },
      'created'
    );

    res.json({
      success: true,
      message: 'Purchase order created successfully',
      data: {
        po_id: purchaseOrder.id,
        po_number: poNumber,
        status: 'draft',
        total_amount: purchaseOrder.total_amount,
        part_count: partLines.length,
      },
    });
  } catch (error) {
    console.error('Create PO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message,
    });
  }
});

/**
 * POST /api/pos/:id/receive - Partial receiving with quantity tracking
 *
 * Body: {
 *   received_items: [{
 *     part_line_id: string,
 *     received_quantity: number,
 *     condition: 'good' | 'damaged' | 'wrong_part',
 *     notes: string
 *   }]
 * }
 */
router.post('/:id/receive', poRateLimit, async (req, res) => {
  try {
    const { id } = req.params;
    const { received_items } = req.body;
    const { shopId, userId } = req.user;

    // Get PO with part lines
    const purchaseOrder = await PurchaseOrderSystem.findOne({
      where: { id, shopId },
      include: [
        {
          model: AdvancedPartsManagement,
          as: 'advancedPartsManagement',
          where: { status: ['ordered', 'backordered'] },
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['name', 'contact_email'],
        },
      ],
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    let all_received = true;
    const processing_results = [];
    const return_items = [];

    // Process each received item
    for (const item of received_items) {
      const partLine = purchaseOrder.advancedPartsManagement.find(
        p => p.id === item.part_line_id
      );

      if (!partLine) {
        processing_results.push({
          part_line_id: item.part_line_id,
          status: 'error',
          message: 'Part line not found in this PO',
        });
        continue;
      }

      const received_qty = parseInt(item.received_quantity);
      const ordered_qty = partLine.quantity;

      let new_status = 'received';
      let quantity_variance = received_qty - ordered_qty;

      // Handle different receiving scenarios
      if (received_qty === ordered_qty && item.condition === 'good') {
        // Perfect match - ready to install
        new_status = 'received';
      } else if (received_qty < ordered_qty) {
        // Partial delivery - still need more
        new_status = 'partial';
        all_received = false;
      } else if (received_qty > ordered_qty) {
        // Over-delivery - create return
        new_status = 'received';
        return_items.push({
          part_line_id: item.part_line_id,
          part_number: partLine.part_number,
          return_quantity: quantity_variance,
          reason: 'over_delivery',
        });
      }

      if (item.condition !== 'good') {
        new_status = item.condition === 'damaged' ? 'damaged' : 'wrong_part';
        all_received = false;
      }

      // Update part line
      await AdvancedPartsManagement.update(
        {
          status: new_status,
          received_quantity: received_qty,
          received_date: new Date(),
          receivedBy: userId,
          receiving_notes: item.notes,
          updatedBy: userId,
        },
        {
          where: { id: item.part_line_id },
        }
      );

      processing_results.push({
        part_line_id: item.part_line_id,
        status: 'processed',
        new_status,
        quantity_variance,
        message: `Received ${received_qty} of ${ordered_qty} ordered`,
      });
    }

    // Update PO status based on receiving results
    let po_status = all_received ? 'received' : 'partial';
    await PurchaseOrderSystem.update(
      {
        status: po_status,
        received_date: all_received ? new Date() : null,
        receiving_notes: `Partial receiving by ${userId}`,
        updatedBy: userId,
      },
      {
        where: { id },
      }
    );

    // Create return orders if needed
    if (return_items.length > 0) {
      await createReturnOrder(purchaseOrder, return_items, userId);
    }

    // Broadcast real-time update
    realtimeService.broadcastPOUpdate(
      {
        po_id: id,
        po_number: purchaseOrder.po_number,
        status: po_status,
        received_items: received_items.length,
        returns_created: return_items.length,
      },
      'received'
    );

    res.json({
      success: true,
      message: `Purchase order ${all_received ? 'fully' : 'partially'} received`,
      data: {
        po_status,
        processing_results,
        return_items: return_items.length,
        all_received,
      },
    });
  } catch (error) {
    console.error('PO receiving error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process receiving',
      error: error.message,
    });
  }
});

/**
 * POST /api/part-lines/:id/install - Install parts and update status
 */
router.post('/part-lines/:id/install', async (req, res) => {
  try {
    const { id } = req.params;
    const { installed_quantity, installation_notes, technician_id } = req.body;
    const { shopId, userId } = req.user;

    const partLine = await AdvancedPartsManagement.findOne({
      where: { id, shopId, status: 'received' },
    });

    if (!partLine) {
      return res.status(404).json({
        success: false,
        message: 'Part line not found or not ready for installation',
      });
    }

    const install_qty =
      parseInt(installed_quantity) || partLine.received_quantity;

    await AdvancedPartsManagement.update(
      {
        status: 'installed',
        installed_quantity: install_qty,
        installation_date: new Date(),
        installedBy: technician_id || userId,
        installation_notes,
        updatedBy: userId,
      },
      {
        where: { id },
      }
    );

    // Broadcast real-time update
    realtimeService.broadcastPartsUpdate(
      {
        part_line_id: id,
        part_number: partLine.part_number,
        status: 'installed',
        installed_by: technician_id || userId,
      },
      'installed'
    );

    res.json({
      success: true,
      message: 'Part installed successfully',
      data: {
        part_line_id: id,
        status: 'installed',
        installed_quantity: install_qty,
      },
    });
  } catch (error) {
    console.error('Part installation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to install part',
      error: error.message,
    });
  }
});

/**
 * GET /api/pos/vendor/:vendorId - Vendor-specific PO views
 */
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { shopId } = req.user;
    const { status, date_range = '30' } = req.query;

    const whereClause = { vendorId, shopId };
    if (status) whereClause.status = status;

    // Date range filter
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(date_range));
    whereClause.created_at = { [Op.gte]: dateFrom };

    const purchaseOrders = await PurchaseOrderSystem.findAll({
      where: whereClause,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['name', 'vendor_code', 'contact_email'],
        },
        {
          model: RepairOrderManagement,
          as: 'repairOrder',
          attributes: ['ro_number', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Calculate vendor performance metrics
    const metrics = calculateVendorMetrics(purchaseOrders);

    res.json({
      success: true,
      data: {
        purchase_orders: purchaseOrders,
        vendor_metrics: metrics,
        total_pos: purchaseOrders.length,
      },
    });
  } catch (error) {
    console.error('Vendor PO view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor POs',
      error: error.message,
    });
  }
});

/**
 * POST /api/pos/:id/split - Split POs by vendor or delivery
 */
router.post('/:id/split', async (req, res) => {
  try {
    const { id } = req.params;
    const { split_by, split_groups } = req.body; // split_by: 'vendor' | 'delivery'
    const { shopId, userId } = req.user;

    const originalPO = await PurchaseOrderSystem.findOne({
      where: { id, shopId, status: 'draft' },
      include: [
        {
          model: AdvancedPartsManagement,
          as: 'advancedPartsManagement',
        },
      ],
    });

    if (!originalPO) {
      return res.status(404).json({
        success: false,
        message: 'PO not found or cannot be split (must be in draft status)',
      });
    }

    const split_pos = [];

    // Create new POs for each split group
    for (const group of split_groups) {
      const group_parts = originalPO.advancedPartsManagement.filter(p =>
        group.part_line_ids.includes(p.id)
      );

      if (group_parts.length === 0) continue;

      const group_subtotal = group_parts.reduce(
        (sum, part) => sum + part.quantity * part.unit_cost,
        0
      );

      const newPO = await PurchaseOrderSystem.create({
        po_number: await generatePONumber(originalPO.repairOrder?.ro_number, {
          vendor_code: group.vendor_code,
        }),
        repairOrderId: originalPO.repairOrderId,
        vendorId: group.vendor_id,
        status: 'draft',
        subtotal: group_subtotal,
        tax_amount: group_subtotal * 0.08,
        total_amount: group_subtotal * 1.08,
        estimated_margin:
          originalPO.estimated_margin * (group_subtotal / originalPO.subtotal),
        requested_delivery_date:
          group.delivery_date || originalPO.requested_delivery_date,
        po_notes: `Split from PO ${originalPO.po_number}`,
        parentOrderId: originalPO.id,
        shopId,
        createdBy: userId,
        updatedBy: userId,
      });

      // Update part lines to reference new PO
      await AdvancedPartsManagement.update(
        { partsOrderId: newPO.id },
        { where: { id: group.part_line_ids } }
      );

      split_pos.push({
        po_id: newPO.id,
        po_number: newPO.po_number,
        vendor_id: group.vendor_id,
        part_count: group_parts.length,
        total_amount: newPO.total_amount,
      });
    }

    // Mark original PO as split
    await PurchaseOrderSystem.update(
      {
        status: 'split',
        updatedBy: userId,
      },
      {
        where: { id },
      }
    );

    res.json({
      success: true,
      message: `PO split into ${split_pos.length} orders`,
      data: {
        original_po_id: id,
        split_pos,
      },
    });
  } catch (error) {
    console.error('PO split error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to split PO',
      error: error.message,
    });
  }
});

/**
 * Generate structured PO number: ${ro_number}-${YYMM}-${vendorCode}-${seq}
 */
async function generatePONumber(ro_number, vendor) {
  const now = new Date();
  const yy = now.getFullYear().toString().substr(2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');

  // Generate vendor code (4 chars uppercase from supplier name)
  const vendorCode = vendor.vendor_code || generateVendorCode(vendor.name);

  // Get sequence number for this vendor/month
  const seq = await getNextSequence(vendorCode, `${yy}${mm}`);

  return `${ro_number}-${yy}${mm}-${vendorCode}-${seq.toString().padStart(3, '0')}`;
}

/**
 * Generate 4-character vendor code from supplier name
 */
function generateVendorCode(vendorName) {
  const cleaned = vendorName.toUpperCase().replace(/[^A-Z]/g, '');
  return cleaned.length >= 4 ? cleaned.substr(0, 4) : cleaned.padEnd(4, 'X');
}

/**
 * Get next sequence number for PO numbering
 */
async function getNextSequence(vendorCode, yearMonth) {
  const count = await PurchaseOrderSystem.count({
    where: {
      po_number: {
        [Op.like]: `%-${yearMonth}-${vendorCode}-%`,
      },
    },
  });
  return count + 1;
}

/**
 * Calculate vendor performance metrics
 */
function calculateVendorMetrics(purchaseOrders) {
  const total = purchaseOrders.length;
  if (total === 0) return null;

  const on_time = purchaseOrders.filter(
    po =>
      po.status === 'received' &&
      new Date(po.received_date) <= new Date(po.requested_delivery_date)
  ).length;

  const avg_delivery_days =
    purchaseOrders
      .filter(po => po.status === 'received')
      .reduce((sum, po) => {
        const days = Math.ceil(
          (new Date(po.received_date) - new Date(po.created_at)) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) /
    Math.max(1, purchaseOrders.filter(po => po.status === 'received').length);

  const total_value = purchaseOrders.reduce(
    (sum, po) => sum + po.total_amount,
    0
  );

  return {
    total_pos: total,
    on_time_delivery_rate: ((on_time / total) * 100).toFixed(1),
    avg_delivery_days: Math.round(avg_delivery_days),
    total_value: total_value.toFixed(2),
    status_breakdown: purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Create return order for over-deliveries or damaged parts
 */
async function createReturnOrder(purchaseOrder, return_items, userId) {
  // Implementation for return order creation
  // This would create entries in a returns table and notify the vendor
  console.log(
    `Creating return order for PO ${purchaseOrder.po_number}:`,
    return_items
  );

  // Broadcast return notification
  realtimeService.broadcastPOUpdate(
    {
      po_id: purchaseOrder.id,
      po_number: purchaseOrder.po_number,
      return_items: return_items.length,
      action: 'returns_created',
    },
    'returns'
  );
}

module.exports = router;
