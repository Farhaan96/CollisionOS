const { faker } = require('@faker-js/faker');
const dayjs = require('dayjs');

/**
 * Comprehensive Collision Repair Test Data Factory
 * Generates realistic test data for the complete collision repair workflow
 */
class CollisionRepairDataFactory {
    constructor() {
        this.vehicleMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Kia'];
        this.vehicleColors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Maroon'];
        this.damageTypes = ['Front End', 'Rear End', 'Left Side', 'Right Side', 'Roof', 'Multiple Areas', 'Hail Damage'];
        this.partTypes = ['Bumper', 'Fender', 'Door', 'Hood', 'Headlight', 'Taillight', 'Mirror', 'Grille', 'Quarter Panel'];
        this.vendorNames = ['LKQ Corporation', 'Keystone Automotive', 'PartsTrader', 'Crash Champions', 'AutoZone Pro'];
        this.insuranceCompanies = ['State Farm', 'Geico', 'Progressive', 'Allstate', 'USAA', 'Liberty Mutual', 'Farmers'];
        
        // Production stages for collision repair workflow
        this.productionStages = [
            'Reception/Intake', 'Initial Assessment', 'Pre-Repair Photos', 'Disassembly',
            'Parts Ordering', 'Frame/Structural Repair', 'Body Work', 'Primer/Prep',
            'Base Coat', 'Clear Coat', 'Curing', 'Polish/Detail',
            'Reassembly', 'Final Inspection', 'Quality Check', 'Road Test',
            'Customer Delivery', 'Complete'
        ];

        this.technicianSpecialties = [
            'Frame Repair', 'Body Work', 'Paint', 'Electrical', 'Mechanical', 
            'Glass', 'Upholstery', 'ADAS Calibration'
        ];
    }

    /**
     * Generate realistic VIN numbers
     */
    generateVIN() {
        const wmi = faker.helpers.arrayElement(['1G1', '1HD', '2T1', '3FA', 'JTD', 'WBA', 'JM3']);
        const vds = faker.string.alphanumeric(6).toUpperCase();
        const vis = faker.string.alphanumeric(8).toUpperCase();
        return `${wmi}${vds}${vis}`;
    }

    /**
     * Generate realistic license plate
     */
    generateLicensePlate(state = 'CA') {
        const formats = {
            'CA': () => `${faker.string.numeric(1)}${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(3)}`,
            'TX': () => `${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(4)}`,
            'FL': () => `${faker.string.alpha(3).toUpperCase()} ${faker.string.numeric(3)}`,
            'NY': () => `${faker.string.alpha(3).toUpperCase()}${faker.string.numeric(4)}`
        };
        return formats[state] ? formats[state]() : formats['CA']();
    }

    /**
     * Generate shop data
     */
    generateShop(id = 1) {
        return {
            id,
            name: `${faker.company.name()} Auto Body`,
            businessName: `${faker.company.name()} Auto Body Shop`,
            email: faker.internet.email(),
            phone: faker.phone.number(),
            fax: faker.phone.number(),
            website: faker.internet.url(),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postalCode: faker.location.zipCode(),
            country: 'United States',
            timezone: 'America/New_York',
            currency: 'USD',
            taxNumber: faker.string.numeric(9),
            licenseNumber: `LIC${faker.string.numeric(8)}`,
            establishedDate: faker.date.between({ from: '1990-01-01', to: '2020-01-01' }),
            employeeCount: faker.number.int({ min: 5, max: 50 }),
            bayCount: faker.number.int({ min: 4, max: 20 }),
            certificationLevel: faker.helpers.arrayElement(['I-CAR Gold', 'ASE Certified', 'OEM Certified']),
            insuranceCarrier: faker.company.name(),
            isActive: true,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Generate user/technician data
     */
    generateUser(shopId = 1) {
        const roles = ['admin', 'manager', 'estimator', 'technician', 'service_advisor', 'parts_manager'];
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        
        return {
            shop_id: shopId,
            first_name: firstName,
            last_name: lastName,
            username: faker.internet.username({ firstName, lastName }),
            email: faker.internet.email({ firstName, lastName }),
            password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3/V5vfHZKu', // 'password123'
            role: faker.helpers.arrayElement(roles),
            phone: faker.phone.number(),
            hire_date: faker.date.between({ from: '2020-01-01', to: '2024-01-01' }),
            hourly_rate: faker.number.float({ min: 15, max: 45, fractionDigits: 2 }),
            specializations: faker.helpers.arrayElements(this.technicianSpecialties, { min: 1, max: 3 }),
            certification_level: faker.helpers.arrayElement(['Entry', 'Intermediate', 'Advanced', 'Master']),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    /**
     * Generate customer data
     */
    generateCustomer() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        
        return {
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email({ firstName, lastName }),
            phone: faker.phone.number(),
            alt_phone: Math.random() > 0.5 ? faker.phone.number() : null,
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            zip: faker.location.zipCode(),
            date_of_birth: faker.date.between({ from: '1940-01-01', to: '2000-01-01' }),
            drivers_license: `DL${faker.string.alphanumeric(10).toUpperCase()}`,
            insurance_company: faker.helpers.arrayElement(this.insuranceCompanies),
            policy_number: faker.string.alphanumeric(12).toUpperCase(),
            customer_since: faker.date.between({ from: '2015-01-01', to: '2024-01-01' }),
            preferred_contact: faker.helpers.arrayElement(['phone', 'email', 'text']),
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    /**
     * Generate vehicle data
     */
    generateVehicle(customerId) {
        const make = faker.helpers.arrayElement(this.vehicleMakes);
        const year = faker.number.int({ min: 2010, max: 2024 });
        const models = {
            'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
            'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
            'Ford': ['F-150', 'Escape', 'Explorer', 'Fusion', 'Mustang'],
            'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Camaro'],
            'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X1']
        };
        
        const model = faker.helpers.arrayElement(models[make] || ['Model']);
        
        return {
            customer_id: customerId,
            vin: this.generateVIN(),
            year,
            make,
            model,
            trim: faker.helpers.arrayElement(['Base', 'SE', 'Sport', 'Limited', 'Premium']),
            color: faker.helpers.arrayElement(this.vehicleColors),
            mileage: faker.number.int({ min: 5000, max: 200000 }),
            license_plate: this.generateLicensePlate(),
            license_state: faker.location.state({ abbreviated: true }),
            engine_type: faker.helpers.arrayElement(['4-Cyl', 'V6', 'V8', 'Hybrid', 'Electric']),
            transmission: faker.helpers.arrayElement(['Manual', 'Automatic', 'CVT']),
            body_style: faker.helpers.arrayElement(['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback']),
            fuel_type: faker.helpers.arrayElement(['Gasoline', 'Diesel', 'Hybrid', 'Electric']),
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    /**
     * Generate insurance claim data
     */
    generateClaim(customerId, vehicleId) {
        const claimNumber = `CLM${faker.string.numeric(10)}`;
        const accidentDate = faker.date.between({ from: '2024-01-01', to: '2024-12-01' });
        
        return {
            customer_id: customerId,
            vehicle_id: vehicleId,
            claim_number: claimNumber,
            insurance_company: faker.helpers.arrayElement(this.insuranceCompanies),
            policy_number: faker.string.alphanumeric(12).toUpperCase(),
            adjuster_name: faker.person.fullName(),
            adjuster_phone: faker.phone.number(),
            adjuster_email: faker.internet.email(),
            accident_date: accidentDate,
            report_date: dayjs(accidentDate).add(faker.number.int({ min: 1, max: 7 }), 'day').toDate(),
            deductible_amount: faker.helpers.arrayElement([250, 500, 1000, 1500, 2000]),
            coverage_type: faker.helpers.arrayElement(['Collision', 'Comprehensive', 'Liability']),
            claim_status: faker.helpers.arrayElement(['Open', 'Under Review', 'Approved', 'Closed']),
            total_loss: faker.datatype.boolean(0.1), // 10% chance of total loss
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    /**
     * Generate repair order (job) data
     */
    generateRepairOrder(customerId, vehicleId, claimId) {
        const roNumber = `RO${faker.string.numeric(6)}`;
        const entryDate = faker.date.between({ from: '2024-01-01', to: '2024-12-01' });
        
        return {
            customer_id: customerId,
            vehicle_id: vehicleId,
            claim_id: claimId,
            ro_number: roNumber,
            entry_date: entryDate,
            promised_date: dayjs(entryDate).add(faker.number.int({ min: 3, max: 14 }), 'day').toDate(),
            damage_description: `${faker.helpers.arrayElement(this.damageTypes)} collision damage with ${faker.helpers.arrayElements(['scratches', 'dents', 'paint damage', 'structural damage']).join(', ')}`,
            labor_hours: faker.number.float({ min: 5, max: 80, fractionDigits: 1 }),
            parts_cost: faker.number.float({ min: 500, max: 8000, fractionDigits: 2 }),
            labor_cost: faker.number.float({ min: 400, max: 4000, fractionDigits: 2 }),
            paint_materials_cost: faker.number.float({ min: 200, max: 1500, fractionDigits: 2 }),
            sublet_cost: faker.number.float({ min: 0, max: 2000, fractionDigits: 2 }),
            tax_rate: 0.0875,
            status: faker.helpers.arrayElement(['Estimate', 'Approved', 'In Progress', 'Complete', 'Delivered']),
            priority: faker.helpers.arrayElement(['Low', 'Normal', 'High', 'Rush']),
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    /**
     * Generate parts data for repair order
     */
    generateParts(jobId, count = 5) {
        const parts = [];
        for (let i = 0; i < count; i++) {
            const partType = faker.helpers.arrayElement(this.partTypes);
            parts.push({
                job_id: jobId,
                part_number: `${faker.string.alphanumeric(8).toUpperCase()}`,
                oem_number: `${faker.string.alphanumeric(10).toUpperCase()}`,
                description: `${partType} - ${faker.helpers.arrayElement(['Front', 'Rear', 'Left', 'Right'])}`,
                quantity: faker.number.int({ min: 1, max: 2 }),
                unit_cost: faker.number.float({ min: 50, max: 800, fractionDigits: 2 }),
                list_price: faker.number.float({ min: 80, max: 1200, fractionDigits: 2 }),
                part_type: faker.helpers.arrayElement(['OEM', 'Aftermarket', 'Used', 'Recycled']),
                status: faker.helpers.arrayElement(['Needed', 'Ordered', 'Backordered', 'Received', 'Installed']),
                vendor_id: faker.number.int({ min: 1, max: 5 }),
                location: faker.helpers.arrayElement(['Bay 1', 'Bay 2', 'Parts Room', 'Storage']),
                created_at: new Date(),
                updated_at: new Date()
            });
        }
        return parts;
    }

    /**
     * Generate vendor data
     */
    generateVendor(shopId = 1) {
        const vendorName = faker.helpers.arrayElement(this.vendorNames);
        return {
            shopId: shopId,
            vendorNumber: `VND${faker.string.numeric(6)}`,
            name: vendorName,
            vendorCode: faker.string.alpha(4).toUpperCase(),
            contactPerson: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            fax: faker.phone.number(),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postalCode: faker.location.zipCode(),
            country: 'United States',
            website: faker.internet.url(),
            accountNumber: faker.string.alphanumeric(10),
            paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 15', '2/10 Net 30', 'COD']),
            discountRate: faker.number.float({ min: 0, max: 15, fractionDigits: 2 }),
            leadTimeDays: faker.number.int({ min: 1, max: 14 }),
            minimumOrderAmount: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
            rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
            isActive: true,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Generate complete collision repair workflow test dataset
     */
    generateCompleteWorkflow(options = {}) {
        const {
            customerCount = 50,
            vehiclesPerCustomer = 1.2,
            claimsPerVehicle = 0.8,
            repairOrdersPerClaim = 1.0,
            partsPerRO = 5,
            vendorCount = 10,
            technicianCount = 15
        } = options;

        const dataset = {
            shops: [],
            users: [],
            customers: [],
            vehicles: [],
            claims: [],
            repairOrders: [],
            parts: [],
            vendors: []
        };

        // Generate shop
        dataset.shops.push(this.generateShop(1));

        // Generate vendors
        for (let i = 1; i <= vendorCount; i++) {
            dataset.vendors.push({ ...this.generateVendor(), id: i });
        }

        // Generate technicians/users
        for (let i = 1; i <= technicianCount; i++) {
            dataset.users.push({ ...this.generateUser(1), id: i });
        }

        // Generate customers and their workflows
        for (let customerId = 1; customerId <= customerCount; customerId++) {
            // Generate customer
            dataset.customers.push({ ...this.generateCustomer(), id: customerId });

            // Generate vehicles for this customer
            const vehicleCount = Math.round(vehiclesPerCustomer);
            for (let v = 0; v < vehicleCount; v++) {
                const vehicleId = dataset.vehicles.length + 1;
                dataset.vehicles.push({ ...this.generateVehicle(customerId), id: vehicleId });

                // Generate claims for this vehicle
                const claimCount = Math.random() < claimsPerVehicle ? 1 : 0;
                for (let c = 0; c < claimCount; c++) {
                    const claimId = dataset.claims.length + 1;
                    dataset.claims.push({ ...this.generateClaim(customerId, vehicleId), id: claimId });

                    // Generate repair orders for this claim
                    const roCount = Math.random() < repairOrdersPerClaim ? 1 : 0;
                    for (let r = 0; r < roCount; r++) {
                        const roId = dataset.repairOrders.length + 1;
                        dataset.repairOrders.push({ 
                            ...this.generateRepairOrder(customerId, vehicleId, claimId), 
                            id: roId 
                        });

                        // Generate parts for this repair order
                        const parts = this.generateParts(roId, faker.number.int({ min: 2, max: partsPerRO }));
                        dataset.parts.push(...parts.map((part, index) => ({ 
                            ...part, 
                            id: dataset.parts.length + index + 1 
                        })));
                    }
                }
            }
        }

        return dataset;
    }

    /**
     * Generate performance test data for load testing
     */
    generatePerformanceTestData(scale = 'medium') {
        const scales = {
            small: { customers: 100, workflows: 1.5 },
            medium: { customers: 500, workflows: 2.0 },
            large: { customers: 2000, workflows: 2.5 },
            enterprise: { customers: 10000, workflows: 3.0 }
        };

        const config = scales[scale] || scales.medium;
        
        return this.generateCompleteWorkflow({
            customerCount: config.customers,
            vehiclesPerCustomer: config.workflows,
            claimsPerVehicle: 0.7,
            repairOrdersPerClaim: 0.9,
            partsPerRO: 6,
            vendorCount: 20,
            technicianCount: 30
        });
    }
}

module.exports = CollisionRepairDataFactory;