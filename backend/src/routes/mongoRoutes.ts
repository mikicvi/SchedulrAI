import { Router } from 'express';
import { mongoStatus } from '../controllers/mongoController';

const router = Router();

router.get('/mongoStatus', mongoStatus);

export default router;
