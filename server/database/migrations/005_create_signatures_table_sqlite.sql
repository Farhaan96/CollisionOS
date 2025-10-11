-- =====================================================
-- DIGITAL SIGNATURE SYSTEM MIGRATION (SQLite)
-- Phase 2: Customer Experience Enhancement
-- =====================================================
-- Created: 2025-01-10
-- Converted from PostgreSQL to SQLite
-- Purpose: Digital signature capture and verification
-- Dependencies: None (standalone table)
-- =====================================================

-- Create signatures table
CREATE TABLE IF NOT EXISTS signatures (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Document association
  documentType TEXT NOT NULL CHECK(documentType IN (
    'repair_order',
    'estimate',
    'invoice',
    'work_authorization',
    'parts_authorization',
    'delivery_receipt',
    'pickup_receipt',
    'inspection_report',
    'customer_agreement',
    'vehicle_condition',
    'loaner_agreement',
    'general'
  )),
  documentId TEXT NOT NULL,

  -- Signature field metadata
  signatureFieldName TEXT NOT NULL,

  -- Signature data
  signatureData TEXT NOT NULL, -- Base64 encoded PNG
  signatureWidth INTEGER DEFAULT 500,
  signatureHeight INTEGER DEFAULT 200,

  -- Signer information
  signedBy TEXT NOT NULL,
  signerRole TEXT NOT NULL DEFAULT 'customer' CHECK(signerRole IN (
    'customer',
    'technician',
    'estimator',
    'manager',
    'owner',
    'inspector',
    'driver',
    'other'
  )),
  signerEmail TEXT,
  signerPhone TEXT,

  -- Audit trail
  signedAt TEXT NOT NULL DEFAULT (datetime('now')),
  ipAddress TEXT,
  userAgent TEXT,
  geolocation TEXT, -- JSON string with lat/lng

  -- Verification and security
  verificationHash TEXT,
  isVerified INTEGER DEFAULT 1 CHECK(isVerified IN (0, 1)),

  -- Metadata
  consentText TEXT,
  signatureNotes TEXT,

  -- Foreign keys
  shopId TEXT NOT NULL,
  userId TEXT,
  customerId TEXT,
  repairOrderId TEXT,

  -- Soft delete
  deletedAt TEXT,

  -- Timestamps
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),

  -- Foreign key constraints (optional - depends on existing tables)
  -- FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE,
  -- FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  -- FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL,
  -- FOREIGN KEY (repairOrderId) REFERENCES repair_order_management(id) ON DELETE SET NULL

  FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signature_document ON signatures(documentType, documentId);
CREATE INDEX IF NOT EXISTS idx_signature_shop ON signatures(shopId);
CREATE INDEX IF NOT EXISTS idx_signature_ro ON signatures(repairOrderId);
CREATE INDEX IF NOT EXISTS idx_signature_customer ON signatures(customerId);
CREATE INDEX IF NOT EXISTS idx_signature_user ON signatures(userId);
CREATE INDEX IF NOT EXISTS idx_signature_signed_at ON signatures(signedAt);
CREATE INDEX IF NOT EXISTS idx_signature_deleted_at ON signatures(deletedAt);

-- Unique constraint for signature fields (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_signature_unique_field
ON signatures(documentType, documentId, signatureFieldName, signedAt)
WHERE deletedAt IS NULL;

-- Trigger to update updatedAt timestamp
CREATE TRIGGER IF NOT EXISTS trigger_signatures_updated_at
AFTER UPDATE ON signatures
FOR EACH ROW
BEGIN
  UPDATE signatures SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Sample signature for testing (uncomment if needed)
/*
INSERT INTO signatures (
  id,
  documentType,
  documentId,
  signatureFieldName,
  signatureData,
  signatureWidth,
  signatureHeight,
  signedBy,
  signerRole,
  signerEmail,
  signerPhone,
  shopId,
  verificationHash,
  isVerified,
  consentText,
  signedAt
) VALUES (
  lower(hex(randomblob(16))),
  'repair_order',
  'sample-ro-id',
  'Customer Authorization',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  500,
  200,
  'John Smith',
  'customer',
  'john.smith@example.com',
  '(555) 123-4567',
  '550e8400-e29b-41d4-a716-446655440000',
  'sample-hash',
  1,
  'I authorize the repair work as outlined in the estimate.',
  datetime('now')
);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 'Signatures table created successfully' as status;

-- Count signatures (should be 0 initially)
SELECT COUNT(*) as signature_count FROM signatures;

-- Show table schema
PRAGMA table_info(signatures);

-- Show indexes
SELECT name, sql FROM sqlite_master
WHERE type = 'index' AND tbl_name = 'signatures';
