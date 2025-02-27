import request from 'supertest';
import express from 'express';
import knowledgeRoutes from '../../routes/knowledgeRoutes';
import { indexDocuments } from '../../services/documentServices';
import { getUserById, updateUser } from '../../services/dbServices';
import { createDocument, deleteDocument, listDocuments } from '../../services/documentServices';
import { resetChromaCollection } from '../../services/chromaServices';

jest.mock('../../services/documentServices');
jest.mock('../../services/dbServices');
jest.mock('../../services/chromaServices');

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

describe('Knowledge Base Routes', () => {
	const mockUser = {
		id: 'user1',
		userSettings: {
			knowledgeBase: [],
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
	});

	describe('POST /kb/knowledge/update', () => {
		it('should update knowledge base and create documents', async () => {
			const knowledgeBase = [{ title: 'doc1', content: 'content1' }];

			const response = await request(app).post('/kb/knowledge/update').send(knowledgeBase);

			expect(response.status).toBe(200);
			expect(createDocument).toHaveBeenCalledWith('doc1', 'content1');
			expect(updateUser).toHaveBeenCalled();
			expect(indexDocuments).toHaveBeenCalled();
		});
	});

	describe('POST /kb/knowledge/reset', () => {
		it('should reset knowledge base and vector database', async () => {
			const response = await request(app).post('/kb/knowledge/reset');

			expect(response.status).toBe(200);
			expect(updateUser).toHaveBeenCalledWith('user1', {
				userSettings: { knowledgeBase: [] },
			});
			expect(resetChromaCollection).toHaveBeenCalledWith('SchedulrAI-KB');
		});
	});

	describe('GET /kb/listDocuments', () => {
		it('should return user knowledge base and available documents', async () => {
			(listDocuments as jest.Mock).mockResolvedValue([{ name: 'doc1.md', content: 'content1' }]);

			const response = await request(app).get('/kb/listDocuments');

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('documents');
			expect(response.body).toHaveProperty('availableDocuments');
		});
	});

	describe('DELETE /kb/document/:filename', () => {
		it('should delete document and update user settings', async () => {
			const response = await request(app).delete('/kb/document/test.md');

			expect(response.status).toBe(200);
			expect(deleteDocument).toHaveBeenCalledWith('test.md');
			expect(updateUser).toHaveBeenCalled();
		});
	});
});
