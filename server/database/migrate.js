const { sequelize } = require('./models');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Sync all models with the database
    // force: true - will drop and recreate all tables
    // This is safe for development, but should be used carefully in production
    await sequelize.sync({ force: true });
    
    console.log('Database migration completed successfully!');
    console.log('All models have been synchronized with the database.');
    
    // List all tables
    const tables = await sequelize.showAllSchemas();
    console.log('Available tables:', tables.map(t => t.name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
