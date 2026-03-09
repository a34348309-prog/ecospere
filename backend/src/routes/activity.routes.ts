import { Router } from "express";
import {
  logUserActivity,
  getActivities,
  getSummary,
  getTips,
  getOptions,
  getOptimizedPlan,
  getStreakInfo,
  getChallenges,
  getInsightsData,
} from "../controllers/activity.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { logActivitySchema } from "../schemas";

const router = Router();

// Log an activity
router.post(
  "/",
  authenticateToken,
  validate(logActivitySchema),
  logUserActivity,
);

// Get activity history
router.get("/", authenticateToken, getActivities);

// Get weekly summary
router.get("/summary", authenticateToken, getSummary);

// Get personalized eco tips
router.get("/tips", authenticateToken, getTips);

// Get activity options (categories + activities)
router.get("/options", getOptions);

// Get optimized carbon reduction plan (Knapsack algorithm)
router.get("/optimize", getOptimizedPlan);

// Get user's streak info
router.get("/streak", authenticateToken, getStreakInfo);

// Get user's weekly challenges
router.get("/challenges", authenticateToken, getChallenges);

// Get "You vs Average" insights
router.get("/insights", authenticateToken, getInsightsData);

export default router;
