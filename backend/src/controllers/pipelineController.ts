import { Request, Response } from 'express';
import logger from '../utils/logger';
import RAGPipeline from '../services/pipelineServices';

class PipelineController {
	private readonly pipelineService: RAGPipeline;
	private readonly baseUrl = `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}`;
	private readonly chromaUrl = `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:${process.env.CHROMA_SERVER_PORT}`;
	private readonly model = process.env.LLM_MODEL;
	private readonly embeddingLLM = process.env.LLM_EMBED_MODEL;
	private readonly collectionName = 'SchedulrAI-KB';
	private readonly vectorStoreProvider = 'basic';
	private readonly vectorStoreCredentials = process.env.CHROMA_CLIENT_AUTH_CREDENTIALS;

	constructor() {
		this.pipelineService = new RAGPipeline(
			{
				baseUrl: this.baseUrl,
				model: this.model,
				embeddingModel: this.embeddingLLM,
				temperature: 0.5,
				topP: 0.9,
			},
			{
				collectionName: this.collectionName,
				url: this.chromaUrl,
				clientParams: {
					auth: {
						provider: this.vectorStoreProvider,
						credentials: this.vectorStoreCredentials,
					},
				},
			}
		);
	}

	public async runPipeline(req: Request, res: Response): Promise<void> {
		try {
			const userInput = req.body.userInput;
			const result = await this.pipelineService.runPipeline(userInput);
			logger.info(`|runPipeline  |: ${req.method} ${res.statusCode}`);
			logger.debug(`|runPipeline  |: in:${JSON.stringify(req.body.userInput)} out:${JSON.stringify(result)}`);
			res.status(200).json({ result });
		} catch (error) {
			logger.error('Error running pipeline:', error);
			res.status(500).json({ error: error.message });
		}
	}
}

export default PipelineController;
