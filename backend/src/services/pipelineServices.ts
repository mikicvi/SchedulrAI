import { getOllamaStatus } from './ollamaServices';
import { getChromaStatus } from './chromaServices';
import logger from '../utils/logger';
import { systemPromptMessage, systemPromptMessage2, humanPromptMessage } from '../constants';

import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Chroma, ChromaLibArgs } from '@langchain/community/vectorstores/chroma';
import { PipelineService } from '../types/pipeline';

class RAGPipeline {
	private readonly llmSettings: PipelineService;
	private readonly embeddings: OllamaEmbeddings;
	private readonly chatOllama: ChatOllama;
	private readonly vectorStoreParams: ChromaLibArgs;

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
	}

	// Step 1: Transform user request to embeddings
	// Step 2: Search Chroma for closest embeddings
	// Step 3: Make a request to LLM with the closest embeddings as context
	// Step 4: Show the results

	private async _requestLLM(userInput, retry = 3): Promise<string> {
		const ollamaLlm = this.chatOllama;
		const chromaVectorStore = new Chroma(this.embeddings, this.vectorStoreParams);

		const retriever = chromaVectorStore.asRetriever();

		const qaChain = RunnableSequence.from([
			{
				context: async (input: { question: string }, callbacks) => {
					const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
					const context = await retrieverAndFormatter.invoke(input.question, callbacks);
					//logger.info('Retrieved and formatted context:', context);
					return context;
				},
				question: new RunnablePassthrough(),
			},
			ChatPromptTemplate.fromMessages([
				['system', `${systemPromptMessage}`],
				['human', `${humanPromptMessage}`],
			]),
			ollamaLlm,
			new StringOutputParser(),
		]);

		const result = await qaChain.invoke({ question: userInput });

		// Check if the response is in the correct format
		const timeFormat = /^Time: \d\.\d{2}$/;

		if (!timeFormat.test(result)) {
			if (retry > 0) {
				retry--;
				logger.debug(`|_requestLLM  |: Invalid response format: ${result}, retrying... ${retry} attempts left`);
				return await this._requestLLM(userInput, retry);
			} else {
				logger.error(`|_requestLLM  |: Max retries reached. Invalid response format: ${result}`);
				throw new Error('Max retries reached. Invalid response format.');
			}
		}
		return result;
	}

	private async _showResults(result: string) {
		console.log('Generated Response:', result);
	}

	public async runPipeline(userInput: string): Promise<string> {
		const result = await this._requestLLM(userInput);
		await this._showResults(result);
		return result;
	}

	public async isPipelineReady(): Promise<boolean> {
		const chromaStatusResponse = await getChromaStatus();
		const ollamaEmbedStatus = await getOllamaStatus('embedding');
		let pipelineStatus = false;
		// if ollamaEmbedStatus and chromastaus are successful(have values)
		if (chromaStatusResponse && ollamaEmbedStatus) {
			logger.info('Pipeline Status:', {
				chroma: chromaStatusResponse,
				ollama: 'Working',
			});
			pipelineStatus = true;
		} else {
			logger.warn('Pipeline has issues');
		}
		return pipelineStatus;
	}
}

export default RAGPipeline;
