#!/usr/bin/env node
/**
 * CollisionOS Collision Repair Sample Data Creator
 *
 * Creates SQL files with realistic collision repair data for Supabase deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🌱 Creating CollisionOS Collision Repair Sample Data...\n');

// Generate seed SQL file
function createSeedSQL() {
    const seedSQL = `-- ==============================================================
-- CollisionOS Sample Collision Repair Data
-- Generated: ${new Date().toISOString().split('T')[0]}
-- Description: Sample data for collision repair workflow testing
-- ==============================================================

-- Begin transaction
BEGIN;

-- Sample shops data
INSERT INTO public.shops (id, name, business_name, email, phone, address, city, state, postal_code, country, timezone, currency)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Precision Auto Body', 'Precision Auto Body & Collision Repair Inc.', 'info@precisionautobody.com', '(555) 123-4567', '123 Industrial Blvd', 'Toronto', 'Ontario', 'M1B 2C3', 'Canada', 'America/Toronto', 'CAD')
ON CONFLICT (id) DO NOTHING;

-- Sample users data
INSERT INTO public.users (id, shop_id, email, password, first_name, last_name, role, is_active)
VALUES
    ('440e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'admin@precisionautobody.com', '$2b$10$dummy.hash.for.demo', 'John', 'Smith', 'owner', true),
    ('440e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'estimator@precisionautobody.com', '$2b$10$dummy.hash.for.demo', 'Sarah', 'Johnson', 'estimator', true)
ON CONFLICT (id) DO NOTHING;

-- Sample insurance companies
INSERT INTO public.insurance_companies (id, shop_id, name, short_name, contact_person, email, phone, is_drp, drp_program_name, labor_rate, paint_rate, payment_terms, is_active)
VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'State Farm Insurance', 'State Farm', 'John Davis', 'claims@statefarm.com', '(800) 555-0199', true, 'Select Service Program', 65.00, 70.00, 'net_30', true),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Intact Insurance', 'Intact', 'Sarah Wilson', 'auto.claims@intact.com', '(800) 555-0188', false, NULL, 68.00, 72.00, 'net_15', true),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Aviva Canada', 'Aviva', 'Mike Thompson', 'claims@avivacanada.com', '(800) 555-0177', true, 'Preferred Partner Network', 67.00, 71.00, 'net_30', true)
ON CONFLICT (id) DO NOTHING;

-- Sample customers
INSERT INTO public.customers (id, shop_id, type, first_name, last_name, email, phone, status)
VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'individual', 'Emily', 'Johnson', 'emily.johnson@email.com', '(416) 555-0123', 'active'),
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'individual', 'Michael', 'Chen', 'mchen@email.com', '(647) 555-0456', 'active'),
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'business', 'David', 'Lee', 'fleet@torontodelivery.com', '(416) 555-0789', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample vehicles
INSERT INTO public.vehicles (id, customer_id, vin, year, make, model, trim, body_style, color, license_plate, odometer, status)
VALUES
    ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '1HGCM82633A123456', 2018, 'Honda', 'Civic', 'LX', 'sedan', 'Silver', 'ABCD123', 75000, 'active'),
    ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '5NPE34AF5KH654321', 2019, 'Hyundai', 'Elantra', 'Preferred', 'sedan', 'Black', 'EFGH456', 45000, 'active'),
    ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '1FTFW1EF8BKC98765', 2020, 'Ford', 'F-150', 'XLT', 'truck', 'White', 'FLEET01', 82000, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample vendors
INSERT INTO public.vendors (id, shop_id, name, vendor_type, contact_person, email, phone, website, account_number, payment_terms, status, is_preferred)
VALUES
    ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'OEM Parts Direct', 'oem', 'James Patterson', 'orders@oempartsdirect.com', '(800) 555-PARTS', 'www.oempartsdirect.com', 'OPD123456', 'net_30', 'active', true),
    ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'LKQ Corporation', 'recycled', 'Maria Rodriguez', 'sales@lkq.com', '(800) 555-LKQ1', 'www.lkq.com', 'LKQ789012', 'net_15', 'active', true),
    ('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Aftermarket Plus', 'aftermarket', 'Kevin Wong', 'info@aftermarketplus.com', '(877) 555-PART', 'www.aftermarketplus.com', 'AMP345678', 'net_30', 'active', false)
ON CONFLICT (id) DO NOTHING;

-- Sample claims
INSERT INTO public.claims (id, shop_id, claim_number, insurance_company_id, customer_id, vehicle_id, incident_date, reported_date, claim_status, insurance_type, policy_number, deductible, adjuster_name, adjuster_email, adjuster_phone, incident_description, initial_estimate_amount)
VALUES
    ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'SF-2024-001234', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '2024-09-15', '2024-09-16', 'open', 'collision', 'SF123456789', 500.00, 'Lisa Martinez', 'lisa.martinez@statefarm.com', '(800) 555-0199', 'Rear-end collision at intersection. Damage to front bumper, hood, and headlight.', 3250.00),
    ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'INT-2024-567890', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '2024-09-20', '2024-09-20', 'open', 'collision', 'INT987654321', 1000.00, 'Robert Kim', 'robert.kim@intact.com', '(800) 555-0188', 'Side impact collision. Damage to passenger side door, quarter panel, and mirror.', 4750.00)
ON CONFLICT (id) DO NOTHING;

-- Sample repair orders
INSERT INTO public.repair_orders (id, shop_id, ro_number, claim_id, customer_id, vehicle_id, status, ro_type, priority, damage_description, repair_procedures, drop_off_date, estimated_completion_date, labor_amount, parts_amount, paint_materials_amount, total_amount, insurance_portion, customer_portion, deductible_amount, created_by)
VALUES
    ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'RO-24-0001', '990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'in_progress', 'collision', 'normal', 'Front end collision damage: Front bumper cover damaged, Hood dented, Right headlight assembly broken, Grille damaged', 'Remove and replace front bumper cover, Repair and refinish hood, Replace right headlight assembly, Replace grille assembly, Paint and blend adjacent panels', '2024-09-17 09:00:00+00', '2024-09-25', 1650.00, 1200.00, 400.00, 3250.00, 2750.00, 500.00, 500.00, '440e8400-e29b-41d4-a716-446655440001'),
    ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'RO-24-0002', '990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', 'estimate', 'collision', 'normal', 'Side impact damage: Right front door damaged, Right rear door damaged, Right quarter panel dented, Right side mirror damaged', 'Repair right front door, Replace right rear door, Repair and refinish quarter panel, Replace side mirror, Paint and blend', '2024-09-21 14:30:00+00', '2024-10-02', 2400.00, 1850.00, 500.00, 4750.00, 3750.00, 1000.00, 1000.00, '440e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Sample BMS imports
INSERT INTO public.bms_imports (id, shop_id, file_name, file_type, file_size, original_file_name, import_date, status, total_records, processed_records, error_records, processing_duration, bms_version, bms_provider, can_rollback, notes, created_by)
VALUES
    ('ee0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'state_farm_estimate_001234.xml', 'BMS', 25680, 'SF_001234_Emily_Johnson_Honda_Civic.xml', '2024-09-16 10:30:00+00', 'success', 1, 1, 0, 3, '5.2', 'State Farm', true, 'Successfully imported State Farm BMS estimate for Honda Civic rear-end collision', '440e8400-e29b-41d4-a716-446655440001'),
    ('ee0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'intact_estimate_567890.xml', 'BMS', 31240, 'INT_567890_Michael_Chen_Hyundai_Elantra.xml', '2024-09-21 08:15:00+00', 'success', 1, 1, 0, 4, '4.1', 'Intact Insurance', true, 'Successfully imported Intact BMS estimate for Hyundai Elantra side impact collision', '440e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Commit transaction
COMMIT;

-- ==============================================================
-- POST-SEED VERIFICATION
-- ==============================================================

-- Verify data was inserted
DO $$
DECLARE
    shop_count INTEGER;
    claim_count INTEGER;
    ro_count INTEGER;
    insurance_count INTEGER;
    customer_count INTEGER;
    vehicle_count INTEGER;
    vendor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shop_count FROM public.shops;
    SELECT COUNT(*) INTO claim_count FROM public.claims;
    SELECT COUNT(*) INTO ro_count FROM public.repair_orders;
    SELECT COUNT(*) INTO insurance_count FROM public.insurance_companies;
    SELECT COUNT(*) INTO customer_count FROM public.customers;
    SELECT COUNT(*) INTO vehicle_count FROM public.vehicles;
    SELECT COUNT(*) INTO vendor_count FROM public.vendors;

    RAISE NOTICE '✅ Sample collision repair data seeded successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Data Summary:';
    RAISE NOTICE '  Shops: %', shop_count;
    RAISE NOTICE '  Insurance Companies: %', insurance_count;
    RAISE NOTICE '  Customers: %', customer_count;
    RAISE NOTICE '  Vehicles: %', vehicle_count;
    RAISE NOTICE '  Vendors: %', vendor_count;
    RAISE NOTICE '  Claims: %', claim_count;
    RAISE NOTICE '  Repair Orders: %', ro_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚗 Collision Repair Scenarios:';
    RAISE NOTICE '  1. Honda Civic - Rear-end collision (State Farm DRP)';
    RAISE NOTICE '     RO: RO-24-0001, Status: in_progress';
    RAISE NOTICE '     Claim: SF-2024-001234, Customer: Emily Johnson';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Hyundai Elantra - Side impact (Intact Insurance)';
    RAISE NOTICE '     RO: RO-24-0002, Status: estimate';
    RAISE NOTICE '     Claim: INT-2024-567890, Customer: Michael Chen';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Test Data Ready For:';
    RAISE NOTICE '  - BMS ingestion workflow testing';
    RAISE NOTICE '  - Claims-to-RO relationship validation';
    RAISE NOTICE '  - Multi-vendor parts sourcing scenarios';
    RAISE NOTICE '  - Insurance company DRP handling';
    RAISE NOTICE '  - Purchase order workflow testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '  1. Test BMS integration with sample XML files';
    RAISE NOTICE '  2. Create parts orders for repair orders';
    RAISE NOTICE '  3. Test collision repair workflow end-to-end';
    RAISE NOTICE '  4. Validate search functionality (RO#, Claim#, VIN, Plate)';
END $$;
`;

    return seedSQL;
}

// Create sample BMS XML files
function createSampleBMSFiles() {
    const bmsDir = path.join(__dirname, '..', 'samples', 'bms-xml');

    // Ensure directory exists
    if (!fs.existsSync(bmsDir)) {
        fs.mkdirSync(bmsDir, { recursive: true });
    }

    // Sample BMS XML for Honda Civic
    const hondaCivicBMS = `<?xml version="1.0" encoding="UTF-8"?>
<Estimate version="5.2" provider="State Farm">
    <Header>
        <ClaimNumber>SF-2024-001234</ClaimNumber>
        <EstimateNumber>EST-001234</EstimateNumber>
        <DateCreated>2024-09-16</DateCreated>
        <Adjuster>
            <Name>Lisa Martinez</Name>
            <Email>lisa.martinez@statefarm.com</Email>
            <Phone>(800) 555-0199</Phone>
        </Adjuster>
    </Header>

    <Customer>
        <FirstName>Emily</FirstName>
        <LastName>Johnson</LastName>
        <Phone>(416) 555-0123</Phone>
        <Email>emily.johnson@email.com</Email>
    </Customer>

    <Vehicle>
        <VIN>1HGCM82633A123456</VIN>
        <Year>2018</Year>
        <Make>Honda</Make>
        <Model>Civic</Model>
        <Trim>LX</Trim>
        <BodyStyle>Sedan</BodyStyle>
        <Color>Silver</Color>
        <LicensePlate>ABCD123</LicensePlate>
        <Odometer>75000</Odometer>
    </Vehicle>

    <DamageAssessment>
        <IncidentDate>2024-09-15</IncidentDate>
        <Description>Rear-end collision at intersection. Damage to front bumper, hood, and headlight.</Description>
        <AreaOfImpact>Front</AreaOfImpact>
    </DamageAssessment>

    <Parts>
        <Part>
            <Operation>Replace</Operation>
            <Description>Front Bumper Cover</Description>
            <OEMNumber>04711-52370</OEMNumber>
            <Quantity>1</Quantity>
            <LaborHours>2.5</LaborHours>
            <PaintHours>4.0</PaintHours>
        </Part>
        <Part>
            <Operation>Replace</Operation>
            <Description>Right Headlight Assembly</Description>
            <OEMNumber>33151-SNA-A01</OEMNumber>
            <Quantity>1</Quantity>
            <LaborHours>0.8</LaborHours>
        </Part>
        <Part>
            <Operation>Replace</Operation>
            <Description>Front Grille Assembly</Description>
            <OEMNumber>75101-SNA-A01</OEMNumber>
            <Quantity>1</Quantity>
            <LaborHours>0.5</LaborHours>
            <PaintHours>1.0</PaintHours>
        </Part>
        <Part>
            <Operation>Repair</Operation>
            <Description>Hood Panel</Description>
            <Quantity>1</Quantity>
            <LaborHours>3.0</LaborHours>
            <PaintHours>5.0</PaintHours>
        </Part>
    </Parts>

    <Totals>
        <Labor>1650.00</Labor>
        <Parts>1200.00</Parts>
        <Paint>400.00</Paint>
        <Total>3250.00</Total>
        <Deductible>500.00</Deductible>
    </Totals>
</Estimate>`;

    // Sample BMS XML for Hyundai Elantra
    const hyundaiElantraBMS = `<?xml version="1.0" encoding="UTF-8"?>
<Estimate version="4.1" provider="Intact Insurance">
    <Header>
        <ClaimNumber>INT-2024-567890</ClaimNumber>
        <EstimateNumber>EST-567890</EstimateNumber>
        <DateCreated>2024-09-21</DateCreated>
        <Adjuster>
            <Name>Robert Kim</Name>
            <Email>robert.kim@intact.com</Email>
            <Phone>(800) 555-0188</Phone>
        </Adjuster>
    </Header>

    <Customer>
        <FirstName>Michael</FirstName>
        <LastName>Chen</LastName>
        <Phone>(647) 555-0456</Phone>
        <Email>mchen@email.com</Email>
    </Customer>

    <Vehicle>
        <VIN>5NPE34AF5KH654321</VIN>
        <Year>2019</Year>
        <Make>Hyundai</Make>
        <Model>Elantra</Model>
        <Trim>Preferred</Trim>
        <BodyStyle>Sedan</BodyStyle>
        <Color>Black</Color>
        <LicensePlate>EFGH456</LicensePlate>
        <Odometer>45000</Odometer>
    </Vehicle>

    <DamageAssessment>
        <IncidentDate>2024-09-20</IncidentDate>
        <Description>Side impact collision. Damage to passenger side door, quarter panel, and mirror.</Description>
        <AreaOfImpact>Right Side</AreaOfImpact>
    </DamageAssessment>

    <Parts>
        <Part>
            <Operation>Repair</Operation>
            <Description>Right Front Door</Description>
            <Quantity>1</Quantity>
            <LaborHours>4.0</LaborHours>
            <PaintHours>3.0</PaintHours>
        </Part>
        <Part>
            <Operation>Replace</Operation>
            <Description>Right Rear Door</Description>
            <OEMNumber>77004-F2000</OEMNumber>
            <Quantity>1</Quantity>
            <LaborHours>2.0</LaborHours>
            <PaintHours>4.0</PaintHours>
            <PartType>Used</PartType>
        </Part>
        <Part>
            <Operation>Repair</Operation>
            <Description>Right Quarter Panel</Description>
            <Quantity>1</Quantity>
            <LaborHours>6.0</LaborHours>
            <PaintHours>5.0</PaintHours>
        </Part>
        <Part>
            <Operation>Replace</Operation>
            <Description>Right Side Mirror Assembly</Description>
            <OEMNumber>87620-F2010</OEMNumber>
            <Quantity>1</Quantity>
            <LaborHours>0.5</LaborHours>
            <PartType>Used</PartType>
        </Part>
    </Parts>

    <Totals>
        <Labor>2400.00</Labor>
        <Parts>1850.00</Parts>
        <Paint>500.00</Paint>
        <Total>4750.00</Total>
        <Deductible>1000.00</Deductible>
    </Totals>
</Estimate>`;

    // Write BMS files
    try {
        fs.writeFileSync(path.join(bmsDir, 'honda_civic_sf_001234.xml'), hondaCivicBMS);
        fs.writeFileSync(path.join(bmsDir, 'hyundai_elantra_int_567890.xml'), hyundaiElantraBMS);

        console.log(`📁 Created sample BMS XML files in: ${bmsDir}`);
        console.log('   - honda_civic_sf_001234.xml (State Farm)');
        console.log('   - hyundai_elantra_int_567890.xml (Intact Insurance)\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to create BMS XML files:', error.message);
        return false;
    }
}

// Main function
function createSeedData() {
    console.log('📝 Generating collision repair seed SQL...');

    const seedSQL = createSeedSQL();
    const seedPath = path.join(__dirname, 'collision-repair-seed-data.sql');

    try {
        fs.writeFileSync(seedPath, seedSQL, 'utf8');
        console.log(`✅ Created seed file: ${seedPath}`);
        console.log(`📏 Size: ${(seedSQL.length / 1024).toFixed(1)} KB\n`);
    } catch (error) {
        console.error('❌ Failed to create seed file:', error.message);
        return false;
    }

    // Create sample BMS XML files
    const bmsSuccess = createSampleBMSFiles();

    console.log('📊 Collision Repair Seed Data Summary:');
    console.log('=' .repeat(50));
    console.log('✅ Shops: 1 (Precision Auto Body)');
    console.log('✅ Users: 2 (Owner + Estimator)');
    console.log('✅ Insurance Companies: 3 (State Farm DRP, Intact, Aviva DRP)');
    console.log('✅ Customers: 3 (Individual + Business)');
    console.log('✅ Vehicles: 3 (Honda Civic, Hyundai Elantra, Ford F-150)');
    console.log('✅ Vendors: 3 (OEM, LKQ Recycled, Aftermarket)');
    console.log('✅ Claims: 2 (Rear-end + Side impact scenarios)');
    console.log('✅ Repair Orders: 2 (In-progress + Estimate status)');
    console.log('✅ BMS Imports: 2 (State Farm + Intact processed)');
    console.log(`✅ Sample BMS XML Files: ${bmsSuccess ? '2' : 'Failed'}`);

    console.log('\n🚗 Collision Repair Test Scenarios:');
    console.log('1. Honda Civic (Emily Johnson) - Rear-end collision');
    console.log('   • State Farm DRP claim SF-2024-001234');
    console.log('   • RO-24-0001 (in_progress), $3,250 estimate');
    console.log('   • Front bumper, headlight, grille replacement');
    console.log('');
    console.log('2. Hyundai Elantra (Michael Chen) - Side impact');
    console.log('   • Intact Insurance claim INT-2024-567890');
    console.log('   • RO-24-0002 (estimate), $4,750 estimate');
    console.log('   • Door repair/replacement, mirror, quarter panel');

    console.log('\n🚀 Next Steps:');
    console.log('  1. Deploy schema: Follow SCHEMA_DEPLOYMENT_GUIDE.md');
    console.log('  2. Execute seed data: Run collision-repair-seed-data.sql in Supabase');
    console.log('  3. Test BMS integration: Upload XML files from samples/bms-xml/');
    console.log('  4. Verify workflows: Search by RO#, Claim#, VIN, License Plate');
    console.log('  5. Start development: npm run dev');

    return true;
}

// Execute if run directly
if (require.main === module) {
    const success = createSeedData();
    process.exit(success ? 0 : 1);
}

module.exports = { createSeedData };