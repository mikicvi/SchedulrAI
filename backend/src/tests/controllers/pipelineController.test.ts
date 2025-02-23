import { Request, Response } from 'express';
import PipelineController from '../../controllers/pipelineController';
import RAGPipeline from '../../services/pipelineServices';
import logger from '../../utils/logger';
import { EventEmitter } from 'events';

// Mock the dependencies
jest.mock('../../services/pipelineServices');
jest.mock('../../utils/logger');

// Add EventEmitter mock
jest.mock('events', () => {
	return {
		EventEmitter: jest.fn().mockImplementation(() => ({
			on: jest.fn(),
			off: jest.fn(),
			emit: jest.fn(),
		})),
	};
});

describe('PipelineController', () => {
	let controller: PipelineController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockJsonFn: jest.Mock;
	let mockWrite: jest.Mock;
	let mockEnd: jest.Mock;
	let mockSetHeader: jest.Mock;
	let closeCallback: Function;
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

		// Setup mock functions
		mockJsonFn = jest.fn();
		mockWrite = jest.fn();
		mockEnd = jest.fn();
		mockSetHeader = jest.fn();

		// Setup mock response with all required methods
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: mockJsonFn,
			statusCode: 200,
			write: mockWrite,
			end: mockEnd,
			setHeader: mockSetHeader,
			getHeader: jest.fn(),
			removeHeader: jest.fn(),
			headersSent: false,
			emit: jest.fn(),
		} as unknown as Response;

		// Setup mock request with close event handler
		mockRequest = {
			method: 'POST',
			body: {
				userInput: 'test input',
			},
			on: jest.fn().mockImplementation((event, callback) => {
				if (event === 'close') {
					closeCallback = callback;
				}
				return mockRequest;
			}),
		};

		// Initialize controller
		controller = new PipelineController();
	});

	describe('runPipeline', () => {
		it('should successfully process user input and return results', async () => {
			const expectedResult = {
				suggestedTime: '1.23',
				taskSummary: 'test result',
				originalPrompt: 'test input',
			};

			(RAGPipeline.prototype.runPipeline as jest.Mock).mockResolvedValue(expectedResult);

			await controller.runPipeline(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockJsonFn).toHaveBeenCalledWith(expectedResult);
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

	describe('streamStatus', () => {
		let realSetInterval: typeof setInterval;
		let realClearInterval: typeof clearInterval;
		let mockSetInterval: jest.Mock;
		let mockClearInterval: jest.Mock;
		let mockEmitter: { on: jest.Mock };

		beforeEach(() => {
			realSetInterval = global.setInterval;
			realClearInterval = global.clearInterval;
			mockSetInterval = jest.fn().mockReturnValue(123); // Mock interval ID
			mockClearInterval = jest.fn();
			global.setInterval = mockSetInterval as any;
			global.clearInterval = mockClearInterval as any;
		});

		afterEach(() => {
			global.setInterval = realSetInterval;
			global.clearInterval = realClearInterval;
		});

		it('should setup SSE connection correctly', async () => {
			await controller.streamStatus(mockRequest as Request, mockResponse as unknown as Response);

			expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
			expect(mockWrite).toHaveBeenCalledWith(
				`data: ${JSON.stringify({ status: 'Connected to status stream' })}\n\n`
			);
		});

		it('should handle status updates', async () => {
			const testStatus = {
				requestId: '123',
				status: 'Processing',
				timestamp: new Date().toISOString(),
			};

			await controller.streamStatus(mockRequest as Request, mockResponse as Response);

			// Simulate status event
			const emitter = new EventEmitter();
			emitter.emit('status', testStatus);

			expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('Connected to status stream'));
		});

		it('should setup keepalive interval', async () => {
			await controller.streamStatus(mockRequest as Request, mockResponse as Response);

			expect(mockSetInterval).toHaveBeenCalled();
			expect(mockSetInterval.mock.calls[0][1]).toBe(30000); // Check interval time
		});

		it('should cleanup on connection close', async () => {
			await controller.streamStatus(mockRequest as Request, mockResponse as Response);

			// Simulate connection close
			closeCallback();

			expect(mockClearInterval).toHaveBeenCalled();
			expect(mockEnd).toHaveBeenCalled();
		});

		it('should send keepalive messages at regular intervals', async () => {
			jest.useFakeTimers();

			await controller.streamStatus(mockRequest as Request, mockResponse as Response);

			// Fast-forward time by 30 seconds
			jest.advanceTimersByTime(30000);

			expect(mockWrite).toHaveBeenCalledWith(': keepalive\n\n');

			// Fast-forward time by another 30 seconds
			jest.advanceTimersByTime(30000);

			expect(mockWrite).toHaveBeenCalledTimes(3); // Initial connection + 2 keepalives
			expect(mockWrite.mock.calls[1][0]).toBe(': keepalive\n\n');
			expect(mockWrite.mock.calls[2][0]).toBe(': keepalive\n\n');

			jest.useRealTimers();
		});

		it('should handle JSON stringify errors in listener', async () => {
			await controller.streamStatus(mockRequest as Request, mockResponse as Response);

			// Get the emitter from controller
			const emitter = (controller as any)._getEmitter();

			// Get the registered listener from the mock calls
			expect(emitter.on).toHaveBeenCalledWith('status', expect.any(Function));
			const listener = emitter.on.mock.calls[0][1];

			// Create an object that will cause JSON.stringify to throw
			const circular: { [key: string]: any } = {};
			circular.self = circular;

			// Call the listener directly
			listener(circular);

			expect(logger.error).toHaveBeenCalledWith('Error sending SSE update:', expect.any(Error));
		});
	});

	describe('runPipeline with status updates', () => {
		it('should emit status updates during pipeline execution', async () => {
			const expectedResult = {
				suggestedTime: '1.23',
				taskSummary: 'test result',
				originalPrompt: 'test input',
			};

			let statusCallback: Function;
			(RAGPipeline.prototype.runPipeline as jest.Mock).mockImplementation((input, cb) => {
				statusCallback = cb;
				return Promise.resolve(expectedResult);
			});

			const emitter = (controller as any)._getEmitter();
			const emitSpy = jest.spyOn(emitter, 'emit');

			await controller.runPipeline(mockRequest as Request, mockResponse as Response);

			// Simulate status updates
			statusCallback('Processing request...');

			expect(emitSpy).toHaveBeenCalledWith(
				'status',
				expect.objectContaining({
					status: expect.any(String),
					timestamp: expect.any(String),
					requestId: expect.any(String),
				})
			);
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
