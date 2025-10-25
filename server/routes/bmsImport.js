/**
 * BMS Import with Automatic PO Creation
 *
 * Enhanced endpoint that:
 * 1. Imports BMS XML files
 * 2. Creates Repair Orders with parts
 * 3. Automatically creates Purchase Orders grouped by supplier
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const EnhancedBMSParser = require('../services/import/bms_parser');
const automaticPOCreationService = require('../services/automaticPOCreationService');
const supplierMappingService = require('../services/supplierMappingService');
const { RepairOrderManagement, AdvancedPartsManagement, Customer, Vehicle, ClaimManagement } = require('../database/models');

// Configure file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed'), false);
    }
  }
});

/**
 * POST /api/bms-import/upload-with-auto-po
 *
 * Upload BMS file and automatically create POs
 */
router.post('/upload-with-auto-po', upload.single('bmsFile'), async (req, res) => {
  try {
    const {shopId = '550e8400-e29b-41d4-a716-446655440000', userId = 1} = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No BMS file uploaded'
      });
    }

    console.log(`[BMS Import] Starting import with auto-PO for file: ${req.file.originalname}`);

    // Step 1: Parse BMS XML
    const bmsParser = new EnhancedBMSParser();
    const xmlContent = req.file.buffer.toString('utf-8');
    const parsedData = await bmsParser.parseBMS(xmlContent);

    console.log('[BMS Import] Parsed BMS data:', {
      customer: parsedData.customer?.name,
      vehicle: parsedData.vehicle ? `${parsedData.vehicle.year} ${parsedData.vehicle.make} ${parsedData.vehicle.model}` : null,
      partsCount: parsedData.parts?.length || 0,
      estimateTotal: parsedData.financial?.total
    });

    // Step 2: Ensure default vendors exist
    await supplierMappingService.ensureDefaultVendors(shopId);

    // Step 3: Create or find customer
    let customer = await Customer.findOne({
      where: {
        shopId,
        email: parsedData.customer?.email
      }
    });

    if (!customer && parsedData.customer) {
      customer = await Customer.create({
        shopId,
        first_name: parsedData.customer.firstName || '',
        last_name: parsedData.customer.lastName || '',
        email: parsedData.customer.email || '',
        phone: parsedData.customer.phone || '',
        address: parsedData.customer.address || '',
        city: parsedData.customer.city || '',
        state: parsedData.customer.state || '',
        zip: parsedData.customer.zip || '',
      });
      console.log('[BMS Import] Created customer:', customer.id);
    }

    // Step 4: Create or find vehicle
    let vehicle = null;
    if (parsedData.vehicle?.vin) {
      vehicle = await Vehicle.findOne({
        where: {
          shopId,
          vin: parsedData.vehicle.vin
        }
      });

      if (!vehicle) {
        vehicle = await Vehicle.create({
          shopId,
          customer_id: customer?.id,
          vin: parsedData.vehicle.vin,
          year: parsedData.vehicle.year,
          make: parsedData.vehicle.make,
          model: parsedData.vehicle.model,
          trim: parsedData.vehicle.trim || '',
          color: parsedData.vehicle.color || '',
          license_plate: parsedData.vehicle.license || '',
          current_odometer: parsedData.vehicle.mileage || 0,
        });
        console.log('[BMS Import] Created vehicle:', vehicle.id);
      }
    }

    // Step 5: Create claim (if insurance claim)
    let claim = null;
    if (parsedData.customer?.claimNumber || parsedData.estimate?.claimNumber) {
      claim = await ClaimManagement.create({
        shopId,
        customer_id: customer?.id,
        vehicle_id: vehicle?.id,
        claim_number: parsedData.customer?.claimNumber || parsedData.estimate?.claimNumber,
        insurance_company: parsedData.customer?.insurance || '',
        deductible: parsedData.financial?.deductible || 0,
        adjuster_name: parsedData.adjuster?.name || '',
        adjuster_phone: parsedData.adjuster?.phone || '',
        adjuster_email: parsedData.adjuster?.email || '',
      });
      console.log('[BMS Import] Created claim:', claim.id);
    }

    // Step 6: Create Repair Order
    const roNumber = parsedData.estimate?.roNumber || `RO-${Date.now()}`;
    const repairOrder = await RepairOrderManagement.create({
      shopId,
      ro_number: roNumber,
      customer_id: customer?.id,
      vehicle_id: vehicle?.id,
      claim_id: claim?.id,
      status: 'estimate',
      ro_type: claim ? 'insurance' : 'cash',
      total_amount: parsedData.financial?.total || 0,
      opened_at: new Date(),
      drop_off_date: new Date(),
      estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    console.log('[BMS Import] Created RO:', repairOrder.id, repairOrder.ro_number);

    // Step 7: Create Parts with Supplier Mapping
    const createdParts = [];
    if (parsedData.parts && parsedData.parts.length > 0) {
      for (const partData of parsedData.parts) {
        // Map part to vendor
        const vendor = await supplierMappingService.mapPartToVendor({
          supplierRefNum: partData.supplierRefNum,
          sourceCode: partData.sourceCode,
          partType: partData.partType
        }, shopId);

        const part = await AdvancedPartsManagement.create({
          shopId,
          repairOrderId: repairOrder.id,
          lineNumber: partData.lineNumber || 0,
          partDescription: partData.description || 'Unknown Part',
          oemPartNumber: partData.oemPartNumber || partData.partNumber,
          vendorPartNumber: partData.partNumber,
          partCategory: this.mapPartTypeToCategory(partData.partType),
          partCondition: 'new',
          brandType: partData.sourceCode === 'O' ? 'oem' : 'aftermarket',
          partStatus: 'needed',
          quantityOrdered: partData.quantity || 1,
          listPrice: partData.price?.toNumber ? partData.price.toNumber() : parseFloat(partData.price || 0),
          netPrice: partData.price?.toNumber ? partData.price.toNumber() : parseFloat(partData.price || 0),
          sellPrice: partData.price?.toNumber ? partData.price.toNumber() : parseFloat(partData.price || 0),
          vendorId: vendor?.id,
          primaryVendor: vendor?.name || partData.supplierRefNum,
          operationCode: partData.operation || '',
          vehiclePosition: partData.description,
          priority: 'normal',
        });

        createdParts.push(part);
      }

      console.log(`[BMS Import] Created ${createdParts.length} parts`);
    }

    // Step 8: Automatically Create POs
    let autoPOResult = null;
    if (createdParts.length > 0) {
      console.log('[BMS Import] Starting automatic PO creation...');
      autoPOResult = await automaticPOCreationService.createPOsForRepairOrder(
        repairOrder.id,
        shopId,
        userId
      );

      if (autoPOResult.success) {
        console.log(`[BMS Import] ✅ Created ${autoPOResult.data.posCreated} POs automatically`);
      } else {
        console.error('[BMS Import] ❌ Auto-PO creation failed:', autoPOResult.message);
      }
    }

    // Step 9: Return comprehensive result
    return res.json({
      success: true,
      message: 'BMS file imported successfully with automatic PO creation',
      data: {
        importId: uuidv4(),
        repairOrder: {
          id: repairOrder.id,
          ro_number: repairOrder.ro_number,
          status: repairOrder.status,
          total_amount: repairOrder.total_amount,
        },
        customer: customer ? {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
        } : null,
        vehicle: vehicle ? {
          id: vehicle.id,
          description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          vin: vehicle.vin,
        } : null,
        claim: claim ? {
          id: claim.id,
          claim_number: claim.claim_number,
          insurance_company: claim.insurance_company,
        } : null,
        parts: {
          total: createdParts.length,
          byStatus: this.groupPartsByStatus(createdParts),
        },
        purchaseOrders: autoPOResult?.success ? {
          created: autoPOResult.data.posCreated,
          pos: autoPOResult.data.pos
        } : {
          created: 0,
          error: autoPOResult?.message
        },
        summary: {
          customersCreated: customer ? 1 : 0,
          vehiclesCreated: vehicle ? 1 : 0,
          claimsCreated: claim ? 1 : 0,
          repairOrdersCreated: 1,
          partsCreated: createdParts.length,
          purchaseOrdersCreated: autoPOResult?.data?.posCreated || 0,
        }
      }
    });

  } catch (error) {
    console.error('[BMS Import] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'BMS import failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Helper: Map part type to category enum
 */
router.mapPartTypeToCategory = function(partType) {
  const typeMap = {
    'glass': 'glass',
    'sheet metal': 'body_panel',
    'bumper': 'body_panel',
    'lamp': 'electrical',
    'mirror': 'exterior',
    'wheel': 'mechanical',
    'paint': 'paint_materials',
    'primer': 'paint_materials',
  };

  const lower = (partType || '').toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return 'body_panel'; // Default
};

/**
 * Helper: Group parts by status
 */
router.groupPartsByStatus = function(parts) {
  return parts.reduce((acc, part) => {
    const status = part.partStatus || 'needed';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
};

module.exports = router;
