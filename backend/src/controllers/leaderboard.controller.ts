import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * @swagger
 * /api/v1/leaderboard:
 *   get:
 *     summary: Get eco leaderboard (top users by eco score)
 *     tags: [Leaderboard]
 */
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        const leaderboard = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                ecoScore: true,
                level: true,
                totalTreesPlanted: true,
                oxygenContribution: true,
            },
            orderBy: { ecoScore: 'desc' },
            take: limit,
        });

        // Add rank
        const ranked = leaderboard.map((user, index) => ({
            rank: index + 1,
            ...user,
        }));

        res.json({ success: true, data: ranked });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/leaderboard/me:
 *   get:
 *     summary: Get current user's leaderboard position
 *     tags: [Leaderboard]
 *     security: [{ bearerAuth: [] }]
 */
export const getMyRank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ecoScore: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const rank = await prisma.user.count({
            where: { ecoScore: { gt: user.ecoScore } },
        });

        res.json({
            success: true,
            rank: rank + 1,
            ecoScore: user.ecoScore,
        });
    } catch (error) {
        next(error);
    }
};
