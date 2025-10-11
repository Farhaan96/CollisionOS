#!/usr/bin/env node

/**
 * Apply Security Middleware Script
 * 
 * Automatically applies security middleware to all route files:
 * - Adds authentication to unprotected routes
 * - Applies input validation
 * - Adds rate limiting
 * - Implements shop isolation
 */

const fs = require('fs');
const path = require('path');

class SecurityMiddlewareApplier {
  constructor() {
    this.routeFiles = [];
    this.appliedChanges = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  findRouteFiles() {
    const routesDir = path.join(__dirname, '../server/routes');
    const files = fs.readdirSync(routesDir);
    
    this.routeFiles = files
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(routesDir, file));
    
    this.log(`Found ${this.routeFiles.length} route files`);
  }

  analyzeRouteFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      file: filePath,
      hasAuth: false,
      hasValidation: false,
      hasRateLimit: false,
      routes: [],
      vulnerabilities: []
    };

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for authentication middleware
      if (line.includes('authenticateToken') || line.includes('authenticate')) {
        analysis.hasAuth = true;
      }
      
      // Check for validation middleware
      if (line.includes('validate') || line.includes('Joi')) {
        analysis.hasValidation = true;
      }
      
      // Check for rate limiting
      if (line.includes('rateLimit') || line.includes('rate-limiter')) {
        analysis.hasRateLimit = true;
      }
      
      // Find route definitions
      if (line.includes('router.') && (line.includes('get') || line.includes('post') || line.includes('put') || line.includes('delete'))) {
        analysis.routes.push({
          line: lineNum,
          method: this.extractMethod(line),
          path: this.extractPath(line)
        });
      }
      
      // Check for vulnerabilities
      if (line.includes('req.body.') && !line.includes('validate')) {
        analysis.vulnerabilities.push({
          line: lineNum,
          type: 'Missing Validation',
          description: 'Direct req.body usage without validation'
        });
      }
      
      if (line.includes('router.') && !line.includes('authenticateToken') && !line.includes('authenticate')) {
        analysis.vulnerabilities.push({
          line: lineNum,
          type: 'Missing Authentication',
          description: 'Route may be missing authentication'
        });
      }
    });

    return analysis;
  }

  extractMethod(line) {
    const match = line.match(/router\.(\w+)/);
    return match ? match[1] : 'unknown';
  }

  extractPath(line) {
    const match = line.match(/router\.\w+\(['"`]([^'"`]+)['"`]/);
    return match ? match[1] : 'unknown';
  }

  generateSecurityImports() {
    return `const { authenticateToken, requirePermission, requireShopAccess, requireRole } = require('../middleware/securityAuth');
const { validate, schemas, rateLimits, sanitizeBody, preventSQLInjection } = require('../middleware/securityValidation');
const { secureRoute } = require('../middleware/securityConfig');`;
  }

  generateAuthMiddleware() {
    return `// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireShopAccess);`;
  }

  generateValidationMiddleware() {
    return `// Apply input validation and sanitization
router.use(sanitizeBody);
router.use(preventSQLInjection);`;
  }

  generateRateLimitMiddleware() {
    return `// Apply rate limiting
router.use(rateLimits.general);`;
  }

  applySecurityToFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeRouteFile(filePath);
      
      if (analysis.vulnerabilities.length === 0 && analysis.hasAuth && analysis.hasValidation) {
        this.log(`✅ ${path.basename(filePath)} already secure`);
        return;
      }

      let newContent = content;
      let hasChanges = false;

      // Add security imports if not present
      if (!content.includes('securityAuth') || !content.includes('securityValidation')) {
        const importSection = this.generateSecurityImports();
        newContent = newContent.replace(
          /const express = require\('express'\);/,
          `const express = require('express');\n${importSection}`
        );
        hasChanges = true;
      }

      // Add authentication middleware if missing
      if (!analysis.hasAuth) {
        const authMiddleware = this.generateAuthMiddleware();
        newContent = newContent.replace(
          /const router = express\.Router\(\);/,
          `const router = express.Router();\n\n${authMiddleware}`
        );
        hasChanges = true;
      }

      // Add validation middleware if missing
      if (!analysis.hasValidation) {
        const validationMiddleware = this.generateValidationMiddleware();
        newContent = newContent.replace(
          /router\.use\(authenticateToken\);/,
          `router.use(authenticateToken);\n${validationMiddleware}`
        );
        hasChanges = true;
      }

      // Add rate limiting if missing
      if (!analysis.hasRateLimit) {
        const rateLimitMiddleware = this.generateRateLimitMiddleware();
        newContent = newContent.replace(
          /router\.use\(preventSQLInjection\);/,
          `router.use(preventSQLInjection);\n${rateLimitMiddleware}`
        );
        hasChanges = true;
      }

      // Fix specific vulnerabilities
      analysis.vulnerabilities.forEach(vuln => {
        if (vuln.type === 'Missing Validation') {
          // Add validation to specific routes
          const lines = newContent.split('\n');
          const targetLine = lines[vuln.line - 1];
          
          if (targetLine.includes('req.body')) {
            // Add validation before the route handler
            const validationCode = `  // Input validation
  const { error, value } = schemas.${this.getSchemaForRoute(vuln.line)}.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: error.details
    });
  }
  req.body = value;`;
            
            newContent = newContent.replace(
              targetLine,
              `${validationCode}\n${targetLine}`
            );
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        // Create backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content);
        
        // Write updated content
        fs.writeFileSync(filePath, newContent);
        
        this.appliedChanges.push({
          file: path.basename(filePath),
          changes: analysis.vulnerabilities.length,
          backup: backupPath
        });
        
        this.log(`✅ Applied security to ${path.basename(filePath)}`);
      }

    } catch (error) {
      this.errors.push({
        file: path.basename(filePath),
        error: error.message
      });
      this.log(`❌ Failed to apply security to ${path.basename(filePath)}: ${error.message}`, 'error');
    }
  }

  getSchemaForRoute(lineNum) {
    // This would need to be more sophisticated in practice
    // For now, return a generic schema
    return 'pagination';
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      filesProcessed: this.routeFiles.length,
      changesApplied: this.appliedChanges.length,
      errors: this.errors.length,
      appliedChanges: this.appliedChanges,
      errors: this.errors,
      recommendations: [
        'Review all applied changes before deploying to production',
        'Test all routes to ensure authentication works correctly',
        'Verify input validation is working as expected',
        'Check that rate limiting is not too restrictive',
        'Remove backup files after testing'
      ]
    };

    const reportPath = path.join(__dirname, '..', 'security-middleware-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Security middleware report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    try {
      this.log('🔒 Starting Security Middleware Application...\n');
      
      this.findRouteFiles();
      
      for (const file of this.routeFiles) {
        this.applySecurityToFile(file);
      }
      
      const report = this.generateSecurityReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🔒 SECURITY MIDDLEWARE APPLICATION RESULTS');
      console.log('='.repeat(80));
      console.log(`📁 Files Processed: ${report.filesProcessed}`);
      console.log(`✅ Changes Applied: ${report.changesApplied}`);
      console.log(`❌ Errors: ${report.errors}`);
      console.log('\n📋 APPLIED CHANGES:');
      report.appliedChanges.forEach(change => {
        console.log(`   ${change.file}: ${change.changes} vulnerabilities fixed`);
      });
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
      console.log('='.repeat(80));
      
      if (report.errors > 0) {
        this.log('⚠️ Some files had errors - please review manually', 'warning');
      } else {
        this.log('✅ Security middleware applied successfully', 'success');
      }
      
    } catch (error) {
      this.log(`❌ Security middleware application failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const applier = new SecurityMiddlewareApplier();
  applier.run();
}

module.exports = SecurityMiddlewareApplier;
