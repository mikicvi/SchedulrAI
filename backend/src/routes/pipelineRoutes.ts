import { Router } from 'express';
import PipelineController from '../controllers/pipelineController';

const router = Router();
const pipelineController = new PipelineController();

router.post('/runPipeline', (req, res) => pipelineController.runPipeline(req, res));

export default router;
