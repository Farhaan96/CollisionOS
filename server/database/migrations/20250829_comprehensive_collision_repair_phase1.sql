-- =====================================================================
-- CollisionOS Phase 1 Comprehensive Collision Repair Database Migration
-- Enterprise-Grade Collision Repair Management Schema
-- Compatible with CCC ONE/Mitchell Level Functionality
-- =====================================================================

-- Create Contact Timeline Table
CREATE TABLE IF NOT EXISTS contact_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  jobId INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  userId INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Communication Details
  contactType TEXT CHECK(contactType IN ('inbound', 'outbound', 'system_generated')) DEFAULT 'outbound',
  communicationMethod TEXT CHECK(communicationMethod IN ('call', 'text', 'email', 'in_person', 'portal', 'fax', 'letter')) NOT NULL,
  direction TEXT CHECK(direction IN ('incoming', 'outgoing')) NOT NULL,
  status TEXT CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'bounced', 'no_answer', 'busy', 'completed')) DEFAULT 'pending',
  
  -- Contact Content
  subject TEXT,
  message TEXT,
  notes TEXT,
  
  -- Contact Information
  contactName TEXT,
  contactPhone TEXT,
  contactEmail TEXT,
  
  -- Timing Information
  scheduledAt DATETIME,
  attemptedAt DATETIME,
  completedAt DATETIME,
  durationSeconds INTEGER,
  
  -- Follow-up Management
  requiresFollowup BOOLEAN DEFAULT 0,
  followupDate DATETIME,
  followupReason TEXT,
  followupCompleted BOOLEAN DEFAULT 0,
  
  -- Contact Preferences Compliance
  respectedQuietHours BOOLEAN DEFAULT 1,
  customerLanguage TEXT,
  consentVerified BOOLEAN DEFAULT 1,
  
  -- Engagement Tracking
  opened BOOLEAN DEFAULT 0,
  openedAt DATETIME,
  clicked BOOLEAN DEFAULT 0,
  clickedAt DATETIME,
  responded BOOLEAN DEFAULT 0,
  respondedAt DATETIME,
  customerResponse TEXT,
  
  -- Campaign/Template Tracking
  templateId INTEGER REFERENCES communication_templates(id),
  campaignId TEXT,
  automationTriggerId TEXT,
  
  -- System Integration
  externalSystemId TEXT,
  externalSystemResponse TEXT,
  cost DECIMAL(10,4),
  
  -- Priority and Importance
  priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  importance TEXT CHECK(importance IN ('informational', 'business_critical', 'customer_satisfaction', 'payment_related')) DEFAULT 'informational',
  
  -- Error Handling
  errorCode TEXT,
  errorMessage TEXT,
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 3,
  
  -- Metadata
  sourceChannel TEXT,
  tags TEXT,
  attachmentCount INTEGER DEFAULT 0,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Vehicle Profiles Table  
CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Core Vehicle Identification
  vin TEXT,
  licensePlate TEXT,
  plateProvince TEXT,
  plateCountry TEXT DEFAULT 'CAN',
  
  -- Year/Make/Model/Trim (YMMT)
  year INTEGER NOT NULL CHECK(year >= 1900 AND year <= 2050),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  submodel TEXT,
  
  -- Vehicle Specifications
  bodyStyle TEXT,
  doors INTEGER CHECK(doors >= 2 AND doors <= 6),
  engineSize TEXT,
  fuelType TEXT CHECK(fuelType IN ('gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid', 'hydrogen', 'other')),
  transmission TEXT CHECK(transmission IN ('manual', 'automatic', 'cvt', 'dual_clutch')),
  drivetrain TEXT CHECK(drivetrain IN ('fwd', 'rwd', 'awd', '4wd')),
  
  -- Color and Paint Information
  exteriorColor TEXT,
  interiorColor TEXT,
  paintCode TEXT,
  paintType TEXT CHECK(paintType IN ('solid', 'metallic', 'pearl', 'matte', 'tri_coat', 'multi_stage')),
  hasCustomPaint BOOLEAN DEFAULT 0,
  customPaintDetails TEXT,
  
  -- Odometer Tracking
  currentOdometer INTEGER,
  odometerUnit TEXT CHECK(odometerUnit IN ('miles', 'kilometers')) DEFAULT 'kilometers',
  lastOdometerUpdate DATETIME,
  odometerSource TEXT,
  
  -- Vehicle Options and Equipment
  hasAirbags BOOLEAN DEFAULT 1,
  airbagCount INTEGER,
  hasABS BOOLEAN DEFAULT 1,
  hasTractionControl BOOLEAN DEFAULT 0,
  hasStabilityControl BOOLEAN DEFAULT 0,
  hasADASFeatures BOOLEAN DEFAULT 0,
  adasFeatures TEXT,
  requiresCalibration BOOLEAN DEFAULT 0,
  
  -- Special Vehicle Classifications
  isLuxuryVehicle BOOLEAN DEFAULT 0,
  isExoticVehicle BOOLEAN DEFAULT 0,
  isClassicVehicle BOOLEAN DEFAULT 0,
  isCommercialVehicle BOOLEAN DEFAULT 0,
  isFleetVehicle BOOLEAN DEFAULT 0,
  fleetName TEXT,
  fleetNumber TEXT,
  
  -- Construction and Materials
  frameType TEXT CHECK(frameType IN ('unibody', 'body_on_frame', 'space_frame', 'monocoque')),
  bodyMaterial TEXT CHECK(bodyMaterial IN ('steel', 'aluminum', 'carbon_fiber', 'fiberglass', 'mixed')),
  hasAluminumPanels BOOLEAN DEFAULT 0,
  aluminumPanelDetails TEXT,
  requiresSpecialHandling BOOLEAN DEFAULT 0,
  specialHandlingNotes TEXT,
  
  -- Glass Information
  hasRainSensor BOOLEAN DEFAULT 0,
  hasHeatedWindshield BOOLEAN DEFAULT 0,
  hasLaneKeepingCamera BOOLEAN DEFAULT 0,
  windshieldType TEXT CHECK(windshieldType IN ('standard', 'acoustic', 'solar', 'heads_up_display')),
  
  -- Market and Valuation
  msrpWhenNew DECIMAL(12,2),
  currentMarketValue DECIMAL(12,2),
  valuationSource TEXT,
  valuationDate DATE,
  
  -- Key Information
  keyType TEXT CHECK(keyType IN ('traditional', 'transponder', 'smart_key', 'proximity', 'push_button')),
  keyCount INTEGER DEFAULT 1,
  hasValet BOOLEAN DEFAULT 0,
  keyNotes TEXT,
  
  -- Condition and History
  overallCondition TEXT CHECK(overallCondition IN ('excellent', 'very_good', 'good', 'fair', 'poor')),
  priorDamageReported BOOLEAN DEFAULT 0,
  hasFloodDamage BOOLEAN DEFAULT 0,
  hasFireDamage BOOLEAN DEFAULT 0,
  hasSalvageTitle BOOLEAN DEFAULT 0,
  titleStatus TEXT CHECK(titleStatus IN ('clean', 'salvage', 'rebuilt', 'lemon', 'flood', 'hail', 'manufacturer_buyback')) DEFAULT 'clean',
  
  -- Owner Information
  ownerType TEXT CHECK(ownerType IN ('individual', 'business', 'fleet', 'rental', 'lease', 'government')),
  isLeased BOOLEAN DEFAULT 0,
  leasingCompany TEXT,
  lienholderName TEXT,
  lienholderAddress TEXT,
  
  -- Storage and Location
  storageLocation TEXT,
  storageDate DATE,
  storageFeeDaily DECIMAL(8,2),
  storageChargesApply BOOLEAN DEFAULT 0,
  
  -- Photos and Documentation
  photosTaken BOOLEAN DEFAULT 0,
  photoCount INTEGER DEFAULT 0,
  hasPreRepairPhotos BOOLEAN DEFAULT 0,
  hasDamageMapping BOOLEAN DEFAULT 0,
  
  -- Status and Workflow
  vehicleStatus TEXT CHECK(vehicleStatus IN ('active', 'completed', 'archived', 'transferred', 'total_loss')) DEFAULT 'active',
  lastInspectionDate DATE,
  nextInspectionDue DATE,
  
  -- Notes and Comments
  vehicleNotes TEXT,
  customerVehicleComments TEXT,
  internalNotes TEXT,
  
  -- VIN Decode Information
  vinDecoded BOOLEAN DEFAULT 0,
  vinDecodeDate DATE,
  vinDecodeSource TEXT,
  vinDecodeData TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Claim Management Table
CREATE TABLE IF NOT EXISTS claim_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicleProfileId INTEGER NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  insuranceCompanyId INTEGER REFERENCES insurance_companies(id),
  
  -- Core Claim Information
  claimNumber TEXT NOT NULL UNIQUE,
  policyNumber TEXT,
  policyType TEXT CHECK(policyType IN ('comprehensive', 'collision', 'liability', 'uninsured_motorist', 'pip', 'other')),
  
  -- Claim Dates
  dateOfLoss DATE,
  dateReported DATE,
  dateClaimOpened DATE,
  
  -- Adjuster Information
  adjusterName TEXT,
  adjusterPhone TEXT,
  adjusterEmail TEXT,
  adjusterExtension TEXT,
  adjusterFax TEXT,
  
  -- Secondary Adjuster
  secondaryAdjusterName TEXT,
  secondaryAdjusterPhone TEXT,
  secondaryAdjusterEmail TEXT,
  
  -- Claim Status and Processing
  claimStatus TEXT CHECK(claimStatus IN ('pending', 'open', 'under_review', 'approved', 'denied', 'closed', 'subrogation', 'litigation')) DEFAULT 'pending',
  statusUpdateDate DATE,
  statusNotes TEXT,
  
  -- Deductible Information
  deductibleAmount DECIMAL(10,2),
  deductiblePaid BOOLEAN DEFAULT 0,
  deductiblePaidDate DATE,
  deductiblePaidBy TEXT CHECK(deductiblePaidBy IN ('customer', 'insurance', 'shop', 'waived', 'pending')),
  deductibleWaived BOOLEAN DEFAULT 0,
  deductibleWaivedReason TEXT,
  
  -- Coverage Information
  coverageType TEXT,
  policyLimit DECIMAL(12,2),
  coverageDetails TEXT,
  
  -- Loss Information
  lossDescription TEXT,
  lossLocation TEXT,
  lossType TEXT CHECK(lossType IN ('collision', 'comprehensive', 'vandalism', 'theft', 'weather', 'fire', 'flood', 'animal', 'other')),
  atFaultParty TEXT CHECK(atFaultParty IN ('insured', 'third_party', 'unknown', 'disputed', 'shared')),
  liabilityPercentage INTEGER CHECK(liabilityPercentage >= 0 AND liabilityPercentage <= 100),
  
  -- Third Party Information
  thirdPartyInvolved BOOLEAN DEFAULT 0,
  thirdPartyInsurer TEXT,
  thirdPartyClaimNumber TEXT,
  thirdPartyAdjuster TEXT,
  thirdPartyPhone TEXT,
  
  -- Police Report Information
  policeReportFiled BOOLEAN DEFAULT 0,
  policeReportNumber TEXT,
  policeDepartment TEXT,
  officerName TEXT,
  officerBadgeNumber TEXT,
  
  -- Injury Information
  injuriesClaimed BOOLEAN DEFAULT 0,
  injuryDescription TEXT,
  medicalTreatmentSought BOOLEAN DEFAULT 0,
  hospitalName TEXT,
  
  -- Program Participation
  isDRPClaim BOOLEAN DEFAULT 0,
  drpProgram TEXT,
  programCode TEXT,
  programDiscount DECIMAL(5,2),
  
  -- ATS Information
  atsEligible BOOLEAN DEFAULT 0,
  atsAllowanceAmount DECIMAL(10,2),
  atsStartDate DATE,
  atsEndDate DATE,
  atsDaysApproved INTEGER,
  atsDaysUsed INTEGER DEFAULT 0,
  atsProvider TEXT,
  atsNotes TEXT,
  
  -- Financial Information
  estimatedDamage DECIMAL(12,2),
  reserveAmount DECIMAL(12,2),
  totalPayout DECIMAL(12,2),
  salvageValue DECIMAL(12,2),
  totalLoss BOOLEAN DEFAULT 0,
  totalLossDate DATE,
  totalLossThreshold DECIMAL(5,2),
  
  -- Supplement Information
  supplementsAllowed BOOLEAN DEFAULT 1,
  supplementCount INTEGER DEFAULT 0,
  supplementTotal DECIMAL(12,2) DEFAULT 0.00,
  lastSupplementDate DATE,
  
  -- Documentation and Compliance
  documentsRequired TEXT,
  documentsReceived TEXT,
  missingDocuments TEXT,
  
  -- Special Handling
  requiresSpecialHandling BOOLEAN DEFAULT 0,
  specialHandlingReason TEXT,
  flaggedForReview BOOLEAN DEFAULT 0,
  reviewReason TEXT,
  reviewedBy INTEGER REFERENCES users(id),
  reviewedAt DATE,
  
  -- Subrogation Information
  subrogationPotential BOOLEAN DEFAULT 0,
  subrogationAmount DECIMAL(12,2),
  subrogationStatus TEXT CHECK(subrogationStatus IN ('none', 'potential', 'initiated', 'in_progress', 'recovered', 'closed')) DEFAULT 'none',
  subrogationNotes TEXT,
  
  -- Legal Information
  attorneyInvolved BOOLEAN DEFAULT 0,
  attorneyName TEXT,
  attorneyPhone TEXT,
  attorneyEmail TEXT,
  litigationStatus TEXT CHECK(litigationStatus IN ('none', 'threatened', 'filed', 'settled', 'dismissed')) DEFAULT 'none',
  
  -- Communication Preferences
  preferredContactMethod TEXT CHECK(preferredContactMethod IN ('phone', 'email', 'mail', 'text', 'portal')) DEFAULT 'phone',
  communicationNotes TEXT,
  
  -- Internal Notes
  claimNotes TEXT,
  internalNotes TEXT,
  adjustmentNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Repair Order Management Table
CREATE TABLE IF NOT EXISTS repair_order_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicleProfileId INTEGER NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  claimManagementId INTEGER NOT NULL REFERENCES claim_management(id) ON DELETE CASCADE,
  estimateId INTEGER REFERENCES estimates(id),
  
  -- RO Identification
  repairOrderNumber TEXT NOT NULL UNIQUE,
  internalReferenceNumber TEXT,
  
  -- RO Status and Workflow
  roStatus TEXT CHECK(roStatus IN ('draft', 'estimate_pending', 'estimate_approved', 'parts_ordered', 'parts_hold', 'in_production', 'quality_control', 'supplement_pending', 'supplement_approved', 'customer_approval', 'ready_for_delivery', 'completed', 'delivered', 'invoiced', 'paid', 'archived', 'cancelled')) DEFAULT 'draft',
  previousStatus TEXT,
  statusChangeDate DATE,
  statusChangeReason TEXT,
  statusChangedBy INTEGER REFERENCES users(id),
  
  -- Important Dates
  dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
  dateEstimateApproved DATE,
  datePartsOrdered DATE,
  dateProductionStarted DATE,
  dateQCCompleted DATE,
  promisedDeliveryDate DATE,
  actualDeliveryDate DATE,
  
  -- Hold Management
  isOnHold BOOLEAN DEFAULT 0,
  holdStartDate DATE,
  holdEndDate DATE,
  holdReason TEXT CHECK(holdReason IN ('parts_delay', 'insurance_approval', 'customer_approval', 'supplement_review', 'sublet_delay', 'technician_unavailable', 'equipment_down', 'material_shortage', 'quality_issue', 'customer_request', 'payment_issue', 'other')),
  holdDescription TEXT,
  holdDays INTEGER DEFAULT 0,
  
  -- SLA Management
  slaType TEXT CHECK(slaType IN ('standard', 'priority', 'express', 'fleet', 'insurance_sla')) DEFAULT 'standard',
  targetCompletionDays INTEGER,
  isOverdue BOOLEAN DEFAULT 0,
  overdueBy INTEGER DEFAULT 0,
  slaRiskLevel TEXT CHECK(slaRiskLevel IN ('green', 'yellow', 'red', 'critical')) DEFAULT 'green',
  
  -- Status Badges and Flags
  isRush BOOLEAN DEFAULT 0,
  isPriority BOOLEAN DEFAULT 0,
  requiresSpecialHandling BOOLEAN DEFAULT 0,
  hasComplications BOOLEAN DEFAULT 0,
  complicationDetails TEXT,
  
  -- Assignment and Responsibility
  primaryTechnician INTEGER REFERENCES users(id),
  assignedEstimator INTEGER REFERENCES users(id),
  assignedSalesRep INTEGER REFERENCES users(id),
  qcInspector INTEGER REFERENCES users(id),
  
  -- Financial Summary
  estimatedTotal DECIMAL(12,2) DEFAULT 0.00,
  approvedTotal DECIMAL(12,2) DEFAULT 0.00,
  invoicedTotal DECIMAL(12,2) DEFAULT 0.00,
  paidAmount DECIMAL(12,2) DEFAULT 0.00,
  balanceDue DECIMAL(12,2) DEFAULT 0.00,
  
  -- Tax Breakdown
  partsCost DECIMAL(12,2) DEFAULT 0.00,
  laborCost DECIMAL(12,2) DEFAULT 0.00,
  materialsCost DECIMAL(12,2) DEFAULT 0.00,
  subletCost DECIMAL(12,2) DEFAULT 0.00,
  taxableAmount DECIMAL(12,2) DEFAULT 0.00,
  pstAmount DECIMAL(10,2) DEFAULT 0.00,
  gstAmount DECIMAL(10,2) DEFAULT 0.00,
  hstAmount DECIMAL(10,2) DEFAULT 0.00,
  totalTaxes DECIMAL(10,2) DEFAULT 0.00,
  
  -- Customer Payment Information
  customerPortionDue DECIMAL(12,2) DEFAULT 0.00,
  insurancePortionDue DECIMAL(12,2) DEFAULT 0.00,
  deductibleAmount DECIMAL(10,2) DEFAULT 0.00,
  deductibleCollected BOOLEAN DEFAULT 0,
  
  -- Supplement Tracking
  supplementCount INTEGER DEFAULT 0,
  totalSupplementAmount DECIMAL(12,2) DEFAULT 0.00,
  lastSupplementDate DATE,
  supplementsPending BOOLEAN DEFAULT 0,
  
  -- Parts Status
  partsOrderedCount INTEGER DEFAULT 0,
  partsReceivedCount INTEGER DEFAULT 0,
  partsPendingCount INTEGER DEFAULT 0,
  partsBackorderedCount INTEGER DEFAULT 0,
  allPartsReceived BOOLEAN DEFAULT 0,
  nextPartExpectedDate DATE,
  
  -- Production Tracking
  productionStage TEXT,
  productionPercentComplete INTEGER DEFAULT 0 CHECK(productionPercentComplete >= 0 AND productionPercentComplete <= 100),
  hoursEstimated DECIMAL(8,2) DEFAULT 0.00,
  hoursActual DECIMAL(8,2) DEFAULT 0.00,
  efficiencyRatio DECIMAL(5,2),
  
  -- Quality Control
  qcRequired BOOLEAN DEFAULT 1,
  qcCompleted BOOLEAN DEFAULT 0,
  qcDate DATE,
  qcPassed BOOLEAN DEFAULT 0,
  qcNotes TEXT,
  requiresRework BOOLEAN DEFAULT 0,
  reworkReason TEXT,
  
  -- Customer Communication
  lastCustomerContact DATE,
  nextScheduledContact DATE,
  customerSatisfactionScore INTEGER CHECK(customerSatisfactionScore >= 1 AND customerSatisfactionScore <= 5),
  
  -- ADAS and Calibration
  requiresADASCalibration BOOLEAN DEFAULT 0,
  adasCalibrationCompleted BOOLEAN DEFAULT 0,
  adasCalibrationDate DATE,
  adasCalibrationNotes TEXT,
  
  -- Environmental and Safety
  hazardousMaterialsPresent BOOLEAN DEFAULT 0,
  hazmatDetails TEXT,
  safetyPrecautions TEXT,
  
  -- Storage Information
  storageLocation TEXT,
  internalStorageCharges DECIMAL(10,2) DEFAULT 0.00,
  
  -- External Services (Sublets)
  requiresSublets BOOLEAN DEFAULT 0,
  subletServicesDescription TEXT,
  subletCostsApproved BOOLEAN DEFAULT 0,
  
  -- Document Management
  estimateDocumentPath TEXT,
  photoCount INTEGER DEFAULT 0,
  hasBeforePhotos BOOLEAN DEFAULT 0,
  hasAfterPhotos BOOLEAN DEFAULT 0,
  hasProgressPhotos BOOLEAN DEFAULT 0,
  
  -- Warranty and Follow-up
  warrantyProvided BOOLEAN DEFAULT 1,
  warrantyPeriod INTEGER,
  warrantyStartDate DATE,
  warrantyEndDate DATE,
  
  -- Notes and Comments
  roNotes TEXT,
  internalNotes TEXT,
  customerInstructions TEXT,
  estimatorNotes TEXT,
  technicianNotes TEXT,
  
  -- Compliance and Tracking
  complianceChecklist TEXT,
  complianceComplete BOOLEAN DEFAULT 0,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Production Workflow Table
CREATE TABLE IF NOT EXISTS production_workflow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repairOrderId INTEGER NOT NULL REFERENCES repair_order_management(id) ON DELETE CASCADE,
  productionStageId INTEGER REFERENCES production_stages(id),
  
  -- Stage Information
  stageName TEXT NOT NULL,
  stageOrder INTEGER NOT NULL,
  stageType TEXT CHECK(stageType IN ('intake', 'blueprint', 'disassembly', 'parts_hold', 'frame_repair', 'body_work', 'prep_prime', 'paint_booth', 'paint_finish', 'denib_polish', 'mechanical_repair', 'assembly', 'adas_calibration', 'final_qc', 'detail_cleanup', 'pre_delivery_inspection', 'customer_walkthrough', 'delivery')) NOT NULL,
  stageCategory TEXT CHECK(stageCategory IN ('structural', 'body', 'paint', 'mechanical', 'assembly', 'quality', 'delivery')) NOT NULL,
  
  -- Stage Status
  stageStatus TEXT CHECK(stageStatus IN ('pending', 'ready', 'in_progress', 'on_hold', 'completed', 'bypassed', 'failed', 'rework')) DEFAULT 'pending',
  previousStatus TEXT,
  statusChangeDate DATE,
  statusChangeReason TEXT,
  
  -- Timing Information
  plannedStartDate DATE,
  actualStartDate DATE,
  plannedEndDate DATE,
  actualEndDate DATE,
  plannedDuration INTEGER,
  actualDuration INTEGER,
  elapsedTimeMinutes INTEGER DEFAULT 0,
  
  -- Resource Assignment
  assignedTechnician INTEGER REFERENCES users(id),
  backupTechnician INTEGER REFERENCES users(id),
  requiredSkills TEXT,
  certificationRequired TEXT,
  
  -- Equipment and Bay Assignment
  assignedBay TEXT,
  bayType TEXT CHECK(bayType IN ('general', 'frame', 'paint_booth', 'prep_station', 'assembly', 'alignment')),
  requiredEquipment TEXT,
  equipmentAssigned TEXT,
  
  -- Stage Dependencies
  dependsOnStages TEXT,
  blockedByStages TEXT,
  blockingStages TEXT,
  
  -- Quality Control
  qcRequired BOOLEAN DEFAULT 0,
  qcCompleted BOOLEAN DEFAULT 0,
  qcDate DATE,
  qcInspector INTEGER REFERENCES users(id),
  qcPassed BOOLEAN DEFAULT 0,
  qcNotes TEXT,
  qcPhotos TEXT,
  
  -- Checklist Management
  hasChecklist BOOLEAN DEFAULT 0,
  checklistItems TEXT,
  checklistCompleted BOOLEAN DEFAULT 0,
  checklistProgress INTEGER DEFAULT 0 CHECK(checklistProgress >= 0 AND checklistProgress <= 100),
  
  -- Progress Tracking
  progressPercentage INTEGER DEFAULT 0 CHECK(progressPercentage >= 0 AND progressPercentage <= 100),
  isCompleted BOOLEAN DEFAULT 0,
  completionDate DATE,
  completedBy INTEGER REFERENCES users(id),
  
  -- Hold and Delay Management
  onHold BOOLEAN DEFAULT 0,
  holdStartDate DATE,
  holdEndDate DATE,
  holdReason TEXT CHECK(holdReason IN ('parts_delay', 'technician_unavailable', 'equipment_down', 'customer_approval', 'insurance_approval', 'material_shortage', 'quality_issue', 'rework_required', 'sublet_delay', 'environmental', 'safety_concern', 'other')),
  holdDescription TEXT,
  holdDurationMinutes INTEGER DEFAULT 0,
  
  -- Rework Management
  requiresRework BOOLEAN DEFAULT 0,
  reworkReason TEXT,
  reworkCount INTEGER DEFAULT 0,
  reworkDate DATE,
  originalWorkOrderId INTEGER REFERENCES production_workflow(id),
  
  -- Photo Documentation
  requiresPhotos BOOLEAN DEFAULT 0,
  photoRequirements TEXT,
  beforePhotos TEXT,
  progressPhotos TEXT,
  afterPhotos TEXT,
  photoCount INTEGER DEFAULT 0,
  
  -- Material and Supplies
  materialsRequired TEXT,
  materialsUsed TEXT,
  materialsCost DECIMAL(10,2) DEFAULT 0.00,
  
  -- Labor Tracking
  estimatedHours DECIMAL(8,2) DEFAULT 0.00,
  actualHours DECIMAL(8,2) DEFAULT 0.00,
  laborRate DECIMAL(8,2),
  laborCost DECIMAL(10,2) DEFAULT 0.00,
  efficiencyRatio DECIMAL(5,2),
  
  -- Environmental Conditions
  temperatureRequired INTEGER,
  humidityRequired INTEGER,
  environmentalNotes TEXT,
  
  -- Customer Interaction
  requiresCustomerApproval BOOLEAN DEFAULT 0,
  customerApprovalReceived BOOLEAN DEFAULT 0,
  customerApprovalDate DATE,
  customerNotificationSent BOOLEAN DEFAULT 0,
  customerNotificationDate DATE,
  
  -- Priority and Urgency
  priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent', 'critical')) DEFAULT 'normal',
  isRush BOOLEAN DEFAULT 0,
  rushReason TEXT,
  
  -- Performance Metrics
  firstTimeRight BOOLEAN DEFAULT 1,
  qualityScore INTEGER CHECK(qualityScore >= 1 AND qualityScore <= 5),
  customerSatisfactionScore INTEGER CHECK(customerSatisfactionScore >= 1 AND customerSatisfactionScore <= 5),
  
  -- Stage Notes
  stageNotes TEXT,
  technicianNotes TEXT,
  supervisorNotes TEXT,
  customerVisibleNotes TEXT,
  
  -- Integration and Automation
  triggeredBy TEXT,
  automationRules TEXT,
  webhooksTriggered TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Scheduling Capacity Table
CREATE TABLE IF NOT EXISTS scheduling_capacity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  -- Time Period Definition
  scheduleDate DATE NOT NULL,
  scheduleWeek INTEGER,
  scheduleMonth INTEGER,
  scheduleYear INTEGER NOT NULL,
  dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 1 AND dayOfWeek <= 7),
  
  -- Shift Information
  shiftName TEXT DEFAULT 'day_shift',
  shiftStartTime TIME,
  shiftEndTime TIME,
  shiftHours DECIMAL(4,2) DEFAULT 8.00,
  
  -- Department Capacity
  department TEXT CHECK(department IN ('intake', 'estimating', 'body', 'frame', 'paint', 'prep', 'assembly', 'mechanical', 'detailing', 'quality_control', 'glass', 'parts', 'sublet')) NOT NULL,
  
  -- Technician Capacity
  availableTechnicians INTEGER DEFAULT 0,
  totalCapacityHours DECIMAL(8,2) DEFAULT 0.00,
  scheduledHours DECIMAL(8,2) DEFAULT 0.00,
  remainingCapacityHours DECIMAL(8,2) DEFAULT 0.00,
  utilizationPercentage DECIMAL(5,2) DEFAULT 0.00 CHECK(utilizationPercentage >= 0 AND utilizationPercentage <= 100),
  
  -- Skills Matrix and Specialization
  availableSkills TEXT,
  specializedCapacity TEXT,
  certifiedTechnicians TEXT,
  
  -- Equipment and Bay Capacity
  totalBays INTEGER DEFAULT 0,
  availableBays INTEGER DEFAULT 0,
  occupiedBays INTEGER DEFAULT 0,
  bayUtilization DECIMAL(5,2) DEFAULT 0.00 CHECK(bayUtilization >= 0 AND bayUtilization <= 100),
  
  -- Bay Type Breakdown
  frameBays INTEGER DEFAULT 0,
  bodyBays INTEGER DEFAULT 0,
  paintBooths INTEGER DEFAULT 0,
  prepStations INTEGER DEFAULT 0,
  assemblyBays INTEGER DEFAULT 0,
  detailBays INTEGER DEFAULT 0,
  
  -- Equipment Availability
  equipmentAvailable TEXT,
  equipmentInUse TEXT,
  equipmentDowntime TEXT,
  
  -- Workload Distribution
  jobsScheduled INTEGER DEFAULT 0,
  averageJobDuration DECIMAL(6,2),
  complexityWeightedHours DECIMAL(8,2) DEFAULT 0.00,
  
  -- Priority and Rush Work
  rushJobsScheduled INTEGER DEFAULT 0,
  rushHoursAllocated DECIMAL(8,2) DEFAULT 0.00,
  priorityJobsScheduled INTEGER DEFAULT 0,
  priorityHoursAllocated DECIMAL(8,2) DEFAULT 0.00,
  
  -- Buffer and Flexibility
  bufferHours DECIMAL(6,2) DEFAULT 0.00,
  overtimeCapacity DECIMAL(6,2) DEFAULT 0.00,
  flexibilityRating TEXT CHECK(flexibilityRating IN ('low', 'medium', 'high')) DEFAULT 'medium',
  
  -- Constraints and Limitations
  hasConstraints BOOLEAN DEFAULT 0,
  constraints TEXT,
  blockedHours DECIMAL(6,2) DEFAULT 0.00,
  
  -- Environmental and Safety Factors
  environmentalConstraints TEXT,
  safetyRequirements TEXT,
  ventilationRequirements BOOLEAN DEFAULT 0,
  
  -- Performance Metrics
  plannedEfficiency DECIMAL(5,2) DEFAULT 100.00,
  actualEfficiency DECIMAL(5,2),
  productivityTarget DECIMAL(8,2),
  actualProductivity DECIMAL(8,2),
  
  -- Quality Considerations
  qualityControlHours DECIMAL(6,2) DEFAULT 0.00,
  reworkHoursReserved DECIMAL(6,2) DEFAULT 0.00,
  inspectionHours DECIMAL(6,2) DEFAULT 0.00,
  
  -- Material and Parts Dependencies
  partsConstrainedHours DECIMAL(6,2) DEFAULT 0.00,
  materialConstrainedHours DECIMAL(6,2) DEFAULT 0.00,
  subletConstrainedHours DECIMAL(6,2) DEFAULT 0.00,
  
  -- Customer and Insurance Dependencies
  customerApprovalHours DECIMAL(6,2) DEFAULT 0.00,
  insuranceApprovalHours DECIMAL(6,2) DEFAULT 0.00,
  
  -- Historical Performance
  historicalUtilization DECIMAL(5,2),
  seasonalAdjustment DECIMAL(5,2) DEFAULT 0.00,
  trendAdjustment DECIMAL(5,2) DEFAULT 0.00,
  
  -- Scheduling Algorithm Data
  algorithmVersion TEXT,
  optimizationScore DECIMAL(5,2),
  schedulingRules TEXT,
  
  -- Real-time Updates
  lastRecalculated DATETIME,
  recalculationTrigger TEXT,
  autoUpdateEnabled BOOLEAN DEFAULT 1,
  
  -- Status and Validation
  scheduleStatus TEXT CHECK(scheduleStatus IN ('draft', 'active', 'locked', 'historical', 'archived')) DEFAULT 'active',
  isValid BOOLEAN DEFAULT 1,
  validationErrors TEXT,
  
  -- Notes and Comments
  capacityNotes TEXT,
  managerNotes TEXT,
  schedulingNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id),
  
  UNIQUE(shopId, scheduleDate, department, shiftName)
);

-- Create Loaner Fleet Management Table
CREATE TABLE IF NOT EXISTS loaner_fleet_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  currentRenterId INTEGER REFERENCES customers(id),
  
  -- Vehicle Identification
  unitId TEXT NOT NULL,
  licensePlate TEXT NOT NULL,
  plateProvince TEXT,
  vin TEXT NOT NULL CHECK(length(vin) = 17),
  
  -- Vehicle Details
  year INTEGER NOT NULL CHECK(year >= 1990 AND year <= 2050),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  bodyStyle TEXT,
  color TEXT,
  
  -- Vehicle Class and Type
  vehicleClass TEXT CHECK(vehicleClass IN ('economy', 'compact', 'mid_size', 'full_size', 'premium', 'suv', 'pickup', 'van')) NOT NULL,
  vehicleType TEXT CHECK(vehicleType IN ('loaner', 'rental', 'courtesy', 'demo', 'shop_vehicle')) DEFAULT 'loaner',
  seatingCapacity INTEGER CHECK(seatingCapacity >= 2 AND seatingCapacity <= 15),
  
  -- Current Status
  currentStatus TEXT CHECK(currentStatus IN ('available', 'reserved', 'rented', 'maintenance', 'out_of_service', 'accident_damage', 'cleaning', 'inspection', 'retired')) DEFAULT 'available',
  statusChangeDate DATE,
  statusNotes TEXT,
  
  -- Location Tracking
  currentLocation TEXT,
  locationUpdatedAt DATETIME,
  isOnPremises BOOLEAN DEFAULT 1,
  
  -- Odometer and Usage
  currentOdometer INTEGER NOT NULL DEFAULT 0,
  lastOdometerReading INTEGER,
  odometerUnit TEXT CHECK(odometerUnit IN ('miles', 'kilometers')) DEFAULT 'kilometers',
  lastOdometerUpdate DATE,
  totalRentalMiles INTEGER DEFAULT 0,
  
  -- Fuel Management
  fuelLevel INTEGER CHECK(fuelLevel >= 0 AND fuelLevel <= 100),
  fuelType TEXT CHECK(fuelType IN ('gasoline', 'diesel', 'hybrid', 'electric')) DEFAULT 'gasoline',
  lastFuelUpdate DATE,
  fuelCardAssigned TEXT,
  fuelPolicyNotes TEXT,
  
  -- Condition and Damage
  overallCondition TEXT CHECK(overallCondition IN ('excellent', 'very_good', 'good', 'fair', 'poor')) DEFAULT 'good',
  hasCurrentDamage BOOLEAN DEFAULT 0,
  damageDescription TEXT,
  damagePhotos TEXT,
  damageReportDate DATE,
  damageReportedBy INTEGER REFERENCES users(id),
  
  -- Insurance and Registration
  insurancePolicyNumber TEXT,
  insuranceCompany TEXT,
  insuranceExpiryDate DATE,
  registrationExpiryDate DATE,
  registrationNumber TEXT,
  
  -- Maintenance Information
  nextServiceDue DATE,
  nextServiceOdometer INTEGER,
  lastServiceDate DATE,
  lastServiceOdometer INTEGER,
  serviceIntervalMiles INTEGER DEFAULT 5000,
  maintenanceNotes TEXT,
  
  -- Safety and Inspection
  lastSafetyInspection DATE,
  nextSafetyInspectionDue DATE,
  safetyInspectionStatus TEXT CHECK(safetyInspectionStatus IN ('current', 'due_soon', 'overdue', 'not_applicable')) DEFAULT 'current',
  
  -- Equipment and Features
  hasAirConditioning BOOLEAN DEFAULT 1,
  hasGPS BOOLEAN DEFAULT 0,
  hasBluetoothAudio BOOLEAN DEFAULT 0,
  hasUSBCharging BOOLEAN DEFAULT 0,
  hasWifiHotspot BOOLEAN DEFAULT 0,
  transmissionType TEXT CHECK(transmissionType IN ('manual', 'automatic', 'cvt')) DEFAULT 'automatic',
  equipmentNotes TEXT,
  
  -- Key Management
  keyCount INTEGER DEFAULT 2,
  keyType TEXT CHECK(keyType IN ('traditional', 'transponder', 'smart_key', 'proximity')) DEFAULT 'transponder',
  keyLocation TEXT,
  hasSpareKey BOOLEAN DEFAULT 1,
  keyNotes TEXT,
  
  -- Reservation and Availability
  canBeReserved BOOLEAN DEFAULT 1,
  reservationNotes TEXT,
  minimumRentalDays INTEGER DEFAULT 1,
  maximumRentalDays INTEGER DEFAULT 30,
  advanceBookingDays INTEGER DEFAULT 30,
  
  -- Financial Information
  dailyRentalRate DECIMAL(8,2),
  weeklyRentalRate DECIMAL(8,2),
  monthlyRentalRate DECIMAL(8,2),
  securityDeposit DECIMAL(8,2),
  mileageRate DECIMAL(6,3),
  mileageAllowanceDaily INTEGER,
  
  -- Usage Statistics
  totalRentals INTEGER DEFAULT 0,
  totalRentalDays INTEGER DEFAULT 0,
  averageRentalDuration DECIMAL(5,2),
  utilizationRate DECIMAL(5,2),
  revenueGeneratedTotal DECIMAL(12,2) DEFAULT 0.00,
  
  -- Cleaning and Preparation
  requiresCleaning BOOLEAN DEFAULT 0,
  lastCleanedDate DATE,
  cleaningNotes TEXT,
  isCleaningRequired BOOLEAN DEFAULT 0,
  
  -- Documentation
  vehiclePhotos TEXT,
  documentPhotos TEXT,
  hasPreRentalPhotos BOOLEAN DEFAULT 0,
  
  -- Customer Preferences and Restrictions
  customerPreferences TEXT,
  ageRestriction INTEGER,
  drivingRecordRequirement TEXT CHECK(drivingRecordRequirement IN ('none', 'clean', 'minor_violations_ok', 'case_by_case')) DEFAULT 'minor_violations_ok',
  creditCheckRequired BOOLEAN DEFAULT 0,
  
  -- Special Features and Notes
  isHandicapAccessible BOOLEAN DEFAULT 0,
  isPetFriendly BOOLEAN DEFAULT 0,
  smokingAllowed BOOLEAN DEFAULT 0,
  specialFeatures TEXT,
  operatingInstructions TEXT,
  customerInstructions TEXT,
  
  -- Fleet Management
  fleetNumber TEXT,
  purchaseDate DATE,
  purchasePrice DECIMAL(12,2),
  currentBookValue DECIMAL(12,2),
  plannedRetirementDate DATE,
  plannedRetirementOdometer INTEGER,
  
  -- Integration Data
  telematics TEXT,
  gpsTrackingEnabled BOOLEAN DEFAULT 0,
  lastTelematicsUpdate DATE,
  
  -- Notes and Comments
  vehicleNotes TEXT,
  customerFeedback TEXT,
  managementNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Loaner Reservations Table
CREATE TABLE IF NOT EXISTS loaner_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  repairOrderId INTEGER REFERENCES repair_order_management(id),
  loanerVehicleId INTEGER REFERENCES loaner_fleet_management(id),
  claimManagementId INTEGER REFERENCES claim_management(id),
  
  -- Reservation Identification
  reservationNumber TEXT NOT NULL UNIQUE,
  
  -- Reservation Status
  reservationStatus TEXT CHECK(reservationStatus IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show', 'early_return')) DEFAULT 'pending',
  statusChangeDate DATE,
  statusChangeReason TEXT,
  statusChangedBy INTEGER REFERENCES users(id),
  
  -- Reservation Dates and Times
  requestedStartDate DATETIME NOT NULL,
  requestedEndDate DATETIME NOT NULL,
  confirmedStartDate DATETIME,
  confirmedEndDate DATETIME,
  actualPickupDate DATETIME,
  actualReturnDate DATETIME,
  
  -- Pickup and Return Information
  pickupLocation TEXT DEFAULT 'shop',
  returnLocation TEXT DEFAULT 'shop',
  pickupTime TIME,
  returnTime TIME,
  requiresDelivery BOOLEAN DEFAULT 0,
  deliveryAddress TEXT,
  deliveryInstructions TEXT,
  
  -- Vehicle Preferences
  preferredVehicleClass TEXT CHECK(preferredVehicleClass IN ('economy', 'compact', 'mid_size', 'full_size', 'premium', 'suv', 'pickup', 'van')),
  alternativeVehicleClassOk BOOLEAN DEFAULT 1,
  specificVehicleRequested TEXT,
  vehicleFeatureRequirements TEXT,
  
  -- Eligibility and Authorization
  eligibilityVerified BOOLEAN DEFAULT 0,
  eligibilitySource TEXT CHECK(eligibilitySource IN ('insurance', 'warranty', 'goodwill', 'customer_pay')),
  authorizationNumber TEXT,
  authorizingParty TEXT,
  authorizationContact TEXT,
  authorizationPhone TEXT,
  
  -- Rental Coverage Information
  coverageType TEXT CHECK(coverageType IN ('full_coverage', 'basic_coverage', 'liability_only', 'customer_insurance', 'none')),
  dailyAllowance DECIMAL(8,2),
  totalAllowance DECIMAL(10,2),
  allowanceDays INTEGER,
  allowanceStartDate DATE,
  allowanceEndDate DATE,
  
  -- Customer Information
  primaryDriverName TEXT NOT NULL,
  primaryDriverLicense TEXT,
  primaryDriverLicenseState TEXT,
  primaryDriverAge INTEGER,
  primaryDriverPhone TEXT,
  
  -- Additional Drivers
  additionalDrivers TEXT,
  maxAdditionalDrivers INTEGER DEFAULT 0,
  
  -- Insurance Information
  customerInsuranceVerified BOOLEAN DEFAULT 0,
  customerInsuranceCompany TEXT,
  customerPolicyNumber TEXT,
  customerInsurancePhone TEXT,
  shopInsuranceApplies BOOLEAN DEFAULT 1,
  
  -- Vehicle Condition at Pickup
  pickupOdometer INTEGER,
  pickupFuelLevel INTEGER CHECK(pickupFuelLevel >= 0 AND pickupFuelLevel <= 100),
  pickupConditionNotes TEXT,
  pickupDamagePhotos TEXT,
  pickupInspectionComplete BOOLEAN DEFAULT 0,
  pickupInspectedBy INTEGER REFERENCES users(id),
  
  -- Vehicle Condition at Return
  returnOdometer INTEGER,
  returnFuelLevel INTEGER CHECK(returnFuelLevel >= 0 AND returnFuelLevel <= 100),
  returnConditionNotes TEXT,
  returnDamagePhotos TEXT,
  returnInspectionComplete BOOLEAN DEFAULT 0,
  returnInspectedBy INTEGER REFERENCES users(id),
  
  -- Mileage and Usage
  totalMilesDriven INTEGER,
  dailyMileageAllowance INTEGER,
  excessMileage INTEGER,
  excessMileageRate DECIMAL(6,3),
  excessMileageCharge DECIMAL(8,2),
  
  -- Financial Information
  baseRentalRate DECIMAL(8,2),
  totalRentalDays INTEGER,
  totalRentalCharge DECIMAL(10,2),
  additionalCharges DECIMAL(10,2) DEFAULT 0.00,
  additionalChargesDescription TEXT,
  totalAmount DECIMAL(10,2),
  amountCoveredByInsurance DECIMAL(10,2),
  customerResponsibleAmount DECIMAL(10,2),
  
  -- Payment Information
  securityDepositRequired BOOLEAN DEFAULT 0,
  securityDepositAmount DECIMAL(8,2),
  securityDepositCollected BOOLEAN DEFAULT 0,
  securityDepositRefunded BOOLEAN DEFAULT 0,
  paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'credit_card', 'debit_card', 'check', 'insurance_direct', 'account_billing')),
  creditCardOnFile TEXT,
  
  -- Documentation and Agreements
  rentalAgreementSigned BOOLEAN DEFAULT 0,
  agreementSignedDate DATE,
  agreementDocumentPath TEXT,
  waiverSigned BOOLEAN DEFAULT 0,
  insuranceWaiverSigned BOOLEAN DEFAULT 0,
  customerIdVerified BOOLEAN DEFAULT 0,
  drivingRecordChecked BOOLEAN DEFAULT 0,
  
  -- Emergency Contacts
  emergencyContactName TEXT,
  emergencyContactPhone TEXT,
  emergencyContactRelationship TEXT,
  
  -- Special Circumstances
  isEmergencyReservation BOOLEAN DEFAULT 0,
  requiresSpecialAssistance BOOLEAN DEFAULT 0,
  specialAssistanceNotes TEXT,
  hasAccessibilityNeeds BOOLEAN DEFAULT 0,
  accessibilityRequirements TEXT,
  
  -- Conflict Detection and Management
  hasConflict BOOLEAN DEFAULT 0,
  conflictResolution TEXT,
  alternativeOffered TEXT,
  alternativeAccepted BOOLEAN DEFAULT 0,
  
  -- Communication and Notifications
  confirmationSent BOOLEAN DEFAULT 0,
  confirmationSentDate DATE,
  remindersSent INTEGER DEFAULT 0,
  lastReminderDate DATE,
  customerContactPreference TEXT CHECK(customerContactPreference IN ('phone', 'email', 'text', 'mail')) DEFAULT 'phone',
  
  -- Quality and Satisfaction
  customerSatisfactionScore INTEGER CHECK(customerSatisfactionScore >= 1 AND customerSatisfactionScore <= 5),
  customerFeedback TEXT,
  complaintFiled BOOLEAN DEFAULT 0,
  complaintDetails TEXT,
  complaintResolved BOOLEAN DEFAULT 0,
  
  -- Return Processing
  requiresPostReturnCleaning BOOLEAN DEFAULT 0,
  postReturnInspectionRequired BOOLEAN DEFAULT 0,
  damageClaimFiled BOOLEAN DEFAULT 0,
  damageClaimAmount DECIMAL(10,2),
  
  -- Notes and Comments
  reservationNotes TEXT,
  customerServiceNotes TEXT,
  managementNotes TEXT,
  pickupNotes TEXT,
  returnNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Advanced Parts Management Table
CREATE TABLE IF NOT EXISTS advanced_parts_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repairOrderId INTEGER NOT NULL REFERENCES repair_order_management(id) ON DELETE CASCADE,
  estimateLineItemId INTEGER REFERENCES estimate_line_items(id),
  partsOrderId INTEGER REFERENCES parts_orders(id),
  vendorId INTEGER REFERENCES vendors(id),
  
  -- Part Identification
  lineNumber INTEGER NOT NULL,
  partDescription TEXT NOT NULL,
  operationCode TEXT,
  
  -- Part Numbers and Identification
  oemPartNumber TEXT,
  vendorPartNumber TEXT,
  alternatePartNumbers TEXT,
  universalProductCode TEXT,
  
  -- Position and Location
  vehiclePosition TEXT,
  positionCode TEXT,
  assemblyGroup TEXT,
  
  -- Part Category and Type
  partCategory TEXT CHECK(partCategory IN ('body_panel', 'structural', 'mechanical', 'electrical', 'interior', 'glass', 'trim', 'hardware', 'paint_materials', 'consumables')) NOT NULL,
  partSubcategory TEXT,
  
  -- Part Condition and Type
  partCondition TEXT CHECK(partCondition IN ('new', 'used', 'rebuilt', 'reconditioned', 'aftermarket', 'surplus')) DEFAULT 'new',
  brandType TEXT CHECK(brandType IN ('oem', 'oem_equivalent', 'aftermarket', 'recycled', 'remanufactured')) DEFAULT 'oem',
  qualityGrade TEXT CHECK(qualityGrade IN ('premium', 'standard', 'economy')) DEFAULT 'standard',
  
  -- Status Workflow
  partStatus TEXT CHECK(partStatus IN ('needed', 'sourcing', 'quoted', 'ordered', 'backordered', 'shipped', 'received', 'inspected', 'installed', 'returned', 'cancelled')) DEFAULT 'needed',
  previousStatus TEXT,
  statusChangeDate DATE,
  statusChangeReason TEXT,
  statusChangedBy INTEGER REFERENCES users(id),
  
  -- Quantity Management
  quantityOrdered DECIMAL(10,3) NOT NULL DEFAULT 1.000,
  quantityReceived DECIMAL(10,3) DEFAULT 0.000,
  quantityInstalled DECIMAL(10,3) DEFAULT 0.000,
  quantityReturned DECIMAL(10,3) DEFAULT 0.000,
  quantityDefective DECIMAL(10,3) DEFAULT 0.000,
  quantityRemaining DECIMAL(10,3) DEFAULT 0.000,
  unitOfMeasure TEXT DEFAULT 'each',
  
  -- Core Part Management
  isCoreItem BOOLEAN DEFAULT 0,
  coreCharge DECIMAL(10,2),
  coreReturned BOOLEAN DEFAULT 0,
  coreReturnDate DATE,
  coreReturnCredit DECIMAL(10,2),
  
  -- Pricing Information
  listPrice DECIMAL(12,2),
  discountPercentage DECIMAL(5,2) DEFAULT 0.00,
  discountAmount DECIMAL(10,2) DEFAULT 0.00,
  netPrice DECIMAL(12,2),
  totalCost DECIMAL(12,2),
  markup DECIMAL(5,2),
  sellPrice DECIMAL(12,2),
  
  -- Vendor and Sourcing
  primaryVendor TEXT,
  alternateVendors TEXT,
  sourcingDate DATE,
  sourcedBy INTEGER REFERENCES users(id),
  quoteExpirationDate DATE,
  
  -- Ordering Information
  orderDate DATE,
  orderedBy INTEGER REFERENCES users(id),
  purchaseOrderNumber TEXT,
  vendorOrderNumber TEXT,
  expediteRequested BOOLEAN DEFAULT 0,
  expediteFee DECIMAL(8,2),
  
  -- Delivery and Shipping
  estimatedDeliveryDate DATE,
  promisedDeliveryDate DATE,
  actualDeliveryDate DATE,
  shippingMethod TEXT,
  trackingNumber TEXT,
  shippingCost DECIMAL(8,2),
  signatureRequired BOOLEAN DEFAULT 0,
  
  -- Receiving Information
  receivedDate DATE,
  receivedBy INTEGER REFERENCES users(id),
  receivingNotes TEXT,
  packingSlipNumber TEXT,
  invoiceNumber TEXT,
  
  -- Quality Control and Inspection
  inspectionRequired BOOLEAN DEFAULT 0,
  inspectionCompleted BOOLEAN DEFAULT 0,
  inspectionDate DATE,
  inspectedBy INTEGER REFERENCES users(id),
  inspectionPassed BOOLEAN DEFAULT 1,
  inspectionNotes TEXT,
  defectDescription TEXT,
  
  -- Installation Information
  installationDate DATE,
  installedBy INTEGER REFERENCES users(id),
  installationNotes TEXT,
  requiresSpecialTools BOOLEAN DEFAULT 0,
  specialToolsRequired TEXT,
  installationTime DECIMAL(6,2),
  
  -- Warranty Information
  partWarrantyPeriod INTEGER,
  partWarrantyMileage INTEGER,
  warrantyStartDate DATE,
  warrantyEndDate DATE,
  warrantyType TEXT CHECK(warrantyType IN ('manufacturer', 'vendor', 'shop', 'extended', 'none')),
  warrantyNotes TEXT,
  
  -- Return and Exchange
  isReturnable BOOLEAN DEFAULT 1,
  returnDeadline DATE,
  returnReason TEXT CHECK(returnReason IN ('defective', 'wrong_part', 'not_needed', 'customer_change', 'quality_issue', 'damaged_in_shipping', 'other')),
  returnDate DATE,
  returnedBy INTEGER REFERENCES users(id),
  returnAuthNumber TEXT,
  restockingFee DECIMAL(8,2),
  returnCredit DECIMAL(10,2),
  
  -- Backorder Management
  backorderDate DATE,
  backorderReason TEXT,
  estimatedBackorderRelease DATE,
  backorderAlternativeOffered BOOLEAN DEFAULT 0,
  backorderAlternativeDescription TEXT,
  
  -- Paint and Color Information
  paintCode TEXT,
  paintDescription TEXT,
  paintType TEXT CHECK(paintType IN ('base_coat', 'clear_coat', 'primer', 'sealer', 'single_stage')),
  colorMatch BOOLEAN,
  
  -- Environmental and Safety
  hazardousMaterial BOOLEAN DEFAULT 0,
  hazmatClass TEXT,
  msdsRequired BOOLEAN DEFAULT 0,
  specialHandling TEXT,
  disposalRequirements TEXT,
  
  -- Documentation and Attachments
  attachmentCount INTEGER DEFAULT 0,
  hasPhotos BOOLEAN DEFAULT 0,
  hasDocuments BOOLEAN DEFAULT 0,
  
  -- Margin Analysis
  targetMargin DECIMAL(5,2),
  actualMargin DECIMAL(5,2),
  marginVariance DECIMAL(5,2),
  marginGuardrails TEXT,
  
  -- Performance Metrics
  leadTime INTEGER,
  onTimeDelivery BOOLEAN DEFAULT 1,
  vendorPerformanceScore INTEGER CHECK(vendorPerformanceScore >= 1 AND vendorPerformanceScore <= 5),
  qualityRating INTEGER CHECK(qualityRating >= 1 AND qualityRating <= 5),
  
  -- Priority and Urgency
  priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent', 'critical')) DEFAULT 'normal',
  isRushOrder BOOLEAN DEFAULT 0,
  rushReason TEXT,
  customerWaiting BOOLEAN DEFAULT 0,
  
  -- Notes and Comments
  partNotes TEXT,
  internalNotes TEXT,
  customerNotes TEXT,
  vendorNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- Create Purchase Order System Table
CREATE TABLE IF NOT EXISTS purchase_order_system (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repairOrderId INTEGER NOT NULL REFERENCES repair_order_management(id) ON DELETE CASCADE,
  vendorId INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- PO Identification - Advanced Numbering System
  purchaseOrderNumber TEXT NOT NULL UNIQUE,
  roNumber TEXT NOT NULL,
  yearMonth TEXT NOT NULL,
  vendorCode TEXT NOT NULL,
  sequenceNumber INTEGER NOT NULL,
  
  -- PO Status and Workflow
  poStatus TEXT CHECK(poStatus IN ('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partial_received', 'fully_received', 'cancelled', 'closed', 'disputed')) DEFAULT 'draft',
  previousStatus TEXT,
  statusChangeDate DATE,
  statusChangeReason TEXT,
  statusChangedBy INTEGER REFERENCES users(id),
  
  -- Important Dates
  poDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  requestedDeliveryDate DATE,
  promisedDeliveryDate DATE,
  actualDeliveryDate DATE,
  lastModificationDate DATE,
  
  -- Vendor Information
  vendorName TEXT NOT NULL,
  vendorContact TEXT,
  vendorPhone TEXT,
  vendorEmail TEXT,
  vendorFax TEXT,
  
  -- Delivery Information
  deliveryMethod TEXT CHECK(deliveryMethod IN ('pickup', 'delivery', 'ship_ground', 'ship_air', 'ship_overnight', 'courier')) DEFAULT 'delivery',
  deliveryAddress TEXT,
  deliveryInstructions TEXT,
  shippingAccount TEXT,
  
  -- Payment Terms
  paymentTerms TEXT,
  paymentTermsCode TEXT,
  discountTerms TEXT,
  discountPercentage DECIMAL(5,2),
  discountDays INTEGER,
  
  -- Financial Totals
  subtotalAmount DECIMAL(12,2) DEFAULT 0.00,
  discountAmount DECIMAL(10,2) DEFAULT 0.00,
  taxAmount DECIMAL(10,2) DEFAULT 0.00,
  shippingAmount DECIMAL(10,2) DEFAULT 0.00,
  handlingAmount DECIMAL(10,2) DEFAULT 0.00,
  totalAmount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Line Item Summary
  totalLineItems INTEGER DEFAULT 0,
  totalQuantity DECIMAL(12,3) DEFAULT 0.000,
  
  -- Approval Workflow
  requiresApproval BOOLEAN DEFAULT 0,
  approvalThreshold DECIMAL(10,2),
  approvedBy INTEGER REFERENCES users(id),
  approvedDate DATE,
  approvalNotes TEXT,
  rejectedBy INTEGER REFERENCES users(id),
  rejectedDate DATE,
  rejectionReason TEXT,
  
  -- Transmission Information
  transmissionMethod TEXT CHECK(transmissionMethod IN ('email', 'fax', 'phone', 'portal', 'edi', 'mail', 'hand_delivery')),
  sentDate DATE,
  sentBy INTEGER REFERENCES users(id),
  acknowledgmentReceived BOOLEAN DEFAULT 0,
  acknowledgmentDate DATE,
  vendorConfirmationNumber TEXT,
  
  -- Receiving Tracking
  receivingStatus TEXT CHECK(receivingStatus IN ('not_started', 'partial', 'complete', 'over_received', 'discrepancy')) DEFAULT 'not_started',
  firstReceiptDate DATE,
  lastReceiptDate DATE,
  totalReceived DECIMAL(12,3) DEFAULT 0.000,
  percentReceived DECIMAL(5,2) DEFAULT 0.00,
  
  -- Partial Receiving
  allowPartialReceiving BOOLEAN DEFAULT 1,
  partialShipments INTEGER DEFAULT 0,
  backorderedItems INTEGER DEFAULT 0,
  cancelledItems INTEGER DEFAULT 0,
  
  -- Quality Control
  inspectionRequired BOOLEAN DEFAULT 0,
  inspectionCompleted BOOLEAN DEFAULT 0,
  inspectionDate DATE,
  inspectedBy INTEGER REFERENCES users(id),
  inspectionPassed BOOLEAN DEFAULT 1,
  qualityIssues TEXT,
  
  -- Expediting and Rush Orders
  isRushOrder BOOLEAN DEFAULT 0,
  rushReason TEXT,
  expediteRequested BOOLEAN DEFAULT 0,
  expediteFee DECIMAL(8,2),
  expediteApproved BOOLEAN DEFAULT 0,
  
  -- Tracking Information
  trackingNumbers TEXT,
  carrier TEXT,
  shippingMethod TEXT,
  estimatedDelivery DATE,
  deliverySignature TEXT,
  
  -- Budget and Cost Control
  budgetCode TEXT,
  departmentCode TEXT,
  projectCode TEXT,
  costCenter TEXT,
  
  -- Contract and Agreement Information
  contractNumber TEXT,
  agreementType TEXT CHECK(agreementType IN ('standard', 'blanket', 'contract', 'spot_buy')) DEFAULT 'spot_buy',
  blanketOrderNumber TEXT,
  contractExpiryDate DATE,
  
  -- Environmental and Compliance
  requiresMSDS BOOLEAN DEFAULT 0,
  hazardousMaterials BOOLEAN DEFAULT 0,
  complianceNotes TEXT,
  certificationRequired BOOLEAN DEFAULT 0,
  certificationReceived BOOLEAN DEFAULT 0,
  
  -- Returns and Adjustments
  returnsAllowed BOOLEAN DEFAULT 1,
  returnDeadline DATE,
  restockingFee DECIMAL(5,2),
  returnedItems INTEGER DEFAULT 0,
  adjustmentAmount DECIMAL(10,2) DEFAULT 0.00,
  adjustmentReason TEXT,
  
  -- Communication Log
  communicationCount INTEGER DEFAULT 0,
  lastContactDate DATE,
  lastContactMethod TEXT,
  vendorResponseTime INTEGER,
  
  -- Performance Metrics
  onTimeDelivery BOOLEAN,
  deliveryVariance INTEGER,
  accuracyRate DECIMAL(5,2),
  vendorRating INTEGER CHECK(vendorRating >= 1 AND vendorRating <= 5),
  
  -- Recurring Order Information
  isRecurringOrder BOOLEAN DEFAULT 0,
  recurringFrequency TEXT CHECK(recurringFrequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
  nextRecurringDate DATE,
  parentOrderId INTEGER REFERENCES purchase_order_system(id),
  
  -- Integration and EDI
  ediCapable BOOLEAN DEFAULT 0,
  ediDocumentNumber TEXT,
  externalSystemId TEXT,
  syncStatus TEXT CHECK(syncStatus IN ('not_synced', 'synced', 'sync_error', 'pending_sync')) DEFAULT 'not_synced',
  lastSyncDate DATE,
  
  -- Document Management
  attachmentCount INTEGER DEFAULT 0,
  hasQuote BOOLEAN DEFAULT 0,
  hasContract BOOLEAN DEFAULT 0,
  hasConfirmation BOOLEAN DEFAULT 0,
  hasInvoice BOOLEAN DEFAULT 0,
  
  -- Special Instructions
  specialInstructions TEXT,
  deliveryInstructionsSpecial TEXT,
  packingInstructions TEXT,
  handlingInstructions TEXT,
  
  -- Internal References
  requestedBy INTEGER REFERENCES users(id),
  authorizedBy INTEGER REFERENCES users(id),
  buyerAssigned INTEGER REFERENCES users(id),
  
  -- Notes and Comments
  poNotes TEXT,
  internalNotes TEXT,
  vendorNotes TEXT,
  receivingNotes TEXT,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id),
  updatedBy INTEGER REFERENCES users(id)
);

-- =====================================================================
-- CREATE INDEXES FOR OPTIMAL PERFORMANCE
-- =====================================================================

-- Contact Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_contact_timeline_shop ON contact_timeline(shopId);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_customer ON contact_timeline(customerId);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_job ON contact_timeline(jobId);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_user ON contact_timeline(userId);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_status ON contact_timeline(status);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_method ON contact_timeline(communicationMethod);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_direction ON contact_timeline(direction);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_scheduled ON contact_timeline(scheduledAt);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_attempted ON contact_timeline(attemptedAt);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_completed ON contact_timeline(completedAt);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_followup ON contact_timeline(requiresFollowup, followupDate);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_template ON contact_timeline(templateId);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_priority ON contact_timeline(priority, importance);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_created ON contact_timeline(createdAt);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_customer_created ON contact_timeline(customerId, createdAt);

-- Vehicle Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_shop ON vehicle_profiles(shopId);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_customer ON vehicle_profiles(customerId);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_vin ON vehicle_profiles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_plate ON vehicle_profiles(licensePlate);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_ymm ON vehicle_profiles(year, make, model);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_make_model ON vehicle_profiles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_status ON vehicle_profiles(vehicleStatus);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_fleet ON vehicle_profiles(isFleetVehicle, fleetName);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_adas ON vehicle_profiles(hasADASFeatures);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_calibration ON vehicle_profiles(requiresCalibration);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_title ON vehicle_profiles(titleStatus);

-- Claim Management Indexes
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_shop ON claim_management(shopId);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_customer ON claim_management(customerId);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_vehicle ON claim_management(vehicleProfileId);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_insurance ON claim_management(insuranceCompanyId);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_claim_number ON claim_management(claimNumber);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_policy_number ON claim_management(policyNumber);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_status ON claim_management(claimStatus);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_date_loss ON claim_management(dateOfLoss);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_adjuster ON claim_management(adjusterName);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_drp ON claim_management(isDRPClaim);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_total_loss ON claim_management(totalLoss);
CREATE INDEX IF NOT EXISTS idx_claim_mgmt_ats ON claim_management(atsEligible);

-- Repair Order Management Indexes
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_shop ON repair_order_management(shopId);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_customer ON repair_order_management(customerId);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_vehicle ON repair_order_management(vehicleProfileId);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_claim ON repair_order_management(claimManagementId);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_estimate ON repair_order_management(estimateId);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_ro_number ON repair_order_management(repairOrderNumber);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_status ON repair_order_management(roStatus);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_hold ON repair_order_management(isOnHold);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_overdue ON repair_order_management(isOverdue);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_sla ON repair_order_management(slaRiskLevel);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_priority ON repair_order_management(isRush, isPriority);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_technician ON repair_order_management(primaryTechnician);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_estimator ON repair_order_management(assignedEstimator);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_delivery_promised ON repair_order_management(promisedDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_delivery_actual ON repair_order_management(actualDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_parts_received ON repair_order_management(allPartsReceived);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_qc ON repair_order_management(qcRequired, qcCompleted);
CREATE INDEX IF NOT EXISTS idx_ro_mgmt_adas ON repair_order_management(requiresADASCalibration);

-- Production Workflow Indexes
CREATE INDEX IF NOT EXISTS idx_prod_workflow_shop ON production_workflow(shopId);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_ro ON production_workflow(repairOrderId);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_stage_id ON production_workflow(productionStageId);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_stage_name ON production_workflow(stageName);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_stage_order ON production_workflow(stageOrder);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_stage_type ON production_workflow(stageType);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_category ON production_workflow(stageCategory);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_status ON production_workflow(stageStatus);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_technician ON production_workflow(assignedTechnician);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_bay ON production_workflow(assignedBay);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_planned_start ON production_workflow(plannedStartDate);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_actual_start ON production_workflow(actualStartDate);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_planned_end ON production_workflow(plannedEndDate);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_actual_end ON production_workflow(actualEndDate);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_hold ON production_workflow(onHold);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_completed ON production_workflow(isCompleted);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_rework ON production_workflow(requiresRework);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_qc ON production_workflow(qcRequired, qcCompleted);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_priority ON production_workflow(priority);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_rush ON production_workflow(isRush);
CREATE INDEX IF NOT EXISTS idx_prod_workflow_ro_stage ON production_workflow(repairOrderId, stageOrder);

-- Scheduling Capacity Indexes
CREATE INDEX IF NOT EXISTS idx_sched_capacity_shop ON scheduling_capacity(shopId);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_date ON scheduling_capacity(scheduleDate);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_department ON scheduling_capacity(department);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_year_month ON scheduling_capacity(scheduleYear, scheduleMonth);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_week ON scheduling_capacity(scheduleWeek, scheduleYear);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_day ON scheduling_capacity(dayOfWeek);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_shift ON scheduling_capacity(shiftName);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_status ON scheduling_capacity(scheduleStatus);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_utilization ON scheduling_capacity(utilizationPercentage);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_bay_util ON scheduling_capacity(bayUtilization);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_dept_date ON scheduling_capacity(department, scheduleDate);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_remaining ON scheduling_capacity(remainingCapacityHours);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_flexibility ON scheduling_capacity(flexibilityRating);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_recalc ON scheduling_capacity(lastRecalculated);
CREATE INDEX IF NOT EXISTS idx_sched_capacity_valid ON scheduling_capacity(isValid);

-- Loaner Fleet Management Indexes
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_shop ON loaner_fleet_management(shopId);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_renter ON loaner_fleet_management(currentRenterId);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_unit_id ON loaner_fleet_management(unitId);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_plate ON loaner_fleet_management(licensePlate);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_vin ON loaner_fleet_management(vin);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_status ON loaner_fleet_management(currentStatus);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_class ON loaner_fleet_management(vehicleClass);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_type ON loaner_fleet_management(vehicleType);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_reservable ON loaner_fleet_management(canBeReserved);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_location ON loaner_fleet_management(currentLocation);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_service_due ON loaner_fleet_management(nextServiceDue);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_inspection_due ON loaner_fleet_management(nextSafetyInspectionDue);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_insurance_exp ON loaner_fleet_management(insuranceExpiryDate);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_registration_exp ON loaner_fleet_management(registrationExpiryDate);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_damage ON loaner_fleet_management(hasCurrentDamage);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_cleaning ON loaner_fleet_management(requiresCleaning);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_utilization ON loaner_fleet_management(utilizationRate);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_shop_status ON loaner_fleet_management(shopId, currentStatus);
CREATE INDEX IF NOT EXISTS idx_loaner_fleet_shop_class_status ON loaner_fleet_management(shopId, vehicleClass, currentStatus);

-- Loaner Reservations Indexes
CREATE INDEX IF NOT EXISTS idx_loaner_res_shop ON loaner_reservations(shopId);
CREATE INDEX IF NOT EXISTS idx_loaner_res_customer ON loaner_reservations(customerId);
CREATE INDEX IF NOT EXISTS idx_loaner_res_ro ON loaner_reservations(repairOrderId);
CREATE INDEX IF NOT EXISTS idx_loaner_res_vehicle ON loaner_reservations(loanerVehicleId);
CREATE INDEX IF NOT EXISTS idx_loaner_res_claim ON loaner_reservations(claimManagementId);
CREATE INDEX IF NOT EXISTS idx_loaner_res_number ON loaner_reservations(reservationNumber);
CREATE INDEX IF NOT EXISTS idx_loaner_res_status ON loaner_reservations(reservationStatus);
CREATE INDEX IF NOT EXISTS idx_loaner_res_req_start ON loaner_reservations(requestedStartDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_req_end ON loaner_reservations(requestedEndDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_conf_start ON loaner_reservations(confirmedStartDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_conf_end ON loaner_reservations(confirmedEndDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_pickup ON loaner_reservations(actualPickupDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_return ON loaner_reservations(actualReturnDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_eligibility ON loaner_reservations(eligibilitySource);
CREATE INDEX IF NOT EXISTS idx_loaner_res_driver ON loaner_reservations(primaryDriverName);
CREATE INDEX IF NOT EXISTS idx_loaner_res_license ON loaner_reservations(primaryDriverLicense);
CREATE INDEX IF NOT EXISTS idx_loaner_res_conflict ON loaner_reservations(hasConflict);
CREATE INDEX IF NOT EXISTS idx_loaner_res_emergency ON loaner_reservations(isEmergencyReservation);
CREATE INDEX IF NOT EXISTS idx_loaner_res_vehicle_start ON loaner_reservations(loanerVehicleId, requestedStartDate);
CREATE INDEX IF NOT EXISTS idx_loaner_res_status_start ON loaner_reservations(reservationStatus, requestedStartDate);

-- Advanced Parts Management Indexes
CREATE INDEX IF NOT EXISTS idx_adv_parts_shop ON advanced_parts_management(shopId);
CREATE INDEX IF NOT EXISTS idx_adv_parts_ro ON advanced_parts_management(repairOrderId);
CREATE INDEX IF NOT EXISTS idx_adv_parts_estimate_line ON advanced_parts_management(estimateLineItemId);
CREATE INDEX IF NOT EXISTS idx_adv_parts_order ON advanced_parts_management(partsOrderId);
CREATE INDEX IF NOT EXISTS idx_adv_parts_vendor ON advanced_parts_management(vendorId);
CREATE INDEX IF NOT EXISTS idx_adv_parts_line_num ON advanced_parts_management(lineNumber);
CREATE INDEX IF NOT EXISTS idx_adv_parts_oem_num ON advanced_parts_management(oemPartNumber);
CREATE INDEX IF NOT EXISTS idx_adv_parts_vendor_num ON advanced_parts_management(vendorPartNumber);
CREATE INDEX IF NOT EXISTS idx_adv_parts_status ON advanced_parts_management(partStatus);
CREATE INDEX IF NOT EXISTS idx_adv_parts_category ON advanced_parts_management(partCategory);
CREATE INDEX IF NOT EXISTS idx_adv_parts_condition ON advanced_parts_management(partCondition);
CREATE INDEX IF NOT EXISTS idx_adv_parts_brand ON advanced_parts_management(brandType);
CREATE INDEX IF NOT EXISTS idx_adv_parts_order_date ON advanced_parts_management(orderDate);
CREATE INDEX IF NOT EXISTS idx_adv_parts_est_delivery ON advanced_parts_management(estimatedDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_adv_parts_act_delivery ON advanced_parts_management(actualDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_adv_parts_received ON advanced_parts_management(receivedDate);
CREATE INDEX IF NOT EXISTS idx_adv_parts_installed ON advanced_parts_management(installationDate);
CREATE INDEX IF NOT EXISTS idx_adv_parts_priority ON advanced_parts_management(priority);
CREATE INDEX IF NOT EXISTS idx_adv_parts_rush ON advanced_parts_management(isRushOrder);
CREATE INDEX IF NOT EXISTS idx_adv_parts_waiting ON advanced_parts_management(customerWaiting);
CREATE INDEX IF NOT EXISTS idx_adv_parts_core ON advanced_parts_management(isCoreItem);
CREATE INDEX IF NOT EXISTS idx_adv_parts_returnable ON advanced_parts_management(isReturnable);
CREATE INDEX IF NOT EXISTS idx_adv_parts_ro_line ON advanced_parts_management(repairOrderId, lineNumber);
CREATE INDEX IF NOT EXISTS idx_adv_parts_status_priority ON advanced_parts_management(partStatus, priority);
CREATE INDEX IF NOT EXISTS idx_adv_parts_vendor_order ON advanced_parts_management(vendorId, orderDate);

-- Purchase Order System Indexes
CREATE INDEX IF NOT EXISTS idx_po_system_shop ON purchase_order_system(shopId);
CREATE INDEX IF NOT EXISTS idx_po_system_ro ON purchase_order_system(repairOrderId);
CREATE INDEX IF NOT EXISTS idx_po_system_vendor ON purchase_order_system(vendorId);
CREATE INDEX IF NOT EXISTS idx_po_system_po_number ON purchase_order_system(purchaseOrderNumber);
CREATE INDEX IF NOT EXISTS idx_po_system_ro_number ON purchase_order_system(roNumber);
CREATE INDEX IF NOT EXISTS idx_po_system_year_month ON purchase_order_system(yearMonth);
CREATE INDEX IF NOT EXISTS idx_po_system_vendor_code ON purchase_order_system(vendorCode);
CREATE INDEX IF NOT EXISTS idx_po_system_status ON purchase_order_system(poStatus);
CREATE INDEX IF NOT EXISTS idx_po_system_po_date ON purchase_order_system(poDate);
CREATE INDEX IF NOT EXISTS idx_po_system_req_delivery ON purchase_order_system(requestedDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_po_system_promised_delivery ON purchase_order_system(promisedDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_po_system_actual_delivery ON purchase_order_system(actualDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_po_system_approved_by ON purchase_order_system(approvedBy);
CREATE INDEX IF NOT EXISTS idx_po_system_approved_date ON purchase_order_system(approvedDate);
CREATE INDEX IF NOT EXISTS idx_po_system_sent_date ON purchase_order_system(sentDate);
CREATE INDEX IF NOT EXISTS idx_po_system_receiving_status ON purchase_order_system(receivingStatus);
CREATE INDEX IF NOT EXISTS idx_po_system_rush ON purchase_order_system(isRushOrder);
CREATE INDEX IF NOT EXISTS idx_po_system_approval_req ON purchase_order_system(requiresApproval);
CREATE INDEX IF NOT EXISTS idx_po_system_total_amount ON purchase_order_system(totalAmount);
CREATE INDEX IF NOT EXISTS idx_po_system_on_time ON purchase_order_system(onTimeDelivery);
CREATE INDEX IF NOT EXISTS idx_po_system_vendor_rating ON purchase_order_system(vendorRating);
CREATE INDEX IF NOT EXISTS idx_po_system_ro_vendor ON purchase_order_system(repairOrderId, vendorId);
CREATE INDEX IF NOT EXISTS idx_po_system_status_delivery ON purchase_order_system(poStatus, requestedDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_po_system_vendor_date ON purchase_order_system(vendorId, poDate);

-- =====================================================================
-- CREATE TRIGGERS FOR AUTOMATIC CALCULATIONS AND UPDATES
-- =====================================================================

-- Trigger to automatically update vehicle profiles updated timestamp
CREATE TRIGGER IF NOT EXISTS trg_vehicle_profiles_updated
  AFTER UPDATE ON vehicle_profiles
  FOR EACH ROW
BEGIN
  UPDATE vehicle_profiles SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to automatically update claim management updated timestamp
CREATE TRIGGER IF NOT EXISTS trg_claim_management_updated
  AFTER UPDATE ON claim_management
  FOR EACH ROW
BEGIN
  UPDATE claim_management SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to automatically update repair order management updated timestamp
CREATE TRIGGER IF NOT EXISTS trg_repair_order_management_updated
  AFTER UPDATE ON repair_order_management
  FOR EACH ROW
BEGIN
  UPDATE repair_order_management SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to automatically calculate remaining capacity hours
CREATE TRIGGER IF NOT EXISTS trg_scheduling_capacity_remaining
  AFTER UPDATE OF scheduledHours, totalCapacityHours ON scheduling_capacity
  FOR EACH ROW
BEGIN
  UPDATE scheduling_capacity 
  SET remainingCapacityHours = NEW.totalCapacityHours - NEW.scheduledHours,
      utilizationPercentage = CASE 
        WHEN NEW.totalCapacityHours > 0 THEN (NEW.scheduledHours / NEW.totalCapacityHours) * 100
        ELSE 0
      END
  WHERE id = NEW.id;
END;

-- Trigger to automatically calculate bay utilization
CREATE TRIGGER IF NOT EXISTS trg_scheduling_capacity_bay_utilization
  AFTER UPDATE OF occupiedBays, totalBays ON scheduling_capacity
  FOR EACH ROW
BEGIN
  UPDATE scheduling_capacity 
  SET availableBays = NEW.totalBays - NEW.occupiedBays,
      bayUtilization = CASE 
        WHEN NEW.totalBays > 0 THEN (NEW.occupiedBays / NEW.totalBays) * 100
        ELSE 0
      END
  WHERE id = NEW.id;
END;

-- Trigger to calculate total rental days and amount for loaner reservations
CREATE TRIGGER IF NOT EXISTS trg_loaner_reservations_calculate
  AFTER UPDATE OF actualPickupDate, actualReturnDate, baseRentalRate ON loaner_reservations
  FOR EACH ROW
  WHEN NEW.actualPickupDate IS NOT NULL AND NEW.actualReturnDate IS NOT NULL
BEGIN
  UPDATE loaner_reservations 
  SET totalRentalDays = CAST((julianday(NEW.actualReturnDate) - julianday(NEW.actualPickupDate)) + 1 AS INTEGER),
      totalRentalCharge = CASE
        WHEN NEW.baseRentalRate IS NOT NULL THEN 
          NEW.baseRentalRate * (CAST((julianday(NEW.actualReturnDate) - julianday(NEW.actualPickupDate)) + 1 AS INTEGER))
        ELSE totalRentalCharge
      END
  WHERE id = NEW.id;
END;

-- Trigger to calculate miles driven for loaner reservations
CREATE TRIGGER IF NOT EXISTS trg_loaner_reservations_mileage
  AFTER UPDATE OF returnOdometer, pickupOdometer ON loaner_reservations
  FOR EACH ROW
  WHEN NEW.returnOdometer IS NOT NULL AND NEW.pickupOdometer IS NOT NULL
BEGIN
  UPDATE loaner_reservations 
  SET totalMilesDriven = NEW.returnOdometer - NEW.pickupOdometer,
      excessMileage = CASE
        WHEN NEW.dailyMileageAllowance IS NOT NULL AND NEW.totalRentalDays IS NOT NULL THEN
          MAX(0, (NEW.returnOdometer - NEW.pickupOdometer) - (NEW.dailyMileageAllowance * NEW.totalRentalDays))
        ELSE 0
      END
  WHERE id = NEW.id;
END;

-- Trigger to calculate quantity remaining for parts
CREATE TRIGGER IF NOT EXISTS trg_advanced_parts_quantity_remaining
  AFTER UPDATE OF quantityReceived, quantityInstalled, quantityReturned ON advanced_parts_management
  FOR EACH ROW
BEGIN
  UPDATE advanced_parts_management 
  SET quantityRemaining = NEW.quantityReceived - NEW.quantityInstalled - NEW.quantityReturned
  WHERE id = NEW.id;
END;

-- Trigger to calculate net price and total cost for parts
CREATE TRIGGER IF NOT EXISTS trg_advanced_parts_pricing
  AFTER UPDATE OF listPrice, discountAmount, quantityOrdered ON advanced_parts_management
  FOR EACH ROW
  WHEN NEW.listPrice IS NOT NULL
BEGIN
  UPDATE advanced_parts_management 
  SET netPrice = NEW.listPrice - COALESCE(NEW.discountAmount, 0),
      totalCost = (NEW.listPrice - COALESCE(NEW.discountAmount, 0)) * NEW.quantityOrdered
  WHERE id = NEW.id;
END;

-- Trigger to calculate efficiency ratio for production workflow
CREATE TRIGGER IF NOT EXISTS trg_production_workflow_efficiency
  AFTER UPDATE OF actualHours, estimatedHours ON production_workflow
  FOR EACH ROW
  WHEN NEW.actualHours IS NOT NULL AND NEW.estimatedHours IS NOT NULL AND NEW.estimatedHours > 0
BEGIN
  UPDATE production_workflow 
  SET efficiencyRatio = NEW.actualHours / NEW.estimatedHours
  WHERE id = NEW.id;
END;

-- Trigger to calculate percent received for purchase orders
CREATE TRIGGER IF NOT EXISTS trg_purchase_order_percent_received
  AFTER UPDATE OF totalReceived, totalQuantity ON purchase_order_system
  FOR EACH ROW
  WHEN NEW.totalQuantity > 0
BEGIN
  UPDATE purchase_order_system 
  SET percentReceived = (NEW.totalReceived / NEW.totalQuantity) * 100
  WHERE id = NEW.id;
END;

-- =====================================================================
-- MIGRATION COMPLETION LOG
-- =====================================================================

-- Insert migration record
INSERT OR REPLACE INTO schema_migrations (version, description, applied_at) 
VALUES ('20250829_001', 'Phase 1 Comprehensive Collision Repair Database Schema', CURRENT_TIMESTAMP);