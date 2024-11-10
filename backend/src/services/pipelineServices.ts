import { getOllamaStatus } from './ollamaServices';
import { getChromaStatus } from './chromaServices';
import { getMongoStatus } from './mongoServices';
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
		});

		this.vectorStoreParams = vectorStoreParams;
	}

	// Step 1: Transform user request to embeddings
	// Step 2: Search Chroma for closest embeddings
	// Step 3: Make a request to LLM with the closest embeddings as context
	// Step 4: Show the results

	// For CLI: Check the the status of the entire pipeline, directly via Services, not via Controllers
	private async _checkPipelineStatus() {
		const chromaStatusResponse = await getChromaStatus();
		console.log('Chroma Status:', chromaStatusResponse);
		const mongoStatusResponse = await getMongoStatus();
		console.log('Mongo Status:', mongoStatusResponse);
		await getOllamaStatus('embedding');
		console.log('Ollama Status:', 'working');

		// log the status of the pipeline
		logger.info('Pipeline Status:', {
			chroma: chromaStatusResponse,
			mongo: mongoStatusResponse,
			ollama: 'Working',
		});
	}

	private async _requestLLM(userInput): Promise<string> {
		const ollamaLlm = this.chatOllama;
		const chromaVectorStore = new Chroma(this.embeddings, this.vectorStoreParams);

		const retriever = chromaVectorStore.asRetriever();

		const qaChain = RunnableSequence.from([
			{
				context: async (input: { question: string }, callbacks) => {
					const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
					const context = await retrieverAndFormatter.invoke(input.question, callbacks);
					//console.log('Retrieved and formatted context:', context);
					const maxLength = 500; // Adjust this value as needed
					const limitedContext = context.length > maxLength ? context.substring(0, maxLength) : context;
					console.log('----------------------------------------------------------------');
					console.log('Limited context:', limitedContext);
					return limitedContext;
					//return context;
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
		const timeFormat = /^Time: \d{1}\.\d{2}$/;
		let retry = 3;
		if (!timeFormat.test(result) && retry > 0) {
			retry--;
			return await this._requestLLM(userInput);
		}
		return result;
	}

	private async _showResults(result: string) {
		console.log('Generated Response:', result);
	}

	public async runPipeline(userInput: string): Promise<string> {
		await this._checkPipelineStatus();
		const result = await this._requestLLM(userInput);
		await this._showResults(result);
		return result;
	}
}

export default RAGPipeline;
