import { Request, Response, NextFunction } from 'express';
import {
    generateAndSavePlan,
    getCurrentPlan,
    updateActionProgress,
    getAllActions,
    getImpactSummary,
} from '../services/lifestyleOptimizer';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/eco-plan/generate:
 *   post:
 *     summary: Generate a personalized 12-month eco plan
 *     tags: [EcoPlan]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commuteDistance, vehicleType, monthlyElectricity, age, city, dietaryPreference, meatMealsPerWeek, hasGarden, homeOwnership, householdSize, acUsageHours, wasteRecycling, monthlyGroceryBill, willingnessChangeDiet, willingnessPublicTransport, timeAvailability]
 *             properties:
 *               commuteDistance: { type: number, description: "Daily commute in km" }
 *               vehicleType: { type: string, enum: [car, bike, public_transport, none] }
 *               monthlyElectricity: { type: number, description: "Monthly kWh consumption" }
 *               age: { type: integer }
 *               city: { type: string }
 *               dietaryPreference: { type: string, enum: [non_vegetarian, vegetarian, vegan, flexitarian] }
 *               meatMealsPerWeek: { type: integer, minimum: 0, maximum: 21 }
 *               hasGarden: { type: boolean }
 *               homeOwnership: { type: string, enum: [own, rent] }
 *               householdSize: { type: integer, minimum: 1 }
 *               acUsageHours: { type: number }
 *               wasteRecycling: { type: string, enum: [always, sometimes, never] }
 *               monthlyGroceryBill: { type: number }
 *               willingnessChangeDiet: { type: integer, minimum: 1, maximum: 5 }
 *               willingnessPublicTransport: { type: integer, minimum: 1, maximum: 5 }
 *               timeAvailability: { type: string, enum: [low, medium, high] }
 *     responses:
 *       200: { description: Generated eco plan }
 */
export const generateEcoPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const profileData = req.body;

        const result = await generateAndSavePlan(userId, profileData);

        res.json({
            success: true,
            message: result.isExisting
                ? 'Returning your existing eco plan (regeneration available after 30 days)'
                : 'Your personalized 12-month eco plan has been generated!',
            data: result.plan,
            isExisting: result.isExisting,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/eco-plan/current:
 *   get:
 *     summary: Get the user's current eco plan
 *     tags: [EcoPlan]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current eco plan with progress }
 */
export const getEcoPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const plan = await getCurrentPlan(userId);

        if (!plan) {
            return res.json({
                success: true,
                data: null,
                message: 'No eco plan found. Complete the lifestyle form to generate your plan.',
            });
        }

        res.json({
            success: true,
            data: plan,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/eco-plan/update-progress:
 *   put:
 *     summary: Update action completion status
 *     tags: [EcoPlan]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [actionId, isCompleted]
 *             properties:
 *               actionId: { type: string, format: uuid }
 *               isCompleted: { type: boolean }
 *     responses:
 *       200: { description: Updated progress }
 */
export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { actionId, isCompleted } = req.body;

        const result = await updateActionProgress(userId, actionId, isCompleted);

        res.json({
            success: true,
            message: isCompleted ? 'Action marked as completed! 🎉' : 'Action marked as incomplete.',
            data: result,
        });
    } catch (error: any) {
        if (error.message?.includes('No eco plan found') || error.message?.includes('Action not found')) {
            return next(new AppError(error.message, 404));
        }
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/eco-plan/actions:
 *   get:
 *     summary: List all available eco actions
 *     tags: [EcoPlan]
 *     responses:
 *       200: { description: List of all eco actions }
 */
export const listActions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const actions = await getAllActions();
        res.json({
            success: true,
            count: actions.length,
            data: actions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/eco-plan/impact-summary:
 *   get:
 *     summary: Get user's eco impact summary and milestones
 *     tags: [EcoPlan]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Impact summary with milestones }
 */
export const impactSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const summary = await getImpactSummary(userId);

        if (!summary) {
            return res.json({
                success: true,
                data: null,
                message: 'No eco plan found. Generate a plan to see your impact.',
            });
        }

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};
