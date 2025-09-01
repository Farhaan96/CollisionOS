import { Decimal } from 'decimal.js';
import {
  NormalizedPayload,
  CustomerData,
  VehicleData,
  EstimateLine,
  PartData,
} from './types';

/**
 * EMS (Estimating Management System) Parser for pipe-delimited format
 * Handles various EMS formats from different estimating systems
 */
class EMSParser {
  private unknownFields: Set<string> = new Set();

  /**
   * Parse EMS pipe-delimited file and return normalized payload
   * @param emsContent - The EMS content as string
   * @returns Promise<NormalizedPayload> - Normalized EMS data
   */
  async parseEMS(emsContent: string): Promise<NormalizedPayload> {
    try {
      this.unknownFields.clear();

      const lines = emsContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);
      const sections = this.parseEMSSections(lines);

      const identities = this.extractIdentities(sections);
      const customer = this.extractCustomerData(sections);
      const vehicle = this.extractVehicleData(sections);
      const estimateLines = this.extractEstimateLines(sections);
      const parts = this.extractPartsData(estimateLines);

      return {
        identities,
        customer,
        vehicle,
        lines: estimateLines,
        parts,
        meta: {
          source_system: this.detectSourceSystem(sections),
          import_timestamp: new Date(),
          unknown_tags: Array.from(this.unknownFields),
        },
      };
    } catch (error) {
      console.error('Error parsing EMS file:', error);
      throw new Error(
        `EMS parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse EMS content into sections based on record types
   */
  private parseEMSSections(lines: string[]): Map<string, any[]> {
    const sections = new Map<string, any[]>();

    for (const line of lines) {
      const fields = line.split('|');
      if (fields.length < 2) continue;

      const recordType = fields[0]?.trim();
      if (!recordType) continue;

      if (!sections.has(recordType)) {
        sections.set(recordType, []);
      }

      sections.get(recordType)!.push(this.parseEMSFields(fields, recordType));
    }

    return sections;
  }

  /**
   * Parse EMS fields based on record type
   */
  private parseEMSFields(fields: string[], recordType: string): any {
    const record: any = { recordType };

    switch (recordType.toUpperCase()) {
      case 'HDR': // Header Record
        return this.parseHeaderRecord(fields, record);
      case 'CLM': // Claim Record
        return this.parseClaimRecord(fields, record);
      case 'CST': // Customer Record
        return this.parseCustomerRecord(fields, record);
      case 'VEH': // Vehicle Record
        return this.parseVehicleRecord(fields, record);
      case 'EST': // Estimate Record
        return this.parseEstimateRecord(fields, record);
      case 'LIN': // Line Item Record
        return this.parseLineRecord(fields, record);
      case 'PRT': // Parts Record
        return this.parsePartsRecord(fields, record);
      case 'LAB': // Labor Record
        return this.parseLaborRecord(fields, record);
      case 'MTL': // Materials Record
        return this.parseMaterialsRecord(fields, record);
      case 'TOT': // Totals Record
        return this.parseTotalsRecord(fields, record);
      default:
        // Log unknown record types
        this.unknownFields.add(`record_type:${recordType}`);
        return this.parseGenericRecord(fields, record);
    }
  }

  /**
   * Parse header record (HDR)
   * Format: HDR|version|vendor|system|date|time
   */
  private parseHeaderRecord(fields: string[], record: any): any {
    return {
      ...record,
      version: fields[1] || '',
      vendor: fields[2] || '',
      system: fields[3] || '',
      date: fields[4] || '',
      time: fields[5] || '',
      timestamp: this.parseEMSDateTime(fields[4], fields[5]),
    };
  }

  /**
   * Parse claim record (CLM)
   * Format: CLM|claim_number|policy_number|deductible|loss_date|adjuster
   */
  private parseClaimRecord(fields: string[], record: any): any {
    return {
      ...record,
      claimNumber: fields[1] || '',
      policyNumber: fields[2] || '',
      deductible: this.parseDecimal(fields[3]),
      lossDate: this.parseEMSDate(fields[4]),
      adjuster: fields[5] || '',
      insuranceCompany: fields[6] || '',
    };
  }

  /**
   * Parse customer record (CST)
   * Format: CST|first_name|last_name|company|address|city|state|zip|phone|email
   */
  private parseCustomerRecord(fields: string[], record: any): any {
    return {
      ...record,
      firstName: fields[1] || '',
      lastName: fields[2] || '',
      companyName: fields[3] || '',
      address: fields[4] || '',
      city: fields[5] || '',
      state: fields[6] || '',
      zipCode: fields[7] || '',
      phone: fields[8] || '',
      email: fields[9] || '',
      gstPayable: fields[10]?.toUpperCase() === 'Y' || !!fields[3], // Business customers pay GST
    };
  }

  /**
   * Parse vehicle record (VEH)
   * Format: VEH|vin|year|make|model|trim|body_style|color|license|mileage
   */
  private parseVehicleRecord(fields: string[], record: any): any {
    return {
      ...record,
      vin: fields[1] || '',
      year: parseInt(fields[2]) || 2020,
      make: fields[3] || '',
      model: fields[4] || '',
      trim: fields[5] || '',
      bodyStyle: fields[6] || '',
      exteriorColor: fields[7] || '',
      licensePlate: fields[8] || '',
      odometer: parseInt(fields[9]) || 0,
      engine: fields[10] || '',
      transmission: fields[11] || '',
      fuelType: fields[12] || '',
    };
  }

  /**
   * Parse estimate record (EST)
   * Format: EST|estimate_number|date|status|total_labor|total_parts|total_materials|gross_total
   */
  private parseEstimateRecord(fields: string[], record: any): any {
    return {
      ...record,
      estimateNumber: fields[1] || '',
      estimateDate: this.parseEMSDate(fields[2]),
      status: fields[3] || 'draft',
      totalLabor: this.parseDecimal(fields[4]),
      totalParts: this.parseDecimal(fields[5]),
      totalMaterials: this.parseDecimal(fields[6]),
      grossTotal: this.parseDecimal(fields[7]),
    };
  }

  /**
   * Parse line item record (LIN)
   * Format: LIN|line_number|description|type|amount|taxable|parent_line
   */
  private parseLineRecord(fields: string[], record: any): any {
    return {
      ...record,
      lineNumber: parseInt(fields[1]) || 0,
      description: fields[2] || '',
      lineType: fields[3] || '',
      amount: this.parseDecimal(fields[4]),
      taxable: fields[5]?.toUpperCase() === 'Y',
      parentLine: parseInt(fields[6]) || undefined,
    };
  }

  /**
   * Parse parts record (PRT)
   * Format: PRT|line_number|part_number|description|oem_number|quantity|price|part_type|source
   */
  private parsePartsRecord(fields: string[], record: any): any {
    return {
      ...record,
      lineNumber: parseInt(fields[1]) || 0,
      partNumber: fields[2] || '',
      description: fields[3] || '',
      oemPartNumber: fields[4] || '',
      quantity: parseInt(fields[5]) || 1,
      price: this.parseDecimal(fields[6]),
      partType: fields[7] || 'oem',
      sourceCode: fields[8] || 'OEM',
      taxable: fields[9]?.toUpperCase() === 'Y',
    };
  }

  /**
   * Parse labor record (LAB)
   * Format: LAB|line_number|operation|hours|rate|labor_type|taxable|paint_stages
   */
  private parseLaborRecord(fields: string[], record: any): any {
    return {
      ...record,
      lineNumber: parseInt(fields[1]) || 0,
      operation: fields[2] || '',
      hours: this.parseDecimal(fields[3]),
      rate: this.parseDecimal(fields[4]),
      laborType: fields[5] || 'repair',
      taxable: fields[6]?.toUpperCase() === 'Y',
      paintStages: parseInt(fields[7]) || undefined,
    };
  }

  /**
   * Parse materials record (MTL)
   * Format: MTL|line_number|material_type|description|price|taxable
   */
  private parseMaterialsRecord(fields: string[], record: any): any {
    return {
      ...record,
      lineNumber: parseInt(fields[1]) || 0,
      materialType: fields[2] || '',
      description: fields[3] || '',
      price: this.parseDecimal(fields[4]),
      taxable: fields[5]?.toUpperCase() === 'Y',
    };
  }

  /**
   * Parse totals record (TOT)
   * Format: TOT|type|sub_type|amount|taxable_amount|tax_amount
   */
  private parseTotalsRecord(fields: string[], record: any): any {
    return {
      ...record,
      totalType: fields[1] || '',
      totalSubType: fields[2] || '',
      amount: this.parseDecimal(fields[3]),
      taxableAmount: this.parseDecimal(fields[4]),
      taxAmount: this.parseDecimal(fields[5]),
    };
  }

  /**
   * Parse generic record for unknown types
   */
  private parseGenericRecord(fields: string[], record: any): any {
    fields.forEach((field, index) => {
      record[`field_${index}`] = field;
    });
    return record;
  }

  /**
   * Extract job identities from EMS sections
   */
  private extractIdentities(sections: Map<string, any[]>): {
    ro_number: string;
    claim_number: string;
    vin: string;
  } {
    const estimateRecords = sections.get('EST') || [];
    const claimRecords = sections.get('CLM') || [];
    const vehicleRecords = sections.get('VEH') || [];

    return {
      ro_number: estimateRecords[0]?.estimateNumber || '',
      claim_number: claimRecords[0]?.claimNumber || '',
      vin: vehicleRecords[0]?.vin || '',
    };
  }

  /**
   * Extract customer data from EMS sections
   */
  private extractCustomerData(
    sections: Map<string, any[]>
  ): CustomerData & { gst_payable: boolean } {
    const customerRecords = sections.get('CST') || [];
    const customer = customerRecords[0];

    if (!customer) {
      return {
        type: 'person',
        firstName: 'Unknown',
        lastName: 'Customer',
        gst_payable: false,
      };
    }

    const isCompany = !!customer.companyName;

    return {
      type: isCompany ? 'organization' : 'person',
      firstName: customer.firstName || (isCompany ? 'Business' : 'Unknown'),
      lastName:
        customer.lastName || (isCompany ? customer.companyName : 'Customer'),
      companyName: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
        ? {
            address1: customer.address,
            city: customer.city,
            stateProvince: customer.state,
            postalCode: customer.zipCode,
          }
        : undefined,
      gst_payable: customer.gstPayable || isCompany,
    };
  }

  /**
   * Extract vehicle data from EMS sections
   */
  private extractVehicleData(sections: Map<string, any[]>): VehicleData {
    const vehicleRecords = sections.get('VEH') || [];
    const vehicle = vehicleRecords[0];

    if (!vehicle) {
      return {
        vin: '',
        year: 2020,
        make: 'Unknown',
        model: 'Unknown',
      };
    }

    return {
      vin: vehicle.vin || '',
      year: vehicle.year || 2020,
      make: vehicle.make || 'Unknown',
      model: vehicle.model || 'Unknown',
      subModel: vehicle.trim,
      bodyStyle: vehicle.bodyStyle,
      exteriorColor: vehicle.exteriorColor,
      odometer: vehicle.odometer,
      odometerUnit: 'miles',
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      license: {
        plateNumber: vehicle.licensePlate,
      },
    };
  }

  /**
   * Extract estimate lines from EMS sections
   */
  private extractEstimateLines(sections: Map<string, any[]>): EstimateLine[] {
    const lineRecords = sections.get('LIN') || [];
    const partRecords = sections.get('PRT') || [];
    const laborRecords = sections.get('LAB') || [];
    const materialRecords = sections.get('MTL') || [];

    // Create a map for quick lookups
    const partsByLine = new Map<number, any>();
    const laborByLine = new Map<number, any>();
    const materialsByLine = new Map<number, any>();

    partRecords.forEach(part => partsByLine.set(part.lineNumber, part));
    laborRecords.forEach(labor => laborByLine.set(labor.lineNumber, labor));
    materialRecords.forEach(material =>
      materialsByLine.set(material.lineNumber, material)
    );

    return lineRecords.map(line => {
      const partInfo = partsByLine.get(line.lineNumber);
      const laborInfo = laborByLine.get(line.lineNumber);
      const materialInfo = materialsByLine.get(line.lineNumber);

      const amount = line.amount || new Decimal(0);

      return {
        lineNum: line.lineNumber,
        uniqueSequenceNum: line.lineNumber.toString(),
        parentLineNum: line.parentLine,
        lineDesc: line.description || 'EMS Line Item',
        lineType: line.lineType || 'repair',
        partInfo: partInfo
          ? {
              partNumber: partInfo.partNumber,
              oemPartNumber: partInfo.oemPartNumber,
              description: partInfo.description,
              price: partInfo.price,
              quantity: partInfo.quantity,
              partType: partInfo.partType,
              sourceCode: partInfo.sourceCode,
              taxable: partInfo.taxable,
            }
          : undefined,
        laborInfo: laborInfo
          ? {
              laborType: laborInfo.laborType,
              operation: laborInfo.operation,
              hours: laborInfo.hours,
              rate: laborInfo.rate,
              taxable: laborInfo.taxable,
              paintStages: laborInfo.paintStages,
            }
          : undefined,
        otherChargesInfo: materialInfo
          ? {
              type: materialInfo.materialType,
              price: materialInfo.price,
              taxable: materialInfo.taxable,
            }
          : undefined,
        taxable:
          line.taxable ||
          partInfo?.taxable ||
          laborInfo?.taxable ||
          materialInfo?.taxable ||
          false,
        amount,
      };
    });
  }

  /**
   * Extract parts data from estimate lines
   */
  private extractPartsData(lines: EstimateLine[]): PartData[] {
    return lines
      .filter(line => line.partInfo)
      .map(line => ({
        partNumber: line.partInfo!.partNumber,
        oemPartNumber: line.partInfo!.oemPartNumber,
        description: line.partInfo!.description,
        price: line.partInfo!.price,
        quantity: line.partInfo!.quantity,
        supplier: line.partInfo!.sourceCode,
        partType: line.partInfo!.partType,
        lineNumber: line.lineNum,
      }));
  }

  /**
   * Detect source system from EMS sections
   */
  private detectSourceSystem(sections: Map<string, any[]>): string {
    const headerRecords = sections.get('HDR') || [];
    const header = headerRecords[0];

    if (!header) return 'EMS Unknown';

    const vendor = header.vendor?.toLowerCase() || '';
    const system = header.system?.toLowerCase() || '';

    if (vendor.includes('mitchell') || system.includes('mitchell'))
      return 'Mitchell EMS';
    if (vendor.includes('ccc') || system.includes('ccc')) return 'CCC ONE EMS';
    if (vendor.includes('audatex') || system.includes('audatex'))
      return 'Audatex EMS';
    if (vendor.includes('qapter') || system.includes('qapter'))
      return 'Qapter EMS';

    return `EMS ${header.vendor || 'Unknown'}`;
  }

  /**
   * Parse EMS date format (YYYYMMDD or YYYY-MM-DD)
   */
  private parseEMSDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    // Handle YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      const year = parseInt(dateStr.substr(0, 4));
      const month = parseInt(dateStr.substr(4, 2));
      const day = parseInt(dateStr.substr(6, 2));

      // Validate date components
      if (
        year < 1900 ||
        year > 2100 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return undefined;
      }

      const date = new Date(year, month - 1, day); // Month is 0-indexed

      // Check if the date is valid (handles leap years, month lengths, etc.)
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return undefined;
      }

      return date;
    }

    // Handle YYYY-MM-DD format
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * Parse EMS datetime from separate date and time strings
   */
  private parseEMSDateTime(dateStr: string, timeStr: string): Date | undefined {
    const date = this.parseEMSDate(dateStr);
    if (!date || !timeStr) return date;

    // Handle HHMMSS format
    if (/^\d{6}$/.test(timeStr)) {
      const hours = parseInt(timeStr.substr(0, 2));
      const minutes = parseInt(timeStr.substr(2, 2));
      const seconds = parseInt(timeStr.substr(4, 2));

      date.setHours(hours, minutes, seconds);
    }

    return date;
  }

  /**
   * Parse decimal values safely
   */
  private parseDecimal(value: string): Decimal {
    if (!value) return new Decimal(0);

    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);

    return new Decimal(isNaN(parsed) ? 0 : parsed);
  }

  /**
   * Get unknown fields encountered during parsing
   */
  getUnknownFields(): string[] {
    return Array.from(this.unknownFields);
  }
}

export { EMSParser };
export default new EMSParser();
