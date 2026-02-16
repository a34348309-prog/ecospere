import { Router } from 'express';
import { getLeaderboard, getMyRank } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getLeaderboard);
router.get('/me', authenticateToken, getMyRank);

export default router;
