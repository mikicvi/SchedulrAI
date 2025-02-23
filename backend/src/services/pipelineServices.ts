import { getOllamaStatus } from './ollamaServices';
import { getChromaStatus } from './chromaServices';
import logger from '../utils/logger';
import { systemPromptMessage, humanPromptMessage } from '../config/constants';

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
	userInfo?: string;
	preferredTimeOfDay?: string;
	preferredDay?: string;
	originalPrompt?: string;
}

const JSON_SCHEMA =
	`{{\n` +
	`  "suggestedTime": "X.XX",\n` +
	`  "taskSummary": "Brief description of the task/event",\n` +
	`  "userInfo": "Any mentioned user details",\n` +
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
			const result = await qaChain.invoke({ question: userInput });
			logger.debug(`Raw LLM response: ${result}`);

			try {
				statusCallback?.('Processing LLM response...');
				const parsedResult = JSON.parse(result);
				if (parsedResult.suggestedTime) {
					// Convert "X.X hours" format to decimal
					const timeMatch = parsedResult.suggestedTime.match(/(\d+\.?\d*)\s*(?:hours?)?/i);
					if (timeMatch) {
						parsedResult.suggestedTime = Number(timeMatch[1]).toFixed(2);
					}
					// Verify final format
					if (/^\d+\.\d{2}$/.test(parsedResult.suggestedTime)) {
						statusCallback?.('Success!');
						return {
							...parsedResult,
							originalPrompt: userInput,
						};
					}
				} else {
					logger.warn(`Invalid or missing 'suggestedTime' in response: ${JSON.stringify(parsedResult)}`);
				}
			} catch (error) {
				statusCallback?.(`Attempt ${attempt + 1} failed for reason: ${error.message}, retrying...`);
				logger.error(`Parsing failed on attempt ${attempt + 1}: ${error.message}`);
			}
		}

		logger.error(`Final rejected response after ${retry} attempts.`);
		statusCallback?.('LLM failed to provide a valid response - please try again.');
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

	public async isPipelineReady(): Promise<boolean> {
		try {
			const [chromaStatusResponse, ollamaEmbedStatus] = await Promise.all([
				getChromaStatus(),
				getOllamaStatus('embedding'),
			]);

			const isReady = !!(chromaStatusResponse && ollamaEmbedStatus);
			logger.info(isReady ? 'Pipeline ready' : 'Pipeline has issues');
			return isReady;
		} catch (error) {
			logger.error(`Pipeline readiness check failed: ${error.message}`);
		}
		return false;
	}
}

export default RAGPipeline;
