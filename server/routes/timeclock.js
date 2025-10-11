const express = require('express');
const router = express.Router();
const { TimeClock, User, Job, RepairOrderManagement } = require('../database/models');
const qrCodeService = require('../services/qrCodeService');
const { realtimeService } = require('../services/realtimeService');
const { auditLogger } = require('../middleware/security');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');

// Rate limiting for time clock
const timeClockLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many time clock requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/timeclock/punch-in - Clock in (general or on specific RO)
router.post('/punch-in', timeClockLimit, async (req, res) => {
  try {
    const { technicianId, roId = null, laborType = null, workDescription = null, entryMethod = 'manual' } = req.body;
    const shopId = req.user?.shopId || 1;

    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }

    // Check if technician is already clocked in
    const activeClock = await TimeClock.findOne({
      where: {
        technicianId,
        shopId,
        status: { [Op.in]: ['clocked_in', 'on_break'] },
      },
      order: [['clockIn', 'DESC']],
    });

    if (activeClock) {
      return res.status(400).json({
        error: 'Already clocked in',
        activeClock,
      });
    }

    // Get technician details
    const technician = await User.findByPk(technicianId);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Get RO details if provided
    let ro = null;
    let estimatedHours = null;
    if (roId) {
      ro = await Job.findByPk(roId, {
        include: [
          { model: require('../database/models').Customer, as: 'customer' },
          { model: require('../database/models').Vehicle, as: 'vehicle' },
        ],
      });

      if (!ro) {
        return res.status(404).json({ error: 'Repair order not found' });
      }

      estimatedHours = ro.estimatedHours || null;
    }

    // Create time clock entry
    const clockEntry = await TimeClock.create({
      shopId,
      technicianId,
      roId,
      clockIn: new Date(),
      laborType,
      workDescription,
      entryMethod,
      hourlyRate: technician.hourlyRate || 75.0,
      estimatedHours,
      status: 'clocked_in',
      flaggedForPayroll: true,
      createdBy: req.user?.id || technicianId,
    });

    // Audit logging
    auditLogger.info('Time clock punch in', {
      technicianId,
      roId,
      clockEntryId: clockEntry.id,
      timestamp: clockEntry.clockIn,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'time_clock_punch_in', {
      technician: {
        id: technician.id,
        name: technician.name,
      },
      ro: ro ? { id: ro.id, jobNumber: ro.jobNumber } : null,
      clockEntry,
    });

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      clockEntry,
      technician: {
        id: technician.id,
        name: technician.name,
      },
      ro: ro ? {
        id: ro.id,
        jobNumber: ro.jobNumber,
        vehicle: ro.vehicle,
      } : null,
    });
  } catch (error) {
    console.error('Error punching in:', error);
    res.status(500).json({ error: 'Failed to punch in' });
  }
});

// POST /api/timeclock/punch-out - Clock out
router.post('/punch-out', timeClockLimit, async (req, res) => {
  try {
    const { technicianId, notes = null } = req.body;
    const shopId = req.user?.shopId || 1;

    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }

    // Find active clock entry
    const clockEntry = await TimeClock.findOne({
      where: {
        technicianId,
        shopId,
        status: { [Op.in]: ['clocked_in', 'on_break'] },
      },
      order: [['clockIn', 'DESC']],
    });

    if (!clockEntry) {
      return res.status(400).json({ error: 'No active clock entry found' });
    }

    // Update clock entry
    await clockEntry.update({
      clockOut: new Date(),
      notes: notes || clockEntry.notes,
      updatedBy: req.user?.id || technicianId,
    });

    // Get technician details
    const technician = await User.findByPk(technicianId);

    // Audit logging
    auditLogger.info('Time clock punch out', {
      technicianId,
      clockEntryId: clockEntry.id,
      totalHours: clockEntry.totalHours,
      laborCost: clockEntry.laborCost,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'time_clock_punch_out', {
      technician: {
        id: technician.id,
        name: technician.name,
      },
      clockEntry,
    });

    res.json({
      success: true,
      message: 'Clocked out successfully',
      clockEntry,
      summary: {
        totalHours: clockEntry.totalHours,
        breakHours: clockEntry.breakHours,
        netHours: clockEntry.netHours,
        laborCost: clockEntry.laborCost,
        efficiencyRating: clockEntry.getEfficiencyRating(),
      },
    });
  } catch (error) {
    console.error('Error punching out:', error);
    res.status(500).json({ error: 'Failed to punch out' });
  }
});

// POST /api/timeclock/break-start - Start break
router.post('/break-start', timeClockLimit, async (req, res) => {
  try {
    const { technicianId } = req.body;
    const shopId = req.user?.shopId || 1;

    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }

    // Find active clock entry
    const clockEntry = await TimeClock.findOne({
      where: {
        technicianId,
        shopId,
        status: 'clocked_in',
      },
      order: [['clockIn', 'DESC']],
    });

    if (!clockEntry) {
      return res.status(400).json({ error: 'No active clock entry found' });
    }

    if (clockEntry.breakStart && !clockEntry.breakEnd) {
      return res.status(400).json({ error: 'Already on break' });
    }

    // Update clock entry
    await clockEntry.update({
      breakStart: new Date(),
      status: 'on_break',
      updatedBy: req.user?.id || technicianId,
    });

    // Audit logging
    auditLogger.info('Time clock break start', {
      technicianId,
      clockEntryId: clockEntry.id,
    });

    res.json({
      success: true,
      message: 'Break started',
      clockEntry,
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ error: 'Failed to start break' });
  }
});

// POST /api/timeclock/break-end - End break
router.post('/break-end', timeClockLimit, async (req, res) => {
  try {
    const { technicianId } = req.body;
    const shopId = req.user?.shopId || 1;

    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }

    // Find active clock entry
    const clockEntry = await TimeClock.findOne({
      where: {
        technicianId,
        shopId,
        status: 'on_break',
      },
      order: [['clockIn', 'DESC']],
    });

    if (!clockEntry) {
      return res.status(400).json({ error: 'No active break found' });
    }

    // Update clock entry
    await clockEntry.update({
      breakEnd: new Date(),
      status: 'clocked_in',
      updatedBy: req.user?.id || technicianId,
    });

    // Audit logging
    auditLogger.info('Time clock break end', {
      technicianId,
      clockEntryId: clockEntry.id,
      breakHours: clockEntry.breakHours,
    });

    res.json({
      success: true,
      message: 'Break ended',
      clockEntry,
      breakDuration: clockEntry.breakHours,
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ error: 'Failed to end break' });
  }
});

// GET /api/timeclock/active - Get all active clock entries
router.get('/active', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    const activeClocks = await TimeClock.findAll({
      where: {
        shopId,
        status: { [Op.in]: ['clocked_in', 'on_break'] },
      },
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email', 'hourlyRate'],
        },
        {
          model: Job,
          as: 'ro',
          attributes: ['id', 'jobNumber', 'status'],
          required: false,
        },
      ],
      order: [['clockIn', 'DESC']],
    });

    res.json({
      success: true,
      count: activeClocks.length,
      activeClocks,
    });
  } catch (error) {
    console.error('Error fetching active clocks:', error);
    res.status(500).json({ error: 'Failed to fetch active clocks' });
  }
});

// GET /api/timeclock/technician/:technicianId/current - Get current status
router.get('/technician/:technicianId/current', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const shopId = req.user?.shopId || 1;

    const currentClock = await TimeClock.findOne({
      where: {
        technicianId,
        shopId,
        status: { [Op.in]: ['clocked_in', 'on_break'] },
      },
      include: [
        {
          model: Job,
          as: 'ro',
          attributes: ['id', 'jobNumber', 'status'],
          include: [
            { model: require('../database/models').Vehicle, as: 'vehicle' },
          ],
          required: false,
        },
      ],
      order: [['clockIn', 'DESC']],
    });

    // Calculate shift summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = await TimeClock.findAll({
      where: {
        technicianId,
        shopId,
        clockIn: { [Op.gte]: today },
      },
    });

    const shiftSummary = {
      totalHours: 0,
      breakHours: 0,
      netHours: 0,
      laborCost: 0,
      entries: todayEntries.length,
    };

    todayEntries.forEach((entry) => {
      shiftSummary.totalHours += parseFloat(entry.totalHours || 0);
      shiftSummary.breakHours += parseFloat(entry.breakHours || 0);
      shiftSummary.netHours += parseFloat(entry.netHours || 0);
      shiftSummary.laborCost += parseFloat(entry.laborCost || 0);
    });

    res.json({
      success: true,
      isClockedIn: !!currentClock,
      currentClock,
      shiftSummary,
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ error: 'Failed to fetch current status' });
  }
});

// GET /api/timeclock/ro/:roId - Get all time entries for RO
router.get('/ro/:roId', async (req, res) => {
  try {
    const { roId } = req.params;
    const shopId = req.user?.shopId || 1;

    const entries = await TimeClock.findAll({
      where: {
        roId,
        shopId,
      },
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['clockIn', 'DESC']],
    });

    // Calculate totals
    const totals = {
      totalHours: 0,
      breakHours: 0,
      netHours: 0,
      laborCost: 0,
      technicians: new Set(),
    };

    entries.forEach((entry) => {
      totals.totalHours += parseFloat(entry.totalHours || 0);
      totals.breakHours += parseFloat(entry.breakHours || 0);
      totals.netHours += parseFloat(entry.netHours || 0);
      totals.laborCost += parseFloat(entry.laborCost || 0);
      if (entry.technicianId) totals.technicians.add(entry.technicianId);
    });

    totals.technicians = totals.technicians.size;

    res.json({
      success: true,
      entries,
      totals,
    });
  } catch (error) {
    console.error('Error fetching RO time entries:', error);
    res.status(500).json({ error: 'Failed to fetch RO time entries' });
  }
});

// GET /api/timeclock/report - Efficiency and productivity report
router.get('/report', async (req, res) => {
  try {
    const { technicianId, startDate, endDate } = req.query;
    const shopId = req.user?.shopId || 1;

    const whereClause = { shopId, status: 'clocked_out' };

    if (technicianId) {
      whereClause.technicianId = technicianId;
    }

    if (startDate && endDate) {
      whereClause.clockIn = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.clockIn = { [Op.gte]: thirtyDaysAgo };
    }

    const entries = await TimeClock.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Job,
          as: 'ro',
          attributes: ['id', 'jobNumber'],
          required: false,
        },
      ],
      order: [['clockIn', 'DESC']],
    });

    // Calculate metrics
    const metrics = {
      totalEntries: entries.length,
      totalHours: 0,
      totalBreakHours: 0,
      totalNetHours: 0,
      totalLaborCost: 0,
      avgEfficiency: 0,
      technicianBreakdown: {},
    };

    let efficiencyCount = 0;
    let totalEfficiency = 0;

    entries.forEach((entry) => {
      metrics.totalHours += parseFloat(entry.totalHours || 0);
      metrics.totalBreakHours += parseFloat(entry.breakHours || 0);
      metrics.totalNetHours += parseFloat(entry.netHours || 0);
      metrics.totalLaborCost += parseFloat(entry.laborCost || 0);

      if (entry.efficiencyRating) {
        totalEfficiency += parseFloat(entry.efficiencyRating);
        efficiencyCount++;
      }

      // Technician breakdown
      const techId = entry.technicianId;
      if (!metrics.technicianBreakdown[techId]) {
        metrics.technicianBreakdown[techId] = {
          technician: entry.technician,
          entries: 0,
          totalHours: 0,
          netHours: 0,
          laborCost: 0,
          avgEfficiency: 0,
          efficiencyCount: 0,
        };
      }

      metrics.technicianBreakdown[techId].entries++;
      metrics.technicianBreakdown[techId].totalHours += parseFloat(entry.totalHours || 0);
      metrics.technicianBreakdown[techId].netHours += parseFloat(entry.netHours || 0);
      metrics.technicianBreakdown[techId].laborCost += parseFloat(entry.laborCost || 0);

      if (entry.efficiencyRating) {
        metrics.technicianBreakdown[techId].avgEfficiency += parseFloat(entry.efficiencyRating);
        metrics.technicianBreakdown[techId].efficiencyCount++;
      }
    });

    metrics.avgEfficiency = efficiencyCount > 0 ? (totalEfficiency / efficiencyCount).toFixed(2) : 0;

    // Calculate average efficiency per technician
    Object.keys(metrics.technicianBreakdown).forEach((techId) => {
      const tech = metrics.technicianBreakdown[techId];
      if (tech.efficiencyCount > 0) {
        tech.avgEfficiency = (tech.avgEfficiency / tech.efficiencyCount).toFixed(2);
      }
    });

    res.json({
      success: true,
      period: {
        start: startDate || 'Last 30 days',
        end: endDate || new Date().toISOString(),
      },
      metrics,
      entries: technicianId ? entries : [], // Only return entries if filtering by technician
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/timeclock/ro/:roId/qr-code - Generate QR code for RO
router.get('/ro/:roId/qr-code', async (req, res) => {
  try {
    const { roId } = req.params;

    const ro = await Job.findByPk(roId, {
      include: [
        { model: require('../database/models').Customer, as: 'customer' },
        { model: require('../database/models').Vehicle, as: 'vehicle' },
      ],
    });

    if (!ro) {
      return res.status(404).json({ error: 'Repair order not found' });
    }

    const qrCode = await qrCodeService.generateROQRCode(ro);

    res.json({
      success: true,
      roId: ro.id,
      roNumber: ro.jobNumber,
      qrCode,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /api/timeclock/scan-qr - Punch in using QR code
router.post('/scan-qr', timeClockLimit, async (req, res) => {
  try {
    const { qrData, technicianId } = req.body;

    if (!qrData || !technicianId) {
      return res.status(400).json({ error: 'QR data and technician ID are required' });
    }

    // Validate QR code
    const validatedData = qrCodeService.validateQRCode(qrData);
    if (!validatedData || validatedData.type !== 'repair_order') {
      return res.status(400).json({ error: 'Invalid QR code' });
    }

    // Punch in on the RO
    req.body.roId = validatedData.roId;
    req.body.entryMethod = 'qr_code';

    // Delegate to punch-in handler
    return router.handle({ ...req, url: '/punch-in', method: 'POST' }, res);
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ error: 'Failed to scan QR code' });
  }
});

module.exports = router;
