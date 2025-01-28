import request from 'supertest';
import express, { Request, Response } from 'express';
import chromaRoutes from '../../routes/chromaRoutes';
import { chromaCollections, chromaStatus } from '../../controllers/chromaController';

// Mock the controller functions
jest.mock('../../controllers/chromaController', () => ({
	chromaStatus: jest.fn(),
	chromaCollections: jest.fn(),
}));

// Type the mocked functions
const mockedChromaStatus = chromaStatus as jest.MockedFunction<typeof chromaStatus>;
const mockedChromaCollections = chromaCollections as jest.MockedFunction<typeof chromaCollections>;

// Create Express app and use the router
const app = express();
app.use(chromaRoutes);

describe('Chroma Routes', () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	describe('GET /chromaStatus', () => {
		it('should call chromaStatus controller', async () => {
			// Setup mock response
			const mockResponse = { status: 'healthy' };
			mockedChromaStatus.mockImplementation((req: Request, res: Response) => {
				res.json(mockResponse);
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/chromaStatus').expect(200);

			// Assertions
			expect(mockedChromaStatus).toHaveBeenCalled();
			expect(response.body).toEqual(mockResponse);
		});

		it('should handle errors from chromaStatus controller', async () => {
			// Setup mock error
			mockedChromaStatus.mockImplementation((req: Request, res: Response) => {
				res.status(500).json({ error: 'Internal server error' });
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/chromaStatus').expect(500);

			// Assertions
			expect(mockedChromaStatus).toHaveBeenCalled();
			expect(response.body).toEqual({ error: 'Internal server error' });
		});
	});

	describe('GET /chromaCollections', () => {
		it('should call chromaCollections controller', async () => {
			// Setup mock response
			const mockCollections = ['collection1', 'collection2'];
			mockedChromaCollections.mockImplementation((req: Request, res: Response) => {
				res.json(mockCollections);
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/chromaCollections').expect(200);

			// Assertions
			expect(mockedChromaCollections).toHaveBeenCalled();
			expect(response.body).toEqual(mockCollections);
		});

		it('should handle errors from chromaCollections controller', async () => {
			// Setup mock error
			mockedChromaCollections.mockImplementation((req: Request, res: Response) => {
				res.status(500).json({ error: 'Failed to fetch collections' });
				return Promise.resolve();
			});

			// Make request
			const response = await request(app).get('/chromaCollections').expect(500);

			// Assertions
			expect(mockedChromaCollections).toHaveBeenCalled();
			expect(response.body).toEqual({ error: 'Failed to fetch collections' });
		});
	});
});
