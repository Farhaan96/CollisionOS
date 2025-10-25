/**
 * Query Helper Utilities
 *
 * Reusable query helpers for common Sequelize patterns across CollisionOS.
 * Promotes consistency and reduces boilerplate in route files.
 */

const { Op } = require('sequelize');

/**
 * Build common where clauses and query options
 */
const queryHelpers = {
  /**
   * Shop-scoped query filter
   * @param {number} shopId - Shop ID
   * @returns {Object} Where clause
   */
  forShop: (shopId) => ({ shopId }),

  /**
   * Search across multiple fields with LIKE operator
   * @param {Array<string>} fields - Field names to search
   * @param {string} term - Search term
   * @returns {Object} Where clause with OR condition
   */
  search: (fields, term) => {
    if (!term || !fields || fields.length === 0) return {};

    return {
      [Op.or]: fields.map((field) => ({
        [field]: { [Op.like]: `%${term}%` },
      })),
    };
  },

  /**
   * Date range filter
   * @param {string} field - Field name
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date
   * @returns {Object} Where clause
   */
  dateRange: (field, start, end) => {
    if (!start || !end) return {};

    return {
      [field]: {
        [Op.between]: [start, end],
      },
    };
  },

  /**
   * Date after filter
   * @param {string} field - Field name
   * @param {Date|string} date - Date
   * @returns {Object} Where clause
   */
  dateAfter: (field, date) => {
    if (!date) return {};

    return {
      [field]: { [Op.gte]: date },
    };
  },

  /**
   * Date before filter
   * @param {string} field - Field name
   * @param {Date|string} date - Date
   * @returns {Object} Where clause
   */
  dateBefore: (field, date) => {
    if (!date) return {};

    return {
      [field]: { [Op.lte]: date },
    };
  },

  /**
   * Pagination options
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @returns {Object} Sequelize limit/offset options
   */
  paginate: (page = 1, limit = 50) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;

    return {
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    };
  },

  /**
   * Status filter (handles both single status and array)
   * @param {string|Array<string>} status - Status or array of statuses
   * @returns {Object} Where clause
   */
  status: (status) => {
    if (!status) return {};

    if (Array.isArray(status)) {
      return { status: { [Op.in]: status } };
    }

    return { status };
  },

  /**
   * Active/inactive filter
   * @param {boolean} isActive - Active status
   * @returns {Object} Where clause
   */
  active: (isActive = true) => ({ isActive }),

  /**
   * Sort order helper
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - 'asc' or 'desc'
   * @returns {Array} Sequelize order array
   */
  orderBy: (sortBy = 'createdAt', sortOrder = 'desc') => {
    return [[sortBy, sortOrder.toUpperCase()]];
  },

  /**
   * Common include configurations for eager loading
   */
  includes: {
    /**
     * Include customer with limited fields
     */
    customer: (alias = 'customer') => {
      const Customer = require('../database/models').Customer;
      return {
        model: Customer,
        as: alias,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'customerNumber'],
      };
    },

    /**
     * Include vehicle with limited fields
     */
    vehicle: (alias = 'vehicle') => {
      const Vehicle = require('../database/models').Vehicle;
      return {
        model: Vehicle,
        as: alias,
        attributes: ['id', 'vin', 'year', 'make', 'model', 'trim', 'plateNumber', 'colour'],
      };
    },

    /**
     * Include vehicle profile (comprehensive)
     */
    vehicleProfile: (alias = 'vehicleProfile') => {
      const VehicleProfile = require('../database/models').VehicleProfile;
      return {
        model: VehicleProfile,
        as: alias,
      };
    },

    /**
     * Include claim
     */
    claim: (alias = 'claim') => {
      const ClaimManagement = require('../database/models').ClaimManagement;
      return {
        model: ClaimManagement,
        as: alias,
      };
    },

    /**
     * Include repair order
     */
    repairOrder: (alias = 'repairOrder') => {
      const RepairOrderManagement = require('../database/models').RepairOrderManagement;
      return {
        model: RepairOrderManagement,
        as: alias,
      };
    },

    /**
     * Include parts with status
     */
    parts: (alias = 'parts') => {
      const AdvancedPartsManagement = require('../database/models').AdvancedPartsManagement;
      return {
        model: AdvancedPartsManagement,
        as: alias,
      };
    },

    /**
     * Include purchase order
     */
    purchaseOrder: (alias = 'purchaseOrder') => {
      const PurchaseOrderSystem = require('../database/models').PurchaseOrderSystem;
      return {
        model: PurchaseOrderSystem,
        as: alias,
      };
    },

    /**
     * Include vendor
     */
    vendor: (alias = 'vendor') => {
      const Vendor = require('../database/models').Vendor;
      return {
        model: Vendor,
        as: alias,
        attributes: ['id', 'name', 'siteCode', 'accountNumber', 'isActive'],
      };
    },

    /**
     * Include insurance company
     */
    insuranceCompany: (alias = 'insuranceCompany') => {
      const InsuranceCompany = require('../database/models').InsuranceCompany;
      return {
        model: InsuranceCompany,
        as: alias,
        attributes: ['id', 'name', 'code', 'contactInfo'],
      };
    },

    /**
     * Include shop
     */
    shop: (alias = 'shop') => {
      const Shop = require('../database/models').Shop;
      return {
        model: Shop,
        as: alias,
        attributes: ['id', 'name', 'email', 'phone'],
      };
    },

    /**
     * Include user
     */
    user: (alias = 'user') => {
      const User = require('../database/models').User;
      return {
        model: User,
        as: alias,
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
      };
    },

    /**
     * Include technician
     */
    technician: (alias = 'technician') => {
      const User = require('../database/models').User;
      return {
        model: User,
        as: alias,
        attributes: ['id', 'username', 'firstName', 'lastName'],
        where: { role: 'technician' },
      };
    },
  },

  /**
   * Attribute selections for common use cases
   */
  attributes: {
    /**
     * Summary fields (for lists)
     */
    summary: (model) => {
      const summaryFields = {
        customer: ['id', 'customerNumber', 'firstName', 'lastName', 'email', 'phone', 'type'],
        vehicle: ['id', 'vin', 'year', 'make', 'model', 'plateNumber', 'colour'],
        repairOrder: ['id', 'roNumber', 'stage', 'openedAt', 'targetDeliveryDate', 'status'],
        claim: ['id', 'claimNumber', 'insurerName', 'status', 'dateOfLoss'],
        part: ['id', 'operation', 'oemNumber', 'description', 'brand', 'status', 'quantity'],
        vendor: ['id', 'name', 'siteCode', 'accountNumber', 'isActive'],
      };

      return summaryFields[model] || undefined;
    },

    /**
     * Exclude sensitive fields
     */
    excludeSensitive: () => ({
      exclude: ['password', 'passwordHash', 'apiKey', 'apiSecret', 'accessToken', 'refreshToken'],
    }),
  },

  /**
   * Build complex where clause from query parameters
   * @param {Object} params - Query parameters
   * @param {Object} fieldMap - Map of param names to database fields
   * @returns {Object} Where clause
   */
  buildWhere: (params, fieldMap = {}) => {
    const where = {};

    Object.keys(params).forEach((param) => {
      const value = params[param];
      if (value === undefined || value === null || value === '') return;

      const field = fieldMap[param] || param;

      // Handle array values (IN clause)
      if (Array.isArray(value)) {
        where[field] = { [Op.in]: value };
      }
      // Handle range values (BETWEEN clause)
      else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        where[field] = { [Op.between]: [value.min, value.max] };
      }
      // Handle simple equality
      else {
        where[field] = value;
      }
    });

    return where;
  },

  /**
   * Parse and validate pagination parameters
   * @param {Object} query - Request query object
   * @returns {Object} Validated pagination params
   */
  parsePagination: (query = {}) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    return { page, limit };
  },

  /**
   * Build pagination response metadata
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  paginationMeta: (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },
};

module.exports = { queryHelpers };
