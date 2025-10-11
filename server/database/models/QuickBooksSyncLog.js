/**
 * QuickBooksSyncLog Model - CollisionOS Phase 2
 *
 * Tracks QuickBooks sync operations
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuickBooksSyncLog = sequelize.define(
    'QuickBooksSyncLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'shop_id',
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'entity_type',
        comment: 'Type of entity synced (invoice, payment, expense, customer)',
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entity_id',
        comment: 'ID of the entity in our system',
      },
      qboId: {
        type: DataTypes.STRING(255),
        field: 'qbo_id',
        comment: 'ID of the entity in QuickBooks',
      },
      syncStatus: {
        type: DataTypes.ENUM('pending', 'success', 'failed', 'conflict'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'sync_status',
      },
      syncDirection: {
        type: DataTypes.ENUM('to_qbo', 'from_qbo', 'bidirectional'),
        allowNull: false,
        field: 'sync_direction',
      },
      requestPayload: {
        type: DataTypes.JSONB,
        field: 'request_payload',
      },
      responsePayload: {
        type: DataTypes.JSONB,
        field: 'response_payload',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        field: 'error_message',
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'retry_count',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      tableName: 'quickbooks_sync_log',
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['shop_id'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['sync_status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return QuickBooksSyncLog;
};
