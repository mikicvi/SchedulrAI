import { Router } from 'express';
import { chromaCollections, chromaStatus } from '../controllers/chromaController';

const router = Router();

router.get('/chromaStatus', chromaStatus);
router.get('/chromaCollections', chromaCollections);

export default router;
