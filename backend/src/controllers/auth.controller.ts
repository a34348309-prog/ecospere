import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: User already exists }
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError('User already exists with this email', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
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

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({ success: true, user, token });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Invalid credentials }
 *       404: { description: User not found }
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 400);
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ success: true, user: userWithoutPassword, token });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user data }
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                level: true,
                ecoScore: true,
                carbonDebt: true,
                totalTreesPlanted: true,
                oxygenContribution: true,
                lifetimeCarbon: true,
                treesToOffset: true,
                createdAt: true,
            },
        });

        if (!user) throw new AppError('User not found', 404);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password changed successfully }
 *       400: { description: Current password is incorrect }
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new AppError('Current password is incorrect', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/auth/account:
 *   delete:
 *     summary: Delete user account and all associated data
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Account deleted successfully }
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;

        // Delete all user-related data in order (respecting FK constraints)
        await prisma.$transaction([
            prisma.userPlanAction.deleteMany({ where: { plan: { userId } } }),
            prisma.userEcoPlan.deleteMany({ where: { userId } }),
            prisma.weeklyChallenge.deleteMany({ where: { userId } }),
            prisma.lifestyleProfile.deleteMany({ where: { userId } }),
            prisma.activityLog.deleteMany({ where: { userId } }),
            prisma.carbonBill.deleteMany({ where: { userId } }),
            prisma.aQILog.deleteMany({ where: { userId } }),
            prisma.impactLedger.deleteMany({ where: { userId } }),
            prisma.friendship.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }),
            prisma.user.delete({ where: { id: userId } }),
        ]);

        res.json({ success: true, message: 'Account and all associated data deleted successfully' });
    } catch (error) {
        next(error);
    }
};
