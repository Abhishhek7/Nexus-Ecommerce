import swaggerJSDoc from 'swagger-jsdoc';

export default swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Nexus Commerce API',
      version: '1.0.0',
      description: 'Multi-vendor order, inventory and sales management REST API.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [{ name: 'Auth' }, { name: 'Products' }, { name: 'Orders' }, { name: 'Reports' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['categoryId', 'name', 'sku', 'price'],
          properties: {
            categoryId: { type: 'integer', example: 2 },
            name: { type: 'string', example: 'iPhone 15' },
            sku: { type: 'string', example: 'IP15-128' },
            description: { type: 'string' },
            price: { type: 'number', example: 69999 },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'] },
            initialQuantity: { type: 'integer', example: 20 },
          },
        },
        OrderInput: {
          type: 'object',
          required: ['items', 'paymentMethod'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'integer' },
                  quantity: { type: 'integer' },
                },
              },
            },
            couponCode: { type: 'string', example: 'SAVE20' },
            paymentMethod: { type: 'string', enum: ['CARD', 'COD'] },
          },
        },
      },
    },
    paths: {
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a customer or vendor',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                    role: { type: 'string', enum: ['CUSTOMER', 'VENDOR'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '409': { description: 'Email already exists' },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/v1/vendors': {
        get: {
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          summary: 'List active vendors (admin)',
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/products': {
        get: {
          tags: ['Products'],
          summary: 'Paginated product search/list',
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'vendorId', schema: { type: 'integer' } },
            { in: 'query', name: 'categoryId', schema: { type: 'integer' } },
            { in: 'query', name: 'categoryTree', schema: { type: 'boolean' } },
            { in: 'query', name: 'minPrice', schema: { type: 'number' } },
            { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'inStock', schema: { type: 'boolean' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['name', 'price', 'createdAt'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Success' },
            '422': { description: 'Validation error' },
          },
        },
        post: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Create product (admin/vendor)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '409': { description: 'Duplicate SKU' },
          },
        },
      },
      '/api/v1/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product details',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Success' },
            '404': { description: 'Not found' },
          },
        },
        patch: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Update own product or any product as admin',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } },
            },
          },
          responses: {
            '200': { description: 'Updated' },
            '403': { description: 'Forbidden' },
          },
        },
        delete: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Delete product',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Deleted' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/products/top-selling': {
        get: {
          tags: ['Products'],
          summary: 'Database-backed top-selling aggregation',
          parameters: [
            { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'vendorId', schema: { type: 'integer' } },
            { in: 'query', name: 'categoryId', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Success' },
          },
        },
      },
      '/api/v1/orders': {
        get: {
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          summary: 'List orders according to caller role',
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'date', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          summary: 'Create order transactionally with coupon/tax/shipping/inventory checks',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/OrderInput' } },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '409': { description: 'Insufficient inventory / concurrency conflict' },
            '422': { description: 'Invalid coupon' },
          },
        },
      },
      '/api/v1/orders/{id}': {
        get: {
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          summary: 'Get authorized order details',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Success' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/api/v1/orders/{id}/status': {
        patch: {
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          summary: 'Update status with state-machine validation',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
            '400': { description: 'Invalid transition' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/orders/{id}/cancel': {
        post: {
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          summary: 'Cancel an eligible order and release inventory',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Cancelled' },
            '400': { description: 'Cancellation not allowed' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/reports/sales': {
        get: {
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          summary: 'Sales report grouped by period',
          parameters: [
            { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'vendorId', schema: { type: 'integer' } },
            { in: 'query', name: 'categoryId', schema: { type: 'integer' } },
            { in: 'query', name: 'productId', schema: { type: 'integer' } },
            { in: 'query', name: 'paymentStatus', schema: { type: 'string' } },
            { in: 'query', name: 'groupBy', schema: { type: 'string', enum: ['day', 'week', 'month'] } },
          ],
          responses: {
            '200': { description: 'Success' },
          },
        },
      },
      '/api/v1/vendors/me/dashboard': {
        get: {
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          summary: 'Vendor analytics dashboard',
          responses: {
            '200': { description: 'Success' },
            '403': { description: 'Vendor role required' },
          },
        },
      },
      '/api/v1/admin/dashboard': {
        get: {
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          summary: 'Platform analytics dashboard',
          responses: {
            '200': { description: 'Success' },
            '403': { description: 'Admin role required' },
          },
        },
      },
      '/api/v1/users/me': {
        get: {
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          summary: 'Get current user profile',
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Unauthorized' },
          },
        },
        patch: {
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          summary: 'Update current user profile',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
          },
        },
      },
      '/api/v1/categories': {
        get: {
          tags: ['Products'],
          summary: 'Return category hierarchy',
          responses: {
            '200': { description: 'Success' },
          },
        },
        post: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Create category (admin)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    parentId: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/categories/{id}': {
        patch: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Update category',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    parentId: { type: 'integer' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
          },
        },
        delete: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Soft-delete category',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Deleted' },
            '409': { description: 'Has child categories' },
          },
        },
      },
      '/api/v1/products/{id}/inventory': {
        patch: {
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          summary: 'Set vendor/admin inventory quantity',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['availableQuantity'],
                  properties: {
                    availableQuantity: { type: 'integer', minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
            '403': { description: 'Forbidden' },
          },
        },
      },
    },
  },
  apis: [],
});