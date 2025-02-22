import { Router } from 'express';
import { indexDocuments } from '../services/documentServices';
import { ensureAuthenticated } from '../middlewares/auth';

const router = Router();

router.post('/indexDocuments', ensureAuthenticated, async (req, res) => {
	try {
		await indexDocuments();
		res.status(200).json({ status: 'Indexing completed' });
	} catch (error) {
		res.status(500).json({ status: 'Indexing failed', error: error.message });
	}
});

export default router;
