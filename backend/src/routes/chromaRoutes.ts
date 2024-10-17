import { Router } from 'express';
import { chromaStatus } from '../controllers/chromaController';

const router = Router();

router.get('/chromaStatus', chromaStatus);

export default router;
