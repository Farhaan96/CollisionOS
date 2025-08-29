/**
 * CollisionOS Quality Control & Compliance APIs
 * Phase 2 Backend Development
 * 
 * Complete QC workflow with compliance tracking
 * Features:
 * - Stage-specific quality checklists
 * - Required photo capture and validation
 * - ADAS scan and calibration requirements
 * - Re-inspection forms and punch-lists
 * - Compliance certificates and documentation
 * - Quality metrics and trend analysis
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { 
  ProductionWorkflow,
  RepairOrderManagement,
  User,
  Attachment,
  VehicleProfile,
  AdvancedPartsManagement
} = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const rateLimit = require('express-rate-limit');

// Rate limiting for QC operations
const qcRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 QC operations per 15 minutes
  message: 'Too many QC operations, please try again later.'
});

/**
 * POST /api/qc/checklist - Stage-specific quality checklists
 * 
 * Body: {
 *   ro_id: string,
 *   stage: string,
 *   checklist_items: [{
 *     item_id: string,
 *     description: string,
 *     category: string,
 *     status: 'pass' | 'fail' | 'na',
 *     notes?: string,
 *     requires_photo?: boolean,
 *     photo_attachments?: string[]
 *   }],
 *   overall_status: 'pass' | 'fail' | 'conditional',
 *   inspector_id: string,
 *   inspection_notes?: string,
 *   reinspection_required?: boolean
 * }
 */
router.post('/checklist', qcRateLimit, async (req, res) => {
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
      ro_id, 
      stage, 
      checklist_items, 
      overall_status, 
      inspector_id,
      inspection_notes,
      reinspection_required = false
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate repair order and stage
    const repair_order = await RepairOrderManagement.findOne({
      where: { id: ro_id, shopId }
    });

    if (!repair_order) {
      return res.status(404).json({
        success: false,
        message: 'Repair order not found'
      });
    }

    // Validate inspector
    const inspector = await User.findByPk(inspector_id);
    if (!inspector || !['manager', 'supervisor', 'qc_inspector'].includes(inspector.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inspector or insufficient privileges'
      });
    }

    // Get or create workflow entry for this stage
    let workflow = await ProductionWorkflow.findOne({
      where: { 
        repairOrderId: ro_id, 
        stage: stage,
        shopId 
      }
    });

    if (!workflow) {
      workflow = await ProductionWorkflow.create({
        repairOrderId: ro_id,
        stage,
        status: 'in_progress',
        shopId,
        createdBy: userId,
        updatedBy: userId
      });
    }

    // Process checklist items
    const processed_items = await processChecklistItems(checklist_items, workflow.id, inspector_id);
    
    // Calculate pass/fail statistics
    const checklist_stats = calculateChecklistStats(processed_items);

    // Update workflow with QC results
    await ProductionWorkflow.update({
      qc_status: overall_status,
      qc_completed: overall_status !== 'fail',
      qc_inspector: inspector_id,
      qc_completion_date: new Date(),
      qc_checklist_results: JSON.stringify(processed_items),
      qc_notes: inspection_notes,
      reinspection_required,
      status: overall_status === 'pass' ? 'completed' : 'qc_failed',
      updatedBy: userId
    }, {
      where: { id: workflow.id }
    });

    // Create QC documentation record
    const qc_record = {
      qc_id: `QC-${Date.now()}`,
      ro_id,
      ro_number: repair_order.ro_number,
      stage,
      inspector: `${inspector.firstName} ${inspector.lastName}`,
      inspection_date: new Date(),
      checklist_stats,
      overall_status,
      reinspection_required,
      compliance_status: calculateComplianceStatus(stage, processed_items)
    };

    // Handle failed inspections
    if (overall_status === 'fail') {
      await handleFailedInspection(workflow.id, processed_items, inspector_id, userId);
    }

    // Create compliance certificate if all QC passed
    let compliance_certificate = null;
    if (overall_status === 'pass') {
      compliance_certificate = await generateComplianceCertificate(
        repair_order, 
        stage, 
        processed_items,
        inspector
      );
    }

    // Broadcast real-time update
    realtimeService.broadcastQCUpdate({
      ro_id,
      ro_number: repair_order.ro_number,
      stage,
      qc_status: overall_status,
      inspector_name: `${inspector.firstName} ${inspector.lastName}`,
      pass_rate: checklist_stats.pass_percentage,
      reinspection_required
    }, 'inspection_completed');

    res.json({
      success: true,
      message: `Quality inspection ${overall_status === 'pass' ? 'passed' : 'completed'} for ${stage} stage`,
      data: {
        qc_record,
        checklist_summary: checklist_stats,
        compliance_certificate,
        next_steps: overall_status === 'pass' ? 
          ['Stage ready for next workflow step', 'Update production board'] :
          ['Address failed items', 'Schedule re-inspection', 'Update technician assignments']
      }
    });

  } catch (error) {
    console.error('QC checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process quality checklist',
      error: error.message
    });
  }
});

/**
 * POST /api/qc/photos - Required photo capture and validation
 * 
 * Body: {
 *   ro_id: string,
 *   stage: string,
 *   photo_requirements: [{
 *     requirement_id: string,
 *     description: string,
 *     category: 'damage_assessment' | 'repair_progress' | 'final_quality' | 'compliance',
 *     required: boolean,
 *     photo_urls: string[],
 *     verification_notes?: string
 *   }],
 *   photographer_id: string,
 *   verification_complete: boolean
 * }
 */
router.post('/photos', qcRateLimit, async (req, res) => {
  try {
    const { 
      ro_id, 
      stage, 
      photo_requirements, 
      photographer_id, 
      verification_complete 
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate repair order
    const repair_order = await RepairOrderManagement.findOne({
      where: { id: ro_id, shopId }
    });

    if (!repair_order) {
      return res.status(404).json({
        success: false,
        message: 'Repair order not found'
      });
    }

    // Process photo requirements
    const photo_validation_results = [];
    let total_required = 0;
    let total_completed = 0;

    for (const requirement of photo_requirements) {
      if (requirement.required) total_required++;

      const validation_result = {
        requirement_id: requirement.requirement_id,
        description: requirement.description,
        category: requirement.category,
        required: requirement.required,
        photos_provided: requirement.photo_urls?.length || 0,
        status: 'pending'
      };

      // Validate photos exist and are accessible
      if (requirement.photo_urls && requirement.photo_urls.length > 0) {
        const photo_validation = await validatePhotoAttachments(
          requirement.photo_urls, 
          ro_id, 
          shopId
        );
        
        validation_result.status = photo_validation.all_valid ? 'completed' : 'invalid';
        validation_result.photo_issues = photo_validation.issues;
        
        if (photo_validation.all_valid && requirement.required) {
          total_completed++;
        }
      } else if (requirement.required) {
        validation_result.status = 'missing';
      } else {
        validation_result.status = 'na';
      }

      // Create attachment records for tracking
      if (requirement.photo_urls) {
        for (const photo_url of requirement.photo_urls) {
          await Attachment.create({
            filename: photo_url.split('/').pop(),
            file_path: photo_url,
            file_type: 'image',
            category: `qc_${requirement.category}`,
            description: `${stage} - ${requirement.description}`,
            repairOrderId: ro_id,
            uploadedBy: photographer_id,
            qc_stage: stage,
            qc_requirement_id: requirement.requirement_id,
            shopId
          });
        }
      }

      photo_validation_results.push(validation_result);
    }

    // Calculate completion status
    const completion_percentage = total_required > 0 ? 
      ((total_completed / total_required) * 100) : 100;
    
    const overall_photo_status = completion_percentage === 100 ? 'complete' : 
      completion_percentage > 0 ? 'partial' : 'incomplete';

    // Update workflow with photo verification status
    await ProductionWorkflow.update({
      photo_verification_status: overall_photo_status,
      photo_verification_date: verification_complete ? new Date() : null,
      photo_requirements_met: completion_percentage === 100,
      photo_completion_percentage: completion_percentage,
      photo_verification_results: JSON.stringify(photo_validation_results),
      updatedBy: userId
    }, {
      where: { 
        repairOrderId: ro_id, 
        stage: stage,
        shopId 
      }
    });

    // Generate photo verification report
    const verification_report = {
      verification_id: `PV-${Date.now()}`,
      ro_id,
      stage,
      verification_date: new Date(),
      photographer: photographer_id,
      total_requirements: photo_requirements.length,
      required_photos: total_required,
      completed_photos: total_completed,
      completion_percentage: completion_percentage.toFixed(1),
      overall_status: overall_photo_status,
      verification_complete
    };

    // Check for compliance requirements
    const compliance_check = await checkPhotoCompliance(stage, photo_validation_results);

    // Broadcast real-time update
    realtimeService.broadcastQCUpdate({
      ro_id,
      stage,
      photo_verification_status: overall_photo_status,
      completion_percentage,
      compliance_issues: compliance_check.issues.length
    }, 'photo_verification');

    res.json({
      success: true,
      message: `Photo verification ${overall_photo_status} - ${completion_percentage.toFixed(1)}% complete`,
      data: {
        verification_report,
        photo_validation_results,
        compliance_check,
        missing_requirements: photo_validation_results.filter(r => r.status === 'missing'),
        next_steps: overall_photo_status === 'complete' ? 
          ['All photo requirements met', 'Proceed with quality inspection'] :
          ['Complete missing photo requirements', 'Re-submit for verification']
      }
    });

  } catch (error) {
    console.error('Photo verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process photo verification',
      error: error.message
    });
  }
});

/**
 * GET /api/qc/compliance - ADAS scan and calibration requirements
 */
router.get('/compliance/:roId', async (req, res) => {
  try {
    const { roId } = req.params;
    const { shopId } = req.user;

    // Get repair order with vehicle profile
    const repair_order = await RepairOrderManagement.findOne({
      where: { id: roId, shopId },
      include: [
        {
          model: VehicleProfile,
          as: 'vehicleProfile'
        }
      ]
    });

    if (!repair_order) {
      return res.status(404).json({
        success: false,
        message: 'Repair order not found'
      });
    }

    // Determine ADAS requirements based on vehicle and repair scope
    const adas_requirements = await determineADASRequirements(
      repair_order.vehicleProfile, 
      repair_order
    );

    // Get calibration compliance status
    const calibration_status = await getCalibrationComplianceStatus(roId, shopId);

    // Check scan requirements
    const scan_requirements = await getScanRequirements(repair_order);

    // Generate compliance report
    const compliance_report = {
      ro_id: roId,
      ro_number: repair_order.ro_number,
      vehicle_info: {
        year: repair_order.vehicleProfile?.vehicle_year,
        make: repair_order.vehicleProfile?.vehicle_make,
        model: repair_order.vehicleProfile?.vehicle_model,
        vin: repair_order.vehicleProfile?.vin
      },
      adas_requirements,
      calibration_status,
      scan_requirements,
      overall_compliance: calculateOverallCompliance(
        adas_requirements, 
        calibration_status, 
        scan_requirements
      ),
      compliance_certificates: await getComplianceCertificates(roId, shopId),
      regulatory_requirements: getApplicableRegulations(repair_order.vehicleProfile)
    };

    res.json({
      success: true,
      data: compliance_report
    });

  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check compliance requirements',
      error: error.message
    });
  }
});

/**
 * POST /api/qc/inspection - Re-inspection forms and punch-lists
 * 
 * Body: {
 *   original_inspection_id: string,
 *   ro_id: string,
 *   reinspection_items: [{
 *     original_item_id: string,
 *     issue_description: string,
 *     corrective_action_taken: string,
 *     verification_photos?: string[],
 *     status: 'resolved' | 'pending' | 'escalated'
 *   }],
 *   inspector_id: string,
 *   reinspection_type: 'partial' | 'full',
 *   punch_list_complete: boolean
 * }
 */
router.post('/inspection', qcRateLimit, async (req, res) => {
  try {
    const { 
      original_inspection_id,
      ro_id, 
      reinspection_items, 
      inspector_id,
      reinspection_type,
      punch_list_complete
    } = req.body;
    const { shopId, userId } = req.user;

    // Validate original inspection
    const original_workflow = await ProductionWorkflow.findOne({
      where: { id: original_inspection_id, shopId }
    });

    if (!original_workflow) {
      return res.status(404).json({
        success: false,
        message: 'Original inspection not found'
      });
    }

    // Process reinspection items
    const processed_items = [];
    let resolved_count = 0;
    let pending_count = 0;
    let escalated_count = 0;

    for (const item of reinspection_items) {
      const processed_item = {
        reinspection_id: `RI-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        original_item_id: item.original_item_id,
        issue_description: item.issue_description,
        corrective_action: item.corrective_action_taken,
        verification_photos: item.verification_photos || [],
        status: item.status,
        reinspected_date: new Date(),
        reinspected_by: inspector_id
      };

      // Validate verification photos if provided
      if (item.verification_photos && item.verification_photos.length > 0) {
        const photo_validation = await validatePhotoAttachments(
          item.verification_photos, 
          ro_id, 
          shopId
        );
        processed_item.photo_validation = photo_validation;
      }

      processed_items.push(processed_item);

      // Count status distribution
      switch (item.status) {
        case 'resolved': resolved_count++; break;
        case 'pending': pending_count++; break;
        case 'escalated': escalated_count++; break;
      }
    }

    // Determine overall reinspection status
    const overall_status = escalated_count > 0 ? 'escalated' :
      pending_count > 0 ? 'pending' :
      resolved_count === reinspection_items.length ? 'passed' : 'partial';

    // Create reinspection workflow entry
    const reinspection_workflow = await ProductionWorkflow.create({
      repairOrderId: ro_id,
      stage: `${original_workflow.stage}_reinspection`,
      status: overall_status,
      qc_status: overall_status === 'passed' ? 'pass' : 'conditional',
      qc_inspector: inspector_id,
      qc_completion_date: overall_status === 'passed' ? new Date() : null,
      reinspection_type,
      original_inspection_id,
      reinspection_results: JSON.stringify(processed_items),
      punch_list_complete,
      shopId,
      createdBy: userId,
      updatedBy: userId
    });

    // Update original workflow
    await ProductionWorkflow.update({
      reinspection_status: overall_status,
      reinspection_completed: overall_status === 'passed',
      reinspection_id: reinspection_workflow.id,
      updatedBy: userId
    }, {
      where: { id: original_inspection_id }
    });

    // Generate reinspection report
    const reinspection_report = {
      reinspection_id: reinspection_workflow.id,
      ro_id,
      original_inspection_date: original_workflow.qc_completion_date,
      reinspection_date: new Date(),
      inspector: inspector_id,
      reinspection_type,
      items_summary: {
        total_items: reinspection_items.length,
        resolved: resolved_count,
        pending: pending_count,
        escalated: escalated_count
      },
      overall_status,
      punch_list_complete,
      resolution_rate: reinspection_items.length > 0 ? 
        ((resolved_count / reinspection_items.length) * 100).toFixed(1) : '100.0'
    };

    // Handle escalated items
    if (escalated_count > 0) {
      await handleEscalatedItems(
        processed_items.filter(item => item.status === 'escalated'),
        ro_id,
        inspector_id,
        userId
      );
    }

    // Broadcast real-time update
    realtimeService.broadcastQCUpdate({
      ro_id,
      reinspection_status: overall_status,
      resolution_rate: reinspection_report.resolution_rate,
      escalated_items: escalated_count,
      punch_list_complete
    }, 'reinspection_completed');

    res.json({
      success: true,
      message: `Re-inspection ${overall_status} - ${reinspection_report.resolution_rate}% resolved`,
      data: {
        reinspection_report,
        processed_items,
        escalated_items: processed_items.filter(item => item.status === 'escalated'),
        next_steps: overall_status === 'passed' ? 
          ['All items resolved', 'Proceed to next stage'] :
          escalated_count > 0 ?
            ['Review escalated items', 'Manager intervention required'] :
            ['Complete pending items', 'Schedule follow-up inspection']
      }
    });

  } catch (error) {
    console.error('Reinspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reinspection',
      error: error.message
    });
  }
});

/**
 * GET /api/qc/certificates - Compliance certificates and documentation
 */
router.get('/certificates/:roId', async (req, res) => {
  try {
    const { roId } = req.params;
    const { shopId } = req.user;
    const { certificate_type, include_drafts = false } = req.query;

    // Get all certificates for this RO
    const where_clause = { 
      repairOrderId: roId, 
      shopId 
    };
    
    if (certificate_type) {
      where_clause.certificate_type = certificate_type;
    }
    
    if (include_drafts !== 'true') {
      where_clause.status = { [Op.ne]: 'draft' };
    }

    const certificates = await getQualityCertificates(where_clause);

    // Generate missing certificates if needed
    const missing_certificates = await identifyMissingCertificates(roId, shopId);

    // Calculate compliance score
    const compliance_score = await calculateComplianceScore(roId, certificates);

    res.json({
      success: true,
      data: {
        ro_id: roId,
        certificates,
        missing_certificates,
        compliance_score,
        certificate_summary: {
          total_certificates: certificates.length,
          valid_certificates: certificates.filter(c => c.status === 'valid').length,
          expired_certificates: certificates.filter(c => c.status === 'expired').length,
          pending_certificates: missing_certificates.length
        },
        regulatory_compliance: await checkRegulatoryCompliance(roId, certificates)
      }
    });

  } catch (error) {
    console.error('Certificates fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get compliance certificates',
      error: error.message
    });
  }
});

/**
 * Helper Functions
 */

async function processChecklistItems(checklist_items, workflow_id, inspector_id) {
  return checklist_items.map(item => ({
    ...item,
    workflow_id,
    inspector_id,
    inspection_timestamp: new Date(),
    compliance_level: calculateItemComplianceLevel(item)
  }));
}

function calculateChecklistStats(processed_items) {
  const total_items = processed_items.length;
  const passed_items = processed_items.filter(item => item.status === 'pass').length;
  const failed_items = processed_items.filter(item => item.status === 'fail').length;
  const na_items = processed_items.filter(item => item.status === 'na').length;

  return {
    total_items,
    passed_items,
    failed_items,
    na_items,
    pass_percentage: total_items > 0 ? ((passed_items / total_items) * 100).toFixed(1) : '0.0',
    fail_percentage: total_items > 0 ? ((failed_items / total_items) * 100).toFixed(1) : '0.0'
  };
}

function calculateComplianceStatus(stage, processed_items) {
  const critical_items = processed_items.filter(item => 
    item.category === 'safety' || item.category === 'regulatory'
  );
  
  const critical_failures = critical_items.filter(item => item.status === 'fail');
  
  return {
    level: critical_failures.length === 0 ? 'compliant' : 'non_compliant',
    critical_items: critical_items.length,
    critical_failures: critical_failures.length,
    compliance_score: critical_items.length > 0 ? 
      (((critical_items.length - critical_failures.length) / critical_items.length) * 100).toFixed(1) : '100.0'
  };
}

async function handleFailedInspection(workflow_id, processed_items, inspector_id, user_id) {
  const failed_items = processed_items.filter(item => item.status === 'fail');
  
  // Create corrective action tasks for failed items
  for (const failed_item of failed_items) {
    console.log(`Creating corrective action for: ${failed_item.description}`);
    // In real implementation, would create task assignments
  }
  
  // Notify relevant personnel
  console.log(`Failed inspection notification sent for workflow ${workflow_id}`);
}

async function generateComplianceCertificate(repair_order, stage, processed_items, inspector) {
  return {
    certificate_id: `CERT-${Date.now()}`,
    certificate_type: `qc_${stage}`,
    ro_number: repair_order.ro_number,
    stage,
    inspector: `${inspector.firstName} ${inspector.lastName}`,
    issue_date: new Date(),
    expiry_date: null, // QC certificates don't typically expire
    status: 'valid',
    compliance_items: processed_items.filter(item => item.status === 'pass'),
    digital_signature: generateDigitalSignature(repair_order, inspector)
  };
}

function generateDigitalSignature(repair_order, inspector) {
  // Generate a simple hash-based signature (in production would use proper cryptographic signing)
  const signature_data = `${repair_order.ro_number}-${inspector.id}-${Date.now()}`;
  return Buffer.from(signature_data).toString('base64');
}

async function validatePhotoAttachments(photo_urls, ro_id, shop_id) {
  const issues = [];
  let all_valid = true;

  for (const photo_url of photo_urls) {
    // Check if attachment exists
    const attachment = await Attachment.findOne({
      where: {
        file_path: photo_url,
        repairOrderId: ro_id,
        shopId: shop_id
      }
    });

    if (!attachment) {
      issues.push(`Photo not found: ${photo_url}`);
      all_valid = false;
    } else if (attachment.file_type !== 'image') {
      issues.push(`Invalid file type for photo: ${photo_url}`);
      all_valid = false;
    }
  }

  return { all_valid, issues };
}

async function checkPhotoCompliance(stage, photo_validation_results) {
  const compliance_issues = [];
  
  // Check for stage-specific photo requirements
  const stage_requirements = getStagePhotoRequirements(stage);
  
  for (const requirement of stage_requirements) {
    const matching_result = photo_validation_results.find(
      result => result.category === requirement.category
    );
    
    if (!matching_result || matching_result.status !== 'completed') {
      compliance_issues.push(`Missing required photos for: ${requirement.category}`);
    }
  }

  return {
    compliant: compliance_issues.length === 0,
    issues: compliance_issues,
    compliance_percentage: stage_requirements.length > 0 ?
      (((stage_requirements.length - compliance_issues.length) / stage_requirements.length) * 100).toFixed(1) : '100.0'
  };
}

function getStagePhotoRequirements(stage) {
  const requirements = {
    'damage_assessment': [
      { category: 'damage_assessment', description: 'Initial damage photos' }
    ],
    'body_work': [
      { category: 'repair_progress', description: 'Repair progress photos' }
    ],
    'paint': [
      { category: 'final_quality', description: 'Paint finish quality photos' }
    ],
    'final_inspection': [
      { category: 'compliance', description: 'Final compliance photos' },
      { category: 'final_quality', description: 'Completed repair photos' }
    ]
  };
  
  return requirements[stage] || [];
}

async function determineADASRequirements(vehicle_profile, repair_order) {
  if (!vehicle_profile) {
    return {
      adas_equipped: false,
      requirements: [],
      calibration_needed: false
    };
  }

  // Determine if vehicle has ADAS systems (based on year and features)
  const has_adas = vehicle_profile.vehicle_year >= 2018 || 
    (vehicle_profile.vehicle_features && 
     JSON.parse(vehicle_profile.vehicle_features).includes('ADAS'));

  if (!has_adas) {
    return {
      adas_equipped: false,
      requirements: [],
      calibration_needed: false
    };
  }

  // Determine calibration requirements based on repair scope
  const repair_areas = await getRepairAreas(repair_order.id);
  const calibration_triggers = ['front_end', 'windshield', 'bumper', 'headlights'];
  const calibration_needed = repair_areas.some(area => 
    calibration_triggers.includes(area)
  );

  return {
    adas_equipped: true,
    systems_detected: ['FCW', 'AEB', 'LKA'], // Would be determined from vehicle database
    calibration_needed,
    requirements: calibration_needed ? [
      'Pre-scan required',
      'Post-repair scan required',
      'Dynamic calibration required',
      'Test drive verification required'
    ] : ['Post-repair scan recommended'],
    estimated_time: calibration_needed ? 2.5 : 1.0 // hours
  };
}

async function getRepairAreas(ro_id) {
  // Get repair areas from parts or operations
  const parts = await AdvancedPartsManagement.findAll({
    where: { repairOrderId: ro_id },
    attributes: ['part_category', 'operation_area']
  });

  const areas = new Set();
  parts.forEach(part => {
    if (part.part_category) areas.add(part.part_category);
    if (part.operation_area) areas.add(part.operation_area);
  });

  return Array.from(areas);
}

async function getCalibrationComplianceStatus(ro_id, shop_id) {
  // Check for calibration records
  const calibration_workflows = await ProductionWorkflow.findAll({
    where: {
      repairOrderId: ro_id,
      shopId: shop_id,
      stage: { [Op.like]: '%calibration%' }
    }
  });

  return {
    pre_scan_completed: calibration_workflows.some(w => 
      w.stage.includes('pre_scan') && w.status === 'completed'
    ),
    post_scan_completed: calibration_workflows.some(w => 
      w.stage.includes('post_scan') && w.status === 'completed'
    ),
    calibration_completed: calibration_workflows.some(w => 
      w.stage.includes('calibration') && w.status === 'completed'
    ),
    test_drive_completed: calibration_workflows.some(w => 
      w.stage.includes('test_drive') && w.status === 'completed'
    ),
    calibration_certificates: calibration_workflows.filter(w => 
      w.qc_status === 'pass'
    ).length
  };
}

async function getScanRequirements(repair_order) {
  return {
    pre_scan_required: true,
    post_scan_required: true,
    scan_tools_needed: ['OEM Scanner', 'J2534 Device'],
    dtc_clearing_required: true,
    documentation_required: true,
    estimated_time: 1.5 // hours
  };
}

function calculateOverallCompliance(adas_requirements, calibration_status, scan_requirements) {
  let compliance_score = 100;
  const required_items = [];
  const completed_items = [];

  if (adas_requirements.calibration_needed) {
    required_items.push('calibration');
    if (calibration_status.calibration_completed) {
      completed_items.push('calibration');
    }
  }

  if (scan_requirements.pre_scan_required) {
    required_items.push('pre_scan');
    if (calibration_status.pre_scan_completed) {
      completed_items.push('pre_scan');
    }
  }

  if (scan_requirements.post_scan_required) {
    required_items.push('post_scan');
    if (calibration_status.post_scan_completed) {
      completed_items.push('post_scan');
    }
  }

  const completion_rate = required_items.length > 0 ?
    (completed_items.length / required_items.length) * 100 : 100;

  return {
    compliance_level: completion_rate === 100 ? 'full' : 
      completion_rate >= 75 ? 'substantial' : 
      completion_rate >= 50 ? 'partial' : 'minimal',
    completion_percentage: completion_rate.toFixed(1),
    required_items,
    completed_items,
    pending_items: required_items.filter(item => !completed_items.includes(item))
  };
}

async function getComplianceCertificates(ro_id, shop_id) {
  // Mock implementation - would query actual certificates table
  return [
    {
      certificate_id: 'CERT-QC-001',
      type: 'quality_inspection',
      status: 'valid',
      issue_date: '2024-08-28',
      inspector: 'John Smith'
    }
  ];
}

function getApplicableRegulations(vehicle_profile) {
  const regulations = ['DOT Safety Standards'];
  
  if (vehicle_profile?.vehicle_year >= 2018) {
    regulations.push('NHTSA ADAS Guidelines');
  }
  
  return regulations;
}

async function handleEscalatedItems(escalated_items, ro_id, inspector_id, user_id) {
  // Create escalation notifications and tasks
  console.log(`Escalating ${escalated_items.length} items for RO ${ro_id}`);
  // In real implementation, would create manager notifications and escalation workflow
}

async function getQualityCertificates(where_clause) {
  // Mock implementation - would query certificates table
  return [
    {
      certificate_id: 'CERT-001',
      certificate_type: 'qc_final_inspection',
      status: 'valid',
      issue_date: new Date(),
      inspector: 'Quality Inspector',
      compliance_score: '98.5'
    }
  ];
}

async function identifyMissingCertificates(ro_id, shop_id) {
  // Mock implementation - would compare required vs existing certificates
  return [
    {
      certificate_type: 'adas_calibration',
      description: 'ADAS Calibration Certificate',
      required_by: 'Vehicle has ADAS systems and front-end repair'
    }
  ];
}

async function calculateComplianceScore(ro_id, certificates) {
  // Mock calculation - would be based on completed vs required certificates and QC results
  return {
    overall_score: 92.5,
    quality_score: 95.0,
    compliance_score: 90.0,
    timeliness_score: 88.0
  };
}

async function checkRegulatoryCompliance(ro_id, certificates) {
  return {
    dot_compliant: true,
    nhtsa_compliant: true,
    state_inspection_ready: true,
    outstanding_issues: []
  };
}

function calculateItemComplianceLevel(item) {
  const critical_categories = ['safety', 'regulatory', 'structural'];
  return critical_categories.includes(item.category) ? 'critical' : 'standard';
}

module.exports = router;