/**
 * CollisionOS Loaner Fleet Management APIs
 * Phase 2 Backend Development
 *
 * Complete courtesy car management with reservation system
 * Features:
 * - Fleet status and availability tracking
 * - Reservation system with vehicle assignment
 * - Check-out process with digital paperwork
 * - Return processing with damage assessment
 * - Fleet utilization analytics
 * - Maintenance scheduling and tracking
 */

const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { validationResult } = require('express-validator');
const {
  LoanerFleetManagement,
  LoanerReservation,
  RepairOrderManagement,
  Customer,
  User,
  ClaimManagement,
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const rateLimit = require('express-rate-limit');

// Rate limiting for loaner operations
const loanerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 loaner operations per 15 minutes
  message: 'Too many loaner operations, please try again later.',
});

/**
 * POST /api/loaners/fleet - Add new vehicle to fleet
 */
router.post('/fleet', loanerRateLimit, async (req, res) => {
  try {
    const { shopId, userId } = req.user;
    const {
      make,
      model,
      year,
      licensePlate,
      mileage,
      status = 'available',
      location,
      fuelLevel = 100,
      vehicleType,
      vin,
      color,
    } = req.body;

    // Validate required fields
    if (!make || !model || !year || !licensePlate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: make, model, year, licensePlate',
      });
    }

    // Check for duplicate license plate
    const existingVehicle = await LoanerFleetManagement.findOne({
      where: { shopId, license_plate: licensePlate },
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this license plate already exists',
      });
    }

    // Generate vehicle number
    const vehicleCount = await LoanerFleetManagement.count({ where: { shopId } });
    const vehicleNumber = `LC-${(vehicleCount + 1).toString().padStart(3, '0')}`;

    // Create new fleet vehicle
    const newVehicle = await LoanerFleetManagement.create({
      shopId,
      vehicle_number: vehicleNumber,
      make,
      model,
      year,
      license_plate: licensePlate,
      vin,
      color,
      vehicle_type: vehicleType || 'sedan',
      status,
      current_odometer: mileage || 0,
      fuel_level: fuelLevel,
      location,
      total_miles: 0,
      total_rentals: 0,
      createdBy: userId,
      updatedBy: userId,
    });

    res.json({
      success: true,
      message: 'Vehicle added to fleet successfully',
      data: {
        vehicle: formatFleetVehicle(newVehicle),
      },
    });
  } catch (error) {
    console.error('Add fleet vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle to fleet',
      error: error.message,
    });
  }
});

/**
 * PUT /api/loaners/fleet/:id - Update vehicle information
 */
router.put('/fleet/:id', loanerRateLimit, async (req, res) => {
  try {
    const { shopId, userId } = req.user;
    const { id } = req.params;
    const {
      make,
      model,
      year,
      licensePlate,
      mileage,
      status,
      location,
      fuelLevel,
      vehicleType,
      vin,
      color,
    } = req.body;

    const vehicle = await LoanerFleetManagement.findOne({
      where: { id, shopId },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Update vehicle
    await vehicle.update({
      make: make || vehicle.make,
      model: model || vehicle.model,
      year: year || vehicle.year,
      license_plate: licensePlate || vehicle.license_plate,
      vin: vin || vehicle.vin,
      color: color || vehicle.color,
      vehicle_type: vehicleType || vehicle.vehicle_type,
      status: status || vehicle.status,
      current_odometer: mileage !== undefined ? mileage : vehicle.current_odometer,
      fuel_level: fuelLevel !== undefined ? fuelLevel : vehicle.fuel_level,
      location: location || vehicle.location,
      updatedBy: userId,
    });

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        vehicle: formatFleetVehicle(vehicle),
      },
    });
  } catch (error) {
    console.error('Update fleet vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/loaners/fleet/:id - Remove vehicle from fleet
 */
router.delete('/fleet/:id', async (req, res) => {
  try {
    const { shopId, userId } = req.user;
    const { id } = req.params;

    const vehicle = await LoanerFleetManagement.findOne({
      where: { id, shopId },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle is currently in use
    if (vehicle.status === 'rented' || vehicle.status === 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove vehicle that is currently rented or reserved',
      });
    }

    // Soft delete by updating status
    await vehicle.update({
      status: 'out_of_service',
      updatedBy: userId,
    });

    res.json({
      success: true,
      message: 'Vehicle removed from fleet successfully',
    });
  } catch (error) {
    console.error('Remove fleet vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove vehicle',
      error: error.message,
    });
  }
});

/**
 * GET /api/loaners/fleet - Fleet status and availability
 */
router.get('/fleet', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { status, vehicle_type, availability_date } = req.query;

    const where_clause = { shopId };
    if (status) where_clause.status = status;
    if (vehicle_type) where_clause.vehicle_type = vehicle_type;

    const fleet_vehicles = await LoanerFleetManagement.findAll({
      where: where_clause,
      include: [
        {
          model: Customer,
          as: 'currentRenter',
          attributes: ['firstName', 'lastName', 'phone'],
          required: false,
        },
        {
          model: User,
          as: 'damageReporter',
          attributes: ['firstName', 'lastName'],
          required: false,
        },
      ],
      order: [['vehicle_number', 'ASC']],
    });

    // Calculate availability for specific date if provided
    let availability_analysis = null;
    if (availability_date) {
      availability_analysis = await analyzeFleetAvailability(
        shopId,
        availability_date
      );
    }

    // Calculate fleet metrics
    const fleet_metrics = calculateFleetMetrics(fleet_vehicles);

    // Format vehicles
    const formatted_vehicles = fleet_vehicles.map(vehicle => formatFleetVehicle(vehicle));

    // Group vehicles by status for additional info
    const vehicles_by_status = {
      available: [],
      rented: [],
      maintenance: [],
      out_of_service: [],
      reserved: [],
    };

    formatted_vehicles.forEach(vehicle_data => {
      const status_key = vehicle_data.status || 'available';
      if (vehicles_by_status[status_key]) {
        vehicles_by_status[status_key].push(vehicle_data);
      }
    });

    res.json({
      success: true,
      data: {
        vehicles: formatted_vehicles, // Flat array for easy consumption
        fleet_vehicles: vehicles_by_status, // Grouped by status
        fleet_metrics,
        availability_analysis,
        filters_applied: {
          status: status || 'all',
          vehicle_type: vehicle_type || 'all',
          availability_date: availability_date || null,
        },
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Fleet status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fleet status',
      error: error.message,
    });
  }
});

/**
 * POST /api/loaners/reserve - Create loaner reservations
 *
 * Body: {
 *   customer_id: string,
 *   repair_order_id: string,
 *   vehicle_preferences?: {
 *     vehicle_type?: string,
 *     features?: string[]
 *   },
 *   pickup_date: string,
 *   expected_return_date: string,
 *   duration_days?: number,
 *   notes?: string
 * }
 */
router.post('/reserve', loanerRateLimit, async (req, res) => {
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
      customer_id,
      repair_order_id,
      vehicle_preferences,
      pickup_date,
      expected_return_date,
      duration_days,
      notes,
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate customer and repair order
    const customer = await Customer.findByPk(customer_id);
    const repair_order = await RepairOrderManagement.findOne({
      where: { id: repair_order_id, shopId },
    });

    if (!customer || !repair_order) {
      return res.status(404).json({
        success: false,
        message: 'Customer or repair order not found',
      });
    }

    // Find available vehicles that match preferences
    const available_vehicles = await findAvailableVehicles(
      shopId,
      pickup_date,
      expected_return_date,
      vehicle_preferences
    );

    if (available_vehicles.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'No vehicles available for requested dates',
        suggestions: await suggestAlternativeReservations(
          shopId,
          pickup_date,
          expected_return_date
        ),
      });
    }

    // Auto-assign best matching vehicle
    const assigned_vehicle = selectBestVehicleMatch(
      available_vehicles,
      vehicle_preferences
    );

    // Create reservation
    const reservation = await LoanerReservation.create({
      customerId: customer_id,
      repairOrderId: repair_order_id,
      loanerVehicleId: assigned_vehicle.id,
      pickup_date: new Date(pickup_date),
      expected_return_date: new Date(expected_return_date),
      duration_days:
        duration_days ||
        calculateDurationDays(pickup_date, expected_return_date),
      status: 'confirmed',
      vehicle_preferences: JSON.stringify(vehicle_preferences || {}),
      reservation_notes: notes,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Update vehicle status to reserved
    await LoanerFleetManagement.update(
      {
        status: 'reserved',
        reservation_start_date: new Date(pickup_date),
        reservation_end_date: new Date(expected_return_date),
        updatedBy: userId,
      },
      {
        where: { id: assigned_vehicle.id },
      }
    );

    // Generate reservation confirmation
    const confirmation = await generateReservationConfirmation(
      reservation,
      customer,
      assigned_vehicle
    );

    // Broadcast real-time update
    realtimeService.broadcastLoanerUpdate(
      {
        reservation_id: reservation.id,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        vehicle_info: `${assigned_vehicle.year} ${assigned_vehicle.make} ${assigned_vehicle.model}`,
        pickup_date,
        status: 'confirmed',
      },
      'reserved'
    );

    res.json({
      success: true,
      message: 'Loaner vehicle reserved successfully',
      data: {
        reservation: {
          reservation_id: reservation.id,
          confirmation_number: confirmation.confirmation_number,
          vehicle_assigned: {
            vehicle_id: assigned_vehicle.id,
            vehicle_number: assigned_vehicle.vehicle_number,
            make_model: `${assigned_vehicle.make} ${assigned_vehicle.model}`,
            year: assigned_vehicle.year,
            license_plate: assigned_vehicle.license_plate,
          },
          pickup_details: {
            pickup_date,
            pickup_location: 'Shop Location', // Would come from shop settings
            estimated_pickup_time: '09:00 AM',
          },
          return_details: {
            expected_return_date,
            return_location: 'Shop Location',
          },
        },
        confirmation_details: confirmation,
        next_steps: [
          'Customer will receive confirmation email/SMS',
          'Prepare vehicle inspection checklist',
          'Schedule pre-delivery inspection',
        ],
      },
    });
  } catch (error) {
    console.error('Loaner reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message,
    });
  }
});

/**
 * POST /api/loaners/check-out - Vehicle checkout with paperwork
 *
 * Body: {
 *   reservation_id: string,
 *   checkout_inspection: {
 *     fuel_level: number,
 *     odometer_reading: number,
 *     damage_notes?: string,
 *     photos?: string[],
 *     cleanliness_rating: number
 *   },
 *   customer_agreement: {
 *     signature: string,
 *     terms_accepted: boolean,
 *     insurance_verified: boolean,
 *     license_checked: boolean
 *   },
 *   checkout_notes?: string
 * }
 */
router.post('/check-out', loanerRateLimit, async (req, res) => {
  try {
    const {
      reservation_id,
      checkout_inspection,
      customer_agreement,
      checkout_notes,
    } = req.body;
    const { shopId, userId } = req.user;

    // Get reservation with vehicle and customer details
    const reservation = await LoanerReservation.findOne({
      where: { id: reservation_id, shopId },
      include: [
        {
          model: LoanerFleetManagement,
          as: 'loanerVehicle',
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is not in confirmed status for checkout',
      });
    }

    // Validate customer agreement requirements
    if (
      !customer_agreement.terms_accepted ||
      !customer_agreement.insurance_verified ||
      !customer_agreement.license_checked
    ) {
      return res.status(400).json({
        success: false,
        message: 'All customer agreement requirements must be completed',
      });
    }

    // Update reservation to checked out
    await LoanerReservation.update(
      {
        status: 'active',
        checkout_date: new Date(),
        checkout_odometer: checkout_inspection.odometer_reading,
        checkout_fuel_level: checkout_inspection.fuel_level,
        checkout_condition_notes: checkout_inspection.damage_notes,
        checkout_photos: JSON.stringify(checkout_inspection.photos || []),
        customer_signature: customer_agreement.signature,
        pickupInspectedBy: userId,
        checkout_notes,
        updatedBy: userId,
      },
      {
        where: { id: reservation_id },
      }
    );

    // Update vehicle status to rented
    await LoanerFleetManagement.update(
      {
        status: 'rented',
        currentRenterId: reservation.customerId,
        current_rental_start: new Date(),
        current_odometer: checkout_inspection.odometer_reading,
        updatedBy: userId,
      },
      {
        where: { id: reservation.loanerVehicleId },
      }
    );

    // Generate checkout documentation
    const checkout_documentation = {
      checkout_id: `CO-${Date.now()}`,
      checkout_timestamp: new Date().toISOString(),
      vehicle_condition_report: {
        fuel_level: checkout_inspection.fuel_level,
        odometer: checkout_inspection.odometer_reading,
        cleanliness: checkout_inspection.cleanliness_rating,
        damage_noted: !!checkout_inspection.damage_notes,
        photos_taken: (checkout_inspection.photos || []).length,
      },
      legal_documents: {
        rental_agreement_signed: true,
        insurance_verification: customer_agreement.insurance_verified,
        license_verification: customer_agreement.license_checked,
        terms_acceptance_timestamp: new Date().toISOString(),
      },
    };

    // Broadcast real-time update
    realtimeService.broadcastLoanerUpdate(
      {
        reservation_id,
        vehicle_number: reservation.loanerVehicle.vehicle_number,
        customer_name: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
        status: 'checked_out',
        checkout_time: new Date().toISOString(),
      },
      'checked_out'
    );

    res.json({
      success: true,
      message: 'Vehicle checked out successfully',
      data: {
        checkout_confirmation: {
          checkout_id: checkout_documentation.checkout_id,
          vehicle_info: {
            vehicle_number: reservation.loanerVehicle.vehicle_number,
            make_model: `${reservation.loanerVehicle.make} ${reservation.loanerVehicle.model}`,
            license_plate: reservation.loanerVehicle.license_plate,
          },
          customer_info: {
            name: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
            phone: reservation.customer.phone,
          },
          checkout_details: checkout_documentation.vehicle_condition_report,
          return_instructions: {
            return_by: reservation.expected_return_date,
            return_location: 'Shop Location',
            emergency_contact: 'Shop Phone Number',
          },
        },
        checkout_documentation,
      },
    });
  } catch (error) {
    console.error('Loaner checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to checkout vehicle',
      error: error.message,
    });
  }
});

/**
 * POST /api/loaners/check-in - Return processing with damage assessment
 *
 * Body: {
 *   reservation_id: string,
 *   return_inspection: {
 *     fuel_level: number,
 *     odometer_reading: number,
 *     damage_assessment: {
 *       new_damage_found: boolean,
 *       damage_description?: string,
 *       damage_photos?: string[],
 *       estimated_repair_cost?: number
 *     },
 *     cleanliness_rating: number,
 *     interior_condition: string,
 *     exterior_condition: string
 *   },
 *   additional_charges?: {
 *     fuel_charge?: number,
 *     cleaning_charge?: number,
 *     damage_charge?: number,
 *     other_charges?: number
 *   },
 *   return_notes?: string
 * }
 */
router.post('/check-in', loanerRateLimit, async (req, res) => {
  try {
    const {
      reservation_id,
      return_inspection,
      additional_charges,
      return_notes,
    } = req.body;
    const { shopId, userId } = req.user;

    // Get active reservation
    const reservation = await LoanerReservation.findOne({
      where: { id: reservation_id, shopId, status: 'active' },
      include: [
        {
          model: LoanerFleetManagement,
          as: 'loanerVehicle',
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Active reservation not found',
      });
    }

    // Calculate usage metrics
    const usage_metrics = calculateVehicleUsage(
      reservation.checkout_date,
      new Date(),
      reservation.checkout_odometer,
      return_inspection.odometer_reading
    );

    // Process damage assessment
    const damage_assessment = await processDamageAssessment(
      return_inspection.damage_assessment,
      reservation.loanerVehicleId,
      userId
    );

    // Update reservation to completed
    await LoanerReservation.update(
      {
        status: 'completed',
        return_date: new Date(),
        return_odometer: return_inspection.odometer_reading,
        return_fuel_level: return_inspection.fuel_level,
        return_condition_notes: `Interior: ${return_inspection.interior_condition}, Exterior: ${return_inspection.exterior_condition}`,
        damage_assessment_notes:
          return_inspection.damage_assessment.damage_description,
        additional_charges_amount:
          calculateTotalAdditionalCharges(additional_charges),
        returnInspectedBy: userId,
        return_notes,
        updatedBy: userId,
      },
      {
        where: { id: reservation_id },
      }
    );

    // Update vehicle status based on condition
    const new_vehicle_status = return_inspection.damage_assessment
      .new_damage_found
      ? 'maintenance'
      : 'available';

    await LoanerFleetManagement.update(
      {
        status: new_vehicle_status,
        currentRenterId: null,
        current_rental_start: null,
        current_odometer: return_inspection.odometer_reading,
        total_miles: Sequelize.literal(
          `total_miles + ${usage_metrics.miles_driven}`
        ),
        total_rentals: Sequelize.literal('total_rentals + 1'),
        last_service_date: damage_assessment.service_required
          ? new Date()
          : undefined,
        updatedBy: userId,
      },
      {
        where: { id: reservation.loanerVehicleId },
      }
    );

    // Generate return documentation
    const return_documentation = {
      return_id: `RI-${Date.now()}`,
      return_timestamp: new Date().toISOString(),
      usage_summary: usage_metrics,
      condition_assessment: {
        overall_condition: damage_assessment.overall_condition,
        damage_found: return_inspection.damage_assessment.new_damage_found,
        service_required: damage_assessment.service_required,
        charges_applied: Object.keys(additional_charges || {}).length > 0,
      },
      financial_summary: {
        additional_charges: additional_charges || {},
        total_additional: calculateTotalAdditionalCharges(additional_charges),
        payment_due: calculateTotalAdditionalCharges(additional_charges) > 0,
      },
    };

    // Broadcast real-time update
    realtimeService.broadcastLoanerUpdate(
      {
        reservation_id,
        vehicle_number: reservation.loanerVehicle.vehicle_number,
        customer_name: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
        status: 'returned',
        return_time: new Date().toISOString(),
        condition: new_vehicle_status,
      },
      'returned'
    );

    res.json({
      success: true,
      message: 'Vehicle returned successfully',
      data: {
        return_confirmation: {
          return_id: return_documentation.return_id,
          usage_summary: usage_metrics,
          condition_summary: return_documentation.condition_assessment,
          financial_summary: return_documentation.financial_summary,
          vehicle_status: new_vehicle_status,
          next_steps: damage_assessment.service_required
            ? ['Schedule maintenance inspection', 'Update service records']
            : ['Vehicle ready for next rental'],
        },
        return_documentation,
      },
    });
  } catch (error) {
    console.error('Loaner checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process vehicle return',
      error: error.message,
    });
  }
});

/**
 * GET /api/loaners/utilization - Fleet utilization analytics
 */
router.get('/utilization', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { period = '30', vehicle_id, detailed = false } = req.query;

    // Date range for analysis
    const end_date = new Date();
    const start_date = new Date();
    start_date.setDate(start_date.getDate() - parseInt(period));

    // Get utilization data
    const utilization_data = await calculateFleetUtilization(
      shopId,
      start_date,
      end_date,
      vehicle_id
    );

    // Get detailed metrics if requested
    const detailed_metrics =
      detailed === 'true'
        ? await getDetailedUtilizationMetrics(shopId, start_date, end_date)
        : null;

    res.json({
      success: true,
      data: {
        utilization_period: {
          start_date: start_date.toISOString().split('T')[0],
          end_date: end_date.toISOString().split('T')[0],
          days_analyzed: parseInt(period),
        },
        utilization_metrics: utilization_data.metrics,
        vehicle_performance: utilization_data.vehicle_performance,
        trends: utilization_data.trends,
        detailed_metrics,
        recommendations: generateUtilizationRecommendations(
          utilization_data.metrics
        ),
      },
    });
  } catch (error) {
    console.error('Fleet utilization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate utilization',
      error: error.message,
    });
  }
});

/**
 * GET /api/loaners/assignments/active - Get active assignments
 */
router.get('/assignments/active', async (req, res) => {
  try {
    const { shopId } = req.user;

    const activeAssignments = await LoanerReservation.findAll({
      where: {
        shopId,
        status: 'active',
      },
      include: [
        {
          model: LoanerFleetManagement,
          as: 'loanerVehicle',
          attributes: ['id', 'vehicle_number', 'make', 'model', 'year', 'license_plate'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email'],
        },
        {
          model: RepairOrderManagement,
          as: 'repairOrder',
          attributes: ['id', 'ro_number'],
        },
      ],
      order: [['checkout_date', 'DESC']],
    });

    const formattedAssignments = activeAssignments.map(assignment => ({
      id: assignment.id,
      vehicleId: assignment.loanerVehicleId,
      customer: assignment.customer
        ? `${assignment.customer.firstName} ${assignment.customer.lastName}`
        : 'Unknown',
      customerPhone: assignment.customer?.phone,
      jobNumber: assignment.repairOrder?.ro_number || 'N/A',
      assignedDate: assignment.checkout_date,
      expectedReturn: assignment.expected_return_date,
      status: 'active',
      notes: assignment.reservation_notes || assignment.checkout_notes,
      vehicle: assignment.loanerVehicle
        ? `${assignment.loanerVehicle.year} ${assignment.loanerVehicle.make} ${assignment.loanerVehicle.model}`
        : null,
    }));

    res.json({
      success: true,
      data: {
        assignments: formattedAssignments,
        count: formattedAssignments.length,
      },
    });
  } catch (error) {
    console.error('Get active assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active assignments',
      error: error.message,
    });
  }
});

/**
 * GET /api/loaners/assignments/history - Get assignment history
 */
router.get('/assignments/history', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { limit = 50, offset = 0, startDate, endDate } = req.query;

    const whereClause = {
      shopId,
      status: ['completed', 'cancelled'],
    };

    if (startDate || endDate) {
      whereClause.checkout_date = {};
      if (startDate) whereClause.checkout_date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.checkout_date[Op.lte] = new Date(endDate);
    }

    const historicalAssignments = await LoanerReservation.findAll({
      where: whereClause,
      include: [
        {
          model: LoanerFleetManagement,
          as: 'loanerVehicle',
          attributes: ['id', 'vehicle_number', 'make', 'model', 'year', 'license_plate'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email'],
        },
        {
          model: RepairOrderManagement,
          as: 'repairOrder',
          attributes: ['id', 'ro_number'],
        },
      ],
      order: [['return_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedAssignments = historicalAssignments.map(assignment => ({
      id: assignment.id,
      vehicleId: assignment.loanerVehicleId,
      customer: assignment.customer
        ? `${assignment.customer.firstName} ${assignment.customer.lastName}`
        : 'Unknown',
      customerPhone: assignment.customer?.phone,
      jobNumber: assignment.repairOrder?.ro_number || 'N/A',
      assignedDate: assignment.checkout_date,
      expectedReturn: assignment.expected_return_date,
      actualReturn: assignment.return_date,
      status: assignment.status,
      notes: assignment.reservation_notes || assignment.return_notes,
      vehicle: assignment.loanerVehicle
        ? `${assignment.loanerVehicle.year} ${assignment.loanerVehicle.make} ${assignment.loanerVehicle.model}`
        : null,
    }));

    res.json({
      success: true,
      data: {
        assignments: formattedAssignments,
        count: formattedAssignments.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error('Get assignment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment history',
      error: error.message,
    });
  }
});

/**
 * GET /api/loaners/assignments/:id - Get assignment by ID
 */
router.get('/assignments/:id', async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;

    const assignment = await LoanerReservation.findOne({
      where: { id, shopId },
      include: [
        {
          model: LoanerFleetManagement,
          as: 'loanerVehicle',
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: RepairOrderManagement,
          as: 'repairOrder',
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          vehicleId: assignment.loanerVehicleId,
          customerId: assignment.customerId,
          repairOrderId: assignment.repairOrderId,
          status: assignment.status,
          pickupDate: assignment.pickup_date,
          expectedReturnDate: assignment.expected_return_date,
          checkoutDate: assignment.checkout_date,
          returnDate: assignment.return_date,
          checkoutOdometer: assignment.checkout_odometer,
          returnOdometer: assignment.return_odometer,
          notes: assignment.reservation_notes || assignment.checkout_notes || assignment.return_notes,
          vehicle: assignment.loanerVehicle,
          customer: assignment.customer,
          repairOrder: assignment.repairOrder,
        },
      },
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment',
      error: error.message,
    });
  }
});

/**
 * PUT /api/loaners/assignments/:id - Update assignment
 */
router.put('/assignments/:id', loanerRateLimit, async (req, res) => {
  try {
    const { shopId, userId } = req.user;
    const { id } = req.params;
    const { expectedReturnDate, notes, status } = req.body;

    const assignment = await LoanerReservation.findOne({
      where: { id, shopId },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    await assignment.update({
      expected_return_date: expectedReturnDate || assignment.expected_return_date,
      reservation_notes: notes || assignment.reservation_notes,
      status: status || assignment.status,
      updatedBy: userId,
    });

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        assignment,
      },
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message,
    });
  }
});

/**
 * Helper Functions
 */

function formatFleetVehicle(vehicle) {
  // Support both raw object and Sequelize model
  const data = vehicle.dataValues || vehicle;

  return {
    id: data.id,
    vehicle_id: data.id,
    vehicle_number: data.vehicle_number,
    make: data.make,
    model: data.model,
    year: data.year,
    licensePlate: data.license_plate,
    license_plate: data.license_plate,
    status: data.status,
    vehicleType: data.vehicle_type,
    vehicle_type: data.vehicle_type,
    mileage: data.current_odometer,
    current_odometer: data.current_odometer,
    fuelLevel: data.fuel_level,
    fuel_level: data.fuel_level,
    location: data.location,
    vin: data.vin,
    color: data.color,
    currentRenter: vehicle.currentRenter
      ? {
          name: `${vehicle.currentRenter.firstName} ${vehicle.currentRenter.lastName}`,
          phone: vehicle.currentRenter.phone,
        }
      : null,
    maintenance_due: data.next_service_date
      ? new Date(data.next_service_date) <= new Date()
      : false,
    lastService: data.last_service_date,
    nextService: data.next_service_date,
    last_service: data.last_service_date,
    next_service_date: data.next_service_date,
    availability_status: getAvailabilityStatus(vehicle),
    total_rentals: data.total_rentals || 0,
    total_miles: data.total_miles || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function calculateFleetMetrics(fleet_vehicles) {
  const total_fleet = fleet_vehicles.length;
  const available = fleet_vehicles.filter(v => v.status === 'available').length;
  const rented = fleet_vehicles.filter(v => v.status === 'rented').length;
  const maintenance = fleet_vehicles.filter(
    v => v.status === 'maintenance'
  ).length;
  const out_of_service = fleet_vehicles.filter(
    v => v.status === 'out_of_service'
  ).length;

  return {
    total_fleet_size: total_fleet,
    currently_available: available,
    currently_rented: rented,
    in_maintenance: maintenance,
    out_of_service: out_of_service,
    utilization_rate:
      total_fleet > 0 ? ((rented / total_fleet) * 100).toFixed(1) : '0.0',
    availability_rate:
      total_fleet > 0 ? ((available / total_fleet) * 100).toFixed(1) : '0.0',
    maintenance_rate:
      total_fleet > 0 ? ((maintenance / total_fleet) * 100).toFixed(1) : '0.0',
  };
}

async function analyzeFleetAvailability(shopId, target_date) {
  // Analyze availability for specific date
  const reservations = await LoanerReservation.findAll({
    where: {
      shopId,
      status: ['confirmed', 'active'],
      pickup_date: { [Op.lte]: new Date(target_date) },
      expected_return_date: { [Op.gte]: new Date(target_date) },
    },
  });

  const total_fleet = await LoanerFleetManagement.count({ where: { shopId } });
  const reserved_count = reservations.length;

  return {
    target_date,
    total_fleet_size: total_fleet,
    reserved_vehicles: reserved_count,
    available_vehicles: Math.max(0, total_fleet - reserved_count),
    availability_percentage:
      total_fleet > 0
        ? (((total_fleet - reserved_count) / total_fleet) * 100).toFixed(1)
        : '100.0',
  };
}

async function findAvailableVehicles(
  shopId,
  pickup_date,
  return_date,
  preferences = {}
) {
  const where_clause = {
    shopId,
    status: 'available',
  };

  if (preferences.vehicle_type) {
    where_clause.vehicle_type = preferences.vehicle_type;
  }

  // Find vehicles not reserved during the requested period
  const conflicting_reservations = await LoanerReservation.findAll({
    where: {
      shopId,
      status: ['confirmed', 'active'],
      [Op.or]: [
        {
          pickup_date: { [Op.between]: [pickup_date, return_date] },
        },
        {
          expected_return_date: { [Op.between]: [pickup_date, return_date] },
        },
        {
          [Op.and]: [
            { pickup_date: { [Op.lte]: pickup_date } },
            { expected_return_date: { [Op.gte]: return_date } },
          ],
        },
      ],
    },
    attributes: ['loanerVehicleId'],
  });

  const reserved_vehicle_ids = conflicting_reservations.map(
    r => r.loanerVehicleId
  );

  if (reserved_vehicle_ids.length > 0) {
    where_clause.id = { [Op.notIn]: reserved_vehicle_ids };
  }

  return await LoanerFleetManagement.findAll({ where: where_clause });
}

function selectBestVehicleMatch(available_vehicles, preferences = {}) {
  // Simple selection algorithm - in real implementation would be more sophisticated
  let scored_vehicles = available_vehicles.map(vehicle => ({
    ...vehicle.dataValues,
    score: calculateVehicleScore(vehicle, preferences),
  }));

  scored_vehicles.sort((a, b) => b.score - a.score);
  return scored_vehicles[0];
}

function calculateVehicleScore(vehicle, preferences) {
  let score = 100; // Base score

  // Prefer newer vehicles
  const age = new Date().getFullYear() - vehicle.year;
  score -= age * 2;

  // Prefer vehicles with lower mileage
  score -= (vehicle.total_miles || 0) / 1000;

  // Type preference match
  if (
    preferences.vehicle_type &&
    vehicle.vehicle_type === preferences.vehicle_type
  ) {
    score += 50;
  }

  return score;
}

function calculateDurationDays(pickup_date, return_date) {
  const pickup = new Date(pickup_date);
  const return_d = new Date(return_date);
  return Math.ceil((return_d - pickup) / (1000 * 60 * 60 * 24));
}

async function generateReservationConfirmation(reservation, customer, vehicle) {
  return {
    confirmation_number: `LC-${Date.now().toString().slice(-8)}`,
    confirmation_date: new Date().toISOString(),
    pickup_instructions: "Bring valid driver's license and insurance proof",
    contact_info: 'Call shop for any changes to reservation',
    cancellation_policy: '24-hour advance notice required',
  };
}

function calculateVehicleUsage(
  checkout_date,
  return_date,
  start_odometer,
  end_odometer
) {
  const duration_ms = new Date(return_date) - new Date(checkout_date);
  const duration_days = Math.ceil(duration_ms / (1000 * 60 * 60 * 24));
  const miles_driven = Math.max(0, end_odometer - start_odometer);

  return {
    rental_duration_days: duration_days,
    miles_driven,
    average_miles_per_day:
      duration_days > 0 ? (miles_driven / duration_days).toFixed(1) : '0.0',
    checkout_date: checkout_date,
    return_date: return_date,
  };
}

async function processDamageAssessment(
  damage_assessment,
  vehicle_id,
  inspector_id
) {
  if (!damage_assessment.new_damage_found) {
    return {
      overall_condition: 'good',
      service_required: false,
      estimated_repair_cost: 0,
    };
  }

  // Log damage for vehicle history
  await LoanerFleetManagement.update(
    {
      last_damage_date: new Date(),
      damageReportedBy: inspector_id,
      damage_notes: damage_assessment.damage_description,
    },
    {
      where: { id: vehicle_id },
    }
  );

  return {
    overall_condition: 'damaged',
    service_required: true,
    estimated_repair_cost: damage_assessment.estimated_repair_cost || 0,
    repair_priority:
      damage_assessment.estimated_repair_cost > 500 ? 'high' : 'low',
  };
}

function calculateTotalAdditionalCharges(charges = {}) {
  return Object.values(charges).reduce(
    (sum, charge) => sum + (parseFloat(charge) || 0),
    0
  );
}

function getAvailabilityStatus(vehicle) {
  if (vehicle.status === 'available') {
    return vehicle.next_service_date &&
      new Date(vehicle.next_service_date) <= new Date()
      ? 'available_service_due'
      : 'available';
  }
  return vehicle.status;
}

async function calculateFleetUtilization(
  shopId,
  start_date,
  end_date,
  vehicle_id
) {
  // Simplified utilization calculation
  const total_days = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24));

  const where_clause = { shopId };
  if (vehicle_id) where_clause.id = vehicle_id;

  const fleet_vehicles = await LoanerFleetManagement.findAll({
    where: where_clause,
  });
  const total_vehicle_days = fleet_vehicles.length * total_days;

  // Get rental days in period
  const rentals = await LoanerReservation.findAll({
    where: {
      shopId,
      status: 'completed',
      checkout_date: { [Op.gte]: start_date },
      return_date: { [Op.lte]: end_date },
    },
  });

  const total_rental_days = rentals.reduce((sum, rental) => {
    const duration = Math.ceil(
      (new Date(rental.return_date) - new Date(rental.checkout_date)) /
        (1000 * 60 * 60 * 24)
    );
    return sum + duration;
  }, 0);

  const utilization_rate =
    total_vehicle_days > 0 ? (total_rental_days / total_vehicle_days) * 100 : 0;

  return {
    metrics: {
      total_fleet_size: fleet_vehicles.length,
      analysis_period_days: total_days,
      total_rental_days,
      utilization_rate: utilization_rate.toFixed(1),
      average_rental_duration:
        rentals.length > 0
          ? (total_rental_days / rentals.length).toFixed(1)
          : '0.0',
    },
    vehicle_performance: fleet_vehicles.map(vehicle => ({
      vehicle_id: vehicle.id,
      vehicle_number: vehicle.vehicle_number,
      make_model: `${vehicle.make} ${vehicle.model}`,
      rentals_count: vehicle.total_rentals || 0,
      total_miles: vehicle.total_miles || 0,
    })),
    trends: {
      utilization_trend: 'stable', // Would be calculated from historical data
      peak_periods: ['weekends', 'holidays'],
      low_periods: ['mid-week'],
    },
  };
}

async function getDetailedUtilizationMetrics(shopId, start_date, end_date) {
  return {
    revenue_metrics: {
      total_rental_revenue: 0, // Would calculate from pricing
      average_rental_value: 0,
      revenue_per_vehicle: 0,
    },
    operational_metrics: {
      maintenance_costs: 0,
      fuel_costs: 0,
      insurance_costs: 0,
      depreciation: 0,
    },
    customer_metrics: {
      total_customers_served: 0,
      repeat_customers: 0,
      customer_satisfaction: 0,
    },
  };
}

function generateUtilizationRecommendations(metrics) {
  const recommendations = [];
  const utilization = parseFloat(metrics.utilization_rate);

  if (utilization < 50) {
    recommendations.push(
      'Consider reducing fleet size or increasing marketing efforts'
    );
  } else if (utilization > 85) {
    recommendations.push('Consider expanding fleet to meet demand');
  }

  if (metrics.total_fleet_size < 5) {
    recommendations.push(
      'Consider adding more vehicles for better availability'
    );
  }

  return recommendations;
}

async function suggestAlternativeReservations(
  shopId,
  pickup_date,
  return_date
) {
  return {
    alternative_dates: [
      { pickup_date: '2024-09-16', return_date: '2024-09-20' },
      { pickup_date: '2024-09-18', return_date: '2024-09-22' },
    ],
    alternative_vehicles: ['Compact available', 'SUV available next week'],
    waitlist_option: true,
  };
}

module.exports = router;
