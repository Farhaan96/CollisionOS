const express = require('express');
const router = express.Router();
const { Signature, RepairOrderManagement, Customer, User, Shop } = require('../database/models');
const crypto = require('crypto');

/**
 * Signature API Routes
 * Handles digital signature capture, retrieval, and verification
 */

/**
 * @route   POST /api/signatures
 * @desc    Create a new digital signature
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
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
      userId,
      customerId,
      repairOrderId,
      consentText,
      signatureNotes,
      geolocation,
    } = req.body;

    // Validation
    if (!documentType || !documentId || !signatureFieldName || !signatureData || !signedBy || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentType, documentId, signatureFieldName, signatureData, signedBy, shopId',
      });
    }

    // Validate signature data format (should be base64 PNG)
    if (!signatureData.startsWith('data:image/png;base64,')) {
      return res.status(400).json({
        success: false,
        error: 'Signature data must be a base64-encoded PNG image',
      });
    }

    // Check for duplicate signature (same field on same document)
    const existingSignature = await Signature.findOne({
      where: {
        documentType,
        documentId,
        signatureFieldName,
      },
      paranoid: true,
    });

    if (existingSignature) {
      return res.status(409).json({
        success: false,
        error: 'A signature already exists for this document field. Signatures are immutable.',
        existingSignature: {
          id: existingSignature.id,
          signedBy: existingSignature.signedBy,
          signedAt: existingSignature.signedAt,
        },
      });
    }

    // Create verification hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(signatureData)
      .digest('hex');

    // Extract IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create signature
    const signature = await Signature.create({
      documentType,
      documentId,
      signatureFieldName,
      signatureData,
      signatureWidth: signatureWidth || 500,
      signatureHeight: signatureHeight || 200,
      signedBy,
      signerRole: signerRole || 'customer',
      signerEmail,
      signerPhone,
      shopId,
      userId,
      customerId,
      repairOrderId,
      consentText,
      signatureNotes,
      geolocation: geolocation || null,
      verificationHash,
      isVerified: true,
      ipAddress,
      userAgent,
      signedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Signature captured successfully',
      data: {
        id: signature.id,
        documentType: signature.documentType,
        documentId: signature.documentId,
        signatureFieldName: signature.signatureFieldName,
        signedBy: signature.signedBy,
        signerRole: signature.signerRole,
        signedAt: signature.signedAt,
        isVerified: signature.isVerified,
      },
    });
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create signature',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/signatures/:documentType/:documentId
 * @desc    Get all signatures for a document
 * @access  Private
 */
router.get('/:documentType/:documentId', async (req, res) => {
  try {
    const { documentType, documentId } = req.params;
    const { includeData } = req.query;

    const signatures = await Signature.findAll({
      where: {
        documentType,
        documentId,
      },
      attributes: includeData === 'true'
        ? undefined // Include all fields
        : { exclude: ['signatureData', 'verificationHash', 'userAgent'] }, // Exclude large fields
      order: [['signedAt', 'ASC']],
    });

    res.json({
      success: true,
      count: signatures.length,
      data: signatures,
    });
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signatures',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/signatures/:id
 * @desc    Get a specific signature by ID (with full data)
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const signature = await Signature.findByPk(id);

    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'Signature not found',
      });
    }

    res.json({
      success: true,
      data: signature,
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signature',
      details: error.message,
    });
  }
});

/**
 * @route   POST /api/signatures/:id/verify
 * @desc    Verify signature integrity
 * @access  Private
 */
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;

    const signature = await Signature.findByPk(id);

    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'Signature not found',
      });
    }

    // Recalculate hash
    const currentHash = crypto
      .createHash('sha256')
      .update(signature.signatureData)
      .digest('hex');

    const isValid = currentHash === signature.verificationHash;

    res.json({
      success: true,
      data: {
        id: signature.id,
        isValid,
        originalHash: signature.verificationHash,
        currentHash,
        signedBy: signature.signedBy,
        signedAt: signature.signedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify signature',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/signatures/repair-order/:roId
 * @desc    Get all signatures for a repair order
 * @access  Private
 */
router.get('/repair-order/:roId', async (req, res) => {
  try {
    const { roId } = req.params;
    const { includeData } = req.query;

    const signatures = await Signature.findAll({
      where: {
        repairOrderId: roId,
      },
      attributes: includeData === 'true'
        ? undefined
        : { exclude: ['signatureData', 'verificationHash', 'userAgent'] },
      order: [['signedAt', 'DESC']],
    });

    res.json({
      success: true,
      count: signatures.length,
      data: signatures,
    });
  } catch (error) {
    console.error('Error fetching RO signatures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repair order signatures',
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/signatures/:id
 * @desc    Soft delete a signature (admin only)
 * @access  Private (admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const signature = await Signature.findByPk(id);

    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'Signature not found',
      });
    }

    // Soft delete (paranoid mode)
    await signature.destroy();

    // Log deletion reason if provided
    if (reason) {
      await signature.update({
        signatureNotes: `${signature.signatureNotes || ''}\n[DELETED] ${reason}`,
      });
    }

    res.json({
      success: true,
      message: 'Signature soft deleted successfully',
      data: {
        id: signature.id,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete signature',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/signatures/customer/:customerId
 * @desc    Get all signatures for a customer
 * @access  Private
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const signatures = await Signature.findAll({
      where: {
        customerId,
      },
      attributes: { exclude: ['signatureData', 'verificationHash', 'userAgent'] },
      order: [['signedAt', 'DESC']],
    });

    res.json({
      success: true,
      count: signatures.length,
      data: signatures,
    });
  } catch (error) {
    console.error('Error fetching customer signatures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer signatures',
      details: error.message,
    });
  }
});

module.exports = router;
