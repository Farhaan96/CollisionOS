const { XMLParser } = require('fast-xml-parser');
const Decimal = require('decimal.js');
const { AutomatedPartsSourcingService } = require('../automatedPartsSourcing');

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
      let estimateType = 'unknown';
      
      if (parsed.VehicleDamageEstimateAddRq) {
        root = parsed.VehicleDamageEstimateAddRq;
        estimateType = 'mitchell_bms';
        console.log('Detected Mitchell BMS format (VehicleDamageEstimateAddRq)');
      } else if (parsed.BMS_ESTIMATE) {
        root = parsed.BMS_ESTIMATE;
        estimateType = 'generic_bms';
        console.log('Detected generic BMS format');
      } else if (parsed.Estimate) {
        root = parsed.Estimate;
        estimateType = 'simple_estimate';
        console.log('Detected simple estimate format (Estimate with capital E)');
      } else if (parsed.estimate) {
        root = parsed.estimate;
        estimateType = 'simple_estimate';
        console.log('Detected simple estimate format');
      } else if (parsed.estimateData) {
        root = parsed.estimateData;
        estimateType = 'estimate_data';
        console.log('Detected estimate data format');
      } else if (parsed.estimateInfo) {
        root = parsed.estimateInfo;
        estimateType = 'estimate_info';
        console.log('Detected estimate info format');
      }

      if (!root) {
        console.error('No valid estimate root found. Available keys:', Object.keys(parsed));
        throw new Error('No valid estimate root found in BMS file');
      }

      // Log Mitchell-specific info
      if (estimateType === 'mitchell_bms') {
        if (root.DocumentInfo?.VendorCode) {
          console.log('Vendor Code:', root.DocumentInfo.VendorCode);
        }
        if (root.ApplicationInfo) {
          const appInfo = Array.isArray(root.ApplicationInfo) ? root.ApplicationInfo[0] : root.ApplicationInfo;
          console.log('Estimating System:', appInfo?.ApplicationName, appInfo?.ApplicationVer);
        }
      }

      // Extract all data
      const vehicle = this.extractVehicleInfo(root);
      const estimate = this.extractEstimateInfo(root);

      // If shop RO number found in vehicle memo, add it to estimate
      if (vehicle.shopRoNumber && !estimate.shopRoNumber) {
        estimate.shopRoNumber = vehicle.shopRoNumber;
      }

      const result = {
        customer: this.extractCustomerInfo(root),
        vehicle: vehicle,
        estimate: estimate,
        adjuster: this.extractAdjusterInfo(root),
        parts: this.extractPartsInfo(root),
        labor: this.extractLaborInfo(root),
        financial: this.extractFinancialInfo(root),
        taxDetails: this.extractTaxDetails(root),
        specialRequirements: this.extractSpecialRequirements(root),
        metadata: this.extractMetadata(root, estimateType),
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
    const customer = {
      phones: {
        home: '',
        work: '',
        cell: '',
      },
      addresses: {
        home: '',
        work: '',
        mailing: ''
      },
      emails: {
        primary: '',
        secondary: ''
      }
    };
    const isMitchell = this.isMitchellFormat(root);

    // Log format detection for debugging
    if (isMitchell) {
      console.log('Mitchell BMS format detected - prioritizing Owner section for customer data');
    }

    // Handle simple test format: <estimate><customer>...</customer></estimate> (with case variations)
    const customerInfo = root.Customer || root.customer;
    if (customerInfo) {
      customer.firstName = this.getTextValue(customerInfo.FirstName || customerInfo.firstName);
      customer.lastName = this.getTextValue(customerInfo.LastName || customerInfo.lastName);
      customer.name =
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      customer.phone = this.getTextValue(customerInfo.Phone || customerInfo.phone);
      customer.email = this.getTextValue(customerInfo.Email || customerInfo.email);

      // Handle nested Address object or flat address fields
      const addressInfo = customerInfo.Address || customerInfo.address;
      if (addressInfo && typeof addressInfo === 'object') {
        customer.address = this.getTextValue(addressInfo.Street || addressInfo.street);
        customer.city = this.getTextValue(addressInfo.City || addressInfo.city);
        customer.state = this.getTextValue(addressInfo.State || addressInfo.state);
        customer.zip = this.getTextValue(addressInfo.Zip || addressInfo.zip);
      } else {
        customer.address = this.getTextValue(customerInfo.address);
        customer.city = this.getTextValue(customerInfo.city);
        customer.state = this.getTextValue(customerInfo.state);
        customer.zip = this.getTextValue(customerInfo.zip);
      }
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

    // Handle Insurance section (simple test format)
    if (root.Insurance) {
      customer.insurance = customer.insurance || this.getTextValue(root.Insurance.Company);
      customer.claimNumber = customer.claimNumber || this.getTextValue(root.Insurance.ClaimNumber);
      customer.policyNumber = customer.policyNumber || this.getTextValue(root.Insurance.PolicyNumber);
    }

    // Handle BMS format with Owner (Primary extraction - Mitchell stores customer in Owner)
    if (root.AdminInfo && root.AdminInfo.Owner) {
      const owner = root.AdminInfo.Owner.Party;
      if (owner.PersonInfo && owner.PersonInfo.PersonName) {
        const personName = owner.PersonInfo.PersonName;
        customer.firstName = this.getTextValue(personName.FirstName);
        customer.lastName = this.getTextValue(personName.LastName);
        customer.name = `${customer.firstName} ${customer.lastName}`.trim();
      }

      if (owner.ContactInfo && owner.ContactInfo.Communications) {
        const communications = Array.isArray(
          owner.ContactInfo.Communications
        )
          ? owner.ContactInfo.Communications
          : [owner.ContactInfo.Communications];

        communications.forEach(comm => {
          // Mitchell uses specific qualifiers for different phone types
          if (comm.CommPhone) {
            const phoneNumber = this.formatPhoneNumber(comm.CommPhone);
            switch (comm.CommQualifier) {
              case 'HP': // Home Phone
                customer.phones.home = phoneNumber;
                break;
              case 'WP': // Work Phone
                customer.phones.work = phoneNumber;
                break;
              case 'CP': // Cell Phone
              case 'MP': // Mobile Phone
                customer.phones.cell = phoneNumber;
                break;
              default:
                // Fallback: if no primary phone set, use first found
                if (!customer.phone) {
                  customer.phone = phoneNumber;
                }
            }
            // Also set primary phone if not already set
            if (!customer.phone && phoneNumber) {
              customer.phone = phoneNumber;
            }
          } else if (comm.CommQualifier === 'EM' && comm.CommEmail) {
            customer.email = this.getTextValue(comm.CommEmail);
          }
        });
      }

      // Handle address from PersonInfo Communications (enhanced breakdown)
      if (owner.PersonInfo && owner.PersonInfo.Communications && owner.PersonInfo.Communications.Address) {
        const address = owner.PersonInfo.Communications.Address;
        customer.address1 = this.getTextValue(address.Address1);
        customer.address2 = this.getTextValue(address.Address2);
        customer.address = customer.address1 + (customer.address2 ? ' ' + customer.address2 : '');
        customer.city = this.getTextValue(address.City);
        customer.state = this.getTextValue(address.StateProvince);
        customer.province = this.getTextValue(address.StateProvince); // Alias for Canadian addresses
        customer.zip = this.getTextValue(address.PostalCode);
        customer.postalCode = this.getTextValue(address.PostalCode); // Alias
        customer.country = this.getTextValue(address.Country);
      }
    }

    // Handle BMS format with PolicyHolder (fallback when Owner doesn't contain customer info)
    if (!customer.name && root.AdminInfo && root.AdminInfo.PolicyHolder) {
      const policyHolder = root.AdminInfo.PolicyHolder.Party;
      if (policyHolder.PersonInfo && policyHolder.PersonInfo.PersonName) {
        const personName = policyHolder.PersonInfo.PersonName;
        customer.firstName = this.getTextValue(personName.FirstName);
        customer.lastName = this.getTextValue(personName.LastName);
        customer.name = `${customer.firstName} ${customer.lastName}`.trim();
      }

      if (policyHolder.ContactInfo && policyHolder.ContactInfo.Communications) {
        const communications = Array.isArray(
          policyHolder.ContactInfo.Communications
        )
          ? policyHolder.ContactInfo.Communications
          : [policyHolder.ContactInfo.Communications];

        communications.forEach(comm => {
          // Support multiple phone qualifiers for PolicyHolder as well
          if (comm.CommPhone) {
            const phoneNumber = this.formatPhoneNumber(comm.CommPhone);
            switch (comm.CommQualifier) {
              case 'HP': // Home Phone
                if (!customer.phones.home) customer.phones.home = phoneNumber;
                break;
              case 'WP': // Work Phone
                if (!customer.phones.work) customer.phones.work = phoneNumber;
                break;
              case 'CP': // Cell Phone
              case 'MP': // Mobile Phone
                if (!customer.phones.cell) customer.phones.cell = phoneNumber;
                break;
              default:
                // Fallback: if no primary phone set, use first found
                if (!customer.phone) {
                  customer.phone = phoneNumber;
                }
            }
            // Also set primary phone if not already set
            if (!customer.phone && phoneNumber) {
              customer.phone = phoneNumber;
            }
          } else if (comm.CommQualifier === 'EM' && comm.CommEmail) {
            if (!customer.email) customer.email = this.getTextValue(comm.CommEmail);
          }
        });
      }

      if (policyHolder.PersonInfo && policyHolder.PersonInfo.Communications) {
        const address = policyHolder.PersonInfo.Communications.Address;
        if (address) {
          if (!customer.address1) customer.address1 = this.getTextValue(address.Address1);
          if (!customer.address2) customer.address2 = this.getTextValue(address.Address2);
          if (!customer.address) customer.address = customer.address1 + (customer.address2 ? ' ' + customer.address2 : '');
          if (!customer.city) customer.city = this.getTextValue(address.City);
          if (!customer.state) customer.state = this.getTextValue(address.StateProvince);
          if (!customer.province) customer.province = this.getTextValue(address.StateProvince);
          if (!customer.zip) customer.zip = this.getTextValue(address.PostalCode);
          if (!customer.postalCode) customer.postalCode = this.getTextValue(address.PostalCode);
          if (!customer.country) customer.country = this.getTextValue(address.Country);
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

    // Handle claim number (Mitchell often uses N/A)
    if (root.RefClaimNum) {
      const claimNum = this.getTextValue(root.RefClaimNum);
      customer.claimNumber = claimNum !== 'N/A' ? claimNum : '';
    }
    
    // Also check ClaimInfo.ClaimNum
    if (root.ClaimInfo && root.ClaimInfo.ClaimNum) {
      const claimNum = this.getTextValue(root.ClaimInfo.ClaimNum);
      if (!customer.claimNumber && claimNum !== 'N/A') {
        customer.claimNumber = claimNum;
      }
    }

    return customer;
  }

  extractVehicleInfo(root) {
    const vehicle = {};

    // Handle simple test format: <estimate><vehicle>...</vehicle></estimate> (with case variations)
    const vehicleInfo = root.Vehicle || root.vehicle;
    if (vehicleInfo) {
      vehicle.year = parseInt(this.getTextValue(vehicleInfo.Year || vehicleInfo.year)) || null;
      vehicle.make = this.getTextValue(vehicleInfo.Make || vehicleInfo.make);
      vehicle.model = this.getTextValue(vehicleInfo.Model || vehicleInfo.model);
      vehicle.trim = this.getTextValue(vehicleInfo.Trim || vehicleInfo.trim);
      vehicle.vin = this.getTextValue(vehicleInfo.VIN || vehicleInfo.vin);
      vehicle.license = this.getTextValue(vehicleInfo.LicensePlate || vehicleInfo.license);
      vehicle.licensePlate = vehicle.license; // Alias
      vehicle.color = this.getTextValue(vehicleInfo.Color || vehicleInfo.color);
      vehicle.exteriorColor = vehicle.color; // Alias
      vehicle.engine = this.getTextValue(vehicleInfo.EngineType || vehicleInfo.engine);
      vehicle.engineCode = this.getTextValue(vehicleInfo.engineCode);
      vehicle.engineSize = this.getTextValue(vehicleInfo.EngineType || vehicleInfo.engine);
      vehicle.transmission = this.getTextValue(vehicleInfo.Transmission || vehicleInfo.transmission);
      vehicle.transmissionCode = this.getTextValue(vehicleInfo.transmissionCode);
      vehicle.drivetrain = this.getTextValue(vehicleInfo.drivetrain);
      vehicle.fuelType = this.getTextValue(vehicleInfo.fuelType);
      vehicle.valuation = this.getNumericValue(vehicleInfo.valuation);
      vehicle.drivable = this.getBooleanValue(vehicleInfo.drivable);
      vehicle.mileage = parseInt(this.getTextValue(vehicleInfo.Mileage || vehicleInfo.mileage)) || null;
      vehicle.currentOdometer = vehicle.mileage; // Alias

      // Additional fields from test XML
      vehicle.paintCode = this.getTextValue(vehicleInfo.paintCode);
      vehicle.hasADASFeatures = this.getBooleanValue(vehicleInfo.hasADASFeatures);
      vehicle.requiresCalibration = this.getBooleanValue(vehicleInfo.requiresCalibration);
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

        // Extract RO number from VehicleDescMemo (shop's local RO number)
        if (desc.VehicleDescMemo) {
          const memo = this.getTextValue(desc.VehicleDescMemo);
          // Look for pattern like "RO: 12345" or "RO:12345"
          const roMatch = memo.match(/RO\s*:\s*(\d+)/i);
          if (roMatch) {
            vehicle.shopRoNumber = roMatch[1];
            console.log('Extracted shop RO number from VehicleDescMemo:', vehicle.shopRoNumber);
          }
        }
      }

      // Powertrain (Enhanced with codes and additional details)
      if (vehicleData.Powertrain) {
        vehicle.engine = this.getTextValue(vehicleData.Powertrain.EngineDesc);
        vehicle.engineCode = this.getTextValue(vehicleData.Powertrain.EngineCode);
        vehicle.drivetrain = this.getTextValue(vehicleData.Powertrain.DrivetrainDesc);
        vehicle.fuelType = this.getTextValue(vehicleData.Powertrain.FuelType);

        if (vehicleData.Powertrain.TransmissionInfo) {
          vehicle.transmission = this.getTextValue(
            vehicleData.Powertrain.TransmissionInfo.TransmissionDesc
          );
          vehicle.transmissionCode = this.getTextValue(
            vehicleData.Powertrain.TransmissionInfo.TransmissionCode
          );
        }
      }

      // Valuation
      if (vehicleData.ValuationInfo) {
        vehicle.valuation = this.getDecimalValue(vehicleData.ValuationInfo.ValuationAmt);
      }

      // Drivable indicator
      if (vehicleData.DrivableInd !== undefined) {
        vehicle.drivable = this.getBooleanValue(vehicleData.DrivableInd);
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

    // Handle simple test format with <EstimateInfo> (case variations)
    const estimateInfo = root.EstimateInfo || root.estimateInfo;
    if (estimateInfo) {
      estimate.estimateNumber = this.getTextValue(estimateInfo.EstimateNumber || estimateInfo.estimateNumber);
      estimate.claimNumber = this.getTextValue(estimateInfo.ClaimNumber || estimateInfo.claimNumber);
      estimate.date = this.getTextValue(estimateInfo.EstimateDate || estimateInfo.estimateDate);
      estimate.accidentDate = this.getTextValue(estimateInfo.AccidentDate || estimateInfo.accidentDate);
      estimate.type = this.getTextValue(estimateInfo.EstimateType || estimateInfo.estimateType);
      estimate.status = this.getTextValue(estimateInfo.Status || estimateInfo.status);
    }

    // Handle BMS format
    if (root.DocumentInfo) {
      estimate.estimateNumber = estimate.estimateNumber || this.getTextValue(root.DocumentInfo.DocumentID);
      estimate.date = estimate.date || this.getTextValue(root.DocumentInfo.CreateDateTime);
      estimate.status = estimate.status || this.getTextValue(root.DocumentInfo.DocumentStatus);
      estimate.type = estimate.type || this.getTextValue(root.DocumentInfo.DocumentType);
      estimate.bmsVersion = this.getTextValue(root.DocumentInfo.BMSVer);
      estimate.vendorCode = this.getTextValue(root.DocumentInfo.VendorCode);

      // Handle currency info (Mitchell supports CAD and USD)
      if (root.DocumentInfo.CurrencyInfo) {
        estimate.currency = this.getTextValue(root.DocumentInfo.CurrencyInfo.CurCode);
      }
    }

    // Extract RO number with multiple fallback paths (as in Airtable script)
    estimate.roNumber = this.getTextValue(root.RqUID) ||
                       this.getTextValue(root.RepairOrderNum) ||
                       this.getTextValue(root.DocumentInfo?.RepairOrderNum) ||
                       '';

    // Extract claim number with multiple fallback paths (if not already set)
    estimate.claimNumber = estimate.claimNumber ||
                          this.getTextValue(root.RefClaimNum) ||
                          this.getTextValue(root.ClaimInfo?.ClaimNum) ||
                          this.getTextValue(root.ClaimNumber) ||
                          '';
    if (estimate.claimNumber === 'N/A') estimate.claimNumber = '';

    // Extract policy number with multiple fallback paths
    estimate.policyNumber = this.getTextValue(root.ClaimInfo?.PolicyInfo?.PolicyNum) ||
                           this.getTextValue(root.PolicyNumber) ||
                           this.getTextValue(root.PolicyNum) ||
                           this.getTextValue(root.Insurance?.PolicyNumber) ||
                           '';

    // Handle Mitchell application info
    if (root.ApplicationInfo) {
      const appInfo = Array.isArray(root.ApplicationInfo) ? root.ApplicationInfo : [root.ApplicationInfo];
      appInfo.forEach(app => {
        if (app.ApplicationType === 'Estimating') {
          estimate.estimatingSystem = this.getTextValue(app.ApplicationName);
          estimate.systemVersion = this.getTextValue(app.ApplicationVer);
          estimate.databaseVersion = this.getTextValue(app.DatabaseVer);
        }
      });
    }

    // Handle repair facility info
    if (root.AdminInfo && root.AdminInfo.RepairFacility) {
      const facility = root.AdminInfo.RepairFacility.Party;
      if (facility.OrgInfo) {
        estimate.repairFacilityName = this.getTextValue(facility.OrgInfo.CompanyName);

        // Extract facility contact info
        if (facility.OrgInfo.Communications) {
          const comms = Array.isArray(facility.OrgInfo.Communications)
            ? facility.OrgInfo.Communications
            : [facility.OrgInfo.Communications];

          comms.forEach(comm => {
            if (comm.Address) {
              estimate.repairFacilityAddress = this.getTextValue(comm.Address.Address1);
              estimate.repairFacilityCity = this.getTextValue(comm.Address.City);
              estimate.repairFacilityState = this.getTextValue(comm.Address.StateProvince);
              estimate.repairFacilityZip = this.getTextValue(comm.Address.PostalCode);
            }
          });
        }

        // Extract facility contact from ContactInfo
        if (facility.ContactInfo && facility.ContactInfo.Communications) {
          const comms = Array.isArray(facility.ContactInfo.Communications)
            ? facility.ContactInfo.Communications
            : [facility.ContactInfo.Communications];

          comms.forEach(comm => {
            if (comm.CommQualifier === 'WP' && comm.CommPhone) {
              estimate.repairFacilityPhone = this.formatPhoneNumber(comm.CommPhone);
            } else if (comm.CommQualifier === 'FX' && comm.CommPhone) {
              estimate.repairFacilityFax = this.formatPhoneNumber(comm.CommPhone);
            } else if (comm.CommQualifier === 'EM' && comm.CommEmail) {
              estimate.repairFacilityEmail = this.getTextValue(comm.CommEmail);
            }
          });
        }
      }
    }

    // Handle estimator info
    if (root.AdminInfo && root.AdminInfo.Estimator) {
      const estimator = root.AdminInfo.Estimator.Party;
      if (estimator.PersonInfo && estimator.PersonInfo.PersonName) {
        const personName = estimator.PersonInfo.PersonName;
        estimate.estimatorFirstName = this.getTextValue(personName.FirstName);
        estimate.estimatorLastName = this.getTextValue(personName.LastName);
        estimate.estimatorName = `${estimate.estimatorFirstName} ${estimate.estimatorLastName}`.trim();
      }

      // Extract estimator contact info
      if (estimator.ContactInfo && estimator.ContactInfo.Communications) {
        const comms = Array.isArray(estimator.ContactInfo.Communications)
          ? estimator.ContactInfo.Communications
          : [estimator.ContactInfo.Communications];

        comms.forEach(comm => {
          if (comm.CommQualifier === 'EM' && comm.CommEmail) {
            estimate.estimatorEmail = this.getTextValue(comm.CommEmail);
          } else if (comm.CommPhone) {
            estimate.estimatorPhone = this.formatPhoneNumber(comm.CommPhone);
          }
        });
      }
    }

    return estimate;
  }

  extractAdjusterInfo(root) {
    const adjuster = {};

    // Handle simple test format with <Insurance><Adjuster>
    if (root.Insurance && root.Insurance.Adjuster) {
      const adjusterInfo = root.Insurance.Adjuster;
      adjuster.name = this.getTextValue(adjusterInfo.Name || adjusterInfo.name);
      adjuster.phone = this.formatPhoneNumber(adjusterInfo.Phone || adjusterInfo.phone);
      adjuster.email = this.getTextValue(adjusterInfo.Email || adjusterInfo.email);
      adjuster.company = this.getTextValue(root.Insurance.Company);
    }

    // Extract from AdminInfo.Adjuster
    if (root.AdminInfo && root.AdminInfo.Adjuster) {
      const adjusterData = root.AdminInfo.Adjuster.Party;

      // Adjuster name
      if (adjusterData.PersonInfo && adjusterData.PersonInfo.PersonName) {
        const personName = adjusterData.PersonInfo.PersonName;
        adjuster.firstName = this.getTextValue(personName.FirstName);
        adjuster.lastName = this.getTextValue(personName.LastName);
        adjuster.name = `${adjuster.firstName} ${adjuster.lastName}`.trim();
      }

      // Adjuster contact info
      if (adjusterData.ContactInfo && adjusterData.ContactInfo.Communications) {
        const communications = Array.isArray(adjusterData.ContactInfo.Communications)
          ? adjusterData.ContactInfo.Communications
          : [adjusterData.ContactInfo.Communications];

        communications.forEach(comm => {
          if ((comm.CommQualifier === 'CP' || comm.CommQualifier === 'WP') && comm.CommPhone) {
            adjuster.phone = this.formatPhoneNumber(comm.CommPhone);
          } else if (comm.CommQualifier === 'EM' && comm.CommEmail) {
            adjuster.email = this.getTextValue(comm.CommEmail);
          }
        });
      }
    }

    return adjuster;
  }

  extractTaxDetails(root) {
    const taxDetails = {
      gstRate: 0,
      pstRate: 0,
      gstAmount: 0,
      pstAmount: 0,
    };

    // Extract from RepairTotalsInfo.Adjustments
    if (root.RepairTotalsInfo && root.RepairTotalsInfo.Adjustments) {
      const adjustments = Array.isArray(root.RepairTotalsInfo.Adjustments)
        ? root.RepairTotalsInfo.Adjustments
        : [root.RepairTotalsInfo.Adjustments];

      adjustments.forEach(adjustment => {
        const adjustmentType = this.getTextValue(adjustment.AdjustmentType);
        const adjustmentDesc = this.getTextValue(adjustment.AdjustmentDesc);
        const adjustmentAmt = this.getDecimalValue(adjustment.AdjustmentAmt);
        const adjustmentRate = this.getDecimalValue(adjustment.AdjustmentRate);

        // GST/Federal Tax
        if (adjustmentType === 'Tax' && (adjustmentDesc.includes('GST') || adjustmentDesc.includes('Federal'))) {
          taxDetails.gstAmount = adjustmentAmt;
          taxDetails.gstRate = adjustmentRate;
        }

        // PST/Provincial Tax
        if (adjustmentType === 'Tax' && (adjustmentDesc.includes('PST') || adjustmentDesc.includes('Provincial'))) {
          taxDetails.pstAmount = adjustmentAmt;
          taxDetails.pstRate = adjustmentRate;
        }
      });
    }

    return taxDetails;
  }

  extractSpecialRequirements(root) {
    const requirements = {
      adasCalibration: false,
      postScan: false,
      fourWheelAlignment: false,
    };

    // Check DamageLineInfo for special operations
    if (root.DamageLineInfo) {
      const damageLines = Array.isArray(root.DamageLineInfo)
        ? root.DamageLineInfo
        : [root.DamageLineInfo];

      damageLines.forEach(line => {
        const lineDesc = this.getTextValue(line.LineDesc).toLowerCase();

        if (lineDesc.includes('adas') || lineDesc.includes('calibration')) {
          requirements.adasCalibration = true;
        }
        if (lineDesc.includes('scan') || lineDesc.includes('diagnostic')) {
          requirements.postScan = true;
        }
        if (lineDesc.includes('alignment') || lineDesc.includes('4 wheel align')) {
          requirements.fourWheelAlignment = true;
        }
      });
    }

    // Also check for special flags if present
    if (root.SpecialRequirements) {
      requirements.adasCalibration = this.getBooleanValue(root.SpecialRequirements.ADASCalibration) || requirements.adasCalibration;
      requirements.postScan = this.getBooleanValue(root.SpecialRequirements.PostScan) || requirements.postScan;
      requirements.fourWheelAlignment = this.getBooleanValue(root.SpecialRequirements.FourWheelAlignment) || requirements.fourWheelAlignment;
    }

    return requirements;
  }

  extractPartsInfo(root) {
    const parts = [];

    // Handle simple test format with <LineItems>
    if (root.LineItems && root.LineItems.LineItem) {
      const lineItems = Array.isArray(root.LineItems.LineItem)
        ? root.LineItems.LineItem
        : [root.LineItems.LineItem];

      lineItems.forEach((line, index) => {
        const lineType = this.getTextValue(line.Type || line.type);

        // Only process Part and Material types (not Labor)
        if (lineType === 'Part' || lineType === 'Material') {
          parts.push({
            lineNumber: parseInt(this.getTextValue(line.LineNumber || line.lineNumber)) || index + 1,
            partName: this.getTextValue(line.Description || line.description),
            description: this.getTextValue(line.Description || line.description),
            partNumber: this.getTextValue(line.PartNumber || line.partNumber),
            operation: this.getTextValue(line.Operation || line.operation),
            partType: lineType,
            quantity: parseFloat(this.getTextValue(line.Quantity || line.quantity)) || 1,
            unitPrice: parseFloat(this.getTextValue(line.UnitPrice || line.unitPrice)) || 0,
            partCost: parseFloat(this.getTextValue(line.PartsAmount || line.partsAmount)) || 0,
            laborHours: parseFloat(this.getTextValue(line.LaborHours || line.laborHours)) || 0,
            laborRate: parseFloat(this.getTextValue(line.LaborRate || line.laborRate)) || 0,
            laborAmount: parseFloat(this.getTextValue(line.LaborAmount || line.laborAmount)) || 0,
          });
        }
      });
    }

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

    // Handle BMS format with DamageLineInfo (Mitchell format)
    if (root.DamageLineInfo) {
      const damageLines = Array.isArray(root.DamageLineInfo)
        ? root.DamageLineInfo
        : [root.DamageLineInfo];

      damageLines.forEach((line, index) => {
        // Mitchell stores parts in PartInfo, materials in MaterialType or OtherChargesInfo
        // Extract BOTH parts and materials/other charges as line items

        if (line.PartInfo) {
          // Part line item
          const partInfo = line.PartInfo;
          const part = {
            lineNumber: this.getNumericValue(line.LineNum),
            partNumber: this.getTextValue(partInfo.PartNum),
            oemPartNumber: this.getTextValue(partInfo.OEMPartNum),
            description: this.getTextValue(line.LineDesc),
            quantity: this.getNumericValue(partInfo.Quantity) || 1,
            price: this.getDecimalValue(partInfo.PartPrice),
            oemPrice: this.getDecimalValue(partInfo.OEMPartPrice),
            partType: this.getTextValue(partInfo.PartType),
            sourceCode: this.getTextValue(partInfo.PartSourceCode),
            taxable: this.getBooleanValue(partInfo.TaxableInd),
          };

          // Also extract labor info if present on the same line (Mitchell combines parts and labor)
          if (line.LaborInfo) {
            const laborInfo = line.LaborInfo;
            part.laborType = this.getTextValue(laborInfo.LaborType);
            part.laborOperation = this.getTextValue(laborInfo.LaborOperation);
            part.laborHours = this.getDecimalValue(laborInfo.LaborHours);
            part.databaseLaborHours = this.getDecimalValue(laborInfo.DatabaseLaborHours);
          }

          parts.push(part);
        } else if (line.MaterialType || line.OtherChargesInfo) {
          // Material/Other charges line item (e.g., Shop Materials, Paint Materials, etc.)
          const otherCharges = line.OtherChargesInfo;
          const materialType = this.getTextValue(line.MaterialType);

          const material = {
            lineNumber: this.getNumericValue(line.LineNum),
            partNumber: materialType || 'Material',
            description: this.getTextValue(line.LineDesc),
            quantity: 1,
            price: otherCharges ? this.getDecimalValue(otherCharges.Price) : 0,
            partType: materialType || 'MATERIAL',
            sourceCode: '99', // Material/other charges
            taxable: otherCharges ? this.getBooleanValue(otherCharges.TaxableInd) : true,
            isMaterial: true, // Flag to distinguish from parts
          };

          parts.push(material);
        }
      });
    }

    return parts;
  }

  extractLaborInfo(root) {
    const labor = {
      lines: [],
      summary: {
        bodyHours: 0,
        refinishHours: 0,
        mechanicalHours: 0,
        fpbHours: 0, // Frame/Paint/Body
        totalHours: 0,
      }
    };

    // Handle BMS format with DamageLineInfo
    if (root.DamageLineInfo) {
      const damageLines = Array.isArray(root.DamageLineInfo)
        ? root.DamageLineInfo
        : [root.DamageLineInfo];

      damageLines.forEach((line, index) => {
        // Mitchell stores labor in LaborInfo, sometimes combined with parts
        // Extract standalone labor lines (no PartInfo) or labor-only lines
        if (line.LaborInfo) {
          const laborInfo = line.LaborInfo;
          const laborType = this.getTextValue(laborInfo.LaborType);
          const hours = this.getDecimalValue(laborInfo.LaborHours);

          const laborLine = {
            lineNumber: this.getNumericValue(line.LineNum),
            operation: this.getTextValue(line.LineDesc),
            laborType: laborType,
            laborOperation: this.getTextValue(laborInfo.LaborOperation),
            hours: hours,
            databaseHours: this.getDecimalValue(laborInfo.DatabaseLaborHours),
            calculatedHours: this.getDecimalValue(laborInfo.LaborHoursCalc),
            taxable: this.getBooleanValue(laborInfo.TaxableInd),
          };

          // Only add to lines array if it's a standalone labor line (not combined with parts)
          if (!line.PartInfo) {
            labor.lines.push(laborLine);
          }

          // Categorize labor hours for summary
          const laborTypeUpper = laborType.toUpperCase();
          if (laborTypeUpper.includes('BODY') || laborTypeUpper.includes('STRUCTURAL')) {
            labor.summary.bodyHours += parseFloat(hours) || 0;
          } else if (laborTypeUpper.includes('REFINISH') || laborTypeUpper.includes('PAINT')) {
            labor.summary.refinishHours += parseFloat(hours) || 0;
          } else if (laborTypeUpper.includes('MECHANICAL') || laborTypeUpper.includes('MECH')) {
            labor.summary.mechanicalHours += parseFloat(hours) || 0;
          } else if (laborTypeUpper.includes('FPB') || laborTypeUpper.includes('FRAME')) {
            labor.summary.fpbHours += parseFloat(hours) || 0;
          }

          labor.summary.totalHours += parseFloat(hours) || 0;
        }
      });
    }

    // Also extract from RepairTotalsInfo.LaborTotalsInfo if available
    if (root.RepairTotalsInfo && root.RepairTotalsInfo.LaborTotalsInfo) {
      const laborTotals = root.RepairTotalsInfo.LaborTotalsInfo;

      // If totals exist but we haven't calculated from lines, use these
      if (labor.summary.totalHours === 0 && laborTotals.TotalHours) {
        labor.summary.totalHours = this.getDecimalValue(laborTotals.TotalHours);
      }
    }

    return labor;
  }

  extractFinancialInfo(root) {
    const financial = {};

    // Handle simple test format with <Totals>
    if (root.Totals || root.totals) {
      const totals = root.Totals || root.totals;
      financial.partsTotal = parseFloat(this.getTextValue(totals.PartsTotal || totals.partsTotal)) || 0;
      financial.laborTotal = parseFloat(this.getTextValue(totals.LaborTotal || totals.laborTotal)) || 0;
      financial.materialsTotal = parseFloat(this.getTextValue(totals.MaterialsTotal || totals.materialsTotal)) || 0;
      financial.subletTotal = parseFloat(this.getTextValue(totals.SubletTotal || totals.subletTotal)) || 0;
      financial.subtotal = parseFloat(this.getTextValue(totals.Subtotal || totals.subtotal)) || 0;
      financial.taxTotal = parseFloat(this.getTextValue(totals.Tax || totals.tax)) || 0;
      financial.total = parseFloat(this.getTextValue(totals.GrandTotal || totals.grandTotal)) || 0;
      financial.grandTotal = financial.total; // Alias
    }

    // Handle deductible from Insurance section
    if (root.Insurance && root.Insurance.Deductible) {
      financial.deductible = parseFloat(this.getTextValue(root.Insurance.Deductible)) || 0;
    }

    // Handle our test BMS_ESTIMATE format
    if (root.DAMAGE_ASSESSMENT) {
      const assessment = root.DAMAGE_ASSESSMENT;
      financial.totalEstimate =
        parseFloat(this.getTextValue(assessment.TOTAL_ESTIMATE)) || 0;
      financial.laborTotal = financial.laborTotal ||
        parseFloat(this.getTextValue(assessment.LABOR_TOTAL)) || 0;
      financial.partsTotal = financial.partsTotal ||
        parseFloat(this.getTextValue(assessment.PARTS_TOTAL)) || 0;
      financial.paintMaterialsTotal =
        parseFloat(this.getTextValue(assessment.PAINT_MATERIALS_TOTAL)) || 0;
      financial.taxTotal = financial.taxTotal ||
        parseFloat(this.getTextValue(assessment.TAX_TOTAL)) || 0;

      if (assessment.TOTALS_BREAKDOWN) {
        const breakdown = assessment.TOTALS_BREAKDOWN;
        financial.subtotal = financial.subtotal ||
          parseFloat(this.getTextValue(breakdown.SUBTOTAL)) || 0;
        financial.laborTax =
          parseFloat(this.getTextValue(breakdown.LABOR_TAX)) || 0;
        financial.partsTax =
          parseFloat(this.getTextValue(breakdown.PARTS_TAX)) || 0;
        financial.deductible = financial.deductible ||
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

      // Summary totals - Mitchell uses TotalType="TOT" with TotalSubType to differentiate
      if (totals.SummaryTotalsInfo) {
        const summaryTotals = Array.isArray(totals.SummaryTotalsInfo)
          ? totals.SummaryTotalsInfo
          : [totals.SummaryTotalsInfo];

        summaryTotals.forEach(total => {
          const totalType = this.getTextValue(total.TotalType);
          const totalSubType = this.getTextValue(total.TotalSubType);

          // Mitchell format uses TotalType="TOT" with different subtypes
          if (totalType === 'TOT') {
            if (totalSubType === 'CE') {
              // Gross Total (before adjustments)
              financial.grossTotal = this.getDecimalValue(total.TotalAmt);
            } else if (totalSubType === 'TT') {
              // Net Total (final amount) - This is the main total to use
              financial.total = this.getDecimalValue(total.TotalAmt);
              financial.netTotal = this.getDecimalValue(total.TotalAmt);
            }
          } else if (totalType === 'GrossTotal') {
            financial.grossTotal = this.getDecimalValue(total.TotalAmt);
          } else if (totalType === 'NetTotal') {
            financial.netTotal = this.getDecimalValue(total.TotalAmt);
            // Use NetTotal as main total if not already set
            if (!financial.total) {
              financial.total = this.getDecimalValue(total.TotalAmt);
            }
          }
        });
      }
    }

    // Handle deductible from ClaimInfo (enhanced with waived detection)
    if (
      root.ClaimInfo &&
      root.ClaimInfo.PolicyInfo &&
      root.ClaimInfo.PolicyInfo.CoverageInfo
    ) {
      const coverage = root.ClaimInfo.PolicyInfo.CoverageInfo.Coverage;
      if (coverage && coverage.DeductibleInfo) {
        const deductibleAmt = this.getDecimalValue(coverage.DeductibleInfo.DeductibleAmt);
        const deductibleStatus = this.getTextValue(coverage.DeductibleInfo.DeductibleStatus);

        financial.deductible = deductibleAmt;
        financial.deductibleStatus = deductibleStatus;

        // Check if deductible is waived
        financial.deductibleWaived = deductibleStatus.toLowerCase().includes('waived') ||
                                     deductibleStatus.toLowerCase().includes('waive') ||
                                     (deductibleAmt == 0 && deductibleStatus.toLowerCase().includes('no deductible'));
      }
    }

    // Also check for deductible in summary totals adjustments
    if (root.RepairTotalsInfo && root.RepairTotalsInfo.Adjustments) {
      const adjustments = Array.isArray(root.RepairTotalsInfo.Adjustments)
        ? root.RepairTotalsInfo.Adjustments
        : [root.RepairTotalsInfo.Adjustments];

      adjustments.forEach(adjustment => {
        const adjustmentDesc = this.getTextValue(adjustment.AdjustmentDesc);
        if (adjustmentDesc.toLowerCase().includes('deductible')) {
          const deductibleAmt = this.getDecimalValue(adjustment.AdjustmentAmt);
          if (!financial.deductible) {
            financial.deductible = Math.abs(deductibleAmt); // Deductible is usually negative in adjustments
          }
        }
      });
    }

    return financial;
  }

  extractMetadata(root, estimateType = 'unknown') {
    const metadata = {};

    metadata.parserVersion = '4.0-comprehensive-airtable-parity';
    metadata.parseDate = new Date().toISOString();
    metadata.sourceFormat = 'BMS XML';
    metadata.estimateType = estimateType;
    metadata.unknownTags = Array.from(this.unknownTags);

    // Document comprehensive extraction capabilities
    metadata.extractedSections = [
      'customer (with phone breakdown)',
      'vehicle (with powertrain details)',
      'estimate (with multiple fallbacks)',
      'adjuster',
      'parts',
      'labor (with type breakdown)',
      'financial (with deductible details)',
      'taxDetails (GST/PST)',
      'specialRequirements (ADAS/scan/alignment)'
    ];

    // Add Mitchell-specific metadata
    if (estimateType === 'mitchell_bms') {
      metadata.isMitchell = true;
      if (root.DocumentInfo) {
        metadata.bmsVersion = this.getTextValue(root.DocumentInfo.BMSVer);
        metadata.vendorCode = this.getTextValue(root.DocumentInfo.VendorCode);
        metadata.documentStatus = this.getTextValue(root.DocumentInfo.DocumentStatus);
      }
      if (root.ApplicationInfo) {
        const appInfo = Array.isArray(root.ApplicationInfo) ? root.ApplicationInfo[0] : root.ApplicationInfo;
        if (appInfo.ApplicationType === 'Estimating') {
          metadata.estimatingSystem = this.getTextValue(appInfo.ApplicationName);
          metadata.systemVersion = this.getTextValue(appInfo.ApplicationVer);
        }
      }
    } else {
      metadata.isMitchell = false;
    }

    return metadata;
  }

  // Helper methods
  isMitchellFormat(root) {
    // Detect Mitchell format by checking VendorCode in DocumentInfo
    return root.DocumentInfo && root.DocumentInfo.VendorCode === 'M';
  }

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

  formatPhoneNumber(phoneValue) {
    if (!phoneValue) return '';
    const phone = this.getTextValue(phoneValue);
    
    // Remove common international prefixes and formatting
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Remove leading +1 if present
    if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // Format as (XXX) XXX-XXXX if 10 digits
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.substring(0, 3)}) ${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`;
    }
    
    // Return original if not standard format
    return phone;
  }
}

module.exports = EnhancedBMSParser;
