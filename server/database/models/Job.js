const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Job = sequelize.define(
    'Job',
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
      jobNumber: {
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
      assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      bayId: {
        type: DataTypes.UUID,
        allowNull: true,
        // Note: references removed until bays table is created
      },
      status: {
        type: DataTypes.ENUM(
          'estimate',
          'intake',
          'blueprint',
          'parts_ordering',
          'parts_receiving',
          'body_structure',
          'paint_prep',
          'paint_booth',
          'reassembly',
          'quality_control',
          'calibration',
          'detail',
          'ready_pickup',
          'delivered',
          'on_hold',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'estimate',
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent', 'rush'),
        defaultValue: 'normal',
      },
      jobType: {
        type: DataTypes.ENUM(
          'collision',
          'mechanical',
          'glass',
          'paint',
          'detailing',
          'inspection',
          'warranty',
          'recall',
          'maintenance',
          'other'
        ),
        allowNull: false,
        defaultValue: 'collision',
      },
      insuranceId: {
        type: DataTypes.UUID,
        allowNull: true,
        // Note: references removed until insurances table is created
      },
      claimId: {
        type: DataTypes.UUID,
        allowNull: true,
        // Note: references removed until claims table is created
      },
      claimNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      deductible: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      customerPay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      insurancePay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      laborAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      partsAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      materialsAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      subletAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      profitMargin: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      estimatedHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      actualHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      efficiency: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      cycleTime: {
        type: DataTypes.INTEGER, // Days
        allowNull: true,
      },
      targetDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      checkInDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      checkOutDate: {
        type: DataTypes.DATE,
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
      isDRP: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      drpProgram: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isWarranty: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      warrantyType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isRush: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isExpress: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isVIP: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isInsurance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isCustomerPay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isCash: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFinanced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM(
          'cash',
          'check',
          'credit_card',
          'debit_card',
          'bank_transfer',
          'insurance',
          'financing',
          'other'
        ),
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          'pending',
          'partial',
          'paid',
          'overdue',
          'refunded'
        ),
        defaultValue: 'pending',
      },
      invoiceStatus: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'draft',
      },
      estimateStatus: {
        type: DataTypes.ENUM(
          'draft',
          'pending',
          'approved',
          'rejected',
          'revised'
        ),
        defaultValue: 'draft',
      },
      partsStatus: {
        type: DataTypes.ENUM(
          'pending',
          'ordered',
          'partial',
          'received',
          'backordered'
        ),
        defaultValue: 'pending',
      },
      qualityStatus: {
        type: DataTypes.ENUM(
          'pending',
          'in_progress',
          'passed',
          'failed',
          'rework'
        ),
        defaultValue: 'pending',
      },
      calibrationStatus: {
        type: DataTypes.ENUM('not_required', 'pending', 'completed', 'failed'),
        defaultValue: 'not_required',
      },
      supplementCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      supplementAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      lastSupplementDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      photosRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      photosTaken: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      photosCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      documentsRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      documentsReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      documentsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      authorizationReceived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      authorizationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      authorizationMethod: {
        type: DataTypes.ENUM(
          'in_person',
          'phone',
          'email',
          'text',
          'online',
          'other'
        ),
        allowNull: true,
      },
      authorizationBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      rentalRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rentalProvided: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rentalStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rentalEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rentalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      towRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      towProvided: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      towCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      subletRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      subletCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      subletTotal: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      customerSatisfaction: {
        type: DataTypes.INTEGER, // 1-5 scale
        allowNull: true,
      },
      customerFeedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      comeBack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      comeBackReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      comeBackDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      warrantyClaim: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      warrantyClaimDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      warrantyClaimReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      customFields: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      workflow: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      timeline: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      history: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      archivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      archivedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
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
      tableName: 'jobs',
      timestamps: true,
      underscored: false, // Use camelCase field names
      indexes: [
        {
          unique: true,
          fields: ['jobNumber'],
        },
        {
          fields: ['shopId'],
        },
        {
          fields: ['customerId'],
        },
        {
          fields: ['vehicleId'],
        },
        {
          fields: ['assignedTo'],
        },
        {
          fields: ['bayId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['jobType'],
        },
        {
          fields: ['insuranceId'],
        },
        {
          fields: ['claimNumber'],
        },
        {
          fields: ['targetDeliveryDate'],
        },
        {
          fields: ['actualDeliveryDate'],
        },
        {
          fields: ['checkInDate'],
        },
        {
          fields: ['checkOutDate'],
        },
        {
          fields: ['isDRP'],
        },
        {
          fields: ['isWarranty'],
        },
        {
          fields: ['paymentStatus'],
        },
        {
          fields: ['invoiceStatus'],
        },
        {
          fields: ['estimateStatus'],
        },
        {
          fields: ['partsStatus'],
        },
        {
          fields: ['qualityStatus'],
        },
        {
          fields: ['calibrationStatus'],
        },
        {
          fields: ['isArchived'],
        },
      ],
      hooks: {
        beforeCreate: job => {
          // Generate job number if not provided
          if (!job.jobNumber) {
            job.jobNumber = generateJobNumber();
          }

          // Set check-in date if status is intake or later
          if (
            [
              'intake',
              'blueprint',
              'parts_ordering',
              'parts_receiving',
              'body_structure',
              'paint_prep',
              'paint_booth',
              'reassembly',
              'quality_control',
              'calibration',
              'detail',
              'ready_pickup',
              'delivered',
            ].includes(job.status)
          ) {
            job.checkInDate = job.checkInDate || new Date();
          }

          // Set start date if status is body_structure or later
          if (
            [
              'body_structure',
              'paint_prep',
              'paint_booth',
              'reassembly',
              'quality_control',
              'calibration',
              'detail',
              'ready_pickup',
              'delivered',
            ].includes(job.status)
          ) {
            job.startDate = job.startDate || new Date();
          }
        },
        beforeUpdate: job => {
          // Update check-in date if status changes to intake or later
          if (
            job.changed('status') &&
            [
              'intake',
              'blueprint',
              'parts_ordering',
              'parts_receiving',
              'body_structure',
              'paint_prep',
              'paint_booth',
              'reassembly',
              'quality_control',
              'calibration',
              'detail',
              'ready_pickup',
              'delivered',
            ].includes(job.status)
          ) {
            job.checkInDate = job.checkInDate || new Date();
          }

          // Update start date if status changes to body_structure or later
          if (
            job.changed('status') &&
            [
              'body_structure',
              'paint_prep',
              'paint_booth',
              'reassembly',
              'quality_control',
              'calibration',
              'detail',
              'ready_pickup',
              'delivered',
            ].includes(job.status)
          ) {
            job.startDate = job.startDate || new Date();
          }

          // Update completion date if status changes to delivered
          if (job.changed('status') && job.status === 'delivered') {
            job.completionDate = new Date();
            job.checkOutDate = new Date();
          }

          // Update actual delivery date if status changes to delivered
          if (job.changed('status') && job.status === 'delivered') {
            job.actualDeliveryDate = new Date();
          }

          // Calculate cycle time
          if (job.checkInDate && job.actualDeliveryDate) {
            const checkIn = new Date(job.checkInDate);
            const delivery = new Date(job.actualDeliveryDate);
            job.cycleTime = Math.ceil(
              (delivery - checkIn) / (1000 * 60 * 60 * 24)
            );
          }

          // Calculate efficiency
          if (job.estimatedHours && job.actualHours) {
            job.efficiency = (
              (job.estimatedHours / job.actualHours) *
              100
            ).toFixed(2);
          }
        },
      },
    }
  );

  // Instance methods
  Job.prototype.getStatusColor = function () {
    const statusColors = {
      estimate: '#FFA500',
      intake: '#FF6B6B',
      blueprint: '#4ECDC4',
      parts_ordering: '#45B7D1',
      parts_receiving: '#96CEB4',
      body_structure: '#FFEAA7',
      paint_prep: '#DDA0DD',
      paint_booth: '#98D8C8',
      reassembly: '#F7DC6F',
      quality_control: '#BB8FCE',
      calibration: '#85C1E9',
      detail: '#F8C471',
      ready_pickup: '#82E0AA',
      delivered: '#2ECC71',
      on_hold: '#E74C3C',
      cancelled: '#95A5A6',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  Job.prototype.getPriorityColor = function () {
    const priorityColors = {
      low: '#2ECC71',
      normal: '#3498DB',
      high: '#F39C12',
      urgent: '#E67E22',
      rush: '#E74C3C',
    };
    return priorityColors[this.priority] || '#3498DB';
  };

  Job.prototype.isOverdue = function () {
    if (!this.targetDeliveryDate) return false;
    return (
      new Date() > new Date(this.targetDeliveryDate) &&
      this.status !== 'delivered'
    );
  };

  Job.prototype.getDaysInShop = function () {
    if (!this.checkInDate) return 0;
    const checkIn = new Date(this.checkInDate);
    const today = new Date();
    return Math.ceil((today - checkIn) / (1000 * 60 * 60 * 24));
  };

  Job.prototype.getProgressPercentage = function () {
    const statusOrder = [
      'estimate',
      'intake',
      'blueprint',
      'parts_ordering',
      'parts_receiving',
      'body_structure',
      'paint_prep',
      'paint_booth',
      'reassembly',
      'quality_control',
      'calibration',
      'detail',
      'ready_pickup',
      'delivered',
    ];

    const currentIndex = statusOrder.indexOf(this.status);
    if (currentIndex === -1) return 0;

    return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
  };

  Job.prototype.canMoveToNextStatus = function () {
    const statusTransitions = {
      estimate: ['intake'],
      intake: ['blueprint'],
      blueprint: ['parts_ordering'],
      parts_ordering: ['parts_receiving'],
      parts_receiving: ['body_structure'],
      body_structure: ['paint_prep'],
      paint_prep: ['paint_booth'],
      paint_booth: ['reassembly'],
      reassembly: ['quality_control'],
      quality_control: ['calibration', 'detail'],
      calibration: ['detail'],
      detail: ['ready_pickup'],
      ready_pickup: ['delivered'],
      delivered: [],
      on_hold: [
        'estimate',
        'intake',
        'blueprint',
        'parts_ordering',
        'parts_receiving',
        'body_structure',
        'paint_prep',
        'paint_booth',
        'reassembly',
        'quality_control',
        'calibration',
        'detail',
        'ready_pickup',
      ],
      cancelled: [],
    };

    return statusTransitions[this.status] || [];
  };

  Job.prototype.requiresCalibration = function () {
    // Logic to determine if calibration is required based on vehicle and damage
    return this.calibrationStatus !== 'not_required';
  };

  Job.prototype.getTotalAmount = function () {
    return (
      (this.laborAmount || 0) +
      (this.partsAmount || 0) +
      (this.materialsAmount || 0) +
      (this.subletAmount || 0) +
      (this.taxAmount || 0)
    );
  };

  Job.prototype.getBalance = function () {
    return (
      this.getTotalAmount() - (this.customerPay || 0) - (this.insurancePay || 0)
    );
  };

  // Class methods
  Job.generateJobNumber = generateJobNumber;

  return Job;
};

// Helper function to generate job number
function generateJobNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${year}${month}${day}-${random}`;
}
