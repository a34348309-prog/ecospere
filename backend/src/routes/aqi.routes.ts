import { Router } from "express";
import {
  getCurrentAQI,
  getAQIHistory,
  getAQIForecast,
  cleanupAQI,
} from "../controllers/aqi.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { expensiveApiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/current", expensiveApiLimiter, getCurrentAQI);
router.get("/forecast", expensiveApiLimiter, getAQIForecast);
router.get("/history", authenticateToken, getAQIHistory);
router.post("/cleanup", cleanupAQI);

export default router;
