/**
 * Parts Status Update API - CollisionOS
 *
 * Handles parts workflow status transitions for drag-and-drop interface
 * - Update single part status
 * - Bulk status updates
 * - Status change audit trail
 */

const express = require('express');
const router = express.Router();
const { validationResult, body, param } = require('express-validator');
const { AdvancedPartsManagement } = require('../database/models');

/**
 * PUT /api/parts/:id/status
 * Update part status (for drag-and-drop workflow)
 */
router.put('/:id/status', [
  param('id').isUUID().withMessage('Invalid part ID format'),
  body('status').notEmpty().withMessage('Status is required')
    .isIn(['needed', 'sourcing', 'ordered', 'backordered', 'received', 'installed', 'cancelled', 'returned'])
    .withMessage('Invalid status value'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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
    const { status, notes = '' } = req.body;
    const { userId } = req.user;

    // Find the part
    const part = await AdvancedPartsManagement.findByPk(id);

    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }

    const previousStatus = part.status;

    // Update the part status with audit trail
    const updateData = {
      status,
      statusChangedBy: userId,
      statusChangedAt: new Date(),
      statusChangeNotes: notes,
      updatedBy: userId
    };

    // Set status-specific fields
    if (status === 'sourcing' && !part.sourcingStartDate) {
      updateData.sourcingStartDate = new Date();
      updateData.sourcedBy = userId;
    } else if (status === 'ordered' && !part.orderDate) {
      updateData.orderDate = new Date();
      updateData.orderedBy = userId;
    } else if (status === 'received' && !part.receivedDate) {
      updateData.receivedDate = new Date();
      updateData.receivedBy = userId;
    } else if (status === 'installed' && !part.installationDate) {
      updateData.installationDate = new Date();
      updateData.installedBy = userId;
    }

    await part.update(updateData);

    res.json({
      success: true,
      data: {
        id: part.id,
        part_number: part.partNumber,
        description: part.partDescription,
        status: part.status,
        previous_status: previousStatus,
        updated_at: part.updatedAt
      },
      message: `Part status updated from ${previousStatus} to ${status}`
    });

  } catch (error) {
    console.error('Update part status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update part status',
      error: error.message
    });
  }
});

/**
 * PUT /api/parts/bulk-status-update
 * Bulk update part statuses (for multi-select operations)
 */
router.put('/bulk-status-update', [
  body('part_line_ids').isArray({ min: 1 }).withMessage('Part line IDs array is required'),
  body('part_line_ids.*').isUUID().withMessage('Each part line ID must be a valid UUID'),
  body('status').notEmpty().withMessage('Status is required')
    .isIn(['needed', 'sourcing', 'ordered', 'backordered', 'received', 'installed', 'cancelled', 'returned'])
    .withMessage('Invalid status value'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    const { part_line_ids, status, notes = '' } = req.body;
    const { userId } = req.user;

    // Find all parts
    const parts = await AdvancedPartsManagement.findAll({
      where: {
        id: part_line_ids
      }
    });

    if (parts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No parts found with the provided IDs'
      });
    }

    // Update all parts
    const updateData = {
      status,
      statusChangedBy: userId,
      statusChangedAt: new Date(),
      statusChangeNotes: notes,
      updatedBy: userId
    };

    // Status-specific fields
    if (status === 'sourcing') {
      updateData.sourcingStartDate = new Date();
      updateData.sourcedBy = userId;
    } else if (status === 'ordered') {
      updateData.orderDate = new Date();
      updateData.orderedBy = userId;
    } else if (status === 'received') {
      updateData.receivedDate = new Date();
      updateData.receivedBy = userId;
    } else if (status === 'installed') {
      updateData.installationDate = new Date();
      updateData.installedBy = userId;
    }

    await AdvancedPartsManagement.update(updateData, {
      where: {
        id: part_line_ids
      }
    });

    // Fetch updated parts
    const updatedParts = await AdvancedPartsManagement.findAll({
      where: {
        id: part_line_ids
      }
    });

    res.json({
      success: true,
      data: updatedParts.map(p => ({
        id: p.id,
        part_number: p.partNumber,
        description: p.partDescription,
        status: p.status
      })),
      updated_count: updatedParts.length,
      message: `${updatedParts.length} parts updated to ${status}`
    });

  } catch (error) {
    console.error('Bulk update part status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update part statuses',
      error: error.message
    });
  }
});

module.exports = router;
