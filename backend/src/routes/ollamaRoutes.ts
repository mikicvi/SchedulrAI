import { Router } from 'express';
import { ollamaStatus, ollamaEmbeddingStatus } from '../controllers/ollamaController';
import { ensureAuthenticated } from '../middlewares/auth';

const router = Router();

router.get('/ollamaStatus', ensureAuthenticated, ollamaStatus);
router.get('/ollamaEmbeddingStatus', ensureAuthenticated, ollamaEmbeddingStatus);

export default router;
