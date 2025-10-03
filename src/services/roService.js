/**
 * Repair Order Service - CollisionOS
 *
 * API service for collision repair workflow management
 * Handles RO CRUD operations, search, and workflow status updates
 */

import api from './api';

// API endpoints
const ENDPOINTS = {
  REPAIR_ORDERS: '/api/repair-orders',
  SEARCH: '/api/repair-orders/search',
  WORKFLOW: '/api/repair-orders/workflow',
  PARTS: '/api/repair-orders/:id/parts',
  CLAIMS: '/api/repair-orders/:id/claim',
  DOCUMENTS: '/api/repair-orders/:id/documents'
};

/**
 * RO Search Service
 * Supports collision repair specific search (RO#, Claim#, VIN, Customer)
 */
export const searchRepairOrders = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });

    const response = await api.get(`${ENDPOINTS.SEARCH}?${params}`);
    return {
      success: true,
      data: response.data.repair_orders || [],
      totalCount: response.data.total_count || 0,
      searchMeta: response.data.search_meta || {}
    };
  } catch (error) {
    console.error('RO Search failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get all repair orders with pagination and filtering
 */
export const getRepairOrders = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      dateRange,
      shopId
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dateRange && {
        date_from: dateRange.from,
        date_to: dateRange.to
      }),
      ...(shopId && { shop_id: shopId })
    });

    const response = await api.get(`${ENDPOINTS.REPAIR_ORDERS}?${params}`);
    return {
      success: true,
      data: response.data.repair_orders || [],
      pagination: response.data.pagination || {},
      metadata: response.data.metadata || {}
    };
  } catch (error) {
    console.error('Get ROs failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get single repair order by ID with all related data
 */
export const getRepairOrder = async (roId) => {
  try {
    const response = await api.get(`${ENDPOINTS.REPAIR_ORDERS}/${roId}`);
    return {
      success: true,
      data: response.data.repair_order || {},
      related: {
        claim: response.data.claim || {},
        customer: response.data.customer || {},
        vehicle: response.data.vehicle || {},
        parts: response.data.parts || [],
        purchaseOrders: response.data.purchase_orders || [],
        documents: response.data.documents || []
      }
    };
  } catch (error) {
    console.error('Get RO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Create new repair order
 */
export const createRepairOrder = async (roData) => {
  try {
    const response = await api.post(ENDPOINTS.REPAIR_ORDERS, roData);
    return {
      success: true,
      data: response.data.repair_order || {},
      message: response.data.message || 'Repair order created successfully'
    };
  } catch (error) {
    console.error('Create RO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Update repair order
 */
export const updateRepairOrder = async (roId, updates) => {
  try {
    const response = await api.put(`${ENDPOINTS.REPAIR_ORDERS}/${roId}`, updates);
    return {
      success: true,
      data: response.data.repair_order || {},
      message: response.data.message || 'Repair order updated successfully'
    };
  } catch (error) {
    console.error('Update RO failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Update RO workflow status
 */
export const updateROWorkflowStatus = async (roId, status, notes = '') => {
  try {
    const response = await api.put(`${ENDPOINTS.WORKFLOW}/${roId}/status`, {
      status,
      notes,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.repair_order || {},
      message: response.data.message || `RO status updated to ${status}`
    };
  } catch (error) {
    console.error('Update RO workflow failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get RO parts with status grouping
 */
export const getROParts = async (roId) => {
  try {
    // Use the new endpoint structure
    const response = await api.get(`/api/repair-orders/${roId}/parts`);

    return {
      success: true,
      data: response.data.data || [],
      grouped: response.data.grouped_by_status || {},
      summary: response.data.summary || {}
    };
  } catch (error) {
    console.error('Get RO parts failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Update part status (for drag-and-drop workflow)
 */
export const updatePartStatus = async (partLineId, newStatus, notes = '') => {
  try {
    const response = await api.put(`/api/parts/${partLineId}/status`, {
      status: newStatus,
      notes,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.part_line || {},
      message: response.data.message || `Part status updated to ${newStatus}`
    };
  } catch (error) {
    console.error('Update part status failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Bulk update part statuses (for multi-select operations)
 */
export const bulkUpdatePartStatus = async (partLineIds, newStatus, notes = '') => {
  try {
    const response = await api.put('/api/parts/bulk-status-update', {
      part_line_ids: partLineIds,
      status: newStatus,
      notes,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      data: response.data.updated_parts || [],
      count: response.data.updated_count || 0,
      message: response.data.message || `${partLineIds.length} parts updated to ${newStatus}`
    };
  } catch (error) {
    console.error('Bulk update part status failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get RO claim information
 */
export const getROClaim = async (roId) => {
  try {
    const endpoint = ENDPOINTS.CLAIMS.replace(':id', roId);
    const response = await api.get(endpoint);

    return {
      success: true,
      data: response.data.claim || {},
      insurance: response.data.insurance_company || {},
      coverage: response.data.coverage || {}
    };
  } catch (error) {
    console.error('Get RO claim failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Dashboard metrics for repair orders
 */
export const getRODashboardMetrics = async (dateRange = null, shopId = null) => {
  try {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('date_from', dateRange.from);
      params.append('date_to', dateRange.to);
    }
    if (shopId) {
      params.append('shop_id', shopId);
    }

    const response = await api.get(`${ENDPOINTS.REPAIR_ORDERS}/metrics?${params}`);

    return {
      success: true,
      data: {
        totalROs: response.data.total_ros || 0,
        inProgress: response.data.in_progress || 0,
        estimate: response.data.estimate || 0,
        partsPending: response.data.parts_pending || 0,
        readyForDelivery: response.data.ready_for_delivery || 0,
        totalValue: response.data.total_value || 0,
        avgAmount: response.data.avg_amount || 0,
        avgCycleTime: response.data.avg_cycle_time || 0,
        urgent: response.data.urgent || 0
      }
    };
  } catch (error) {
    console.error('Get RO metrics failed:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Quick filters for RO dashboard
 */
export const getQuickFilteredROs = async (filterType) => {
  try {
    const filterMap = {
      'todays-dropoffs': { date: 'today', status: 'estimate' },
      'pending-parts': { status: 'parts_pending' },
      'ready-delivery': { status: 'ready_for_delivery' },
      'urgent': { priority: 'urgent' }
    };

    const filter = filterMap[filterType];
    if (!filter) {
      throw new Error(`Unknown filter type: ${filterType}`);
    }

    return await getRepairOrders({ ...filter, limit: 50 });
  } catch (error) {
    console.error('Quick filter failed:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Delete repair order (soft delete)
 */
export const deleteRepairOrder = async (roId) => {
  try {
    const response = await api.delete(`${ENDPOINTS.REPAIR_ORDERS}/${roId}`);
    return {
      success: true,
      message: response.data.message || 'Repair order deleted successfully'
    };
  } catch (error) {
    console.error('Delete RO failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export all functions
export default {
  searchRepairOrders,
  getRepairOrders,
  getRepairOrder,
  createRepairOrder,
  updateRepairOrder,
  updateROWorkflowStatus,
  getROParts,
  updatePartStatus,
  bulkUpdatePartStatus,
  getROClaim,
  getRODashboardMetrics,
  getQuickFilteredROs,
  deleteRepairOrder
};