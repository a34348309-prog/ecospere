import { Router } from 'express';
import {
    generateEcoPlan,
    getEcoPlan,
    updateProgress,
    listActions,
    impactSummary,
} from '../controllers/ecoPlan.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { generateEcoPlanSchema, updateProgressSchema } from '../schemas';

const router = Router();

// POST /api/v1/eco-plan/generate — Generate a new personalized plan
router.post('/generate', authenticateToken, validate(generateEcoPlanSchema), generateEcoPlan);

// GET /api/v1/eco-plan/current — Get user's current plan
router.get('/current', authenticateToken, getEcoPlan);

// PUT /api/v1/eco-plan/update-progress — Track action completion
router.put('/update-progress', authenticateToken, validate(updateProgressSchema), updateProgress);

// GET /api/v1/eco-plan/actions — List all available actions
router.get('/actions', listActions);

// GET /api/v1/eco-plan/impact-summary — Get user's impact summary
router.get('/impact-summary', authenticateToken, impactSummary);

export default router;
