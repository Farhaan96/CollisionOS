// Purchase Orders API Routes for Collision Repair System
// Handles PO creation, management, and supplier communication

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');

// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/po - List purchase orders with filtering
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn([
        'draft',
        'sent',
        'acknowledged',
        'shipped',
        'received',
        'cancelled',
      ]),
    query('supplier').optional().isString(),
    query('roNumber').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // TODO: Implement purchase order listing with filters
      // TODO: Connect to Supabase collision_purchase_orders table
      // TODO: Include supplier information and line items

      const mockData = {
        purchaseOrders: [
          {
            id: 'po-001',
            poNumber: 'PO-2025-001',
            supplier: {
              name: 'Auto Parts Plus',
              contactName: 'John Smith',
            },
            orderDate: new Date().toISOString(),
            status: 'sent',
            total: 1250.0,
            itemCount: 5,
          },
        ],
        total: 1,
        hasMore: false,
      };

      res.json(mockData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  }
);

// GET /api/po/:id - Get specific purchase order
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // TODO: Implement single purchase order retrieval
      // TODO: Include all line items, supplier details, and tracking info

      const mockData = {
        id,
        poNumber: 'PO-2025-001',
        supplier: {
          id: 'supplier-001',
          name: 'Auto Parts Plus',
          contactName: 'John Smith',
          phone: '555-0123',
          email: 'john@autopartsplus.com',
        },
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'sent',
        items: [
          {
            id: 'item-001',
            partNumber: 'ABC-123',
            description: 'Front Bumper Cover',
            quantity: 1,
            unitCost: 450.0,
            lineCost: 450.0,
            received: 0,
            backordered: 0,
          },
        ],
        subtotal: 450.0,
        tax: 36.0,
        shipping: 25.0,
        total: 511.0,
      };

      res.json(mockData);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
  }
);

// POST /api/po - Create new purchase order
router.post(
  '/',
  [
    body('roNumber').isString().notEmpty(),
    body('supplierId').isString().notEmpty(),
    body('expectedDeliveryDate').isISO8601(),
    body('items').isArray({ min: 1 }),
    body('items.*.partNumber').isString().notEmpty(),
    body('items.*.description').isString().notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitCost').isFloat({ min: 0 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const poData = req.body;

      // TODO: Implement purchase order creation
      // TODO: Generate PO number
      // TODO: Calculate totals
      // TODO: Insert into database
      // TODO: Send to supplier via email/API

      const mockResponse = {
        id: 'po-new-001',
        poNumber: 'PO-2025-002',
        status: 'draft',
        createdAt: new Date().toISOString(),
        message: 'Purchase order created successfully',
      };

      res.status(201).json(mockResponse);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  }
);

// PUT /api/po/:id/status - Update purchase order status
router.put(
  '/:id/status',
  [
    param('id').isString().notEmpty(),
    body('status').isIn([
      'draft',
      'sent',
      'acknowledged',
      'shipped',
      'received',
      'cancelled',
    ]),
    body('notes').optional().isString(),
    body('trackingNumber').optional().isString(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, trackingNumber } = req.body;

      // TODO: Update purchase order status
      // TODO: Log status change history
      // TODO: Update related repair order if completed
      // TODO: Send notifications if needed

      const mockResponse = {
        id,
        status,
        updatedAt: new Date().toISOString(),
        message: 'Purchase order status updated successfully',
      };

      res.json(mockResponse);
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      res.status(500).json({ error: 'Failed to update purchase order status' });
    }
  }
);

// POST /api/po/:id/receive - Mark items as received
router.post(
  '/:id/receive',
  [
    param('id').isString().notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.itemId').isString().notEmpty(),
    body('items.*.quantityReceived').isInt({ min: 1 }),
    body('items.*.condition')
      .optional()
      .isIn(['good', 'damaged', 'wrong_part']),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body;

      // TODO: Update received quantities
      // TODO: Handle damaged/wrong parts
      // TODO: Update repair order progress
      // TODO: Create inventory entries

      const mockResponse = {
        id,
        itemsReceived: items.length,
        updatedAt: new Date().toISOString(),
        message: 'Items received successfully',
      };

      res.json(mockResponse);
    } catch (error) {
      console.error('Error receiving items:', error);
      res.status(500).json({ error: 'Failed to receive items' });
    }
  }
);

// GET /api/po/suppliers - Get available suppliers
router.get('/suppliers', async (req, res) => {
  try {
    // TODO: Fetch suppliers from database
    // TODO: Include contact information and terms

    const mockData = [
      {
        id: 'supplier-001',
        name: 'Auto Parts Plus',
        contactName: 'John Smith',
        phone: '555-0123',
        email: 'john@autopartsplus.com',
        paymentTerms: 'Net 30',
        shippingMethod: 'Ground',
      },
      {
        id: 'supplier-002',
        name: 'Collision Supply Co',
        contactName: 'Jane Doe',
        phone: '555-0456',
        email: 'jane@collisionsupply.com',
        paymentTerms: 'Net 15',
        shippingMethod: 'Next Day',
      },
    ];

    res.json(mockData);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

module.exports = router;
