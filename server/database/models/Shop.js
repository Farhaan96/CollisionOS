const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Shop = sequelize.define(
    'Shop',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      businessName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      fax: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Canada',
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'America/Toronto',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'CAD',
      },
      taxNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gstNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      pstNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      hstNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      settings: {
        type: DataTypes.JSON,
        defaultValue: {
          laborRate: 65.0,
          paintAndMaterialsRate: 45.0,
          workingHours: {
            monday: { start: '08:00', end: '17:00', enabled: true },
            tuesday: { start: '08:00', end: '17:00', enabled: true },
            wednesday: { start: '08:00', end: '17:00', enabled: true },
            thursday: { start: '08:00', end: '17:00', enabled: true },
            friday: { start: '08:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '15:00', enabled: false },
            sunday: { start: '09:00', end: '15:00', enabled: false },
          },
          autoBackup: true,
          backupFrequency: 'daily',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          integrations: {
            cccOne: { enabled: false, apiKey: '', endpoint: '' },
            mitchell: { enabled: false, apiKey: '', endpoint: '' },
            audatex: { enabled: false, apiKey: '', endpoint: '' },
            webEst: { enabled: false, apiKey: '', endpoint: '' },
          },
        },
      },
      subscription: {
        type: DataTypes.JSON,
        defaultValue: {
          plan: 'starter',
          status: 'active',
          startDate: new Date(),
          endDate: null,
          maxUsers: 5,
          maxJobs: 50,
          features: [
            'basic_dashboard',
            'job_management',
            'customer_management',
          ],
        },
      },
      licenseKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isTrial: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      trialExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastBackup: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      setupCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      onboardingStep: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'shops',
      timestamps: true,
      underscored: false, // Use camelCase field names
      indexes: [
        // Indexes temporarily disabled for initial migration
      ],
    }
  );

  // Instance methods
  Shop.prototype.getFullAddress = function () {
    return `${this.address}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`;
  };

  Shop.prototype.isTrialExpired = function () {
    return (
      this.isTrial && this.trialExpiresAt && new Date() > this.trialExpiresAt
    );
  };

  Shop.prototype.getDaysInTrial = function () {
    if (!this.isTrial || !this.trialExpiresAt) return 0;
    const now = new Date();
    const expiry = new Date(this.trialExpiresAt);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Shop.prototype.canUseFeature = function (feature) {
    const subscription = this.subscription || {};
    const features = subscription.features || [];
    return features.includes(feature) || subscription.plan === 'enterprise';
  };

  Shop.prototype.updateSettings = function (newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.save();
  };

  return Shop;
};
