
// Swagger API Documentation for CollisionOS
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollisionOS API',
      version: '1.0.0',
      description: 'Comprehensive API for collision repair management system',
      contact: {
        name: 'CollisionOS Support',
        email: 'support@collisionos.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        RepairOrder: {
          type: 'object',
          required: ['ro_number', 'status', 'customer_id', 'vehicle_id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            ro_number: { type: 'string', example: 'RO-2024-0001' },
            status: { 
              type: 'string', 
              enum: ['estimate', 'in_progress', 'parts_pending', 'completed', 'delivered'] 
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'normal', 'high', 'urgent'] 
            },
            customer_id: { type: 'string', format: 'uuid' },
            vehicle_id: { type: 'string', format: 'uuid' },
            claim_id: { type: 'string', format: 'uuid' },
            total_amount: { type: 'number', format: 'decimal' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          required: ['first_name', 'last_name'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '(555) 123-4567' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip_code: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Vehicle: {
          type: 'object',
          required: ['vin', 'year', 'make', 'model'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            vin: { type: 'string', example: '1HGBH41JXMN109186' },
            year: { type: 'integer', example: 2020 },
            make: { type: 'string', example: 'Honda' },
            model: { type: 'string', example: 'Civic' },
            trim: { type: 'string' },
            license_plate: { type: 'string' },
            color: { type: 'string' },
            odometer: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            statusCode: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
