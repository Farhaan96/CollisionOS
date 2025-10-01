const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Estimate = sequelize.define(
    'Estimate',
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
      estimateNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      vehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id',
        },
      },
      insuranceCompanyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'insurance_companies',
          key: 'id',
        },
      },
      claimNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      dateOfLoss: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Financial totals
      estimateTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      partsTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      laborTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      paintTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      subletTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      materialTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      otherTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      deductible: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      // Status and workflow
      status: {
        type: DataTypes.ENUM(
          'draft',
          'pending_review',
          'under_review',
          'approved',
          'rejected',
          'revised',
          'supplements_required',
          'converted_to_job'
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
      estimateType: {
        type: DataTypes.ENUM(
          'collision',
          'hail',
          'vandalism',
          'theft',
          'flood',
          'mechanical',
          'glass',
          'paint',
          'other'
        ),
        allowNull: false,
        defaultValue: 'collision',
      },
      // Insurance details
      isDRP: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      drpProgram: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      adjusterId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      adjusterName: {
        type: DataTypes.STRING(100),
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
      // Damage information
      damageType: {
        type: DataTypes.ENUM(
          'minor',
          'moderate',
          'major',
          'severe',
          'total_loss'
        ),
        allowNull: true,
      },
      damageDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      repairDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Timing
      estimateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Supplement tracking
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
      // Authorization and approval
      customerApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      customerApprovalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      insuranceApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      insuranceApprovalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Review and revision
      reviewNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      revisionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      revisionCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Photo and documentation
      photosRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      photosTaken: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      photosCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // System fields
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
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
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      // Metadata and notes
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      customFields: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // Conversion tracking
      convertedToJob: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      jobId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      conversionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'estimates',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
      hooks: {
        beforeCreate: estimate => {
          // Generate estimate number if not provided
          if (!estimate.estimateNumber) {
            estimate.estimateNumber = generateEstimateNumber();
          }

          // Set expiration date (default 30 days from creation)
          if (!estimate.expirationDate) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 30);
            estimate.expirationDate = expDate;
          }

          // Calculate totals
          estimate.estimateTotal = calculateTotal(estimate);
        },
        beforeUpdate: estimate => {
          // Update approval dates
          if (estimate.changed('status')) {
            if (estimate.status === 'approved') {
              estimate.approvalDate = new Date();
            }

            if (estimate.status === 'rejected') {
              estimate.rejectionDate = new Date();
            }

            if (estimate.status === 'converted_to_job') {
              estimate.convertedToJob = true;
              estimate.conversionDate = new Date();
            }
          }

          // Update customer approval date
          if (
            estimate.changed('customerApproval') &&
            estimate.customerApproval
          ) {
            estimate.customerApprovalDate = new Date();
          }

          // Update insurance approval date
          if (
            estimate.changed('insuranceApproval') &&
            estimate.insuranceApproval
          ) {
            estimate.insuranceApprovalDate = new Date();
          }

          // Recalculate totals if financial fields changed
          const financialFields = [
            'partsTotal',
            'laborTotal',
            'paintTotal',
            'subletTotal',
            'materialTotal',
            'otherTotal',
            'taxTotal',
          ];
          if (financialFields.some(field => estimate.changed(field))) {
            estimate.estimateTotal = calculateTotal(estimate);
          }
        },
      },
    }
  );

  // Instance methods
  Estimate.prototype.getStatusColor = function () {
    const statusColors = {
      draft: '#95A5A6',
      pending_review: '#3498DB',
      under_review: '#F39C12',
      approved: '#2ECC71',
      rejected: '#E74C3C',
      revised: '#9B59B6',
      supplements_required: '#E67E22',
      converted_to_job: '#1ABC9C',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  Estimate.prototype.isExpired = function () {
    if (!this.expirationDate) return false;
    return new Date() > new Date(this.expirationDate);
  };

  Estimate.prototype.getDaysUntilExpiry = function () {
    if (!this.expirationDate) return null;
    const today = new Date();
    const expiry = new Date(this.expirationDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Estimate.prototype.canBeConverted = function () {
    return ['approved'].includes(this.status) && !this.convertedToJob;
  };

  Estimate.prototype.getNetTotal = function () {
    return parseFloat(this.estimateTotal) - parseFloat(this.deductible || 0);
  };

  Estimate.prototype.getProfitMargin = function () {
    const totalCost =
      parseFloat(this.partsTotal) + parseFloat(this.materialTotal);
    const totalRevenue = parseFloat(this.estimateTotal);
    if (totalRevenue === 0) return 0;
    return ((totalRevenue - totalCost) / totalRevenue) * 100;
  };

  // Class methods
  Estimate.generateEstimateNumber = generateEstimateNumber;

  return Estimate;
};

// Helper function to generate estimate number
function generateEstimateNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `EST-${year}${month}${day}-${random}`;
}

// Helper function to calculate total
function calculateTotal(estimate) {
  const parts = parseFloat(estimate.partsTotal || 0);
  const labor = parseFloat(estimate.laborTotal || 0);
  const paint = parseFloat(estimate.paintTotal || 0);
  const sublet = parseFloat(estimate.subletTotal || 0);
  const material = parseFloat(estimate.materialTotal || 0);
  const other = parseFloat(estimate.otherTotal || 0);
  const tax = parseFloat(estimate.taxTotal || 0);

  return parts + labor + paint + sublet + material + other + tax;
}
