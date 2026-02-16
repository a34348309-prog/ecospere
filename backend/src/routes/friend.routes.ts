import { Router } from 'express';
import { addFriend, getFriends, getFriendsLeaderboard, removeFriend } from '../controllers/friend.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getFriends);
router.get('/leaderboard', authenticateToken, getFriendsLeaderboard);
router.post('/add', authenticateToken, addFriend);
router.delete('/:friendId', authenticateToken, removeFriend);

export default router;
