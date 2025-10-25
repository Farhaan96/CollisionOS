/**
 * Supplier Mapping Service
 *
 * Intelligently maps parts from BMS XML to appropriate suppliers based on:
 * - SupplierRefNum from XML
 * - Part type (Glass → Glass suppliers, OEM → OEM suppliers)
 * - PartSourceCode (O=OEM, A=Aftermarket)
 */

const { Vendor } = require('../database/models');
const { Op } = require('sequelize');

class SupplierMappingService {
  constructor() {
    // Predefined supplier mappings for common part types
    this.partTypeToVendorType = {
      'glass': 'aftermarket', // Glass suppliers (Safelite, Pilkington, etc.)
      'sheet metal': 'oem', // Typically OEM dealers
      'bumper': 'aftermarket',
      'lamp': 'aftermarket',
      'mirror': 'aftermarket',
      'wheel': 'aftermarket',
      'tire': 'aftermarket',
      'battery': 'aftermarket',
      'paint': 'paint_supplier',
      'primer': 'paint_supplier',
      'clear coat': 'paint_supplier',
      'sandpaper': 'paint_supplier',
      'masking tape': 'paint_supplier',
    };

    // Known supplier name variations
    this.supplierNameVariations = {
      'SAFELITE': ['Safelite', 'SafeLite AutoGlass', 'Safelite Auto Glass'],
      'PILKINGTON': ['Pilkington', 'Pilkington Glass'],
      'OEM': ['OEM Parts', 'OEM Dealer', 'Original Equipment'],
      'LKQ': ['LKQ Corporation', 'LKQ'],
      'KEYSTONE': ['Keystone Automotive', 'Keystone'],
      'NAPA': ['NAPA Auto Parts', 'NAPA'],
      'CARQUEST': ['CarQuest', 'CarQuest Auto Parts'],
    };

    // Cache for vendors (to avoid repeated database queries)
    this.vendorCache = new Map();
  }

  /**
   * Map a part from BMS to the appropriate vendor
   * @param {Object} partInfo - Part information from BMS parser
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object|null>} Vendor object or null
   */
  async mapPartToVendor(partInfo, shopId) {
    // Priority 1: Use SupplierRefNum if available
    if (partInfo.supplierRefNum) {
      const vendor = await this.findVendorBySupplierRef(partInfo.supplierRefNum, shopId);
      if (vendor) return vendor;
    }

    // Priority 2: Use PartSourceCode + PartType
    const vendorType = this.determineVendorType(partInfo.sourceCode, partInfo.partType);
    const vendor = await this.findVendorByType(vendorType, shopId);
    if (vendor) return vendor;

    // Priority 3: Generic fallback based on OEM vs Aftermarket
    if (partInfo.sourceCode === 'O') {
      return await this.findVendorByType('oem', shopId);
    } else {
      return await this.findVendorByType('aftermarket', shopId);
    }
  }

  /**
   * Find vendor by supplier reference number
   * @param {string} supplierRefNum - Supplier reference from BMS (e.g., "SAFELITE")
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object|null>} Vendor object or null
   */
  async findVendorBySupplierRef(supplierRefNum, shopId) {
    const cacheKey = `${shopId}_${supplierRefNum}`;

    if (this.vendorCache.has(cacheKey)) {
      return this.vendorCache.get(cacheKey);
    }

    // Get all name variations for this supplier
    const nameVariations = this.supplierNameVariations[supplierRefNum] || [supplierRefNum];

    // Try to find vendor by name (case-insensitive)
    const vendor = await Vendor.findOne({
      where: {
        shopId,
        isActive: true,
        vendorStatus: 'active',
        name: {
          [Op.or]: nameVariations.map(name => ({
            [Op.iLike]: `%${name}%`
          }))
        }
      }
    });

    if (vendor) {
      this.vendorCache.set(cacheKey, vendor);
      return vendor;
    }

    // Try to find by vendorNumber matching the supplier ref
    const vendorByNumber = await Vendor.findOne({
      where: {
        shopId,
        isActive: true,
        vendorStatus: 'active',
        vendorNumber: {
          [Op.iLike]: `%${supplierRefNum}%`
        }
      }
    });

    if (vendorByNumber) {
      this.vendorCache.set(cacheKey, vendorByNumber);
    }

    return vendorByNumber;
  }

  /**
   * Determine vendor type based on part characteristics
   * @param {string} sourceCode - 'O' for OEM, 'A' for Aftermarket
   * @param {string} partType - Type of part (Glass, Sheet Metal, etc.)
   * @returns {string} Vendor type
   */
  determineVendorType(sourceCode, partType) {
    // OEM parts always go to OEM suppliers
    if (sourceCode === 'O') {
      return 'oem';
    }

    // Check part type mapping
    const partTypeLower = (partType || '').toLowerCase().trim();

    for (const [type, vendorType] of Object.entries(this.partTypeToVendorType)) {
      if (partTypeLower.includes(type)) {
        return vendorType;
      }
    }

    // Default to aftermarket for non-OEM parts
    return 'aftermarket';
  }

  /**
   * Find vendor by type
   * @param {string} vendorType - Type of vendor
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object|null>} Vendor object or null
   */
  async findVendorByType(vendorType, shopId) {
    const cacheKey = `${shopId}_type_${vendorType}`;

    if (this.vendorCache.has(cacheKey)) {
      return this.vendorCache.get(cacheKey);
    }

    // Find the best-rated active vendor of this type
    const vendor = await Vendor.findOne({
      where: {
        shopId,
        vendorType,
        isActive: true,
        vendorStatus: 'active',
      },
      order: [
        ['qualityRating', 'DESC NULLS LAST'],
        ['fillRate', 'DESC NULLS LAST'],
        ['name', 'ASC']
      ]
    });

    if (vendor) {
      this.vendorCache.set(cacheKey, vendor);
    }

    return vendor;
  }

  /**
   * Group parts by vendor for PO creation
   * @param {Array} parts - Array of part objects with vendor info
   * @returns {Object} Object with vendorId as key and parts array as value
   */
  groupPartsByVendor(parts) {
    const grouped = {};

    for (const part of parts) {
      const vendorId = part.vendorId || 'unassigned';

      if (!grouped[vendorId]) {
        grouped[vendorId] = {
          vendor: part.vendor || null,
          parts: []
        };
      }

      grouped[vendorId].parts.push(part);
    }

    return grouped;
  }

  /**
   * Create or find default vendors for a shop
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object>} Object with created vendors
   */
  async ensureDefaultVendors(shopId) {
    const defaultVendors = {
      glass: {
        name: 'Safelite AutoGlass',
        vendorType: 'aftermarket',
        specializations: ['glass', 'windshield'],
        contactPerson: 'Parts Department',
        phone: '1-800-800-2727',
        email: 'parts@safelite.com',
      },
      oem: {
        name: 'OEM Parts Direct',
        vendorType: 'oem',
        specializations: ['oem', 'original equipment'],
        contactPerson: 'Parts Manager',
        phone: '1-800-OEM-PART',
        email: 'orders@oempartsdirect.com',
      },
      aftermarket: {
        name: 'LKQ Corporation',
        vendorType: 'aftermarket',
        specializations: ['aftermarket', 'collision', 'body parts'],
        contactPerson: 'Sales',
        phone: '1-877-557-2677',
        email: 'customerservice@lkqcorp.com',
      },
      paint: {
        name: 'PPG AutoBody Supply',
        vendorType: 'paint_supplier',
        specializations: ['paint', 'refinish', 'bodyshop supplies'],
        contactPerson: 'Counter Sales',
        phone: '1-800-PPG-PROS',
        email: 'orders@ppg.com',
      }
    };

    const createdVendors = {};

    for (const [key, vendorData] of Object.entries(defaultVendors)) {
      // Check if vendor exists
      let vendor = await Vendor.findOne({
        where: {
          shopId,
          name: vendorData.name
        }
      });

      // Create if doesn't exist
      if (!vendor) {
        const vendorNumber = await Vendor.generateVendorNumber(shopId);
        vendor = await Vendor.create({
          ...vendorData,
          shopId,
          vendorNumber,
          isActive: true,
          vendorStatus: 'active',
        });
      }

      createdVendors[key] = vendor;
    }

    return createdVendors;
  }

  /**
   * Clear vendor cache
   */
  clearCache() {
    this.vendorCache.clear();
  }
}

module.exports = new SupplierMappingService();
