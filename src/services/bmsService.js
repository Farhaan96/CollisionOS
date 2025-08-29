import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

class BMSService {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    });
    
    // Initialize validation and error tracking
    this.validationErrors = [];
    this.processingWarnings = [];
    
    // Initialize field mapping system
    this.fieldMapper = new BMSFieldMapper();
  }

  /**
   * Parse BMS XML file and extract all relevant information
   * @param {string} xmlContent - The XML content as string
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed BMS data with validation
   */
  parseBMSFile(xmlContent, options = {}) {
    try {
      // Clear previous validation errors
      this.validationErrors = [];
      this.processingWarnings = [];
      
      const parsed = this.parser.parse(xmlContent);
      const bmsData = parsed.VehicleDamageEstimateAddRq;

      const extractedData = {
        documentInfo: this.extractDocumentInfo(bmsData),
        adminInfo: this.extractAdminInfo(bmsData),
        claimInfo: this.extractClaimInfo(bmsData),
        vehicleInfo: this.extractVehicleInfo(bmsData),
        damageLines: this.extractDamageLines(bmsData),
        totals: this.extractTotals(bmsData),
        profileInfo: this.extractProfileInfo(bmsData),
        eventInfo: this.extractEventInfo(bmsData)
      };

      // Perform validation if requested
      if (options.validate !== false) {
        const validation = this.validateBMSData(extractedData);
        extractedData.validation = validation;
        
        // Log validation results
        if (validation.warnings.length > 0) {
          console.warn('BMS Data Validation Warnings:', validation.warnings);
          this.processingWarnings.push(...validation.warnings);
        }
        
        if (validation.errors.length > 0) {
          console.error('BMS Data Validation Errors:', validation.errors);
          this.validationErrors.push(...validation.errors);
        }
      }

      return extractedData;
    } catch (error) {
      console.error('Error parsing BMS file:', error);
      this.validationErrors.push(`Parse error: ${error.message}`);
      throw new Error('Failed to parse BMS file: ' + error.message);
    }
  }

  /**
   * Extract document information
   */
  extractDocumentInfo(bmsData) {
    const docInfo = bmsData.DocumentInfo;
    return {
      bmsVersion: docInfo.BMSVer,
      documentType: docInfo.DocumentType,
      documentId: docInfo.DocumentID,
      vendorCode: docInfo.VendorCode,
      documentStatus: docInfo.DocumentStatus,
      createDateTime: docInfo.CreateDateTime,
      transmitDateTime: docInfo.TransmitDateTime,
      claimNumber: bmsData.RefClaimNum,
      requestUID: bmsData.RqUID,
      currency: {
        code: docInfo.CurrencyInfo?.CurCode,
        baseCode: docInfo.CurrencyInfo?.BaseCurCode,
        rate: docInfo.CurrencyInfo?.CurRate
      }
    };
  }

  /**
   * Extract administrative information
   */
  extractAdminInfo(bmsData) {
    const admin = bmsData.AdminInfo;
    
    return {
      insuranceCompany: this.extractPartyInfo(admin.InsuranceCompany?.Party),
      policyHolder: this.extractPartyInfo(admin.PolicyHolder?.Party),
      owner: this.extractPartyInfo(admin.Owner?.Party),
      estimator: {
        ...this.extractPartyInfo(admin.Estimator?.Party),
        affiliation: admin.Estimator?.Affiliation
      },
      inspectionSite: this.extractPartyInfo(admin.InspectionSite?.Party),
      repairFacility: this.extractPartyInfo(admin.RepairFacility?.Party),
      adjuster: this.extractPartyInfo(admin.Adjuster?.Party),
      supplier: this.extractPartyInfo(admin.Supplier?.Party),
      sender: this.extractPartyInfo(admin.Sender?.Party)
    };
  }

  /**
   * Extract party information (person or organization)
   */
  extractPartyInfo(party) {
    if (!party) return null;

    const personInfo = party.PersonInfo;
    const orgInfo = party.OrgInfo;
    const contactInfo = party.ContactInfo;

    if (personInfo) {
      return {
        type: 'person',
        firstName: personInfo.PersonName?.FirstName,
        lastName: personInfo.PersonName?.LastName,
        fullName: `${personInfo.PersonName?.FirstName || ''} ${personInfo.PersonName?.LastName || ''}`.trim(),
        address: this.extractAddress(personInfo.Communications),
        phone: this.extractPhone(contactInfo?.Communications),
        email: this.extractEmail(contactInfo?.Communications)
      };
    } else if (orgInfo) {
      return {
        type: 'organization',
        companyName: orgInfo.CompanyName,
        address: this.extractAddress(orgInfo.Communications),
        phone: this.extractPhone(contactInfo?.Communications),
        email: this.extractEmail(contactInfo?.Communications),
        idInfo: orgInfo.IDInfo ? {
          qualifier: orgInfo.IDInfo.IDQualifierCode,
          number: orgInfo.IDInfo.IDNum
        } : null
      };
    }

    return null;
  }

  /**
   * Extract address information
   */
  extractAddress(communications) {
    if (!communications) return null;

    const addressComm = Array.isArray(communications) 
      ? communications.find(comm => comm.CommQualifier === 'AL')
      : communications.CommQualifier === 'AL' ? communications : null;

    if (!addressComm?.Address) return null;

    return {
      address1: addressComm.Address.Address1,
      city: addressComm.Address.City,
      stateProvince: addressComm.Address.StateProvince,
      postalCode: addressComm.Address.PostalCode
    };
  }

  /**
   * Extract phone information
   */
  extractPhone(communications) {
    if (!communications) return null;

    const phoneComm = Array.isArray(communications)
      ? communications.find(comm => ['HP', 'WP', 'CP'].includes(comm.CommQualifier))
      : ['HP', 'WP', 'CP'].includes(communications.CommQualifier) ? communications : null;

    return phoneComm?.CommPhone || null;
  }

  /**
   * Extract email information
   */
  extractEmail(communications) {
    if (!communications) return null;

    const emailComm = Array.isArray(communications)
      ? communications.find(comm => comm.CommQualifier === 'EM')
      : communications.CommQualifier === 'EM' ? communications : null;

    return emailComm?.CommEmail || null;
  }

  /**
   * Extract claim information
   */
  extractClaimInfo(bmsData) {
    const claim = bmsData.ClaimInfo;
    
    return {
      claimNumber: claim.ClaimNum,
      policyNumber: claim.PolicyInfo?.PolicyNum,
      coverage: claim.PolicyInfo?.CoverageInfo?.Coverage ? {
        category: claim.PolicyInfo.CoverageInfo.Coverage.CoverageCategory,
        deductible: {
          status: claim.PolicyInfo.CoverageInfo.Coverage.DeductibleInfo?.DeductibleStatus,
          amount: claim.PolicyInfo.CoverageInfo.Coverage.DeductibleInfo?.DeductibleAmt
        }
      } : null,
      loss: claim.LossInfo ? {
        dateTime: claim.LossInfo.Facts?.LossDateTime,
        reportedDateTime: claim.LossInfo.Facts?.ReportedDateTime,
        primaryPOI: claim.LossInfo.Facts?.PrimaryPOI?.POICode,
        damageMemo: claim.LossInfo.Facts?.DamageMemo,
        lossMemo: claim.LossInfo.Facts?.LossMemo,
        totalLoss: claim.LossInfo.TotalLossInd === 'Y'
      } : null,
      customElements: this.extractCustomElements(claim.CustomElement)
    };
  }

  /**
   * Extract custom elements
   */
  extractCustomElements(customElements) {
    if (!customElements) return {};

    const elements = Array.isArray(customElements) ? customElements : [customElements];
    const result = {};

    elements.forEach(element => {
      if (element.CustomElementID) {
        result[element.CustomElementID] = {
          text: element.CustomElementText,
          decimal: element.CustomElementDecimal,
          indicator: element.CustomElementInd
        };
      }
    });

    return result;
  }

  /**
   * Extract vehicle information
   */
  extractVehicleInfo(bmsData) {
    const vehicle = bmsData.VehicleInfo;
    
    return {
      vin: vehicle.VINInfo?.VIN?.VINNum,
      license: {
        plateNumber: vehicle.License?.LicensePlateNum,
        stateProvince: vehicle.License?.LicensePlateStateProvince
      },
      description: {
        productionDate: vehicle.VehicleDesc?.ProductionDate,
        modelYear: vehicle.VehicleDesc?.ModelYear,
        makeCode: vehicle.VehicleDesc?.MakeCode,
        makeDesc: vehicle.VehicleDesc?.MakeDesc,
        modelNum: vehicle.VehicleDesc?.ModelNum,
        modelName: vehicle.VehicleDesc?.ModelName,
        subModelDesc: vehicle.VehicleDesc?.SubModelDesc,
        vehicleType: vehicle.VehicleDesc?.VehicleType,
        bodyStyle: vehicle.Body?.BodyStyle,
        engineDesc: vehicle.Powertrain?.EngineDesc,
        engineCode: vehicle.Powertrain?.EngineCode,
        transmissionDesc: vehicle.Powertrain?.TransmissionInfo?.TransmissionDesc,
        fuelType: vehicle.Powertrain?.FuelType
      },
      odometer: vehicle.VehicleDesc?.OdometerInfo ? {
        reading: vehicle.VehicleDesc.OdometerInfo.OdometerReading,
        measure: vehicle.VehicleDesc.OdometerInfo.OdometerReadingMeasure
      } : null,
      paint: {
        exterior: vehicle.Paint?.Exterior?.Color?.ColorName,
        interior: vehicle.Paint?.Interior?.Color?.ColorName
      },
      condition: vehicle.Condition ? {
        conditionCode: vehicle.Condition.ConditionCode,
        drivable: vehicle.Condition.DrivableInd === 'Y',
        priorDamage: vehicle.Condition.PriorDamageInd === 'Y',
        priorDamageMemo: vehicle.Condition.PriorDamageMemo
      } : null,
      valuation: vehicle.Valuation ? {
        type: vehicle.Valuation.ValuationType,
        amount: vehicle.Valuation.ValuationAmt
      } : null,
      options: this.extractVehicleOptions(vehicle.VehicleDesc?.VehicleOptions)
    };
  }

  /**
   * Extract vehicle options
   */
  extractVehicleOptions(options) {
    if (!options?.Option) return [];

    const optionList = Array.isArray(options.Option) ? options.Option : [options.Option];
    
    return optionList.map(option => ({
      code: option.OptionCode,
      description: option.OptionDesc
    }));
  }

  /**
   * Extract damage line items
   */
  extractDamageLines(bmsData) {
    if (!bmsData.DamageLineInfo) return [];

    const lines = Array.isArray(bmsData.DamageLineInfo) 
      ? bmsData.DamageLineInfo 
      : [bmsData.DamageLineInfo];

    return lines.map(line => ({
      lineNum: line.LineNum,
      uniqueSequenceNum: line.UniqueSequenceNum,
      parentLineNum: line.ParentLineNum,
      lineDesc: line.LineDesc,
      lineHeaderDesc: line.LineHeaderDesc,
      lineType: line.LineType,
      vendorRefNum: line.VendorRefNum,
      partInfo: this.extractPartInfo(line.PartInfo),
      laborInfo: this.extractLaborInfo(line.LaborInfo),
      materialType: line.MaterialType,
      otherChargesInfo: this.extractOtherChargesInfo(line.OtherChargesInfo),
      appliedAdjustment: line.AppliedAdjustment
    }));
  }

  /**
   * Extract part information
   */
  extractPartInfo(partInfo) {
    if (!partInfo) return null;

    return {
      sourceCode: partInfo.PartSourceCode,
      partType: partInfo.PartType,
      partNum: partInfo.PartNum,
      oemPartNum: partInfo.OEMPartNum,
      partPrice: partInfo.PartPrice,
      oemPartPrice: partInfo.OEMPartPrice,
      quantity: partInfo.Quantity,
      taxable: partInfo.TaxableInd === '1',
      nonOEM: partInfo.NonOEM ? {
        partType: partInfo.NonOEM.PartType,
        partNum: partInfo.NonOEM.NonOEMPartNum,
        price: partInfo.NonOEM.NonOEMPartPrice,
        supplierRef: partInfo.NonOEM.SupplierRefNum,
        selected: partInfo.NonOEM.PartSelectedInd === '1'
      } : null
    };
  }

  /**
   * Extract labor information
   */
  extractLaborInfo(laborInfo) {
    if (!laborInfo) return null;

    return {
      laborType: laborInfo.LaborType,
      laborOperation: laborInfo.LaborOperation,
      laborHours: laborInfo.LaborHours,
      databaseLaborHours: laborInfo.DatabaseLaborHours,
      laborHoursCalc: laborInfo.LaborHoursCalc,
      laborIncl: laborInfo.LaborInclInd === '1',
      taxable: laborInfo.TaxableInd === '1',
      paintStagesNum: laborInfo.PaintStagesNum,
      blendAsterisk: laborInfo.BlendAsteriskInd === 'true'
    };
  }

  /**
   * Extract other charges information
   */
  extractOtherChargesInfo(otherChargesInfo) {
    if (!otherChargesInfo) return null;

    return {
      type: otherChargesInfo.OtherChargesType,
      price: otherChargesInfo.Price,
      taxable: otherChargesInfo.TaxableInd === '1',
      priceIncl: otherChargesInfo.PriceInclInd === '1'
    };
  }

  /**
   * Extract totals information
   */
  extractTotals(bmsData) {
    const totals = bmsData.RepairTotalsInfo;
    if (!totals) return null;

    return {
      laborTotals: this.extractTotalInfo(totals.LaborTotalsInfo),
      partsTotals: this.extractTotalInfo(totals.PartsTotalsInfo),
      otherChargesTotals: this.extractTotalInfo(totals.OtherChargesTotalsInfo),
      summaryTotals: this.extractSummaryTotals(totals.SummaryTotalsInfo)
    };
  }

  /**
   * Extract total information
   */
  extractTotalInfo(totalInfo) {
    if (!totalInfo) return null;

    return {
      totalType: totalInfo.TotalType,
      totalTypeDesc: totalInfo.TotalTypeDesc,
      taxableAmt: totalInfo.TaxableAmt,
      taxTotalAmt: totalInfo.TaxTotalAmt,
      totalAmt: totalInfo.TotalAmt,
      taxInfo: this.extractTaxInfo(totalInfo.TotalTaxInfo)
    };
  }

  /**
   * Extract tax information
   */
  extractTaxInfo(taxInfo) {
    if (!taxInfo) return [];

    const taxes = Array.isArray(taxInfo) ? taxInfo : [taxInfo];
    
    return taxes.map(tax => ({
      taxType: tax.TaxType,
      tierNum: tax.TierNum,
      taxAmt: tax.TaxAmt
    }));
  }

  /**
   * Extract summary totals
   */
  extractSummaryTotals(summaryTotals) {
    if (!summaryTotals) return [];

    const totals = Array.isArray(summaryTotals) ? summaryTotals : [summaryTotals];
    
    return totals.map(total => ({
      totalType: total.TotalType,
      totalSubType: total.TotalSubType,
      totalTypeDesc: total.TotalTypeDesc,
      totalAmt: total.TotalAmt,
      adjustment: total.TotalAdjustmentInfo ? {
        type: total.TotalAdjustmentInfo.AdjustmentType,
        amount: total.TotalAdjustmentInfo.TotalAdjustmentAmt
      } : null
    }));
  }

  /**
   * Extract profile information
   */
  extractProfileInfo(bmsData) {
    const profile = bmsData.ProfileInfo;
    if (!profile) return null;

    return {
      profileName: profile.ProfileName,
      profileUUID: profile.ProfileUUID,
      rates: this.extractRateInfo(profile.RateInfo),
      alternatePartInfo: this.extractAlternatePartInfo(profile.AlternatePartInfo),
      partCertification: profile.PartCertification ? {
        certificationType: profile.PartCertification.CertificationType,
        certifiedOnly: profile.PartCertification.CertifiedOnlyInd === '1',
        certifiedPreferred: profile.PartCertification.CertifiedPreferredInd === '1'
      } : null
    };
  }

  /**
   * Extract rate information
   */
  extractRateInfo(rateInfo) {
    if (!rateInfo) return [];

    const rates = Array.isArray(rateInfo) ? rateInfo : [rateInfo];
    
    return rates.map(rate => ({
      type: rate.RateType,
      description: rate.RateDesc,
      rate: rate.RateTierInfo?.[0]?.Rate,
      percentage: rate.RateTierInfo?.[0]?.Percentage,
      taxable: rate.TaxableInd === '1'
    }));
  }

  /**
   * Extract alternate part information
   */
  extractAlternatePartInfo(alternatePartInfo) {
    if (!alternatePartInfo) return [];

    const parts = Array.isArray(alternatePartInfo) ? alternatePartInfo : [alternatePartInfo];
    
    return parts.map(part => ({
      partType: part.PartType,
      searchSourceCode: part.SearchSourceCode,
      searchCode: part.SearchCode,
      disclosureStateProvince: part.DisclosureStateProvince,
      beginSearchPostalCode: part.BeginSearchPostalCode,
      onlinePartProfile: {
        id: part.OnlinePartProfileID,
        name: part.OnlinePartProfileName,
        version: part.OnlinePartProfileVersion,
        dateTime: part.OnlinePartProfileDateTime
      }
    }));
  }

  /**
   * Extract event information
   */
  extractEventInfo(bmsData) {
    const events = bmsData.EventInfo;
    if (!events) return null;

    return {
      assignment: events.AssignmentEvent ? {
        createDateTime: events.AssignmentEvent.CreateDateTime,
        inspectionDateTime: events.AssignmentEvent.InspectionDateTime
      } : null,
      estimate: events.EstimateEvent ? {
        commitDateTime: events.EstimateEvent.CommitDateTime,
        uploadDateTime: events.EstimateEvent.UploadDateTime,
        printDateTime: events.EstimateEvent.PrintDateTime
      } : null,
      otherEvents: this.extractOtherEvents(events.OtherEvent)
    };
  }

  /**
   * Extract other events
   */
  extractOtherEvents(otherEvents) {
    if (!otherEvents) return [];

    const events = Array.isArray(otherEvents) ? otherEvents : [otherEvents];
    
    return events.map(event => ({
      type: event.OtherEventType,
      dateTime: event.OtherEventDateTime,
      memo: event.OtherEventMemo
    }));
  }

  /**
   * Upload and process BMS file (enhanced with validation and multi-format support)
   * @param {File} file - The BMS file (XML or PDF)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed BMS data
   */
  async uploadBMSFile(file, options = {}) {
    try {
      // Use the enhanced processFile method that handles both XML and PDF
      return await this.processFile(file, options);
    } catch (error) {
      console.error('Error uploading BMS file:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process BMS file',
        validationErrors: this.validationErrors,
        processingWarnings: this.processingWarnings
      };
    }
  }

  /**
   * Read file as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Save BMS data to database
   */
  async saveBMSData(bmsData) {
    try {
      // Helper function to safely extract text from XML objects
      const safeText = (value) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (value && typeof value === 'object') {
          // Handle XML parser output with #text property
          if (value['#text'] !== undefined) return value['#text'];
          // Handle other object cases
          return JSON.stringify(value);
        }
        return 'N/A';
      };

      // Create clean customer data
      const customerData = {
        firstName: safeText(bmsData.adminInfo?.policyHolder?.firstName) || 'Unknown',
        lastName: safeText(bmsData.adminInfo?.policyHolder?.lastName) || 'Customer',
        email: safeText(bmsData.adminInfo?.policyHolder?.email) || 'N/A',
        phone: safeText(bmsData.adminInfo?.policyHolder?.phone) || 'N/A',
        address: safeText(bmsData.adminInfo?.policyHolder?.address?.address1) || 'N/A',
        city: safeText(bmsData.adminInfo?.policyHolder?.address?.city) || 'N/A',
        state: safeText(bmsData.adminInfo?.policyHolder?.address?.stateProvince) || 'N/A',
        postalCode: safeText(bmsData.adminInfo?.policyHolder?.address?.postalCode) || 'N/A',
        customerType: 'policy_holder'
      };

      // Create clean vehicle data
      const vehicleData = {
        year: parseInt(safeText(bmsData.vehicleInfo?.year)) || 0,
        make: safeText(bmsData.vehicleInfo?.make) || 'Unknown',
        model: safeText(bmsData.vehicleInfo?.model) || 'Unknown',
        vin: safeText(bmsData.vehicleInfo?.vin) || 'N/A',
        mileage: parseInt(safeText(bmsData.vehicleInfo?.mileage)) || 0,
        color: safeText(bmsData.vehicleInfo?.color) || 'N/A'
      };

      // Create clean document info
      const documentInfo = {
        documentNumber: safeText(bmsData.documentInfo?.documentId) || 'Unknown',
        documentType: safeText(bmsData.documentInfo?.documentType) || 'Estimate',
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      };

      // Create clean claim info
      const claimInfo = {
        claimNumber: safeText(bmsData.claimInfo?.claimNumber) || 'CLM-' + Date.now(),
        insuranceCompany: safeText(bmsData.adminInfo?.insuranceCompany?.companyName) || 'Unknown',
        deductible: parseFloat(safeText(bmsData.claimInfo?.deductible)) || 0,
        totalLoss: false
      };

      // Create clean damage data
      const damageData = {
        totalParts: parseInt(safeText(bmsData.totals?.partsTotal)) || 0,
        totalLabor: parseFloat(safeText(bmsData.totals?.laborTotal)) || 0,
        totalMaterials: parseFloat(safeText(bmsData.totals?.materialsTotal)) || 0,
        totalAmount: parseFloat(safeText(bmsData.totals?.grossTotal)) || 0,
        damageLines: Array.isArray(bmsData.damageLines) ? bmsData.damageLines.map(line => ({
          part: safeText(line.partInfo?.description) || 'Unknown Part',
          operation: safeText(line.laborInfo?.operation) || 'Repair',
          labor: parseFloat(safeText(line.laborInfo?.hours)) || 0,
          parts: parseFloat(safeText(line.partInfo?.price)) || 0
        })) : []
      };

      // Create customer record
      const customer = await this.createOrUpdateCustomer(customerData);
      
      // Create vehicle record
      const vehicle = await this.createOrUpdateVehicle(vehicleData, customer.id);
      
      // Create job/estimate record
      const job = await this.createJob({
        documentInfo,
        claimInfo,
        customer,
        vehicle,
        damage: damageData
      }, customer.id, vehicle.id);
      
      return {
        customer,
        vehicle,
        job,
        documentInfo,
        claimInfo,
        damage: damageData
      };
    } catch (error) {
      console.error('Error saving BMS data:', error);
      throw error;
    }
  }

  /**
   * Create or update customer
   */
  async createOrUpdateCustomer(customerData) {
    if (!customerData) throw new Error('Customer information is required');

    // Check if customer exists
    const existingCustomer = await this.findCustomerByPhone(customerData.phone);
    
    if (existingCustomer) {
      // Update existing customer
      return await this.updateCustomer(existingCustomer.id, customerData);
    } else {
      // Create new customer
      return await this.createCustomer(customerData);
    }
  }

  /**
   * Create or update vehicle
   */
  async createOrUpdateVehicle(vehicleData, customerId) {
    if (!vehicleData) throw new Error('Vehicle information is required');

    const vehicleInfo = {
      customerId,
      vin: vehicleData.vin,
      licensePlate: vehicleData.licensePlate,
      licenseState: vehicleData.state,
      year: vehicleData.year,
      make: vehicleData.make,
      model: vehicleData.model,
      subModel: vehicleData.subModel,
      bodyStyle: vehicleData.bodyStyle,
      engine: vehicleData.engine,
      transmission: vehicleData.transmission,
      fuelType: vehicleData.fuelType,
      exteriorColor: vehicleData.color,
      interiorColor: vehicleData.interiorColor,
      odometer: vehicleData.mileage,
      odometerUnit: 'miles',
      condition: vehicleData.condition,
      drivable: vehicleData.drivable,
      priorDamage: vehicleData.priorDamage,
      priorDamageNotes: vehicleData.priorDamageNotes,
      valuation: vehicleData.valuation
    };

    // Check if vehicle exists by VIN
    if (vehicleData.vin) {
      const existingVehicle = await this.findVehicleByVIN(vehicleData.vin);
      if (existingVehicle) {
        return await this.updateVehicle(existingVehicle.id, vehicleData);
      }
    }

    // Create new vehicle
    return await this.createVehicle(vehicleData);
  }

  /**
   * Create job/estimate record
   */
  async createJob(jobData, customerId, vehicleId) {
    const cleanJobData = {
      customerId,
      vehicleId,
      claimNumber: jobData.claimInfo.claimNumber,
      policyNumber: jobData.claimInfo.policyNumber,
      estimateNumber: jobData.documentInfo.documentNumber,
      insuranceCompany: jobData.claimInfo.insuranceCompany,
      adjuster: null, // Will be populated if available
      lossDate: new Date().toISOString(),
      damageDescription: 'BMS Upload',
      lossDescription: 'BMS Upload',
      deductible: jobData.claimInfo.deductible,
      totalLabor: jobData.damage.totalLabor,
      totalParts: jobData.damage.totalParts,
      totalMaterials: jobData.damage.totalMaterials,
      grossTotal: jobData.damage.totalAmount,
      netTotal: jobData.damage.totalAmount,
      status: 'estimate_received',
      source: 'bms_upload',
      bmsData: jobData // Store clean BMS data for reference
    };

    return await this.createJobRecord(cleanJobData);
  }

  /**
   * Create parts and labor records
   */
  async createPartsAndLabor(damageLines, jobId) {
    for (const line of damageLines) {
      if (line.partInfo) {
        await this.createPartRecord({
          jobId,
          lineNum: line.lineNum,
          partNumber: line.partInfo.partNum,
          oemPartNumber: line.partInfo.oemPartNum,
          description: line.lineDesc,
          price: line.partInfo.partPrice,
          oemPrice: line.partInfo.oemPartPrice,
          quantity: line.partInfo.quantity || 1,
          supplier: line.partInfo.nonOEM?.supplierRef,
          partType: line.partInfo.partType,
          sourceCode: line.partInfo.sourceCode
        });
      }

      if (line.laborInfo) {
        await this.createLaborRecord({
          jobId,
          lineNum: line.lineNum,
          laborType: line.laborInfo.laborType,
          operation: line.laborInfo.laborOperation,
          hours: line.laborInfo.laborHours,
          description: line.lineDesc,
          paintStages: line.laborInfo.paintStagesNum
        });
      }

      if (line.otherChargesInfo) {
        await this.createMaterialRecord({
          jobId,
          lineNum: line.lineNum,
          materialType: line.materialType,
          description: line.lineDesc,
          price: line.otherChargesInfo.price,
          chargeType: line.otherChargesInfo.type
        });
      }
    }
  }

  // Database operation methods
  
  /**
   * Get database models - handles both Electron and web environments
   */
  async getModels() {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        // In Electron, use IPC to communicate with main process
        // Main process has direct access to database models
        return {
          query: window.electronAPI.database.query,
          transaction: window.electronAPI.database.transaction
        };
      } else if (typeof window === 'undefined') {
        // Server-side - use API calls instead of direct imports to avoid webpack issues
        try {
          // In server environments, we should use API calls rather than direct model imports
          // This prevents webpack from trying to bundle server-side code
          return {
            query: async (sql, params) => {
              // Implement API call to server database endpoint
              const response = await fetch('/api/database/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params })
              });
              return response.json();
            },
            transaction: async (callback) => {
              // Implement API call for transactions
              const response = await fetch('/api/database/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operations: callback })
              });
              return response.json();
            }
          };
        } catch (error) {
          console.warn('Unable to initialize database API connection:', error);
          return {};
        }
      } else {
        // Browser environment - use API endpoints
        return {
          apiMode: true,
          baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
        };
      }
    } catch (error) {
      console.error('Error loading database models:', error);
      throw new Error('Database models not available: ' + error.message);
    }
  }

  /**
   * Get or create default shop
   */
  async getDefaultShop() {
    try {
      const models = await this.getModels();
      
      // Handle different environments
      if (models.apiMode || models.query) {
        // Browser/Electron environment - return mock shop data
        return {
          id: 'mock-shop-default',
          name: 'Default Auto Body Shop',
          businessName: 'Default Auto Body Shop Ltd.',
          email: 'info@defaultautobody.com',
          phone: '(555) 123-4567',
          address: '123 Main Street',
          city: 'Toronto',
          state: 'Ontario',
          postalCode: 'M5V 3A8',
          country: 'Canada',
          setupCompleted: true,
          isActive: true
        };
      } else {
        // Server environment - direct database access
        const { Shop } = models;
        
        // Try to find existing shop
        let shop = await Shop.findOne({
          where: { isActive: true },
          order: [['createdAt', 'ASC']]
        });

        if (!shop) {
          // Create default shop if none exists
          shop = await Shop.create({
            name: 'Default Auto Body Shop',
            businessName: 'Default Auto Body Shop Ltd.',
            email: 'info@defaultautobody.com',
            phone: '(555) 123-4567',
            address: '123 Main Street',
            city: 'Toronto',
            state: 'Ontario',
            postalCode: 'M5V 3A8',
            country: 'Canada',
            setupCompleted: true,
            isActive: true
          });
        }

        return shop;
      }
    } catch (error) {
      console.error('Error getting default shop:', error);
      throw error;
    }
  }

  /**
   * Find customer by phone number
   */
  async findCustomerByPhone(phone) {
    try {
      if (!phone || phone === 'N/A') return null;
      
      const models = await this.getModels();
      
      // Handle different environments
      if (models.apiMode) {
        // Browser environment - would use fetch to API endpoints
        // For now, return null to create new customers
        return null;
      } else if (models.query) {
        // Electron environment - use IPC
        // For now, return null to create new customers
        return null;
      } else {
        // Server environment - direct database access
        const { Customer } = models;
        const shop = await this.getDefaultShop();
        
        const customer = await Customer.findOne({
          where: {
            shopId: shop.id,
            phone: phone
          }
        });

        return customer;
      }
    } catch (error) {
      console.error('Error finding customer by phone:', error);
      return null;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(customerData) {
    try {
      const models = await this.getModels();
      
      // Handle different environments
      if (models.apiMode || models.query) {
        // Browser/Electron environment - return mock data for now
        return {
          id: 'mock-customer-' + Date.now(),
          customerNumber: 'CUST-' + Date.now().toString().slice(-4),
          firstName: customerData.firstName || 'Unknown',
          lastName: customerData.lastName || 'Customer',
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.postalCode,
          customerType: customerData.customerType || 'individual',
          customerStatus: 'active',
          createdAt: new Date()
        };
      } else {
        // Server environment - direct database access
        const { Customer } = models;
        const shop = await this.getDefaultShop();

        // Generate customer number
        const customerNumber = await Customer.generateCustomerNumber(shop.id);

        const customer = await Customer.create({
          shopId: shop.id,
          customerNumber,
          firstName: customerData.firstName || 'Unknown',
          lastName: customerData.lastName || 'Customer',
          email: customerData.email || null,
          phone: customerData.phone || null,
          address: customerData.address || null,
          city: customerData.city || null,
          state: customerData.state || null,
          zipCode: customerData.postalCode || null,
          customerType: customerData.customerType || 'individual',
          customerStatus: 'active',
          preferredContact: 'phone',
          firstVisitDate: new Date()
        });

        return customer;
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(customerId, customerData) {
    try {
      const { Customer } = await this.getModels();

      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      await customer.update({
        firstName: customerData.firstName || customer.firstName,
        lastName: customerData.lastName || customer.lastName,
        email: customerData.email || customer.email,
        phone: customerData.phone || customer.phone,
        address: customerData.address || customer.address,
        city: customerData.city || customer.city,
        state: customerData.state || customer.state,
        zipCode: customerData.postalCode || customer.zipCode,
        lastVisitDate: new Date()
      });

      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Find vehicle by VIN
   */
  async findVehicleByVIN(vin) {
    try {
      if (!vin || vin === 'N/A') return null;

      const { Vehicle } = await this.getModels();
      const shop = await this.getDefaultShop();

      const vehicle = await Vehicle.findOne({
        where: {
          shopId: shop.id,
          vin: vin
        }
      });

      return vehicle;
    } catch (error) {
      console.error('Error finding vehicle by VIN:', error);
      return null;
    }
  }

  /**
   * Create new vehicle
   */
  async createVehicle(vehicleData) {
    try {
      const models = await this.getModels();
      
      // Handle different environments
      if (models.apiMode || models.query) {
        // Browser/Electron environment - return mock data for now
        return {
          id: 'mock-vehicle-' + Date.now(),
          customerId: vehicleData.customerId,
          vin: vehicleData.vin || 'MOCK-' + Date.now(),
          licensePlate: vehicleData.licensePlate,
          state: vehicleData.state,
          year: vehicleData.year || 2020,
          make: vehicleData.make || 'Unknown',
          model: vehicleData.model || 'Unknown',
          trim: vehicleData.trim,
          bodyStyle: vehicleData.bodyStyle || 'other',
          color: vehicleData.color,
          mileage: vehicleData.mileage || 0,
          mileageUnit: 'miles',
          vehicleStatus: 'active',
          createdAt: new Date()
        };
      } else {
        // Server environment - direct database access
        const { Vehicle } = models;
        const shop = await this.getDefaultShop();

        const vehicle = await Vehicle.create({
          shopId: shop.id,
          customerId: vehicleData.customerId,
          vin: vehicleData.vin || 'UNKNOWN-' + Date.now(),
          licensePlate: vehicleData.licensePlate || null,
          state: vehicleData.state || null,
          year: vehicleData.year || 2020,
          make: vehicleData.make || 'Unknown',
          model: vehicleData.model || 'Unknown',
          trim: vehicleData.trim || null,
          bodyStyle: vehicleData.bodyStyle || 'other',
          color: vehicleData.color || null,
          mileage: vehicleData.mileage || 0,
          mileageUnit: 'miles',
          vehicleStatus: 'active'
        });

        return vehicle;
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Update existing vehicle
   */
  async updateVehicle(vehicleId, vehicleData) {
    try {
      const { Vehicle } = await this.getModels();

      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      await vehicle.update({
        year: vehicleData.year || vehicle.year,
        make: vehicleData.make || vehicle.make,
        model: vehicleData.model || vehicle.model,
        trim: vehicleData.trim || vehicle.trim,
        color: vehicleData.color || vehicle.color,
        mileage: vehicleData.mileage || vehicle.mileage
      });

      return vehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  /**
   * Create new job record
   */
  async createJobRecord(jobData) {
    try {
      const models = await this.getModels();
      
      // Handle different environments
      if (models.apiMode || models.query) {
        // Browser/Electron environment - return mock data for now
        const jobNumber = 'JOB-' + Date.now().toString().slice(-6);
        return {
          id: 'mock-job-' + Date.now(),
          jobNumber,
          customerId: jobData.customerId,
          vehicleId: jobData.vehicleId,
          status: 'estimate',
          priority: 'normal',
          jobType: 'collision',
          claimNumber: jobData.claimNumber,
          deductible: jobData.deductible || 0,
          totalAmount: jobData.grossTotal || 0,
          laborAmount: jobData.totalLabor || 0,
          partsAmount: jobData.totalParts || 0,
          materialsAmount: jobData.totalMaterials || 0,
          damageDescription: jobData.damageDescription || 'BMS Import',
          repairDescription: jobData.lossDescription || 'BMS Import',
          notes: JSON.stringify(jobData.bmsData || {}),
          estimateStatus: 'draft',
          isInsurance: true,
          checkInDate: new Date(),
          createdAt: new Date()
        };
      } else {
        // Server environment - direct database access
        const { Job, sequelize } = models;
        const shop = await this.getDefaultShop();

        // Start transaction
        const transaction = await sequelize.transaction();

        try {
          // Generate job number
          const jobNumber = Job.generateJobNumber();

          const job = await Job.create({
            shopId: shop.id,
            jobNumber,
            customerId: jobData.customerId,
            vehicleId: jobData.vehicleId,
            status: 'estimate',
            priority: 'normal',
            jobType: 'collision',
            claimNumber: jobData.claimNumber || null,
            deductible: jobData.deductible || 0,
            totalAmount: jobData.grossTotal || 0,
            laborAmount: jobData.totalLabor || 0,
            partsAmount: jobData.totalParts || 0,
            materialsAmount: jobData.totalMaterials || 0,
            damageDescription: jobData.damageDescription || 'BMS Import',
            repairDescription: jobData.lossDescription || 'BMS Import',
            notes: JSON.stringify(jobData.bmsData || {}),
            estimateStatus: 'draft',
            isInsurance: true,
            checkInDate: new Date(),
            // Set nullable foreign key fields to null
            insuranceId: null,
            claimId: null,
            assignedTo: null,
            bayId: null
          }, { transaction });

          await transaction.commit();
          return job;
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating job record:', error);
      throw error;
    }
  }

  /**
   * Create new part record
   */
  async createPartRecord(partData) {
    try {
      const { Part } = await this.getModels();
      const shop = await this.getDefaultShop();

      const part = await Part.create({
        shopId: shop.id,
        partNumber: partData.partNumber || 'PART-' + Date.now(),
        oemPartNumber: partData.oemPartNumber || null,
        description: partData.description || 'BMS Imported Part',
        category: 'body',
        partType: partData.partType || 'oem',
        currentStock: 0,
        minimumStock: 0,
        costPrice: partData.price || 0,
        sellingPrice: partData.oemPrice || partData.price || 0,
        partStatus: 'active',
        isActive: true,
        notes: JSON.stringify({
          jobId: partData.jobId,
          lineNum: partData.lineNum,
          quantity: partData.quantity,
          supplier: partData.supplier,
          sourceCode: partData.sourceCode
        })
      });

      return part;
    } catch (error) {
      console.error('Error creating part record:', error);
      throw error;
    }
  }

  /**
   * Create new labor record (stored as job notes for now)
   */
  async createLaborRecord(laborData) {
    try {
      // For now, we'll store labor data as metadata in the job
      // In a full implementation, you might have a separate Labor table
      const laborRecord = {
        id: 'labor-' + Date.now(),
        type: 'labor',
        jobId: laborData.jobId,
        lineNum: laborData.lineNum,
        laborType: laborData.laborType,
        operation: laborData.operation,
        hours: laborData.hours,
        description: laborData.description,
        paintStages: laborData.paintStages,
        createdAt: new Date()
      };

      return laborRecord;
    } catch (error) {
      console.error('Error creating labor record:', error);
      throw error;
    }
  }

  /**
   * Create new material record (stored as job notes for now)
   */
  async createMaterialRecord(materialData) {
    try {
      // For now, we'll store material data as metadata in the job
      // In a full implementation, you might have a separate Material table
      const materialRecord = {
        id: 'material-' + Date.now(),
        type: 'material',
        jobId: materialData.jobId,
        lineNum: materialData.lineNum,
        materialType: materialData.materialType,
        description: materialData.description,
        price: materialData.price,
        chargeType: materialData.chargeType,
        createdAt: new Date()
      };

      return materialRecord;
    } catch (error) {
      console.error('Error creating material record:', error);
      throw error;
    }
  }

  /**
   * Process BMS files in batch mode
   * @param {Array} files - Array of BMS files to process
   * @returns {Promise<Object>} Batch processing results
   */
  async processBatch(files) {
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: files.length,
        success: 0,
        failed: 0,
        warnings: 0
      }
    };

    for (const file of files) {
      try {
        const result = await this.uploadBMSFile(file);
        if (result.success) {
          results.successful.push({
            filename: file.name,
            result
          });
          results.summary.success++;
        } else {
          results.failed.push({
            filename: file.name,
            error: result.error
          });
          results.summary.failed++;
        }
      } catch (error) {
        results.failed.push({
          filename: file.name,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Validate BMS data integrity
   * @param {Object} bmsData - Parsed BMS data
   * @returns {Object} Validation results
   */
  validateBMSData(bmsData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      criticalFields: {},
      dataQuality: {}
    };

    // Critical field validation
    const criticalFields = [
      'documentInfo.claimNumber',
      'vehicleInfo.description.vin',
      'adminInfo.policyHolder',
      'totals.summaryTotals'
    ];

    for (const fieldPath of criticalFields) {
      const value = this.getNestedProperty(bmsData, fieldPath);
      if (!value) {
        validation.errors.push(`Critical field missing: ${fieldPath}`);
        validation.isValid = false;
      } else {
        validation.criticalFields[fieldPath] = 'present';
      }
    }

    // Data quality checks
    this.validateVehicleInfo(bmsData.vehicleInfo, validation);
    this.validateFinancials(bmsData.totals, validation);
    this.validateCustomerInfo(bmsData.adminInfo, validation);
    this.validateDamageLines(bmsData.damageLines, validation);

    return validation;
  }

  /**
   * Enhanced file type detection and processing
   * @param {File} file - File to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processFile(file, options = {}) {
    const fileType = this.detectFileType(file);
    
    try {
      switch (fileType) {
        case 'xml':
          return await this.processXMLFile(file, options);
        case 'pdf':
          return await this.processPDFFile(file, options);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fileType,
        filename: file.name,
        validationErrors: this.validationErrors,
        processingWarnings: this.processingWarnings
      };
    }
  }

  /**
   * Process PDF BMS files
   * @param {File} file - PDF file
   * @returns {Promise<Object>} Processing result
   */
  async processPDFFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Extract text from PDF
      const pdfText = this.extractTextFromPDF(uint8Array);
      
      // Extract BMS data from PDF text
      const bmsData = this.extractBMSFromPDFText(pdfText);
      
      // Validate extracted data
      const validation = this.validateBMSData(bmsData);
      
      if (!validation.isValid && validation.errors.length > 2) {
        throw new Error('PDF extraction failed - insufficient data quality');
      }
      
      // Save to database
      const savedData = await this.saveBMSData(bmsData);
      
      return {
        success: true,
        data: savedData,
        source: 'pdf',
        validation,
        message: 'PDF BMS file processed successfully'
      };
      
    } catch (error) {
      console.error('Error processing PDF BMS file:', error);
      throw error;
    }
  }
}

/**
 * Advanced Field Mapping System
 * Provides sophisticated field detection and mapping capabilities
 */
class BMSFieldMapper {
  constructor() {
    // Comprehensive field candidate mapping from Dart script
    this.fieldCandidates = {
      // Job/Estimate fields
      jobs: {
        ro: ["Repair Order", "RO", "RO #", "RO Number", "RepairOrder", "RONumber", "Estimate #", "Estimate No", "Work Order", "WO", "R.O.", "R.O. #", "RO#"],
        claim: ["Claim Number", "ClaimNumber", "Claim #", "Claim No", "ClaimNum", "ClaimNo", "RefClaimNum", "Claim", "Reference Claim Number", "Ref Claim #", "Claim#", "ICBC Claim", "ICBC Claim #", "ICBC Claim Number"],
        policy: ["Policy Number", "PolicyNumber", "Policy #", "Policy No", "PolicyNum", "PolicyNo", "Policy", "Policy#"],
        insurer: ["Insurer", "Insurer Name", "Insurance", "Insurance Company", "InsuranceCompanyName", "CarrierName", "Carrier", "Insurance Carrier"],
        estimateNo: ["WorkfileID", "DocumentID", "Estimate No", "EstimateNo", "Estimate #", "EstimateNum", "Estimate Number"],
        estimateDate: ["CreateDateTime", "Create Date", "Estimate Commit", "Estimate Date", "EstimateDate", "CreateDate", "Commit Date"],
        loss: ["LossDateTime", "LossDate", "Loss Date", "Date of Loss", "Loss Dt", "LossDt", "Loss Date/Time"],
        severity: ["Severity", "Grand Total", "Total", "Estimate Total", "Net Total"],
        labour: ["Labour Total", "Labor Total", "LabourTotal", "LaborTotal"],
        parts: ["PartsSellTotal", "Parts Total", "Part Total", "Parts", "PartsTotal", "PartAmt", "Part Amount"],
        materials: ["Materials", "Paint & Shop Materials", "Materials Total"],
        sublet: ["Sublet Total", "SubletTotal", "Other Charges", "Additional Costs", "Sublet"],
        deductible: ["Deductible", "Deductible Amount", "DeductibleAmt", "Deductible Amt", "Deductible $", "Policy Deductible"]
      },
      
      // Vehicle fields
      vehicles: {
        vin: ["VIN", "VIN Number", "VINNumber", "VINNum", "Vehicle VIN #", "Vehicle VIN", "VIN #"],
        year: ["Year", "Model Year", "ModelYear", "Vehicle Year"],
        make: ["Make", "MakeDesc", "VehMake", "VehicleMake", "MakeName"],
        model: ["Model", "ModelName", "VehModel", "VehicleModel", "ModelDesc"],
        submodel: ["Submodel", "Sub-model", "Sub Model", "Trim", "SubModel", "SubModelDesc"],
        bodyStyle: ["Body Style", "BodyStyle"],
        color: ["Color", "Colour", "Exterior Color", "ExteriorColour", "Paint Color"],
        plate: ["Plate", "License Plate", "Licence Plate", "License Plate #", "Licence Plate #"],
        odometer: ["Odometer", "Odo", "OdomReading", "OdometerReading"],
        drivable: ["Drivable?", "Drivable", "DrivableInd", "VehicleDrivableInd"]
      },
      
      // Customer fields
      customers: {
        first: ["First Name", "FirstName", "GivenName", "Insured First", "Owner First"],
        last: ["Last Name", "LastName", "FamilyName", "Surname", "Insured Last", "Owner Last"],
        phone: ["Phone", "Phone #", "PhoneNum", "PrimaryPhone", "HomePhone", "DayPhone", "Mobile", "Cell"],
        email: ["Email", "EMail", "EMailAddr", "EmailAddress"],
        address: ["Address", "Addr1", "Address1", "Street", "Street1", "Line1"],
        city: ["City", "Town"],
        province: ["Province", "State", "StateProv", "StateProvince", "Prov"],
        postalCode: ["Postal Code", "PostalCode", "Zip", "ZipCode", "PC"]
      },
      
      // Damage line fields
      damageLines: {
        lineNum: ["Line #", "Line Number", "LineNum"],
        description: ["Description", "Line Desc", "LineDesc", "Part Description"],
        partNum: ["Part #", "Part Number", "PartNum", "Part"],
        partPrice: ["Part Price", "PartPrice", "Price", "Estimate Price"],
        laborHours: ["Labor Hours", "Labour Hours", "Hours", "LaborHours"],
        laborOperation: ["Labor Operation", "Labour Operation", "LaborOperation", "Operation"]
      }
    };
  }

  /**
   * Find best matching field name from candidates
   * @param {Array} candidates - Array of candidate field names
   * @param {Object} sourceData - Source data object to search
   * @returns {string|null} Best matching field name
   */
  findBestMatch(candidates, sourceData) {
    if (!sourceData || !candidates) return null;
    
    // Try exact matches first
    for (const candidate of candidates) {
      if (sourceData.hasOwnProperty(candidate)) {
        return candidate;
      }
    }
    
    // Try case-insensitive matches
    const sourceKeys = Object.keys(sourceData).map(k => k.toLowerCase());
    for (const candidate of candidates) {
      const lowerCandidate = candidate.toLowerCase();
      const matchedKey = sourceKeys.find(k => k === lowerCandidate);
      if (matchedKey) {
        // Find original key
        return Object.keys(sourceData).find(k => k.toLowerCase() === matchedKey);
      }
    }
    
    // Try partial matches
    for (const candidate of candidates) {
      const lowerCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedKey = sourceKeys.find(k => {
        const cleanKey = k.replace(/[^a-z0-9]/g, '');
        return cleanKey.includes(lowerCandidate) || lowerCandidate.includes(cleanKey);
      });
      if (matchedKey) {
        return Object.keys(sourceData).find(k => k.toLowerCase() === matchedKey);
      }
    }
    
    return null;
  }

  /**
   * Map all fields for a data section
   * @param {string} section - Section name (jobs, vehicles, customers, etc.)
   * @param {Object} sourceData - Source data to map
   * @returns {Object} Mapped field names
   */
  mapFields(section, sourceData) {
    const candidates = this.fieldCandidates[section];
    if (!candidates) return {};
    
    const mapped = {};
    for (const [key, candidateList] of Object.entries(candidates)) {
      mapped[key] = this.findBestMatch(candidateList, sourceData);
    }
    
    return mapped;
  }
}

/**
 * PDF Text Extraction Utilities
 */
class PDFTextExtractor {
  /**
   * Extract text from PDF byte array
   * @param {Uint8Array} pdfBytes - PDF file bytes
   * @returns {string} Extracted text
   */
  static extractText(pdfBytes) {
    try {
      const raw = new TextDecoder("latin1").decode(pdfBytes);
      const chunks = [];
      const regex = /\(([^()]*)\)\s*T[Jj]/g;
      let match;
      
      while ((match = regex.exec(raw))) {
        chunks.push(match[1].replace(/\\\)/g, ")").replace(/\\\(/g, "("));
      }
      
      const text = (chunks.length ? chunks.join("") : raw)
        .replace(/\r/g, "\n")
        .replace(/\u0000/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{2,}/g, "\n");
        
      return text;
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract specific field from PDF text using regex
   * @param {string} text - PDF text content
   * @param {RegExp} pattern - Regex pattern to match
   * @returns {string} Extracted value
   */
  static extractField(text, pattern) {
    const match = pattern.exec(text || "");
    return match ? (match[1] || match[0]).trim() : "";
  }

  /**
   * Extract financial amounts from text
   * @param {string} text - Text containing amounts
   * @returns {number} Extracted amount
   */
  static extractAmount(text) {
    if (!text) return 0;
    const cleaned = String(text).replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }
}

/**
 * BMS Data Validator
 */
class BMSDataValidator {
  /**
   * Validate vehicle information
   * @param {Object} vehicleInfo - Vehicle data
   * @param {Object} validation - Validation result object
   */
  static validateVehicleInfo(vehicleInfo, validation) {
    if (!vehicleInfo) {
      validation.errors.push('Vehicle information is missing');
      return;
    }

    // VIN validation
    const vin = vehicleInfo.description?.vin;
    if (!vin || vin.length !== 17) {
      validation.warnings.push('Invalid or missing VIN');
    }

    // Year validation
    const year = vehicleInfo.description?.modelYear;
    if (!year || year < 1900 || year > new Date().getFullYear() + 2) {
      validation.warnings.push('Invalid model year');
    }

    // Make/Model validation
    if (!vehicleInfo.description?.makeDesc) {
      validation.warnings.push('Vehicle make is missing');
    }
    if (!vehicleInfo.description?.modelName) {
      validation.warnings.push('Vehicle model is missing');
    }

    validation.dataQuality.vehicle = {
      hasVin: !!vin,
      hasYear: !!year,
      hasMake: !!vehicleInfo.description?.makeDesc,
      hasModel: !!vehicleInfo.description?.modelName
    };
  }

  /**
   * Validate financial totals
   * @param {Object} totals - Financial totals data
   * @param {Object} validation - Validation result object
   */
  static validateFinancials(totals, validation) {
    if (!totals) {
      validation.errors.push('Financial totals are missing');
      return;
    }

    const summaryTotals = totals.summaryTotals;
    if (!summaryTotals || summaryTotals.length === 0) {
      validation.warnings.push('No summary totals found');
      return;
    }

    // Validate total amounts are reasonable
    let grandTotal = 0;
    for (const total of summaryTotals) {
      if (total.totalAmt) {
        grandTotal += parseFloat(total.totalAmt) || 0;
      }
    }

    if (grandTotal <= 0) {
      validation.warnings.push('Total amount is zero or negative');
    }

    if (grandTotal > 1000000) {
      validation.warnings.push('Total amount seems unusually high');
    }

    validation.dataQuality.financials = {
      hasGrandTotal: grandTotal > 0,
      grandTotal,
      totalCategories: summaryTotals.length
    };
  }

  /**
   * Validate customer information
   * @param {Object} adminInfo - Admin/customer data
   * @param {Object} validation - Validation result object
   */
  static validateCustomerInfo(adminInfo, validation) {
    if (!adminInfo) {
      validation.warnings.push('Customer information is missing');
      return;
    }

    const policyHolder = adminInfo.policyHolder;
    if (!policyHolder) {
      validation.warnings.push('Policy holder information is missing');
      return;
    }

    // Name validation
    if (!policyHolder.firstName && !policyHolder.lastName) {
      validation.warnings.push('Customer name is missing');
    }

    // Contact info validation
    if (!policyHolder.phone && !policyHolder.email) {
      validation.warnings.push('Customer contact information is missing');
    }

    validation.dataQuality.customer = {
      hasName: !!(policyHolder.firstName || policyHolder.lastName),
      hasPhone: !!policyHolder.phone,
      hasEmail: !!policyHolder.email,
      hasAddress: !!policyHolder.address
    };
  }

  /**
   * Validate damage line items
   * @param {Array} damageLines - Damage line data
   * @param {Object} validation - Validation result object
   */
  static validateDamageLines(damageLines, validation) {
    if (!damageLines || damageLines.length === 0) {
      validation.warnings.push('No damage line items found');
      return;
    }

    let partsCount = 0;
    let laborCount = 0;
    let totalAmount = 0;

    for (const line of damageLines) {
      if (line.partInfo) {
        partsCount++;
        totalAmount += parseFloat(line.partInfo.partPrice) || 0;
      }
      if (line.laborInfo) {
        laborCount++;
      }
    }

    if (partsCount === 0 && laborCount === 0) {
      validation.warnings.push('No parts or labor found in damage lines');
    }

    validation.dataQuality.damageLines = {
      totalLines: damageLines.length,
      partsCount,
      laborCount,
      estimatedTotal: totalAmount
    };
  }
}

// Add these methods to the main BMSService class
BMSService.prototype.validateVehicleInfo = BMSDataValidator.validateVehicleInfo;
BMSService.prototype.validateFinancials = BMSDataValidator.validateFinancials;
BMSService.prototype.validateCustomerInfo = BMSDataValidator.validateCustomerInfo;
BMSService.prototype.validateDamageLines = BMSDataValidator.validateDamageLines;

BMSService.prototype.detectFileType = function(file) {
  const filename = file.name.toLowerCase();
  if (filename.endsWith('.pdf')) return 'pdf';
  if (filename.endsWith('.xml')) return 'xml';
  
  // Check MIME type
  const mimeType = file.type.toLowerCase();
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('xml')) return 'xml';
  
  return 'unknown';
};

BMSService.prototype.processXMLFile = async function(file, options = {}) {
  try {
    // Read file content
    const content = await this.readFileAsText(file);
    
    // Parse BMS data with validation
    const bmsData = this.parseBMSFile(content, options);
    
    // Save to database
    const savedData = await this.saveBMSData(bmsData);
    
    return {
      success: true,
      data: savedData,
      source: 'xml',
      validation: bmsData.validation,
      message: 'XML BMS file processed successfully',
      validationErrors: this.validationErrors,
      processingWarnings: this.processingWarnings
    };
  } catch (error) {
    console.error('Error processing XML BMS file:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to process XML BMS file',
      validationErrors: this.validationErrors,
      processingWarnings: this.processingWarnings
    };
  }
};

BMSService.prototype.extractTextFromPDF = function(uint8Array) {
  return PDFTextExtractor.extractText(uint8Array);
};

BMSService.prototype.extractBMSFromPDFText = function(pdfText) {
  // Extract key information from PDF text using patterns
  const extractField = (pattern) => PDFTextExtractor.extractField(pdfText, pattern);
  
  return {
    documentInfo: {
      claimNumber: extractField(/\b(?:Claim(?:\s*(?:No\.?|#|Number))?\s*[:#]?\s*)([A-Za-z0-9\-]+)/i),
      documentId: extractField(/\b(?:RO|Repair\s*Order|Workfile\s*ID)\s*[:#]?\s*([A-Za-z0-9\-]+)/i),
      documentType: 'PDF_ESTIMATE'
    },
    adminInfo: {
      policyHolder: {
        firstName: extractField(/\b(?:Insured|Owner|Customer)[:\s]+([A-Z][a-z]+)\s+[A-Z]/i),
        lastName: extractField(/\b(?:Insured|Owner|Customer)[:\s]+[A-Z][a-z]+\s+([A-Z][a-z]+)/i),
        phone: extractField(/\b(?:Phone|Tel)[:\s]*(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/i),
        email: extractField(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
      },
      insuranceCompany: {
        companyName: extractField(/\b(?:Insurance|Insurer)[:\s]+([A-Za-z\s]+?)(?:\n|$)/i)
      }
    },
    vehicleInfo: {
      description: {
        vin: extractField(/\b(?:VIN)[:\s]*([A-HJ-NPR-Z0-9]{17})/i),
        modelYear: parseInt(extractField(/\b(?:Year)[:\s]*([12][0-9]{3})/i)) || null,
        makeDesc: extractField(/\b(?:Make)[:\s]*([A-Za-z]+)/i),
        modelName: extractField(/\b(?:Model)[:\s]*([A-Za-z0-9\s]+?)(?:\n|$)/i)
      },
      license: {
        plateNumber: extractField(/\b(?:License|Plate)[:\s]*([A-Za-z0-9\-]+)/i)
      }
    },
    claimInfo: {
      claimNumber: extractField(/\b(?:Claim(?:\s*(?:No\.?|#|Number))?\s*[:#]?\s*)([A-Za-z0-9\-]+)/i),
      policyNumber: extractField(/\b(?:Policy(?:\s*(?:No\.?|#|Number))?\s*[:#]?\s*)([A-Za-z0-9\-]+)/i)
    },
    totals: {
      summaryTotals: [
        {
          totalType: 'GRAND_TOTAL',
          totalAmt: PDFTextExtractor.extractAmount(extractField(/\b(?:Total|Grand\s*Total)[:\s]*\$?([0-9,]+\.?[0-9]*)/i))
        }
      ]
    },
    damageLines: [] // PDF parsing for detailed line items would require more sophisticated parsing
  };
};

BMSService.prototype.getNestedProperty = function(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export default new BMSService();
