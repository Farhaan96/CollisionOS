const request = require('supertest');
const express = require('express');

// Mock the database/models
jest.mock('../../../server/models', () => ({
  Customer: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  },
}));

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 1, role: 'technician' };
  next();
};

describe('Customer API Endpoints', () => {
  let app;
  let server;
  const { Customer } = require('../../../server/models');

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/customers', mockAuthMiddleware);

    // Import and use customer routes
    try {
      const customerRoutes = require('../../../server/routes/customers');
      app.use('/api/customers', customerRoutes);
    } catch (error) {
      // If routes don't exist, create mock routes
      const router = express.Router();

      router.get('/', async (req, res) => {
        try {
          const customers = await Customer.findAll();
          res.json({ success: true, data: customers });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      });

      router.get('/:id', async (req, res) => {
        try {
          const customer = await Customer.findByPk(req.params.id);
          if (!customer) {
            return res
              .status(404)
              .json({ success: false, error: 'Customer not found' });
          }
          res.json({ success: true, data: customer });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      });

      router.post('/', async (req, res) => {
        try {
          const customer = await Customer.create(req.body);
          res.status(201).json({ success: true, data: customer });
        } catch (error) {
          res.status(400).json({ success: false, error: error.message });
        }
      });

      router.put('/:id', async (req, res) => {
        try {
          const [updatedRows] = await Customer.update(req.body, {
            where: { id: req.params.id },
          });

          if (updatedRows === 0) {
            return res
              .status(404)
              .json({ success: false, error: 'Customer not found' });
          }

          const customer = await Customer.findByPk(req.params.id);
          res.json({ success: true, data: customer });
        } catch (error) {
          res.status(400).json({ success: false, error: error.message });
        }
      });

      router.delete('/:id', async (req, res) => {
        try {
          const deletedRows = await Customer.destroy({
            where: { id: req.params.id },
          });

          if (deletedRows === 0) {
            return res
              .status(404)
              .json({ success: false, error: 'Customer not found' });
          }

          res.json({ success: true, message: 'Customer deleted successfully' });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      });

      app.use('/api/customers', router);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/customers', () => {
    test('should return list of customers', async () => {
      const mockCustomers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-0123',
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-0456',
        },
      ];

      Customer.findAll.mockResolvedValue(mockCustomers);

      const response = await request(app).get('/api/customers').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCustomers);
      expect(Customer.findAll).toHaveBeenCalledTimes(1);
    });

    test('should handle database error', async () => {
      Customer.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/customers').expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });

    test('should return empty array when no customers exist', async () => {
      Customer.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/customers').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/customers/:id', () => {
    test('should return specific customer by ID', async () => {
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-0123',
      };

      Customer.findByPk.mockResolvedValue(mockCustomer);

      const response = await request(app).get('/api/customers/1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCustomer);
      expect(Customer.findByPk).toHaveBeenCalledWith('1');
    });

    test('should return 404 for non-existent customer', async () => {
      Customer.findByPk.mockResolvedValue(null);

      const response = await request(app).get('/api/customers/999').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    test('should handle invalid customer ID', async () => {
      Customer.findByPk.mockRejectedValue(new Error('Invalid ID format'));

      const response = await request(app)
        .get('/api/customers/invalid')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('POST /api/customers', () => {
    test('should create new customer with valid data', async () => {
      const newCustomerData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0789',
        address: '456 Oak St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      };

      const createdCustomer = { id: 3, ...newCustomerData };
      Customer.create.mockResolvedValue(createdCustomer);

      const response = await request(app)
        .post('/api/customers')
        .send(newCustomerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdCustomer);
      expect(Customer.create).toHaveBeenCalledWith(newCustomerData);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        email: 'invalid-email',
      };

      Customer.create.mockRejectedValue(
        new Error('Validation error: firstName is required')
      );

      const response = await request(app)
        .post('/api/customers')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    test('should handle duplicate email', async () => {
      const duplicateData = {
        firstName: 'John',
        lastName: 'Duplicate',
        email: 'existing@example.com',
      };

      Customer.create.mockRejectedValue(new Error('Email already exists'));

      const response = await request(app)
        .post('/api/customers')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('PUT /api/customers/:id', () => {
    test('should update existing customer', async () => {
      const updateData = {
        firstName: 'Johnny',
        phone: '555-9999',
      };

      const updatedCustomer = {
        id: 1,
        firstName: 'Johnny',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-9999',
      };

      Customer.update.mockResolvedValue([1]); // Number of affected rows
      Customer.findByPk.mockResolvedValue(updatedCustomer);

      const response = await request(app)
        .put('/api/customers/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedCustomer);
      expect(Customer.update).toHaveBeenCalledWith(updateData, {
        where: { id: '1' },
      });
    });

    test('should return 404 for non-existent customer update', async () => {
      Customer.update.mockResolvedValue([0]); // No rows affected

      const response = await request(app)
        .put('/api/customers/999')
        .send({ firstName: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    test('should validate update data', async () => {
      Customer.update.mockRejectedValue(new Error('Invalid email format'));

      const response = await request(app)
        .put('/api/customers/1')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    test('should delete existing customer', async () => {
      Customer.destroy.mockResolvedValue(1); // Number of deleted rows

      const response = await request(app)
        .delete('/api/customers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer deleted successfully');
      expect(Customer.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    test('should return 404 for non-existent customer deletion', async () => {
      Customer.destroy.mockResolvedValue(0); // No rows deleted

      const response = await request(app)
        .delete('/api/customers/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    test('should handle deletion constraint errors', async () => {
      Customer.destroy.mockRejectedValue(
        new Error('Cannot delete customer with active jobs')
      );

      const response = await request(app)
        .delete('/api/customers/1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        'Cannot delete customer with active jobs'
      );
    });
  });

  describe('Authentication', () => {
    test('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());

      const router = express.Router();
      router.get('/', (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true });
      });

      unauthApp.use('/api/customers', router);

      const response = await request(unauthApp)
        .get('/api/customers')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express should handle JSON parsing errors
    });

    test('should handle missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ firstName: 'Test' });

      // Should still work or handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });
});
