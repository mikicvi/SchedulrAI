import { Router } from 'express';
import PipelineController from '../controllers/pipelineController';
import { ensureAuthenticated } from '../middlewares/auth';

const router = Router();
const pipelineController = new PipelineController();

router.post('/runPipeline', ensureAuthenticated, (req, res) => pipelineController.runPipeline(req, res));
router.get('/checkPipelineStatus', ensureAuthenticated, (req, res) => pipelineController.checkPipelineStatus(req, res));
router.get('/status', ensureAuthenticated, (req, res) => pipelineController.streamStatus(req, res));

export default router;
