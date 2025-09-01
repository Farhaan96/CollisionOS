/**
 * Advanced BMS Validation Service
 * Provides comprehensive validation rules for BMS files
 */
import { XMLParser } from 'fast-xml-parser';

class BMSValidator {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });

    this.validationRules = {
      required: {
        documentInfo: ['BMSVer', 'DocumentType', 'DocumentID'],
        adminInfo: ['PolicyHolder'],
        vehicleInfo: ['VINInfo'],
        claimInfo: ['ClaimNum'],
      },
      formats: {
        vin: /^[A-HJ-NPR-Z0-9]{17}$/,
        phone: /^[\+]?[1-9][\d]{0,15}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        postalCode: {
          US: /^\d{5}(-\d{4})?$/,
          CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
          default: /^.{3,10}$/,
        },
        currency: /^[A-Z]{3}$/,
        date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      },
      ranges: {
        year: { min: 1900, max: new Date().getFullYear() + 2 },
        mileage: { min: 0, max: 999999 },
        amount: { min: 0, max: 999999.99 },
      },
    };

    this.validationErrors = [];
    this.validationWarnings = [];
    this.fieldValidations = new Map();
  }

  /**
   * Validate BMS XML content comprehensively
   * @param {string} xmlContent - The BMS XML content
   * @returns {Object} Validation result with errors, warnings, and field details
   */
  async validateBMSFile(xmlContent) {
    this.reset();

    try {
      // Parse XML
      const parsed = this.parser.parse(xmlContent);
      const bmsData = parsed.VehicleDamageEstimateAddRq;

      if (!bmsData) {
        this.addError(
          'structure',
          'Invalid BMS file structure - missing VehicleDamageEstimateAddRq root element'
        );
        return this.getValidationResult();
      }

      // Validate different sections
      await this.validateDocumentInfo(bmsData.DocumentInfo);
      await this.validateAdminInfo(bmsData.AdminInfo);
      await this.validateVehicleInfo(bmsData.VehicleInfo);
      await this.validateClaimInfo(bmsData.ClaimInfo);
      await this.validateDamageLines(bmsData.DamageLineInfo);
      await this.validateTotals(bmsData.RepairTotalsInfo);

      return this.getValidationResult();
    } catch (error) {
      this.addError('parsing', `Failed to parse BMS XML: ${error.message}`);
      return this.getValidationResult();
    }
  }

  /**
   * Validate document information section
   */
  async validateDocumentInfo(docInfo) {
    if (!docInfo) {
      this.addError('documentInfo', 'Missing DocumentInfo section');
      return;
    }

    // Required fields
    this.validateRequired(
      docInfo,
      this.validationRules.required.documentInfo,
      'DocumentInfo'
    );

    // BMS Version validation
    if (docInfo.BMSVer) {
      const version = parseFloat(docInfo.BMSVer);
      if (version < 5.0) {
        this.addWarning(
          'documentInfo.version',
          `BMS version ${docInfo.BMSVer} is outdated. Consider upgrading to 5.2+`
        );
      }
      this.setFieldValidation('DocumentInfo.BMSVer', true, 'Valid BMS version');
    }

    // Document Type validation
    if (docInfo.DocumentType) {
      const validTypes = ['E', 'S', 'R', 'A']; // Estimate, Supplement, Reinspection, Appraisal
      if (!validTypes.includes(docInfo.DocumentType)) {
        this.addError(
          'documentInfo.type',
          `Invalid document type: ${docInfo.DocumentType}`
        );
        this.setFieldValidation(
          'DocumentInfo.DocumentType',
          false,
          'Invalid document type'
        );
      } else {
        this.setFieldValidation(
          'DocumentInfo.DocumentType',
          true,
          'Valid document type'
        );
      }
    }

    // Currency validation
    if (docInfo.CurrencyInfo?.CurCode) {
      if (
        !this.validationRules.formats.currency.test(
          docInfo.CurrencyInfo.CurCode
        )
      ) {
        this.addError(
          'documentInfo.currency',
          `Invalid currency code: ${docInfo.CurrencyInfo.CurCode}`
        );
        this.setFieldValidation(
          'DocumentInfo.CurrencyInfo.CurCode',
          false,
          'Invalid currency format'
        );
      } else {
        this.setFieldValidation(
          'DocumentInfo.CurrencyInfo.CurCode',
          true,
          'Valid currency code'
        );
      }
    }

    // Date validation
    if (
      docInfo.CreateDateTime &&
      !this.validationRules.formats.date.test(docInfo.CreateDateTime)
    ) {
      this.addError('documentInfo.date', 'Invalid CreateDateTime format');
      this.setFieldValidation(
        'DocumentInfo.CreateDateTime',
        false,
        'Invalid date format'
      );
    }
  }

  /**
   * Validate administrative information section
   */
  async validateAdminInfo(adminInfo) {
    if (!adminInfo) {
      this.addError('adminInfo', 'Missing AdminInfo section');
      return;
    }

    // Policy holder validation (required)
    if (!adminInfo.PolicyHolder) {
      this.addError(
        'adminInfo.policyHolder',
        'Missing PolicyHolder information'
      );
    } else {
      await this.validateParty(adminInfo.PolicyHolder.Party, 'PolicyHolder');
    }

    // Insurance company validation
    if (adminInfo.InsuranceCompany) {
      await this.validateParty(
        adminInfo.InsuranceCompany.Party,
        'InsuranceCompany'
      );
    }

    // Estimator validation
    if (adminInfo.Estimator) {
      await this.validateParty(adminInfo.Estimator.Party, 'Estimator');
    }

    // Adjuster validation
    if (adminInfo.Adjuster) {
      await this.validateParty(adminInfo.Adjuster.Party, 'Adjuster');
    }
  }

  /**
   * Validate party information (person or organization)
   */
  async validateParty(party, context) {
    if (!party) {
      this.addError(
        `${context.toLowerCase()}`,
        `Missing ${context} party information`
      );
      return;
    }

    const isPersonInfo = party.PersonInfo;
    const isOrgInfo = party.OrgInfo;

    if (!isPersonInfo && !isOrgInfo) {
      this.addError(
        `${context.toLowerCase()}.type`,
        `${context} must have either PersonInfo or OrgInfo`
      );
      return;
    }

    if (isPersonInfo) {
      await this.validatePersonInfo(party.PersonInfo, context);
    }

    if (isOrgInfo) {
      await this.validateOrgInfo(party.OrgInfo, context);
    }

    // Validate contact information
    if (party.ContactInfo?.Communications) {
      await this.validateCommunications(
        party.ContactInfo.Communications,
        context
      );
    }
  }

  /**
   * Validate person information
   */
  async validatePersonInfo(personInfo, context) {
    if (!personInfo.PersonName?.FirstName && !personInfo.PersonName?.LastName) {
      this.addError(
        `${context.toLowerCase()}.name`,
        `${context} person must have at least first or last name`
      );
      this.setFieldValidation(
        `${context}.PersonName`,
        false,
        'Missing required name fields'
      );
    } else {
      this.setFieldValidation(
        `${context}.PersonName`,
        true,
        'Valid person name'
      );
    }

    // Validate address if present
    if (personInfo.Communications) {
      await this.validateCommunications(personInfo.Communications, context);
    }
  }

  /**
   * Validate organization information
   */
  async validateOrgInfo(orgInfo, context) {
    if (!orgInfo.CompanyName) {
      this.addError(
        `${context.toLowerCase()}.company`,
        `${context} organization must have company name`
      );
      this.setFieldValidation(
        `${context}.CompanyName`,
        false,
        'Missing company name'
      );
    } else {
      this.setFieldValidation(
        `${context}.CompanyName`,
        true,
        'Valid company name'
      );
    }
  }

  /**
   * Validate communications (address, phone, email)
   */
  async validateCommunications(communications, context) {
    const commArray = Array.isArray(communications)
      ? communications
      : [communications];

    commArray.forEach((comm, index) => {
      const commContext = `${context}.Communications[${index}]`;

      if (comm.CommQualifier === 'AL' && comm.Address) {
        this.validateAddress(comm.Address, commContext);
      }

      if (comm.CommPhone) {
        this.validatePhone(comm.CommPhone, commContext);
      }

      if (comm.CommEmail) {
        this.validateEmail(comm.CommEmail, commContext);
      }
    });
  }

  /**
   * Validate address information
   */
  validateAddress(address, context) {
    const requiredFields = ['Address1', 'City', 'StateProvince', 'PostalCode'];
    let hasRequiredFields = true;

    requiredFields.forEach(field => {
      if (!address[field]) {
        hasRequiredFields = false;
        this.addWarning(
          `${context.toLowerCase()}.address`,
          `Missing ${field} in address`
        );
      }
    });

    // Validate postal code format
    if (address.PostalCode) {
      const stateProvince = address.StateProvince;
      let postalValid = false;

      if (stateProvince && stateProvince.length === 2) {
        // US state
        postalValid = this.validationRules.formats.postalCode.US.test(
          address.PostalCode
        );
      } else if (stateProvince && stateProvince.length <= 3) {
        // Canadian province
        postalValid = this.validationRules.formats.postalCode.CA.test(
          address.PostalCode
        );
      } else {
        // Default validation
        postalValid = this.validationRules.formats.postalCode.default.test(
          address.PostalCode
        );
      }

      if (!postalValid) {
        this.addWarning(
          `${context.toLowerCase()}.postalCode`,
          'Invalid postal code format'
        );
        this.setFieldValidation(
          `${context}.PostalCode`,
          false,
          'Invalid postal code format'
        );
      } else {
        this.setFieldValidation(
          `${context}.PostalCode`,
          true,
          'Valid postal code'
        );
      }
    }

    this.setFieldValidation(
      `${context}.Address`,
      hasRequiredFields,
      hasRequiredFields ? 'Complete address' : 'Incomplete address'
    );
  }

  /**
   * Validate phone number
   */
  validatePhone(phone, context) {
    // Clean phone number
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    if (!this.validationRules.formats.phone.test(cleanPhone)) {
      this.addWarning(
        `${context.toLowerCase()}.phone`,
        `Invalid phone number format: ${phone}`
      );
      this.setFieldValidation(
        `${context}.Phone`,
        false,
        'Invalid phone format'
      );
    } else {
      this.setFieldValidation(`${context}.Phone`, true, 'Valid phone number');
    }
  }

  /**
   * Validate email address
   */
  validateEmail(email, context) {
    if (!this.validationRules.formats.email.test(email)) {
      this.addWarning(
        `${context.toLowerCase()}.email`,
        `Invalid email format: ${email}`
      );
      this.setFieldValidation(
        `${context}.Email`,
        false,
        'Invalid email format'
      );
    } else {
      this.setFieldValidation(`${context}.Email`, true, 'Valid email address');
    }
  }

  /**
   * Validate vehicle information
   */
  async validateVehicleInfo(vehicleInfo) {
    if (!vehicleInfo) {
      this.addError('vehicleInfo', 'Missing VehicleInfo section');
      return;
    }

    // VIN validation (required)
    if (!vehicleInfo.VINInfo?.VIN?.VINNum) {
      this.addError('vehicleInfo.vin', 'Missing VIN information');
      this.setFieldValidation('VehicleInfo.VIN', false, 'Missing VIN');
    } else {
      const vin = vehicleInfo.VINInfo.VIN.VINNum;
      if (!this.validationRules.formats.vin.test(vin)) {
        this.addError('vehicleInfo.vin', `Invalid VIN format: ${vin}`);
        this.setFieldValidation('VehicleInfo.VIN', false, 'Invalid VIN format');
      } else {
        this.setFieldValidation('VehicleInfo.VIN', true, 'Valid VIN');
      }
    }

    // Year validation
    if (vehicleInfo.VehicleDesc?.ModelYear) {
      const year = parseInt(vehicleInfo.VehicleDesc.ModelYear);
      if (
        year < this.validationRules.ranges.year.min ||
        year > this.validationRules.ranges.year.max
      ) {
        this.addError('vehicleInfo.year', `Invalid model year: ${year}`);
        this.setFieldValidation(
          'VehicleInfo.ModelYear',
          false,
          'Invalid year range'
        );
      } else {
        this.setFieldValidation(
          'VehicleInfo.ModelYear',
          true,
          'Valid model year'
        );
      }
    }

    // Make and Model validation
    if (!vehicleInfo.VehicleDesc?.MakeDesc) {
      this.addWarning('vehicleInfo.make', 'Missing vehicle make');
      this.setFieldValidation('VehicleInfo.Make', false, 'Missing make');
    } else {
      this.setFieldValidation('VehicleInfo.Make', true, 'Valid make');
    }

    if (!vehicleInfo.VehicleDesc?.ModelName) {
      this.addWarning('vehicleInfo.model', 'Missing vehicle model');
      this.setFieldValidation('VehicleInfo.Model', false, 'Missing model');
    } else {
      this.setFieldValidation('VehicleInfo.Model', true, 'Valid model');
    }

    // Odometer validation
    if (vehicleInfo.VehicleDesc?.OdometerInfo?.OdometerReading) {
      const mileage = parseInt(
        vehicleInfo.VehicleDesc.OdometerInfo.OdometerReading
      );
      if (mileage < 0 || mileage > this.validationRules.ranges.mileage.max) {
        this.addError(
          'vehicleInfo.mileage',
          `Invalid odometer reading: ${mileage}`
        );
        this.setFieldValidation(
          'VehicleInfo.Odometer',
          false,
          'Invalid odometer reading'
        );
      } else {
        this.setFieldValidation(
          'VehicleInfo.Odometer',
          true,
          'Valid odometer reading'
        );
      }
    }
  }

  /**
   * Validate claim information
   */
  async validateClaimInfo(claimInfo) {
    if (!claimInfo) {
      this.addError('claimInfo', 'Missing ClaimInfo section');
      return;
    }

    // Claim number validation (required)
    if (!claimInfo.ClaimNum) {
      this.addError('claimInfo.number', 'Missing claim number');
      this.setFieldValidation(
        'ClaimInfo.ClaimNum',
        false,
        'Missing claim number'
      );
    } else {
      this.setFieldValidation('ClaimInfo.ClaimNum', true, 'Valid claim number');
    }

    // Policy number validation
    if (claimInfo.PolicyInfo?.PolicyNum) {
      this.setFieldValidation(
        'ClaimInfo.PolicyNum',
        true,
        'Policy number present'
      );
    } else {
      this.addWarning('claimInfo.policy', 'Missing policy number');
      this.setFieldValidation(
        'ClaimInfo.PolicyNum',
        false,
        'Missing policy number'
      );
    }

    // Deductible validation
    if (
      claimInfo.PolicyInfo?.CoverageInfo?.Coverage?.DeductibleInfo
        ?.DeductibleAmt
    ) {
      const deductible = parseFloat(
        claimInfo.PolicyInfo.CoverageInfo.Coverage.DeductibleInfo.DeductibleAmt
      );
      if (deductible < 0 || deductible > 10000) {
        this.addWarning(
          'claimInfo.deductible',
          `Unusual deductible amount: ${deductible}`
        );
        this.setFieldValidation(
          'ClaimInfo.Deductible',
          false,
          'Unusual deductible amount'
        );
      } else {
        this.setFieldValidation(
          'ClaimInfo.Deductible',
          true,
          'Valid deductible'
        );
      }
    }
  }

  /**
   * Validate damage lines
   */
  async validateDamageLines(damageLines) {
    if (!damageLines) {
      this.addWarning('damageLines', 'No damage lines found');
      return;
    }

    const lines = Array.isArray(damageLines) ? damageLines : [damageLines];

    if (lines.length === 0) {
      this.addWarning('damageLines.count', 'No damage lines in estimate');
      return;
    }

    lines.forEach((line, index) => {
      this.validateDamageLine(line, index);
    });

    this.setFieldValidation(
      'DamageLines.Count',
      true,
      `${lines.length} damage lines validated`
    );
  }

  /**
   * Validate individual damage line
   */
  validateDamageLine(line, index) {
    const context = `DamageLine[${index}]`;

    // Line number validation
    if (!line.LineNum) {
      this.addError(
        `${context.toLowerCase()}.number`,
        `Missing line number for damage line ${index + 1}`
      );
    }

    // Description validation
    if (!line.LineDesc) {
      this.addWarning(
        `${context.toLowerCase()}.description`,
        `Missing description for damage line ${index + 1}`
      );
    }

    // Part information validation
    if (line.PartInfo) {
      this.validatePartInfo(line.PartInfo, `${context}.Part`);
    }

    // Labor information validation
    if (line.LaborInfo) {
      this.validateLaborInfo(line.LaborInfo, `${context}.Labor`);
    }

    // Material information validation
    if (line.OtherChargesInfo) {
      this.validateOtherChargesInfo(
        line.OtherChargesInfo,
        `${context}.OtherCharges`
      );
    }
  }

  /**
   * Validate part information
   */
  validatePartInfo(partInfo, context) {
    // Part number validation
    if (!partInfo.PartNum && !partInfo.OEMPartNum) {
      this.addWarning(`${context.toLowerCase()}.number`, 'Missing part number');
      this.setFieldValidation(
        `${context}.PartNum`,
        false,
        'Missing part number'
      );
    } else {
      this.setFieldValidation(
        `${context}.PartNum`,
        true,
        'Part number present'
      );
    }

    // Price validation
    if (partInfo.PartPrice !== undefined) {
      const price = parseFloat(partInfo.PartPrice);
      if (price < 0 || price > this.validationRules.ranges.amount.max) {
        this.addError(
          `${context.toLowerCase()}.price`,
          `Invalid part price: ${price}`
        );
        this.setFieldValidation(
          `${context}.Price`,
          false,
          'Invalid part price'
        );
      } else {
        this.setFieldValidation(`${context}.Price`, true, 'Valid part price');
      }
    }

    // Quantity validation
    if (partInfo.Quantity !== undefined) {
      const quantity = parseInt(partInfo.Quantity);
      if (quantity <= 0 || quantity > 999) {
        this.addError(
          `${context.toLowerCase()}.quantity`,
          `Invalid quantity: ${quantity}`
        );
        this.setFieldValidation(
          `${context}.Quantity`,
          false,
          'Invalid quantity'
        );
      } else {
        this.setFieldValidation(`${context}.Quantity`, true, 'Valid quantity');
      }
    }
  }

  /**
   * Validate labor information
   */
  validateLaborInfo(laborInfo, context) {
    // Labor hours validation
    if (laborInfo.LaborHours !== undefined) {
      const hours = parseFloat(laborInfo.LaborHours);
      if (hours < 0 || hours > 999) {
        this.addError(
          `${context.toLowerCase()}.hours`,
          `Invalid labor hours: ${hours}`
        );
        this.setFieldValidation(
          `${context}.Hours`,
          false,
          'Invalid labor hours'
        );
      } else {
        this.setFieldValidation(`${context}.Hours`, true, 'Valid labor hours');
      }
    }

    // Labor operation validation
    if (!laborInfo.LaborOperation) {
      this.addWarning(
        `${context.toLowerCase()}.operation`,
        'Missing labor operation'
      );
      this.setFieldValidation(
        `${context}.Operation`,
        false,
        'Missing operation'
      );
    } else {
      this.setFieldValidation(
        `${context}.Operation`,
        true,
        'Labor operation present'
      );
    }
  }

  /**
   * Validate other charges information
   */
  validateOtherChargesInfo(otherCharges, context) {
    // Price validation
    if (otherCharges.Price !== undefined) {
      const price = parseFloat(otherCharges.Price);
      if (price < 0 || price > this.validationRules.ranges.amount.max) {
        this.addError(
          `${context.toLowerCase()}.price`,
          `Invalid other charges price: ${price}`
        );
        this.setFieldValidation(`${context}.Price`, false, 'Invalid price');
      } else {
        this.setFieldValidation(`${context}.Price`, true, 'Valid price');
      }
    }
  }

  /**
   * Validate repair totals
   */
  async validateTotals(totals) {
    if (!totals) {
      this.addWarning('totals', 'Missing repair totals');
      return;
    }

    // Labor totals validation
    if (totals.LaborTotalsInfo) {
      this.validateTotalInfo(totals.LaborTotalsInfo, 'Labor');
    }

    // Parts totals validation
    if (totals.PartsTotalsInfo) {
      this.validateTotalInfo(totals.PartsTotalsInfo, 'Parts');
    }

    // Summary totals validation
    if (totals.SummaryTotalsInfo) {
      const summaryTotals = Array.isArray(totals.SummaryTotalsInfo)
        ? totals.SummaryTotalsInfo
        : [totals.SummaryTotalsInfo];

      summaryTotals.forEach((total, index) => {
        this.validateSummaryTotal(total, index);
      });
    }
  }

  /**
   * Validate total information
   */
  validateTotalInfo(totalInfo, type) {
    const context = `${type}Total`;

    if (totalInfo.TotalAmt !== undefined) {
      const amount = parseFloat(totalInfo.TotalAmt);
      if (amount < 0 || amount > 999999) {
        this.addError(
          `${context.toLowerCase()}.amount`,
          `Invalid ${type.toLowerCase()} total: ${amount}`
        );
        this.setFieldValidation(
          `${context}.Amount`,
          false,
          'Invalid total amount'
        );
      } else {
        this.setFieldValidation(
          `${context}.Amount`,
          true,
          'Valid total amount'
        );
      }
    }
  }

  /**
   * Validate summary total
   */
  validateSummaryTotal(total, index) {
    const context = `SummaryTotal[${index}]`;

    if (total.TotalAmt !== undefined) {
      const amount = parseFloat(total.TotalAmt);
      if (amount < 0) {
        this.addError(
          `${context.toLowerCase()}.amount`,
          `Negative summary total: ${amount}`
        );
        this.setFieldValidation(`${context}.Amount`, false, 'Negative total');
      } else {
        this.setFieldValidation(
          `${context}.Amount`,
          true,
          'Valid summary total'
        );
      }
    }
  }

  /**
   * Validate required fields
   */
  validateRequired(data, requiredFields, section) {
    requiredFields.forEach(field => {
      if (!data[field]) {
        this.addError(
          `${section.toLowerCase()}.${field.toLowerCase()}`,
          `Missing required field: ${field}`
        );
        this.setFieldValidation(
          `${section}.${field}`,
          false,
          'Missing required field'
        );
      } else {
        this.setFieldValidation(
          `${section}.${field}`,
          true,
          'Required field present'
        );
      }
    });
  }

  /**
   * Add validation error
   */
  addError(field, message) {
    this.validationErrors.push({ field, message, severity: 'error' });
  }

  /**
   * Add validation warning
   */
  addWarning(field, message) {
    this.validationWarnings.push({ field, message, severity: 'warning' });
  }

  /**
   * Set field validation result
   */
  setFieldValidation(field, isValid, message) {
    this.fieldValidations.set(field, { isValid, message });
  }

  /**
   * Reset validation state
   */
  reset() {
    this.validationErrors = [];
    this.validationWarnings = [];
    this.fieldValidations.clear();
  }

  /**
   * Get validation result
   */
  getValidationResult() {
    const totalIssues =
      this.validationErrors.length + this.validationWarnings.length;
    const isValid = this.validationErrors.length === 0;

    return {
      isValid,
      hasWarnings: this.validationWarnings.length > 0,
      errorCount: this.validationErrors.length,
      warningCount: this.validationWarnings.length,
      totalIssues,
      errors: this.validationErrors,
      warnings: this.validationWarnings,
      fieldValidations: Object.fromEntries(this.fieldValidations),
      summary: {
        status: isValid
          ? this.validationWarnings.length > 0
            ? 'valid_with_warnings'
            : 'valid'
          : 'invalid',
        message: this.getValidationSummaryMessage(),
      },
    };
  }

  /**
   * Get validation summary message
   */
  getValidationSummaryMessage() {
    if (
      this.validationErrors.length === 0 &&
      this.validationWarnings.length === 0
    ) {
      return 'BMS file is valid with no issues detected';
    } else if (this.validationErrors.length === 0) {
      return `BMS file is valid but has ${this.validationWarnings.length} warning(s)`;
    } else {
      return `BMS file is invalid with ${this.validationErrors.length} error(s) and ${this.validationWarnings.length} warning(s)`;
    }
  }
}

export default BMSValidator;
