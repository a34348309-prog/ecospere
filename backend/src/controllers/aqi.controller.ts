import { Request, Response, NextFunction } from 'express';
import { processLocationUpdate, getUserAQIHistory, getAQIByCity, cleanupExpiredAQILogs } from '../services/aqi.service';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/location/update:
 *   post:
 *     summary: Update user location and get real-time AQI
 *     tags: [Location & AQI]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number, example: 42.3601 }
 *               lng: { type: number, example: -71.0589 }
 *     responses:
 *       200:
 *         description: AQI data with alert status
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { lat, lng } = req.body;

        const result = await processLocationUpdate(userId, lat, lng);

        res.json({
            success: true,
            aqi: result.aqiValue,
            status: result.status,
            alert: result.alert,
            message: result.alert
                ? `⚠️ AQI is ${result.status} (${result.aqiValue}). Stay safe!`
                : `Air quality is ${result.status} (AQI: ${result.aqiValue})`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/aqi/history:
 *   get:
 *     summary: Get user's AQI reading history
 *     tags: [Location & AQI]
 *     security: [{ bearerAuth: [] }]
 */
export const getAQIHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const history = await getUserAQIHistory(userId, limit);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/aqi/current:
 *   get:
 *     summary: Get current AQI for a city
 *     tags: [Location & AQI]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: City name
 */
export const getCurrentAQI = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const city = req.query.city as string || 'delhi';
        const result = await getAQIByCity(city);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/aqi/cleanup:
 *   post:
 *     summary: Cleanup expired AQI logs (admin/cron)
 *     tags: [Location & AQI]
 */
export const cleanupAQI = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedCount = await cleanupExpiredAQILogs();
        res.json({ success: true, message: `Cleaned up ${deletedCount} expired AQI logs` });
    } catch (error) {
        next(error);
    }
};
