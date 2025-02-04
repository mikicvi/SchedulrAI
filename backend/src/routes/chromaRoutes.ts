import { Router } from 'express';
import { chromaCollections, chromaStatus } from '../controllers/chromaController';
import { ensureAuthenticated } from '../middlewares/auth';

const router = Router();

router.get('/chromaStatus', ensureAuthenticated, chromaStatus);
router.get('/chromaCollections', ensureAuthenticated, chromaCollections);

export default router;
