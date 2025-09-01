const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollisionOS API',
      version: '1.0.0',
      description: 'Auto Body Shop Management System API',
      contact: {
        name: 'CollisionOS Support',
        url: 'https://collisionos.com',
        email: 'support@collisionos.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.collisionos.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Unauthorized access',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Validation failed',
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Resource not found',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Internal server error',
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1,
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john@example.com',
            },
            firstName: {
              type: 'string',
              description: 'First name',
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'technician', 'advisor'],
              description: 'User role',
              example: 'technician',
            },
            department: {
              type: 'string',
              description: 'User department',
              example: 'body_shop',
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              example: true,
            },
            shopId: {
              type: 'integer',
              description: 'Associated shop ID',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Customer ID',
              example: 1,
            },
            customerNumber: {
              type: 'string',
              description: 'Customer number',
              example: 'CUST-001',
            },
            firstName: {
              type: 'string',
              description: 'First name',
              example: 'Jane',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
              example: 'Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'jane@example.com',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
              example: '+1-555-123-4567',
            },
            customerType: {
              type: 'string',
              enum: ['individual', 'corporate', 'insurance'],
              description: 'Customer type',
              example: 'individual',
            },
            customerStatus: {
              type: 'string',
              enum: ['active', 'inactive', 'vip'],
              description: 'Customer status',
              example: 'active',
            },
            shopId: {
              type: 'integer',
              description: 'Associated shop ID',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Vehicle ID',
              example: 1,
            },
            vin: {
              type: 'string',
              description: 'Vehicle Identification Number',
              example: '1HGBH41JXMN109186',
            },
            year: {
              type: 'integer',
              description: 'Vehicle year',
              example: 2020,
            },
            make: {
              type: 'string',
              description: 'Vehicle make',
              example: 'Honda',
            },
            model: {
              type: 'string',
              description: 'Vehicle model',
              example: 'Civic',
            },
            color: {
              type: 'string',
              description: 'Vehicle color',
              example: 'Blue',
            },
            customerId: {
              type: 'integer',
              description: 'Associated customer ID',
              example: 1,
            },
            shopId: {
              type: 'integer',
              description: 'Associated shop ID',
              example: 1,
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Job ID',
              example: 1,
            },
            jobNumber: {
              type: 'string',
              description: 'Job number',
              example: 'JOB-001',
            },
            status: {
              type: 'string',
              enum: [
                'estimate',
                'intake',
                'blueprint',
                'parts_ordering',
                'parts_receiving',
                'body_structure',
                'paint_prep',
                'paint_booth',
                'reassembly',
                'quality_control',
                'calibration',
                'detail',
                'ready_pickup',
                'delivered',
              ],
              description: 'Job status',
              example: 'estimate',
            },
            estimateAmount: {
              type: 'number',
              format: 'float',
              description: 'Estimated amount',
              example: 2500.0,
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Total amount',
              example: 2750.0,
            },
            customerId: {
              type: 'integer',
              description: 'Associated customer ID',
              example: 1,
            },
            vehicleId: {
              type: 'integer',
              description: 'Associated vehicle ID',
              example: 1,
            },
            assignedTo: {
              type: 'integer',
              description: 'Assigned technician ID',
              example: 2,
            },
            shopId: {
              type: 'integer',
              description: 'Associated shop ID',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username or email address',
              example: 'johndoe',
            },
            password: {
              type: 'string',
              description: 'Password',
              example: 'password123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total number of records',
                  example: 100,
                },
                page: {
                  type: 'integer',
                  description: 'Current page number',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  description: 'Records per page',
                  example: 20,
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages',
                  example: 5,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './server/routes/*.js', // Path to the API routes
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
