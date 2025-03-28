import { RunnableSequence } from '@langchain/core/runnables';
import { getChromaStatus } from '../../services/chromaServices';
import { getOllamaStatus } from '../../services/ollamaServices';
import RAGPipeline from '../../services/pipelineServices';
import logger from '../../utils/logger';
import { formatDocumentsAsString } from 'langchain/util/document';

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
jest.mock('langchain/util/document', () => ({
	formatDocumentsAsString: jest.fn(),
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

		it.each([
			// Standard hours format
			['2 hours', '2.00'],
			['1 hr', '1.00'],

			// Decimal hours
			['1.5', '1.50'],
			['0.75 hours', '1.15'],
			['.5', '0.50'],
			['2.50 hours', '2.50'],
			['0.1533', '0.15'],

			// Hours and minutes combinations
			['2 hours 50 minutes', '2.50'],
			['1 hour 28 minutes', '1.28'],
			['0 hours 45 minutes', '0.45'],
			['2 hrs 15 mins', '2.15'],
			['1 hour and 30 minutes', '1.30'],
			['1 hr, 45 min', '1.45'],

			// Minutes only
			['90 minutes', '1.30'],
			['60 minutes', '1.00'],
			['45 minutes', '0.45'],
			['45.00', '0.45'],
			['0.45', '0.45'],
			['30 mins', '0.30'],
			['30.00', '0.30'],
			['0.30 mins', '0.30'],
			['15 mins', '0.15'],

			// Edge cases with spacing and formatting
			['2.50  hours', '2.50'],
			[' 1.75 ', '2.15'],
			['1    hour    30    minutes', '1.30'],
			['2hours30minutes', '2.30'],

			// Mixed case and abbreviations
			['2 HoUrS', '2.00'],
			['45 MINS', '0.45'],
			['1 Hr 30 Min', '1.30'],
		])('should handle time format: input %s output %s', async (timeStr, expected) => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockInvoke = jest.fn().mockResolvedValue(`{"suggestedTime": "${timeStr}", "taskSummary": "Test"}`);
			mockChain().invoke = mockInvoke;

			const result = await ragPipeline['_requestLLM']('test query');
			expect(result.suggestedTime).toBe(expected);
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

	describe('streamChatResponse', () => {
		it('should stream chat response chunks', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockStream = async function* () {
				yield { content: 'First chunk' };
				yield { content: 'Second chunk' };
				yield { content: 'Final chunk' };
			};
			mockChain().stream = jest.fn().mockReturnValue(mockStream());

			const statusCallback = jest.fn();
			const responses: any[] = [];

			for await (const chunk of ragPipeline.streamChatResponse('test query', statusCallback)) {
				responses.push(chunk);
			}

			expect(responses).toEqual([
				{ content: 'First chunk' },
				{ content: 'Second chunk' },
				{ content: 'Final chunk' },
			]);

			expect(statusCallback).toHaveBeenCalledWith('Initializing chat pipeline...');
			expect(statusCallback).toHaveBeenCalledWith('Preparing document retrieval...');
			expect(statusCallback).toHaveBeenCalledWith('Setting up response chain...');
			expect(logger.debug).toHaveBeenCalledWith('Streaming chat response for query: test query');
		});

		it('should handle errors during streaming', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			mockChain().stream = jest.fn().mockRejectedValue(new Error('Stream error'));

			const statusCallback = jest.fn();

			try {
				const generator = ragPipeline.streamChatResponse('test query', statusCallback);
				for await (const _ of generator) {
					// should throw before getting here
				}
				fail('Expected method to throw');
			} catch (error) {
				expect(error.message).toBe('Stream error');
				expect(statusCallback).toHaveBeenNthCalledWith(1, 'Initializing chat pipeline...');
				expect(statusCallback).toHaveBeenNthCalledWith(2, 'Preparing document retrieval...');
				expect(statusCallback).toHaveBeenNthCalledWith(3, 'Setting up response chain...');
				expect(logger.error).toHaveBeenCalledWith('Error streaming chat response:', error);
			}
		});

		it('should handle empty input', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockStream = async function* () {
				yield { content: 'Response for empty input' };
			};
			mockChain().stream = jest.fn().mockReturnValue(mockStream());

			const responses: any[] = [];
			for await (const chunk of ragPipeline.streamChatResponse('')) {
				responses.push(chunk);
			}

			expect(responses).toHaveLength(1);
			expect(responses[0].content).toBe('Response for empty input');
		});

		it('should work without status callback', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockStream = async function* () {
				yield { content: 'Test response' };
			};
			mockChain().stream = jest.fn().mockReturnValue(mockStream());

			const responses: any[] = [];
			for await (const chunk of ragPipeline.streamChatResponse('test query')) {
				responses.push(chunk);
			}

			expect(responses).toHaveLength(1);
			expect(responses[0].content).toBe('Test response');
			expect(logger.debug).toHaveBeenCalledWith('Streaming chat response for query: test query');
		});

		it('should handle malformed response chunks', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockStream = async function* () {
				yield { malformed: 'chunk' };
				yield { content: 'valid chunk' };
			};
			mockChain().stream = jest.fn().mockReturnValue(mockStream());

			const responses: any[] = [];
			for await (const chunk of ragPipeline.streamChatResponse('test query')) {
				responses.push(chunk);
			}

			expect(responses).toHaveLength(2);
			expect(responses[0]).toEqual({ malformed: 'chunk' }); // Pass through invalid chunks
			expect(responses[1]).toEqual({ content: 'valid chunk' });
		});

		it('should handle document retrieval and context formatting', async () => {
			const mockChain = RunnableSequence.from as jest.Mock;
			const mockRetrieverResult = 'formatted context';

			const mockPipe = jest.fn().mockReturnValue({
				invoke: jest.fn().mockResolvedValue(mockRetrieverResult),
			});

			(ragPipeline as any).chromaVectorStore.asRetriever = jest.fn().mockReturnValue({
				pipe: mockPipe,
			});

			const mockStream = async function* () {
				yield { content: 'Response with context' };
			};

			// Setup the chain mock to capture and test the context function
			mockChain.mockImplementation((config) => {
				const contextFn = config[0].context;
				contextFn({ question: 'test query' });

				return {
					stream: jest.fn().mockReturnValue(mockStream()),
				};
			});

			const statusCallback = jest.fn();
			const responses: any[] = [];

			for await (const chunk of ragPipeline.streamChatResponse('test query', statusCallback)) {
				responses.push(chunk);
			}

			// Verify document retrieval flow
			expect(statusCallback).toHaveBeenCalledWith('Searching relevant documents...');
			expect(mockPipe).toHaveBeenCalledWith(formatDocumentsAsString);
			expect(responses).toEqual([{ content: 'Response with context' }]);

			// Verify the full sequence of status callbacks
			expect(statusCallback).toHaveBeenCalledWith('Initializing chat pipeline...');
			expect(statusCallback).toHaveBeenCalledWith('Preparing document retrieval...');
			expect(statusCallback).toHaveBeenCalledWith('Setting up response chain...');
			expect(statusCallback).toHaveBeenCalledWith('Generating response...');
		});
	});
});
