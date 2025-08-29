const express = require('express');
const router = express.Router();
const partsService = require('../services/partsService');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, sanitizeInput } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Enhanced query parameter handling for dashboard navigation
const parsePartsFilters = (req) => {
  const {
    view = 'inventory',
    highlight,
    filter,
    urgent = false,
    status,
    supplier,
    category,
    partType,
    availability,
    priceRange,
    sortBy = 'partNumber',
    sortOrder = 'ASC',
    limit = 50,
    offset = 0
  } = req.query;

  return {
    view: view.toLowerCase(),
    highlight: highlight || null,
    filter: filter || null,
    urgent: urgent === 'true',
    status: status || null,
    category: sanitizeInput(category) || '',
    partType: sanitizeInput(partType) || '',
    supplier: sanitizeInput(supplier) || '',
    priceRange: priceRange ? JSON.parse(priceRange) : [0, 10000],
    availability: sanitizeInput(availability) || '',
    sortBy: sanitizeInput(sortBy) || 'partNumber',
    sortOrder: sanitizeInput(sortOrder) || 'ASC',
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(v => v && v !== 'all').length,
      viewContext: view,
      hasHighlight: !!highlight
    }
  };
};

// Apply view-specific filtering logic for parts
const applyPartsViewFilters = (parts, filters) => {
  let filteredParts = [...parts];

  // Apply view-specific filters
  switch (filters.view) {
    case 'low-stock':
      filteredParts = filteredParts.filter(part => 
        part.stockLevel <= part.reorderPoint || part.stockLevel === 0
      );
      break;
    case 'inventory':
      // Standard inventory view - no additional filtering
      break;
    case 'delayed':
      filteredParts = filteredParts.filter(part => 
        part.status === 'backordered' || 
        (part.expectedDate && new Date(part.expectedDate) < new Date())
      );
      break;
    case 'pending-orders':
      filteredParts = filteredParts.filter(part => 
        part.status === 'ordered' || part.status === 'backordered'
      );
      break;
  }

  // Apply status filter
  if (filters.status) {
    filteredParts = filteredParts.filter(part => part.status === filters.status);
  }

  // Apply urgent filter for critical parts
  if (filters.urgent) {
    filteredParts = filteredParts.filter(part => 
      part.stockLevel === 0 || part.priority === 'urgent' || part.critical === true
    );
  }

  // Apply delayed parts filter
  if (filters.filter === 'delayed') {
    filteredParts = filteredParts.filter(part => 
      part.status === 'backordered' || 
      (part.expectedDate && new Date(part.expectedDate) < new Date())
    );
  }

  return filteredParts;
};

// Apply highlighting logic for parts
const applyPartsHighlighting = (parts, highlightId) => {
  if (!highlightId) return parts;
  
  return parts.map(part => ({
    ...part,
    _highlighted: part.partNumber === highlightId || part.id === highlightId,
    _highlightReason: part.partNumber === highlightId ? 'part_number_match' : 'id_match'
  }));
};

// Rate limiting for API endpoints
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many search requests, please try again later'
});

const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
});

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(generalRateLimit);

/**
 * GET /api/parts
 * Get all parts with enhanced dashboard navigation support
 */
router.get('/', async (req, res) => {
  try {
    // Parse enhanced query parameters for dashboard navigation
    const filters = parsePartsFilters(req);
    
    // Get base parts data from service
    let result = await partsService.getAllParts({
      category: filters.category,
      partType: filters.partType,
      supplier: filters.supplier,
      priceRange: filters.priceRange,
      availability: filters.availability,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
      offset: filters.offset
    });
    
    // Apply view-specific and dashboard-specific filters
    if (result.success && result.data) {
      let parts = result.data;
      
      // Apply view-specific filters
      parts = applyPartsViewFilters(parts, filters);
      
      // Apply highlighting if requested
      if (filters.highlight) {
        parts = applyPartsHighlighting(parts, filters.highlight);
      }
      
      // Sort based on view context
      if (filters.view === 'low-stock') {
        parts.sort((a, b) => a.stockLevel - b.stockLevel);
      } else if (filters.urgent) {
        parts.sort((a, b) => {
          const urgencyA = a.stockLevel === 0 ? 0 : a.critical ? 1 : 2;
          const urgencyB = b.stockLevel === 0 ? 0 : b.critical ? 1 : 2;
          return urgencyA - urgencyB;
        });
      }
      
      // Calculate inventory metrics for dashboard views
      const inventoryMetrics = {
        totalParts: parts.length,
        lowStockItems: parts.filter(p => p.stockLevel <= p.reorderPoint).length,
        outOfStockItems: parts.filter(p => p.stockLevel === 0).length,
        delayedOrders: parts.filter(p => 
          p.status === 'backordered' || 
          (p.expectedDate && new Date(p.expectedDate) < new Date())
        ).length,
        totalValue: parts.reduce((sum, p) => sum + (p.cost * p.stockLevel), 0),
        criticalAlerts: parts.filter(p => p.stockLevel === 0 && p.critical).length
      };
      
      // Prepare enhanced response
      const response = {
        success: true,
        data: parts,
        pagination: {
          total: parts.length,
          page: Math.floor(filters.offset / filters.limit) + 1,
          limit: filters.limit,
          hasMore: parts.length === filters.limit
        },
        filters: {
          applied: filters._metadata.totalFiltersApplied,
          context: filters._metadata.viewContext,
          hasHighlight: filters._metadata.hasHighlight
        },
        metrics: inventoryMetrics
      };
      
      // Add view-specific data
      if (filters.view === 'low-stock') {
        response.alerts = {
          reorderNeeded: parts.filter(p => p.stockLevel <= p.reorderPoint),
          criticalShortage: parts.filter(p => p.stockLevel === 0 && p.critical)
        };
      } else if (filters.view === 'delayed') {
        response.delayed = {
          backorderedParts: parts.filter(p => p.status === 'backordered'),
          overdueDeliveries: parts.filter(p => 
            p.expectedDate && new Date(p.expectedDate) < new Date()
          )
        };
      }
      
      res.json(response);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to get parts'
    });
  }
});

/**
 * GET /api/parts/search
 * Search parts with advanced filters
 */
router.get('/search', searchRateLimit, async (req, res) => {
  try {
    const searchQuery = sanitizeInput(req.query.q) || '';
    const filters = {
      partType: sanitizeInput(req.query.partType) || '',
      supplier: sanitizeInput(req.query.supplier) || '',
      category: sanitizeInput(req.query.category) || '',
      priceRange: req.query.priceRange ? JSON.parse(req.query.priceRange) : [0, 10000],
      availability: sanitizeInput(req.query.availability) || '',
      sortBy: sanitizeInput(req.query.sortBy) || 'relevance',
      sortOrder: sanitizeInput(req.query.sortOrder) || 'desc',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await partsService.searchParts(searchQuery, filters);
    res.json(result);
  } catch (error) {
    console.error('Parts search error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to search parts'
    });
  }
});

/**
 * GET /api/parts/search/vehicle
 * Search parts by vehicle information
 */
router.get('/search/vehicle', searchRateLimit, async (req, res) => {
  try {
    const { make, model, year, category } = req.query;
    
    if (!make || !model || !year) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle make, model, and year are required'
      });
    }

    const result = await partsService.searchPartsByVehicle(
      sanitizeInput(make),
      sanitizeInput(model),
      sanitizeInput(year),
      sanitizeInput(category)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Vehicle parts search error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to search parts by vehicle'
    });
  }
});

/**
 * GET /api/parts/lookup
 * Lookup part by part number
 */
router.get('/lookup', async (req, res) => {
  try {
    const { partNumber, supplier } = req.query;
    
    if (!partNumber) {
      return res.status(400).json({
        success: false,
        error: 'Part number is required'
      });
    }

    const result = await partsService.lookupPartByNumber(
      sanitizeInput(partNumber),
      sanitizeInput(supplier)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Part lookup error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to lookup part'
    });
  }
});

/**
 * POST /api/parts/prices/compare
 * Compare prices across suppliers
 */
router.post('/prices/compare', async (req, res) => {
  try {
    const { partNumber, suppliers = [] } = req.body;
    
    if (!partNumber) {
      return res.status(400).json({
        success: false,
        error: 'Part number is required'
      });
    }

    const result = await partsService.comparePrices(
      sanitizeInput(partNumber),
      suppliers.map(s => sanitizeInput(s))
    );
    
    res.json(result);
  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to compare prices'
    });
  }
});

/**
 * GET /api/parts/prices/best
 * Get best price for a part
 */
router.get('/prices/best', async (req, res) => {
  try {
    const { partNumber, minQuality = 'aftermarket' } = req.query;
    
    if (!partNumber) {
      return res.status(400).json({
        success: false,
        error: 'Part number is required'
      });
    }

    const result = await partsService.comparePrices(sanitizeInput(partNumber));
    
    if (result.success && result.data.bestPrice) {
      res.json({
        success: true,
        data: result.data.bestPrice
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No pricing found for this part'
      });
    }
  } catch (error) {
    console.error('Best price error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to get best price'
    });
  }
});

/**
 * GET /api/parts/inventory/status
 * Get inventory status overview
 */
router.get('/inventory/status', async (req, res) => {
  try {
    const filters = {
      lowStockThreshold: parseInt(req.query.lowStockThreshold) || 10,
      category: sanitizeInput(req.query.category) || ''
    };

    const result = await partsService.getInventoryStatus(filters);
    res.json(result);
  } catch (error) {
    console.error('Inventory status error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to get inventory status'
    });
  }
});

/**
 * GET /api/parts/inventory/low-stock
 * Get low stock parts
 */
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const category = sanitizeInput(req.query.category) || '';

    const result = await partsService.getInventoryStatus({
      lowStockThreshold: threshold,
      category
    });
    
    res.json({
      success: true,
      data: {
        lowStockParts: result.data.lowStockParts,
        items: result.data.lowStockItems
      }
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to get low stock parts'
    });
  }
});

/**
 * GET /api/parts/barcode
 * Lookup part by barcode
 */
router.get('/barcode', async (req, res) => {
  try {
    const { barcode } = req.query;
    
    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barcode is required'
      });
    }

    const result = await partsService.lookupByBarcode(sanitizeInput(barcode));
    res.json(result);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to lookup part by barcode'
    });
  }
});

/**
 * GET /api/parts/:id
 * Get specific part by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const partId = parseInt(req.params.id);
    
    if (!partId || partId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid part ID is required'
      });
    }

    const result = await partsService.getPartById(partId);
    res.json(result);
  } catch (error) {
    console.error('Get part error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to get part'
    });
  }
});

/**
 * POST /api/parts
 * Create new part
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const partData = {
      partNumber: sanitizeInput(req.body.partNumber),
      oemPartNumber: sanitizeInput(req.body.oemPartNumber),
      description: sanitizeInput(req.body.description),
      category: sanitizeInput(req.body.category),
      partType: sanitizeInput(req.body.partType),
      manufacturer: sanitizeInput(req.body.manufacturer),
      costPrice: parseFloat(req.body.costPrice) || 0,
      sellingPrice: parseFloat(req.body.sellingPrice) || 0,
      condition: sanitizeInput(req.body.condition) || 'New',
      warranty: sanitizeInput(req.body.warranty),
      fits: sanitizeInput(req.body.fits),
      vehicleApplications: req.body.vehicleApplications || [],
      primaryVendorId: parseInt(req.body.primaryVendorId) || null,
      barcode: sanitizeInput(req.body.barcode),
      initialQuantity: parseInt(req.body.initialQuantity) || 0,
      location: sanitizeInput(req.body.location) || 'Main Warehouse'
    };

    // Validation
    if (!partData.partNumber || !partData.description) {
      return res.status(400).json({
        success: false,
        error: 'Part number and description are required'
      });
    }

    const result = await partsService.createPart(partData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create part error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to create part'
    });
  }
});

/**
 * PUT /api/parts/:id
 * Update part
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const partId = parseInt(req.params.id);
    
    if (!partId || partId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid part ID is required'
      });
    }

    // Get existing part first
    const existingPart = await partsService.getPartById(partId);
    if (!existingPart.success) {
      return res.status(404).json({
        success: false,
        error: 'Part not found'
      });
    }

    const updateData = {
      description: sanitizeInput(req.body.description),
      category: sanitizeInput(req.body.category),
      partType: sanitizeInput(req.body.partType),
      manufacturer: sanitizeInput(req.body.manufacturer),
      costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : undefined,
      sellingPrice: req.body.sellingPrice ? parseFloat(req.body.sellingPrice) : undefined,
      condition: sanitizeInput(req.body.condition),
      warranty: sanitizeInput(req.body.warranty),
      fits: sanitizeInput(req.body.fits),
      vehicleApplications: req.body.vehicleApplications,
      primaryVendorId: req.body.primaryVendorId ? parseInt(req.body.primaryVendorId) : undefined
    };

    // Remove undefined values
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Here you would implement the actual update logic
    // For now, return success with updated data
    res.json({
      success: true,
      data: {
        ...existingPart.data,
        ...filteredUpdateData,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update part error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to update part'
    });
  }
});

/**
 * DELETE /api/parts/:id
 * Delete part
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const partId = parseInt(req.params.id);
    
    if (!partId || partId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid part ID is required'
      });
    }

    // Check if part exists
    const existingPart = await partsService.getPartById(partId);
    if (!existingPart.success) {
      return res.status(404).json({
        success: false,
        error: 'Part not found'
      });
    }

    // Here you would implement the actual delete logic
    // For now, return success
    res.json({
      success: true,
      message: 'Part deleted successfully'
    });
  } catch (error) {
    console.error('Delete part error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to delete part'
    });
  }
});

/**
 * PUT /api/parts/:id/stock
 * Update part stock levels
 */
router.put('/:id/stock', authenticateToken, async (req, res) => {
  try {
    const partId = parseInt(req.params.id);
    const { quantity, operation = 'set' } = req.body;
    
    if (!partId || partId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid part ID is required'
      });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Check if part exists
    const existingPart = await partsService.getPartById(partId);
    if (!existingPart.success) {
      return res.status(404).json({
        success: false,
        error: 'Part not found'
      });
    }

    let newQuantity;
    const currentQuantity = existingPart.data.quantityOnHand || 0;

    switch (operation) {
      case 'add':
        newQuantity = currentQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, currentQuantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
        break;
    }

    // Here you would implement the actual stock update logic
    res.json({
      success: true,
      data: {
        partId,
        operation,
        previousQuantity: currentQuantity,
        newQuantity,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to update stock'
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('Parts API Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

module.exports = router;
