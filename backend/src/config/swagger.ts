import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Bringgs Technologies API',
      version: '1.0.0',
      description:
        'REST API for the E-Bringgs platform — authentication, blog, services, and payments.',
    },
    servers: [
      { url: '/api', description: 'Current environment' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status:  { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            name:            { type: 'string' },
            email:           { type: 'string', format: 'email' },
            role:            { type: 'string', enum: ['student', 'client', 'admin'] },
            isEmailVerified: { type: 'boolean' },
            bio:             { type: 'string' },
            avatar:          { type: 'string' },
            createdAt:       { type: 'string', format: 'date-time' },
          },
        },
        BlogPost: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            title:       { type: 'string' },
            slug:        { type: 'string' },
            content:     { type: 'string' },
            excerpt:     { type: 'string' },
            category:    { type: 'string' },
            tags:        { type: 'array', items: { type: 'string' } },
            isPublished: { type: 'boolean' },
            views:       { type: 'number' },
            author:      { $ref: '#/components/schemas/User' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id:                  { type: 'string' },
            user:                 { $ref: '#/components/schemas/User' },
            stripePaymentIntentId: { type: 'string' },
            amount:               { type: 'number' },
            currency:             { type: 'string', example: 'usd' },
            status:               { type: 'string', enum: ['pending', 'succeeded', 'failed', 'refunded'] },
            type:                 { type: 'string', enum: ['one-time', 'subscription'] },
            createdAt:            { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
