const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

/**
 * BMS Test Data Generator
 * Generates realistic BMS XML files for collision repair testing
 */
class BMSTestDataGenerator {
    constructor() {
        this.insuranceCompanies = [
            'State Farm', 'Geico', 'Progressive', 'Allstate', 'USAA',
            'Liberty Mutual', 'Farmers', 'Nationwide', 'American Family'
        ];
        
        this.vehicleMakes = [
            { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'] },
            { make: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'] },
            { make: 'Ford', models: ['F-150', 'Escape', 'Explorer', 'Fusion', 'Mustang'] },
            { make: 'Chevrolet', models: ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Camaro'] },
            { make: 'BMW', models: ['3 Series', '5 Series', 'X3', 'X5', 'X1'] },
            { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'] }
        ];

        this.damageTypes = [
            {
                type: 'Front End Collision',
                operations: ['Replace', 'Repair', 'Refinish'],
                parts: [
                    { name: 'Front Bumper Cover', oem: '52119-06903', price: 425.50 },
                    { name: 'Headlamp Assembly RH', oem: '81130-06821', price: 389.99 },
                    { name: 'Grille Assembly', oem: '53101-06903', price: 245.75 },
                    { name: 'Hood', oem: '66400-06903', price: 675.00 }
                ]
            },
            {
                type: 'Rear End Collision',
                operations: ['Replace', 'Repair', 'Refinish'],
                parts: [
                    { name: 'Rear Bumper Cover', oem: '52159-06903', price: 385.25 },
                    { name: 'Tail Lamp Assembly LH', oem: '81560-06821', price: 295.50 },
                    { name: 'Trunk Lid', oem: '64500-06903', price: 525.75 },
                    { name: 'License Plate Bracket', oem: '76403-06903', price: 45.99 }
                ]
            },
            {
                type: 'Side Impact',
                operations: ['Replace', 'Repair', 'Refinish'],
                parts: [
                    { name: 'Door Shell LH', oem: '67002-06903', price: 445.00 },
                    { name: 'Door Mirror LH', oem: '87940-06903', price: 185.25 },
                    { name: 'Quarter Panel', oem: '61301-06903', price: 725.50 },
                    { name: 'Side Molding', oem: '75951-06903', price: 125.99 }
                ]
            }
        ];

        this.laborOperations = [
            { operation: 'Remove and Install', code: 'R&I', rate: 55.00 },
            { operation: 'Remove and Replace', code: 'R&R', rate: 55.00 },
            { operation: 'Repair', code: 'RPR', rate: 55.00 },
            { operation: 'Refinish', code: 'REF', rate: 65.00 },
            { operation: 'Blend', code: 'BLD', rate: 65.00 }
        ];
    }

    /**
     * Generate realistic VIN
     */
    generateVIN() {
        const wmi = faker.helpers.arrayElement(['1G1', '1HD', '2T1', '3FA', 'JTD', 'WBA', 'JM3']);
        const vds = faker.string.alphanumeric(6).toUpperCase();
        const vis = faker.string.alphanumeric(8).toUpperCase();
        return `${wmi}${vds}${vis}`;
    }

    /**
     * Generate license plate
     */
    generatePlate(state = 'CA') {
        const formats = {
            'CA': () => `${faker.string.numeric(1)}${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(3)}`,
            'TX': () => `${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(4)}`,
            'FL': () => `${faker.string.alpha(3).toUpperCase()} ${faker.string.numeric(3)}`,
            'NY': () => `${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(4)}`
        };
        return formats[state] ? formats[state]() : formats['CA']();
    }

    /**
     * Generate realistic BMS XML for collision repair
     */
    generateBMSXML(options = {}) {
        const {
            estimateNumber = `EST${faker.string.numeric(8)}`,
            claimNumber = `CLM${faker.string.numeric(10)}`,
            damageType = faker.helpers.arrayElement(this.damageTypes),
            vehicleInfo = this.generateVehicleInfo(),
            customerInfo = this.generateCustomerInfo(),
            insuranceInfo = this.generateInsuranceInfo()
        } = options;

        const estimateDate = faker.date.between({ from: '2024-01-01', to: '2024-12-31' });
        const accidentDate = faker.date.between({ 
            from: new Date(estimateDate.getTime() - 14 * 24 * 60 * 60 * 1000), 
            to: estimateDate 
        });

        // Generate line items for the damage type
        const lineItems = this.generateLineItems(damageType);
        const totals = this.calculateTotals(lineItems);

        const bmsXML = `<?xml version="1.0" encoding="UTF-8"?>
<Estimate>
    <EstimateInfo>
        <EstimateNumber>${estimateNumber}</EstimateNumber>
        <ClaimNumber>${claimNumber}</ClaimNumber>
        <EstimateDate>${estimateDate.toISOString().split('T')[0]}</EstimateDate>
        <AccidentDate>${accidentDate.toISOString().split('T')[0]}</AccidentDate>
        <EstimateType>Insurance</EstimateType>
        <Status>Approved</Status>
        <Appraiser>
            <Name>${faker.person.fullName()}</Name>
            <Company>${insuranceInfo.company}</Company>
            <Phone>${faker.phone.number()}</Phone>
            <Email>${faker.internet.email()}</Email>
        </Appraiser>
    </EstimateInfo>

    <Customer>
        <FirstName>${customerInfo.firstName}</FirstName>
        <LastName>${customerInfo.lastName}</LastName>
        <Phone>${customerInfo.phone}</Phone>
        <Email>${customerInfo.email}</Email>
        <Address>
            <Street>${customerInfo.address}</Street>
            <City>${customerInfo.city}</City>
            <State>${customerInfo.state}</State>
            <Zip>${customerInfo.zip}</Zip>
        </Address>
    </Customer>

    <Vehicle>
        <VIN>${vehicleInfo.vin}</VIN>
        <Year>${vehicleInfo.year}</Year>
        <Make>${vehicleInfo.make}</Make>
        <Model>${vehicleInfo.model}</Model>
        <Color>${vehicleInfo.color}</Color>
        <Trim>${vehicleInfo.trim}</Trim>
        <Mileage>${vehicleInfo.mileage}</Mileage>
        <LicensePlate>${vehicleInfo.licensePlate}</LicensePlate>
        <LicenseState>${vehicleInfo.licenseState}</LicenseState>
        <EngineType>${vehicleInfo.engineType}</EngineType>
        <Transmission>${vehicleInfo.transmission}</Transmission>
    </Vehicle>

    <Insurance>
        <Company>${insuranceInfo.company}</Company>
        <PolicyNumber>${insuranceInfo.policyNumber}</PolicyNumber>
        <ClaimNumber>${claimNumber}</ClaimNumber>
        <Deductible>${insuranceInfo.deductible}</Deductible>
        <Coverage>${insuranceInfo.coverage}</Coverage>
        <Adjuster>
            <Name>${insuranceInfo.adjuster.name}</Name>
            <Phone>${insuranceInfo.adjuster.phone}</Phone>
            <Email>${insuranceInfo.adjuster.email}</Email>
        </Adjuster>
    </Insurance>

    <DamageDescription>
        <PrimaryDamage>${damageType.type}</PrimaryDamage>
        <DamageArea>Front</DamageArea>
        <Severity>Moderate</Severity>
        <DrivabilityImpact>Yes</DrivabilityImpact>
        <SafetyIssues>Airbag Deployment</SafetyIssues>
    </DamageDescription>

    <LineItems>
${lineItems.map(item => this.generateLineItemXML(item)).join('\n')}
    </LineItems>

    <Totals>
        <PartsTotal>${totals.parts.toFixed(2)}</PartsTotal>
        <LaborTotal>${totals.labor.toFixed(2)}</LaborTotal>
        <MaterialsTotal>${totals.materials.toFixed(2)}</MaterialsTotal>
        <SubletTotal>${totals.sublet.toFixed(2)}</SubletTotal>
        <Subtotal>${totals.subtotal.toFixed(2)}</Subtotal>
        <Tax>${totals.tax.toFixed(2)}</Tax>
        <GrandTotal>${totals.grandTotal.toFixed(2)}</GrandTotal>
    </Totals>

    <Shop>
        <Name>${faker.company.name()} Auto Body</Name>
        <Address>${faker.location.streetAddress()}</Address>
        <City>${faker.location.city()}</City>
        <State>${faker.location.state({ abbreviated: true })}</State>
        <Zip>${faker.location.zipCode()}</Zip>
        <Phone>${faker.phone.number()}</Phone>
        <Email>${faker.internet.email()}</Email>
        <LicenseNumber>LIC${faker.string.numeric(8)}</LicenseNumber>
    </Shop>

    <Photos>
        <Photo>
            <Description>Accident Scene - Front Angle</Description>
            <Filename>accident_front_${estimateNumber.toLowerCase()}.jpg</Filename>
            <DateTaken>${accidentDate.toISOString()}</DateTaken>
        </Photo>
        <Photo>
            <Description>Damage Detail - Primary Impact</Description>
            <Filename>damage_detail_${estimateNumber.toLowerCase()}.jpg</Filename>
            <DateTaken>${accidentDate.toISOString()}</DateTaken>
        </Photo>
    </Photos>

</Estimate>`;

        return bmsXML;
    }

    /**
     * Generate vehicle information
     */
    generateVehicleInfo() {
        const vehicleData = faker.helpers.arrayElement(this.vehicleMakes);
        const year = faker.number.int({ min: 2015, max: 2024 });
        
        return {
            vin: this.generateVIN(),
            year,
            make: vehicleData.make,
            model: faker.helpers.arrayElement(vehicleData.models),
            color: faker.helpers.arrayElement(['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue']),
            trim: faker.helpers.arrayElement(['Base', 'SE', 'Sport', 'Limited', 'Premium']),
            mileage: faker.number.int({ min: 10000, max: 150000 }),
            licensePlate: this.generatePlate(),
            licenseState: faker.location.state({ abbreviated: true }),
            engineType: faker.helpers.arrayElement(['4-Cyl', 'V6', 'V8', 'Hybrid']),
            transmission: faker.helpers.arrayElement(['Manual', 'Automatic', 'CVT'])
        };
    }

    /**
     * Generate customer information
     */
    generateCustomerInfo() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        
        return {
            firstName,
            lastName,
            phone: faker.phone.number(),
            email: faker.internet.email({ firstName, lastName }),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            zip: faker.location.zipCode()
        };
    }

    /**
     * Generate insurance information
     */
    generateInsuranceInfo() {
        const company = faker.helpers.arrayElement(this.insuranceCompanies);
        const adjusterName = faker.person.fullName();
        
        return {
            company,
            policyNumber: faker.string.alphanumeric(12).toUpperCase(),
            deductible: faker.helpers.arrayElement([250, 500, 1000, 1500]),
            coverage: faker.helpers.arrayElement(['Collision', 'Comprehensive', 'Full Coverage']),
            adjuster: {
                name: adjusterName,
                phone: faker.phone.number(),
                email: faker.internet.email({ firstName: adjusterName.split(' ')[0] })
            }
        };
    }

    /**
     * Generate line items for estimate
     */
    generateLineItems(damageType) {
        const lineItems = [];
        let lineNumber = 1;

        // Add parts
        damageType.parts.forEach(part => {
            lineItems.push({
                lineNumber: lineNumber++,
                type: 'Part',
                operation: faker.helpers.arrayElement(damageType.operations),
                description: part.name,
                partNumber: part.oem,
                quantity: 1,
                unitPrice: part.price,
                laborHours: faker.number.float({ min: 0.5, max: 3.0, fractionDigits: 1 }),
                laborRate: 55.00
            });
        });

        // Add labor operations
        const laborOps = faker.helpers.arrayElements(this.laborOperations, { min: 2, max: 4 });
        laborOps.forEach(labor => {
            lineItems.push({
                lineNumber: lineNumber++,
                type: 'Labor',
                operation: labor.operation,
                description: `${labor.operation} - Body Panel`,
                quantity: 1,
                laborHours: faker.number.float({ min: 1.0, max: 8.0, fractionDigits: 1 }),
                laborRate: labor.rate
            });
        });

        // Add materials
        lineItems.push({
            lineNumber: lineNumber++,
            type: 'Material',
            operation: 'Apply',
            description: 'Paint and Materials',
            quantity: 1,
            unitPrice: faker.number.float({ min: 125, max: 350, fractionDigits: 2 })
        });

        return lineItems;
    }

    /**
     * Generate XML for a line item
     */
    generateLineItemXML(item) {
        const laborTotal = (item.laborHours || 0) * (item.laborRate || 0);
        const partTotal = (item.quantity || 0) * (item.unitPrice || 0);

        return `        <LineItem>
            <LineNumber>${item.lineNumber}</LineNumber>
            <Type>${item.type}</Type>
            <Operation>${item.operation}</Operation>
            <Description>${item.description}</Description>
            ${item.partNumber ? `<PartNumber>${item.partNumber}</PartNumber>` : ''}
            <Quantity>${item.quantity || 1}</Quantity>
            ${item.unitPrice ? `<UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>` : ''}
            ${item.laborHours ? `<LaborHours>${item.laborHours.toFixed(1)}</LaborHours>` : ''}
            ${item.laborRate ? `<LaborRate>${item.laborRate.toFixed(2)}</LaborRate>` : ''}
            <PartsAmount>${partTotal.toFixed(2)}</PartsAmount>
            <LaborAmount>${laborTotal.toFixed(2)}</LaborAmount>
        </LineItem>`;
    }

    /**
     * Calculate estimate totals
     */
    calculateTotals(lineItems) {
        let parts = 0, labor = 0, materials = 0;

        lineItems.forEach(item => {
            const partTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const laborTotal = (item.laborHours || 0) * (item.laborRate || 0);

            if (item.type === 'Part') {
                parts += partTotal;
                labor += laborTotal;
            } else if (item.type === 'Labor') {
                labor += laborTotal;
            } else if (item.type === 'Material') {
                materials += partTotal;
            }
        });

        const sublet = faker.number.float({ min: 0, max: 500, fractionDigits: 2 });
        const subtotal = parts + labor + materials + sublet;
        const tax = subtotal * 0.0875; // 8.75% tax
        const grandTotal = subtotal + tax;

        return {
            parts,
            labor,
            materials,
            sublet,
            subtotal,
            tax,
            grandTotal
        };
    }

    /**
     * Generate multiple BMS files for testing
     */
    generateTestSuite(count = 10, outputDir = './test-bms-files') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const files = [];

        for (let i = 1; i <= count; i++) {
            const damageType = faker.helpers.arrayElement(this.damageTypes);
            const estimateNumber = `TEST${String(i).padStart(4, '0')}`;
            
            const bmsXML = this.generateBMSXML({
                estimateNumber,
                damageType
            });

            const filename = `${estimateNumber}_${damageType.type.replace(/\s+/g, '_').toLowerCase()}.xml`;
            const filepath = path.join(outputDir, filename);
            
            fs.writeFileSync(filepath, bmsXML, 'utf8');
            
            files.push({
                filename,
                filepath,
                estimateNumber,
                damageType: damageType.type,
                size: Buffer.byteLength(bmsXML, 'utf8')
            });
        }

        // Generate summary file
        const summary = {
            generated_at: new Date().toISOString(),
            total_files: count,
            output_directory: outputDir,
            total_size_bytes: files.reduce((sum, f) => sum + f.size, 0),
            damage_types_distribution: this.damageTypes.reduce((acc, type) => {
                acc[type.type] = files.filter(f => f.damageType === type.type).length;
                return acc;
            }, {}),
            files
        };

        fs.writeFileSync(
            path.join(outputDir, 'test_suite_summary.json'),
            JSON.stringify(summary, null, 2),
            'utf8'
        );

        return summary;
    }

    /**
     * Generate specific damage scenario BMS files
     */
    generateScenarios() {
        const scenarios = [
            {
                name: 'Minor Front End',
                damageType: this.damageTypes[0],
                modifications: { severity: 'Minor', totalRange: [800, 2000] }
            },
            {
                name: 'Major Rear Impact',
                damageType: this.damageTypes[1],
                modifications: { severity: 'Major', totalRange: [4000, 8000] }
            },
            {
                name: 'Total Loss Side Impact',
                damageType: this.damageTypes[2],
                modifications: { severity: 'Severe', totalRange: [15000, 25000] }
            }
        ];

        const scenarioFiles = [];

        scenarios.forEach((scenario, index) => {
            const bmsXML = this.generateBMSXML({
                estimateNumber: `SCENARIO${index + 1}`,
                damageType: scenario.damageType
            });

            scenarioFiles.push({
                name: scenario.name,
                xml: bmsXML,
                description: `${scenario.name} collision repair scenario for testing`
            });
        });

        return scenarioFiles;
    }
}

module.exports = BMSTestDataGenerator;

// Command line usage
if (require.main === module) {
    const generator = new BMSTestDataGenerator();
    
    const count = parseInt(process.argv[2]) || 10;
    const outputDir = process.argv[3] || './test-bms-files';
    
    console.log(`Generating ${count} BMS test files in ${outputDir}...`);
    
    const summary = generator.generateTestSuite(count, outputDir);
    
    console.log('BMS Test Suite Generated:');
    console.log(`- Files: ${summary.total_files}`);
    console.log(`- Total Size: ${(summary.total_size_bytes / 1024).toFixed(2)} KB`);
    console.log(`- Output: ${summary.output_directory}`);
    console.log('- Damage Types:', Object.keys(summary.damage_types_distribution));
}