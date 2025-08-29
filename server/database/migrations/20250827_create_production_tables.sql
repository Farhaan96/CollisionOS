-- CollisionOS Production Database Schema Migration
-- Created: 2025-08-27
-- Purpose: Create all production-ready tables for collision repair shop management

-- Set up transaction for rollback capability
BEGIN;

-- Enable foreign key constraints (SQLite specific)
PRAGMA foreign_keys = ON;

-- Create BMS Import History Table
CREATE TABLE IF NOT EXISTS bms_imports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    fileName TEXT NOT NULL,
    fileType TEXT CHECK(fileType IN ('EMS', 'BMS', 'CSV', 'XML', 'JSON')) DEFAULT 'BMS',
    fileSize INTEGER,
    originalFileName TEXT,
    filePath TEXT,
    importDate TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT CHECK(status IN ('pending', 'processing', 'success', 'failed', 'partial', 'cancelled')) DEFAULT 'pending',
    parsedData TEXT, -- JSON
    errorLog TEXT, -- JSON
    createdBy TEXT NOT NULL,
    estimateId TEXT,
    jobId TEXT,
    totalRecords INTEGER DEFAULT 0,
    processedRecords INTEGER DEFAULT 0,
    errorRecords INTEGER DEFAULT 0,
    skippedRecords INTEGER DEFAULT 0,
    processingStarted TEXT,
    processingCompleted TEXT,
    processingDuration INTEGER,
    dataMapping TEXT, -- JSON
    validationErrors TEXT, -- JSON
    bmsVersion TEXT,
    bmsProvider TEXT,
    backupData TEXT, -- JSON
    canRollback INTEGER DEFAULT 0,
    rolledBack INTEGER DEFAULT 0,
    rollbackDate TEXT,
    metadata TEXT, -- JSON
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (estimateId) REFERENCES estimates(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id)
);

-- Create Estimates Table
CREATE TABLE IF NOT EXISTS estimates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    estimateNumber TEXT NOT NULL UNIQUE,
    customerId TEXT NOT NULL,
    vehicleId TEXT NOT NULL,
    insuranceCompanyId TEXT,
    claimNumber TEXT,
    dateOfLoss TEXT,
    estimateTotal REAL DEFAULT 0.00,
    partsTotal REAL DEFAULT 0.00,
    laborTotal REAL DEFAULT 0.00,
    paintTotal REAL DEFAULT 0.00,
    subletTotal REAL DEFAULT 0.00,
    materialTotal REAL DEFAULT 0.00,
    otherTotal REAL DEFAULT 0.00,
    taxTotal REAL DEFAULT 0.00,
    deductible REAL DEFAULT 0.00,
    status TEXT CHECK(status IN ('draft', 'pending_review', 'under_review', 'approved', 'rejected', 'revised', 'supplements_required', 'converted_to_job')) DEFAULT 'draft',
    estimateType TEXT CHECK(estimateType IN ('collision', 'hail', 'vandalism', 'theft', 'flood', 'mechanical', 'glass', 'paint', 'other')) DEFAULT 'collision',
    isDRP INTEGER DEFAULT 0,
    drpProgram TEXT,
    adjusterId TEXT,
    adjusterName TEXT,
    adjusterPhone TEXT,
    adjusterEmail TEXT,
    damageType TEXT CHECK(damageType IN ('minor', 'moderate', 'major', 'severe', 'total_loss')),
    damageDescription TEXT,
    repairDescription TEXT,
    estimateDate TEXT NOT NULL DEFAULT (datetime('now')),
    expirationDate TEXT,
    approvalDate TEXT,
    rejectionDate TEXT,
    supplementCount INTEGER DEFAULT 0,
    supplementTotal REAL DEFAULT 0.00,
    lastSupplementDate TEXT,
    customerApproval INTEGER DEFAULT 0,
    customerApprovalDate TEXT,
    insuranceApproval INTEGER DEFAULT 0,
    insuranceApprovalDate TEXT,
    reviewNotes TEXT,
    rejectionReason TEXT,
    revisionNotes TEXT,
    revisionCount INTEGER DEFAULT 0,
    photosRequired INTEGER DEFAULT 1,
    photosTaken INTEGER DEFAULT 0,
    photosCount INTEGER DEFAULT 0,
    createdBy TEXT NOT NULL,
    updatedBy TEXT,
    approvedBy TEXT,
    notes TEXT,
    internalNotes TEXT,
    customerNotes TEXT,
    tags TEXT, -- JSON
    metadata TEXT, -- JSON
    customFields TEXT, -- JSON
    convertedToJob INTEGER DEFAULT 0,
    jobId TEXT,
    conversionDate TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
    FOREIGN KEY (insuranceCompanyId) REFERENCES insurance_companies(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id)
);

-- Create Estimate Line Items Table
CREATE TABLE IF NOT EXISTS estimate_line_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    estimateId TEXT NOT NULL,
    lineNumber INTEGER NOT NULL,
    type TEXT CHECK(type IN ('part', 'labor', 'paint', 'material', 'sublet', 'other', 'tax', 'discount')) NOT NULL,
    category TEXT CHECK(category IN ('body', 'frame', 'mechanical', 'electrical', 'glass', 'interior', 'exterior', 'paint', 'refinish', 'other')),
    operationCode TEXT,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1.00,
    unitPrice REAL DEFAULT 0.00,
    totalPrice REAL DEFAULT 0.00,
    partNumber TEXT,
    partDescription TEXT,
    partType TEXT CHECK(partType IN ('OEM', 'Aftermarket', 'Used', 'Reconditioned', 'Generic')),
    vendorId TEXT,
    vendorPartNumber TEXT,
    laborHours REAL,
    laborRate REAL,
    laborType TEXT CHECK(laborType IN ('body', 'paint', 'frame', 'mechanical', 'electrical', 'glass', 'detail', 'other')),
    skillLevel TEXT CHECK(skillLevel IN ('apprentice', 'journeyman', 'expert', 'master')),
    paintCode TEXT,
    paintType TEXT CHECK(paintType IN ('basecoat', 'clearcoat', 'primer', 'sealer', 'adhesion_promoter', 'other')),
    coverage REAL,
    coats INTEGER,
    listPrice REAL,
    cost REAL,
    markup REAL,
    discount REAL,
    discountAmount REAL DEFAULT 0.00,
    taxable INTEGER DEFAULT 1,
    taxRate REAL,
    taxAmount REAL DEFAULT 0.00,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'on_hold', 'supplement')) DEFAULT 'pending',
    approvalRequired INTEGER DEFAULT 0,
    approvedBy TEXT,
    approvalDate TEXT,
    includedInOriginal INTEGER DEFAULT 1,
    supplementNumber INTEGER,
    isSublet INTEGER DEFAULT 0,
    subletVendorId TEXT,
    isRandI INTEGER DEFAULT 0,
    removeTime REAL,
    installTime REAL,
    isRefinish INTEGER DEFAULT 0,
    refinishHours REAL,
    notes TEXT,
    internalNotes TEXT,
    metadata TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (estimateId) REFERENCES estimates(id),
    FOREIGN KEY (vendorId) REFERENCES vendors(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id),
    FOREIGN KEY (subletVendorId) REFERENCES vendors(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create Insurance Companies Table
CREATE TABLE IF NOT EXISTS insurance_companies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type TEXT CHECK(type IN ('auto', 'commercial', 'specialty', 'self_insured', 'other')) DEFAULT 'auto',
    address TEXT,
    city TEXT,
    state TEXT,
    zipCode TEXT,
    country TEXT DEFAULT 'Canada',
    phone TEXT,
    fax TEXT,
    email TEXT,
    website TEXT,
    isDRP INTEGER DEFAULT 0,
    drpNumber TEXT,
    drpStartDate TEXT,
    drpEndDate TEXT,
    drpDiscount REAL,
    contactPerson TEXT,
    contactTitle TEXT,
    contactPhone TEXT,
    contactEmail TEXT,
    claimsPhone TEXT,
    claimsEmail TEXT,
    claimsFax TEXT,
    claimsAddress TEXT,
    paymentTerms TEXT CHECK(paymentTerms IN ('immediate', 'net_15', 'net_30', 'net_45', 'net_60')) DEFAULT 'net_30',
    preferredPaymentMethod TEXT CHECK(preferredPaymentMethod IN ('check', 'ach', 'wire', 'credit_card', 'other')) DEFAULT 'check',
    taxId TEXT,
    billingAddress TEXT,
    billingContact TEXT,
    billingPhone TEXT,
    billingEmail TEXT,
    requiresPhotos INTEGER DEFAULT 1,
    requiresEstimate INTEGER DEFAULT 1,
    requiresApproval INTEGER DEFAULT 1,
    approvalLimit REAL,
    supplementApprovalRequired INTEGER DEFAULT 1,
    preferredPartsType TEXT CHECK(preferredPartsType IN ('OEM', 'Aftermarket', 'Used', 'Any')) DEFAULT 'Any',
    allowsUsedParts INTEGER DEFAULT 1,
    allowsAftermarketParts INTEGER DEFAULT 1,
    bodyLaborRate REAL,
    paintLaborRate REAL,
    frameLaborRate REAL,
    mechanicalLaborRate REAL,
    glasslaborRate REAL,
    providesRentalCar INTEGER DEFAULT 0,
    rentalCarLimit REAL,
    rentalCarDaysLimit INTEGER,
    avgDeductible REAL,
    coversRental INTEGER DEFAULT 0,
    coversTowing INTEGER DEFAULT 0,
    avgPaymentDays INTEGER,
    totalClaims INTEGER DEFAULT 0,
    totalClaimsValue REAL DEFAULT 0.00,
    avgClaimValue REAL,
    customerServiceRating REAL,
    paymentRating REAL,
    overallRating REAL,
    relationshipStatus TEXT CHECK(relationshipStatus IN ('excellent', 'good', 'fair', 'poor', 'problematic')) DEFAULT 'good',
    isActive INTEGER DEFAULT 1,
    lastClaimDate TEXT,
    lastPaymentDate TEXT,
    specialInstructions TEXT,
    claimsProcedure TEXT,
    notes TEXT,
    internalNotes TEXT,
    hasOnlinePortal INTEGER DEFAULT 0,
    portalUrl TEXT,
    portalUsername TEXT,
    apiIntegration INTEGER DEFAULT 0,
    ediCapable INTEGER DEFAULT 0,
    requiredCertifications TEXT, -- JSON
    complianceNotes TEXT,
    metadata TEXT, -- JSON
    tags TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create Parts Orders Table
CREATE TABLE IF NOT EXISTS parts_orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    orderNumber TEXT NOT NULL UNIQUE,
    jobId TEXT NOT NULL,
    estimateId TEXT,
    vendorId TEXT NOT NULL,
    orderDate TEXT NOT NULL DEFAULT (datetime('now')),
    requestedDate TEXT,
    promisedDate TEXT,
    expectedDate TEXT,
    shippedDate TEXT,
    receivedDate TEXT,
    status TEXT CHECK(status IN ('draft', 'pending', 'sent', 'confirmed', 'in_production', 'shipped', 'partially_received', 'received', 'backordered', 'cancelled', 'returned')) DEFAULT 'draft',
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent', 'rush')) DEFAULT 'normal',
    subtotal REAL DEFAULT 0.00,
    taxAmount REAL DEFAULT 0.00,
    shippingAmount REAL DEFAULT 0.00,
    handlingAmount REAL DEFAULT 0.00,
    discountAmount REAL DEFAULT 0.00,
    totalAmount REAL DEFAULT 0.00,
    shippingMethod TEXT CHECK(shippingMethod IN ('pickup', 'standard', 'expedited', 'overnight', 'freight', 'delivery', 'other')) DEFAULT 'standard',
    trackingNumber TEXT,
    carrier TEXT,
    shippingAddress TEXT,
    vendorOrderNumber TEXT,
    vendorContact TEXT,
    vendorPhone TEXT,
    vendorEmail TEXT,
    paymentTerms TEXT CHECK(paymentTerms IN ('cod', 'net_15', 'net_30', 'net_60', 'prepaid', 'credit_card', 'account')) DEFAULT 'account',
    paymentStatus TEXT CHECK(paymentStatus IN ('unpaid', 'partial', 'paid', 'overdue', 'disputed')) DEFAULT 'unpaid',
    paymentDate TEXT,
    paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'check', 'credit_card', 'ach', 'wire', 'account_credit', 'other')),
    specialInstructions TEXT,
    notes TEXT,
    internalNotes TEXT,
    receivingNotes TEXT,
    requiresApproval INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 0,
    approvedBy TEXT,
    approvalDate TEXT,
    approvalLimit REAL,
    inspectionRequired INTEGER DEFAULT 0,
    inspectionCompleted INTEGER DEFAULT 0,
    inspectionDate TEXT,
    inspectedBy TEXT,
    qualityIssues TEXT,
    hasReturns INTEGER DEFAULT 0,
    returnReason TEXT,
    returnDate TEXT,
    returnAmount REAL DEFAULT 0.00,
    createdBy TEXT NOT NULL,
    updatedBy TEXT,
    sentBy TEXT,
    receivedBy TEXT,
    metadata TEXT, -- JSON
    tags TEXT, -- JSON
    isArchived INTEGER DEFAULT 0,
    archivedDate TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (estimateId) REFERENCES estimates(id),
    FOREIGN KEY (vendorId) REFERENCES vendors(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id),
    FOREIGN KEY (inspectedBy) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id),
    FOREIGN KEY (sentBy) REFERENCES users(id),
    FOREIGN KEY (receivedBy) REFERENCES users(id)
);

-- Create Parts Order Items Table
CREATE TABLE IF NOT EXISTS parts_order_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    partsOrderId TEXT NOT NULL,
    partId TEXT,
    estimateLineItemId TEXT,
    lineNumber INTEGER NOT NULL,
    partNumber TEXT NOT NULL,
    vendorPartNumber TEXT,
    description TEXT NOT NULL,
    partType TEXT CHECK(partType IN ('OEM', 'Aftermarket', 'Used', 'Reconditioned', 'Generic')) DEFAULT 'OEM',
    category TEXT CHECK(category IN ('body', 'frame', 'mechanical', 'electrical', 'glass', 'interior', 'exterior', 'paint', 'hardware', 'other')),
    quantityOrdered REAL DEFAULT 1.00,
    quantityReceived REAL DEFAULT 0.00,
    quantityBackordered REAL DEFAULT 0.00,
    quantityReturned REAL DEFAULT 0.00,
    unitCost REAL DEFAULT 0.00,
    listPrice REAL,
    discount REAL DEFAULT 0.00,
    discountAmount REAL DEFAULT 0.00,
    totalCost REAL DEFAULT 0.00,
    core REAL DEFAULT 0.00,
    status TEXT CHECK(status IN ('pending', 'ordered', 'confirmed', 'shipped', 'received', 'backordered', 'cancelled', 'returned', 'damaged')) DEFAULT 'pending',
    vendorName TEXT,
    vendorOrderNumber TEXT,
    vendorLineNumber TEXT,
    expectedDate TEXT,
    shippedDate TEXT,
    receivedDate TEXT,
    trackingNumber TEXT,
    binLocation TEXT,
    shelfLocation TEXT,
    warehouseLocation TEXT,
    condition TEXT CHECK(condition IN ('new', 'used', 'reconditioned', 'damaged', 'defective')) DEFAULT 'new',
    qualityGrade TEXT CHECK(qualityGrade IN ('A', 'B', 'C', 'D', 'F')),
    inspectionRequired INTEGER DEFAULT 0,
    inspectionPassed INTEGER,
    inspectionDate TEXT,
    inspectionNotes TEXT,
    warrantyMonths INTEGER,
    warrantyMiles INTEGER,
    warrantyType TEXT CHECK(warrantyType IN ('manufacturer', 'vendor', 'shop', 'none')) DEFAULT 'manufacturer',
    returnable INTEGER DEFAULT 1,
    returnDeadline TEXT,
    returnReason TEXT CHECK(returnReason IN ('wrong_part', 'damaged', 'defective', 'no_longer_needed', 'customer_change', 'warranty', 'other')),
    returnNotes TEXT,
    specialHandling INTEGER DEFAULT 0,
    handlingInstructions TEXT,
    hazardousMaterial INTEGER DEFAULT 0,
    installed INTEGER DEFAULT 0,
    installedDate TEXT,
    installedBy TEXT,
    notes TEXT,
    internalNotes TEXT,
    receivingNotes TEXT,
    metadata TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    receivedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (partsOrderId) REFERENCES parts_orders(id),
    FOREIGN KEY (partId) REFERENCES parts(id),
    FOREIGN KEY (estimateLineItemId) REFERENCES estimate_line_items(id),
    FOREIGN KEY (installedBy) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id),
    FOREIGN KEY (receivedBy) REFERENCES users(id)
);

-- Create Labor Time Entries Table
CREATE TABLE IF NOT EXISTS labor_time_entries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    technicianId TEXT NOT NULL,
    jobId TEXT NOT NULL,
    estimateLineItemId TEXT,
    clockIn TEXT NOT NULL,
    clockOut TEXT,
    breakStart TEXT,
    breakEnd TEXT,
    hoursWorked REAL,
    breakTime REAL DEFAULT 0.00,
    billableHours REAL,
    nonBillableHours REAL DEFAULT 0.00,
    overtimeHours REAL DEFAULT 0.00,
    laborType TEXT CHECK(laborType IN ('body', 'paint', 'frame', 'mechanical', 'electrical', 'glass', 'detail', 'prep', 'quality_control', 'other')) NOT NULL,
    workDescription TEXT,
    operationCode TEXT,
    status TEXT CHECK(status IN ('active', 'completed', 'on_break', 'cancelled', 'disputed')) DEFAULT 'active',
    workStatus TEXT CHECK(workStatus IN ('in_progress', 'completed', 'quality_check', 'rework_required', 'waiting_parts', 'waiting_approval', 'on_hold')) DEFAULT 'in_progress',
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    hourlyRate REAL,
    overtimeRate REAL,
    laborCost REAL,
    customerRate REAL,
    billableAmount REAL,
    qualityRating REAL,
    efficiency REAL,
    estimatedHours REAL,
    varianceHours REAL,
    requiresApproval INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 0,
    approvedBy TEXT,
    approvalDate TEXT,
    approvalNotes TEXT,
    isRework INTEGER DEFAULT 0,
    reworkReason TEXT CHECK(reworkReason IN ('quality_issue', 'damage', 'incorrect_procedure', 'parts_issue', 'customer_request', 'other')),
    originalTimeEntryId TEXT,
    reworkCount INTEGER DEFAULT 0,
    bayNumber TEXT,
    equipmentUsed TEXT, -- JSON
    toolsUsed TEXT, -- JSON
    weatherConditions TEXT,
    temperature REAL,
    humidity REAL,
    progressPercentage INTEGER DEFAULT 0,
    milestonesCompleted TEXT, -- JSON
    nextSteps TEXT,
    hasIssues INTEGER DEFAULT 0,
    issueDescription TEXT,
    delayReason TEXT CHECK(delayReason IN ('parts_delay', 'equipment_failure', 'quality_issue', 'customer_delay', 'weather', 'other')),
    delayMinutes INTEGER DEFAULT 0,
    notes TEXT,
    internalNotes TEXT,
    customerNotes TEXT,
    photosRequired INTEGER DEFAULT 0,
    photosTaken INTEGER DEFAULT 0,
    documentsAttached INTEGER DEFAULT 0,
    payrollProcessed INTEGER DEFAULT 0,
    payrollDate TEXT,
    payrollPeriod TEXT,
    metadata TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (technicianId) REFERENCES users(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (estimateLineItemId) REFERENCES estimate_line_items(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id),
    FOREIGN KEY (originalTimeEntryId) REFERENCES labor_time_entries(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    jobId TEXT,
    estimateId TEXT,
    customerId TEXT,
    vehicleId TEXT,
    partsOrderId TEXT,
    fileName TEXT NOT NULL,
    originalFileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileType TEXT CHECK(fileType IN ('image', 'video', 'document', 'audio', 'other')) NOT NULL,
    mimeType TEXT,
    fileExtension TEXT,
    fileSize INTEGER NOT NULL,
    imageWidth INTEGER,
    imageHeight INTEGER,
    thumbnailPath TEXT,
    category TEXT CHECK(category IN ('before_damage', 'after_repair', 'during_repair', 'damage_assessment', 'supplement', 'parts_received', 'quality_check', 'delivery', 'customer_signature', 'invoice', 'estimate', 'blueprint', 'authorization', 'insurance_doc', 'parts_receipt', 'warranty', 'other')) DEFAULT 'other',
    subCategory TEXT,
    title TEXT,
    description TEXT,
    tags TEXT, -- JSON
    location TEXT,
    vehiclePart TEXT,
    damageType TEXT,
    uploadDate TEXT NOT NULL DEFAULT (datetime('now')),
    takenDate TEXT,
    uploadedBy TEXT NOT NULL,
    status TEXT CHECK(status IN ('uploaded', 'processing', 'ready', 'archived', 'deleted')) DEFAULT 'uploaded',
    isRequired INTEGER DEFAULT 0,
    isPublic INTEGER DEFAULT 0,
    visibleToCustomer INTEGER DEFAULT 1,
    visibleToInsurance INTEGER DEFAULT 0,
    customerApproved INTEGER DEFAULT 0,
    insuranceApproved INTEGER DEFAULT 0,
    accessLevel TEXT CHECK(accessLevel IN ('public', 'internal', 'restricted', 'confidential')) DEFAULT 'internal',
    password TEXT,
    expirationDate TEXT,
    version INTEGER DEFAULT 1,
    parentAttachmentId TEXT,
    isLatestVersion INTEGER DEFAULT 1,
    processed INTEGER DEFAULT 0,
    processingError TEXT,
    storageProvider TEXT CHECK(storageProvider IN ('local', 'aws_s3', 'google_cloud', 'azure', 'other')) DEFAULT 'local',
    storageKey TEXT,
    storageBucket TEXT,
    backedUp INTEGER DEFAULT 0,
    backupDate TEXT,
    archived INTEGER DEFAULT 0,
    archiveDate TEXT,
    exifData TEXT, -- JSON
    gpsCoordinates TEXT, -- JSON
    cameraInfo TEXT, -- JSON
    metadata TEXT, -- JSON
    customFields TEXT, -- JSON
    notes TEXT,
    internalNotes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (estimateId) REFERENCES estimates(id),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
    FOREIGN KEY (partsOrderId) REFERENCES parts_orders(id),
    FOREIGN KEY (uploadedBy) REFERENCES users(id),
    FOREIGN KEY (parentAttachmentId) REFERENCES attachments(id)
);

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    invoiceNumber TEXT NOT NULL UNIQUE,
    jobId TEXT NOT NULL,
    customerId TEXT NOT NULL,
    vehicleId TEXT NOT NULL,
    insuranceCompanyId TEXT,
    invoiceDate TEXT NOT NULL DEFAULT (datetime('now')),
    dueDate TEXT NOT NULL,
    serviceDates TEXT, -- JSON
    subtotal REAL DEFAULT 0.00,
    laborAmount REAL DEFAULT 0.00,
    partsAmount REAL DEFAULT 0.00,
    paintAmount REAL DEFAULT 0.00,
    materialAmount REAL DEFAULT 0.00,
    subletAmount REAL DEFAULT 0.00,
    miscAmount REAL DEFAULT 0.00,
    discountAmount REAL DEFAULT 0.00,
    discountPercentage REAL,
    discountReason TEXT,
    taxAmount REAL DEFAULT 0.00,
    taxRate REAL,
    taxDetails TEXT, -- JSON
    totalAmount REAL DEFAULT 0.00,
    amountPaid REAL DEFAULT 0.00,
    amountDue REAL DEFAULT 0.00,
    paymentStatus TEXT CHECK(paymentStatus IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled', 'refunded')) DEFAULT 'unpaid',
    customerPayment REAL DEFAULT 0.00,
    insurancePayment REAL DEFAULT 0.00,
    deductible REAL DEFAULT 0.00,
    status TEXT CHECK(status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'voided')) DEFAULT 'draft',
    invoiceType TEXT CHECK(invoiceType IN ('standard', 'insurance', 'warranty', 'supplement', 'final')) DEFAULT 'standard',
    billingAddress TEXT, -- JSON
    shippingAddress TEXT, -- JSON
    paymentTerms TEXT CHECK(paymentTerms IN ('due_on_receipt', 'net_15', 'net_30', 'net_60', 'cod')) DEFAULT 'due_on_receipt',
    paymentMethods TEXT, -- JSON
    claimNumber TEXT,
    adjusterId TEXT,
    isDRP INTEGER DEFAULT 0,
    sentDate TEXT,
    viewedDate TEXT,
    firstPaymentDate TEXT,
    lastPaymentDate TEXT,
    paidInFullDate TEXT,
    lateFeeAmount REAL DEFAULT 0.00,
    interestRate REAL,
    daysOverdue INTEGER DEFAULT 0,
    printCount INTEGER DEFAULT 0,
    lastPrintDate TEXT,
    emailCount INTEGER DEFAULT 0,
    lastEmailDate TEXT,
    termsAndConditions TEXT,
    notes TEXT,
    internalNotes TEXT,
    customerNotes TEXT,
    poNumber TEXT,
    originalInvoiceId TEXT,
    revisionNumber INTEGER DEFAULT 1,
    isRevision INTEGER DEFAULT 0,
    revisionReason TEXT,
    createdBy TEXT NOT NULL,
    updatedBy TEXT,
    sentBy TEXT,
    metadata TEXT, -- JSON
    tags TEXT, -- JSON
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
    FOREIGN KEY (insuranceCompanyId) REFERENCES insurance_companies(id),
    FOREIGN KEY (originalInvoiceId) REFERENCES invoices(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id),
    FOREIGN KEY (sentBy) REFERENCES users(id)
);

-- Create Vehicle History Table
CREATE TABLE IF NOT EXISTS vehicle_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    vehicleId TEXT NOT NULL,
    jobId TEXT,
    serviceDate TEXT NOT NULL,
    serviceType TEXT CHECK(serviceType IN ('collision_repair', 'body_work', 'paint_work', 'frame_repair', 'glass_replacement', 'mechanical_repair', 'electrical_repair', 'interior_repair', 'detailing', 'inspection', 'maintenance', 'calibration', 'warranty_work', 'recall_work', 'other')) NOT NULL,
    mileage INTEGER,
    mileageVerified INTEGER DEFAULT 0,
    previousMileage INTEGER,
    mileageDifference INTEGER,
    workPerformed TEXT,
    partsReplaced TEXT, -- JSON
    laborHours REAL,
    technicianId TEXT,
    damageAreas TEXT, -- JSON
    repairMethods TEXT, -- JSON
    paintWork TEXT, -- JSON
    totalCost REAL,
    laborCost REAL,
    partsCost REAL,
    qualityRating INTEGER,
    warrantyProvided INTEGER DEFAULT 0,
    warrantyPeriod INTEGER,
    warrantyMileage INTEGER,
    warrantyExpiry TEXT,
    customerSatisfaction INTEGER,
    customerComments TEXT,
    complaintsReceived INTEGER DEFAULT 0,
    complaintDetails TEXT,
    complaintResolved INTEGER DEFAULT 0,
    followUpRequired INTEGER DEFAULT 0,
    followUpDate TEXT,
    followUpCompleted INTEGER DEFAULT 0,
    followUpNotes TEXT,
    insuranceClaim INTEGER DEFAULT 0,
    claimNumber TEXT,
    insuranceCompanyId TEXT,
    deductible REAL,
    subletWork INTEGER DEFAULT 0,
    subletVendors TEXT, -- JSON
    subletCost REAL DEFAULT 0.00,
    weatherConditions TEXT,
    temperature REAL,
    humidity REAL,
    photosTaken INTEGER DEFAULT 0,
    beforePhotos INTEGER DEFAULT 0,
    duringPhotos INTEGER DEFAULT 0,
    afterPhotos INTEGER DEFAULT 0,
    documentsGenerated INTEGER DEFAULT 0,
    recallWork INTEGER DEFAULT 0,
    recallNumbers TEXT, -- JSON
    tsbWork INTEGER DEFAULT 0,
    tsbNumbers TEXT, -- JSON
    rushJob INTEGER DEFAULT 0,
    holidayWork INTEGER DEFAULT 0,
    weekendWork INTEGER DEFAULT 0,
    overtimeRequired INTEGER DEFAULT 0,
    oesCompliant INTEGER DEFAULT 1,
    calibrationRequired INTEGER DEFAULT 0,
    calibrationCompleted INTEGER DEFAULT 0,
    calibrationCertified INTEGER DEFAULT 0,
    isReturnVisit INTEGER DEFAULT 0,
    originalServiceId TEXT,
    returnReason TEXT CHECK(returnReason IN ('warranty_issue', 'quality_concern', 'additional_damage', 'customer_request', 'insurance_requirement', 'safety_issue', 'other')),
    returnCount INTEGER DEFAULT 0,
    notes TEXT,
    internalNotes TEXT,
    metadata TEXT, -- JSON
    tags TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (technicianId) REFERENCES users(id),
    FOREIGN KEY (insuranceCompanyId) REFERENCES insurance_companies(id),
    FOREIGN KEY (originalServiceId) REFERENCES vehicle_history(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create Workflow Status Table
CREATE TABLE IF NOT EXISTS workflow_status (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shopId TEXT NOT NULL,
    jobId TEXT NOT NULL,
    stage TEXT CHECK(stage IN ('estimate', 'intake', 'disassembly', 'blueprint', 'parts_ordering', 'parts_receiving', 'body_structure', 'frame_repair', 'paint_prep', 'paint_booth', 'paint_finish', 'reassembly', 'quality_control', 'calibration', 'road_test', 'detail', 'final_inspection', 'ready_pickup', 'delivery', 'completed')) NOT NULL,
    stageOrder INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'on_hold', 'rework', 'failed')) DEFAULT 'pending',
    startedAt TEXT,
    completedAt TEXT,
    estimatedDuration INTEGER,
    actualDuration INTEGER,
    technicianId TEXT,
    assignedBy TEXT,
    assignedAt TEXT,
    bayNumber TEXT,
    equipmentUsed TEXT, -- JSON
    toolsRequired TEXT, -- JSON
    materialsUsed TEXT, -- JSON
    progressPercentage INTEGER DEFAULT 0 CHECK(progressPercentage >= 0 AND progressPercentage <= 100),
    milestones TEXT, -- JSON
    checkpoints TEXT, -- JSON
    requiresInspection INTEGER DEFAULT 0,
    inspectionCompleted INTEGER DEFAULT 0,
    inspectedBy TEXT,
    inspectionDate TEXT,
    qualityRating INTEGER,
    hasIssues INTEGER DEFAULT 0,
    issueDescription TEXT,
    issueResolved INTEGER DEFAULT 0,
    delayReason TEXT CHECK(delayReason IN ('parts_delay', 'customer_delay', 'equipment_failure', 'staff_shortage', 'weather', 'quality_issue', 'customer_change', 'insurance_delay', 'sublet_delay', 'calibration_delay', 'other')),
    delayMinutes INTEGER DEFAULT 0,
    requiresRework INTEGER DEFAULT 0,
    reworkReason TEXT CHECK(reworkReason IN ('quality_issue', 'damage_found', 'customer_request', 'insurance_requirement', 'safety_concern', 'measurement_error', 'paint_defect', 'fit_issue', 'other')),
    reworkCount INTEGER DEFAULT 0,
    originalWorkflowId TEXT,
    dependsOn TEXT, -- JSON
    blockedBy TEXT, -- JSON
    canStart INTEGER DEFAULT 1,
    customerApprovalRequired INTEGER DEFAULT 0,
    customerApproved INTEGER DEFAULT 0,
    customerNotified INTEGER DEFAULT 0,
    customerNotificationDate TEXT,
    photosRequired INTEGER DEFAULT 0,
    photosTaken INTEGER DEFAULT 0,
    documentsGenerated INTEGER DEFAULT 0,
    laborCost REAL,
    materialCost REAL,
    subletCost REAL,
    totalStageCost REAL,
    temperature REAL,
    humidity REAL,
    boothConditions TEXT, -- JSON
    specialInstructions TEXT,
    safetyRequirements TEXT, -- JSON
    certificationRequired INTEGER DEFAULT 0,
    certificationCompleted INTEGER DEFAULT 0,
    notes TEXT,
    technicianNotes TEXT,
    supervisorNotes TEXT,
    customerNotes TEXT,
    metadata TEXT, -- JSON
    createdBy TEXT,
    updatedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shopId) REFERENCES shops(id),
    FOREIGN KEY (jobId) REFERENCES jobs(id),
    FOREIGN KEY (technicianId) REFERENCES users(id),
    FOREIGN KEY (assignedBy) REFERENCES users(id),
    FOREIGN KEY (inspectedBy) REFERENCES users(id),
    FOREIGN KEY (originalWorkflowId) REFERENCES workflow_status(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_bms_imports_shop ON bms_imports(shopId);
CREATE INDEX IF NOT EXISTS idx_bms_imports_status ON bms_imports(status);
CREATE INDEX IF NOT EXISTS idx_bms_imports_date ON bms_imports(importDate);

CREATE INDEX IF NOT EXISTS idx_estimates_shop ON estimates(shopId);
CREATE INDEX IF NOT EXISTS idx_estimates_customer ON estimates(customerId);
CREATE INDEX IF NOT EXISTS idx_estimates_vehicle ON estimates(vehicleId);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_number ON estimates(estimateNumber);

CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate ON estimate_line_items(estimateId);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_type ON estimate_line_items(type);

CREATE INDEX IF NOT EXISTS idx_insurance_companies_shop ON insurance_companies(shopId);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_name ON insurance_companies(name);

CREATE INDEX IF NOT EXISTS idx_parts_orders_shop ON parts_orders(shopId);
CREATE INDEX IF NOT EXISTS idx_parts_orders_job ON parts_orders(jobId);
CREATE INDEX IF NOT EXISTS idx_parts_orders_vendor ON parts_orders(vendorId);
CREATE INDEX IF NOT EXISTS idx_parts_orders_status ON parts_orders(status);

CREATE INDEX IF NOT EXISTS idx_parts_order_items_order ON parts_order_items(partsOrderId);
CREATE INDEX IF NOT EXISTS idx_parts_order_items_part ON parts_order_items(partId);

CREATE INDEX IF NOT EXISTS idx_labor_time_entries_shop ON labor_time_entries(shopId);
CREATE INDEX IF NOT EXISTS idx_labor_time_entries_technician ON labor_time_entries(technicianId);
CREATE INDEX IF NOT EXISTS idx_labor_time_entries_job ON labor_time_entries(jobId);
CREATE INDEX IF NOT EXISTS idx_labor_time_entries_date ON labor_time_entries(clockIn);

CREATE INDEX IF NOT EXISTS idx_attachments_shop ON attachments(shopId);
CREATE INDEX IF NOT EXISTS idx_attachments_job ON attachments(jobId);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(fileType);
CREATE INDEX IF NOT EXISTS idx_attachments_category ON attachments(category);

CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shopId);
CREATE INDEX IF NOT EXISTS idx_invoices_job ON invoices(jobId);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customerId);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_shop ON vehicle_history(shopId);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle ON vehicle_history(vehicleId);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_date ON vehicle_history(serviceDate);

CREATE INDEX IF NOT EXISTS idx_workflow_status_shop ON workflow_status(shopId);
CREATE INDEX IF NOT EXISTS idx_workflow_status_job ON workflow_status(jobId);
CREATE INDEX IF NOT EXISTS idx_workflow_status_stage ON workflow_status(stage);
CREATE INDEX IF NOT EXISTS idx_workflow_status_technician ON workflow_status(technicianId);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_bms_imports_timestamp 
AFTER UPDATE ON bms_imports 
FOR EACH ROW 
BEGIN 
    UPDATE bms_imports SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_estimates_timestamp 
AFTER UPDATE ON estimates 
FOR EACH ROW 
BEGIN 
    UPDATE estimates SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_estimate_line_items_timestamp 
AFTER UPDATE ON estimate_line_items 
FOR EACH ROW 
BEGIN 
    UPDATE estimate_line_items SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_insurance_companies_timestamp 
AFTER UPDATE ON insurance_companies 
FOR EACH ROW 
BEGIN 
    UPDATE insurance_companies SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_parts_orders_timestamp 
AFTER UPDATE ON parts_orders 
FOR EACH ROW 
BEGIN 
    UPDATE parts_orders SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_parts_order_items_timestamp 
AFTER UPDATE ON parts_order_items 
FOR EACH ROW 
BEGIN 
    UPDATE parts_order_items SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_labor_time_entries_timestamp 
AFTER UPDATE ON labor_time_entries 
FOR EACH ROW 
BEGIN 
    UPDATE labor_time_entries SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_attachments_timestamp 
AFTER UPDATE ON attachments 
FOR EACH ROW 
BEGIN 
    UPDATE attachments SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp 
AFTER UPDATE ON invoices 
FOR EACH ROW 
BEGIN 
    UPDATE invoices SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_vehicle_history_timestamp 
AFTER UPDATE ON vehicle_history 
FOR EACH ROW 
BEGIN 
    UPDATE vehicle_history SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

CREATE TRIGGER IF NOT EXISTS update_workflow_status_timestamp 
AFTER UPDATE ON workflow_status 
FOR EACH ROW 
BEGIN 
    UPDATE workflow_status SET updatedAt = datetime('now') WHERE id = NEW.id; 
END;

COMMIT;

-- Create a validation view to check for orphaned records
CREATE VIEW IF NOT EXISTS database_integrity_check AS
SELECT 
    'estimates' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN customerId NOT IN (SELECT id FROM customers) THEN 1 END) as orphaned_customers,
    COUNT(CASE WHEN vehicleId NOT IN (SELECT id FROM vehicles) THEN 1 END) as orphaned_vehicles
FROM estimates
UNION ALL
SELECT 
    'jobs' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN customerId NOT IN (SELECT id FROM customers) THEN 1 END) as orphaned_customers,
    COUNT(CASE WHEN vehicleId NOT IN (SELECT id FROM vehicles) THEN 1 END) as orphaned_vehicles
FROM jobs
UNION ALL
SELECT 
    'parts_orders' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN jobId NOT IN (SELECT id FROM jobs) THEN 1 END) as orphaned_jobs,
    COUNT(CASE WHEN vendorId NOT IN (SELECT id FROM vendors) THEN 1 END) as orphaned_vendors
FROM parts_orders;