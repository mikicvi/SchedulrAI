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
			// Verify RAGPipeline was initialized with correct params
			expect(RAGPipeline).toHaveBeenCalledWith(
				expect.objectContaining({
					baseUrl: expect.any(String),
					model: expect.any(String),
					embeddingModel: expect.any(String),
					temperature: 0.5,
					topP: 0.9,
				}),
				expect.objectContaining({
					collectionName: 'SchedulrAI-KB',
					url: expect.any(String),
					clientParams: expect.objectContaining({
						auth: expect.objectContaining({
							provider: 'basic',
							credentials: expect.any(String),
						}),
					}),
				})
			);
		});
	});
});
