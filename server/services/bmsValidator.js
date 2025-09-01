const { XMLParser } = require('fast-xml-parser');

/**
 * BMS/EMS File Validator
 * Validates file format and structure before processing
 */
class BMSValidator {
  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: true,
      trimValues: true,
      parseAttributeValue: false, // Keep as strings for validation
    });

    this.validationRules = {
      bms: {
        requiredElements: ['VehicleInfo', 'AdminInfo'],
        optionalElements: ['DamageLineInfo', 'RepairTotalsInfo', 'ClaimInfo'],
      },
      ems: {
        requiredRecordTypes: ['HD', 'VH', 'CO'],
        optionalRecordTypes: ['IN', 'CL', 'LI', 'PA', 'LA', 'TO'],
      },
    };
  }

  /**
   * Validate BMS XML file
   */
  async validateBMSFile(content) {
    const validation = {
      isValid: true,
      fileType: 'BMS',
      errors: [],
      warnings: [],
      summary: {
        message: 'File validation passed',
        details: {},
      },
    };

    try {
      // Check if content is XML or text
      const trimmedContent = content.trim();

      if (trimmedContent.startsWith('<')) {
        // XML format - BMS
        return await this.validateBMSXML(content, validation);
      } else {
        // Text format - EMS
        validation.fileType = 'EMS';
        return await this.validateEMSText(content, validation);
      }
    } catch (error) {
      validation.isValid = false;
      validation.errors.push({
        type: 'PARSING_ERROR',
        message: `Failed to parse file: ${error.message}`,
        severity: 'critical',
      });
      validation.summary.message = 'File validation failed';

      return validation;
    }
  }

  /**
   * Validate BMS XML format
   */
  async validateBMSXML(content, validation) {
    try {
      // Parse XML
      const parsed = this.xmlParser.parse(content);

      // Find root element
      let root = parsed;
      if (parsed.VehicleDamageEstimateAddRq) {
        root = parsed.VehicleDamageEstimateAddRq;
      } else if (parsed.estimate) {
        root = parsed.estimate;
      } else if (parsed.estimateData) {
        root = parsed.estimateData;
      } else if (parsed.estimateInfo) {
        root = parsed.estimateInfo;
      }

      if (!root) {
        validation.errors.push({
          type: 'STRUCTURE_ERROR',
          message: 'No valid BMS root element found',
          severity: 'critical',
        });
        validation.isValid = false;
        return validation;
      }

      // Validate required elements
      this.validateRequiredBMSElements(root, validation);

      // Validate vehicle information
      this.validateVehicleInfo(root.VehicleInfo, validation);

      // Validate admin information
      this.validateAdminInfo(root.AdminInfo, validation);

      // Validate damage lines
      if (root.DamageLineInfo) {
        this.validateDamageLineInfo(root.DamageLineInfo, validation);
      }

      // Validate financial totals
      if (root.RepairTotalsInfo) {
        this.validateRepairTotalsInfo(root.RepairTotalsInfo, validation);
      }

      // Set summary details
      validation.summary.details = {
        hasVehicleInfo: !!root.VehicleInfo,
        hasAdminInfo: !!root.AdminInfo,
        hasDamageLines: !!root.DamageLineInfo,
        hasTotals: !!root.RepairTotalsInfo,
        hasClaimInfo: !!root.ClaimInfo,
      };
    } catch (error) {
      validation.isValid = false;
      validation.errors.push({
        type: 'XML_PARSING_ERROR',
        message: `XML parsing failed: ${error.message}`,
        severity: 'critical',
      });
    }

    // Update validation status
    if (validation.errors.length > 0) {
      validation.isValid = false;
      validation.summary.message = `File validation failed with ${validation.errors.length} errors`;
    } else if (validation.warnings.length > 0) {
      validation.summary.message = `File validation passed with ${validation.warnings.length} warnings`;
    }

    return validation;
  }

  /**
   * Validate EMS text format
   */
  async validateEMSText(content, validation) {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    const recordTypes = new Set();
    const lineErrors = [];

    // Check each line
    lines.forEach((line, index) => {
      const fields = this.parseEMSLine(line);

      if (fields.length === 0) {
        validation.warnings.push({
          type: 'EMPTY_LINE',
          message: `Line ${index + 1}: Empty line`,
          line: index + 1,
          severity: 'low',
        });
        return;
      }

      const recordType = fields[0].toUpperCase();
      recordTypes.add(recordType);

      // Validate line format based on record type
      this.validateEMSLine(recordType, fields, index + 1, validation);
    });

    // Check for required record types
    this.validationRules.ems.requiredRecordTypes.forEach(requiredType => {
      if (!recordTypes.has(requiredType)) {
        validation.errors.push({
          type: 'MISSING_RECORD_TYPE',
          message: `Required record type '${requiredType}' is missing`,
          severity: 'high',
        });
      }
    });

    // Set summary details
    validation.summary.details = {
      totalLines: lines.length,
      recordTypes: Array.from(recordTypes),
      hasHeader: recordTypes.has('HD'),
      hasVehicle: recordTypes.has('VH'),
      hasCustomer: recordTypes.has('CO'),
      hasLineItems:
        recordTypes.has('LI') || recordTypes.has('PA') || recordTypes.has('LA'),
    };

    // Update validation status
    if (validation.errors.length > 0) {
      validation.isValid = false;
      validation.summary.message = `File validation failed with ${validation.errors.length} errors`;
    } else if (validation.warnings.length > 0) {
      validation.summary.message = `File validation passed with ${validation.warnings.length} warnings`;
    }

    return validation;
  }

  /**
   * Validate required BMS elements
   */
  validateRequiredBMSElements(root, validation) {
    this.validationRules.bms.requiredElements.forEach(element => {
      if (!root[element]) {
        validation.errors.push({
          type: 'MISSING_ELEMENT',
          message: `Required element '${element}' is missing`,
          element,
          severity: 'high',
        });
      }
    });
  }

  /**
   * Validate vehicle information
   */
  validateVehicleInfo(vehicleInfo, validation) {
    if (!vehicleInfo) return;

    // Check VIN
    if (vehicleInfo.VINInfo?.VIN?.VINNum) {
      const vin = vehicleInfo.VINInfo.VIN.VINNum;
      if (typeof vin === 'string' && vin.length !== 17) {
        validation.warnings.push({
          type: 'INVALID_VIN',
          message: 'VIN should be 17 characters long',
          severity: 'medium',
        });
      }
    } else {
      validation.warnings.push({
        type: 'MISSING_VIN',
        message: 'Vehicle VIN is missing',
        severity: 'medium',
      });
    }

    // Check vehicle description
    if (!vehicleInfo.VehicleDesc) {
      validation.warnings.push({
        type: 'MISSING_VEHICLE_DESC',
        message: 'Vehicle description is missing',
        severity: 'low',
      });
    } else {
      const desc = vehicleInfo.VehicleDesc;
      if (!desc.ModelYear) {
        validation.warnings.push({
          type: 'MISSING_YEAR',
          message: 'Vehicle year is missing',
          severity: 'medium',
        });
      }
      if (!desc.MakeDesc) {
        validation.warnings.push({
          type: 'MISSING_MAKE',
          message: 'Vehicle make is missing',
          severity: 'medium',
        });
      }
      if (!desc.ModelName) {
        validation.warnings.push({
          type: 'MISSING_MODEL',
          message: 'Vehicle model is missing',
          severity: 'medium',
        });
      }
    }
  }

  /**
   * Validate admin information
   */
  validateAdminInfo(adminInfo, validation) {
    if (!adminInfo) return;

    // Check policy holder
    if (!adminInfo.PolicyHolder) {
      validation.warnings.push({
        type: 'MISSING_POLICY_HOLDER',
        message: 'Policy holder information is missing',
        severity: 'medium',
      });
    }

    // Check insurance company
    if (!adminInfo.InsuranceCompany) {
      validation.warnings.push({
        type: 'MISSING_INSURANCE',
        message: 'Insurance company information is missing',
        severity: 'low',
      });
    }
  }

  /**
   * Validate damage line information
   */
  validateDamageLineInfo(damageLineInfo, validation) {
    const damageLines = Array.isArray(damageLineInfo)
      ? damageLineInfo
      : [damageLineInfo];

    damageLines.forEach((line, index) => {
      if (!line.LineType) {
        validation.errors.push({
          type: 'MISSING_LINE_TYPE',
          message: `Damage line ${index + 1}: Line type is missing`,
          line: index + 1,
          severity: 'high',
        });
      }

      if (!line.LineDesc) {
        validation.warnings.push({
          type: 'MISSING_LINE_DESC',
          message: `Damage line ${index + 1}: Line description is missing`,
          line: index + 1,
          severity: 'low',
        });
      }

      // Validate part information
      if (line.LineType === 'Part' && line.PartInfo) {
        if (!line.PartInfo.PartNum && !line.PartInfo.OEMPartNum) {
          validation.warnings.push({
            type: 'MISSING_PART_NUMBER',
            message: `Damage line ${index + 1}: Part number is missing`,
            line: index + 1,
            severity: 'medium',
          });
        }
      }

      // Validate labor information
      if (line.LineType === 'Labor' && line.LaborInfo) {
        if (!line.LaborInfo.LaborHours) {
          validation.warnings.push({
            type: 'MISSING_LABOR_HOURS',
            message: `Damage line ${index + 1}: Labor hours is missing`,
            line: index + 1,
            severity: 'medium',
          });
        }
      }
    });
  }

  /**
   * Validate repair totals information
   */
  validateRepairTotalsInfo(repairTotalsInfo, validation) {
    if (!repairTotalsInfo.SummaryTotalsInfo) {
      validation.warnings.push({
        type: 'MISSING_SUMMARY_TOTALS',
        message: 'Summary totals information is missing',
        severity: 'medium',
      });
    }
  }

  /**
   * Validate EMS line format
   */
  validateEMSLine(recordType, fields, lineNumber, validation) {
    const minFieldCounts = {
      HD: 2, // Header: type, shop name
      VH: 4, // Vehicle: type, year, make, model
      CO: 3, // Customer: type, first name, last name
      IN: 2, // Insurance: type, company
      CL: 2, // Claim: type, claim number
      LI: 4, // Line item: type, item type, description, quantity
      PA: 4, // Parts: type, part number, description, quantity
      LA: 4, // Labor: type, operation, description, hours
      TO: 3, // Totals: type, label, amount
      TX: 3, // Tax: type, rate, amount
      DE: 2, // Deductible: type, amount
      NO: 2, // Notes: type, note text
    };

    const minFields = minFieldCounts[recordType] || 1;
    if (fields.length < minFields) {
      validation.errors.push({
        type: 'INSUFFICIENT_FIELDS',
        message: `Line ${lineNumber}: Record type '${recordType}' requires at least ${minFields} fields, found ${fields.length}`,
        line: lineNumber,
        recordType,
        severity: 'high',
      });
    }

    // Validate specific record types
    switch (recordType) {
      case 'VH':
        if (fields.length >= 2 && fields[1]) {
          const year = parseInt(fields[1]);
          if (
            isNaN(year) ||
            year < 1900 ||
            year > new Date().getFullYear() + 2
          ) {
            validation.warnings.push({
              type: 'INVALID_YEAR',
              message: `Line ${lineNumber}: Invalid vehicle year '${fields[1]}'`,
              line: lineNumber,
              severity: 'medium',
            });
          }
        }
        break;

      case 'TO':
        if (fields.length >= 3 && fields[2]) {
          const amount = parseFloat(fields[2]);
          if (isNaN(amount)) {
            validation.warnings.push({
              type: 'INVALID_AMOUNT',
              message: `Line ${lineNumber}: Invalid amount '${fields[2]}'`,
              line: lineNumber,
              severity: 'medium',
            });
          }
        }
        break;
    }
  }

  /**
   * Parse EMS line (same as in EMS parser)
   */
  parseEMSLine(line) {
    const fields = [];
    let current = '';
    let escaped = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '\\' && !escaped) {
        escaped = true;
        continue;
      }

      if (char === '|' && !escaped) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }

      escaped = false;
    }

    if (current) {
      fields.push(current.trim());
    }

    return fields;
  }
}

module.exports = new BMSValidator();
