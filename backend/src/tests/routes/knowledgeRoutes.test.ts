import request from 'supertest';
import express from 'express';
import knowledgeRoutes from '../../routes/knowledgeRoutes';
import { indexDocuments } from '../../services/documentServices';

jest.mock('../../services/documentServices');

const app = express();
app.use(express.json());
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use(knowledgeRoutes);

describe('POST /api/kb/indexDocuments', () => {
	it('should return 200 and success message when indexing is completed', async () => {
		(indexDocuments as jest.Mock).mockResolvedValueOnce(undefined);

		const response = await request(app).post('/kb/indexDocuments');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'Indexing completed' });
	});

	it('should return 500 and error message when indexing fails', async () => {
		const errorMessage = 'Indexing error';
		(indexDocuments as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

		const response = await request(app).post('/kb/indexDocuments');

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ status: 'Indexing failed', error: errorMessage });
	});
});
