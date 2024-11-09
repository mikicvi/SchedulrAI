import { Router } from 'express';
import { ollamaStatus, ollamaEmbeddingStatus } from '../controllers/ollamaController';

const router = Router();

router.get('/ollamaStatus', ollamaStatus);
router.get('/ollamaEmbeddingStatus', ollamaEmbeddingStatus);

export default router;
