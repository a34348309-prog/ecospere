import { Router } from 'express';
import { updateLocation, getAQIHistory, getCurrentAQI, cleanupAQI } from '../controllers/aqi.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { locationUpdateSchema } from '../schemas';
import { expensiveApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/v1/location/update — Main AQI + location endpoint
router.post('/update', authenticateToken, expensiveApiLimiter, validate(locationUpdateSchema), updateLocation);

export default router;
