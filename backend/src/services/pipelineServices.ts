import { getOllamaStatus } from './ollamaServices';
import { getChromaStatus } from './chromaServices';
import logger from '../utils/logger';
import { systemPromptMessage } from '../config/constants';

import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Chroma, ChromaLibArgs } from '@langchain/community/vectorstores/chroma';
import { PipelineService } from '../types/pipeline';

export interface ExtractedContext {
	suggestedTime: string;
	taskSummary?: string;
	customerName?: string;
	customerEmail?: string;
	preferredTimeOfDay?: string;
	preferredDay?: string;
	originalPrompt?: string;
}

const JSON_SCHEMA =
	`{{\n` +
	`  "suggestedTime": "X.XX",\n` +
	`  "taskSummary": "Brief description of the task/event",\n` +
	`  "customerName": "Any mentioned customer name",\n` +
	`  "customerEmail": "Any mentioned email address",\n` +
	`  "preferredTimeOfDay": "Any mentioned time of day",\n` +
	`  "preferredDay": "Day"\n` +
	`}}`;

class RAGPipeline {
	private readonly llmSettings: PipelineService;
	private readonly embeddings: OllamaEmbeddings;
	private chatOllama: ChatOllama;
	private readonly vectorStoreParams: ChromaLibArgs;
	private readonly chromaVectorStore: Chroma;

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
	}

	private async _requestLLM(
		userInput: string,
		statusCallback?: (status: string) => void,
		retry = 3
	): Promise<ExtractedContext> {
		statusCallback?.('Setting up the retrieval pipeline...');
		const retriever = this.chromaVectorStore.asRetriever();

		const prompt = ChatPromptTemplate.fromMessages([
			['system', systemPromptMessage],
			[
				'human',
				`Context: {context}\nQuestion: {question}\n\n` +
					`Please analyze the question carefully and extract scheduling information. Provide a response as valid JSON:\n` +
					JSON_SCHEMA,
			],
		]);

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

				// Updated regex to handle more formats with flexible spacing
				const timeMatch = timeStr.match(/^(?:(?:\d*\.\d+)|(?:\d+\.?\d*))\s*(?:hours?)?$/i);

				if (timeMatch) {
					// Remove 'hour(s)' from the extracted time, returning only the number
					const extractedTime = timeMatch[0].replace(/\s*hours?/i, '');
					const time = parseFloat(extractedTime);
					parsedResult.suggestedTime = time.toFixed(2);
					statusCallback?.('Success!');
					return {
						...parsedResult,
						originalPrompt: userInput,
					};
				}
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

			const prompt = ChatPromptTemplate.fromMessages([
				[
					'system',
					`You are a helpful AI assistant for a scheduling system. 
					- Provide direct, concise answers
					- Use the context from documents to inform your responses
					- If something isn't in the documents, say so clearly, and suggest your own solution
					- Don't mention "requests" - refer to "documents" instead
					- Don't start responses with phrases like "Based on your request"
					- Be friendly but professional
					- Always focus on scheduling and time-related information
					- Never ask for a follow up - this is a single-turn conversation`,
				],
				['human', 'Context: {context}\nQuestion: {question}'],
			]);

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
			logger.error('Chat stream error:', error);
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
