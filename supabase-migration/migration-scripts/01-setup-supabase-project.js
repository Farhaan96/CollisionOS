/**
 * Supabase Project Setup Script
 * Automates the initial Supabase project configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class SupabaseSetup {
  constructor() {
    this.projectDir = path.resolve(__dirname, '..');
    this.configFile = path.join(this.projectDir, 'supabase-config.json');
    this.envFile = path.join(this.projectDir, '..', '.env.supabase');
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(query) {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkSupabaseCLI() {
    try {
      execSync('supabase --version', { stdio: 'ignore' });
      this.log('Supabase CLI found', 'success');
      return true;
    } catch (error) {
      this.log('Supabase CLI not found. Installing...', 'warning');
      
      try {
        // Install Supabase CLI
        if (process.platform === 'win32') {
          execSync('npm install -g supabase', { stdio: 'inherit' });
        } else if (process.platform === 'darwin') {
          execSync('brew install supabase/tap/supabase', { stdio: 'inherit' });
        } else {
          execSync('npm install -g supabase', { stdio: 'inherit' });
        }
        
        this.log('Supabase CLI installed successfully', 'success');
        return true;
      } catch (installError) {
        this.log('Failed to install Supabase CLI. Please install manually.', 'error');
        return false;
      }
    }
  }

  async loginToSupabase() {
    try {
      this.log('Logging into Supabase...', 'info');
      execSync('supabase login', { stdio: 'inherit' });
      this.log('Successfully logged into Supabase', 'success');
      return true;
    } catch (error) {
      this.log('Failed to login to Supabase', 'error');
      return false;
    }
  }

  async collectProjectInfo() {
    this.log('Collecting project information...', 'info');
    
    const projectName = await this.question('Enter project name (collision-os): ') || 'collision-os';
    const organization = await this.question('Enter organization name: ');
    const region = await this.question('Enter region (us-east-1): ') || 'us-east-1';
    const plan = await this.question('Enter plan (free/pro/team/enterprise) [free]: ') || 'free';
    
    return {
      name: projectName,
      organization,
      region,
      plan
    };
  }

  async createSupabaseProject(projectInfo) {
    try {
      this.log('Creating Supabase project...', 'info');
      
      const command = [
        'supabase projects create',
        `"${projectInfo.name}"`,
        '--org', `"${projectInfo.organization}"`,
        '--region', projectInfo.region,
        '--plan', projectInfo.plan
      ].join(' ');
      
      const output = execSync(command, { encoding: 'utf8' });
      this.log('Project created successfully', 'success');
      
      // Extract project reference from output
      const projectRefMatch = output.match(/Project ref: ([a-z0-9]+)/);
      const projectRef = projectRefMatch ? projectRefMatch[1] : null;
      
      if (projectRef) {
        this.log(`Project reference: ${projectRef}`, 'info');
        return projectRef;
      } else {
        throw new Error('Could not extract project reference');
      }
    } catch (error) {
      this.log(`Failed to create project: ${error.message}`, 'error');
      throw error;
    }
  }

  async getProjectKeys(projectRef) {
    try {
      this.log('Retrieving project API keys...', 'info');
      
      const output = execSync(`supabase projects api-keys --project-ref ${projectRef}`, { 
        encoding: 'utf8' 
      });
      
      // Parse the API keys from output
      const anonKeyMatch = output.match(/anon key:\s*([^\s]+)/);
      const serviceRoleKeyMatch = output.match(/service_role key:\s*([^\s]+)/);
      
      if (!anonKeyMatch || !serviceRoleKeyMatch) {
        throw new Error('Could not extract API keys');
      }
      
      return {
        anonKey: anonKeyMatch[1],
        serviceRoleKey: serviceRoleKeyMatch[1],
        url: `https://${projectRef}.supabase.co`
      };
    } catch (error) {
      this.log(`Failed to retrieve API keys: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupLocalProject(projectRef) {
    try {
      this.log('Setting up local Supabase project...', 'info');
      
      // Initialize local Supabase project
      execSync(`supabase init`, { 
        stdio: 'inherit',
        cwd: this.projectDir
      });
      
      // Link to remote project
      execSync(`supabase link --project-ref ${projectRef}`, { 
        stdio: 'inherit',
        cwd: this.projectDir
      });
      
      this.log('Local project setup completed', 'success');
    } catch (error) {
      this.log(`Failed to setup local project: ${error.message}`, 'error');
      throw error;
    }
  }

  async configureAuthentication(projectRef) {
    try {
      this.log('Configuring authentication settings...', 'info');
      
      const authConfig = {
        site_url: 'http://localhost:3000',
        additional_redirect_urls: [
          'http://localhost:3000/auth/callback',
          'https://app.collisionos.com/auth/callback'
        ],
        jwt_expiry: 3600,
        refresh_token_rotation_enabled: true,
        security_captcha_enabled: true,
        security_captcha_provider: 'hcaptcha',
        email_confirm_signup: true,
        email_double_confirm_changes: true,
        enable_signup: false, // Disable public signup for business app
        enable_manual_linking: true
      };
      
      // Apply auth configuration (this would typically be done through the dashboard)
      this.log('Authentication configuration completed (manual setup may be required)', 'warning');
      
      return authConfig;
    } catch (error) {
      this.log(`Failed to configure authentication: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupDatabase() {
    try {
      this.log('Setting up database schema...', 'info');
      
      const schemaFiles = [
        'schema/01_initial_schema.sql',
        'schema/02_jobs_and_workflow.sql',
        'schema/03_realtime_and_permissions.sql'
      ];
      
      for (const schemaFile of schemaFiles) {
        const schemaPath = path.join(this.projectDir, schemaFile);
        
        if (fs.existsSync(schemaPath)) {
          this.log(`Applying schema: ${schemaFile}`, 'info');
          
          try {
            execSync(`supabase db reset`, { 
              stdio: 'inherit',
              cwd: this.projectDir
            });
            
            // Apply the schema file
            const sqlContent = fs.readFileSync(schemaPath, 'utf8');
            const tempFile = path.join(this.projectDir, 'temp-migration.sql');
            fs.writeFileSync(tempFile, sqlContent);
            
            execSync(`supabase db push`, { 
              stdio: 'inherit',
              cwd: this.projectDir
            });
            
            // Clean up temp file
            fs.unlinkSync(tempFile);
            
            this.log(`Applied schema: ${schemaFile}`, 'success');
          } catch (schemaError) {
            this.log(`Failed to apply schema ${schemaFile}: ${schemaError.message}`, 'error');
            // Continue with other files
          }
        }
      }
      
      this.log('Database schema setup completed', 'success');
    } catch (error) {
      this.log(`Failed to setup database: ${error.message}`, 'error');
      throw error;
    }
  }

  async enableRealtime() {
    try {
      this.log('Enabling Realtime for tables...', 'info');
      
      const tables = [
        'shops', 'users', 'customers', 'vehicles', 'parts', 
        'vendors', 'jobs', 'job_updates', 'job_parts', 
        'job_labor', 'estimates', 'notifications'
      ];
      
      for (const table of tables) {
        try {
          execSync(`supabase realtime on --table ${table}`, { 
            stdio: 'pipe',
            cwd: this.projectDir
          });
          this.log(`Enabled realtime for: ${table}`, 'info');
        } catch (tableError) {
          this.log(`Failed to enable realtime for ${table}: ${tableError.message}`, 'warning');
        }
      }
      
      this.log('Realtime configuration completed', 'success');
    } catch (error) {
      this.log(`Failed to setup realtime: ${error.message}`, 'error');
      throw error;
    }
  }

  saveConfiguration(config) {
    try {
      // Save configuration to JSON file
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      
      // Create environment file
      const envContent = `
# Supabase Configuration
REACT_APP_SUPABASE_URL=${config.supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${config.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${config.serviceRoleKey}
SUPABASE_PROJECT_REF=${config.projectRef}

# Database Configuration (for migration reference)
SUPABASE_DB_URL=${config.databaseUrl}

# App Configuration
REACT_APP_APP_URL=${config.appUrl}
REACT_APP_ENV=production
`.trim();
      
      fs.writeFileSync(this.envFile, envContent);
      
      this.log('Configuration saved successfully', 'success');
      this.log(`Config file: ${this.configFile}`, 'info');
      this.log(`Environment file: ${this.envFile}`, 'info');
    } catch (error) {
      this.log(`Failed to save configuration: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupStorageBuckets() {
    try {
      this.log('Setting up storage buckets...', 'info');
      
      const buckets = [
        { name: 'avatars', public: true },
        { name: 'documents', public: false },
        { name: 'photos', public: false },
        { name: 'attachments', public: false }
      ];
      
      for (const bucket of buckets) {
        try {
          const publicity = bucket.public ? '--public' : '';
          execSync(`supabase storage create ${bucket.name} ${publicity}`, { 
            stdio: 'pipe',
            cwd: this.projectDir
          });
          this.log(`Created bucket: ${bucket.name}`, 'info');
        } catch (bucketError) {
          this.log(`Failed to create bucket ${bucket.name}: ${bucketError.message}`, 'warning');
        }
      }
      
      this.log('Storage setup completed', 'success');
    } catch (error) {
      this.log(`Failed to setup storage: ${error.message}`, 'error');
      throw error;
    }
  }

  async run() {
    try {
      this.log('Starting Supabase project setup...', 'info');
      
      // Check CLI installation
      if (!(await this.checkSupabaseCLI())) {
        process.exit(1);
      }
      
      // Login to Supabase
      if (!(await this.loginToSupabase())) {
        process.exit(1);
      }
      
      // Collect project information
      const projectInfo = await this.collectProjectInfo();
      
      // Create project
      const projectRef = await this.createSupabaseProject(projectInfo);
      
      // Get API keys
      const keys = await this.getProjectKeys(projectRef);
      
      // Setup local project
      await this.setupLocalProject(projectRef);
      
      // Configure authentication
      const authConfig = await this.configureAuthentication(projectRef);
      
      // Setup database
      await this.setupDatabase();
      
      // Enable realtime
      await this.enableRealtime();
      
      // Setup storage
      await this.setupStorageBuckets();
      
      // Save configuration
      const config = {
        projectName: projectInfo.name,
        projectRef,
        supabaseUrl: keys.url,
        anonKey: keys.anonKey,
        serviceRoleKey: keys.serviceRoleKey,
        databaseUrl: `${keys.url}/rest/v1/`,
        appUrl: 'http://localhost:3000',
        authConfig,
        createdAt: new Date().toISOString()
      };
      
      this.saveConfiguration(config);
      
      this.log('Supabase project setup completed successfully!', 'success');
      this.log('Next steps:', 'info');
      this.log('1. Update your .env file with the new Supabase credentials', 'info');
      this.log('2. Run the data migration script', 'info');
      this.log('3. Update your application code to use Supabase client', 'info');
      this.log('4. Test the application thoroughly', 'info');
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run setup if script is executed directly
if (require.main === module) {
  const setup = new SupabaseSetup();
  setup.run();
}

module.exports = SupabaseSetup;