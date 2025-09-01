const { XMLParser } = require('fast-xml-parser');
const Decimal = require('decimal.js');

class EnhancedBMSParser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: true,
      trimValues: true,
      parseAttributeValue: true,
      processEntities: true,
      htmlEntities: true,
    });
    this.unknownTags = new Set();
  }

  async parseBMS(xmlContent) {
    try {
      console.log('Starting BMS parsing...');

      // Parse XML content
      const parsed = this.parser.parse(xmlContent);

      // Handle different root elements
      let root = parsed;
      if (parsed.VehicleDamageEstimateAddRq) {
        root = parsed.VehicleDamageEstimateAddRq;
      } else if (parsed.BMS_ESTIMATE) {
        root = parsed.BMS_ESTIMATE;
      } else if (parsed.estimate) {
        root = parsed.estimate;
      } else if (parsed.estimateData) {
        root = parsed.estimateData;
      } else if (parsed.estimateInfo) {
        root = parsed.estimateInfo;
      }

      if (!root) {
        throw new Error('No valid estimate root found in BMS file');
      }

      // Extract all data
      const result = {
        customer: this.extractCustomerInfo(root),
        vehicle: this.extractVehicleInfo(root),
        estimate: this.extractEstimateInfo(root),
        parts: this.extractPartsInfo(root),
        labor: this.extractLaborInfo(root),
        financial: this.extractFinancialInfo(root),
        metadata: this.extractMetadata(root),
      };

      console.log('BMS parsing completed successfully');
      return result;
    } catch (error) {
      console.error('Error parsing BMS file:', error);
      throw new Error(
        `BMS parsing failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  extractCustomerInfo(root) {
    const customer = {};

    // Handle simple test format: <estimate><customer>...</customer></estimate>
    if (root.customer) {
      const customerInfo = root.customer;
      customer.firstName = this.getTextValue(customerInfo.firstName);
      customer.lastName = this.getTextValue(customerInfo.lastName);
      customer.name =
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      customer.phone = this.getTextValue(customerInfo.phone);
      customer.email = this.getTextValue(customerInfo.email);
      customer.address = this.getTextValue(customerInfo.address);
      customer.city = this.getTextValue(customerInfo.city);
      customer.state = this.getTextValue(customerInfo.state);
      customer.zip = this.getTextValue(customerInfo.zip);
    }

    // Handle our test BMS_ESTIMATE format
    if (root.CUSTOMER_INFO) {
      const customerInfo = root.CUSTOMER_INFO;
      customer.firstName = this.getTextValue(customerInfo.FIRST_NAME);
      customer.lastName = this.getTextValue(customerInfo.LAST_NAME);
      customer.name =
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      customer.phone = this.getTextValue(customerInfo.PHONE);
      customer.email = this.getTextValue(customerInfo.EMAIL);

      if (customerInfo.ADDRESS) {
        const address = customerInfo.ADDRESS;
        customer.address = this.getTextValue(address.STREET);
        customer.city = this.getTextValue(address.CITY);
        customer.state = this.getTextValue(address.STATE);
        customer.zip = this.getTextValue(address.ZIP);
      }
    }

    // Handle claim and insurance info
    if (root.CLAIM_INFO) {
      const claimInfo = root.CLAIM_INFO;
      customer.claimNumber = this.getTextValue(claimInfo.CLAIM_NUMBER);
      customer.policyNumber = this.getTextValue(claimInfo.POLICY_NUMBER);
      customer.insurance = this.getTextValue(claimInfo.INSURANCE_COMPANY);
    }

    // Handle BMS format with PolicyHolder
    if (root.AdminInfo && root.AdminInfo.PolicyHolder) {
      const policyHolder = root.AdminInfo.PolicyHolder.Party;
      if (policyHolder.PersonInfo && policyHolder.PersonInfo.PersonName) {
        const personName = policyHolder.PersonInfo.PersonName;
        const firstName = this.getTextValue(personName.FirstName);
        const lastName = this.getTextValue(personName.LastName);
        customer.name = `${firstName} ${lastName}`.trim();
      }

      if (policyHolder.ContactInfo && policyHolder.ContactInfo.Communications) {
        const communications = Array.isArray(
          policyHolder.ContactInfo.Communications
        )
          ? policyHolder.ContactInfo.Communications
          : [policyHolder.ContactInfo.Communications];

        communications.forEach(comm => {
          if (comm.CommQualifier === 'HP' && comm.CommPhone) {
            customer.phone = this.getTextValue(comm.CommPhone);
          } else if (comm.CommQualifier === 'EM' && comm.CommEmail) {
            customer.email = this.getTextValue(comm.CommEmail);
          }
        });
      }

      if (policyHolder.PersonInfo && policyHolder.PersonInfo.Communications) {
        const address = policyHolder.PersonInfo.Communications.Address;
        if (address) {
          customer.address = this.getTextValue(address.Address1);
          customer.city = this.getTextValue(address.City);
          customer.state = this.getTextValue(address.StateProvince);
          customer.zip = this.getTextValue(address.PostalCode);
        }
      }
    }

    // Handle insurance company info
    if (root.AdminInfo && root.AdminInfo.InsuranceCompany) {
      const insurance = root.AdminInfo.InsuranceCompany.Party;
      if (insurance.OrgInfo && insurance.OrgInfo.CompanyName) {
        customer.insurance = this.getTextValue(insurance.OrgInfo.CompanyName);
      }
    }

    // Handle claim number
    if (root.RefClaimNum) {
      customer.claim = this.getTextValue(root.RefClaimNum);
    }

    return customer;
  }

  extractVehicleInfo(root) {
    const vehicle = {};

    // Handle simple test format: <estimate><vehicle>...</vehicle></estimate>
    if (root.vehicle) {
      const vehicleInfo = root.vehicle;
      vehicle.year = parseInt(this.getTextValue(vehicleInfo.year)) || null;
      vehicle.make = this.getTextValue(vehicleInfo.make);
      vehicle.model = this.getTextValue(vehicleInfo.model);
      vehicle.trim = this.getTextValue(vehicleInfo.trim);
      vehicle.vin = this.getTextValue(vehicleInfo.vin);
      vehicle.license = this.getTextValue(vehicleInfo.license);
      vehicle.color = this.getTextValue(vehicleInfo.color);
      vehicle.engine = this.getTextValue(vehicleInfo.engine);
      vehicle.transmission = this.getTextValue(vehicleInfo.transmission);
      vehicle.mileage =
        parseInt(this.getTextValue(vehicleInfo.mileage)) || null;
    }

    // Handle our test BMS_ESTIMATE format
    if (root.VEHICLE_INFO) {
      const vehicleInfo = root.VEHICLE_INFO;
      vehicle.year = parseInt(this.getTextValue(vehicleInfo.YEAR)) || null;
      vehicle.make = this.getTextValue(vehicleInfo.MAKE);
      vehicle.model = this.getTextValue(vehicleInfo.MODEL);
      vehicle.trim = this.getTextValue(vehicleInfo.TRIM);
      vehicle.vin = this.getTextValue(vehicleInfo.VIN);
      vehicle.license = this.getTextValue(vehicleInfo.LICENSE_PLATE);
      vehicle.color = this.getTextValue(vehicleInfo.COLOR);
      vehicle.engine = this.getTextValue(vehicleInfo.ENGINE);
      vehicle.transmission = this.getTextValue(vehicleInfo.TRANSMISSION);
      vehicle.mileage =
        parseInt(this.getTextValue(vehicleInfo.MILEAGE)) || null;
    }

    // Handle BMS format with VehicleInfo
    if (root.VehicleInfo) {
      const vehicleData = root.VehicleInfo;

      // VIN
      if (vehicleData.VINInfo && vehicleData.VINInfo.VIN) {
        vehicle.vin = this.getTextValue(vehicleData.VINInfo.VIN.VINNum);
      }

      // License plate
      if (vehicleData.License) {
        vehicle.license = this.getTextValue(
          vehicleData.License.LicensePlateNum
        );
      }

      // Vehicle description
      if (vehicleData.VehicleDesc) {
        const desc = vehicleData.VehicleDesc;
        vehicle.year = this.getTextValue(desc.ModelYear);
        vehicle.make = this.getTextValue(desc.MakeDesc);
        vehicle.model = this.getTextValue(desc.ModelName);

        if (desc.OdometerInfo) {
          vehicle.mileage = this.getNumericValue(
            desc.OdometerInfo.OdometerReading
          );
        }
      }

      // Powertrain
      if (vehicleData.Powertrain) {
        vehicle.engine = this.getTextValue(vehicleData.Powertrain.EngineDesc);
        if (vehicleData.Powertrain.TransmissionInfo) {
          vehicle.transmission = this.getTextValue(
            vehicleData.Powertrain.TransmissionInfo.TransmissionDesc
          );
        }
      }

      // Paint/Color
      if (
        vehicleData.Paint &&
        vehicleData.Paint.Exterior &&
        vehicleData.Paint.Exterior.Color
      ) {
        vehicle.color = this.getTextValue(
          vehicleData.Paint.Exterior.Color.ColorName
        );
      }
    }

    return vehicle;
  }

  extractEstimateInfo(root) {
    const estimate = {};

    // Handle BMS format
    if (root.DocumentInfo) {
      estimate.estimateNumber = this.getTextValue(root.DocumentInfo.DocumentID);
      estimate.date = this.getTextValue(root.DocumentInfo.CreateDateTime);
      estimate.status = this.getTextValue(root.DocumentInfo.DocumentStatus);
      estimate.type = this.getTextValue(root.DocumentInfo.DocumentType);
    }

    if (root.RqUID) {
      estimate.roNumber = this.getTextValue(root.RqUID);
    }

    return estimate;
  }

  extractPartsInfo(root) {
    const parts = [];

    // Handle our test BMS_ESTIMATE format with DAMAGE_LINES
    if (root.DAMAGE_ASSESSMENT && root.DAMAGE_ASSESSMENT.DAMAGE_LINES) {
      const damageLines = root.DAMAGE_ASSESSMENT.DAMAGE_LINES.LINE_ITEM;
      const lines = Array.isArray(damageLines) ? damageLines : [damageLines];

      lines.forEach((line, index) => {
        if (line && line.PART_NAME) {
          parts.push({
            lineNumber:
              parseInt(this.getTextValue(line.LINE_NUMBER)) || index + 1,
            partName: this.getTextValue(line.PART_NAME),
            partNumber: this.getTextValue(line.PART_NUMBER),
            operationType: this.getTextValue(line.OPERATION_TYPE),
            partType: this.getTextValue(line.PART_TYPE),
            partCost: parseFloat(this.getTextValue(line.PART_COST)) || 0,
            laborHours: parseFloat(this.getTextValue(line.LABOR_HOURS)) || 0,
            laborRate: parseFloat(this.getTextValue(line.LABOR_RATE)) || 0,
            laborAmount: parseFloat(this.getTextValue(line.LABOR_AMOUNT)) || 0,
            paintHours: parseFloat(this.getTextValue(line.PAINT_HOURS)) || 0,
            paintRate: parseFloat(this.getTextValue(line.PAINT_RATE)) || 0,
            paintAmount: parseFloat(this.getTextValue(line.PAINT_AMOUNT)) || 0,
            materialCost:
              parseFloat(this.getTextValue(line.MATERIAL_COST)) || 0,
            totalAmount: parseFloat(this.getTextValue(line.TOTAL_AMOUNT)) || 0,
          });
        }
      });
    }

    // Handle BMS format with DamageLineInfo
    if (root.DamageLineInfo) {
      const damageLines = Array.isArray(root.DamageLineInfo)
        ? root.DamageLineInfo
        : [root.DamageLineInfo];

      damageLines.forEach((line, index) => {
        if (line.LineType === 'Part' && line.PartInfo) {
          const partInfo = line.PartInfo;
          parts.push({
            lineNumber: this.getNumericValue(line.LineNum),
            partNumber: this.getTextValue(partInfo.PartNum),
            oemPartNumber: this.getTextValue(partInfo.OEMPartNum),
            description: this.getTextValue(line.LineDesc),
            quantity: this.getNumericValue(partInfo.Quantity),
            price: this.getDecimalValue(partInfo.PartPrice),
            oemPrice: this.getDecimalValue(partInfo.OEMPartPrice),
            partType: this.getTextValue(partInfo.PartType),
            sourceCode: this.getTextValue(partInfo.PartSourceCode),
            taxable: this.getBooleanValue(partInfo.TaxableInd),
          });
        }
      });
    }

    return parts;
  }

  extractLaborInfo(root) {
    const labor = [];

    // Handle BMS format with DamageLineInfo
    if (root.DamageLineInfo) {
      const damageLines = Array.isArray(root.DamageLineInfo)
        ? root.DamageLineInfo
        : [root.DamageLineInfo];

      damageLines.forEach((line, index) => {
        if (line.LineType === 'Labor' && line.LaborInfo) {
          const laborInfo = line.LaborInfo;
          labor.push({
            lineNumber: this.getNumericValue(line.LineNum),
            operation: this.getTextValue(line.LineDesc),
            laborType: this.getTextValue(laborInfo.LaborType),
            laborOperation: this.getTextValue(laborInfo.LaborOperation),
            hours: this.getDecimalValue(laborInfo.LaborHours),
            databaseHours: this.getDecimalValue(laborInfo.DatabaseLaborHours),
            calculatedHours: this.getDecimalValue(laborInfo.LaborHoursCalc),
            taxable: this.getBooleanValue(laborInfo.TaxableInd),
          });
        }
      });
    }

    return labor;
  }

  extractFinancialInfo(root) {
    const financial = {};

    // Handle our test BMS_ESTIMATE format
    if (root.DAMAGE_ASSESSMENT) {
      const assessment = root.DAMAGE_ASSESSMENT;
      financial.totalEstimate =
        parseFloat(this.getTextValue(assessment.TOTAL_ESTIMATE)) || 0;
      financial.laborTotal =
        parseFloat(this.getTextValue(assessment.LABOR_TOTAL)) || 0;
      financial.partsTotal =
        parseFloat(this.getTextValue(assessment.PARTS_TOTAL)) || 0;
      financial.paintMaterialsTotal =
        parseFloat(this.getTextValue(assessment.PAINT_MATERIALS_TOTAL)) || 0;
      financial.taxTotal =
        parseFloat(this.getTextValue(assessment.TAX_TOTAL)) || 0;

      if (assessment.TOTALS_BREAKDOWN) {
        const breakdown = assessment.TOTALS_BREAKDOWN;
        financial.subtotal =
          parseFloat(this.getTextValue(breakdown.SUBTOTAL)) || 0;
        financial.laborTax =
          parseFloat(this.getTextValue(breakdown.LABOR_TAX)) || 0;
        financial.partsTax =
          parseFloat(this.getTextValue(breakdown.PARTS_TAX)) || 0;
        financial.deductible =
          parseFloat(this.getTextValue(breakdown.DEDUCTIBLE)) || 0;
        financial.finalTotal =
          parseFloat(this.getTextValue(breakdown.FINAL_TOTAL)) || 0;
      }
    }

    // Handle BMS format with RepairTotalsInfo
    if (root.RepairTotalsInfo) {
      const totals = root.RepairTotalsInfo;

      // Labor totals
      if (totals.LaborTotalsInfo) {
        financial.laborTotal = this.getDecimalValue(
          totals.LaborTotalsInfo.TotalAmt
        );
        financial.laborTax = this.getDecimalValue(
          totals.LaborTotalsInfo.TaxTotalAmt
        );
      }

      // Parts totals
      if (totals.PartsTotalsInfo) {
        financial.partsTotal = this.getDecimalValue(
          totals.PartsTotalsInfo.TotalAmt
        );
        financial.partsTax = this.getDecimalValue(
          totals.PartsTotalsInfo.TaxTotalAmt
        );
      }

      // Materials/Other charges
      if (totals.OtherChargesTotalsInfo) {
        financial.materialsTotal = this.getDecimalValue(
          totals.OtherChargesTotalsInfo.TotalAmt
        );
        financial.materialsTax = this.getDecimalValue(
          totals.OtherChargesTotalsInfo.TaxTotalAmt
        );
      }

      // Summary totals
      if (totals.SummaryTotalsInfo) {
        const summaryTotals = Array.isArray(totals.SummaryTotalsInfo)
          ? totals.SummaryTotalsInfo
          : [totals.SummaryTotalsInfo];

        summaryTotals.forEach(total => {
          if (total.TotalType === 'GrossTotal') {
            financial.total = this.getDecimalValue(total.TotalAmt);
          } else if (total.TotalType === 'NetTotal') {
            financial.insuranceTotal = this.getDecimalValue(total.TotalAmt);
          }
        });
      }
    }

    // Handle deductible from ClaimInfo
    if (
      root.ClaimInfo &&
      root.ClaimInfo.PolicyInfo &&
      root.ClaimInfo.PolicyInfo.CoverageInfo
    ) {
      const coverage = root.ClaimInfo.PolicyInfo.CoverageInfo.Coverage;
      if (coverage && coverage.DeductibleInfo) {
        financial.deductible = this.getDecimalValue(
          coverage.DeductibleInfo.DeductibleAmt
        );
        financial.deductibleStatus = this.getTextValue(
          coverage.DeductibleInfo.DeductibleStatus
        );
      }
    }

    return financial;
  }

  extractMetadata(root) {
    const metadata = {};

    metadata.parserVersion = '3.2-patched';
    metadata.parseDate = new Date().toISOString();
    metadata.sourceFormat = 'BMS XML';
    metadata.unknownTags = Array.from(this.unknownTags);

    return metadata;
  }

  // Helper methods
  getTextValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (value['#text']) return value['#text'].trim();
    return String(value).trim();
  }

  getNumericValue(value) {
    if (!value) return 0;
    const num = parseFloat(this.getTextValue(value));
    return isNaN(num) ? 0 : num;
  }

  getDecimalValue(value) {
    if (!value) return new Decimal(0);
    try {
      return new Decimal(this.getTextValue(value));
    } catch (error) {
      return new Decimal(0);
    }
  }

  getBooleanValue(value) {
    if (!value) return false;
    const str = this.getTextValue(value).toLowerCase();
    return str === 'true' || str === 'yes' || str === '1' || str === 'on';
  }
}

module.exports = EnhancedBMSParser;
