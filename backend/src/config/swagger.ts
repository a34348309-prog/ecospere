import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EcoSphere API',
            version: '1.0.0',
            description: `
🌿 **EcoSphere** — A geospatial environmental impact platform.

## Features
- **AQI Monitoring** with real-time Socket.io alerts
- **Carbon Footprint Tracking** via utility bill OCR
- **Proof of Action Geofencing** for plantation events
- **Impact Ledger** with eco score & tree debt tracking
- **PostGIS** spatial queries for nearby NGOs & events

## Authentication
All protected endpoints require a Bearer token in the Authorization header.
            `,
            contact: {
                name: 'EcoSphere Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/controllers/*.ts'], // Swagger annotations in controllers
};

export const swaggerSpec = swaggerJsdoc(options);
