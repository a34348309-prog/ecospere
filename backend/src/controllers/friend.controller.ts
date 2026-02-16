import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/friends/add:
 *   post:
 *     summary: Add a friend by email
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 */
export const addFriend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { email } = req.body;

        if (!email) {
            throw new AppError('Email is required', 400);
        }

        // Find the target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            select: { id: true, name: true, email: true },
        });

        if (!targetUser) {
            throw new AppError('No user found with that email', 404);
        }

        if (targetUser.id === userId) {
            throw new AppError("You can't add yourself as a friend", 400);
        }

        // Check if friendship already exists (in either direction)
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId: targetUser.id },
                    { userId: targetUser.id, friendId: userId },
                ],
            },
        });

        if (existing) {
            throw new AppError('You are already friends with this user', 400);
        }

        // Create bidirectional friendship (auto-accepted for simplicity)
        await prisma.friendship.createMany({
            data: [
                { userId, friendId: targetUser.id, status: 'accepted' },
                { userId: targetUser.id, friendId: userId, status: 'accepted' },
            ],
        });

        res.status(201).json({
            success: true,
            message: `${targetUser.name} has been added as a friend!`,
            friend: targetUser,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/friends:
 *   get:
 *     summary: Get list of friends
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 */
export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;

        const friendships = await prisma.friendship.findMany({
            where: {
                userId,
                status: 'accepted',
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        ecoScore: true,
                        level: true,
                        totalTreesPlanted: true,
                        oxygenContribution: true,
                    },
                },
            },
            orderBy: {
                friend: { ecoScore: 'desc' },
            },
        });

        const friends = friendships.map((f, index) => ({
            rank: index + 1,
            ...f.friend,
        }));

        res.json({ success: true, data: friends });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/friends/leaderboard:
 *   get:
 *     summary: Get friends leaderboard (friends + self, ranked by ecoScore)
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 */
export const getFriendsLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;

        // Get all friend IDs
        const friendships = await prisma.friendship.findMany({
            where: { userId, status: 'accepted' },
            select: { friendId: true },
        });

        const friendIds = friendships.map(f => f.friendId);

        // Include the current user
        const allIds = [...friendIds, userId];

        // Get all users (friends + self) sorted by eco score
        const users = await prisma.user.findMany({
            where: { id: { in: allIds } },
            select: {
                id: true,
                name: true,
                email: true,
                ecoScore: true,
                level: true,
                totalTreesPlanted: true,
                oxygenContribution: true,
            },
            orderBy: { ecoScore: 'desc' },
        });

        const ranked = users.map((user, index) => ({
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
 * /api/v1/friends/{friendId}:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 */
export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const friendId = req.params.friendId;

        // Delete both directions
        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });

        res.json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        next(error);
    }
};
