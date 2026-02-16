import { Router } from 'express';
import { getNearbyNGOs, getAllNGOs } from '../controllers/ngo.controller';

const router = Router();

router.get('/', getAllNGOs);
router.get('/nearby', getNearbyNGOs);

export default router;
