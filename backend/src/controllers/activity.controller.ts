import { Request, Response, NextFunction } from "express";
import {
  logActivity,
  getUserActivities,
  getWeeklySummary,
  generateEcoTips,
  getActivityOptions,
  updateStreak,
  getUserStreak,
  getInsights,
} from "../services/activity.service";
import { optimizeCarbonDiet } from "../services/optimizer.service";
import { getWeeklyChallenges, updateChallengeProgress } from "../services/challenge.service";

/**
 * POST /api/v1/activities
 * Log a daily activity.
 */
export const logUserActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { category, activity, value, date } = req.body;

    const result = await logActivity(userId, category, activity, value, date);

    // Update the user's daily streak
    const streakResult = await updateStreak(userId);

    // Update weekly challenge progress
    const completedChallenges = await updateChallengeProgress(userId, category, activity, value);

    res.status(201).json({
      success: true,
      ...result,
      streak: streakResult,
      completedChallenges,
    });
  } catch (error: any) {
    if (error.message?.startsWith("Unknown activity")) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * GET /api/v1/activities
 * Get activity history.
 */
export const getActivities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const days = parseInt(req.query.days as string) || 7;

    const activities = await getUserActivities(userId, days);

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/summary
 * Get weekly carbon summary.
 */
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const summary = await getWeeklySummary(userId);

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/tips
 * Get personalized eco tips.
 */
export const getTips = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const result = await generateEcoTips(userId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/options
 * Get available activity categories and options.
 */
export const getOptions = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options = getActivityOptions();
    res.json({ success: true, data: options });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/optimize?effort=15
 * Get optimal carbon reduction plan using Knapsack algorithm.
 */
export const getOptimizedPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const effort = parseInt(req.query.effort as string) || 15;
    const clamped = Math.min(Math.max(effort, 5), 50); // clamp 5-50

    const plan = optimizeCarbonDiet(clamped);

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/streak
 * Get user's current streak info.
 */
export const getStreakInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const streak = await getUserStreak(userId);

    res.json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/challenges
 * Get user's weekly challenges (auto-generated if needed).
 */
export const getChallenges = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const challenges = await getWeeklyChallenges(userId);

    res.json({ success: true, data: challenges });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/insights
 * Get user's "You vs Average" comparison insights.
 */
export const getInsightsData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const insights = await getInsights(userId);

    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};
