import { RunnableSequence } from '@langchain/core/runnables';
import { getChromaStatus } from '../../services/chromaServices';
import { getOllamaStatus } from '../../services/ollamaServices';
import RAGPipeline from '../../services/pipelineServices';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/chromaServices');
jest.mock('../../services/ollamaServices');
jest.mock('@langchain/ollama');
jest.mock('@langchain/community/vectorstores/chroma');
jest.mock('@langchain/core/runnables', () => ({
	RunnableSequence: {
		from: jest.fn(),
	},
	RunnablePassthrough: jest.fn(),
}));
jest.mock('../../utils/logger', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
	error: jest.fn(),
}));

describe('RAGPipeline', () => {
	// Mock the settings and parameters
	const mockLlmSettings = {
		embeddingModel: 'test-embedding-model',
		baseUrl: 'http://localhost:11434',
		model: 'test-model',
		temperature: 0.7,
		topP: 0.9,
		topK: 10,
	};

	const mockVectorStoreParams = {
		url: 'http://localhost:8000',
		collectionName: 'test-collection',
	};

	let ragPipeline: RAGPipeline;

	beforeEach(() => {
		jest.clearAllMocks();

		// Recreate the pipeline for each test
		ragPipeline = new RAGPipeline(mockLlmSettings, mockVectorStoreParams);
	});

	describe('isPipelineReady', () => {
		it('should return true when Chroma and Ollama embedding are working', async () => {
			(getChromaStatus as jest.Mock).mockResolvedValue(true);
			(getOllamaStatus as jest.Mock).mockResolvedValue(true);

			const result = await ragPipeline.isPipelineReady();

			expect(result).toBe(true);
			expect(logger.info).toHaveBeenCalledWith('Pipeline Status:', {
				chroma: true,
				ollama: 'Working',
			});
		});

		it('should return false when Chroma or Ollama embedding is not working', async () => {
			(getChromaStatus as jest.Mock).mockResolvedValue(false);
			(getOllamaStatus as jest.Mock).mockResolvedValue(false);

			const result = await ragPipeline.isPipelineReady();

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith('Pipeline has issues');
		});
	});

	describe('_requestLLM Retry Functionality', () => {
		beforeEach(() => {
			const mockQAChain = {
				invoke: jest.fn(),
			};
			(RunnableSequence.from as jest.Mock).mockReturnValue(mockQAChain);
		});

		it('should retry when response format is incorrect', async () => {
			// Setup chain mock responses
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockInvoke = jest.fn();
			mockInvoke
				.mockResolvedValueOnce('Invalid JSON')
				.mockResolvedValueOnce('{"missing": "time"}')
				.mockResolvedValueOnce('{"suggestedTime": "1.23", "taskSummary": "Test"}');
			mockChain().invoke = mockInvoke;

			const result = await ragPipeline['_requestLLM']('test query');

			expect(result).toEqual({
				suggestedTime: '1.23',
				taskSummary: 'Test',
				originalPrompt: 'test query',
			});
			expect(mockInvoke).toHaveBeenCalledTimes(3);
			expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Raw LLM response'));
		});

		it('should throw an error after max retries', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockInvoke = jest.fn().mockResolvedValue('Invalid JSON');
			mockChain().invoke = mockInvoke;

			const statusCallback = jest.fn();
			try {
				await ragPipeline['_requestLLM']('test query', statusCallback);
				fail('Expected method to throw');
			} catch (error) {
				expect(statusCallback).toHaveBeenCalledWith(
					'LLM failed to provide a valid response - please try again.'
				);
				expect(mockInvoke).toHaveBeenCalledTimes(3);
			}
		});
	});

	describe('_requestLLM Response Processing', () => {
		beforeEach(() => {
			const mockQAChain = {
				invoke: jest.fn(),
			};
			(RunnableSequence.from as jest.Mock).mockReturnValue(mockQAChain);
		});

		it('should handle various time formats', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const testCases = [
				{ input: '{"suggestedTime": "2 hours", "taskSummary": "Test"}', expected: '2.00' },
				{ input: '{"suggestedTime": "1.5", "taskSummary": "Test"}', expected: '1.50' },
				{ input: '{"suggestedTime": "0.75 hours", "taskSummary": "Test"}', expected: '0.75' },
				{ input: '{"suggestedTime": ".5", "taskSummary": "Test"}', expected: '0.50' },
				{ input: '{"suggestedTime": "2.50 hours", "taskSummary": "Test"}', expected: '2.50' },
				{ input: '{"suggestedTime": "2.50  hours", "taskSummary": "Test"}', expected: '2.50' }, // Multiple spaces
			];

			for (const testCase of testCases) {
				const mockInvoke = jest.fn().mockResolvedValue(testCase.input);
				mockChain().invoke = mockInvoke;
				const result = await ragPipeline['_requestLLM']('test query');
				expect(result.suggestedTime).toBe(testCase.expected);
			}
		});

		it('should handle status callback updates', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			mockChain().invoke = jest.fn().mockResolvedValue('{"suggestedTime": "1.00", "taskSummary": "Test"}');

			const statusCallback = jest.fn();
			await ragPipeline['_requestLLM']('test query', statusCallback);

			expect(statusCallback).toHaveBeenCalledWith('Setting up the retrieval pipeline...');
			expect(statusCallback).toHaveBeenCalledWith('Running the retrieval pipeline...');
			expect(statusCallback).toHaveBeenCalledWith('Analyzing requirements (attempt 1/3)...');
			expect(statusCallback).toHaveBeenCalledWith('Processing LLM response...');
			expect(statusCallback).toHaveBeenCalledWith('Success!');
		});

		it('should handle malformed JSON responses', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockInvoke = jest
				.fn()
				.mockRejectedValueOnce(new Error('Invalid JSON'))
				.mockRejectedValueOnce(new Error('Parse error'))
				.mockResolvedValue('{"suggestedTime": "1.00", "taskSummary": "Test"}');
			mockChain().invoke = mockInvoke;

			const statusCallback = jest.fn();
			const result = await ragPipeline['_requestLLM']('test query', statusCallback);

			expect(result.suggestedTime).toBe('1.00');
			expect(statusCallback).toHaveBeenCalledWith(expect.stringContaining('failed'));
		});
	});

	describe('Pipeline Initialization', () => {
		it('should handle invalid LLM settings', () => {
			const invalidSettings = {
				...mockLlmSettings,
				baseUrl: '',
			};

			expect(() => new RAGPipeline(invalidSettings, mockVectorStoreParams)).toThrow('Invalid LLM settings');
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors in isPipelineReady', async () => {
			(getChromaStatus as jest.Mock).mockRejectedValue(new Error('Network error'));

			const result = await ragPipeline.isPipelineReady();

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Pipeline readiness check failed'));
		});

		it('should handle timeout errors in _requestLLM', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			mockChain().invoke = jest.fn().mockRejectedValue(new Error('Timeout'));

			const statusCallback = jest.fn();
			try {
				await ragPipeline['_requestLLM']('test query', statusCallback);
				fail('Expected method to throw');
			} catch (error) {
				expect(statusCallback).toHaveBeenCalledWith(expect.stringContaining('failed'));
				expect(logger.error).toHaveBeenCalled();
			}
		});
	});

	describe('runPipeline', () => {
		it('should call _requestLLM and _showResults', async () => {
			const expectedResponse = {
				suggestedTime: '1.23',
				taskSummary: 'Test task',
				originalPrompt: 'test query',
			};

			const mockRequestLLM = jest.spyOn(ragPipeline as any, '_requestLLM').mockResolvedValue(expectedResponse);
			const mockShowResults = jest.spyOn(ragPipeline as any, '_showResults');

			const result = await ragPipeline.runPipeline('test query');

			expect(result).toEqual(expectedResponse);
			expect(mockRequestLLM).toHaveBeenCalledWith('test query', undefined);
			expect(mockShowResults).toHaveBeenCalledWith(JSON.stringify(expectedResponse, null, 2));
		});
	});
});
