/**
 * Data Encryption and Compliance Middleware
 * 
 * Implements enterprise-grade data protection:
 * - Field-level encryption for PII
 * - GDPR compliance features
 * - Data retention policies
 * - Audit logging
 * - Right to be forgotten
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for data encryption');
}

/**
 * Generate a random IV for each encryption operation
 */
const generateIV = () => {
  return crypto.randomBytes(16);
};

/**
 * Encrypt sensitive data
 */
const encrypt = (text) => {
  if (!text) return text;
  
  const iv = generateIV();
  const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('CollisionOS', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV + AuthTag + EncryptedData
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('CollisionOS', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
};

/**
 * Fields that require encryption (PII)
 */
const ENCRYPTED_FIELDS = {
  customers: ['email', 'phone', 'address', 'city', 'state', 'zipCode', 'ssn', 'driversLicense'],
  users: ['email', 'phone', 'address'],
  vehicles: ['vin'], // VIN is considered PII
  insurance_claims: ['claimNumber', 'adjusterName', 'adjusterPhone', 'adjusterEmail'],
  repair_orders: ['notes'], // May contain sensitive information
  payments: ['cardNumber', 'cardHolderName', 'billingAddress'],
  documents: ['content'] // Document content may be sensitive
};

/**
 * Encrypt sensitive fields in an object
 */
const encryptSensitiveFields = (data, tableName) => {
  if (!data || typeof data !== 'object') return data;
  
  const encryptedData = { ...data };
  const fieldsToEncrypt = ENCRYPTED_FIELDS[tableName] || [];
  
  fieldsToEncrypt.forEach(field => {
    if (encryptedData[field] && typeof encryptedData[field] === 'string') {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  });
  
  return encryptedData;
};

/**
 * Decrypt sensitive fields in an object
 */
const decryptSensitiveFields = (data, tableName) => {
  if (!data || typeof data !== 'object') return data;
  
  const decryptedData = { ...data };
  const fieldsToDecrypt = ENCRYPTED_FIELDS[tableName] || [];
  
  fieldsToDecrypt.forEach(field => {
    if (decryptedData[field] && typeof decryptedData[field] === 'string') {
      decryptedData[field] = decrypt(decryptedData[field]);
    }
  });
  
  return decryptedData;
};

/**
 * Audit logging for data access and modifications
 */
const auditLog = async (action, tableName, recordId, userId, shopId, details = {}) => {
  try {
    const auditEntry = {
      action,
      table_name: tableName,
      record_id: recordId,
      user_id: userId,
      shop_id: shopId,
      details: JSON.stringify(details),
      ip_address: details.ipAddress || null,
      user_agent: details.userAgent || null,
      timestamp: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditEntry);
    
    if (error) {
      console.error('Audit logging failed:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

/**
 * Data retention policy enforcement
 */
const enforceDataRetention = async (tableName, recordId, retentionDays = 2555) => { // 7 years default
  try {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);
    
    // Check if record should be deleted
    const { data: record } = await supabase
      .from(tableName)
      .select('created_at')
      .eq('id', recordId)
      .single();
    
    if (record && new Date(record.created_at) < retentionDate) {
      // Log the deletion
      await auditLog('DATA_RETENTION_DELETE', tableName, recordId, 'system', null, {
        reason: 'Data retention policy',
        retentionDays,
        createdDate: record.created_at
      });
      
      // Delete the record
      await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Data retention enforcement failed:', error);
    return false;
  }
};

/**
 * GDPR Right to be Forgotten implementation
 */
const rightToBeForgotten = async (userId, shopId) => {
  try {
    const tables = ['customers', 'users', 'vehicles', 'insurance_claims', 'repair_orders'];
    
    for (const table of tables) {
      // Find all records related to the user
      const { data: records } = await supabase
        .from(table)
        .select('id')
        .eq('shop_id', shopId)
        .or(`customer_id.eq.${userId},user_id.eq.${userId}`);
      
      if (records) {
        for (const record of records) {
          // Anonymize instead of delete for business continuity
          await anonymizeRecord(table, record.id);
        }
      }
    }
    
    // Log the GDPR request
    await auditLog('GDPR_RIGHT_TO_BE_FORGOTTEN', 'users', userId, userId, shopId, {
      requestType: 'GDPR',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('GDPR right to be forgotten failed:', error);
    return false;
  }
};

/**
 * Anonymize a record instead of deleting it
 */
const anonymizeRecord = async (tableName, recordId) => {
  try {
    const anonymizationData = {
      // Customer anonymization
      first_name: 'ANONYMIZED',
      last_name: 'ANONYMIZED',
      email: 'anonymized@deleted.com',
      phone: '000-000-0000',
      address: 'ANONYMIZED',
      city: 'ANONYMIZED',
      state: 'ANONYMIZED',
      zip_code: '00000',
      ssn: '000-00-0000',
      drivers_license: 'ANONYMIZED',
      
      // Vehicle anonymization
      vin: 'ANONYMIZED',
      plate: 'ANONYMIZED',
      
      // General anonymization
      notes: 'ANONYMIZED - GDPR REQUEST',
      is_anonymized: true,
      anonymized_at: new Date().toISOString()
    };
    
    // Only update fields that exist in the table
    const { data: existingRecord } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (existingRecord) {
      const updateData = {};
      Object.keys(anonymizationData).forEach(key => {
        if (existingRecord.hasOwnProperty(key)) {
          updateData[key] = anonymizationData[key];
        }
      });
      
      await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', recordId);
    }
    
    return true;
  } catch (error) {
    console.error('Record anonymization failed:', error);
    return false;
  }
};

/**
 * GDPR Data Export functionality
 */
const exportUserData = async (userId, shopId) => {
  try {
    const exportData = {
      user_id: userId,
      shop_id: shopId,
      export_timestamp: new Date().toISOString(),
      data: {}
    };
    
    // Export data from all relevant tables
    const tables = ['customers', 'vehicles', 'insurance_claims', 'repair_orders', 'payments'];
    
    for (const table of tables) {
      const { data: records } = await supabase
        .from(table)
        .select('*')
        .eq('shop_id', shopId)
        .or(`customer_id.eq.${userId},user_id.eq.${userId}`);
      
      if (records) {
        // Decrypt sensitive fields before export
        exportData.data[table] = records.map(record => 
          decryptSensitiveFields(record, table)
        );
      }
    }
    
    // Log the export
    await auditLog('GDPR_DATA_EXPORT', 'users', userId, userId, shopId, {
      exportTimestamp: exportData.export_timestamp,
      tablesExported: Object.keys(exportData.data)
    });
    
    return exportData;
  } catch (error) {
    console.error('GDPR data export failed:', error);
    return null;
  }
};

/**
 * Middleware to automatically encrypt/decrypt data
 */
const encryptionMiddleware = (tableName) => {
  return async (req, res, next) => {
    // Encrypt data before saving
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      req.body = encryptSensitiveFields(req.body, tableName);
    }
    
    // Decrypt data before sending response
    const originalJson = res.json;
    res.json = function(data) {
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          data = data.map(item => decryptSensitiveFields(item, tableName));
        } else {
          data = decryptSensitiveFields(data, tableName);
        }
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Data breach notification system
 */
const notifyDataBreach = async (breachDetails) => {
  try {
    // Log the breach
    await auditLog('DATA_BREACH', 'system', 'system', 'system', null, breachDetails);
    
    // TODO: Implement actual notification system
    // - Email notifications to administrators
    // - Regulatory notifications if required
    // - Customer notifications if PII affected
    
    console.error('DATA BREACH DETECTED:', breachDetails);
    
    return true;
  } catch (error) {
    console.error('Data breach notification failed:', error);
    return false;
  }
};

module.exports = {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  auditLog,
  enforceDataRetention,
  rightToBeForgotten,
  anonymizeRecord,
  exportUserData,
  encryptionMiddleware,
  notifyDataBreach,
  ENCRYPTED_FIELDS
};
