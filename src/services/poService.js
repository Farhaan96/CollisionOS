/**
 * Purchase Order Service - CollisionOS
 *
 * API service for purchase order workflow management
 * Handles PO creation, receiving, vendor management, and collision repair specific features
 */

import api from './api';

// API endpoints
const ENDPOINTS = {
  PURCHASE_ORDERS: '/api/purchase-orders',
  CREATE: '/api/purchase-orders',
  RECEIVE: '/api/purchase-orders/:id/receive',
  VENDORS: '/api/vendors',
  VENDOR_CODES: '/api/vendors/generate-code',
  RETURNS: '/api/purchase-orders/:id/returns',
  METRICS: '/api/purchase-orders/metrics'
};

/**
 * Create PO from selected part lines (collision repair workflow)
 */
export const createPOFromParts = async (poData) => {
  try {
    const {
      part_line_ids,
      vendor_id,
      ro_number,
      delivery_date,
      notes,
      expedite = false,
      shop_id
    } = poData;

    const response = await api.post(ENDPOINTS.CREATE, {
      part_line_ids,
      vendor_id,
      ro_number,
      delivery_date,
      notes,
      expedite,
      shop_id,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.purchase_order || {},
      po_number: response.data.po_number,
      message: response.data.message || 'Purchase order created successfully'
    };
  } catch (error) {
    console.error('Create PO from parts failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get all purchase orders with filtering
 */
export const getPurchaseOrders = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      vendor_id,
      ro_number,
      dateRange,
      shopId
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(vendor_id && { vendor_id }),
      ...(ro_number && { ro_number }),
      ...(dateRange && {
        date_from: dateRange.from,
        date_to: dateRange.to
      }),
      ...(shopId && { shop_id: shopId })
    });

    const response = await api.get(`${ENDPOINTS.PURCHASE_ORDERS}?${params}`);
    return {
      success: true,
      data: response.data.purchase_orders || [],
      pagination: response.data.pagination || {},
      vendor_summary: response.data.vendor_summary || {}
    };
  } catch (error) {
    console.error('Get POs failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get single purchase order with all details
 */
export const getPurchaseOrder = async (poId) => {
  try {
    const response = await api.get(`${ENDPOINTS.PURCHASE_ORDERS}/${poId}`);
    return {
      success: true,
      data: response.data.purchase_order || {},
      parts: response.data.parts || [],
      vendor: response.data.vendor || {},
      repair_order: response.data.repair_order || {},
      receiving_history: response.data.receiving_history || [],
      returns: response.data.returns || []
    };
  } catch (error) {
    console.error('Get PO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Update purchase order
 */
export const updatePurchaseOrder = async (poId, updates) => {
  try {
    const response = await api.put(`${ENDPOINTS.PURCHASE_ORDERS}/${poId}`, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.purchase_order || {},
      message: response.data.message || 'Purchase order updated successfully'
    };
  } catch (error) {
    console.error('Update PO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Receive parts from PO (inline receiving workflow)
 */
export const receivePOParts = async (poId, receivingData) => {
  try {
    const {
      received_parts, // Array of { part_line_id, quantity_received, condition, notes }
      delivery_note,
      received_by,
      received_date = new Date().toISOString()
    } = receivingData;

    const endpoint = ENDPOINTS.RECEIVE.replace(':id', poId);
    const response = await api.post(endpoint, {
      received_parts,
      delivery_note,
      received_by,
      received_date
    });

    return {
      success: true,
      data: response.data.receiving_record || {},
      updated_parts: response.data.updated_parts || [],
      po_status: response.data.po_status,
      message: response.data.message || 'Parts received successfully'
    };
  } catch (error) {
    console.error('Receive PO parts failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Create return for received parts
 */
export const createPartReturn = async (poId, returnData) => {
  try {
    const {
      part_line_id,
      quantity_returned,
      reason,
      condition,
      rma_number,
      notes,
      returned_by
    } = returnData;

    const endpoint = ENDPOINTS.RETURNS.replace(':id', poId);
    const response = await api.post(endpoint, {
      part_line_id,
      quantity_returned,
      reason,
      condition,
      rma_number,
      notes,
      returned_by,
      returned_date: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.return_record || {},
      message: response.data.message || 'Return created successfully'
    };
  } catch (error) {
    console.error('Create return failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get vendor list for PO creation
 */
export const getVendors = async (shopId = null) => {
  try {
    const params = new URLSearchParams();
    if (shopId) {
      params.append('shop_id', shopId);
    }
    params.append('active', 'true');

    const response = await api.get(`${ENDPOINTS.VENDORS}?${params}`);
    return {
      success: true,
      data: response.data.vendors || [],
      preferred: response.data.preferred_vendors || [],
      categories: response.data.categories || {}
    };
  } catch (error) {
    console.error('Get vendors failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Generate vendor code for new vendor
 */
export const generateVendorCode = async (vendorName) => {
  try {
    const response = await api.post(ENDPOINTS.VENDOR_CODES, {
      vendor_name: vendorName
    });

    return {
      success: true,
      vendor_code: response.data.vendor_code,
      message: response.data.message || 'Vendor code generated'
    };
  } catch (error) {
    console.error('Generate vendor code failed:', error);
    return {
      success: false,
      error: error.message,
      vendor_code: null
    };
  }
};

/**
 * Get PO dashboard metrics
 */
export const getPOMetrics = async (dateRange = null, shopId = null) => {
  try {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('date_from', dateRange.from);
      params.append('date_to', dateRange.to);
    }
    if (shopId) {
      params.append('shop_id', shopId);
    }

    const response = await api.get(`${ENDPOINTS.METRICS}?${params}`);

    return {
      success: true,
      data: {
        totalPOs: response.data.total_pos || 0,
        pending: response.data.pending || 0,
        shipped: response.data.shipped || 0,
        delivered: response.data.delivered || 0,
        totalValue: response.data.total_value || 0,
        avgLeadTime: response.data.avg_lead_time || 0,
        fillRate: response.data.fill_rate || 0,
        returnRate: response.data.return_rate || 0
      },
      vendor_performance: response.data.vendor_performance || [],
      recent_pos: response.data.recent_pos || []
    };
  } catch (error) {
    console.error('Get PO metrics failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get POs by vendor (for vendor-specific views)
 */
export const getPOsByVendor = async (vendorId, options = {}) => {
  try {
    const { status, limit = 50 } = options;

    const params = new URLSearchParams({
      vendor_id: vendorId,
      limit: limit.toString(),
      ...(status && { status })
    });

    const response = await api.get(`${ENDPOINTS.PURCHASE_ORDERS}?${params}`);
    return {
      success: true,
      data: response.data.purchase_orders || [],
      vendor_info: response.data.vendor_info || {},
      summary: response.data.summary || {}
    };
  } catch (error) {
    console.error('Get POs by vendor failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Cancel purchase order
 */
export const cancelPurchaseOrder = async (poId, reason = '') => {
  try {
    const response = await api.put(`${ENDPOINTS.PURCHASE_ORDERS}/${poId}/cancel`, {
      reason,
      cancelled_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.purchase_order || {},
      message: response.data.message || 'Purchase order cancelled'
    };
  } catch (error) {
    console.error('Cancel PO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Print/export PO
 */
export const exportPO = async (poId, format = 'pdf') => {
  try {
    const response = await api.get(`${ENDPOINTS.PURCHASE_ORDERS}/${poId}/export`, {
      params: { format },
      responseType: 'blob'
    });

    // Create download
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel'
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `PO-${poId}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      message: `PO exported as ${format.toUpperCase()}`
    };
  } catch (error) {
    console.error('Export PO failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get vendor KPIs for performance tracking
 */
export const getVendorKPIs = async (vendorId, dateRange = null) => {
  try {
    const params = new URLSearchParams({
      vendor_id: vendorId
    });

    if (dateRange) {
      params.append('date_from', dateRange.from);
      params.append('date_to', dateRange.to);
    }

    const response = await api.get(`${ENDPOINTS.VENDORS}/${vendorId}/kpis?${params}`);

    return {
      success: true,
      data: {
        leadTime: response.data.avg_lead_time || 0,
        fillRate: response.data.fill_rate || 0,
        returnRate: response.data.return_rate || 0,
        onTimeDelivery: response.data.on_time_delivery || 0,
        qualityScore: response.data.quality_score || 0,
        totalOrders: response.data.total_orders || 0,
        totalValue: response.data.total_value || 0
      },
      trends: response.data.trends || {},
      comparison: response.data.industry_comparison || {}
    };
  } catch (error) {
    console.error('Get vendor KPIs failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

// Export all functions
export default {
  createPOFromParts,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  receivePOParts,
  createPartReturn,
  getVendors,
  generateVendorCode,
  getPOMetrics,
  getPOsByVendor,
  cancelPurchaseOrder,
  exportPO,
  getVendorKPIs
};