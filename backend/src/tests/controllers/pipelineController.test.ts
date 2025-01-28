import { Request, Response } from 'express';
import PipelineController from '../../controllers/pipelineController';
import RAGPipeline from '../../services/pipelineServices';
import logger from '../../utils/logger';

// Mock the dependencies
jest.mock('../../services/pipelineServices');
jest.mock('../../utils/logger');

describe('PipelineController', () => {
	let controller: PipelineController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockJsonFn: jest.Mock;
	let originalEnv: NodeJS.ProcessEnv;

	beforeAll(() => {
		// Store original env variables
		originalEnv = { ...process.env };

		// Mock environment variables
		process.env.PROTOCOL = 'http';
		process.env.OLLAMA_API_BASE = 'localhost';
		process.env.OLLAMA_PORT = '11434';
		process.env.CHROMA_SERVER_HOST = 'localhost';
		process.env.CHROMA_SERVER_PORT = '8000';
		process.env.LLM_MODEL = 'llama2';
		process.env.LLM_EMBED_MODEL = 'llama2';
		process.env.CHROMA_CLIENT_AUTH_CREDENTIALS = 'test-credentials';
	});

	beforeEach(() => {
		// Reset all mocks before each test
		jest.clearAllMocks();

		// Setup mock response
		mockJsonFn = jest.fn();
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: mockJsonFn,
			statusCode: 200,
		};

		// Setup mock request
		mockRequest = {
			method: 'POST',
			body: {
				userInput: 'test input',
			},
		};

		// Initialize controller
		controller = new PipelineController();
	});

	describe('runPipeline', () => {
		it('should successfully process user input and return results', async () => {
			// Arrange
			const expectedResult = { answer: 'test result' };
			(RAGPipeline.prototype.runPipeline as jest.Mock).mockResolvedValue(expectedResult);

			// Act
			await controller.runPipeline(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockJsonFn).toHaveBeenCalledWith({ result: expectedResult });
			expect(logger.debug).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});

		it('should handle errors and return 500 status', async () => {
			// Arrange
			const error = new Error('Pipeline error');
			(RAGPipeline.prototype.runPipeline as jest.Mock).mockRejectedValue(error);

			// Act
			await controller.runPipeline(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockJsonFn).toHaveBeenCalledWith({ error: error.message });
			expect(logger.error).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});

		it('should handle missing user input', async () => {
			// Arrange
			mockRequest.body = {};

			// Act
			await controller.runPipeline(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('checkPipelineStatus', () => {
		it('should return ready status when pipeline is ready', async () => {
			// Arrange
			(RAGPipeline.prototype.isPipelineReady as jest.Mock).mockResolvedValue(true);

			// Act
			await controller.checkPipelineStatus(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockJsonFn).toHaveBeenCalledWith({ ready: true });
			expect(logger.info).toHaveBeenCalled();
		});

		it('should handle errors during status check', async () => {
			// Arrange
			const error = new Error('Status check error');
			(RAGPipeline.prototype.isPipelineReady as jest.Mock).mockRejectedValue(error);

			// Act
			await controller.checkPipelineStatus(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockJsonFn).toHaveBeenCalledWith({ error: error.message });
			expect(logger.error).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});
	});

	describe('Constructor', () => {
		it('should initialize with correct configuration', () => {
			// Assert
			expect(controller).toBeInstanceOf(PipelineController);

			// Construct expected URLs
			const expectedBaseUrl = 'http://localhost:11434';
			const expectedChromaUrl = 'http://localhost:8000';

			// Verify RAGPipeline was initialized with correct params
			expect(RAGPipeline).toHaveBeenCalledWith(
				{
					baseUrl: expectedBaseUrl,
					model: 'llama2',
					embeddingModel: 'llama2',
					temperature: 0.5,
					topP: 0.9,
				},
				{
					collectionName: 'SchedulrAI-KB',
					url: expectedChromaUrl,
					clientParams: {
						auth: {
							provider: 'basic',
							credentials: 'test-credentials',
						},
					},
				}
			);
		});

		it('should handle missing environment variables gracefully', () => {
			// Temporarily clear environment variables
			const tempEnv = { ...process.env };
			process.env = {};

			// Initialize controller with missing env vars
			const controllerWithMissingEnv = new PipelineController();
			expect(controllerWithMissingEnv).toBeInstanceOf(PipelineController);

			// Restore environment variables
			process.env = tempEnv;
		});
	});
});
