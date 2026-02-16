import { Router } from 'express';
import {
    verifyEventAttendance,
    getAllEvents,
    createEvent,
    getPlantationEventsList,
    createNewPlantationEvent,
    joinEvent,
    getImpact,
} from '../controllers/event.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { verifyAttendanceSchema, createPlantationEventSchema, createEventSchema } from '../schemas';

const router = Router();

// Community events
router.get('/', getAllEvents);
router.post('/', authenticateToken, validate(createEventSchema), createEvent);
router.post('/join/:id', authenticateToken, joinEvent);

// Plantation events (geofenced)
router.get('/plantation', getPlantationEventsList);
router.post('/plantation', authenticateToken, validate(createPlantationEventSchema), createNewPlantationEvent);

// Geofencing verification
router.post('/verify-attendance', authenticateToken, validate(verifyAttendanceSchema), verifyEventAttendance);

// Impact ledger
router.get('/impact', authenticateToken, getImpact);

export default router;
