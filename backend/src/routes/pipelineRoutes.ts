import { Router } from 'express';
import { pipelineInstance } from '../controllers/pipelineController';
import { ensureAuthenticated } from '../middlewares/auth';

const router = Router();

router.post('/runPipeline', ensureAuthenticated, (req, res) => pipelineInstance.runPipeline(req, res));
router.get('/checkPipelineStatus', ensureAuthenticated, (req, res) => pipelineInstance.checkPipelineStatus(req, res));
router.get('/status', ensureAuthenticated, (req, res) => pipelineInstance.streamStatus(req, res));
router.post('/chat', ensureAuthenticated, (req, res) => pipelineInstance.streamChat(req, res));

export default router;
