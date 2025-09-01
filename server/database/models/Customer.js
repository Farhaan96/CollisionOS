const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Customer = sequelize.define(
    'Customer',
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
      customerNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
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
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      driverLicense: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Communication preferences
      preferredContact: {
        type: DataTypes.ENUM('phone', 'email', 'sms', 'mail'),
        defaultValue: 'phone',
      },
      smsOptIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      emailOptIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      marketingOptIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Customer classification
      customerType: {
        type: DataTypes.ENUM('individual', 'business', 'insurance', 'fleet'),
        defaultValue: 'individual',
      },
      customerStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'prospect', 'vip'),
        defaultValue: 'active',
      },
      // Insurance information for collision repair
      primaryInsuranceCompany: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Primary insurance company for collision repair claims',
      },
      policyNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Insurance policy number',
      },
      deductible: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Insurance deductible amount',
      },
      // Business customer fields
      companyName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      taxId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Financial information
      creditLimit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      paymentTerms: {
        type: DataTypes.ENUM('immediate', 'net_15', 'net_30', 'net_60'),
        defaultValue: 'immediate',
      },
      // Loyalty and marketing
      loyaltyPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      referralSource: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Notes and history
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Timestamps
      firstVisitDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastVisitDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // System fields
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
    }
  );

  // Instance methods
  Customer.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  Customer.prototype.getFullAddress = function () {
    const parts = [
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.country,
    ];
    return parts.filter(part => part).join(', ');
  };

  Customer.prototype.getPreferredContact = function () {
    switch (this.preferredContact) {
      case 'phone':
        return this.phone || this.mobile;
      case 'email':
        return this.email;
      case 'sms':
        return this.mobile;
      default:
        return this.phone || this.mobile || this.email;
    }
  };

  Customer.prototype.getInsuranceInfo = function () {
    return {
      company: this.primaryInsuranceCompany,
      policyNumber: this.policyNumber,
      deductible: this.deductible,
      hasInsurance: !!this.primaryInsuranceCompany,
    };
  };

  // Class methods
  Customer.generateCustomerNumber = async function (shopId) {
    const lastCustomer = await this.findOne({
      where: { shopId },
      order: [['customerNumber', 'DESC']],
    });

    if (!lastCustomer) {
      return 'CUST-0001';
    }

    const lastNumber = parseInt(lastCustomer.customerNumber.split('-')[1]);
    return `CUST-${String(lastNumber + 1).padStart(4, '0')}`;
  };

  return Customer;
};
