/**
 * BMS → Jobs + Vehicles + Customers + Parts Import Script
 * Fixed to preserve job stage/status and properly count parts
 * 
 * @version 3.2-patched
 * @requires recordId - Airtable record ID from trigger
 */

/* ============================================================================
   MAIN SCRIPT
============================================================================ */

async function main() {
  const recordId = input.config().recordId;
  if (!recordId) {
    output.set("status", "Error");
    output.set("notes", "Input 'recordId' not mapped.");
    return;
  }
  
  // Load tables
  const tables = {
    bms: base.getTable(TABLES.BMS),
    jobs: base.getTable(TABLES.JOBS),
    vehicles: base.getTable(TABLES.VEHICLES),
    customers: null,
    damageLines: null,
    partsCatalog: null
  };
  
  // Try to find customers table
  try {
    tables.customers = base.getTable(TABLES.CUSTOMERS);
  } catch (_) {
    if (typeof base.getTables === 'function') {
      try {
        const guess = (base.getTables?.() || base.tables || [])
          .find(t => /\bcustomers?\b/i.test(t.name));
        if (guess) tables.customers = guess;
      } catch (_) {}
    }
  }
  
  // Try to load damage lines table
  try {
    tables.damageLines = base.getTable(TABLES.BMS_LINES);
  } catch (_) {
    console.log("BMS Damage Lines table not found - skipping line item import");
  }
  
  // Try to load parts catalog table
  try {
    tables.partsCatalog = base.getTable(TABLES.PARTS_CATALOG);
  } catch (_) {
    console.log("Parts Catalog table not found - skipping parts catalog integration");
  }
  
  // Map field names
  const fieldNames = {
    bmsFile: FieldMapper.getFieldName(tables.bms, FIELD_CANDIDATES.bmsFile),
    jobs: FieldMapper.mapTableFields(tables.jobs, FIELD_CANDIDATES.jobs),
    vehicles: FieldMapper.mapTableFields(tables.vehicles, FIELD_CANDIDATES.vehicles),
    customers: tables.customers ? 
      FieldMapper.mapTableFields(tables.customers, FIELD_CANDIDATES.customers) : {},
    damageLines: tables.damageLines ? 
      FieldMapper.mapTableFields(tables.damageLines, FIELD_CANDIDATES.damageLines) : {},
    partsCatalog: tables.partsCatalog ? 
      FieldMapper.mapTableFields(tables.partsCatalog, FIELD_CANDIDATES.partsCatalog) : {}
  };

  // Force key identifiers to writable text fields to avoid create failures (PATCH)
  for (const k of ["ro", "claim", "policy", "estimateNo"]) {
    fieldNames.jobs[k] = FieldMapper.preferWritableTextField(
      tables.jobs,
      fieldNames.jobs[k],
      FIELD_CANDIDATES.jobs[k]
    );
  }
  
  // Optimize field mappings
  fieldNames.jobs.customerLink = FieldMapper.preferLinkField(
    tables.jobs, 
    fieldNames.jobs.customerLink, 
    FIELD_CANDIDATES.jobs.customerLink
  );
  fieldNames.jobs.vehicleLink = FieldMapper.preferLinkField(
    tables.jobs, 
    fieldNames.jobs.vehicleLink, 
    FIELD_CANDIDATES.jobs.vehicleLink
  );
  
  const monetaryFields = [
    'severity', 'labour', 'parts', 'sublet', 'materials', 'ats', 'deductible',
    // Added amounts for customer responsibility
    'gstOwedAmount', 'pstOwedAmount'
  ];
  for (const field of monetaryFields) {
    fieldNames.jobs[field] = FieldMapper.preferNumericField(
      tables.jobs,
      fieldNames.jobs[field],
      FIELD_CANDIDATES.jobs[field]
    );
  }
  
  // Fetch BMS record and XML
  const bmsRecord = await tables.bms.selectRecordAsync(recordId);
  if (!bmsRecord) {
    output.set("status", "Error");
    output.set("notes", `Record not found for ID '${recordId}'.`);
    return;
  }
  
  if (!fieldNames.bmsFile) {
    output.set("status", "Error");
    output.set("notes", "Could not find the 'BMS XML' field in 'BMS Uploads'.");
    return;
  }
  
  // Get attachment (XML or PDF)
  const cellValue = bmsRecord.getCellValue(fieldNames.bmsFile) || [];
  const files = Array.isArray(cellValue)
    ? cellValue.filter(a =>
        (/\.xml$/i.test(a.filename || a.name || "")) ||
        ((a.type || a.mimetype || "").includes("xml")) ||
        (/\.pdf$/i.test(a.filename || a.name || "")) ||
        ((a.type || a.mimetype || "").includes("pdf"))
      )
    : [];
  
  const attachment = files[files.length - 1] || null;
  if (!attachment) {
    output.set("status", "Error");
    output.set("notes", `No XML file attached in '${fieldNames.bmsFile}'.`);
    return;
  }
  
  const usedFile = attachment.filename || attachment.name || "(unnamed)";
  const isPdf = /\.pdf$/i.test(usedFile) || ((attachment.type || attachment.mimetype || "").includes("pdf"));
  let xml = null, pdfText = null;
  if (isPdf) {
    const ab = await (await fetch(attachment.url)).arrayBuffer();
    pdfText = PDFUtils.toText(new Uint8Array(ab));
  } else {
    xml = await (await fetch(attachment.url)).text();
  }
  
  // Initialize parser and extractor when XML
  const parser = xml ? new XMLParser(xml) : null;
  const extractor = xml ? new DataExtractor(parser) : null;
  
  // Extract XML blocks (XML only)
  const xmlBlocks = xml ? {
    vehicleDesc: parser.blockPath(xml, ["VehicleInfo", "VehicleDesc"]),
    license: parser.blockPath(xml, ["VehicleInfo", "License"]),
    vin: parser.blockPath(xml, ["VehicleInfo", "VINInfo", "VIN"]),
    paintExt: parser.blockPath(xml, ["VehicleInfo", "Paint", "Exterior"]),
    paintInt: parser.blockPath(xml, ["VehicleInfo", "Paint", "Interior"]),
    owner: parser.blockPath(xml, ["AdminInfo", "Owner"]) ||
           parser.blockPath(xml, ["ClaimInfo", "OwnerInfo", "Owner"]) ||
           parser.block(xml, "Owner") || 
           parser.block(xml, "PolicyHolder") || 
           parser.block(xml, "Insured") || "",
    adjuster: parser.block(xml, "Adjuster") || 
              parser.block(xml, "InsuranceAdjuster") || ""
  } : null;
  
  // Extract core data with enhanced extraction
  const ro = xml ? extractor.extractRO() : PDFExtractor.extractRO(pdfText);
  
  // Enhanced claim number extraction - try multiple locations (PATCH)
  let claim = xml
    ? (parser.pick(xml, ["ClaimNumber", "ClaimNum", "ClaimNo", "RefClaimNum", "ClaimRefNum"]) ||
       parser.pickIn(xml, ["ClaimInfo"], ["ClaimNumber", "ClaimNum", "ClaimNo", "RefClaimNum", "ClaimRefNum"]) ||
       parser.pickIn(xml, ["AdminInfo"], ["ClaimNumber", "ClaimNum", "ClaimNo", "RefClaimNum", "ClaimRefNum"]))
    : PDFExtractor.pickClaim(pdfText);
  if (!claim) {
    const claimMatch = xml.match(/<(?:\w+:)?(?:ClaimNumber|ClaimNum|ClaimNo|RefClaimNum|ClaimRefNum)[^>]*>([^<]+)</i);
    if (claimMatch) claim = claimMatch[1].trim();
  }
  
  // Also extract PolicyNum
  let policy = xml
    ? (parser.pick(xml, ["PolicyNumber", "PolicyNum", "PolicyNo"]) ||
       parser.pickIn(xml, ["ClaimInfo", "PolicyInfo"], ["PolicyNumber", "PolicyNum", "PolicyNo"]))
    : PDFExtractor.pickPolicy(pdfText);
  
  const estimateNo = xml ? parser.pick(xml, ["EstimateNum", "EstimateID", "WorkfileID", "DocumentID"]) : PDFExtractor.pickEstimateNo(pdfText);
  let insurer = xml ? extractor.extractInsurer() : PDFExtractor.pickInsurer(pdfText);
  
  // Log extraction results for debugging - with actual values from this file
  console.log("XML Extraction Results:");
  console.log("- RO from memo:", ro || "(not found)");
  console.log("- Claim:", claim || "(not found)");
  console.log("- Policy:", policy || "(not found)"); 
  console.log("- Estimate:", estimateNo || "(not found)");
  console.log("- Insurer:", insurer || "(not found)");
  
  // Additional debug: Check what fields are actually mapped in Jobs table
  if (tables.jobs) {
    console.log("\nJobs table field mappings:");
    console.log("- RO field:", fieldNames.jobs.ro || "(NOT MAPPED - check field exists)");
    console.log("- Claim field:", fieldNames.jobs.claim || "(NOT MAPPED - check field exists)");
    console.log("- Policy field:", fieldNames.jobs.policy || "(NOT MAPPED - check field exists)");
  }
  
  // Extract dates
  const loss = xml
    ? (parser.pickIn(xml, ["ClaimInfo", "LossInfo", "Facts"], ["LossDateTime", "LossDate", "LossDt"]) ||
       parser.pick(xml, ["LossDateTime", "LossDate", "LossDt", "Date of Loss"]))
    : PDFExtractor.pickLossDate(pdfText);
  const estimateDate = xml
    ? (parser.pickIn(xml, ["DocumentInfo"], ["CreateDateTime", "CreateDate"]) ||
       parser.pickIn(xml, ["EventInfo", "EstimateEvent"], ["CommitDateTime"]) ||
       parser.pick(xml, ["EstimateDate", "CreateDateTime", "CreateDate"]))
    : PDFExtractor.pickEstimateDate(pdfText);
  const estimateVer = xml ? parser.pick(xml, ["Version", "Rev", "Revision"]) : "";
  
  // Extract supplement number if present
  const supplementNum = xml ? (Utils.toNumber(parser.pick(xml, ["SupplementNum", "Supplement", "SupplementNumber"])) || 0) : 0;
  
  // Extract vehicle data
  const vehicleData = xml
    ? {
        vin: parser.pickIn(xml, ["VehicleInfo", "VINInfo", "VIN"], ["VINNum", "VINNumber", "VIN"]) ||
             parser.pick(xml, ["VINNum", "VINNumber", "VIN"]),
        year: Utils.toNumber(
          parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["ModelYear", "Year"]) ||
          parser.pick(xml, ["ModelYear", "Year"])
        ) || null,
        make: parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["MakeDesc", "Make", "MakeName", "VehMake", "VehicleMake"]) ||
              parser.pick(xml, ["MakeDesc", "Make", "MakeName", "VehMake", "VehicleMake"]),
        model: parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["ModelName", "Model", "ModelDesc", "VehModel", "VehicleModel"]) ||
               parser.pick(xml, ["ModelName", "Model", "ModelDesc", "VehModel", "VehicleModel"]),
        submodel: parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["SubModelDesc", "SubModel", "Trim", "BodyStyle"]) ||
                  parser.pick(xml, ["SubModelDesc", "SubModel", "Trim", "BodyStyle"]),
        bodyStyle: parser.pickIn(xml, ["VehicleInfo", "Body"], ["BodyStyle"]) ||
                   parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["BodyStyle"]) || "",
        productionDate: parser.pickIn(xml, ["VehicleInfo", "VehicleDesc"], ["ProductionDate"]) || "",
        odometer: Utils.toNumber(
          parser.pickIn(xml, ["VehicleInfo", "VehicleDesc", "OdometerInfo"], ["OdometerReading", "OdomReading", "Odometer", "Odo"]) ||
          parser.pick(xml, ["OdometerReading", "OdomReading", "Odometer", "Odo"])
        ) || null,
        plate: parser.pickIn(xml, ["VehicleInfo", "License"], ["LicensePlateNum", "LicPlateNum", "Plate", "LicensePlate", "PlateNum", "LicenseNo", "LicenseNum"]) ||
               parser.pick(xml, ["LicensePlateNum", "LicPlateNum", "Plate", "LicensePlate", "PlateNum", "LicenseNo", "LicenseNum"]),
        province: parser.pickIn(xml, ["VehicleInfo", "License"], ["LicensePlateStateProvince", "StateProvince", "StateProv", "Province", "Prov"]) ||
                  parser.pick(xml, ["LicensePlateStateProvince", "StateProvince", "StateProv", "Province", "Prov"]),
        color: (xmlBlocks && (parser.pick(xmlBlocks.paintExt, ["ColorName", "ColorDesc", "Color"]) ||
               parser.pick(xmlBlocks.paintInt, ["ColorName", "ColorDesc", "Color"])) ) ||
               parser.pick(xml, ["ExteriorColor", "ColorName", "ColorDesc", "Color", "PaintColor"]),
        drivable: (() => {
          const s = parser.pick(xml, ["DrivableInd", "VehicleDrivableInd", "Drivable"]);
          if (!s) return null;
          return /^(1|true|yes|y)$/i.test(s);
        })(),
        engineDesc: parser.pickIn(xml, ["VehicleInfo", "Powertrain"], ["EngineDesc"]) || "",
        engineCode: parser.pickIn(xml, ["VehicleInfo", "Powertrain"], ["EngineCode"]) || "",
        transmissionDesc: parser.pickIn(xml, ["VehicleInfo", "Powertrain", "TransmissionInfo"], ["TransmissionDesc"]) || "",
        transmissionCode: parser.pickIn(xml, ["VehicleInfo", "Powertrain", "TransmissionInfo"], ["TransmissionCode"]) || "",
        drivetrain: parser.pickIn(xml, ["VehicleInfo", "Powertrain"], ["Configuration"]) || "",
        fuelType: parser.pickIn(xml, ["VehicleInfo", "Powertrain"], ["FuelType"]) || "",
        valuation: Utils.toNumber(parser.pickIn(xml, ["VehicleInfo", "Valuation"], ["ValuationAmt"])) || null
      }
    : PDFExtractor.vehicle(pdfText);
  
  // Extract customer data
  const customerData = {
    first: parser.pick(xmlBlocks.owner, ["FirstName", "GivenName"]),
    last: parser.pick(xmlBlocks.owner, ["LastName", "FamilyName", "Surname"]),
    address: parser.pick(xmlBlocks.owner, ["Address1", "Addr1", "Street", "Street1", "Line1", "Address"]),
    city: parser.pick(xmlBlocks.owner, ["City", "Town"]),
    province: parser.pick(xmlBlocks.owner, ["StateProvince", "StateProv", "Province", "State", "Prov"]),
    postal: parser.pick(xmlBlocks.owner, ["PostalCode", "Zip", "ZipCode"]),
    email: parser.pick(xmlBlocks.owner, ["EMailAddr", "EmailAddress", "Email"]),
    phone: extractor.extractOwnerPhone(xmlBlocks.owner)
  };
  
  // Extract adjuster data
  const adjusterFirst = parser.pick(xmlBlocks.adjuster, ["FirstName", "GivenName"]);
  const adjusterLast = parser.pick(xmlBlocks.adjuster, ["LastName", "FamilyName", "Surname"]);
  const adjusterData = {
    name: [adjusterFirst, adjusterLast].filter(Boolean).join(" ").trim(),
    email: parser.pick(xmlBlocks.adjuster, ["CommEmail", "EMailAddr", "EmailAddress", "Email"]) || "",
    phone: parser.pick(xmlBlocks.adjuster, ["CommPhone"]) || ""
  };
  
  // Extract totals
  const totals = xml ? extractor.extractTotals() : PDFExtractor.totals(pdfText);
  
  // Extract deductible
  const deductible = xml
    ? (Utils.toNumber(
        parser.pickIn(xml, ["ClaimInfo", "PolicyInfo", "CoverageInfo", "Coverage", "DeductibleInfo"], ["DeductibleAmt"]) ||
        parser.pick(xml, ["DeductibleAmt"]) ) || null)
    : PDFExtractor.pickDeductible(pdfText);
  
  // Extract tax adjustments (GST/PST responsibility and rates)
  const tax = xml ? extractor.extractTaxAdjustments() : PDFExtractor.extractTaxFromAdjustments(pdfText);
  
  // Extract special requirements (scan/calibration)
  const specialRequirements = xml ? extractor.extractSpecialRequirements(xml) : { postScan: false, adasCalibration: false, fourWheelAlignment: false };
  
  // Initialize record manager
  const recordManager = new RecordManager(tables, fieldNames);
  
  // Process vehicle
  let vehicleId = null;
  if (vehicleData.vin) {
    vehicleId = await recordManager.upsertVehicle(vehicleData);
  }
  
  // Process customer
  let customerId = null;
  if (tables.customers && (customerData.first || customerData.last || customerData.phone || customerData.email)) {
    customerId = await recordManager.upsertCustomer(customerData);
    console.log("Customer processed, ID:", customerId || "(none)");
    
    // Link vehicle to customer if both exist
    if (customerId && vehicleId && fieldNames.vehicles.customerLink) {
      try {
        const field = tables.vehicles.fields.find(f => f.name === fieldNames.vehicles.customerLink);
        const shaped = FieldMapper.shapeValueForField(field, [{id: customerId}]);
        if (shaped.ok) {
          await tables.vehicles.updateRecordAsync(vehicleId, {
            [fieldNames.vehicles.customerLink]: shaped.val
          });
        }
      } catch (_) {}
    }
  }
  
  // Normalize insurer for single-select field
  if (fieldNames.jobs.insurer) {
    const field = tables.jobs.fields.find(f => f.name === fieldNames.jobs.insurer);
    insurer = recordManager.normalizeInsurer(insurer, field);
  }
  
  // Process job
  const jobData = {
    ro: ro || estimateNo || "",
    claim: claim || "",
    policy: policy || "",
    insurer: insurer || "ICBC",
    loss: loss,
    estimateNo: estimateNo || "",
    estimateDate: estimateDate,
    estimateVer: estimateVer || "",
    currency: "CAD",
    severity: totals.net || null,
    labour: totals.labour || null,
    parts: totals.parts || null,
    materials: totals.materials || null,
    ats: totals.ats || null,
    deductible: deductible === 0 ? 0 : deductible,
    // Only set status/stage for NEW jobs
    status: "In Shop",
    stage: "Estimate",
    adjusterName: adjusterData.name,
    adjusterEmail: adjusterData.email,
    adjusterPhone: adjusterData.phone,
    bodyHours: totals.hours.body || null,
    refinishHours: totals.hours.refinish || null,
    mechanicalHours: totals.hours.mechanical || null,
    fpbHours: totals.hours.fpb || null,
    // Add special requirements
    postScanRequired: specialRequirements.postScan,
    adasCalibrationRequired: specialRequirements.adasCalibration,
    fourWheelAlignment: specialRequirements.fourWheelAlignment
  };

  // MAIN: only mark GST/PST to customer when Adjustments proves it
  const customerPaysGst = Boolean(tax && tax.gstAdjPct !== null && tax.gstAdjPct >= 100);
  if (fieldNames.jobs.customerPaysGst) jobData.customerPaysGst = customerPaysGst;
  const customerPaysPst = Boolean(tax.pstAdjPct !== null && tax.pstAdjPct >= 100);
  if (fieldNames.jobs.customerPaysPst) jobData.customerPaysPst = customerPaysPst;

  // Amounts (only write when customer-owed)
  if (fieldNames.jobs.gstOwedAmount && customerPaysGst) {
    jobData.gstOwedAmount = Number(((tax && tax.gstAdjAmt) || 0).toFixed(2));
  }
  if (fieldNames.jobs.pstOwedAmount && customerPaysPst) {
    jobData.pstOwedAmount = Number(((tax && tax.pstAdjAmt) || 0).toFixed(2));
  }
  if (fieldNames.jobs.taxNotes) {
    const parts = [];
    if (tax.deductibleWaived) parts.push("Deductible waived");
    if (tax.gstAdjPct !== null) parts.push(`GST: ${tax.gstAdjPct}% → $${(tax.gstAdjAmt || 0).toFixed(2)}`);
    if (tax.pstAdjPct !== null) parts.push(`PST: ${tax.pstAdjPct}% → $${(tax.pstAdjAmt || 0).toFixed(2)}`);
    if (tax.gstRate) parts.push(`GST rate ${tax.gstRate}%`);
    if (tax.pstRate) parts.push(`PST rate ${tax.pstRate}%`);
    if (parts.length) jobData.taxNotes = parts.join(" | ");
  }
  
  // If Materials field doesn't exist, write to Sublet instead
  if (!fieldNames.jobs.materials && fieldNames.jobs.sublet) {
    jobData.sublet = totals.materials || null;
    delete jobData.materials;
  }
  
  // Add links if available
  if (vehicleId && fieldNames.jobs.vehicleLink) {
    jobData.vehicleLink = [{id: vehicleId}];
  }
  if (customerId && fieldNames.jobs.customerLink) {
    jobData.customerLink = [{id: customerId}];
  }
  
  // Process job with better error handling
  let jobId = null;
  let isExistingJob = false;
  
  try {
    const result = await recordManager.upsertJob(jobData);
    jobId = result.jobId;
    isExistingJob = result.isExistingJob;
  } catch (jobError) {
    console.error("Failed to create/update job:", jobError.message);
    
    // If job creation failed, try to at least log what we extracted
    output.set("status", "Error - Job Creation Failed");
    output.set("notes", `Failed to create job: ${jobError.message}`);
    output.set("debug", JSON.stringify({
      error: jobError.message,
      extractedData: {
        ro: ro || "(not found)",
        claim: claim || "(not found)",
        policy: policy || "(not found)",
        estimateNo: estimateNo || "(not found)",
        insurer: insurer || "(not found)",
        customerData,
        vehicleData,
        totals
      },
      fieldMappings: {
        roField: fieldNames.jobs.ro || "(not mapped)",
        claimField: fieldNames.jobs.claim || "(not mapped)",
        policyField: fieldNames.jobs.policy || "(not mapped)"
      }
    }, null, 2));
    return;
  }
  
  // Process damage lines if table exists
  let lineInfo = [];
  let lineCount = 0;
  let partsCount = 0;
  let catalogLinkedCount = 0;
  
  if (xml && tables.damageLines && fieldNames.damageLines.jobLink) {
    lineInfo = await recordManager.processDamageLines(
      jobId, 
      xml, 
      tables.damageLines, 
      fieldNames.damageLines,
      extractor,
      supplementNum
    );
    lineCount = lineInfo.length;
    
    // Count actual parts (excluding R&I lines)
    partsCount = lineInfo.filter(l => l.isPartLine).length;
    
    // Link to Parts Catalog if available
    if (tables.partsCatalog && partsCount > 0) {
      await recordManager.linkDamageLinesToPartsCatalog(
        lineInfo,
        tables.partsCatalog,
        fieldNames.partsCatalog
      );
      
      // Count how many were successfully linked
      if (fieldNames.damageLines.partsCatalogLink) {
        const linkedQuery = await tables.damageLines.selectRecordsAsync({
          fields: [fieldNames.damageLines.partsCatalogLink],
          recordIds: lineInfo.map(l => l.id)
        });
        catalogLinkedCount = linkedQuery.records.filter(r => 
          r.getCellValue(fieldNames.damageLines.partsCatalogLink)
        ).length;
      }
    }
    
    // CRITICAL: Recalculate job parts tracking from scratch to avoid duplication
    await recordManager.recalculateJobPartsTracking(jobId);
  }
  
  // Workflow automation: compute derived state and update Status/Stage/Ready to Book
  try {
    const derived = await computeDerived(jobId, tables, fieldNames);
    // Read current Stage/Status to compare and avoid unnecessary writes/regression
    const jobQuery = await tables.jobs.selectRecordsAsync({
      fields: [
        fieldNames.jobs.stage,
        fieldNames.jobs.status,
        fieldNames.jobs.readyToBook
      ].filter(Boolean),
      recordIds: [jobId]
    });
    const currentRecord = jobQuery.records[0] || null;
    const currentStageFromRecord = currentRecord && fieldNames.jobs.stage ? ((currentRecord.getCellValue(fieldNames.jobs.stage) || {}).name || "") : "";
    const statusCandidate = pickStatus(currentRecord, derived);
    derived.statusCandidate = statusCandidate;
    const newStage = nextStage(currentStageFromRecord, derived);
    const ready = pickReadyToBook(currentRecord, derived);
    await safeUpdateJobWorkflowFields(jobId, {
      statusLabel: statusCandidate,
      stageLabel: newStage,
      readyLabel: ready
    }, tables, fieldNames, currentRecord);
    
    // Lightweight acceptance dry-run logs (no writes)
    try {
      const acc1 = { ...derived, approvedByInsurer: false, hasSuppPending: true };
      const acc1Status = pickStatus(currentRecord, acc1);
      const acc1Ready = pickReadyToBook(currentRecord, acc1);
      const acc1Stage = nextStage(currentStageFromRecord, { ...acc1, statusCandidate: acc1Status });
      console.log("ACCEPTANCE#1 insurer not approved:", { status: acc1Status, ready: acc1Ready, stageUnchanged: acc1Stage === currentStageFromRecord });
      const acc2 = { ...derived, hasBackorder: true, allCriticalPartsReceived: false };
      const acc2Status = pickStatus(currentRecord, acc2);
      const acc2Ready = pickReadyToBook(currentRecord, acc2);
      console.log("ACCEPTANCE#2 backordered parts:", { status: acc2Status, ready: acc2Ready });
      const acc3 = { ...derived, droppedOff: true, allCriticalPartsReceived: true, hasBackorder: false, hasSuppPending: false };
      const acc3Status = pickStatus(currentRecord, acc3);
      const acc3Stage = nextStage(currentStageFromRecord, { ...acc3, statusCandidate: acc3Status });
      console.log("ACCEPTANCE#3 dropped-off, all parts:", { status: acc3Status, stageAdvanced: (STAGE_ORDER.indexOf(acc3Stage) >= STAGE_ORDER.indexOf(currentStageFromRecord)) });
      const acc4 = { ...derived, delivered: true };
      const acc4Status = pickStatus(currentRecord, acc4);
      console.log("ACCEPTANCE#4 delivered job:", { status: acc4Status, writes: "skipped" });
    } catch (_) {}
  } catch (e) {
    console.log("Workflow automation skipped:", e.message);
  }
  
  // Prepare output
  const missing = [];
  if (!ro && !claim) missing.push("RO/Claim");
  if (!policy) missing.push("Policy");
  if (!insurer) missing.push("Insurer");
  if (!vehicleData.vin) missing.push("VIN");
  
  const notesParts = [
    `RO ${ro || "(set later)"}`,
    `Claim ${claim || "(n/a)"}`,
    `Policy ${policy || "(n/a)"}`,
    `VIN ${vehicleData.vin || "(n/a)"}`,
    `Parts ${totals.parts.toFixed(2)}`,
    `Labour ${totals.labour.toFixed(2)}`,
    `Materials ${totals.materials.toFixed(2)}`,
    `ATS ${totals.ats ? "$" + totals.ats.toFixed(2) : "$0.00"}`,
    `Total ${totals.net.toFixed(2)}`,
    supplementNum > 0 ? `Supp #${supplementNum}` : "Original",
    isExistingJob ? "Updated existing job" : "Created new job",
    `File ${usedFile}${isPdf ? " (PDF import)" : ""}`
  ];
  
  // Add enhanced line/parts count if processed
  if (tables.damageLines) {
    notesParts.push(`Lines: ${lineCount} (${partsCount} real parts)`);
    if (tables.partsCatalog && catalogLinkedCount > 0) {
      notesParts.push(`Catalog: ${catalogLinkedCount} linked`);
    }
  }
  
  // Add special requirements info
  const specialReqs = [];
  if (specialRequirements.postScan) specialReqs.push("Post-Scan");
  if (specialRequirements.adasCalibration) specialReqs.push("ADAS");
  if (specialRequirements.fourWheelAlignment) specialReqs.push("4WA");
  if (specialReqs.length) {
    notesParts.push(`Required: ${specialReqs.join(", ")}`);
  }
  
  if (missing.length) {
    notesParts.push("Missing: " + missing.join(", "));
  }
  if (recordManager.rejects.length) {
    notesParts.push("Skipped: " + recordManager.rejects.join("; "));
  }
  // Append concise tax notes to output
  if (tax.deductibleWaived) notesParts.push("Deductible Waived");
  if (tax.gstAdjPct !== null) notesParts.push(`GST (Adj→Customer): ${tax.gstAdjPct}%`);
  if (tax.pstAdjPct !== null) notesParts.push(`PST (Adj→Customer): ${tax.pstAdjPct}%`);
  
  output.set("status", "Imported v3.2-patched");
  output.set("notes", notesParts.join(" | "));
  
  // Enhanced debug output
  output.set("debug", JSON.stringify({
    extraction: {
      ro: ro || "(not found)",
      claim: claim || "(not found)",
      policy: policy || "(not found)",
      estimateNo: estimateNo || "(not found)",
      insurer: insurer || "(not found)",
      supplementNum
    },
    tables: {
      jobs: tables.jobs?.name,
      vehicles: tables.vehicles?.name,
      customers: tables.customers?.name || null,
      damageLines: tables.damageLines?.name || null,
      partsCatalog: tables.partsCatalog?.name || null
    },
    fieldMappings: {
      roField: fieldNames.jobs.ro || "(not mapped)",
      claimField: fieldNames.jobs.claim || "(not mapped)",
      policyField: fieldNames.jobs.policy || "(not mapped)",
      estimateNoField: fieldNames.jobs.estimateNo || "(not mapped)"
    },
    jobStatus: isExistingJob ? "updated" : "created",
    vehicle: {
      vin: vehicleData.vin || "(not found)",
      year: vehicleData.year,
      make: vehicleData.make || "(not found)",
      model: vehicleData.model || "(not found)"
    },
    owner: {
      name: [customerData.first, customerData.last].filter(Boolean).join(" ") || "(not found)",
      phone: customerData.phone || "(not found)",
      email: customerData.email || "(not found)"
    },
    totals,
    specialRequirements,
    linesProcessed: { 
      total: lineCount, 
      actualParts: partsCount,
      catalogLinked: catalogLinkedCount,
      laborOnly: lineCount - partsCount
    },
    partsTracking: {
      totalParts: partsCount,
      readyToBook: partsCount === 0 ? "Ready" : "Waiting on Parts"
    },
    rejects: recordManager.rejects
  }, null, 2));
}

/* ============================================================================
   CONFIGURATION
============================================================================ */

// Table names
const TABLES = {
  BMS: "BMS Uploads",
  JOBS: "Jobs",
  VEHICLES: "Vehicles",
  CUSTOMERS: "Customers",
  BMS_LINES: "BMS Damage Lines",
  PARTS_CATALOG: "Parts Catalog",
};

// Fields that should NOT be overwritten on existing jobs
const PRESERVE_FIELDS = ["stage", "status"];

// Field mapping candidates
const FIELD_CANDIDATES = {
  bmsFile: ["BMS XML", "BMSXML", "XML", "File"],
  
  jobs: {
    // Core fields - expanded to catch more variations
    ro: ["Repair Order", "RO", "RO #", "RO Number", "RepairOrder", "RONumber", "Estimate #", "Estimate No", "Work Order", "WO", "R.O.", "R.O. #", "RO#"],
    claim: ["Claim Number", "ClaimNumber", "Claim #", "Claim No", "ClaimNum", "ClaimNo", "RefClaimNum", "Claim", "Reference Claim Number", "Ref Claim #", "Claim#", "ICBC Claim", "ICBC Claim #", "ICBC Claim Number", "Customer Claim Number", "Customer Claim #", "Client Claim Number"],
    policy: ["Policy Number", "PolicyNumber", "Policy #", "Policy No", "PolicyNum", "PolicyNo", "Policy", "Policy#"],
    insurer: ["Insurer", "Insurer Name", "Insurance", "Insurance Company", "InsuranceCompanyName", "CarrierName", "Carrier", "Insurance Carrier", "Insurance Co", "Ins Company"],
    
    // Dates and identifiers
    loss: ["LossDateTime", "LossDate", "Loss Date", "Date of Loss", "Loss Dt", "LossDt", "Loss Date/Time"],
    estimateNo: ["WorkfileID", "DocumentID", "Estimate No", "EstimateNo", "Estimate #", "EstimateNum", "Estimate Number"],
    estimateDate: ["CreateDateTime", "Create Date", "Estimate Commit", "Estimate Date", "EstimateDate", "CreateDate", "Commit Date", "CommitDateTime"],
    estimateVer: ["Estimate Version", "EstimateVersion", "Version", "Rev", "Revision"],
    
    // Financial fields
    currency: ["Currency"],
    severity: ["Severity", "Grand Total", "Total", "Estimate Total", "Net Total"],
    labour: ["Labour Total", "Labor Total", "LabourTotal", "LaborTotal"],
    parts: ["PartsSellTotal", "Parts Total", "Part Total", "Parts", "PartsTotal", "PartAmt", "Part Amount"],
    sublet: ["Sublet Total", "SubletTotal", "Other Charges", "Additional Costs", "Sublet"],
    materials: ["Materials", "Paint & Shop Materials", "Materials Total"],
    ats: ["ATS Allowance", "ATS"],
    deductible: ["Deductible", "Deductible Amount", "DeductibleAmt", "Deductible Amt", "Deductible $", "Policy Deductible"],
    
    // Links and status
    vehicleLink: ["Vehicle", "Vehicle Link"],
    customerLink: ["Customer", "Policy Holder", "Owner", "Customer Link"],
    stage: ["Stage"],
    status: ["Status"],
    
    // Scan/Calibration fields
    postScanRequired: ["Post Scan Required", "Post Repair Scan", "Post-Scan Required"],
    adasCalibrationRequired: ["ADAS Calibration Required", "ADAS Required", "Calibration Required"],
    fourWheelAlignment: ["Four Wheel Alignment", "4 Wheel Alignment", "Alignment Required"],
    
    // Workflow/flags
    bookedDate: ["Scheduled Start", "Booked Date", "Appointment Date", "Start Date"],
    droppedOff: ["Dropped Off", "Vehicle Dropped Off", "Vehicle In Shop", "Checked In"],
    deliveredChk: ["Delivered", "Closed Out", "Picked Up", "Delivered?"],
    totalLossChk: ["Total Loss", "Not Repairing", "Write-off"],
    approvedByInsurer: ["Approved by Insurer", "Insurer Approved", "Approved", "Estimate Approved"],
    suppApproved: ["Supplement Approved", "Supp Approved", "Supp. Approved"],
    hasSuppPending: ["Supplement Pending", "Supp Pending", "Supp. Pending"],
    readyForPickupFlag: ["Ready for Pickup?", "Ready for Pickup Flag"],
    
    // Taxes-related optional fields
    customerPaysGst: ["Customer Pays GST", "GST to Customer", "GST Customer Responsibility", "GST Customer"],
    customerPaysPst: ["Customer Pays PST", "PST to Customer", "PST Customer Responsibility", "PST Customer", "Customer Pays RST", "Customer Pays QST"],
    taxNotes: ["Tax Notes", "Taxes Notes", "GST/PST Notes", "Tax Summary"],
    gstOwedAmount: ["GST Owed Amount", "GST Owed", "GST to Customer", "Customer GST Owed", "GST Amount (Customer)"],
    pstOwedAmount: ["PST Owed Amount", "PST Owed", "PST to Customer", "Customer PST Owed", "PST Amount (Customer)"],
    
    // Parts tracking
    totalPartsCount: ["Total Parts Count", "# of Parts", "Parts Count"],
    partsReceivedCount: ["Parts Received Count", "# Parts Received", "Received Parts"],
    readyToBook: ["Ready to Book", "Ready to Schedule", "Ready"],
    
    // Adjuster info
    adjusterName: ["Adjuster Name", "Adjuster", "Claims Adjuster", "Claim Adjuster"],
    adjusterEmail: ["Adjuster Email", "Claims Adjuster Email", "Adjuster EMail", "Adjuster E-mail"],
    adjusterPhone: ["Adjuster Phone", "Adjuster Phone #", "Claims Adjuster Phone", "Adjuster Contact"],
    
    // Hours breakdown
    bodyHours: ["Body Hours", "Body Labour Hours", "LAB Hours", "Body Hrs"],
    refinishHours: ["Refinish Hours", "LAR Hours", "Paint Hours", "Refinish Labour Hours"],
    mechanicalHours: ["Mechanical Hours", "LAM Hours", "Mech Hours"],
    fpbHours: ["FPB Hours", "Feather/Prime/Block Hours", "LA1 Hours", "UserDefined1 Hours"],
  },
  
  damageLines: {
    jobLink: ["Job", "Jobs", "Job Link", "JobId"],
    lineNum: ["Line #", "Line Number", "LineNum"],
    uniqueSequenceNum: ["Unique Sequence Number", "UniqueSequenceNum", "Sequence"],
    supplementNum: ["Supplement #", "Supplement", "SupplementNum"],
    description: ["Description", "Line Desc", "LineDesc", "Part Description"],
    header: ["Header", "Line Header", "LineHeaderDesc", "Section"],
    status: ["Status", "Line Status", "LineStatusCode"],
    lineMemo: ["Line Memo", "Memo", "Notes"],
    
    // Part fields
    partNum: ["Part #", "Part Number", "PartNum", "Part"],
    partType: ["Part Type", "PartType", "Type"],
    partPrice: ["Part Price", "PartPrice", "Price", "Estimate Price"],
    oemPartPrice: ["OEM Price", "OEMPartPrice", "OEM Part Price"],
    quantity: ["Quantity", "Qty"],
    
    // Part tracking
    isPartLine: ["Is Part?", "Is Part Line", "Has Part"],
    partReceived: ["Part Received?", "Received", "In Stock"],
    partsCatalogLink: ["Parts Catalog", "Part Link", "Catalog Link"],
    vendor: ["Vendor", "Supplier"],
    orderStatus: ["Order Status", "Part Status"],
    
    // Labor fields
    laborType: ["Labor Type", "Labour Type", "LaborType"],
    laborOperation: ["Labor Operation", "Labour Operation", "LaborOperation", "Operation"],
    laborHours: ["Labor Hours", "Labour Hours", "Hours", "LaborHours"],
  },
  
  partsCatalog: {
    partNumber: ["Part Number", "Part #", "PartNum"],
    description: ["Description", "Part Description", "Name"],
    currentPrice: ["Current Price", "Price", "Unit Price"],
    vendor: ["Vendor", "Supplier", "Vendor Name"],
    lastUpdated: ["Last Updated", "Updated", "Price Updated"],
    oemPrice: ["OEM Price", "List Price", "MSRP"],
    category: ["Category", "Part Category", "Type"],
    inStock: ["In Stock", "Available", "On Hand"],
    leadTime: ["Lead Time", "Days to Order", "Availability"],
  },
  
  vehicles: {
    vin: ["VIN", "VIN Number", "VINNumber", "VINNum", "Vehicle VIN #", "Vehicle VIN", "VIN #"],
    year: ["Year", "Model Year", "ModelYear", "Vehicle Year"],
    make: ["Make", "MakeDesc", "VehMake", "VehicleMake", "MakeName"],
    model: ["Model", "ModelName", "VehModel", "VehicleModel", "ModelDesc"],
    submodel: ["Submodel", "Sub-model", "Sub Model", "Trim", "SubModel", "SubModelDesc"],
    bodyStyle: ["Body Style", "BodyStyle"],
    productionDate: ["Production Date", "Build Date", "Prod Date"],
    odometer: ["Odometer", "Odo", "OdomReading", "OdometerReading"],
    plate: ["Plate", "License Plate", "Licence Plate", "License Plate #", "Licence Plate #"],
    province: ["Province", "Province/State", "State/Province", "StateProv", "State"],
    color: ["Color", "Colour", "Exterior Color", "ExteriorColour", "Paint Color"],
    drivable: ["Drivable?", "Drivable", "DrivableInd", "VehicleDrivableInd"],
    engineDesc: ["Engine", "Engine Description", "EngineDesc"],
    engineCode: ["Engine Code", "EngineCode"],
    transmissionDesc: ["Transmission", "Transmission Description", "TransmissionDesc"],
    transmissionCode: ["Transmission Code", "TransmissionCode"],
    drivetrain: ["Drivetrain", "Drive", "Configuration"],
    fuelType: ["Fuel", "Fuel Type", "FuelType"],
    valuation: ["Valuation", "Valuation Amount", "ValuationAmt"],
    customerLink: ["Customer", "Owner", "Policy Holder", "Customer Link"],
  },
  
  customers: {
    name: ["Name", "Customer", "Customer Name", "Owner", "Owner Name"],
    first: ["First Name", "FirstName", "GivenName", "Insured First", "Owner First"],
    last: ["Last Name", "LastName", "FamilyName", "Surname", "Insured Last", "Owner Last"],
    phone: ["Phone", "Phone #", "PhoneNum", "PrimaryPhone", "HomePhone", "DayPhone", "Mobile", "Cell"],
    email: ["Email", "EMail", "EMailAddr", "EmailAddress"],
    address: ["Address", "Addr1", "Address1", "Street", "Street1", "Line1"],
    city: ["City", "Town"],
    province: ["Province", "State", "StateProv", "StateProvince", "Prov"],
    postal: ["Postal Code", "PostalCode", "Zip", "ZipCode"],
  }
};

// Part type mappings
const PART_TYPE_MAP = {
  // OEM/New parts
  "PAN": "OEM",
  "PAO": "OEM", 
  "OEM": "OEM",
  "NEW": "OEM",
  
  // OE Discount
  "PAD": "OE Discount",
  "OED": "OE Discount",
  "DISCOUNT": "OE Discount",
  
  // Aftermarket
  "PAA": "Aftermarket",
  "AFT": "Aftermarket",
  "AFTERMARKET": "Aftermarket",
  
  // Existing parts
  "PAE": "Part Already Existing",
  "EXISTING": "Part Already Existing",
  
  // Recycled/LKQ
  "PAL": "Recycled/LKQ",
  "LKQ": "Recycled/LKQ",
  "RECYCLED": "Recycled/LKQ",
  "USED": "Recycled/LKQ",
  
  // Recored
  "PAR": "Recored Parts",
  "RECORED": "Recored Parts",
  
  // Remanufactured
  "PAM": "Remanufactured Parts",
  "REMAN": "Remanufactured Parts",
  "REMANUFACTURED": "Remanufactured Parts",
  
  // Rechromed
  "PAC": "Rechromed Parts",
  "RECHROMED": "Rechromed Parts",
};

// Labor operation mappings
const LABOR_OPERATION_MAP = {
  "OP1": "Replace",
  "OP2": "Remove & Install",
  "OP3": "Remove & Replace",
  "OP5": "Repair",
  "OP6": "Refinish",
  "OP9": "Repair",
  "OP11": "Replace", // Changed from Align/Set to Replace for parts
  "OP14": "Refinish",
  "OP26": "Sublet"
};

/* ============================================================================
   UTILITY FUNCTIONS
============================================================================ */

const Utils = {
  normalize: s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
  normalizePhone: s => String(s || "").replace(/\D/g, ""),
  escapeRegex: s => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  toNumber: s => {
    const v = String(s || "").replace(/[^0-9.\-]/g, "");
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  },
  parseDate: s => {
    if (!s) return null;
    const t = Date.parse(s);
    if (!isNaN(t)) return new Date(t);
    const parts = String(s).split('/');
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      const dt = Date.parse(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(dt)) return new Date(dt);
    }
    return null;
  }
};

/* ============================================================================
   XML PARSING
============================================================================ */

class XMLParser {
  constructor(xml) {
    this.xml = xml;
    this.namespacePrefix = '(?:\\w+:)?';
  }
  
  makeTagRegex(name) {
    return new RegExp(
      `<${this.namespacePrefix}${name}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${name}>`,
      'i'
    );
  }
  
  pick(xml, names) {
    for (const name of names) {
      const match = this.makeTagRegex(name).exec(xml);
      if (match) {
        return match[1].replace(/<[^>]+>/g, "").trim();
      }
    }
    return "";
  }
  
  block(xml, name) {
    const match = this.makeTagRegex(name).exec(xml);
    return match ? match[1] : "";
  }
  
  blockPath(xml, pathArray) {
    let current = xml;
    for (const name of pathArray) {
      if (!current) return "";
      current = this.block(current, name);
    }
    return current;
  }
  
  pickIn(xml, pathArray, names) {
    const subXml = this.blockPath(xml, pathArray);
    return this.pick(subXml, names);
  }
  
  getAmountFromBlock(xml, blockTag, selectorTag, selectorValue, amountTag = 'TotalAmt') {
    const blockRe = new RegExp(
      `<${this.namespacePrefix}${blockTag}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${blockTag}>`,
      'gi'
    );
    const sel = Utils.escapeRegex(selectorValue);
    let match;
    
    while ((match = blockRe.exec(xml))) {
      const blockContent = match[1];
      const selRe = new RegExp(
        `<${this.namespacePrefix}${selectorTag}[^>]*>\\s*${sel}\\s*<\\/${this.namespacePrefix}${selectorTag}>`,
        'i'
      );
      
      if (selRe.test(blockContent)) {
        const amtMatch = new RegExp(
          `<${this.namespacePrefix}${amountTag}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${amountTag}>`,
          'i'
        ).exec(blockContent);
        
        if (amtMatch) return Utils.toNumber(amtMatch[1]);
      }
    }
    return 0;
  }
  
  getNumberFromBlock(xml, blockTag, selectorTag, selectorValue, valueTag) {
    const blockRe = new RegExp(
      `<${this.namespacePrefix}${blockTag}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${blockTag}>`,
      'gi'
    );
    const sel = Utils.escapeRegex(selectorValue);
    let match;
    
    while ((match = blockRe.exec(xml))) {
      const blockContent = match[1];
      const selRe = new RegExp(
        `<${this.namespacePrefix}${selectorTag}[^>]*>\\s*${sel}\\s*<\\/${this.namespacePrefix}${selectorTag}>`,
        'i'
      );
      
      if (selRe.test(blockContent)) {
        const valMatch = new RegExp(
          `<${this.namespacePrefix}${valueTag}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${valueTag}>`,
          'i'
        ).exec(blockContent);
        
        if (valMatch) return Utils.toNumber(valMatch[1]);
      }
    }
    return 0;
  }
  
  getFirstAmountInBlock(xml, blockTag, amountTag = 'TotalAmt') {
    const re = new RegExp(
      `<${this.namespacePrefix}${blockTag}[^>]*>[\\s\\S]*?<${this.namespacePrefix}${amountTag}[^>]*>([\\s\\S]*?)<\\/${this.namespacePrefix}${amountTag}>[\\s\\S]*?<\\/${this.namespacePrefix}${blockTag}>`,
      'i'
    );
    const match = re.exec(xml);
    return match ? Utils.toNumber(match[1]) : 0;
  }
}

/* ==========================  PDF TEXT EXTRACTION  ========================== */
const PDFUtils = {
  // Minimal text extraction: pull strings inside ( ... ) Tj/TJ; fallback to raw
  toText(bytesU8) {
    try {
      const raw = new TextDecoder("latin1").decode(bytesU8);
      const chunks = [];
      const re = /\(([^()]*)\)\s*T[Jj]/g;
      let m;
      while ((m = re.exec(raw))) {
        chunks.push(m[1].replace(/\\\)/g, ")").replace(/\\\(/g, "("));
      }
      const txt = (chunks.length ? chunks.join("") : raw)
        .replace(/\r/g, "\n")
        .replace(/\u0000/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{2,}/g, "\n");
      return txt;
    } catch (_) {
      return "";
    }
  }
};

const PDFExtractor = {
  // General helpers
  pick(re, text) { const m = re.exec(text || ""); return m ? (m[1] || m[0]).trim() : ""; },
  dollars(s) { return s ? Number(String(s).replace(/[^0-9.]/g, "")) : 0; },
  extractRO(text) {
    return this.pick(/\b(?:RO|Repair\s*Order)\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text) ||
           this.pick(/\bWorkfile\s*ID\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text) || "";
  },
  pickClaim(text) { return this.pick(/\bClaim(?:\s*(?:No\.?|#|Number))?\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text); },
  pickPolicy(text){ return this.pick(/\bPolicy(?:\s*(?:No\.?|#|Number))?\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text); },
  pickEstimateNo(text){
    return this.pick(/\bEstimate(?:\s*(?:No\.?|#|ID|Number))\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text) ||
           this.pick(/\bWorkfile\s*ID\s*[:#]?\s*([A-Za-z0-9\-]+)/i, text);
  },
  pickInsurer(text){ return this.pick(/\bInsurance\s+Company\s*[:]\s*([^\n]+)/i, text) || ""; },
  pickLossDate(text){ return this.pick(/\b(?:Loss\s*Date|Date\s*of\s*Loss)\s*[:]\s*([^\n]+)/i, text); },
  pickEstimateDate(text){ return this.pick(/\b(?:Estimate\s*Date|Created)\s*[:]\s*([^\n]+)/i, text); },
  pickDeductible(text){
    if (/Deductible\s+Waived/i.test(text)) return 0;
    const m = /\bDeductible\b[^\n]*?(\$[\d,]+\.\d{2})/i.exec(text || "");
    return m ? this.dollars(m[1]) : null;
  },
  vehicle(text){
    const vin = this.pick(/\bVIN\s*[:#]?\s*([A-HJ-NPR-Z0-9]{11,17})/i, text);
    const year = Number(this.pick(/\b(?:Model\s*Year|Year)\s*[:]?\s*(\d{4})/i, text)) || null;
    const mm = /(Make|Make\/Model|Vehicle)\s*[:]\s*([A-Za-z0-9\- ]+)\s*(?:Model\s*[:]\s*([A-Za-z0-9\- ]+))?/i.exec(text || "");
    let make="", model="";
    if (mm) { make = (mm[2]||"").trim(); model = (mm[3]||"").trim(); }
    return { vin, year, make, model, submodel:"", bodyStyle:"", productionDate:"", odometer:null, plate:"", province:"", color:"", drivable:null, engineDesc:"", engineCode:"", transmissionDesc:"", transmissionCode:"", drivetrain:"", fuelType:"", valuation:null };
  },
  totals(text){
    const parts = this.dollars((/Parts[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]);
    const labour = this.dollars((/(?:Labor|Labour)[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]);
    const materials = this.dollars((/(?:Materials|Paint\s*&\s*Shop\s*Materials)[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]);
    const ats = this.dollars((/ATS[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]);
    const net = this.dollars((/Gross\s*Total[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]) ||
                this.dollars((/Net\s*Total[^$\n]*\$([\d,]+\.\d{2})/i.exec(text || "") || [,
""])[1]);
    return { parts, labour, materials, ats, net, hours:{body:0,refinish:0,mechanical:0,fpb:0} };
  },
  // Only from Adjustments → (Total) Customer Responsibility section
  extractTaxFromAdjustments(text){
    const sectionRe = /Adjustments[\s\S]{0,2000}?Total\s+Customer\s+Responsibility[\s\S]{0,200}/i;
    const sec = (sectionRe.exec(text || "") || [null])[0] || "";
    // e.g., "GST @ 100.000% -$319.28"
    const gstPct = (/(?:GST)\s*@\s*([0-9.]+)\s*%/i.exec(sec) || [,
""])[1];
    const gstAmt = (/(?:GST)[^$%]*-\$([\d,]+\.\d{2})/i.exec(sec) || [,
""])[1];
    const pstPct = /(?:PST|QST|RST)\s*@\s*([0-9.]+)\s*%/i.exec(sec);
    const pstAmt = /(?:PST|QST|RST)[^$%]*-\$([\d,]+\.\d{2})/i.exec(sec);
    const deductibleWaived = /Deductible\s+Waived/i.test(sec);
    return {
      gstRate: null, pstRate: null,
      gstAdjPct: gstPct ? Number(gstPct) : null,
      pstAdjPct: pstPct ? Number(pstPct[1]) : null,
      gstAdjAmt: gstAmt ? Number(gstAmt.replace(/[,]/g,"")) : 0,
      pstAdjAmt: pstAmt ? Number(pstAmt[1].replace(/[,]/g,"")) : 0,
      deductibleWaived
    };
  }
};
/* ============================================================================
   FIELD MAPPING
============================================================================ */

class FieldMapper {
  static isReadOnlyType(type) {
    return new Set(["formula","rollup","lookup","count","createdTime","lastModifiedTime","autoNumber"]).has(type);
  }

  static findFieldByNames(table, candidateNames) {
    if (!table?.fields) return null;
    return table.fields.find(f => 
      candidateNames.map(Utils.normalize).includes(Utils.normalize(f.name))
    ) || null;
  }
  
  static getFieldName(table, candidateNames) {
    const field = this.findFieldByNames(table, candidateNames);
    return field?.name || null;
  }
  
  static mapTableFields(table, candidates) {
    const mapped = {};
    for (const [key, names] of Object.entries(candidates)) {
      mapped[key] = this.getFieldName(table, names);
    }
    return mapped;
  }
  
  static preferLinkField(table, currentName, candidates) {
    const linkTypes = new Set(["multipleRecordLinks", "singleRecordLink"]);
    const currentField = currentName && table.fields?.find(f => f.name === currentName);
    if (currentField && linkTypes.has(currentField.type)) return currentName;
    
    for (const label of candidates || []) {
      const field = table.fields?.find(f => f.name === label && linkTypes.has(f.type));
      if (field) return field.name;
    }
    
    return currentName;
  }

  static preferWritableTextField(table, currentName, candidates) {
    const cur = currentName && table.fields?.find(f => f.name === currentName);
    if (cur && !this.isReadOnlyType(cur.type) && (cur.type === "singleLineText" || cur.type === "multilineText")) {
      return currentName;
    }
    for (const label of candidates || []) {
      const f = table.fields?.find(ff =>
        ff.name === label &&
        !this.isReadOnlyType(ff.type) &&
        (ff.type === "singleLineText" || ff.type === "multilineText")
      );
      if (f) return f.name;
    }
    return currentName;
  }
  
  static preferNumericField(table, currentName, candidates) {
    const numericTypes = new Set(["number", "currency", "percent", "duration"]);
    const readOnlyTypes = new Set(["formula", "rollup", "lookup", "count", "createdTime", "lastModifiedTime", "autoNumber"]);
    
    const currentField = currentName && table.fields?.find(f => f.name === currentName);
    if (currentField && numericTypes.has(currentField.type)) return currentName;
    
    for (const label of candidates || []) {
      const field = table.fields?.find(f => f.name === label && numericTypes.has(f.type));
      if (field) return field.name;
    }
    
    if (currentField && readOnlyTypes.has(currentField.type)) return null;
    
    return currentName;
  }
  
  static shapeValueForField(field, value) {
    const readOnlyTypes = new Set(["formula", "rollup", "lookup", "count", "createdTime", "lastModifiedTime", "autoNumber"]);
    
    if (!field) return { ok: false, reason: "no field" };
    if (readOnlyTypes.has(field.type)) return { ok: false, reason: `${field.name} is read-only` };
    if (value === undefined) return { ok: false, reason: `${field.name} undefined` };
    
    if (field.type === "singleSelect") {
      const options = field.options?.choices || [];
      const match = options.find(o => Utils.normalize(o.name) === Utils.normalize(String(value)));
      if (!match) return { ok: false, reason: `${field.name} missing option '${value}'` };
      return { ok: true, val: { name: match.name } };
    }
    
    if (field.type === "date" || field.type === "dateTime") {
      const date = value instanceof Date ? value : Utils.parseDate(value);
      return { ok: true, val: date };
    }
    
    if (value instanceof Date) {
      return { ok: true, val: value.toISOString() };
    }
    
    if (field.type === "checkbox") {
      return { ok: true, val: Boolean(value) };
    }
    
    return { ok: true, val: value };
  }
}

/* ============================================================================
   DATA EXTRACTORS
============================================================================ */

class DataExtractor {
  constructor(parser) {
    this.parser = parser;
    this.xml = parser.xml;
  }
  
  extractRO() {
    let ro = this.parser.pick(this.xml, ["RONumber", "RepairOrderNum", "RepairOrder", "RO"]);
    
    if (!ro) {
      const roMemo = this.parser.pick(this.xml, ["VehicleDescMemo", "VehDescMemo", "VehicleMemo", "VehMemo"]);
      const match = roMemo && roMemo.match(/\bR\/?O[:#]?\s*([A-Za-z0-9\-]+)/i);
      if (match) ro = match[1].trim();
    }
    
    return ro ? ro.replace(/[^\w\-]/g, "") : "";
  }
  
  extractInsurer() {
    let insurer = this.parser.pick(this.xml, ["InsuranceCompanyName", "CompanyName", "InsurerName", "CarrierName"]);
    
    if (!insurer && /Insurance Corporation of British Columbia|ICBC/i.test(this.xml)) {
      insurer = "Insurance Corporation of British Columbia";
    }
    
    return insurer;
  }
  
  extractOwnerPhone(ownerXml) {
    const cellMatch = /<Communications[\s\S]*?<CommQualifier[^>]*>(?:CP|CELL|MB|MOB|C)<\/CommQualifier>[\s\S]*?<CommPhone[^>]*>([\s\S]*?)<\/CommPhone>[\s\S]*?<\/Communications>/i.exec(ownerXml);
    if (cellMatch) return cellMatch[1].replace(/<[^>]+>/g, "").trim();
    
    const homeMatch = /<Communications[\s\S]*?<CommQualifier[^>]*>(?:HP|HOME|H)<\/CommQualifier>[\s\S]*?<CommPhone[^>]*>([\s\S]*?)<\/CommPhone>[\s\S]*?<\/Communications>/i.exec(ownerXml);
    if (homeMatch) return homeMatch[1].replace(/<[^>]+>/g, "").trim();
    
    return this.parser.pick(ownerXml, ["CommPhone"]);
  }
  
  extractVendor(lineXml) {
    const supplier = this.parser.pickIn(lineXml, ["PartInfo", "NonOEM"], ["SupplierRefNum"]);
    if (supplier) {
      const supplierMap = {
        "08CC": "LKQ/KEYSTONE",
        "01KW": "KW AUTO PARTS",
        "09AP": "APT AUTO PARTS"
      };
      return supplierMap[supplier] || supplier;
    }
    return "";
  }
  
  extractSpecialRequirements(xml) {
    const requirements = {
      postScan: false,
      adasCalibration: false,
      fourWheelAlignment: false
    };
    
    if (/post\s*repair\s*scan|post\s*scan/i.test(xml)) {
      requirements.postScan = true;
    }
    
    if (/adas\s*calibration\s*(static|dynamic|universal)/i.test(xml)) {
      requirements.adasCalibration = true;
    }
    
    if (/four\s*wheel\s*alignment|4\s*wheel\s*alignment/i.test(xml)) {
      requirements.fourWheelAlignment = true;
    }
    
    return requirements;
  }
  
  extractTotals() {
    const totals = {};
    
    totals.parts = this.parser.getFirstAmountInBlock(this.xml, "PartsTotalsInfo", "TotalAmt");
    
    totals.labour = 
      this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LA") ||
      (this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAB") +
       this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAM") +
       this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAR") +
       this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LA1") +
       this.parser.getAmountFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LABS"));
    
    let materialsTotal = this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalTypeDesc", "Additional Costs");
    
    if (!materialsTotal) {
      materialsTotal = this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalType", "OTAC");
    }
    
    if (!materialsTotal) {
      const paintMaterials = this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalTypeDesc", "Paint Materials");
      const shopMaterials = this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalTypeDesc", "Shop Materials");
      materialsTotal = paintMaterials + shopMaterials;
    }
    
    totals.materials = materialsTotal;
    
    totals.ats = 
      this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalTypeDesc", "ATS Allowance") ||
      this.parser.getAmountFromBlock(this.xml, "OtherChargesTotalsInfo", "TotalType", "ATS");
    
    totals.net = 
      this.parser.getAmountFromBlock(this.xml, "SummaryTotalsInfo", "TotalSubType", "CE") ||
      this.parser.getAmountFromBlock(this.xml, "SummaryTotalsInfo", "TotalTypeDesc", "Gross Total") ||
      this.parser.getAmountFromBlock(this.xml, "SummaryTotalsInfo", "TotalSubType", "TT") ||
      this.parser.getAmountFromBlock(this.xml, "SummaryTotalsInfo", "TotalTypeDesc", "Net Total") ||
      this.parser.getFirstAmountInBlock(this.xml, "SummaryTotalsInfo", "TotalAmt") || 0;
    
    totals.hours = {
      body: this.parser.getNumberFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAB", "TotalHours"),
      refinish: this.parser.getNumberFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAR", "TotalHours"),
      mechanical: this.parser.getNumberFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LAM", "TotalHours"),
      fpb: this.parser.getNumberFromBlock(this.xml, "LaborTotalsInfo", "TotalType", "LA1", "TotalHours")
    };
    
    return totals;
  }

  // Precise GST-from-Adjustments parsing
  extractTaxAdjustments() {
    const xml = this.xml;
    // Rates
    const gstRate = Utils.toNumber(
      this.parser.pickIn(xml, ["ProfileInfo", "CanadianTax"], ["GoodsServicesTaxRate"])
    ) || null;
    const pstRate = Utils.toNumber(
      this.parser.pickIn(xml, ["ProfileInfo", "CanadianTax"], ["ProvincialSalesTaxRate", "RetailSalesTaxRate", "QuebecSalesTaxRate"])
    ) || null;

    // Responsibility adjustments (who pays) via CustomElements if present
    let gstAdjPct = null, pstAdjPct = null;
    const ceRegex = /<CustomElement>([\s\S]*?)<\/CustomElement>/gi;
    let m;
    while ((m = ceRegex.exec(xml))) {
      const block = m[1];
      const id = (/<CustomElementID[^>]*>([\s\S]*?)<\/CustomElementID>/i.exec(block) || [,""])[1].trim();
      const dec = (/<CustomElementDecimal[^>]*>([\s\S]*?)<\/CustomElementDecimal>/i.exec(block) || [,""])[1].trim();
      if (/^GST Adjustment$/i.test(id)) gstAdjPct = Utils.toNumber(dec);
      if (/^PST Adjustment$/i.test(id)) pstAdjPct = Utils.toNumber(dec);
    }

    // STRICT fallback: only treat GST/PST as customer-owed if found INSIDE the
    // Adjustments → (Total) Customer Responsibility block.
    // We grab the surrounding SummaryTotalsInfo block that contains
    // "Customer Responsibility" and then search inside it for "GST @ N%".
    function pctFromCustomerResponsibility(xmlStr, taxLabel) {
      const ns = '(?:\\w+:)?';
      const blockRe = new RegExp(
        `<${ns}SummaryTotalsInfo[^>]*>[\\s\\S]*?<${ns}TotalTypeDesc>\\s*(?:Total\\s+)?Customer\\s+Responsibility\\s*<\\/${ns}TotalTypeDesc>[\\s\\S]*?<\\/${ns}SummaryTotalsInfo>`,
        'i'
      );
      const block = (blockRe.exec(xmlStr) || [null])[0];
      if (!block) return null;
      const taxRe = new RegExp(`${taxLabel}[^%]*@[^0-9]*([0-9]+(?:\\.[0-9]+)?)\\s*%`, 'i');
      const mm = taxRe.exec(block);
      return mm ? Utils.toNumber(mm[1]) : null;
    }
    const gstPctInAdj = pctFromCustomerResponsibility(xml, 'GST');
    const pstPctInAdj = pctFromCustomerResponsibility(xml, 'PST|RST|QST');
    if (gstAdjPct === null && gstPctInAdj !== null) gstAdjPct = gstPctInAdj;
    if (pstAdjPct === null && pstPctInAdj !== null) pstAdjPct = pstPctInAdj;

    // Amounts: sum tax lines across totals
    // GS = GST; LS (and sometimes RS/QS) = provincial tax
    const sumTax = (codeRegex) => {
      let s = 0;
      const re = new RegExp(
        `<(?:\\w+:)?TaxType>${codeRegex}<\\/(?:\\w+:)?TaxType>[\\s\\S]*?<(?:\\w+:)?TierNum>1<\\/(?:\\w+:)?TierNum>[\\s\\S]*?<(?:\\w+:)?TaxAmt>([0-9.]+)<\\/(?:\\w+:)?TaxAmt>`,
        "gi"
      );
      let m; while ((m = re.exec(xml))) s += Number(m[1] || 0);
      return s;
    };
    const gstAdjAmt = sumTax("GS");
    const pstAdjAmt = sumTax("(?:LS|RS|QS)");

    // Deductible waived flag (DX or $0)
    const deductibleWaived =
      /<DeductibleStatus[^>]*>DX<\/DeductibleStatus>/i.test(xml) ||
      /<DeductibleAmt>\s*0+(\.0+)?\s*<\/DeductibleAmt>/i.test(xml);

    return { gstRate, pstRate, gstAdjPct, pstAdjPct, gstAdjAmt, pstAdjAmt, deductibleWaived };
  }
}

/* ============================================================================
   RECORD OPERATIONS - WITH FIXED PRESERVE LOGIC
============================================================================ */

class RecordManager {
  constructor(tables, fieldNames) {
    this.tables = tables;
    this.fieldNames = fieldNames;
    this.rejects = [];
  }
  
  async createRecordWithFallback(table, fields, fallbackText) {
    let bag = { ...fields };
    
    if (!Object.keys(bag).length) {
      const primaryField = table.primaryField || table.fields[0];
      if (primaryField) {
        const shaped = FieldMapper.shapeValueForField(primaryField, fallbackText || "(Imported)");
        if (shaped.ok) bag[primaryField.name] = shaped.val;
      }
    }
    
    return await table.createRecordAsync(bag);
  }
  
  async trySetField(table, recordId, fieldName, value, skipIfPreserved = false) {
    if (!fieldName) return;
    
    // Skip preserved fields if flag is set
    if (skipIfPreserved && PRESERVE_FIELDS.some(f => 
      this.fieldNames.jobs[f] === fieldName
    )) {
      return;
    }
    
    const field = table.fields.find(f => f.name === fieldName);
    if (!field) return;
    
    const shaped = FieldMapper.shapeValueForField(field, value);
    if (!shaped.ok) {
      this.rejects.push(`${fieldName}: ${shaped.reason}`);
      return;
    }
    
    try {
      await table.updateRecordAsync(recordId, { [fieldName]: shaped.val });
    } catch (e) {
      this.rejects.push(`${fieldName}: ${e.message}`);
    }
  }
  
  async upsertVehicle(vehicleData) {
    const { vin } = vehicleData;
    if (!vin || !this.fieldNames.vehicles.vin) return null;
    
    const query = await this.tables.vehicles.selectRecordsAsync({ 
      fields: [this.fieldNames.vehicles.vin] 
    });
    const existing = query.records.find(r => 
      (r.getCellValue(this.fieldNames.vehicles.vin) || "") === vin
    );
    
    let vehicleId;
    if (existing) {
      vehicleId = existing.id;
    } else {
      const baseFields = {};
      const vinField = this.tables.vehicles.fields.find(f => f.name === this.fieldNames.vehicles.vin);
      const shaped = FieldMapper.shapeValueForField(vinField, vin);
      if (shaped.ok) baseFields[this.fieldNames.vehicles.vin] = shaped.val;
      
      vehicleId = await this.createRecordWithFallback(this.tables.vehicles, baseFields, vin);
    }
    
    const updatePairs = Object.entries(vehicleData)
      .filter(([key]) => key !== 'vin' && this.fieldNames.vehicles[key])
      .map(([key, value]) => [this.fieldNames.vehicles[key], value]);
    
    for (const [fieldName, value] of updatePairs) {
      await this.trySetField(this.tables.vehicles, vehicleId, fieldName, value);
    }
    
    return vehicleId;
  }
  
  async upsertCustomer(customerData) {
    if (!this.tables.customers) return null;
    
    const { first, last, phone, email } = customerData;
    if (!first && !last && !phone && !email) return null;
    
    const queryFields = [
      this.fieldNames.customers.email,
      this.fieldNames.customers.phone,
      this.fieldNames.customers.last
    ].filter(Boolean);
    
    const query = await this.tables.customers.selectRecordsAsync({ fields: queryFields });
    
    let existing = null;
    if (this.fieldNames.customers.email && email) {
      existing = query.records.find(r => 
        (r.getCellValue(this.fieldNames.customers.email) || "").toLowerCase() === email.toLowerCase()
      );
    }
    
    if (!existing && this.fieldNames.customers.phone && this.fieldNames.customers.last && phone && last) {
      existing = query.records.find(r =>
        Utils.normalizePhone(r.getCellValue(this.fieldNames.customers.phone)) === Utils.normalizePhone(phone) &&
        (r.getCellValue(this.fieldNames.customers.last) || "").toLowerCase() === last.toLowerCase()
      );
    }
    
    const displayName = [first, last].filter(Boolean).join(" ") || email || phone || "(Owner)";
    
    const fields = {};
    const addField = (fieldName, value) => {
      if (fieldName && value !== undefined && value !== null && value !== "") {
        fields[fieldName] = value;
      }
    };
    
    addField(this.fieldNames.customers.name, displayName);
    addField(this.fieldNames.customers.first, first);
    addField(this.fieldNames.customers.last, last);
    addField(this.fieldNames.customers.phone, phone);
    addField(this.fieldNames.customers.email, email);
    addField(this.fieldNames.customers.address, customerData.address);
    addField(this.fieldNames.customers.city, customerData.city);
    addField(this.fieldNames.customers.province, customerData.province);
    addField(this.fieldNames.customers.postal, customerData.postal);
    
    let customerId;
    if (existing) {
      customerId = existing.id;
      if (Object.keys(fields).length) {
        try {
          await this.tables.customers.updateRecordAsync(customerId, fields);
        } catch (_) {}
      }
    } else {
      try {
        customerId = await this.createRecordWithFallback(this.tables.customers, fields, displayName);
      } catch (_) {}
    }
    
    return customerId;
  }
  
  async upsertJob(jobData) {
    const { ro, claim, estimateNo, policy } = jobData;
    
    console.log("=== ATTEMPTING TO CREATE/UPDATE JOB ===");
    console.log("Job data received:", { ro, claim, estimateNo, policy });
    console.log("Available field mappings:", {
      roField: this.fieldNames.jobs.ro,
      claimField: this.fieldNames.jobs.claim,
      policyField: this.fieldNames.jobs.policy,
      estimateNoField: this.fieldNames.jobs.estimateNo
    });
    
    const queryFields = [];
    if (this.fieldNames.jobs.ro) queryFields.push(this.fieldNames.jobs.ro);
    if (this.fieldNames.jobs.claim) queryFields.push(this.fieldNames.jobs.claim);
    
    // Only query if we have fields to query
    let jobId = null;
    let isExistingJob = false;
    
    if (queryFields.length > 0) {
      const query = await this.tables.jobs.selectRecordsAsync({ fields: queryFields });
      
      if (this.fieldNames.jobs.ro && ro) {
        const existing = query.records.find(r => (r.getCellValue(this.fieldNames.jobs.ro) || "") === ro);
        if (existing) {
          jobId = existing.id;
          isExistingJob = true;
          console.log("Found existing job by RO:", ro);
        }
      }
      
      if (!jobId && this.fieldNames.jobs.claim && claim) {
        const existing = query.records.find(r => (r.getCellValue(this.fieldNames.jobs.claim) || "") === claim);
        if (existing) {
          jobId = existing.id;
          isExistingJob = true;
          console.log("Found existing job by Claim:", claim);
        }
      }
    }
    
    if (!jobId) {
      // Creating new job safely (PATCH): only write values that are valid for their field types
      const baseFields = {};
      const safeSet = (fieldName, value) => {
        if (!fieldName || value === undefined || value === null || value === "") return;
        const field = this.tables.jobs.fields.find(f => f.name === fieldName);
        if (!field) return;
        const shaped = FieldMapper.shapeValueForField(field, value);
        if (shaped.ok) baseFields[fieldName] = shaped.val;
        else this.rejects.push(`${fieldName}: ${shaped.reason}`);
      };
      
      // Identifiers (prefer writable text fields)
      safeSet(this.fieldNames.jobs.ro, ro || estimateNo);
      safeSet(this.fieldNames.jobs.claim, claim);
      safeSet(this.fieldNames.jobs.policy, policy);
      safeSet(this.fieldNames.jobs.estimateNo, estimateNo);
      
      // Include status/stage for new jobs if writable
      safeSet(this.fieldNames.jobs.status, jobData.status);
      safeSet(this.fieldNames.jobs.stage, jobData.stage);
      
      // IMPORTANT: Do NOT set insurer at create time (single-select may not have option). We'll set it after.
      
      // Fallback if none set
      if (!Object.keys(baseFields).length) {
        const textFields = this.tables.jobs.fields.filter(f =>
          !FieldMapper.isReadOnlyType(f.type) && (f.type === "singleLineText" || f.type === "multilineText")
        );
        
        if (textFields.length && (ro || claim || estimateNo)) {
          const fieldToUse = textFields[0];
          baseFields[fieldToUse.name] = ro || claim || estimateNo || ("Import " + new Date().toISOString().slice(0,10));
          console.warn(`Using fallback field '${fieldToUse.name}' with value:`, baseFields[fieldToUse.name]);
        } else {
          const errorMsg = `Cannot create job - no suitable writable text fields. Fields: ${this.tables.jobs.fields.map(f=>f.name).join(", ")}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      console.log("Creating new job with fields:", Object.keys(baseFields));
      console.log("Field values:", baseFields);
      
      jobId = await this.createRecordWithFallback(
        this.tables.jobs, 
        baseFields, 
        ro || claim || estimateNo || "Import " + new Date().toISOString().split('T')[0]
      );
      console.log("Created new job with ID:", jobId);

      // Set insurer (and other remaining fields) AFTER creation so failure won't block record creation
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.insurer, jobData.insurer, isExistingJob);
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.loss, jobData.loss, isExistingJob);
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.estimateDate, jobData.estimateDate, isExistingJob);
    }
    
    // Update job fields, skipping preserved fields on existing jobs
    for (const [key, value] of Object.entries(jobData)) {
      const fieldName = this.fieldNames.jobs[key];
      if (fieldName && value !== undefined) {
        await this.trySetField(this.tables.jobs, jobId, fieldName, value, isExistingJob);
      }
    }
    
    return { jobId, isExistingJob };
  }
  
  // Enhanced damage lines processing - PROPER PART DETECTION
  async processDamageLines(jobId, xml, linesTable, fieldNames, extractor, supplementNum = 0) {
    if (!linesTable || !jobId) return [];
    
    const parser = new XMLParser(xml);
    const lineInfo = [];
    
    // Delete existing lines for this supplement
    if (fieldNames.jobLink && fieldNames.uniqueSequenceNum && linesTable) {
      const existingQuery = await linesTable.selectRecordsAsync({
        fields: [fieldNames.jobLink, fieldNames.uniqueSequenceNum, fieldNames.supplementNum].filter(Boolean)
      });
      
      const existingLines = existingQuery.records.filter(r => {
        const jobLinks = r.getCellValue(fieldNames.jobLink);
        if (!jobLinks || !Array.isArray(jobLinks)) return false;
        const hasJob = jobLinks.some(link => link.id === jobId);
        
        const lineSupplement = fieldNames.supplementNum ? 
          (r.getCellValue(fieldNames.supplementNum) || 0) : 0;
        
        return hasJob && lineSupplement === supplementNum;
      });
      
      for (const record of existingLines) {
        await linesTable.deleteRecordAsync(record.id);
      }
    }
    
    // Process new damage lines
    const damageLineRegex = /<DamageLineInfo[^>]*>([\s\S]*?)<\/DamageLineInfo>/gi;
    let match;
    
    while ((match = damageLineRegex.exec(xml))) {
      const lineXml = match[1];
      
      const lineData = {
        lineNum: Utils.toNumber(parser.pick(lineXml, ["LineNum"])),
        uniqueSequenceNum: Utils.toNumber(parser.pick(lineXml, ["UniqueSequenceNum"])),
        description: parser.pick(lineXml, ["LineDesc"]),
        header: parser.pick(lineXml, ["LineHeaderDesc"]),
        lineStatus: parser.pick(lineXml, ["LineStatusCode"]),
        lineType: parser.pick(lineXml, ["LineType"]),
        supplementNum: supplementNum,
        lineMemo: parser.pick(lineXml, ["LineMemo"]),
        
        // Part info
        partNum: parser.pickIn(lineXml, ["PartInfo"], ["PartNum"]),
        partType: parser.pickIn(lineXml, ["PartInfo"], ["PartType"]),
        partPrice: Utils.toNumber(parser.pickIn(lineXml, ["PartInfo"], ["PartPrice"])),
        oemPartPrice: Utils.toNumber(parser.pickIn(lineXml, ["PartInfo"], ["OEMPartPrice"])),
        quantity: Utils.toNumber(parser.pickIn(lineXml, ["PartInfo"], ["Quantity"])) || null,
        
        // Labor info
        laborType: parser.pickIn(lineXml, ["LaborInfo"], ["LaborType"]),
        laborOperation: parser.pickIn(lineXml, ["LaborInfo"], ["LaborOperation"]),
        laborHours: Utils.toNumber(parser.pickIn(lineXml, ["LaborInfo"], ["LaborHours"])),
        
        // Vendor info
        vendor: extractor.extractVendor(lineXml)
      };
      
      if (!lineData.description || lineData.description === "") continue;
      
      // Proper part detection
      const isPartLine = !!(
        lineData.partNum && 
        lineData.partNum !== "Existing" && 
        lineData.partNum !== "Sublet" &&
        lineData.partPrice > 0 &&
        lineData.partType !== "PAE" &&
        lineData.laborOperation !== "OP2"
      );
      
      // Build fields for the record
      const fields = {};
      
      // Basic fields
      if (fieldNames.lineNum) fields[fieldNames.lineNum] = lineData.lineNum;
      if (fieldNames.uniqueSequenceNum) fields[fieldNames.uniqueSequenceNum] = lineData.uniqueSequenceNum;
      if (fieldNames.description) fields[fieldNames.description] = lineData.description;
      if (fieldNames.header) fields[fieldNames.header] = lineData.header;
      if (fieldNames.jobLink) fields[fieldNames.jobLink] = [{id: jobId}];
      if (fieldNames.supplementNum && lineData.supplementNum !== null) {
        fields[fieldNames.supplementNum] = lineData.supplementNum;
      }
      if (fieldNames.lineMemo && lineData.lineMemo) {
        fields[fieldNames.lineMemo] = lineData.lineMemo;
      }
      
      // Part fields
      if (fieldNames.partNum && lineData.partNum && lineData.partNum !== "Existing") {
        fields[fieldNames.partNum] = lineData.partNum;
      }
      
      // Map part type
      if (fieldNames.partType && lineData.partType) {
        const mappedType = PART_TYPE_MAP[lineData.partType] || lineData.partType;
        fields[fieldNames.partType] = { name: mappedType };
      }
      
      if (fieldNames.partPrice && lineData.partPrice > 0) {
        fields[fieldNames.partPrice] = lineData.partPrice;
      }
      if (fieldNames.oemPartPrice && lineData.oemPartPrice > 0) {
        fields[fieldNames.oemPartPrice] = lineData.oemPartPrice;
      }
      
      if (fieldNames.quantity && lineData.quantity !== null) {
        fields[fieldNames.quantity] = lineData.quantity;
      }
      
      // Part tracking fields
      if (fieldNames.isPartLine) {
        fields[fieldNames.isPartLine] = isPartLine;
      }
      if (fieldNames.partReceived && isPartLine) {
        fields[fieldNames.partReceived] = false;
      }
      if (fieldNames.vendor && lineData.vendor) {
        fields[fieldNames.vendor] = lineData.vendor;
      }
      if (fieldNames.orderStatus && isPartLine) {
        fields[fieldNames.orderStatus] = "To Order";
      }
      
      // Labor fields
      if (fieldNames.laborType && lineData.laborType) {
        fields[fieldNames.laborType] = { name: lineData.laborType };
      }
      
      if (fieldNames.laborOperation && lineData.laborOperation) {
        let operation = LABOR_OPERATION_MAP[lineData.laborOperation] || lineData.laborOperation;
        
        if (lineData.laborOperation === "OP11" && lineData.partNum && lineData.partPrice > 0 && lineData.partType !== "PAE") {
          operation = "Replace";
        }
        
        fields[fieldNames.laborOperation] = { name: operation };
      }
      
      if (fieldNames.laborHours && lineData.laborHours > 0) {
        fields[fieldNames.laborHours] = lineData.laborHours;
      }
      
      // Status field
      if (fieldNames.status) {
        const statusMap = {
          "1": "Active",
          "0": "Deleted",
          "2": "Replaced"
        };
        fields[fieldNames.status] = statusMap[lineData.lineStatus] || "Active";
      }
      
      // Create the line record
      try {
        const lineId = await linesTable.createRecordAsync(fields);
        lineInfo.push({
          id: lineId,
          partNum: lineData.partNum,
          isPartLine: isPartLine,
          partPrice: lineData.partPrice,
          description: lineData.description
        });
      } catch (e) {
        console.error(`Failed to create line ${lineData.lineNum}: ${e.message}`);
      }
    }
    
    return lineInfo;
  }
  
  async linkDamageLinesToPartsCatalog(lineInfo, partsTable, fieldNames) {
    if (!partsTable || !lineInfo.length) return;
    
    const partLines = lineInfo.filter(l => l.isPartLine && l.partNum);
    if (!partLines.length) return;
    
    const partsQuery = await partsTable.selectRecordsAsync({
      fields: [fieldNames.partNumber, fieldNames.currentPrice].filter(Boolean)
    });
    
    for (const line of partLines) {
      if (!line.partNum || line.partNum === "Existing" || line.partNum === "Sublet") continue;
      
      let partRecord = partsQuery.records.find(p => 
        (p.getCellValue(fieldNames.partNumber) || "") === line.partNum
      );
      
      if (!partRecord && fieldNames.partNumber) {
        try {
          const newPartFields = {
            [fieldNames.partNumber]: line.partNum
          };
          
          if (fieldNames.description) {
            newPartFields[fieldNames.description] = line.description;
          }
          if (fieldNames.currentPrice && line.partPrice) {
            newPartFields[fieldNames.currentPrice] = line.partPrice;
          }
          if (fieldNames.lastUpdated) {
            newPartFields[fieldNames.lastUpdated] = new Date();
          }
          
          const partId = await partsTable.createRecordAsync(newPartFields);
          partRecord = { id: partId };
        } catch (e) {
          console.error(`Failed to create part catalog entry for ${line.partNum}: ${e.message}`);
        }
      }
      
      if (partRecord && this.fieldNames.damageLines.partsCatalogLink) {
        try {
          await this.tables.damageLines.updateRecordAsync(line.id, {
            [this.fieldNames.damageLines.partsCatalogLink]: [{id: partRecord.id}]
          });
        } catch (e) {
          console.error(`Failed to link line to part catalog: ${e.message}`);
        }
      }
    }
  }
  
  // CRITICAL: Recalculate from scratch to avoid duplication
  async recalculateJobPartsTracking(jobId) {
    if (!jobId || !this.tables.jobs || !this.tables.damageLines) return;
    
    // Query ALL damage lines for this job
    const damageQuery = await this.tables.damageLines.selectRecordsAsync({
      fields: [
        this.fieldNames.damageLines.jobLink,
        this.fieldNames.damageLines.isPartLine,
        this.fieldNames.damageLines.partReceived
      ].filter(Boolean)
    });
    
    // Filter to lines for this job
    const jobLines = damageQuery.records.filter(r => {
      const jobLinks = r.getCellValue(this.fieldNames.damageLines.jobLink);
      if (!jobLinks || !Array.isArray(jobLinks)) return false;
      return jobLinks.some(link => link.id === jobId);
    });
    
    // Count actual parts (where isPartLine is true)
    let totalPartsCount = 0;
    let partsReceivedCount = 0;
    
    for (const line of jobLines) {
      const isPart = line.getCellValue(this.fieldNames.damageLines.isPartLine);
      if (isPart) {
        totalPartsCount++;
        const isReceived = line.getCellValue(this.fieldNames.damageLines.partReceived);
        if (isReceived) {
          partsReceivedCount++;
        }
      }
    }
    
    // Update job with recalculated counts
    if (this.fieldNames.jobs.totalPartsCount) {
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.totalPartsCount, totalPartsCount);
    }
    
    if (this.fieldNames.jobs.partsReceivedCount) {
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.partsReceivedCount, partsReceivedCount);
    }
    
    if (this.fieldNames.jobs.readyToBook) {
      const readyStatus = totalPartsCount === 0 || totalPartsCount === partsReceivedCount ? "Ready" : "Waiting on Parts";
      await this.trySetField(this.tables.jobs, jobId, this.fieldNames.jobs.readyToBook, readyStatus);
    }
  }
  
  normalizeInsurer(insurerName, field) {
    if (!field || field.type !== "singleSelect") return insurerName;
    
    const options = field.options?.choices || [];
    const normalizedInsurer = Utils.normalize(insurerName || "");
    
    const exactMatch = options.find(o => Utils.normalize(o.name) === normalizedInsurer);
    if (exactMatch) return exactMatch.name;
    
    if (/insurance corporation of british columbia/i.test(insurerName)) {
      const icbcOption = options.find(o => /icbc/i.test(o.name));
      if (icbcOption) return icbcOption.name;
    } else if (/icbc/i.test(insurerName)) {
      const longOption = options.find(o => /insurance corporation of british columbia/i.test(o.name));
      if (longOption) return longOption.name;
    }
    
    return insurerName;
  }
}

/* ============================================================================
   WORKFLOW HELPERS (Stage/Status/Ready logic)
============================================================================ */

// Simplified ordered stage progression (must match Airtable options)
const STAGE_ORDER = [
  "Estimate",
  "Intake",
  "Blueprint",
  "Parts",
  "Body",
  "Paint",
  "Reassembly",
  "QC & Calibrate",
  "Detail",
  "Ready",
  "Delivered"
];

// Legacy → simplified stage mapping so old records keep flowing
const LEGACY_STAGE_MAP = new Map([
  ["Intake / Check-in", "Intake"],
  ["Tear-down & Blueprint", "Blueprint"],
  ["Supplement Pending", "Blueprint"],
  ["Supplement Approved", "Blueprint"],
  ["Parts Ordering", "Parts"],
  ["Parts Receiving", "Parts"],
  ["Body / Structure", "Body"],
  ["Mechanical / Sublet", "Body"],
  ["Paint Prep", "Paint"],
  ["Paint Booth", "Paint"],
  ["Calibrations & Alignment", "QC & Calibrate"],
  ["Post-Scan, QC & Road Test", "QC & Calibrate"],
  ["Detail / Final Clean", "Detail"],
  ["Ready for Pickup", "Ready"]
]);

function pickStatus(job, derived) {
  if (derived.totalLoss) return "Total Loss";
  if (derived.delivered) return "Delivered";
  if (derived.readyForPickup) return "Ready";
  if (derived.atSublet) return "At Sublet";
  if (!derived.droppedOff) return derived.bookedDate ? "Awaiting Drop-off" : "Scheduled";
  // any blocking condition → On Hold (aka “Waiting” in some bases)
  if (derived.hasSuppPending || derived.hasBackorder || !derived.allCriticalPartsReceived) return "On Hold";
  return "In Shop";
}

function pickReadyToBook(job, derived) {
  if (derived.totalLoss) return "Not Repairing / Total Loss";
  if (!derived.approvedByInsurer) return "Waiting on Approval";
  if (!derived.bookedDate && !derived.droppedOff) return "Waiting on Slot";
  if (derived.bookedDate && !derived.droppedOff) return "Waiting on Vehicle";
  if (!derived.allCriticalPartsReceived) return "Waiting on Parts";
  return "Ready";
}

function nextStage(currentStage, derived) {
  if (!currentStage) return "Estimate";
  // normalize legacy labels
  currentStage = LEGACY_STAGE_MAP.get(currentStage) || currentStage;
  // don't advance while on hold / waiting
  const onHold = derived.statusCandidate && /(on hold|waiting)/i.test(derived.statusCandidate);
  if (onHold) return currentStage;
  const idx = STAGE_ORDER.indexOf(currentStage);
  let target = currentStage;

  // minimal, deterministic advancement rules
  if (derived.droppedOff && currentStage === "Estimate")           target = "Intake";
  else if (derived.hasSuppPending || derived.suppApproved)         target = "Blueprint";
  else if (derived.partsOrdered || derived.partsReceiving)         target = "Parts";
  else if (derived.inBody || derived.inMechanicalOrSublet)         target = "Body";
  else if (derived.inPaintPrep || derived.inPaintBooth)            target = "Paint";
  else if (derived.inReassembly)                                   target = "Reassembly";
  else if (derived.needsCalibrations || derived.inQC)              target = "QC & Calibrate";
  else if (derived.inDetail)                                       target = "Detail";
  else if (derived.readyForPickup)                                 target = "Ready";
  else if (derived.delivered)                                      target = "Delivered";

  const tidx = STAGE_ORDER.indexOf(target);
  return tidx > idx ? target : currentStage;
}

async function computeDerived(jobId, tables, fieldNames) {
  const jobs = tables.jobs;
  const jobFields = [
    fieldNames.jobs.stage,
    fieldNames.jobs.status,
    fieldNames.jobs.bookedDate,
    fieldNames.jobs.droppedOff,
    fieldNames.jobs.deliveredChk,
    fieldNames.jobs.totalLossChk,
    fieldNames.jobs.approvedByInsurer,
    fieldNames.jobs.suppApproved,
    fieldNames.jobs.hasSuppPending,
    fieldNames.jobs.readyForPickupFlag,
    fieldNames.jobs.postScanRequired,
    fieldNames.jobs.adasCalibrationRequired,
    fieldNames.jobs.fourWheelAlignment
  ].filter(Boolean);
  const jobQuery = await jobs.selectRecordsAsync({ fields: jobFields, recordIds: [jobId] });
  const rec = jobQuery.records[0] || null;
  const getName = (val) => (val && val.name) || "";
  const getBool = (fieldName) => fieldName ? Boolean(rec && rec.getCellValue(fieldName)) : false;
  const getDate = (fieldName) => fieldName ? (rec && rec.getCellValue(fieldName)) : null;
  const currentStatusName = rec && fieldNames.jobs.status ? getName(rec.getCellValue(fieldNames.jobs.status)) : "";
  
  const derived = {
    approvedByInsurer: getBool(fieldNames.jobs.approvedByInsurer),
    hasSuppPending: getBool(fieldNames.jobs.hasSuppPending),
    suppApproved: getBool(fieldNames.jobs.suppApproved),
    bookedDate: getDate(fieldNames.jobs.bookedDate),
    droppedOff: getBool(fieldNames.jobs.droppedOff),
    readyForPickup: getBool(fieldNames.jobs.readyForPickupFlag),
    delivered: getBool(fieldNames.jobs.deliveredChk) || /delivered/i.test(currentStatusName),
    totalLoss: getBool(fieldNames.jobs.totalLossChk) || /total\s*loss/i.test(currentStatusName),
    
    // Parts-related defaults; will compute from damage lines
    allCriticalPartsReceived: true,
    hasBackorder: false,
    partsReceiving: false,
    partsOrdered: false,
    
    // Stage activity flags
    inBody: false,
    inMechanicalOrSublet: false,
    inPaintPrep: false,
    inPaintBooth: false,
    inReassembly: false,
    inQC: false,
    inDetail: false,
    atSublet: false,
    needsCalibrations: false
  };
  
  // Calibrations from job flags
  if (getBool(fieldNames.jobs.adasCalibrationRequired) || getBool(fieldNames.jobs.fourWheelAlignment)) {
    derived.needsCalibrations = true;
  }
  
  // Damage lines analysis
  if (tables.damageLines && fieldNames.damageLines.jobLink) {
    const dlFields = [
      fieldNames.damageLines.jobLink,
      fieldNames.damageLines.isPartLine,
      fieldNames.damageLines.partReceived,
      fieldNames.damageLines.orderStatus,
      fieldNames.damageLines.vendor,
      fieldNames.damageLines.laborOperation,
      fieldNames.damageLines.header,
      fieldNames.damageLines.lineMemo
    ].filter(Boolean);
    const dlQuery = await tables.damageLines.selectRecordsAsync({ fields: dlFields });
    const lines = dlQuery.records.filter(r => {
      const links = r.getCellValue(fieldNames.damageLines.jobLink) || [];
      return Array.isArray(links) && links.some(l => l.id === jobId);
    });
    
    // Parts computations
    const partLines = lines.filter(r => fieldNames.damageLines.isPartLine ? Boolean(r.getCellValue(fieldNames.damageLines.isPartLine)) : false);
    const totalRealParts = partLines.length;
    if (totalRealParts === 0) {
      derived.allCriticalPartsReceived = true;
    } else {
      const receivedCount = partLines.filter(r => fieldNames.damageLines.partReceived && Boolean(r.getCellValue(fieldNames.damageLines.partReceived))).length;
      derived.allCriticalPartsReceived = receivedCount === totalRealParts;
    }
    
    // Order/backorder heuristics
    for (const r of partLines) {
      const osName = fieldNames.damageLines.orderStatus ? getName(r.getCellValue(fieldNames.damageLines.orderStatus) || {}) : "";
      const memo = fieldNames.damageLines.lineMemo ? (r.getCellValue(fieldNames.damageLines.lineMemo) || "") : "";
      if (/backorder/i.test(osName) || /backorder/i.test(String(memo))) derived.hasBackorder = true;
      if (/ordered|to order|on order|po|purchased/i.test(osName)) derived.partsOrdered = true;
      const received = fieldNames.damageLines.partReceived && Boolean(r.getCellValue(fieldNames.damageLines.partReceived));
      if (!received && (/ordered|shipped|in transit|on order/i.test(osName))) derived.partsReceiving = true;
    }
    
    // Sublet detection and stage cues
    for (const r of lines) {
      const opName = fieldNames.damageLines.laborOperation ? getName(r.getCellValue(fieldNames.damageLines.laborOperation) || {}) : "";
      const header = fieldNames.damageLines.header ? (r.getCellValue(fieldNames.damageLines.header) || "") : "";
      const memo = fieldNames.damageLines.lineMemo ? (r.getCellValue(fieldNames.damageLines.lineMemo) || "") : "";
      if (/sublet/i.test(opName)) {
        derived.inMechanicalOrSublet = true;
        derived.atSublet = true;
      }
      if (/repair|replace/i.test(opName) || /body/i.test(header)) derived.inBody = true;
      if (/refinish|paint/i.test(opName) || /paint/i.test(header)) derived.inPaintPrep = true;
      if (/reassembly|re-assembly/i.test(header) || /reassembly/i.test(memo)) derived.inReassembly = true;
      if (/detail/i.test(header) || /detail/i.test(memo)) derived.inDetail = true;
    }
  }
  
  // If dropped off and all parts received, assume we're in body if nothing else flagged
  if (derived.droppedOff && derived.allCriticalPartsReceived && !derived.inBody) {
    derived.inBody = true;
  }
  
  // QC if any post-scan required
  if (getBool(fieldNames.jobs.postScanRequired)) derived.inQC = true;
  // Calibrations from job requirements
  if (getBool(fieldNames.jobs.adasCalibrationRequired) || getBool(fieldNames.jobs.fourWheelAlignment)) derived.needsCalibrations = true;
  
  return derived;
}

async function safeUpdateJobWorkflowFields(jobId, labels, tables, fieldNames, currentRecord) {
  const jobs = tables.jobs;
  const statusField = fieldNames.jobs.status;
  const stageField = fieldNames.jobs.stage;
  const readyField = fieldNames.jobs.readyToBook;
  if (!jobs) return;
  
  const getName = (val) => (val && val.name) || "";
  const curStatusName = currentRecord && statusField ? getName(currentRecord.getCellValue(statusField)) : "";
  const curStageName = currentRecord && stageField ? getName(currentRecord.getCellValue(stageField)) : "";
  const curReadyName = currentRecord && readyField ? getName(currentRecord.getCellValue(readyField)) : "";
  const delivered = currentRecord && (
    (fieldNames.jobs.deliveredChk && Boolean(currentRecord.getCellValue(fieldNames.jobs.deliveredChk))) ||
    /delivered/i.test(curStatusName)
  );
  const isTotalLoss = currentRecord && (
    (fieldNames.jobs.totalLossChk && Boolean(currentRecord.getCellValue(fieldNames.jobs.totalLossChk))) ||
    /total\s*loss/i.test(curStatusName)
  );
  
  if (delivered) {
    console.log("Job delivered/closed — skipping Stage/Status updates.");
    return;
  }
  
  const update = {};
  
  if (isTotalLoss) {
    if (statusField && curStatusName !== "Total Loss") update[statusField] = { name: "Total Loss" };
    if (readyField && curReadyName !== "Not Repairing / Total Loss") update[readyField] = { name: "Not Repairing / Total Loss" };
    if (Object.keys(update).length) await jobs.updateRecordAsync(jobId, update);
    return;
  }
  
  // Status
  if (statusField && labels.statusLabel && labels.statusLabel !== curStatusName) {
    update[statusField] = { name: labels.statusLabel };
  }
  
  // Stage with non-regression
  if (stageField && labels.stageLabel) {
    const curIdx = curStageName ? STAGE_ORDER.indexOf(curStageName) : -1;
    const nextIdx = STAGE_ORDER.indexOf(labels.stageLabel);
    if (nextIdx > curIdx && labels.stageLabel !== curStageName) {
      update[stageField] = { name: labels.stageLabel };
    }
  }
  
  // Ready to Book
  if (readyField && labels.readyLabel && labels.readyLabel !== curReadyName) {
    update[readyField] = { name: labels.readyLabel };
  }
  
  if (Object.keys(update).length) {
    await jobs.updateRecordAsync(jobId, update);
  }
}

// Run the script
main().catch(error => {
  output.set("status", "Error");
  output.set("notes", error.message);
  output.set("debug", error.stack);
});
