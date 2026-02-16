import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * @swagger
 * /api/v1/ngos/nearby:
 *   get:
 *     summary: Get NGOs near a location
 *     tags: [NGOs]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         description: Radius in meters (default 10000)
 */
export const getNearbyNGOs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const lat = parseFloat(req.query.lat as string) || 42.3601;
        const lng = parseFloat(req.query.lng as string) || -71.0589;
        const radius = parseInt(req.query.radius as string) || 10000;

        const ngos = await prisma.$queryRaw<any[]>`
            SELECT id, name, description, address, website,
                   ST_X(coordinates) as lng, ST_Y(coordinates) as lat,
                   ST_Distance(
                       coordinates::geography,
                       ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
                   ) as distance_meters
            FROM "NGO"
            WHERE ST_DWithin(
                coordinates::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                ${radius}
            )
            ORDER BY distance_meters ASC
        `;

        res.json({ success: true, data: ngos });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/ngos:
 *   get:
 *     summary: Get all NGOs
 *     tags: [NGOs]
 */
export const getAllNGOs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ngos = await prisma.$queryRaw<any[]>`
            SELECT id, name, description, address, website,
                   ST_X(coordinates) as lng, ST_Y(coordinates) as lat,
                   "createdAt"
            FROM "NGO"
            ORDER BY name ASC
        `;

        res.json({ success: true, data: ngos });
    } catch (error) {
        next(error);
    }
};
