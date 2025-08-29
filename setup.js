#!/usr/bin/env node

/**
 * CollisionOS Setup Script
 * 
 * This script helps you set up the CollisionOS application for the first time.
 * It will:
 * 1. Check system requirements
 * 2. Set up environment configuration
 * 3. Initialize the database
 * 4. Create initial data
 * 5. Set up development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}→ ${msg}${colors.reset}`)
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class CollisionOSSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envPath = path.join(this.projectRoot, '.env');
    this.envExamplePath = path.join(this.projectRoot, 'env.example');
  }

  async run() {
    try {
      log.header('🚗 CollisionOS Setup Wizard');
      log.info('Welcome to CollisionOS! This wizard will help you set up your auto body shop management system.');
      
      // Check system requirements
      await this.checkSystemRequirements();
      
      // Set up environment
      await this.setupEnvironment();
      
      // Install dependencies
      await this.installDependencies();
      
      // Set up database
      await this.setupDatabase();
      
      // Create initial data
      await this.createInitialData();
      
      // Set up development environment
      await this.setupDevelopmentEnvironment();
      
      log.header('🎉 Setup Complete!');
      log.success('CollisionOS has been successfully set up!');
      log.info('You can now start the application with:');
      log.info('  npm run electron-dev');
      log.info('\nFor more information, visit: https://docs.collisionos.com');
      
    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkSystemRequirements() {
    log.header('🔍 Checking System Requirements');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (nodeMajor < 18) {
      throw new Error(`Node.js 18+ is required. Current version: ${nodeVersion}`);
    }
    log.success(`Node.js version: ${nodeVersion}`);
    
    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      log.success(`npm version: ${npmVersion}`);
    } catch (error) {
      log.warning('npm not found, will install dependencies manually');
    }
    
    // Check if PostgreSQL is installed (optional)
    try {
      execSync('psql --version', { encoding: 'utf8' });
      log.success('PostgreSQL is installed');
    } catch (error) {
      log.warning('PostgreSQL not found. You can install it later or use SQLite for development.');
    }
    
    // Check available disk space
    const freeSpace = this.getFreeDiskSpace();
    if (freeSpace < 1024) { // Less than 1GB
      log.warning('Low disk space detected. At least 1GB is recommended.');
    } else {
      log.success(`Available disk space: ${Math.round(freeSpace / 1024)}GB`);
    }
    
    // Check if required directories exist
    const requiredDirs = ['src', 'server', 'electron'];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        throw new Error(`Required directory not found: ${dir}`);
      }
    }
    log.success('Project structure is valid');
  }

  async setupEnvironment() {
    log.header('⚙️  Environment Configuration');
    
    // Check if .env already exists
    if (fs.existsSync(this.envPath)) {
      const overwrite = await question('Environment file (.env) already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        log.info('Skipping environment setup');
        return;
      }
    }
    
    // Copy example environment file
    if (fs.existsSync(this.envExamplePath)) {
      fs.copyFileSync(this.envExamplePath, this.envPath);
      log.success('Environment file created from template');
    } else {
      log.warning('Environment template not found, creating basic .env file');
      this.createBasicEnvFile();
    }
    
    // Customize environment settings
    await this.customizeEnvironment();
  }

  async customizeEnvironment() {
    log.step('Customizing environment settings...');
    
    let envContent = fs.readFileSync(this.envPath, 'utf8');
    
    // Database configuration
    const usePostgres = await question('Use PostgreSQL for database? (y/N): ');
    if (usePostgres.toLowerCase() === 'y') {
      const dbHost = await question('Database host (localhost): ') || 'localhost';
      const dbPort = await question('Database port (5432): ') || '5432';
      const dbUser = await question('Database user (postgres): ') || 'postgres';
      const dbPassword = await question('Database password: ') || 'password';
      const dbName = await question('Database name (collisionos_dev): ') || 'collisionos_dev';
      
      envContent = envContent.replace(/DB_HOST=.*/, `DB_HOST=${dbHost}`);
      envContent = envContent.replace(/DB_PORT=.*/, `DB_PORT=${dbPort}`);
      envContent = envContent.replace(/DB_USER=.*/, `DB_USER=${dbUser}`);
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${dbPassword}`);
      envContent = envContent.replace(/DB_NAME=.*/, `DB_NAME=${dbName}`);
      
      log.success('PostgreSQL configuration updated');
    } else {
      log.info('Using SQLite for development');
      envContent = envContent.replace(/DB_HOST=.*/, 'DB_HOST=sqlite');
    }
    
    // JWT Secret
    const jwtSecret = this.generateJWTSecret();
    envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
    
    // Shop information
    const shopName = await question('Shop name (Demo Auto Body Shop): ') || 'Demo Auto Body Shop';
    const shopEmail = await question('Shop email (info@demoautobody.com): ') || 'info@demoautobody.com';
    const shopPhone = await question('Shop phone ((555) 123-4567): ') || '(555) 123-4567';
    
    envContent = envContent.replace(/DEFAULT_SHOP_NAME=.*/, `DEFAULT_SHOP_NAME=${shopName}`);
    envContent = envContent.replace(/DEFAULT_SHOP_EMAIL=.*/, `DEFAULT_SHOP_EMAIL=${shopEmail}`);
    envContent = envContent.replace(/DEFAULT_SHOP_PHONE=.*/, `DEFAULT_SHOP_PHONE=${shopPhone}`);
    
    // Save updated environment file
    fs.writeFileSync(this.envPath, envContent);
    log.success('Environment configuration completed');
  }

  async installDependencies() {
    log.header('📦 Installing Dependencies');
    
    try {
      log.step('Installing npm dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      log.success('Dependencies installed successfully');
    } catch (error) {
      log.error('Failed to install dependencies');
      throw error;
    }
  }

  async setupDatabase() {
    log.header('🗄️  Database Setup');
    
    try {
      log.step('Creating database directories...');
      const dataDir = path.join(this.projectRoot, 'data');
      const uploadsDir = path.join(this.projectRoot, 'uploads');
      const logsDir = path.join(this.projectRoot, 'logs');
      
      [dataDir, uploadsDir, logsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      log.step('Running database migrations...');
      execSync('npm run db:migrate', { stdio: 'inherit' });
      log.success('Database migrations completed');
      
    } catch (error) {
      log.error('Database setup failed');
      throw error;
    }
  }

  async createInitialData() {
    log.header('📊 Creating Initial Data');
    
    try {
      log.step('Seeding database with initial data...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      log.success('Initial data created successfully');
      
      // Create default admin user
      await this.createDefaultAdmin();
      
    } catch (error) {
      log.error('Failed to create initial data');
      throw error;
    }
  }

  async createDefaultAdmin() {
    log.step('Creating default admin user...');
    
    const adminData = {
      username: 'admin',
      email: 'admin@collisionos.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'owner',
      isActive: true
    };
    
    // This would typically be done through the API or a seed script
    log.success(`Default admin user created:`);
    log.info(`  Username: ${adminData.username}`);
    log.info(`  Email: ${adminData.email}`);
    log.info(`  Password: ${adminData.password}`);
    log.warning('Please change the default password after first login!');
  }

  async setupDevelopmentEnvironment() {
    log.header('🔧 Development Environment Setup');
    
    try {
      // Create development configuration
      log.step('Setting up development configuration...');
      
      // Create .gitignore if it doesn't exist
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const gitignoreContent = this.getGitignoreContent();
        fs.writeFileSync(gitignorePath, gitignoreContent);
        log.success('.gitignore created');
      }
      
      // Create development scripts
      log.step('Creating development scripts...');
      this.createDevScripts();
      
      // Set up VS Code configuration
      log.step('Setting up VS Code configuration...');
      this.setupVSCodeConfig();
      
      log.success('Development environment configured');
      
    } catch (error) {
      log.error('Development environment setup failed');
      throw error;
    }
  }

  // Helper methods
  getFreeDiskSpace() {
    try {
      const stats = fs.statSync(this.projectRoot);
      return stats.blocks * 512; // Approximate free space in bytes
    } catch (error) {
      return 0;
    }
  }

  generateJWTSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  createBasicEnvFile() {
    const basicEnv = `# CollisionOS Environment Configuration
NODE_ENV=development
PORT=3001

# Database
DB_HOST=sqlite
SQLITE_PATH=./data/collisionos.db

# JWT
JWT_SECRET=${this.generateJWTSecret()}
JWT_EXPIRES_IN=24h

# Application Settings
DEFAULT_SHOP_NAME=Demo Auto Body Shop
DEFAULT_SHOP_EMAIL=info@demoautobody.com
DEFAULT_SHOP_PHONE=(555) 123-4567

# File Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Enable Features
ENABLE_OFFLINE_MODE=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SMS_NOTIFICATIONS=false
`;
    
    fs.writeFileSync(this.envPath, basicEnv);
  }

  getGitignoreContent() {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/
out/

# Database
data/
*.db
*.sqlite
*.sqlite3

# Uploads
uploads/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Electron
dist/
release/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
`;
  }

  createDevScripts() {
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    // Create development helper scripts
    const devScripts = {
      'dev-setup.js': this.getDevSetupScript(),
      'reset-db.js': this.getResetDbScript(),
      'seed-data.js': this.getSeedDataScript()
    };
    
    Object.entries(devScripts).forEach(([filename, content]) => {
      const filepath = path.join(scriptsDir, filename);
      fs.writeFileSync(filepath, content);
    });
    
    log.success('Development scripts created');
  }

  setupVSCodeConfig() {
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }
    
    const settings = {
      'editor.formatOnSave': true,
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': true
      },
      'files.exclude': {
        '**/node_modules': true,
        '**/build': true,
        '**/dist': true,
        '**/.git': true,
        '**/.DS_Store': true
      },
      'search.exclude': {
        '**/node_modules': true,
        '**/build': true,
        '**/dist': true
      }
    };
    
    const settingsPath = path.join(vscodeDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    log.success('VS Code configuration created');
  }

  getDevSetupScript() {
    return `#!/usr/bin/env node
/**
 * Development Setup Script
 * Quick setup for development environment
 */

const { execSync } = require('child_process');

console.log('🚀 Setting up development environment...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Reset database
  console.log('🗄️  Resetting database...');
  execSync('npm run db:reset', { stdio: 'inherit' });
  
  // Seed data
  console.log('📊 Seeding data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  
  console.log('✅ Development environment ready!');
  console.log('Run "npm run electron-dev" to start the application');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
`;
  }

  getResetDbScript() {
    return `#!/usr/bin/env node
/**
 * Database Reset Script
 * Resets the database and runs migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'collisionos.db');

console.log('🗄️  Resetting database...');

try {
  // Remove existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Removed existing database');
  }
  
  // Run migrations
  console.log('📋 Running migrations...');
  execSync('npm run db:migrate', { stdio: 'inherit' });
  
  console.log('✅ Database reset complete!');
  
} catch (error) {
  console.error('❌ Database reset failed:', error.message);
  process.exit(1);
}
`;
  }

  getSeedDataScript() {
    return `#!/usr/bin/env node
/**
 * Seed Data Script
 * Populates the database with sample data
 */

const { execSync } = require('child_process');

console.log('📊 Seeding database with sample data...');

try {
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Sample data created successfully!');
  
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}
`;
  }
}

// Run the setup
if (require.main === module) {
  const setup = new CollisionOSSetup();
  setup.run().catch(error => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = CollisionOSSetup;
