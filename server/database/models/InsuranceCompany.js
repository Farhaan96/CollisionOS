const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const InsuranceCompany = sequelize.define(
    'InsuranceCompany',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'shops',
          key: 'id',
        },
      },
      // Company information
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM(
          'auto',
          'commercial',
          'specialty',
          'self_insured',
          'other'
        ),
        defaultValue: 'auto',
      },
      // Contact information
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      zipCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(50),
        defaultValue: 'Canada',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      fax: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // DRP (Direct Repair Program) information
      isDRP: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      drpNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      drpStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      drpEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      drpDiscount: {
        type: DataTypes.DECIMAL(5, 2), // percentage
        allowNull: true,
      },
      // Primary contact person
      contactPerson: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contactTitle: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Claims department
      claimsPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      claimsEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      claimsFax: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      claimsAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Payment terms and preferences
      paymentTerms: {
        type: DataTypes.ENUM(
          'immediate',
          'net_15',
          'net_30',
          'net_45',
          'net_60'
        ),
        defaultValue: 'net_30',
      },
      preferredPaymentMethod: {
        type: DataTypes.ENUM('check', 'ach', 'wire', 'credit_card', 'other'),
        defaultValue: 'check',
      },
      taxId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Billing and invoicing
      billingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      billingContact: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      billingPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      billingEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Processing preferences
      requiresPhotos: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      requiresEstimate: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      approvalLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      supplementApprovalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Preferred vendors and parts
      preferredPartsType: {
        type: DataTypes.ENUM('OEM', 'Aftermarket', 'Used', 'Any'),
        defaultValue: 'Any',
      },
      allowsUsedParts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      allowsAftermarketParts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Labor rates and policies
      bodyLaborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      paintLaborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      frameLaborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      mechanicalLaborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      glasslaborRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      // Rental car policies
      providesRentalCar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rentalCarLimit: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true, // daily limit
      },
      rentalCarDaysLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Deductibles and coverage
      avgDeductible: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      coversRental: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      coversTowing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Performance metrics
      avgPaymentDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalClaims: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalClaimsValue: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.0,
      },
      avgClaimValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      // Ratings and relationship
      customerServiceRating: {
        type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
        allowNull: true,
      },
      paymentRating: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      overallRating: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      relationshipStatus: {
        type: DataTypes.ENUM(
          'excellent',
          'good',
          'fair',
          'poor',
          'problematic'
        ),
        defaultValue: 'good',
      },
      // Status and activity
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastClaimDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Special instructions and notes
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      claimsProcedure: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Digital integration
      hasOnlinePortal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      portalUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      portalUsername: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      apiIntegration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ediCapable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Compliance and certifications
      requiredCertifications: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      complianceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // System fields
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'insurance_companies',
      timestamps: true,
      indexes: [
        {
          fields: ['shopId'],
        },
        {
          unique: true,
          fields: ['code'],
          where: {
            code: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        {
          fields: ['name'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['isDRP'],
        },
        {
          fields: ['drpNumber'],
        },
        {
          fields: ['paymentTerms'],
        },
        {
          fields: ['relationshipStatus'],
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['lastClaimDate'],
        },
        {
          fields: ['totalClaims'],
        },
        {
          fields: ['overallRating'],
        },
      ],
      hooks: {
        beforeCreate: company => {
          // Generate code if not provided
          if (!company.code && company.name) {
            company.code = generateInsuranceCode(company.name);
          }
        },
        beforeUpdate: company => {
          // Update average claim value when totals change
          if (
            company.changed('totalClaims') ||
            company.changed('totalClaimsValue')
          ) {
            if (company.totalClaims > 0) {
              company.avgClaimValue = (
                company.totalClaimsValue / company.totalClaims
              ).toFixed(2);
            } else {
              company.avgClaimValue = null;
            }
          }

          // Update overall rating based on component ratings
          if (
            company.changed('customerServiceRating') ||
            company.changed('paymentRating')
          ) {
            const ratings = [
              company.customerServiceRating,
              company.paymentRating,
            ].filter(r => r !== null);
            if (ratings.length > 0) {
              company.overallRating = (
                ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              ).toFixed(1);
            }
          }
        },
      },
    }
  );

  // Instance methods
  InsuranceCompany.prototype.getFullAddress = function () {
    const parts = [
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.country,
    ];
    return parts.filter(part => part).join(', ');
  };

  InsuranceCompany.prototype.getRelationshipColor = function () {
    const relationshipColors = {
      excellent: '#2ECC71',
      good: '#27AE60',
      fair: '#F39C12',
      poor: '#E67E22',
      problematic: '#E74C3C',
    };
    return relationshipColors[this.relationshipStatus] || '#95A5A6';
  };

  InsuranceCompany.prototype.isDRPActive = function () {
    if (!this.isDRP || !this.drpEndDate) return this.isDRP;
    return new Date() <= new Date(this.drpEndDate);
  };

  InsuranceCompany.prototype.getDRPStatus = function () {
    if (!this.isDRP) return 'Not DRP';
    if (!this.drpEndDate) return 'Active';

    const today = new Date();
    const endDate = new Date(this.drpEndDate);

    if (today <= endDate) return 'Active';
    return 'Expired';
  };

  InsuranceCompany.prototype.getPaymentScore = function () {
    // Calculate based on payment rating and average payment days
    let score = 0;

    if (this.paymentRating) {
      score += (this.paymentRating / 5) * 70; // 70% weight for rating
    }

    if (this.avgPaymentDays) {
      // Score decreases as payment days increase
      const dayScore = Math.max(0, (45 - this.avgPaymentDays) / 45) * 30; // 30% weight
      score += dayScore;
    }

    return Math.round(score);
  };

  InsuranceCompany.prototype.getPreferredLaborRate = function (laborType) {
    const rateMap = {
      body: this.bodyLaborRate,
      paint: this.paintLaborRate,
      frame: this.frameLaborRate,
      mechanical: this.mechanicalLaborRate,
      glass: this.glasslaborRate,
    };

    return rateMap[laborType] || null;
  };

  InsuranceCompany.prototype.allowsPartType = function (partType) {
    switch (partType.toLowerCase()) {
      case 'used':
        return this.allowsUsedParts;
      case 'aftermarket':
        return this.allowsAftermarketParts;
      case 'oem':
        return true; // OEM always allowed
      default:
        return true;
    }
  };

  InsuranceCompany.prototype.isHighVolume = function () {
    return this.totalClaims >= 100; // Configurable threshold
  };

  InsuranceCompany.prototype.needsAttention = function () {
    return (
      this.relationshipStatus === 'problematic' ||
      (this.overallRating && this.overallRating < 3.0) ||
      (this.avgPaymentDays && this.avgPaymentDays > 45)
    );
  };

  // Class methods
  InsuranceCompany.generateCode = generateInsuranceCode;

  return InsuranceCompany;
};

// Helper function to generate insurance company code
function generateInsuranceCode(name) {
  const cleanName = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const code = cleanName.substring(0, 8);
  return (
    code +
    Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')
  );
}
