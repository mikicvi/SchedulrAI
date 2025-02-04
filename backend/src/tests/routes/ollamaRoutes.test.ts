import request from 'supertest';
import express, { Request, Response } from 'express';
import ollamaRoutes from '../../routes/ollamaRoutes';
import { ollamaStatus, ollamaEmbeddingStatus } from '../../controllers/ollamaController';

// Mock the controller function
jest.mock('../../controllers/ollamaController', () => ({
	ollamaStatus: jest.fn(),
	ollamaEmbeddingStatus: jest.fn(),
}));

const mockedOllamaStatus = ollamaStatus as jest.MockedFunction<typeof ollamaStatus>;
const mockedOllamaEmbeddingStatus = ollamaEmbeddingStatus as jest.MockedFunction<typeof ollamaEmbeddingStatus>;

const app = express();
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use(ollamaRoutes);

describe('Ollama Routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /ollamaStatus', () => {
		it('should call ollamaStatus controller', async () => {
			// Setup mock response
			const mockResponse = { status: 'running', version: '0.1.0' };
			mockedOllamaStatus.mockImplementation((req: Request, res: Response) => {
				res.json(mockResponse);
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/ollamaStatus').expect(200);

			// Assertions
			expect(mockedOllamaStatus).toHaveBeenCalled();
			expect(response.body).toEqual(mockResponse);
		});

		it('should handle errors from ollamaStatus controller', async () => {
			// Setup mock error
			mockedOllamaStatus.mockImplementation((req: Request, res: Response) => {
				res.status(500).json({ error: 'Failed to connect to Ollama server' });
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/ollamaStatus').expect(500);

			// Assertions
			expect(mockedOllamaStatus).toHaveBeenCalled();
			expect(response.body).toEqual({ error: 'Failed to connect to Ollama server' });
		});
	});

	describe('GET /ollamaEmbeddingStatus', () => {
		it('should call ollamaEmbeddingStatus controller', async () => {
			// Setup mock response
			const mockResponse = { status: 'ready', model: 'all-MiniLM-L6-v2' };
			mockedOllamaEmbeddingStatus.mockImplementation((req: Request, res: Response) => {
				res.json(mockResponse);
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/ollamaEmbeddingStatus').expect(200);

			// Assertions
			expect(mockedOllamaEmbeddingStatus).toHaveBeenCalled();
			expect(response.body).toEqual(mockResponse);
		});

		it('should handle errors from ollamaEmbeddingStatus controller', async () => {
			// Setup mock error
			mockedOllamaEmbeddingStatus.mockImplementation((req: Request, res: Response) => {
				res.status(500).json({ error: 'Embedding model not loaded' });
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/ollamaEmbeddingStatus').expect(500);

			// Assertions
			expect(mockedOllamaEmbeddingStatus).toHaveBeenCalled();
			expect(response.body).toEqual({ error: 'Embedding model not loaded' });
		});
	});
});
