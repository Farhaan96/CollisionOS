const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

let sequelize;

if (process.env.DB_HOST === 'sqlite' || env === 'development') {
  const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/collisionos.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false,
    define: { timestamps: true, underscored: true, freezeTableName: true }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: env === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, underscored: true, freezeTableName: true },
      dialectOptions: env === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
    }
  );
}

module.exports = { sequelize };
