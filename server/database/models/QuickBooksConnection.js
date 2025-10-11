/**
 * QuickBooksConnection Model - CollisionOS Phase 2
 *
 * Stores QuickBooks OAuth connection details
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuickBooksConnection = sequelize.define(
    'QuickBooksConnection',
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
      realmId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'realm_id',
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'access_token',
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'refresh_token',
      },
      accessTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'access_token_expires_at',
      },
      refreshTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'refresh_token_expires_at',
      },
      companyInfo: {
        type: DataTypes.JSONB,
        field: 'company_info',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      lastSyncAt: {
        type: DataTypes.DATE,
        field: 'last_sync_at',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      tableName: 'quickbooks_connections',
      timestamps: true,
      underscored: true,
    }
  );

  return QuickBooksConnection;
};
