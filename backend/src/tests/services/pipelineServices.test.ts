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
			// Mock RunnableSequence to return a mock chain with controllable invoke
			const mockQAChain = {
				invoke: jest.fn(),
			};
			(RunnableSequence.from as jest.Mock).mockReturnValue(mockQAChain);
		});

		it('should retry when response format is incorrect', async () => {
			// Spy on the actual method implementation
			const originalMethod = ragPipeline['_requestLLM'].bind(ragPipeline);
			const spy = jest.spyOn(ragPipeline as any, '_requestLLM').mockImplementation(originalMethod);

			// Mock the invoke method to return invalid responses then a valid one
			const mockChain = RunnableSequence.from as jest.Mock;
			mockChain()
				.invoke.mockResolvedValueOnce('Invalid Response')
				.mockResolvedValueOnce('Another Invalid Response')
				.mockResolvedValueOnce('Time: 1.23');

			const result = await ragPipeline['_requestLLM']('test query');

			expect(result).toBe('Time: 1.23');
			expect(spy).toHaveBeenCalledTimes(3);
			expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Invalid response format'));

			// Restore the original method
			spy.mockRestore();
		});

		it('should throw an error after max retries', async () => {
			// Mock the invoke method to always return invalid responses
			const mockChain = RunnableSequence.from as jest.Mock;
			mockChain().invoke.mockResolvedValue('Invalid Response');

			await expect(ragPipeline['_requestLLM']('test query')).rejects.toThrow(
				'Max retries reached. Invalid response format.'
			);
		});
	});

	describe('runPipeline', () => {
		it('should call _requestLLM and _showResults', async () => {
			// Spy on _requestLLM and _showResults
			const mockRequestLLM = jest.spyOn(ragPipeline as any, '_requestLLM').mockResolvedValue('Time: 1.23');
			const mockShowResults = jest.spyOn(ragPipeline as any, '_showResults');

			const result = await ragPipeline.runPipeline('test query');

			expect(result).toBe('Time: 1.23');
			expect(mockRequestLLM).toHaveBeenCalledWith('test query');
			expect(mockShowResults).toHaveBeenCalledWith('Time: 1.23');
		});
	});
});
