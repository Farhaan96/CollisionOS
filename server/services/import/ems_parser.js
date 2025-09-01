const Decimal = require('decimal.js');

/**
 * EMS (Estimating Management System) Parser
 * Handles pipe-delimited text format used by CCC and Mitchell
 */
class EMSParser {
  constructor() {
    this.lineHandlers = {
      HD: this.parseHeaderLine.bind(this),
      VH: this.parseVehicleLine.bind(this),
      CO: this.parseCustomerLine.bind(this),
      IN: this.parseInsuranceLine.bind(this),
      CL: this.parseClaimLine.bind(this),
      LI: this.parseLineItem.bind(this),
      PA: this.parsePartsLine.bind(this),
      LA: this.parseLaborLine.bind(this),
      TO: this.parseTotalsLine.bind(this),
      TX: this.parseTaxLine.bind(this),
      DE: this.parseDeductibleLine.bind(this),
      NO: this.parseNotesLine.bind(this),
    };
  }

  async parseEMS(emsContent) {
    try {
      console.log('Starting EMS parsing...');

      const lines = emsContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);

      const result = {
        customer: {},
        vehicle: {},
        estimate: {},
        insurance: {},
        claim: {},
        parts: [],
        labor: [],
        financial: {
          parts: new Decimal(0),
          labor: new Decimal(0),
          materials: new Decimal(0),
          tax: new Decimal(0),
          deductible: new Decimal(0),
          total: new Decimal(0),
        },
        lineItems: [],
        notes: [],
        metadata: {
          parserVersion: '1.0.0',
          parseDate: new Date().toISOString(),
          sourceFormat: 'EMS',
          totalLines: lines.length,
        },
      };

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fields = this.parseEMSLine(line);

        if (fields.length === 0) continue;

        const recordType = fields[0].toUpperCase();
        const handler = this.lineHandlers[recordType];

        if (handler) {
          await handler(fields, result);
        } else {
          console.warn(`Unknown EMS record type: ${recordType}`);
        }
      }

      // Convert Decimal objects to numbers for JSON serialization
      this.convertDecimalsToNumbers(result);

      console.log('EMS parsing completed successfully');
      return result;
    } catch (error) {
      console.error('Error parsing EMS file:', error);
      throw new Error(`EMS parsing failed: ${error.message}`);
    }
  }

  parseEMSLine(line) {
    // Split by pipe character but handle escaped pipes
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

    // Add the last field
    if (current) {
      fields.push(current.trim());
    }

    return fields;
  }

  parseHeaderLine(fields, result) {
    // HD|SHOP NAME|SHOP ADDRESS|CITY|STATE|ZIP|PHONE|EMAIL
    if (fields.length >= 2) {
      result.estimate.shopName = fields[1];
      if (fields.length >= 3) result.estimate.shopAddress = fields[2];
      if (fields.length >= 4) result.estimate.shopCity = fields[3];
      if (fields.length >= 5) result.estimate.shopState = fields[4];
      if (fields.length >= 6) result.estimate.shopZip = fields[5];
      if (fields.length >= 7) result.estimate.shopPhone = fields[6];
      if (fields.length >= 8) result.estimate.shopEmail = fields[7];
    }
  }

  parseVehicleLine(fields, result) {
    // VH|YEAR|MAKE|MODEL|VIN|LICENSE|MILEAGE|COLOR
    if (fields.length >= 2) {
      result.vehicle.year = parseInt(fields[1]) || null;
      if (fields.length >= 3) result.vehicle.make = fields[2];
      if (fields.length >= 4) result.vehicle.model = fields[3];
      if (fields.length >= 5) result.vehicle.vin = fields[4];
      if (fields.length >= 6) result.vehicle.license = fields[5];
      if (fields.length >= 7)
        result.vehicle.mileage = parseInt(fields[6]) || null;
      if (fields.length >= 8) result.vehicle.color = fields[7];
    }
  }

  parseCustomerLine(fields, result) {
    // CO|FIRST NAME|LAST NAME|PHONE|ADDRESS|CITY|STATE|ZIP|EMAIL
    if (fields.length >= 2) {
      const firstName = fields[1] || '';
      const lastName = fields.length >= 3 ? fields[2] : '';
      result.customer.name = `${firstName} ${lastName}`.trim();
      result.customer.firstName = firstName;
      result.customer.lastName = lastName;

      if (fields.length >= 4) result.customer.phone = fields[3];
      if (fields.length >= 5) result.customer.address = fields[4];
      if (fields.length >= 6) result.customer.city = fields[5];
      if (fields.length >= 7) result.customer.state = fields[6];
      if (fields.length >= 8) result.customer.zip = fields[7];
      if (fields.length >= 9) result.customer.email = fields[8];
    }
  }

  parseInsuranceLine(fields, result) {
    // IN|INSURANCE COMPANY|POLICY NUMBER|AGENT NAME|AGENT PHONE
    if (fields.length >= 2) {
      result.insurance.company = fields[1];
      if (fields.length >= 3) result.insurance.policyNumber = fields[2];
      if (fields.length >= 4) result.insurance.agentName = fields[3];
      if (fields.length >= 5) result.insurance.agentPhone = fields[4];
    }
  }

  parseClaimLine(fields, result) {
    // CL|CLAIM NUMBER|LOSS DATE|DEDUCTIBLE|ADJUSTER NAME|ADJUSTER PHONE
    if (fields.length >= 2) {
      result.claim.claimNumber = fields[1];
      if (fields.length >= 3) result.claim.lossDate = fields[2];
      if (fields.length >= 4)
        result.claim.deductible = this.parseDecimal(fields[3]);
      if (fields.length >= 5) result.claim.adjusterName = fields[4];
      if (fields.length >= 6) result.claim.adjusterPhone = fields[5];
    }
  }

  parseLineItem(fields, result) {
    // LI|TYPE|DESCRIPTION|QUANTITY|PRICE|EXTENDED|LINE_NUMBER|PART_NUMBER
    if (fields.length >= 3) {
      const lineItem = {
        type: fields[1] || 'PART',
        description: fields[2] || '',
        quantity: parseFloat(fields[3]) || 1,
        price: this.parseDecimal(fields[4] || '0'),
        extended: this.parseDecimal(fields[5] || '0'),
        lineNumber: parseInt(fields[6]) || result.lineItems.length + 1,
        partNumber: fields[7] || null,
      };

      result.lineItems.push(lineItem);

      // Categorize by type
      const type = lineItem.type.toUpperCase();
      if (type.includes('PART') || type.includes('MATERIAL')) {
        result.parts.push(lineItem);
      } else if (type.includes('LABOR')) {
        result.labor.push(lineItem);
      }
    }
  }

  parsePartsLine(fields, result) {
    // PA|PART_NUMBER|DESCRIPTION|QUANTITY|PRICE|OEM_PRICE|TYPE|SOURCE
    if (fields.length >= 3) {
      const part = {
        partNumber: fields[1] || '',
        description: fields[2] || '',
        quantity: parseFloat(fields[3]) || 1,
        price: this.parseDecimal(fields[4] || '0'),
        oemPrice: this.parseDecimal(fields[5] || '0'),
        partType: fields[6] || 'NEW',
        source: fields[7] || 'OEM',
      };

      result.parts.push(part);
    }
  }

  parseLaborLine(fields, result) {
    // LA|OPERATION|DESCRIPTION|HOURS|RATE|EXTENDED|TYPE
    if (fields.length >= 3) {
      const labor = {
        operation: fields[1] || '',
        description: fields[2] || '',
        hours: parseFloat(fields[3]) || 0,
        rate: this.parseDecimal(fields[4] || '0'),
        extended: this.parseDecimal(fields[5] || '0'),
        laborType: fields[6] || 'BODY',
      };

      result.labor.push(labor);
    }
  }

  parseTotalsLine(fields, result) {
    // TO|PARTS|PARTS_TOTAL|LABOR|LABOR_TOTAL|TAX|TAX_TOTAL|TOTAL
    if (fields.length >= 2) {
      let index = 1;

      // Parse totals in pairs (label, amount)
      while (index < fields.length - 1) {
        const label = fields[index].toLowerCase();
        const amount = this.parseDecimal(fields[index + 1]);

        switch (label) {
          case 'parts':
            result.financial.parts = amount;
            break;
          case 'labor':
            result.financial.labor = amount;
            break;
          case 'materials':
            result.financial.materials = amount;
            break;
          case 'tax':
            result.financial.tax = amount;
            break;
          case 'total':
            result.financial.total = amount;
            break;
        }

        index += 2;
      }
    }
  }

  parseTaxLine(fields, result) {
    // TX|TAX_TYPE|TAX_RATE|TAX_AMOUNT
    if (fields.length >= 4) {
      result.financial.tax = result.financial.tax.add(
        this.parseDecimal(fields[3])
      );
    }
  }

  parseDeductibleLine(fields, result) {
    // DE|DEDUCTIBLE_AMOUNT|DEDUCTIBLE_TYPE
    if (fields.length >= 2) {
      result.financial.deductible = this.parseDecimal(fields[1]);
      if (fields.length >= 3) {
        result.claim.deductibleType = fields[2];
      }
    }
  }

  parseNotesLine(fields, result) {
    // NO|NOTE_TEXT
    if (fields.length >= 2) {
      result.notes.push(fields[1]);
    }
  }

  parseDecimal(value) {
    try {
      if (!value || value === '') return new Decimal(0);
      return new Decimal(value.toString().replace(/[^\d.-]/g, '') || '0');
    } catch (error) {
      return new Decimal(0);
    }
  }

  convertDecimalsToNumbers(obj) {
    if (obj && typeof obj === 'object') {
      if (obj instanceof Decimal) {
        return parseFloat(obj.toString());
      }

      if (Array.isArray(obj)) {
        return obj.map(item => this.convertDecimalsToNumbers(item));
      }

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.convertDecimalsToNumbers(value);
      }
      return result;
    }

    return obj;
  }
}

module.exports = EMSParser;
