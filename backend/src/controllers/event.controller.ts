import { Request, Response, NextFunction } from 'express';
import { verifyAttendance, getPlantationEvents, getUserImpactLedger, createPlantationEvent } from '../services/geofence.service';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/events/verify-attendance:
 *   post:
 *     summary: Verify user attendance at a plantation event via geofencing
 *     tags: [Events & Geofencing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, lat, lng]
 *             properties:
 *               eventId: { type: string, format: uuid }
 *               lat: { type: number }
 *               lng: { type: number }
 */
export const verifyEventAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { eventId, lat, lng } = req.body;

        const result = await verifyAttendance(userId, eventId, lat, lng);

        res.status(result.verified ? 200 : 400).json({
            success: result.verified,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events (community + plantation)
 *     tags: [Events & Geofencing]
 */
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Community events
        const events = await prisma.$queryRaw<any[]>`
            SELECT id, title, description, organizer, date, time, "locationName",
                   ST_X(coordinates) as lng, ST_Y(coordinates) as lat,
                   "currentParticipants", "maxParticipants", "createdAt"
            FROM "Event"
            ORDER BY date DESC
        `;

        res.json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new community event
 *     tags: [Events & Geofencing]
 *     security: [{ bearerAuth: [] }]
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { title, description, organizer, date, time, locationName, lat, lng, maxParticipants } = req.body;

        const eventId = require('crypto').randomUUID();
        const eventDate = new Date(date);
        const maxPart = maxParticipants || 50;

        // Insert event with PostGIS point
        await prisma.$executeRaw`
            INSERT INTO "Event" (id, title, description, organizer, date, time, "locationName", coordinates, "currentParticipants", "maxParticipants", "hostId", "createdAt")
            VALUES (
                ${eventId},
                ${title},
                ${description},
                ${organizer},
                ${eventDate},
                ${time},
                ${locationName},
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
                0,
                ${maxPart},
                ${userId},
                NOW()
            )
        `;

        // Award eco score for hosting (+10)
        await prisma.user.update({
            where: { id: userId },
            data: { ecoScore: { increment: 10 } },
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully! +10 eco score',
            event: {
                id: eventId,
                title,
                description,
                organizer,
                date: eventDate,
                time,
                locationName,
                lat,
                lng,
                currentParticipants: 0,
                maxParticipants: maxPart,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events/plantation:
 *   get:
 *     summary: Get all plantation events with boundaries
 *     tags: [Events & Geofencing]
 */
export const getPlantationEventsList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as string | undefined;
        const events = await getPlantationEvents(status);
        res.json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events/plantation:
 *   post:
 *     summary: Create a new plantation event
 *     tags: [Events & Geofencing]
 *     security: [{ bearerAuth: [] }]
 */
export const createNewPlantationEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await createPlantationEvent(req.body);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events/join/{id}:
 *   post:
 *     summary: Join a community event
 *     tags: [Events & Geofencing]
 *     security: [{ bearerAuth: [] }]
 */
export const joinEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const eventId = req.params.id;

        // Check event exists and not full
        const event = await prisma.$queryRaw<any[]>`
            SELECT id, "currentParticipants", "maxParticipants" FROM "Event" WHERE id = ${eventId}
        `;

        if (!event || event.length === 0) {
            throw new AppError('Event not found', 404);
        }

        if (event[0].currentParticipants >= event[0].maxParticipants) {
            throw new AppError('Event is full', 400);
        }

        await prisma.$executeRaw`
            UPDATE "Event" SET "currentParticipants" = "currentParticipants" + 1 WHERE id = ${eventId}
        `;

        // Add to join table
        await prisma.$executeRaw`
            INSERT INTO "_UserEvents" ("A", "B") VALUES (${eventId}, ${userId})
            ON CONFLICT DO NOTHING
        `;

        // Award eco score for joining
        await prisma.user.update({
            where: { id: userId },
            data: { ecoScore: { increment: 5 } },
        });

        res.json({ success: true, message: 'Successfully joined the event! +5 eco score' });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/events/impact:
 *   get:
 *     summary: Get user's impact ledger
 *     tags: [Events & Geofencing]
 *     security: [{ bearerAuth: [] }]
 */
export const getImpact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const ledger = await getUserImpactLedger(userId);
        res.json({ success: true, data: ledger });
    } catch (error) {
        next(error);
    }
};
