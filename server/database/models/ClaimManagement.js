const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define(
    'ClaimManagement',
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
      vehicleProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vehicle_profiles', key: 'id' },
      },
      insuranceCompanyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'insurance_companies', key: 'id' },
      },

      // Core Claim Information
      claimNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Insurance company claim number',
      },
      policyNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      policyType: {
        type: DataTypes.ENUM(
          'comprehensive',
          'collision',
          'liability',
          'uninsured_motorist',
          'pip',
          'other'
        ),
        allowNull: true,
      },

      // Claim Dates
      dateOfLoss: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dateReported: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dateClaimOpened: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Adjuster Information
      adjusterName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adjusterPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      adjusterEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adjusterExtension: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      adjusterFax: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // Secondary Adjuster (for complex claims)
      secondaryAdjusterName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      secondaryAdjusterPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      secondaryAdjusterEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // Claim Status and Processing
      claimStatus: {
        type: DataTypes.ENUM(
          'pending',
          'open',
          'under_review',
          'approved',
          'denied',
          'closed',
          'subrogation',
          'litigation'
        ),
        defaultValue: 'pending',
      },
      statusUpdateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Deductible Information
      deductibleAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      deductiblePaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deductiblePaidDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deductiblePaidBy: {
        type: DataTypes.ENUM(
          'customer',
          'insurance',
          'shop',
          'waived',
          'pending'
        ),
        allowNull: true,
      },
      deductibleWaived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deductibleWaivedReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Coverage Information
      coverageType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      policyLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      coverageDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON of coverage details',
      },

      // Loss Information
      lossDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lossLocation: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      lossType: {
        type: DataTypes.ENUM(
          'collision',
          'comprehensive',
          'vandalism',
          'theft',
          'weather',
          'fire',
          'flood',
          'animal',
          'other'
        ),
        allowNull: true,
      },
      atFaultParty: {
        type: DataTypes.ENUM(
          'insured',
          'third_party',
          'unknown',
          'disputed',
          'shared'
        ),
        allowNull: true,
      },
      liabilityPercentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Insured party liability percentage',
      },

      // Third Party Information
      thirdPartyInvolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      thirdPartyInsurer: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      thirdPartyClaimNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      thirdPartyAdjuster: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      thirdPartyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // Police Report Information
      policeReportFiled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      policeReportNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      policeDepartment: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      officerName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      officerBadgeNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Injury Information
      injuriesClaimed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      injuryDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medicalTreatmentSought: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      hospitalName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // Program Participation
      isDRPClaim: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Direct Repair Program claim',
      },
      drpProgram: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      programCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      programDiscount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Program discount percentage',
      },

      // ATS (Alternate Transportation) Information
      atsEligible: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      atsAllowanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Daily ATS allowance',
      },
      atsStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      atsEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      atsDaysApproved: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      atsDaysUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      atsProvider: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      atsNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Financial Information
      estimatedDamage: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      reserveAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Insurance company reserve',
      },
      totalPayout: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      salvageValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      totalLoss: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      totalLossDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalLossThreshold: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage threshold for total loss',
      },

      // Supplement Information
      supplementsAllowed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      supplementCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      supplementTotal: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      lastSupplementDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Documentation and Compliance
      documentsRequired: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of required documents',
      },
      documentsReceived: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of received documents',
      },
      missingDocuments: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of missing documents',
      },

      // Special Handling
      requiresSpecialHandling: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      specialHandlingReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      flaggedForReview: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reviewReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Subrogation Information
      subrogationPotential: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      subrogationAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      subrogationStatus: {
        type: DataTypes.ENUM(
          'none',
          'potential',
          'initiated',
          'in_progress',
          'recovered',
          'closed'
        ),
        defaultValue: 'none',
      },
      subrogationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Legal Information
      attorneyInvolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      attorneyName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attorneyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      attorneyEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      litigationStatus: {
        type: DataTypes.ENUM(
          'none',
          'threatened',
          'filed',
          'settled',
          'dismissed'
        ),
        defaultValue: 'none',
      },

      // Communication Preferences
      preferredContactMethod: {
        type: DataTypes.ENUM('phone', 'email', 'mail', 'text', 'portal'),
        defaultValue: 'phone',
      },
      communicationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Internal Notes
      claimNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      adjustmentNotes: {
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
      tableName: 'claim_management',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );
};
