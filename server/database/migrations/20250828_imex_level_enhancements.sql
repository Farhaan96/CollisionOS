-- IMEX-Level Database Enhancements Migration
-- Date: 2025-08-28
-- Purpose: Upgrade CollisionOS database to IMEX-level auto body shop management functionality

-- =============================================================================
-- 1. PRODUCTION STAGES TABLE
-- Configurable workflow stages with rules and dependencies
-- =============================================================================

CREATE TABLE IF NOT EXISTS production_stages (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  stageName TEXT NOT NULL,
  stageCode TEXT UNIQUE NOT NULL,
  stageType TEXT CHECK(stageType IN ('production', 'quality', 'administrative', 'customer_interaction', 'external')) DEFAULT 'production',
  category TEXT CHECK(category IN ('intake', 'disassembly', 'repair', 'paint', 'reassembly', 'quality', 'delivery')) NOT NULL,
  
  -- Stage ordering and dependencies
  stageOrder INTEGER NOT NULL,
  isRequired BOOLEAN DEFAULT 1,
  isActive BOOLEAN DEFAULT 1,
  prerequisites TEXT DEFAULT '[]', -- JSON array of stage codes
  dependentStages TEXT DEFAULT '[]', -- JSON array of stage codes
  
  -- Timing and capacity
  estimatedDuration INTEGER, -- minutes
  bufferTime INTEGER DEFAULT 0, -- minutes
  maxConcurrentJobs INTEGER,
  
  -- Resource requirements
  requiredSkills TEXT DEFAULT '[]', -- JSON array
  requiredCertifications TEXT DEFAULT '[]', -- JSON array
  equipmentRequired TEXT DEFAULT '[]', -- JSON array
  toolsRequired TEXT DEFAULT '[]', -- JSON array
  bayTypes TEXT DEFAULT '[]', -- JSON array
  
  -- Quality control
  requiresInspection BOOLEAN DEFAULT 0,
  inspectionCriteria TEXT DEFAULT '[]', -- JSON array
  qualityCheckpoints TEXT DEFAULT '[]', -- JSON array
  
  -- Customer interaction
  customerVisibleName TEXT,
  customerDescription TEXT,
  customerNotificationRequired BOOLEAN DEFAULT 0,
  customerApprovalRequired BOOLEAN DEFAULT 0,
  
  -- Photo and documentation requirements
  photosRequired BOOLEAN DEFAULT 0,
  photoTypes TEXT DEFAULT '[]', -- JSON array
  documentsRequired TEXT DEFAULT '[]', -- JSON array
  
  -- Environmental conditions
  environmentalRequirements TEXT DEFAULT '{}', -- JSON object
  safetyRequirements TEXT DEFAULT '[]', -- JSON array
  
  -- Workflow rules
  canSkip BOOLEAN DEFAULT 0,
  canParallelize BOOLEAN DEFAULT 0,
  allowRework BOOLEAN DEFAULT 1,
  maxReworkAttempts INTEGER DEFAULT 3,
  
  -- Cost and billing
  laborRate DECIMAL(8,2),
  materialCostMultiplier DECIMAL(5,2) DEFAULT 1.00,
  isProfitCenter BOOLEAN DEFAULT 1,
  
  -- Performance targets
  targetEfficiency DECIMAL(5,2),
  maxDelayMinutes INTEGER,
  escalationThreshold INTEGER,
  
  -- Automation and integration
  automationRules TEXT DEFAULT '{}', -- JSON object
  integrationEndpoints TEXT DEFAULT '{}', -- JSON object
  webhookEvents TEXT DEFAULT '[]', -- JSON array
  
  -- Instructions and templates
  instructions TEXT,
  workOrderTemplate TEXT,
  checklistTemplate TEXT DEFAULT '[]', -- JSON array
  
  -- Metrics and KPIs
  trackCycleTime BOOLEAN DEFAULT 1,
  trackQuality BOOLEAN DEFAULT 1,
  trackEfficiency BOOLEAN DEFAULT 1,
  kpiTargets TEXT DEFAULT '{}', -- JSON object
  
  -- System fields
  metadata TEXT DEFAULT '{}',
  createdBy TEXT,
  updatedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (updatedBy) REFERENCES users(id)
);

CREATE INDEX idx_production_stages_shop ON production_stages(shopId);
CREATE INDEX idx_production_stages_type ON production_stages(stageType);
CREATE INDEX idx_production_stages_category ON production_stages(category);
CREATE INDEX idx_production_stages_order ON production_stages(stageOrder);
CREATE INDEX idx_production_stages_active ON production_stages(isActive);
CREATE UNIQUE INDEX idx_production_stages_shop_order ON production_stages(shopId, stageOrder);

-- =============================================================================
-- 2. JOB STAGE HISTORY TABLE
-- Complete audit trail of job movements through production stages
-- =============================================================================

CREATE TABLE IF NOT EXISTS job_stage_history (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  jobId TEXT NOT NULL,
  workflowStatusId TEXT,
  productionStageId TEXT,
  
  -- Movement tracking
  fromStage TEXT,
  toStage TEXT NOT NULL,
  movementType TEXT CHECK(movementType IN ('forward', 'backward', 'skip', 'restart', 'parallel')) DEFAULT 'forward',
  movementReason TEXT CHECK(movementReason IN ('normal_progression', 'rework_required', 'quality_issue', 'customer_request', 'parts_delay', 'equipment_failure', 'scheduling_optimization', 'emergency_rush', 'stage_skip_approved', 'parallel_processing', 'other')) DEFAULT 'normal_progression',
  
  -- Timing information
  transitionTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  stageStartTime DATETIME,
  stageEndTime DATETIME,
  stageDuration INTEGER, -- minutes
  waitTime INTEGER DEFAULT 0, -- minutes before stage started
  
  -- Staff information
  technicianId TEXT,
  supervisorId TEXT,
  authorizedBy TEXT,
  
  -- Location and resources
  bayNumber TEXT,
  bayType TEXT,
  equipmentUsed TEXT DEFAULT '[]', -- JSON array
  toolsUsed TEXT DEFAULT '[]', -- JSON array
  materialsConsumed TEXT DEFAULT '[]', -- JSON array
  
  -- Quality and performance metrics
  qualityScore DECIMAL(3,1), -- 1.0 to 5.0
  efficiencyPercentage DECIMAL(5,2),
  firstTimeRight BOOLEAN DEFAULT 1,
  reworkRequired BOOLEAN DEFAULT 0,
  reworkCount INTEGER DEFAULT 0,
  
  -- Issues and delays
  hadIssues BOOLEAN DEFAULT 0,
  issueType TEXT CHECK(issueType IN ('quality_defect', 'equipment_malfunction', 'parts_shortage', 'skill_gap', 'customer_change', 'damage_discovery', 'measurement_error', 'safety_concern', 'environmental_condition', 'other')),
  issueDescription TEXT,
  delayMinutes INTEGER DEFAULT 0,
  delayReason TEXT CHECK(delayReason IN ('parts_wait', 'equipment_downtime', 'customer_delay', 'insurance_delay', 'quality_rework', 'scheduling_conflict', 'weather_delay', 'staff_shortage', 'safety_hold', 'other')),
  resolutionTime INTEGER, -- minutes to resolve issue
  
  -- Cost tracking
  laborCost DECIMAL(10,2),
  materialCost DECIMAL(10,2),
  overheadCost DECIMAL(10,2),
  totalCost DECIMAL(10,2),
  budgetVariance DECIMAL(10,2),
  
  -- Customer interaction
  customerNotified BOOLEAN DEFAULT 0,
  customerNotificationTime DATETIME,
  customerApprovalRequired BOOLEAN DEFAULT 0,
  customerApproved BOOLEAN DEFAULT 0,
  customerApprovalTime DATETIME,
  customerFeedback TEXT,
  
  -- Environmental conditions
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  weatherConditions TEXT,
  environmentalNotes TEXT,
  
  -- Photos and documentation
  photosTaken INTEGER DEFAULT 0,
  photosRequired INTEGER DEFAULT 0,
  documentsGenerated INTEGER DEFAULT 0,
  photoUrls TEXT DEFAULT '[]', -- JSON array
  documentUrls TEXT DEFAULT '[]', -- JSON array
  
  -- Inspection and quality control
  inspectionRequired BOOLEAN DEFAULT 0,
  inspectionCompleted BOOLEAN DEFAULT 0,
  inspectedBy TEXT,
  inspectionTime DATETIME,
  inspectionResults TEXT DEFAULT '{}', -- JSON object
  inspectionNotes TEXT,
  
  -- Work order and instructions
  workOrderNumber TEXT,
  workInstructions TEXT,
  specialInstructions TEXT,
  safetyNotes TEXT,
  
  -- Notes and comments
  notes TEXT,
  technicianNotes TEXT,
  supervisorNotes TEXT,
  qualityNotes TEXT,
  
  -- System integration
  externalSystemData TEXT DEFAULT '{}', -- JSON object
  syncStatus TEXT CHECK(syncStatus IN ('pending', 'synced', 'failed', 'not_applicable')) DEFAULT 'not_applicable',
  lastSyncTime DATETIME,
  
  -- Metadata
  metadata TEXT DEFAULT '{}',
  tags TEXT DEFAULT '[]',
  
  -- System fields
  createdBy TEXT,
  recordedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (jobId) REFERENCES jobs(id),
  FOREIGN KEY (workflowStatusId) REFERENCES workflow_status(id),
  FOREIGN KEY (productionStageId) REFERENCES production_stages(id),
  FOREIGN KEY (technicianId) REFERENCES users(id),
  FOREIGN KEY (supervisorId) REFERENCES users(id),
  FOREIGN KEY (authorizedBy) REFERENCES users(id),
  FOREIGN KEY (inspectedBy) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (recordedBy) REFERENCES users(id)
);

CREATE INDEX idx_job_stage_history_shop ON job_stage_history(shopId);
CREATE INDEX idx_job_stage_history_job ON job_stage_history(jobId);
CREATE INDEX idx_job_stage_history_transition ON job_stage_history(transitionTime);
CREATE INDEX idx_job_stage_history_technician ON job_stage_history(technicianId);
CREATE INDEX idx_job_stage_history_stage ON job_stage_history(toStage);
CREATE INDEX idx_job_stage_history_quality ON job_stage_history(qualityScore);
CREATE INDEX idx_job_stage_history_timeline ON job_stage_history(jobId, transitionTime);

-- =============================================================================
-- 3. TECHNICIAN PERFORMANCE TABLE
-- Comprehensive performance metrics and KPI tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS technician_performance (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  technicianId TEXT NOT NULL,
  
  -- Performance period
  reportingPeriod TEXT CHECK(reportingPeriod IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')) DEFAULT 'weekly',
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  
  -- Productivity metrics
  hoursWorked DECIMAL(8,2) DEFAULT 0.00,
  billableHours DECIMAL(8,2) DEFAULT 0.00,
  flaggedHours DECIMAL(8,2) DEFAULT 0.00,
  productiveHours DECIMAL(8,2) DEFAULT 0.00,
  overtimeHours DECIMAL(8,2) DEFAULT 0.00,
  utilizationRate DECIMAL(5,2), -- percentage
  
  -- Efficiency and velocity
  overallEfficiency DECIMAL(5,2), -- percentage
  averageVelocity DECIMAL(8,2),
  velocityTrend TEXT CHECK(velocityTrend IN ('improving', 'stable', 'declining')),
  
  -- Job and task completion
  jobsCompleted INTEGER DEFAULT 0,
  stagesCompleted INTEGER DEFAULT 0,
  tasksCompleted INTEGER DEFAULT 0,
  averageJobCompletionTime INTEGER, -- minutes
  onTimeDeliveryRate DECIMAL(5,2), -- percentage
  
  -- Quality metrics
  qualityScore DECIMAL(3,1), -- 1.0 to 5.0
  qualityTrend TEXT CHECK(qualityTrend IN ('improving', 'stable', 'declining')),
  firstTimeRightRate DECIMAL(5,2), -- percentage
  reworkCount INTEGER DEFAULT 0,
  reworkRate DECIMAL(5,2), -- percentage
  customerComplaintCount INTEGER DEFAULT 0,
  inspectionPassRate DECIMAL(5,2), -- percentage
  
  -- Cost performance
  laborCostGenerated DECIMAL(12,2) DEFAULT 0.00,
  materialCostIncurred DECIMAL(12,2) DEFAULT 0.00,
  revenueGenerated DECIMAL(12,2) DEFAULT 0.00,
  profitGenerated DECIMAL(12,2) DEFAULT 0.00,
  costPerHour DECIMAL(8,2),
  revenuePerHour DECIMAL(8,2),
  profitMargin DECIMAL(5,2), -- percentage
  
  -- Safety and compliance
  safetyIncidents INTEGER DEFAULT 0,
  safetyScore DECIMAL(3,1), -- 1.0 to 5.0
  complianceViolations INTEGER DEFAULT 0,
  trainingHours DECIMAL(6,2) DEFAULT 0.00,
  certificationsEarned INTEGER DEFAULT 0,
  
  -- Attendance and punctuality
  daysWorked INTEGER DEFAULT 0,
  daysAbsent INTEGER DEFAULT 0,
  tardyCount INTEGER DEFAULT 0,
  attendanceRate DECIMAL(5,2), -- percentage
  punctualityScore DECIMAL(3,1), -- 1.0 to 5.0
  
  -- Skill development
  skillRating TEXT DEFAULT '{}', -- JSON object: skill_code -> rating
  skillImprovement TEXT DEFAULT '{}', -- JSON object: skill_code -> improvement_percentage
  specializations TEXT DEFAULT '[]', -- JSON array of specialization codes
  crossTrainingProgress TEXT DEFAULT '{}', -- JSON object: department -> progress_percentage
  
  -- Customer satisfaction
  customerRating DECIMAL(3,1), -- 1.0 to 5.0
  customerFeedbackCount INTEGER DEFAULT 0,
  positiveReviews INTEGER DEFAULT 0,
  negativeReviews INTEGER DEFAULT 0,
  customerSatisfactionTrend TEXT CHECK(customerSatisfactionTrend IN ('improving', 'stable', 'declining')),
  
  -- Equipment and resource utilization
  equipmentUtilization TEXT DEFAULT '{}', -- JSON object: equipment_id -> hours_used
  toolsUsed TEXT DEFAULT '[]', -- JSON array of tool codes
  bayUtilization TEXT DEFAULT '{}', -- JSON object: bay_number -> hours_used
  resourceEfficiency DECIMAL(5,2), -- percentage
  
  -- Teamwork and collaboration
  mentorshipHours DECIMAL(6,2) DEFAULT 0.00,
  apprenticesSupported INTEGER DEFAULT 0,
  knowledgeSharingContributions INTEGER DEFAULT 0,
  teamworkScore DECIMAL(3,1), -- 1.0 to 5.0
  leadershipScore DECIMAL(3,1), -- 1.0 to 5.0
  
  -- Goals and targets
  monthlyTarget TEXT DEFAULT '{}', -- JSON object: various target metrics
  targetAchievement TEXT DEFAULT '{}', -- JSON object: achievement percentage per target
  bonusEligible BOOLEAN DEFAULT 0,
  bonusAmount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Performance ranking
  rankInShop INTEGER,
  rankInDepartment INTEGER,
  percentileRank DECIMAL(5,2), -- 0-100
  
  -- Improvement areas
  strengthAreas TEXT DEFAULT '[]', -- JSON array of strength categories
  improvementAreas TEXT DEFAULT '[]', -- JSON array of areas needing improvement
  developmentPlan TEXT,
  coachingNotes TEXT,
  
  -- Supervisor feedback
  supervisorRating DECIMAL(3,1), -- 1.0 to 5.0
  supervisorComments TEXT,
  lastReviewDate DATE,
  nextReviewDate DATE,
  
  -- System calculated fields
  overallScore DECIMAL(5,2), -- Composite performance score
  performanceGrade TEXT CHECK(performanceGrade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F')),
  trendDirection TEXT CHECK(trendDirection IN ('improving', 'stable', 'declining')),
  
  -- Metadata
  calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  dataVersion INTEGER DEFAULT 1,
  metadata TEXT DEFAULT '{}',
  
  -- System fields
  createdBy TEXT,
  updatedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (technicianId) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (updatedBy) REFERENCES users(id),
  
  UNIQUE(technicianId, reportingPeriod, periodStart)
);

CREATE INDEX idx_technician_performance_shop ON technician_performance(shopId);
CREATE INDEX idx_technician_performance_technician ON technician_performance(technicianId);
CREATE INDEX idx_technician_performance_period ON technician_performance(reportingPeriod);
CREATE INDEX idx_technician_performance_score ON technician_performance(overallScore);
CREATE INDEX idx_technician_performance_grade ON technician_performance(performanceGrade);
CREATE INDEX idx_technician_performance_quality ON technician_performance(qualityScore);

-- =============================================================================
-- 4. COMMUNICATION TEMPLATES TABLE
-- SMS/Email templates for automation
-- =============================================================================

CREATE TABLE IF NOT EXISTS communication_templates (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  
  -- Template identification
  templateName TEXT NOT NULL,
  templateCode TEXT UNIQUE NOT NULL,
  category TEXT CHECK(category IN ('status_update', 'parts_arrival', 'quality_issue', 'delay_notification', 'completion_notice', 'pickup_ready', 'delivery_reminder', 'payment_reminder', 'satisfaction_survey', 'warranty_notice', 'appointment_confirmation', 'estimate_approval', 'insurance_communication', 'emergency_contact', 'marketing', 'other')) NOT NULL,
  
  -- Communication channels
  channels TEXT DEFAULT '[]', -- JSON array: ['sms', 'email', 'phone', 'push', 'portal']
  preferredChannel TEXT CHECK(preferredChannel IN ('sms', 'email', 'phone', 'push', 'portal', 'auto')) DEFAULT 'auto',
  
  -- Trigger conditions
  triggerEvents TEXT DEFAULT '[]', -- JSON array of event types
  jobStatuses TEXT DEFAULT '[]', -- JSON array of job statuses
  workflowStages TEXT DEFAULT '[]', -- JSON array of workflow stages
  customTriggers TEXT DEFAULT '{}', -- JSON object of custom trigger conditions
  
  -- Content templates
  smsTemplate TEXT,
  emailSubject TEXT,
  emailTemplate TEXT,
  emailHtmlTemplate TEXT,
  phoneScript TEXT,
  pushNotificationTitle TEXT,
  pushNotificationBody TEXT,
  portalMessage TEXT,
  
  -- Personalization variables
  variables TEXT DEFAULT '[]', -- JSON array of variable definitions
  dynamicContent TEXT DEFAULT '{}', -- JSON object: rules for dynamic content insertion
  
  -- Timing and scheduling
  sendImmediately BOOLEAN DEFAULT 1,
  delayMinutes INTEGER DEFAULT 0,
  businessHoursOnly BOOLEAN DEFAULT 0,
  workingDays TEXT DEFAULT '[1,2,3,4,5]', -- JSON array: Monday to Friday
  startTime TIME, -- e.g., '08:00:00'
  endTime TIME, -- e.g., '18:00:00'
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Recipient targeting
  recipientTypes TEXT DEFAULT '["customer"]', -- JSON array: ['customer', 'insurance', 'vendor', 'technician', 'manager']
  customerSegments TEXT DEFAULT '[]', -- JSON array of customer segment criteria
  jobTypes TEXT DEFAULT '[]', -- JSON array of job types
  priorityLevels TEXT DEFAULT '[]', -- JSON array of job priority levels
  
  -- Approval and compliance
  requiresApproval BOOLEAN DEFAULT 0,
  approvalRoles TEXT DEFAULT '[]', -- JSON array of roles that can approve
  complianceRequired BOOLEAN DEFAULT 0,
  legalReview BOOLEAN DEFAULT 0,
  
  -- Frequency limits
  maxFrequency TEXT CHECK(maxFrequency IN ('once', 'daily', 'weekly', 'unlimited')) DEFAULT 'unlimited',
  cooldownMinutes INTEGER DEFAULT 0,
  suppressDuplicates BOOLEAN DEFAULT 1,
  
  -- Response handling
  trackOpens BOOLEAN DEFAULT 1,
  trackClicks BOOLEAN DEFAULT 1,
  trackResponses BOOLEAN DEFAULT 1,
  allowReplies BOOLEAN DEFAULT 1,
  autoResponseEnabled BOOLEAN DEFAULT 0,
  autoResponseTemplate TEXT,
  
  -- Integration settings
  externalSystemId TEXT,
  webhookUrl TEXT,
  apiEndpoint TEXT,
  integrationSettings TEXT DEFAULT '{}', -- JSON object
  
  -- Personalization and branding
  brandingEnabled BOOLEAN DEFAULT 1,
  logoUrl TEXT,
  brandColors TEXT DEFAULT '{}', -- JSON object
  signature TEXT,
  disclaimers TEXT,
  
  -- A/B testing
  abTestEnabled BOOLEAN DEFAULT 0,
  abTestVariants TEXT DEFAULT '[]', -- JSON array of template variants
  abTestSplit INTEGER DEFAULT 50, -- percentage split
  
  -- Analytics and performance
  sentCount INTEGER DEFAULT 0,
  deliveredCount INTEGER DEFAULT 0,
  openedCount INTEGER DEFAULT 0,
  clickedCount INTEGER DEFAULT 0,
  responseCount INTEGER DEFAULT 0,
  bounceCount INTEGER DEFAULT 0,
  unsubscribeCount INTEGER DEFAULT 0,
  deliveryRate DECIMAL(5,2), -- percentage
  openRate DECIMAL(5,2), -- percentage
  clickRate DECIMAL(5,2), -- percentage
  responseRate DECIMAL(5,2), -- percentage
  
  -- Template status and versioning
  status TEXT CHECK(status IN ('draft', 'active', 'inactive', 'archived', 'testing')) DEFAULT 'draft',
  version TEXT DEFAULT '1.0',
  parentTemplateId TEXT,
  isDefault BOOLEAN DEFAULT 0,
  
  -- Localization
  language TEXT DEFAULT 'en',
  translations TEXT DEFAULT '{}', -- JSON object: language_code -> translated_content
  
  -- Quality and testing
  lastTested DATETIME,
  testResults TEXT DEFAULT '{}', -- JSON object
  qualityScore DECIMAL(3,1), -- 1.0 to 5.0
  
  -- Notes and documentation
  description TEXT,
  usage_instructions TEXT,
  notes TEXT,
  tags TEXT DEFAULT '[]', -- JSON array
  
  -- System fields
  metadata TEXT DEFAULT '{}',
  createdBy TEXT,
  updatedBy TEXT,
  approvedBy TEXT,
  approvedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (parentTemplateId) REFERENCES communication_templates(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (updatedBy) REFERENCES users(id),
  FOREIGN KEY (approvedBy) REFERENCES users(id)
);

CREATE INDEX idx_communication_templates_shop ON communication_templates(shopId);
CREATE INDEX idx_communication_templates_category ON communication_templates(category);
CREATE INDEX idx_communication_templates_status ON communication_templates(status);
CREATE INDEX idx_communication_templates_channel ON communication_templates(preferredChannel);
CREATE INDEX idx_communication_templates_default ON communication_templates(isDefault);

-- =============================================================================
-- 5. COMMUNICATION LOG TABLE
-- Complete customer interaction history
-- =============================================================================

CREATE TABLE IF NOT EXISTS communication_log (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  
  -- Related records
  jobId TEXT,
  customerId TEXT,
  templateId TEXT,
  workflowStatusId TEXT,
  
  -- Communication details
  communicationType TEXT CHECK(communicationType IN ('outbound', 'inbound', 'automated', 'broadcast')) DEFAULT 'outbound',
  channel TEXT CHECK(channel IN ('sms', 'email', 'phone', 'push', 'portal', 'in_person', 'fax', 'mail', 'other')) NOT NULL,
  direction TEXT CHECK(direction IN ('sent', 'received')) NOT NULL,
  
  -- Recipients and senders
  recipientType TEXT CHECK(recipientType IN ('customer', 'insurance', 'vendor', 'technician', 'manager', 'admin', 'other')) DEFAULT 'customer',
  recipientName TEXT,
  recipientPhone TEXT,
  recipientEmail TEXT,
  recipientAddress TEXT,
  senderName TEXT,
  senderId TEXT,
  
  -- Message content
  subject TEXT,
  messageContent TEXT,
  messageHtml TEXT,
  attachments TEXT DEFAULT '[]', -- JSON array of attachment objects
  
  -- Status and delivery tracking
  status TEXT CHECK(status IN ('draft', 'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'unsubscribed', 'spam', 'blocked')) DEFAULT 'draft',
  deliveryStatus TEXT CHECK(deliveryStatus IN ('pending', 'delivered', 'failed', 'unknown')) DEFAULT 'pending',
  deliveryAttempts INTEGER DEFAULT 0,
  maxDeliveryAttempts INTEGER DEFAULT 3,
  
  -- Timing information
  scheduledAt DATETIME,
  sentAt DATETIME,
  deliveredAt DATETIME,
  openedAt DATETIME,
  clickedAt DATETIME,
  repliedAt DATETIME,
  
  -- Response and engagement
  wasOpened BOOLEAN DEFAULT 0,
  openCount INTEGER DEFAULT 0,
  lastOpenedAt DATETIME,
  wasClicked BOOLEAN DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  lastClickedAt DATETIME,
  clickedLinks TEXT DEFAULT '[]', -- JSON array of clicked URLs
  
  -- Response handling
  responseReceived BOOLEAN DEFAULT 0,
  responseContent TEXT,
  responseProcessed BOOLEAN DEFAULT 0,
  sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative', 'unknown')),
  
  -- External system integration
  externalMessageId TEXT,
  externalThreadId TEXT,
  externalSystemName TEXT,
  externalSystemData TEXT DEFAULT '{}', -- JSON object
  
  -- Campaign and automation
  campaignId TEXT,
  automationRuleId TEXT,
  triggerEvent TEXT,
  isAutomated BOOLEAN DEFAULT 0,
  abTestVariant TEXT,
  
  -- Error handling
  lastError TEXT,
  errorCount INTEGER DEFAULT 0,
  errorDetails TEXT DEFAULT '{}', -- JSON object
  
  -- Priority and routing
  priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  category TEXT,
  tags TEXT DEFAULT '[]', -- JSON array
  
  -- Cost tracking
  cost DECIMAL(8,4),
  costCurrency TEXT DEFAULT 'USD',
  billingUnits INTEGER DEFAULT 1,
  
  -- Compliance and legal
  requiresConsent BOOLEAN DEFAULT 0,
  consentReceived BOOLEAN DEFAULT 0,
  consentTimestamp DATETIME,
  optOutReceived BOOLEAN DEFAULT 0,
  optOutTimestamp DATETIME,
  gdprCompliant BOOLEAN DEFAULT 1,
  retentionPeriod INTEGER, -- days
  
  -- Quality and feedback
  qualityScore DECIMAL(3,1), -- 1.0 to 5.0
  customerSatisfaction INTEGER, -- 1-5 scale
  feedbackReceived TEXT,
  
  -- Follow-up tracking
  requiresFollowUp BOOLEAN DEFAULT 0,
  followUpDate DATETIME,
  followUpCompleted BOOLEAN DEFAULT 0,
  parentMessageId TEXT,
  threadId TEXT,
  
  -- Analytics and reporting
  deviceType TEXT,
  userAgent TEXT,
  ipAddress TEXT,
  location TEXT, -- JSON object: { country, region, city, timezone }
  
  -- System fields
  metadata TEXT DEFAULT '{}',
  notes TEXT,
  createdBy TEXT,
  processedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (jobId) REFERENCES jobs(id),
  FOREIGN KEY (customerId) REFERENCES customers(id),
  FOREIGN KEY (templateId) REFERENCES communication_templates(id),
  FOREIGN KEY (workflowStatusId) REFERENCES workflow_status(id),
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (parentMessageId) REFERENCES communication_log(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (processedBy) REFERENCES users(id)
);

CREATE INDEX idx_communication_log_shop ON communication_log(shopId);
CREATE INDEX idx_communication_log_job ON communication_log(jobId);
CREATE INDEX idx_communication_log_customer ON communication_log(customerId);
CREATE INDEX idx_communication_log_template ON communication_log(templateId);
CREATE INDEX idx_communication_log_channel ON communication_log(channel);
CREATE INDEX idx_communication_log_status ON communication_log(status);
CREATE INDEX idx_communication_log_sent ON communication_log(sentAt);
CREATE INDEX idx_communication_log_thread ON communication_log(threadId);

-- =============================================================================
-- 6. FINANCIAL TRANSACTIONS TABLE
-- Complete financial audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
  shopId TEXT NOT NULL,
  
  -- Related records
  jobId TEXT,
  customerId TEXT,
  invoiceId TEXT,
  estimateId TEXT,
  partsOrderId TEXT,
  vendorId TEXT,
  insuranceCompanyId TEXT,
  
  -- Transaction identification
  transactionNumber TEXT UNIQUE NOT NULL,
  externalTransactionId TEXT,
  referenceNumber TEXT,
  
  -- Transaction details
  transactionType TEXT CHECK(transactionType IN ('payment_received', 'payment_sent', 'refund_issued', 'refund_received', 'adjustment', 'fee', 'discount', 'tax', 'interest', 'penalty', 'chargeback', 'dispute', 'settlement', 'writeoff', 'other')) NOT NULL,
  category TEXT CHECK(category IN ('customer_payment', 'insurance_payment', 'vendor_payment', 'employee_payment', 'tax_payment', 'fee_payment', 'refund', 'adjustment', 'other')) NOT NULL,
  subCategory TEXT,
  
  -- Financial amounts
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchangeRate DECIMAL(10,6) DEFAULT 1.000000,
  baseAmount DECIMAL(12,2), -- Amount in shop's base currency
  
  -- Payment method details
  paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'ach', 'wire_transfer', 'paypal', 'stripe', 'square', 'financing', 'insurance_direct', 'other')) NOT NULL,
  paymentDetails TEXT DEFAULT '{}', -- JSON object: card last 4, check number, etc.
  
  -- Status and processing
  status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded', 'partially_refunded', 'reversed', 'settled')) DEFAULT 'pending',
  processingStatus TEXT CHECK(processingStatus IN ('queued', 'processing', 'processed', 'failed', 'retry')) DEFAULT 'queued',
  
  -- Dates and timing
  transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  effectiveDate DATETIME,
  processedDate DATETIME,
  settledDate DATETIME,
  dueDate DATETIME,
  
  -- Fees and costs
  processingFee DECIMAL(8,2) DEFAULT 0.00,
  merchantFee DECIMAL(8,2) DEFAULT 0.00,
  bankFee DECIMAL(8,2) DEFAULT 0.00,
  otherFees DECIMAL(8,2) DEFAULT 0.00,
  totalFees DECIMAL(8,2) DEFAULT 0.00,
  netAmount DECIMAL(12,2),
  
  -- Tax information
  taxAmount DECIMAL(10,2) DEFAULT 0.00,
  taxRate DECIMAL(5,4),
  taxExempt BOOLEAN DEFAULT 0,
  taxDetails TEXT DEFAULT '{}', -- JSON object
  
  -- Account and ledger
  debitAccount TEXT,
  creditAccount TEXT,
  glCode TEXT,
  costCenter TEXT,
  department TEXT,
  
  -- Authorization and security
  authorizationCode TEXT,
  approvalCode TEXT,
  securityCode TEXT,
  requiresApproval BOOLEAN DEFAULT 0,
  approved BOOLEAN DEFAULT 0,
  approvedBy TEXT,
  approvedAt DATETIME,
  
  -- Recurring and scheduled
  isRecurring BOOLEAN DEFAULT 0,
  recurringFrequency TEXT CHECK(recurringFrequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
  nextRecurrenceDate DATETIME,
  recurringEndDate DATETIME,
  parentTransactionId TEXT,
  
  -- Split and partial payments
  isSplit BOOLEAN DEFAULT 0,
  splitTotal DECIMAL(12,2),
  splitSequence INTEGER,
  splitCount INTEGER,
  
  -- Dispute and chargeback
  isDisputed BOOLEAN DEFAULT 0,
  disputeDate DATETIME,
  disputeReason TEXT,
  disputeAmount DECIMAL(12,2),
  disputeResolved BOOLEAN DEFAULT 0,
  disputeResolutionDate DATETIME,
  
  -- Refund tracking
  originalTransactionId TEXT,
  refundAmount DECIMAL(12,2) DEFAULT 0.00,
  refundableAmount DECIMAL(12,2),
  refundReason TEXT,
  
  -- Integration and sync
  externalSystemName TEXT,
  externalSystemId TEXT,
  syncStatus TEXT CHECK(syncStatus IN ('pending', 'synced', 'failed', 'not_applicable')) DEFAULT 'pending',
  lastSyncDate DATETIME,
  syncData TEXT DEFAULT '{}', -- JSON object
  
  -- Reconciliation
  reconciledDate DATETIME,
  bankStatementDate DATETIME,
  bankReference TEXT,
  isReconciled BOOLEAN DEFAULT 0,
  reconciliationDifference DECIMAL(10,2) DEFAULT 0.00,
  
  -- Audit trail
  transactionHistory TEXT DEFAULT '[]', -- JSON array of status changes
  errorLog TEXT DEFAULT '[]', -- JSON array of processing errors
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 3,
  
  -- Description and notes
  description TEXT,
  notes TEXT,
  internalNotes TEXT,
  customerNotes TEXT,
  
  -- Tags and classification
  tags TEXT DEFAULT '[]', -- JSON array
  businessPurpose TEXT,
  projectCode TEXT,
  
  -- System fields
  metadata TEXT DEFAULT '{}',
  createdBy TEXT,
  processedBy TEXT,
  reconciledBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shopId) REFERENCES shops(id),
  FOREIGN KEY (jobId) REFERENCES jobs(id),
  FOREIGN KEY (customerId) REFERENCES customers(id),
  FOREIGN KEY (invoiceId) REFERENCES invoices(id),
  FOREIGN KEY (estimateId) REFERENCES estimates(id),
  FOREIGN KEY (partsOrderId) REFERENCES parts_orders(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  FOREIGN KEY (insuranceCompanyId) REFERENCES insurance_companies(id),
  FOREIGN KEY (parentTransactionId) REFERENCES financial_transactions(id),
  FOREIGN KEY (originalTransactionId) REFERENCES financial_transactions(id),
  FOREIGN KEY (approvedBy) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (processedBy) REFERENCES users(id),
  FOREIGN KEY (reconciledBy) REFERENCES users(id)
);

CREATE INDEX idx_financial_transactions_shop ON financial_transactions(shopId);
CREATE INDEX idx_financial_transactions_job ON financial_transactions(jobId);
CREATE INDEX idx_financial_transactions_customer ON financial_transactions(customerId);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transactionType);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transactionDate);
CREATE INDEX idx_financial_transactions_amount ON financial_transactions(amount);
CREATE INDEX idx_financial_transactions_method ON financial_transactions(paymentMethod);
CREATE INDEX idx_financial_transactions_reconciled ON financial_transactions(isReconciled);

-- =============================================================================
-- DATA POPULATION
-- Insert default production stages and communication templates
-- =============================================================================

-- Default Production Stages
INSERT OR IGNORE INTO production_stages (
  id, shopId, stageName, stageCode, stageType, category, stageOrder,
  isRequired, isActive, customerVisibleName, customerDescription,
  estimatedDuration, requiresInspection, photosRequired
) VALUES
  ('stage-001', (SELECT id FROM shops LIMIT 1), 'Vehicle Intake', 'INTAKE', 'production', 'intake', 1, 1, 1, 
   'Vehicle Drop-off', 'Initial vehicle inspection and documentation', 30, 1, 1),
  ('stage-002', (SELECT id FROM shops LIMIT 1), 'Damage Assessment', 'ASSESS', 'production', 'intake', 2, 1, 1,
   'Damage Assessment', 'Detailed damage evaluation and documentation', 60, 1, 1),
  ('stage-003', (SELECT id FROM shops LIMIT 1), 'Parts Ordering', 'PARTS_ORDER', 'administrative', 'repair', 3, 1, 1,
   'Parts Ordering', 'Ordering required parts and materials', 15, 0, 0),
  ('stage-004', (SELECT id FROM shops LIMIT 1), 'Disassembly', 'DISASSEMBLY', 'production', 'disassembly', 4, 1, 1,
   'Disassembly', 'Careful removal of damaged parts', 120, 0, 1),
  ('stage-005', (SELECT id FROM shops LIMIT 1), 'Body Repair', 'BODY_REPAIR', 'production', 'repair', 5, 1, 1,
   'Body Work', 'Structural and body panel repair', 240, 1, 1),
  ('stage-006', (SELECT id FROM shops LIMIT 1), 'Paint Preparation', 'PAINT_PREP', 'production', 'paint', 6, 1, 1,
   'Paint Prep', 'Surface preparation for painting', 180, 1, 1),
  ('stage-007', (SELECT id FROM shops LIMIT 1), 'Paint Application', 'PAINT', 'production', 'paint', 7, 1, 1,
   'Painting', 'Professional paint application', 120, 1, 1),
  ('stage-008', (SELECT id FROM shops LIMIT 1), 'Reassembly', 'REASSEMBLY', 'production', 'reassembly', 8, 1, 1,
   'Reassembly', 'Installation of parts and components', 180, 1, 1),
  ('stage-009', (SELECT id FROM shops LIMIT 1), 'Quality Control', 'QC', 'quality', 'quality', 9, 1, 1,
   'Quality Inspection', 'Final quality control inspection', 45, 1, 1),
  ('stage-010', (SELECT id FROM shops LIMIT 1), 'Detailing', 'DETAIL', 'production', 'delivery', 10, 1, 1,
   'Final Detailing', 'Professional cleaning and detailing', 90, 0, 1),
  ('stage-011', (SELECT id FROM shops LIMIT 1), 'Final Inspection', 'FINAL_INSPECT', 'quality', 'delivery', 11, 1, 1,
   'Final Inspection', 'Pre-delivery inspection and sign-off', 30, 1, 1),
  ('stage-012', (SELECT id FROM shops LIMIT 1), 'Ready for Pickup', 'READY', 'customer_interaction', 'delivery', 12, 1, 1,
   'Ready for Pickup', 'Vehicle ready for customer pickup', 0, 0, 1);

-- Default Communication Templates
INSERT OR IGNORE INTO communication_templates (
  id, shopId, templateName, templateCode, category, channels, preferredChannel,
  smsTemplate, emailSubject, emailTemplate, status, isDefault
) VALUES
  ('comm-001', (SELECT id FROM shops LIMIT 1), 'Job Status Update', 'STATUS_UPDATE', 'status_update', 
   '["sms","email"]', 'sms',
   'Hi {{customerName}}, your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} (Job #{{jobNumber}}) has moved to {{stageName}}. Expected completion: {{expectedDate}}. Questions? Call us!',
   'Update on Your Vehicle Repair - Job #{{jobNumber}}',
   'Dear {{customerName}},\n\nWe wanted to update you on the progress of your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}.\n\nJob Number: {{jobNumber}}\nCurrent Stage: {{stageName}}\nExpected Completion: {{expectedDate}}\n\nIf you have any questions, please don''t hesitate to contact us.\n\nBest regards,\n{{shopName}}',
   'active', 1),
   
  ('comm-002', (SELECT id FROM shops LIMIT 1), 'Vehicle Ready for Pickup', 'PICKUP_READY', 'pickup_ready',
   '["sms","phone"]', 'phone',
   'Great news! Your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} is ready for pickup! Job #{{jobNumber}} completed. Please call to schedule pickup: {{shopPhone}}',
   'Your Vehicle is Ready for Pickup!',
   'Dear {{customerName}},\n\nExcellent news! Your vehicle repair has been completed and your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} is ready for pickup.\n\nJob Number: {{jobNumber}}\nCompletion Date: {{completionDate}}\nTotal Amount: ${{totalAmount}}\n\nPlease call us at {{shopPhone}} to schedule a convenient pickup time.\n\nThank you for choosing {{shopName}}!\n\nBest regards,\nThe {{shopName}} Team',
   'active', 1),
   
  ('comm-003', (SELECT id FROM shops LIMIT 1), 'Parts Delay Notification', 'PARTS_DELAY', 'delay_notification',
   '["sms","email"]', 'email',
   'Hi {{customerName}}, we''re experiencing a delay with parts for your {{vehicleYear}} {{vehicleMake}} (Job #{{jobNumber}}). New estimated completion: {{newExpectedDate}}. We apologize for the inconvenience.',
   'Repair Delay Update - Job #{{jobNumber}}',
   'Dear {{customerName}},\n\nWe wanted to inform you of a delay in your vehicle repair due to parts availability.\n\nJob Number: {{jobNumber}}\nVehicle: {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}\nOriginal Expected Date: {{originalExpectedDate}}\nNew Expected Date: {{newExpectedDate}}\n\nReason: {{delayReason}}\n\nWe sincerely apologize for this inconvenience and are working diligently to expedite the repair process.\n\nIf you have any questions or concerns, please contact us at {{shopPhone}}.\n\nBest regards,\n{{shopName}}',
   'active', 1);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- Create additional indexes for common queries
-- =============================================================================

-- Job-related performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs(status, priority);
CREATE INDEX IF NOT EXISTS idx_jobs_delivery_date ON jobs(targetDeliveryDate);
CREATE INDEX IF NOT EXISTS idx_jobs_check_in_date ON jobs(checkInDate);

-- Communication analytics indexes
CREATE INDEX IF NOT EXISTS idx_communication_log_engagement ON communication_log(wasOpened, wasClicked, responseReceived);
CREATE INDEX IF NOT EXISTS idx_communication_log_automation ON communication_log(isAutomated, automationRuleId);

-- Financial reporting indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_period ON financial_transactions(transactionDate, amount, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reconciliation ON financial_transactions(isReconciled, reconciledDate);

-- Performance tracking indexes
CREATE INDEX IF NOT EXISTS idx_technician_performance_metrics ON technician_performance(overallScore, qualityScore, utilizationRate);

-- =============================================================================
-- MIGRATION COMPLETION
-- Update schema version and log migration
-- =============================================================================

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES ('20250828_imex_level_enhancements', CURRENT_TIMESTAMP);

-- Update database version
PRAGMA user_version = 3;