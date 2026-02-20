import { Request, Response, NextFunction } from "express";
import {
  processLocationUpdate,
  getUserAQIHistory,
  getAQIByCity,
  cleanupExpiredAQILogs,
  fetchAQI,
  fetchAQIForecast,
} from "../services/aqi.service";
import { AppError } from "../middleware/errorHandler";
import {
  switchUserTile,
  getCachedTileAQI,
  cacheTileAQI,
  emitToTile,
  emitToUser,
  getTileUserCount,
} from "../lib/socket";

/**
 * @swagger
 * /api/v1/location/update:
 *   post:
 *     summary: Update user location and get real-time AQI (tile-based)
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
 *               lat: { type: number, example: 28.6139 }
 *               lng: { type: number, example: 77.2090 }
 *     responses:
 *       200:
 *         description: AQI data with tile info, alert status, and pollutant components
 */
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { lat, lng } = req.body;

    // 1. Switch user to the correct tile room
    const { tileId, isNewTile } = await switchUserTile(userId, lat, lng);
    const usersInTile = getTileUserCount(tileId);

    // 2. Check tile cache — avoid redundant API calls
    const cached = getCachedTileAQI(tileId);
    if (cached && !isNewTile) {
      // Serve from cache — no OpenWeather API call
      console.log(
        `[AQI] Serving cached data for ${tileId} (${usersInTile} users in tile)`,
      );
      return res.json({
        success: true,
        aqi: cached.aqiValue,
        status: cached.status,
        alert: cached.alert,
        components: cached.components || null,
        tileId,
        usersInTile,
        cached: true,
        message: `Air quality is ${cached.status} (AQI: ${cached.aqiValue})`,
      });
    }

    // 3. Fetch fresh AQI from OpenWeather
    const result = await processLocationUpdate(userId, lat, lng);

    // 4. Cache the result for this tile
    cacheTileAQI(tileId, result);

    // 5. Broadcast AQI update to everyone in this tile
    const tilePayload = {
      aqi: result.aqiValue,
      status: result.status,
      alert: result.alert,
      components: result.components || null,
      tileId,
      usersInTile,
      timestamp: new Date().toISOString(),
    };
    emitToTile(tileId, "aqi-update", tilePayload);
    console.log(
      `[AQI] Broadcast to ${tileId}: AQI ${result.aqiValue} (${usersInTile} users)`,
    );

    // 6. Send personal alert if AQI is unhealthy
    if (result.alert) {
      emitToUser(userId, "aqi-alert", {
        aqi: result.aqiValue,
        status: result.status,
        message: `⚠️ AQI is ${result.status} (${result.aqiValue}) in your area. Stay safe!`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      aqi: result.aqiValue,
      status: result.status,
      alert: result.alert,
      components: result.components || null,
      tileId,
      usersInTile,
      cached: false,
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
export const getAQIHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
 *     summary: Get current AQI — by coordinates (lat/lng) or by city name
 *     tags: [Location & AQI]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: City name (fallback to WAQI)
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: Latitude (uses OpenWeather)
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         description: Longitude (uses OpenWeather)
 */
export const getCurrentAQI = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { city, lat, lng } = req.query;

    // Prefer coordinate-based lookup via OpenWeather
    if (lat && lng) {
      const result = await fetchAQI(
        parseFloat(lat as string),
        parseFloat(lng as string),
      );
      console.log(result);
      return res.json({ success: true, ...result });
    }

    // Fall back to city-based WAQI lookup
    const cityName = (city as string) || "delhi";
    const result = await getAQIByCity(cityName);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/aqi/forecast:
 *   get:
 *     summary: Get 4-day hourly AQI forecast from OpenWeather
 *     tags: [Location & AQI]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 */
export const getAQIForecast = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      throw new AppError("lat and lng query parameters are required", 400);
    }

    const forecast = await fetchAQIForecast(
      parseFloat(lat as string),
      parseFloat(lng as string),
    );

    res.json({ success: true, data: forecast });
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
export const cleanupAQI = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deletedCount = await cleanupExpiredAQILogs();
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired AQI logs`,
    });
  } catch (error) {
    next(error);
  }
};
