const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'LoanerReservation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Parent References
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
      },
      repairOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'repair_order_management', key: 'id' },
      },
      loanerVehicleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'loaner_fleet_management', key: 'id' },
      },
      claimManagementId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'claim_management', key: 'id' },
      },

      // Reservation Identification
      reservationNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique reservation identifier',
      },

      // Reservation Status
      reservationStatus: {
        type: DataTypes.ENUM(
          'pending',
          'confirmed',
          'active',
          'completed',
          'cancelled',
          'no_show',
          'early_return'
        ),
        defaultValue: 'pending',
      },
      statusChangeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusChangeReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      statusChangedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },

      // Reservation Dates and Times
      requestedStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      requestedEndDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      confirmedStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      confirmedEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualPickupDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualReturnDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Pickup and Return Information
      pickupLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'shop',
      },
      returnLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'shop',
      },
      pickupTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      returnTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      requiresDelivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Vehicle Preferences
      preferredVehicleClass: {
        type: DataTypes.ENUM(
          'economy',
          'compact',
          'mid_size',
          'full_size',
          'premium',
          'suv',
          'pickup',
          'van'
        ),
        allowNull: true,
      },
      alternativeVehicleClassOk: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      specificVehicleRequested: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Specific make/model requested',
      },
      vehicleFeatureRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of required features',
      },

      // Eligibility and Authorization
      eligibilityVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      eligibilitySource: {
        type: DataTypes.ENUM(
          'insurance',
          'warranty',
          'goodwill',
          'customer_pay'
        ),
        allowNull: true,
      },
      authorizationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      authorizingParty: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Insurance company or authorizing entity',
      },
      authorizationContact: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      authorizationPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // Rental Coverage Information
      coverageType: {
        type: DataTypes.ENUM(
          'full_coverage',
          'basic_coverage',
          'liability_only',
          'customer_insurance',
          'none'
        ),
        allowNull: true,
      },
      dailyAllowance: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Daily rental allowance amount',
      },
      totalAllowance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total rental allowance amount',
      },
      allowanceDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of days covered',
      },
      allowanceStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      allowanceEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Customer Information
      primaryDriverName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      primaryDriverLicense: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      primaryDriverLicenseState: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      primaryDriverAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      primaryDriverPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // Additional Drivers
      additionalDrivers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of additional authorized drivers',
      },
      maxAdditionalDrivers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Insurance Information
      customerInsuranceVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerInsuranceCompany: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customerPolicyNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      customerInsurancePhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      shopInsuranceApplies: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      // Vehicle Condition at Pickup
      pickupOdometer: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pickupFuelLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
      },
      pickupConditionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pickupDamagePhotos: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of damage photo paths at pickup',
      },
      pickupInspectionComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      pickupInspectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },

      // Vehicle Condition at Return
      returnOdometer: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      returnFuelLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
      },
      returnConditionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      returnDamagePhotos: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of damage photo paths at return',
      },
      returnInspectionComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      returnInspectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },

      // Mileage and Usage
      totalMilesDriven: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dailyMileageAllowance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      excessMileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      excessMileageRate: {
        type: DataTypes.DECIMAL(6, 3),
        allowNull: true,
      },
      excessMileageCharge: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },

      // Financial Information
      baseRentalRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      totalRentalDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalRentalCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      additionalCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      additionalChargesDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      amountCoveredByInsurance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      customerResponsibleAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      // Payment Information
      securityDepositRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      securityDepositAmount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      securityDepositCollected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      securityDepositRefunded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM(
          'cash',
          'credit_card',
          'debit_card',
          'check',
          'insurance_direct',
          'account_billing'
        ),
        allowNull: true,
      },
      creditCardOnFile: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Last 4 digits and card type',
      },

      // Documentation and Agreements
      rentalAgreementSigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      agreementSignedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      agreementDocumentPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      waiverSigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      insuranceWaiverSigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerIdVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      drivingRecordChecked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Emergency Contacts
      emergencyContactName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      emergencyContactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      emergencyContactRelationship: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Special Circumstances
      isEmergencyReservation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      requiresSpecialAssistance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      specialAssistanceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hasAccessibilityNeeds: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      accessibilityRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Conflict Detection and Management
      hasConflict: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      conflictResolution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      alternativeOffered: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      alternativeAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Communication and Notifications
      confirmationSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      confirmationSentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      remindersSent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastReminderDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customerContactPreference: {
        type: DataTypes.ENUM('phone', 'email', 'text', 'mail'),
        defaultValue: 'phone',
      },

      // Quality and Satisfaction
      customerSatisfactionScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 },
      },
      customerFeedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      complaintFiled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      complaintDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      complaintResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Return Processing
      requiresPostReturnCleaning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      postReturnInspectionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      damageClaimFiled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      damageClaimAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      // Notes and Comments
      reservationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerServiceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      managementNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pickupNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      returnNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Audit Fields
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'loaner_reservations',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );
};
