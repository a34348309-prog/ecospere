import { Router } from 'express';
import { getCalculatorStats, updateCalculatorStats, updateProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticateToken, getCalculatorStats);
router.post('/stats', authenticateToken, updateCalculatorStats);
router.put('/profile', authenticateToken, updateProfile);

export default router;
