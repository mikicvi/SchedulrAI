import { Router } from 'express';
import { ollamaStatus } from '../controllers/ollamaController';

const router = Router();

router.get('/ollamaStatus', ollamaStatus);

export default router;
