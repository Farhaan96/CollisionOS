/**
 * Parts Service
 * Handles parts catalog management, search, inventory, and supplier integration
 */

const { Op } = require('sequelize');
const { APIError, ValidationError } = require('../utils/errorHandler');
const { PartsSupplierIntegrationService } = require('./partsSupplierIntegration');

// Database models - handle missing models gracefully
let Part, Vendor, PartCategory, Inventory, PurchaseOrder, realtimeService;

try {
  const models = require('../database/models');
  Part = models.Part;
  Vendor = models.Vendor;
  PartCategory = models.PartCategory;
  Inventory = models.Inventory;
  PurchaseOrder = models.PurchaseOrder;
} catch (error) {
  console.warn('Database models not available:', error.message);
}

try {
  realtimeService = require('./realtimeService');
} catch (error) {
  console.warn('Realtime service not available:', error.message);
  realtimeService = { broadcastPartsUpdate: () => {} }; // Mock function
}

class PartsService {
  constructor() {
    this.supplierService = new PartsSupplierIntegrationService();
    this.initializeSuppliers();
  }

  /**
   * Initialize parts supplier integrations
   */
  initializeSuppliers() {
    try {
      // Mock supplier configurations - in production, these would come from environment variables
      const suppliers = {
        oem_direct: {
          name: 'OEM Direct',
          type: 'OEM',
          color: '#1976d2',
          rating: 4.8,
          deliveryTime: '2-5 days'
        },
        oe_connection: {
          name: 'OE Connection',
          type: 'OEM',
          color: '#2e7d32',
          rating: 4.6,
          deliveryTime: '1-3 days'
        },
        parts_trader: {
          name: 'PartsTrader',
          type: 'Aftermarket',
          color: '#ed6c02',
          rating: 4.4,
          deliveryTime: '1-2 days'
        },
        lkq: {
          name: 'LKQ/Recycled',
          type: 'Recycled',
          color: '#388e3c',
          rating: 4.2,
          deliveryTime: '1-4 days'
        },
        remanufactured: {
          name: 'Remanufactured Pro',
          type: 'Remanufactured',
          color: '#7b1fa2',
          rating: 4.5,
          deliveryTime: '3-7 days'
        }
      };

      console.log('🔧 Parts Service initialized with suppliers:', Object.keys(suppliers));
    } catch (error) {
      console.error('Failed to initialize suppliers:', error);
    }
  }

  /**
   * Search parts with filters
   */
  async searchParts(searchQuery, filters = {}) {
    try {
      const {
        partType = '',
        supplier = '',
        category = '',
        priceRange = [0, 10000],
        availability = '',
        sortBy = 'relevance',
        sortOrder = 'desc',
        limit = 50,
        offset = 0
      } = filters;

      let formattedResults = [];
      let searchResults = { count: 0, rows: [] };

      // Only search local database if models are available
      if (Part && Op) {
        // Build where conditions
        const whereConditions = {};
        
        // Text search across multiple fields
        if (searchQuery && searchQuery.trim()) {
          whereConditions[Op.or] = [
            { partNumber: { [Op.iLike]: `%${searchQuery}%` } },
            { description: { [Op.iLike]: `%${searchQuery}%` } },
            { oemPartNumber: { [Op.iLike]: `%${searchQuery}%` } }
          ];
        }

        // Part type filter
        if (partType) {
          whereConditions.partType = partType;
        }

        // Category filter
        if (category) {
          whereConditions.category = category;
        }

        // Price range filter
        if (priceRange && priceRange.length === 2) {
          whereConditions.sellingPrice = {
            [Op.between]: [priceRange[0], priceRange[1]]
          };
        }

        // Build order clause
        let orderClause;
        switch (sortBy) {
          case 'price_low':
            orderClause = [['sellingPrice', 'ASC']];
            break;
          case 'price_high':
            orderClause = [['sellingPrice', 'DESC']];
            break;
          case 'name':
            orderClause = [['description', sortOrder]];
            break;
          case 'newest':
            orderClause = [['createdAt', 'DESC']];
            break;
          default:
            // Relevance sorting - prioritize exact matches
            orderClause = [['partNumber', 'ASC']];
        }

        try {
          // Execute search query
          searchResults = await Part.findAndCountAll({
            where: whereConditions,
            order: orderClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
          });

          // Format results
          formattedResults = searchResults.rows.map(part => this.formatPartResult(part));
        } catch (dbError) {
          console.warn('Database search failed, using supplier search only:', dbError.message);
        }
      }

      // If no local results found and search query exists, try supplier search
      let supplierResults = [];
      if (formattedResults.length === 0 && searchQuery) {
        try {
          supplierResults = await this.searchSuppliersForParts(searchQuery, filters);
        } catch (error) {
          console.warn('Supplier search failed:', error.message);
        }
      }

      return {
        success: true,
        data: {
          query: searchQuery,
          filters,
          totalResults: searchResults.count + supplierResults.length,
          localResults: formattedResults.length,
          supplierResults: supplierResults.length,
          parts: [...formattedResults, ...supplierResults],
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: searchResults.count > (parseInt(offset) + parseInt(limit))
          }
        }
      };
    } catch (error) {
      console.error('Parts search error:', error);
      throw new APIError('Failed to search parts', 500);
    }
  }

  /**
   * Search parts by vehicle information
   */
  async searchPartsByVehicle(make, model, year, category = null) {
    try {
      const whereConditions = {
        [Op.and]: [
          {
            [Op.or]: [
              { fits: { [Op.iLike]: `%${make}%` } },
              { vehicleApplications: { [Op.contains]: [{ make, model, year }] } }
            ]
          }
        ]
      };

      if (category) {
        whereConditions.category = category;
      }

      const vehicleParts = await Part.findAll({
        where: whereConditions,
        include: [
          {
            model: Vendor,
            as: 'primaryVendor',
            attributes: ['id', 'name', 'type', 'rating', 'deliveryTime']
          },
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['quantityOnHand', 'quantityAvailable']
          }
        ],
        order: [['partNumber', 'ASC']],
        limit: 100
      });

      const formattedResults = vehicleParts.map(part => this.formatPartResult(part));

      // Also search suppliers for vehicle-specific parts
      let supplierResults = [];
      try {
        const supplierSearchCriteria = {
          vehicleInfo: { make, model, year },
          category
        };
        supplierResults = await this.searchSuppliersForParts(null, supplierSearchCriteria);
      } catch (error) {
        console.warn('Supplier vehicle search failed:', error.message);
      }

      return {
        success: true,
        data: {
          vehicle: { make, model, year },
          category,
          totalResults: formattedResults.length + supplierResults.length,
          parts: [...formattedResults, ...supplierResults]
        }
      };
    } catch (error) {
      console.error('Vehicle parts search error:', error);
      throw new APIError('Failed to search parts by vehicle', 500);
    }
  }

  /**
   * Lookup part by part number
   */
  async lookupPartByNumber(partNumber, supplierName = null) {
    try {
      // First check local inventory
      const localPart = await Part.findOne({
        where: {
          [Op.or]: [
            { partNumber: partNumber },
            { oemPartNumber: partNumber }
          ]
        },
        include: [
          {
            model: Vendor,
            as: 'primaryVendor',
            attributes: ['id', 'name', 'type', 'rating', 'deliveryTime']
          },
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['quantityOnHand', 'quantityAvailable', 'location']
          }
        ]
      });

      let result = null;
      if (localPart) {
        result = this.formatPartResult(localPart);
        result.source = 'local';
      }

      // If not found locally or supplier specified, search suppliers
      if (!result || supplierName) {
        try {
          const supplierResults = await this.lookupPartFromSuppliers(partNumber, supplierName);
          if (supplierResults.length > 0) {
            result = supplierResults[0];
            result.source = 'supplier';
          }
        } catch (error) {
          console.warn('Supplier lookup failed:', error.message);
        }
      }

      if (!result) {
        throw new APIError('Part not found', 404);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Part lookup error:', error);
      throw new APIError('Failed to lookup part', 500);
    }
  }

  /**
   * Compare prices across suppliers
   */
  async comparePrices(partNumber, suppliers = []) {
    try {
      const comparisons = [];

      // Check local inventory first
      const localPart = await Part.findOne({
        where: {
          [Op.or]: [
            { partNumber },
            { oemPartNumber: partNumber }
          ]
        },
        include: [{
          model: Vendor,
          as: 'primaryVendor'
        }]
      });

      if (localPart) {
        comparisons.push({
          supplier: {
            name: 'Internal Stock',
            type: 'Internal',
            color: '#4caf50',
            rating: 5.0,
            deliveryTime: 'Immediate'
          },
          partNumber: localPart.partNumber,
          description: localPart.description,
          price: localPart.sellingPrice,
          availability: localPart.inventory?.quantityAvailable > 0,
          quantity: localPart.inventory?.quantityAvailable || 0,
          source: 'local'
        });
      }

      // Search supplier integrations
      try {
        const supplierComparisons = await this.supplierService.comparePrices([partNumber], suppliers);
        const partComparison = supplierComparisons[partNumber];

        if (partComparison && partComparison.providers) {
          partComparison.providers.forEach(provider => {
            comparisons.push({
              supplier: this.getSupplierInfo(provider.provider),
              partNumber,
              price: provider.price,
              availability: provider.availability,
              deliveryTime: provider.deliveryTime,
              source: 'supplier'
            });
          });
        }
      } catch (error) {
        console.warn('Supplier price comparison failed:', error.message);
      }

      // Sort by price (lowest first)
      comparisons.sort((a, b) => a.price - b.price);

      return {
        success: true,
        data: {
          partNumber,
          totalOptions: comparisons.length,
          comparisons,
          bestPrice: comparisons.length > 0 ? comparisons[0] : null
        }
      };
    } catch (error) {
      console.error('Price comparison error:', error);
      throw new APIError('Failed to compare prices', 500);
    }
  }

  /**
   * Get inventory status
   */
  async getInventoryStatus(filters = {}) {
    try {
      const { lowStockThreshold = 10, category = '' } = filters;

      const whereConditions = {};
      if (category) {
        whereConditions.category = category;
      }

      const inventoryStats = await Part.findAll({
        where: whereConditions,
        include: [{
          model: Inventory,
          as: 'inventory',
          required: true
        }],
        attributes: [
          'id',
          'partNumber',
          'description',
          'category',
          'costPrice',
          'sellingPrice'
        ]
      });

      const stats = {
        totalParts: inventoryStats.length,
        lowStockParts: 0,
        outOfStockParts: 0,
        totalValue: 0,
        lowStockItems: [],
        outOfStockItems: []
      };

      inventoryStats.forEach(part => {
        const quantity = part.inventory?.quantityOnHand || 0;
        const value = quantity * (part.costPrice || 0);
        
        stats.totalValue += value;

        if (quantity === 0) {
          stats.outOfStockParts++;
          stats.outOfStockItems.push(this.formatPartResult(part));
        } else if (quantity <= lowStockThreshold) {
          stats.lowStockParts++;
          stats.lowStockItems.push(this.formatPartResult(part));
        }
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Inventory status error:', error);
      throw new APIError('Failed to get inventory status', 500);
    }
  }

  /**
   * Search suppliers for parts (external API calls)
   */
  async searchSuppliersForParts(searchQuery, filters = {}) {
    try {
      const searchCriteria = {
        query: searchQuery,
        partType: filters.partType,
        category: filters.category,
        vehicleInfo: filters.vehicleInfo,
        priceRange: filters.priceRange
      };

      // Mock supplier search results - in production, this would call real supplier APIs
      const mockResults = this.generateMockSupplierResults(searchQuery, searchCriteria);
      
      return mockResults;
    } catch (error) {
      console.error('Supplier search error:', error);
      return [];
    }
  }

  /**
   * Lookup part from suppliers
   */
  async lookupPartFromSuppliers(partNumber, supplierName = null) {
    try {
      // Mock supplier lookup - in production, this would call real supplier APIs
      const mockResults = this.generateMockPartLookup(partNumber, supplierName);
      return mockResults;
    } catch (error) {
      console.error('Supplier lookup error:', error);
      return [];
    }
  }

  /**
   * Generate mock supplier search results
   */
  generateMockSupplierResults(searchQuery, criteria) {
    if (!searchQuery && !criteria.vehicleInfo) return [];

    const mockParts = [
      {
        id: `supplier_${Date.now()}_1`,
        partNumber: 'SUP-12345',
        oemPartNumber: 'OEM-67890',
        description: `${searchQuery || 'Vehicle'} Compatible Part`,
        category: criteria.category || 'body',
        partType: criteria.partType || 'aftermarket',
        manufacturer: 'Premium Parts Co',
        price: Math.floor(Math.random() * 500) + 50,
        availability: Math.random() > 0.3,
        condition: 'New',
        warranty: '12 months',
        fits: criteria.vehicleInfo ? `${criteria.vehicleInfo.year} ${criteria.vehicleInfo.make} ${criteria.vehicleInfo.model}` : 'Universal',
        supplier: {
          name: 'PartsTrader',
          type: 'Aftermarket',
          color: '#ed6c02',
          rating: 4.4,
          deliveryTime: '1-2 days'
        },
        source: 'supplier',
        images: []
      },
      {
        id: `supplier_${Date.now()}_2`,
        partNumber: 'OEM-54321',
        oemPartNumber: 'OEM-54321',
        description: `OEM ${searchQuery || 'Vehicle'} Part`,
        category: criteria.category || 'mechanical',
        partType: 'oem',
        manufacturer: 'OEM Direct',
        price: Math.floor(Math.random() * 800) + 100,
        availability: Math.random() > 0.2,
        condition: 'New',
        warranty: '24 months',
        fits: criteria.vehicleInfo ? `${criteria.vehicleInfo.year} ${criteria.vehicleInfo.make} ${criteria.vehicleInfo.model}` : 'Specific Vehicle',
        supplier: {
          name: 'OE Connection',
          type: 'OEM',
          color: '#2e7d32',
          rating: 4.6,
          deliveryTime: '1-3 days'
        },
        source: 'supplier',
        images: []
      }
    ];

    // Filter results based on criteria
    return mockParts.filter(part => {
      if (criteria.partType && part.partType !== criteria.partType) return false;
      if (criteria.category && part.category !== criteria.category) return false;
      if (criteria.priceRange && (part.price < criteria.priceRange[0] || part.price > criteria.priceRange[1])) return false;
      return true;
    });
  }

  /**
   * Generate mock part lookup results
   */
  generateMockPartLookup(partNumber, supplierName) {
    return [{
      id: `lookup_${Date.now()}`,
      partNumber,
      oemPartNumber: partNumber,
      description: `Part for ${partNumber}`,
      category: 'body',
      partType: 'aftermarket',
      manufacturer: 'Generic Parts',
      price: Math.floor(Math.random() * 300) + 25,
      availability: true,
      condition: 'New',
      warranty: '6 months',
      fits: 'Multiple Vehicles',
      supplier: this.getSupplierInfo(supplierName || 'parts_trader'),
      source: 'supplier'
    }];
  }

  /**
   * Get supplier information
   */
  getSupplierInfo(supplierKey) {
    const suppliers = {
      oem_direct: { name: 'OEM Direct', type: 'OEM', color: '#1976d2', rating: 4.8, deliveryTime: '2-5 days' },
      oe_connection: { name: 'OE Connection', type: 'OEM', color: '#2e7d32', rating: 4.6, deliveryTime: '1-3 days' },
      parts_trader: { name: 'PartsTrader', type: 'Aftermarket', color: '#ed6c02', rating: 4.4, deliveryTime: '1-2 days' },
      lkq: { name: 'LKQ/Recycled', type: 'Recycled', color: '#388e3c', rating: 4.2, deliveryTime: '1-4 days' },
      remanufactured: { name: 'Remanufactured Pro', type: 'Remanufactured', color: '#7b1fa2', rating: 4.5, deliveryTime: '3-7 days' }
    };

    return suppliers[supplierKey] || suppliers.parts_trader;
  }

  /**
   * Format part result for API response
   */
  formatPartResult(part) {
    return {
      id: part.id,
      partNumber: part.partNumber,
      oemPartNumber: part.oemPartNumber,
      description: part.description,
      category: part.category,
      partType: part.partType,
      manufacturer: part.manufacturer,
      price: part.sellingPrice,
      costPrice: part.costPrice,
      availability: part.inventory?.quantityAvailable > 0,
      quantityOnHand: part.inventory?.quantityOnHand || 0,
      quantityAvailable: part.inventory?.quantityAvailable || 0,
      condition: part.condition || 'New',
      warranty: part.warranty,
      location: part.inventory?.location,
      fits: part.fits,
      vehicleApplications: part.vehicleApplications,
      supplier: part.primaryVendor ? {
        id: part.primaryVendor.id,
        name: part.primaryVendor.name,
        type: part.primaryVendor.type,
        rating: part.primaryVendor.rating,
        deliveryTime: part.primaryVendor.deliveryTime
      } : null,
      source: 'local',
      createdAt: part.createdAt,
      updatedAt: part.updatedAt
    };
  }

  /**
   * Barcode lookup
   */
  async lookupByBarcode(barcode) {
    try {
      // First try to find part by barcode in local inventory
      const localPart = await Part.findOne({
        where: {
          [Op.or]: [
            { barcode },
            { partNumber: barcode },
            { oemPartNumber: barcode }
          ]
        },
        include: [
          {
            model: Vendor,
            as: 'primaryVendor'
          },
          {
            model: Inventory,
            as: 'inventory'
          }
        ]
      });

      if (localPart) {
        return {
          success: true,
          data: this.formatPartResult(localPart)
        };
      }

      // If not found locally, try supplier lookup
      try {
        const supplierResults = await this.lookupPartFromSuppliers(barcode);
        if (supplierResults.length > 0) {
          return {
            success: true,
            data: supplierResults[0]
          };
        }
      } catch (error) {
        console.warn('Supplier barcode lookup failed:', error.message);
      }

      throw new APIError('Part not found for barcode', 404);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Barcode lookup error:', error);
      throw new APIError('Failed to lookup part by barcode', 500);
    }
  }

  /**
   * Create new part
   */
  async createPart(partData) {
    try {
      const newPart = await Part.create({
        partNumber: partData.partNumber,
        oemPartNumber: partData.oemPartNumber,
        description: partData.description,
        category: partData.category,
        partType: partData.partType,
        manufacturer: partData.manufacturer,
        costPrice: partData.costPrice,
        sellingPrice: partData.sellingPrice,
        condition: partData.condition || 'New',
        warranty: partData.warranty,
        fits: partData.fits,
        vehicleApplications: partData.vehicleApplications,
        primaryVendorId: partData.primaryVendorId,
        barcode: partData.barcode
      });

      // Create initial inventory record if provided
      if (partData.initialQuantity) {
        await Inventory.create({
          partId: newPart.id,
          quantityOnHand: partData.initialQuantity,
          quantityAvailable: partData.initialQuantity,
          location: partData.location || 'Main Warehouse'
        });
      }

      return {
        success: true,
        data: await this.getPartById(newPart.id)
      };
    } catch (error) {
      console.error('Create part error:', error);
      throw new APIError('Failed to create part', 500);
    }
  }

  /**
   * Get part by ID
   */
  async getPartById(id) {
    try {
      const part = await Part.findByPk(id, {
        include: [
          {
            model: Vendor,
            as: 'primaryVendor'
          },
          {
            model: Inventory,
            as: 'inventory'
          }
        ]
      });

      if (!part) {
        throw new APIError('Part not found', 404);
      }

      return {
        success: true,
        data: this.formatPartResult(part)
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Get part error:', error);
      throw new APIError('Failed to get part', 500);
    }
  }

  /**
   * Get all parts with filters
   */
  async getAllParts(filters = {}) {
    try {
      const { 
        category = '', 
        partType = '', 
        limit = 50, 
        offset = 0,
        sortBy = 'partNumber',
        sortOrder = 'ASC'
      } = filters;

      const whereConditions = {};
      if (category) whereConditions.category = category;
      if (partType) whereConditions.partType = partType;

      const parts = await Part.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Vendor,
            as: 'primaryVendor'
          },
          {
            model: Inventory,
            as: 'inventory'
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        success: true,
        data: {
          totalCount: parts.count,
          parts: parts.rows.map(part => this.formatPartResult(part)),
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parts.count > (parseInt(offset) + parseInt(limit))
          }
        }
      };
    } catch (error) {
      console.error('Get all parts error:', error);
      throw new APIError('Failed to get parts', 500);
    }
  }
}

module.exports = new PartsService();