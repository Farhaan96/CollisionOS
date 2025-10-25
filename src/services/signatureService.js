import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

/**
 * Signature Service
 * Handles all API calls related to digital signatures
 */

/**
 * Create a new digital signature
 * @param {Object} signatureData - Signature data object
 * @returns {Promise<Object>} API response
 */
export const createSignature = async (signatureData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signatures`, signatureData);
    return response.data;
  } catch (error) {
    console.error('Error creating signature:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all signatures for a document
 * @param {string} documentType - Type of document
 * @param {string} documentId - ID of document
 * @param {boolean} includeData - Include signature image data (default: false)
 * @returns {Promise<Object>} API response with signatures array
 */
export const getDocumentSignatures = async (documentType, documentId, includeData = false) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/signatures/${documentType}/${documentId}`,
      {
        params: { includeData: includeData ? 'true' : 'false' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching document signatures:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get a specific signature by ID
 * @param {string} signatureId - Signature ID
 * @returns {Promise<Object>} API response with signature data
 */
export const getSignature = async (signatureId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/signatures/${signatureId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching signature:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all signatures for a repair order
 * @param {string} roId - Repair order ID
 * @param {boolean} includeData - Include signature image data (default: false)
 * @returns {Promise<Object>} API response with signatures array
 */
export const getRepairOrderSignatures = async (roId, includeData = false) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/signatures/repair-order/${roId}`,
      {
        params: { includeData: includeData ? 'true' : 'false' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching repair order signatures:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all signatures for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} API response with signatures array
 */
export const getCustomerSignatures = async (customerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/signatures/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer signatures:', error);
    throw error.response?.data || error;
  }
};

/**
 * Verify signature integrity
 * @param {string} signatureId - Signature ID
 * @returns {Promise<Object>} API response with verification result
 */
export const verifySignature = async (signatureId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signatures/${signatureId}/verify`);
    return response.data;
  } catch (error) {
    console.error('Error verifying signature:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete a signature (soft delete, admin only)
 * @param {string} signatureId - Signature ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} API response
 */
export const deleteSignature = async (signatureId, reason = null) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/signatures/${signatureId}`, {
      data: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting signature:', error);
    throw error.response?.data || error;
  }
};

/**
 * Helper: Create signature for repair order
 * @param {Object} params - Parameters
 * @param {string} params.roId - Repair order ID
 * @param {string} params.fieldName - Signature field name
 * @param {string} params.signatureData - Base64 signature data
 * @param {string} params.signedBy - Name of signer
 * @param {string} params.signerRole - Role of signer
 * @param {string} params.shopId - Shop ID
 * @param {Object} params.additional - Additional optional fields
 * @returns {Promise<Object>} API response
 */
export const createRepairOrderSignature = async ({
  roId,
  fieldName,
  signatureData,
  width,
  height,
  signedBy,
  signerRole = 'customer',
  shopId,
  customerId = null,
  userId = null,
  signerEmail = null,
  signerPhone = null,
  consentText = null,
  signatureNotes = null,
}) => {
  return createSignature({
    documentType: 'repair_order',
    documentId: roId,
    signatureFieldName: fieldName,
    signatureData,
    signatureWidth: width,
    signatureHeight: height,
    signedBy,
    signerRole,
    signerEmail,
    signerPhone,
    shopId,
    userId,
    customerId,
    repairOrderId: roId,
    consentText,
    signatureNotes,
  });
};

/**
 * Helper: Create signature for estimate
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} API response
 */
export const createEstimateSignature = async ({
  estimateId,
  fieldName,
  signatureData,
  width,
  height,
  signedBy,
  signerRole = 'customer',
  shopId,
  customerId = null,
  userId = null,
  signerEmail = null,
  signerPhone = null,
  consentText = null,
  signatureNotes = null,
}) => {
  return createSignature({
    documentType: 'estimate',
    documentId: estimateId,
    signatureFieldName: fieldName,
    signatureData,
    signatureWidth: width,
    signatureHeight: height,
    signedBy,
    signerRole,
    signerEmail,
    signerPhone,
    shopId,
    userId,
    customerId,
    consentText,
    signatureNotes,
  });
};

/**
 * Helper: Create signature for invoice
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} API response
 */
export const createInvoiceSignature = async ({
  invoiceId,
  fieldName,
  signatureData,
  width,
  height,
  signedBy,
  signerRole = 'customer',
  shopId,
  customerId = null,
  userId = null,
  signerEmail = null,
  signerPhone = null,
  consentText = null,
  signatureNotes = null,
}) => {
  return createSignature({
    documentType: 'invoice',
    documentId: invoiceId,
    signatureFieldName: fieldName,
    signatureData,
    signatureWidth: width,
    signatureHeight: height,
    signedBy,
    signerRole,
    signerEmail,
    signerPhone,
    shopId,
    userId,
    customerId,
    consentText,
    signatureNotes,
  });
};

const signatureService = {
  createSignature,
  getDocumentSignatures,
  getSignature,
  getRepairOrderSignatures,
  getCustomerSignatures,
  verifySignature,
  deleteSignature,
  createRepairOrderSignature,
  createEstimateSignature,
  createInvoiceSignature,
};

export default signatureService;
