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
	`  "suggestedTime": "decimal hours (e.g. 1.50 for 1h30m)",\n` +
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

				// Helper function to convert time to decimal hours using "clock-based" decimal notation
				const convertToDecimalHours = (timeString: string): number | null => {
					// Any leading/trailing whitespace
					timeString = timeString.trim();
					// Case 1: Decimal hours with optional units (e.g. "1.75" -> "2.15" if leftover > 59)
					const decimalHoursMatch = timeString.match(/^(\d*\.?\d+)\s*(?:hour|hr)?s?$/i);
					if (decimalHoursMatch) {
						// e.g. "1.75" => hours = 1, leftoverDec = 0.75 => leftoverMins = 75 => totalMins = 1*60 + 75 => 135 => "2.15"
						const rawFloat = parseFloat(decimalHoursMatch[1]); // e.g. 1.75
						const wholeHours = Math.floor(rawFloat); // e.g. 1
						const leftoverDec = rawFloat - wholeHours; // e.g. 0.75
						const leftoverMins = Math.round(leftoverDec * 100); // e.g. 75

						const totalMinutes = wholeHours * 60 + leftoverMins;
						return toSchedulingDecimal(totalMinutes);
					}

					// A small formatter function: total minutes -> "H.MM" with leftover minutes
					// e.g. 90 => "1.30", 75 => "1.15", 135 => "2.15"
					function toSchedulingDecimal(totalMins: number): number {
						const hours = Math.floor(totalMins / 60);
						const leftover = totalMins % 60;
						const leftoverStr = leftover < 10 ? `0${leftover}` : `${leftover}`;
						return parseFloat(`${hours}.${leftoverStr}`);
					}

					// Case 2: Hours and minutes format (e.g., "2 hours 50 minutes")
					const hourMinuteMatch = timeString.match(
						/(?:(\d+)\s*(?:hour|hr)s?)?\s*(?:(?:,|and)?\s*)?(?:(\d+)\s*(?:minute|min)s?)?/i
					);
					if (hourMinuteMatch && (hourMinuteMatch[1] || hourMinuteMatch[2])) {
						const hours = parseInt(hourMinuteMatch[1]) || 0;
						const minutes = parseInt(hourMinuteMatch[2]) || 0;
						const totalMins = hours * 60 + minutes;
						return toSchedulingDecimal(totalMins);
					}

					// Fallback
					return null;
				};

				const time = convertToDecimalHours(timeStr);

				if (time !== null) {
					parsedResult.suggestedTime = time.toFixed(2);
					statusCallback?.('Success!');
					return {
						...parsedResult,
						originalPrompt: userInput,
					};
				} else {
					logger.warn(`Unable to parse time format: ${timeStr}`);
					continue;
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

			const prompt = ChatPromptTemplate.fromMessages([
				[
					'system',
					`You are a scheduling expert. Keep responses short and direct.

					Rules:
					- Give short, clear estimates (use decimal hours)
					- Focus on time and key details only
					- Max 2-3 sentences per response
					- Be confident and precise
					- Only direct answers in sentence format
					- No pleasantries or explanations
					- No "I think" or "I believe" phrases
					- No markdown
					- Always give total time in decimal hours
					- Use the context from documents to inform your responses
					- If something isn't in the documents, say so clearly, and suggest your own solution
					- Never ask questions back to the user, especially follow-up questions
					`,
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
