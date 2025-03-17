import request from 'supertest';
import express from 'express';
import knowledgeRoutes from '../../routes/knowledgeRoutes';
import { getUserById, updateUser } from '../../services/dbServices';
import { createDocument, deleteDocument, listDocuments, indexDocuments } from '../../services/documentServices';
import { resetChromaCollection } from '../../services/chromaServices';
import { vectorCollectionName } from '../../config/constants';

jest.mock('../../controllers/pipelineController', () => ({
	pipelineInstance: {
		reInitialisePipeline: jest.fn().mockResolvedValue(undefined),
	},
}));
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
			userSettingsKB: [],
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
			expect(response.body).toEqual({
				success: true,
				message: 'Knowledge base updated successfully',
			});
			expect(createDocument).toHaveBeenCalledWith('doc1', 'content1');
			expect(updateUser).toHaveBeenCalledWith('user1', {
				userSettings: {
					userSettingsKB: [
						{
							title: 'doc1.md',
							content: 'content1',
						},
					],
				},
			});
			expect(indexDocuments).toHaveBeenCalled();
		});

		it('should return 404 when user is not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);
			const response = await request(app).post('/kb/knowledge/update').send([]);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				message: 'User not found',
			});
		});

		it('should handle errors during document creation', async () => {
			(createDocument as jest.Mock).mockRejectedValueOnce(new Error('File creation failed'));
			const response = await request(app)
				.post('/kb/knowledge/update')
				.send([{ title: 'doc1', content: 'content1' }]);

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: 'File creation failed',
			});
		});
	});

	describe('POST /kb/knowledge/reset', () => {
		it('should reset knowledge base and vector database', async () => {
			const response = await request(app).post('/kb/knowledge/reset');

			expect(response.status).toBe(200);
			expect(updateUser).toHaveBeenCalledWith('user1', {
				userSettings: { userSettingsKB: [] },
			});
			expect(resetChromaCollection).toHaveBeenCalledWith(vectorCollectionName);
		});

		it('should return 404 when user is not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);
			const response = await request(app).post('/kb/knowledge/reset');

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				message: 'User not found',
			});
		});

		it('should handle errors during reset', async () => {
			(resetChromaCollection as jest.Mock).mockRejectedValueOnce(new Error('Reset failed'));
			const response = await request(app).post('/kb/knowledge/reset');

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: 'Reset failed',
			});
		});
	});

	describe('GET /kb/listDocuments', () => {
		it('should return user knowledge base documents', async () => {
			(listDocuments as jest.Mock).mockResolvedValue([{ name: 'doc1.md', content: 'content1' }]);

			const response = await request(app).get('/kb/listDocuments');

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('documents');
			expect(response.body.documents).toEqual([{ title: 'doc1.md', content: 'content1', type: 'default' }]);
		});

		it('should return combined default and user documents', async () => {
			const mockUserWithDocs = {
				...mockUser,
				userSettings: {
					userSettingsKB: [{ title: 'user-doc.md', content: 'user content' }],
				},
			};
			(getUserById as jest.Mock).mockResolvedValueOnce(mockUserWithDocs);
			(listDocuments as jest.Mock).mockResolvedValue([{ name: 'default-doc.md', content: 'default content' }]);

			const response = await request(app).get('/kb/listDocuments');

			expect(response.status).toBe(200);
			expect(response.body.documents).toEqual([
				{ title: 'default-doc.md', content: 'default content', type: 'default' },
				{ title: 'user-doc.md', content: 'user content', type: 'user' },
			]);
		});

		it('should return 404 when user is not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);
			const response = await request(app).get('/kb/listDocuments');

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				message: 'User not found',
			});
		});

		it('should handle errors during document listing', async () => {
			(listDocuments as jest.Mock).mockRejectedValueOnce(new Error('Listing failed'));
			const response = await request(app).get('/kb/listDocuments');

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: 'Listing failed',
			});
		});
	});

	describe('DELETE /kb/document/:filename', () => {
		it('should delete document and update user settings', async () => {
			const mockUserWithDoc = {
				...mockUser,
				userSettings: {
					userSettingsKB: [{ title: 'test.md', content: 'test content' }],
				},
			};
			(getUserById as jest.Mock).mockResolvedValueOnce(mockUserWithDoc);

			const response = await request(app).delete('/kb/document/test.md');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				message: 'Document deleted successfully',
			});
			expect(deleteDocument).toHaveBeenCalledWith('test.md');
			expect(updateUser).toHaveBeenCalledWith('user1', {
				userSettings: {
					userSettingsKB: [],
				},
			});
			expect(indexDocuments).toHaveBeenCalled();
		});

		it('should return 404 when user is not found', async () => {
			(getUserById as jest.Mock).mockResolvedValueOnce(null);
			const response = await request(app).delete('/kb/document/test.md');

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				message: 'User not found',
			});
		});

		it('should handle errors during document deletion', async () => {
			(deleteDocument as jest.Mock).mockRejectedValueOnce(new Error('Deletion failed'));
			const response = await request(app).delete('/kb/document/test.md');

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: 'Deletion failed',
			});
		});
	});
});
