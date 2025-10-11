#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Comprehensive security audit for CollisionOS:
 * - Scans for authentication bypasses
 * - Identifies missing input validation
 * - Checks for SQL injection vulnerabilities
 * - Validates environment variable security
 * - Audits file upload security
 * - Checks for XSS vulnerabilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.warnings = [];
    this.recommendations = [];
    this.auditResults = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      warnings: [],
      recommendations: [],
      securityScore: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  addVulnerability(severity, category, file, line, description, fix) {
    this.vulnerabilities.push({
      severity,
      category,
      file,
      line,
      description,
      fix,
      timestamp: new Date().toISOString()
    });
  }

  addWarning(category, file, line, description, recommendation) {
    this.warnings.push({
      category,
      file,
      line,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    });
  }

  addRecommendation(category, description, priority) {
    this.recommendations.push({
      category,
      description,
      priority,
      timestamp: new Date().toISOString()
    });
  }

  async scanForAuthBypasses() {
    this.log('Scanning for authentication bypasses...');
    
    const routeFiles = this.getRouteFiles();
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for development bypasses
        if (line.includes('NODE_ENV !== \'production\'') && line.includes('req.user')) {
          this.addVulnerability(
            'HIGH',
            'Authentication Bypass',
            file,
            lineNum,
            'Development authentication bypass detected',
            'Remove development bypasses and enforce proper authentication'
          );
        }
        
        // Check for missing authentication
        if (line.includes('router.') && !line.includes('authenticateToken') && !line.includes('authenticate')) {
          if (line.includes('get') || line.includes('post') || line.includes('put') || line.includes('delete')) {
            this.addWarning(
              'Missing Authentication',
              file,
              lineNum,
              'Route may be missing authentication middleware',
              'Add authentication middleware to all protected routes'
            );
          }
        }
        
        // Check for hardcoded secrets
        if (line.includes('jwtSecret ||') || line.includes('JWT_SECRET ||')) {
          this.addVulnerability(
            'CRITICAL',
            'Hardcoded Secrets',
            file,
            lineNum,
            'Hardcoded JWT secret fallback detected',
            'Remove hardcoded secrets and require environment variables'
          );
        }
      });
    }
  }

  async scanForInputValidation() {
    this.log('Scanning for input validation issues...');
    
    const routeFiles = this.getRouteFiles();
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for direct req.body usage without validation
        if (line.includes('req.body.') && !line.includes('validate') && !line.includes('Joi')) {
          this.addWarning(
            'Input Validation',
            file,
            lineNum,
            'Direct req.body usage without validation',
            'Add input validation using Joi schemas'
          );
        }
        
        // Check for SQL injection risks
        if (line.includes('query(') && line.includes('$')) {
          this.addWarning(
            'SQL Injection Risk',
            file,
            lineNum,
            'Raw SQL query with string interpolation',
            'Use parameterized queries to prevent SQL injection'
          );
        }
        
        // Check for XSS vulnerabilities
        if (line.includes('res.json(') && line.includes('req.body')) {
          this.addWarning(
            'XSS Risk',
            file,
            lineNum,
            'User input returned without sanitization',
            'Sanitize user input before returning in responses'
          );
        }
      });
    }
  }

  async scanForFileUploadSecurity() {
    this.log('Scanning for file upload security issues...');
    
    const uploadFiles = this.findFilesWithPattern(/upload|file|multer/i);
    
    for (const file of uploadFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for missing file type validation
        if (line.includes('multer') && !line.includes('fileFilter')) {
          this.addVulnerability(
            'MEDIUM',
            'File Upload Security',
            file,
            lineNum,
            'Missing file type validation',
            'Add fileFilter to validate file types and MIME types'
          );
        }
        
        // Check for missing file size limits
        if (line.includes('multer') && !line.includes('limits')) {
          this.addVulnerability(
            'MEDIUM',
            'File Upload Security',
            file,
            lineNum,
            'Missing file size limits',
            'Add limits to prevent large file uploads'
          );
        }
        
        // Check for unsafe file storage
        if (line.includes('originalname') && !line.includes('path.extname')) {
          this.addWarning(
            'File Upload Security',
            file,
            lineNum,
            'Using original filename may be unsafe',
            'Generate secure filenames to prevent directory traversal'
          );
        }
      });
    }
  }

  async scanForEnvironmentSecurity() {
    this.log('Scanning for environment variable security...');
    
    const envFile = '.env';
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for weak secrets
        if (line.includes('JWT_SECRET=') && line.length < 50) {
          this.addVulnerability(
            'HIGH',
            'Weak Secrets',
            envFile,
            lineNum,
            'JWT secret appears to be weak',
            'Use a strong, randomly generated JWT secret (minimum 32 characters)'
          );
        }
        
        // Check for default values
        if (line.includes('=default') || line.includes('=dev') || line.includes('=test')) {
          this.addWarning(
            'Environment Security',
            envFile,
            lineNum,
            'Default or development value in environment',
            'Use production-ready values for all environment variables'
          );
        }
      });
    }
  }

  async scanForCORSConfiguration() {
    this.log('Scanning for CORS configuration...');
    
    const serverFiles = this.findFilesWithPattern(/server|index|app/i);
    
    for (const file of serverFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for overly permissive CORS
        if (line.includes('cors') && line.includes('origin: true')) {
          this.addVulnerability(
            'MEDIUM',
            'CORS Configuration',
            file,
            lineNum,
            'Overly permissive CORS configuration',
            'Restrict CORS to specific domains'
          );
        }
        
        // Check for missing CORS
        if (line.includes('app.use') && !line.includes('cors')) {
          this.addWarning(
            'CORS Configuration',
            file,
            lineNum,
            'Missing CORS configuration',
            'Add CORS middleware to handle cross-origin requests'
          );
        }
      });
    }
  }

  async scanForRateLimiting() {
    this.log('Scanning for rate limiting configuration...');
    
    const routeFiles = this.getRouteFiles();
    let hasRateLimiting = false;
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('rateLimit') || content.includes('express-rate-limit')) {
        hasRateLimiting = true;
        break;
      }
    }
    
    if (!hasRateLimiting) {
      this.addVulnerability(
        'MEDIUM',
        'Rate Limiting',
        'server/routes/*.js',
        0,
        'Missing rate limiting on API routes',
        'Add rate limiting middleware to prevent abuse'
      );
    }
  }

  async scanForErrorHandling() {
    this.log('Scanning for error handling security...');
    
    const routeFiles = this.getRouteFiles();
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for error information leakage
        if (line.includes('res.status(500)') && line.includes('error.message')) {
          this.addWarning(
            'Error Handling',
            file,
            lineNum,
            'Error message may leak sensitive information',
            'Sanitize error messages in production'
          );
        }
        
        // Check for missing error handling
        if (line.includes('async') && !line.includes('try') && !line.includes('catch')) {
          this.addWarning(
            'Error Handling',
            file,
            lineNum,
            'Async function without error handling',
            'Add try-catch blocks to handle errors gracefully'
          );
        }
      });
    }
  }

  getRouteFiles() {
    const routeDir = path.join(__dirname, '../server/routes');
    const files = fs.readdirSync(routeDir);
    return files
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(routeDir, file));
  }

  findFilesWithPattern(pattern) {
    const files = [];
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    };
    scanDir(path.join(__dirname, '..'));
    return files;
  }

  calculateSecurityScore() {
    const totalIssues = this.vulnerabilities.length + this.warnings.length;
    const criticalIssues = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highIssues = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    
    let score = 100;
    score -= criticalIssues * 20; // Critical issues: -20 points each
    score -= highIssues * 10;     // High issues: -10 points each
    score -= (this.vulnerabilities.length - criticalIssues - highIssues) * 5; // Other vulnerabilities: -5 points each
    score -= this.warnings.length * 2; // Warnings: -2 points each
    
    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations() {
    // Authentication recommendations
    if (this.vulnerabilities.some(v => v.category === 'Authentication Bypass')) {
      this.addRecommendation(
        'Authentication',
        'Remove all development authentication bypasses and enforce proper JWT validation',
        'HIGH'
      );
    }
    
    // Input validation recommendations
    if (this.warnings.some(w => w.category === 'Input Validation')) {
      this.addRecommendation(
        'Input Validation',
        'Implement comprehensive input validation using Joi schemas for all endpoints',
        'HIGH'
      );
    }
    
    // File upload recommendations
    if (this.vulnerabilities.some(v => v.category === 'File Upload Security')) {
      this.addRecommendation(
        'File Upload',
        'Implement secure file upload with type validation, size limits, and secure storage',
        'MEDIUM'
      );
    }
    
    // General security recommendations
    this.addRecommendation(
      'General Security',
      'Implement comprehensive security headers (helmet.js)',
      'MEDIUM'
    );
    
    this.addRecommendation(
      'Monitoring',
      'Set up security monitoring and alerting for suspicious activities',
      'LOW'
    );
  }

  async generateReport() {
    this.auditResults.vulnerabilities = this.vulnerabilities;
    this.auditResults.warnings = this.warnings;
    this.auditResults.recommendations = this.recommendations;
    this.auditResults.securityScore = this.calculateSecurityScore();
    
    const reportPath = path.join(__dirname, '..', 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    
    this.log(`Security audit report saved to: ${reportPath}`);
    
    return this.auditResults;
  }

  async run() {
    try {
      this.log('🔒 Starting CollisionOS Security Audit...\n');
      
      await this.scanForAuthBypasses();
      await this.scanForInputValidation();
      await this.scanForFileUploadSecurity();
      await this.scanForEnvironmentSecurity();
      await this.scanForCORSConfiguration();
      await this.scanForRateLimiting();
      await this.scanForErrorHandling();
      
      this.generateRecommendations();
      const report = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🔒 SECURITY AUDIT RESULTS');
      console.log('='.repeat(80));
      console.log(`🚨 Critical Vulnerabilities: ${report.vulnerabilities.filter(v => v.severity === 'CRITICAL').length}`);
      console.log(`⚠️  High Vulnerabilities: ${report.vulnerabilities.filter(v => v.severity === 'HIGH').length}`);
      console.log(`🔶 Medium Vulnerabilities: ${report.vulnerabilities.filter(v => v.severity === 'MEDIUM').length}`);
      console.log(`📋 Warnings: ${report.warnings.length}`);
      console.log(`📊 Security Score: ${report.securityScore}/100`);
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   [${rec.priority}] ${rec.description}`);
      });
      console.log('='.repeat(80));
      
      if (report.securityScore < 70) {
        this.log('❌ Security audit failed - critical issues need immediate attention', 'error');
        process.exit(1);
      } else if (report.securityScore < 85) {
        this.log('⚠️ Security audit passed with warnings - address issues before production', 'warning');
      } else {
        this.log('✅ Security audit passed - system is secure for production', 'success');
      }
      
    } catch (error) {
      this.log(`❌ Security audit failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run();
}

module.exports = SecurityAuditor;
