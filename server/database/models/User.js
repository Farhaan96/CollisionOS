const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null during initial setup
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(
        'owner',
        'manager',
        'service_advisor',
        'estimator',
        'technician',
        'parts_manager',
        'receptionist',
        'accountant',
        'admin'
      ),
      allowNull: false,
      defaultValue: 'technician'
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    employeeId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    supervisorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    certifications: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    skills: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    availability: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    maxJobs: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    currentJobs: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    efficiency: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00
    },
    customerSatisfaction: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00
    },
    totalHours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    vacationDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sickDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    personalDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    clockInTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clockOutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isClockedIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    currentLocation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sessionToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    accountLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lockReason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    unlockAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: false, // Use camelCase field names
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['employeeId']
      },
      {
        fields: ['shopId']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isOnline']
      },
      {
        fields: ['lastLogin']
      },
      {
        fields: ['supervisorId']
      },
      {
        fields: ['department']
      }
    ],
    hooks: {
      beforeCreate: (user) => {
        // Set default permissions based on role
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          user.permissions = getDefaultPermissions(user.role);
        }
      },
      beforeUpdate: (user) => {
        // Update permissions if role changed
        if (user.changed('role')) {
          user.permissions = getDefaultPermissions(user.role);
        }
      }
    }
  });

  // Instance methods
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.isLocked = function() {
    return this.accountLocked && this.unlockAt && new Date() < this.unlockAt;
  };

  User.prototype.canLogin = function() {
    return this.isActive && !this.isLocked();
  };

  User.prototype.hasPermission = function(permission) {
    return this.permissions && this.permissions[permission] === true;
  };

  User.prototype.hasAnyPermission = function(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  };

  User.prototype.hasAllPermissions = function(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  };

  User.prototype.isRole = function(role) {
    return this.role === role;
  };

  User.prototype.isRoleOrHigher = function(role) {
    const roleHierarchy = {
      'owner': 8,
      'admin': 7,
      'manager': 6,
      'service_advisor': 5,
      'estimator': 4,
      'parts_manager': 3,
      'accountant': 2,
      'technician': 1,
      'receptionist': 0
    };
    
    const userLevel = roleHierarchy[this.role] || 0;
    const requiredLevel = roleHierarchy[role] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Class methods
  User.getDefaultPermissions = getDefaultPermissions;

  return User;
};

// Helper function to get default permissions for each role
function getDefaultPermissions(role) {
  const permissions = {
    // Dashboard permissions
    'dashboard.view': true,
    'dashboard.export': false,
    
    // Customer permissions
    'customers.view': false,
    'customers.create': false,
    'customers.edit': false,
    'customers.delete': false,
    'customers.export': false,
    
    // Job permissions
    'jobs.view': false,
    'jobs.create': false,
    'jobs.edit': false,
    'jobs.delete': false,
    'jobs.assign': false,
    'jobs.export': false,
    
    // Estimate permissions
    'estimates.view': false,
    'estimates.create': false,
    'estimates.edit': false,
    'estimates.delete': false,
    'estimates.approve': false,
    'estimates.export': false,
    
    // Parts permissions
    'parts.view': false,
    'parts.create': false,
    'parts.edit': false,
    'parts.delete': false,
    'parts.order': false,
    'parts.receive': false,
    'parts.export': false,
    
    // Inventory permissions
    'inventory.view': false,
    'inventory.create': false,
    'inventory.edit': false,
    'inventory.delete': false,
    'inventory.adjust': false,
    'inventory.export': false,
    
    // Financial permissions
    'financial.view': false,
    'financial.create': false,
    'financial.edit': false,
    'financial.delete': false,
    'financial.approve': false,
    'financial.export': false,
    
    // Quality control permissions
    'quality.view': false,
    'quality.create': false,
    'quality.edit': false,
    'quality.delete': false,
    'quality.approve': false,
    'quality.export': false,
    
    // User management permissions
    'users.view': false,
    'users.create': false,
    'users.edit': false,
    'users.delete': false,
    'users.permissions': false,
    
    // System permissions
    'settings.view': false,
    'settings.edit': false,
    'reports.view': false,
    'reports.create': false,
    'reports.export': false,
    'integrations.view': false,
    'integrations.edit': false,
    'backup.view': false,
    'backup.create': false,
    'backup.restore': false
  };

  switch (role) {
    case 'owner':
      // Owner has all permissions
      Object.keys(permissions).forEach(key => {
        permissions[key] = true;
      });
      break;
      
    case 'admin':
      // Admin has most permissions except some owner-specific ones
      Object.keys(permissions).forEach(key => {
        permissions[key] = true;
      });
      break;
      
    case 'manager':
      permissions['dashboard.view'] = true;
      permissions['dashboard.export'] = true;
      permissions['customers.view'] = true;
      permissions['customers.create'] = true;
      permissions['customers.edit'] = true;
      permissions['customers.export'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.create'] = true;
      permissions['jobs.edit'] = true;
      permissions['jobs.assign'] = true;
      permissions['jobs.export'] = true;
      permissions['estimates.view'] = true;
      permissions['estimates.create'] = true;
      permissions['estimates.edit'] = true;
      permissions['estimates.approve'] = true;
      permissions['estimates.export'] = true;
      permissions['parts.view'] = true;
      permissions['parts.create'] = true;
      permissions['parts.edit'] = true;
      permissions['parts.order'] = true;
      permissions['parts.receive'] = true;
      permissions['parts.export'] = true;
      permissions['inventory.view'] = true;
      permissions['inventory.create'] = true;
      permissions['inventory.edit'] = true;
      permissions['inventory.adjust'] = true;
      permissions['inventory.export'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      permissions['financial.approve'] = true;
      permissions['financial.export'] = true;
      permissions['quality.view'] = true;
      permissions['quality.create'] = true;
      permissions['quality.edit'] = true;
      permissions['quality.approve'] = true;
      permissions['quality.export'] = true;
      permissions['users.view'] = true;
      permissions['users.create'] = true;
      permissions['users.edit'] = true;
      permissions['settings.view'] = true;
      permissions['settings.edit'] = true;
      permissions['reports.view'] = true;
      permissions['reports.create'] = true;
      permissions['reports.export'] = true;
      permissions['integrations.view'] = true;
      permissions['integrations.edit'] = true;
      break;
      
    case 'service_advisor':
      permissions['dashboard.view'] = true;
      permissions['customers.view'] = true;
      permissions['customers.create'] = true;
      permissions['customers.edit'] = true;
      permissions['customers.export'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.create'] = true;
      permissions['jobs.edit'] = true;
      permissions['jobs.assign'] = true;
      permissions['jobs.export'] = true;
      permissions['estimates.view'] = true;
      permissions['estimates.create'] = true;
      permissions['estimates.edit'] = true;
      permissions['estimates.export'] = true;
      permissions['parts.view'] = true;
      permissions['parts.order'] = true;
      permissions['parts.export'] = true;
      permissions['inventory.view'] = true;
      permissions['inventory.export'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      permissions['financial.export'] = true;
      permissions['quality.view'] = true;
      permissions['quality.create'] = true;
      permissions['quality.edit'] = true;
      permissions['quality.export'] = true;
      permissions['reports.view'] = true;
      permissions['reports.export'] = true;
      break;
      
    case 'estimator':
      permissions['dashboard.view'] = true;
      permissions['customers.view'] = true;
      permissions['customers.create'] = true;
      permissions['customers.edit'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.create'] = true;
      permissions['jobs.edit'] = true;
      permissions['estimates.view'] = true;
      permissions['estimates.create'] = true;
      permissions['estimates.edit'] = true;
      permissions['estimates.export'] = true;
      permissions['parts.view'] = true;
      permissions['parts.order'] = true;
      permissions['parts.export'] = true;
      permissions['inventory.view'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      permissions['reports.view'] = true;
      permissions['reports.export'] = true;
      break;
      
    case 'technician':
      permissions['dashboard.view'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.edit'] = true;
      permissions['parts.view'] = true;
      permissions['parts.order'] = true;
      permissions['inventory.view'] = true;
      permissions['quality.view'] = true;
      permissions['quality.create'] = true;
      permissions['quality.edit'] = true;
      break;
      
    case 'parts_manager':
      permissions['dashboard.view'] = true;
      permissions['jobs.view'] = true;
      permissions['parts.view'] = true;
      permissions['parts.create'] = true;
      permissions['parts.edit'] = true;
      permissions['parts.order'] = true;
      permissions['parts.receive'] = true;
      permissions['parts.export'] = true;
      permissions['inventory.view'] = true;
      permissions['inventory.create'] = true;
      permissions['inventory.edit'] = true;
      permissions['inventory.adjust'] = true;
      permissions['inventory.export'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      permissions['reports.view'] = true;
      permissions['reports.export'] = true;
      break;
      
    case 'receptionist':
      permissions['dashboard.view'] = true;
      permissions['customers.view'] = true;
      permissions['customers.create'] = true;
      permissions['customers.edit'] = true;
      permissions['customers.export'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.create'] = true;
      permissions['jobs.edit'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      break;
      
    case 'accountant':
      permissions['dashboard.view'] = true;
      permissions['customers.view'] = true;
      permissions['customers.export'] = true;
      permissions['jobs.view'] = true;
      permissions['jobs.export'] = true;
      permissions['financial.view'] = true;
      permissions['financial.create'] = true;
      permissions['financial.edit'] = true;
      permissions['financial.approve'] = true;
      permissions['financial.export'] = true;
      permissions['reports.view'] = true;
      permissions['reports.create'] = true;
      permissions['reports.export'] = true;
      break;
  }

  return permissions;
}
