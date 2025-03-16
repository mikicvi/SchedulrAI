import { getOllamaStatus } from './ollamaServices';
import { getChromaStatus } from './chromaServices';
import logger from '../utils/logger';
import { extractionPrompt, streamingPrompt } from '../config/constants';

import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Chroma, ChromaLibArgs } from '@langchain/community/vectorstores/chroma';
import { PipelineService } from '../types/pipeline';
import { TimeParser } from '../utils/timeParser';

export interface ExtractedContext {
	suggestedTime: string;
	taskSummary?: string;
	customerName?: string;
	customerEmail?: string;
	preferredTimeOfDay?: string;
	preferredDay?: string;
	originalPrompt?: string;
}

const MAX_TASK_HOURS = 10;
const MIN_TASK_MINUTES = 15;

class RAGPipeline {
	private readonly llmSettings: PipelineService;
	private readonly embeddings: OllamaEmbeddings;
	private chatOllama: ChatOllama;
	private readonly vectorStoreParams: ChromaLibArgs;
	private readonly chromaVectorStore: Chroma;
	private readonly timeParser: TimeParser;

	constructor(llmSettings: PipelineService, vectorStoreParams: ChromaLibArgs) {
		if (!llmSettings.baseUrl || !llmSettings.model) {
			throw new Error('Invalid LLM settings');
		}

		this.llmSettings = llmSettings;
		this.embeddings = new OllamaEmbeddings({
			model: this.llmSettings.embeddingModel,
			baseUrl: this.llmSettings.baseUrl,
		});

		this.chatOllama = new ChatOllama({
			baseUrl: this.llmSettings.baseUrl,
			model: this.llmSettings.model,
			temperature: this.llmSettings.temperature,
			topP: this.llmSettings.topP,
			topK: this.llmSettings.topK,
		});

		this.vectorStoreParams = vectorStoreParams;
		this.chromaVectorStore = new Chroma(this.embeddings, this.vectorStoreParams);
		this.timeParser = new TimeParser(MAX_TASK_HOURS, MIN_TASK_MINUTES);
	}

	private filterEmptyFields<T extends object>(obj: T, requiredFields: (keyof T)[] = []): Partial<T> {
		const filtered = Object.fromEntries(
			Object.entries(obj).filter(
				([key, value]) => (value !== '' && value !== null) || requiredFields.includes(key as keyof T)
			)
		) as Partial<T>;
		return filtered;
	}

	private async _requestLLM(
		userInput: string,
		statusCallback?: (status: string) => void,
		retry = 3
	): Promise<ExtractedContext> {
		statusCallback?.('Setting up the retrieval pipeline...');
		const retriever = this.chromaVectorStore.asRetriever();

		const prompt = extractionPrompt;

		statusCallback?.('Running the retrieval pipeline...');
		const qaChain = RunnableSequence.from([
			{
				context: async (input: { question: string }, callbacks) => {
					const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
					return await retrieverAndFormatter.invoke(input.question, callbacks);
				},
				question: new RunnablePassthrough(),
			},
			prompt,
			this.chatOllama,
			new StringOutputParser(),
		]);

		for (let attempt = 0; attempt < retry; attempt++) {
			statusCallback?.(`Analyzing requirements (attempt ${attempt + 1}/${retry})...`);

			try {
				const result = await qaChain.invoke({ question: userInput });
				logger.debug(`Raw LLM response: ${result}`);

				const parsedResult = JSON.parse(result);
				if (!parsedResult.suggestedTime) {
					logger.warn(`Invalid or missing 'suggestedTime' in response: ${JSON.stringify(parsedResult)}`);
					continue;
				}

				statusCallback?.('Processing LLM response...');
				const timeStr = parsedResult.suggestedTime.toString().toLowerCase();

				const time = this.timeParser.parse(timeStr);

				if (time === null) {
					logger.warn(
						`Invalid time: must be between ${MIN_TASK_MINUTES} minutes and ${MAX_TASK_HOURS} hours. Got: ${timeStr}`
					);
					continue;
				}

				parsedResult.suggestedTime = time.toFixed(2);
				statusCallback?.('Success!');

				return this.filterEmptyFields(
					{
						...parsedResult,
						originalPrompt: userInput,
					},
					['suggestedTime']
				) as ExtractedContext;
			} catch (error) {
				logger.error(`Attempt ${attempt + 1} failed:`, error);
				statusCallback?.(
					`Attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		const error = new Error('Max retries reached without valid response');
		statusCallback?.('LLM failed to provide a valid response - please try again.');
		throw error;
	}

	private async _showResults(result: string): Promise<void> {
		console.log('Generated Response:', result);
	}

	public async runPipeline(userInput: string, statusCallback?: (status: string) => void): Promise<ExtractedContext> {
		statusCallback?.('Starting pipeline');
		// Reset context to avoid caching prior responses.
		this.chatOllama = new ChatOllama({
			baseUrl: this.llmSettings.baseUrl,
			model: this.llmSettings.model,
			temperature: this.llmSettings.temperature,
			topP: this.llmSettings.topP,
			topK: this.llmSettings.topK,
		});

		const result = await this._requestLLM(userInput, statusCallback);
		await this._showResults(JSON.stringify(result, null, 2));
		return result;
	}

	public async *streamChatResponse(userInput: string, statusCallback?: (status: string) => void) {
		try {
			logger.debug(`Streaming chat response for query: ${userInput}`);
			statusCallback?.('Initializing chat pipeline...');

			const streamResponseOllama = (this.chatOllama = new ChatOllama({
				baseUrl: this.llmSettings.baseUrl,
				model: this.llmSettings.model,
				temperature: this.llmSettings.temperature,
				topP: this.llmSettings.topP,
				topK: this.llmSettings.topK,
				streaming: true,
			}));

			statusCallback?.('Preparing document retrieval...');
			const retriever = this.chromaVectorStore.asRetriever();

			const prompt = streamingPrompt;

			statusCallback?.('Setting up response chain...');
			const chain = RunnableSequence.from([
				{
					context: async (input: { question: string }) => {
						statusCallback?.('Searching relevant documents...');
						const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
						const context = await retrieverAndFormatter.invoke(input.question);
						return context;
					},
					question: new RunnablePassthrough(),
				},
				prompt,
				streamResponseOllama,
			]);

			statusCallback?.('Generating response...');
			const stream = await chain.stream({ question: userInput });

			for await (const chunk of stream) {
				yield chunk;
			}
		} catch (error) {
			logger.error('Error streaming chat response:', error);
			statusCallback?.('Error occurred during chat processing');
			throw error;
		}
	}

	public async isPipelineReady(): Promise<boolean> {
		try {
			const [chromaStatusResponse, ollamaEmbedStatus] = await Promise.all([
				getChromaStatus(),
				getOllamaStatus('embedding'),
			]);

			const isReady = !!(chromaStatusResponse && ollamaEmbedStatus);
			isReady
				? logger.info('Pipeline Status:', {
						chroma: chromaStatusResponse,
						ollama: 'Working',
				  })
				: logger.warn('Pipeline has issues');

			return isReady;
		} catch (error) {
			logger.error(`Pipeline readiness check failed: ${error.message}`);
		}
		return false;
	}
}

export default RAGPipeline;
