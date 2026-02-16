import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user calculator/eco stats
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
export const getCalculatorStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                lifetimeCarbon: true,
                treesToOffset: true,
                totalTreesPlanted: true,
                oxygenContribution: true,
                ecoScore: true,
                carbonDebt: true,
                level: true,
            },
        });

        if (!user) throw new AppError('User not found', 404);
        res.json({ success: true, ...user });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/users/stats:
 *   post:
 *     summary: Update user calculator results
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
export const updateCalculatorStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { lifetimeCarbon, treesToOffset } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                lifetimeCarbon: parseFloat(lifetimeCarbon),
                treesToOffset: parseInt(treesToOffset),
            },
        });

        res.json({ success: true, message: 'Stats updated successfully', user });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { name, email } = req.body;

        // Build update data dynamically (only update provided fields)
        const updateData: any = {};
        if (name !== undefined && name.trim().length >= 2) {
            updateData.name = name.trim();
        }
        if (email !== undefined && email.trim().length > 0) {
            const normalizedEmail = email.trim().toLowerCase();

            // Check if email is already taken by another user
            const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (existing && existing.id !== userId) {
                throw new AppError('This email is already in use by another account', 400);
            }
            updateData.email = normalizedEmail;
        }

        if (Object.keys(updateData).length === 0) {
            throw new AppError('No valid fields to update. Provide name (min 2 chars) or email.', 400);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                ecoScore: true,
                level: true,
                totalTreesPlanted: true,
                oxygenContribution: true,
                carbonDebt: true,
                lifetimeCarbon: true,
                treesToOffset: true,
                createdAt: true,
            },
        });

        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        next(error);
    }
};
