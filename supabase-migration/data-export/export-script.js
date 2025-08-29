/**
 * CollisionOS Data Export Script
 * Exports existing data from Sequelize database to Supabase-compatible format
 */

const fs = require('fs');
const path = require('path');
const { sequelize, Shop, User, Customer, Vehicle, Part, Vendor, Job } = require('../../server/database/models');

class DataExporter {
  constructor() {
    this.exportDir = path.join(__dirname, 'exported-data');
    this.logFile = path.join(this.exportDir, 'export-log.txt');
    
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(this.logFile, logMessage);
  }

  async exportTable(model, tableName, transformFn = null) {
    try {
      this.log(`Starting export for ${tableName}...`);
      
      const records = await model.findAll({
        raw: true,
        nest: false
      });
      
      this.log(`Found ${records.length} records in ${tableName}`);
      
      // Apply transformation if provided
      const transformedRecords = transformFn ? records.map(transformFn) : records;
      
      // Write to JSON file
      const jsonFile = path.join(this.exportDir, `${tableName}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(transformedRecords, null, 2));
      
      // Generate SQL insert statements
      const sqlFile = path.join(this.exportDir, `${tableName}.sql`);
      const sqlStatements = this.generateInsertStatements(tableName, transformedRecords);
      fs.writeFileSync(sqlFile, sqlStatements);
      
      this.log(`Exported ${transformedRecords.length} records to ${tableName}.json and ${tableName}.sql`);
      
      return {
        table: tableName,
        count: transformedRecords.length,
        records: transformedRecords
      };
    } catch (error) {
      this.log(`Error exporting ${tableName}: ${error.message}`);
      throw error;
    }
  }

  generateInsertStatements(tableName, records) {
    if (records.length === 0) return `-- No data to insert for ${tableName}\n`;
    
    let sql = `-- Insert statements for ${tableName}\n\n`;
    
    // Get column names from first record
    const columns = Object.keys(records[0]);
    const columnList = columns.join(', ');
    
    // Generate insert statements in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      sql += `INSERT INTO ${tableName} (${columnList}) VALUES\n`;
      
      const valueRows = batch.map(record => {
        const values = columns.map(col => {
          const value = record[col];
          
          if (value === null || value === undefined) {
            return 'NULL';
          } else if (typeof value === 'string') {
            // Escape single quotes and wrap in quotes
            return `'${value.replace(/'/g, "''")}'`;
          } else if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
          } else if (value instanceof Date) {
            return `'${value.toISOString()}'`;
          } else if (typeof value === 'object') {
            // JSON fields
            return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
          } else {
            return value;
          }
        });
        
        return `  (${values.join(', ')})`;
      });
      
      sql += valueRows.join(',\n') + ';\n\n';
    }
    
    return sql;
  }

  // Transform functions for each table to handle Supabase differences
  transformShop(record) {
    return {
      id: record.id,
      name: record.name,
      business_name: record.businessName,
      email: record.email,
      phone: record.phone,
      fax: record.fax,
      website: record.website,
      address: record.address,
      city: record.city,
      state: record.state,
      postal_code: record.postalCode,
      country: record.country,
      timezone: record.timezone,
      currency: record.currency,
      tax_number: record.taxNumber,
      gst_number: record.gstNumber,
      pst_number: record.pstNumber,
      hst_number: record.hstNumber,
      logo: record.logo,
      settings: record.settings,
      subscription: record.subscription,
      license_key: record.licenseKey,
      is_active: record.isActive,
      is_trial: record.isTrial,
      trial_expires_at: record.trialExpiresAt,
      last_backup: record.lastBackup,
      setup_completed: record.setupCompleted,
      onboarding_step: record.onboardingStep,
      notes: record.notes,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformUser(record) {
    return {
      user_id: record.id, // This will need special handling for Supabase auth
      shop_id: record.shopId,
      username: record.username,
      first_name: record.firstName,
      last_name: record.lastName,
      role: record.role,
      permissions: record.permissions,
      phone: record.phone,
      mobile: record.mobile,
      employee_id: record.employeeId,
      hire_date: record.hireDate,
      termination_date: record.terminationDate,
      hourly_rate: record.hourlyRate,
      commission_rate: record.commissionRate,
      is_active: record.isActive,
      is_online: record.isOnline,
      last_login: record.lastLogin,
      last_activity: record.lastActivity,
      timezone: record.timezone,
      language: record.language,
      avatar: record.avatar,
      signature: record.signature,
      notes: record.notes,
      preferences: record.preferences,
      two_factor_enabled: record.twoFactorEnabled,
      emergency_contact: record.emergencyContact,
      certifications: record.certifications,
      skills: record.skills,
      availability: record.availability,
      max_jobs: record.maxJobs,
      current_jobs: record.currentJobs,
      efficiency: record.efficiency,
      quality_score: record.qualityScore,
      customer_satisfaction: record.customerSatisfaction,
      total_hours: record.totalHours,
      overtime_hours: record.overtimeHours,
      vacation_days: record.vacationDays,
      sick_days: record.sickDays,
      personal_days: record.personalDays,
      clock_in_time: record.clockInTime,
      clock_out_time: record.clockOutTime,
      is_clocked_in: record.isClockedIn,
      current_location: record.currentLocation,
      department: record.department,
      supervisor_id: record.supervisorId,
      created_by: record.createdBy,
      updated_by: record.updatedBy,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformCustomer(record) {
    return {
      id: record.id,
      shop_id: record.shopId,
      customer_number: record.customerNumber,
      first_name: record.firstName,
      last_name: record.lastName,
      email: record.email,
      phone: record.phone,
      mobile: record.mobile,
      address: record.address,
      city: record.city,
      state: record.state,
      zip_code: record.zipCode,
      country: record.country,
      date_of_birth: record.dateOfBirth,
      driver_license: record.driverLicense,
      preferred_contact: record.preferredContact,
      sms_opt_in: record.smsOptIn,
      email_opt_in: record.emailOptIn,
      marketing_opt_in: record.marketingOptIn,
      customer_type: record.customerType,
      customer_status: record.customerStatus,
      company_name: record.companyName,
      tax_id: record.taxId,
      credit_limit: record.creditLimit,
      payment_terms: record.paymentTerms,
      loyalty_points: record.loyaltyPoints,
      referral_source: record.referralSource,
      notes: record.notes,
      first_visit_date: record.firstVisitDate,
      last_visit_date: record.lastVisitDate,
      is_active: record.isActive,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformVehicle(record) {
    return {
      id: record.id,
      customer_id: record.customerId,
      shop_id: record.shopId,
      vin: record.vin,
      license_plate: record.licensePlate,
      state: record.state,
      year: record.year,
      make: record.make,
      model: record.model,
      trim: record.trim,
      body_style: record.bodyStyle,
      color: record.color,
      color_code: record.colorCode,
      engine_size: record.engineSize,
      engine_type: record.engineType,
      transmission: record.transmission,
      fuel_type: record.fuelType,
      mileage: record.mileage,
      mileage_unit: record.mileageUnit,
      insurance_company: record.insuranceCompany,
      policy_number: record.policyNumber,
      claim_number: record.claimNumber,
      deductible: record.deductible,
      vehicle_status: record.vehicleStatus,
      last_service_date: record.lastServiceDate,
      next_service_date: record.nextServiceDate,
      service_interval: record.serviceInterval,
      warranty_expiry: record.warrantyExpiry,
      warranty_type: record.warrantyType,
      features: record.features,
      notes: record.notes,
      is_active: record.isActive,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformPart(record) {
    return {
      id: record.id,
      shop_id: record.shopId,
      part_number: record.partNumber,
      oem_part_number: record.oemPartNumber,
      description: record.description,
      category: record.category,
      subcategory: record.subcategory,
      part_type: record.partType,
      make: record.make,
      model: record.model,
      year_from: record.yearFrom,
      year_to: record.yearTo,
      weight: record.weight,
      dimensions: record.dimensions,
      color: record.color,
      current_stock: record.currentStock,
      minimum_stock: record.minimumStock,
      maximum_stock: record.maximumStock,
      reorder_point: record.reorderPoint,
      reorder_quantity: record.reorderQuantity,
      location: record.location,
      bin_number: record.binNumber,
      shelf_number: record.shelfNumber,
      cost_price: record.costPrice,
      selling_price: record.sellingPrice,
      markup_percentage: record.markupPercentage,
      primary_vendor_id: record.primaryVendorId,
      vendor_part_number: record.vendorPartNumber,
      warranty_period: record.warrantyPeriod,
      warranty_type: record.warrantyType,
      is_core: record.isCore,
      core_value: record.coreValue,
      core_return_required: record.coreReturnRequired,
      part_status: record.partStatus,
      is_active: record.isActive,
      last_order_date: record.lastOrderDate,
      last_received_date: record.lastReceivedDate,
      last_sold_date: record.lastSoldDate,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformVendor(record) {
    return {
      id: record.id,
      shop_id: record.shopId,
      vendor_number: record.vendorNumber,
      name: record.name,
      contact_person: record.contactPerson,
      email: record.email,
      phone: record.phone,
      fax: record.fax,
      website: record.website,
      address: record.address,
      city: record.city,
      state: record.state,
      zip_code: record.zipCode,
      country: record.country,
      vendor_type: record.vendorType,
      vendor_status: record.vendorStatus,
      tax_id: record.taxId,
      business_license: record.businessLicense,
      payment_terms: record.paymentTerms,
      credit_limit: record.creditLimit,
      current_balance: record.currentBalance,
      average_delivery_time: record.averageDeliveryTime,
      fill_rate: record.fillRate,
      return_rate: record.returnRate,
      quality_rating: record.qualityRating,
      api_endpoint: record.apiEndpoint,
      api_key: record.apiKey,
      integration_type: record.integrationType,
      specializations: record.specializations,
      notes: record.notes,
      preferences: record.preferences,
      is_active: record.isActive,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  transformJob(record) {
    return {
      id: record.id,
      shop_id: record.shopId,
      job_number: record.jobNumber,
      customer_id: record.customerId,
      vehicle_id: record.vehicleId,
      assigned_to: record.assignedTo,
      bay_id: record.bayId,
      status: record.status,
      priority: record.priority,
      job_type: record.jobType,
      insurance_id: record.insuranceId,
      claim_id: record.claimId,
      claim_number: record.claimNumber,
      deductible: record.deductible,
      customer_pay: record.customerPay,
      insurance_pay: record.insurancePay,
      total_amount: record.totalAmount,
      labor_amount: record.laborAmount,
      parts_amount: record.partsAmount,
      materials_amount: record.materialsAmount,
      sublet_amount: record.subletAmount,
      tax_amount: record.taxAmount,
      profit_margin: record.profitMargin,
      estimated_hours: record.estimatedHours,
      actual_hours: record.actualHours,
      efficiency: record.efficiency,
      cycle_time: record.cycleTime,
      target_delivery_date: record.targetDeliveryDate,
      actual_delivery_date: record.actualDeliveryDate,
      start_date: record.startDate,
      completion_date: record.completionDate,
      check_in_date: record.checkInDate,
      check_out_date: record.checkOutDate,
      damage_description: record.damageDescription,
      repair_description: record.repairDescription,
      notes: record.notes,
      internal_notes: record.internalNotes,
      customer_notes: record.customerNotes,
      is_drp: record.isDRP,
      drp_program: record.drpProgram,
      is_warranty: record.isWarranty,
      warranty_type: record.warrantyType,
      is_rush: record.isRush,
      is_express: record.isExpress,
      is_vip: record.isVIP,
      is_insurance: record.isInsurance,
      is_customer_pay: record.isCustomerPay,
      is_cash: record.isCash,
      is_financed: record.isFinanced,
      payment_method: record.paymentMethod,
      payment_status: record.paymentStatus,
      invoice_status: record.invoiceStatus,
      estimate_status: record.estimateStatus,
      parts_status: record.partsStatus,
      quality_status: record.qualityStatus,
      calibration_status: record.calibrationStatus,
      supplement_count: record.supplementCount,
      supplement_amount: record.supplementAmount,
      last_supplement_date: record.lastSupplementDate,
      photos_required: record.photosRequired,
      photos_taken: record.photosTaken,
      photos_count: record.photosCount,
      documents_required: record.documentsRequired,
      documents_received: record.documentsReceived,
      documents_count: record.documentsCount,
      authorization_received: record.authorizationReceived,
      authorization_date: record.authorizationDate,
      authorization_method: record.authorizationMethod,
      authorization_by: record.authorizationBy,
      rental_required: record.rentalRequired,
      rental_provided: record.rentalProvided,
      rental_start_date: record.rentalStartDate,
      rental_end_date: record.rentalEndDate,
      rental_cost: record.rentalCost,
      tow_required: record.towRequired,
      tow_provided: record.towProvided,
      tow_cost: record.towCost,
      sublet_required: record.subletRequired,
      sublet_count: record.subletCount,
      sublet_total: record.subletTotal,
      customer_satisfaction: record.customerSatisfaction,
      customer_feedback: record.customerFeedback,
      come_back: record.comeBack,
      come_back_reason: record.comeBackReason,
      come_back_date: record.comeBackDate,
      warranty_claim: record.warrantyClaim,
      warranty_claim_date: record.warrantyClaimDate,
      warranty_claim_reason: record.warrantyClaimReason,
      tags: record.tags,
      custom_fields: record.customFields,
      workflow: record.workflow,
      timeline: record.timeline,
      history: record.history,
      metadata: record.metadata,
      is_archived: record.isArchived,
      archived_date: record.archivedDate,
      archived_by: record.archivedBy,
      created_by: record.createdBy,
      updated_by: record.updatedBy,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  async exportAllData() {
    try {
      this.log('Starting complete data export...');
      this.log(`Export directory: ${this.exportDir}`);
      
      // Test database connection
      await sequelize.authenticate();
      this.log('Database connection successful');
      
      const results = {};
      
      // Export each table with its transform function
      results.shops = await this.exportTable(Shop, 'shops', this.transformShop.bind(this));
      results.users = await this.exportTable(User, 'users', this.transformUser.bind(this));
      results.customers = await this.exportTable(Customer, 'customers', this.transformCustomer.bind(this));
      results.vehicles = await this.exportTable(Vehicle, 'vehicles', this.transformVehicle.bind(this));
      results.parts = await this.exportTable(Part, 'parts', this.transformPart.bind(this));
      results.vendors = await this.exportTable(Vendor, 'vendors', this.transformVendor.bind(this));
      results.jobs = await this.exportTable(Job, 'jobs', this.transformJob.bind(this));
      
      // Generate summary
      const summary = {
        exportDate: new Date().toISOString(),
        totalTables: Object.keys(results).length,
        totalRecords: Object.values(results).reduce((sum, table) => sum + table.count, 0),
        tableDetails: Object.entries(results).map(([name, data]) => ({
          table: name,
          records: data.count
        }))
      };
      
      // Write summary file
      fs.writeFileSync(
        path.join(this.exportDir, 'export-summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      // Generate complete SQL file
      this.generateCompleteSQL(results);
      
      this.log('Export completed successfully!');
      this.log(`Summary: Exported ${summary.totalRecords} records from ${summary.totalTables} tables`);
      
      return summary;
      
    } catch (error) {
      this.log(`Export failed: ${error.message}`);
      throw error;
    } finally {
      await sequelize.close();
    }
  }

  generateCompleteSQL(results) {
    const sqlFile = path.join(this.exportDir, 'complete-import.sql');
    
    let sql = `-- CollisionOS Data Import Script for Supabase
-- Generated on ${new Date().toISOString()}
-- 
-- IMPORTANT: Run this script AFTER the schema has been created
-- 

-- Disable triggers during import
SET session_replication_role = replica;

-- Disable RLS during import
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

`;

    // Add each table's SQL in dependency order
    const tableOrder = ['shops', 'users', 'customers', 'vehicles', 'vendors', 'parts', 'jobs'];
    
    for (const tableName of tableOrder) {
      if (results[tableName] && results[tableName].count > 0) {
        sql += `\n-- ===============================================\n`;
        sql += `-- ${tableName.toUpperCase()} DATA\n`;
        sql += `-- ===============================================\n\n`;
        
        const tableSQL = fs.readFileSync(path.join(this.exportDir, `${tableName}.sql`), 'utf8');
        sql += tableSQL + '\n';
      }
    }

    sql += `\n-- Re-enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Refresh sequences (adjust if needed)
SELECT setval(pg_get_serial_sequence('shops', 'id'), COALESCE(MAX(id), 1)) FROM shops;

-- Update statistics
ANALYZE;
`;
    
    fs.writeFileSync(sqlFile, sql);
    this.log(`Complete SQL import script written to: ${sqlFile}`);
  }
}

// Run the export if this file is executed directly
if (require.main === module) {
  const exporter = new DataExporter();
  
  exporter.exportAllData()
    .then(summary => {
      console.log('\n✅ Export completed successfully!');
      console.log('📊 Summary:', summary);
    })
    .catch(error => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

module.exports = DataExporter;