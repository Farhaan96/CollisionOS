const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const BmsImport = sequelize.define(
    'BmsImport',
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
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fileType: {
        type: DataTypes.ENUM('EMS', 'BMS', 'CSV', 'XML', 'JSON'),
        allowNull: false,
        defaultValue: 'BMS',
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      originalFileName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      importDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'success',
          'failed',
          'partial',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      parsedData: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      errorLog: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      estimateId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'estimates',
          key: 'id',
        },
      },
      jobId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id',
        },
      },
      // Processing statistics
      totalRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      processedRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      errorRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      skippedRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Processing details
      processingStarted: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      processingCompleted: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      processingDuration: {
        type: DataTypes.INTEGER, // in seconds
        allowNull: true,
      },
      // Data mapping and validation
      dataMapping: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      validationErrors: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      // BMS specific fields
      bmsVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      bmsProvider: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Backup and rollback
      backupData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      canRollback: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rolledBack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rollbackDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Metadata
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'bms_imports',
      timestamps: true,
      indexes: [
        // Indexes temporarily disabled for initial migration
        // Re-enable after first successful sync
      ],
      hooks: {
        beforeCreate: bmsImport => {
          if (
            !bmsImport.processingStarted &&
            bmsImport.status === 'processing'
          ) {
            bmsImport.processingStarted = new Date();
          }
        },
        beforeUpdate: bmsImport => {
          if (bmsImport.changed('status')) {
            if (
              bmsImport.status === 'processing' &&
              !bmsImport.processingStarted
            ) {
              bmsImport.processingStarted = new Date();
            }

            if (
              ['success', 'failed', 'partial'].includes(bmsImport.status) &&
              bmsImport.processingStarted &&
              !bmsImport.processingCompleted
            ) {
              bmsImport.processingCompleted = new Date();
              const duration = Math.floor(
                (bmsImport.processingCompleted -
                  new Date(bmsImport.processingStarted)) /
                  1000
              );
              bmsImport.processingDuration = duration;
            }
          }
        },
      },
    }
  );

  // Instance methods
  BmsImport.prototype.getProcessingTime = function () {
    if (!this.processingStarted) return 0;

    const endTime = this.processingCompleted || new Date();
    const startTime = new Date(this.processingStarted);

    return Math.floor((endTime - startTime) / 1000);
  };

  BmsImport.prototype.getSuccessRate = function () {
    if (this.totalRecords === 0) return 0;
    return Math.round((this.processedRecords / this.totalRecords) * 100);
  };

  BmsImport.prototype.hasErrors = function () {
    return (
      this.errorRecords > 0 ||
      (this.validationErrors && this.validationErrors.length > 0)
    );
  };

  BmsImport.prototype.canBeRolledBack = function () {
    return (
      this.canRollback &&
      !this.rolledBack &&
      ['success', 'partial'].includes(this.status)
    );
  };

  BmsImport.prototype.getStatusColor = function () {
    const statusColors = {
      pending: '#FFA500',
      processing: '#3498DB',
      success: '#2ECC71',
      failed: '#E74C3C',
      partial: '#F39C12',
      cancelled: '#95A5A6',
    };
    return statusColors[this.status] || '#95A5A6';
  };

  return BmsImport;
};
